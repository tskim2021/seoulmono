/**
 * migrate-images.mjs
 * 실행: node migrate-images.mjs
 * 역할: DB의 외부 이미지(Cafe24)를 모두 로컬로 다운로드
 */
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { createPool } from "mysql2/promise";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env 로드
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const CAFE24_ITEM_BASE   = "https://thegaongill17.mycafe24.com/data/item";
const CAFE24_EDITOR_BASE = "https://thegaongill17.mycafe24.com/data/editor";

const itemDir      = path.join(__dirname, "uploads/item");
const editorExtDir = path.join(__dirname, "uploads/editor-ext");

fs.mkdirSync(itemDir, { recursive: true });
fs.mkdirSync(editorExtDir, { recursive: true });

// ─── 다운로드 헬퍼 ────────────────────────────────────────────────────────────
function download(url, destFile) {
  return new Promise((resolve) => {
    if (fs.existsSync(destFile)) { resolve("skip"); return; }
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 20000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, destFile).then(resolve);
      }
      if (res.statusCode !== 200) { resolve(`err:${res.statusCode}`); return; }
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      const out = fs.createWriteStream(destFile);
      res.pipe(out);
      out.on("finish", () => resolve("ok"));
      out.on("error", () => resolve("write-err"));
    });
    req.on("error", () => resolve("net-err"));
    req.on("timeout", () => { req.destroy(); resolve("timeout"); });
  });
}

// ─── HTML에서 editor 이미지 URL 추출 ─────────────────────────────────────────
function extractEditorImages(html) {
  if (!html) return [];
  const urls = [];
  const re = /https?:\/\/thegaongill17\.mycafe24\.com\/data\/editor\/([^\s"'<>]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) urls.push(m[1]);
  return [...new Set(urls)];
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  const pool = createPool({
    host:     process.env.MYSQL_HOST || "115.68.208.65",
    user:     process.env.MYSQL_USER || "myuser",
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB || "seoulmono",
    connectionLimit: 5,
  });

  console.log("DB 연결 완료. 이미지 목록 조회 중...");

  // 상품 이미지 (it_img1~5)
  const [rows] = await pool.query(`
    SELECT it_img1, it_img2, it_img3, it_img4, it_img5, it_explan
    FROM g5_shop_item
    WHERE it_img1 != '' OR it_img2 != '' OR it_img3 != ''
  `);

  const itemPaths  = new Set();
  const editorUrls = new Set();

  for (const r of rows) {
    for (const col of ["it_img1","it_img2","it_img3","it_img4","it_img5"]) {
      const v = r[col];
      if (v && !v.startsWith("/api/")) itemPaths.add(v);
    }
    for (const u of extractEditorImages(r.it_explan || "")) {
      editorUrls.add(u);
    }
  }

  console.log(`상품 이미지: ${itemPaths.size}개, 에디터 이미지: ${editorUrls.size}개`);

  let ok = 0, skip = 0, fail = 0;

  // ── 상품 이미지 다운로드 ──
  const itemList = [...itemPaths];
  for (let i = 0; i < itemList.length; i++) {
    const imgPath = itemList[i];
    const url = `${CAFE24_ITEM_BASE}/${imgPath}`;
    const dest = path.join(itemDir, imgPath);
    const result = await download(url, dest);
    if (result === "ok")   { ok++;   process.stdout.write(`\r[상품] ${i+1}/${itemList.length} ✓ ${imgPath.slice(0,40)}`); }
    else if (result === "skip") { skip++; }
    else                   { fail++; console.log(`\n  FAIL (${result}): ${url}`); }
    // 서버 부하 방지
    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`\n상품 이미지 완료: ok=${ok} skip=${skip} fail=${fail}`);
  ok = 0; skip = 0; fail = 0;

  // ── 에디터 이미지 다운로드 ──
  const editorList = [...editorUrls];
  for (let i = 0; i < editorList.length; i++) {
    const rel = editorList[i];              // "folder/filename"
    const url  = `${CAFE24_EDITOR_BASE}/${rel}`;
    const dest = path.join(editorExtDir, rel);
    const result = await download(url, dest);
    if (result === "ok")        ok++;
    else if (result === "skip") skip++;
    else { fail++; console.log(`\n  FAIL (${result}): ${url}`); }
    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`에디터 이미지 완료: ok=${ok} skip=${skip} fail=${fail}`);

  await pool.end();
  console.log("완료!");
}

main().catch(e => { console.error(e.message); process.exit(1); });
