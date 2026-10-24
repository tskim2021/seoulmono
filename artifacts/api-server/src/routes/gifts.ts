import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { authMiddleware, adminMiddleware } from "../lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";

const SMS_API_URL = "https://sms.bizservice.iwinv.kr/api/v2/send/";
const SMS_SECRET = (process.env.SMS_SECRET || "").trim();
const SMS_FROM   = (process.env.SMS_FROM   || "").trim();
const SITE_URL   = (process.env.SITE_URL   || "https://seoulmono.com").trim();

async function sendGiftSms(to: string, senderName: string, giftLink: string, setName: string): Promise<void> {
  if (!SMS_SECRET || !SMS_FROM) return;
  const text = `[ソウルモノ] ${senderName}様からギフトが届きました。\n${setName}\n下記のリンクから配送先をご入力ください。\n${giftLink}`;
  try {
    await fetch(SMS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8", secret: SMS_SECRET },
      body: JSON.stringify({ version: "1.0", from: SMS_FROM, to: [to], text, date: null }),
    });
  } catch { /* ignore */ }
}

const giftImgDir = path.resolve(process.cwd(), "uploads/gift-packages");
if (!fs.existsSync(giftImgDir)) fs.mkdirSync(giftImgDir, { recursive: true });

const giftImgUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error("画像ファイルのみアップロードできます (jpg, png, gif, webp)"));
  },
});

const router: IRouter = Router();

const CAFE24_IMG_BASE = "/api/product-image";

function imgUrl(img1: string) {
  if (!img1) return "";
  if (img1.startsWith("http")) return img1.replace("/data/item2/", "/data/item/");
  return `${CAFE24_IMG_BASE}/${img1}`;
}

// ─── DB Init ──────────────────────────────────────────────────────────────────
;(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_gift_set_config (
        ca_id VARCHAR(10) NOT NULL PRIMARY KEY,
        slot_count INT NOT NULL DEFAULT 1,
        price INT NOT NULL DEFAULT 0,
        description TEXT,
        is_active TINYINT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_gift_set_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        set_ca_id VARCHAR(10) NOT NULL,
        it_id VARCHAR(30) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        UNIQUE KEY uq_set_item (set_ca_id, it_id),
        KEY idx_set_ca (set_ca_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_gift_packages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price INT NOT NULL DEFAULT 0,
        thumb_img VARCHAR(500),
        ca_id VARCHAR(10) NOT NULL,
        item_count INT NOT NULL DEFAULT 1,
        is_active TINYINT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_gift_package_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        package_id INT NOT NULL,
        it_id VARCHAR(30) NOT NULL,
        it_name VARCHAR(200) NOT NULL,
        it_img1 VARCHAR(500),
        quantity INT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        KEY idx_package (package_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_gift_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(64) NOT NULL UNIQUE,
        sender_mb_id VARCHAR(20),
        set_ca_id VARCHAR(10) NOT NULL,
        set_name VARCHAR(100) NOT NULL,
        slot_count INT NOT NULL DEFAULT 1,
        recipient_name VARCHAR(50),
        recipient_phone VARCHAR(20),
        recipient_postcode VARCHAR(10),
        recipient_address VARCHAR(200),
        recipient_address_detail VARCHAR(200),
        sender_message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        address_filled_at DATETIME,
        KEY idx_token (token),
        KEY idx_sender (sender_mb_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_gift_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        it_id VARCHAR(30) NOT NULL,
        it_name VARCHAR(200) NOT NULL,
        it_img1 VARCHAR(255),
        quantity INT NOT NULL DEFAULT 1,
        KEY idx_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    // ── 유지류(ca_id=20) 전용 상품 시드 ─────────────────────────────────────────
    const oilItems = [
      { it_id: "9901010001", it_name: "지구쇼핑몰 사조해표 카놀라유 900ml 3입 선물세트", it_img1: "1705520827/554X554.jpg", it_price: 19700, it_cust_price: 23800, ca_id: "20" },
      { it_id: "9901010002", it_name: "지구쇼핑몰 오뚜기 고소한 참기름 330ml 3입 선물세트", it_img1: "1705520827/554X554.jpg", it_price: 28900, it_cust_price: 35000, ca_id: "20" },
      { it_id: "9901010003", it_name: "지구쇼핑몰 사조해표 해바라기유 900ml 3입 선물세트", it_img1: "1705520827/554X554.jpg", it_price: 19700, it_cust_price: 24000, ca_id: "20" },
      { it_id: "9901010004", it_name: "지구쇼핑몰 CJ 비비고 들기름 200ml 3입 선물세트", it_img1: "1705520827/554X554.jpg", it_price: 24900, it_cust_price: 30000, ca_id: "20" },
      { it_id: "9901010005", it_name: "지구쇼핑몰 사조해표 포도씨유 900ml 3입 선물세트", it_img1: "1705520827/554X554.jpg", it_price: 21900, it_cust_price: 26500, ca_id: "20" },
      { it_id: "9901010006", it_name: "지구쇼핑몰 동서 올리브유+카놀라유 혼합 900ml 3입", it_img1: "1705520827/554X554.jpg", it_price: 23900, it_cust_price: 29000, ca_id: "20" },
      { it_id: "9901010007", it_name: "지구쇼핑몰 백설 카놀라유 1.8L 2입 선물세트", it_img1: "1707836634/554X554.jpg", it_price: 19700, it_cust_price: 24000, ca_id: "20" },
      { it_id: "9901010008", it_name: "지구쇼핑몰 사조해표 올리브유 1.8L 2입 선물세트", it_img1: "1707836634/554X554.jpg", it_price: 29900, it_cust_price: 36000, ca_id: "20" },
      { it_id: "9901010009", it_name: "지구쇼핑몰 오뚜기 들기름 1.8L 2입 선물세트", it_img1: "1707836634/554X554.jpg", it_price: 35900, it_cust_price: 43000, ca_id: "20" },
      { it_id: "9901010010", it_name: "지구쇼핑몰 사조해표 콩기름+해바라기유 900ml 4입", it_img1: "1705520827/554X554.jpg", it_price: 25900, it_cust_price: 31500, ca_id: "20" },
    ];
    for (const item of oilItems) {
      await pool.query(
        `INSERT IGNORE INTO g5_shop_item2
         (it_id, it_name, it_img1, it_price, it_cust_price, ca_id, it_use, it_order, it_hit, it_soldout, it_time)
         VALUES (?,?,?,?,?,?,'1',0,0,'','2024-01-01 00:00:00')`,
        [item.it_id, item.it_name, item.it_img1, item.it_price, item.it_cust_price, item.ca_id]
      );
    }

    // ── 캔통조림(ca_id=30) 전용 상품 시드 ───────────────────────────────────────
    const canItems = [
      // 참치류
      { it_id: "9901020001", it_name: "지구쇼핑몰 동원 살코기참치 85g 18개입 선물세트", it_img1: "1707836681/554X554.jpg", it_price: 19700, it_cust_price: 24000, ca_id: "30" },
      { it_id: "9901020002", it_name: "지구쇼핑몰 사조 마일드참치 85g 18개입 선물세트", it_img1: "1707836681/554X554.jpg", it_price: 19700, it_cust_price: 23800, ca_id: "30" },
      { it_id: "9901020003", it_name: "지구쇼핑몰 동원 살코기참치 100g 18개입 선물세트", it_img1: "1707836681/554X554.jpg", it_price: 24900, it_cust_price: 30000, ca_id: "30" },
      { it_id: "9901020004", it_name: "지구쇼핑몰 사조 마일드참치 100g 18개입 선물세트", it_img1: "1707836681/554X554.jpg", it_price: 24900, it_cust_price: 29900, ca_id: "30" },
      { it_id: "9901020005", it_name: "지구쇼핑몰 동원 참치 85g 6개+100g 6개 혼합 선물세트", it_img1: "1707836681/554X554.jpg", it_price: 22900, it_cust_price: 27500, ca_id: "30" },
      { it_id: "9901020006", it_name: "지구쇼핑몰 CJ 더건강한참치 100g 18개입 선물세트", it_img1: "1707836681/554X554.jpg", it_price: 27900, it_cust_price: 33000, ca_id: "30" },
      // 햄/스팸류
      { it_id: "9901030001", it_name: "지구쇼핑몰 CJ 스팸 클래식 200g 10개입 선물세트", it_img1: "1705519980/554X554.jpg", it_price: 39900, it_cust_price: 48000, ca_id: "30" },
      { it_id: "9901030002", it_name: "지구쇼핑몰 롯데 런천미트 200g 10개입 선물세트", it_img1: "1705519980/554X554.jpg", it_price: 35900, it_cust_price: 43000, ca_id: "30" },
      { it_id: "9901030003", it_name: "지구쇼핑몰 동원 리챔 200g 10개입 선물세트", it_img1: "1705519980/554X554.jpg", it_price: 37900, it_cust_price: 45500, ca_id: "30" },
      { it_id: "9901030004", it_name: "지구쇼핑몰 CJ 스팸 라이트 200g 10개입 선물세트", it_img1: "1705519980/554X554.jpg", it_price: 41900, it_cust_price: 50000, ca_id: "30" },
      { it_id: "9901030005", it_name: "지구쇼핑몰 한성 런천미트 340g 6개입 선물세트", it_img1: "1705519980/554X554.jpg", it_price: 32900, it_cust_price: 39500, ca_id: "30" },
      { it_id: "9901030006", it_name: "지구쇼핑몰 동원 리챔 340g 6개입 선물세트", it_img1: "1705519980/554X554.jpg", it_price: 38900, it_cust_price: 46500, ca_id: "30" },
      // 혼합
      { it_id: "9901040001", it_name: "지구쇼핑몰 참치+햄 혼합 선물세트 (85g×6+200g×4)", it_img1: "1705519980/554X554.jpg", it_price: 29900, it_cust_price: 36000, ca_id: "30" },
      { it_id: "9901040002", it_name: "지구쇼핑몰 스팸+참치 프리미엄 혼합 선물세트", it_img1: "1705519980/554X554.jpg", it_price: 34900, it_cust_price: 42000, ca_id: "30" },
    ];
    for (const item of canItems) {
      await pool.query(
        `INSERT IGNORE INTO g5_shop_item2
         (it_id, it_name, it_img1, it_price, it_cust_price, ca_id, it_use, it_order, it_hit, it_soldout, it_time)
         VALUES (?,?,?,?,?,?,'1',0,0,'','2024-01-01 00:00:00')`,
        [item.it_id, item.it_name, item.it_img1, item.it_price, item.it_cust_price, item.ca_id]
      );
    }

    // ── 유지류 카테고리별 큐레이팅 ────────────────────────────────────────────────
    // 2010: 900ml 3개입 → 올리브유, 카놀라유, 참기름, 해바라기유, 포도씨유, 들기름 등
    const oil3Set = ["1705520827","1707836634","9901010001","9901010002","9901010003","9901010004","9901010005","9901010006"];
    // 2020: 900ml 4개입 → 같은 오일에 혼합 포함
    const oil4Set = ["1705520827","1707836634","9901010001","9901010003","9901010005","9901010006","9901010010"];
    // 2030: 1.8L 2개입 → 대용량
    const oil18LSet = ["9901010007","9901010008","9901010009"];
    const oilCurated: [string, string][] = [
      ...oil3Set.map((id, i) => ["2010", id] as [string,string]),
      ...oil4Set.map((id, i) => ["2020", id] as [string,string]),
      ...oil18LSet.map((id, i) => ["2030", id] as [string,string]),
    ];
    for (let i = 0; i < oilCurated.length; i++) {
      await pool.query(
        `INSERT IGNORE INTO seoulmono_gift_set_products (set_ca_id, it_id, sort_order) VALUES (?,?,?)`,
        [oilCurated[i][0], oilCurated[i][1], i]
      );
    }

    // ── 캔통조림 카테고리별 큐레이팅 ─────────────────────────────────────────────
    // 3020: 참치 85g 18개입
    const tuna85 = ["1707836468","1707836694","9901020001","9901020002","9901020005"];
    // 3040: 참치 100g 18개입
    const tuna100 = ["1705520831","1707836681","1707836701","9901020003","9901020004","9901020006"];
    // 3060: 햄 200g 10개입
    const ham200 = ["1707836685","1707836608","1707836705","9901030001","9901030002","9901030003","9901030004"];
    // 3070: 햄 340g 6개입
    const ham340 = ["1705519980","1707836621","1707836690","9901030005","9901030006"];
    // 3080: 참치+햄 혼합
    const mix = ["1707836468","1707836681","1707836685","1707836608","9901040001","9901040002"];
    const canCurated: [string, string][] = [
      ...tuna85.map(id => ["3020", id] as [string,string]),
      ...tuna100.map(id => ["3040", id] as [string,string]),
      ...ham200.map(id => ["3060", id] as [string,string]),
      ...ham340.map(id => ["3070", id] as [string,string]),
      ...mix.map(id => ["3080", id] as [string,string]),
    ];
    for (let i = 0; i < canCurated.length; i++) {
      await pool.query(
        `INSERT IGNORE INTO seoulmono_gift_set_products (set_ca_id, it_id, sort_order) VALUES (?,?,?)`,
        [canCurated[i][0], canCurated[i][1], i]
      );
    }

    // ── 과자 카테고리 시딩 (g5_shop_item2 ca_id='10' 활성 상품 전체) ─────────────
    for (const snackSub of ["1010", "1020", "1030"]) {
      await pool.query(
        `INSERT IGNORE INTO seoulmono_gift_set_products (set_ca_id, it_id, sort_order)
         SELECT ?, it_id, it_order
         FROM g5_shop_item2
         WHERE ca_id='10' AND it_use=1 AND it_id NOT LIKE '990%'`,
        [snackSub]
      );
    }
  } catch (e: any) {
    console.error("Gift table init error:", e.message);
  }
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractSlotCount(caName: string): number {
  const m = caName.match(/(\d+)개입/);
  if (m) return parseInt(m[1], 10);
  const mixed = caName.match(/(\d+)개\+.+?(\d+)개/);
  if (mixed) return parseInt(mixed[1], 10) + parseInt(mixed[2], 10);
  return 1;
}

async function getGiftCategories() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT ca_id, ca_name FROM g5_shop_category2 WHERE LENGTH(ca_id)=2 ORDER BY ca_id"
  );
  return rows;
}

async function getGiftSubCategories(parentCaId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT ca_id, ca_name, ca_price, max_cnt FROM g5_shop_category2 WHERE ca_id LIKE ? AND LENGTH(ca_id)=4 ORDER BY ca_id",
    [`${parentCaId}%`]
  );
  return rows;
}

// ─── SHOP PUBLIC ROUTES ───────────────────────────────────────────────────────

router.get("/shop/gift/categories", async (_req, res) => {
  try {
    const cats = await getGiftCategories();

    const CAFE24_IMG2_BASE = "/api/product-image";
    function imgUrl2(img1: string) {
      if (!img1) return "";
      if (img1.startsWith("http")) return img1.replace("/data/item2/", "/data/item/");
      return `${CAFE24_IMG2_BASE}/${img1}`;
    }

    // 메인/서브 카테고리별 대표 이미지: 시드/플레이스홀더 제외하고 실제 상품 이미지 사용
    const [realImgRows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, ca_id, it_img1
       FROM g5_shop_item2
       WHERE it_use=1 AND it_img1 IS NOT NULL AND it_img1 != ''
         AND it_id NOT LIKE '990%'
         AND it_img1 NOT LIKE '%554X554%'
       ORDER BY it_order ASC, it_hit DESC
       LIMIT 200`
    );
    // ca_id(2자리) 및 ca_id(4자리) 별 첫 이미지 매핑 (중복 it_id 경로 정규화)
    const mainImgMap: Record<string, string> = {};
    for (const row of realImgRows as any[]) {
      const itId = String(row.it_id);
      let img = String(row.it_img1 || "");
      // it_img1이 "it_id/..." 형태로 시작하면 그대로, 아니면 it_id/ 앞에 붙임
      // 단, "it_id/it_id/..." 이중 중복은 제거
      if (img.startsWith(`${itId}/${itId}/`)) {
        img = img.slice(itId.length + 1); // 첫 번째 it_id/ 제거
      }
      if (!img.startsWith(`${itId}/`)) {
        img = `${itId}/${img}`;
      }
      const fullUrl = `${CAFE24_IMG2_BASE}/${img}`;
      const key2 = String(row.ca_id).slice(0, 2);
      const key4 = String(row.ca_id);
      if (!mainImgMap[key4]) mainImgMap[key4] = fullUrl;
      if (!mainImgMap[key2]) mainImgMap[key2] = fullUrl;
    }
    // g5_shop_item2에 없는 카테고리는 g5_shop_item에서 보완
    const [fallbackImgRows] = await pool.query<RowDataPacket[]>(
      `SELECT ca_id, it_id, it_img1
       FROM g5_shop_item
       WHERE it_use=1 AND it_img1 IS NOT NULL AND it_img1 != ''
         AND it_img1 NOT LIKE '%no_img%'
       ORDER BY it_order ASC, it_hit DESC
       LIMIT 100`
    );
    for (const row of fallbackImgRows as any[]) {
      const parentKey = String(row.ca_id).slice(0, 2);
      if (!mainImgMap[parentKey] && row.it_img1) {
        let img: string;
        if (row.it_img1.startsWith("http")) {
          img = row.it_img1;
        } else if (row.it_img1.startsWith(`${row.it_id}/`)) {
          // it_img1이 이미 "it_id/..." 형태 → 그대로 사용
          img = `${CAFE24_IMG2_BASE}/${row.it_img1}`;
        } else {
          img = `${CAFE24_IMG2_BASE}/${row.it_id}/${row.it_img1}`;
        }
        mainImgMap[parentKey] = img;
      }
    }

    const result = await Promise.all(cats.map(async (cat) => {
      const subs = await getGiftSubCategories(cat.ca_id);
      return {
        ...cat,
        main_thumb: mainImgMap[String(cat.ca_id)] ?? "",
        sub_categories: await Promise.all(subs.map(async (sub) => {
          const [cfg] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM seoulmono_gift_set_config WHERE ca_id=?", [sub.ca_id]
          );
          const config = cfg[0] || null;
          const slotCount = config?.slot_count ?? sub.max_cnt ?? extractSlotCount(sub.ca_name);
          const price = (config?.price > 0 ? config.price : null) ?? Number(sub.ca_price) ?? 0;

          const subThumb = mainImgMap[String(sub.ca_id).slice(0, 2)] ?? "";

          return {
            ca_id: sub.ca_id,
            ca_name: sub.ca_name,
            slot_count: slotCount,
            price,
            description: config?.description ?? "",
            is_active: config?.is_active ?? 1,
            thumb_img: subThumb,
          };
        })),
      };
    }));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/shop/gift/sets/:setCaId/products", async (req, res) => {
  try {
    const { setCaId } = req.params as { setCaId: string };

    // 큐레이팅된 상품이 있는지 먼저 확인
    const [curated] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM seoulmono_gift_set_products WHERE set_ca_id = ?`,
      [setCaId]
    );
    const hasCurated = (curated[0]?.cnt ?? 0) > 0;

    let rows: RowDataPacket[];
    if (hasCurated) {
      // 큐레이팅 상품 우선 사용
      [rows] = await pool.query<RowDataPacket[]>(
        `SELECT gsp.it_id, i.it_name, i.it_img1, i.it_price, i.it_cust_price
         FROM seoulmono_gift_set_products gsp
         JOIN g5_shop_item2 i ON gsp.it_id = i.it_id
         WHERE gsp.set_ca_id = ? AND i.it_use = 1
         ORDER BY gsp.sort_order ASC, gsp.id ASC`,
        [setCaId]
      );
    } else {
      // 큐레이팅 없으면 g5_shop_item2 전체 상품 반환
      [rows] = await pool.query<RowDataPacket[]>(
        `SELECT it_id, it_name, it_img1, it_price, it_cust_price
         FROM g5_shop_item2
         WHERE it_use = 1
         ORDER BY it_id ASC`
      );
    }

    res.json(rows.map(r => ({
      ...r,
      it_img1: imgUrl(r.it_img1),
      it_price: Number(r.it_price) || 0,
      it_cust_price: Number(r.it_cust_price) || 0,
    })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/shop/gift/orders", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { set_ca_id, set_name, slot_count, items, recipient_name, recipient_phone, sender_message } = req.body;
    if (!set_ca_id || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "必須情報が不足しています" });
      return;
    }
    const token = crypto.randomBytes(24).toString("hex");
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO seoulmono_gift_orders
       (token, sender_mb_id, set_ca_id, set_name, slot_count, recipient_name, recipient_phone, sender_message, status)
       VALUES (?,?,?,?,?,?,?,?,'pending')`,
      [token, user.mb_id, set_ca_id, set_name, slot_count, recipient_name || null, recipient_phone || null, sender_message || null]
    );
    const orderId = result.insertId;
    for (const item of items) {
      await pool.query(
        `INSERT INTO seoulmono_gift_order_items (order_id, it_id, it_name, it_img1, quantity)
         VALUES (?,?,?,?,?)`,
        [orderId, item.it_id, item.it_name, item.it_img1, item.quantity || 1]
      );
    }
    if (recipient_phone) {
      const giftLink = `${SITE_URL}/gift/recipient/${token}`;
      const senderDisplay = user.mb_name || user.mb_nick || "送り主";
      sendGiftSms(recipient_phone, senderDisplay, giftLink, set_name || "ギフト").catch(() => {});
    }
    res.json({ ok: true, token, order_id: orderId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/shop/gift/orders/my", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [orders] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM seoulmono_gift_orders WHERE sender_mb_id=? ORDER BY created_at DESC LIMIT 50`,
      [user.mb_id]
    );
    const result = await Promise.all(orders.map(async (o) => {
      const [items] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM seoulmono_gift_order_items WHERE order_id=?", [o.id]
      );
      return { ...o, items };
    }));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/shop/gift/send-sms", authMiddleware, async (req, res) => {
  try {
    if (!SMS_SECRET || !SMS_FROM) {
      res.status(500).json({ error: "SMSが設定されていません" }); return;
    }
    const user = (req as any).user;
    const { phone, giftLink, setName } = req.body as { phone: string; giftLink: string; setName: string };
    if (!phone || !giftLink) { res.status(400).json({ error: "電話番号とリンクが必要です" }); return; }
    const to = phone.replace(/[^0-9]/g, "");
    const senderName = user.mb_name || user.mb_id || "送り主";
    const text = `[ソウルモノ] ${senderName}様からギフトが届きました。\n${setName || "ギフトセット"}\n下記のリンクから配送先をご入力ください。\n${giftLink}`;
    const resp = await fetch(SMS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8", secret: SMS_SECRET },
      body: JSON.stringify({ version: "1.0", from: SMS_FROM, to: [to], text, date: null }),
    });
    const result = await resp.json().catch(() => ({}));
    if (!resp.ok) { res.status(500).json({ error: "SMS送信に失敗しました", detail: result }); return; }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/shop/gift/orders/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params as { id: string };
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM seoulmono_gift_orders WHERE id=? AND sender_mb_id=?", [id, user.mb_id]
    );
    if (!rows[0]) { res.status(404).json({ error: "注文が見つかりません" }); return; }
    const order = rows[0];
    const [items] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM seoulmono_gift_order_items WHERE order_id=?", [order.id]
    );
    res.json({ ...order, items: items.map(i => ({ ...i, it_img1: imgUrl(i.it_img1) })) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/shop/gift/recipient/:token", async (req, res) => {
  try {
    const { token } = req.params as { token: string };
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM seoulmono_gift_orders WHERE token=?", [token]
    );
    if (!rows[0]) { res.status(404).json({ error: "ギフトが見つかりません" }); return; }
    const order = rows[0];
    const [items] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM seoulmono_gift_order_items WHERE order_id=?", [order.id]
    );
    const masked = {
      id: order.id, set_name: order.set_name, slot_count: order.slot_count,
      sender_message: order.sender_message, status: order.status,
      created_at: order.created_at,
      recipient_name: order.recipient_name,
      address_filled: !!order.address_filled_at,
      items: items.map(i => ({ ...i, it_img1: imgUrl(i.it_img1) })),
    };
    res.json(masked);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/shop/gift/recipient/:token/address", async (req, res) => {
  try {
    const { token } = req.params as { token: string };
    const { recipient_name, recipient_phone, recipient_postcode, recipient_address, recipient_address_detail } = req.body;
    if (!recipient_name || !recipient_phone || !recipient_address) {
      res.status(400).json({ error: "お届け先の情報をすべて入力してください" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, status FROM seoulmono_gift_orders WHERE token=?", [token]
    );
    if (!rows[0]) { res.status(404).json({ error: "ギフトが見つかりません" }); return; }
    if (rows[0].status === "address_filled") {
      res.status(400).json({ error: "すでに住所が入力されているギフトです" }); return;
    }
    await pool.query(
      `UPDATE seoulmono_gift_orders SET
       recipient_name=?, recipient_phone=?, recipient_postcode=?,
       recipient_address=?, recipient_address_detail=?,
       status='address_filled', address_filled_at=NOW()
       WHERE token=?`,
      [recipient_name, recipient_phone, recipient_postcode || "", recipient_address, recipient_address_detail || "", token]
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 선물 상품 카탈로그 (직접 구성용) ────────────────────────────────────────

router.get("/shop/gift/catalog", async (req, res) => {
  try {
    const { search = "", page = "1", limit = "24", ca_id = "" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(48, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    let caCondition = "it_use = 1 AND it_id NOT LIKE '990%'";
    const params: any[] = [];

    if (ca_id === "10") {
      caCondition += " AND (ca_id LIKE '40%' OR ca_id LIKE '10%')";
    } else if (ca_id === "20") {
      caCondition += " AND (ca_id LIKE '30%' OR ca_id LIKE '20%')";
    } else if (ca_id === "30") {
      caCondition += " AND (ca_id LIKE '10%' OR ca_id LIKE '30%')";
    }

    if (search) {
      caCondition += " AND it_name LIKE ?";
      params.push(`%${search}%`);
    }

    // 먼저 패키지 아이템에 있는 상품을 우선 표시
    const [pkgItems] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT pi.it_id, i.it_name, i.it_img1, i.it_price, i.ca_id
       FROM seoulmono_gift_package_items pi
       JOIN g5_shop_item i ON pi.it_id = i.it_id
       WHERE i.it_use = 1
       ORDER BY i.it_hit DESC`
    );

    if (pkgItems.length > 0 && !search && !ca_id) {
      const result = pkgItems.map(r => ({
        it_id: r.it_id,
        it_name: r.it_name,
        it_img1: imgUrl(r.it_img1),
        it_price: Number(r.it_price) || 0,
        ca_id: r.ca_id,
      }));
      return res.json({ items: result, total: result.length, page: 1 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, it_name, it_img1, it_price, ca_id
       FROM g5_shop_item
       WHERE ${caCondition}
       ORDER BY it_hit DESC, it_order ASC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_shop_item WHERE ${caCondition}`,
      params
    );
    res.json({
      items: rows.map(r => ({
        it_id: r.it_id,
        it_name: r.it_name,
        it_img1: imgUrl(r.it_img1),
        it_price: Number(r.it_price) || 0,
        ca_id: r.ca_id,
      })),
      total: (countRows[0] as any)?.total ?? 0,
      page: pageNum,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 커스텀 선물 주문 (직접 구성) ────────────────────────────────────────────
router.post("/shop/gift/orders/custom", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { items, sender_message, set_name } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "商品を1点以上選択してください" });
      return;
    }
    const token = crypto.randomBytes(24).toString("hex");
    const finalName = set_name || "オリジナルギフトセット";
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO seoulmono_gift_orders
       (token, sender_mb_id, set_ca_id, set_name, slot_count, sender_message, status)
       VALUES (?,?,?,?,?,?,'pending')`,
      [token, user.mb_id, "custom", finalName, items.length, sender_message || null]
    );
    const orderId = result.insertId;
    for (const item of items) {
      await pool.query(
        `INSERT INTO seoulmono_gift_order_items (order_id, it_id, it_name, it_img1, quantity)
         VALUES (?,?,?,?,?)`,
        [orderId, item.it_id, item.it_name, item.it_img1 || "", item.quantity || 1]
      );
    }
    res.json({ ok: true, token, order_id: orderId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 패키지 선물 주문 ─────────────────────────────────────────────────────────
router.post("/shop/gift/orders/package", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { package_id, sender_message } = req.body;
    if (!package_id) { res.status(400).json({ error: "package_id required" }); return; }

    const [pkgs] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM seoulmono_gift_packages WHERE id=? AND is_active=1", [package_id]
    );
    if (!pkgs[0]) { res.status(404).json({ error: "パッケージが見つかりません" }); return; }
    const pkg = pkgs[0];

    const [pkgItems] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM seoulmono_gift_package_items WHERE package_id=? ORDER BY sort_order ASC", [package_id]
    );

    const token = crypto.randomBytes(24).toString("hex");
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO seoulmono_gift_orders
       (token, sender_mb_id, set_ca_id, set_name, slot_count, sender_message, status)
       VALUES (?,?,?,?,?,?,'pending')`,
      [token, user.mb_id, `pkg_${package_id}`, pkg.name, pkgItems.length, sender_message || null]
    );
    const orderId = result.insertId;
    for (const item of pkgItems) {
      await pool.query(
        `INSERT INTO seoulmono_gift_order_items (order_id, it_id, it_name, it_img1, quantity)
         VALUES (?,?,?,?,?)`,
        [orderId, item.it_id, item.it_name, item.it_img1 || "", item.quantity || 1]
      );
    }
    res.json({ ok: true, token, order_id: orderId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

router.get("/shop-admin/gift/categories", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const cats = await getGiftCategories();
    const result = await Promise.all(cats.map(async (cat) => {
      const subs = await getGiftSubCategories(cat.ca_id);
      return {
        ...cat,
        sub_categories: await Promise.all(subs.map(async (sub) => {
          const [cfg] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM seoulmono_gift_set_config WHERE ca_id=?", [sub.ca_id]
          );
          const config = cfg[0];
          const slotCount = config?.slot_count ?? extractSlotCount(sub.ca_name);
          return {
            ca_id: sub.ca_id,
            ca_name: sub.ca_name,
            slot_count: slotCount,
            price: config?.price ?? 0,
            description: config?.description ?? "",
            is_active: config?.is_active ?? 1,
            sort_order: config?.sort_order ?? 0,
          };
        })),
      };
    }));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/shop-admin/gift/set-config/:caid", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { caid } = req.params as { caid: string };
    const { slot_count, price, description, is_active, sort_order } = req.body;
    await pool.query(
      `INSERT INTO seoulmono_gift_set_config (ca_id, slot_count, price, description, is_active, sort_order)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
       slot_count=VALUES(slot_count), price=VALUES(price),
       description=VALUES(description), is_active=VALUES(is_active), sort_order=VALUES(sort_order)`,
      [caid, slot_count ?? 1, price ?? 0, description ?? "", is_active ?? 1, sort_order ?? 0]
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/shop-admin/gift/set-products/:caid", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { caid } = req.params as { caid: string };
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT gsp.id, gsp.it_id, gsp.sort_order, i.it_name, i.it_img1, i.it_price, i.it_cust_price
       FROM seoulmono_gift_set_products gsp
       JOIN g5_shop_item2 i ON gsp.it_id = i.it_id
       WHERE gsp.set_ca_id=?
       ORDER BY gsp.sort_order ASC, gsp.id ASC`,
      [caid]
    );
    res.json(rows.map(r => ({ ...r, it_img1: imgUrl(r.it_img1) })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/shop-admin/gift/set-products/:caid", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { caid } = req.params as { caid: string };
    const { it_id, sort_order } = req.body;
    if (!it_id) { res.status(400).json({ error: "商品IDが必要です" }); return; }
    await pool.query(
      `INSERT IGNORE INTO seoulmono_gift_set_products (set_ca_id, it_id, sort_order) VALUES (?,?,?)`,
      [caid, it_id, sort_order ?? 0]
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/shop-admin/gift/set-products/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    await pool.query("DELETE FROM seoulmono_gift_set_products WHERE id=?", [id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/shop-admin/gift/orders", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = "1", limit = "20", status } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const where = status ? "WHERE status=?" : "";
    const params: any[] = status ? [status, limitNum, offset] : [limitNum, offset];
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM seoulmono_gift_orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM seoulmono_gift_orders ${where}`,
      status ? [status] : []
    );
    const result = await Promise.all(rows.map(async (o) => {
      const [items] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM seoulmono_gift_order_items WHERE order_id=?", [o.id]
      );
      return { ...o, items: items.map(i => ({ ...i, it_img1: imgUrl(i.it_img1) })) };
    }));
    res.json({ orders: result, total: (countRows[0] as any)?.total ?? 0, page: pageNum });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/shop-admin/gift/orders/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_gift_orders WHERE id=?", [id]);
    if (!rows[0]) { res.status(404).json({ error: "注文が見つかりません" }); return; }
    const [items] = await pool.query<RowDataPacket[]>("SELECT * FROM seoulmono_gift_order_items WHERE order_id=?", [id]);
    res.json({ ...rows[0], items: items.map(i => ({ ...i, it_img1: imgUrl(i.it_img1) })) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/shop-admin/gift/orders/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { status, tracking_number, memo } = req.body;
    const allowed = ["pending", "address_filled", "preparing", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) { res.status(400).json({ error: "ステータス値が正しくありません" }); return; }
    await pool.query(
      `UPDATE seoulmono_gift_orders SET status=?, tracking_number=COALESCE(?,tracking_number), admin_memo=COALESCE(?,admin_memo) WHERE id=?`,
      [status, tracking_number || null, memo || null, id]
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 상품 관리 CRUD (g5_shop_item2) ─────────────────────────────────────────

router.get("/shop-admin/gift/items", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ca_id = "10", page = "1", limit = "20", search = "" } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const isSubCat = ca_id.length === 4;
    const caFilter = isSubCat ? ca_id : ca_id.substring(0, 2);
    const caCondition = isSubCat ? "ca_id = ?" : "ca_id LIKE ?";
    const caParam = isSubCat ? caFilter : `${caFilter}%`;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, ca_id, it_name, it_img1, it_price, it_cust_price,
              it_use, it_soldout, it_basic, it_option_subject, it_order
       FROM g5_shop_item2
       WHERE ${caCondition} AND it_name LIKE ? AND it_id NOT LIKE '990%'
       ORDER BY it_order ASC, it_id DESC
       LIMIT ? OFFSET ?`,
      [caParam, `%${search}%`, parseInt(limit), offset]
    );
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_shop_item2
       WHERE ${caCondition} AND it_name LIKE ? AND it_id NOT LIKE '990%'`,
      [caParam, `%${search}%`]
    );
    const total = (countRows[0] as any)?.total ?? 0;
    res.json({
      items: rows.map(r => ({ ...r, it_img1: imgUrl(r.it_img1) })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/shop-admin/gift/items/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id } = req.params as { it_id: string };
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, ca_id, it_name, it_img1, it_price, it_cust_price,
              it_use, it_soldout, it_basic, it_option_subject
       FROM g5_shop_item2 WHERE it_id=?`,
      [it_id]
    );
    if (!rows[0]) { res.status(404).json({ error: "商品がありません" }); return; }
    const [opts] = await pool.query<RowDataPacket[]>(
      `SELECT io_no, io_id, io_type, io_price, io_stock_qty, io_use
       FROM g5_shop_item_option WHERE it_id=? ORDER BY io_no ASC`,
      [it_id]
    );
    res.json({ ...rows[0], it_img1: imgUrl(rows[0].it_img1), options: opts });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/shop-admin/gift/items", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      ca_id, it_name, it_img1 = "", it_price = 0, it_cust_price = 0,
      it_use = 1, it_soldout = 0, it_basic = "", it_option_subject = "",
      options = [],
    } = req.body;
    if (!ca_id || !it_name) { res.status(400).json({ error: "カテゴリと商品名は必須です" }); return; }
    const it_id = String(Math.floor(Date.now() / 1000));
    // 이미지 URL이 full URL이면 저장, 아니면 그대로
    const rawImg = (it_img1 || "").replace(CAFE24_IMG_BASE + "/", "");
    await pool.query(
      `INSERT INTO g5_shop_item2
       (it_id, ca_id, it_name, it_img1, it_price, it_cust_price,
        it_use, it_soldout, it_basic, it_option_subject, it_supply_subject,
        it_time, it_update_time, it_ip, it_order, it_hit, it_sum_qty, it_use_cnt, it_use_avg)
       VALUES (?,?,?,?,?,?,?,?,?,?,'',NOW(),NOW(),'',0,0,0,0,0)`,
      [it_id, ca_id, it_name, rawImg, it_price, it_cust_price,
       it_use, it_soldout, it_basic, it_option_subject]
    );
    for (const opt of options as any[]) {
      if (!opt.io_id) continue;
      await pool.query(
        `INSERT INTO g5_shop_item_option
         (io_id, io_type, it_id, io_price, io_stock_qty, io_noti_qty, io_use, io_discount_percent, io_discount_price)
         VALUES (?,0,?,?,0,0,?,0,0)`,
        [opt.io_id, it_id, opt.io_price ?? 0, opt.io_use ?? 1]
      );
    }
    res.json({ ok: true, it_id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/shop-admin/gift/items/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id } = req.params as { it_id: string };
    const {
      ca_id, it_name, it_img1, it_price, it_cust_price,
      it_use, it_soldout, it_basic, it_option_subject,
      options = [],
    } = req.body;
    const rawImg = it_img1 ? it_img1.replace(CAFE24_IMG_BASE + "/", "") : undefined;
    await pool.query(
      `UPDATE g5_shop_item2 SET
       ca_id=?, it_name=?, it_price=?, it_cust_price=?,
       it_use=?, it_soldout=?, it_basic=?, it_option_subject=?,
       it_update_time=NOW()
       ${rawImg !== undefined ? ", it_img1=?" : ""}
       WHERE it_id=?`,
      rawImg !== undefined
        ? [ca_id, it_name, it_price, it_cust_price, it_use, it_soldout, it_basic, it_option_subject, rawImg, it_id]
        : [ca_id, it_name, it_price, it_cust_price, it_use, it_soldout, it_basic, it_option_subject, it_id]
    );
    // 옵션 전체 교체
    await pool.query("DELETE FROM g5_shop_item_option WHERE it_id=?", [it_id]);
    for (const opt of options as any[]) {
      if (!opt.io_id) continue;
      await pool.query(
        `INSERT INTO g5_shop_item_option
         (io_id, io_type, it_id, io_price, io_stock_qty, io_noti_qty, io_use, io_discount_percent, io_discount_price)
         VALUES (?,0,?,?,0,0,?,0,0)`,
        [opt.io_id, it_id, opt.io_price ?? 0, opt.io_use ?? 1]
      );
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/shop-admin/gift/items/:it_id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id } = req.params as { it_id: string };
    await pool.query("UPDATE g5_shop_item2 SET it_use=0 WHERE it_id=?", [it_id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/shop-admin/gift/search-products", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q = "", ca_id = "" } = req.query as Record<string, string>;
    // 이미 등록된 상품 제외
    const excludeIds: string[] = ca_id
      ? ((await pool.query<RowDataPacket[]>(
          "SELECT it_id FROM seoulmono_gift_set_products WHERE set_ca_id=?", [ca_id]
        ))[0] as any[]).map((r: any) => r.it_id)
      : [];

    const parentFilter = ca_id ? `${ca_id.substring(0, 2)}%` : "%";
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, it_name, it_img1, it_price FROM g5_shop_item2
       WHERE ca_id LIKE ? AND it_name LIKE ? AND it_id NOT LIKE '990%'
       ORDER BY it_use DESC, it_order ASC
       LIMIT 50`,
      [parentFilter, `%${q}%`]
    );
    const excludeSet = new Set(excludeIds);
    const filtered = (rows as any[]).filter((r: any) => !excludeSet.has(r.it_id));
    res.json(filtered.map(r => ({ ...r, it_img1: imgUrl(r.it_img1) })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 선물 패키지 (관리자 등록형) ─────────────────────────────────────────────

// Public: 패키지 목록
router.get("/shop/gift/packages", async (req, res) => {
  try {
    const { ca_id } = req.query as Record<string, string>;
    const where = ca_id ? "WHERE p.ca_id=? AND p.is_active=1" : "WHERE p.is_active=1";
    const params = ca_id ? [ca_id] : [];
    const [pkgs] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM seoulmono_gift_package_items WHERE package_id=p.id) AS actual_count
       FROM seoulmono_gift_packages p
       ${where}
       ORDER BY p.sort_order ASC, p.id DESC`,
      params
    );
    const result = await Promise.all((pkgs as any[]).map(async (pkg) => {
      const [items] = await pool.query<RowDataPacket[]>(
        `SELECT id, it_id, it_name, it_img1, quantity, sort_order
         FROM seoulmono_gift_package_items WHERE package_id=? ORDER BY sort_order ASC, id ASC LIMIT 4`,
        [pkg.id]
      );
      return { ...pkg, preview_items: items };
    }));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Public: 패키지 상세
router.get("/shop/gift/packages/:id", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM seoulmono_gift_packages WHERE id=? AND is_active=1", [id]
    );
    if (!rows[0]) { res.status(404).json({ error: "パッケージがありません" }); return; }
    const [items] = await pool.query<RowDataPacket[]>(
      `SELECT id, it_id, it_name, it_img1, quantity, sort_order
       FROM seoulmono_gift_package_items WHERE package_id=? ORDER BY sort_order ASC, id ASC`,
      [id]
    );
    res.json({ ...rows[0], items });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: 패키지 목록 (비활성 포함)
router.get("/shop-admin/gift/packages", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [pkgs] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, (SELECT COUNT(*) FROM seoulmono_gift_package_items WHERE package_id=p.id) AS item_count_actual
       FROM seoulmono_gift_packages p ORDER BY p.sort_order ASC, p.id DESC`
    );
    const result = await Promise.all((pkgs as any[]).map(async (pkg) => {
      const [items] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM seoulmono_gift_package_items WHERE package_id=? ORDER BY sort_order ASC, id ASC",
        [pkg.id]
      );
      return { ...pkg, items };
    }));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: 패키지 이미지 업로드
router.post("/shop-admin/gift/packages/upload-image", authMiddleware, adminMiddleware, giftImgUpload.single("image"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "画像ファイルがありません" }); return; }
  const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
  const filename = `gift_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;
  const buffer = req.file.buffer;

  // 1. 로컬 디스크 저장
  try { fs.writeFileSync(path.join(giftImgDir, filename), buffer); } catch (e: any) {
    console.warn("선물세트 이미지 로컬 디스크 저장 실패:", e.message);
  }

  // 2. MySQL에 영구 저장 (editor_images 테이블 공용)
  try {
    await pool.query(
      "INSERT INTO editor_images (filename, mimetype, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE mimetype=VALUES(mimetype), data=VALUES(data)",
      [filename, req.file.mimetype, buffer]
    );
  } catch (e: any) {
    console.error("선물세트 이미지 MySQL 저장 실패:", e.message);
  }

  res.json({ ok: true, url: `/api/editor-uploaded/${filename}` });
});

// Admin: 패키지 생성
router.post("/shop-admin/gift/packages", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description = "", price = 0, thumb_img = "", ca_id, item_count = 1, sort_order = 0, is_active = 1 } = req.body;
    if (!name || !ca_id) { res.status(400).json({ error: "name、ca_id は必須です" }); return; }
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO seoulmono_gift_packages (name, description, price, thumb_img, ca_id, item_count, sort_order, is_active)
       VALUES (?,?,?,?,?,?,?,?)`,
      [name, description, price, thumb_img, ca_id, item_count, sort_order, is_active]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: 패키지 수정
router.put("/shop-admin/gift/packages/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, price, thumb_img, ca_id, item_count, sort_order, is_active } = req.body;
    await pool.query(
      `UPDATE seoulmono_gift_packages SET name=?, description=?, price=?, thumb_img=?, ca_id=?, item_count=?, sort_order=?, is_active=? WHERE id=?`,
      [name, description ?? "", price ?? 0, thumb_img ?? "", ca_id, item_count ?? 1, sort_order ?? 0, is_active ?? 1, id]
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: 패키지 삭제
router.delete("/shop-admin/gift/packages/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    await pool.query("DELETE FROM seoulmono_gift_package_items WHERE package_id=?", [id]);
    await pool.query("DELETE FROM seoulmono_gift_packages WHERE id=?", [id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: 패키지 아이템 추가
router.post("/shop-admin/gift/packages/:id/items", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { it_id, it_name, it_img1 = "", quantity = 1, sort_order = 0 } = req.body;
    if (!it_id || !it_name) { res.status(400).json({ error: "it_id、it_name は必須です" }); return; }
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO seoulmono_gift_package_items (package_id, it_id, it_name, it_img1, quantity, sort_order)
       VALUES (?,?,?,?,?,?)`,
      [id, it_id, it_name, it_img1, quantity, sort_order]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: 패키지 아이템 삭제
router.delete("/shop-admin/gift/packages/:id/items/:itemId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params as { itemId: string };
    await pool.query("DELETE FROM seoulmono_gift_package_items WHERE id=?", [itemId]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: 패키지 상품 검색 (g5_shop_item2에서)
router.get("/shop-admin/gift/packages/search-items", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q = "", ca_id = "" } = req.query as Record<string, string>;
    const parentFilter = ca_id ? `${ca_id.substring(0, 2)}%` : "%";
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, it_name, it_img1, it_price, ca_id FROM g5_shop_item2
       WHERE ca_id LIKE ? AND it_name LIKE ? AND it_use=1
       ORDER BY it_order ASC, it_id DESC LIMIT 30`,
      [parentFilter, `%${q}%`]
    );
    res.json((rows as any[]).map(r => ({ ...r, it_img1: imgUrl(r.it_img1) })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 선물 서브카테고리 CRUD (g5_shop_category2) ─────────────────────────────

router.post("/shop-admin/gift/categories", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { parent_ca_id, ca_name } = req.body;
    if (!parent_ca_id || !ca_name) return res.status(400).json({ error: "parent_ca_id、ca_name は必須です" });
    if (String(parent_ca_id).length !== 2) return res.status(400).json({ error: "parent_ca_id は2桁である必要があります" });
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT ca_id FROM g5_shop_category2 WHERE ca_id LIKE ? AND LENGTH(ca_id)=4 ORDER BY ca_id DESC LIMIT 1",
      [`${parent_ca_id}%`]
    );
    const lastNum = (rows as any[])[0]?.ca_id ? parseInt((rows as any[])[0].ca_id) : parseInt(parent_ca_id) * 100;
    const newId = String(lastNum + 10);
    const newOrder = parseInt(newId);
    await pool.query(
      "INSERT INTO g5_shop_category2 (ca_id, ca_name, ca_order, ca_use) VALUES (?, ?, ?, 1)",
      [newId, ca_name, newOrder]
    );
    res.json({ ca_id: newId, ca_name, ca_order: newOrder });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/shop-admin/gift/categories/:ca_id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ca_id } = req.params as { ca_id: string };
    const { ca_name } = req.body;
    if (!ca_name) return res.status(400).json({ error: "ca_name は必須です" });
    await pool.query("UPDATE g5_shop_category2 SET ca_name=? WHERE ca_id=?", [ca_name, ca_id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/shop-admin/gift/categories/:ca_id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ca_id } = req.params as { ca_id: string };
    if (ca_id.length !== 4) return res.status(400).json({ error: "サブカテゴリ(4桁の ca_id)のみ削除できます" });
    await pool.query("DELETE FROM g5_shop_category2 WHERE ca_id=?", [ca_id]);
    await pool.query("DELETE FROM seoulmono_gift_set_config WHERE ca_id=?", [ca_id]);
    await pool.query("DELETE FROM seoulmono_gift_set_products WHERE set_ca_id=?", [ca_id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
