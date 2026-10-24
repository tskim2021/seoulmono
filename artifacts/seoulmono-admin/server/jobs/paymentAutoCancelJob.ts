import * as db from "../db";
import { payments, orders, orderItems, products, users, coupons, userCoupons, promoCodes, promoCodeUsages } from "../../drizzle/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { generateEmailTemplate } from "../_core/email";

/**
 * 무통장 입금 자동 취소 스케줄러
 * 
 * 매시간 실행되어 입금 기한이 만료된 주문을 자동으로 취소합니다.
 * 
 * 처리 과정:
 * 1. 입금 대기 중이고 expiresAt이 현재 시간보다 이전인 payments 조회
 * 2. 해당 주문의 상태를 'cancelled'로 변경
 * 3. 주문 상품의 재고 복구
 * 4. 고객에게 자동 취소 알림 이메일 발송
 */
export async function runPaymentAutoCancelJob() {
  console.log("[PaymentAutoCancelJob] Starting payment auto-cancel job...");

  try {
    const now = new Date();
    const database = await db.getDb();
    if (!database) {
      console.error("[PaymentAutoCancelJob] Database not available");
      return { success: false, error: "Database not available" };
    }

    // 1. 만료된 입금 대기 건 조회
    const expiredPayments = await database
      .select({
        payment: payments,
        order: orders,
        userEmail: users.email,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .where(
        and(
          eq(payments.status, "pending"),
          eq(payments.paymentMethod, "bank_transfer"),
          lt(payments.expiresAt, now)
        )
      );

    if (expiredPayments.length === 0) {
      console.log("[PaymentAutoCancelJob] No expired payments found");
      return { success: true, cancelledCount: 0 };
    }

    console.log(`[PaymentAutoCancelJob] Found ${expiredPayments.length} expired payments`);

    let cancelledCount = 0;

    for (const { payment, order, userEmail } of expiredPayments) {
      try {
        // 2. 주문 상태를 cancelled로 변경
        await database
          .update(orders)
          .set({ status: "cancelled", updatedAt: now })
          .where(eq(orders.id, order.id));

        // 3. 결제 상태를 cancelled로 변경
        await database
          .update(payments)
          .set({ status: "cancelled", updatedAt: now })
          .where(eq(payments.id, payment.id));

        // 4. 쿠폰 / 프로모코드 복원
        if (order.couponId) {
          const [uc] = await database.select().from(userCoupons).where(eq(userCoupons.orderId, order.id)).limit(1);
          if (uc) {
            await database.update(userCoupons).set({ isUsed: 0, usedAt: null, orderId: null }).where(eq(userCoupons.id, uc.id));
            await database.update(coupons).set({ usedCount: sql`GREATEST(0, ${coupons.usedCount} - 1)` }).where(eq(coupons.id, uc.couponId));
          }
        }
        if (order.promoCodeId) {
          await database.delete(promoCodeUsages).where(
            and(eq(promoCodeUsages.promoCodeId, order.promoCodeId), eq(promoCodeUsages.orderId, order.id))
          );
          await database.update(promoCodes).set({ usedCount: sql`GREATEST(0, ${promoCodes.usedCount} - 1)` }).where(eq(promoCodes.id, order.promoCodeId));
        }

        // 5. 주문 상품의 재고 복구
        const items = await database
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        for (const item of items) {
          // 재고 복구: 현재 재고 조회 후 업데이트
          const [currentProduct] = await database
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, item.productId));

          if (currentProduct) {
            await database
              .update(products)
              .set({
                stock: currentProduct.stock + item.quantity,
                updatedAt: now,
              })
              .where(eq(products.id, item.productId));
          }
        }

        // 5. 고객에게 자동 취소 알림 이메일 발송
        const emailHtml = await generateEmailTemplate({
          title: "주문 자동 취소 안내",
          content: `
            <p>안녕하세요, <strong>${order.recipientName}</strong>님.</p>
            <p>주문번호 <strong>${order.orderNumber}</strong>의 입금 기한이 만료되어 자동으로 취소되었습니다.</p>
            
            <div style="background: #f9fafb; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #dc2626; font-weight: 600;">입금 기한 만료로 인한 자동 취소</p>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                ${payment.expiresAt ? new Date(payment.expiresAt).toLocaleString("ko-KR") + " 까지" : ""} 입금이 확인되지 않아 자동으로 취소되었습니다.
              </p>
            </div>

            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">주문 정보</p>
              <table style="width: 100%; font-size: 14px; color: #6b7280;">
                <tr><td style="padding: 4px 0;">주문번호</td><td style="text-align: right; font-weight: 500; color: #111827;">${order.orderNumber}</td></tr>
                <tr><td style="padding: 4px 0;">주문금액</td><td style="text-align: right; font-weight: 500; color: #111827;">${(payment.depositAmount ?? 0).toLocaleString()}원</td></tr>
                <tr><td style="padding: 4px 0;">입금자명</td><td style="text-align: right; font-weight: 500; color: #111827;">${payment.depositorName ?? "-"}</td></tr>
              </table>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              동일한 상품을 다시 주문하시려면 장바구니에 담아 주문해 주시기 바랍니다.<br />
              이용에 불편을 드려 죄송합니다.
            </p>
          `,
          actionText: "쇼핑 계속하기",
          actionUrl: `${process.env.VITE_APP_URL || "http://localhost:3000"}/products`,
        });

        if (!userEmail) {
          console.warn(`[PaymentAutoCancelJob] No email for order ${order.id}, skipping email notification`);
          continue;
        }

        await sendEmail({
          to: userEmail,
          subject: `[자동 취소] 주문번호 ${order.orderNumber} - 입금 기한 만료`,
          html: emailHtml,
        });

        cancelledCount++;
        console.log(`[PaymentAutoCancelJob] Cancelled order ${order.orderNumber} (payment expired)`);
      } catch (error) {
        console.error(`[PaymentAutoCancelJob] Failed to cancel order ${order.id}:`, error);
      }
    }

    console.log(`[PaymentAutoCancelJob] Completed: ${cancelledCount}/${expiredPayments.length} orders cancelled`);

    return { success: true, cancelledCount };
  } catch (error) {
    console.error("[PaymentAutoCancelJob] Job failed:", error);
    return { success: false, error: String(error) };
  }
}
