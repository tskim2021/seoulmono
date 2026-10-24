import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../lib/auth";
import pool from "../lib/mysql";
import type { RowDataPacket } from "mysql2";

const router = Router();

async function readBankSettings(): Promise<{
  bank_name: string;
  account_number: string;
  account_holder: string;
  memo: string;
}> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT cf_1, cf_2, cf_3, cf_4 FROM g5_config LIMIT 1"
  );
  if (rows.length === 0) {
    return { bank_name: "", account_number: "", account_holder: "", memo: "" };
  }
  return {
    bank_name: rows[0].cf_1 || "",
    account_number: rows[0].cf_2 || "",
    account_holder: rows[0].cf_3 || "",
    memo: rows[0].cf_4 || "",
  };
}

router.get("/settings/bank", authMiddleware, async (_req, res) => {
  try {
    const settings = await readBankSettings();
    res.json(settings);
  } catch (err: any) {
    _req.log?.error({ err }, "GetBankSettings error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.put("/settings/bank", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { bank_name, account_number, account_holder, memo } = req.body;
    await pool.query(
      "UPDATE g5_config SET cf_1 = ?, cf_2 = ?, cf_3 = ?, cf_4 = ?",
      [bank_name || "", account_number || "", account_holder || "", memo || ""]
    );
    const settings = {
      bank_name: bank_name || "",
      account_number: account_number || "",
      account_holder: account_holder || "",
      memo: memo || "",
    };
    res.json({ success: true, ...settings });
  } catch (err: any) {
    req.log?.error({ err }, "UpdateBankSettings error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/settings/general", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT cf_join_point FROM g5_config LIMIT 1"
    );
    res.json({ signup_point: Number(rows[0]?.cf_join_point || 0) });
  } catch (err: any) {
    _req.log?.error({ err }, "GetGeneralSettings error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.put("/settings/general", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { signup_point } = req.body;
    await pool.query(
      "UPDATE g5_config SET cf_join_point = ?",
      [Number(signup_point) || 0]
    );
    res.json({ success: true, signup_point: Number(signup_point) || 0 });
  } catch (err: any) {
    req.log?.error({ err }, "UpdateGeneralSettings error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/settings/signup-coupon", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT cf_6 FROM g5_config LIMIT 1");
    res.json({ signup_coupon_id: Number(rows[0]?.cf_6 || 0) });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.put("/settings/signup-coupon", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { signup_coupon_id } = req.body;
    await pool.query("UPDATE g5_config SET cf_6 = ?", [Number(signup_coupon_id) || 0]);
    res.json({ success: true, signup_coupon_id: Number(signup_coupon_id) || 0 });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// ── 결제수단 설정 ─────────────────────────────────────────────
// cf_5 = bank_enabled, cf_7 = card_enabled, cf_8 = portone_imp_code, cf_9 = inicis_mid
router.get("/settings/payment", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT cf_5, cf_7, cf_8, cf_9 FROM g5_config LIMIT 1"
    );
    const r = rows[0] || {};
    res.json({
      bank_enabled: r.cf_5 !== "0",
      card_enabled: r.cf_7 === "1",
      portone_imp_code: r.cf_8 || "",
      inicis_mid: r.cf_9 || "",
    });
  } catch {
    res.json({ bank_enabled: true, card_enabled: false, portone_imp_code: "", inicis_mid: "" });
  }
});

router.put("/settings/payment", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { bank_enabled, card_enabled, portone_imp_code, inicis_mid } = req.body;
    await pool.query(
      "UPDATE g5_config SET cf_5 = ?, cf_7 = ?, cf_8 = ?, cf_9 = ?",
      [bank_enabled ? "1" : "0", card_enabled ? "1" : "0", portone_imp_code || "", inicis_mid || ""]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// ── 푸터/사업자 정보 설정 ──────────────────────────────────────
const FOOTER_KEYS = [
  "footer_company","footer_ceo","footer_address","footer_business_num",
  "footer_tel","footer_online_num","footer_privacy",
  "footer_cs_tel","footer_cs_hours","footer_cs_lunch",
];

router.get("/settings/footer-config", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const ph = FOOTER_KEYS.map(() => "?").join(",");
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM seoulmono_settings WHERE setting_key IN (${ph})`,
      FOOTER_KEYS
    );
    const out: Record<string, string> = {};
    for (const r of rows as any[]) out[r.setting_key.replace("footer_", "")] = r.setting_value;
    res.json(out);
  } catch { res.json({}); }
});

router.put("/settings/footer-config", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const body: Record<string, string> = req.body || {};
    for (const [key, value] of Object.entries(body)) {
      const fullKey = `footer_${key}`;
      if (!FOOTER_KEYS.includes(fullKey)) continue;
      await pool.query(
        "INSERT INTO seoulmono_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [fullKey, String(value), String(value)]
      );
    }
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "저장 실패" }); }
});

// ── 메뉴 순서 설정 ─────────────────────────────────────────────
const DEFAULT_MENU_ORDER = [
  { id: "all",    label: "전체상품",  type: "list", href: "/products" },
  { id: "new",    label: "신상품",    type: "list", href: "/products?sort=new" },
  { id: "best",   label: "베스트",    type: "list", href: "/products?sort=popular" },
  { id: "rec",    label: "추천상품",  type: "list", href: "/products?sort=recommended" },
  { id: "evt",    label: "이벤트",    type: "page", href: "/events" },
  { id: "cs",     label: "고객센터",  type: "page", href: "/cs" },
  { id: "notice", label: "공지사항",  type: "page", href: "/notice" },
];

router.get("/settings/menu-order", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT setting_value FROM seoulmono_settings WHERE setting_key = ?",
      ["menu_order"]
    );
    if (rows.length > 0 && rows[0].setting_value) {
      const order = JSON.parse(rows[0].setting_value);
      // Validate shape: rebuild with current labels
      const ordered = order.map((id: string) => DEFAULT_MENU_ORDER.find(d => d.id === id)).filter(Boolean);
      // Append any new defaults not in saved order
      const existingIds = new Set(order);
      const missing = DEFAULT_MENU_ORDER.filter(d => !existingIds.has(d.id));
      res.json([...ordered, ...missing]);
    } else {
      res.json(DEFAULT_MENU_ORDER);
    }
  } catch {
    res.json(DEFAULT_MENU_ORDER);
  }
});

router.put("/settings/menu-order", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      res.status(400).json({ error: "order must be an array" });
      return;
    }
    await pool.query(
      "INSERT INTO seoulmono_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      ["menu_order", JSON.stringify(order), JSON.stringify(order)]
    );
    res.json({ success: true, order });
  } catch (err: any) {
    req.log?.error({ err }, "UpdateMenuOrder error");
    res.status(500).json({ error: "서버 오류" });
  }
});

export default router;
