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
          title: "ご注文の自動キャンセルのお知らせ",
          content: `
            <p>いつもご利用ありがとうございます。<strong>${order.recipientName}</strong>様</p>
            <p>ご注文番号 <strong>${order.orderNumber}</strong> はお振込期限を過ぎたため、自動的にキャンセルされました。</p>
            
            <div style="background: #f9fafb; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #dc2626; font-weight: 600;">お振込期限切れによる自動キャンセル</p>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                ${payment.expiresAt ? new Date(payment.expiresAt).toLocaleString("ja-JP") + " までに" : ""} お振込を確認できなかったため、自動的にキャンセルされました。
              </p>
            </div>

            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">ご注文情報</p>
              <table style="width: 100%; font-size: 14px; color: #6b7280;">
                <tr><td style="padding: 4px 0;">ご注文番号</td><td style="text-align: right; font-weight: 500; color: #111827;">${order.orderNumber}</td></tr>
                <tr><td style="padding: 4px 0;">ご注文金額</td><td style="text-align: right; font-weight: 500; color: #111827;">${(payment.depositAmount ?? 0).toLocaleString()}円</td></tr>
                <tr><td style="padding: 4px 0;">お振込名義</td><td style="text-align: right; font-weight: 500; color: #111827;">${payment.depositorName ?? "-"}</td></tr>
              </table>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              同じ商品を再度ご注文の場合は、カートに入れてあらためてご注文ください。<br />
              ご不便をおかけし申し訳ございません。
            </p>
          `,
          actionText: "ショッピングを続ける",
          actionUrl: `${process.env.VITE_APP_URL || "http://localhost:3000"}/products`,
        });

        if (!userEmail) {
          console.warn(`[PaymentAutoCancelJob] No email for order ${order.id}, skipping email notification`);
          continue;
        }

        await sendEmail({
          to: userEmail,
          subject: `[自動キャンセル] ご注文番号 ${order.orderNumber} - お振込期限切れ`,
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
