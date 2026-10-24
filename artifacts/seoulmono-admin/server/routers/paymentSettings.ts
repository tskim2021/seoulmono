import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const paymentSettingsRouter = router({
  // 공개 API - 활성화된 결제 수단 조회 (사용자 Checkout 페이지용)
  getEnabledMethods: publicProcedure.query(async () => {
    const methods = await db.getEnabledPaymentMethods();
    return methods;
  }),

  // 관리자 API - 전체 결제 수단 조회
  adminGetAllMethods: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
    }
    
    const methods = await db.getAllPaymentMethods();
    return methods;
  }),

  // 관리자 API - 결제 수단 활성화/비활성화 토글
  adminToggleMethod: protectedProcedure
    .input(z.object({
      id: z.number(),
      isEnabled: z.number().min(0).max(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
      }
      
      const updated = await db.updatePaymentMethod(input.id, {
        isEnabled: input.isEnabled,
      });
      
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "결제 수단을 찾을 수 없습니다." });
      }
      
      return updated;
    }),

  // 관리자 API - 결제 수단 API 설정 업데이트
  adminUpdateApiConfig: protectedProcedure
    .input(z.object({
      id: z.number(),
      apiConfig: z.string().optional(), // JSON string
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
      }
      
      const updated = await db.updatePaymentMethod(input.id, {
        apiConfig: input.apiConfig,
        description: input.description,
      });
      
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "결제 수단을 찾을 수 없습니다." });
      }
      
      return updated;
    }),

  // 관리자 API - 결제 수단 표시 순서 변경
  adminUpdateSortOrder: protectedProcedure
    .input(z.object({
      id: z.number(),
      sortOrder: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
      }
      
      const updated = await db.updatePaymentMethod(input.id, {
        sortOrder: input.sortOrder,
      });
      
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "결제 수단을 찾을 수 없습니다." });
      }
      
      return updated;
    }),
});
