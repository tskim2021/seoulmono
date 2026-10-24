import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { authMiddleware, adminMiddleware } from "../lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generateCouponId(): string {
  return randomBytes(16).toString("hex");
}

async function issueCouponToMember(czId: number, mbId: string, connection?: any): Promise<string> {
  const db = connection || pool;
  const [zones] = await db.query<RowDataPacket[]>(
    "SELECT * FROM g5_shop_coupon_zone WHERE cz_id = ?",
    [czId]
  );
  if (!zones.length) throw new Error("쿠폰 종류를 찾을 수 없습니다");
  const zone = zones[0];

  const cpId = generateCouponId();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowStr = now.toISOString().slice(0, 19).replace("T", " ");

  let cpStart = todayStr;
  let cpEnd = zone.cz_period_date && zone.cz_period_date !== "0000-00-00"
    ? zone.cz_period_date
    : (zone.cz_end && zone.cz_end !== "0000-00-00" ? zone.cz_end : "2099-12-31");

  if (Number(zone.cz_period) > 0) {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + Number(zone.cz_period));
    cpEnd = endDate.toISOString().slice(0, 10);
  }

  await db.query(
    `INSERT INTO g5_shop_coupon
      (cp_id, cp_subject, mb_id, cz_id, cp_start, cp_end,
       cp_price, cp_type, cp_method, cp_trunc, cp_minimum, cp_maximum, cp_target, cp_datetime)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?)`,
    [
      cpId,
      zone.cz_subject,
      mbId,
      czId,
      cpStart,
      cpEnd,
      Number(zone.cp_price) || 0,
      Number(zone.cp_type) || 0,
      Number(zone.cp_method) || 0,
      Number(zone.cp_trunc) || 0,
      Number(zone.cp_minimum) || 0,
      Number(zone.cp_maximum) || 0,
      nowStr,
    ]
  );
  return cpId;
}

export { issueCouponToMember };

router.get("/admin/coupon-zones", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cz_id, cz_subject, cp_type, cp_price, cp_minimum, cp_maximum,
              cz_start, cz_end, cz_period, cz_period_date, cz_datetime,
              (SELECT COUNT(*) FROM g5_shop_coupon c WHERE c.cz_id = z.cz_id) as issued_count,
              (SELECT COUNT(*) FROM g5_shop_coupon c WHERE c.cz_id = z.cz_id AND c.od_id IS NOT NULL) as used_count
       FROM g5_shop_coupon_zone z
       ORDER BY cz_id DESC`
    );
    res.json({
      zones: rows.map((z: any) => ({
        cz_id: Number(z.cz_id),
        cz_subject: z.cz_subject || "",
        cp_type: Number(z.cp_type),
        cp_price: Number(z.cp_price),
        cp_minimum: Number(z.cp_minimum),
        cp_maximum: Number(z.cp_maximum),
        cz_start: z.cz_start || "",
        cz_end: z.cz_end || "",
        cz_period: Number(z.cz_period),
        cz_period_date: z.cz_period_date || "",
        cz_datetime: z.cz_datetime || "",
        issued_count: Number(z.issued_count),
        used_count: Number(z.used_count),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.post("/admin/coupon-zones", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { cz_subject, cp_type, cp_price, cp_minimum, cp_maximum, cz_period, cz_period_date, cz_start, cz_end } = req.body;
    if (!cz_subject) {
      res.status(400).json({ error: "쿠폰명을 입력해주세요" });
      return;
    }
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO g5_shop_coupon_zone
        (cz_subject, cp_type, cp_price, cp_minimum, cp_maximum,
         cz_period, cz_period_date, cz_start, cz_end, cz_datetime,
         cz_type, cz_download, cp_method, cp_trunc, cp_target, cp_target2)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2, 0, 0, 0, '', '')`,
      [
        cz_subject,
        Number(cp_type) || 0,
        Number(cp_price) || 0,
        Number(cp_minimum) || 0,
        Number(cp_maximum) || 0,
        Number(cz_period) || 0,
        cz_period_date || "0000-00-00",
        cz_start || "0000-00-00",
        cz_end || "0000-00-00",
        now,
      ]
    );
    res.status(201).json({ cz_id: result.insertId });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.put("/admin/coupon-zones/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const czId = Number(req.params.id);
    const { cz_subject, cp_type, cp_price, cp_minimum, cp_maximum, cz_period, cz_period_date, cz_start, cz_end } = req.body;
    if (!cz_subject) {
      res.status(400).json({ error: "쿠폰명을 입력해주세요" });
      return;
    }
    await pool.query(
      `UPDATE g5_shop_coupon_zone SET
        cz_subject = ?, cp_type = ?, cp_price = ?,
        cp_minimum = ?, cp_maximum = ?,
        cz_period = ?, cz_period_date = ?, cz_start = ?, cz_end = ?
       WHERE cz_id = ?`,
      [
        cz_subject,
        Number(cp_type) || 0,
        Number(cp_price) || 0,
        Number(cp_minimum) || 0,
        Number(cp_maximum) || 0,
        Number(cz_period) || 0,
        cz_period_date || "0000-00-00",
        cz_start || "0000-00-00",
        cz_end || "0000-00-00",
        czId,
      ]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.delete("/admin/coupon-zones/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const czId = Number(req.params.id);
    const [issued] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_shop_coupon WHERE cz_id = ? AND od_id IS NOT NULL",
      [czId]
    );
    if (Number(issued[0].cnt) > 0) {
      res.status(400).json({ error: "이미 사용된 쿠폰이 있어 삭제할 수 없습니다" });
      return;
    }
    await pool.query("DELETE FROM g5_shop_coupon WHERE cz_id = ? AND od_id IS NULL", [czId]);
    await pool.query("DELETE FROM g5_shop_coupon_zone WHERE cz_id = ?", [czId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.post("/admin/coupon-zones/:id/issue", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const czId = Number(req.params.id);
    const { mb_ids } = req.body;
    if (!Array.isArray(mb_ids) || mb_ids.length === 0) {
      res.status(400).json({ error: "발급할 회원을 선택해주세요" });
      return;
    }
    const issued: string[] = [];
    const failed: string[] = [];
    for (const mbId of mb_ids) {
      try {
        await issueCouponToMember(czId, mbId);
        issued.push(mbId);
      } catch {
        failed.push(mbId);
      }
    }
    res.json({ issued: issued.length, failed: failed.length });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/admin/coupons", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;
    const offset = (page - 1) * limit;
    const czId = req.query.cz_id ? Number(req.query.cz_id) : null;
    const mbId = req.query.mb_id as string | undefined;
    const used = req.query.used;

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (czId) { where += " AND c.cz_id = ?"; params.push(czId); }
    if (mbId) { where += " AND c.mb_id LIKE ?"; params.push(`%${mbId}%`); }
    if (used === "1") { where += " AND c.od_id IS NOT NULL"; }
    else if (used === "0") { where += " AND c.od_id IS NULL"; }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_shop_coupon c ${where}`,
      params
    );
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.cp_no, c.cp_id, c.cp_subject, c.mb_id, c.cz_id,
              c.cp_start, c.cp_end, c.cp_price, c.cp_type, c.cp_minimum,
              c.od_id, c.cp_datetime,
              m.mb_name, m.mb_6 as company_name
       FROM g5_shop_coupon c
       LEFT JOIN g5_member m ON c.mb_id = m.mb_id
       ${where}
       ORDER BY c.cp_no DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const today = new Date().toISOString().slice(0, 10);

    res.json({
      coupons: rows.map((c: any) => ({
        cp_no: Number(c.cp_no),
        cp_id: c.cp_id,
        cp_subject: c.cp_subject || "",
        mb_id: c.mb_id || "",
        mb_name: c.mb_name || "",
        company_name: c.company_name || "",
        cz_id: Number(c.cz_id),
        cp_start: c.cp_start || "",
        cp_end: c.cp_end || "",
        cp_price: Number(c.cp_price),
        cp_type: Number(c.cp_type),
        cp_minimum: Number(c.cp_minimum),
        od_id: c.od_id ? String(c.od_id) : null,
        cp_datetime: c.cp_datetime || "",
        is_expired: c.cp_end && c.cp_end !== "0000-00-00" && c.cp_end < today,
      })),
      total: Number(countRows[0].total),
      page,
      limit,
    });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.delete("/admin/coupons/:no", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const cpNo = Number(req.params.no);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT od_id FROM g5_shop_coupon WHERE cp_no = ?",
      [cpNo]
    );
    if (!rows.length) {
      res.status(404).json({ error: "쿠폰을 찾을 수 없습니다" });
      return;
    }
    if (rows[0].od_id) {
      res.status(400).json({ error: "이미 사용된 쿠폰은 삭제할 수 없습니다" });
      return;
    }
    await pool.query("DELETE FROM g5_shop_coupon WHERE cp_no = ?", [cpNo]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/my/coupons", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const today = new Date().toISOString().slice(0, 10);
    const showAll = req.query.all === "1";

    let where = "WHERE c.mb_id = ? AND c.od_id IS NULL";
    if (!showAll) {
      where += ` AND (c.cp_end = '0000-00-00' OR c.cp_end >= '${today}')`;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.cp_no, c.cp_id, c.cp_subject, c.cp_start, c.cp_end,
              c.cp_price, c.cp_type, c.cp_minimum, c.cp_maximum, c.cp_datetime
       FROM g5_shop_coupon c
       ${where}
       ORDER BY c.cp_no DESC`,
      [user.mb_id]
    );

    res.json({
      coupons: rows.map((c: any) => ({
        cp_no: Number(c.cp_no),
        cp_subject: c.cp_subject || "",
        cp_start: c.cp_start || "",
        cp_end: c.cp_end || "",
        cp_price: Number(c.cp_price),
        cp_type: Number(c.cp_type),
        cp_minimum: Number(c.cp_minimum),
        cp_maximum: Number(c.cp_maximum),
        cp_datetime: c.cp_datetime || "",
        is_expired: c.cp_end && c.cp_end !== "0000-00-00" && c.cp_end < today,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/my/coupon/validate", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const cpNo = Number(req.query.cp_no);
    const orderTotal = Number(req.query.order_total) || 0;

    if (!cpNo) {
      res.status(400).json({ error: "쿠폰 번호가 필요합니다" });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM g5_shop_coupon WHERE cp_no = ? AND mb_id = ? AND od_id IS NULL`,
      [cpNo, user.mb_id]
    );

    if (!rows.length) {
      res.status(404).json({ error: "사용 가능한 쿠폰이 없습니다" });
      return;
    }

    const coupon = rows[0];
    if (coupon.cp_end && coupon.cp_end !== "0000-00-00" && coupon.cp_end < today) {
      res.status(400).json({ error: "만료된 쿠폰입니다" });
      return;
    }
    if (Number(coupon.cp_minimum) > 0 && orderTotal < Number(coupon.cp_minimum)) {
      res.status(400).json({
        error: `최소 주문금액 ${Number(coupon.cp_minimum).toLocaleString()}원 이상일 때 사용 가능합니다`,
      });
      return;
    }

    let discount = 0;
    if (Number(coupon.cp_type) === 1) {
      discount = Math.floor(orderTotal * Number(coupon.cp_price) / 100);
      const maxDiscount = Number(coupon.cp_maximum);
      if (maxDiscount > 0 && discount > maxDiscount) discount = maxDiscount;
    } else {
      discount = Number(coupon.cp_price);
      if (discount > orderTotal) discount = orderTotal;
    }

    res.json({
      cp_no: Number(coupon.cp_no),
      cp_subject: coupon.cp_subject || "",
      cp_price: Number(coupon.cp_price),
      cp_type: Number(coupon.cp_type),
      cp_minimum: Number(coupon.cp_minimum),
      cp_maximum: Number(coupon.cp_maximum),
      discount,
    });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/my/points", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const page = Number(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const [countRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM g5_point WHERE mb_id = ?", [user.mb_id]
    );
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT po_id, po_datetime, po_content, po_point, po_use_point, po_mb_point
       FROM g5_point WHERE mb_id = ?
       ORDER BY po_id DESC LIMIT ? OFFSET ?`,
      [user.mb_id, limit, offset]
    );
    const [memberRows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_point FROM g5_member WHERE mb_id = ?", [user.mb_id]
    );

    res.json({
      current_point: Number(memberRows[0]?.mb_point || 0),
      history: rows.map((r: any) => ({
        po_id: Number(r.po_id),
        po_datetime: r.po_datetime || "",
        po_content: r.po_content || "",
        po_point: Number(r.po_point || 0),
        po_use_point: Number(r.po_use_point || 0),
        po_mb_point: Number(r.po_mb_point || 0),
      })),
      total: Number(countRows[0].total),
      page,
      limit,
    });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

export default router;
