import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import * as db from "../db";
import bcrypt from "bcryptjs";
import { sendEmail, generateEmailTemplate } from "../_core/email";

export const localAuthRouter = router({
  checkAvailability: publicProcedure
    .input(z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const result = { emailTaken: false, phoneTaken: false };
      if (input.email) {
        const u = await db.getUserByEmail(input.email);
        result.emailTaken = !!u;
      }
      if (input.phone) {
        const u = await db.getUserByPhone(input.phone);
        result.phoneTaken = !!u;
      }
      return result;
    }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        phone: z.string().min(1, "電話番号を入力してください"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "すでに登録されているメールアドレスです。",
        });
      }
      const existingPhone = await db.getUserByPhone(input.phone);
      if (existingPhone) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "すでに登録されている電話番号です。",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      await db.upsertUser({
        openId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "会員登録に失敗しました。" });
      }

      await db.updateUserPassword(user.id, hashedPassword);

      const regPoints = await db.getSetting("registrationPoints");
      const parsed = parseInt(regPoints ?? "2000", 10);
      const bonusPoints = Number.isFinite(parsed) && parsed > 0 ? parsed : 2000;
      if (bonusPoints > 0) {
        await db.addPoints(user.id, bonusPoints, "admin", "会員登録記念ポイント");
      }

      const sessionToken = await sdk.createSessionToken(openId, { name: input.name });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const safeName = escHtml(input.name);
      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : (process.env.REPLIT_DOMAINS?.split(",")[0] ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "");

      (async () => {
        try {
          const pointsMsg = bonusPoints > 0 ? `\n\n🎁 会員登録記念ポイント ${bonusPoints.toLocaleString()}ポイントを付与しました！` : "";
          const html = await generateEmailTemplate({
            title: `${safeName}様、ソウルモノへようこそ！`,
            content: `いつもご利用ありがとうございます。${safeName}様\n\nソウルモノにご登録いただきありがとうございます。\n\nソウルモノはインドの医薬品などを個人輸入でお届けする専門ショップで、薄毛ケア、男性機能、スキンケア、ダイエットなど、さまざまな商品をお手頃な価格でご提供しています。${pointsMsg}\n\nさっそくお買い物を始めましょう！`,
            actionUrl: `${baseUrl}/products`,
            actionText: "ショッピングを始める",
          });
          await sendEmail({
            to: input.email,
            subject: "[ソウルモノ] ご登録ありがとうございます！",
            html,
            userId: user.id,
          });
        } catch (e) {
          console.error("[Register] Welcome email failed:", e);
        }
      })();

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  findAccount: publicProcedure
    .input(z.object({
      name: z.string().min(1, "お名前を入力してください"),
      phone: z.string().min(1, "電話番号を入力してください"),
    }))
    .mutation(async ({ input }) => {
      const user = await db.findUserByNameAndPhone(input.name, input.phone);
      if (!user || !user.email) {
        throw new TRPCError({ code: "NOT_FOUND", message: "入力された情報に一致するアカウントが見つかりません。" });
      }
      // 이메일 마스킹: ab****@gmail.com
      const [local, domain] = user.email.split("@");
      const visible = Math.min(2, local.length);
      const masked = local.slice(0, visible) + "*".repeat(Math.max(1, local.length - visible)) + "@" + domain;
      return { maskedEmail: masked };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email("正しいメールアドレスを入力してください"),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.password) {
        // 보안상 존재 여부를 노출하지 않음
        return { success: true };
      }
      // 임시 비밀번호 생성 (8자 영숫자)
      const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
      const tempPw = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const hashed = await bcrypt.hash(tempPw, 10);
      await db.updateUserPassword(user.id, hashed);

      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : (process.env.REPLIT_DOMAINS?.split(",")[0] ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "");

      try {
        const html = await generateEmailTemplate({
          title: "仮パスワードのご案内",
          content: `いつもご利用ありがとうございます。${user.name ?? "お客様"}様\n\nご依頼いただいた仮パスワードをご案内いたします。\n\n仮パスワード: ${tempPw}\n\nログイン後、必ずパスワードを変更してください。\n\nお心当たりがない場合は、至急カスタマーサポートまでご連絡ください。`,
          actionUrl: `${baseUrl}/login`,
          actionText: "ログインする",
        });
        await sendEmail({
          to: input.email,
          subject: "[ソウルモノ] 仮パスワードのご案内",
          html,
          userId: user.id,
        });
      } catch (e) {
        console.error("[PasswordReset] Email failed:", e);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "メールの送信に失敗しました。しばらくしてからもう一度お試しください。" });
      }
      return { success: true };
    }),

  login: publicProcedure
    .input(
      z.object({
        // seoulmono-admin: 그누보드 아이디(mb_id) 로그인도 허용한다.
        email: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("[Login] attempt:", input.email);
      const user = await db.getUserByEmail(input.email);
      console.log("[Login] user found:", !!user, "has password:", !!user?.password, "loginMethod:", user?.loginMethod);
      if (!user || !user.password) {
        console.log("[Login] fail: no user or no password");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "メールアドレスまたはパスワードが正しくありません。",
        });
      }

      // seoulmono-admin: g5_member 는 그누보드 PBKDF2, a2_users 는 bcrypt.
      const isValid = await db.verifyUserPassword(user, input.password);
      console.log("[Login] password valid:", isValid);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "メールアドレスまたはパスワードが正しくありません。",
        });
      }

      console.log("[Login] upsertUser...");
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      console.log("[Login] createSessionToken...");
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      console.log("[Login] setting cookie, secure:", cookieOptions.secure, "sameSite:", cookieOptions.sameSite);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[Login] success, returning user:", user.id);
      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
});
