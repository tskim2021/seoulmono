import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { sql, eq, like, inArray } from "drizzle-orm";
import {
  categories, products, productOptions,
  users, boards, posts, comments,
  orders, orderItems, payments,
  pointHistory, coupons, userCoupons,
  shipments, shippingCarriers, shippingHistory,
} from "../../drizzle/schema";

type BoardType = "free" | "review" | "qna" | "notice" | "news" | "info";
type OrderStatus = "pending" | "paid" | "preparing" | "shipping" | "delivered" | "cancelled" | "refunded";
type PaymentMethod = "bank_transfer" | "card" | "virtual_account";
type PaymentStatus = "pending" | "confirmed" | "cancelled";
type PointType = "earn" | "use" | "admin" | "refund";
type DiscountType = "percent" | "fixed";

const BOARD_MAP: Record<string, { slug: string; name: string; type: BoardType; sort: number }> = {
  notice:  { slug: "notice",  name: "공지사항",   type: "notice", sort: 1 },
  qa:      { slug: "qna",     name: "질문과답변", type: "qna",    sort: 2 },
  free:    { slug: "free",    name: "자유게시판", type: "free",   sort: 3 },
  gallery: { slug: "review",  name: "리얼후기",   type: "review", sort: 4 },
  info:    { slug: "info",    name: "정보나눔",   type: "info",   sort: 5 },
  event:   { slug: "event",   name: "이벤트",     type: "notice", sort: 6 },
};

function slugify(text: string, fallback: string): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
  return s || fallback;
}

function imgUrl(base: string, path: string | null | undefined): string | null {
  if (!path || !path.trim()) return null;
  return `${base}/${path.replace(/^\/+/, "")}`;
}

function clean(s: string | null | undefined): string {
  return (s ?? "").toString().trim();
}

function safeDate(v: any, fallback: Date = new Date()): Date {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === "string" && v && !v.startsWith("0000")) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return fallback;
}

function mapOrderStatus(odStatus: string): OrderStatus {
  const s = (odStatus ?? "").trim();
  // Korean status values (talmoschool.com)
  switch (s) {
    case "주문":   return "paid";
    case "입금":   return "paid";
    case "준비":   return "preparing";
    case "배송":   return "shipping";
    case "완료":   return "delivered";
    case "취소":   return "cancelled";
    case "환불":   return "refunded";
  }
  // English/legacy status values
  switch (s.toLowerCase()) {
    case "order":   return "paid";
    case "prepare": return "preparing";
    case "abroad":  return "shipping";
    case "done":    return "delivered";
    case "cancel":  return "cancelled";
    case "refund":  return "refunded";
    default:        return "pending";
  }
}

function mapPaymentMethod(settleCase: string): PaymentMethod {
  const s = (settleCase ?? "").toLowerCase().trim();
  if (s === "stripe" || s === "card" || s === "credit") return "card";
  if (s === "vbank" || s === "virtual") return "virtual_account";
  // 무통장 or anything else → bank_transfer
  return "bank_transfer";
}

function mapPaymentStatus(odStatus: string): PaymentStatus {
  const s = (odStatus ?? "").trim();
  if (s === "취소" || s === "환불" || s.toLowerCase() === "cancel" || s.toLowerCase() === "refund") return "cancelled";
  if (s === "" || s === "pending") return "pending";
  return "confirmed"; // 주문/입금/준비/배송/완료 = payment confirmed
}

export async function runGnuboardSync(): Promise<void> {
  const PG_URL = process.env.DATABASE_URL;
  const MYSQL_HOST = process.env.TALMO_MYSQL_HOST;
  const MYSQL_USER = process.env.TALMO_MYSQL_USER;
  const MYSQL_PASSWORD = process.env.TALMO_MYSQL_PASSWORD;
  const MYSQL_DATABASE = process.env.TALMO_MYSQL_DATABASE;
  const IMG_BASE = process.env.TALMO_IMAGE_BASE || "https://talmoschool.com/data/item";

  if (!PG_URL || !MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    console.log("[GnuSync] Missing env vars, skipping Gnuboard sync.");
    return;
  }

  const db = drizzle(PG_URL);
  const [{ count: userCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  if (Number(userCount) >= 100) {
    console.log(`[GnuSync] DB has ${userCount} users, skipping sync.`);
    return;
  }

  console.log("[GnuSync] Fresh DB detected. Starting full Gnuboard sync...");

  let my: mysql.Connection;
  try {
    my = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      connectTimeout: 30000,
    });
  } catch (e) {
    console.error("[GnuSync] MySQL connection failed:", e);
    return;
  }

  try {
    // ─── 1. Products & Categories ─────────────────────────────
    console.log("[GnuSync] Syncing categories & products...");
    const [catRows] = await my.query<any[]>(
      "SELECT ca_id, ca_name, ca_order FROM g5_shop_category WHERE ca_use=1 ORDER BY ca_order, ca_id"
    );
    const [itemRows] = await my.query<any[]>(`
      SELECT it_id, ca_id, it_name, it_basic, it_explan, it_cust_price, it_price,
             it_stock_qty, it_soldout, it_use, it_hit, it_order,
             it_img1, it_img2, it_img3, it_img4, it_img5,
             it_img6, it_img7, it_img8, it_img9, it_img10
      FROM g5_shop_item WHERE it_use=1 ORDER BY it_order, it_id
    `);
    const [optRows] = await my.query<any[]>(
      "SELECT it_id, io_id, io_price, io_stock_qty FROM g5_shop_item_option WHERE io_use=1 ORDER BY it_id, io_no"
    );
    console.log(`[GnuSync] MySQL: ${catRows.length} categories, ${itemRows.length} items, ${optRows.length} options`);

    const catIdMap = new Map<string, number>();
    const itemIdMap = new Map<string, number>(); // gnuboard it_id → new productId

    await db.transaction(async (tx) => {
      await tx.execute(sql`DELETE FROM \`cartItems\``);
      await tx.execute(sql`DELETE FROM \`wishlistItems\``);
      await tx.execute(sql`DELETE FROM \`priceAlerts\``);
      await tx.execute(sql`DELETE FROM \`restockAlerts\``);
      await tx.execute(sql`DELETE FROM \`productOptions\``);
      await tx.execute(sql`DELETE FROM \`products\``);
      await tx.execute(sql`DELETE FROM \`categories\``);
      await tx.execute(sql`ALTER TABLE \`categories\` AUTO_INCREMENT = 1`);
      await tx.execute(sql`ALTER TABLE \`products\` AUTO_INCREMENT = 1`);
      await tx.execute(sql`ALTER TABLE \`productOptions\` AUTO_INCREMENT = 1`);

      for (const c of catRows) {
        const slugBase = slugify(c.ca_name, `cat-${c.ca_id}`);
        const suffix = `-${c.ca_id}`;
        const slug = `${slugBase.slice(0, 100 - suffix.length)}${suffix}`;
        const [row] = await tx.insert(categories).values({
          name: String(c.ca_name).slice(0, 100),
          slug,
          sortOrder: Number(c.ca_order) || 0,
          isActive: 1,
        }).$returningId();
        catIdMap.set(String(c.ca_id), row.id);
      }
      console.log(`[GnuSync] Inserted ${catIdMap.size} categories`);

      let inserted = 0;
      for (const it of itemRows) {
        const catId = catIdMap.get(String(it.ca_id));
        if (!catId) continue;
        const imgs = [it.it_img1, it.it_img2, it.it_img3, it.it_img4, it.it_img5,
                      it.it_img6, it.it_img7, it.it_img8, it.it_img9, it.it_img10]
          .map((p: string | null) => imgUrl(IMG_BASE, p))
          .filter((x): x is string => !!x);
        const price = Number(it.it_cust_price) || Number(it.it_price) || 0;
        const sale = Number(it.it_price) || 0;
        const salePrice = sale > 0 && sale !== price ? sale : null;
        const slug = `${slugify(it.it_name || "", `item-${it.it_id}`)}-${it.it_id}`.slice(0, 250);
        const [row] = await tx.insert(products).values({
          itId: String(it.it_id),
          categoryId: catId,
          name: String(it.it_name || `상품 ${it.it_id}`).slice(0, 250),
          slug,
          description: it.it_basic ? String(it.it_basic) : null,
          content: it.it_explan ? String(it.it_explan) : null,
          price: price || sale || 0,
          salePrice,
          stock: Number(it.it_stock_qty) || 0,
          images: imgs.length ? imgs : null,
          thumbnail: imgs[0] || null,
          status: it.it_soldout == 1 ? "soldout" : "active",
          viewCount: Number(it.it_hit) || 0,
          sortOrder: Number(it.it_order) || 0,
          hashtags: null,
        }).$returningId();
        itemIdMap.set(String(it.it_id), row.id);
        inserted++;
      }
      console.log(`[GnuSync] Inserted ${inserted} products`);

      const optsByItem = new Map<string, any[]>();
      for (const o of optRows) {
        const k = String(o.it_id);
        if (!optsByItem.has(k)) optsByItem.set(k, []);
        optsByItem.get(k)!.push(o);
      }
      let optInserted = 0;
      for (const [itId, opts] of optsByItem) {
        const productId = itemIdMap.get(itId);
        if (!productId) continue;
        await tx.insert(productOptions).values({
          productId,
          name: "옵션",
          values: opts.map(o => ({ value: String(o.io_id), price: Number(o.io_price) || 0, stock: Number(o.io_stock_qty) || 0 })),
          sortOrder: 0,
          isRequired: 1,
        });
        optInserted++;
      }
      console.log(`[GnuSync] Inserted ${optInserted} option groups`);
    });

    // ─── 2. Members ───────────────────────────────────────────
    console.log("[GnuSync] Syncing members...");
    const [members] = await my.query<any[]>(`
      SELECT mb_id, mb_password, mb_name, mb_nick, mb_email, mb_hp, mb_tel,
             mb_level, mb_point, mb_datetime, mb_today_login
      FROM g5_member
      WHERE mb_leave_date='' AND mb_intercept_date=''
    `);
    console.log(`[GnuSync] ${members.length} members to import`);

    const userOpenIdToId = new Map<string, number>(); // gnuboard mb_id → new userId
    let usersInserted = 0;
    for (const m of members) {
      const mbId = clean(m.mb_id);
      if (!mbId) continue;
      const openId = `gnuboard_${mbId}`;
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.openId, openId)).limit(1);
      if (existing.length) {
        userOpenIdToId.set(mbId, existing[0].id);
        continue;
      }
      const email = clean(m.mb_email) || `${mbId}@imported.local`;
      const pwd = clean(m.mb_password);
      const pwdNorm = pwd.startsWith("$2y$") ? "$2a$" + pwd.slice(4) : pwd;
      const created = safeDate(m.mb_datetime);
      const [row] = await db.insert(users).values({
        openId,
        name: clean(m.mb_nick) || clean(m.mb_name) || mbId,
        email: email.slice(0, 320),
        password: pwdNorm || null,
        loginMethod: "gnuboard",
        role: Number(m.mb_level) >= 10 ? "admin" : "user",
        phone: (clean(m.mb_hp) || clean(m.mb_tel) || null)?.slice(0, 20) ?? null,
        points: Number(m.mb_point) || 0,
        createdAt: created,
        updatedAt: created,
        lastSignedIn: safeDate(m.mb_today_login, created),
      }).$returningId();
      userOpenIdToId.set(mbId, row.id);
      usersInserted++;
      if (usersInserted % 100 === 0) console.log(`  [GnuSync] ...${usersInserted} users`);
    }
    console.log(`[GnuSync] Inserted ${usersInserted} users`);

    const sysAdmin = await db.select({ id: users.id }).from(users).where(eq(users.openId, "system-admin")).limit(1);
    const fallbackUserId = sysAdmin[0]?.id ?? Array.from(userOpenIdToId.values())[0];

    // ─── 3. Boards / Posts / Comments ─────────────────────────
    if (!fallbackUserId) {
      console.warn("[GnuSync] No fallback user, skipping boards sync");
    } else {
      await db.transaction(async (tx) => {
        await tx.execute(sql`DELETE FROM "comments"`);
        await tx.execute(sql`DELETE FROM "posts"`);
        await tx.execute(sql`DELETE FROM "boards"`);
        await tx.execute(sql`ALTER SEQUENCE "boards_id_seq" RESTART WITH 1`);
        await tx.execute(sql`ALTER SEQUENCE "posts_id_seq" RESTART WITH 1`);
        await tx.execute(sql`ALTER SEQUENCE "comments_id_seq" RESTART WITH 1`);

        const boardSlugToId = new Map<string, number>();
        for (const cfg of Object.values(BOARD_MAP)) {
          const [row] = await tx.insert(boards).values({
            slug: cfg.slug, name: cfg.name, boardType: cfg.type, isActive: 1, sortOrder: cfg.sort,
          }).$returningId();
          boardSlugToId.set(cfg.slug, row.id);
        }

        let totalPosts = 0, totalComments = 0;
        for (const [key, cfg] of Object.entries(BOARD_MAP)) {
          const boardId = boardSlugToId.get(cfg.slug)!;
          let rows: any[];
          try {
            const [r] = await my.query<any[]>(`
              SELECT wr_id, wr_parent, wr_is_comment, wr_subject, wr_content,
                     mb_id, wr_datetime, wr_last, wr_hit, wr_good
              FROM g5_write_${key} ORDER BY wr_id
            `);
            rows = r;
          } catch { continue; }
          if (!rows.length) continue;

          const wrIdToPostId = new Map<number, number>();
          const postRows = rows.filter(r => Number(r.wr_is_comment) === 0);
          const cmtRows  = rows.filter(r => Number(r.wr_is_comment) === 1);

          for (const r of postRows) {
            const userId = userOpenIdToId.get(clean(r.mb_id)) ?? fallbackUserId;
            const created = safeDate(r.wr_datetime);
            const [ins] = await tx.insert(posts).values({
              boardId, userId,
              title: (clean(r.wr_subject) || "(제목 없음)").slice(0, 250),
              content: clean(r.wr_content),
              viewCount: Number(r.wr_hit) || 0,
              likeCount: Number(r.wr_good) || 0,
              isNotice: key === "notice" ? 1 : 0,
              createdAt: created,
              updatedAt: safeDate(r.wr_last, created),
            }).$returningId();
            wrIdToPostId.set(Number(r.wr_id), ins.id);
            totalPosts++;
          }
          for (const r of cmtRows) {
            const postId = wrIdToPostId.get(Number(r.wr_parent));
            if (!postId) continue;
            const userId = userOpenIdToId.get(clean(r.mb_id)) ?? fallbackUserId;
            const created = safeDate(r.wr_datetime);
            await tx.insert(comments).values({
              postId, userId,
              content: clean(r.wr_content),
              createdAt: created,
              updatedAt: safeDate(r.wr_last, created),
            });
            totalComments++;
          }
        }
        console.log(`[GnuSync] Boards done: ${totalPosts} posts, ${totalComments} comments`);
      });
    }

    // ─── 4. Orders + OrderItems + Payments + Shipments ────────
    console.log("[GnuSync] Syncing orders...");

    // 기존 주문 데이터 정리
    await db.execute(sql`DELETE FROM "shippingHistory"`);
    await db.execute(sql`DELETE FROM "shipments"`);
    await db.execute(sql`DELETE FROM "payments"`);
    await db.execute(sql`DELETE FROM "orderItems"`);
    await db.execute(sql`DELETE FROM "orders"`);
    await db.execute(sql`ALTER SEQUENCE "orders_id_seq" RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE "orderItems_id_seq" RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE "payments_id_seq" RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE "shipments_id_seq" RESTART WITH 1`);

    let [orderRows] = await my.query<any[]>(`
      SELECT od_id, mb_id, od_name, od_tel, od_hp,
             od_b_name, od_b_tel, od_b_hp,
             od_zip1, od_zip2, od_b_zip1, od_b_zip2,
             od_addr1, od_addr2, od_addr3,
             od_b_addr1, od_b_addr2, od_b_addr3,
             od_memo, od_shop_memo,
             od_cart_price, od_send_cost, od_cart_coupon,
             od_receipt_point,
             od_settle_case, od_receipt_price,
             od_status, od_time,
             od_invoice, od_delivery_company
      FROM g5_shop_order
      ORDER BY od_time
    `).catch((e: any) => { console.error("[GnuSync] g5_shop_order query failed:", e.message); return [[] as any[]]; });

    let [orderItemRows] = await my.query<any[]>(`
      SELECT od_id, it_id, it_name, ct_price, ct_qty, ct_option
      FROM g5_shop_cart
      WHERE od_id != ''
    `).catch((e: any) => { console.error("[GnuSync] g5_shop_cart query failed:", e.message); return [[] as any[]]; });

    // od_id 기준으로 주문 상품 그룹화
    const itemsByOrder = new Map<string, any[]>();
    for (const oi of orderItemRows) {
      const k = String(oi.od_id);
      if (!itemsByOrder.has(k)) itemsByOrder.set(k, []);
      itemsByOrder.get(k)!.push(oi);
    }

    // 운송사 캐시
    const carrierCache = new Map<string, number>(); // name → carrierId

    async function getOrCreateCarrier(name: string): Promise<number> {
      const key = name.slice(0, 100);
      if (carrierCache.has(key)) return carrierCache.get(key)!;
      const existing = await db.select({ id: shippingCarriers.id })
        .from(shippingCarriers)
        .where(eq(shippingCarriers.name, key))
        .limit(1);
      if (existing.length) {
        carrierCache.set(key, existing[0].id);
        return existing[0].id;
      }
      const code = slugify(key, `carrier-${Date.now()}`).slice(0, 50);
      const [row] = await db.insert(shippingCarriers).values({
        name: key,
        code,
        isActive: 1,
        sortOrder: 0,
      }).$returningId();
      carrierCache.set(key, row.id);
      return row.id;
    }

    let ordersInserted = 0, orderItemsInserted = 0, paymentsInserted = 0, shipmentsInserted = 0;
    const userTotalSpent = new Map<number, number>(); // userId → totalSpent

    for (const od of orderRows as any[]) {
      const odId = String(od.od_id);
      const mbId = clean(od.mb_id);
      const userId = userOpenIdToId.get(mbId) ?? fallbackUserId;
      if (!userId) continue;

      const recipientName = (clean(od.od_b_name) || clean(od.od_name) || "").slice(0, 50);
      const recipientPhone = (clean(od.od_b_hp) || clean(od.od_b_tel) || clean(od.od_hp) || clean(od.od_tel) || "000-0000-0000").slice(0, 20);
      const zipCode = (clean(od.od_b_zip1) + clean(od.od_b_zip2) || clean(od.od_zip1) + clean(od.od_zip2) || "00000").slice(0, 10);
      const address1 = (clean(od.od_b_addr1) || clean(od.od_addr1) || "주소 없음").slice(0, 255);
      const address2 = (clean(od.od_b_addr2) || clean(od.od_addr2) || clean(od.od_b_addr3) || clean(od.od_addr3) || undefined)?.slice(0, 255);
      const totalAmount = Math.max(0, Number(od.od_cart_price) || 0);
      const shippingFee = Math.max(0, Number(od.od_send_cost) || 0);
      const couponDiscount = Math.max(0, Number(od.od_cart_coupon) || 0);
      const pointsUsed = Math.max(0, Number(od.od_receipt_point) || 0);
      const pointsEarned = 0;
      const orderStatus = mapOrderStatus(clean(od.od_status));
      const createdAt = safeDate(od.od_time);
      const updatedAt = createdAt;
      const paidAt = ["paid","preparing","shipping","delivered"].includes(orderStatus) ? createdAt : null;
      const deliveredAt = orderStatus === "delivered" ? createdAt : null;

      // 주문번호: 그누보드의 od_id를 그대로 사용 (중복 방지)
      const orderNumber = `GNU-${odId}`.slice(0, 30);

      const [orderRow] = await db.insert(orders).values({
        userId,
        orderNumber,
        source: "gnuboard",
        status: orderStatus,
        totalAmount,
        discountAmount: couponDiscount,
        shippingFee,
        pointsUsed,
        pointsEarned,
        couponDiscount,
        recipientName: recipientName || "수신자",
        recipientPhone,
        zipCode,
        address1,
        address2,
        memo: clean(od.od_memo) || null,
        paidAt,
        deliveredAt,
        createdAt,
        updatedAt,
      }).$returningId();
      ordersInserted++;

      // 주문 상품 등록
      const ois = itemsByOrder.get(odId) ?? [];
      for (const oi of ois) {
        const gnuItId = String(oi.it_id);
        const productId = itemIdMap.get(gnuItId);
        // productId가 없어도 상품명은 저장 (상품이 삭제된 경우)
        const optionText = clean(oi.ct_option);

        await db.insert(orderItems).values({
          orderId: orderRow.id,
          productId: productId ?? null,
          productName: (clean(oi.it_name) || `상품 ${gnuItId}`).slice(0, 255),
          productThumbnail: null,
          price: Math.max(0, Number(oi.ct_price) || 0),
          quantity: Math.max(1, Number(oi.ct_qty) || 1),
          options: optionText ? { 옵션: optionText } : null,
        });
        orderItemsInserted++;
      }

      // 결제 등록
      const payMethod = mapPaymentMethod(clean(od.od_settle_case));
      const payStatus = mapPaymentStatus(clean(od.od_status));
      await db.insert(payments).values({
        orderId: orderRow.id,
        paymentMethod: payMethod,
        depositAmount: Math.max(0, Number(od.od_receipt_price) || totalAmount),
        depositorName: recipientName || null,
        status: payStatus,
        confirmedAt: payStatus === "confirmed" ? paidAt ?? createdAt : null,
        createdAt,
        updatedAt,
      });
      paymentsInserted++;

      // 배송 등록 (송장번호가 있을 때만)
      const trackingNum = clean(od.od_invoice);
      const carrierName = clean(od.od_delivery_company);
      if (trackingNum && trackingNum.length >= 8) {
        const carrierId = carrierName ? await getOrCreateCarrier(carrierName) : await getOrCreateCarrier("기타");
        const shipStatus =
          orderStatus === "delivered" ? "delivered" :
          orderStatus === "shipping"  ? "in_transit" :
          "pending";
        await db.insert(shipments).values({
          orderId: orderRow.id,
          carrierId,
          trackingNumber: trackingNum.slice(0, 100),
          status: shipStatus as any,
          shippingType: "domestic",
          shippedAt: paidAt ?? createdAt,
          actualDeliveryDate: deliveredAt,
          createdAt,
          updatedAt,
        });
        shipmentsInserted++;
      }

      // 총 구매액 누적 (delivered 상태만)
      if (orderStatus === "delivered" || orderStatus === "paid" || orderStatus === "preparing" || orderStatus === "shipping") {
        const prev = userTotalSpent.get(userId) ?? 0;
        userTotalSpent.set(userId, prev + totalAmount);
      }
    }

    // 회원 총 구매액 업데이트
    for (const [userId, spent] of userTotalSpent) {
      await db.execute(sql`UPDATE "users" SET "totalSpent" = ${spent} WHERE id = ${userId}`);
    }

    console.log(`[GnuSync] Orders: ${ordersInserted} orders, ${orderItemsInserted} items, ${paymentsInserted} payments, ${shipmentsInserted} shipments`);

    // ─── 5. Point History ──────────────────────────────────────
    console.log("[GnuSync] Syncing point history...");
    await db.execute(sql`DELETE FROM "pointHistory"`);
    await db.execute(sql`ALTER SEQUENCE "pointHistory_id_seq" RESTART WITH 1`);

    let [pointRows] = await my.query<any[]>(`
      SELECT po_id, mb_id, po_datetime, po_content, po_point,
             po_expire_date, po_expired, po_rel_table, po_rel_id
      FROM g5_point
      ORDER BY po_datetime, po_id
    `).catch(() => [[] as any[]]);

    let pointsInserted = 0;
    for (const p of pointRows as any[]) {
      const mbId = clean(p.mb_id);
      const userId = userOpenIdToId.get(mbId) ?? fallbackUserId;
      if (!userId) continue;

      const amount = Number(p.po_point) || 0;
      if (amount === 0) continue;

      const pointType: PointType = amount > 0 ? "earn" : "use";
      const expireRaw = clean(p.po_expire_date);
      const expiresAt = (expireRaw && !expireRaw.startsWith("0000"))
        ? safeDate(expireRaw, new Date(Date.now() + 365 * 86400000))
        : null;

      await db.insert(pointHistory).values({
        userId,
        amount,
        type: pointType,
        description: (clean(p.po_content) || (amount > 0 ? "포인트 적립" : "포인트 사용")).slice(0, 255),
        expiresAt,
        createdAt: safeDate(p.po_datetime),
      });
      pointsInserted++;
      if (pointsInserted % 500 === 0) console.log(`  [GnuSync] ...${pointsInserted} points`);
    }
    console.log(`[GnuSync] Inserted ${pointsInserted} point history records`);

    // ─── 6. Coupons + User Coupons ─────────────────────────────
    console.log("[GnuSync] Syncing coupons...");
    await db.execute(sql`DELETE FROM "userCoupons"`);
    await db.execute(sql`DELETE FROM "coupons"`);
    await db.execute(sql`ALTER SEQUENCE "coupons_id_seq" RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE "userCoupons_id_seq" RESTART WITH 1`);

    let [couponRows] = await my.query<any[]>(`
      SELECT cp_id, cp_name, cp_type, cp_discount,
             cp_min_price, cp_max_price,
             cp_start_date, cp_end_date, cp_limit, cp_status, cp_regdate
      FROM g5_shop_coupon
      ORDER BY cp_id
    `).catch(() => [[] as any[]]);

    let [couponMemberRows] = await my.query<any[]>(`
      SELECT cp_id, mb_id, cm_id, cm_use, cm_use_date
      FROM g5_shop_coupon_member
    `).catch(() => [[] as any[]]);

    const couponIdMap = new Map<string, number>(); // gnu cp_id → new couponId
    let couponsInserted = 0, userCouponsInserted = 0;

    const now = new Date();
    const far = new Date(now.getTime() + 365 * 86400000);

    for (const cp of couponRows as any[]) {
      const cpId = String(cp.cp_id);
      const cpType = String(cp.cp_type || "").toLowerCase();
      const discountType: DiscountType = (cpType === "p" || cpType === "percent" || cpType === "rate") ? "percent" : "fixed";
      const discountValue = Math.max(0, Number(cp.cp_discount) || 0);
      const startDate = safeDate(cp.cp_start_date, now);
      const endDate = safeDate(cp.cp_end_date, far);
      const totalQty = Number(cp.cp_limit) || -1;
      const isActive = Number(cp.cp_status) === 1 ? 1 : 0;
      const code = `GNU-CP-${cpId}`;

      const [row] = await db.insert(coupons).values({
        code,
        name: (clean(cp.cp_name) || `쿠폰 ${cpId}`).slice(0, 255),
        discountType,
        discountValue,
        minOrderAmount: Math.max(0, Number(cp.cp_min_price) || 0),
        maxDiscountAmount: cp.cp_max_price ? Math.max(0, Number(cp.cp_max_price)) : null,
        totalQuantity: totalQty,
        usedCount: 0,
        startDate,
        endDate,
        isActive,
        targetType: "all",
        assignType: "all",
        createdAt: safeDate(cp.cp_regdate, now),
      }).$returningId();
      couponIdMap.set(cpId, row.id);
      couponsInserted++;
    }
    console.log(`[GnuSync] Inserted ${couponsInserted} coupons`);

    // 회원 쿠폰 등록
    const membersByGnuCoupon = new Map<string, any[]>();
    for (const cm of couponMemberRows as any[]) {
      const k = String(cm.cp_id);
      if (!membersByGnuCoupon.has(k)) membersByGnuCoupon.set(k, []);
      membersByGnuCoupon.get(k)!.push(cm);
    }

    for (const [gnuCpId, members] of membersByGnuCoupon) {
      const couponId = couponIdMap.get(gnuCpId);
      if (!couponId) continue;
      for (const cm of members) {
        const mbId = clean(cm.mb_id);
        const userId = userOpenIdToId.get(mbId);
        if (!userId) continue;
        const isUsed = Number(cm.cm_use) === 1 ? 1 : 0;
        const usedAt = isUsed && cm.cm_use_date ? safeDate(cm.cm_use_date) : null;
        await db.insert(userCoupons).values({
          userId,
          couponId,
          isUsed,
          usedAt,
          createdAt: safeDate(cm.cm_use_date, now),
        });
        userCouponsInserted++;
      }
    }
    console.log(`[GnuSync] Inserted ${userCouponsInserted} user coupons`);

    await my.end();
    console.log("[GnuSync] ✅ Full Gnuboard sync complete.");
    console.log(`[GnuSync] Summary:
  - Categories: ${catIdMap.size}
  - Products:   ${itemIdMap.size}
  - Users:      ${usersInserted}
  - Orders:     ${ordersInserted}
  - Payments:   ${paymentsInserted}
  - Shipments:  ${shipmentsInserted}
  - Points:     ${pointsInserted}
  - Coupons:    ${couponsInserted}
  - UserCoupons:${userCouponsInserted}`);
  } catch (e) {
    console.error("[GnuSync] Error during sync:", e);
    try { await my.end(); } catch {}
  }
}

// ─── Orders-only sync (can be triggered manually, no user count check) ───
export async function syncOrdersFromGnuboard(): Promise<{ orders: number; items: number; payments: number; shipments: number }> {
  const PG_URL = process.env.DATABASE_URL;
  const MYSQL_HOST = process.env.TALMO_MYSQL_HOST;
  const MYSQL_USER = process.env.TALMO_MYSQL_USER;
  const MYSQL_PASSWORD = process.env.TALMO_MYSQL_PASSWORD;
  const MYSQL_DATABASE = process.env.TALMO_MYSQL_DATABASE;
  const IMG_BASE = process.env.TALMO_IMAGE_BASE || "https://talmoschool.com/data/item";

  if (!PG_URL || !MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error("Gnuboard 연동 환경변수가 설정되지 않았습니다.");
  }

  const db = drizzle(PG_URL);

  // ─ 1. 기존 사용자 매핑 (openId = 'gnuboard_${mb_id}')
  const pgUsers = await db.select({ id: users.id, openId: users.openId }).from(users).where(like(users.openId, "gnuboard_%"));
  const userOpenIdToId = new Map<string, number>();
  for (const u of pgUsers) {
    const mbId = (u.openId ?? "").replace(/^gnuboard_/, "");
    if (mbId) userOpenIdToId.set(mbId, u.id);
  }

  // fallback: system-admin 또는 첫번째 admin
  const fallbackRows = await db.select({ id: users.id }).from(users).where(eq(users.openId, "system-admin")).limit(1);
  const fallbackUserId: number | undefined = fallbackRows[0]?.id ?? Array.from(userOpenIdToId.values())[0];

  // ─ 2. 상품 매핑 (slug 마지막 segment = gnuboard it_id)
  const pgProducts = await db.select({ id: products.id, slug: products.slug }).from(products);
  const itemIdMap = new Map<string, number>();
  for (const p of pgProducts) {
    // slug 패턴: `...-${it_id}` – 마지막 segment 추출
    const parts = (p.slug ?? "").split("-");
    const gnuId = parts[parts.length - 1];
    if (gnuId) itemIdMap.set(gnuId, p.id);
  }

  let my: mysql.Connection;
  try {
    my = await mysql.createConnection({ host: MYSQL_HOST, user: MYSQL_USER, password: MYSQL_PASSWORD, database: MYSQL_DATABASE, connectTimeout: 30000 });
  } catch (e) {
    throw new Error(`MySQL 연결 실패: ${e}`);
  }

  let ordersInserted = 0, orderItemsInserted = 0, paymentsInserted = 0, shipmentsInserted = 0;

  try {
    // ─ 3. 기존 Gnuboard 주문 삭제
    const gnuOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.source as any, "gnuboard"));
    const gnuOrderIds = gnuOrders.map(o => o.id);
    if (gnuOrderIds.length > 0) {
      // 배송 이력 삭제 (shipment ID 먼저 조회)
      const gnuShipments = await db.select({ id: shipments.id }).from(shipments).where(inArray(shipments.orderId, gnuOrderIds));
      const gnuShipmentIds = gnuShipments.map(s => s.id);
      if (gnuShipmentIds.length > 0) {
        await db.delete(shippingHistory).where(inArray(shippingHistory.shipmentId, gnuShipmentIds));
      }
      await db.delete(shipments).where(inArray(shipments.orderId, gnuOrderIds));
      await db.delete(payments).where(inArray(payments.orderId, gnuOrderIds));
      await db.delete(orderItems).where(inArray(orderItems.orderId, gnuOrderIds));
      await db.delete(orders).where(inArray(orders.id, gnuOrderIds));
    }

    // ─ 4. 주문 목록 가져오기
    const [orderRows] = await my.query<any[]>(`
      SELECT od_id, mb_id, od_name, od_tel, od_hp,
             od_b_name, od_b_tel, od_b_hp,
             od_zip1, od_zip2, od_b_zip1, od_b_zip2,
             od_addr1, od_addr2, od_addr3,
             od_b_addr1, od_b_addr2, od_b_addr3,
             od_memo, od_shop_memo,
             od_cart_price, od_send_cost, od_cart_coupon,
             od_receipt_point,
             od_settle_case, od_receipt_price,
             od_status, od_time,
             od_invoice, od_delivery_company
      FROM g5_shop_order ORDER BY od_time
    `).catch((e: any) => { console.error("[GnuSync:Orders] g5_shop_order query failed:", e.message); return [[] as any[]]; });

    const [orderItemRows] = await my.query<any[]>(`
      SELECT od_id, it_id, it_name, ct_price, ct_qty, ct_option
      FROM g5_shop_cart
      WHERE od_id != ''
    `).catch((e: any) => { console.error("[GnuSync:Orders] g5_shop_cart query failed:", e.message); return [[] as any[]]; });

    const itemsByOrder = new Map<string, any[]>();
    for (const oi of orderItemRows) {
      const k = String(oi.od_id);
      if (!itemsByOrder.has(k)) itemsByOrder.set(k, []);
      itemsByOrder.get(k)!.push(oi);
    }

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

    const userTotalSpent = new Map<number, number>();

    for (const od of orderRows as any[]) {
      const odId = String(od.od_id);
      const mbId = clean(od.mb_id);
      const userId = userOpenIdToId.get(mbId) ?? fallbackUserId;
      if (!userId) continue;

      const recipientName = (clean(od.od_b_name) || clean(od.od_name) || "").slice(0, 50);
      const recipientPhone = (clean(od.od_b_hp) || clean(od.od_b_tel) || clean(od.od_hp) || clean(od.od_tel) || "000-0000-0000").slice(0, 20);
      const zipCode = (clean(od.od_b_zip1) + clean(od.od_b_zip2) || clean(od.od_zip1) + clean(od.od_zip2) || "00000").slice(0, 10);
      const address1 = (clean(od.od_b_addr1) || clean(od.od_addr1) || "주소 없음").slice(0, 255);
      const address2 = (clean(od.od_b_addr2) || clean(od.od_addr2) || clean(od.od_b_addr3) || clean(od.od_addr3) || undefined)?.slice(0, 255);
      const totalAmount = Math.max(0, Number(od.od_cart_price) || 0);
      const shippingFee = Math.max(0, Number(od.od_send_cost) || 0);
      const couponDiscount = Math.max(0, Number(od.od_cart_coupon) || 0);
      const pointsUsed = Math.max(0, Number(od.od_receipt_point) || 0);
      const pointsEarned = 0;
      const orderStatus = mapOrderStatus(clean(od.od_status));
      const createdAt = safeDate(od.od_time);
      const updatedAt = createdAt;
      const paidAt = ["paid","preparing","shipping","delivered"].includes(orderStatus) ? createdAt : null;
      const deliveredAt = orderStatus === "delivered" ? createdAt : null;
      const orderNumber = `GNU-${odId}`.slice(0, 30);

      const [orderRow] = await db.insert(orders).values({
        userId,
        orderNumber,
        source: "gnuboard",
        status: orderStatus,
        totalAmount,
        discountAmount: couponDiscount,
        shippingFee,
        pointsUsed,
        pointsEarned,
        couponDiscount,
        recipientName: recipientName || "수신자",
        recipientPhone,
        zipCode,
        address1,
        address2,
        memo: clean(od.od_memo) || null,
        paidAt,
        deliveredAt,
        createdAt,
        updatedAt,
      }).$returningId();
      ordersInserted++;

      const ois = itemsByOrder.get(odId) ?? [];
      for (const oi of ois) {
        const gnuItId = String(oi.it_id);
        const productId = itemIdMap.get(gnuItId);
        await db.insert(orderItems).values({
          orderId: orderRow.id,
          productId: productId ?? null,
          productName: (clean(oi.it_name) || `상품 ${gnuItId}`).slice(0, 255),
          productThumbnail: null,
          price: Math.max(0, Number(oi.ct_price) || 0),
          quantity: Math.max(1, Number(oi.ct_qty) || 1),
          options: clean(oi.ct_option) ? { 옵션: clean(oi.ct_option) } : null,
        });
        orderItemsInserted++;
      }

      const payMethod = mapPaymentMethod(clean(od.od_settle_case));
      const payStatus = mapPaymentStatus(clean(od.od_status));
      await db.insert(payments).values({
        orderId: orderRow.id,
        paymentMethod: payMethod,
        depositAmount: Math.max(0, Number(od.od_receipt_price) || totalAmount),
        depositorName: recipientName || null,
        status: payStatus,
        confirmedAt: payStatus === "confirmed" ? paidAt ?? createdAt : null,
        createdAt,
        updatedAt,
      });
      paymentsInserted++;

      const trackingNum = clean(od.od_invoice);
      const carrierName = clean(od.od_delivery_company);
      if (trackingNum && trackingNum.length >= 8) {
        const carrierId = carrierName ? await getOrCreateCarrier(carrierName) : await getOrCreateCarrier("기타");
        const shipStatus = orderStatus === "delivered" ? "delivered" : orderStatus === "shipping" ? "in_transit" : "pending";
        await db.insert(shipments).values({
          orderId: orderRow.id,
          carrierId,
          trackingNumber: trackingNum.slice(0, 100),
          status: shipStatus as any,
          shippingType: "domestic",
          shippedAt: paidAt ?? createdAt,
          actualDeliveryDate: deliveredAt,
          createdAt,
          updatedAt,
        });
        shipmentsInserted++;
      }

      if (["paid","preparing","shipping","delivered"].includes(orderStatus)) {
        const prev = userTotalSpent.get(userId) ?? 0;
        userTotalSpent.set(userId, prev + totalAmount);
      }
    }

    for (const [userId, spent] of userTotalSpent) {
      await db.execute(sql`UPDATE "users" SET "totalSpent" = ${spent} WHERE id = ${userId}`);
    }

    console.log(`[GnuSync:Orders] Done: ${ordersInserted} orders, ${orderItemsInserted} items, ${paymentsInserted} payments, ${shipmentsInserted} shipments`);
    await my.end();
    return { orders: ordersInserted, items: orderItemsInserted, payments: paymentsInserted, shipments: shipmentsInserted };
  } catch (e) {
    console.error("[GnuSync:Orders] Error:", e);
    try { await my.end(); } catch {}
    throw e;
  }
}
