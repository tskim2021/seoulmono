// Dashboard statistics on the shop's REAL tables (g5_shop_order / g5_shop_cart / g5_shop_item / g5_member / g5_shop_item_option).
// The old versions in db.ts read the a2_* tables of the former 탈모학교 shop, which do not exist in this database, so every dashboard
// widget (and the old order page's carrier list) answered HTTP 500. Return shapes are identical to the old functions, so the
// client pages did not change. Dates are grouped in Japan time; od_time / mb_datetime are stored as UTC.
import { g5q, G5_ORDER_STATUS_MAP } from "./g5";

// orders that count as sales (paid and not cancelled)
const PAID = ["결제완료", "입금확인", "상품준비중", "배송준비중", "배송중", "배송완료", "구매확정"];
const PAID_IN = "o.od_status IN (" + PAID.map(() => "?").join(",") + ")";
const JST = (col: string) => `CONVERT_TZ(${col}, '+00:00', '+09:00')`;
const num = (v: any) => Number(v) || 0;

export async function getDailySalesStats(days = 30) {
  const rows = await g5q(
    `SELECT DATE_FORMAT(${JST("o.od_time")}, '%Y-%m-%d') AS date, COUNT(*) AS orderCount, COALESCE(SUM(o.od_receipt_price), 0) AS revenue
       FROM g5_shop_order o
      WHERE ${PAID_IN} AND o.od_time >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)
      GROUP BY 1 ORDER BY 1`, [...PAID, days]);
  return rows.map((r: any) => ({ date: String(r.date), orderCount: num(r.orderCount), revenue: num(r.revenue) }));
}

export async function getMonthlySalesStats(months = 12) {
  const rows = await g5q(
    `SELECT DATE_FORMAT(${JST("o.od_time")}, '%Y-%m') AS month, COUNT(*) AS orderCount, COALESCE(SUM(o.od_receipt_price), 0) AS revenue
       FROM g5_shop_order o
      WHERE ${PAID_IN} AND o.od_time >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? MONTH)
      GROUP BY 1 ORDER BY 1`, [...PAID, months]);
  return rows.map((r: any) => ({ month: String(r.month), orderCount: num(r.orderCount), revenue: num(r.revenue) }));
}

export async function getOrderStatusDistribution() {
  const rows = await g5q(`SELECT od_status, COUNT(*) AS n FROM g5_shop_order GROUP BY od_status`);
  // several Korean statuses map onto one dashboard status -> merge
  const merged: Record<string, number> = {};
  for (const r of rows as any[]) { const s = G5_ORDER_STATUS_MAP[String(r.od_status)] || String(r.od_status); merged[s] = (merged[s] || 0) + num(r.n); }
  return Object.entries(merged).map(([status, count]) => ({ status, count }));
}

export async function getCategorySalesStats() {
  const rows = await g5q(
    `SELECT COALESCE(NULLIF(c.ca_name, ''), '기타') AS categoryName, COUNT(DISTINCT o.od_id) AS orderCount, COALESCE(SUM(ct.ct_price * ct.ct_qty), 0) AS revenue
       FROM g5_shop_cart ct
       JOIN g5_shop_order o ON o.od_id = ct.od_id
       LEFT JOIN g5_shop_item i ON i.it_id = ct.it_id
       LEFT JOIN g5_shop_category c ON c.ca_id = i.ca_id
      WHERE ${PAID_IN} AND ct.ct_status <> '주문취소'
      GROUP BY i.ca_id, c.ca_name ORDER BY revenue DESC LIMIT 10`, PAID);
  return rows.map((r: any) => ({ categoryName: String(r.categoryName), orderCount: num(r.orderCount), revenue: num(r.revenue) }));
}

export async function getSalesTrend(period: "daily" | "weekly" | "monthly", days: number) {
  const key = period === "monthly" ? `DATE_FORMAT(${JST("o.od_time")}, '%Y-%m')`
    : period === "weekly" ? `DATE_FORMAT(DATE_SUB(DATE(${JST("o.od_time")}), INTERVAL WEEKDAY(${JST("o.od_time")}) DAY), '%Y-%m-%d')` // Monday of that week
    : `DATE_FORMAT(${JST("o.od_time")}, '%Y-%m-%d')`;
  const rows = await g5q(
    `SELECT ${key} AS date, COALESCE(SUM(o.od_receipt_price), 0) AS sales, COUNT(*) AS count
       FROM g5_shop_order o
      WHERE ${PAID_IN} AND o.od_time >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)
      GROUP BY 1 ORDER BY 1`, [...PAID, days]);
  return rows.map((r: any) => ({ date: String(r.date), sales: num(r.sales), count: num(r.count) }));
}

export async function getTopProducts(limit: number) {
  const rows = await g5q(
    `SELECT ct.it_id AS productId, COALESCE(NULLIF(i.it_name_ja, ''), ct.it_name) AS productName, i.it_img1 AS img,
            SUM(ct.ct_qty) AS totalQuantity, SUM(ct.ct_qty * ct.ct_price) AS totalRevenue, COUNT(DISTINCT ct.od_id) AS orderCount
       FROM g5_shop_cart ct
       JOIN g5_shop_order o ON o.od_id = ct.od_id
       LEFT JOIN g5_shop_item i ON i.it_id = ct.it_id
      WHERE ${PAID_IN} AND ct.ct_status <> '주문취소'
      GROUP BY ct.it_id, productName, i.it_img1
      ORDER BY totalQuantity DESC LIMIT ?`, [...PAID, Math.max(1, Math.min(100, limit || 10))]);
  return rows.map((r: any) => ({
    productId: String(r.productId), productName: String(r.productName || ""), productSlug: String(r.productId),
    productThumbnail: r.img ? "/api/product-image/" + String(r.img) + "?w=120" : null,
    totalQuantity: num(r.totalQuantity), totalRevenue: num(r.totalRevenue), orderCount: num(r.orderCount),
  }));
}

export async function getNewUsersTrend(days: number) {
  const rows = await g5q(
    `SELECT DATE_FORMAT(${JST("mb_datetime")}, '%Y-%m-%d') AS date, COUNT(*) AS count
       FROM g5_member
      WHERE mb_datetime >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY) AND (mb_leave_date = '' OR mb_leave_date IS NULL)
      GROUP BY 1 ORDER BY 1`, [days]);
  return rows.map((r: any) => ({ date: String(r.date), count: num(r.count) }));
}

export async function getLowStockOptions(threshold = 10) {
  // option stock (g5_shop_item_option) of visible products + products without options whose own stock is low
  const opts = await g5q(
    `SELECT o.it_id, COALESCE(NULLIF(i.it_name_ja, ''), i.it_name) AS name, o.io_id, o.io_stock_qty
       FROM g5_shop_item_option o JOIN g5_shop_item i ON i.it_id = o.it_id
      WHERE i.it_use = 1 AND o.io_use = 1 AND o.io_type = 0 AND o.io_stock_qty <= ?
      ORDER BY o.io_stock_qty, o.it_id LIMIT 50`, [threshold]);
  const items = await g5q(
    `SELECT i.it_id, COALESCE(NULLIF(i.it_name_ja, ''), i.it_name) AS name, i.it_stock_qty
       FROM g5_shop_item i
      WHERE i.it_use = 1 AND i.it_stock_qty <= ?
        AND NOT EXISTS (SELECT 1 FROM g5_shop_item_option o WHERE o.it_id = i.it_id AND o.io_use = 1 AND o.io_type = 0)
      ORDER BY i.it_stock_qty, i.it_id LIMIT 50`, [threshold]);
  return [
    ...opts.map((r: any) => ({ productId: Number(r.it_id), optionName: String(r.name || r.it_id), optionValue: String(r.io_id), stock: num(r.io_stock_qty) })),
    ...items.map((r: any) => ({ productId: Number(r.it_id), optionName: String(r.name || r.it_id), optionValue: "재고", stock: num(r.it_stock_qty) })),
  ].slice(0, 50);
}

// The shop ships with Korea Post international parcel only (owner decision 2026-10-05); the old carrier table does not exist.
export async function getActiveCarriers() {
  return [{
    id: 1, name: "우체국 국제소포 (韓国郵便 国際小包)", code: "kpost",
    trackingUrlTemplate: "https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1={trackingNumber}&searchKind=S002&locale=ja",
    isActive: 1, sortOrder: 0, createdAt: new Date("2026-10-05T00:00:00Z"),
  }];
}
