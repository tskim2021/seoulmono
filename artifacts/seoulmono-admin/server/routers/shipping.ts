import { z } from "zod";
import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import * as g5stats from "../g5stats";
import { getTrackingInfo, mapStatusToSystem, registerTracking } from "../_core/17trackApi";
import { getKoreaPostTracking, mapKoreaPostStatus } from "../_core/koreaPostApi";
import { getShiptrackTracking, isCjKorexNumber } from "../_core/shiptrackApi";
import { isInternationalTrackingNumber, needsKoreaPostCrawling } from "../lib/trackingNumberUtils";
import { buildKoreaPostDescription, mapStatusDisplay } from "../lib/shippingDescriptionFormatter";
import { TRPCError } from "@trpc/server";

// 국제배송 예상 배송일 (영업일 기준)
const EMS_ESTIMATED_DAYS = 10; // 7~14일, 평균 10일

/**
 * 기존 DB 이력과 새 API 이벤트를 비교하여 중복되지 않는 새 이벤트만 반환
 * description + occurredAt 기준으로 중복 판별
 */
function filterNewEvents(
  existingHistory: { description: string | null; occurredAt: Date }[],
  apiEvents: { description: string; location?: string; details?: string; time: number }[]
): { description: string; location: string; details?: string; time: number }[] {
  const existingSet = new Set(
    existingHistory.map(h => {
      const desc = (h.description || "").trim();
      const time = new Date(h.occurredAt).getTime();
      // 1분 단위로 반올림하여 비교 (시간 미세 차이 무시)
      const roundedTime = Math.floor(time / 60000);
      return `${desc}::${roundedTime}`;
    })
  );

  return apiEvents.filter(event => {
    const desc = (event.details || event.description).trim();
    const roundedTime = Math.floor(event.time / 60000);
    const key = `${desc}::${roundedTime}`;
    return !existingSet.has(key);
  }).map(event => ({
    ...event,
    location: event.location || "",
  }));
}

/**
 * 17track 상태를 국제배송 단계에 매핑 (서버 사이드)
 */
function mapToIntlStatus(trackingStatus: number, events: { description: string; location?: string }[]): string {
  // 이벤트 내용 기반으로 더 정확한 상태 판별
  const allDescs = events.map(e => (e.description || "").toLowerCase()).join(" ");
  
  if (allDescs.includes("배달완료") || allDescs.includes("delivered") || trackingStatus === 6) return "delivered";
  if (allDescs.includes("배달출발") || allDescs.includes("out for delivery") || trackingStatus === 4) return "out_for_delivery";
  
  // 통관검사 대기 상태 감지 ("통관검사대기 - 국제우편물류센터")
  if (allDescs.includes("통관검사대기") && allDescs.includes("국제우편물류센터")) {
    return "customs_hold";
  }
  
  if (allDescs.includes("통관") || allDescs.includes("customs")) {
    if (allDescs.includes("도착국") || allDescs.includes("국제우편물류센터") || allDescs.includes("import")) return "import_customs";
    if (allDescs.includes("출발국") || allDescs.includes("export")) return "export_customs";
  }
  if (allDescs.includes("교환국에서 물품을 접수") || allDescs.includes("교환국 도착")) return "arrived_destination";
  if (allDescs.includes("발송되었습니다") || allDescs.includes("in transit") || trackingStatus === 2) return "in_transit_intl";
  if (trackingStatus === 3) return "export_customs";
  if (trackingStatus === 1) return "accepted";
  
  return mapStatusToSystem(trackingStatus);
}

async function performShipmentRefresh(
  shipment: { id: number; orderId: number; trackingNumber: string; shippingType: string | null; carrierId: number | null; status: string; history: { description: string | null; occurredAt: Date }[]; [key: string]: any },
  order: { id: number; userId: number; status: string; orderNumber: string },
  userId: number
): Promise<{ success: boolean; eventsCount: number; delivered: boolean; message?: string }> {
  if (needsKoreaPostCrawling(shipment.trackingNumber) && shipment.shippingType !== 'international') {
    console.log(`[refreshTracking] Auto-correcting shippingType for ${shipment.trackingNumber}: ${shipment.shippingType} → international`);
    await db.updateShipmentInfo(shipment.id, { shippingType: 'international' });
    shipment.shippingType = 'international';
  }

  let trackingInfo;
  try {
    await registerTracking(shipment.trackingNumber);
    trackingInfo = await getTrackingInfo(shipment.trackingNumber);
  } catch (e) {
    console.error("[refreshTracking] 17track API 호출 실패:", e);
  }

  let koreaPostInfo;
  if (shipment.shippingType === 'international') {
    try {
      koreaPostInfo = await getKoreaPostTracking(shipment.trackingNumber);
      if (koreaPostInfo) {
        console.log(`[KoreaPost] 조회 성공: ${shipment.trackingNumber}, 이벤트 수: ${koreaPostInfo.events.length}`);
      }
    } catch (e) {
      console.error("[refreshTracking] 우체국 API 호출 실패:", e);
    }
  }

  let shiptrackInfo;
  if (!trackingInfo && isCjKorexNumber(shipment.trackingNumber)) {
    try {
      const carrierCode = "cjkorex";
      shiptrackInfo = await getShiptrackTracking(shipment.trackingNumber, carrierCode);
      if (shiptrackInfo) console.log(`[Shiptrack] 조회 성공: ${shipment.trackingNumber}, 이벤트 수: ${shiptrackInfo.events.length}`);
    } catch (e) { console.error("[refreshTracking] Shiptrack 조회 실패:", e); }
  }

  if (!trackingInfo && !koreaPostInfo && !shiptrackInfo) {
    return { success: false, eventsCount: 0, delivered: false, message: "배송 정보를 아직 조회할 수 없습니다. 운송장이 등록된 직후에는 정보가 반영되기까지 시간이 걸릴 수 있습니다." };
  }

  const existingHistory = shipment.history || [];
  let addedCount = 0;

  let newStatus: string;
  if (koreaPostInfo && koreaPostInfo.events.length > 0) {
    newStatus = koreaPostInfo.mappedStatus;
    console.log(`[KoreaPost] 상태 매핑: ${newStatus}, 통관문제: ${koreaPostInfo.hasCustomsIssue}`);

    if (koreaPostInfo.hasCustomsIssue && koreaPostInfo.customsInfo) {
      const ci = koreaPostInfo.customsInfo;
      const [datePart, timePart] = ci.detectedAt.split(' ');
      const [year, month, day] = datePart.split('.').map(Number);
      const [hour, minute] = (timePart || '00:00').split(':').map(Number);

      await db.updateShipmentCustomsInfo(shipment.id, {
        customsNumber: ci.customsNumber || undefined,
        customsOffice: ci.customsOffice || undefined,
        customsHoldAt: new Date(year, month - 1, day, hour, minute),
      });

      if (order.status !== 'customs_hold') {
        await db.updateOrderStatus(order.id, 'customs_hold');
        try {
          const { notifyOwner } = await import("../_core/notification");
          await notifyOwner({
            title: "⚠️ 통관검사 감지",
            content: `주문번호: ${order.orderNumber}\n운송장: ${shipment.trackingNumber}\n세관: ${ci.customsOffice}\n통관번호: ${ci.customsNumber}\n\n통관검사 대상으로 확인되었습니다.`,
          });
        } catch (e) {
          console.error("[refreshTracking] Failed to notify owner:", e);
        }
      }
    }

    const koreaPostEvents = koreaPostInfo.events.map((event: any) => {
      const [dp, tp] = event.processDate.split(' ');
      const [y, m, d] = dp.split('.').map(Number);
      const [h, mi] = (tp || '00:00').split(':').map(Number);
      const date = new Date(y, m - 1, d, h, mi);
      return {
        description: mapStatusDisplay(event.processStatus),
        location: event.postOffice,
        details: buildKoreaPostDescription(event.processStatus, event.postOffice, event.details),
        time: date.getTime(),
      };
    });
    const newKpEvents = filterNewEvents(existingHistory, koreaPostEvents);
    for (const event of newKpEvents) {
      await db.createShippingHistory({
        shipmentId: shipment.id,
        status: mapStatusDisplay(event.description),
        location: event.location || "",
        description: event.details || event.description,
        timestamp: new Date(event.time),
      });
      addedCount++;
    }
  } else if (shiptrackInfo && shiptrackInfo.events.length > 0) {
    newStatus = shiptrackInfo.mappedStatus;
  } else if (trackingInfo) {
    newStatus = mapToIntlStatus(trackingInfo.status, trackingInfo.events);
  } else {
    newStatus = 'in_transit_intl';
  }

  await db.updateShipmentStatusOnly(shipment.id, newStatus);

  if (shiptrackInfo) {
    const stEvents = shiptrackInfo.events.map((ev: any) => {
      const [dp, tp] = ev.date.split(' ');
      const [y, m, d] = dp.split('-').map(Number);
      const [h, mi] = (tp || '00:00').split(':').map(Number);
      return { description: ev.status, location: ev.location, details: ev.source ? `${ev.status} (${ev.source})` : ev.status, time: new Date(y, m - 1, d, h, mi).getTime() };
    });
    const newStEvents = filterNewEvents(existingHistory, stEvents);
    for (const event of newStEvents) {
      await db.createShippingHistory({
        shipmentId: shipment.id,
        status: event.description,
        location: event.location || "",
        description: event.details || event.description,
        timestamp: new Date(event.time),
      });
      addedCount++;
    }
  }

  const newEvents = trackingInfo ? filterNewEvents(existingHistory, trackingInfo.events) : [];
  for (const event of newEvents) {
    await db.createShippingHistory({
      shipmentId: shipment.id,
      status: event.description,
      location: event.location || "",
      description: event.details || event.description,
      timestamp: new Date(event.time),
    });
    addedCount++;
  }

  if (newStatus === "delivered" && order.status !== "delivered") {
    // Multi-shipment guard: only mark order delivered when ALL active items' effective shipments are delivered.
    // This prevents a single item's delivery from prematurely completing the whole order.
    const { byItemId, fallback } = await db.getShipmentsForOrder(order.id);
    const orderItems = await db.getOrderItems(order.id);
    const activeItems = orderItems.filter((item: any) => !item.cancelledAt);
    const allItemsDelivered = activeItems.length === 0 || activeItems.every((item: any) => {
      const effectiveShipment = (byItemId as Record<number, any>)[item.id] ?? fallback;
      return effectiveShipment?.status === "delivered";
    });

    if (!allItemsDelivered) {
      // Other items still in transit — skip order-level completion for now.
      return { success: true, eventsCount: addedCount, delivered: false };
    }

    await db.updateOrderStatus(order.id, "delivered");

    await db.createNotification(
      userId,
      "order",
      "배송이 완료되었습니다",
      `주문번호: ${order.orderNumber}. 상품은 어떠셨나요? 리뷰를 작성해주세요!`,
      `/mypage/orders/${order.id}`
    );

    const user = await db.getUserById(userId);
    const items = await db.getOrderItems(order.id);
    const firstProduct = items[0];

    if (user && user.email && firstProduct) {
      const { sendEmail, generateReviewRequestEmail } = await import("../_core/email");
      const reviewUrl = `${process.env.VITE_OAUTH_PORTAL_URL || 'https://app.manus.im'}/mypage/orders/${order.id}`;
      const emailHtml = generateReviewRequestEmail({
        customerName: user.name || "고객",
        orderNumber: order.orderNumber,
        productName: firstProduct.productName + (items.length > 1 ? ` 외 ${items.length - 1}건` : ""),
        reviewUrl,
      });

      await sendEmail({
        to: user.email,
        subject: "배송이 완료되었습니다! 리뷰를 작성해주세요 💜",
        html: emailHtml,
      });
    }
  }

  return { success: true, eventsCount: addedCount, delivered: newStatus === "delivered" };
}

export const shippingRouter = router({
  // ─── Public / User ───
  carriers: publicProcedure.query(async () => {
    return g5stats.getActiveCarriers();
  }),

  trackOrder: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ ctx, input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    const shipmentData = await db.getShipmentWithCarrier(input.orderId);
    return shipmentData;
  }),

  // 운송장 번호로 배송 조회 (챗봇용)
  trackByTrackingNumber: publicProcedure.input(z.object({ trackingNumber: z.string() })).mutation(async ({ input }) => {
    const shipment = await db.getShipmentByTrackingNumber(input.trackingNumber);
    if (!shipment) {
      return { found: false, status: null };
    }
    return { found: true, status: shipment.status, orderId: shipment.orderId };
  }),

  // 17track API로 배송 정보 새로고침 (중복 방지 + DB 캐싱)
  refreshTracking: protectedProcedure.input(z.object({ orderId: z.number() })).mutation(async ({ ctx, input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    const shipment = await db.getShipmentWithCarrier(input.orderId);
    if (!shipment) throw new TRPCError({ code: "NOT_FOUND", message: "배송 정보가 없습니다." });
    return performShipmentRefresh(shipment, order, ctx.user.id);
  }),

  // 상품별 배송 추적 조회 (사용자용)
  trackOrderItems: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ ctx, input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    const { byItemId, fallback } = await db.getShipmentsForOrder(input.orderId);

    async function enrichShipment(s: any) {
      const carrier = await db.getCarrierById(s.carrierId);
      const history = await db.getShippingHistoryByShipmentId(s.id);
      return { ...s, carrier, history };
    }

    const enrichedByItemId: Record<number, any> = {};
    for (const [itemId, s] of Object.entries(byItemId)) {
      enrichedByItemId[Number(itemId)] = await enrichShipment(s);
    }

    const enrichedFallback = fallback ? await enrichShipment(fallback) : null;
    return { byItemId: enrichedByItemId, fallback: enrichedFallback };
  }),

  // 상품별 배송 새로고침 (특정 shipmentId 하나만 갱신, 사용자용)
  refreshTrackingByShipment: protectedProcedure.input(z.object({ shipmentId: z.number() })).mutation(async ({ ctx, input }) => {
    const rawShipment = await db.getShipmentById(input.shipmentId);
    if (!rawShipment) throw new TRPCError({ code: "NOT_FOUND" });
    const order = await db.getOrderById(rawShipment.orderId);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    const carrier = await db.getCarrierById(rawShipment.carrierId);
    const history = await db.getShippingHistoryByShipmentId(rawShipment.id);
    const shipment = { ...rawShipment, carrier, history };
    return performShipmentRefresh(shipment, order, ctx.user.id);
  }),

  // 사용자 반품/교환 요청
  requestReturn: protectedProcedure.input(z.object({
    orderId: z.number(),
    type: z.enum(["return", "exchange"]),
    reason: z.string().min(1),
    detailReason: z.string().optional(),
    images: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    if (order.status !== "delivered") throw new TRPCError({ code: "BAD_REQUEST", message: "배송 완료된 주문만 반품/교환 신청이 가능합니다." });
    const id = await db.createReturnRequest({
      orderId: input.orderId,
      userId: ctx.user.id,
      type: input.type,
      reason: input.reason,
      detailReason: input.detailReason ?? null,
      images: input.images ?? null,
    });
    await db.createNotification(ctx.user.id, "order", `${input.type === "return" ? "반품" : "교환"} 신청이 접수되었습니다`, `주문번호: ${order.orderNumber}`, `/mypage/orders/${order.id}`);
    return { success: true, id };
  }),

  myReturnRequests: protectedProcedure.query(async ({ ctx }) => {
    return db.getReturnRequestsByUserId(ctx.user.id);
  }),

  // 배송비 정책 조회 (공개) - DB에서 관리자 설정 데이터 반환
  policies: publicProcedure.query(async () => {
    const policy = await db.getDefaultShippingPolicy();
    if (policy) {
      return {
        freeShipping: policy.freeShippingThreshold === 0,
        baseFee: policy.baseFee,
        freeShippingThreshold: policy.freeShippingThreshold,
        carrier: "국제배송",
        estimatedDays: EMS_ESTIMATED_DAYS,
        policyName: policy.name,
      };
    }
    return { freeShipping: true, baseFee: 0, freeShippingThreshold: 0, carrier: "국제배송", estimatedDays: EMS_ESTIMATED_DAYS, policyName: "기본" };
  }),

  // ─── Admin ───
  adminCarriers: adminProcedure.query(async () => {
    return db.getAllCarriers();
  }),

  adminCreateCarrier: adminProcedure.input(z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    trackingUrlTemplate: z.string().optional(),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createCarrier(input);
    return { success: true, id };
  }),

  adminUpdateCarrier: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    code: z.string().optional(),
    trackingUrlTemplate: z.string().optional(),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCarrier(id, data);
    return { success: true };
  }),

  adminDeleteCarrier: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCarrier(input.id);
    return { success: true };
  }),

  // 운송장 등록 (관리자) - 택배사 자동 감지 또는 직접 지정
  adminCreateShipment: adminProcedure.input(z.object({
    orderId: z.number(),
    orderItemId: z.number().optional(),
    trackingNumber: z.string().min(1),
    carrierId: z.number().optional(),
    estimatedDeliveryDate: z.string().optional(),
  })).mutation(async ({ input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    if (input.orderItemId) {
      const existing = await db.getShipmentByOrderItemId(input.orderItemId);
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "이미 운송장이 등록된 상품입니다." });
    } else {
      const existingShipment = await db.getShipmentByOrderId(input.orderId);
      if (existingShipment && !existingShipment.orderItemId) throw new TRPCError({ code: "BAD_REQUEST", message: "이미 운송장이 등록된 주문입니다." });
    }
    
    // 택배사 선택: 직접 지정 → 추적번호 패턴 자동 감지 → 첫 번째 활성 택배사
    const carriers = await db.getActiveCarriers();
    let selectedCarrier = input.carrierId
      ? carriers.find(c => c.id === input.carrierId)
      : undefined;
    const isIntl = isInternationalTrackingNumber(input.trackingNumber);
    if (!selectedCarrier) {
      if (isIntl) {
        selectedCarrier = carriers.find(c => c.code === "ems" || c.code === "epost_ems" || c.code === "dhl" || c.code === "fedex");
      } else {
        selectedCarrier = carriers.find(c => ["cj", "hanjin", "epost", "lotte", "gs"].includes(c.code));
      }
      if (!selectedCarrier) selectedCarrier = carriers[0];
    }
    if (!selectedCarrier) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "택배사가 설정되지 않았습니다. 관리자 > 배송 설정에서 택배사를 등록해주세요." });
    
    const shippingType = isIntl ? "international" : "domestic";
    const defaultDays = isIntl ? EMS_ESTIMATED_DAYS : 1;
    const estimatedDate = input.estimatedDeliveryDate 
      ? new Date(input.estimatedDeliveryDate) 
      : new Date(Date.now() + defaultDays * 86400000);
    
    const shipmentId = await db.createShipment({
      orderId: input.orderId,
      ...(input.orderItemId ? { orderItemId: input.orderItemId } : {}),
      carrierId: selectedCarrier.id,
      trackingNumber: input.trackingNumber,
      estimatedDeliveryDate: estimatedDate,
      shippedAt: new Date(),
      shippingType,
    });
    
    // 국제배송만 17track에 등록
    if (isIntl) await registerTracking(input.trackingNumber);
    
    // 주문 상태를 배송중으로 자동 변경
    await db.updateOrderStatus(input.orderId, "shipping");
    
    const carrierName = selectedCarrier.name;
    // 알림 발송
    await db.createNotification(order.userId, "order", "상품이 발송되었습니다", `주문번호 ${order.orderNumber} - ${carrierName} ${input.trackingNumber}`, `/mypage/orders/${order.id}`);
    
    // 배송 시작 이메일 발송
    const user = await db.getUserById(order.userId);
    if (user && user.email) {
      try {
        const { sendEmail, generateEmailTemplate } = await import("../_core/email");
        const emailHtml = await generateEmailTemplate({
          title: "상품이 발송되었습니다",
          content: `
            <p>${user.name || "고객"}님, 안녕하세요.</p>
            <p>주문하신 상품이 발송되었습니다.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;border:1px solid #eee;background:#f9f9f9;width:120px;">주문번호</td><td style="padding:8px;border:1px solid #eee;">${order.orderNumber}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;background:#f9f9f9;">택배사</td><td style="padding:8px;border:1px solid #eee;">${carrierName}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;background:#f9f9f9;">운송장번호</td><td style="padding:8px;border:1px solid #eee;font-family:monospace;">${input.trackingNumber}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;background:#f9f9f9;">예상 배송일</td><td style="padding:8px;border:1px solid #eee;">${estimatedDate.toLocaleDateString('ko-KR')}</td></tr>
            </table>
            <p>마이페이지에서 배송 현황을 확인하실 수 있습니다.</p>
          `,
        });
        await sendEmail({
          to: user.email,
          subject: `[배송시작] 주문번호 ${order.orderNumber} - ${carrierName}`,
          html: emailHtml,
        });
      } catch (e) {
        console.error("[Shipping] Failed to send shipping email:", e);
      }
    }
    
    // 탈모1 역반영 (gnuboard 주문인 경우 PHP API로 배송 상태 전달)
    if (order.source === "gnuboard" && order.orderNumber?.startsWith("GNU-")) {
      try {
        const { getGnuApiConfig, pushShipmentToGnuboard } = await import("../jobs/gnuApiSync");
        const gnuCfg = await getGnuApiConfig();
        if (gnuCfg.enabled) {
          await pushShipmentToGnuboard(gnuCfg, {
            orderNumber: order.orderNumber,
            trackingNumber: input.trackingNumber,
            carrierName,
          });
        }
      } catch (e: any) {
        console.error("[Shipping] 탈모1 역반영 실패 (무시됨):", e.message);
      }
    }

    return { success: true, shipmentId };
  }),

  // 일괄 운송장 등록 (국제배송 전용)
  adminBulkCreateShipment: adminProcedure.input(z.object({
    shipments: z.array(z.object({
      orderId: z.number(),
      trackingNumber: z.string().min(1),
    })),
  })).mutation(async ({ input }) => {
    const carriers = await db.getActiveCarriers();
    const emsCarrier = carriers.find(c => c.code === "ems" || c.code === "epost_ems");
    if (!emsCarrier) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "택배사가 설정되지 않았습니다." });
    
    const results: { orderId: number; success: boolean; error?: string }[] = [];
    for (const s of input.shipments) {
      try {
        const order = await db.getOrderById(s.orderId);
        if (!order) { results.push({ orderId: s.orderId, success: false, error: "주문을 찾을 수 없습니다." }); continue; }
        const existing = await db.getShipmentByOrderId(s.orderId);
        if (existing) { results.push({ orderId: s.orderId, success: false, error: "이미 운송장이 등록되어 있습니다." }); continue; }
        // 운송장 번호 패턴 기반 shippingType 자동 감지
        const bulkShippingType = isInternationalTrackingNumber(s.trackingNumber) ? 'international' : 'international'; // 기본값 international
        await db.createShipment({
          orderId: s.orderId,
          carrierId: emsCarrier.id,
          trackingNumber: s.trackingNumber,
          estimatedDeliveryDate: new Date(Date.now() + EMS_ESTIMATED_DAYS * 86400000),
          shippedAt: new Date(),
          shippingType: bulkShippingType,
        });
        // 17track에 등록
        await registerTracking(s.trackingNumber);
        await db.updateOrderStatus(s.orderId, "shipping");
        await db.createNotification(order.userId, "order", "상품이 발송되었습니다 (국제배송)", `주문번호 ${order.orderNumber}의 상품이 발송되었습니다. 운송장: ${s.trackingNumber}`, `/mypage/orders/${order.id}`);
        results.push({ orderId: s.orderId, success: true });
      } catch (e: any) {
        results.push({ orderId: s.orderId, success: false, error: e.message });
      }
    }
    return { results, successCount: results.filter(r => r.success).length, failCount: results.filter(r => !r.success).length };
  }),

  // 배송 상태 변경
  adminUpdateShipmentStatus: adminProcedure.input(z.object({
    shipmentId: z.number(),
    status: z.enum(["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "accepted", "export_customs", "departed_origin", "in_transit_intl", "arrived_destination", "import_customs", "customs_cleared", "in_transit_domestic", "returned"]),
    location: z.string().optional(),
    description: z.string().optional(),
  })).mutation(async ({ input }) => {
    const shipment = await db.getShipmentById(input.shipmentId);
    if (!shipment) throw new TRPCError({ code: "NOT_FOUND" });
    await db.updateShipmentStatus(input.shipmentId, input.status, input.location, input.description);
    // 배달 완료 시 주문 상태도 변경 및 리뷰 요청 이메일 발송
    if (input.status === "delivered") {
      await db.updateOrderStatus(shipment.orderId, "delivered");
      const order = await db.getOrderById(shipment.orderId);
      if (order) {
        await db.createNotification(order.userId, "order", "배송이 완료되었습니다", `주문번호 ${order.orderNumber}의 배송이 완료되었습니다. 리뷰를 작성해보세요!`, `/mypage/orders/${order.id}`);
        
        const user = await db.getUserById(order.userId);
        const items = await db.getOrderItems(order.id);
        const firstProduct = items[0];
        
        if (user && user.email && firstProduct) {
          const { sendEmail, generateReviewRequestEmail } = await import("../_core/email");
          const reviewUrl = `${process.env.VITE_OAUTH_PORTAL_URL || 'https://app.manus.im'}/mypage/orders/${order.id}`;
          const emailHtml = generateReviewRequestEmail({
            customerName: user.name || "고객",
            orderNumber: order.orderNumber,
            productName: firstProduct.productName + (items.length > 1 ? ` 외 ${items.length - 1}건` : ""),
            reviewUrl,
          });
          
          await sendEmail({
            to: user.email,
            subject: "배송이 완료되었습니다! 리뷰를 작성해주세요 💜",
            html: emailHtml,
          });
        }
      }
    }
    return { success: true };
  }),

  // 배송 정보 수정 (택배사, 운송장 번호)
  adminUpdateShipmentInfo: adminProcedure.input(z.object({
    shipmentId: z.number(),
    carrierId: z.number().optional(),
    trackingNumber: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { shipmentId, ...data } = input;
    const shipment = await db.getShipmentById(shipmentId);
    if (!shipment) throw new TRPCError({ code: "NOT_FOUND", message: "배송 정보를 찾을 수 없습니다." });
    
    // 운송장 번호가 변경된 경우 17track에 재등록 및 shippingType 자동 감지
    if (data.trackingNumber && data.trackingNumber !== shipment.trackingNumber) {
      await registerTracking(data.trackingNumber);
      // 운송장 번호 패턴 기반 shippingType 자동 재설정
      const newShippingType = isInternationalTrackingNumber(data.trackingNumber) ? 'international' as const : 'domestic' as const;
      (data as any).shippingType = newShippingType;
      console.log(`[adminUpdateShipmentInfo] shippingType auto-detected: ${newShippingType} for ${data.trackingNumber}`);
    }
    
    await db.updateShipmentInfo(shipmentId, data as { carrierId?: number; trackingNumber?: string; shippingType?: 'international' | 'domestic' });
    return { success: true };
  }),

  // 배송 현황 통계
  adminShippingStats: adminProcedure.query(async () => {
    return db.getShippingStats();
  }),

  // 배송 목록 (관리자)
  adminShipments: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    const result = await db.getAllShipments(input?.page ?? 1, input?.limit ?? 20, input?.status);
    const enriched = await Promise.all(result.shipments.map(async (s) => {
      const order = await db.getOrderById(s.orderId);
      const carrier = await db.getCarrierById(s.carrierId);
      return { ...s, order, carrier };
    }));
    return { shipments: enriched, total: result.total };
  }),

  // 발송 대기 주문
  adminPendingOrders: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getPendingShipmentOrders(input?.page ?? 1, input?.limit ?? 20);
  }),

  // 관리자용 배송 추적 조회 (userId 체크 없음)
  adminTrackOrder: adminProcedure.input(z.object({ orderId: z.number() })).query(async ({ input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    const shipmentData = await db.getShipmentWithCarrier(input.orderId);
    return shipmentData;
  }),

  // 관리자용 개별 shipment 추적 조회 (아이템별 모달용)
  adminGetShipmentTracking: adminProcedure.input(z.object({ shipmentId: z.number() })).query(async ({ input }) => {
    const shipment = await db.getShipmentById(input.shipmentId);
    if (!shipment) throw new TRPCError({ code: "NOT_FOUND" });
    const carrier = await db.getCarrierById(shipment.carrierId);
    const history = await db.getShippingHistoryByShipmentId(shipment.id);
    return { ...shipment, carrier, history };
  }),

  // 통관검사 현황 조회 (관리자 대시보드용)
  adminCustomsHoldList: adminProcedure.query(async () => {
    return db.getCustomsHoldShipments();
  }),

  // 관리자용 배송 정보 새로고침 (userId 체크 없음, 우체국 크롤링 통합)
  adminRefreshTracking: adminProcedure.input(z.object({ orderId: z.number() })).mutation(async ({ input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    
    const shipment = await db.getShipmentWithCarrier(input.orderId);
    if (!shipment) throw new TRPCError({ code: "NOT_FOUND", message: "배송 정보가 없습니다." });
    
    // 운송장 번호 패턴 기반 shippingType 자동 보정
    if (needsKoreaPostCrawling(shipment.trackingNumber) && shipment.shippingType !== 'international') {
      console.log(`[adminRefreshTracking] Auto-correcting shippingType for ${shipment.trackingNumber}: ${shipment.shippingType} → international`);
      await db.updateShipmentInfo(shipment.id, { shippingType: 'international' });
      shipment.shippingType = 'international';
    }

    // 17track API 조회 (미등록 번호는 먼저 등록)
    let trackingInfo;
    try {
      await registerTracking(shipment.trackingNumber);
      trackingInfo = await getTrackingInfo(shipment.trackingNumber);
    } catch (e) {
      console.error("[adminRefreshTracking] 17track API 호출 실패:", e);
    }
    
    // 우체국 크롤링 (국제배송인 경우)
    let koreaPostInfo;
    if (shipment.shippingType === 'international') {
      try {
        koreaPostInfo = await getKoreaPostTracking(shipment.trackingNumber);
      } catch (e) {
        console.error("[adminRefreshTracking] 우체국 크롤링 실패:", e);
      }
    }
    
    // CJ Korea Express Shiptrack 조회 — 국내 CJ 번호는 항상 조회 (17track과 병행)
    let shiptrackInfoAdmin;
    if (isCjKorexNumber(shipment.trackingNumber)) {
      try {
        shiptrackInfoAdmin = await getShiptrackTracking(shipment.trackingNumber, "cjkorex");
        if (shiptrackInfoAdmin) console.log(`[Shiptrack] admin 조회 성공: ${shipment.trackingNumber}, 이벤트 수: ${shiptrackInfoAdmin.events.length}`);
      } catch (e) { console.error("[adminRefreshTracking] Shiptrack 조회 실패:", e); }
    }

    if (!trackingInfo && !koreaPostInfo && !shiptrackInfoAdmin) {
      return { success: false, eventsCount: 0, delivered: false, message: "배송 정보를 아직 조회할 수 없습니다." };
    }
    
    const existingHistory = shipment.history || [];
    let addedCount = 0;
    
    // 상태 매핑 (우체국 크롤링 우선)
    let newStatus: string;
    if (koreaPostInfo && koreaPostInfo.events.length > 0) {
      newStatus = koreaPostInfo.mappedStatus;
      
      // 통관 정보 DB 저장
      if (koreaPostInfo.hasCustomsIssue && koreaPostInfo.customsInfo) {
        const ci = koreaPostInfo.customsInfo;
        const [datePart, timePart] = ci.detectedAt.split(' ');
        const [year, month, day] = datePart.split('.').map(Number);
        const [hour, minute] = (timePart || '00:00').split(':').map(Number);
        
        await db.updateShipmentCustomsInfo(shipment.id, {
          customsNumber: ci.customsNumber || undefined,
          customsOffice: ci.customsOffice || undefined,
          customsHoldAt: new Date(year, month - 1, day, hour, minute),
        });
        
        if (order.status !== 'customs_hold') {
          await db.updateOrderStatus(input.orderId, 'customs_hold');
          try {
            const { notifyOwner } = await import("../_core/notification");
            await notifyOwner({
              title: "⚠️ 통관검사 감지",
              content: `주문번호: ${order.orderNumber}\n운송장: ${shipment.trackingNumber}\n세관: ${ci.customsOffice}\n통관번호: ${ci.customsNumber}`,
            });
          } catch (e) { console.error("[adminRefreshTracking] Notify failed:", e); }
        }
      }
      
      // 우체국 이벤트 DB 저장
      const kpEvents = koreaPostInfo.events.map(event => {
        const [dp, tp] = event.processDate.split(' ');
        const [y, m, d] = dp.split('.').map(Number);
        const [h, mi] = (tp || '00:00').split(':').map(Number);
        return {
          description: mapStatusDisplay(event.processStatus),
          location: event.postOffice,
          details: buildKoreaPostDescription(event.processStatus, event.postOffice, event.details),
          time: new Date(y, m - 1, d, h, mi).getTime(),
        };
      });
      const newKpEvents = filterNewEvents(existingHistory, kpEvents);
      for (const event of newKpEvents) {
        await db.createShippingHistory({
          shipmentId: shipment.id,
          status: mapStatusDisplay(event.description),
          location: event.location || "",
          description: event.details || event.description,
          timestamp: new Date(event.time),
        });
        addedCount++;
      }
    } else if (shiptrackInfoAdmin && shiptrackInfoAdmin.events.length > 0) {
      newStatus = shiptrackInfoAdmin.mappedStatus;
    } else if (trackingInfo) {
      newStatus = mapToIntlStatus(trackingInfo.status, trackingInfo.events);
    } else {
      newStatus = 'in_transit_intl';
    }
    
    await db.updateShipmentStatusOnly(shipment.id, newStatus);

    // Shiptrack 이벤트 저장 (CJ Korea Express)
    if (shiptrackInfoAdmin) {
      const stEvts = shiptrackInfoAdmin.events.map(ev => {
        const [dp, tp] = ev.date.split(' ');
        const [y, m, d] = dp.split('-').map(Number);
        const [h, mi] = (tp || '00:00').split(':').map(Number);
        return { description: ev.status, location: ev.location, details: ev.source ? `${ev.status} (${ev.source})` : ev.status, time: new Date(y, m - 1, d, h, mi).getTime() };
      });
      const newStEvts = filterNewEvents(existingHistory, stEvts);
      for (const event of newStEvts) {
        await db.createShippingHistory({
          shipmentId: shipment.id,
          status: event.description,
          location: event.location || "",
          description: event.details || event.description,
          timestamp: new Date(event.time),
        });
        addedCount++;
      }
    }
    
    // 17track 이벤트 저장
    const newEvents = trackingInfo ? filterNewEvents(existingHistory, trackingInfo.events) : [];
    for (const event of newEvents) {
      await db.createShippingHistory({
        shipmentId: shipment.id,
        status: event.description,
        location: event.location || "",
        description: event.details || event.description,
        timestamp: new Date(event.time),
      });
      addedCount++;
    }

    // 배송 완료 감지
    if (newStatus === "delivered" && order.status !== "delivered") {
      await db.updateOrderStatus(input.orderId, "delivered");
      await db.createNotification(order.userId, "order", "배송이 완료되었습니다", `주문번호: ${order.orderNumber}. 리뷰를 작성해주세요!`, `/mypage/orders/${order.id}`);
    }
    
    return { success: true, eventsCount: addedCount, delivered: newStatus === "delivered" };
  }),

  // 일괄 배송 동기화 (관리자 - 배송 중인 모든 주문의 추적 정보 갱신)
  adminSyncAllTracking: adminProcedure.mutation(async () => {
    const activeShipments = await db.getActiveShipments();
    let syncedCount = 0;
    let failedCount = 0;

    for (const shipment of activeShipments) {
      try {
        const trackingInfo = await getTrackingInfo(shipment.trackingNumber);
        if (!trackingInfo) { failedCount++; continue; }

        const newStatus = mapToIntlStatus(trackingInfo.status, trackingInfo.events);
        await db.updateShipmentStatusOnly(shipment.id, newStatus);

        const existingHistory = await db.getShippingHistoryByShipmentId(shipment.id);
        const newEvents = filterNewEvents(existingHistory, trackingInfo.events);

        for (const event of newEvents) {
          await db.createShippingHistory({
            shipmentId: shipment.id,
            status: event.description,
            location: event.location || "",
            description: event.details || event.description,
            timestamp: new Date(event.time),
          });
        }

        // 배송 완료 시 주문 상태 자동 변경
        if (newStatus === "delivered") {
          const order = await db.getOrderById(shipment.orderId);
          if (order && order.status !== "delivered") {
            await db.updateOrderStatus(shipment.orderId, "delivered");
          }
        }

        syncedCount++;
      } catch (e) {
        console.error(`[syncAllTracking] Failed for shipment ${shipment.id}:`, e);
        failedCount++;
      }
    }

    return { success: true, syncedCount, failedCount, total: activeShipments.length };
  }),

  // 선택한 배송건 일괄 새로고침 (17track API)
  adminBulkRefreshTracking: adminProcedure.input(z.object({
    shipmentIds: z.array(z.number()).min(1).max(50),
  })).mutation(async ({ input }) => {
    const results: { shipmentId: number; orderId: number; success: boolean; newStatus?: string; eventsCount: number; error?: string }[] = [];

    for (const shipmentId of input.shipmentIds) {
      try {
        const shipment = await db.getShipmentById(shipmentId);
        if (!shipment) {
          results.push({ shipmentId, orderId: 0, success: false, eventsCount: 0, error: "배송 정보를 찾을 수 없습니다." });
          continue;
        }

        // 운송장 번호 패턴 기반 shippingType 자동 보정
        if (needsKoreaPostCrawling(shipment.trackingNumber) && shipment.shippingType !== 'international') {
          console.log(`[bulkRefresh] Auto-correcting shippingType for ${shipment.trackingNumber}`);
          await db.updateShipmentInfo(shipment.id, { shippingType: 'international' });
          shipment.shippingType = 'international';
        }

        // 17track 등록 (미등록 운송장 자동 등록)
        try {
          await registerTracking(shipment.trackingNumber);
        } catch (e) {
          console.warn(`[bulkRefresh] 17track 등록 실패 (무시) (shipment ${shipmentId}):`, e);
        }

        let trackingInfo;
        try {
          trackingInfo = await getTrackingInfo(shipment.trackingNumber);
        } catch (e) {
          console.error(`[bulkRefresh] 17track API 호출 실패 (shipment ${shipmentId}):`, e);
        }

        // 국제우편이면 우체국 크롤링도 시도
        let koreaPostInfo;
        if (needsKoreaPostCrawling(shipment.trackingNumber)) {
          try {
            koreaPostInfo = await getKoreaPostTracking(shipment.trackingNumber);
          } catch (e) {
            console.error(`[bulkRefresh] 우체국 크롤링 실패 (shipment ${shipmentId}):`, e);
          }
        }

        if (!trackingInfo && !koreaPostInfo) {
          results.push({ shipmentId, orderId: shipment.orderId, success: false, eventsCount: 0, error: "배송 정보를 조회할 수 없습니다." });
          continue;
        }

        // 상태 매핑 (우체국 크롤링 우선)
        let newStatus: string;
        if (koreaPostInfo && koreaPostInfo.events.length > 0) {
          newStatus = koreaPostInfo.mappedStatus;
        } else if (trackingInfo) {
          newStatus = mapToIntlStatus(trackingInfo.status, trackingInfo.events);
        } else {
          newStatus = 'in_transit_intl';
        }
        await db.updateShipmentStatusOnly(shipment.id, newStatus);

        const existingHistory = await db.getShippingHistoryByShipmentId(shipment.id);
        let addedCount = 0;

        // 우체국 크롤링 이벤트 저장
        if (koreaPostInfo && koreaPostInfo.events.length > 0) {
          const kpEvents = koreaPostInfo.events.map(event => {
            const [dp, tp] = event.processDate.split(' ');
            const [y, m, d] = dp.split('.').map(Number);
            const [h, mi] = (tp || '00:00').split(':').map(Number);
            return {
              description: mapStatusDisplay(event.processStatus),
              location: event.postOffice,
              details: buildKoreaPostDescription(event.processStatus, event.postOffice, event.details),
              time: new Date(y, m - 1, d, h, mi).getTime(),
            };
          });
          const newKpEvents = filterNewEvents(existingHistory, kpEvents);
          for (const event of newKpEvents) {
            await db.createShippingHistory({
              shipmentId: shipment.id,
              status: mapStatusDisplay(event.description),
              location: event.location || "",
              description: event.details || event.description,
              timestamp: new Date(event.time),
            });
            addedCount++;
          }
        }

        // 17track 이벤트 저장
        if (trackingInfo) {
          const newEvents = filterNewEvents(existingHistory, trackingInfo.events);
          for (const event of newEvents) {
            await db.createShippingHistory({
              shipmentId: shipment.id,
              status: event.description,
              location: event.location || "",
              description: event.details || event.description,
              timestamp: new Date(event.time),
            });
            addedCount++;
          }
        }

        // 배송 완료 감지 시 주문 상태 자동 변경
        if (newStatus === "delivered") {
          const order = await db.getOrderById(shipment.orderId);
          if (order && order.status !== "delivered") {
            await db.updateOrderStatus(shipment.orderId, "delivered");
            await db.createNotification(
              order.userId,
              "order",
              "배송이 완료되었습니다",
              `주문번호: ${order.orderNumber}. 상품은 어떠셨나요? 리뷰를 작성해주세요!`,
              `/mypage/orders/${order.id}`
            );
          }
        }

        // 통관검사 감지 시 customs_hold 자동 전환
        if (newStatus === "import_customs") {
          const order = await db.getOrderById(shipment.orderId);
          if (order && order.status !== "customs_hold") {
            await db.updateOrderStatus(shipment.orderId, "customs_hold");
            await db.createNotification(
              order.userId,
              "order",
              "통관검사 안내",
              `주문번호 ${order.orderNumber}: 고객님의 주문 상품이 통관검사 대상으로 선정되었습니다.`,
              `/mypage/orders/${order.id}`
            );
          }
        }

        results.push({ shipmentId, orderId: shipment.orderId, success: true, newStatus, eventsCount: addedCount });
      } catch (e: any) {
        console.error(`[bulkRefresh] Failed for shipment ${shipmentId}:`, e);
        results.push({ shipmentId, orderId: 0, success: false, eventsCount: 0, error: e.message });
      }
    }

    return {
      success: true,
      total: input.shipmentIds.length,
      successCount: results.filter(r => r.success).length,
      failCount: results.filter(r => !r.success).length,
      results,
    };
  }),

  // ─── 반품/교환 관리 ───
  adminReturnRequests: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllReturnRequests(input?.page ?? 1, input?.limit ?? 20, input?.status);
  }),

  adminUpdateReturnRequest: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["requested", "approved", "collecting", "collected", "completed", "rejected"]),
    adminMemo: z.string().optional(),
    refundAmount: z.number().optional(),
    returnTrackingNumber: z.string().optional(),
    returnCarrierId: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const request = await db.getReturnRequestById(id);
    if (!request) throw new TRPCError({ code: "NOT_FOUND" });
    await db.updateReturnRequest(id, data);
    const order = await db.getOrderById(request.orderId);
    const statusMessages: Record<string, string> = {
      approved: "반품/교환 요청이 승인되었습니다.",
      collecting: "반품 수거가 진행 중입니다.",
      collected: "반품 상품이 수거되었습니다.",
      completed: "반품/교환 처리가 완료되었습니다.",
      rejected: "반품/교환 요청이 거절되었습니다.",
    };
    if (statusMessages[input.status]) {
      await db.createNotification(request.userId, "order", statusMessages[input.status], `주문번호: ${order?.orderNumber ?? ""}`, `/mypage/orders/${request.orderId}`);
    }
    if (input.status === "completed" && request.type === "return" && input.refundAmount) {
      await db.updateOrderStatus(request.orderId, "refunded");
      await db.addPoints(request.userId, input.refundAmount, "refund", `반품 환불 (주문 ${order?.orderNumber})`, request.orderId);
    }
    return { success: true };
  }),

  // ─── 배송 동기화 스케줄러 설정 ───
  getSchedulerConfig: adminProcedure.query(async () => {
    return db.getShippingSyncSchedulerConfig();
  }),

  updateSchedulerConfig: adminProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      intervalHours: z.number().min(1).max(48).optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateShippingSyncSchedulerConfig(input);

      // 동적 스케줄러 재시작
      const { restartShippingSyncScheduler } = await import("../jobs/shippingSyncScheduler");
      const config = await db.getShippingSyncSchedulerConfig();
      restartShippingSyncScheduler(config);

      return { success: true, config };
    }),

  runSyncNow: adminProcedure.mutation(async () => {
    const { runShippingSyncJob } = await import("../jobs/shippingSyncJob");
    const result = await runShippingSyncJob();
    await db.updateShippingSyncLastRun(result);
    return { success: true, result };
  }),

  // ——— 통관검사 확인/해제 ———
  adminConfirmCustoms: adminProcedure.input(z.object({
    shipmentId: z.number(),
    confirm: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const shipment = await db.getShipmentById(input.shipmentId);
    if (!shipment) throw new TRPCError({ code: "NOT_FOUND", message: "\ubc30\uc1a1\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4." });
    await db.updateShipmentCustomsConfirm(input.shipmentId, {
      customsConfirmed: input.confirm ? 1 : 0,
      customsConfirmedAt: input.confirm ? new Date() : undefined,
      customsConfirmedBy: input.confirm ? ctx.user.id : undefined,
    });
    return { success: true, confirmed: input.confirm };
  }),
});
