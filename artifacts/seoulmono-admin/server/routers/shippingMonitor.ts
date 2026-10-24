/**
 * 배송 모니터링 라우터
 * 배송 지연 감지 및 관리자 알림
 */

import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { shipments, orders, shippingHistory } from "../../drizzle/schema";
import { eq, and, lt, notInArray, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * 배송 지연 기준 (밀리초)
 * 7일 = 7 * 24 * 60 * 60 * 1000
 */
const DELAY_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export const shippingMonitorRouter = router({
  /**
   * 배송 지연 감지 및 알림
   * 7일 이상 업데이트가 없는 배송 건을 찾아 관리자에게 알림
   */
  checkDelayedShipments: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const sevenDaysAgo = new Date(Date.now() - DELAY_THRESHOLD_MS);

      // 배송 완료/실패/반송이 아닌 배송 중 7일 이상 업데이트가 없는 건 조회
      const delayedShipments = await db
        .select({
          shipmentId: shipments.id,
          orderId: shipments.orderId,
          trackingNumber: shipments.trackingNumber,
          status: shipments.status,
          updatedAt: shipments.updatedAt,
          orderNumber: orders.orderNumber,
        })
        .from(shipments)
        .leftJoin(orders, eq(shipments.orderId, orders.id))
        .where(
          and(
            notInArray(shipments.status, ["delivered", "failed", "returned"]),
            lt(shipments.updatedAt, sevenDaysAgo)
          )
        );

      if (delayedShipments.length === 0) {
        console.log("[ShippingMonitor] No delayed shipments found");
        return { delayedCount: 0, notified: false };
      }

      // 관리자에게 알림 발송
      const delayedList = delayedShipments
        .map(
          (s) =>
            `- 주문번호: ${s.orderNumber}, 운송장: ${s.trackingNumber}, 마지막 업데이트: ${s.updatedAt?.toLocaleDateString("ko-KR")}`
        )
        .join("\n");

      await notifyOwner({
        title: `⚠️ 배송 지연 알림: ${delayedShipments.length}건`,
        content: `7일 이상 업데이트가 없는 배송 건이 발견되었습니다.\n\n${delayedList}\n\n고객 문의에 대비하여 택배사에 확인이 필요합니다.`,
      });

      console.log(
        `[ShippingMonitor] Notified admin about ${delayedShipments.length} delayed shipments`
      );

      return {
        delayedCount: delayedShipments.length,
        notified: true,
        shipments: delayedShipments,
      };
    } catch (error) {
      console.error("[ShippingMonitor] Error checking delayed shipments:", error);
      throw error;
    }
  }),

  /**
   * 지연된 배송 목록 조회 (관리자용)
   */
  getDelayedShipments: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const sevenDaysAgo = new Date(Date.now() - DELAY_THRESHOLD_MS);

    const delayedShipments = await db
      .select({
        shipmentId: shipments.id,
        orderId: shipments.orderId,
        trackingNumber: shipments.trackingNumber,
        status: shipments.status,
        updatedAt: shipments.updatedAt,
        orderNumber: orders.orderNumber,
        shippedAt: shipments.shippedAt,
      })
      .from(shipments)
      .leftJoin(orders, eq(shipments.orderId, orders.id))
      .where(
        and(
          notInArray(shipments.status, ["delivered", "failed", "returned"]),
          lt(shipments.updatedAt, sevenDaysAgo)
        )
      )
      .orderBy(shipments.updatedAt);

    return delayedShipments.map((s) => ({
      ...s,
      delayedDays: Math.floor(
        (Date.now() - (s.updatedAt?.getTime() || 0)) / (24 * 60 * 60 * 1000)
      ),
    }));
  }),
});
