import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { authMiddleware, adminMiddleware } from "../lib/auth";
import { CreateOrderBody, GetOrdersQueryParams, GetOrderParams, UpdateOrderStatusParams, UpdateOrderStatusBody } from "@workspace/api-zod";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import * as XLSX from "xlsx";
import multer from "multer";

const router: IRouter = Router();

const SMS_API_URL = "https://sms.bizservice.iwinv.kr/api/v2/send/";
const SMS_SECRET = (process.env.SMS_SECRET || "").trim();
const SMS_FROM = (process.env.SMS_FROM || "").trim();
const SMS_ADMIN_TO = (process.env.SMS_ADMIN_TO || "").split(",").map((v) => v.trim()).filter(Boolean);

async function sendSms(to: string[], text: string, title?: string) {
  if (!SMS_SECRET || !SMS_FROM || to.length === 0) return;
  const payload: any = {
    version: "1.0",
    from: SMS_FROM,
    to,
    text,
    date: null,
  };
  if (title) payload.title = title;
  const res = await fetch(SMS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      secret: SMS_SECRET,
    },
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => null);
}

router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const params = GetOrdersQueryParams.parse(req.query);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const queryParams: any[] = [];

    if (user.mb_level < 10) {
      whereClause += " AND o.mb_id = ?";
      queryParams.push(user.mb_id);
    }

    if (params.status) {
      whereClause += " AND o.od_status = ?";
      queryParams.push(params.status);
    }

    if ((params as any).search) {
      whereClause += " AND (o.od_id LIKE ? OR m.mb_name LIKE ? OR m.mb_6 LIKE ?)";
      const s = `%${(params as any).search}%`;
      queryParams.push(s, s, s);
    }

    if ((params as any).date_from) {
      whereClause += " AND o.od_time >= ?";
      queryParams.push((params as any).date_from + " 00:00:00");
    }

    if ((params as any).date_to) {
      whereClause += " AND o.od_time <= ?";
      queryParams.push((params as any).date_to + " 23:59:59");
    }

    if ((params as any).partner) {
      whereClause += " AND o.mb_id = ?";
      queryParams.push((params as any).partner);
    }

    if ((params as any).special_region === "true") {
      const cityParam = (params as any).special_city;
      const cities = cityParam ? [cityParam] : ["동두천", "의정부", "양주", "포천"];
      const conds = cities.map(() => "(o.od_b_addr1 LIKE ? OR o.od_b_addr2 LIKE ? OR o.od_b_addr3 LIKE ?)").join(" OR ");
      whereClause += ` AND (${conds})`;
      for (const city of cities) queryParams.push(`%${city}%`, `%${city}%`, `%${city}%`);
    }

    const countParams = [...queryParams];
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_shop_order o LEFT JOIN g5_member m ON o.mb_id = m.mb_id ${whereClause}`,
      countParams
    );
    const total = countRows[0].total;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.od_id, o.mb_id, o.od_status, o.od_receipt_price, o.od_memo, o.od_time,
        o.od_delivery_company, o.od_invoice,
        o.od_name, o.od_hp, o.od_email, o.od_send_cost,
        o.od_b_name, o.od_b_hp, o.od_b_addr1, o.od_b_addr2, o.od_b_addr3, o.od_b_zip1, o.od_b_zip2,
        m.mb_name, m.mb_6 as company_name, m.mb_7 as business_number, m.mb_hp as mb_hp
       FROM g5_shop_order o
       LEFT JOIN g5_member m ON o.mb_id = m.mb_id
       ${whereClause}
       ORDER BY o.od_id DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const orderIds = rows.map((r: any) => String(r.od_id));
    let itemsMap: Record<string, any[]> = {};
    if (orderIds.length > 0) {
      const [cartItems] = await pool.query<RowDataPacket[]>(
        `SELECT c.od_id, c.it_id, c.it_name, c.ct_qty, c.ct_price, c.ct_status,
          i.it_maker, i.it_notax
         FROM g5_shop_cart c
         LEFT JOIN g5_shop_item i ON c.it_id = i.it_id
         WHERE c.od_id IN (${orderIds.map(() => '?').join(',')})
         ORDER BY c.ct_id ASC`,
        orderIds
      );
      for (const item of cartItems) {
        const key = String(item.od_id);
        if (!itemsMap[key]) itemsMap[key] = [];
        itemsMap[key].push({
          it_id: item.it_id,
          it_name: item.it_name || "",
          ct_qty: Number(item.ct_qty) || 0,
          ct_price: Number(item.ct_price) || 0,
          ct_status: item.ct_status || "",
          it_maker: item.it_maker || "",
          it_notax: String(item.it_notax || "0"),
        });
      }
    }

    res.json({
      orders: rows.map((r: any) => {
        const odId = String(r.od_id);
        const items = itemsMap[odId] || [];
        return {
          od_id: odId,
          mb_id: r.mb_id,
          mb_name: r.mb_name || "",
          company_name: r.company_name || "",
          business_number: r.business_number || "",
          mb_hp: r.mb_hp || "",
          od_status: r.od_status || "주문접수",
          od_receipt_price: Number(r.od_receipt_price) || 0,
          od_send_cost: Number(r.od_send_cost) || 0,
          od_memo: r.od_memo || "",
          od_time: r.od_time || "",
          od_delivery_company: r.od_delivery_company || "",
          od_invoice_no: r.od_invoice || "",
          od_name: r.od_name || "",
          od_hp: r.od_hp || "",
          od_email: r.od_email || "",
          item_count: items.length,
          items,
          shipping: {
            name: r.od_b_name || "",
            hp: r.od_b_hp || "",
            addr1: r.od_b_addr1 || "",
            addr2: r.od_b_addr2 || "",
            addr3: r.od_b_addr3 || "",
            zip: (r.od_b_zip1 && r.od_b_zip2) ? `${r.od_b_zip1}${r.od_b_zip2}` : (r.od_b_zip1 || ""),
          },
        };
      }),
      total: Number(total),
      page,
      limit,
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetOrders error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/orders", authMiddleware, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const user = (req as any).user;

    const [memberRows] = await connection.query<RowDataPacket[]>(
      "SELECT mb_id, mb_name, mb_email, mb_hp, mb_level, mb_1 as addr FROM g5_member WHERE mb_id = ?",
      [user.mb_id]
    );
    if (memberRows.length === 0 || memberRows[0].mb_level < 2) {
      res.status(403).json({ error: "承認済みの会員のみ発注できます" });
      return;
    }

    const body = req.body;
    const items = body.items;
    const memo = body.memo || "";
    const adId = body.ad_id;
    const sendCost = Number(body.send_cost) || 0;
    const billName = body.bill_name || "";
    const billHp = body.bill_hp || "";
    const billEmail = body.bill_email || "";
    const couponNo = Number(body.coupon_no) || 0;
    const usePoint = Number(body.use_point) || 0;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "注文商品を選択してください" });
      return;
    }

    for (const item of items) {
      if (!item.it_id || typeof item.it_id !== "string") {
        res.status(400).json({ error: "商品情報が正しくありません" });
        return;
      }
      if (!item.qty || typeof item.qty !== "number" || item.qty < 1) {
        res.status(400).json({ error: "数量は1以上である必要があります" });
        return;
      }
    }

    const member = memberRows[0];
    await connection.beginTransaction();

    let totalPrice = 0;
    const validatedItems: { it_id: string; qty: number; price: number; name: string; prod: any }[] = [];

    for (const item of items) {
      const [prodRows] = await connection.query<RowDataPacket[]>(
        "SELECT it_id, it_name, it_price, it_sc_type, it_sc_method, it_sc_price, it_sc_minimum, it_sc_qty FROM g5_shop_item WHERE it_id = ? AND it_use = '1'",
        [item.it_id]
      );
      if (prodRows.length === 0) {
        await connection.rollback();
        res.status(400).json({ error: `商品 ${item.it_id} が見つかりません` });
        return;
      }
      const prod = prodRows[0];
      let serverPrice = Number(prod.it_price) || 0;

      const [boxOptRows] = await connection.query<RowDataPacket[]>(
        "SELECT io_price FROM g5_shop_item_option WHERE it_id = ? AND io_id LIKE '%박스%' AND io_use = '1' LIMIT 1",
        [item.it_id]
      );
      if (boxOptRows.length > 0) {
        serverPrice += Number(boxOptRows[0].io_price) || 0;
      }

      totalPrice += serverPrice * item.qty;
      validatedItems.push({ it_id: item.it_id, qty: item.qty, price: serverPrice, name: prod.it_name, prod });
    }

    const now = new Date();
    const nowStr = now.toISOString().slice(0, 19).replace("T", " ");
    const orderId = now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0") +
      String(Math.floor(Math.random() * 100000)).padStart(5, "0");

    let shipName = member.mb_name;
    let shipHp = member.mb_hp || "";
    let shipAddr1 = member.addr || "";
    let shipAddr2 = "";
    let shipAddr3 = "";
    let shipZip1 = "";
    let shipZip2 = "";

    if (adId) {
      const [addrRows] = await connection.query<RowDataPacket[]>(
        `SELECT * FROM g5_shop_order_address WHERE ad_id = ? AND mb_id = ?`, [adId, user.mb_id]
      );
      if (addrRows.length > 0) {
        const addr = addrRows[0];
        shipName = addr.ad_name || shipName;
        shipHp = addr.ad_hp || shipHp;
        shipAddr1 = addr.ad_addr1 || shipAddr1;
        shipAddr2 = addr.ad_addr2 || "";
        shipAddr3 = addr.ad_addr3 || "";
        shipZip1 = addr.ad_zip1 || "";
        shipZip2 = addr.ad_zip2 || "";
      }
    }

    const orderName = billName || member.mb_name;
    const orderHp = billHp || member.mb_hp || "";
    const orderEmail = billEmail || member.mb_email || "";

    let couponDiscount = 0;
    let couponRow: any = null;
    const today = now.slice(0, 10);

    if (couponNo > 0) {
      const [couponRows] = await connection.query<RowDataPacket[]>(
        "SELECT * FROM g5_shop_coupon WHERE cp_no = ? AND mb_id = ? AND od_id IS NULL",
        [couponNo, user.mb_id]
      );
      if (!couponRows.length) {
        await connection.rollback();
        res.status(400).json({ error: "利用できないクーポンです" });
        return;
      }
      couponRow = couponRows[0];
      if (couponRow.cp_end && couponRow.cp_end !== "0000-00-00" && couponRow.cp_end < today) {
        await connection.rollback();
        res.status(400).json({ error: "有効期限切れのクーポンです" });
        return;
      }
      if (Number(couponRow.cp_minimum) > 0 && totalPrice < Number(couponRow.cp_minimum)) {
        await connection.rollback();
        res.status(400).json({ error: `最低注文金額 ${Number(couponRow.cp_minimum).toLocaleString()}円以上の場合にクーポンを利用できます` });
        return;
      }
      if (Number(couponRow.cp_type) === 1) {
        couponDiscount = Math.floor(totalPrice * Number(couponRow.cp_price) / 100);
        const maxDiscount = Number(couponRow.cp_maximum);
        if (maxDiscount > 0 && couponDiscount > maxDiscount) couponDiscount = maxDiscount;
      } else {
        couponDiscount = Number(couponRow.cp_price);
        if (couponDiscount > totalPrice) couponDiscount = totalPrice;
      }
    }

    let actualUsePoint = 0;
    if (usePoint > 0) {
      const [memberPointRows] = await connection.query<RowDataPacket[]>(
        "SELECT mb_point FROM g5_member WHERE mb_id = ?",
        [user.mb_id]
      );
      const availablePoint = Number(memberPointRows[0]?.mb_point || 0);
      actualUsePoint = Math.min(usePoint, availablePoint);
      const afterCoupon = totalPrice + sendCost - couponDiscount;
      if (actualUsePoint > afterCoupon) actualUsePoint = afterCoupon;
      if (actualUsePoint < 0) actualUsePoint = 0;
    }

    const receiptPrice = Math.max(0, totalPrice + sendCost - couponDiscount - actualUsePoint);

    await connection.query<ResultSetHeader>(
      `INSERT INTO g5_shop_order (
        od_id, mb_id, od_name, od_email, od_hp, od_addr1,
        od_b_name, od_b_tel, od_b_hp, od_b_zip1, od_b_zip2, od_b_addr1, od_b_addr2, od_b_addr3,
        od_status, od_receipt_price, od_cart_price, od_cart_count,
        od_send_cost, od_memo, od_time, od_settle_case, od_test, od_gift_msg, od_bill_hp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '주문접수', ?, ?, ?, ?, ?, ?, '후불', '', '', ?)`,
      [
        orderId,
        user.mb_id, orderName, orderEmail, orderHp, member.addr || '',
        shipName, "", shipHp, shipZip1, shipZip2, shipAddr1, shipAddr2, shipAddr3,
        receiptPrice, totalPrice, validatedItems.length,
        sendCost, memo || "", nowStr, billHp
      ]
    );

    for (const vi of validatedItems) {
      await connection.query(
        `INSERT INTO g5_shop_cart (
          od_id, mb_id, it_id, it_name,
          it_sc_type, it_sc_method, it_sc_price, it_sc_minimum, it_sc_qty,
          ct_status, ct_price, ct_qty, ct_time, ct_ip,
          ct_send_cost, ct_point, cp_price, ct_point_use, ct_stock_use, ct_notax, ct_option,
          io_id, io_type, io_price, ct_direct, ct_select
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '주문', ?, ?, ?, '', '0', 0, 0, '', '', '', '', '', '', 0, '', '')`,
        [
          orderId, user.mb_id, vi.it_id, vi.name,
          vi.prod?.it_sc_type || '', vi.prod?.it_sc_method || '', vi.prod?.it_sc_price || 0, vi.prod?.it_sc_minimum || 0, vi.prod?.it_sc_qty || 0,
          vi.price, vi.qty, nowStr
        ]
      );
    }

    if (couponRow) {
      await connection.query(
        "UPDATE g5_shop_coupon SET od_id = ? WHERE cp_no = ?",
        [orderId, Number(couponRow.cp_no)]
      );
      await connection.query(
        `INSERT INTO g5_shop_coupon_log (cp_id, mb_id, od_id, cp_price, cl_datetime)
         VALUES (?, ?, ?, ?, ?)`,
        [couponRow.cp_id, user.mb_id, orderId, couponDiscount, nowStr]
      );
    }

    if (actualUsePoint > 0) {
      await connection.query(
        "UPDATE g5_member SET mb_point = mb_point - ? WHERE mb_id = ?",
        [actualUsePoint, user.mb_id]
      );
    }

    await connection.commit();

    const companyName = String(member.mb_6 || member.mb_name || user.mb_id);
    const partnerPhone = String(member.mb_hp || "");
    const adminText = `[ソウルモノ] 新規注文受付 ${orderId} / ${companyName} / ${receiptPrice.toLocaleString()}円`;
    const partnerText = `[ソウルモノ] ${companyName}様のご注文を受け付けました。注文番号 ${orderId}、金額 ${receiptPrice.toLocaleString()}円です。銀行振込のご入金後に処理いたします。`;
    await Promise.allSettled([
      partnerPhone ? sendSms([partnerPhone], partnerText, "ご注文のご案内") : Promise.resolve(null),
      SMS_ADMIN_TO.length ? sendSms(SMS_ADMIN_TO, adminText, "新規注文") : Promise.resolve(null),
    ]);

    res.status(201).json({
      od_id: orderId,
      mb_id: user.mb_id,
      od_status: "주문접수",
      od_receipt_price: receiptPrice,
      od_send_cost: sendCost,
      od_memo: memo || "",
      od_time: nowStr,
      item_count: validatedItems.length,
      coupon_discount: couponDiscount,
      point_used: actualUsePoint,
    });
  } catch (err: any) {
    await connection.rollback();
    req.log?.error({ err }, "CreateOrder error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  } finally {
    connection.release();
  }
});

router.get("/orders/partners", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.mb_level < 10) {
      res.status(403).json({ error: "管理者権限が必要です" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.mb_id, m.mb_name, m.mb_6 as company_name
       FROM g5_member m
       WHERE m.mb_level >= 2 AND m.mb_level < 10
         AND (m.mb_leave_date = '' OR m.mb_leave_date IS NULL)
       ORDER BY m.mb_6, m.mb_name`
    );
    res.json({
      partners: rows.map((r: any) => ({
        mb_id: r.mb_id,
        mb_name: r.mb_name || "",
        company_name: r.company_name || "",
      })),
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetOrderPartners error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/orders/export-shipping", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.mb_level < 10) {
      res.status(403).json({ error: "管理者権限が必要です" });
      return;
    }

    const statuses = ["주문접수", "처리중", "배송준비"];
    let whereClause = `WHERE o.od_status IN (${statuses.map(() => '?').join(',')})`;
    const queryParams: any[] = [...statuses];

    if (req.query.search) {
      whereClause += " AND (o.od_id LIKE ? OR m.mb_name LIKE ? OR m.mb_6 LIKE ?)";
      const s = `%${req.query.search}%`;
      queryParams.push(s, s, s);
    }
    if (req.query.date_from) {
      whereClause += " AND o.od_time >= ?";
      queryParams.push(req.query.date_from + " 00:00:00");
    }
    if (req.query.date_to) {
      whereClause += " AND o.od_time <= ?";
      queryParams.push(req.query.date_to + " 23:59:59");
    }
    if (req.query.partner) {
      whereClause += " AND o.mb_id = ?";
      queryParams.push(req.query.partner);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.od_id, o.mb_id, o.od_status, o.od_receipt_price, o.od_memo, o.od_time,
        o.od_name, o.od_hp, o.od_email, o.od_send_cost,
        o.od_b_name, o.od_b_hp, o.od_b_addr1, o.od_b_addr2, o.od_b_addr3, o.od_b_zip1, o.od_b_zip2,
        m.mb_name, m.mb_6 as company_name
       FROM g5_shop_order o
       LEFT JOIN g5_member m ON o.mb_id = m.mb_id
       ${whereClause}
       ORDER BY o.od_id DESC`,
      queryParams
    );

    const orderIds = rows.map((r: any) => String(r.od_id));
    let itemsMap: Record<string, any[]> = {};
    if (orderIds.length > 0) {
      const [cartItems] = await pool.query<RowDataPacket[]>(
        `SELECT c.od_id, c.it_id, c.it_name, c.ct_qty, c.ct_price, c.ct_status,
          c.ct_option, i.it_maker
         FROM g5_shop_cart c
         LEFT JOIN g5_shop_item i ON c.it_id = i.it_id
         WHERE c.od_id IN (${orderIds.map(() => '?').join(',')})
         ORDER BY c.ct_id ASC`,
        orderIds
      );
      for (const item of cartItems) {
        const key = String(item.od_id);
        if (!itemsMap[key]) itemsMap[key] = [];
        itemsMap[key].push({
          it_id: item.it_id,
          it_name: item.it_name || "",
          ct_qty: Number(item.ct_qty) || 0,
          ct_price: Number(item.ct_price) || 0,
          ct_option: item.ct_option || "",
          it_maker: item.it_maker || "",
        });
      }
    }

    const MAX_EXPORT_ROWS = 5000;
    if (rows.length > MAX_EXPORT_ROWS) {
      res.status(400).json({ error: `エクスポート可能な最大注文数(${MAX_EXPORT_ROWS}件)を超えています。日付範囲を絞り込んでください。` });
      return;
    }

    const sanitize = (v: any): string => {
      if (v == null) return "";
      const s = String(v);
      if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
      return s;
    };

    const HEADERS = [
      "상품주문번호", "주문번호", "수취인명", "택배사", "배송속성",
      "풀필먼트사(주문 기준)", "배송방법(구매자 요청)", "배송방법", "송장번호",
      "수취인연락처1", "수취인연락처2", "통합배송지", "배송메세지",
      "발송일", "판매채널", "구매자명", "구매자ID", "주문상태", "주문세부상태",
      "수량클레임 여부", "결제위치", "결제일", "상품번호", "상품명", "상품종류",
      "반품안심케어", "옵션정보", "옵션관리코드", "수량", "옵션가격", "상품가격",
      "최종 상품별 할인액", "최초 상품별 할인액", "판매자 부담 할인액",
      "최종 상품별 총 주문금액", "최초 상품별 총 주문금액", "사은품",
      "발주확인일", "발송기한", "발송처리일", "송장출력일",
      "배송비 형태", "배송비 묶음번호", "배송비 유형", "배송비 합계",
      "제주/도서 추가배송비", "배송비 할인액",
      "판매자 상품코드", "판매자 내부코드1", "판매자 내부코드2",
      "기본배송지", "상세배송지", "구매자연락처", "우편번호", "출고지",
      "결제수단", "네이버페이 주문관리 수수료", "매출연동 수수료", "정산예정금액",
      "개인통관고유부호", "주문일시", "배송희망일", "구독신청회차", "구독진행회차",
      "구독배송희망일", "판매옵션정보"
    ];

    const excelRows: any[][] = [HEADERS];

    for (const r of rows) {
      const odId = String(r.od_id);
      const items = itemsMap[odId] || [];
      const zip = (r.od_b_zip1 && r.od_b_zip2) ? `${r.od_b_zip1}${r.od_b_zip2}` : (r.od_b_zip1 || "");
      const fullAddr = [r.od_b_addr1, r.od_b_addr2, r.od_b_addr3].filter(Boolean).join(" ");
      const addr1 = r.od_b_addr1 || "";
      const addr2 = [r.od_b_addr2, r.od_b_addr3].filter(Boolean).join(" ");
      const sendCost = Number(r.od_send_cost) || 0;

      const buildRow = (item: any | null, isFirst: boolean) => {
        const row: any[] = new Array(66).fill("");
        row[0] = sanitize(odId);
        row[1] = sanitize(odId);
        row[2] = isFirst ? sanitize(r.od_b_name) : "";
        row[3] = "CJ대한통운";
        row[4] = "일반배송";
        row[6] = "택배,등기,소포";
        row[7] = "택배,등기,소포";
        row[8] = "";
        row[9] = isFirst ? sanitize(r.od_b_hp) : "";
        row[11] = isFirst ? sanitize(fullAddr) : "";
        row[12] = isFirst ? sanitize(r.od_memo) : "";
        row[15] = isFirst ? sanitize(r.mb_name || r.od_name) : "";
        row[16] = isFirst ? sanitize(r.mb_id) : "";
        row[17] = "발송대기";
        row[19] = "N";
        if (item) {
          row[22] = sanitize(item.it_id);
          row[23] = sanitize(item.it_name);
          row[26] = sanitize(item.ct_option);
          row[28] = item.ct_qty;
          row[29] = 0;
          row[30] = item.ct_price;
        }
        row[44] = isFirst ? sendCost : 0;
        row[50] = isFirst ? sanitize(addr1) : "";
        row[51] = isFirst ? sanitize(addr2) : "";
        row[52] = isFirst ? sanitize(r.od_hp || r.od_b_hp) : "";
        row[53] = isFirst ? sanitize(zip) : "";
        row[60] = isFirst ? sanitize(r.od_time) : "";
        return row;
      };

      if (items.length === 0) {
        excelRows.push(buildRow(null, true));
      } else {
        for (let i = 0; i < items.length; i++) {
          excelRows.push(buildRow(items[i], i === 0));
        }
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(excelRows);

    ws['!cols'] = HEADERS.map((h) => ({ wch: Math.max(h.length * 2, 12) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "발송처리");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `配送依頼_${today}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.document");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(Buffer.from(buf));
  } catch (err: any) {
    req.log?.error({ err }, "ExportShipping error");
    res.status(500).json({ error: "Excel作成中にエラーが発生しました" });
  }
});

const shippingUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/orders/import-shipping", authMiddleware, shippingUpload.single("file"), async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.mb_level < 10) {
      res.status(403).json({ error: "管理者権限が必要です" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "ファイルを選択してください" });
      return;
    }

    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (rows.length < 2) {
      res.status(400).json({ error: "データがありません" });
      return;
    }

    const headers = rows[0].map((h: any) => String(h || "").trim());
    const orderNoIdx = headers.indexOf("주문번호");
    const carrierIdx = headers.indexOf("택배사");
    const invoiceIdx = headers.indexOf("송장번호");

    if (orderNoIdx === -1) {
      res.status(400).json({ error: "Excelに「注文番号」列がありません" });
      return;
    }
    if (invoiceIdx === -1) {
      res.status(400).json({ error: "Excelに「送り状番号」列がありません" });
      return;
    }

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const odId = String(row[orderNoIdx] || "").replace(/^'/, "").trim();
      const carrier = carrierIdx >= 0 ? String(row[carrierIdx] || "").replace(/^'/, "").trim() : "CJ대한통운";
      const invoice = String(row[invoiceIdx] || "").replace(/^'/, "").trim();

      if (!odId) continue;
      if (!invoice) {
        skipped++;
        continue;
      }

      try {
        const [existing] = await pool.query<RowDataPacket[]>(
          "SELECT od_id, od_status FROM g5_shop_order WHERE od_id = ?",
          [odId]
        );
        if (existing.length === 0) {
          errors.push(`注文番号 ${odId}: 存在しません`);
          continue;
        }

        await pool.query(
          "UPDATE g5_shop_order SET od_status = ?, od_delivery_company = ?, od_invoice = ? WHERE od_id = ?",
          ["배송중", carrier, invoice, odId]
        );
        await pool.query(
          "UPDATE g5_shop_cart SET ct_status = ? WHERE od_id = ?",
          ["배송중", odId]
        );
        updated++;
      } catch (e: any) {
        errors.push(`주문번호 ${odId}: ${e.message}`);
      }
    }

    res.json({
      message: `${updated}件の配送処理が完了しました${skipped > 0 ? `、${skipped}件は送り状番号がないためスキップしました` : ""}`,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    req.log?.error({ err }, "ImportShipping error");
    res.status(500).json({ error: "Excel処理中にエラーが発生しました" });
  }
});

router.patch("/orders/batch-status", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.mb_level < 10) {
      res.status(403).json({ error: "管理者権限が必要です" });
      return;
    }

    const { order_ids, status, delivery_company, invoice_numbers } = req.body;
    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      res.status(400).json({ error: "注文を選択してください" });
      return;
    }
    if (!status) {
      res.status(400).json({ error: "ステータスを選択してください" });
      return;
    }

    let updated = 0;
    for (const odId of order_ids) {
      const updates: string[] = ["od_status = ?"];
      const params: any[] = [status];

      if (delivery_company) {
        updates.push("od_delivery_company = ?");
        params.push(delivery_company);
      }

      const invoiceNo = invoice_numbers?.[String(odId)];
      if (invoiceNo) {
        updates.push("od_invoice = ?");
        params.push(invoiceNo);
      }

      params.push(String(odId));
      await pool.query(
        `UPDATE g5_shop_order SET ${updates.join(", ")} WHERE od_id = ?`,
        params
      );
      await pool.query(
        "UPDATE g5_shop_cart SET ct_status = ? WHERE od_id = ?",
        [status, String(odId)]
      );
      updated++;
    }

    res.json({ message: `${updated}件の注文を処理しました`, updated });
  } catch (err: any) {
    req.log?.error({ err }, "BatchUpdateOrderStatus error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/orders/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = GetOrderParams.parse(req.params);

    let query = `SELECT o.*, m.mb_name, m.mb_6 as company_name
       FROM g5_shop_order o
       LEFT JOIN g5_member m ON o.mb_id = m.mb_id
       WHERE o.od_id = ?`;
    const params: any[] = [id];

    if (user.mb_level < 10) {
      query += " AND o.mb_id = ?";
      params.push(user.mb_id);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    if (rows.length === 0) {
      res.status(404).json({ error: "注文が見つかりません" });
      return;
    }

    const order = rows[0];
    const [items] = await pool.query<RowDataPacket[]>(
      `SELECT c.ct_id, c.it_id, c.it_name, c.ct_qty, c.ct_price, c.ct_status, i.it_notax
       FROM g5_shop_cart c
       LEFT JOIN g5_shop_item i ON c.it_id = i.it_id
       WHERE c.od_id = ?`,
      [id]
    );

    res.json({
      od_id: String(order.od_id),
      mb_id: order.mb_id,
      mb_name: order.mb_name || "",
      company_name: order.company_name || "",
      od_status: order.od_status || "주문접수",
      od_receipt_price: Number(order.od_receipt_price) || 0,
      od_send_cost: Number(order.od_send_cost) || 0,
      od_memo: order.od_memo || "",
      od_time: order.od_time || "",
      od_delivery_company: order.od_delivery_company || "",
      od_invoice_no: order.od_invoice || "",
      od_name: order.od_name || "",
      od_email: order.od_email || "",
      od_hp: order.od_hp || "",
      shipping: {
        name: order.od_b_name || "",
        hp: order.od_b_hp || "",
        addr1: order.od_b_addr1 || "",
        addr2: order.od_b_addr2 || "",
        addr3: order.od_b_addr3 || "",
        zip: (order.od_b_zip1 && order.od_b_zip2) ? `${order.od_b_zip1}${order.od_b_zip2}` : (order.od_b_zip1 || ""),
      },
      items: items.map((i: any) => ({
        it_id: i.it_id,
        it_name: i.it_name || "",
        ct_qty: Number(i.ct_qty) || 0,
        ct_price: Number(i.ct_price) || 0,
        ct_status: i.ct_status || "",
        it_notax: String(i.it_notax || "0"),
      })),
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetOrder error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.patch("/orders/:id/status", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.mb_level < 10) {
      res.status(403).json({ error: "管理者権限が必要です" });
      return;
    }

    const paramsParsed = UpdateOrderStatusParams.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: "正しい注文番号を入力してください" });
      return;
    }
    const { id } = paramsParsed.data;

    const bodyParsed = UpdateOrderStatusBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "正しいステータス情報を入力してください" });
      return;
    }
    const body = bodyParsed.data;

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT od_id FROM g5_shop_order WHERE od_id = ?",
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "注文が見つかりません" });
      return;
    }

    const updates: string[] = ["od_status = ?"];
    const params: any[] = [body.status];

    if (body.delivery_company !== undefined) {
      updates.push("od_delivery_company = ?");
      params.push(body.delivery_company);
    }
    if (body.invoice_no !== undefined) {
      updates.push("od_invoice = ?");
      params.push(body.invoice_no);
    }

    params.push(id);
    await pool.query(
      `UPDATE g5_shop_order SET ${updates.join(", ")} WHERE od_id = ?`,
      params
    );

    await pool.query(
      "UPDATE g5_shop_cart SET ct_status = ? WHERE od_id = ?",
      [body.status, id]
    );

    // ── 구매완료 시 포인트 적립 ─────────────────────────────
    if (body.status === "구매완료") {
      try {
        const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
        // 주문의 회원과 상품 정보 조회
        const [orderRows] = await pool.query<RowDataPacket[]>(
          `SELECT o.mb_id, o.od_receipt_price,
                  c.it_id, c.ct_qty, c.ct_price
           FROM g5_shop_order o
           JOIN g5_shop_cart c ON c.od_id = o.od_id
           WHERE o.od_id = ?`,
          [id]
        );
        if (orderRows.length > 0 && orderRows[0].mb_id) {
          const mbId: string = orderRows[0].mb_id;
          // 상품별 포인트 계산: it_point_type=1→고정금액, 2→가격의 %
          let totalPointEarn = 0;
          const itIds = [...new Set((orderRows as any[]).map(r => r.it_id))];
          const ph = itIds.map(() => "?").join(",");
          const [itemRows] = await pool.query<RowDataPacket[]>(
            `SELECT it_id, it_price, it_point, it_point_type FROM g5_shop_item WHERE it_id IN (${ph})`,
            itIds
          );
          const itemMap = new Map((itemRows as any[]).map(r => [r.it_id, r]));
          for (const row of (orderRows as any[])) {
            const item = itemMap.get(row.it_id);
            if (!item) continue;
            const pt = Number(item.it_point) || 0;
            const ptType = String(item.it_point_type || "2");
            const qty = Number(row.ct_qty) || 1;
            const price = Number(row.ct_price) || Number(item.it_price) || 0;
            let earn = 0;
            if (ptType === "1") earn = pt * qty;                    // 고정금액
            else if (ptType === "2") earn = Math.floor(price * qty * (pt / 100)); // %
            totalPointEarn += earn;
          }
          if (totalPointEarn > 0) {
            const [mRows] = await pool.query<RowDataPacket[]>(
              "SELECT mb_point FROM g5_member WHERE mb_id = ?", [mbId]
            );
            const current = Number((mRows as any[])[0]?.mb_point) || 0;
            const newBal = current + totalPointEarn;
            await pool.query("UPDATE g5_member SET mb_point = ? WHERE mb_id = ?", [newBal, mbId]);
            await pool.query(
              `INSERT INTO g5_point (mb_id, po_datetime, po_content, po_point, po_use_point, po_expired, po_expire_date, po_mb_point, po_rel_table, po_rel_id, po_rel_action)
               VALUES (?, ?, ?, ?, 0, 0, '9999-12-31', ?, '#order', ?, '구매완료')`,
              [mbId, nowStr, `구매완료 적립 (주문번호: ${id})`, totalPointEarn, newBal, id]
            );
          }
        }
      } catch (pointErr: any) {
        // 포인트 적립 실패해도 주문 상태 변경은 완료로 처리
        req.log?.warn({ err: pointErr }, "구매완료 포인트 적립 실패 (무시)");
      }
    }

    const [updated] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, m.mb_name, m.mb_6 as company_name
       FROM g5_shop_order o
       LEFT JOIN g5_member m ON o.mb_id = m.mb_id
       WHERE o.od_id = ?`,
      [id]
    );
    const order = updated[0];

    res.json({
      od_id: String(order.od_id),
      mb_id: order.mb_id,
      mb_name: order.mb_name || "",
      company_name: order.company_name || "",
      od_status: order.od_status || "주문접수",
      od_receipt_price: Number(order.od_receipt_price) || 0,
      od_memo: order.od_memo || "",
      od_time: order.od_time || "",
      od_delivery_company: order.od_delivery_company || "",
      od_invoice_no: order.od_invoice || "",
    });
  } catch (err: any) {
    req.log?.error({ err }, "UpdateOrderStatus error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// ─── Batch Delete Orders ──────────────────────────────────────────────────────
router.delete("/orders/batch-delete", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { order_ids } = req.body;
    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      res.status(400).json({ error: "削除する注文を選択してください" });
      return;
    }
    const ph = order_ids.map(() => "?").join(",");
    await pool.query(`DELETE FROM g5_shop_cart WHERE od_id IN (${ph})`, order_ids);
    await pool.query(`DELETE FROM g5_shop_order WHERE od_id IN (${ph})`, order_ids);
    res.json({ success: true, deleted: order_ids.length });
  } catch (err: any) {
    req.log?.error({ err }, "BatchDeleteOrders error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

export default router;
