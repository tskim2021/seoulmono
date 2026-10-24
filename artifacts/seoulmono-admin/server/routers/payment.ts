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
        throw new TRPCError({ code: "FORBIDDEN", message: "주문 정보를 찾을 수 없습니다." });
      }

      // 이미 결제 정보가 있는지 확인
      const existingPayment = await db.getPaymentByOrderId(input.orderId);
      if (existingPayment) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "이미 결제 정보가 등록되어 있습니다." });
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
        throw new TRPCError({ code: "NOT_FOUND", message: "입금 계좌 정보를 찾을 수 없습니다." });
      }

      // 1. 인앱 알림 발송
      await db.createNotification(
        ctx.user.id,
        "order",
        "입금 계좌 안내",
        `주문번호 ${order.orderNumber}의 입금 계좌가 발송되었습니다. ${autoCancelHours}시간 이내에 입금해주세요.`,
        `/orders/${order.id}`
      );

      // 2. 입금 안내 이메일 발송
      if (ctx.user.email) {
        await sendEmail({
          to: ctx.user.email,
          subject: `[탈모학교] 주문 ${order.orderNumber} 입금 안내`,
          html: await generateEmailTemplate({
            title: "입금 계좌 안내",
            content: `
              <p>안녕하세요, ${ctx.user.name || "고객"}님.</p>
              <p>주문이 정상적으로 접수되었습니다.</p>
              <p>아래 계좌로 <strong>${autoCancelHours}시간 이내</strong>에 입금해주시면 확인 후 상품을 발송해드립니다.</p>
              
              <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #92400e;">📌 입금 정보</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">주문번호</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e;">${order.orderNumber}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">입금 계좌</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e;">${bankAccount.bankName} ${bankAccount.accountNumber}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">예금주</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e;">${bankAccount.accountHolder}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">입금 금액</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e; font-size: 18px; font-weight: 700;">${order.totalAmount.toLocaleString()}원</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #fbbf24;">
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">입금자명</td>
                    <td style="padding: 8px 0; text-align: right; color: #92400e;">${input.depositorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #78350f; font-weight: 600;">입금 기한</td>
                    <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 700;">${expiresAt.toLocaleString("ja-JP")}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                  <strong>⚠️ 주의사항</strong><br/>
                  • 입금 기한(<strong>${autoCancelHours}시간</strong>) 내 미입금 시 자동으로 주문이 취소됩니다.<br/>
                  • 입금자명이 주문자명과 다른 경우 확인이 지연될 수 있습니다.<br/>
                  • 입금 확인까지 1~2 영업일 소요될 수 있습니다.
                </p>
              </div>
            `,
            actionText: "주문 상세 보기",
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
        throw new TRPCError({ code: "NOT_FOUND", message: "결제 정보를 찾을 수 없습니다." });
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
        "입금이 확인되었습니다",
        `주문번호 ${order.orderNumber}의 입금이 확인되어 상품 준비를 시작합니다.`,
        `/orders/${order.id}`
      );

      // 2. 입금 확인 이메일 발송
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: `[탈모학교] 주문 ${order.orderNumber} 입금 확인 완료`,
          html: await generateEmailTemplate({
            title: "입금이 확인되었습니다",
            content: `
              <p>안녕하세요, ${user.name || "고객"}님.</p>
              <p>주문하신 상품의 입금이 확인되었습니다.</p>
              
              <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #065f46;">✅ 입금 확인 완료</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #6ee7b7;">
                    <td style="padding: 8px 0; color: #065f46; font-weight: 600;">주문번호</td>
                    <td style="padding: 8px 0; text-align: right; color: #047857;">${order.orderNumber}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #6ee7b7;">
                    <td style="padding: 8px 0; color: #065f46; font-weight: 600;">입금 확인 시간</td>
                    <td style="padding: 8px 0; text-align: right; color: #047857;">${payment.confirmedAt?.toLocaleString("ja-JP")}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #065f46; font-weight: 600;">입금 금액</td>
                    <td style="padding: 8px 0; text-align: right; color: #047857; font-size: 18px; font-weight: 700;">${payment.depositAmount?.toLocaleString()}원</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #374151;">현재 상품 준비 중이며, 곧 배송이 시작됩니다.<br/>배송 시작 시 다시 알려드리겠습니다.</p>
            `,
            actionText: "주문 상세 보기",
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
        description: `주문 #${order.orderNumber} 입금 확인 (${payment.depositAmount?.toLocaleString()}원)`,
        detail: { orderId: order.id, orderNumber: order.orderNumber, paymentId: input.paymentId, amount: payment.depositAmount },
      });

      return { success: true };
    }),

  // 관리자: 입금확인 취소
  adminCancelPaymentConfirmation: adminProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ input }) => {
      const payment = await db.cancelPaymentConfirmation(input.paymentId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "결제 정보를 찾을 수 없습니다." });
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
