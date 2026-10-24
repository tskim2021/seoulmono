import type { Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { visitorLogs } from "../../drizzle/schema";
import { sql, gte, lte, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const SESSION_COOKIE = "visitor_sid";

function parseCookieHeader(req: Request): Record<string, string> {
  const result: Record<string, string> = {};
  const header = req.headers["cookie"];
  if (typeof header !== "string") return result;
  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key && rest.length > 0) {
      result[key.trim()] = rest.join("=").trim();
    }
  }
  return result;
}

export function visitorTracker() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only track GET requests to page paths (skip API, assets, static files)
    if (req.method !== "GET") return next();
    const path = req.path || req.url;
    if (path.startsWith("/trpc") || path.startsWith("/api") || path.startsWith("/_") || path.startsWith("/assets") || path.startsWith("/static") || path.startsWith("/robots") || path.startsWith("/sitemap") || path.startsWith("/favicon") || path.startsWith("/images")) {
      return next();
    }
    if (path.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|json|xml)$/)) {
      return next();
    }

    // Parse cookie manually (cookie-parser may not be installed)
    const cookies = parseCookieHeader(req);
    let sessionId = cookies[SESSION_COOKIE];
    const isNew = !sessionId;
    if (!sessionId) {
      sessionId = nanoid(16);
      // Set cookie synchronously so it travels with this response
      res.setHeader("Set-Cookie", [
        ...(res.getHeader("Set-Cookie") as string[] || []),
        `${SESSION_COOKIE}=${sessionId}; HttpOnly; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax; Path=/`,
      ]);
    }

    const userId = (req as any).user?.id ?? null;
    const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "")?.split(",")[0]?.trim();
    const userAgent = req.headers["user-agent"] as string || null;
    const referer = req.headers["referer"] as string || null;

    // Simple device detection
    let device = "desktop";
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      if (/mobile|android|iphone|ipad|ipod|windows phone/.test(ua)) {
        if (/ipad|tablet/.test(ua)) device = "tablet";
        else device = "mobile";
      }
    }

    // Async DB insert after response starts (don't block)
    (async () => {
      try {
        const db = await getDb();
        if (!db) return;
        await db.insert(visitorLogs).values({
          sessionId,
          userId: userId ?? null,
          ip: ip || null,
          path: path.substring(0, 255),
          userAgent: (userAgent || "").substring(0, 255) || null,
          referer: (referer || "").substring(0, 255) || null,
          device,
          isNew: isNew ? "yes" : "no",
        });
      } catch (e) {
        // Silently fail — don't crash requests for tracking
      }
    })();

    next();
  };
}

// ─── Query helpers for admin stats ───

export async function getVisitorStats(days: number) {
  const db = await getDb();
  if (!db) return { daily: [], pages: [], devices: [], summary: { totalVisits: 0, uniqueVisitors: 0, newVisitors: 0, returningVisitors: 0 } };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const rows = await db.select({
    date: sql<string>`DATE(createdAt)`,
    totalVisits: sql<number>`COUNT(*)`,
    uniqueVisitors: sql<number>`COUNT(DISTINCT sessionId)`,
    newVisitors: sql<number>`SUM(CASE WHEN isNew = 'yes' THEN 1 ELSE 0 END)`,
  }).from(visitorLogs)
    .where(gte(visitorLogs.createdAt, cutoff))
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);

  const pageRows = await db.select({
    path: visitorLogs.path,
    visits: sql<number>`COUNT(*)`,
    uniqueVisitors: sql<number>`COUNT(DISTINCT sessionId)`,
  }).from(visitorLogs)
    .where(gte(visitorLogs.createdAt, cutoff))
    .groupBy(visitorLogs.path)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(20);

  const deviceRows = await db.select({
    device: visitorLogs.device,
    count: sql<number>`COUNT(*)`,
  }).from(visitorLogs)
    .where(gte(visitorLogs.createdAt, cutoff))
    .groupBy(visitorLogs.device)
    .orderBy(sql`COUNT(*) DESC`);

  const totalVisits = rows.reduce((sum, r) => sum + Number(r.totalVisits), 0);
  const newVisitors = rows.reduce((sum, r) => sum + Number(r.newVisitors), 0);

  // Compute period-level unique visitors with a separate query to avoid double-counting across days
  const uniqueRes = await db.select({
    uniqueVisitors: sql<number>`COUNT(DISTINCT sessionId)`,
  }).from(visitorLogs)
    .where(gte(visitorLogs.createdAt, cutoff));
  const uniqueVisitors = Number(uniqueRes[0]?.uniqueVisitors ?? 0);

  return {
    daily: rows.map(r => ({
      date: r.date,
      totalVisits: Number(r.totalVisits),
      uniqueVisitors: Number(r.uniqueVisitors),
      newVisitors: Number(r.newVisitors),
      returningVisitors: Number(r.uniqueVisitors) - Number(r.newVisitors),
    })),
    pages: pageRows.map(r => ({
      path: r.path,
      visits: Number(r.visits),
      uniqueVisitors: Number(r.uniqueVisitors),
    })),
    devices: deviceRows.map(r => ({
      device: r.device || "desktop",
      count: Number(r.count),
    })),
    summary: {
      totalVisits,
      uniqueVisitors,
      newVisitors,
      returningVisitors: uniqueVisitors - newVisitors,
    },
  };
}

export async function getVisitorLogList({ start, end, page = 1, limit = 50 }: { start: string; end: string; page?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };
  const offset = (page - 1) * limit;

  const whereClause = and(
    gte(visitorLogs.createdAt, new Date(start)),
    lte(visitorLogs.createdAt, new Date(end + "T23:59:59"))
  );

  const logs = await db.select().from(visitorLogs)
    .where(whereClause)
    .orderBy(sql`id DESC`)
    .limit(limit).offset(offset);

  const totalRes = await db.select({ count: sql<number>`COUNT(*)` }).from(visitorLogs).where(whereClause);
  const total = Number(totalRes[0]?.count ?? 0);

  return { logs, total };
}
