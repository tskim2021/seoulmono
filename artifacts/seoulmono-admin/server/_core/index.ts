import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cron from "node-cron";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sendExpirationNotifications } from "../pointExpirationNotification";
import { runPaymentAutoCancelJob } from "../jobs/paymentAutoCancelJob";
import { startShippingSyncScheduler } from "../jobs/shippingSyncScheduler";
import { getShippingSyncSchedulerConfig } from "../db";
import { autoSeedIfEmpty } from "../autoSeed";
import { runGnuboardSync } from "../jobs/gnuboardSync";


async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.set("trust proxy", true);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Visitor tracking middleware
  const { visitorTracker } = await import("../middleware/visitorTracker");
  app.use(visitorTracker());

  app.use((req, _res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/trpc")) {
      console.log(`[HTTP] ${req.method} ${req.path}`);
    }
    next();
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  const imageCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
  const IMAGE_CACHE_MAX = 200;
  const IMAGE_CACHE_TTL = 3600000;

  app.get("/_proxy/image", async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).send("Missing url");

    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch { return res.status(400).send("Invalid URL"); }
    if (parsed.protocol !== "https:" || parsed.hostname !== "talmoschool.com" || !parsed.pathname.startsWith("/data/item/")) {
      return res.status(400).send("Invalid URL");
    }
    const url = parsed.toString();

    const cached = imageCache.get(url);
    if (cached && Date.now() - cached.timestamp < IMAGE_CACHE_TTL) {
      res.set("Content-Type", cached.contentType);
      res.set("Cache-Control", "public, max-age=2592000");
      res.set("X-Cache", "HIT");
      return res.send(cached.buffer);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, {
        headers: {
          "Referer": "https://talmoschool.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return res.status(response.status).send("Image fetch failed");

      const contentLength = parseInt(response.headers.get("content-length") || "0");
      if (contentLength > 5 * 1024 * 1024) return res.status(413).send("Image too large");

      const buffer = Buffer.from(await response.arrayBuffer());

      const jpegMagic = buffer[0] === 0xFF && buffer[1] === 0xD8;
      const pngMagic = buffer[0] === 0x89 && buffer[1] === 0x50;
      const gifMagic = buffer[0] === 0x47 && buffer[1] === 0x49;
      const webpMagic = buffer.length > 11 && buffer[8] === 0x57 && buffer[9] === 0x45;
      if (!jpegMagic && !pngMagic && !gifMagic && !webpMagic) {
        return res.status(404).send("Image not found on origin");
      }

      const contentType = jpegMagic ? "image/jpeg" : pngMagic ? "image/png" : gifMagic ? "image/gif" : "image/webp";

      if (imageCache.size >= IMAGE_CACHE_MAX) {
        const oldest = [...imageCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        if (oldest) imageCache.delete(oldest[0]);
      }
      imageCache.set(url, { buffer, contentType, timestamp: Date.now() });

      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=2592000");
      res.set("X-Cache", "MISS");
      res.send(buffer);
    } catch (e: any) {
      if (e.name === "AbortError") return res.status(504).send("Upstream timeout");
      res.status(500).send("Proxy error");
    }
  });

  app.get("/robots.txt", (_req, res) => {
    const host = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "https://talmoschool.com";
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /mypage\nDisallow: /cart\nDisallow: /checkout\nDisallow: /login\nDisallow: /register\n\nSitemap: ${host}/sitemap.xml`
    );
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const { getAllProductSlugs, getAllBoardSlugs } = await import("../db");
      const host = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "https://talmoschool.com";
      const productSlugs = await getAllProductSlugs();
      const boardSlugs = await getAllBoardSlugs();
      const now = new Date().toISOString().split("T")[0];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      xml += `  <url><loc>${host}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${now}</lastmod></url>\n`;
      xml += `  <url><loc>${host}/products</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
      for (const slug of productSlugs) {
        xml += `  <url><loc>${host}/products/${slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
      }
      for (const slug of boardSlugs) {
        xml += `  <url><loc>${host}/community/${slug}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>\n`;
      }
      xml += `</urlset>`;
      res.type("application/xml").send(xml);
    } catch (e) {
      res.status(500).send("Error generating sitemap");
    }
  });

  // tRPC API
  // seoulmono-admin: 접두사 유무 양쪽 모두 받는다.
  app.use(
    ["/trpc", "/admin/trpc"],
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // === seoulmono-admin ===
    // 탈모2의 자동 시드/동기화/AI자동글/스케줄러는 seoulmono 운영 DB에
    // 쓰기를 하므로 기본 차단한다. ADMIN2_ENABLE_JOBS=1 일 때만 동작.
    if (process.env.ADMIN2_ENABLE_JOBS === "1") {
    autoSeedIfEmpty()
      .then(() => runGnuboardSync())
      .catch(err => console.error("[AutoSeed/GnuSync] Error:", err));

    // 탈모1 PHP API 폴링 (15분마다 주문/회원 증분 동기화)
    (async () => {
      try {
        const { startGnuApiPolling, getGnuApiConfig, syncOrdersFromApi, syncMembersFromApi } = await import("../jobs/gnuApiSync");
        const cfg = await getGnuApiConfig();
        if (cfg.enabled && cfg.baseUrl && cfg.token) {
          await startGnuApiPolling();
          cron.schedule("*/15 * * * *", async () => {
            try {
              const c = await getGnuApiConfig();
              if (!c.enabled || !c.baseUrl || !c.token) return;
              await syncOrdersFromApi(c);
              await syncMembersFromApi(c);
            } catch (e: any) { console.error("[GnuApiSync:Cron] 폴링 실패:", e.message); }
          });
          console.log("[GnuApiSync] 자동 폴링 스케줄러 등록 완료 (15분 간격)");
        } else {
          console.log("[GnuApiSync] 비활성화 상태 — 폴링 스케줄러 미등록");
        }
      } catch (e: any) { console.error("[GnuApiSync] 폴링 초기화 실패:", e.message); }
    })();
    
    // 포인트 만료 예정 알림 스케줄러 등록 (매일 오전 9시)
    cron.schedule('0 9 * * *', async () => {
      try {
        await sendExpirationNotifications();
      } catch (error) {
        console.error('[Scheduler] Point expiration notification job failed:', error);
      }
    }, {
      timezone: 'Asia/Seoul'
    });
    
    console.log('[Scheduler] Point expiration notification job scheduled (daily at 9:00 AM KST)');

    // 배송 동기화 동적 스케줄러 등록 (DB 설정 기반)
    (async () => {
      try {
        const schedulerConfig = await getShippingSyncSchedulerConfig();
        startShippingSyncScheduler(schedulerConfig);
      } catch (error) {
        console.error('[Scheduler] Failed to initialize shipping sync scheduler:', error);
      }
    })();

    // 뉴스 자동 생성 스케줄러 등록
    (async () => {
      try {
        const { startNewsScheduler } = await import("../jobs/newsScheduler");
        startNewsScheduler();
      } catch (error) {
        console.error('[Scheduler] Failed to initialize news scheduler:', error);
      }
    })();

    // 정보나눔 AI 자동글 스케줄러 등록
    (async () => {
      try {
        const { startInfoBoardScheduler } = await import("../jobs/infoBoardScheduler");
        await startInfoBoardScheduler();
      } catch (error) {
        console.error('[Scheduler] Failed to initialize info board scheduler:', error);
      }
    })();

    // 토론광장 AI 자동 토론 스케줄러 등록
    (async () => {
      try {
        const { startDiscussionScheduler } = await import("../jobs/discussionScheduler");
        await startDiscussionScheduler();
      } catch (error) {
        console.error('[Scheduler] Failed to initialize discussion scheduler:', error);
      }
    })();

    // 무통장 입금 자동 취소 스케줄러 등록 (매시간 실행)
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('[Scheduler] Running payment auto-cancel job...');
        const result = await runPaymentAutoCancelJob();
        console.log('[Scheduler] Payment auto-cancel job completed:', result);
      } catch (error) {
        console.error('[Scheduler] Payment auto-cancel job failed:', error);
      }
    });
    } else {
      console.log("[admin2] 백그라운드 작업 전면 비활성화 (ADMIN2_ENABLE_JOBS!=1) — DB 쓰기 없음");
    }
  });
}

startServer().catch(console.error);
