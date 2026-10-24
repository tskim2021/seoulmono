import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { sendEmail, generateEmailTemplate } from "../_core/email";

export const orderRouter = router({
  create: protectedProcedure.input(z.object({
    items: z.array(z.object({
      productId: z.number(),
      productName: z.string(),
      productThumbnail: z.string().optional(),
      price: z.number(),
      quantity: z.number(),
      options: z.record(z.string(), z.string()).optional(),
    })),
    recipientName: z.string().min(1),
    recipientNameEn: z.string().optional(),
    recipientPhone: z.string().min(1),
    zipCode: z.string().min(1),
    address1: z.string().min(1),
    address2: z.string().optional(),
    addressEn1: z.string().optional(),
    addressEn2: z.string().optional(),
    memo: z.string().optional(),
    pointsUsed: z.number().min(0).optional(),
    userCouponId: z.number().optional(),
    promoCodeId: z.number().optional(),
    paymentMethod: z.enum(["stripe", "airwallex", "2checkout", "payoneer", "bank_transfer"]).optional(),
    depositorName: z.string().optional(),
    bankAccountId: z.number().optional(),
    preGeneratedOrderNumber: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // 등급별 혜택 적용
    const benefit = await db.getGradeBenefit(ctx.user.grade);
    const gradeDiscount = benefit ? Math.floor(subtotal * benefit.discountRate / 100) : 0;
    const totalAmount = subtotal - gradeDiscount;
    
    // 국제배송 - 전상품 무료배송
    const shippingFee = 0;
    
    const pointsUsed = input.pointsUsed ?? 0;

    if (pointsUsed > 0) {
      const user = await db.getUserById(ctx.user.id);
      if (!user || user.points < pointsUsed) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "포인트가 부족합니다." });
      }
    }

    // 쿠폰 할인 계산 (noDiscount 상품 제외)
    let couponDiscount = 0;
    let couponId: number | null = null;
    if (input.userCouponId) {
      const pIds = input.items.map(i => i.productId);
      const prods = await db.getProductsByIds(pIds);
      const cIds = [...new Set(prods.map(p => p.categoryId).filter(Boolean))] as number[];
      const userCouponList = await db.getAvailableUserCoupons(ctx.user.id, totalAmount, pIds, cIds);
      const uc = userCouponList.find(c => c.id === input.userCouponId);
      if (!uc) throw new TRPCError({ code: "BAD_REQUEST", message: "사용할 수 없는 쿠폰입니다." });
      // noDiscount 상품은 쿠폰 적용에서 제외
      const eligibleItems = input.items.filter(item => {
        const prod = prods.find(p => p.id === item.productId);
        return !prod || prod.noDiscount !== 1;
      });
      const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      couponDiscount = db.calculateCouponDiscount(uc.coupon, eligibleSubtotal);
      couponId = uc.couponId;
    }

    // 프로모코드 할인 계산 및 검증
    let promoCodeDiscount = 0;
    let promoCodeId: number | null = null;
    if (input.promoCodeId) {
      const promo = await db.getPromoCodeById(input.promoCodeId);
      if (!promo) throw new TRPCError({ code: "BAD_REQUEST", message: "존재하지 않는 프로모코드입니다." });
      if (!promo.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "사용할 수 없는 프로모코드입니다." });
      const now = new Date();
      if (now < promo.startDate || now > promo.endDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "프로모코드 사용 기간이 아닙니다." });
      }
      if (promo.totalUsageLimit !== -1 && promo.usedCount >= promo.totalUsageLimit) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "프로모코드가 모두 소진되었습니다." });
      }
      const userUsageCount = await db.getPromoCodeUsageCountByUser(promo.id, ctx.user.id);
      if (userUsageCount >= promo.perUserLimit) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `한 사람당 ${promo.perUserLimit}회만 사용 가능한 프로모코드입니다.` });
      }
      // 상품/카테고리 타겟 검증
      const pIds = input.items.map(i => i.productId);
      const prods = await db.getProductsByIds(pIds);
      const cIds = [...new Set(prods.map(p => p.categoryId).filter(Boolean))] as number[];
      if (promo.targetProductIds) {
        const targetIds = promo.targetProductIds.split(",").map(Number).filter(Boolean);
        if (!pIds.some(pid => targetIds.includes(pid))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "해당 상품에 적용되지 않는 프로모코드입니다." });
        }
      }
      if (promo.targetCategoryIds) {
        const targetIds = promo.targetCategoryIds.split(",").map(Number).filter(Boolean);
        if (!cIds.some(cid => targetIds.includes(cid))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "해당 카테고리에 적용되지 않는 프로모코드입니다." });
        }
      }
      // 최소 주문금액 검증
      if (subtotal < promo.minOrderAmount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `최소 ${promo.minOrderAmount.toLocaleString()}원 이상 구매 시 사용 가능합니다.` });
      }
      // 할인 계산
      if (promo.discountType === "percent") {
        promoCodeDiscount = Math.floor(subtotal * promo.discountValue / 100);
        if (promo.maxDiscountAmount && promoCodeDiscount > promo.maxDiscountAmount) {
          promoCodeDiscount = promo.maxDiscountAmount;
        }
      } else {
        promoCodeDiscount = Math.min(promo.discountValue, subtotal);
      }
      promoCodeId = promo.id;
    }

    // 등급별 적립율 적용
    const pointRate = benefit?.pointRate ?? 0;
    const pointsEarned = Math.floor((totalAmount - pointsUsed - couponDiscount - promoCodeDiscount) * pointRate / 100);
    // Stripe 결제 시 사전 생성된 주문번호 사용 (Stripe metadata와 일치)
    const orderNumber = input.preGeneratedOrderNumber ?? db.generateOrderNumber();

    const orderId = await db.createOrder({
      userId: ctx.user.id,
      orderNumber,
      totalAmount: subtotal,
      shippingFee,
      pointsUsed,
      pointsEarned,
      couponId,
      couponDiscount,
      promoCodeId,
      promoCodeDiscount,
      discountAmount: couponDiscount + gradeDiscount + promoCodeDiscount,
      recipientName: input.recipientName,
      recipientNameEn: input.recipientNameEn ?? null,
      recipientPhone: input.recipientPhone,
      zipCode: input.zipCode,
      address1: input.address1,
      address2: input.address2 ?? null,
      addressEn1: input.addressEn1 ?? null,
      addressEn2: input.addressEn2 ?? null,
      memo: input.memo ?? null,
      status: input.paymentMethod === "bank_transfer" ? "pending" : "paid",
    }, input.items);

    if (pointsUsed > 0) {
      await db.addPoints(ctx.user.id, pointsUsed, "use", `주문 ${orderNumber} 포인트 사용`, orderId);
    }

    // 쿠폰 사용 처리
    if (input.userCouponId) {
      await db.useCoupon(input.userCouponId, orderId!);
    }
    // 프로모코드 사용 처리
    if (input.promoCodeId) {
      await db.recordPromoCodeUsage(input.promoCodeId, ctx.user.id, orderId!);
      await db.incrementPromoCodeUsedCount(input.promoCodeId);
    }

    await db.clearCart(ctx.user.id);

    // 배송지 자동 저장 (중복 시 건너뜀, 실패해도 주문은 유지)
    db.saveAddressFromOrder(ctx.user.id, {
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      zipCode: input.zipCode,
      address1: input.address1,
      address2: input.address2,
      addressEn1: input.addressEn1,
      addressEn2: input.addressEn2,
    }).catch(() => {});

    // 무통장 입금 결제 생성
    if (input.paymentMethod === "bank_transfer" && input.bankAccountId) {
      const autoCancelSetting = await db.getSetting("bankTransferAutoCancelHours");
      const autoCancelHours = parseInt(autoCancelSetting || "48");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + autoCancelHours);

      const depositAmount = totalAmount - pointsUsed - couponDiscount - promoCodeDiscount;
      await db.createPayment({
        orderId: orderId!,
        paymentMethod: "bank_transfer",
        bankAccountId: input.bankAccountId,
        depositorName: input.depositorName ?? null,
        depositAmount,
        expiresAt,
        status: "pending",
      });

      // 입금 계좌 안내 인앱 알림
      const bankAccount = await db.getBankAccountById(input.bankAccountId);
      await db.createNotification(
        ctx.user.id,
        "order",
        "입금 계좌 안내",
        `주문번호 ${orderNumber}의 입금 계좌: ${bankAccount?.bankName ?? ""} ${bankAccount?.accountNumber ?? ""}. ${autoCancelHours}시간 이내에 입금해주세요.`,
        `/mypage/orders`
      );

      // 입금 안내 이메일
      if (ctx.user.email && bankAccount) {
        await sendEmail({
          to: ctx.user.email,
          subject: `[탈모학교] 주문 ${orderNumber} 입금 안내`,
          html: await generateEmailTemplate({
            title: "입금 계좌 안내",
            content: `
              <p>안녕하세요, ${ctx.user.name || "고객"}님.</p>
              <p>주문이 정상적으로 접수되었습니다.</p>
              <p>아래 계좌로 <strong>${autoCancelHours}시간 이내</strong>에 입금해주시면 확인 후 상품을 발송해드립니다.</p>
              <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:20px;margin:20px 0;">
                <h3 style="margin:0 0 15px 0;color:#92400e;">📌 입금 정보</h3>
                <table style="width:100%;border-collapse:collapse;">
                  <tr style="border-bottom:1px solid #fbbf24;"><td style="padding:8px 0;color:#78350f;font-weight:600;">주문번호</td><td style="padding:8px 0;text-align:right;color:#92400e;">${orderNumber}</td></tr>
                  <tr style="border-bottom:1px solid #fbbf24;"><td style="padding:8px 0;color:#78350f;font-weight:600;">입금 계좌</td><td style="padding:8px 0;text-align:right;color:#92400e;">${bankAccount.bankName} ${bankAccount.accountNumber}</td></tr>
                  <tr style="border-bottom:1px solid #fbbf24;"><td style="padding:8px 0;color:#78350f;font-weight:600;">예금주</td><td style="padding:8px 0;text-align:right;color:#92400e;">${bankAccount.accountHolder}</td></tr>
                  <tr style="border-bottom:1px solid #fbbf24;"><td style="padding:8px 0;color:#78350f;font-weight:600;">입금 금액</td><td style="padding:8px 0;text-align:right;color:#92400e;font-size:18px;font-weight:700;">${depositAmount.toLocaleString()}원</td></tr>
                  <tr style="border-bottom:1px solid #fbbf24;"><td style="padding:8px 0;color:#78350f;font-weight:600;">입금자명</td><td style="padding:8px 0;text-align:right;color:#92400e;">${input.depositorName ?? ""}</td></tr>
                  <tr><td style="padding:8px 0;color:#78350f;font-weight:600;">입금 기한</td><td style="padding:8px 0;text-align:right;color:#dc2626;font-weight:700;">${expiresAt.toLocaleString("ko-KR")}</td></tr>
                </table>
              </div>
              <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:15px;margin:20px 0;">
                <p style="margin:0;color:#7f1d1d;font-size:14px;">
                  <strong>⚠️ 주의사항</strong><br/>
                  • 입금 기한(${autoCancelHours}시간) 내 미입금 시 자동으로 주문이 취소됩니다.<br/>
                  • 입금자명이 주문자명과 다른 경우 확인이 지연될 수 있습니다.
                </p>
              </div>
            `,
            actionText: "주문 내역 보기",
            actionUrl: `${process.env.VITE_APP_URL || ""}/mypage/orders`,
          }),
        }).catch(() => {}); // 이메일 실패해도 주문은 성공
      }
    } else {
      await db.createNotification(ctx.user.id, "order", "주문이 접수되었습니다", `주문번호: ${orderNumber}`, `/mypage/orders`);
    }

    // 자동 등급 승급 확인
    const upgradeResult = await db.checkAndUpgradeUserGrade(ctx.user.id);
    if (upgradeResult) {
      const gradeLabels: Record<string, string> = {
        bronze: "브론즈",
        silver: "실버",
        gold: "골드",
        vip: "VIP",
        vvip: "VVIP",
      };
      await db.createNotification(
        ctx.user.id,
        "system",
        "축하합니다! 등급이 상승했습니다",
        `${gradeLabels[upgradeResult.oldGrade]} → ${gradeLabels[upgradeResult.newGrade]} 등급으로 승급되었습니다.`,
        `/mypage/profile`
      );
    }

    return { success: true, orderId, orderNumber };
  }),
  myOrders: protectedProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getUserOrders(ctx.user.id, input?.page ?? 1, input?.limit ?? 10);
  }),
  pendingReviews: protectedProcedure.query(async ({ ctx }) => {
    return db.getPendingReviewOrders(ctx.user.id);
  }),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const order = await db.getOrderById(input.id);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    const items = await db.getOrderItems(order.id);
    return { ...order, items };
  }),
  confirmPayment: protectedProcedure.input(z.object({ orderId: z.number() })).mutation(async ({ ctx, input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    await db.updateOrderStatus(order.id, "paid");
    await db.updateUserGradeAndPoints(ctx.user.id, { totalSpent: (await db.getUserById(ctx.user.id))!.totalSpent + order.totalAmount });
    return { success: true };
  }),
  cancel: protectedProcedure.input(z.object({ orderId: z.number() })).mutation(async ({ ctx, input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    const cancellableStatuses = ["pending", "paid"];
    if (!cancellableStatuses.includes(order.status)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "상품 준비 중 이후에는 취소할 수 없습니다. 고객센터에 문의해주세요." });
    }
    const wasPaid = order.status === "paid";
    await db.updateOrderStatus(order.id, "cancelled");
    // 모든 아이템에 cancelledAt + refundAmount 기록 (환불 관리 및 사용자 화면 표시용)
    await db.markAllItemsCancelled(order.id, wasPaid, order);
    // 사용한 포인트 환불
    if (order.pointsUsed > 0) {
      await db.addPoints(ctx.user.id, order.pointsUsed, "refund", `주문 ${order.orderNumber} 취소 환불`, order.id);
    }
    // 사용한 쿠폰 복원 (orderId로 조회)
    await db.unuseCouponByOrderId(order.id);
    // 사용한 프로모코드 복원
    if (order.promoCodeId) {
      await db.deletePromoCodeUsageByOrderId(order.promoCodeId, order.id);
      await db.decrementPromoCodeUsedCount(order.promoCodeId);
    }
    await db.createNotification(ctx.user.id, "order", "주문이 취소되었습니다", `주문번호 ${order.orderNumber}`, `/mypage/orders`);
    return { success: true };
  }),
  cancelItems: protectedProcedure.input(z.object({
    orderId: z.number(),
    itemIds: z.array(z.number()).min(1),
    reason: z.string().optional(),
    refundBankInfo: z.object({
      bankName: z.string(),
      accountNumber: z.string(),
      accountHolder: z.string(),
    }).optional(),
  })).mutation(async ({ ctx, input }) => {
    const order = await db.getOrderById(input.orderId);
    if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
    const cancellableStatuses = ["pending", "paid"];
    if (!cancellableStatuses.includes(order.status)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "상품 준비 중 이후에는 취소할 수 없습니다. 고객센터에 문의해주세요." });
    }
    // 취소 사유 + 환불계좌 정보 합치기
    let fullReason = input.reason ?? "";
    if (input.refundBankInfo) {
      const { bankName, accountNumber, accountHolder } = input.refundBankInfo;
      const bankStr = `[환불계좌] ${bankName} ${accountNumber} (예금주: ${accountHolder})`;
      fullReason = fullReason ? `${fullReason}\n${bankStr}` : bankStr;
    }
    const result = await db.partialCancelOrderItems(input.orderId, input.itemIds, fullReason || undefined);
    // 포인트는 전체 취소 시에만 한꺼번에 처리 (부분취소 시 개별 환불 없음)
    if (result.allCancelled) {
      // 사용 포인트 전액 환불
      if (order.pointsUsed > 0) {
        await db.addPoints(ctx.user.id, order.pointsUsed, "refund", `주문 ${order.orderNumber} 취소 포인트 환불`, order.id);
      }
      // 적립 포인트 회수 (결제 확인 후 적립된 경우만)
      if (order.pointsEarned > 0 && order.status === "paid") {
        await db.addPoints(ctx.user.id, -order.pointsEarned, "admin", `주문 ${order.orderNumber} 취소 적립 포인트 회수`, order.id);
      }
      // 쿠폰 복원
      await db.unuseCouponByOrderId(order.id);
      // 프로모코드 복원
      if (order.promoCodeId) {
        await db.deletePromoCodeUsageByOrderId(order.promoCodeId, order.id);
        await db.decrementPromoCodeUsedCount(order.promoCodeId);
      }
    }
    await db.createNotification(ctx.user.id, "order", "주문 상품이 취소되었습니다",
      `주문번호 ${order.orderNumber}: ${result.cancelledCount}개 상품 취소`, `/mypage/orders/${order.id}`);
    return result;
  }),
  // Admin
  adminList: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    status: z.string().optional(),
    noTrackingNumber: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllOrders(input?.page ?? 1, input?.limit ?? 20, input?.status, input?.noTrackingNumber);
  }),
  adminUpdateStatus: adminProcedure.input(z.object({
    id: z.number(),
    status: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const order = await db.getOrderById(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    const prevStatus = order.status;
    await db.updateOrderStatus(input.id, input.status);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "order.updateStatus", entityType: "order", entityId: order.id,
      description: `주문 #${order.orderNumber} 상태 변경: ${prevStatus} → ${input.status}`,
      detail: { orderId: order.id, orderNumber: order.orderNumber, from: prevStatus, to: input.status },
    });

    // customs_hold 상태 변경 시 전용 알림 + 이메일 발송
    if (input.status === "customs_hold") {
      await db.createNotification(
        order.userId,
        "order",
        "통관검사 안내",
        `주문번호 ${order.orderNumber}: 고객님의 주문 상품이 통관검사 대상으로 선정되었습니다. 통관 절차가 완료되면 배송이 재개됩니다.`,
        `/mypage/orders/${order.id}`
      );

      // 통관검사 전용 이메일 발송
      try {
        const user = await db.getUserById(order.userId);
        if (user?.email) {
          const { sendEmail } = await import("../_core/email");
          const { generateCustomsHoldEmail } = await import("../_core/customsHoldEmail");
          const emailHtml = generateCustomsHoldEmail({
            customerName: user.name || "고객",
            orderNumber: order.orderNumber,
            orderId: order.id,
            customsNumber: order.customsNumber ?? null,
            customerPhone: user.phone ?? null,
          });
          await sendEmail({
            to: user.email,
            subject: `[탈모학교] 통관검사 안내 - 주문번호 ${order.orderNumber}`,
            html: emailHtml,
            userId: user.id,
          });
        }
      } catch (emailErr) {
        console.error(`[CustomsHold] Failed to send customs hold email for order ${input.id}:`, emailErr);
      }
    } else {
      // 배송완료 시 구매 포인트 자동 적립 (중복 방지)
      if (input.status === "delivered" && order.pointsEarned > 0) {
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

      // 기존 일반 상태 변경 알림
      const statusLabels: Record<string, string> = {
        pending: "주문접수", paid: "결제완료", preparing: "상품준비중",
        shipping: "배송중", delivered: "배송완료", cancelled: "주문취소", refunded: "환불완료",
      };
      const statusText = statusLabels[input.status] || input.status;
      await db.createNotification(
        order.userId,
        "order",
        "주문 상태가 변경되었습니다",
        `주문번호 ${order.orderNumber}: ${statusText}`,
        `/mypage/orders`
      );
    }

    return { success: true };
  }),
  adminGetById: adminProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const order = await db.getOrderById(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    const [items, shipmentsData, user] = await Promise.all([
      db.getOrderItems(input.id),
      db.getShipmentsForOrder(order.id),
      db.getUserById(order.userId),
    ]);
    const itemsWithShipment = items.map(item => ({
      ...item,
      shipment: shipmentsData.byItemId[item.id] ?? shipmentsData.fallback ?? null,
    }));
    return { ...order, items: itemsWithShipment, user };
  }),
  adminPartialCancel: adminProcedure.input(z.object({
    orderId: z.number(),
    itemIds: z.array(z.number()).min(1),
    reason: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const order = await db.getOrderById(input.orderId);
    const result = await db.partialCancelOrderItems(input.orderId, input.itemIds, input.reason);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "order.partialCancel", entityType: "order", entityId: input.orderId,
      description: `주문 #${order?.orderNumber ?? input.orderId} 부분취소 (${input.itemIds.length}개 상품)${input.reason ? ` - 사유: ${input.reason}` : ""}`,
      detail: { orderId: input.orderId, itemIds: input.itemIds, reason: input.reason },
    });
    return result;
  }),
  adminUncancelItem: adminProcedure.input(z.object({
    orderId: z.number(),
    itemId: z.number(),
    status: z.string(),
  })).mutation(async ({ input }) => {
    return db.uncancelOrderItem(input.orderId, input.itemId, input.status);
  }),
  adminUpdateItemStatus: adminProcedure.input(z.object({
    itemId: z.number(),
    status: z.string(),
  })).mutation(async ({ input }) => {
    await db.updateOrderItemStatus(input.itemId, input.status);
    return { ok: true };
  }),
  adminRefundList: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    onlyPending: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getRefundableItems(input?.page ?? 1, input?.limit ?? 30, input?.onlyPending ?? true);
  }),
  adminClaimList: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    status: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getClaims(input?.page ?? 1, input?.limit ?? 30, input?.status);
  }),
  adminMarkOrderRefunded: adminProcedure.input(z.object({
    orderId: z.number(),
  })).mutation(async ({ input, ctx }) => {
    const order = await db.getOrderById(input.orderId);
    await db.markOrderRefunded(input.orderId);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "order.markRefunded", entityType: "order", entityId: input.orderId,
      description: `주문 #${order?.orderNumber ?? input.orderId} 환불완료 처리`,
      detail: { orderId: input.orderId },
    });
    return { ok: true };
  }),
  adminMarkRefunded: adminProcedure.input(z.object({
    itemId: z.number(),
  })).mutation(async ({ input, ctx }) => {
    await db.markOrderItemRefunded(input.itemId);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "order.markItemRefunded", entityType: "orderItem", entityId: input.itemId,
      description: `주문 상품 #${input.itemId} 환불완료 처리`,
      detail: { itemId: input.itemId },
    });
    return { ok: true };
  }),
  adminMarkRefundPending: adminProcedure.input(z.object({
    itemId: z.number(),
  })).mutation(async ({ input, ctx }) => {
    await db.markOrderItemRefundPending(input.itemId);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "order.markItemRefundPending", entityType: "orderItem", entityId: input.itemId,
      description: `주문 상품 #${input.itemId} 환불대기 처리`,
      detail: { itemId: input.itemId },
    });
    return { ok: true };
  }),
  adminUpdateClaim: adminProcedure.input(z.object({
    id: z.number(),
    status: z.string().optional(),
    adminMemo: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    await db.updateClaimStatus(input.id, input.status, input.adminMemo);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "claim.update", entityType: "claim", entityId: input.id,
      description: `클레임 #${input.id}${input.status ? ` 상태를 '${input.status}'로 변경` : ""}`,
      detail: { id: input.id, status: input.status, adminMemo: input.adminMemo },
    });
    return { ok: true };
  }),
});
