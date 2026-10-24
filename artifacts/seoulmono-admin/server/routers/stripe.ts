import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { generateOrderNumber } from "../db";
import Stripe from "stripe";
import mysql from "mysql2/promise";

async function getStripeClient(): Promise<{ client: Stripe; currency: string } | null> {
  const method = await db.getPaymentMethodByCode("stripe");
  if (!method?.apiConfig) return null;

  let config: { secretKey?: string; currency?: string };
  try {
    config = JSON.parse(method.apiConfig);
  } catch {
    return null;
  }

  if (!config.secretKey) return null;

  const client = new Stripe(config.secretKey, { apiVersion: "2025-03-31.basil" });
  return { client, currency: config.currency || "krw" };
}

export const stripeRouter = router({
  // 공개: publishable key 반환 (결제 폼용)
  getPublishableKey: publicProcedure.query(async () => {
    const method = await db.getPaymentMethodByCode("stripe");
    if (!method?.isEnabled || !method.apiConfig) return null;

    try {
      const config = JSON.parse(method.apiConfig) as { publishableKey?: string };
      if (!config.publishableKey) return null;
      return { publishableKey: config.publishableKey };
    } catch {
      return null;
    }
  }),

  // 그누보드 방식: 클라이언트에서 PaymentMethod 생성 → 서버에서 직접 결제 처리
  // Stripe metadata에는 주문번호만 수집 (개인정보 미전송)
  chargeWithPaymentMethod: protectedProcedure
    .input(z.object({
      paymentMethodId: z.string(),
      amount: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const stripe = await getStripeClient();
      if (!stripe) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe 결제 설정이 되어 있지 않습니다. 관리자에게 문의하세요." });
      }

      // 주문번호 사전 생성 (Stripe metadata에 주문번호만 기록)
      const orderNumber = generateOrderNumber();

      const intent = await stripe.client.paymentIntents.create({
        amount: input.amount,
        currency: stripe.currency,
        payment_method: input.paymentMethodId,
        confirm: true,
        return_url: (process.env.SITE_URL || "https://talmoschool.replit.app") + "/checkout/complete",
        // 개인정보 미수집: 주문번호만 메타데이터에 포함
        metadata: { order_number: orderNumber },
      });

      if (intent.status === "succeeded") {
        return { success: true, paymentIntentId: intent.id, orderNumber, requiresAction: false, clientSecret: null };
      }

      if (intent.status === "requires_action" && intent.next_action) {
        // 3D Secure 인증 필요 (일부 해외 카드)
        return {
          success: false,
          requiresAction: true,
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
          orderNumber,
        };
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `결제 실패: ${intent.status}`,
      });
    }),

  // 관리자: 탈모1 Gnuboard에서 Stripe 키 가져오기
  adminImportFromGnuboard: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
    }

    const { TALMO_MYSQL_HOST, TALMO_MYSQL_USER, TALMO_MYSQL_PASSWORD, TALMO_MYSQL_DATABASE } = process.env;
    if (!TALMO_MYSQL_HOST) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "탈모1 DB 연결 정보가 없습니다." });
    }

    let conn: mysql.Connection | null = null;
    try {
      conn = await mysql.createConnection({
        host: TALMO_MYSQL_HOST,
        user: TALMO_MYSQL_USER,
        password: TALMO_MYSQL_PASSWORD,
        database: TALMO_MYSQL_DATABASE,
      });

      const [rows] = await conn.execute(
        "SELECT de_stripe_use, de_stripe_skey, de_stripe_pkey, de_stripe_currency FROM g5_shop_default LIMIT 1"
      ) as [any[], any];

      if (!rows.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "탈모1 DB에서 Stripe 설정을 찾을 수 없습니다." });
      }

      const row = rows[0];
      if (!row.de_stripe_pkey || !row.de_stripe_skey) {
        throw new TRPCError({ code: "NOT_FOUND", message: "탈모1 DB에 Stripe 키가 없습니다." });
      }

      const method = await db.getPaymentMethodByCode("stripe");
      if (!method) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stripe 결제 수단이 없습니다." });
      }

      let existingConfig: Record<string, string> = {};
      try { existingConfig = JSON.parse(method.apiConfig || "{}"); } catch {}

      const newConfig = {
        ...existingConfig,
        publishableKey: row.de_stripe_pkey,
        secretKey: row.de_stripe_skey,
        currency: row.de_stripe_currency || "krw",
      };

      const updated = await db.updatePaymentMethod(method.id, {
        apiConfig: JSON.stringify(newConfig),
        isEnabled: row.de_stripe_use === 1 ? 1 : method.isEnabled,
      });

      return { success: true, method: updated };
    } finally {
      conn?.end();
    }
  }),

  // 관리자: Stripe 키 삭제
  adminDeleteKeys: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
    }

    const method = await db.getPaymentMethodByCode("stripe");
    if (!method) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Stripe 결제 수단이 없습니다." });
    }

    const updated = await db.updatePaymentMethod(method.id, {
      apiConfig: null,
      isEnabled: 0,
    });

    return { success: true, method: updated };
  }),
});
