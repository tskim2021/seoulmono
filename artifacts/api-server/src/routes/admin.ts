import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { authMiddleware, adminMiddleware } from "../lib/auth";
import { UpdateOrderStatusBody, UpdateOrderStatusParams, ApproveMemberParams, RejectMemberParams, GetMembersQueryParams } from "@workspace/api-zod";
import type { RowDataPacket } from "mysql2";
import path from "path";
import fs from "fs";
import { issueCouponToMember } from "./coupons";

const router: IRouter = Router();

const uploadDir = path.resolve(process.cwd(), "uploads/business-license");

router.get("/admin/pending-members", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT mb_id, mb_name, mb_email, mb_hp, mb_level, mb_datetime,
        mb_1 as company_address, mb_2 as business_license_file,
        mb_6 as company_name, mb_7 as business_number, mb_8 as representative,
        mb_9 as business_type, mb_10 as business_category
       FROM g5_member
       WHERE mb_level = 1 AND (mb_leave_date = '' OR mb_leave_date IS NULL)
       ORDER BY mb_datetime DESC`
    );

    res.json({
      members: rows.map((r: any) => ({
        mb_id: r.mb_id,
        mb_name: r.mb_name || "",
        mb_email: r.mb_email || "",
        mb_hp: r.mb_hp || "",
        mb_level: r.mb_level,
        mb_datetime: r.mb_datetime || "",
        company_name: r.company_name || "",
        business_number: r.business_number || "",
        representative: r.representative || "",
        business_type: r.business_type || "",
        business_category: r.business_category || "",
        company_address: r.company_address || "",
        business_license_file: r.business_license_file || "",
        is_approved: false,
      })),
      total: rows.length,
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetPendingMembers error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/admin/members", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const params = GetMembersQueryParams.parse(req.query);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const offset = (page - 1) * limit;

    const [countRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM g5_member WHERE (mb_leave_date = '' OR mb_leave_date IS NULL) AND mb_level < 10"
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT mb_id, mb_name, mb_email, mb_hp, mb_level, mb_datetime,
        mb_1 as company_address, mb_2 as business_license_file,
        mb_6 as company_name, mb_7 as business_number, mb_8 as representative,
        mb_9 as business_type, mb_10 as business_category
       FROM g5_member
       WHERE (mb_leave_date = '' OR mb_leave_date IS NULL) AND mb_level < 10
       ORDER BY mb_datetime DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      members: rows.map((r: any) => ({
        mb_id: r.mb_id,
        mb_name: r.mb_name || "",
        mb_email: r.mb_email || "",
        mb_hp: r.mb_hp || "",
        mb_level: r.mb_level,
        mb_datetime: r.mb_datetime || "",
        company_name: r.company_name || "",
        business_number: r.business_number || "",
        representative: r.representative || "",
        business_type: r.business_type || "",
        business_category: r.business_category || "",
        company_address: r.company_address || "",
        business_license_file: r.business_license_file || "",
        is_approved: r.mb_level >= 2,
      })),
      total,
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetMembers error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.post("/admin/members/:id/approve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = ApproveMemberParams.parse(req.params);
    await pool.query("UPDATE g5_member SET mb_level = 2 WHERE mb_id = ? AND mb_level = 1", [id]);

    try {
      const [cfRows] = await pool.query<RowDataPacket[]>("SELECT cf_6 FROM g5_config LIMIT 1");
      const signupCouponId = Number(cfRows[0]?.cf_6 || 0);
      if (signupCouponId > 0) {
        await issueCouponToMember(signupCouponId, id);
      }
    } catch {}

    res.json({ message: "회원이 승인되었습니다" });
  } catch (err: any) {
    req.log?.error({ err }, "ApproveMember error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.post("/admin/members/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = RejectMemberParams.parse(req.params);
    await pool.query("UPDATE g5_member SET mb_level = 0 WHERE mb_id = ?", [id]);
    res.json({ message: "회원 가입이 거절되었습니다" });
  } catch (err: any) {
    req.log?.error({ err }, "RejectMember error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.patch("/orders/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = UpdateOrderStatusParams.parse(req.params);
    const body = UpdateOrderStatusBody.parse(req.body);

    const updateFields: string[] = ["od_status = ?"];
    const updateParams: any[] = [body.status];

    if (body.delivery_company) {
      updateFields.push("od_delivery_company = ?");
      updateParams.push(body.delivery_company);
    }
    if (body.invoice_no) {
      updateFields.push("od_invoice = ?");
      updateParams.push(body.invoice_no);
    }

    updateParams.push(id);
    await pool.query(
      `UPDATE g5_shop_order SET ${updateFields.join(", ")} WHERE od_id = ?`,
      updateParams
    );

    await pool.query(
      "UPDATE g5_shop_cart SET ct_status = ? WHERE od_id = ?",
      [body.status, id]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, m.mb_name, m.mb_6 as company_name,
        (SELECT COUNT(*) FROM g5_shop_cart c WHERE c.od_id = o.od_id) as item_count
       FROM g5_shop_order o
       LEFT JOIN g5_member m ON o.mb_id = m.mb_id
       WHERE o.od_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "주문을 찾을 수 없습니다" });
      return;
    }
    const r = rows[0];
    res.json({
      od_id: r.od_id,
      mb_id: r.mb_id,
      mb_name: r.mb_name || "",
      company_name: r.company_name || "",
      od_status: r.od_status || "",
      od_receipt_price: Number(r.od_receipt_price) || 0,
      od_memo: r.od_memo || "",
      od_time: r.od_time || "",
      item_count: Number(r.item_count) || 0,
    });
  } catch (err: any) {
    req.log?.error({ err }, "UpdateOrderStatus error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/admin/dashboard", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [totalOrders] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_shop_order"
    );
    const [pendingOrders] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_shop_order WHERE od_status = '주문접수'"
    );
    const [processingOrders] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_shop_order WHERE od_status IN ('처리중', '배송준비')"
    );
    const [completedOrders] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_shop_order WHERE od_status = '배송완료'"
    );
    const [pendingMembers] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_member WHERE mb_level = 1 AND (mb_leave_date = '' OR mb_leave_date IS NULL)"
    );
    const [totalMembers] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_member WHERE (mb_leave_date = '' OR mb_leave_date IS NULL) AND mb_level >= 2 AND mb_level < 10"
    );
    const [recentOrders] = await pool.query<RowDataPacket[]>(
      `SELECT o.od_id, o.mb_id, o.od_status, o.od_receipt_price, o.od_memo, o.od_time,
        m.mb_name, m.mb_6 as company_name,
        (SELECT COUNT(*) FROM g5_shop_cart c WHERE c.od_id = o.od_id) as item_count
       FROM g5_shop_order o
       LEFT JOIN g5_member m ON o.mb_id = m.mb_id
       ORDER BY o.od_id DESC
       LIMIT 10`
    );

    const [recentNotices] = await pool.query<RowDataPacket[]>(
      `SELECT wr_id, wr_subject, wr_name, wr_datetime, wr_hit, wr_comment
       FROM g5_write_notice WHERE wr_is_comment = 0
       ORDER BY wr_num, wr_reply LIMIT 5`
    );

    const [recentQna] = await pool.query<RowDataPacket[]>(
      `SELECT q.wr_id, q.wr_subject, q.wr_name, q.mb_id, q.wr_datetime, q.wr_comment,
        m.mb_6 as company_name
       FROM g5_write_qna q
       LEFT JOIN g5_member m ON q.mb_id = m.mb_id
       WHERE q.wr_is_comment = 0
       ORDER BY q.wr_num, q.wr_reply LIMIT 5`
    );

    const [unansweredQna] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_write_qna WHERE wr_is_comment = 0 AND wr_comment = 0"
    );

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [partnerSettlement] = await pool.query<RowDataPacket[]>(
      `SELECT o.mb_id, m.mb_name, m.mb_6 as company_name,
        COUNT(*) as order_count,
        SUM(o.od_receipt_price) as total_amount,
        SUM(o.od_send_cost) as total_shipping
       FROM g5_shop_order o
       LEFT JOIN g5_member m ON o.mb_id = m.mb_id
       WHERE DATE(o.od_time) >= ? AND DATE(o.od_time) <= ?
       GROUP BY o.mb_id, m.mb_name, m.mb_6
       ORDER BY total_amount DESC`,
      [monthStart, monthEnd]
    );

    const [topBuyers] = await pool.query<RowDataPacket[]>(
      `SELECT o.mb_id, m.mb_name, m.mb_6 as company_name,
        COUNT(*) as order_count,
        SUM(o.od_receipt_price) as total_amount,
        MAX(o.od_time) as last_order_time
       FROM g5_shop_order o
       LEFT JOIN g5_member m ON o.mb_id = m.mb_id
       WHERE DATE(o.od_time) >= ? AND DATE(o.od_time) <= ?
         AND (m.mb_level IS NULL OR m.mb_level < 10)
         AND o.od_status NOT IN ('주문취소', '반품')
       GROUP BY o.mb_id, m.mb_name, m.mb_6
       ORDER BY total_amount DESC
       LIMIT 10`,
      [monthStart, monthEnd]
    );

    const [topBuyersAllTime] = await pool.query<RowDataPacket[]>(
      `SELECT o.mb_id, m.mb_name, m.mb_6 as company_name,
        COUNT(*) as order_count,
        SUM(o.od_receipt_price) as total_amount,
        MAX(o.od_time) as last_order_time
       FROM g5_shop_order o
       LEFT JOIN g5_member m ON o.mb_id = m.mb_id
       WHERE (m.mb_level IS NULL OR m.mb_level < 10)
         AND o.od_status NOT IN ('주문취소', '반품')
       GROUP BY o.mb_id, m.mb_name, m.mb_6
       ORDER BY total_amount DESC
       LIMIT 10`
    );

    // 월별 구매 내역 (최근 12개월)
    const [monthlyOrders] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(od_time, '%Y-%m') as month,
              COUNT(*) as order_count,
              SUM(od_receipt_price) as total_amount
       FROM g5_shop_order
       WHERE od_time >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
         AND od_status NOT IN ('주문취소', '반품')
       GROUP BY DATE_FORMAT(od_time, '%Y-%m')
       ORDER BY month ASC`
    );

    // 월별 회원가입 내역 (최근 12개월)
    const [monthlyMembers] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(mb_datetime, '%Y-%m') as month,
              COUNT(*) as count
       FROM g5_member
       WHERE mb_datetime >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
         AND mb_level < 10
         AND (mb_leave_date = '' OR mb_leave_date IS NULL)
       GROUP BY DATE_FORMAT(mb_datetime, '%Y-%m')
       ORDER BY month ASC`
    );

    const regionCities = ["포천", "양주", "동두천", "의정부"];
    const regionCounts = await Promise.all(
      regionCities.map(async (city) => {
        const [rows] = await pool.query<RowDataPacket[]>(
          `SELECT COUNT(*) as cnt FROM g5_shop_order
           WHERE od_b_addr1 LIKE ? OR od_b_addr2 LIKE ? OR od_b_addr3 LIKE ?`,
          [`%${city}%`, `%${city}%`, `%${city}%`]
        );
        return { city, count: Number((rows[0] as any).cnt) || 0 };
      })
    );

    res.json({
      total_orders: Number(totalOrders[0].cnt),
      pending_orders: Number(pendingOrders[0].cnt),
      processing_orders: Number(processingOrders[0].cnt),
      completed_orders: Number(completedOrders[0].cnt),
      pending_members: Number(pendingMembers[0].cnt),
      total_members: Number(totalMembers[0].cnt),
      monthly_orders: monthlyOrders.map((r: any) => ({
        month: String(r.month),
        order_count: Number(r.order_count) || 0,
        total_amount: Number(r.total_amount) || 0,
      })),
      monthly_members: monthlyMembers.map((r: any) => ({
        month: String(r.month),
        count: Number(r.count) || 0,
      })),
      recent_orders: recentOrders.map((r: any) => ({
        od_id: String(r.od_id),
        mb_id: r.mb_id,
        mb_name: r.mb_name || "",
        company_name: r.company_name || "",
        od_status: r.od_status || "주문접수",
        od_receipt_price: Number(r.od_receipt_price) || 0,
        od_memo: r.od_memo || "",
        od_time: r.od_time || "",
        item_count: Number(r.item_count) || 0,
      })),
      unanswered_qna: Number(unansweredQna[0].cnt),
      region_orders: regionCounts,
      recent_notices: recentNotices.map((r: any) => ({
        wr_id: r.wr_id,
        wr_subject: r.wr_subject || "",
        wr_name: r.wr_name || "",
        wr_datetime: r.wr_datetime || "",
        wr_hit: Number(r.wr_hit) || 0,
        wr_comment: Number(r.wr_comment) || 0,
      })),
      recent_qna: recentQna.map((r: any) => ({
        wr_id: r.wr_id,
        wr_subject: r.wr_subject || "",
        wr_name: r.wr_name || "",
        mb_id: r.mb_id || "",
        company_name: r.company_name || "",
        wr_datetime: r.wr_datetime || "",
        wr_comment: Number(r.wr_comment) || 0,
      })),
      settlement_month: `${now.getFullYear()}년 ${now.getMonth() + 1}월`,
      partner_settlement: partnerSettlement.map((r: any) => ({
        mb_id: r.mb_id,
        mb_name: r.mb_name || "",
        company_name: r.company_name || "",
        order_count: Number(r.order_count) || 0,
        total_amount: Number(r.total_amount) || 0,
        total_shipping: Number(r.total_shipping) || 0,
      })),
      top_buyers: topBuyers.map((r: any) => ({
        mb_id: r.mb_id,
        mb_name: r.mb_name || r.mb_id || "탈퇴회원",
        company_name: r.company_name || "",
        order_count: Number(r.order_count) || 0,
        total_amount: Number(r.total_amount) || 0,
        last_order_time: r.last_order_time || "",
      })),
      top_buyers_all_time: topBuyersAllTime.map((r: any) => ({
        mb_id: r.mb_id,
        mb_name: r.mb_name || r.mb_id || "탈퇴회원",
        company_name: r.company_name || "",
        order_count: Number(r.order_count) || 0,
        total_amount: Number(r.total_amount) || 0,
        last_order_time: r.last_order_time || "",
      })),
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetDashboard error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 매출통계 기간별 조회
router.get("/admin/sales-stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const start = (req.query.start as string) || "";
    const end = (req.query.end as string) || "";
    if (!start || !end) {
      res.status(400).json({ error: "start, end 날짜를 입력하세요" });
      return;
    }

    const [summary] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(od_receipt_price), 0) as total_amount,
        COALESCE(SUM(od_send_cost), 0) as total_shipping,
        COALESCE(SUM(CASE WHEN od_status NOT IN ('주문취소','반품') THEN od_receipt_price ELSE 0 END), 0) as net_amount,
        SUM(CASE WHEN od_status NOT IN ('주문취소','반품') THEN 1 ELSE 0 END) as net_count,
        SUM(CASE WHEN od_status = '주문취소' THEN 1 ELSE 0 END) as cancelled_count,
        COUNT(DISTINCT mb_id) as unique_customers
       FROM g5_shop_order
       WHERE DATE(od_time) >= ? AND DATE(od_time) <= ?`,
      [start, end]
    );

    const [byDay] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(od_time) as day,
              COUNT(*) as order_count,
              COALESCE(SUM(CASE WHEN od_status NOT IN ('주문취소','반품') THEN od_receipt_price ELSE 0 END), 0) as amount
       FROM g5_shop_order
       WHERE DATE(od_time) >= ? AND DATE(od_time) <= ?
       GROUP BY DATE(od_time)
       ORDER BY day ASC`,
      [start, end]
    );

    const r = summary[0];
    res.json({
      order_count: Number(r.order_count) || 0,
      total_amount: Number(r.total_amount) || 0,
      net_amount: Number(r.net_amount) || 0,
      net_count: Number(r.net_count) || 0,
      cancelled_count: Number(r.cancelled_count) || 0,
      unique_customers: Number(r.unique_customers) || 0,
      by_day: byDay.map((d: any) => ({
        day: String(d.day).slice(0, 10),
        order_count: Number(d.order_count) || 0,
        amount: Number(d.amount) || 0,
      })),
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetSalesStats error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.delete("/admin/members/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const memberId = req.params.id;
    const adminId = (req as any).user?.mb_id;
    if (memberId === adminId) {
      res.status(400).json({ error: "자기 자신은 삭제할 수 없습니다" });
      return;
    }
    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT mb_level FROM g5_member WHERE mb_id = ?`, [memberId]
    );
    if (!result.length) {
      res.status(404).json({ error: "회원을 찾을 수 없습니다" });
      return;
    }
    if (Number(result[0].mb_level) >= 10) {
      res.status(400).json({ error: "관리자 계정은 삭제할 수 없습니다" });
      return;
    }
    await pool.query(`DELETE FROM g5_member WHERE mb_id = ?`, [memberId]);
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "DeleteMember error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.post("/admin/members/batch-delete", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { member_ids } = req.body;
    if (!Array.isArray(member_ids) || member_ids.length === 0) {
      res.status(400).json({ error: "삭제할 회원을 선택해주세요" });
      return;
    }
    const adminId = (req as any).user?.mb_id;
    const filtered = member_ids.filter((id: string) => id !== adminId);
    if (filtered.length === 0) {
      res.status(400).json({ error: "삭제할 수 있는 회원이 없습니다" });
      return;
    }
    const placeholders = filtered.map(() => "?").join(",");
    await pool.query(
      `DELETE FROM g5_member WHERE mb_id IN (${placeholders}) AND mb_level < 10`,
      filtered
    );
    res.json({ success: true, deleted: filtered.length });
  } catch (err: any) {
    req.log?.error({ err }, "BatchDeleteMembers error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/admin/points", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const search = (req.query.search as string) || "";
    const page = Number(req.query.page) || 1;
    const limit = 30;
    const offset = (page - 1) * limit;

    let where = "WHERE mb_level >= 2 AND mb_level < 10";
    const params: any[] = [];
    if (search) {
      where += " AND (mb_id LIKE ? OR mb_name LIKE ? OR mb_6 LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_member ${where}`, params
    );
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT mb_id, mb_name, mb_6 as company_name, mb_point, mb_datetime
       FROM g5_member ${where}
       ORDER BY mb_point DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      members: rows.map((m: any) => ({
        mb_id: m.mb_id,
        mb_name: m.mb_name || "",
        company_name: m.company_name || "",
        mb_point: Number(m.mb_point || 0),
        mb_datetime: m.mb_datetime || "",
      })),
      total: Number(countRows[0].total),
      page,
      limit,
    });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/admin/members/:mb_id/points", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { mb_id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const [countRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM g5_point WHERE mb_id = ?", [mb_id]
    );
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT po_id, po_datetime, po_content, po_point, po_use_point, po_mb_point, po_expired
       FROM g5_point WHERE mb_id = ?
       ORDER BY po_id DESC LIMIT ? OFFSET ?`,
      [mb_id, limit, offset]
    );
    const [member] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id, mb_name, mb_6 as company_name, mb_point FROM g5_member WHERE mb_id = ?",
      [mb_id]
    );

    res.json({
      member: member[0] ? {
        mb_id: member[0].mb_id,
        mb_name: member[0].mb_name || "",
        company_name: member[0].company_name || "",
        mb_point: Number(member[0].mb_point || 0),
      } : null,
      history: rows.map((r: any) => ({
        po_id: Number(r.po_id),
        po_datetime: r.po_datetime || "",
        po_content: r.po_content || "",
        po_point: Number(r.po_point || 0),
        po_use_point: Number(r.po_use_point || 0),
        po_mb_point: Number(r.po_mb_point || 0),
        po_expired: Number(r.po_expired || 0),
      })),
      total: Number(countRows[0].total),
      page,
      limit,
    });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.post("/admin/members/:mb_id/points", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { mb_id } = req.params;
    const { point, content } = req.body;
    const pointNum = Number(point);
    if (!pointNum || !content) {
      res.status(400).json({ error: "포인트와 내용을 입력해주세요" });
      return;
    }

    const [memberRows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_point FROM g5_member WHERE mb_id = ?", [mb_id]
    );
    if (!memberRows[0]) {
      res.status(404).json({ error: "회원을 찾을 수 없습니다" });
      return;
    }
    const currentPoint = Number(memberRows[0].mb_point || 0);
    const newPoint = currentPoint + pointNum;
    if (newPoint < 0) {
      res.status(400).json({ error: `차감 포인트가 보유 포인트(${currentPoint}P)를 초과합니다` });
      return;
    }

    await pool.query("UPDATE g5_member SET mb_point = ? WHERE mb_id = ?", [newPoint, mb_id]);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    await pool.query(
      `INSERT INTO g5_point (mb_id, po_datetime, po_content, po_point, po_use_point, po_mb_point, po_expired, po_expire_date, po_rel_table, po_rel_id, po_rel_action)
       VALUES (?, ?, ?, ?, ?, ?, 0, '0000-00-00', '', '', '')`,
      [mb_id, now, content, pointNum > 0 ? pointNum : 0, pointNum < 0 ? Math.abs(pointNum) : 0, newPoint]
    );

    res.json({ success: true, new_point: newPoint });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/admin/business-license/:filename", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "파일을 찾을 수 없습니다" });
      return;
    }

    res.sendFile(filePath);
  } catch (err: any) {
    req.log?.error({ err }, "GetBusinessLicense error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 최저가 도전 상품 목록 조회
router.get("/admin/lowest-items", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, it_name, it_price, it_cust_price, it_img1, ca_id, it_use, filter1
       FROM g5_shop_item WHERE filter1='12' ORDER BY it_order ASC, it_time DESC`
    );
    res.json({ items: rows });
  } catch (err: any) {
    req.log?.error({ err }, "AdminLowestItems error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 상품 검색 (최저가 도전 추가용)
router.get("/admin/items/search", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const q = (req.query.q as string || "").trim();
    if (!q) { res.json({ items: [] }); return; }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, it_name, it_price, it_cust_price, it_img1, ca_id, filter1
       FROM g5_shop_item WHERE it_use='1' AND it_name LIKE ? AND it_img1 != ''
       ORDER BY it_hit DESC LIMIT 20`,
      [`%${q}%`]
    );
    res.json({ items: rows });
  } catch (err: any) {
    req.log?.error({ err }, "AdminItemSearch error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 최저가 도전 상품 추가
router.post("/admin/lowest-items/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id } = req.params;
    await pool.query("UPDATE g5_shop_item SET filter1='12' WHERE it_id=?", [it_id]);
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminAddLowest error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 최저가 도전 상품 제거
router.delete("/admin/lowest-items/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id } = req.params;
    await pool.query("UPDATE g5_shop_item SET filter1='0' WHERE it_id=? AND filter1='12'", [it_id]);
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminRemoveLowest error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

export default router;
