import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { authMiddleware, adminMiddleware } from "../lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const bannerUploadDir = path.resolve(process.cwd(), "uploads/editor");
if (!fs.existsSync(bannerUploadDir)) fs.mkdirSync(bannerUploadDir, { recursive: true });
const bannerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, bannerUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const bannerUpload = multer({ storage: bannerStorage, limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("画像のみアップロードできます"));
  },
});

const DEFAULT_CATEGORIES = [
  [
    { label: "건강기능식품", emoji: "💊", href: "/list?ca_id=90" },
    { label: "견과류",       emoji: "🥜", href: "/list?ca_id=99" },
    { label: "조미료/오일",  emoji: "🧴", href: "/list?ca_id=30" },
    { label: "즉석식품",     emoji: "🍱", href: "/list?ca_id=10" },
  ],
  [
    { label: "생수/음료",   emoji: "💧", href: "/list?ca_id=50" },
    { label: "캔/통조림",  emoji: "🥫", href: "/list?ca_id=20" },
    { label: "커피/차",    emoji: "☕", href: "/list?ca_id=60" },
    { label: "과자/간식",  emoji: "🍪", href: "/list?ca_id=40" },
  ],
  [
    { label: "즉석식품",   emoji: "🍱", href: "/list?ca_id=10" },
    { label: "캔/통조림", emoji: "🥫", href: "/list?ca_id=20" },
    { label: "간편조리",   emoji: "🥘", href: "/list?ca_id=a0" },
    { label: "선물세트",   emoji: "🎁", href: "/list?type=4"   },
  ],
];

async function initShopMainBanners() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shop_main_banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      badge_text VARCHAR(50) DEFAULT '',
      badge_color VARCHAR(25) DEFAULT '#86efac',
      title_line1 VARCHAR(100) DEFAULT '',
      title_line2 VARCHAR(100) DEFAULT '',
      sub_text VARCHAR(300) DEFAULT '',
      cta_text VARCHAR(60) DEFAULT '',
      cta_bg VARCHAR(25) DEFAULT '#ffffff',
      cta_color VARCHAR(25) DEFAULT '#1b6e45',
      bg_gradient VARCHAR(250) DEFAULT '',
      link_url VARCHAR(500) DEFAULT '',
      sort_order INT DEFAULT 0,
      is_active TINYINT DEFAULT 1
    )
  `);
  await pool.query(`ALTER TABLE shop_main_banners ADD COLUMN IF NOT EXISTS categories_json TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL`).catch(() => {});
  const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM shop_main_banners");
  if ((rows[0] as any).cnt === 0) {
    await pool.query(`
      INSERT INTO shop_main_banners
        (badge_text, badge_color, title_line1, title_line2, sub_text, cta_text, cta_bg, cta_color, bg_gradient, link_url, sort_order, categories_json)
      VALUES
        ('지구쇼핑몰 단독','#86efac','지구쇼핑몰만의','특별한 브랜드','엄선된 프리미엄 식품을 합리적인 가격으로\\n직접 만나보세요','브랜드 상품 보기','#fff','#1b6e45','linear-gradient(135deg, #1b6e45 0%, #13532f 55%, #0a3a20 100%)','/list?type=3',1,?),
        ('최저가 보장','#fcd34d','창고형 최저가','무료배송','대량구매로 더 저렴하게\\n매주 업데이트되는 특가 상품','특가 상품 보기','#fcd34d','#1a3a6b','linear-gradient(135deg, #1a3a6b 0%, #102a55 55%, #081c3d 100%)','/list?type=1',2,?),
        ('한정 특가','#f9a8d4','유통기한 임박','파격 특가','남은 수량 소진 시 종료\\n지금 바로 확인하세요','임박특가 보기','#f9a8d4','#5b21b6','linear-gradient(135deg, #7c3aed 0%, #5b21b6 55%, #3b0764 100%)','/list?type=4',3,?)
    `, [JSON.stringify(DEFAULT_CATEGORIES[0]), JSON.stringify(DEFAULT_CATEGORIES[1]), JSON.stringify(DEFAULT_CATEGORIES[2])]);
  } else {
    const [bannerRows] = await pool.query<RowDataPacket[]>("SELECT id, categories_json FROM shop_main_banners ORDER BY sort_order ASC, id ASC");
    for (let i = 0; i < bannerRows.length; i++) {
      if (!bannerRows[i].categories_json) {
        await pool.query("UPDATE shop_main_banners SET categories_json=? WHERE id=?", [JSON.stringify(DEFAULT_CATEGORIES[i] ?? DEFAULT_CATEGORIES[0]), bannerRows[i].id]);
      }
    }
  }
}
initShopMainBanners().catch(console.error);

function parseBanner(b: RowDataPacket) {
  let categories = null;
  try { categories = b.categories_json ? JSON.parse(b.categories_json) : null; } catch { categories = null; }
  return { ...b, categories };
}

router.get("/shop-main-banners", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM shop_main_banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC"
    );
    res.json({ banners: rows.map(parseBanner) });
  } catch (_err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

router.get("/admin/shop-main-banners", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM shop_main_banners ORDER BY sort_order ASC, id ASC"
    );
    res.json({ banners: rows.map(parseBanner) });
  } catch (_err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

router.put("/admin/shop-main-banners/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { badge_text, badge_color, title_line1, title_line2, sub_text, cta_text, cta_bg, cta_color, bg_gradient, link_url, sort_order, is_active, categories } = req.body;
    const categories_json = categories ? JSON.stringify(categories) : null;
    await pool.query(
      `UPDATE shop_main_banners SET badge_text=?, badge_color=?, title_line1=?, title_line2=?, sub_text=?, cta_text=?, cta_bg=?, cta_color=?, bg_gradient=?, link_url=?, sort_order=?, is_active=?, categories_json=? WHERE id=?`,
      [badge_text, badge_color, title_line1, title_line2, sub_text, cta_text, cta_bg, cta_color, bg_gradient, link_url, sort_order ?? 0, is_active !== false ? 1 : 0, categories_json, id]
    );
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_main_banners WHERE id=?", [id]);
    res.json({ banner: parseBanner(rows[0]) });
  } catch (_err) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seoulmono_banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      image_url VARCHAR(500) NOT NULL DEFAULT '',
      pc_img VARCHAR(500) DEFAULT '',
      mo_img VARCHAR(500) DEFAULT '',
      link_url VARCHAR(500) DEFAULT '',
      title VARCHAR(200) DEFAULT '',
      subtitle VARCHAR(300) DEFAULT '',
      sort_order INT DEFAULT 0,
      is_active TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`ALTER TABLE seoulmono_banners ADD COLUMN IF NOT EXISTS pc_img VARCHAR(500) DEFAULT ''`).catch(()=>{});
  await pool.query(`ALTER TABLE seoulmono_banners ADD COLUMN IF NOT EXISTS mo_img VARCHAR(500) DEFAULT ''`).catch(()=>{});
  await pool.query(`ALTER TABLE seoulmono_banners ADD COLUMN IF NOT EXISTS app_img VARCHAR(500) DEFAULT ''`).catch(()=>{});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seoulmono_section_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      section_type VARCHAR(50) NOT NULL,
      it_id VARCHAR(100) NOT NULL,
      sort_order INT DEFAULT 0,
      UNIQUE KEY uq_section_item (section_type, it_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seoulmono_gift_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(20) DEFAULT '',
      sort_order INT DEFAULT 0,
      is_active TINYINT DEFAULT 1
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seoulmono_gift_category_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cat_id INT NOT NULL,
      it_id VARCHAR(100) NOT NULL,
      sort_order INT DEFAULT 0,
      UNIQUE KEY uq_gift_item (cat_id, it_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seoulmono_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      it_id VARCHAR(100),
      it_name VARCHAR(300),
      mb_id VARCHAR(50),
      author VARCHAR(100),
      rating INT DEFAULT 5,
      content TEXT,
      is_visible TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function autoApprovePending() {
  try {
    await pool.query(
      "UPDATE g5_member SET mb_level = 2 WHERE mb_level = 1 AND mb_level < 10"
    );
  } catch (e) {
    console.error("autoApprovePending error:", e);
  }
}

initTables().then(autoApprovePending).catch(console.error);

const IMG_BASE = "/api/product-image/";

function itemImageUrl(img: string) {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return IMG_BASE + img;
}

async function getItemsByIds(ids: string[]) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT it_id, it_name, it_price, it_cust_price, it_img1, ca_id
     FROM g5_shop_item WHERE it_id IN (${placeholders}) AND it_use = '1'`,
    ids
  );
  return rows.map((r: any) => ({
    ...r,
    it_img1: itemImageUrl(r.it_img1),
    it_price: Number(r.it_price) || 0,
    it_cust_price: Number(r.it_cust_price) || 0,
  }));
}

async function searchItems(q: string, limit = 30) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT it_id, it_name, it_price, it_cust_price, it_img1, ca_id
     FROM g5_shop_item
     WHERE it_use = '1' AND it_name LIKE ?
     ORDER BY it_id DESC LIMIT ?`,
    [`%${q}%`, limit]
  );
  return rows.map((r: any) => ({
    ...r,
    it_img1: itemImageUrl(r.it_img1),
    it_price: Number(r.it_price) || 0,
    it_cust_price: Number(r.it_cust_price) || 0,
  }));
}

// ─── BANNERS ────────────────────────────────────────────────────────────────

// Public: 메인 슬라이더 배너 조회
router.get("/shop/banners", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, image_url, pc_img, mo_img, app_img, link_url, title, subtitle, sort_order, is_active FROM seoulmono_banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC"
    );
    res.json({ banners: rows });
  } catch { res.json({ banners: [] }); }
});

// Admin: 배너 이미지 업로드
router.post(
  "/shop-admin/banners/upload",
  authMiddleware, adminMiddleware,
  bannerUpload.single("image"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "画像ファイルがありません" });
    res.json({ image_url: `/api/editor-image/${req.file.filename}` });
  }
);

router.get("/shop-admin/banners", authMiddleware, adminMiddleware, async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM seoulmono_banners ORDER BY sort_order ASC, id ASC"
  );
  res.json({ banners: rows });
});

router.post("/shop-admin/banners", authMiddleware, adminMiddleware, async (req, res) => {
  const { image_url = "", pc_img = "", mo_img = "", app_img = "", link_url = "", title = "", subtitle = "", sort_order = 0, is_active = 1 } = req.body;
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO seoulmono_banners (image_url, pc_img, mo_img, app_img, link_url, title, subtitle, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?,?)",
    [image_url || pc_img, pc_img, mo_img, app_img, link_url, title, subtitle, sort_order, is_active]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_banners WHERE id = ?", [result.insertId]);
  res.json({ banner: rows[0] });
});

router.put("/shop-admin/banners/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { image_url, pc_img, mo_img, app_img, link_url, title, subtitle, sort_order, is_active } = req.body;
  await pool.query(
    "UPDATE seoulmono_banners SET image_url=?, pc_img=?, mo_img=?, app_img=?, link_url=?, title=?, subtitle=?, sort_order=?, is_active=? WHERE id=?",
    [image_url ?? pc_img ?? "", pc_img ?? "", mo_img ?? "", app_img ?? "", link_url ?? "", title ?? "", subtitle ?? "", sort_order ?? 0, is_active ?? 1, id]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_banners WHERE id = ?", [id]);
  res.json({ banner: rows[0] });
});

router.delete("/shop-admin/banners/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await pool.query("DELETE FROM seoulmono_banners WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

// ─── SHOP PROMO BANNERS (쇼핑몰 서브배너 bnr01/02/03) ────────────────────────

async function initShopPromoBanners() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_promo_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot VARCHAR(20) NOT NULL UNIQUE,
        slot_name VARCHAR(100) DEFAULT '',
        image_url VARCHAR(500) DEFAULT '',
        link_url VARCHAR(500) DEFAULT '',
        is_active TINYINT DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    const defaultSlots = [
      { slot: "bnr01", slot_name: "カカオチャンネルバナー (左)", link_url: "" },
      { slot: "bnr02", slot_name: "初回購入100円バナー (右画像)", link_url: "/list?type=4" },
      { slot: "bnr03", slot_name: "ギフトセットDIYフルバナー (下部)", link_url: "/gift" },
    ];
    for (const s of defaultSlots) {
      await pool.query(
        "INSERT IGNORE INTO shop_promo_banners (slot, slot_name, link_url) VALUES (?, ?, ?)",
        [s.slot, s.slot_name, s.link_url]
      );
    }
  } catch (e) { console.error("shop_promo_banners init error", e); }
}
initShopPromoBanners().catch(console.error);

// Public: 쇼핑몰 프로모 배너 조회
router.get("/shop/promo-banners", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_promo_banners ORDER BY slot ASC");
    res.json({ banners: rows });
  } catch { res.json({ banners: [] }); }
});

// Admin: 프로모 배너 목록 조회
router.get("/shop-admin/promo-banners", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_promo_banners ORDER BY slot ASC");
    res.json({ banners: rows });
  } catch { res.json({ banners: [] }); }
});

// Admin: 프로모 배너 이미지 업로드
router.post(
  "/shop-admin/promo-banners/upload",
  authMiddleware, adminMiddleware,
  bannerUpload.single("image"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "画像ファイルがありません" });
    res.json({ image_url: `/api/editor-image/${req.file.filename}` });
  }
);

// Admin: 프로모 배너 슬롯 업데이트
router.put("/shop-admin/promo-banners/:slot", authMiddleware, adminMiddleware, async (req, res) => {
  const { slot } = req.params;
  const { image_url, link_url, is_active } = req.body;
  await pool.query(
    "UPDATE shop_promo_banners SET image_url=?, link_url=?, is_active=? WHERE slot=?",
    [image_url ?? "", link_url ?? "", is_active ?? 1, slot]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_promo_banners WHERE slot=?", [slot]);
  res.json({ banner: (rows as any[])[0] });
});

// ─── SECTION ITEMS (best, sale, diygift, new, exclusive) ────────────────────

const ALLOWED_SECTIONS = ["best", "sale", "diygift", "new", "exclusive", "first_purchase", "groupbuy", "todaydeal"];

router.get("/shop-admin/sections/:type", authMiddleware, adminMiddleware, async (req, res) => {
  const { type } = req.params;
  if (!ALLOWED_SECTIONS.includes(type) && type !== "lowest") {
    return res.status(400).json({ error: "セクションタイプが正しくありません" });
  }

  if (type === "lowest") {
    try {
      const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_lowest_items ORDER BY sort_order ASC");
      const ids = rows.map((r: any) => r.it_id);
      const items = await getItemsByIds(ids);
      return res.json({ items });
    } catch {
      return res.json({ items: [] });
    }
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT it_id FROM seoulmono_section_items WHERE section_type = ? ORDER BY sort_order ASC",
    [type]
  );
  const ids = rows.map((r: any) => r.it_id);
  const items = await getItemsByIds(ids);
  res.json({ items });
});

router.post("/shop-admin/sections/:type/search", authMiddleware, adminMiddleware, async (req, res) => {
  const { type } = req.params;
  const q = (req.body.q || "") as string;
  if (!q.trim()) return res.json({ items: [] });

  let existingIds: Set<string>;
  if (type === "lowest") {
    try {
      const [rows] = await pool.query<RowDataPacket[]>("SELECT it_id FROM seoulmono_lowest_items");
      existingIds = new Set(rows.map((r: any) => r.it_id));
    } catch {
      existingIds = new Set();
    }
  } else {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT it_id FROM seoulmono_section_items WHERE section_type = ?", [type]
    );
    existingIds = new Set(rows.map((r: any) => r.it_id));
  }

  const items = await searchItems(q, 20);
  res.json({ items: items.filter(i => !existingIds.has(i.it_id)) });
});

router.post("/shop-admin/sections/:type/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  const { type, it_id } = req.params;

  if (type === "lowest") {
    try {
      await pool.query(
        "INSERT IGNORE INTO seoulmono_lowest_items (it_id, sort_order) VALUES (?, 0)",
        [it_id]
      );
    } catch {
      const [items] = await pool.query<RowDataPacket[]>(
        "SELECT it_id, it_name, it_price, it_img1 FROM g5_shop_item WHERE it_id = ?", [it_id]
      );
      if (!items[0]) return res.status(404).json({ error: "商品がありません" });
    }
    return res.json({ ok: true });
  }

  if (!ALLOWED_SECTIONS.includes(type)) return res.status(400).json({ error: "セクションが正しくありません" });
  await pool.query(
    "INSERT IGNORE INTO seoulmono_section_items (section_type, it_id, sort_order) VALUES (?, ?, 0)",
    [type, it_id]
  );
  res.json({ ok: true });
});

router.delete("/shop-admin/sections/:type/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  const { type, it_id } = req.params;

  if (type === "lowest") {
    try {
      await pool.query("DELETE FROM seoulmono_lowest_items WHERE it_id = ?", [it_id]);
    } catch {
      await pool.query(
        "DELETE FROM seoulmono_section_items WHERE section_type = 'lowest' AND it_id = ?", [it_id]
      );
    }
    return res.json({ ok: true });
  }

  await pool.query(
    "DELETE FROM seoulmono_section_items WHERE section_type = ? AND it_id = ?",
    [type, it_id]
  );
  res.json({ ok: true });
});

// ─── GIFT CATEGORIES ─────────────────────────────────────────────────────────

router.get("/shop-admin/gift-categories", authMiddleware, adminMiddleware, async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM seoulmono_gift_categories ORDER BY sort_order ASC, id ASC"
  );
  res.json({ categories: rows });
});

router.post("/shop-admin/gift-categories", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, icon = "", sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ error: "name は必須です" });
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO seoulmono_gift_categories (name, icon, sort_order) VALUES (?,?,?)",
    [name, icon, sort_order]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_gift_categories WHERE id = ?", [result.insertId]);
  res.json({ category: rows[0] });
});

router.put("/shop-admin/gift-categories/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, icon, sort_order, is_active } = req.body;
  await pool.query(
    "UPDATE seoulmono_gift_categories SET name=?, icon=?, sort_order=?, is_active=? WHERE id=?",
    [name, icon ?? "", sort_order ?? 0, is_active ?? 1, req.params.id]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_gift_categories WHERE id = ?", [req.params.id]);
  res.json({ category: rows[0] });
});

router.delete("/shop-admin/gift-categories/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await pool.query("DELETE FROM seoulmono_gift_categories WHERE id = ?", [req.params.id]);
  await pool.query("DELETE FROM seoulmono_gift_category_items WHERE cat_id = ?", [req.params.id]);
  res.json({ ok: true });
});

// ─── GIFT CATEGORY ITEMS ─────────────────────────────────────────────────────

router.get("/shop-admin/gift-categories/:id/items", authMiddleware, adminMiddleware, async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT it_id FROM seoulmono_gift_category_items WHERE cat_id = ? ORDER BY sort_order ASC",
    [req.params.id]
  );
  const ids = rows.map((r: any) => r.it_id);
  const items = await getItemsByIds(ids);
  res.json({ items });
});

router.post("/shop-admin/gift-categories/:id/search", authMiddleware, adminMiddleware, async (req, res) => {
  const q = (req.body.q || "") as string;
  if (!q.trim()) return res.json({ items: [] });
  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT it_id FROM seoulmono_gift_category_items WHERE cat_id = ?", [req.params.id]
  );
  const existingIds = new Set(existing.map((r: any) => r.it_id));
  const items = await searchItems(q, 20);
  res.json({ items: items.filter(i => !existingIds.has(i.it_id)) });
});

router.post("/shop-admin/gift-categories/:id/items/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  await pool.query(
    "INSERT IGNORE INTO seoulmono_gift_category_items (cat_id, it_id, sort_order) VALUES (?,?,0)",
    [req.params.id, req.params.it_id]
  );
  res.json({ ok: true });
});

router.delete("/shop-admin/gift-categories/:id/items/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  await pool.query(
    "DELETE FROM seoulmono_gift_category_items WHERE cat_id = ? AND it_id = ?",
    [req.params.id, req.params.it_id]
  );
  res.json({ ok: true });
});

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

router.get("/shop-admin/reviews", authMiddleware, adminMiddleware, async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM seoulmono_reviews ORDER BY created_at DESC LIMIT 100"
  );
  res.json({ reviews: rows });
});

router.patch("/shop-admin/reviews/:id/toggle", authMiddleware, adminMiddleware, async (req, res) => {
  await pool.query(
    "UPDATE seoulmono_reviews SET is_visible = 1 - is_visible WHERE id = ?",
    [req.params.id]
  );
  res.json({ ok: true });
});

router.delete("/shop-admin/reviews/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await pool.query("DELETE FROM seoulmono_reviews WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

router.delete("/shop-admin/reviews/batch-delete", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { review_ids } = req.body;
    if (!Array.isArray(review_ids) || review_ids.length === 0) {
      res.status(400).json({ error: "削除するレビューを選択してください" });
      return;
    }
    const ph = review_ids.map(() => "?").join(",");
    await pool.query(`DELETE FROM seoulmono_reviews WHERE id IN (${ph})`, review_ids);
    res.json({ success: true, deleted: review_ids.length });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// ─── ITEM SEARCH (for admin general use) ────────────────────────────────────

router.get("/admin/items/search", authMiddleware, adminMiddleware, async (req, res) => {
  const q = ((req.query.q as string) || "").trim();
  if (!q) return res.json({ items: [] });
  const items = await searchItems(q);
  res.json({ items });
});

// ─── 메인샵 관리 ─────────────────────────────────────────────────────────────

const MAIN_SECTIONS = [
  { key: "new",           label: "新商品",           filter1: "2" },
  { key: "brand",         label: "ソウルモノブランド",     filter1: "3" },
  { key: "expire",        label: "賞味期限間近特価", filter1: "8" },
  { key: "time",          label: "タイムセール",          filter1: "9" },
  { key: "limited",       label: "限定特価",          filter1: "10" },
  { key: "brand_special", label: "ブランド特価",        filter1: "11" },
  { key: "lowest",        label: "最安値チャレンジ",       filter1: "12" },
];

// 섹션별 상품 목록
router.get("/admin/main-shop/section-products", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filter1 = (req.query.filter1 as string) || "";
    if (!filter1) return res.json({ items: [], is_fallback: false });

    const CAFE24_IMG_BASE = "/api/product-image";
    const mapRow = (r: any) => ({
      it_id: r.it_id,
      it_name: r.it_name,
      it_price: Number(r.it_price) || 0,
      it_img1: r.it_img1 ? (r.it_img1.startsWith("http") ? r.it_img1 : `${CAFE24_IMG_BASE}/${r.it_img1}`) : "",
      ca_name: r.ca_name || "",
      it_soldout: r.it_soldout || "0",
      it_use: r.it_use || "1",
      filter1: r.filter1 || "",
    });

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_img1, i.ca_id, i.it_soldout, i.it_use, i.filter1, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.filter1=?
       ORDER BY i.it_order ASC, i.it_time DESC`,
      [filter1]
    );

    if ((rows as any[]).length > 0) {
      return res.json({ items: (rows as any[]).map(mapRow), is_fallback: false });
    }

    // 배정된 상품이 없을 경우 홈화면과 동일한 fallback 적용
    const [fallback] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_img1, i.ca_id, i.it_soldout, i.it_use, i.filter1, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_use='1' AND i.it_img1 != ''
       ORDER BY i.it_order ASC, i.it_time DESC
       LIMIT 8`
    );
    res.json({ items: (fallback as any[]).map(mapRow), is_fallback: true });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 섹션 카운트 요약
router.get("/admin/main-shop/summary", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const counts: Record<string, number> = {};
    for (const s of MAIN_SECTIONS) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) as cnt FROM g5_shop_item WHERE it_use='1' AND filter1=?",
        [s.filter1]
      );
      counts[s.key] = Number((rows as any[])[0]?.cnt || 0);
    }
    // 섹션 타이틀 조회
    const [titleRows] = await pool.query<RowDataPacket[]>(
      "SELECT de_type1_title, de_type2_title, de_type3_title, de_type4_title, de_type5_title FROM g5_shop_default LIMIT 1"
    );
    const t = (titleRows as any[])[0] || {};
    res.json({
      sections: MAIN_SECTIONS,
      counts,
      titles: {
        best: t.de_type1_title || "ヒット商品",
        recommended: t.de_type2_title || "おすすめ商品",
        newest: t.de_type3_title || "新着商品",
        popular: t.de_type4_title || "人気商品",
        sale: t.de_type5_title || "セール商品",
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 섹션 타이틀 업데이트
router.put("/admin/main-shop/titles", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { best, recommended, newest, popular, sale } = req.body;
    const [existing] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as cnt FROM g5_shop_default");
    if ((existing as any[])[0]?.cnt > 0) {
      await pool.query(
        "UPDATE g5_shop_default SET de_type1_title=?, de_type2_title=?, de_type3_title=?, de_type4_title=?, de_type5_title=?",
        [best || "", recommended || "", newest || "", popular || "", sale || ""]
      );
    } else {
      await pool.query(
        "INSERT INTO g5_shop_default (de_type1_title, de_type2_title, de_type3_title, de_type4_title, de_type5_title) VALUES (?,?,?,?,?)",
        [best || "", recommended || "", newest || "", popular || "", sale || ""]
      );
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 상품을 특정 섹션에 배정 (filter1 업데이트)
router.post("/admin/main-shop/assign", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id, filter1 } = req.body;
    if (!it_id || !filter1) return res.status(400).json({ error: "必須パラメータがありません" });
    await pool.query("UPDATE g5_shop_item SET filter1=? WHERE it_id=?", [filter1, it_id]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 상품을 섹션에서 제거 (filter1 초기화)
router.delete("/admin/main-shop/assign/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id } = req.params;
    await pool.query("UPDATE g5_shop_item SET filter1='' WHERE it_id=?", [it_id]);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 상품 노출/비노출 토글 (it_use)
router.patch("/admin/main-shop/assign/:it_id/visibility", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id } = req.params;
    await pool.query("UPDATE g5_shop_item SET it_use = IF(it_use='1','0','1') WHERE it_id=?", [it_id]);
    const [rows] = await pool.query<RowDataPacket[]>("SELECT it_use FROM g5_shop_item WHERE it_id=?", [it_id]);
    res.json({ it_use: (rows as any[])[0]?.it_use ?? "1" });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// 상품 검색 (메인샵 관리용)
router.get("/admin/main-shop/search", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const q = ((req.query.q as string) || "").trim();
    const filter1 = (req.query.filter1 as string) || "";
    if (!q && !filter1) return res.json({ items: [] });

    const CAFE24_IMG_BASE = "/api/product-image";
    let query = `SELECT i.it_id, i.it_name, i.it_price, i.it_img1, i.ca_id, i.it_soldout, i.filter1, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_use='1'`;
    const params: any[] = [];
    if (q) { query += " AND (i.it_name LIKE ? OR i.it_id LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
    query += " ORDER BY i.it_order ASC, i.it_hit DESC LIMIT 30";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json({
      items: (rows as any[]).map(r => ({
        it_id: r.it_id,
        it_name: r.it_name,
        it_price: Number(r.it_price) || 0,
        it_img1: r.it_img1 ? (r.it_img1.startsWith("http") ? r.it_img1 : `${CAFE24_IMG_BASE}/${r.it_img1}`) : "",
        ca_name: r.ca_name || "",
        it_soldout: r.it_soldout || "0",
        filter1: r.filter1 || "",
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// ─── 첫구매 100원 전용 관리 ─────────────────────────────────────────────────

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seoulmono_first_purchase_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      it_id VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
      custom_name VARCHAR(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      custom_price INT DEFAULT 100,
      custom_img VARCHAR(500) DEFAULT NULL,
      is_visible TINYINT DEFAULT 1,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_fp_it_id (it_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  // 기존 filter1='13' 상품을 새 테이블로 자동 마이그레이션 (중복 무시)
  await pool.query(`
    INSERT IGNORE INTO seoulmono_first_purchase_items (it_id, custom_price, is_visible, sort_order)
    SELECT it_id, 100, 1, 0 FROM g5_shop_item WHERE filter1='13' AND it_use='1'
  `);
})().catch(console.error);

const FP_IMG_BASE = "/api/product-image";
function fpImgUrl(img: string) {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `${FP_IMG_BASE}/${img}`;
}

// 목록 조회
router.get("/admin/first-purchase/items", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT fp.id, fp.it_id, fp.custom_name, fp.custom_price, fp.custom_img, fp.is_visible, fp.sort_order,
              i.it_name, i.it_price AS orig_price, i.it_img1, i.it_soldout, c.ca_name
       FROM seoulmono_first_purchase_items fp
       JOIN g5_shop_item i ON fp.it_id = i.it_id
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       ORDER BY fp.sort_order ASC, fp.id ASC`
    );
    res.json({
      items: (rows as any[]).map(r => ({
        id: r.id,
        it_id: r.it_id,
        it_name: r.custom_name || r.it_name,
        orig_name: r.it_name,
        custom_name: r.custom_name || "",
        it_price: r.custom_price ?? 100,
        orig_price: Number(r.orig_price) || 0,
        it_img1: r.custom_img || fpImgUrl(r.it_img1),
        custom_img: r.custom_img || "",
        is_visible: r.is_visible,
        sort_order: r.sort_order ?? 0,
        it_soldout: r.it_soldout || "0",
        ca_name: r.ca_name || "",
      })),
    });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

// 상품 추가
router.post("/admin/first-purchase/items", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id } = req.body;
    if (!it_id) return res.status(400).json({ error: "it_id は必須です" });
    const [exist] = await pool.query<RowDataPacket[]>("SELECT it_id FROM g5_shop_item WHERE it_id=? AND it_use='1'", [it_id]);
    if (!(exist as any[])[0]) return res.status(404).json({ error: "商品がありません" });
    await pool.query(
      "INSERT IGNORE INTO seoulmono_first_purchase_items (it_id, custom_price, is_visible, sort_order) VALUES (?, 100, 1, 0)",
      [it_id]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

// 상품 제거
router.delete("/admin/first-purchase/items/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM seoulmono_first_purchase_items WHERE id=?", [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

// 노출/비노출 토글
router.patch("/admin/first-purchase/items/:id/visibility", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE seoulmono_first_purchase_items SET is_visible = 1 - is_visible WHERE id=?", [req.params.id]);
    const [rows] = await pool.query<RowDataPacket[]>("SELECT is_visible FROM seoulmono_first_purchase_items WHERE id=?", [req.params.id]);
    res.json({ is_visible: (rows as any[])[0]?.is_visible });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

// 상품 수정 (커스텀 이름/가격/이미지/정렬)
router.put("/admin/first-purchase/items/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { custom_name, custom_price, custom_img, sort_order, is_visible } = req.body;
    await pool.query(
      "UPDATE seoulmono_first_purchase_items SET custom_name=?, custom_price=?, custom_img=?, sort_order=?, is_visible=? WHERE id=?",
      [custom_name || null, custom_price ?? 100, custom_img || null, sort_order ?? 0, is_visible ?? 1, req.params.id]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

// 검색 (추가용)
router.get("/admin/first-purchase/search", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const q = ((req.query.q as string) || "").trim();
    if (!q) return res.json({ items: [] });
    const [existing] = await pool.query<RowDataPacket[]>("SELECT it_id FROM seoulmono_first_purchase_items");
    const existingIds = new Set((existing as any[]).map(r => r.it_id));
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_img1, i.it_soldout, c.ca_name
       FROM g5_shop_item i LEFT JOIN g5_shop_category c ON i.ca_id=c.ca_id
       WHERE i.it_use='1' AND (i.it_name LIKE ? OR i.it_id LIKE ?)
       ORDER BY i.it_id DESC LIMIT 30`,
      [`%${q}%`, `%${q}%`]
    );
    res.json({
      items: (rows as any[])
        .filter(r => !existingIds.has(r.it_id))
        .map(r => ({
          it_id: r.it_id,
          it_name: r.it_name,
          it_price: Number(r.it_price) || 0,
          it_img1: fpImgUrl(r.it_img1),
          it_soldout: r.it_soldout || "0",
          ca_name: r.ca_name || "",
        })),
    });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

// ─── 푸터 사업자 정보 관리 ─────────────────────────────────────

const FOOTER_KEYS = [
  "footer_company","footer_ceo","footer_address","footer_business_num",
  "footer_tel","footer_online_num","footer_privacy",
  "footer_cs_tel","footer_cs_hours","footer_cs_lunch",
  "footer_bank_name","footer_bank_num","footer_bank_holder",
];

router.get("/shop-admin/footer-config", authMiddleware, adminMiddleware, async (_req, res) => {
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

router.put("/shop-admin/footer-config", authMiddleware, adminMiddleware, async (req, res) => {
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
  } catch { res.status(500).json({ error: "保存に失敗しました" }); }
});

// ─── 기본 설정 관리 ────────────────────────────────────────────

router.get("/shop-admin/settings", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT setting_key, setting_value FROM seoulmono_settings"
    );
    const settings: Record<string, string> = {};
    for (const r of rows as any[]) settings[r.setting_key] = r.setting_value;
    res.json(settings);
  } catch { res.json({}); }
});

router.put("/shop-admin/settings", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updates: Record<string, string> = req.body || {};
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        "INSERT INTO seoulmono_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, String(value), String(value)]
      );
    }
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "設定の保存に失敗しました" }); }
});

// ─── 이벤트 관리 ─────────────────────────────────────────────────────────────

async function initShopEvents() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shop_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
      thumbnail VARCHAR(500) DEFAULT '',
      content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
      start_date DATE DEFAULT NULL,
      end_date DATE DEFAULT NULL,
      is_active TINYINT DEFAULT 1,
      sort_order INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}
initShopEvents().catch(console.error);

router.get("/shop-events", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, title, thumbnail, start_date, end_date, is_active, sort_order, created_at FROM shop_events ORDER BY sort_order ASC, id DESC"
    );
    res.json({ events: rows });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

router.get("/shop-events/public", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, title, thumbnail, start_date, end_date, created_at FROM shop_events WHERE is_active=1 ORDER BY sort_order ASC, id DESC"
    );
    res.json({ events: rows });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

router.get("/shop-events/:id", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_events WHERE id=?", [req.params.id]);
    if (!(rows as any[]).length) return res.status(404).json({ error: "見つかりません" });
    res.json((rows as any[])[0]);
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

router.post("/shop-events", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, thumbnail, content, start_date, end_date, is_active, sort_order } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO shop_events (title, thumbnail, content, start_date, end_date, is_active, sort_order) VALUES (?,?,?,?,?,?,?)",
      [title || "", thumbnail || "", content || "", start_date || null, end_date || null, is_active ?? 1, sort_order ?? 0]
    );
    res.json({ id: result.insertId, ok: true });
  } catch { res.status(500).json({ error: "登録に失敗しました" }); }
});

router.put("/shop-events/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, thumbnail, content, start_date, end_date, is_active, sort_order } = req.body;
    await pool.query(
      "UPDATE shop_events SET title=?, thumbnail=?, content=?, start_date=?, end_date=?, is_active=?, sort_order=? WHERE id=?",
      [title || "", thumbnail || "", content || "", start_date || null, end_date || null, is_active ?? 1, sort_order ?? 0, req.params.id]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "更新に失敗しました" }); }
});

router.delete("/shop-events/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM shop_events WHERE id=?", [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "削除に失敗しました" }); }
});

// ─── Image Banner ─────────────────────────────────────────────────────────────
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_image_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        banner_type VARCHAR(10) DEFAULT 'image',
        title VARCHAR(200) DEFAULT '',
        pc_image_url VARCHAR(1000) DEFAULT '',
        mobile_image_url VARCHAR(1000) DEFAULT '',
        bg_color VARCHAR(200) DEFAULT '#1D8A5A',
        text_title VARCHAR(300) DEFAULT '',
        text_sub VARCHAR(500) DEFAULT '',
        text_cta VARCHAR(100) DEFAULT '',
        text_cta_color VARCHAR(50) DEFAULT '#ffffff',
        text_cta_bg VARCHAR(50) DEFAULT '#1D8A5A',
        link_url VARCHAR(500) DEFAULT '',
        is_new_window TINYINT DEFAULT 0,
        start_date DATE DEFAULT NULL,
        end_date DATE DEFAULT NULL,
        sort_order INT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    const imgCols = ["banner_type","bg_color","text_title","text_sub","text_cta","text_cta_color","text_cta_bg","is_new_window"] as const;
    const imgColDefs: Record<string, string> = {
      banner_type: "VARCHAR(10) DEFAULT 'image'",
      bg_color: "VARCHAR(200) DEFAULT '#1D8A5A'",
      text_title: "VARCHAR(300) DEFAULT ''",
      text_sub: "VARCHAR(500) DEFAULT ''",
      text_cta: "VARCHAR(100) DEFAULT ''",
      text_cta_color: "VARCHAR(50) DEFAULT '#ffffff'",
      text_cta_bg: "VARCHAR(50) DEFAULT '#1D8A5A'",
      is_new_window: "TINYINT DEFAULT 0",
    };
    for (const col of imgCols) {
      try { await pool.query(`ALTER TABLE seoulmono_image_banners ADD COLUMN IF NOT EXISTS ${col} ${imgColDefs[col]}`); } catch {}
    }
    const [cnt] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS c FROM seoulmono_image_banners");
    if (Number((cnt as any)[0].c) === 0) {
      await pool.query(`
        INSERT INTO seoulmono_image_banners (title, pc_image_url, mobile_image_url, link_url, sort_order, is_active)
        VALUES
          ('지구쇼핑몰 브랜드', '/shop/banners/banner1_pc.png', '/shop/banners/banner1_mobile.png', '/list?type=3', 1, 1),
          ('무료배송 안내', '/shop/banners/banner2_pc.png', '/shop/banners/banner2_mobile.png', '/list', 2, 1)
      `);
    }
  } catch (e) { console.error("image_banners init error", e); }
})();

router.get("/image-banners", async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM seoulmono_image_banners
       WHERE is_active = 1
         AND (start_date IS NULL OR start_date <= ?)
         AND (end_date IS NULL OR end_date >= ?)
       ORDER BY sort_order ASC, id ASC`,
      [today, today]
    );
    res.json({ banners: rows });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

router.get("/admin/image-banners", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM seoulmono_image_banners ORDER BY sort_order ASC, id ASC"
    );
    res.json({ banners: rows });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

router.post("/admin/image-banners", authMiddleware, adminMiddleware,
  bannerUpload.fields([{ name: "img_pc", maxCount: 1 }, { name: "img_mobile", maxCount: 1 }]),
  async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const pcUrl = files?.img_pc?.[0] ? `/api/editor-uploaded/${files.img_pc[0].filename}` : (req.body.pc_image_url || "");
      const mobileUrl = files?.img_mobile?.[0] ? `/api/editor-uploaded/${files.img_mobile[0].filename}` : (req.body.mobile_image_url || "");
      const { banner_type, title, link_url, is_new_window, start_date, end_date, sort_order, is_active,
              bg_color, text_title, text_sub, text_cta, text_cta_color, text_cta_bg } = req.body;
      const result = await pool.query<ResultSetHeader>(
        `INSERT INTO seoulmono_image_banners (banner_type, title, pc_image_url, mobile_image_url, bg_color, text_title, text_sub, text_cta, text_cta_color, text_cta_bg, link_url, is_new_window, start_date, end_date, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [banner_type || "image", title || "", pcUrl, mobileUrl, bg_color || "#1D8A5A", text_title || "", text_sub || "", text_cta || "", text_cta_color || "#ffffff", text_cta_bg || "#1D8A5A",
         link_url || "", Number(is_new_window) || 0, start_date || null, end_date || null, Number(sort_order) || 0, is_active === "1" || is_active === true ? 1 : 0]
      );
      const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_image_banners WHERE id=?", [(result[0] as ResultSetHeader).insertId]);
      res.json({ banner: rows[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: "サーバーエラー" }); }
  }
);

router.put("/admin/image-banners/:id", authMiddleware, adminMiddleware,
  bannerUpload.fields([{ name: "img_pc", maxCount: 1 }, { name: "img_mobile", maxCount: 1 }]),
  async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const [existing] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_image_banners WHERE id=?", [req.params.id]);
      const cur = (existing as any)[0] || {};
      const pcUrl = files?.img_pc?.[0] ? `/api/editor-uploaded/${files.img_pc[0].filename}` : (req.body.pc_image_url || cur.pc_image_url || "");
      const mobileUrl = files?.img_mobile?.[0] ? `/api/editor-uploaded/${files.img_mobile[0].filename}` : (req.body.mobile_image_url || cur.mobile_image_url || "");
      const { banner_type, title, link_url, is_new_window, start_date, end_date, sort_order, is_active,
              bg_color, text_title, text_sub, text_cta, text_cta_color, text_cta_bg } = req.body;
      await pool.query(
        `UPDATE seoulmono_image_banners SET banner_type=?, title=?, pc_image_url=?, mobile_image_url=?, bg_color=?, text_title=?, text_sub=?, text_cta=?, text_cta_color=?, text_cta_bg=?, link_url=?, is_new_window=?, start_date=?, end_date=?, sort_order=?, is_active=? WHERE id=?`,
        [banner_type || cur.banner_type || "image", title || "", pcUrl, mobileUrl, bg_color || cur.bg_color || "#1D8A5A", text_title ?? cur.text_title ?? "", text_sub ?? cur.text_sub ?? "", text_cta ?? cur.text_cta ?? "", text_cta_color || cur.text_cta_color || "#ffffff", text_cta_bg || cur.text_cta_bg || "#1D8A5A",
         link_url || "", Number(is_new_window) || 0, start_date || null, end_date || null, Number(sort_order) || 0, is_active === "1" || is_active === true ? 1 : 0, req.params.id]
      );
      const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_image_banners WHERE id=?", [req.params.id]);
      res.json({ banner: rows[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: "サーバーエラー" }); }
  }
);

router.delete("/admin/image-banners/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM seoulmono_image_banners WHERE id=?", [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

// ─── B2B Banner (발주시스템 배너) ──────────────────────────────────────────────
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_b2b_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        banner_type VARCHAR(10) DEFAULT 'image',
        img_pc VARCHAR(1000) DEFAULT '',
        img_mobile VARCHAR(1000) DEFAULT '',
        bg_color VARCHAR(200) DEFAULT '#1D8A5A',
        text_title VARCHAR(300) DEFAULT '',
        text_sub VARCHAR(500) DEFAULT '',
        text_cta VARCHAR(100) DEFAULT '',
        text_cta_color VARCHAR(50) DEFAULT '#ffffff',
        text_cta_bg VARCHAR(50) DEFAULT '#1D8A5A',
        title VARCHAR(200) DEFAULT '',
        link_url VARCHAR(500) DEFAULT '',
        is_new_window TINYINT DEFAULT 0,
        start_date DATE DEFAULT NULL,
        end_date DATE DEFAULT NULL,
        sort_order INT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    const cols = ["banner_type","bg_color","text_title","text_sub","text_cta","text_cta_color","text_cta_bg"] as const;
    const alterDefs: Record<string, string> = {
      banner_type: "VARCHAR(10) DEFAULT 'image'",
      bg_color: "VARCHAR(200) DEFAULT '#1D8A5A'",
      text_title: "VARCHAR(300) DEFAULT ''",
      text_sub: "VARCHAR(500) DEFAULT ''",
      text_cta: "VARCHAR(100) DEFAULT ''",
      text_cta_color: "VARCHAR(50) DEFAULT '#ffffff'",
      text_cta_bg: "VARCHAR(50) DEFAULT '#1D8A5A'",
    };
    for (const col of cols) {
      try { await pool.query(`ALTER TABLE seoulmono_b2b_banners ADD COLUMN IF NOT EXISTS ${col} ${alterDefs[col]}`); } catch {}
    }
    const [cnt] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS c FROM seoulmono_b2b_banners");
    if (Number((cnt as any)[0].c) === 0) {
      await pool.query(`
        INSERT INTO seoulmono_b2b_banners (img_pc, img_mobile, title, link_url, sort_order, is_active)
        VALUES
          ('/shop/banners/banner1_pc.png', '/shop/banners/banner1_mobile.png', '지구쇼핑몰 브랜드', '/list?type=3', 1, 1),
          ('/shop/banners/banner2_pc.png', '/shop/banners/banner2_mobile.png', '무료배송 안내', '/list', 2, 1)
      `);
    }
  } catch (e) { console.error("b2b_banners init error", e); }
})();

router.get("/admin/b2b-banners", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM seoulmono_b2b_banners ORDER BY sort_order ASC, id ASC"
    );
    res.json({ banners: rows });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

router.post("/admin/b2b-banners", authMiddleware, adminMiddleware,
  bannerUpload.fields([{ name: "img_pc", maxCount: 1 }, { name: "img_mobile", maxCount: 1 }]),
  async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const pcUrl = files?.img_pc?.[0] ? `/api/editor-uploaded/${files.img_pc[0].filename}` : (req.body.img_pc_url || "");
      const mobileUrl = files?.img_mobile?.[0] ? `/api/editor-uploaded/${files.img_mobile[0].filename}` : (req.body.img_mobile_url || "");
      const { title, link_url, is_new_window, start_date, end_date, sort_order, is_active,
              banner_type, bg_color, text_title, text_sub, text_cta, text_cta_color, text_cta_bg } = req.body;
      const result = await pool.query<ResultSetHeader>(
        `INSERT INTO seoulmono_b2b_banners (banner_type, img_pc, img_mobile, bg_color, text_title, text_sub, text_cta, text_cta_color, text_cta_bg, title, link_url, is_new_window, start_date, end_date, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [banner_type || "image", pcUrl, mobileUrl, bg_color || "#1D8A5A", text_title || "", text_sub || "", text_cta || "", text_cta_color || "#ffffff", text_cta_bg || "#1D8A5A",
         title || "", link_url || "", Number(is_new_window) || 0,
         start_date || null, end_date || null, Number(sort_order) || 0, is_active === "1" || is_active === true ? 1 : 0]
      );
      const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_b2b_banners WHERE id=?", [(result[0] as ResultSetHeader).insertId]);
      res.json({ banner: rows[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: "サーバーエラー" }); }
  }
);

router.put("/admin/b2b-banners/:id", authMiddleware, adminMiddleware,
  bannerUpload.fields([{ name: "img_pc", maxCount: 1 }, { name: "img_mobile", maxCount: 1 }]),
  async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const [existing] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_b2b_banners WHERE id=?", [req.params.id]);
      const cur = (existing as any)[0] || {};
      const pcUrl = files?.img_pc?.[0] ? `/api/editor-uploaded/${files.img_pc[0].filename}` : (req.body.img_pc_url || cur.img_pc || "");
      const mobileUrl = files?.img_mobile?.[0] ? `/api/editor-uploaded/${files.img_mobile[0].filename}` : (req.body.img_mobile_url || cur.img_mobile || "");
      const { title, link_url, is_new_window, start_date, end_date, sort_order, is_active,
              banner_type, bg_color, text_title, text_sub, text_cta, text_cta_color, text_cta_bg } = req.body;
      await pool.query(
        `UPDATE seoulmono_b2b_banners SET banner_type=?, img_pc=?, img_mobile=?, bg_color=?, text_title=?, text_sub=?, text_cta=?, text_cta_color=?, text_cta_bg=?, title=?, link_url=?, is_new_window=?, start_date=?, end_date=?, sort_order=?, is_active=? WHERE id=?`,
        [banner_type || cur.banner_type || "image", pcUrl, mobileUrl, bg_color || cur.bg_color || "#1D8A5A", text_title ?? cur.text_title ?? "", text_sub ?? cur.text_sub ?? "", text_cta ?? cur.text_cta ?? "", text_cta_color || cur.text_cta_color || "#ffffff", text_cta_bg || cur.text_cta_bg || "#1D8A5A",
         title || "", link_url || "", Number(is_new_window) || 0,
         start_date || null, end_date || null, Number(sort_order) || 0, is_active === "1" || is_active === true ? 1 : 0, req.params.id]
      );
      const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_b2b_banners WHERE id=?", [req.params.id]);
      res.json({ banner: rows[0] });
    } catch (e) { console.error(e); res.status(500).json({ error: "サーバーエラー" }); }
  }
);

router.delete("/admin/b2b-banners/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM seoulmono_b2b_banners WHERE id=?", [req.params.id]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "サーバーエラー" }); }
});

export default router;

