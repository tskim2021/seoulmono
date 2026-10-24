/**
 * 탈모1 Gnuboard PHP API 폴링 동기화
 * MySQL 직접 연결 없이 HTTP API를 통해 주문/상품/회원 동기화
 */
import { drizzle } from "drizzle-orm/mysql2";
import { sql, eq, like, inArray } from "drizzle-orm";
import {
  categories, products, productOptions,
  users, orders, orderItems, payments,
  shipments, shippingCarriers, shippingHistory,
} from "../../drizzle/schema";
import { getDb, getSettings, upsertSetting } from "../db";

// ─── 타입 ────────────────────────────────────────────────────────
type OrderStatus = "pending" | "paid" | "preparing" | "shipping" | "delivered" | "cancelled" | "refunded";
type PaymentMethod = "bank_transfer" | "card" | "virtual_account";
type PaymentStatus = "pending" | "confirmed" | "cancelled";

// ─── 상태 매핑 ───────────────────────────────────────────────────
function mapOrderStatus(s: string): OrderStatus {
  switch ((s ?? "").trim()) {
    case "주문": case "입금": return "paid";
    case "준비": return "preparing";
    case "배송": return "shipping";
    case "완료": return "delivered";
    case "취소": return "cancelled";
    case "환불": return "refunded";
    default: return "pending";
  }
}
function mapPaymentMethod(s: string): PaymentMethod {
  const l = (s ?? "").toLowerCase();
  if (l === "stripe" || l === "card") return "card";
  if (l === "vbank") return "virtual_account";
  return "bank_transfer";
}
function mapPaymentStatus(s: string): PaymentStatus {
  const t = (s ?? "").trim();
  if (t === "취소" || t === "환불") return "cancelled";
  if (!t) return "pending";
  return "confirmed";
}
function safeDate(v: any, fallback = new Date()): Date {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === "string" && v && !v.startsWith("0000")) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return fallback;
}
function slugify(text: string, fallback: string): string {
  const s = text.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").trim();
  return s || fallback;
}

// ─── API 설정 조회 ───────────────────────────────────────────────
export interface GnuApiConfig {
  baseUrl: string;    // https://talmoschool.com/page
  token: string;      // TALMO2_API_TOKEN
  enabled: boolean;
}

export async function getGnuApiConfig(): Promise<GnuApiConfig> {
  const s = await getSettings(["gnuApiBaseUrl", "gnuApiToken", "gnuApiEnabled"]);
  return {
    baseUrl: (s.gnuApiBaseUrl ?? "").replace(/\/$/, ""),
    token: s.gnuApiToken ?? "",
    enabled: s.gnuApiEnabled === "true",
  };
}

// ─── 공통 fetch 헬퍼 ────────────────────────────────────────────
async function apiFetch(url: string, token: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Talmo2-Token": token,
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── 주문 동기화 ─────────────────────────────────────────────────
export async function syncOrdersFromApi(cfg: GnuApiConfig): Promise<{ synced: number; updated: number }> {
  const db = drizzle(process.env.DATABASE_URL!);

  // 마지막 동기화 시각 조회
  const s = await getSettings(["gnuApiLastOrderSync"]);
  const since = s.gnuApiLastOrderSync ?? "2020-01-01T00:00:00";

  // 기존 사용자 매핑
  const pgUsers = await db.select({ id: users.id, openId: users.openId }).from(users).where(like(users.openId, "gnuboard_%"));
  const userMap = new Map<string, number>();
  for (const u of pgUsers) {
    const mbId = (u.openId ?? "").replace(/^gnuboard_/, "");
    if (mbId) userMap.set(mbId, u.id);
  }
  const fallbackRows = await db.select({ id: users.id }).from(users).where(eq(users.openId, "system-admin")).limit(1);
  const fallbackUserId = fallbackRows[0]?.id ?? Array.from(userMap.values())[0];

  // 상품 매핑
  const pgProducts = await db.select({ id: products.id, slug: products.slug }).from(products);
  const itemMap = new Map<string, number>();
  for (const p of pgProducts) {
    const parts = (p.slug ?? "").split("-");
    itemMap.set(parts[parts.length - 1], p.id);
  }

  // 운송사 캐시
  const carrierCache = new Map<string, number>();
  async function getOrCreateCarrier(name: string): Promise<number> {
    const key = name.slice(0, 100);
    if (carrierCache.has(key)) return carrierCache.get(key)!;
    const existing = await db.select({ id: shippingCarriers.id }).from(shippingCarriers).where(eq(shippingCarriers.name, key)).limit(1);
    if (existing.length) { carrierCache.set(key, existing[0].id); return existing[0].id; }
    const code = slugify(key, `carrier-${Date.now()}`).slice(0, 50);
    const [row] = await db.insert(shippingCarriers).values({ name: key, code, isActive: 1, sortOrder: 0 }).$returningId();
    carrierCache.set(key, row.id);
    return row.id;
  }

  let synced = 0, updated = 0;
  let offset = 0;
  const limit = 200;
  let hasMore = true;

  while (hasMore) {
    const url = `${cfg.baseUrl}/talmo2_orders.php?token=${encodeURIComponent(cfg.token)}&since=${encodeURIComponent(since)}&limit=${limit}&offset=${offset}`;
    const data = await apiFetch(url, cfg.token);
    const orderList: any[] = data.orders ?? [];
    if (!orderList.length) break;
    hasMore = offset + orderList.length < data.total;
    offset += limit;

    for (const od of orderList) {
      const odId = String(od.od_id);
      const orderNumber = `GNU-${odId}`.slice(0, 30);
      const mbId = String(od.mb_id ?? "");
      const userId = userMap.get(mbId) ?? fallbackUserId;
      if (!userId) continue;

      const recipientName = (od.od_b_name || od.od_name || "").slice(0, 50);
      const recipientPhone = (od.od_b_hp || od.od_hp || "000-0000-0000").slice(0, 20);
      const zipCode = String(od.od_b_zip || "00000").slice(0, 10);
      const address1 = (od.od_b_addr1 || "주소 없음").slice(0, 255);
      const address2 = (od.od_b_addr2 || od.od_b_addr3 || undefined)?.slice(0, 255);
      const totalAmount = Math.max(0, Number(od.od_cart_price) || 0);
      const shippingFee = Math.max(0, Number(od.od_send_cost) || 0);
      const couponDiscount = Math.max(0, Number(od.od_cart_coupon) || 0);
      const pointsUsed = Math.max(0, Number(od.od_receipt_point) || 0);
      const orderStatus = mapOrderStatus(String(od.od_status ?? ""));
      const createdAt = safeDate(od.od_time);
      const paidAt = ["paid","preparing","shipping","delivered"].includes(orderStatus) ? createdAt : null;
      const deliveredAt = orderStatus === "delivered" ? createdAt : null;

      // 기존 주문 확인 (orderNumber 기준)
      const existing = await db.select({ id: orders.id }).from(orders)
        .where(eq(orders.orderNumber, orderNumber)).limit(1);

      if (existing.length) {
        // 상태만 업데이트 (배송정보 포함)
        await db.execute(sql`
          UPDATE "orders" SET
            status = ${orderStatus},
            "updatedAt" = NOW()
          WHERE "orderNumber" = ${orderNumber}
        `);

        // 배송 정보 업데이트
        const trackingNum = String(od.od_invoice ?? "").trim();
        const carrierName = String(od.od_delivery_company ?? "").trim();
        if (trackingNum && trackingNum.length >= 8) {
          const carrierId = carrierName ? await getOrCreateCarrier(carrierName) : await getOrCreateCarrier("기타");
          const existingShip = await db.select({ id: shipments.id }).from(shipments)
            .where(eq(shipments.orderId, existing[0].id)).limit(1);
          const shipStatus = orderStatus === "delivered" ? "delivered" : orderStatus === "shipping" ? "in_transit" : "pending";
          if (existingShip.length) {
            await db.execute(sql`
              UPDATE "shipments" SET
                "trackingNumber" = ${trackingNum},
                "carrierId" = ${carrierId},
                status = ${shipStatus},
                "updatedAt" = NOW()
              WHERE id = ${existingShip[0].id}
            `);
          } else {
            await db.insert(shipments).values({
              orderId: existing[0].id, carrierId,
              trackingNumber: trackingNum.slice(0, 100),
              status: shipStatus as any,
              shippingType: "domestic",
              shippedAt: paidAt ?? createdAt,
              actualDeliveryDate: deliveredAt,
              createdAt, updatedAt: new Date(),
            });
          }
        }
        updated++;
      } else {
        // 신규 주문 삽입
        const [orderRow] = await db.insert(orders).values({
          userId, orderNumber, source: "gnuboard", status: orderStatus,
          totalAmount, discountAmount: couponDiscount, shippingFee,
          pointsUsed, pointsEarned: 0, couponDiscount,
          recipientName: recipientName || "수신자", recipientPhone,
          zipCode, address1, address2,
          memo: (od.od_memo || od.od_shop_memo || null),
          paidAt, deliveredAt, createdAt, updatedAt: createdAt,
        }).$returningId();

        // 주문 상품
        const items: any[] = od.items ?? [];
        for (const oi of items) {
          const productId = itemMap.get(String(oi.it_id));
          await db.insert(orderItems).values({
            orderId: orderRow.id,
            productId: productId ?? null,
            productName: (oi.it_name || `상품 ${oi.it_id}`).slice(0, 255),
            productThumbnail: null,
            price: Math.max(0, Number(oi.ct_price) || 0),
            quantity: Math.max(1, Number(oi.ct_qty) || 1),
            options: oi.ct_option ? { 옵션: oi.ct_option } : null,
          });
        }

        // 결제
        const payMethod = mapPaymentMethod(String(od.od_settle_case ?? ""));
        const payStatus = mapPaymentStatus(String(od.od_status ?? ""));
        await db.insert(payments).values({
          orderId: orderRow.id, paymentMethod: payMethod,
          depositAmount: Math.max(0, Number(od.od_receipt_price) || totalAmount),
          depositorName: recipientName || null,
          status: payStatus,
          confirmedAt: payStatus === "confirmed" ? paidAt ?? createdAt : null,
          createdAt, updatedAt: createdAt,
        });

        // 배송
        const trackingNum = String(od.od_invoice ?? "").trim();
        const carrierName = String(od.od_delivery_company ?? "").trim();
        if (trackingNum && trackingNum.length >= 8) {
          const carrierId = carrierName ? await getOrCreateCarrier(carrierName) : await getOrCreateCarrier("기타");
          const shipStatus = orderStatus === "delivered" ? "delivered" : orderStatus === "shipping" ? "in_transit" : "pending";
          await db.insert(shipments).values({
            orderId: orderRow.id, carrierId,
            trackingNumber: trackingNum.slice(0, 100),
            status: shipStatus as any, shippingType: "domestic",
            shippedAt: paidAt ?? createdAt,
            actualDeliveryDate: deliveredAt,
            createdAt, updatedAt: createdAt,
          });
        }
        synced++;
      }
    }
  }

  // 마지막 동기화 시각 저장
  await upsertSetting("gnuApiLastOrderSync", new Date().toISOString(), "마지막 주문 API 동기화");
  console.log(`[GnuApiSync:Orders] synced=${synced} updated=${updated}`);
  return { synced, updated };
}

// ─── 배송 역반영 (탈모2 → 탈모1) ────────────────────────────────
export async function pushShipmentToGnuboard(cfg: GnuApiConfig, params: {
  orderNumber: string;   // GNU-20240101... 형식
  trackingNumber: string;
  carrierName: string;
}): Promise<boolean> {
  if (!cfg.baseUrl || !cfg.token) return false;

  const odId = params.orderNumber.replace(/^GNU-/, "");
  const url = `${cfg.baseUrl}/talmo2_update_shipment.php`;

  try {
    const res = await apiFetch(url, cfg.token, {
      method: "POST",
      body: JSON.stringify({
        token: cfg.token,
        od_id: odId,
        od_status: "배송",
        od_invoice: params.trackingNumber,
        od_delivery_company: params.carrierName,
      }),
    });
    console.log(`[GnuApiSync:Shipment] pushed od_id=${odId} tracking=${params.trackingNumber}`);
    return res.success === true;
  } catch (e: any) {
    console.error(`[GnuApiSync:Shipment] push failed: ${e.message}`);
    return false;
  }
}

// ─── 주문 상태 역반영 (탈모2 → 탈모1) ──────────────────────────
export async function pushOrderStatusToGnuboard(cfg: GnuApiConfig, params: {
  orderNumber: string;     // GNU-xxx
  status: string;          // talmo2 status (paid, preparing, cancelled, etc.)
  invoiceNumber?: string;
  carrierName?: string;
}): Promise<boolean> {
  if (!cfg.baseUrl || !cfg.token) return false;

  // 탈모2 status → 그누보드 od_status 매핑
  const statusMap: Record<string, string> = {
    pending: "주문",
    paid: "입금",
    preparing: "준비",
    shipping: "배송",
    delivered: "완료",
    cancelled: "취소",
    refunded: "환불",
  };
  const od_status = statusMap[params.status] ?? "주문";
  const odId = params.orderNumber.replace(/^GNU-/, "");

  try {
    const res = await apiFetch(`${cfg.baseUrl}/talmo2_update_order.php`, cfg.token, {
      method: "POST",
      body: JSON.stringify({
        token: cfg.token,
        od_id: odId,
        action: "status",
        od_status,
        od_invoice: params.invoiceNumber ?? "",
        od_delivery_company: params.carrierName ?? "",
      }),
    });
    console.log(`[GnuApiSync:OrderStatus] pushed od_id=${odId} status=${od_status}`);
    return res.success === true;
  } catch (e: any) {
    console.error(`[GnuApiSync:OrderStatus] push failed: ${e.message}`);
    return false;
  }
}

// ─── 입금 확인 역반영 (탈모2 → 탈모1) ──────────────────────────
export async function pushPaymentConfirmToGnuboard(cfg: GnuApiConfig, params: {
  orderNumber: string;
  receiptPrice?: number;
}): Promise<boolean> {
  if (!cfg.baseUrl || !cfg.token) return false;
  const odId = params.orderNumber.replace(/^GNU-/, "");
  try {
    const res = await apiFetch(`${cfg.baseUrl}/talmo2_update_order.php`, cfg.token, {
      method: "POST",
      body: JSON.stringify({
        token: cfg.token,
        od_id: odId,
        action: "confirm_payment",
        receipt_price: params.receiptPrice ?? 0,
      }),
    });
    console.log(`[GnuApiSync:PaymentConfirm] pushed od_id=${odId}`);
    return res.success === true;
  } catch (e: any) {
    console.error(`[GnuApiSync:PaymentConfirm] push failed: ${e.message}`);
    return false;
  }
}

// ─── 관리자 메모 역반영 (탈모2 → 탈모1) ─────────────────────────
export async function pushMemoToGnuboard(cfg: GnuApiConfig, params: {
  orderNumber: string;
  memo: string;
}): Promise<boolean> {
  if (!cfg.baseUrl || !cfg.token) return false;
  const odId = params.orderNumber.replace(/^GNU-/, "");
  try {
    const res = await apiFetch(`${cfg.baseUrl}/talmo2_update_order.php`, cfg.token, {
      method: "POST",
      body: JSON.stringify({
        token: cfg.token,
        od_id: odId,
        action: "memo",
        od_shop_memo: params.memo,
      }),
    });
    console.log(`[GnuApiSync:Memo] pushed od_id=${odId}`);
    return res.success === true;
  } catch (e: any) {
    console.error(`[GnuApiSync:Memo] push failed: ${e.message}`);
    return false;
  }
}

// ─── 상품 재고/상태 역반영 (탈모2 → 탈모1) ──────────────────────
export async function pushProductStockToGnuboard(cfg: GnuApiConfig, params: {
  itId: string;           // 그누보드 it_id (slug에서 추출)
  stock?: number;
  soldout?: number;       // 0=판매중, 1=품절
}): Promise<boolean> {
  if (!cfg.baseUrl || !cfg.token) return false;
  try {
    const body: any = { token: cfg.token, it_id: params.itId };
    if (params.stock !== undefined) body.it_stock_qty = params.stock;
    if (params.soldout !== undefined) body.it_soldout = params.soldout;
    const res = await apiFetch(`${cfg.baseUrl}/talmo2_update_product.php`, cfg.token, {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.log(`[GnuApiSync:ProductStock] pushed it_id=${params.itId}`);
    return res.success === true;
  } catch (e: any) {
    console.error(`[GnuApiSync:ProductStock] push failed: ${e.message}`);
    return false;
  }
}

// ─── 자동 폴링 (서버 시작 시 설정 기반) ─────────────────────────
export async function startGnuApiPolling(): Promise<void> {
  const cfg = await getGnuApiConfig();
  if (!cfg.enabled || !cfg.baseUrl || !cfg.token) {
    console.log("[GnuApiSync:Polling] 비활성화 상태 — 폴링 스킵");
    return;
  }
  console.log("[GnuApiSync:Polling] 자동 폴링 시작 (15분 간격)");
  // 즉시 1회 실행
  try { await syncOrdersFromApi(cfg); } catch (e: any) { console.error("[GnuApiSync:Polling] 초기 주문 동기화 실패:", e.message); }
  try { await syncMembersFromApi(cfg); } catch (e: any) { console.error("[GnuApiSync:Polling] 초기 회원 동기화 실패:", e.message); }
}

// ─── 상품 동기화 ─────────────────────────────────────────────────
export async function syncProductsFromApi(cfg: GnuApiConfig): Promise<{ products: number; categories: number }> {
  const db = drizzle(process.env.DATABASE_URL!);
  const data = await apiFetch(
    `${cfg.baseUrl}/talmo2_products.php?token=${encodeURIComponent(cfg.token)}`,
    cfg.token,
  );

  const catRows: any[] = data.categories ?? [];
  const itemRows: any[] = data.products ?? [];
  const optMap: Record<string, any[]> = data.options ?? {};

  const catIdMap = new Map<string, number>();
  const itemIdMap = new Map<string, number>();

  await db.transaction(async (tx) => {
    await tx.execute(sql`DELETE FROM "cartItems"`);
    await tx.execute(sql`DELETE FROM "wishlistItems"`);
    await tx.execute(sql`DELETE FROM "priceAlerts"`);
    await tx.execute(sql`DELETE FROM "restockAlerts"`);
    await tx.execute(sql`DELETE FROM "productOptions"`);
    await tx.execute(sql`DELETE FROM "products"`);
    await tx.execute(sql`DELETE FROM "categories"`);
    await tx.execute(sql`ALTER SEQUENCE "categories_id_seq" RESTART WITH 1`);
    await tx.execute(sql`ALTER SEQUENCE "products_id_seq" RESTART WITH 1`);
    await tx.execute(sql`ALTER SEQUENCE "productOptions_id_seq" RESTART WITH 1`);

    for (const c of catRows) {
      const slugBase = slugify(c.ca_name, `cat-${c.ca_id}`);
      const suffix = `-${c.ca_id}`;
      const slug = `${slugBase.slice(0, 100 - suffix.length)}${suffix}`;
      const [row] = await tx.insert(categories).values({
        name: String(c.ca_name).slice(0, 100), slug,
        sortOrder: Number(c.ca_order) || 0, isActive: 1,
      }).$returningId();
      catIdMap.set(String(c.ca_id), row.id);
    }

    for (const it of itemRows) {
      const catId = catIdMap.get(String(it.ca_id));
      if (!catId) continue;
      const imgs: string[] = it.images ?? [];
      const price = Number(it.it_cust_price) || Number(it.it_price) || 0;
      const sale = Number(it.it_price) || 0;
      const salePrice = sale > 0 && sale !== price ? sale : null;
      const slug = `${slugify(it.it_name || "", `item-${it.it_id}`)}-${it.it_id}`.slice(0, 250);
      const [row] = await tx.insert(products).values({
        categoryId: catId,
        name: String(it.it_name || `상품 ${it.it_id}`).slice(0, 250),
        slug, description: it.it_basic ?? null, content: null,
        price: price || sale || 0, salePrice,
        stock: Number(it.it_stock_qty) || 0,
        images: imgs.length ? imgs : null,
        thumbnail: imgs[0] || null,
        status: it.it_soldout == 1 ? "soldout" : "active",
        viewCount: Number(it.it_hit) || 0,
        sortOrder: Number(it.it_order) || 0,
        hashtags: null,
      }).$returningId();
      itemIdMap.set(String(it.it_id), row.id);

      const opts: any[] = optMap[it.it_id] ?? [];
      if (opts.length) {
        await tx.insert(productOptions).values({
          productId: row.id, name: "옵션",
          values: opts.map(o => ({ value: String(o.io_id), price: Number(o.io_price) || 0, stock: Number(o.io_stock_qty) || 0 })),
          sortOrder: 0, isRequired: 1,
        });
      }
    }
  });

  await upsertSetting("gnuApiLastProductSync", new Date().toISOString(), "마지막 상품 API 동기화");
  console.log(`[GnuApiSync:Products] categories=${catIdMap.size} products=${itemIdMap.size}`);
  return { categories: catIdMap.size, products: itemIdMap.size };
}

// ─── 회원 동기화 ─────────────────────────────────────────────────
export async function syncMembersFromApi(cfg: GnuApiConfig): Promise<{ synced: number }> {
  const db = drizzle(process.env.DATABASE_URL!);
  const s = await getSettings(["gnuApiLastMemberSync"]);
  const since = s.gnuApiLastMemberSync ?? "2020-01-01T00:00:00";

  let synced = 0, offset = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const url = `${cfg.baseUrl}/talmo2_members.php?token=${encodeURIComponent(cfg.token)}&since=${encodeURIComponent(since)}&limit=${limit}&offset=${offset}`;
    const data = await apiFetch(url, cfg.token);
    const members: any[] = data.members ?? [];
    if (!members.length) break;
    hasMore = offset + members.length < data.total;
    offset += limit;

    for (const m of members) {
      const mbId = String(m.mb_id ?? "").trim();
      if (!mbId) continue;
      const openId = `gnuboard_${mbId}`;
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.openId, openId)).limit(1);
      if (existing.length) continue; // 이미 존재하면 skip (이름/이메일 변경은 일단 skip)

      const email = (String(m.mb_email ?? "").trim()) || `${mbId}@imported.local`;
      const pwd = String(m.mb_password ?? "");
      const pwdNorm = pwd.startsWith("$2y$") ? "$2a$" + pwd.slice(4) : pwd;
      const created = safeDate(m.mb_datetime);

      await db.insert(users).values({
        openId,
        name: (String(m.mb_nick ?? "") || String(m.mb_name ?? "") || mbId).slice(0, 100),
        email: email.slice(0, 320),
        password: pwdNorm || null,
        loginMethod: "gnuboard",
        role: Number(m.mb_level) >= 10 ? "admin" : "user",
        phone: (String(m.mb_hp ?? "") || String(m.mb_tel ?? "") || null)?.slice(0, 20) ?? null,
        points: Number(m.mb_point) || 0,
        createdAt: created, updatedAt: created,
        lastSignedIn: safeDate(m.mb_today_login, created),
      });
      synced++;
    }
  }

  await upsertSetting("gnuApiLastMemberSync", new Date().toISOString(), "마지막 회원 API 동기화");
  console.log(`[GnuApiSync:Members] synced=${synced}`);
  return { synced };
}
