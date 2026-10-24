import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import * as db from "../db";
import { sendEmail, generateEmailTemplate } from "../_core/email";

export const paymentRouter = {
  // 사용자: 활성화된 입금 계좌 목록 조회
  getBankAccounts: publicProcedure.query(async () => {
    return db.getBankAccounts();
  }),

  // 사용자: 무통장 입금 결제 생성 (주문 완료 시)
  createBankTransferPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        bankAccountId: z.number(),
        depositorName: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 주문 소유권 확인
      const order = await db.getOrderById(input.orderId);
      if (!order || order.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "注文情報が見つかりません。" });
      }

      // 이미 결제 정보가 있는지 확인
      const existingPayment = await db.getPaymentByOrderId(input.orderId);
      if (existingPayment) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "すでにお支払い情報が登録されています。" });
      }

      // 자동 취소 시간 설정 조회
      const autoCancelSetting = await db.getSetting("bankTransferAutoCancelHours");
      const autoCancelHours = parseInt(autoCancelSetting || "48");

      // 입금 기한 계산
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + autoCancelHours);

      // 결제 정보 생성
      await db.createPayment({
        orderId: input.orderId,
        paymentMethod: "bank_transfer",
        bankAccountId: input.bankAccountId,
        depositorName: input.depositorName,
        depositAmount: order.totalAmount,
        expiresAt,
        status: "pending",
      });

      // 입금 계좌 정보 조회
      const bankAccount = await db.getBankAccountById(input.bankAccountId);
      if (!bankAccount) {
        throw new TRPCError({ code: "NOT_FOUND", message: "お振込先口座情報が見つかりません。" });
      }

      // 1. 인앱 알림 발송
      await db.createNotification(
        ctx.user.id,
        "order",
        "お振込先のご案内",
        `注文番号 ${order.orderNumber} のお振込先口座をお送りしました。${autoCancelHours}時間以内にお振込みください。`,
        `/orders/${order.id}`
      );

      // 2. 입금 안내 이메일 발송
      if (ctx.user.email) {
        await sendEmail({
          to: ctx.user.email,
          subject: `[ソウルモノ] ご注文 ${order.orderNumber} お振込のご案内`,
          html: await generateEmailTemplate({
            title: "お振込先のご案内",
            content: `
              <p>いつもご利用ありがとうございます。${ctx.user.name || "お客様"}様</p>
              <p>ご注文を正常に承りました。</p>
              <p>下記の口座に<strong>${autoCancelHours}時間以内</strong>にお振込みいただくと、確認後に商品を発送いたします。</p>
              
              <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #92400e;">📌 お振込情報</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">ご注文番号</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e;">${order.orderNumber}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">お振込先口座</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e;">${bankAccount.bankName} ${bankAccount.accountNumber}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">口座名義</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e;">${bankAccount.accountHolder}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">お振込金額</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e; font-size: 18px; font-weight: 700;">${order.totalAmount.toLocaleString()}円</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">お振込名義</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e;">${input.depositorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">お振込期限</td>
                    <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 700;">${expiresAt.toLocaleString("ja-JP")}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                  <strong>⚠️ ご注意</strong><br/>
                  • お振込期限（<strong>${autoCancelHours}時間</strong>）内にご入金がない場合、ご注文は自動的にキャンセルされます。<br/>
                  • お振込名義がご注文者名と異なる場合、確認が遅れることがあります。<br/>
                  • ご入金の確認まで1〜2営業日かかる場合があります。
                </p>
              </div>
            `,
            actionText: "ご注文詳細を見る",
            actionUrl: `${process.env.VITE_APP_URL}/orders/${order.id}`,
          }),
        });
      }

      return { success: true };
    }),

  // 사용자: 주문의 결제 정보 조회
  getPaymentByOrderId: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      const order = await db.getOrderById(input.orderId);
      if (!order || order.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const payment = await db.getPaymentByOrderId(input.orderId);
      if (!payment) return null;

      // 입금 계좌 정보도 함께 조회
      let bankAccount = null;
      if (payment.bankAccountId) {
        bankAccount = await db.getBankAccountById(payment.bankAccountId);
      }

      return { ...payment, bankAccount };
    }),

  // 관리자: 주문의 결제 정보 조회
  adminGetPaymentByOrderId: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const payment = await db.getPaymentByOrderId(input.orderId);
      if (!payment) return null;
      let bankAccount = null;
      if (payment.bankAccountId) {
        bankAccount = await db.getBankAccountById(payment.bankAccountId);
      }
      return { ...payment, bankAccount };
    }),

  // 관리자: 모든 입금 계좌 목록 조회
  adminGetAllBankAccounts: adminProcedure.query(async () => {
    return db.getAllBankAccounts();
  }),

  // 관리자: 입금 계좌 생성
  adminCreateBankAccount: adminProcedure
    .input(
      z.object({
        bankName: z.string().min(1).max(50),
        accountNumber: z.string().min(1).max(50),
        accountHolder: z.string().min(1).max(50),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.createBankAccount({
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountHolder: input.accountHolder,
        sortOrder: input.sortOrder ?? 0,
        isActive: 1,
      });
      return { success: true };
    }),

  // 관리자: 입금 계좌 수정
  adminUpdateBankAccount: adminProcedure
    .input(
      z.object({
        id: z.number(),
        bankName: z.string().min(1).max(50).optional(),
        accountNumber: z.string().min(1).max(50).optional(),
        accountHolder: z.string().min(1).max(50).optional(),
        isActive: z.number().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateBankAccount(id, data);
      return { success: true };
    }),

  // 관리자: 입금 계좌 삭제
  adminDeleteBankAccount: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteBankAccount(input.id);
      return { success: true };
    }),

  // 관리자: 입금 대기 목록 조회
  adminGetPendingPayments: adminProcedure.query(async () => {
    return db.getPendingPayments();
  }),

  // 관리자: 입금 확인
  adminConfirmPayment: adminProcedure
    .input(
      z.object({
        paymentId: z.number(),
        memo: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const payment = await db.confirmPayment(input.paymentId, ctx.user.id, input.memo);

      if (!payment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "お支払い情報が見つかりません。" });
      }

      // 주문 및 사용자 정보 조회
      const order = await db.getOrderById(payment.orderId);
      if (!order) return { success: true };

      const user = await db.getUserById(order.userId);
      if (!user) return { success: true };

      // 1. 인앱 알림 발송
      await db.createNotification(
        order.userId,
        "order",
        "ご入金を確認しました",
        `注文番号 ${order.orderNumber} のご入金を確認し、商品の準備を開始します。`,
        `/orders/${order.id}`
      );

      // 2. 입금 확인 이메일 발송
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: `[ソウルモノ] ご注文 ${order.orderNumber} ご入金確認完了`,
          html: await generateEmailTemplate({
            title: "ご入金を確認しました",
            content: `
              <p>いつもご利用ありがとうございます。${user.name || "お客様"}様</p>
              <p>ご注文商品のご入金を確認いたしました。</p>
              
              <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #065f46;">✅ ご入金確認完了</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #6ee7b7;">
                    <td style="padding: 8px 0; color: #065f46; font-weight: 600;">ご注文番号</td>
                    <td style="padding: 8px 0; text-align: right; color: #047857;">${order.orderNumber}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #6ee7b7;">
                    <td style="padding: 8px 0; color: #065f46; font-weight: 600;">ご入金確認日時</td>
                    <td style="padding: 8px 0; text-align: right; color: #047857;">${payment.confirmedAt?.toLocaleString("ja-JP")}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-weight: 600;">お振込金額</td>
                    <td style="padding: 8px 0; text-align: right; color: #047857; font-size: 18px; font-weight: 700;">${payment.depositAmount?.toLocaleString()}円</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #374151;">現在商品を準備中で、まもなく発送を開始いたします。<br/>発送時に改めてお知らせいたします。</p>
            `,
            actionText: "ご注文詳細を見る",
            actionUrl: `${process.env.VITE_APP_URL}/orders/${order.id}`,
          }),
        });
      }

      // 탈모1 역반영 (입금 확인)
      if (order.source === "gnuboard" && order.orderNumber?.startsWith("GNU-")) {
        try {
          const { getGnuApiConfig, pushPaymentConfirmToGnuboard } = await import("../jobs/gnuApiSync");
          const cfg = await getGnuApiConfig();
          if (cfg.baseUrl && cfg.token) {
            await pushPaymentConfirmToGnuboard(cfg, {
              orderNumber: order.orderNumber,
              receiptPrice: payment.depositAmount ?? 0,
            });
          }
        } catch (e: any) { console.error("[Payment:confirm] 탈모1 역반영 실패:", e.message); }
      }

      await db.logAdminAction({
        adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
        action: "payment.confirm", entityType: "order", entityId: order.id,
        description: `注文 #${order.orderNumber} 入金確認 (${payment.depositAmount?.toLocaleString()}円)`,
        detail: { orderId: order.id, orderNumber: order.orderNumber, paymentId: input.paymentId, amount: payment.depositAmount },
      });

      return { success: true };
    }),

  // 관리자: 입금확인 취소
  adminCancelPaymentConfirmation: adminProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ input }) => {
      const payment = await db.cancelPaymentConfirmation(input.paymentId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "お支払い情報が見つかりません。" });
      return { success: true };
    }),

  // 관리자: 자동취소 시간 설정 조회
  adminGetAutoCancelHours: adminProcedure.query(async () => {
    const setting = await db.getSetting("bankTransferAutoCancelHours");
    return { hours: parseInt(setting || "48") };
  }),

  // 관리자: 자동취소 시간 설정 수정
  adminUpdateAutoCancelHours: adminProcedure
    .input(z.object({ hours: z.number().min(1).max(168) }))
    .mutation(async ({ input }) => {
      await db.upsertSetting("bankTransferAutoCancelHours", String(input.hours));
      return { success: true };
    }),
};
