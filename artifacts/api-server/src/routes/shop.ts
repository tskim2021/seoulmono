import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { authMiddleware, adminMiddleware, verifyGnuboardPassword, gnuboardPasswordHash, createToken } from "../lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from "crypto";

const router: IRouter = Router();

function calcServerShipping(totalPrice: number, postcode: string, addr: string): number {
  const pc = parseInt((postcode || "").replace(/\D/g, ""), 10);
  if (!isNaN(pc) && pc >= 63000 && pc <= 63999) {
    return (totalPrice >= 40000 ? 0 : 3000) + 3000;
  }
  const a = (addr || "").toLowerCase();
  const islandKw = ["옹진군", "강화군", "신안군", "진도군", "완도군", "울릉군"];
  if (islandKw.some(kw => a.includes(kw))) {
    return (totalPrice >= 40000 ? 0 : 3000) + 5000;
  }
  const specialCities = ["동두천", "포천", "양주", "의정부"];
  if (specialCities.some(city => a.includes(city))) {
    return totalPrice >= 15000 ? 0 : 3000;
  }
  return totalPrice >= 40000 ? 0 : 3000;
}

// 배송지 테이블 자동생성 (없는 경우)
pool.query(`
  CREATE TABLE IF NOT EXISTS g5_member_address (
    ma_id      INT AUTO_INCREMENT PRIMARY KEY,
    mb_id      VARCHAR(20) NOT NULL DEFAULT '',
    ma_name    VARCHAR(50)  NOT NULL DEFAULT '',
    ma_hp      VARCHAR(20)  NOT NULL DEFAULT '',
    ma_zip1    VARCHAR(10)  NOT NULL DEFAULT '',
    ma_zip2    VARCHAR(10)  NOT NULL DEFAULT '',
    ma_addr1   VARCHAR(200) NOT NULL DEFAULT '',
    ma_addr2   VARCHAR(200) NOT NULL DEFAULT '',
    ma_addr3   VARCHAR(200) NOT NULL DEFAULT '',
    ma_default CHAR(1)      NOT NULL DEFAULT '0',
    INDEX idx_mb_id (mb_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`).then(() => console.log("[shop] g5_member_address 테이블 준비 완료"))
  .catch((e: Error) => console.error("[shop] g5_member_address 테이블 생성 실패:", e.message, e.stack));

// 공동구매/오늘만이가격 섹션 샘플 데이터 삽입 (비어 있을 경우)
(async () => {
  try {
    const GROUPBUY_SEEDS = ['1707836661','1753082555','1742208503'];
    const TODAYDEAL_SEEDS = ['1742203001','1764833063','1772025213'];
    const [gb] = await pool.query<any[]>("SELECT COUNT(*) as cnt FROM seoulmono_section_items WHERE section_type='groupbuy'");
    if ((gb as any)[0].cnt === 0) {
      for (let i = 0; i < GROUPBUY_SEEDS.length; i++) {
        await pool.query("INSERT IGNORE INTO seoulmono_section_items (section_type, it_id, sort_order) VALUES ('groupbuy',?,?)", [GROUPBUY_SEEDS[i], i]);
      }
      console.log("[shop] 공동구매 샘플 데이터 삽입 완료");
    }
    const [td] = await pool.query<any[]>("SELECT COUNT(*) as cnt FROM seoulmono_section_items WHERE section_type='todaydeal'");
    if ((td as any)[0].cnt === 0) {
      for (let i = 0; i < TODAYDEAL_SEEDS.length; i++) {
        await pool.query("INSERT IGNORE INTO seoulmono_section_items (section_type, it_id, sort_order) VALUES ('todaydeal',?,?)", [TODAYDEAL_SEEDS[i], i]);
      }
      console.log("[shop] 오늘만이가격 샘플 데이터 삽입 완료");
    }
  } catch (e: any) { console.error("[shop] 샘플 데이터 삽입 실패:", e.message); }
})();

const CAFE24_IMG_BASE = "/api/product-image";
const CAFE24_IMG2_BASE = "/api/product-image";
const IMG_PROXY_BASE = "/api/product-image";

function imgUrl(img1: string, base = CAFE24_IMG_BASE) {
  if (!img1) return "";
  if (img1.startsWith("/api/")) return img1;
  if (img1.startsWith("http")) {
    // g5_shop_item2는 DB에 /data/item2/ 경로가 저장돼 있지만 실제 파일은 /data/item/에 존재
    return img1.replace("/data/item2/", "/data/item/");
  }
  return `${base}/${img1}`;
}

function mapProduct(r: any) {
  return {
    it_id: r.it_id,
    it_name: r.it_name,
    it_price: Number(r.it_price) || 0,
    it_cust_price: Number(r.it_cust_price) || 0,
    it_img1: imgUrl(r.it_img1 || ""),
    ca_id: r.ca_id || "",
    ca_name: r.ca_name || "",
    it_soldout: r.it_soldout || "0",
    it_hit: Number(r.it_hit) || 0,
    it_use_cnt: Number(r.it_use_cnt) || 0,
    it_use_avg: Number(r.it_use_avg) || 0,
    it_point: r.it_point !== undefined ? Number(r.it_point) : undefined,
    it_point_type: r.it_point_type !== undefined ? Number(r.it_point_type) : undefined,
    box_qty: r.box_qty !== undefined ? Number(r.box_qty) : undefined,
    it_notax: r.it_notax !== undefined ? Number(r.it_notax) : undefined,
  };
}

async function queryWithFallback(
  pool: any,
  filter1Val: string,
  fallbackLimit: number,
  offset: number = 0
): Promise<RowDataPacket[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
     FROM g5_shop_item i
     LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
     WHERE i.it_use='1' AND i.filter1=? AND i.it_img1 != ''
     ORDER BY i.it_order ASC, i.it_time DESC
     LIMIT ? OFFSET ?`,
    [filter1Val, fallbackLimit, offset]
  );
  if ((rows as any[]).length > 0) return rows;

  const [fallback] = await pool.query<RowDataPacket[]>(
    `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
     FROM g5_shop_item i
     LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
     WHERE i.it_use='1' AND i.it_img1 != ''
     ORDER BY i.it_order ASC, i.it_time DESC
     LIMIT ? OFFSET ?`,
    [fallbackLimit, offset]
  );
  return fallback;
}

router.get("/shop/home", async (req, res) => {
  try {
    const [bestRows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_use='1' AND i.it_img1 != '' AND (i.filter1 IS NULL OR i.filter1 != '12')
       ORDER BY i.it_order ASC, i.it_hit DESC, i.it_time DESC
       LIMIT 20`
    );

    // 신상품: filter1='2' 있으면 그것만 표시, 0개일 때만 최신 등록 상품 폴백
    let [newRows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_use='1' AND i.filter1='2' AND i.it_img1 != ''
       ORDER BY i.it_order ASC, i.it_time DESC
       LIMIT 20`
    );
    if ((newRows as any[]).length === 0) {
      const [fallback] = await pool.query<RowDataPacket[]>(
        `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
         FROM g5_shop_item i
         LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
         WHERE i.it_use='1' AND i.it_img1 != ''
         ORDER BY i.it_time DESC
         LIMIT 10`
      );
      newRows = fallback as any;
    }
    const foodRows = await queryWithFallback(pool, '5', 8, 16);

    let [brandRows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_use='1' AND i.filter1='3' AND i.it_img1 != ''
       ORDER BY i.it_order ASC, i.it_time DESC
       LIMIT 20`
    );
    if ((brandRows as any[]).length === 0) {
      [brandRows] = await pool.query<RowDataPacket[]>(
        `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
         FROM g5_shop_item i
         LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
         WHERE i.it_use='1' AND i.it_img1 != ''
         ORDER BY i.it_time DESC
         LIMIT 10`
      );
    }

    const [catRows] = await pool.query<RowDataPacket[]>(
      `SELECT ca_id, ca_name FROM g5_shop_category WHERE ca_use=1 AND LENGTH(ca_id)=2 AND ca_id != 'ZZ' ORDER BY ca_order, ca_id`
    );

    res.json({
      best: (bestRows as any[]).map(mapProduct),
      newItems: (newRows as any[]).map(mapProduct),
      brand: (brandRows as any[]).map(mapProduct),
      food: (foodRows as any[]).map(mapProduct),
      categories: (catRows as any[]).map((r: any) => ({ ca_id: r.ca_id, ca_name: r.ca_name })),
    });
  } catch (err: any) {
    req.log?.error({ err }, "ShopHome error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 오늘의 특가 – filter1: 8=유통기한임박특가, 9=타임특가, 10=한정특가, 11=브랜드특가
router.get("/shop/specials", async (req, res) => {
  try {
    const SPECIAL_FILTERS = [
      { key: "expire",  label: "유통기한 임박특가", filter1: "8" },
      { key: "time",    label: "타임특가",         filter1: "9" },
      { key: "limited", label: "한정특가",         filter1: "10" },
      { key: "brand",   label: "브랜드특가",       filter1: "11" },
    ];

    const TARGET = 10;
    const results: Record<string, any[]> = {};
    for (const spec of SPECIAL_FILTERS) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
         FROM g5_shop_item i
         LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
         WHERE i.it_use='1' AND i.filter1=? AND i.it_img1 != ''
         ORDER BY i.it_order ASC, i.it_time DESC
         LIMIT ?`,
        [spec.filter1, TARGET]
      );
      let items = (rows as any[]).map(mapProduct);

      if (items.length < TARGET) {
        const existingIds = items.map((r: any) => r.it_id);
        const needed = TARGET - items.length;
        const placeholders = existingIds.length > 0
          ? `AND i.it_id NOT IN (${existingIds.map(() => "?").join(",")})` : "";
        const [fallback] = await pool.query<RowDataPacket[]>(
          `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
           FROM g5_shop_item i
           LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
           WHERE i.it_use='1' AND i.it_cust_price > 0 AND i.it_cust_price > i.it_price AND i.it_img1 != ''
           ${placeholders}
           ORDER BY RAND()
           LIMIT ?`,
          [...existingIds, needed]
        );
        items = [...items, ...(fallback as any[]).map(mapProduct)];
      }
      results[spec.key] = items;
    }

    res.json({
      tabs: SPECIAL_FILTERS.map(s => ({ key: s.key, label: s.label, count: results[s.key].length })),
      items: results,
    });
  } catch (err: any) {
    req.log?.error({ err }, "ShopSpecials error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 선물세트 DIY – g5_shop_item2
router.get("/shop/giftsets", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, it_name, it_price, it_cust_price, it_img1, ca_id, it_soldout, it_hit, it_use_cnt, it_use_avg
       FROM g5_shop_item2
       WHERE it_use=1 AND it_img1 != ''
       ORDER BY it_order ASC, it_hit DESC, it_time DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [cntRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_shop_item2 WHERE it_use=1 AND it_img1 != ''`
    );
    const total = Number((cntRows[0] as any).total);

    res.json({
      items: (rows as any[]).map(r => ({
        it_id: r.it_id,
        it_name: r.it_name,
        it_price: Number(r.it_price) || 0,
        it_cust_price: Number(r.it_cust_price) || 0,
        it_img1: imgUrl(r.it_img1 || "", CAFE24_IMG2_BASE),
        ca_id: r.ca_id || "",
        it_soldout: r.it_soldout ? "1" : "0",
        it_hit: Number(r.it_hit) || 0,
        it_use_cnt: Number(r.it_use_cnt) || 0,
        it_use_avg: Number(r.it_use_avg) || 0,
        is_gift: true,
      })),
      total,
      page,
      limit,
    });
  } catch (err: any) {
    req.log?.error({ err }, "ShopGiftsets error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 첫구매 100원 – seoulmono_first_purchase_items 테이블 기반
router.get("/shop/first-purchase", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT fp.custom_name, fp.custom_price, fp.custom_img,
              i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
       FROM seoulmono_first_purchase_items fp
       JOIN g5_shop_item i ON fp.it_id = i.it_id
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE fp.is_visible = 1 AND i.it_use = '1'
       ORDER BY fp.sort_order ASC, fp.id ASC
       LIMIT 8`
    );
    if ((rows as any[]).length > 0) {
      const items = (rows as any[]).map(r => {
        const base = mapProduct(r);
        return { ...base, it_name: r.custom_name || base.it_name, it_price: r.custom_price ?? 100, it_img1: r.custom_img || base.it_img1 };
      });
      return res.json({ items });
    }
    // fallback: filter1='13'
    const [fallback] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
       FROM g5_shop_item i LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_use='1' AND i.filter1='13' AND i.it_img1 != ''
       ORDER BY i.it_order ASC, i.it_time DESC LIMIT 8`
    );
    res.json({ items: (fallback as any[]).map(mapProduct) });
  } catch (err: any) {
    req.log?.error({ err }, "ShopFirstPurchase error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 최저가 도전 – filter1: 12
router.get("/shop/lowest", async (req, res) => {
  try {
    const TARGET = 10;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_use='1' AND i.filter1='12' AND i.it_img1 != ''
       ORDER BY i.it_order ASC, i.it_time DESC
       LIMIT ?`,
      [TARGET]
    );
    let items = (rows as any[]).map(mapProduct);

    if (items.length < TARGET) {
      const existingIds = items.map((r: any) => r.it_id);
      const needed = TARGET - items.length;
      const placeholders = existingIds.length > 0
        ? `AND i.it_id NOT IN (${existingIds.map(() => "?").join(",")})` : "";
      const [fallback] = await pool.query<RowDataPacket[]>(
        `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
         FROM g5_shop_item i
         LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
         WHERE i.it_use='1' AND i.it_cust_price > 0 AND i.it_cust_price > i.it_price AND i.it_img1 != ''
         ${placeholders}
         ORDER BY RAND()
         LIMIT ?`,
        [...existingIds, needed]
      );
      items = [...items, ...(fallback as any[]).map(mapProduct)];
    }

    res.json({ items });
  } catch (err: any) {
    req.log?.error({ err }, "ShopLowest error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.post("/shop/seed-demo", async (req, res) => {
  try {
    const GROUPBUY = ['1777631000','1777630705','1777438390'];
    const TODAYDEAL = ['1777631089','1777631182','1777428102'];
    await pool.query("DELETE FROM seoulmono_section_items WHERE section_type IN ('groupbuy','todaydeal')");
    for (let i = 0; i < GROUPBUY.length; i++)
      await pool.query("INSERT INTO seoulmono_section_items (section_type,it_id,sort_order) VALUES ('groupbuy',?,?)", [GROUPBUY[i], i]);
    for (let i = 0; i < TODAYDEAL.length; i++)
      await pool.query("INSERT INTO seoulmono_section_items (section_type,it_id,sort_order) VALUES ('todaydeal',?,?)", [TODAYDEAL[i], i]);
    res.json({ ok: true, groupbuy: GROUPBUY.length, todaydeal: TODAYDEAL.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/shop/groupbuy", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const [sids] = await pool.query<RowDataPacket[]>(
      "SELECT it_id FROM seoulmono_section_items WHERE section_type='groupbuy' ORDER BY sort_order ASC LIMIT ?",
      [limit]
    );
    const ids = (sids as any[]).map(r => r.it_id);
    if (ids.length === 0) return res.json({ items: [] });
    const ph = ids.map(() => "?").join(",");
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
       FROM g5_shop_item i LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_id IN (${ph}) AND i.it_use='1'
       ORDER BY FIELD(i.it_id, ${ph})`,
      [...ids, ...ids]
    );
    res.json({ items: (rows as any[]).map(mapProduct) });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

router.get("/shop/todaydeal", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const [sids] = await pool.query<RowDataPacket[]>(
      "SELECT it_id FROM seoulmono_section_items WHERE section_type='todaydeal' ORDER BY sort_order ASC LIMIT ?",
      [limit]
    );
    const ids = (sids as any[]).map(r => r.it_id);
    if (ids.length === 0) return res.json({ items: [] });
    const ph = ids.map(() => "?").join(",");
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
       FROM g5_shop_item i LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_id IN (${ph}) AND i.it_use='1'
       ORDER BY FIELD(i.it_id, ${ph})`,
      [...ids, ...ids]
    );
    res.json({ items: (rows as any[]).map(mapProduct) });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

router.get("/shop/categories", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.ca_id, c.ca_name, c.ca_order, COALESCE(ci.image_url, '') AS ca_img
       FROM g5_shop_category c
       LEFT JOIN seoulmono_category_images ci ON c.ca_id = ci.ca_id
       WHERE c.ca_use = '1' AND LENGTH(c.ca_id) = 2 AND c.ca_id != 'ZZ'
       ORDER BY c.ca_order, c.ca_id`
    );
    res.json({
      categories: (rows as any[]).map(r => ({
        ca_id: r.ca_id,
        ca_name: r.ca_name,
        ca_order: r.ca_order,
        ca_img: r.ca_img || "",
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류" });
  }
});

router.get("/shop/items", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const category = req.query.category as string || "";
    const search = req.query.search as string || "";
    const type = req.query.type as string || "";
    const sort = req.query.sort as string || "newest";
    const offset = (page - 1) * limit;

    let whereClause = "WHERE i.it_use='1'";
    const queryParams: any[] = [];

    // ── type=4: 첫구매 기획전 – seoulmono_first_purchase_items 기반 ──
    if (type === "4") {
      const [fpRows] = await pool.query<RowDataPacket[]>(
        `SELECT fp.custom_name, fp.custom_price, fp.custom_img,
                i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
         FROM seoulmono_first_purchase_items fp
         JOIN g5_shop_item i ON fp.it_id = i.it_id
         LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
         WHERE fp.is_visible = 1 AND i.it_use = '1'
         ORDER BY fp.sort_order ASC, fp.id ASC`
      );
      const items = (fpRows as any[]).map(r => {
        const base = mapProduct(r);
        return { ...base, it_name: r.custom_name || base.it_name, it_price: r.custom_price ?? 100, it_img1: r.custom_img || base.it_img1 };
      });
      return res.json({ items, total: items.length, page: 1, limit: items.length });
    }

    const SPECIAL_TYPES = ["8", "9", "10", "11", "12"];
    if (type) {
      if (SPECIAL_TYPES.includes(type)) {
        // 특가 타입은 fallback 없이 해당 filter1만 조회
        whereClause += " AND i.filter1=?";
        queryParams.push(type);
      } else {
        const [chkRows] = await pool.query<RowDataPacket[]>(
          `SELECT COUNT(*) as cnt FROM g5_shop_item WHERE it_use='1' AND filter1=? AND it_img1!=''`,
          [type]
        );
        const cnt = Number((chkRows[0] as any).cnt);
        if (cnt > 0) {
          whereClause += " AND i.filter1=?";
          queryParams.push(type);
        }
        // 베스트(type=1)에서는 최저가 도전 상품(filter1='12') 제외
        if (type === "1") {
          whereClause += " AND (i.filter1 IS NULL OR i.filter1 != '12')";
        }
      }
    } else if (category) {
      whereClause += " AND i.ca_id LIKE ?";
      queryParams.push(`${category}%`);
    } else {
      // 전체 상품 조회 시 ca_use=0(비노출) 카테고리 상품 제외
      whereClause += ` AND (
        i.ca_id = '' OR i.ca_id IS NULL OR
        SUBSTRING(i.ca_id,1,2) NOT IN (
          SELECT ca_id FROM g5_shop_category WHERE ca_use='0' AND LENGTH(ca_id)=2
        )
      )`;
    }

    if (search) {
      whereClause += " AND (i.it_name LIKE ? OR i.it_id LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    whereClause += " AND i.it_img1 != ''";

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_shop_item i ${whereClause}`,
      queryParams
    );
    const total = Number((countRows[0] as any).total);

    const orderBy = sort === "price_asc"
      ? "ORDER BY i.it_price ASC, i.it_order ASC"
      : sort === "price_desc"
        ? "ORDER BY i.it_price DESC, i.it_order ASC"
        : sort === "hit"
          ? "ORDER BY i.it_hit DESC, i.it_order ASC"
          : "ORDER BY i.it_order ASC, i.it_time DESC";

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_hit, i.it_use_cnt, i.it_use_avg, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       ${whereClause}
       ${orderBy}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      items: rows.map(mapProduct),
      total,
      page,
      limit,
    });
  } catch (err: any) {
    req.log?.error({ err }, "ShopItems error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/shop/items/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_stock_qty, i.it_soldout,
              i.it_img1, i.it_img2, i.it_img3, i.it_img4, i.it_img5,
              i.it_explan, i.it_origin, i.it_maker, i.it_1, i.it_2, i.ca_id, i.it_use_cnt, i.it_use_avg, i.filter1,
              i.it_point, i.it_point_type, i.it_notax, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_id=?`,
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "상품을 찾을 수 없습니다" });
      return;
    }
    const r = rows[0] as any;

    const images: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const img = r[`it_img${i}`];
      if (img) images.push(imgUrl(img));
    }

    const [optRows] = await pool.query<RowDataPacket[]>(
      `SELECT io_id, io_price, io_stock_qty, io_use FROM g5_shop_item_option WHERE it_id=? AND io_use='1' ORDER BY io_no`,
      [id]
    );

    res.json({
      item: {
      it_id: r.it_id,
      it_name: r.it_name,
      it_price: Number(r.it_price) || 0,
      it_cust_price: Number(r.it_cust_price) || 0,
      it_sale_price: Number(r.it_cust_price) || 0,
      it_stock_qty: Number(r.it_stock_qty) || 0,
      it_soldout: r.it_soldout || "0",
      it_img1: images[0] || "",
      images,
      it_explan: (r.it_explan || "").replace(/https?:\/\/seoulmono\.com\/data\//g, "https://thegaongill17.mycafe24.com/data/"),
      it_origin: r.it_origin || "",
      it_maker: r.it_maker || "",
      it_shelf_life: r.it_1 || "",
      box_qty: Number(r.it_2) || 0,
      ca_id: r.ca_id || "",
      ca_name: r.ca_name || "",
      it_use_cnt: Number(r.it_use_cnt) || 0,
      it_use_avg: Number(r.it_use_avg) || 0,
      filter1: r.filter1 || "",
      it_point: Number(r.it_point) || 0,
      it_point_type: Number(r.it_point_type) || 0,
      it_notax: Number(r.it_notax) || 0,
      options: (optRows as any[]).map(o => ({
        io_id: o.io_id,
        io_price: Number(o.io_price) || 0,
        io_stock_qty: Number(o.io_stock_qty) || 0,
      })),
      }
    });
  } catch (err: any) {
    req.log?.error({ err }, "ShopItemDetail error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/shop/items/:id/related", async (req, res) => {
  try {
    const id = req.params.id;
    const limit = 5;
    const [itemRows] = await pool.query<RowDataPacket[]>(
      `SELECT ca_id FROM g5_shop_item WHERE it_id=?`, [id]
    );
    const caId = (itemRows[0] as any)?.ca_id || "";
    let rows: RowDataPacket[];
    if (caId) {
      const prefix = caId.substring(0, 2);
      [rows] = await pool.query<RowDataPacket[]>(
        `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_use_cnt, i.it_use_avg, c.ca_name
         FROM g5_shop_item i
         LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
         WHERE i.it_id != ? AND i.it_soldout != '1' AND i.it_img1 != '' AND i.ca_id LIKE ? AND i.it_use='1'
         ORDER BY RAND() LIMIT ?`,
        [id, `${prefix}%`, limit]
      );
      if ((rows as any[]).length < 2) {
        [rows] = await pool.query<RowDataPacket[]>(
          `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_use_cnt, i.it_use_avg, c.ca_name
           FROM g5_shop_item i
           LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
           WHERE i.it_id != ? AND i.it_soldout != '1' AND i.it_img1 != '' AND i.it_use='1'
           ORDER BY RAND() LIMIT ?`,
          [id, limit]
        );
      }
    } else {
      [rows] = await pool.query<RowDataPacket[]>(
        `SELECT i.it_id, i.it_name, i.it_price, i.it_cust_price, i.it_img1, i.ca_id, i.it_soldout, i.it_use_cnt, i.it_use_avg, c.ca_name
         FROM g5_shop_item i
         LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
         WHERE i.it_id != ? AND i.it_soldout != '1' AND i.it_img1 != '' AND i.it_use='1'
         ORDER BY RAND() LIMIT ?`,
        [id, limit]
      );
    }
    res.json({
      items: (rows as any[]).map(r => ({
        it_id: r.it_id,
        it_name: r.it_name,
        it_price: Number(r.it_price) || 0,
        it_cust_price: Number(r.it_cust_price) || 0,
        it_img1: imgUrl(r.it_img1 || ""),
        ca_id: r.ca_id || "",
        ca_name: r.ca_name || "",
        it_soldout: r.it_soldout || "0",
        it_use_cnt: Number(r.it_use_cnt) || 0,
        it_use_avg: Number(r.it_use_avg) || 0,
      }))
    });
  } catch (err: any) {
    req.log?.error({ err }, "RelatedItems error");
    res.status(500).json({ error: "서버 오류" });
  }
});

// Debug: check notice table
router.get("/debug/notice", async (req, res) => {
  try {
    const results: Record<string, any> = {};
    try {
      const [cols] = await pool.query("DESCRIBE g5_write_notice");
      results.cols = (cols as any[]).map((c: any) => c.Field);
      const [rows] = await pool.query("SELECT * FROM g5_write_notice ORDER BY wr_datetime DESC LIMIT 3");
      results.rows = rows;
    } catch(e: any) { results.err = e.message; }
    res.json(results);
  } catch(err: any) { res.status(500).json({ error: err.message }); }
});

// 고객 리뷰 목록
router.get("/shop/reviews", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const itId = req.query.it_id as string | undefined;

    if (itId) {
      // Fetch reviews for specific item from g5_write_review
      await pool.query(`CREATE TABLE IF NOT EXISTS g5_write_review (
        wr_id INT AUTO_INCREMENT PRIMARY KEY,
        mb_id VARCHAR(20) NOT NULL,
        it_id VARCHAR(20) NOT NULL,
        od_id VARCHAR(30),
        wr_subject VARCHAR(200),
        wr_content TEXT,
        wr_rating TINYINT DEFAULT 5,
        wr_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
        wr_ip VARCHAR(50),
        wr_is_comment TINYINT DEFAULT 0,
        KEY idx_it_id (it_id),
        KEY idx_mb_id (mb_id)
      )`);
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT r.wr_id, r.mb_id, r.it_id, r.wr_content, r.wr_rating, r.wr_datetime,
                CONCAT(LEFT(r.mb_id,3), '***') as mb_name
         FROM g5_write_review r
         WHERE r.it_id = ? AND r.wr_is_comment = 0
         ORDER BY r.wr_datetime DESC
         LIMIT ?`,
        [itId, limit]
      );
      return res.json(rows);
    }

    // Default: fetch from g5_shop_item_use (legacy platform reviews)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.is_id, u.it_id, u.mb_id, u.is_name, u.is_score,
              u.is_subject, u.is_content, u.is_time,
              i.it_name, i.it_img1
       FROM g5_shop_item_use u
       LEFT JOIN g5_shop_item i ON i.it_id = u.it_id
       WHERE u.is_confirm = 1
       ORDER BY u.is_time DESC
       LIMIT ?`,
      [limit]
    );

    const reviews = (rows as any[]).map(r => {
      const imgMatch = r.is_content?.match(/<img[^>]+src=["']([^"']+)["']/i);
      const img = imgMatch ? imgMatch[1] : null;
      const mbId: string = r.mb_id || "";
      const maskedId = mbId.length > 3 ? mbId.slice(0, 3) + "**" : mbId + "**";
      const plainContent = (r.is_content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return {
        is_id: r.is_id, it_id: r.it_id, it_name: r.it_name || "",
        it_img1: imgUrl(r.it_img1 || ""),
        mb_id_masked: maskedId, is_score: r.is_score || 5,
        is_subject: r.is_subject || "", is_content: plainContent,
        is_img: img, is_time: r.is_time,
      };
    });

    res.json(reviews);
  } catch (err: any) {
    req.log?.error({ err }, "Reviews error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

router.get("/shop/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.is_id, u.it_id, u.mb_id, u.is_name, u.is_score,
              u.is_subject, u.is_content, u.is_time,
              i.it_name, i.it_img1
       FROM g5_shop_item_use u
       LEFT JOIN g5_shop_item i ON i.it_id = u.it_id
       WHERE u.is_id = ? AND u.is_confirm = 1
       LIMIT 1`,
      [id]
    );
    if (!(rows as any[]).length) return res.status(404).json({ error: "리뷰를 찾을 수 없습니다" });
    const r = (rows as any[])[0];
    const imgMatches = Array.from((r.is_content || "").matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map((m: any) => m[1]);
    const plainContent = (r.is_content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const mbId: string = r.mb_id || "";
    const maskedId = mbId.length > 3 ? mbId.slice(0, 3) + "**" : mbId + "**";
    res.json({
      is_id: r.is_id, it_id: r.it_id, it_name: r.it_name || "",
      it_img1: imgUrl(r.it_img1 || ""),
      mb_id_masked: maskedId, is_score: r.is_score || 5,
      is_subject: r.is_subject || "", is_content: plainContent,
      is_imgs: imgMatches, is_time: r.is_time,
    });
  } catch (err: any) {
    req.log?.error({ err }, "Review detail error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 공지사항
router.get("/shop/notices", async (req, res) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || "10", 10), 30);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT wr_id, wr_subject, wr_datetime, wr_link1
       FROM g5_write_notice
       WHERE wr_is_comment = 0
         AND mb_id = 'admin'
       ORDER BY wr_datetime DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err: any) {
    req.log?.error({ err }, "Notices error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 섹션 타이틀 설정 (관리자 g5_shop_default + g5_config2)
router.get("/shop/section-config", async (req, res) => {
  try {
    const [[shopRows], [configRows]] = await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT de_type1_title, de_type2_title, de_type3_title, de_type4_title, de_type5_title
         FROM g5_shop_default LIMIT 1`
      ),
      pool.query<RowDataPacket[]>(
        `SELECT cream_theme_foot_notice FROM g5_config2 LIMIT 1`
      ),
    ]);
    const r = (shopRows as any[])[0] || {};
    const c = (configRows as any[])[0] || {};
    res.json({
      best: r.de_type1_title || "히트상품",
      recommended: r.de_type2_title || "추천상품",
      newest: r.de_type3_title || "최신상품",
      popular: r.de_type4_title || "인기상품",
      sale: r.de_type5_title || "할인상품",
      review_subtitle: c.cream_theme_foot_notice || "소중한 후기를 남겨주세요",
    });
  } catch (err: any) {
    req.log?.error({ err }, "SectionConfig error");
    res.status(500).json({ error: "서버 오류가 발생했습니다" });
  }
});

// 푸터 사업자 정보 — seoulmono_settings(footer_*) 우선, 없으면 g5_config 값 사용
router.get("/shop/footer-config", async (req, res) => {
  const HARD_DEFAULTS = {
    company: "지구쇼핑몰",
    ceo: "김미희",
    address: "경기도 양주시 화합로1710번길 12, B218호(옥정동, 양주옥정 듀클래스 I)",
    business_num: "597-51-00016",
    tel: "010-2124-5201",
    online_num: "",
    privacy: "김미희",
    cs_tel: "010-2124-5201",
    cs_hours: "평일 : 10:00 ~ 18:00",
    cs_lunch: "점심시간 : 12:00 ~ 13:00  일요일 / 공휴일 휴무",
    bank_name: "",
    bank_num: "",
    bank_holder: "",
  };
  try {
    const FOOTER_KEYS = [
      "footer_company","footer_ceo","footer_address","footer_business_num",
      "footer_tel","footer_online_num","footer_privacy",
      "footer_cs_tel","footer_cs_hours","footer_cs_lunch",
      "footer_bank_name","footer_bank_num","footer_bank_holder",
    ];
    const ph = FOOTER_KEYS.map(() => "?").join(",");
    const [settRows] = await pool.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM seoulmono_settings WHERE setting_key IN (${ph})`,
      FOOTER_KEYS
    );
    const saved: Record<string, string> = {};
    for (const r of settRows as any[]) saved[r.setting_key.replace("footer_", "")] = r.setting_value;

    // g5_config (cf_1/cf_2/cf_3/cf_4) 폴백 - 발주 시스템 관리자에서 저장한 계좌 정보
    if (!saved.bank_name && !saved.bank_num && !saved.bank_holder) {
      const [gcRows] = await pool.query<RowDataPacket[]>(
        "SELECT cf_1, cf_2, cf_3, cf_4 FROM g5_config LIMIT 1"
      );
      if (gcRows.length > 0) {
        const gc = gcRows[0];
        if (gc.cf_1) saved.bank_name = gc.cf_1;
        if (gc.cf_2) saved.bank_num = gc.cf_2;
        if (gc.cf_3) saved.bank_holder = gc.cf_3;
        if (gc.cf_4) saved.bank_memo = gc.cf_4;
      }
    }

    const merged = { ...HARD_DEFAULTS, ...saved };
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json(merged);
  } catch (err: any) {
    req.log?.error({ err }, "FooterConfig error");
    res.json(HARD_DEFAULTS);
  }
});

// ── 마이페이지 대시보드 ────────────────────────────────────────
router.get("/shop/my-dashboard", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;

    // 회원 기본 정보
    const [mRows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_name, mb_email, mb_hp, mb_point FROM g5_member WHERE mb_id = ?",
      [user.mb_id]
    );
    const member = mRows[0] || {};

    // 주문 상태별 카운트 (6개월)
    const [orderCountRows] = await pool.query<RowDataPacket[]>(
      `SELECT od_status, COUNT(*) as cnt FROM g5_shop_order
       WHERE mb_id = ? AND od_time >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY od_status`,
      [user.mb_id]
    );
    const orderCounts: Record<string, number> = {};
    for (const r of orderCountRows as any[]) orderCounts[r.od_status] = Number(r.cnt);

    // 최근 주문 3건
    const [recentRows] = await pool.query<RowDataPacket[]>(
      `SELECT o.od_id, o.od_status, o.od_receipt_price, o.od_settle_case, o.od_time,
        (SELECT c.it_name FROM g5_shop_cart c WHERE c.od_id = o.od_id LIMIT 1) as first_item,
        (SELECT i.it_img1 FROM g5_shop_item i WHERE i.it_id = (SELECT c2.it_id FROM g5_shop_cart c2 WHERE c2.od_id = o.od_id LIMIT 1)) as first_img,
        (SELECT COUNT(*) FROM g5_shop_cart c WHERE c.od_id = o.od_id) as item_count
       FROM g5_shop_order o WHERE o.mb_id = ? ORDER BY o.od_time DESC LIMIT 3`,
      [user.mb_id]
    );

    // 미사용 쿠폰 수
    const [couponRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_shop_coupon WHERE mb_id = ? AND (od_id = '' OR od_id IS NULL)",
      [user.mb_id]
    );

    // 전체 쿠폰 수
    const [couponAllRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM g5_shop_coupon WHERE mb_id = ?",
      [user.mb_id]
    );

    // 1:1 문의 수
    let inquiryTotal = 0, inquiryUnanswered = 0;
    try {
      const [iqRows] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) as cnt FROM g5_write_qna WHERE mb_id = ? AND wr_is_comment = 0",
        [user.mb_id]
      );
      const [iqAllRows] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) as cnt FROM g5_write_qna WHERE mb_id = ? AND wr_is_comment = 0",
        [user.mb_id]
      );
      inquiryTotal = Number((iqAllRows as any[])[0]?.cnt) || 0;
      inquiryUnanswered = Number((iqRows as any[])[0]?.cnt) || 0;
    } catch { }

    // 리뷰 수
    let reviewCount = 0;
    try {
      const [rvRows] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) as cnt FROM g5_write_review WHERE mb_id = ? AND wr_is_comment = 0",
        [user.mb_id]
      );
      reviewCount = Number((rvRows as any[])[0]?.cnt) || 0;
    } catch { }

    res.json({
      member: {
        mb_name: member.mb_name || user.mb_name || "",
        mb_email: member.mb_email || "",
        mb_hp: member.mb_hp || "",
        mb_point: Number(member.mb_point) || 0,
      },
      order_counts: orderCounts,
      recent_orders: (recentRows as any[]).map(o => ({
        od_id: o.od_id,
        od_status: o.od_status,
        od_receipt_price: Number(o.od_receipt_price),
        od_settle_case: o.od_settle_case,
        od_time: o.od_time,
        first_item: o.first_item || "상품 정보 없음",
        first_img: o.first_img ? imgUrl(o.first_img) : "",
        item_count: Number(o.item_count) || 0,
      })),
      coupon_unused: Number((couponRows as any[])[0]?.cnt) || 0,
      coupon_total: Number((couponAllRows as any[])[0]?.cnt) || 0,
      inquiry_total: inquiryTotal,
      inquiry_unanswered: inquiryUnanswered,
      review_count: reviewCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: "서버 오류" });
  }
});

// ── 마이페이지 회원 정보 조회 ──────────────────────────────────
router.get("/shop/my-info", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT mb_id, mb_name, mb_email, mb_hp, mb_level,
        mb_point, mb_cash, mb_sex, mb_birth,
        mb_zip1, mb_zip2, mb_addr1, mb_addr2, mb_addr3, mb_datetime
       FROM g5_member WHERE mb_id = ?`,
      [user.mb_id]
    );
    if (!rows[0]) {
      // DB에 유저가 없으면 토큰 기반 기본 정보로 응답 (세션 재활용 허용)
      res.json({
        mb_id: user.mb_id,
        mb_name: user.mb_name || "",
        mb_email: "",
        mb_hp: "",
        mb_level: user.mb_level || 2,
        mb_point: 0,
        mb_deposit: 0,
        mb_sex: "",
        mb_birth: "",
        mb_zip1: "", mb_zip2: "",
        mb_addr1: "", mb_addr2: "", mb_addr3: "",
        mb_datetime: "",
        _missing_in_db: true,
      });
      return;
    }
    const m = rows[0];
    res.json({
      mb_id: m.mb_id,
      mb_name: m.mb_name || "",
      mb_email: m.mb_email || "",
      mb_hp: m.mb_hp || "",
      mb_level: m.mb_level,
      mb_point: Number(m.mb_point) || 0,
      mb_deposit: Number(m.mb_cash) || 0,
      mb_sex: m.mb_sex || "",
      mb_birth: m.mb_birth || "",
      mb_zip1: m.mb_zip1 || "", mb_zip2: m.mb_zip2 || "",
      mb_addr1: m.mb_addr1 || "", mb_addr2: m.mb_addr2 || "", mb_addr3: m.mb_addr3 || "",
      mb_datetime: m.mb_datetime || "",
    });
  } catch (err: any) {
    console.error("[my-info] error:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ── 마이페이지 회원 정보 수정 ──────────────────────────────────
router.put("/shop/my-profile", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { mb_name, mb_hp, mb_email, mb_sex, mb_birth,
      mb_zip1, mb_zip2, mb_addr1, mb_addr2, mb_addr3,
      current_password, new_password } = req.body;

    if (new_password) {
      const [rows] = await pool.query<RowDataPacket[]>("SELECT mb_password FROM g5_member WHERE mb_id = ?", [user.mb_id]);
      const ok = verifyGnuboardPassword(current_password || "", rows[0]?.mb_password || "");
      if (!ok) { res.status(400).json({ error: "현재 비밀번호가 맞지 않습니다" }); return; }
    }

    const fields: string[] = [];
    const vals: any[] = [];
    if (mb_name !== undefined) { fields.push("mb_name = ?"); vals.push(mb_name); }
    if (mb_hp !== undefined) { fields.push("mb_hp = ?"); vals.push(mb_hp); }
    if (mb_email !== undefined) { fields.push("mb_email = ?"); vals.push(mb_email); }
    if (mb_sex !== undefined) { fields.push("mb_sex = ?"); vals.push(mb_sex); }
    if (mb_birth !== undefined) { fields.push("mb_birth = ?"); vals.push(mb_birth); }
    if (mb_zip1 !== undefined) { fields.push("mb_zip1 = ?"); vals.push(mb_zip1); }
    if (mb_zip2 !== undefined) { fields.push("mb_zip2 = ?"); vals.push(mb_zip2); }
    if (mb_addr1 !== undefined) { fields.push("mb_addr1 = ?"); vals.push(mb_addr1); }
    if (mb_addr2 !== undefined) { fields.push("mb_addr2 = ?"); vals.push(mb_addr2); }
    if (mb_addr3 !== undefined) { fields.push("mb_addr3 = ?"); vals.push(mb_addr3); }
    if (new_password) {
      const hash = gnuboardPasswordHash(new_password);
      fields.push("mb_password = ?"); vals.push(hash);
    }

    if (fields.length === 0) { res.json({ ok: true }); return; }
    vals.push(user.mb_id);
    await pool.query(`UPDATE g5_member SET ${fields.join(", ")} WHERE mb_id = ?`, vals);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

// ── 마이페이지 주문 목록 ──────────────────────────────────────
router.get("/shop/my-orders", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const days = parseInt(String(req.query.days || "30"), 10);
    const [orders] = await pool.query<RowDataPacket[]>(
      `SELECT o.od_id, o.od_status, o.od_receipt_price, o.od_cart_price,
        o.od_send_cost, o.od_settle_case, o.od_time, o.od_memo,
        o.od_b_name, o.od_b_hp,
        (SELECT c.ct_qty FROM g5_shop_cart c WHERE c.od_id = o.od_id LIMIT 1) as first_qty,
        (SELECT c.it_id FROM g5_shop_cart c WHERE c.od_id = o.od_id LIMIT 1) as first_it_id,
        (SELECT c.it_name FROM g5_shop_cart c WHERE c.od_id = o.od_id LIMIT 1) as first_item,
        (SELECT i.it_img1 FROM g5_shop_item i WHERE i.it_id = (SELECT c2.it_id FROM g5_shop_cart c2 WHERE c2.od_id = o.od_id LIMIT 1)) as first_img,
        (SELECT COUNT(*) FROM g5_shop_cart c WHERE c.od_id = o.od_id) as item_count
       FROM g5_shop_order o
       WHERE o.mb_id = ? AND o.od_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY o.od_time DESC`,
      [user.mb_id, days]
    );
    const result = orders.map(o => ({
      od_id: o.od_id, od_status: o.od_status,
      od_receipt_price: Number(o.od_receipt_price),
      od_cart_price: Number(o.od_cart_price),
      od_send_cost: Number(o.od_send_cost),
      od_settle_case: o.od_settle_case, od_time: o.od_time, od_memo: o.od_memo,
      od_b_name: o.od_b_name, od_b_hp: o.od_b_hp,
      first_it_id: o.first_it_id || "",
      first_item: o.first_item || "상품 정보 없음",
      first_img: o.first_img ? imgUrl(o.first_img) : "",
      item_count: Number(o.item_count) || 0,
      first_qty: Number(o.first_qty) || 1,
    }));
    res.json({ orders: result });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

// ── 아이템 주문 여부 확인 (반드시 :od_id 보다 먼저 등록) ───────
router.get("/shop/my-orders/item/:it_id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.od_id, o.od_status, o.od_time
       FROM g5_shop_cart c
       JOIN g5_shop_order o ON o.od_id = c.od_id
       WHERE c.it_id = ? AND c.mb_id = ?
       ORDER BY o.od_time DESC LIMIT 5`,
      [req.params.it_id, user.mb_id]
    );
    res.json({ orders: rows });
  } catch { res.json({ orders: [] }); }
});

// ── 주문 상세 ─────────────────────────────────────────────────
router.get("/shop/my-orders/:od_id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { od_id } = req.params;
    const [orders] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM g5_shop_order WHERE od_id = ? AND mb_id = ? LIMIT 1`,
      [od_id, user.mb_id]
    );
    if ((orders as any[]).length === 0) return res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    const o = (orders as any[])[0];

    const [cartRows] = await pool.query<RowDataPacket[]>(
      `SELECT c.ct_id, c.it_id, c.it_name, c.ct_price, c.ct_qty, c.ct_option, c.ct_status,
              i.it_img1
       FROM g5_shop_cart c
       LEFT JOIN g5_shop_item i ON i.it_id = c.it_id
       WHERE c.od_id = ?`,
      [od_id]
    );

    const items = (cartRows as any[]).map(c => ({
      ct_id: c.ct_id, it_id: c.it_id, it_name: c.it_name,
      ct_price: Number(c.ct_price), ct_qty: Number(c.ct_qty),
      ct_option: c.ct_option || "", ct_status: c.ct_status || "",
      it_img1: c.it_img1 ? imgUrl(c.it_img1) : "",
    }));

    res.json({
      od_id: o.od_id, od_status: o.od_status, od_time: o.od_time,
      od_settle_case: o.od_settle_case, od_receipt_price: Number(o.od_receipt_price),
      od_cart_price: Number(o.od_cart_price), od_send_cost: Number(o.od_send_cost),
      od_memo: o.od_memo || "",
      od_b_name: o.od_b_name || "", od_b_hp: o.od_b_hp || "",
      od_b_zip1: o.od_b_zip1 || "", od_b_addr1: o.od_b_addr1 || "", od_b_addr2: o.od_b_addr2 || "",
      od_invoice: o.od_invoice || "", od_delivery_company: o.od_delivery_company || "",
      items,
    });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

// ── 마이페이지 쿠폰 목록 ──────────────────────────────────────
router.get("/shop/my-coupons", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cp_no, cp_id, cp_name, cp_type, cp_price, cp_minimum, cp_maximum,
        cp_start, cp_end, od_id
       FROM g5_shop_coupon WHERE mb_id = ? ORDER BY cp_no DESC`,
      [user.mb_id]
    );
    res.json({ coupons: rows.map(c => ({
      cp_no: c.cp_no, cp_id: c.cp_id, cp_name: c.cp_name || "쿠폰",
      cp_type: c.cp_type, cp_price: Number(c.cp_price),
      cp_minimum: Number(c.cp_minimum), cp_maximum: Number(c.cp_maximum),
      cp_start: c.cp_start, cp_end: c.cp_end,
      used: !!c.od_id,
    })) });
  } catch (err: any) { res.json({ coupons: [] }); }
});

// ── 공개 설정 조회 (프론트엔드에서 사용) ──────────────────────
router.get("/shop/settings", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT setting_key, setting_value FROM seoulmono_settings WHERE setting_key IN ('kakao_channel_point','kakao_channel_url','first_purchase_enabled')"
    );
    const settings: Record<string, string> = {};
    for (const r of rows as any[]) settings[r.setting_key] = r.setting_value;
    res.json(settings);
  } catch { res.json({ kakao_channel_point: "1000", kakao_channel_url: "http://pf.kakao.com/_BRqxkn/chat", first_purchase_enabled: "1" }); }
});

// ── 카카오 채널 포인트 적립 (로그인 사용자, 1회) ──────────────
router.get("/shop/kakao-channel-status", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_4 FROM g5_member WHERE mb_id = ?", [user.mb_id]
    );
    const claimed = rows[0]?.mb_4 === "1";
    res.json({ claimed });
  } catch { res.json({ claimed: false }); }
});

router.post("/shop/kakao-channel-point", authMiddleware, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const user = (req as any).user;
    // 설정에서 포인트 금액 읽기
    const [settRows] = await pool.query<RowDataPacket[]>(
      "SELECT setting_value FROM seoulmono_settings WHERE setting_key = 'kakao_channel_point'"
    );
    const pointAmount = Number((settRows as any[])[0]?.setting_value) || 1000;

    await connection.beginTransaction();
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT mb_4, mb_point FROM g5_member WHERE mb_id = ? FOR UPDATE", [user.mb_id]
    );
    if (!rows[0]) { await connection.rollback(); return void res.status(404).json({ error: "회원 정보 없음" }); }
    if (rows[0].mb_4 === "1") { await connection.rollback(); return void res.json({ ok: false, message: "이미 적립하셨습니다." }); }

    const currentPoint = Number(rows[0].mb_point) || 0;
    const newPoint = currentPoint + pointAmount;
    const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
    await connection.query(
      "UPDATE g5_member SET mb_point = ?, mb_4 = '1' WHERE mb_id = ?", [newPoint, user.mb_id]
    );
    await connection.query(
      `INSERT INTO g5_point (mb_id, po_datetime, po_content, po_point, po_use_point, po_expired, po_expire_date, po_mb_point, po_rel_table, po_rel_id, po_rel_action)
       VALUES (?, ?, ?, ?, 0, 0, '9999-12-31', ?, '#kakao', 'channel', '카카오채널구독')`,
      [user.mb_id, nowStr, `카카오 채널 구독 포인트 적립 (${pointAmount.toLocaleString()}P)`, pointAmount, newPoint]
    ).catch(() => {});
    await connection.commit();
    res.json({ ok: true, message: `${pointAmount.toLocaleString()} 포인트가 적립되었습니다!`, newBalance: newPoint, pointAmount });
  } catch (err: any) {
    await connection.rollback();
    res.status(500).json({ error: "포인트 적립 중 오류가 발생했습니다." });
  } finally { connection.release(); }
});

// ── 마이페이지 적립금 내역 ────────────────────────────────────
router.get("/shop/points-history", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [mRows] = await pool.query<RowDataPacket[]>("SELECT mb_point FROM g5_member WHERE mb_id = ?", [user.mb_id]);
    const balance = Number(mRows[0]?.mb_point) || 0;
    let history: any[] = [];
    try {
      const [hRows] = await pool.query<RowDataPacket[]>(
        `SELECT po_content, po_point, po_mb_point, po_datetime
         FROM g5_point WHERE mb_id = ? ORDER BY po_id DESC LIMIT 50`,
        [user.mb_id]
      );
      history = hRows.map(r => ({
        content: r.po_content, point: Number(r.po_point),
        balance: Number(r.po_mb_point), datetime: r.po_datetime,
      }));
    } catch { }
    res.json({ balance, history });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

// ── 사용 가능 쿠폰 목록 (주문금액 기준 필터) ─────────────────
router.get("/shop/available-coupons", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const amount = Number(req.query.amount) || 0;
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cp_no, cp_id, cp_subject, cp_method, cp_price, cp_minimum, cp_maximum, cp_start, cp_end, cp_type
       FROM g5_shop_coupon
       WHERE mb_id = ? AND (od_id IS NULL OR od_id = '')
         AND (cp_start IS NULL OR cp_start <= ?) AND (cp_end IS NULL OR cp_end >= ?)
         AND (cp_minimum = 0 OR cp_minimum <= ?)
       ORDER BY cp_no DESC`,
      [user.mb_id, today, today, amount]
    );
    res.json({ coupons: rows.map(c => ({
      cp_no: c.cp_no,
      cp_name: c.cp_subject || "쿠폰",
      cp_price: Number(c.cp_price),
      cp_method: c.cp_method,
      cp_minimum: Number(c.cp_minimum),
      cp_maximum: Number(c.cp_maximum),
      cp_start: c.cp_start,
      cp_end: c.cp_end,
    })) });
  } catch { res.json({ coupons: [] }); }
});

// ── 찜리스트 ─────────────────────────────────────────────────
router.get("/shop/wishlist", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT w.it_id, w.wi_time, i.it_name, i.it_price, i.it_img1, i.it_soldout
       FROM g5_shop_wish w
       JOIN g5_shop_item i ON w.it_id = i.it_id
       WHERE w.mb_id = ? ORDER BY w.wi_time DESC`,
      [user.mb_id]
    );
    res.json({ items: rows.map(r => ({
      it_id: r.it_id, it_name: r.it_name,
      it_price: Number(r.it_price), it_img1: imgUrl(r.it_img1 || ""),
      it_soldout: r.it_soldout, wi_time: r.wi_time,
    })) });
  } catch { res.json({ items: [] }); }
});

router.post("/shop/wishlist/:it_id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { it_id } = req.params;
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT wi_id FROM g5_shop_wish WHERE mb_id = ? AND it_id = ?", [user.mb_id, it_id]
    );
    if ((existing as any[]).length > 0) {
      await pool.query("DELETE FROM g5_shop_wish WHERE mb_id = ? AND it_id = ?", [user.mb_id, it_id]);
      res.json({ wished: false });
    } else {
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      await pool.query(
        "INSERT INTO g5_shop_wish (mb_id, it_id, wi_time, wi_ip) VALUES (?, ?, ?, '')",
        [user.mb_id, it_id, now]
      );
      res.json({ wished: true });
    }
  } catch { res.status(500).json({ error: "서버 오류" }); }
});

router.get("/shop/wishlist/:it_id/status", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT wi_id FROM g5_shop_wish WHERE mb_id = ? AND it_id = ?",
      [user.mb_id, req.params.it_id]
    );
    res.json({ wished: (rows as any[]).length > 0 });
  } catch { res.json({ wished: false }); }
});

// ── 리뷰 ─────────────────────────────────────────────────────
async function ensureReviewTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS g5_write_review (
      wr_id INT AUTO_INCREMENT PRIMARY KEY,
      mb_id VARCHAR(20) NOT NULL,
      it_id VARCHAR(30) NOT NULL,
      od_id VARCHAR(20) NOT NULL DEFAULT '',
      wr_subject VARCHAR(255) NOT NULL DEFAULT '',
      wr_content TEXT NOT NULL,
      wr_rating TINYINT NOT NULL DEFAULT 5,
      wr_datetime DATETIME NOT NULL,
      wr_ip VARCHAR(50) NOT NULL DEFAULT '',
      wr_is_comment TINYINT NOT NULL DEFAULT 0,
      INDEX idx_it_id (it_id),
      INDEX idx_mb_id (mb_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  } catch {}
}
ensureReviewTable();

router.get("/shop/my-reviews", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.wr_id, r.it_id, r.od_id, r.wr_subject, r.wr_content, r.wr_rating, r.wr_datetime,
              i.it_name, i.it_img1
       FROM g5_write_review r
       LEFT JOIN g5_shop_item i ON r.it_id = i.it_id
       WHERE r.mb_id = ? AND r.wr_is_comment = 0
       ORDER BY r.wr_datetime DESC`,
      [user.mb_id]
    );
    res.json({ reviews: rows.map(r => ({
      wr_id: r.wr_id, it_id: r.it_id, od_id: r.od_id,
      wr_subject: r.wr_subject, wr_content: r.wr_content, wr_rating: r.wr_rating,
      wr_datetime: r.wr_datetime, it_name: r.it_name, it_img1: imgUrl(r.it_img1 || ""),
    })) });
  } catch { res.json({ reviews: [] }); }
});

router.post("/shop/reviews", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { it_id, od_id, wr_content, wr_rating } = req.body;
    if (!it_id || !wr_content) { res.status(400).json({ error: "상품과 내용을 입력해주세요" }); return; }
    const rating = Math.min(5, Math.max(1, Number(wr_rating) || 5));
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    // 중복 리뷰 방지
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id FROM g5_write_review WHERE mb_id = ? AND it_id = ? AND od_id = ?",
      [user.mb_id, it_id, od_id || ""]
    );
    if ((existing as any[]).length > 0) { res.status(400).json({ error: "이미 리뷰를 작성하셨습니다" }); return; }
    await pool.query(
      `INSERT INTO g5_write_review (mb_id, it_id, od_id, wr_subject, wr_content, wr_rating, wr_datetime, wr_ip, wr_is_comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, '', 0)`,
      [user.mb_id, it_id, od_id || "", `${user.mb_name || user.mb_id} 님의 리뷰`, wr_content, rating, now]
    );
    // 리뷰 평점/개수 업데이트
    await pool.query(
      `UPDATE g5_shop_item
       SET it_use_cnt = (SELECT COUNT(*) FROM g5_write_review WHERE it_id = ? AND wr_is_comment = 0),
           it_use_avg = (SELECT IFNULL(AVG(wr_rating), 0) FROM g5_write_review WHERE it_id = ? AND wr_is_comment = 0)
       WHERE it_id = ?`,
      [it_id, it_id, it_id]
    );
    res.status(201).json({ ok: true });
  } catch { res.status(500).json({ error: "서버 오류" }); }
});

router.delete("/shop/reviews/:wr_id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT it_id FROM g5_write_review WHERE wr_id = ? AND mb_id = ?",
      [req.params.wr_id, user.mb_id]
    );
    if (!(rows as any[]).length) { res.status(404).json({ error: "리뷰를 찾을 수 없습니다" }); return; }
    const it_id = (rows as any[])[0].it_id;
    await pool.query("DELETE FROM g5_write_review WHERE wr_id = ? AND mb_id = ?", [req.params.wr_id, user.mb_id]);
    await pool.query(
      `UPDATE g5_shop_item
       SET it_use_cnt = (SELECT COUNT(*) FROM g5_write_review WHERE it_id = ? AND wr_is_comment = 0),
           it_use_avg = (SELECT IFNULL(AVG(wr_rating), 0) FROM g5_write_review WHERE it_id = ? AND wr_is_comment = 0)
       WHERE it_id = ?`,
      [it_id, it_id, it_id]
    );
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "서버 오류" }); }
});

// ── 마이페이지 배송지 목록 ────────────────────────────────────
router.get("/shop/addresses", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM g5_member_address WHERE mb_id = ? ORDER BY ma_default DESC, ma_id DESC",
      [user.mb_id]
    );
    res.json({ addresses: rows.map(a => ({
      ma_id: a.ma_id, ma_name: a.ma_name || "", ma_hp: a.ma_hp || "",
      ma_zip1: a.ma_zip1 || "", ma_zip2: a.ma_zip2 || "",
      ma_addr1: a.ma_addr1 || "", ma_addr2: a.ma_addr2 || "", ma_addr3: a.ma_addr3 || "",
      ma_default: a.ma_default === '1' || a.ma_default === 1,
    })) });
  } catch (err: any) { res.json({ addresses: [] }); }
});

router.post("/shop/addresses", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { ma_name, ma_hp, ma_zip1, ma_zip2, ma_addr1, ma_addr2, ma_addr3, ma_default } = req.body;
    if (!ma_name || !ma_addr1) { res.status(400).json({ error: "수령인과 주소를 입력해주세요" }); return; }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      if (ma_default) {
        await conn.query("UPDATE g5_member_address SET ma_default = '0' WHERE mb_id = ?", [user.mb_id]);
      }
      const [r] = await conn.query<ResultSetHeader>(
        `INSERT INTO g5_member_address (mb_id, ma_name, ma_hp, ma_zip1, ma_zip2, ma_addr1, ma_addr2, ma_addr3, ma_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.mb_id, ma_name, ma_hp || "", ma_zip1 || "", ma_zip2 || "", ma_addr1, ma_addr2 || "", ma_addr3 || "", ma_default ? "1" : "0"]
      );
      await conn.commit();
      res.json({ ma_id: r.insertId });
    } finally { conn.release(); }
  } catch (err: any) { res.status(500).json({ error: "저장 실패" }); }
});

router.put("/shop/addresses/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const maId = req.params.id;
    const { ma_name, ma_hp, ma_zip1, ma_zip2, ma_addr1, ma_addr2, ma_addr3, ma_default } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      if (ma_default) {
        await conn.query("UPDATE g5_member_address SET ma_default = '0' WHERE mb_id = ?", [user.mb_id]);
      }
      await conn.query(
        `UPDATE g5_member_address SET ma_name=?, ma_hp=?, ma_zip1=?, ma_zip2=?, ma_addr1=?, ma_addr2=?, ma_addr3=?, ma_default=?
         WHERE ma_id=? AND mb_id=?`,
        [ma_name, ma_hp || "", ma_zip1 || "", ma_zip2 || "", ma_addr1, ma_addr2 || "", ma_addr3 || "", ma_default ? "1" : "0", maId, user.mb_id]
      );
      await conn.commit();
      res.json({ ok: true });
    } finally { conn.release(); }
  } catch (err: any) { res.status(500).json({ error: "수정 실패" }); }
});

router.delete("/shop/addresses/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    await pool.query("DELETE FROM g5_member_address WHERE ma_id = ? AND mb_id = ?", [req.params.id, user.mb_id]);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: "삭제 실패" }); }
});

// ── 마이페이지 1:1 문의 ───────────────────────────────────────
async function ensureQnaTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS g5_write_qna (
      wr_id INT AUTO_INCREMENT PRIMARY KEY,
      mb_id VARCHAR(255) NOT NULL DEFAULT '',
      wr_subject VARCHAR(255) NOT NULL DEFAULT '',
      wr_content MEDIUMTEXT NOT NULL,
      wr_reply TEXT NOT NULL DEFAULT '',
      wr_name VARCHAR(255) NOT NULL DEFAULT '',
      wr_email VARCHAR(255) NOT NULL DEFAULT '',
      wr_link1 VARCHAR(255) NOT NULL DEFAULT '',
      wr_link2 VARCHAR(255) NOT NULL DEFAULT '',
      wr_comment INT NOT NULL DEFAULT 0,
      wr_hit INT NOT NULL DEFAULT 0,
      wr_good INT NOT NULL DEFAULT 0,
      wr_nogood INT NOT NULL DEFAULT 0,
      wr_option VARCHAR(100) NOT NULL DEFAULT '',
      ca_name VARCHAR(255) NOT NULL DEFAULT '',
      wr_1 VARCHAR(255) NOT NULL DEFAULT '',
      wr_2 VARCHAR(255) NOT NULL DEFAULT '',
      wr_3 VARCHAR(255) NOT NULL DEFAULT '',
      wr_4 VARCHAR(255) NOT NULL DEFAULT '',
      wr_5 VARCHAR(255) NOT NULL DEFAULT '',
      wr_6 VARCHAR(255) NOT NULL DEFAULT '',
      wr_7 VARCHAR(255) NOT NULL DEFAULT '',
      wr_8 VARCHAR(255) NOT NULL DEFAULT '',
      wr_9 VARCHAR(255) NOT NULL DEFAULT '',
      wr_10 VARCHAR(255) NOT NULL DEFAULT '',
      wr_num INT NOT NULL DEFAULT 0,
      wr_reply_num INT NOT NULL DEFAULT 0,
      wr_ip VARCHAR(100) NOT NULL DEFAULT '',
      wr_password VARCHAR(255) NOT NULL DEFAULT '',
      wr_is_comment TINYINT(1) NOT NULL DEFAULT 0,
      wr_parent INT NOT NULL DEFAULT 0,
      wr_file TINYINT(1) NOT NULL DEFAULT 0,
      wr_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      wr_last DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

router.get("/shop/inquiries", authMiddleware, async (req, res) => {
  try {
    await ensureQnaTable();
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT wr_id, wr_subject, wr_content, wr_datetime, wr_reply
       FROM g5_write_qna WHERE mb_id = ? AND wr_is_comment = 0 ORDER BY wr_id DESC LIMIT 50`,
      [user.mb_id]
    );
    res.json({ inquiries: rows.map(r => ({
      wr_id: r.wr_id, wr_subject: r.wr_subject || "",
      wr_content: r.wr_content || "", wr_datetime: r.wr_datetime || "",
      has_reply: !!(r.wr_reply && r.wr_reply.trim()),
    })) });
  } catch (err: any) { res.status(500).json({ error: "조회 실패: " + err.message }); }
});

router.post("/shop/inquiries", authMiddleware, async (req, res) => {
  try {
    await ensureQnaTable();
    const user = (req as any).user;
    const { subject, content } = req.body;
    if (!subject || !content) { res.status(400).json({ error: "제목과 내용을 입력해주세요" }); return; }
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const [r] = await pool.query<ResultSetHeader>(
      `INSERT INTO g5_write_qna (mb_id, wr_subject, wr_content, wr_datetime, wr_last, wr_name, wr_reply, wr_comment, wr_hit, wr_good, wr_nogood, wr_option, ca_name, wr_num, wr_reply_num, wr_ip, wr_password, wr_is_comment, wr_parent, wr_file)
       VALUES (?, ?, ?, ?, ?, ?, '', 0, 0, 0, 0, 'html1', '', 0, 0, '', '', 0, 0, 0)`,
      [user.mb_id, subject, content, now, now, user.mb_name || user.mb_id]
    );
    res.json({ wr_id: r.insertId });
  } catch (err: any) { res.status(500).json({ error: "문의 등록 실패: " + err.message }); }
});

// ── 광고/제휴문의 ──────────────────────────────────────────────

async function ensurePartnershipTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seoulmono_partnership (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_name VARCHAR(100) NOT NULL DEFAULT '',
      contact_name VARCHAR(50) NOT NULL DEFAULT '',
      phone VARCHAR(30) NOT NULL DEFAULT '',
      email VARCHAR(100) NOT NULL DEFAULT '',
      inquiry_type VARCHAR(20) NOT NULL DEFAULT '광고',
      subject VARCHAR(200) NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

// 광고/제휴문의 제출 (비로그인 가능)
router.post("/shop/partnership", async (req, res) => {
  try {
    await ensurePartnershipTable();
    const { company_name, contact_name, phone, email, inquiry_type, subject, content } = req.body;
    if (!contact_name || !phone || !email || !subject || !content) {
      res.status(400).json({ error: "담당자명, 연락처, 이메일, 제목, 내용은 필수입니다" }); return;
    }
    await pool.query(
      `INSERT INTO seoulmono_partnership (company_name, contact_name, phone, email, inquiry_type, subject, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [company_name || "", contact_name, phone, email, inquiry_type || "광고", subject, content]
    );
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: "문의 등록 실패: " + err.message }); }
});

// 광고/제휴문의 목록 조회 (관리자 전용)
router.get("/shop/partnership", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.mb_level < 9) { res.status(403).json({ error: "권한이 없습니다" }); return; }
    await ensurePartnershipTable();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM seoulmono_partnership ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]
    );
    const [cnt] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM seoulmono_partnership`);
    res.json({ items: rows, total: Number((cnt as any[])[0]?.total) || 0 });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// 광고/제휴문의 읽음 처리 (관리자)
router.put("/shop/partnership/:id/read", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.mb_level < 9) { res.status(403).json({ error: "권한이 없습니다" }); return; }
    await pool.query(`UPDATE seoulmono_partnership SET is_read = 1 WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── 토스페이먼츠 결제 ──────────────────────────────────────────
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

// 토스페이먼츠 결제 승인 + 주문 생성 (회원)
router.post("/shop/toss/confirm", authMiddleware, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const user = (req as any).user;
    const { paymentKey, orderId, amount, items, name, phone, email, postcode, addr1, addr2, memo, coupon_no, point_use } = req.body;

    if (!paymentKey || !orderId || !amount) {
      res.status(400).json({ error: "결제 정보가 올바르지 않습니다" }); return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "주문 상품을 선택해주세요" }); return;
    }
    if (!name || !phone || !addr1) {
      res.status(400).json({ error: "수령인, 연락처, 주소를 입력해주세요" }); return;
    }

    // 1) 토스 결제 승인 API
    const encoded = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: { Authorization: `Basic ${encoded}`, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossData = await tossRes.json() as any;
    if (!tossRes.ok) {
      res.status(400).json({ error: tossData.message || "결제 승인 실패" }); return;
    }

    // 2) 주문 생성
    await connection.beginTransaction();

    let totalPrice = 0;
    const validatedItems: { it_id: string; qty: number; price: number; name: string; option: string }[] = [];

    for (const item of items) {
      if (!item.it_id || !item.qty || item.qty < 1) {
        await connection.rollback();
        res.status(400).json({ error: "잘못된 상품 정보입니다" }); return;
      }
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT it_id, it_name, it_price FROM g5_shop_item WHERE it_id = ? AND it_use = '1'",
        [item.it_id]
      );
      if ((rows as any[]).length === 0) {
        await connection.rollback();
        res.status(400).json({ error: `상품 ${item.it_id}을(를) 찾을 수 없습니다` }); return;
      }
      const prod = (rows as any[])[0];
      let price = Number(prod.it_price) || 0;
      if (item.option_price) price += Number(item.option_price) || 0;
      totalPrice += price * item.qty;
      validatedItems.push({ it_id: item.it_id, qty: item.qty, price, name: prod.it_name, option: item.option || "" });
    }

    const sendCost = calcServerShipping(totalPrice, postcode || "", addr1 || "");
    let couponDiscount = 0;
    let validCoupon: RowDataPacket | null = null;

    if (coupon_no) {
      const today = new Date().toISOString().slice(0, 10);
      const [cRows] = await connection.query<RowDataPacket[]>(
        `SELECT * FROM g5_shop_coupon WHERE cp_no = ? AND mb_id = ? AND (od_id IS NULL OR od_id = '')
           AND (cp_start IS NULL OR cp_start <= ?) AND (cp_end IS NULL OR cp_end >= ?)`,
        [coupon_no, user.mb_id, today, today]
      );
      if ((cRows as any[]).length > 0) {
        validCoupon = (cRows as any[])[0];
        couponDiscount = Number(validCoupon!.cp_price) || 0;
        const maxDiscount = Number(validCoupon!.cp_maximum) || 0;
        if (maxDiscount > 0) couponDiscount = Math.min(couponDiscount, maxDiscount);
        couponDiscount = Math.min(couponDiscount, totalPrice);
      }
    }

    const pointUseNum = Math.max(0, Number(point_use) || 0);
    const receiptPrice = Math.max(0, totalPrice + sendCost - couponDiscount - pointUseNum);

    const now = new Date();
    const nowStr = now.toISOString().slice(0, 19).replace("T", " ");
    const newOrderId = now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0") +
      String(Math.floor(Math.random() * 100000)).padStart(5, "0");

    await connection.query<ResultSetHeader>(
      `INSERT INTO g5_shop_order (
        od_id, mb_id, od_name, od_email, od_tel, od_hp,
        od_zip1, od_zip2, od_addr1, od_addr2, od_addr3,
        od_b_name, od_b_tel, od_b_hp, od_b_zip1, od_b_zip2, od_b_addr1, od_b_addr2, od_b_addr3,
        od_status, od_receipt_price, od_cart_price, od_cart_count,
        od_send_cost, od_memo, od_time, od_settle_case,
        od_test, od_mobile, od_pg, od_tno, od_app_no, od_escrow, od_casseqno,
        od_invoice, od_pwd, od_ip, pt_case, pt_price, pt_memo,
        od_naver_orderid, od_gift_msg, od_bill_hp
      ) VALUES (
        ?, ?, ?, ?, '', ?,
        ?, '', ?, ?, '',
        ?, '', ?, ?, '', ?, ?, '',
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        '0', '0', ?, ?, '', '0', '',
        '', '', '', '', '', '',
        '', '', ?
      )`,
      [
        newOrderId, user.mb_id, name, email || "", phone,
        postcode || "", addr1, addr2 || "",
        name, phone, postcode || "", addr1, addr2 || "",
        "결제완료", receiptPrice, totalPrice, validatedItems.length,
        sendCost, memo || "", nowStr, "신용카드",
        "tosspayments", paymentKey,
        phone,
      ]
    );

    for (const vi of validatedItems) {
      await connection.query(
        `INSERT INTO g5_shop_cart (
          od_id, mb_id, it_id, it_name, ct_status, ct_price, ct_qty, ct_time,
          it_sc_type, it_sc_method, it_sc_price, it_sc_minimum, it_sc_qty,
          ct_send_cost, ct_point, cp_price, ct_point_use, ct_stock_use, ct_notax, ct_option,
          io_id, io_type, io_price, ct_direct, ct_select, ct_ip
        ) VALUES (?, ?, ?, ?, '주문', ?, ?, ?, '', '', 0, 0, 0, '0', 0, ?, ?, '', '', ?, '', '0', 0, '0', '0', '')`,
        [newOrderId, user.mb_id, vi.it_id, vi.name, vi.price, vi.qty, nowStr,
         couponDiscount, pointUseNum > 0 ? '1' : '0', vi.option]
      );
    }

    if (validCoupon) {
      await connection.query("UPDATE g5_shop_coupon SET od_id = ? WHERE cp_no = ?", [newOrderId, validCoupon.cp_no]);
    }

    if (pointUseNum > 0) {
      const [mRows] = await connection.query<RowDataPacket[]>("SELECT mb_point FROM g5_member WHERE mb_id = ?", [user.mb_id]);
      const currentPoint = Number((mRows as any[])[0]?.mb_point) || 0;
      const newPoint = Math.max(0, currentPoint - pointUseNum);
      await connection.query("UPDATE g5_member SET mb_point = ? WHERE mb_id = ?", [newPoint, user.mb_id]);
    }

    await connection.commit();

    res.status(201).json({
      od_id: newOrderId,
      od_receipt_price: receiptPrice,
      od_send_cost: sendCost,
      od_cart_price: totalPrice,
      coupon_discount: couponDiscount,
      point_use: pointUseNum,
      payment_method: "신용카드",
    });
  } catch (err: any) {
    await connection.rollback().catch(() => {});
    console.error("[TOSS CONFIRM ERROR]", err?.message);
    res.status(500).json({ error: err?.message || "주문 처리 중 오류가 발생했습니다" });
  } finally {
    connection.release();
  }
});

// ── 배송 전 주문 취소 + 토스 결제 취소 ─────────────────────────
const PRE_SHIPPING_STATUSES = ["결제완료", "입금대기", "입금확인", "주문접수", "주문완료", "상품준비중", "배송준비"];

router.post("/shop/orders/:od_id/cancel", authMiddleware, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const user = (req as any).user;
    const { od_id } = req.params;
    const { reason } = req.body;

    const [orders] = await connection.query<RowDataPacket[]>(
      "SELECT od_id, od_status, od_pg, od_tno, od_receipt_price FROM g5_shop_order WHERE od_id = ? AND mb_id = ? LIMIT 1",
      [od_id, user.mb_id]
    );
    if ((orders as any[]).length === 0) {
      res.status(404).json({ error: "주문을 찾을 수 없습니다" }); return;
    }
    const order = (orders as any[])[0];

    if (!PRE_SHIPPING_STATUSES.includes(order.od_status)) {
      res.status(400).json({ error: `'${order.od_status}' 상태에서는 취소가 불가합니다. 고객센터로 문의해주세요.` }); return;
    }

    await connection.beginTransaction();

    // 토스페이먼츠 결제 취소
    if (order.od_pg === "tosspayments" && order.od_tno) {
      const encoded = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
      const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${order.od_tno}/cancel`, {
        method: "POST",
        headers: { Authorization: `Basic ${encoded}`, "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason: reason || "고객 요청 취소" }),
      });
      const tossData = await tossRes.json() as any;
      if (!tossRes.ok) {
        await connection.rollback();
        res.status(400).json({ error: `결제 취소 실패: ${tossData.message || "알 수 없는 오류"}` }); return;
      }
    }

    await connection.query(
      "UPDATE g5_shop_order SET od_status = '주문취소' WHERE od_id = ? AND mb_id = ?",
      [od_id, user.mb_id]
    );

    await connection.commit();
    res.json({ ok: true, message: "주문이 취소되었습니다." });
  } catch (err: any) {
    await connection.rollback().catch(() => {});
    console.error("[ORDER CANCEL ERROR]", err?.message);
    res.status(500).json({ error: err?.message || "취소 처리 중 오류가 발생했습니다" });
  } finally {
    connection.release();
  }
});

// ── 쇼핑몰 주문 생성 ──────────────────────────────────────────

router.post("/shop/orders", authMiddleware, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const user = (req as any).user;
    const { items, name, phone, email, postcode, addr1, addr2, memo, payment_method, coupon_no, point_use } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "주문 상품을 선택해주세요" });
      return;
    }
    if (!name || !phone || !addr1) {
      res.status(400).json({ error: "수령인, 연락처, 주소를 입력해주세요" });
      return;
    }

    await connection.beginTransaction();

    let totalPrice = 0;
    const validatedItems: { it_id: string; qty: number; price: number; name: string; option: string }[] = [];

    for (const item of items) {
      if (!item.it_id || !item.qty || item.qty < 1) {
        await connection.rollback();
        res.status(400).json({ error: "잘못된 상품 정보입니다" });
        return;
      }
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT it_id, it_name, it_price FROM g5_shop_item WHERE it_id = ? AND it_use = '1' AND it_soldout != '1'",
        [item.it_id]
      );
      if (rows.length === 0) {
        await connection.rollback();
        res.status(400).json({ error: `상품 ${item.it_id}을(를) 찾을 수 없습니다` });
        return;
      }
      const prod = rows[0];
      let price = Number(prod.it_price) || 0;
      if (item.option_price) price += Number(item.option_price) || 0;
      totalPrice += price * item.qty;
      validatedItems.push({ it_id: item.it_id, qty: item.qty, price, name: prod.it_name, option: item.option || "" });
    }

    const sendCost = calcServerShipping(totalPrice, postcode || "", addr1 || "");
    let couponDiscount = 0;
    let validCoupon: RowDataPacket | null = null;

    // ── 쿠폰 검증 ────────────────────────────────────────────
    if (coupon_no) {
      const today = new Date().toISOString().slice(0, 10);
      const [cRows] = await connection.query<RowDataPacket[]>(
        `SELECT * FROM g5_shop_coupon WHERE cp_no = ? AND mb_id = ? AND (od_id IS NULL OR od_id = '')
           AND (cp_start IS NULL OR cp_start <= ?) AND (cp_end IS NULL OR cp_end >= ?)`,
        [coupon_no, user.mb_id, today, today]
      );
      if ((cRows as any[]).length === 0) {
        await connection.rollback();
        res.status(400).json({ error: "유효하지 않은 쿠폰입니다" });
        return;
      }
      validCoupon = (cRows as any[])[0];
      const minOrder = Number(validCoupon.cp_minimum) || 0;
      if (minOrder > 0 && totalPrice < minOrder) {
        await connection.rollback();
        res.status(400).json({ error: `쿠폰 최소 주문금액은 ${minOrder.toLocaleString()}원입니다` });
        return;
      }
      couponDiscount = Number(validCoupon.cp_price) || 0;
      const maxDiscount = Number(validCoupon.cp_maximum) || 0;
      if (maxDiscount > 0) couponDiscount = Math.min(couponDiscount, maxDiscount);
      couponDiscount = Math.min(couponDiscount, totalPrice);
    }

    // ── 포인트 검증 ──────────────────────────────────────────
    const pointUse = Math.max(0, Number(point_use) || 0);
    if (pointUse > 0) {
      const [mRows] = await connection.query<RowDataPacket[]>(
        "SELECT mb_point FROM g5_member WHERE mb_id = ?", [user.mb_id]
      );
      const balance = Number((mRows as any[])[0]?.mb_point) || 0;
      if (pointUse > balance) {
        await connection.rollback();
        res.status(400).json({ error: `보유 포인트(${balance.toLocaleString()}P)가 부족합니다` });
        return;
      }
      const maxPointUse = totalPrice - couponDiscount;
      if (pointUse > maxPointUse) {
        await connection.rollback();
        res.status(400).json({ error: "포인트 사용액이 결제금액을 초과합니다" });
        return;
      }
    }

    const receiptPrice = Math.max(0, totalPrice + sendCost - couponDiscount - pointUse);

    // 무통장입금만 처리 (카드결제는 /shop/toss/confirm 엔드포인트 사용)
    const settleCase = "무통장";
    const odStatus = "주문접수";

    const now = new Date();
    const nowStr = now.toISOString().slice(0, 19).replace("T", " ");
    const orderId = now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0") +
      String(Math.floor(Math.random() * 100000)).padStart(5, "0");

    await connection.query<ResultSetHeader>(
      `INSERT INTO g5_shop_order (
        od_id, mb_id, od_name, od_email, od_tel, od_hp,
        od_zip1, od_zip2, od_addr1, od_addr2, od_addr3,
        od_b_name, od_b_tel, od_b_hp, od_b_zip1, od_b_zip2, od_b_addr1, od_b_addr2, od_b_addr3,
        od_status, od_receipt_price, od_cart_price, od_cart_count,
        od_send_cost, od_memo, od_time, od_settle_case,
        od_test, od_mobile, od_pg, od_tno, od_app_no, od_escrow, od_casseqno,
        od_invoice, od_pwd, od_ip, pt_case, pt_price, pt_memo,
        od_naver_orderid, od_gift_msg, od_bill_hp
      ) VALUES (
        ?, ?, ?, ?, '', ?,
        '', '', ?, ?, '',
        ?, '', ?, '', '', ?, ?, '',
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        '0', '0', ?, ?, '', '0', '',
        '', '', '', '', '', '',
        '', '', ?
      )`,
      [
        orderId, user.mb_id, name, email || "", phone,
        addr1, addr2 || "",
        name, phone, addr1, addr2 || "",
        odStatus, receiptPrice, totalPrice, validatedItems.length,
        sendCost, memo || "", nowStr, settleCase,
        "", "",
        phone,
      ]
    );

    for (const vi of validatedItems) {
      await connection.query(
        `INSERT INTO g5_shop_cart (
          od_id, mb_id, it_id, it_name, ct_status, ct_price, ct_qty, ct_time,
          it_sc_type, it_sc_method, it_sc_price, it_sc_minimum, it_sc_qty,
          ct_send_cost, ct_point, cp_price, ct_point_use, ct_stock_use, ct_notax, ct_option,
          io_id, io_type, io_price, ct_direct, ct_select, ct_ip
        ) VALUES (?, ?, ?, ?, '주문', ?, ?, ?, '', '', 0, 0, 0, '0', 0, ?, ?, '', '', ?, '', '0', 0, '0', '0', '')`,
        [orderId, user.mb_id, vi.it_id, vi.name, vi.price, vi.qty, nowStr,
         couponDiscount, pointUse > 0 ? '1' : '0', vi.option]
      );
    }

    // ── 쿠폰 사용 처리 ────────────────────────────────────────
    if (validCoupon) {
      await connection.query(
        "UPDATE g5_shop_coupon SET od_id = ? WHERE cp_no = ?",
        [orderId, validCoupon.cp_no]
      );
      await connection.query(
        "INSERT INTO g5_shop_coupon_log (cp_id, mb_id, od_id, cp_price, cl_datetime) VALUES (?, ?, ?, ?, ?)",
        [validCoupon.cp_id, user.mb_id, orderId, couponDiscount, nowStr]
      ).catch(() => {});
    }

    // ── 포인트 차감 처리 ──────────────────────────────────────
    if (pointUse > 0) {
      const [mRows] = await connection.query<RowDataPacket[]>(
        "SELECT mb_point FROM g5_member WHERE mb_id = ?", [user.mb_id]
      );
      const currentPoint = Number((mRows as any[])[0]?.mb_point) || 0;
      const newPoint = currentPoint - pointUse;
      await connection.query("UPDATE g5_member SET mb_point = ? WHERE mb_id = ?", [newPoint, user.mb_id]);
      await connection.query(
        `INSERT INTO g5_point (mb_id, po_datetime, po_content, po_point, po_use_point, po_expired, po_expire_date, po_mb_point, po_rel_table, po_rel_id, po_rel_action)
         VALUES (?, ?, ?, 0, ?, 0, '9999-12-31', ?, '#order', ?, '포인트사용')`,
        [user.mb_id, nowStr, `주문 포인트 사용 (${orderId})`, pointUse, newPoint, orderId]
      ).catch(() => {});
    }

    await connection.commit();

    const baseResp: any = {
      od_id: orderId,
      od_receipt_price: receiptPrice,
      od_send_cost: sendCost,
      od_cart_price: totalPrice,
      coupon_discount: couponDiscount,
      point_use: pointUse,
      payment_method: settleCase,
    };

    // 무통장입금 - 은행 정보 포함
    const [cfRows] = await pool.query<RowDataPacket[]>(`SELECT * FROM g5_config2 LIMIT 1`);
    const cf2 = cfRows[0] || {};
    const [cfRows2] = await pool.query<RowDataPacket[]>(`SELECT cf_1, cf_2, cf_3 FROM g5_config LIMIT 1`);
    const cf = cfRows2[0] || {};
    baseResp.bank_name = cf2.cream_theme_bank_name || cf2.bank_name || cf.cf_1 || "";
    baseResp.bank_num = cf2.cream_theme_bank_num || cf2.bank_num || cf.cf_2 || "";
    baseResp.bank_holder = cf2.cream_theme_bank_holder || cf2.bank_holder || cf.cf_3 || "";

    res.status(201).json(baseResp);
  } catch (err: any) {
    await connection.rollback().catch(() => {});
    console.error("[ORDER ERROR]", err?.message, err?.code, err?.sqlMessage);
    res.status(500).json({ error: err?.sqlMessage || err?.message || "주문 처리 중 오류가 발생했습니다" });
  } finally {
    connection.release();
  }
});

// ── 비회원 주문 ───────────────────────────────────────────────────────────
const SMS_API_URL = "https://sms.bizservice.iwinv.kr/api/v2/send/";
const SMS_SECRET = (process.env.SMS_SECRET || "").trim();
const SMS_FROM = (process.env.SMS_FROM || "").trim();

async function sendSms(to: string[], text: string, title?: string) {
  if (!SMS_SECRET || !SMS_FROM || to.length === 0) return;
  const payload: any = { version: "1.0", from: SMS_FROM, to, text, date: null };
  if (title) payload.title = title;
  try {
    await fetch(SMS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8", secret: SMS_SECRET },
      body: JSON.stringify(payload),
    });
  } catch (_) {}
}

router.post("/shop/guest-orders", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { items, name, phone, email, postcode, addr1, addr2, memo } = req.body;
    if (!Array.isArray(items) || items.length === 0) { res.status(400).json({ error: "주문 상품을 선택해주세요" }); return; }
    if (!name || !phone || !addr1) { res.status(400).json({ error: "수령인, 연락처, 주소를 입력해주세요" }); return; }

    await connection.beginTransaction();

    let totalPrice = 0;
    const validatedItems: { it_id: string; qty: number; price: number; name: string; option: string }[] = [];
    for (const item of items) {
      if (!item.it_id || !item.qty || item.qty < 1) { await connection.rollback(); res.status(400).json({ error: "잘못된 상품 정보입니다" }); return; }
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT it_id, it_name, it_price FROM g5_shop_item WHERE it_id = ? AND it_use = '1' AND it_soldout != '1'", [item.it_id]
      );
      if (rows.length === 0) { await connection.rollback(); res.status(400).json({ error: `상품을 찾을 수 없습니다` }); return; }
      const prod = rows[0];
      let price = Number(prod.it_price) || 0;
      if (item.option_price) price += Number(item.option_price) || 0;
      totalPrice += price * item.qty;
      validatedItems.push({ it_id: item.it_id, qty: item.qty, price, name: prod.it_name, option: item.option || "" });
    }

    const sendCost = calcServerShipping(totalPrice, postcode || "", addr1 || "");
    const receiptPrice = totalPrice + sendCost;

    const now = new Date();
    const nowStr = now.toISOString().slice(0, 19).replace("T", " ");
    const orderId = "G" +
      now.getFullYear().toString().slice(2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0") +
      String(Math.floor(Math.random() * 10000)).padStart(4, "0");

    const cleanPhone = phone.replace(/\D/g, "");
    const guestId = "guest_" + cleanPhone;

    await connection.query<ResultSetHeader>(
      `INSERT INTO g5_shop_order (
        od_id, mb_id, od_name, od_email, od_tel, od_hp,
        od_zip1, od_zip2, od_addr1, od_addr2, od_addr3,
        od_b_name, od_b_tel, od_b_hp, od_b_zip1, od_b_zip2, od_b_addr1, od_b_addr2, od_b_addr3,
        od_status, od_receipt_price, od_cart_price, od_cart_count,
        od_send_cost, od_send_flag, od_settle_case, od_settle_memo,
        od_time, od_ip, od_memo
      ) VALUES (?,?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?,?)`,
      [
        orderId, guestId, name, email || "", phone, cleanPhone,
        postcode || "", "", addr1, addr2 || "", "",
        name, phone, cleanPhone, postcode || "", "", addr1, addr2 || "", "",
        "주문접수", receiptPrice, totalPrice, validatedItems.reduce((s, i) => s + i.qty, 0),
        sendCost, "0", "무통장", "",
        nowStr, "", memo || "",
      ]
    );

    for (const vi of validatedItems) {
      await connection.query(
        `INSERT INTO g5_shop_cart (od_id, mb_id, it_id, ct_name, ct_price, ct_qty, ct_status, ct_option, ct_datetime)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [orderId, guestId, vi.it_id, vi.name, vi.price, vi.qty, "주문접수", vi.option, nowStr]
      );
    }

    await connection.commit();

    // SMS 고객에게 발송
    const goodNames = validatedItems.map(v => `${v.name}${v.option ? ` (${v.option})` : ""} x${v.qty}`).join(", ");
    const smsText = [
      `[지구쇼핑몰] 주문이 접수되었습니다.`,
      `주문번호: ${orderId}`,
      `상품: ${goodNames.length > 30 ? goodNames.slice(0, 30) + "..." : goodNames}`,
      `결제금액: ${receiptPrice.toLocaleString()}원`,
      `(무통장입금 후 처리됩니다)`,
    ].join("\n");
    sendSms([cleanPhone], smsText).catch(() => {});

    const [cfRows2] = await pool.query<RowDataPacket[]>(`SELECT cf_1, cf_2, cf_3 FROM g5_config LIMIT 1`);
    const [cfRows] = await pool.query<RowDataPacket[]>(`SELECT * FROM g5_config2 LIMIT 1`);
    const cf2 = cfRows[0] || {};
    const cf = cfRows2[0] || {};

    res.status(201).json({
      od_id: orderId,
      od_receipt_price: receiptPrice,
      od_send_cost: sendCost,
      od_cart_price: totalPrice,
      payment_method: "무통장",
      bank_name: cf2.cream_theme_bank_name || cf.cf_1 || "",
      bank_num: cf2.cream_theme_bank_num || cf.cf_2 || "",
      bank_holder: cf2.cream_theme_bank_holder || cf.cf_3 || "",
      guest: true,
    });
  } catch (err: any) {
    await connection.rollback().catch(() => {});
    res.status(500).json({ error: err?.sqlMessage || err?.message || "주문 처리 중 오류가 발생했습니다" });
  } finally {
    connection.release();
  }
});

// ── FAQ (public) ──────────────────────────────────────────────────────────
router.get("/shop/faqs", async (req, res) => {
  try {
    const { category, q } = req.query as { category?: string; q?: string };
    let sql = "SELECT id, category, question, answer, sort_order FROM shop_faqs WHERE is_active=1";
    const params: any[] = [];
    if (category && category !== "전체") { sql += " AND category=?"; params.push(category); }
    if (q) { sql += " AND (question LIKE ? OR answer LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
    sql += " ORDER BY category, sort_order, id";
    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 이벤트 목록 (공개)
router.get("/shop/events", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, title, thumbnail, start_date, end_date, created_at FROM shop_events WHERE is_active=1 ORDER BY sort_order ASC, id DESC"
    );
    res.json({ events: rows });
  } catch {
    res.json({ events: [] });
  }
});

// ── 클레임(교환/반품/환불/취소) 테이블 자동생성 ──────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS seoulmono_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    od_id VARCHAR(30) NOT NULL DEFAULT '',
    mb_id VARCHAR(20) NOT NULL DEFAULT '',
    claim_type VARCHAR(10) NOT NULL DEFAULT '',
    reason TEXT NOT NULL DEFAULT '',
    status VARCHAR(10) NOT NULL DEFAULT '접수',
    admin_memo TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_od_id (od_id),
    INDEX idx_mb_id (mb_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`).catch(() => {});

// 클레임 제출 (고객)
router.post("/shop/claims", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { od_id, claim_type, reason } = req.body;
    if (!od_id || !claim_type || !reason?.trim()) {
      res.status(400).json({ error: "주문번호, 요청유형, 사유를 입력해주세요" }); return;
    }
    const validTypes = ["교환", "반품", "환불", "취소"];
    if (!validTypes.includes(claim_type)) {
      res.status(400).json({ error: "올바른 요청유형을 선택해주세요" }); return;
    }
    const [orders] = await pool.query<RowDataPacket[]>(
      "SELECT od_id FROM g5_shop_order WHERE od_id = ? AND mb_id = ? LIMIT 1",
      [od_id, user.mb_id]
    );
    if ((orders as any[]).length === 0) {
      res.status(404).json({ error: "주문을 찾을 수 없습니다" }); return;
    }
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM seoulmono_claims WHERE od_id = ? AND mb_id = ? AND status IN ('접수','처리중') LIMIT 1",
      [od_id, user.mb_id]
    );
    if ((existing as any[]).length > 0) {
      res.status(400).json({ error: "이미 처리 중인 요청이 있습니다. 완료 후 다시 요청해주세요." }); return;
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO seoulmono_claims (od_id, mb_id, claim_type, reason, status) VALUES (?, ?, ?, ?, '접수')",
      [od_id, user.mb_id, claim_type, reason.trim()]
    );
    res.status(201).json({ id: (result as any).insertId, message: "요청이 접수되었습니다" });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

// 내 클레임 목록 (고객)
router.get("/shop/claims", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.od_id, c.claim_type, c.reason, c.status, c.admin_memo,
              c.created_at, c.updated_at,
              (SELECT it_name FROM g5_shop_cart WHERE od_id = c.od_id LIMIT 1) as first_item
       FROM seoulmono_claims c
       WHERE c.mb_id = ?
       ORDER BY c.created_at DESC`,
      [user.mb_id]
    );
    res.json({ claims: rows });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

// 관리자 - 클레임 전체 목록
router.get("/shop-admin/claims", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.mb_level < 9) { res.status(403).json({ error: "권한이 없습니다" }); return; }
    const status = req.query.status as string;
    let where = "WHERE 1=1";
    const params: any[] = [];
    if (status && status !== "전체") { where += " AND c.status = ?"; params.push(status); }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.od_id, c.mb_id, c.claim_type, c.reason, c.status, c.admin_memo,
              c.created_at, c.updated_at,
              o.od_status, o.od_b_name, o.od_b_hp, o.od_b_addr1, o.od_receipt_price,
              m.mb_name, m.mb_hp,
              (SELECT it_name FROM g5_shop_cart WHERE od_id = c.od_id LIMIT 1) as first_item
       FROM seoulmono_claims c
       LEFT JOIN g5_shop_order o ON o.od_id = c.od_id
       LEFT JOIN g5_member m ON m.mb_id = c.mb_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT 300`,
      params
    );
    res.json({ claims: rows });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

// 관리자 - 클레임 상태 변경 + 메모
router.put("/shop-admin/claims/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.mb_level < 9) { res.status(403).json({ error: "권한이 없습니다" }); return; }
    const { status, admin_memo } = req.body;
    const validStatuses = ["접수", "처리중", "승인", "반려", "완료"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: "올바른 상태값을 입력해주세요" }); return;
    }
    const updates: string[] = [];
    const qParams: any[] = [];
    if (status) { updates.push("status = ?"); qParams.push(status); }
    if (admin_memo !== undefined) { updates.push("admin_memo = ?"); qParams.push(admin_memo); }
    if (updates.length === 0) { res.status(400).json({ error: "변경할 내용이 없습니다" }); return; }
    qParams.push(Number(req.params.id));
    await pool.query(`UPDATE seoulmono_claims SET ${updates.join(", ")} WHERE id = ?`, qParams);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: "서버 오류" }); }
});

// 이벤트 상세 (공개)
router.get("/shop/events/:id", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM shop_events WHERE id=? AND is_active=1",
      [req.params.id]
    );
    if (!(rows as any[]).length) return res.status(404).json({ error: "없음" });
    res.json((rows as any[])[0]);
  } catch {
    res.status(500).json({ error: "서버 오류" });
  }
});

// Public: 메인 슬라이더 배너 조회 (shop-admin.ts에도 있지만 안전장치)
router.get("/shop/banners", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, image_url, pc_img, mo_img, link_url, title, subtitle, sort_order, is_active FROM seoulmono_banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC"
    );
    const banners = (rows as RowDataPacket[]).map((r) => ({
      ...r,
      bn_img: r.mo_img || r.pc_img || r.image_url || "",
    }));
    res.json({ banners });
  } catch { res.json({ banners: [] }); }
});

// Public: 상점 로그인 (프론트엔드 호환성)
router.post("/shop/login", async (req, res) => {
  try {
    const { mb_id, password } = req.body;
    if (!mb_id || !password) { res.status(400).json({ error: "아이디와 비밀번호를 입력해주세요" }); return; }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM g5_member WHERE mb_id = ? AND (mb_leave_date = '' OR mb_leave_date IS NULL)",
      [mb_id]
    );
    if (rows.length === 0) { res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" }); return; }
    const member = rows[0];
    const isAdmin = member.mb_level >= 10;
    const isApproved = member.mb_level >= 2;
    if (!isAdmin && member.mb_level === 0) { res.status(403).json({ error: "가입이 거절된 계정입니다" }); return; }
    if (!isAdmin && member.mb_level === 1 && member.mb_2 === "pending") { res.status(403).json({ error: "승인 대기 중인 계정입니다." }); return; }
    const token = createToken({ mb_id: member.mb_id, mb_level: member.mb_level });
    res.json({ token, user: { mb_id: member.mb_id, mb_nick: member.mb_nick, mb_level: member.mb_level, mb_email: member.mb_email, is_admin: isAdmin, is_approved: isApproved } });
  } catch (err) { console.error("[shop/login] error", err); res.status(500).json({ error: "서버 오류" }); }
});

export default router;
