import * as db from "../db";
import { getTrackingInfo, mapStatusToSystem } from "../_core/17trackApi";
import { getKoreaPostTracking } from "../_core/koreaPostApi";
import type { KoreaPostTrackingResult } from "../_core/koreaPostApi";
import { getShiptrackTracking, isCjKorexNumber } from "../_core/shiptrackApi";
import { needsKoreaPostCrawling } from "../lib/trackingNumberUtils";
import { buildKoreaPostDescription, mapStatusDisplay } from "../lib/shippingDescriptionFormatter";

/**
 * 17track 상태를 국제배송 단계에 매핑 (서버 사이드)
 */
function mapToIntlStatus(trackingStatus: number, events: { description: string; location?: string }[]): string {
  const allDescs = events.map(e => (e.description || "").toLowerCase()).join(" ");

  if (allDescs.includes("배달완료") || allDescs.includes("delivered") || trackingStatus === 6) return "delivered";
  if (allDescs.includes("배달출발") || allDescs.includes("out for delivery") || trackingStatus === 4) return "out_for_delivery";
  if ((allDescs.includes("교환국 도착") || allDescs.includes("국제우편물류센터")) && (allDescs.includes("통관") || allDescs.includes("customs"))) return "import_customs";
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

/**
 * 기존 DB 이력과 새 API 이벤트를 비교하여 중복되지 않는 새 이벤트만 반환
 */
function filterNewEvents(
  existingHistory: { description: string | null; occurredAt: Date }[],
  apiEvents: { description: string; location?: string; details?: string; time: number }[]
): { description: string; location: string; details?: string; time: number }[] {
  const existingSet = new Set(
    existingHistory.map(h => {
      const desc = (h.description || "").trim();
      const time = new Date(h.occurredAt).getTime();
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
 * 우체국 크롤링 이벤트를 DB 이력 형식으로 변환
 */
function convertKoreaPostEvents(koreaPostResult: KoreaPostTrackingResult): { description: string; location: string; details: string; time: number }[] {
  return koreaPostResult.events.map(event => {
    const [datePart, timePart] = event.processDate.split(' ');
    const [year, month, day] = datePart.split('.').map(Number);
    const [hour, minute] = (timePart || '00:00').split(':').map(Number);
    const date = new Date(year, month - 1, day, hour, minute);

    const description = mapStatusDisplay(event.processStatus);
    const details = buildKoreaPostDescription(event.processStatus, event.postOffice, event.details);

    return {
      description,
      location: event.postOffice,
      details,
      time: date.getTime(),
    };
  });
}

/**
 * 통관검사 감지 시 처리 (알림 + 이메일 + DB 업데이트)
 */
async function handleCustomsHold(
  shipment: { id: number; orderId: number; trackingNumber: string },
  koreaPostResult: KoreaPostTrackingResult | null
) {
  const order = await db.getOrderById(shipment.orderId);
  if (!order || order.status === "customs_hold") return;

  // 주문 상태를 customs_hold로 변경
  await db.updateOrderStatus(shipment.orderId, "customs_hold");

  // 통관 정보 DB에 저장
  if (koreaPostResult?.customsInfo) {
    const ci = koreaPostResult.customsInfo;
    const [datePart, timePart] = ci.detectedAt.split(' ');
    const [year, month, day] = datePart.split('.').map(Number);
    const [hour, minute] = (timePart || '00:00').split(':').map(Number);

    await db.updateShipmentCustomsInfo(shipment.id, {
      customsNumber: ci.customsNumber || undefined,
      customsOffice: ci.customsOffice || undefined,
      customsHoldAt: new Date(year, month - 1, day, hour, minute),
    });
  } else {
    await db.updateShipmentCustomsInfo(shipment.id, {
      customsHoldAt: new Date(),
    });
  }

  // 통관검사 안내 알림
  await db.createNotification(
    order.userId,
    "order",
    "통관검사 안내",
    `주문번호 ${order.orderNumber}: 고객님의 주문 상품이 통관검사 대상으로 선정되었습니다.${
      koreaPostResult?.customsInfo?.customsOffice
        ? ` (${koreaPostResult.customsInfo.customsOffice} 통관번호: ${koreaPostResult.customsInfo.customsNumber})`
        : ''
    } 통관 절차가 완료되면 배송이 재개됩니다.`,
    `/mypage/orders/${order.id}`
  );

  // 관리자 알림
  try {
    const { notifyOwner } = await import("../_core/notification");
    await notifyOwner({
      title: "⚠️ 통관검사 감지",
      content: `주문번호: ${order.orderNumber}\n운송장: ${shipment.trackingNumber}${
        koreaPostResult?.customsInfo
          ? `\n세관: ${koreaPostResult.customsInfo.customsOffice}\n통관번호: ${koreaPostResult.customsInfo.customsNumber}`
          : ''
      }\n\n통관검사 대상으로 확인되었습니다. 관리자 대시보드에서 확인해주세요.`,
    });
  } catch (e) {
    console.error("[ShippingSync] Failed to notify owner about customs hold:", e);
  }

  // 통관검사 안내 이메일 발송
  try {
    const user = await db.getUserById(order.userId);
    if (user?.email) {
      const { sendEmail } = await import("../_core/email");
      const { generateCustomsHoldEmail } = await import("../_core/customsHoldEmail");
      const emailHtml = generateCustomsHoldEmail({
        customerName: user.name || "고객",
        orderNumber: order.orderNumber,
        orderId: order.id,
      });
      await sendEmail({
        to: user.email,
        subject: `[탈모학교] 통관검사 안내 - 주문번호 ${order.orderNumber}`,
        html: emailHtml,
        userId: user.id,
      });
    }
  } catch (emailErr) {
    console.error(`[ShippingSync] Failed to send customs hold email for order ${shipment.orderId}:`, emailErr);
  }

  console.log(`[ShippingSync] Order ${order.orderNumber} set to customs_hold${
    koreaPostResult?.customsInfo ? ` (${koreaPostResult.customsInfo.customsOffice} #${koreaPostResult.customsInfo.customsNumber})` : ''
  }`);
}

/**
 * 통관 완료 후 배송 재개 처리
 */
async function handleCustomsCleared(shipment: { id: number; orderId: number; trackingNumber: string }) {
  const order = await db.getOrderById(shipment.orderId);
  if (!order || order.status !== "customs_hold") return;

  await db.updateOrderStatus(shipment.orderId, "shipping");
  await db.createNotification(
    order.userId,
    "order",
    "통관검사 완료 - 배송 재개",
    `주문번호 ${order.orderNumber}: 통관검사가 완료되어 배송이 재개되었습니다.`,
    `/mypage/orders/${order.id}`
  );
  console.log(`[ShippingSync] Order ${order.orderNumber} customs cleared, resumed shipping`);
}

/**
 * 배송 완료 처리
 */
async function handleDelivered(shipment: { id: number; orderId: number; trackingNumber: string }) {
  const order = await db.getOrderById(shipment.orderId);
  if (!order || order.status === "delivered") return;

  await db.updateOrderStatus(shipment.orderId, "delivered");

  // 배송완료 시 구매 포인트 자동 적립 (중복 방지)
  if (order.pointsEarned > 0) {
    const alreadyAwarded = await db.hasOrderEarnPoints(order.id);
    if (!alreadyAwarded) {
      await db.addPoints(order.userId, order.pointsEarned, "earn", `주문 ${order.orderNumber} 배송완료 포인트 적립`, order.id);
      await db.createNotification(
        order.userId,
        "point",
        "포인트가 적립되었습니다",
        `${order.pointsEarned.toLocaleString()}P 적립 (주문번호: ${order.orderNumber})`,
        `/mypage/points`
      );
    }
  }

  await db.createNotification(
    order.userId,
    "order",
    "배송이 완료되었습니다",
    `주문번호: ${order.orderNumber}. 상품은 어떠셨나요? 리뷰를 작성해주세요!`,
    `/mypage/orders/${order.id}`
  );

  try {
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
  } catch (emailErr) {
    console.error(`[ShippingSync] Failed to send delivery email for order ${shipment.orderId}:`, emailErr);
  }
}

/**
 * 국제우편 운송장 여부 판별 (L로 시작하는 등기)
 */
function isInternationalPostal(trackingNumber: string): boolean {
  // 국제우편 등기: 2글자 영문 + 9자리 숫자 + 2글자 국가코드 (예: LP057879048IN)
  return /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(trackingNumber);
}

/**
 * 배송 동기화 Job - 배송 중인 모든 주문의 추적 정보를 갱신
 *
 * 국제우편(L로 시작): 우체국 사이트 크롤링 우선 → 17track 보조
 * 기타 국제택배: 17track API 사용
 */
export async function runShippingSyncJob() {
  console.log("[ShippingSync] Starting shipping sync job...");

  const activeShipments = await db.getActiveShipments();

  if (activeShipments.length === 0) {
    console.log("[ShippingSync] No active shipments to sync.");
    return { syncedCount: 0, failedCount: 0, total: 0, customsHoldCount: 0 };
  }

  console.log(`[ShippingSync] Found ${activeShipments.length} active shipments to sync.`);

  let syncedCount = 0;
  let failedCount = 0;
  let deliveredCount = 0;
  let customsHoldCount = 0;

  for (const shipment of activeShipments) {
    try {
      // API 호출 간격 조절 (rate limit 방지)
      if (syncedCount > 0 || failedCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 대기
      }

      let newStatus: string;
      let koreaPostResult: KoreaPostTrackingResult | null = null;

      // 운송장 번호 패턴 기반 shippingType 자동 보정
      if (needsKoreaPostCrawling(shipment.trackingNumber) && shipment.shippingType !== 'international') {
        console.log(`[ShippingSync] Auto-correcting shippingType for ${shipment.trackingNumber}: ${shipment.shippingType} → international`);
        await db.updateShipmentInfo(shipment.id, { shippingType: 'international' });
        shipment.shippingType = 'international';
      }

      // ─── 국제우편 (등기 패턴): 우체국 크롤링 우선 ───
      if (needsKoreaPostCrawling(shipment.trackingNumber)) {
        console.log(`[ShippingSync] Using Korea Post crawling for ${shipment.trackingNumber}`);

        koreaPostResult = await getKoreaPostTracking(shipment.trackingNumber);

        if (koreaPostResult) {
          newStatus = koreaPostResult.mappedStatus;

          // 우체국 크롤링 이벤트를 DB에 저장
          const koreaPostEvents = convertKoreaPostEvents(koreaPostResult);
          const existingHistory = await db.getShippingHistoryByShipmentId(shipment.id);
          const newEvents = filterNewEvents(existingHistory, koreaPostEvents);

          for (const event of newEvents) {
            await db.createShippingHistory({
              shipmentId: shipment.id,
              status: event.description,
              location: event.location || "",
              description: event.details || event.description,
              timestamp: new Date(event.time),
            });
          }

          console.log(`[ShippingSync] Korea Post: ${shipment.trackingNumber} → ${newStatus} (+${newEvents.length} events)`);
        } else {
          // 우체국 크롤링 실패 시 17track 폴백
          console.log(`[ShippingSync] Korea Post failed, falling back to 17track for ${shipment.trackingNumber}`);
          const trackingInfo = await getTrackingInfo(shipment.trackingNumber);
          if (!trackingInfo) {
            failedCount++;
            continue;
          }
          newStatus = mapToIntlStatus(trackingInfo.status, trackingInfo.events);

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
        }
      } else {
        // ─── 기타 국제택배: 17track API 사용 ───
        const trackingInfo = await getTrackingInfo(shipment.trackingNumber);

        // CJ Korea Express 폴백 (17track이 없으면 shiptrack.co.kr 시도)
        let shiptrackResult = null;
        if (!trackingInfo && isCjKorexNumber(shipment.trackingNumber)) {
          try {
            shiptrackResult = await getShiptrackTracking(shipment.trackingNumber, "cjkorex");
          } catch (e) {
            console.error(`[ShippingSync] Shiptrack 조회 실패 (${shipment.trackingNumber}):`, e);
          }
        }

        if (!trackingInfo && !shiptrackResult) {
          failedCount++;
          continue;
        }

        const existingHistory = await db.getShippingHistoryByShipmentId(shipment.id);

        if (shiptrackResult && shiptrackResult.events.length > 0) {
          // CJ Korea Express 이벤트 저장
          newStatus = shiptrackResult.mappedStatus;
          const stEvents = shiptrackResult.events.map(ev => {
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
          }
          console.log(`[ShippingSync] Shiptrack(CJ): ${shipment.trackingNumber} → ${newStatus} (+${newStEvents.length} events)`);
        } else if (trackingInfo) {
          newStatus = mapToIntlStatus(trackingInfo.status, trackingInfo.events);
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
        } else {
          newStatus = 'in_transit_intl';
        }
      }

      // 상태 업데이트
      await db.updateShipmentStatusOnly(shipment.id, newStatus);

      // ─── 통관검사 감지 ───
      if (newStatus === "customs_hold" || (koreaPostResult && koreaPostResult.hasCustomsIssue)) {
        await handleCustomsHold(shipment, koreaPostResult);
        customsHoldCount++;
      }

      // ─── 통관 완료 후 배송 재개 ───
      if (["in_transit", "in_transit_domestic", "out_for_delivery", "customs_cleared"].includes(newStatus)) {
        await handleCustomsCleared(shipment);
      }

      // ─── 배송 완료 ───
      if (newStatus === "delivered") {
        await handleDelivered(shipment);
        deliveredCount++;
      }

      syncedCount++;
      console.log(`[ShippingSync] Synced ${shipment.trackingNumber}: ${newStatus}`);
    } catch (e) {
      console.error(`[ShippingSync] Failed for shipment ${shipment.id} (${shipment.trackingNumber}):`, e);
      failedCount++;
    }
  }

  console.log(`[ShippingSync] Completed: ${syncedCount} synced, ${failedCount} failed, ${deliveredCount} delivered, ${customsHoldCount} customs_hold, ${activeShipments.length} total`);
  return { syncedCount, failedCount, deliveredCount, customsHoldCount, total: activeShipments.length };
}
