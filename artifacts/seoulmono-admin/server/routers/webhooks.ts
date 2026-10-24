/**
 * 웹훅 라우터
 * 외부 서비스(17track 등)에서 보내는 웹훅을 처리
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import crypto from "crypto";
import { getDb } from "../db";
import { shipments, shippingHistory, orders, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendShippingStatusEmail, shouldSendEmailForStatus } from "../_core/shippingEmail";

// 17track 웹훅 페이로드 스키마
const SeventeenTrackWebhookSchema = z.object({
  event: z.enum(["TRACKING_UPDATED", "TRACKING_STOPPED"]),
  data: z.object({
    number: z.string(),
    carrier: z.number(),
    track_info: z.object({
      latest_status: z.object({
        status: z.number(),
        sub_status: z.number(),
      }),
      latest_event: z.object({
        time_iso: z.string(),
        time_utc: z.string(),
        description: z.string(),
        location: z.string().optional(),
      }).optional(),
      tracking: z.object({
        providers: z.array(z.object({
          provider: z.object({
            key: z.string(),
            name: z.string(),
          }),
          events: z.array(z.object({
            time_iso: z.string(),
            time_utc: z.string(),
            description: z.string(),
            location: z.string().optional(),
            stage: z.string().optional(),
          })),
        })),
      }).optional(),
    }).optional(),
  }),
  timestamp: z.number(),
  signature: z.string(),
});

/**
 * 웹훅 서명 검증
 */
function verifySignature(payload: string, signature: string): boolean {
  const apiKey = process.env.SEVENTEENTRACK_API_KEY;
  if (!apiKey) {
    console.error("[Webhook] API key not configured");
    return false;
  }

  // SHA256 해시 계산
  const hash = crypto
    .createHmac("sha256", apiKey)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

/**
 * 17track 상태를 시스템 상태로 매핑
 */
function mapStatus(status: number): string {
  const statusMap: Record<number, string> = {
    0: "pending", // NotFound
    1: "pending", // InfoReceived
    2: "in_transit", // InTransit
    3: "picked_up", // PickUp
    4: "out_for_delivery", // OutForDelivery
    5: "failed", // DeliveryFailure
    6: "delivered", // Delivered
    7: "alert", // Alert/Exception
    8: "returned", // Expired
  };
  return statusMap[status] || "pending";
}

/**
 * 17track 상태 텍스트
 */
function getStatusText(status: number): string {
  const texts: Record<number, string> = {
    0: "추적 정보 없음",
    1: "정보 수신됨",
    2: "운송 중",
    3: "픽업 완료",
    4: "배송 중",
    5: "배송 실패",
    6: "배송 완료",
    7: "예외 발생",
    8: "만료됨",
  };
  return texts[status] || "알 수 없음";
}

export const webhooksRouter = router({
  /**
   * 17track 웹훅 엔드포인트
   * POST /api/webhooks/17track
   */
  seventeentrack: publicProcedure
    .input(z.any()) // Raw body로 받아서 서명 검증 후 파싱
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("[Webhook] Received 17track webhook");

        // 서명 검증
        const payload = JSON.stringify(input);
        const signature = input.signature;

        if (!verifySignature(payload, signature)) {
          console.error("[Webhook] Invalid signature");
          throw new Error("Invalid signature");
        }

        // 페이로드 파싱
        const webhook = SeventeenTrackWebhookSchema.parse(input);
        const { event, data } = webhook;

        console.log(`[Webhook] Event: ${event}, Tracking: ${data.number}`);

        // 운송장 번호로 배송 정보 찾기
        const db = await getDb();
        if (!db) {
          console.error("[Webhook] Database not available");
          throw new Error("Database not available");
        }

        const shipment = await db
          .select()
          .from(shipments)
          .where(eq(shipments.trackingNumber, data.number))
          .limit(1)
          .then((rows: any[]) => rows[0]);

        if (!shipment) {
          console.log(`[Webhook] No shipment found for tracking: ${data.number}`);
          return { success: true, message: "No shipment found" };
        }

        // 배송 상태 업데이트
        if (data.track_info) {
          const latestStatus = data.track_info.latest_status;
          const systemStatus = mapStatus(latestStatus.status);
          const statusText = getStatusText(latestStatus.status);

          console.log(`[Webhook] Updating shipment ${shipment.id}: ${statusText}`);

          // shipments 테이블 업데이트
          await db
            .update(shipments)
            .set({
              status: systemStatus as any,
              updatedAt: new Date(),
            })
            .where(eq(shipments.id, shipment.id));

          // shippingHistory에 이력 추가
          if (data.track_info.latest_event) {
            await db.insert(shippingHistory).values({
              shipmentId: shipment.id,
              status: systemStatus as any,
              location: data.track_info.latest_event.location || "",
              description: data.track_info.latest_event.description,
              occurredAt: new Date(data.track_info.latest_event.time_iso),
            });
          }

          // 고객에게 배송 상태 변경 이메일 발송
          if (shouldSendEmailForStatus(systemStatus)) {
            try {
              // 주문 및 사용자 정보 조회
              const order = await db
                .select()
                .from(orders)
                .where(eq(orders.id, shipment.orderId))
                .limit(1)
                .then((rows: any[]) => rows[0]);
              
              if (order) {
                const user = await db
                  .select()
                  .from(users)
                  .where(eq(users.id, order.userId))
                  .limit(1)
                  .then((rows: any[]) => rows[0]);
                
                if (user && user.email) {
                  await sendShippingStatusEmail({
                    customerEmail: user.email,
                    customerName: user.name || "고객",
                    orderNumber: order.orderNumber,
                    trackingNumber: data.number,
                    status: systemStatus,
                    statusText: statusText,
                  });
                }
              }
            } catch (emailError) {
              console.error("[Webhook] Failed to send shipping email:", emailError);
            }
          }
        }

        return { success: true };
      } catch (error) {
        console.error("[Webhook] Error processing webhook:", error);
        throw error;
      }
    }),
});
