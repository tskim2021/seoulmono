import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { createToken, verifyGnuboardPassword, gnuboardPasswordHash, authMiddleware } from "../lib/auth";
import { LoginBody } from "@workspace/api-zod";
import type { RowDataPacket } from "mysql2";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import { logger } from "../lib/logger";

const uploadDir = path.resolve(process.cwd(), "uploads/business-license");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const name = randomBytes(16).toString("hex") + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("許可されていないファイル形式です。(PDF、JPG、PNGのみ)"));
    }
  },
});

const router: IRouter = Router();

// ── 네이버 로그인 ─────────────────────────────────────────────

const NAVER_REDIRECT_URI = "https://seoulmono.com/shop/naver-callback";

router.get("/auth/naver-status", (_req, res) => {
  res.json({ enabled: !!process.env.NAVER_CLIENT_ID });
});

router.get("/auth/naver-redirect", (req, res) => {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  if (!clientId) {
    res.status(503).send("NAVERログインが設定されていません。");
    return;
  }
  const state = randomBytes(16).toString("hex");
  const naverUrl =
    `https://nid.naver.com/oauth2.0/authorize?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(NAVER_REDIRECT_URI)}` +
    `&state=${state}`;
  res.redirect(naverUrl);
});

router.post("/auth/naver", async (req, res) => {
  try {
    const { code, state } = req.body;
    if (!code) {
      res.status(400).json({ error: "認証コードがありません" });
      return;
    }
    const clientId = process.env.NAVER_CLIENT_ID?.trim();
    const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      res.status(503).json({ error: "NAVERログインが設定されていません" });
      return;
    }

    // 1) 네이버 토큰 요청
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: NAVER_REDIRECT_URI,
      code,
      state: state || "",
    });
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) {
      logger.error({ tokenData }, "[naver] token exchange failed");
      res.status(400).json({ error: "NAVERトークンの発行に失敗しました: " + (tokenData.error_description || tokenData.error || "") });
      return;
    }

    // 2) 네이버 사용자 정보 요청
    const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const naverData = await userRes.json() as any;
    const naverUser = naverData.response;
    if (!naverUser?.id) {
      res.status(400).json({ error: "NAVERユーザー情報の取得に失敗しました" });
      return;
    }

    const naverId = String(naverUser.id);
    const mbId = `naver_${naverId}`.slice(0, 20);
    const nickname = naverUser.nickname || naverUser.name || "NAVER会員";
    const email = naverUser.email || "";

    // 3) 기존 회원 조회
    const [existingRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM g5_member WHERE mb_id = ? AND (mb_leave_date = '' OR mb_leave_date IS NULL)",
      [mbId]
    );

    let member: RowDataPacket;
    if (existingRows.length > 0) {
      member = existingRows[0];
    } else {
      // 4) 신규 회원 자동 가입 (소비자 쇼핑몰 mb_level=2)
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const today = now.slice(0, 10);
      const dummyPassword = randomBytes(32).toString("hex");
      await pool.query(
        `INSERT INTO g5_member (
          mb_id, mb_password, mb_name, mb_nick, mb_nick_date, mb_email, mb_hp,
          mb_level, mb_datetime, mb_ip,
          mb_today_login, mb_login_ip,
          mb_email_certify, mb_email_certify2,
          mb_certify, mb_adult, mb_dupinfo,
          mb_open, mb_open_date,
          mb_zip1, mb_zip2, mb_addr1, mb_addr2, mb_addr3, mb_addr_jibeon,
          mb_point, mb_mailling,
          mb_leave_date, mb_intercept_date,
          mb_1, mb_2, mb_3, mb_4, mb_5, mb_6, mb_7, mb_8, mb_9, mb_10,
          mb_signature, mb_memo, mb_lost_certify, mb_profile,
          store_mb_id
        ) VALUES (
          ?, ?, ?, ?, ?, ?, '',
          2, ?, '',
          ?, '',
          '0000-00-00 00:00:00', '',
          '', 0, '',
          0, ?,
          '', '', '', '', '', '',
          0, 0,
          '', '',
          '', '', '', '', '', '', '', '', '', '',
          '', '', '', '',
          ''
        )`,
        [mbId, dummyPassword, nickname, nickname, today, email, now, now, today]
      );
      const [newRows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM g5_member WHERE mb_id = ?", [mbId]
      );
      member = newRows[0];
    }

    const token = createToken({ mb_id: member.mb_id, mb_level: member.mb_level });
    res.json({
      token,
      user: {
        mb_id: member.mb_id,
        mb_name: member.mb_name || "",
        mb_email: member.mb_email || "",
        mb_hp: member.mb_hp || "",
        mb_level: member.mb_level,
        company_name: member.mb_6 || "",
        business_number: member.mb_7 || "",
        is_admin: member.mb_level >= 10,
        is_approved: member.mb_level >= 2,
      },
    });
  } catch (err: any) {
    req.log?.error({ err }, "Naver login error");
    res.status(500).json({ error: "NAVERログイン処理中にエラーが発生しました" });
  }
});

// ── 카카오 로그인 ─────────────────────────────────────────────

// 카카오 OAuth 리다이렉트 URI — 프로덕션 도메인 고정
const KAKAO_REDIRECT_URI_FIXED = "https://seoulmono.com/shop/kakao-callback";

function getKakaoRedirectUri(_req: any): string {
  // 환경변수에 /shop/kakao-callback이 명시된 경우만 사용, 아니면 고정값
  const envUri = process.env.KAKAO_REDIRECT_URI || "";
  return envUri.includes("/shop/kakao-callback") ? envUri : KAKAO_REDIRECT_URI_FIXED;
}

router.get("/auth/kakao-redirect", (req, res) => {
  const restApiKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (!restApiKey) {
    res.status(503).send("カカオログインが設定されていません。管理者にお問い合わせください。");
    return;
  }
  const redirectUri = getKakaoRedirectUri(req);
  const kakaoUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${restApiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  res.redirect(kakaoUrl);
});

// 카카오 설정 여부 공개 (버튼 표시 여부 결정용)
router.get("/auth/kakao-status", (_req, res) => {
  res.json({ enabled: !!process.env.KAKAO_REST_API_KEY });
});


router.post("/auth/kakao", async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    if (!code || !redirect_uri) {
      res.status(400).json({ error: "認証コードがありません" });
      return;
    }
    const restApiKey = process.env.KAKAO_REST_API_KEY?.trim();
    if (!restApiKey) {
      res.status(503).json({ error: "カカオログインが設定されていません" });
      return;
    }

    // 1) 카카오 토큰 요청 — redirect_uri 서버 고정값 사용
    const kakaoRedirectUri = KAKAO_REDIRECT_URI_FIXED;
    const tokenParams: Record<string, string> = {
      grant_type: "authorization_code",
      client_id: restApiKey,
      redirect_uri: kakaoRedirectUri,
      code,
    };
    // Client Secret — 콘솔에서 활성화된 경우 전송 (값이 있으면 항상 전송)
    const clientSecret = process.env.KAKAO_CLIENT_SECRET?.trim();
    if (clientSecret) tokenParams.client_secret = clientSecret;

    const tokenBody = new URLSearchParams(tokenParams).toString();
    logger.info({ tokenParams: { ...tokenParams, client_id: tokenParams.client_id?.substring(0, 8) + "..." } }, "[kakao] token exchange params");
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) {
      logger.error({ tokenData }, "[kakao] token exchange failed");
      res.status(400).json({ error: "カカオトークンの発行に失敗しました: " + (tokenData.error_description || tokenData.error || "") });
      return;
    }

    // 2) 카카오 사용자 정보 요청
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const kakaoUser = await userRes.json() as any;
    if (!kakaoUser.id) {
      res.status(400).json({ error: "カカオユーザー情報の取得に失敗しました" });
      return;
    }

    const kakaoId = String(kakaoUser.id);
    const mbId = `kakao_${kakaoId}`.slice(0, 20);
    const nickname = kakaoUser.kakao_account?.profile?.nickname || kakaoUser.properties?.nickname || "カカオ会員";
    const email = kakaoUser.kakao_account?.email || "";

    // 3) 기존 회원 조회
    const [existingRows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM g5_member WHERE mb_id = ? AND (mb_leave_date = '' OR mb_leave_date IS NULL)",
      [mbId]
    );

    let member: RowDataPacket;

    if (existingRows.length > 0) {
      member = existingRows[0];
    } else {
      // 4) 신규 회원 자동 가입 (소비자 쇼핑몰 mb_level=2)
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const today = now.slice(0, 10);
      const dummyPassword = randomBytes(32).toString("hex");
      await pool.query(
        `INSERT INTO g5_member (
          mb_id, mb_password, mb_name, mb_nick, mb_nick_date, mb_email, mb_hp,
          mb_level, mb_datetime, mb_ip,
          mb_today_login, mb_login_ip,
          mb_email_certify, mb_email_certify2,
          mb_certify, mb_adult, mb_dupinfo,
          mb_open, mb_open_date,
          mb_zip1, mb_zip2, mb_addr1, mb_addr2, mb_addr3, mb_addr_jibeon,
          mb_point, mb_mailling,
          mb_leave_date, mb_intercept_date,
          mb_1, mb_2, mb_3, mb_4, mb_5, mb_6, mb_7, mb_8, mb_9, mb_10,
          mb_signature, mb_memo, mb_lost_certify, mb_profile,
          store_mb_id
        ) VALUES (
          ?, ?, ?, ?, ?, ?, '',
          2, ?, '',
          ?, '',
          '0000-00-00 00:00:00', '',
          '', 0, '',
          0, ?,
          '', '', '', '', '', '',
          0, 0,
          '', '',
          '', '', '', '', '', '', '', '', '', '',
          '', '', '', '',
          ''
        )`,
        [mbId, dummyPassword, nickname, nickname, today, email,
          now,
          now,
          today]
      );

      const [newRows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM g5_member WHERE mb_id = ?", [mbId]
      );
      member = newRows[0];
    }

    const token = createToken({ mb_id: member.mb_id, mb_level: member.mb_level });
    res.json({
      token,
      user: {
        mb_id: member.mb_id,
        mb_name: member.mb_name || "",
        mb_email: member.mb_email || "",
        mb_hp: member.mb_hp || "",
        mb_level: member.mb_level,
        company_name: member.mb_6 || "",
        business_number: member.mb_7 || "",
        is_admin: member.mb_level >= 10,
        is_approved: member.mb_level >= 2,
      },
    });
  } catch (err: any) {
    req.log?.error({ err }, "Kakao login error");
    res.status(500).json({ error: "カカオログイン処理中にエラーが発生しました" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "IDとパスワードを入力してください" });
      return;
    }
    const { mb_id, mb_password } = parsed.data;

    // 휴대폰번호(숫자만)로도 로그인 가능 — DB에 010-1234-5678 형식으로 저장된 경우도 처리
    const cleanInput = mb_id.replace(/[^0-9]/g, "");
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM g5_member WHERE (mb_id = ? OR (mb_hp != '' AND REPLACE(REPLACE(mb_hp, '-', ''), ' ', '') = ?)) AND (mb_leave_date = '' OR mb_leave_date IS NULL) LIMIT 1`,
      [mb_id, cleanInput.length >= 10 ? cleanInput : mb_id]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: "携帯電話番号またはパスワードが正しくありません" });
      return;
    }

    const member = rows[0];

    if (!verifyGnuboardPassword(mb_password, member.mb_password)) {
      // 임시 비밀번호 확인
      const [tmpRows] = await pool.query<RowDataPacket[]>(
        "SELECT temp_hash, expires_at FROM seoulmono_temp_pw WHERE mb_id = ?",
        [mb_id]
      );
      if (tmpRows.length > 0) {
        const { temp_hash, expires_at } = tmpRows[0];
        const now = new Date();
        const exp = new Date(expires_at);
        if (now > exp) {
          await pool.query("DELETE FROM seoulmono_temp_pw WHERE mb_id = ?", [mb_id]);
          res.status(401).json({ error: "仮パスワードの有効期限が切れました。パスワード再発行をもう一度お試しください。" });
          return;
        }
        if (!verifyGnuboardPassword(mb_password, temp_hash)) {
          res.status(401).json({ error: "IDまたはパスワードが正しくありません" });
          return;
        }
        // 임시 비밀번호로 로그인 성공 → mb_password도 업데이트하여 마이페이지에서 비밀번호 변경 가능하게 함
        await pool.query("UPDATE g5_member SET mb_password = ? WHERE mb_id = ?", [temp_hash, mb_id]);
        await pool.query("DELETE FROM seoulmono_temp_pw WHERE mb_id = ?", [mb_id]);
      } else {
        res.status(401).json({ error: "IDまたはパスワードが正しくありません" });
        return;
      }
    }

    const isAdmin = member.mb_level >= 10;
    const isApproved = member.mb_level >= 2;

    if (!isAdmin && member.mb_level === 0) {
      res.status(403).json({ error: "登録が却下されたアカウントです。管理者にお問い合わせください。" });
      return;
    }

    const token = createToken({ mb_id: member.mb_id, mb_level: member.mb_level });

    res.json({
      token,
      user: {
        mb_id: member.mb_id,
        mb_name: member.mb_name || "",
        mb_email: member.mb_email || "",
        mb_hp: member.mb_hp || "",
        mb_level: member.mb_level,
        company_name: member.mb_6 || "",
        business_number: member.mb_7 || "",
        is_admin: isAdmin,
        is_approved: isApproved,
      },
    });
  } catch (err: any) {
    req.log?.error({ err }, "Login error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/auth/register", upload.single("business_license"), async (req, res) => {
  try {
    const data = req.body;

    if (!data.mb_id || !data.mb_password || !data.mb_name || !data.mb_email || !data.company_name || !data.business_number || !data.representative) {
      res.status(400).json({ error: "必須項目をすべて入力してください" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "事業者登録証のファイルを添付してください" });
      return;
    }

    const [existingId] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id FROM g5_member WHERE mb_id = ?",
      [data.mb_id]
    );
    if (existingId.length > 0) {
      res.status(400).json({ error: "このIDはすでに使用されています" });
      return;
    }

    const [existingEmail] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id FROM g5_member WHERE mb_email = ? AND mb_email != ''",
      [data.mb_email || ""]
    );
    if (existingEmail.length > 0) {
      res.status(400).json({ error: "このメールアドレスはすでに使用されています" });
      return;
    }

    let mbNick = data.mb_name;
    const [existingNick] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id FROM g5_member WHERE mb_nick = ?",
      [mbNick]
    );
    if (existingNick.length > 0) {
      mbNick = data.mb_name + "_" + randomBytes(3).toString("hex");
    }

    const hashedPassword = gnuboardPasswordHash(data.mb_password);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const today = now.slice(0, 10);
    const licenseFilePath = req.file.filename;
    const clientIp = (req.headers["x-forwarded-for"] as string || req.ip || "").split(",")[0].trim();

    const [cfRows] = await pool.query<RowDataPacket[]>("SELECT cf_register_point FROM g5_config LIMIT 1");
    const signupPoint = Number(cfRows[0]?.cf_register_point || 0);

    await pool.query(
      `INSERT INTO g5_member (
        mb_id, mb_password, mb_name, mb_nick, mb_nick_date, mb_email, mb_hp,
        mb_level, mb_datetime, mb_ip,
        mb_today_login, mb_login_ip,
        mb_email_certify, mb_email_certify2,
        mb_certify, mb_adult, mb_dupinfo,
        mb_open, mb_open_date,
        mb_zip1, mb_zip2, mb_addr1, mb_addr2, mb_addr3, mb_addr_jibeon,
        mb_point, mb_mailling,
        mb_leave_date, mb_intercept_date,
        mb_1, mb_2, mb_3, mb_4, mb_5, mb_6, mb_7, mb_8, mb_9, mb_10,
        mb_signature, mb_memo, mb_lost_certify, mb_profile,
        store_mb_id
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        2, ?, ?,
        ?, ?,
        '0000-00-00 00:00:00', '',
        '', 0, '',
        0, ?,
        '', '', '', '', '', '',
        ?, 0,
        '', '',
        ?, ?, '', '', '', ?, ?, ?, ?, ?,
        '', '', '', '',
        ''
      )`,
      [
        data.mb_id,
        hashedPassword,
        data.mb_name,
        mbNick,
        today,
        data.mb_email || "",
        data.mb_hp || "",
        now,
        clientIp,
        now,
        clientIp,
        today,
        signupPoint,
        data.company_address || "",
        licenseFilePath,
        data.company_name || "",
        data.business_number || "",
        data.representative || "",
        data.business_type || "",
        data.business_category || "",
      ]
    );

    res.status(201).json({ message: "会員登録が完了しました。管理者の承認後にご利用いただけます。" });
  } catch (err: any) {
    req.log?.error({ err }, "Register error");
    let errorMessage = "登録申請中にエラーが発生しました。";
    if (err.code === "ER_DUP_ENTRY") {
      if (err.message?.includes("mb_nick")) {
        errorMessage = "ニックネームが重複しています。もう一度お試しください。";
      } else if (err.message?.includes("mb_email")) {
        errorMessage = "このメールアドレスはすでに使用されています。";
      } else {
        errorMessage = "すでに登録されている情報があります。";
      }
    }
    res.status(500).json({ error: errorMessage });
  }
});

router.get("/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM g5_member WHERE mb_id = ?",
      [user.mb_id]
    );
    if (rows.length === 0) {
      // DB에 유저가 없어도 토큰 정보로 응답 (세션 유지)
      res.json({
        mb_id: user.mb_id,
        mb_name: user.mb_name || "",
        mb_email: "",
        mb_hp: "",
        mb_level: user.mb_level || 2,
        mb_point: 0,
        company_name: "",
        business_number: "",
        is_admin: (user.mb_level || 2) >= 10,
        is_approved: (user.mb_level || 2) >= 2,
      });
      return;
    }
    const member = rows[0];
    res.json({
      mb_id: member.mb_id,
      mb_name: member.mb_name || "",
      mb_email: member.mb_email || "",
      mb_hp: member.mb_hp || "",
      mb_level: member.mb_level,
      mb_point: Number(member.mb_point) || 0,
      company_name: member.mb_6 || "",
      business_number: member.mb_7 || "",
      is_admin: member.mb_level >= 10,
      is_approved: member.mb_level >= 2,
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetMe error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/auth/profile", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT mb_id, mb_name, mb_email, mb_hp, mb_level, mb_datetime,
        mb_1 as company_address, mb_2 as business_license_file,
        mb_6 as company_name, mb_7 as business_number, mb_8 as representative,
        mb_9 as business_type, mb_10 as business_category
       FROM g5_member WHERE mb_id = ?`,
      [user.mb_id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "ユーザーが見つかりません" });
      return;
    }
    const m = rows[0];
    res.json({
      mb_id: m.mb_id,
      mb_name: m.mb_name || "",
      mb_email: m.mb_email || "",
      mb_hp: m.mb_hp || "",
      mb_level: m.mb_level,
      mb_datetime: m.mb_datetime || "",
      company_name: m.company_name || "",
      business_number: m.business_number || "",
      representative: m.representative || "",
      business_type: m.business_type || "",
      business_category: m.business_category || "",
      company_address: m.company_address || "",
      business_license_file: m.business_license_file || "",
      is_admin: m.mb_level >= 10,
      is_approved: m.mb_level >= 2,
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetProfile error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.put("/auth/profile", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { mb_name, mb_hp, mb_email, current_password, new_password } = req.body;

    if (!mb_name || !mb_hp) {
      res.status(400).json({ error: "お名前と携帯電話番号は必須です。" });
      return;
    }

    // 비밀번호 변경 요청 시 현재 비밀번호 검증
    if (new_password) {
      if (!current_password) {
        res.status(400).json({ error: "現在のパスワードを入力してください。" });
        return;
      }
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT mb_password FROM g5_member WHERE mb_id = ?",
        [user.mb_id]
      );
      if (rows.length === 0) { res.status(404).json({ error: "ユーザーが見つかりません。" }); return; }
      const valid = await verifyGnuboardPassword(current_password, rows[0].mb_password);
      if (!valid) { res.status(400).json({ error: "現在のパスワードが正しくありません。" }); return; }

      const hashed = gnuboardPasswordHash(new_password);
      await pool.query(
        "UPDATE g5_member SET mb_name=?, mb_hp=?, mb_email=?, mb_password=? WHERE mb_id=?",
        [mb_name, mb_hp, mb_email || user.mb_email, hashed, user.mb_id]
      );
    } else {
      await pool.query(
        "UPDATE g5_member SET mb_name=?, mb_hp=?, mb_email=? WHERE mb_id=?",
        [mb_name, mb_hp, mb_email || user.mb_email, user.mb_id]
      );
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "更新に失敗しました: " + err.message });
  }
});

router.get("/auth/business-license/:filename", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const filename = path.basename(req.params.filename);

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_2 FROM g5_member WHERE mb_id = ?",
      [user.mb_id]
    );
    if (rows.length === 0 || (rows[0].mb_2 !== filename && user.mb_level < 10)) {
      res.status(403).json({ error: "アクセス権限がありません" });
      return;
    }

    const filePath = path.join(uploadDir, filename);
    const fs = await import("fs");
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "ファイルが見つかりません" });
      return;
    }
    res.sendFile(filePath);
  } catch (err: any) {
    req.log?.error({ err }, "GetBusinessLicenseUser error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "ログアウトしました" });
});

// ── 아이디 찾기 ──────────────────────────────────────────────────────────────
router.post("/auth/find-id", async (req, res) => {
  try {
    const { name, email } = req.body as { name?: string; email?: string };
    if (!name?.trim() || !email?.trim()) {
      res.status(400).json({ error: "お名前とメールアドレスをすべて入力してください。" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id, mb_datetime FROM g5_member WHERE mb_name = ? AND mb_email = ? AND (mb_leave_date = '' OR mb_leave_date IS NULL) LIMIT 1",
      [name.trim(), email.trim()]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "一致する会員情報が見つかりません。" });
      return;
    }
    const { mb_id, mb_datetime } = rows[0];
    const joined = mb_datetime ? String(mb_datetime).slice(0, 10) : "";
    const maskedId = mb_id.length > 3
      ? mb_id.slice(0, 3) + "*".repeat(mb_id.length - 3)
      : mb_id;

    const { sendMail } = await import("../lib/mailer.js");
    await sendMail({
      to: email.trim(),
      subject: "[ソウルモノ] ID確認のご案内",
      html: `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Apple SD Gothic Neo',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- 헤더 -->
        <tr>
          <td style="background:linear-gradient(135deg,#1b5e3b 0%,#2d8a5a 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:1px;">良い価格、良い商品</p>
            <p style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;"><span style="color:#b2f0d0;">ソウルモノ</span></p>
          </td>
        </tr>
        <!-- 본문 -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 6px;font-size:13px;color:#1D8A5A;font-weight:700;letter-spacing:0.5px;">ACCOUNT</p>
            <h2 style="margin:0 0 20px;font-size:22px;font-weight:900;color:#111;">ID確認結果</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">いつもご利用ありがとうございます。<strong style="color:#111;">${name.trim()}</strong>様<br>ご依頼のID情報をご案内いたします。</p>

            <!-- 아이디 카드 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0faf5;border:2px solid #b2f0d0;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 8px;font-size:12px;color:#2d8a5a;font-weight:700;letter-spacing:0.5px;">会員ID</p>
                  <p style="margin:0;font-size:26px;font-weight:900;color:#1D8A5A;letter-spacing:-0.5px;">${mb_id}</p>
                  ${joined ? `<p style="margin:10px 0 0;font-size:12px;color:#888;">登録日 &nbsp;·&nbsp; ${joined}</p>` : ""}
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:13px;color:#888;line-height:1.7;">セキュリティのため、IDは他の方と共有しないでください。<br>パスワードをお忘れの場合は、パスワード再発行をご利用ください。</p>

            <!-- CTA 버튼 -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://seoulmono.com/shop/login" style="display:inline-block;background:linear-gradient(135deg,#1b5e3b,#2d8a5a);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:50px;letter-spacing:-0.2px;">ログインはこちら →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- 푸터 -->
        <tr>
          <td style="background:#f8f9fa;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;color:#bbb;">このメールはソウルモノのID確認のご依頼により送信されました。</p>
            <p style="margin:0;font-size:11px;color:#ccc;">© 2024 株式会社ワイエヌエイチエス · カスタマーセンター 010-2051-5692</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    res.json({ message: "メールでIDをお送りしました。", masked: maskedId });
  } catch (err: any) {
    logger.error({ err }, "find-id error");
    res.status(500).json({ error: "処理中にエラーが発生しました。" });
  }
});

// ── 비밀번호 찾기 ─────────────────────────────────────────────────────────────
router.post("/auth/find-password", async (req, res) => {
  try {
    const { mb_id, email } = req.body as { mb_id?: string; email?: string };
    if (!mb_id?.trim() || !email?.trim()) {
      res.status(400).json({ error: "IDとメールアドレスをすべて入力してください。" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id, mb_name FROM g5_member WHERE mb_id = ? AND mb_email = ? AND (mb_leave_date = '' OR mb_leave_date IS NULL) LIMIT 1",
      [mb_id.trim(), email.trim()]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "一致する会員情報が見つかりません。" });
      return;
    }
    const member = rows[0];
    const tempPassword = randomBytes(6).toString("hex");
    const hashed = await gnuboardPasswordHash(tempPassword);

    // 임시 비밀번호를 temp 테이블에 저장 (30분 유효) — 실제 비밀번호는 변경 안 함
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
      .toISOString().slice(0, 19).replace("T", " ");
    await pool.query(
      "INSERT INTO seoulmono_temp_pw (mb_id, temp_hash, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE temp_hash = VALUES(temp_hash), expires_at = VALUES(expires_at)",
      [member.mb_id, hashed, expiresAt]
    );

    const { sendMail } = await import("../lib/mailer.js");
    await sendMail({
      to: email.trim(),
      subject: "[ソウルモノ] 仮パスワードのご案内",
      html: `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Apple SD Gothic Neo',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- 헤더 -->
        <tr>
          <td style="background:linear-gradient(135deg,#1b5e3b 0%,#2d8a5a 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:1px;">良い価格、良い商品</p>
            <p style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;"><span style="color:#b2f0d0;">ソウルモノ</span></p>
          </td>
        </tr>
        <!-- 본문 -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 6px;font-size:13px;color:#1D8A5A;font-weight:700;letter-spacing:0.5px;">SECURITY</p>
            <h2 style="margin:0 0 20px;font-size:22px;font-weight:900;color:#111;">仮パスワードの発行</h2>
            <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">いつもご利用ありがとうございます。<strong style="color:#111;">${member.mb_name}</strong>様<br>ご依頼の仮パスワードを発行しました。</p>

            <!-- 임시 비밀번호 카드 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0faf5;border:2px solid #b2f0d0;border-radius:12px;margin-bottom:20px;">
              <tr>
                <td style="padding:28px;text-align:center;">
                  <p style="margin:0 0 10px;font-size:12px;color:#2d8a5a;font-weight:700;letter-spacing:0.5px;">仮パスワード</p>
                  <p style="margin:0;font-size:30px;font-weight:900;color:#1D8A5A;letter-spacing:6px;font-family:monospace;">${tempPassword}</p>
                </td>
              </tr>
            </table>

            <!-- 만료 경고 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:#f57c00;line-height:1.6;">⏱ このパスワードは<strong>30分後に失効</strong>します。<br>ログイン後、マイページ → パスワード変更で新しいパスワードに変更してください。</p>
                </td>
              </tr>
            </table>

            <!-- CTA 버튼 -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://seoulmono.com/shop/login" style="display:inline-block;background:linear-gradient(135deg,#1b5e3b,#2d8a5a);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:50px;letter-spacing:-0.2px;">ログインはこちら →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- 푸터 -->
        <tr>
          <td style="background:#f8f9fa;border-top:1px solid #eee;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;color:#bbb;">このメールはソウルモノのパスワード再発行のご依頼により送信されました。</p>
            <p style="margin:0;font-size:11px;color:#ccc;">© 2024 株式会社ワイエヌエイチエス · カスタマーセンター 010-2051-5692</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    res.json({ message: "仮パスワードをメールでお送りしました。" });
  } catch (err: any) {
    logger.error({ err }, "find-password error");
    res.status(500).json({ error: "処理中にエラーが発生しました。" });
  }
});

// ── SMS 인증 (회원가입용) ───────────────────────────────────────

const SMS_API_URL_AUTH = "https://sms.bizservice.iwinv.kr/api/v2/send/";
const SMS_SECRET_AUTH = (process.env.SMS_SECRET || "").trim();
const SMS_FROM_AUTH = (process.env.SMS_FROM || "").trim();

interface SmsEntry { code: string; expiresAt: number; verified: boolean }
const smsStore = new Map<string, SmsEntry>();

async function sendSmsCode(to: string, code: string): Promise<boolean> {
  if (!SMS_SECRET_AUTH || !SMS_FROM_AUTH) return false;
  const text = `[ソウルモノ] 認証番号 [${code}] を入力してください。(5分以内有効)`;
  try {
    const res = await fetch(SMS_API_URL_AUTH, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8", secret: SMS_SECRET_AUTH },
      body: JSON.stringify({ version: "1.0", from: SMS_FROM_AUTH, to: [to], text, date: null }),
    });
    const data = await res.json() as any;
    logger.info({ data }, "[sms-auth] send result");
    return true;
  } catch (err) {
    logger.error({ err }, "[sms-auth] send failed");
    return false;
  }
}

// 인증번호 발송
router.post("/auth/sms-send", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) { res.status(400).json({ error: "携帯電話番号を入力してください。" }); return; }
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.length < 10 || clean.length > 11) {
      res.status(400).json({ error: "正しい携帯電話番号を入力してください。" }); return;
    }

    // 기존 가입자 중복 확인
    const [dup] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id FROM g5_member WHERE mb_hp = ? AND (mb_leave_date = '' OR mb_leave_date IS NULL) LIMIT 1",
      [clean]
    );
    if (dup.length > 0) {
      res.status(400).json({ error: "すでに登録されている携帯電話番号です。" }); return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    smsStore.set(clean, { code, expiresAt: Date.now() + 5 * 60 * 1000, verified: false });

    const sent = await sendSmsCode(clean, code);
    if (!sent) {
      // SMS 설정 없는 경우 개발/테스트 편의용 로그
      logger.warn({ phone: clean, code }, "[sms-auth] SMS not configured, code generated but not sent");
    }
    res.json({ ok: true, message: "認証番号を送信しました。" });
  } catch (err) {
    logger.error({ err }, "sms-send error");
    res.status(500).json({ error: "認証番号の送信中にエラーが発生しました。" });
  }
});

// 인증번호 확인
router.post("/auth/sms-verify", (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) { res.status(400).json({ error: "情報をすべて入力してください。" }); return; }
  const clean = phone.replace(/[^0-9]/g, "");
  const entry = smsStore.get(clean);
  if (!entry) { res.status(400).json({ error: "先に認証番号をリクエストしてください。" }); return; }
  if (Date.now() > entry.expiresAt) {
    smsStore.delete(clean);
    res.status(400).json({ error: "認証番号の有効期限が切れました。もう一度リクエストしてください。" }); return;
  }
  if (entry.code !== String(code).trim()) {
    res.status(400).json({ error: "認証番号が正しくありません。" }); return;
  }
  entry.verified = true;
  res.json({ ok: true, message: "認証されました。" });
});

// 아이디 중복확인
router.get("/auth/check-id", async (req, res) => {
  try {
    const mbId = String(req.query.mb_id || "").trim();
    if (!mbId) { res.status(400).json({ error: "IDを入力してください。" }); return; }
    if (!/^[a-z0-9]{4,16}$/.test(mbId)) {
      res.status(400).json({ error: "IDは半角英小文字・数字の4〜16文字です。" }); return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id FROM g5_member WHERE mb_id = ? LIMIT 1", [mbId]
    );
    if (rows.length > 0) { res.json({ available: false, message: "このIDはすでに使用されています。" }); return; }
    res.json({ available: true, message: "このIDは使用できます。" });
  } catch (err) {
    res.status(500).json({ error: "確認中にエラーが発生しました。" });
  }
});

// 닉네임 중복확인
router.get("/auth/check-nick", async (req, res) => {
  try {
    const nick = String(req.query.mb_nick || "").trim();
    if (!nick) { res.status(400).json({ error: "ニックネームを入力してください。" }); return; }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id FROM g5_member WHERE mb_nick = ? LIMIT 1", [nick]
    );
    if (rows.length > 0) { res.json({ available: false, message: "このニックネームはすでに使用されています。" }); return; }
    res.json({ available: true, message: "このニックネームは使用できます。" });
  } catch (err) {
    res.status(500).json({ error: "確認中にエラーが発生しました。" });
  }
});

router.get("/auth/check-email", async (req, res) => {
  try {
    const email = String(req.query.mb_email || "").trim();
    if (!email) { res.status(400).json({ error: "メールアドレスを入力してください。" }); return; }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id FROM g5_member WHERE mb_email = ? LIMIT 1", [email]
    );
    if (rows.length > 0) { res.json({ available: false, message: "このメールアドレスはすでに使用されています。" }); return; }
    res.json({ available: true, message: "このメールアドレスは使用できます。" });
  } catch (err) {
    res.status(500).json({ error: "確認中にエラーが発生しました。" });
  }
});

// 쇼핑몰 일반 회원가입
router.post("/auth/register-shop", async (req, res) => {
  try {
    const { mb_name: inputName, mb_nick, mb_email, mb_hp, mb_password, agree_marketing } = req.body;

    // mb_name 우선, 없으면 mb_nick 사용 (하위 호환)
    const nameVal = (inputName || mb_nick || "").trim();

    if (!nameVal || !mb_hp || !mb_password) {
      res.status(400).json({ error: "お名前、携帯電話番号、パスワードを入力してください。" }); return;
    }
    if (mb_password.length < 6) {
      res.status(400).json({ error: "パスワードは6文字以上である必要があります。" }); return;
    }

    const clean = mb_hp.replace(/[^0-9]/g, "");
    if (clean.length < 10) {
      res.status(400).json({ error: "正しい携帯電話番号を入力してください。" }); return;
    }

    // 휴대폰번호 = mb_id (중복 확인)
    const mb_id = clean;
    const [existPhone] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id FROM g5_member WHERE mb_id = ? OR mb_hp = ? LIMIT 1", [mb_id, clean]
    );
    if (existPhone.length > 0) { res.status(400).json({ error: "すでに登録されている携帯電話番号です。" }); return; }

    // 이메일 중복 (이메일이 있는 경우만)
    if (mb_email && mb_email.trim()) {
      const [existEmailRow] = await pool.query<RowDataPacket[]>(
        "SELECT mb_id FROM g5_member WHERE mb_email = ? LIMIT 1", [mb_email.trim()]
      );
      if (existEmailRow.length > 0) { res.status(400).json({ error: "このメールアドレスはすでに使用されています。" }); return; }
    }

    // 닉네임 유일성 보장 (이름 기반)
    let finalNick = nameVal;
    const [existNickRow] = await pool.query<RowDataPacket[]>(
      "SELECT mb_id FROM g5_member WHERE mb_nick = ? LIMIT 1", [finalNick]
    );
    if (existNickRow.length > 0) finalNick = nameVal + "_" + randomBytes(3).toString("hex");

    const mb_name = nameVal;

    const hashedPw = gnuboardPasswordHash(mb_password);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const today = now.slice(0, 10);
    const clientIp = (req.headers["x-forwarded-for"] as string || req.ip || "").split(",")[0].trim();

    const [cfRows] = await pool.query<RowDataPacket[]>("SELECT cf_register_point FROM g5_config LIMIT 1");
    const signupPoint = Number(cfRows[0]?.cf_register_point || 0);
    const mailling = agree_marketing ? 1 : 0;

    await pool.query(
      `INSERT INTO g5_member (
        mb_id, mb_password, mb_name, mb_nick, mb_nick_date, mb_email, mb_hp,
        mb_level, mb_datetime, mb_ip,
        mb_today_login, mb_login_ip,
        mb_email_certify, mb_email_certify2,
        mb_certify, mb_adult, mb_dupinfo,
        mb_open, mb_open_date,
        mb_zip1, mb_zip2, mb_addr1, mb_addr2, mb_addr3, mb_addr_jibeon,
        mb_point, mb_mailling,
        mb_leave_date, mb_intercept_date,
        mb_1, mb_2, mb_3, mb_4, mb_5, mb_6, mb_7, mb_8, mb_9, mb_10,
        mb_signature, mb_memo, mb_lost_certify, mb_profile,
        store_mb_id
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        2, ?, ?,
        ?, ?,
        NOW(), '',
        '', 0, '',
        0, ?,
        '', '', '', '', '', '',
        ?, ?,
        '', '',
        '', '', '', '', '', '', '', '', '', '',
        '', '', '', '',
        ''
      )`,
      [mb_id, hashedPw, mb_name, finalNick, today, mb_email || "", clean,
       now, clientIp, now, clientIp, today, signupPoint, mailling]
    );

    // 포인트 적립 내역
    if (signupPoint > 0) {
      await pool.query(
        `INSERT INTO g5_point (mb_id, po_content, po_point, po_use_point, po_mb_point, po_rel_table, po_rel_id, po_rel_action, po_datetime, po_expire_date)
         VALUES (?, '회원가입 축하', ?, 0, ?, '@member', ?, 'join', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
        [mb_id, signupPoint, signupPoint, mb_id]
      );
    }

    const [newRows] = await pool.query<RowDataPacket[]>("SELECT * FROM g5_member WHERE mb_id = ?", [mb_id]);
    const member = newRows[0];
    const token = createToken({ mb_id: member.mb_id, mb_level: member.mb_level });

    res.status(201).json({
      ok: true,
      token,
      user: {
        mb_id: member.mb_id,
        mb_name: member.mb_name || "",
        mb_email: member.mb_email || "",
        mb_hp: member.mb_hp || "",
        mb_level: member.mb_level,
        is_admin: false,
        is_approved: true,
      },
    });
  } catch (err: any) {
    logger.error({ err }, "register-shop error");
    let msg = "登録中にエラーが発生しました。";
    if (err.code === "ER_DUP_ENTRY") {
      if (err.message?.includes("mb_nick")) msg = "ニックネームが重複しています。もう一度お試しください。";
      else if (err.message?.includes("mb_email")) msg = "このメールアドレスはすでに使用されています。";
      else msg = "すでに登録されている情報があります。";
    }
    res.status(500).json({ error: msg });
  }
});

export default router;
