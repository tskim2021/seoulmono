import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { GetProductsQueryParams, GetProductParams } from "@workspace/api-zod";
import type { RowDataPacket } from "mysql2";
import https from "https";
import http from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware, adminMiddleware } from "../lib/auth";
import { objectStorageClient } from "../lib/objectStorage";
import sharp from "sharp";

const router: IRouter = Router();

// ─── MySQL BLOB 폴백 테이블 (기존 이미지 복구용) ──────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS editor_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(200) NOT NULL,
    mimetype VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
    data LONGBLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_filename (filename)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`).catch((e: any) => console.error("[editor_images] 테이블 생성 실패:", e.message));

// ─── GCS 버킷 설정 ────────────────────────────────────────────────────────────
const GCS_BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
const GCS_PREFIX = "editor-images";

// ─── 로컬 디스크 디렉토리 ─────────────────────────────────────────────────────
const editorUploadDir = path.resolve(process.cwd(), "uploads/editor");
if (!fs.existsSync(editorUploadDir)) fs.mkdirSync(editorUploadDir, { recursive: true });

const itemUploadDir = path.resolve(process.cwd(), "uploads/item");
if (!fs.existsSync(itemUploadDir)) fs.mkdirSync(itemUploadDir, { recursive: true });

const itemThumbDir = path.resolve(process.cwd(), "uploads/item-thumb");
if (!fs.existsSync(itemThumbDir)) fs.mkdirSync(itemThumbDir, { recursive: true });

async function resizeToWebP(srcBuffer: Buffer, width: number): Promise<Buffer> {
  return sharp(srcBuffer)
    .resize(width, width, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

const editorExtDir = path.resolve(process.cwd(), "uploads/editor-ext");
if (!fs.existsSync(editorExtDir)) fs.mkdirSync(editorExtDir, { recursive: true });

// ─── 서버 시작 시 이미지 자동 캐시 (Cafe24 의존 제거) ─────────────────────────
async function autoDownloadAllImages() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_img1, it_img2, it_img3, it_img4, it_img5 FROM g5_shop_item WHERE it_use='1'`
    );
    const cafe24Base = "https://thegaongill17.mycafe24.com/data/item";
    const tasks: { localFile: string; remoteUrl: string }[] = [];
    for (const r of rows as any[]) {
      for (let i = 1; i <= 5; i++) {
        const raw: string = r[`it_img${i}`];
        if (!raw) continue;
        const match = raw.match(/^([^/]+)\/(.+)$/);
        if (!match) continue;
        const [, folder, filename] = match;
        const localFile = path.join(itemUploadDir, folder, filename);
        if (fs.existsSync(localFile)) continue;
        tasks.push({ localFile, remoteUrl: `${cafe24Base}/${folder}/${filename}` });
      }
    }
    if (tasks.length === 0) { console.log("[image-cache] 모든 이미지 이미 캐시됨"); return; }
    console.log(`[image-cache] ${tasks.length}개 이미지 다운로드 시작...`);
    let done = 0;
    for (let i = 0; i < tasks.length; i += 5) {
      const batch = tasks.slice(i, i + 5);
      await Promise.allSettled(batch.map(async ({ localFile, remoteUrl }) => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          const r = await fetch(remoteUrl, {
            signal: controller.signal,
            headers: { "Referer": "https://thegaongill17.mycafe24.com/", "User-Agent": "Mozilla/5.0" },
          });
          clearTimeout(timer);
          if (!r.ok) return;
          const buf = Buffer.from(await r.arrayBuffer());
          const dir = path.dirname(localFile);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(localFile, buf);
          done++;
        } catch { /* 개별 실패 무시 */ }
      }));
    }
    console.log(`[image-cache] 완료: ${done}/${tasks.length}개 저장`);
  } catch (e) {
    console.error("[image-cache] 오류:", e);
  }
}
// 서버 시작 3초 후 백그라운드 실행
setTimeout(autoDownloadAllImages, 3000);

// ─── 공용 외부 이미지 다운로드 헬퍼 ──────────────────────────────────────────
function fetchExternalImage(url: string): Promise<{ data: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, { timeout: 15000 }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const loc = response.headers.location;
        if (loc) return fetchExternalImage(loc).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) return reject(new Error(`HTTP ${response.statusCode}`));
      const chunks: Buffer[] = [];
      response.on("data", (c: Buffer) => chunks.push(c));
      response.on("end", () => resolve({ data: Buffer.concat(chunks), contentType: response.headers["content-type"] || "image/jpeg" }));
      response.on("error", reject);
    }).on("error", reject);
  });
}

function serveLocalOrFetch(
  localFile: string,
  remoteUrl: string,
  res: any,
  req: any
): Promise<void> {
  return new Promise(async (resolve) => {
    // 로컬 파일이 있으면 즉시 서빙
    if (fs.existsSync(localFile)) {
      const ext = path.extname(localFile).toLowerCase();
      const mime: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp" };
      res.set("Content-Type", mime[ext] || "image/jpeg");
      res.set("Cache-Control", "public, max-age=604800");
      res.sendFile(localFile);
      return resolve();
    }
    // 로컬 파일 없으면 원격에서 가져와 로컬에 저장 후 서빙 (영구 캐시)
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const remote = await fetch(remoteUrl, {
        signal: controller.signal,
        headers: { "Referer": "https://thegaongill17.mycafe24.com/", "User-Agent": "Mozilla/5.0" },
      });
      clearTimeout(timer);
      if (!remote.ok) { res.status(404).end(); return resolve(); }
      const ct = remote.headers.get("content-type") || "image/jpeg";
      const buf = Buffer.from(await remote.arrayBuffer());
      // 로컬에 저장 (다음 요청부터 Cafe24 불필요)
      try {
        const dir = path.dirname(localFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(localFile, buf);
      } catch { /* 保存に失敗しても配信は継続 */ }
      res.set("Content-Type", ct);
      res.set("Cache-Control", "public, max-age=604800");
      res.send(buf);
    } catch {
      res.status(404).end();
    }
    resolve();
  });
}

function makeEditorFilename(originalname: string): string {
  const ext = path.extname(originalname) || ".jpg";
  return `editor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
}

const editorUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("画像ファイルのみアップロードできます"));
  },
});

// ─── GCS 업로드 헬퍼 ──────────────────────────────────────────────────────────
async function uploadToGCS(filename: string, buffer: Buffer, mimetype: string): Promise<boolean> {
  if (!GCS_BUCKET_ID) return false;
  try {
    const bucket = objectStorageClient.bucket(GCS_BUCKET_ID);
    const file = bucket.file(`${GCS_PREFIX}/${filename}`);
    await file.save(buffer, { contentType: mimetype, resumable: false });
    return true;
  } catch (e: any) {
    console.error("[GCS] 업로드 실패:", e.message);
    return false;
  }
}

// ─── GCS 다운로드 헬퍼 ────────────────────────────────────────────────────────
async function downloadFromGCS(filename: string): Promise<{ buffer: Buffer; mimetype: string } | null> {
  if (!GCS_BUCKET_ID) return null;
  try {
    const bucket = objectStorageClient.bucket(GCS_BUCKET_ID);
    const file = bucket.file(`${GCS_PREFIX}/${filename}`);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [buffer] = await file.download();
    const [meta] = await file.getMetadata();
    return { buffer, mimetype: (meta.contentType as string) || "image/jpeg" };
  } catch (e: any) {
    console.error("[GCS] 다운로드 실패:", e.message);
    return null;
  }
}

// ─── 이미지 업로드 엔드포인트 ─────────────────────────────────────────────────
// 저장: GCS(영구) + 로컬 파일 캐시. DB 저장 없음.
router.post("/editor-upload", authMiddleware, editorUpload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "画像ファイルが必要です" });
    return;
  }
  const filename = makeEditorFilename(req.file.originalname);
  const buffer = req.file.buffer;
  const mimetype = req.file.mimetype;

  // 1. 로컬 파일로 저장 (빠른 서빙용 캐시 — 반드시 성공해야 함)
  let localSaved = false;
  try { fs.writeFileSync(path.join(editorUploadDir, filename), buffer); localSaved = true; } catch (e) {
    req.log?.error({ filename, err: e }, "로컬 파일 저장 실패");
  }

  if (!localSaved) {
    res.status(500).json({ error: "画像の保存に失敗しました。もう一度お試しください。" });
    return;
  }

  // 2. GCS에 저장 (재배포해도 영구 유지) — 실패해도 로컬 파일로 서빙 가능하므로 계속 진행
  uploadToGCS(filename, buffer, mimetype).then(ok => {
    if (ok) req.log?.info({ filename, size: buffer.length }, "이미지 GCS 저장 완료");
    else req.log?.warn({ filename }, "GCS 업로드 실패 — 로컬 파일로 서빙 유지");
  }).catch(() => {});

  res.json({ url: `/api/editor-uploaded/${filename}` });
});

// ─── 이미지 서빙 엔드포인트 ───────────────────────────────────────────────────
// 서빙: 로컬파일 → GCS → MySQL폴백(기존 이미지 전용, 서빙 시 GCS로 자동 이전)
router.get("/editor-uploaded/:filename", async (req, res) => {
  const filename = (req.params as any).filename;
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  };

  // 1. 로컬 파일 (캐시)
  const filePath = path.join(editorUploadDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size >= 500) {
        res.set("Content-Type", mimeMap[ext] || "image/jpeg");
        res.set("Cache-Control", "public, max-age=86400");
        res.sendFile(filePath);
        return;
      } else {
        fs.unlinkSync(filePath);
      }
    } catch {}
  }

  // 2. GCS (배포 환경에서 영구 저장된 파일)
  const gcsResult = await downloadFromGCS(filename);
  if (gcsResult && gcsResult.buffer.length >= 500) {
    try { fs.writeFileSync(filePath, gcsResult.buffer); } catch {}
    res.set("Content-Type", gcsResult.mimetype || mimeMap[ext] || "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(gcsResult.buffer);
    return;
  }

  // 3. MySQL 폴백 (기존에 DB에만 저장된 이미지 복구용, 새 업로드에는 사용 안 함)
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT data, mimetype FROM editor_images WHERE filename = ? LIMIT 1",
      [filename]
    );
    if (rows.length > 0) {
      const { data, mimetype } = rows[0];
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (buffer.length >= 500) {
        try { fs.writeFileSync(filePath, buffer); } catch {}
        // GCS로 자동 이전 (비동기, 실패해도 서빙은 계속)
        uploadToGCS(filename, buffer, mimetype || mimeMap[ext] || "image/jpeg").catch(() => {});
        res.set("Content-Type", mimetype || mimeMap[ext] || "image/jpeg");
        res.set("Cache-Control", "public, max-age=86400");
        res.send(buffer);
        return;
      }
    }
  } catch {}

  res.set("Cache-Control", "no-store");
  res.status(404).json({ error: "画像が見つかりません。もう一度アップロードしてください。" });
});

const imageCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
const CACHE_TTL = 3600 * 1000;

router.get("/product-image/:folder/:filename", async (req, res) => {
  const folder = (req.params as any).folder;
  const filename = (req.params as any).filename;
  const wParam = parseInt(String((req.query as any).w || "0"), 10);
  const width = wParam > 0 && wParam <= 1200 ? wParam : 0;

  const localFile = path.join(itemUploadDir, folder, filename);
  const remoteUrl = `https://thegaongill17.mycafe24.com/data/item/${folder}/${filename}`;

  // 썸네일 요청: 리사이즈 + WebP 변환 후 디스크 캐시
  if (width > 0) {
    const thumbKey = `${folder}__${filename}__w${width}.webp`;
    const thumbFile = path.join(itemThumbDir, thumbKey);

    // 캐시 히트
    if (fs.existsSync(thumbFile)) {
      res.set("Content-Type", "image/webp");
      res.set("Cache-Control", "public, max-age=2592000"); // 30일
      res.sendFile(thumbFile);
      return;
    }

    // 원본 버퍼 가져오기 (로컬 파일 우선, 없으면 원격 fetch 후 로컬 저장)
    let srcBuffer: Buffer | null = null;
    if (fs.existsSync(localFile)) {
      srcBuffer = fs.readFileSync(localFile);
    } else {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const remote = await fetch(remoteUrl, {
          signal: controller.signal,
          headers: { "Referer": "https://thegaongill17.mycafe24.com/", "User-Agent": "Mozilla/5.0" },
        });
        clearTimeout(timer);
        if (!remote.ok) { res.status(404).end(); return; }
        srcBuffer = Buffer.from(await remote.arrayBuffer());
        // 로컬에 저장 (다음 요청부터 Cafe24 불필요)
        try {
          const dir = path.dirname(localFile);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(localFile, srcBuffer);
        } catch { /* 保存に失敗しても継続 */ }
      } catch {
        res.status(404).end();
        return;
      }
    }

    try {
      const webpBuf = await resizeToWebP(srcBuffer, width);
      fs.writeFileSync(thumbFile, webpBuf);
      res.set("Content-Type", "image/webp");
      res.set("Cache-Control", "public, max-age=2592000");
      res.send(webpBuf);
    } catch {
      // sharp 실패 시 원본 서빙
      res.set("Cache-Control", "public, max-age=604800");
      res.send(srcBuffer);
    }
    return;
  }

  // 원본 그대로 서빙
  await serveLocalOrFetch(localFile, remoteUrl, res, req);
});

router.get("/editor-image/:folder/:filename", async (req, res) => {
  const folder = (req.params as any).folder;
  const filename = (req.params as any).filename;
  const localFile = path.join(editorExtDir, folder, filename);
  const remoteUrl = `https://thegaongill17.mycafe24.com/data/editor/${folder}/${filename}`;
  await serveLocalOrFetch(localFile, remoteUrl, res, req);
});

function rewriteExplanImages(html: string): string {
  if (!html) return html;
  return html
    .replace(/https?:\/\/daonmart\.kr\/data\/editor\//g, "/api/editor-image/")
    .replace(/https?:\/\/49\.247\.30\.141\/data\/editor\//g, "/api/editor-image/")
    .replace(/https?:\/\/daonmart\.iwinv\.net\/data\/editor\//g, "/api/editor-image/")
    .replace(/https?:\/\/thegaongill17\.mycafe24\.com\/data\/editor\//g, "/api/editor-image/")
    .replace(/https?:\/\/thegaongill17\.mycafe24\.com\/data\/item\//g, "/api/product-image/");
}

router.get("/products", async (req, res) => {
  try {
    const params = GetProductsQueryParams.parse(req.query);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const sort = String((req.query as any).sort || "newest");
    const offset = (page - 1) * limit;

    let whereClause = "WHERE i.it_use = '1'";
    const queryParams: any[] = [];

    if (params.category) {
      whereClause += " AND i.ca_id LIKE ?";
      queryParams.push(`${params.category}%`);
    }

    if (params.search) {
      whereClause += " AND (i.it_name LIKE ? OR i.it_id LIKE ?)";
      queryParams.push(`%${params.search}%`, `%${params.search}%`);
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_shop_item i ${whereClause}`,
      queryParams
    );
    const total = Number(countRows[0].total);

    const orderBy = sort === "price_asc"
      ? "ORDER BY CAST(i.it_price AS DECIMAL(18,2)) ASC, i.it_order ASC, i.it_time DESC"
      : sort === "price_desc"
        ? "ORDER BY CAST(i.it_price AS DECIMAL(18,2)) DESC, i.it_order ASC, i.it_time DESC"
        : sort === "name_asc"
          ? "ORDER BY i.it_name ASC, i.it_order ASC, i.it_time DESC"
          : "ORDER BY i.it_order ASC, i.it_time DESC";

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_cust_price, i.it_price, i.it_stock_qty, i.it_img1, i.it_explan, i.ca_id, i.it_sell_email, i.it_origin, i.it_maker,
        i.it_1, i.it_2, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       ${whereClause}
       ${orderBy}
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const productIds = rows.map((r: any) => r.it_id);
    let optionsMap: Record<string, any[]> = {};
    if (productIds.length > 0) {
      const [optRows] = await pool.query<RowDataPacket[]>(
        `SELECT it_id, io_no, io_id, io_price, io_stock_qty, io_use
         FROM g5_shop_item_option
         WHERE it_id IN (${productIds.map(() => '?').join(',')}) AND io_use = 1
         ORDER BY io_no ASC`,
        productIds
      );
      for (const opt of optRows) {
        if (!optionsMap[opt.it_id]) optionsMap[opt.it_id] = [];
        optionsMap[opt.it_id].push({
          io_no: opt.io_no,
          io_id: opt.io_id,
          io_price: Number(opt.io_price) || 0,
        });
      }
    }

    const IMG_PROXY_BASE = "/api/product-image";

    res.json({
      products: rows.map((r: any) => {
        const options = optionsMap[r.it_id] || [];
        const boxOpt = options.find((o: any) => o.io_id.includes('박스'));
        let bq = Number(r.it_2) || 0;
        if (!bq && boxOpt) {
          const m = boxOpt.io_id.match(/(\d+)\s*[입팩개]/);
          if (m) bq = parseInt(m[1], 10);
        }
        const bp = Number(r.it_price) || 0;
        const bxp = boxOpt ? bp + Number(boxOpt.io_price) : bp;
        const up = bq > 0 ? Math.round(bxp / bq) : 0;
        return {
          it_id: r.it_id,
          it_name: r.it_name,
          it_cust_price: Number(r.it_cust_price) || 0,
          it_price: bp,
          it_2: bq,
          it_stock_qty: Number(r.it_stock_qty) || 0,
          it_img1: r.it_img1 ? (r.it_img1.startsWith("/api/") ? r.it_img1 : `${IMG_PROXY_BASE}/${r.it_img1}`) : "",
          it_explan: rewriteExplanImages(r.it_explan || ""),
          ca_id: r.ca_id || "",
          ca_name: r.ca_name || "",
          it_sell_email: r.it_sell_email || "",
          it_origin: r.it_origin || "",
          it_maker: r.it_maker || "",
          it_shelf_life: r.it_1 || "",
          options: options.map((o: any) => ({
            io_no: o.io_no,
            io_id: o.io_id,
            io_price: o.io_price,
          })),
          box_option: bq > 0 ? {
            io_no: boxOpt?.io_no ?? null,
            io_id: boxOpt?.io_id ?? `${bq}입`,
            io_price: boxOpt ? Number(boxOpt.io_price) : 0,
            box_price: bxp,
            box_qty: bq,
            unit_price: up,
          } : null,
        };
      }),
      total,
      page,
      limit,
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetProducts error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const { id } = GetProductParams.parse(req.params);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "商品が見つかりません" });
      return;
    }
    const r = rows[0];
    const IMG_PROXY_BASE = "/api/product-image";

    const [optRows] = await pool.query<RowDataPacket[]>(
      "SELECT io_id, io_price, io_stock_qty, io_type, io_use FROM g5_shop_item_option WHERE it_id = ? AND io_use = '1' ORDER BY io_no",
      [id]
    );
    const options = (optRows as any[]).map((o: any) => ({
      io_id: o.io_id,
      io_price: Number(o.io_price) || 0,
      io_type: o.io_type || "",
    }));
    const boxOption = options.find((o: any) => o.io_id && o.io_id.includes("박스"));

    let box_qty = Number(r.it_2) || 0;
    if (!box_qty && boxOption) {
      const m = boxOption.io_id.match(/(\d+)\s*[입팩개]/);
      if (m) box_qty = parseInt(m[1], 10);
    }

    const basePrice = Number(r.it_price) || 0;
    const boxPrice = boxOption ? basePrice + boxOption.io_price : basePrice;
    const unitPrice = box_qty > 0 ? Math.round(boxPrice / box_qty) : basePrice;

    res.json({
      it_id: r.it_id,
      it_name: r.it_name,
      it_cust_price: Number(r.it_cust_price) || 0,
      it_price: basePrice,
      it_stock_qty: Number(r.it_stock_qty) || 0,
      it_img1: r.it_img1 ? (r.it_img1.startsWith("/api/") ? r.it_img1 : `${IMG_PROXY_BASE}/${r.it_img1}`) : "",
      it_explan: rewriteExplanImages(r.it_explan || ""),
      ca_id: r.ca_id || "",
      ca_name: r.ca_name || "",
      it_sell_email: r.it_sell_email || "",
      it_origin: r.it_origin || "",
      it_maker: r.it_maker || "",
      it_shelf_life: r.it_1 || "",
      it_use: String(r.it_use ?? "1"),
      options,
      box_option: boxOption ? {
        io_id: boxOption.io_id,
        box_price: boxPrice,
        box_qty,
        unit_price: unitPrice,
      } : null,
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetProduct error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ca_id, ca_name FROM g5_shop_category WHERE ca_use = '1' ORDER BY ca_order, ca_id`
    );

    const level1: any[] = [];
    const level2Map: Record<string, any[]> = {};
    const level3Map: Record<string, any[]> = {};

    for (const r of rows as any[]) {
      const len = r.ca_id.length;
      const item = { ca_id: r.ca_id, ca_name: r.ca_name };
      if (len === 2) {
        level1.push({ ...item, children: [] });
      } else if (len === 4) {
        const parentId = r.ca_id.substring(0, 2);
        if (!level2Map[parentId]) level2Map[parentId] = [];
        level2Map[parentId].push({ ...item, children: [] });
      } else if (len === 6) {
        const parentId = r.ca_id.substring(0, 4);
        if (!level3Map[parentId]) level3Map[parentId] = [];
        level3Map[parentId].push(item);
      }
    }

    for (const parentId of Object.keys(level2Map)) {
      for (const child of level2Map[parentId]) {
        child.children = level3Map[child.ca_id] || [];
      }
    }

    for (const cat of level1) {
      cat.children = level2Map[cat.ca_id] || [];
    }

    res.json({
      categories: rows.map((r: any) => ({
        ca_id: r.ca_id,
        ca_name: r.ca_name,
      })),
      tree: level1,
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetCategories error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/admin/products", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || "";
    const searchField = req.query.search_field as string || "all";
    const category = req.query.category as string || "";
    const useFilter = req.query.it_use as string;
    const soldoutFilter = req.query.it_soldout as string;
    const dateFrom = req.query.date_from as string || "";
    const dateTo = req.query.date_to as string || "";

    let whereClause = "WHERE SUBSTRING(i.ca_id,1,2) != 'b0'";
    const queryParams: any[] = [];

    if (useFilter !== undefined && useFilter !== "") {
      whereClause += " AND i.it_use = ?";
      queryParams.push(useFilter);
    }
    if (soldoutFilter !== undefined && soldoutFilter !== "") {
      whereClause += " AND i.it_soldout = ?";
      queryParams.push(soldoutFilter);
    }
    if (category === "__unassigned") {
      whereClause += " AND (i.ca_id = '' OR i.ca_id IS NULL)";
    } else if (category) {
      whereClause += " AND i.ca_id LIKE ?";
      queryParams.push(`${category}%`);
    }
    if (search) {
      if (searchField === "name") {
        whereClause += " AND i.it_name LIKE ?";
        queryParams.push(`%${search}%`);
      } else if (searchField === "id") {
        whereClause += " AND i.it_id LIKE ?";
        queryParams.push(`%${search}%`);
      } else {
        whereClause += " AND (i.it_name LIKE ? OR i.it_id LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`);
      }
    }
    if (dateFrom) {
      whereClause += " AND DATE(i.it_time) >= ?";
      queryParams.push(dateFrom);
    }
    if (dateTo) {
      whereClause += " AND DATE(i.it_time) <= ?";
      queryParams.push(dateTo);
    }
    const imgSourceFilter = req.query.image_source as string || "";
    if (imgSourceFilter === "kakao") {
      whereClause += " AND ais.source = 'kakao'";
    } else if (imgSourceFilter === "original") {
      whereClause += " AND ais.it_id IS NULL";
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_shop_item i
       LEFT JOIN seoulmono_image_source ais ON i.it_id = ais.it_id
       ${whereClause}`, queryParams
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.it_id, i.it_name, i.it_cust_price, i.it_price, i.it_2, i.it_stock_qty,
              i.it_img1, i.ca_id, i.it_use, i.it_soldout, i.it_notax, i.it_1, i.it_order, i.it_time, i.it_maker, i.it_origin, i.it_explan,
              c.ca_name,
              c_root.ca_name AS ca_name_root,
              ais.source AS image_source
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       LEFT JOIN g5_shop_category c_root ON SUBSTRING(i.ca_id, 1, 2) = c_root.ca_id AND LENGTH(c_root.ca_id) = 2
       LEFT JOIN seoulmono_image_source ais ON i.it_id = ais.it_id
       ${whereClause}
       ORDER BY (i.it_order + 0) ASC, i.it_time DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const IMG_PROXY_BASE = "/api/product-image";
    res.json({
      products: rows.map((r: any) => ({
        it_id: r.it_id,
        it_name: r.it_name,
        it_cust_price: Number(r.it_cust_price) || 0,
        it_price: Number(r.it_price) || 0,
        it_2: Number(r.it_2) || 0,
        it_stock_qty: Number(r.it_stock_qty) || 0,
        it_img1: r.it_img1 ? (r.it_img1.startsWith("/api/") ? r.it_img1 : `${IMG_PROXY_BASE}/${r.it_img1}`) : "",
        ca_id: r.ca_id || "",
        ca_name: r.ca_name || "",
        ca_name_root: r.ca_name_root || "",
        it_use: r.it_use,
        it_soldout: r.it_soldout || "0",
        it_notax: String(r.it_notax ?? "0"),
        it_shelf_life: r.it_1 || "",
        it_order: Number(r.it_order) || 0,
        it_maker: r.it_maker || "",
        it_origin: r.it_origin || "",
        it_explan: r.it_explan || "",
        image_source: r.image_source || null,
      })),
      total, page, limit,
    });
  } catch (err: any) {
    req.log?.error({ err }, "AdminGetProducts error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/admin/products/category-stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [summary] = await pool.query<RowDataPacket[]>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN it_use='1' THEN 1 ELSE 0 END) as use_on,
        SUM(CASE WHEN it_use!='1' THEN 1 ELSE 0 END) as use_off,
        SUM(CASE WHEN it_soldout='1' THEN 1 ELSE 0 END) as soldout,
        SUM(CASE WHEN ca_id='' OR ca_id IS NULL THEN 1 ELSE 0 END) as unassigned,
        (SELECT COUNT(*) FROM seoulmono_image_source WHERE source='kakao') as kakao_img_count
      FROM g5_shop_item
      WHERE SUBSTRING(ca_id,1,2) != 'b0'
    `);

    const [catStats] = await pool.query<RowDataPacket[]>(`
      SELECT
        COALESCE(NULLIF(SUBSTRING(i.ca_id,1,2),''), '') as ca_2,
        c.ca_name,
        c.ca_use,
        COUNT(*) as total,
        SUM(CASE WHEN i.it_use='1' THEN 1 ELSE 0 END) as use_on,
        SUM(CASE WHEN i.it_use!='1' THEN 1 ELSE 0 END) as use_off,
        SUM(CASE WHEN i.it_soldout='1' THEN 1 ELSE 0 END) as soldout
      FROM g5_shop_item i
      LEFT JOIN g5_shop_category c
        ON SUBSTRING(i.ca_id,1,2) = c.ca_id AND LENGTH(c.ca_id)=2
      WHERE SUBSTRING(i.ca_id,1,2) != 'b0'
      GROUP BY SUBSTRING(i.ca_id,1,2), c.ca_name, c.ca_use
      ORDER BY ca_2 ASC
    `);

    res.json({ summary: summary[0], categories: catStats });
  } catch (err: any) {
    req.log?.error({ err }, "CategoryStats error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/admin/products/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, c.ca_name
       FROM g5_shop_item i
       LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
       WHERE i.it_id = ?`, [productId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "商品が見つかりません" });
      return;
    }
    const r = rows[0];
    const IMG_PROXY_BASE = "/api/product-image";

    const [optRows] = await pool.query<RowDataPacket[]>(
      `SELECT io_no, io_id, io_price, io_stock_qty, io_type, io_use
       FROM g5_shop_item_option WHERE it_id = ? ORDER BY io_no ASC`, [productId]
    );

    const imageEntries: Record<string, string> = {};
    for (let i = 1; i <= 10; i++) {
      const val = r[`it_img${i}`] || "";
      if (!val) { imageEntries[`it_img${i}`] = ""; continue; }
      if (val.startsWith("/api/")) { imageEntries[`it_img${i}`] = val; }
      else { imageEntries[`it_img${i}`] = `${IMG_PROXY_BASE}/${val}`; }
    }

    res.json({
      it_id: r.it_id,
      it_name: r.it_name,
      it_cust_price: Number(r.it_cust_price) || 0,
      it_price: Number(r.it_price) || 0,
      it_stock_qty: Number(r.it_stock_qty) || 0,
      ...imageEntries,
      ca_id: r.ca_id || "",
      ca_name: r.ca_name || "",
      it_use: String(r.it_use ?? "1"),
      it_notax: String(r.it_notax ?? "0"),
      it_shelf_life: r.it_1 || "",
      box_qty: Number(r.it_2) || 0,
      box_discount: Number(r.it_3) || 0,
      it_order: Number(r.it_order) || 0,
      it_maker: r.it_maker || "",
      it_origin: r.it_origin || "",
      it_explan: rewriteExplanImages(r.it_explan || ""),
      it_sell_email: r.it_sell_email || "",
      it_info: r.it_info || "",
      it_mobile_explan: r.it_mobile_explan || "",
      it_time: r.it_time || "",
      options: optRows.map((o: any) => ({
        io_no: Number(o.io_no),
        io_id: o.io_id,
        io_price: Number(o.io_price) || 0,
        io_stock_qty: Number(o.io_stock_qty) || 0,
        io_type: String(o.io_type ?? "0"),
        io_use: String(o.io_use ?? "1"),
      })),
    });
  } catch (err: any) {
    req.log?.error({ err }, "AdminGetProductDetail error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/admin/products/fix-broken-images", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_id, ${Array.from({ length: 10 }, (_, i) => `it_img${i + 1}`).join(", ")} FROM g5_shop_item WHERE it_use = '1'`
    );
    // MySQL에 저장된 editor 이미지 파일명 목록 조회 (빠른 조회용)
    const [dbImgs] = await pool.query<RowDataPacket[]>("SELECT filename FROM editor_images");
    const dbImgSet = new Set((dbImgs as any[]).map((r: any) => r.filename));

    let fixedCount = 0;
    for (const r of rows) {
      const brokenCols: string[] = [];
      for (let i = 1; i <= 10; i++) {
        const val = r[`it_img${i}`] || "";
        if (!val || !val.startsWith("/api/editor-uploaded/")) continue;
        const fname = val.replace("/api/editor-uploaded/", "");
        // 로컬 디스크에 있는지 확인
        const localPath = path.join(editorUploadDir, fname);
        if (fs.existsSync(localPath)) continue;
        // MySQL에 있는지 확인
        if (dbImgSet.has(fname)) continue;
        // 어디에도 없으면 깨진 이미지
        brokenCols.push(`it_img${i}`);
      }
      if (brokenCols.length > 0) {
        const sets = brokenCols.map(col => `${col} = ''`).join(", ");
        await pool.query(`UPDATE g5_shop_item SET ${sets} WHERE it_id = ?`, [r.it_id]);
        fixedCount++;
        req.log?.info({ brokenCols, productId: r.it_id }, "깨진 이미지 참조 제거");
      }
    }
    res.json({ success: true, fixedProducts: fixedCount, totalChecked: rows.length });
  } catch (err: any) {
    req.log?.error({ err }, "FixBrokenImages error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/admin/products/:id/copy", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const sourceId = req.params.id;
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM g5_shop_item WHERE it_id = ?`, [sourceId]);
    if (rows.length === 0) {
      res.status(404).json({ error: "元の商品が見つかりません" });
      return;
    }
    const src = rows[0];

    const [maxRows] = await pool.query<RowDataPacket[]>(
      `SELECT MAX(CAST(it_id AS UNSIGNED)) as max_id FROM g5_shop_item WHERE it_id REGEXP '^[0-9]+$'`
    );
    const maxId = Number(maxRows[0]?.max_id) || 0;
    const newId = String(maxId + 1);

    const skipCols = new Set(["it_id", "it_time", "it_hit", "it_sum_qty", "it_use_cnt", "it_use_avg"]);
    const srcKeys = Object.keys(src).filter(k => !skipCols.has(k));
    const resetCols = ["it_hit", "it_sum_qty", "it_use_cnt", "it_use_avg"];
    const cols = ["it_id", ...srcKeys, ...resetCols, "it_time"];
    const vals = [
      newId,
      // it_order는 원본 그대로 복사, it_time=NOW()가 가장 최신이므로 맨 위에 표시
      ...srcKeys.map(col => {
        if (col === "it_name") return `${src.it_name} (コピー)`;
        const v = src[col];
        return v === null || v === undefined ? null : v;
      }),
      ...resetCols.map(() => 0),
    ];
    const placeholders = cols.map(c => c === "it_time" ? "NOW()" : "?").join(", ");
    await pool.query(`INSERT INTO g5_shop_item (${cols.join(", ")}) VALUES (${placeholders})`, vals);

    const [optRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM g5_shop_item_option WHERE it_id = ? ORDER BY io_no`, [sourceId]
    );
    for (const opt of optRows as any[]) {
      const optSkip = new Set(["io_no", "it_id"]);
      const optKeys = Object.keys(opt).filter(k => !optSkip.has(k));
      const optCols = ["it_id", ...optKeys];
      const optVals = [newId, ...optKeys.map(k => {
        const v = opt[k];
        return v === null || v === undefined ? null : v;
      })];
      const optPlaceholders = optCols.map(() => "?").join(", ");
      await pool.query(`INSERT INTO g5_shop_item_option (${optCols.join(", ")}) VALUES (${optPlaceholders})`, optVals);
    }
    res.json({ success: true, it_id: newId });
  } catch (err: any) {
    req.log?.error({ err, message: err?.message, sqlMessage: (err as any)?.sqlMessage }, "AdminCopyProduct error");
    res.status(500).json({ error: `商品のコピーに失敗しました: ${(err as any)?.sqlMessage || err?.message || "不明なエラー"}` });
  }
});

router.post("/admin/products/:id/options", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const { options } = req.body;
    if (!Array.isArray(options)) {
      res.status(400).json({ error: "オプションデータが正しくありません" });
      return;
    }

    await pool.query(`DELETE FROM g5_shop_item_option WHERE it_id = ?`, [productId]);

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      await pool.query(
        `INSERT INTO g5_shop_item_option (it_id, io_id, io_price, io_stock_qty, io_type, io_use)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, opt.io_id || "", opt.io_price || 0, opt.io_stock_qty || 0, opt.io_type || "0", opt.io_use ?? "1"]
      );
    }

    res.json({ success: true, count: options.length });
  } catch (err: any) {
    req.log?.error({ err }, "AdminSaveProductOptions error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/admin/products", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { it_id, it_name, it_price, it_cust_price, it_stock_qty, ca_id, it_maker, it_origin, it_use, it_notax, it_shelf_life, it_order, it_explan, it_sell_email, box_qty } = req.body;
    if (!it_id || !it_name) {
      res.status(400).json({ error: "商品コードと商品名は必須です" });
      return;
    }
    const [existing] = await pool.query<RowDataPacket[]>(`SELECT it_id FROM g5_shop_item WHERE it_id = ?`, [it_id]);
    if (existing.length > 0) {
      res.status(400).json({ error: "すでに存在する商品コードです" });
      return;
    }
    const imgCols: string[] = [];
    const imgVals: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const uploaded = req.body[`it_img${i}_uploaded`];
      if (uploaded && uploaded !== "__REMOVE__") {
        imgCols.push(`it_img${i}`);
        imgVals.push(uploaded);
      }
    }
    const extraCols = imgCols.length ? ", " + imgCols.join(", ") : "";
    const extraPlaceholders = imgCols.length ? ", " + imgCols.map(() => "?").join(", ") : "";
    await pool.query(
      `INSERT INTO g5_shop_item (it_id, it_name, it_price, it_cust_price, it_stock_qty, ca_id, it_maker, it_origin, it_use, it_notax, it_1, it_2, it_order, it_explan, it_sell_email, it_time, store_mb_id, it_quo${extraCols})
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), '', ''${extraPlaceholders})`,
      [it_id, it_name, it_price || 0, it_cust_price || 0, it_stock_qty || 0, ca_id || "", it_maker || "", it_origin || "", it_use ?? "1", it_notax ?? "0", it_shelf_life || "", String(box_qty || 0), it_order || 0, it_explan || "", it_sell_email || "", ...imgVals]
    );
    res.json({ success: true, it_id });
  } catch (err: any) {
    req.log?.error({ err }, "AdminCreateProduct error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.put("/admin/products/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const { it_name, it_price, it_cust_price, it_stock_qty, ca_id, it_maker, it_origin, it_use, it_notax, it_shelf_life, it_order, it_explan, it_sell_email, box_qty, box_discount } = req.body;
    const imgSets: string[] = [];
    const imgVals: any[] = [];
    let img1Replaced = false;
    for (let i = 1; i <= 10; i++) {
      const uploaded = req.body[`it_img${i}_uploaded`];
      if (uploaded === "__REMOVE__") {
        imgSets.push(`it_img${i}=?`);
        imgVals.push("");
        if (i === 1) img1Replaced = true;
      } else if (uploaded) {
        imgSets.push(`it_img${i}=?`);
        imgVals.push(uploaded);
        if (i === 1) img1Replaced = true;
      }
    }
    const imgSetClause = imgSets.length ? ", " + imgSets.join(", ") : "";
    await pool.query(
      `UPDATE g5_shop_item SET it_name=?, it_price=?, it_cust_price=?, it_stock_qty=?, ca_id=?, it_maker=?, it_origin=?, it_use=?, it_notax=?, it_1=?, it_2=?, it_3=?, it_order=?, it_explan=?, it_sell_email=?, it_update_time=NOW()${imgSetClause}
       WHERE it_id=?`,
      [it_name, it_price || 0, it_cust_price || 0, it_stock_qty || 0, ca_id || "", it_maker || "", it_origin || "", it_use ?? "1", it_notax ?? "0", it_shelf_life || "", String(box_qty || 0), String(box_discount || 0), it_order || 0, it_explan || "", it_sell_email || "", ...imgVals, productId]
    );
    // 대표이미지(it_img1)가 교체된 경우 seoulmono_image_source에서 kakao 플래그 제거
    if (img1Replaced) {
      await pool.query(
        `DELETE FROM seoulmono_image_source WHERE it_id = ?`,
        [productId]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminUpdateProduct error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.delete("/admin/products/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    await pool.query(`DELETE FROM g5_shop_item_option WHERE it_id = ?`, [productId]);
    await pool.query(`DELETE FROM g5_shop_item WHERE it_id = ?`, [productId]);
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminDeleteProduct error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/admin/products/batch-price", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { product_ids, action, value } = req.body;
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      res.status(400).json({ error: "商品を選択してください" });
      return;
    }
    if (!action || value === undefined) {
      res.status(400).json({ error: "変更方法と値を入力してください" });
      return;
    }
    const placeholders = product_ids.map(() => "?").join(",");
    if (action === "set_price") {
      await pool.query(`UPDATE g5_shop_item SET it_price = ? WHERE it_id IN (${placeholders})`, [Number(value), ...product_ids]);
    } else if (action === "set_cust_price") {
      await pool.query(`UPDATE g5_shop_item SET it_cust_price = ? WHERE it_id IN (${placeholders})`, [Number(value), ...product_ids]);
    } else if (action === "adjust_price_percent") {
      await pool.query(`UPDATE g5_shop_item SET it_price = ROUND(it_price * (1 + ? / 100)) WHERE it_id IN (${placeholders})`, [Number(value), ...product_ids]);
    } else if (action === "adjust_price_amount") {
      await pool.query(`UPDATE g5_shop_item SET it_price = it_price + ? WHERE it_id IN (${placeholders})`, [Number(value), ...product_ids]);
    } else {
      res.status(400).json({ error: "変更方法が正しくありません" });
      return;
    }
    res.json({ success: true, updated: product_ids.length });
  } catch (err: any) {
    req.log?.error({ err }, "AdminBatchPrice error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/admin/products/batch-shelf-life", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { product_ids, shelf_life } = req.body;
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      res.status(400).json({ error: "商品を選択してください" });
      return;
    }
    if (shelf_life === undefined || shelf_life === null) {
      res.status(400).json({ error: "賞味期限の値を入力してください" });
      return;
    }
    const placeholders = product_ids.map(() => "?").join(",");
    await pool.query(`UPDATE g5_shop_item SET it_1 = ? WHERE it_id IN (${placeholders})`, [String(shelf_life), ...product_ids]);
    res.json({ success: true, updated: product_ids.length });
  } catch (err: any) {
    req.log?.error({ err }, "AdminBatchShelfLife error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/admin/products/batch-status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { product_ids, it_use } = req.body;
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      res.status(400).json({ error: "商品を選択してください" });
      return;
    }
    if (it_use !== "0" && it_use !== "1") {
      res.status(400).json({ error: "ステータス値が正しくありません" });
      return;
    }
    const placeholders = product_ids.map(() => "?").join(",");
    await pool.query(`UPDATE g5_shop_item SET it_use = ? WHERE it_id IN (${placeholders})`, [it_use, ...product_ids]);
    res.json({ success: true, updated: product_ids.length });
  } catch (err: any) {
    req.log?.error({ err }, "AdminBatchStatus error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// ── 상품 노출/판매상태 개별 업데이트 ──────────────────────────────────────────
router.patch("/admin/products/:id/notice", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const { it_info } = req.body;
    if (typeof it_info !== "string") {
      res.status(400).json({ error: "it_info の値が必要です" });
      return;
    }
    await pool.query(`UPDATE g5_shop_item SET it_info=? WHERE it_id=?`, [it_info, productId]);
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminUpdateNotice error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.patch("/admin/products/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const { it_use, it_soldout } = req.body;

    const sets: string[] = [];
    const vals: any[] = [];

    if (it_use !== undefined) {
      if (it_use !== "0" && it_use !== "1") return res.status(400).json({ error: "it_use は '0' または '1' です" });
      sets.push("it_use=?"); vals.push(it_use);
    }
    if (it_soldout !== undefined) {
      if (!["0", "1", "2"].includes(it_soldout)) return res.status(400).json({ error: "it_soldout は '0'、'1'、'2' のいずれかです" });
      sets.push("it_soldout=?"); vals.push(it_soldout);
    }
    if (sets.length === 0) return res.status(400).json({ error: "変更する項目がありません" });

    vals.push(productId);
    await pool.query(`UPDATE g5_shop_item SET ${sets.join(",")} WHERE it_id=?`, vals);
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminPatchProductStatus error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/admin/products/batch-delete", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { product_ids } = req.body;
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      res.status(400).json({ error: "削除する商品を選択してください" });
      return;
    }
    const placeholders = product_ids.map(() => "?").join(",");
    await pool.query(`DELETE FROM g5_shop_item_option WHERE it_id IN (${placeholders})`, product_ids);
    await pool.query(`DELETE FROM g5_shop_item WHERE it_id IN (${placeholders})`, product_ids);
    res.json({ success: true, deleted: product_ids.length });
  } catch (err: any) {
    req.log?.error({ err }, "AdminBatchDeleteProducts error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// ─── Category Images Table Init ────────────────────────────────────────────────
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_category_images (
        ca_id VARCHAR(10) NOT NULL PRIMARY KEY,
        image_url VARCHAR(1000) NOT NULL DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
  } catch (e) { console.error("category_images table init error", e); }
})();

// ─── Category Image Upload ────────────────────────────────────────────────────
router.post("/admin/categories/upload-image", authMiddleware, adminMiddleware, editorUpload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "画像ファイルが必要です" });
    return;
  }
  const filename = makeEditorFilename(req.file.originalname);
  const buffer = req.file.buffer;
  const mimetype = req.file.mimetype;

  // 1. 로컬 파일 캐시 (반드시 성공해야 함)
  let localSaved = false;
  try { fs.writeFileSync(path.join(editorUploadDir, filename), buffer); localSaved = true; } catch (e) {
    req.log?.error({ filename, err: e }, "카테고리 이미지 로컬 저장 실패");
  }
  if (!localSaved) {
    res.status(500).json({ error: "画像の保存に失敗しました。もう一度お試しください。" });
    return;
  }

  // 2. GCS에 영구 저장 — 실패해도 로컬로 서빙 가능하므로 계속 진행
  uploadToGCS(filename, buffer, mimetype).then(ok => {
    if (ok) req.log?.info({ filename, size: buffer.length }, "카테고리 이미지 GCS 저장 완료");
    else req.log?.warn({ filename }, "카테고리 이미지 GCS 실패 — 로컬 서빙 유지");
  }).catch(() => {});

  res.json({ url: `/api/editor-uploaded/${filename}` });
});

router.get("/admin/categories", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.ca_id, c.ca_name, c.ca_use, c.ca_order, COALESCE(ci.image_url, '') AS ca_img
       FROM g5_shop_category c
       LEFT JOIN seoulmono_category_images ci ON c.ca_id = ci.ca_id
       ORDER BY c.ca_order, c.ca_id`
    );
    res.json({
      categories: rows.map((r: any) => ({
        ca_id: r.ca_id,
        ca_name: r.ca_name,
        ca_use: r.ca_use,
        ca_order: Number(r.ca_order) || 0,
        ca_img: r.ca_img || "",
      })),
    });
  } catch (err: any) {
    req.log?.error({ err }, "AdminGetCategories error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/admin/categories", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ca_id, ca_name, ca_use, ca_order } = req.body;
    if (!ca_id || !ca_name) {
      res.status(400).json({ error: "カテゴリコードと名前は必須です" });
      return;
    }
    const [existing] = await pool.query<RowDataPacket[]>(`SELECT ca_id FROM g5_shop_category WHERE ca_id = ?`, [ca_id]);
    if (existing.length > 0) {
      res.status(400).json({ error: "すでに存在するカテゴリコードです" });
      return;
    }

    // 실제 테이블 컬럼을 동적으로 조회해서 NOT NULL + NO DEFAULT 컬럼에 기본값 채우기
    const [colRows] = await pool.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'g5_shop_category'`
    );
    const explicitValues: Record<string, any> = {
      ca_id,
      ca_name,
      ca_use: ca_use ?? "1",
      ca_order: ca_order || 0,
    };
    const insertCols: string[] = [];
    const insertVals: any[] = [];
    for (const col of colRows) {
      const name: string = col.COLUMN_NAME;
      if (name in explicitValues) {
        insertCols.push(name);
        insertVals.push(explicitValues[name]);
        continue;
      }
      if (col.IS_NULLABLE === "YES" || col.COLUMN_DEFAULT !== null) continue;
      // NOT NULL, no default — supply safe empty value by type
      const dt: string = (col.DATA_TYPE || "").toLowerCase();
      if (["int", "tinyint", "smallint", "mediumint", "bigint"].includes(dt)) {
        insertCols.push(name); insertVals.push(0);
      } else if (["decimal", "float", "double"].includes(dt)) {
        insertCols.push(name); insertVals.push(0);
      } else if (dt === "date") {
        insertCols.push(name); insertVals.push("0000-00-00");
      } else if (["datetime", "timestamp"].includes(dt)) {
        insertCols.push(name); insertVals.push("0000-00-00 00:00:00");
      } else {
        insertCols.push(name); insertVals.push("");
      }
    }
    const placeholders = insertCols.map(() => "?").join(", ");
    await pool.query(
      `INSERT INTO g5_shop_category (\`${insertCols.join("`, `")}\`) VALUES (${placeholders})`,
      insertVals
    );
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminCreateCategory error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/admin/categories/reorder", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { items } = req.body as { items: { ca_id: string; ca_order: number }[] };
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "items 配列が必要です" });
      return;
    }
    for (const item of items) {
      await pool.query(`UPDATE g5_shop_category SET ca_order=? WHERE ca_id=?`, [item.ca_order, item.ca_id]);
    }
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminReorderCategory error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.put("/admin/categories/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const caId = req.params.id;
    const { ca_name, ca_use, ca_order, ca_img } = req.body;
    await pool.query(
      `UPDATE g5_shop_category SET ca_name=?, ca_use=?, ca_order=? WHERE ca_id=?`,
      [ca_name, ca_use ?? "1", ca_order || 0, caId]
    );
    // 이미지 URL 저장/삭제
    if (ca_img === "" || ca_img === null || ca_img === undefined) {
      await pool.query(`DELETE FROM seoulmono_category_images WHERE ca_id = ?`, [caId]);
    } else if (ca_img) {
      await pool.query(
        `INSERT INTO seoulmono_category_images (ca_id, image_url) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE image_url = VALUES(image_url)`,
        [caId, ca_img]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminUpdateCategory error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// ─── 이미지 전체 사전 다운로드 (Cafe24 의존 제거) ─────────────────────────────
router.post("/admin/cache-all-images", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // DB에서 모든 상품 이미지 가져오기
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT it_img1, it_img2, it_img3, it_img4, it_img5 FROM g5_shop_item WHERE it_use='1'`
    );
    const cafe24Base = "https://thegaongill17.mycafe24.com/data/item";
    const tasks: { localFile: string; remoteUrl: string }[] = [];

    for (const r of rows as any[]) {
      for (let i = 1; i <= 5; i++) {
        const raw: string = r[`it_img${i}`];
        if (!raw) continue;
        // raw 형태: "folder/filename.jpg" 또는 이미 /api/... 경로
        const match = raw.match(/^([^/]+)\/(.+)$/);
        if (!match) continue;
        const [, folder, filename] = match;
        const localFile = path.join(itemUploadDir, folder, filename);
        if (fs.existsSync(localFile)) continue; // 이미 캐시됨
        tasks.push({ localFile, remoteUrl: `${cafe24Base}/${folder}/${filename}` });
      }
    }

    // 즉시 응답 후 백그라운드에서 다운로드
    res.json({ message: `合計 ${tasks.length} 件の画像のダウンロードを開始しました`, total: tasks.length });

    // 동시 5개씩 처리
    const concurrency = 5;
    let done = 0;
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);
      await Promise.allSettled(batch.map(async ({ localFile, remoteUrl }) => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          const r = await fetch(remoteUrl, {
            signal: controller.signal,
            headers: { "Referer": "https://thegaongill17.mycafe24.com/", "User-Agent": "Mozilla/5.0" },
          });
          clearTimeout(timer);
          if (!r.ok) return;
          const buf = Buffer.from(await r.arrayBuffer());
          const dir = path.dirname(localFile);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(localFile, buf);
          done++;
        } catch { /* 개별 실패 무시 */ }
      }));
    }
    console.log(`[image-cache] 완료: ${done}/${tasks.length}`);
  } catch (err: any) {
    req.log?.error({ err }, "CacheAllImages error");
    if (!res.headersSent) res.status(500).json({ error: "サーバーエラー" });
  }
});

router.delete("/admin/categories/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const caId = req.params.id;
    const [products] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM g5_shop_item WHERE ca_id LIKE ?`, [`${caId}%`]
    );
    if (Number(products[0].cnt) > 0) {
      res.status(400).json({ error: `このカテゴリには ${products[0].cnt} 件の商品があるため削除できません` });
      return;
    }
    await pool.query(`DELETE FROM g5_shop_category WHERE ca_id = ?`, [caId]);
    res.json({ success: true });
  } catch (err: any) {
    req.log?.error({ err }, "AdminDeleteCategory error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

export default router;
