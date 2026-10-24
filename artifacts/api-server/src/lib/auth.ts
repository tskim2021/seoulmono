import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "order-system-secret-key-2024";

interface TokenPayload {
  mb_id: string;
  mb_level: number;
  iat: number;
  exp: number;
}

export function createToken(payload: { mb_id: string; mb_level: number }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: now, exp: now + 86400 * 7 })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "인증이 필요합니다" });
    return;
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "유효하지 않은 토큰입니다" });
    return;
  }
  (req as any).user = payload;
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  if (!user || user.mb_level < 10) {
    res.status(403).json({ error: "관리자 권한이 필요합니다" });
    return;
  }
  next();
}

export function gnuboardPasswordHash(password: string): string {
  const iterations = 12000;
  const salt = crypto.randomBytes(24).toString("base64");
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 24, "sha256").toString("base64");
  return `sha256:${iterations}:${salt}:${derived}`;
}

export function verifyGnuboardPassword(password: string, hash: string): boolean {
  if (hash.startsWith("sha256:")) {
    const parts = hash.split(":");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const storedDerived = parts[3];
    const derived = crypto.pbkdf2Sync(password, salt, iterations, 24, "sha256").toString("base64");
    return derived === storedDerived;
  }
  const md5Hash = crypto.createHash("md5").update(password).digest("hex");
  return md5Hash === hash;
}
