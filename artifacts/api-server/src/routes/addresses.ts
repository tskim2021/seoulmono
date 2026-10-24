import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { authMiddleware } from "../lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

const router: IRouter = Router();

router.get("/addresses", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ad_id, mb_id, ad_subject, ad_default, ad_name, ad_tel, ad_hp,
              ad_zip1, ad_zip2, ad_addr1, ad_addr2, ad_addr3, ad_jibeon
       FROM g5_shop_order_address WHERE mb_id = ? ORDER BY ad_default DESC, ad_id DESC`,
      [user.mb_id]
    );

    if (rows.length === 0) {
      const [members] = await pool.query<RowDataPacket[]>(
        `SELECT mb_name, mb_hp, mb_tel, mb_email, mb_zip1, mb_zip2, mb_addr1, mb_addr2, mb_addr3, mb_addr_jibeon, mb_1
         FROM g5_member WHERE mb_id = ?`,
        [user.mb_id]
      );
      if (members.length > 0) {
        const m = members[0];
        const addr1 = m.mb_addr1 || m.mb_1 || "";
        if (addr1) {
          await pool.query<ResultSetHeader>(
            `INSERT INTO g5_shop_order_address (mb_id, ad_subject, ad_default, ad_name, ad_tel, ad_hp, ad_zip1, ad_zip2, ad_addr1, ad_addr2, ad_addr3, ad_jibeon)
             VALUES (?, '기본 배송지', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user.mb_id, m.mb_name || "", m.mb_tel || "", m.mb_hp || "",
             m.mb_zip1 || "", m.mb_zip2 || "", addr1, m.mb_addr2 || "", m.mb_addr3 || "", m.mb_addr_jibeon || ""]
          );
          const [newRows] = await pool.query<RowDataPacket[]>(
            `SELECT ad_id, mb_id, ad_subject, ad_default, ad_name, ad_tel, ad_hp,
                    ad_zip1, ad_zip2, ad_addr1, ad_addr2, ad_addr3, ad_jibeon
             FROM g5_shop_order_address WHERE mb_id = ? ORDER BY ad_default DESC, ad_id DESC`,
            [user.mb_id]
          );
          res.json(newRows.map(formatAddress));
          return;
        }
      }
    }

    res.json(rows.map(formatAddress));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/addresses", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { ad_subject, ad_name, ad_tel, ad_hp, ad_zip1, ad_zip2, ad_addr1, ad_addr2, ad_addr3, ad_jibeon, ad_default } = req.body;

    if (!ad_name || !ad_addr1) {
      res.status(400).json({ error: "수령인 이름과 주소는 필수입니다" });
      return;
    }

    if (ad_default) {
      await pool.query(`UPDATE g5_shop_order_address SET ad_default = 0 WHERE mb_id = ?`, [user.mb_id]);
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO g5_shop_order_address (mb_id, ad_subject, ad_default, ad_name, ad_tel, ad_hp, ad_zip1, ad_zip2, ad_addr1, ad_addr2, ad_addr3, ad_jibeon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.mb_id, ad_subject || "", ad_default ? 1 : 0, ad_name, ad_tel || "", ad_hp || "",
       ad_zip1 || "", ad_zip2 || "", ad_addr1, ad_addr2 || "", ad_addr3 || "", ad_jibeon || ""]
    );

    res.status(201).json({
      ad_id: result.insertId,
      mb_id: user.mb_id,
      ad_subject: ad_subject || "",
      ad_default: ad_default ? 1 : 0,
      ad_name, ad_tel: ad_tel || "", ad_hp: ad_hp || "",
      ad_zip1: ad_zip1 || "", ad_zip2: ad_zip2 || "",
      ad_addr1, ad_addr2: ad_addr2 || "", ad_addr3: ad_addr3 || "", ad_jibeon: ad_jibeon || ""
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/addresses/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const adId = Number(req.params.id);
    const { ad_subject, ad_name, ad_tel, ad_hp, ad_zip1, ad_zip2, ad_addr1, ad_addr2, ad_addr3, ad_jibeon, ad_default } = req.body;

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT ad_id FROM g5_shop_order_address WHERE ad_id = ? AND mb_id = ?`, [adId, user.mb_id]
    );
    if (existing.length === 0) {
      res.status(404).json({ error: "배송지를 찾을 수 없습니다" });
      return;
    }

    if (ad_default) {
      await pool.query(`UPDATE g5_shop_order_address SET ad_default = 0 WHERE mb_id = ?`, [user.mb_id]);
    }

    await pool.query(
      `UPDATE g5_shop_order_address SET ad_subject=?, ad_default=?, ad_name=?, ad_tel=?, ad_hp=?, ad_zip1=?, ad_zip2=?, ad_addr1=?, ad_addr2=?, ad_addr3=?, ad_jibeon=?
       WHERE ad_id = ? AND mb_id = ?`,
      [ad_subject || "", ad_default ? 1 : 0, ad_name || "", ad_tel || "", ad_hp || "",
       ad_zip1 || "", ad_zip2 || "", ad_addr1 || "", ad_addr2 || "", ad_addr3 || "", ad_jibeon || "",
       adId, user.mb_id]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/addresses/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const adId = Number(req.params.id);

    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM g5_shop_order_address WHERE ad_id = ? AND mb_id = ?`, [adId, user.mb_id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "배송지를 찾을 수 없습니다" });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function formatAddress(row: any) {
  return {
    ad_id: Number(row.ad_id),
    mb_id: row.mb_id,
    ad_subject: row.ad_subject || "",
    ad_default: Number(row.ad_default),
    ad_name: row.ad_name || "",
    ad_tel: row.ad_tel || "",
    ad_hp: row.ad_hp || "",
    ad_zip: (row.ad_zip1 && row.ad_zip2) ? `${row.ad_zip1}${row.ad_zip2}` : (row.ad_zip1 || ""),
    ad_addr1: row.ad_addr1 || "",
    ad_addr2: row.ad_addr2 || "",
    ad_addr3: row.ad_addr3 || "",
    ad_jibeon: row.ad_jibeon || ""
  };
}

export default router;
