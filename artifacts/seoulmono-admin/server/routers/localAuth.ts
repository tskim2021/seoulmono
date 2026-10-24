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
        phone: z.string().min(1, "연락처를 입력해주세요"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 가입된 이메일입니다.",
        });
      }
      const existingPhone = await db.getUserByPhone(input.phone);
      if (existingPhone) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 가입된 연락처입니다.",
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
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "회원가입에 실패했습니다." });
      }

      await db.updateUserPassword(user.id, hashedPassword);

      const regPoints = await db.getSetting("registrationPoints");
      const parsed = parseInt(regPoints ?? "2000", 10);
      const bonusPoints = Number.isFinite(parsed) && parsed > 0 ? parsed : 2000;
      if (bonusPoints > 0) {
        await db.addPoints(user.id, bonusPoints, "admin", "회원가입 축하 포인트");
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
          const pointsMsg = bonusPoints > 0 ? `\n\n🎁 회원가입 축하 포인트 ${bonusPoints.toLocaleString()}P가 적립되었습니다!` : "";
          const html = await generateEmailTemplate({
            title: `${safeName}님, 탈모학교에 오신 것을 환영합니다!`,
            content: `안녕하세요, ${safeName}님!\n\n탈모학교에 가입해 주셔서 감사합니다.\n\n탈모학교는 인도 의약품 해외직구 전문 쇼핑몰로, 탈모, 성기능, 피부미용, 다이어트 등 다양한 제품을 합리적인 가격에 제공하고 있습니다.${pointsMsg}\n\n지금 바로 쇼핑을 시작해 보세요!`,
            actionUrl: `${baseUrl}/products`,
            actionText: "쇼핑 시작하기",
          });
          await sendEmail({
            to: input.email,
            subject: "[탈모학교] 회원가입을 환영합니다!",
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
      name: z.string().min(1, "이름을 입력해주세요"),
      phone: z.string().min(1, "연락처를 입력해주세요"),
    }))
    .mutation(async ({ input }) => {
      const user = await db.findUserByNameAndPhone(input.name, input.phone);
      if (!user || !user.email) {
        throw new TRPCError({ code: "NOT_FOUND", message: "입력하신 정보와 일치하는 계정을 찾을 수 없습니다." });
      }
      // 이메일 마스킹: ab****@gmail.com
      const [local, domain] = user.email.split("@");
      const visible = Math.min(2, local.length);
      const masked = local.slice(0, visible) + "*".repeat(Math.max(1, local.length - visible)) + "@" + domain;
      return { maskedEmail: masked };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email("올바른 이메일을 입력해주세요"),
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
          title: "임시 비밀번호 안내",
          content: `안녕하세요, ${user.name ?? "회원"}님!\n\n요청하신 임시 비밀번호를 안내해 드립니다.\n\n임시 비밀번호: ${tempPw}\n\n로그인 후 반드시 비밀번호를 변경해주세요.\n\n본인이 요청하지 않으셨다면 즉시 고객센터로 문의해주세요.`,
          actionUrl: `${baseUrl}/login`,
          actionText: "로그인하러 가기",
        });
        await sendEmail({
          to: input.email,
          subject: "[탈모학교] 임시 비밀번호 안내",
          html,
          userId: user.id,
        });
      } catch (e) {
        console.error("[PasswordReset] Email failed:", e);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요." });
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
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        });
      }

      // seoulmono-admin: g5_member 는 그누보드 PBKDF2, a2_users 는 bcrypt.
      const isValid = await db.verifyUserPassword(user, input.password);
      console.log("[Login] password valid:", isValid);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
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
