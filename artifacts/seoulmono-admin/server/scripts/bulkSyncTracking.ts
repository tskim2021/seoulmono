/**
 * 송장번호 일괄 17track 등록 + 배송정보 동기화 스크립트
 * Usage: node_modules/.bin/tsx server/scripts/bulkSyncTracking.ts
 */
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, isNotNull } from "drizzle-orm";
import { shipments, orders, shippingHistory } from "../../drizzle/schema.js";
import { bulkRegisterTracking, getTrackingInfo } from "../_core/17trackApi.js";
import { getKoreaPostTracking } from "../_core/koreaPostApi.js";
import { needsKoreaPostCrawling } from "../lib/trackingNumberUtils.js";
import { buildKoreaPostDescription, mapStatusDisplay } from "../lib/shippingDescriptionFormatter.js";

const pool = mysql.createPool({ uri: process.env.DATABASE_URL });
const db = drizzle(pool);

const VALID_STATUSES = [
  "pending","picked_up","in_transit","out_for_delivery","delivered","failed",
  "accepted","export_customs","departed_origin","in_transit_intl","arrived_destination",
  "import_customs","customs_cleared","in_transit_domestic","returned"
];

function safeStatus(s: string): string {
  return VALID_STATUSES.includes(s) ? s : "in_transit";
}

function mapToIntlStatus(status: number, events: { description: string }[]): string {
  if (status === 40) return "delivered";
  if (status === 35) return "import_customs";
  if (status >= 30) return "in_transit_intl";
  if (status >= 20) return "picked_up";
  if (status >= 10) return "accepted";
  return "in_transit";
}

async function getExistingHistory(shipmentId: number) {
  return db.select().from(shippingHistory).where(eq(shippingHistory.shipmentId, shipmentId));
}

function filterNewEvents(existing: { occurredAt: Date | null }[], events: { time: number }[]) {
  const existingTimes = new Set(existing.map(e => e.occurredAt ? new Date(e.occurredAt).getTime() : 0));
  return events.filter(e => !existingTimes.has(e.time));
}

async function insertHistory(shipmentId: number, status: string, location: string, description: string, timestamp: Date) {
  const enumStatus = safeStatus(status) as any;
  await db.insert(shippingHistory).values({
    shipmentId,
    status: enumStatus,
    location,
    description,
    rawStatus: status,
    occurredAt: timestamp,
  });
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const allShipments = (await db.select().from(shipments))
    .filter(s => s.trackingNumber && s.trackingNumber.trim() !== "");

  console.log(`\n[BulkSync] 송장번호 있는 shipments: ${allShipments.length}건\n`);

  // 고유 운송장 번호 목록
  const uniqueNumbers = [...new Set(allShipments.map(s => s.trackingNumber!))];
  console.log(`[BulkSync] 고유 운송장 수: ${uniqueNumbers.length}개`);

  // Step 1: 17track 일괄 등록 (40개씩)
  console.log("\n[Step 1] 17track 일괄 등록 중...");
  let totalAccepted = 0;
  for (let i = 0; i < uniqueNumbers.length; i += 40) {
    const batch = uniqueNumbers.slice(i, i + 40);
    const result = await bulkRegisterTracking(batch);
    totalAccepted += result.accepted.length;
    if (i + 40 < uniqueNumbers.length) await sleep(1000);
  }
  console.log(`[Step 1] 등록 완료: ${totalAccepted}/${uniqueNumbers.length} accepted`);

  // 17track 크롤링 대기
  console.log("[BulkSync] 17track 크롤링 대기 (8초)...");
  await sleep(8000);

  // Step 2: 각 shipment별 배송정보 조회 및 업데이트
  console.log("\n[Step 2] 배송정보 조회 및 업데이트 중...");
  let success = 0, failed = 0, totalEvents = 0;

  for (const shipment of allShipments) {
    const { id: shipmentId, trackingNumber, shippingType } = shipment;
    if (!trackingNumber) continue;

    // shippingType 자동 보정
    if (needsKoreaPostCrawling(trackingNumber) && shippingType !== "international") {
      await db.update(shipments).set({ shippingType: "international" as any }).where(eq(shipments.id, shipmentId));
    }

    let trackingInfo: Awaited<ReturnType<typeof getTrackingInfo>> = null;
    let koreaPostInfo: Awaited<ReturnType<typeof getKoreaPostTracking>> = null;

    try { trackingInfo = await getTrackingInfo(trackingNumber); } catch {}

    if (needsKoreaPostCrawling(trackingNumber)) {
      try { koreaPostInfo = await getKoreaPostTracking(trackingNumber); } catch {}
    }

    if (!trackingInfo && !koreaPostInfo) {
      process.stdout.write("?");
      failed++;
      await sleep(300);
      continue;
    }

    // 상태 결정
    let newStatus: string;
    if (koreaPostInfo && koreaPostInfo.events.length > 0) {
      newStatus = koreaPostInfo.mappedStatus;
    } else if (trackingInfo) {
      newStatus = mapToIntlStatus(trackingInfo.status, trackingInfo.events);
    } else {
      newStatus = "in_transit";
    }

    await db.update(shipments).set({ status: newStatus as any }).where(eq(shipments.id, shipmentId));

    const existingHistory = await getExistingHistory(shipmentId);
    let addedCount = 0;

    // 우체국 이벤트 저장
    if (koreaPostInfo && koreaPostInfo.events.length > 0) {
      const kpEvents = koreaPostInfo.events.map(event => {
        const [dp, tp] = event.processDate.split(" ");
        const [y, m, d] = dp.split(".").map(Number);
        const [h, mi] = (tp || "00:00").split(":").map(Number);
        return {
          description: mapStatusDisplay(event.processStatus),
          location: event.postOffice || "",
          details: buildKoreaPostDescription(event.processStatus, event.postOffice, event.details),
          time: new Date(y, m - 1, d, h, mi).getTime(),
        };
      });
      const newKpEvents = filterNewEvents(existingHistory, kpEvents);
      for (const event of newKpEvents as any[]) {
        await insertHistory(shipmentId, safeStatus(event.description), event.location, event.details, new Date(event.time));
        addedCount++;
      }
    }

    // 17track 이벤트 저장
    if (trackingInfo) {
      const newEvents = filterNewEvents(existingHistory, trackingInfo.events);
      for (const event of newEvents as any[]) {
        await insertHistory(shipmentId, "in_transit", event.location || "", event.description, new Date(event.time));
        addedCount++;
      }
    }

    // 배송 완료 → 주문 상태 자동 업데이트
    if (newStatus === "delivered") {
      const [order] = await db.select().from(orders).where(eq(orders.id, shipment.orderId));
      if (order && order.status !== "delivered") {
        await db.update(orders).set({ status: "delivered" as any }).where(eq(orders.id, order.id));
        console.log(`\n  [완료] 주문 ${order.id} delivered 처리`);
      }
    }

    totalEvents += addedCount;
    success++;
    process.stdout.write(addedCount > 0 ? "+" : ".");
    await sleep(250);
  }

  console.log(`\n\n[BulkSync] 완료!`);
  console.log(`  처리: ${success}건 성공 / ${failed}건 실패`);
  console.log(`  추가된 배송이벤트: ${totalEvents}건`);

  // 최종 상태 요약
  const summary = await db.select().from(shipments).where(isNotNull(shipments.trackingNumber));
  const statusCounts: Record<string, number> = {};
  for (const s of summary) {
    if (!s.trackingNumber) continue;
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  }
  console.log("\n[상태 요약]");
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status}: ${count}건`);
  }

  await pool.end();
}

main().catch(e => {
  console.error("[BulkSync] 오류:", e);
  pool.end();
  process.exit(1);
});
