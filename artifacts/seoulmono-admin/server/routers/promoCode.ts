import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const promoCodeRouter = router({
  // ─── Admin ───
  adminList: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllPromoCodes(input?.page ?? 1, input?.limit ?? 20);
  }),

  adminCreate: adminProcedure.input(z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.number().min(1),
    minOrderAmount: z.number().min(0).optional(),
    maxDiscountAmount: z.number().nullable().optional(),
    totalUsageLimit: z.number().optional(),
    perUserLimit: z.number().optional(),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.number().optional(),
    targetProductIds: z.string().nullable().optional(),
    targetCategoryIds: z.string().nullable().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createPromoCode({
      ...input,
      minOrderAmount: input.minOrderAmount ?? 0,
      maxDiscountAmount: input.maxDiscountAmount ?? null,
      totalUsageLimit: input.totalUsageLimit ?? -1,
      perUserLimit: input.perUserLimit ?? 1,
      isActive: input.isActive ?? 1,
      targetProductIds: input.targetProductIds ?? null,
      targetCategoryIds: input.targetCategoryIds ?? null,
    });
    return { success: true, id };
  }),

  adminUpdate: adminProcedure.input(z.object({
    id: z.number(),
    code: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    discountType: z.enum(["percent", "fixed"]).optional(),
    discountValue: z.number().optional(),
    minOrderAmount: z.number().optional(),
    maxDiscountAmount: z.number().nullable().optional(),
    totalUsageLimit: z.number().optional(),
    perUserLimit: z.number().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    isActive: z.number().optional(),
    targetProductIds: z.string().nullable().optional(),
    targetCategoryIds: z.string().nullable().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updatePromoCode(id, data as any);
    return { success: true };
  }),

  adminDelete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deletePromoCode(input.id);
    return { success: true };
  }),

  // ─── User ───
  validate: publicProcedure.input(z.object({
    code: z.string().min(1),
    orderAmount: z.number().optional(),
    productIds: z.array(z.number()).optional(),
    categoryIds: z.array(z.number()).optional(),
  })).query(async ({ input }) => {
    const promo = await db.getPromoCodeByCode(input.code);
    if (!promo) return { valid: false, message: "존재하지 않는 할인코드입니다." };
    if (!promo.isActive) return { valid: false, message: "사용 할 수 없는 할인코드입니다." };

    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      return { valid: false, message: "할인코드 사용 기간이 아닙니다." };
    }
    if (promo.totalUsageLimit !== -1 && promo.usedCount >= promo.totalUsageLimit) {
      return { valid: false, message: "할인코드가 모두 소진되었습니다." };
    }
    if (input.orderAmount && input.orderAmount < promo.minOrderAmount) {
      return { valid: false, message: `최소 ${promo.minOrderAmount.toLocaleString()}원 이상 구매 시 사용 가능합니다.` };
    }
    if (promo.targetProductIds && input.productIds) {
      const ids = promo.targetProductIds.split(",").map(Number).filter(Boolean);
      if (!input.productIds.some(pid => ids.includes(pid))) {
        return { valid: false, message: "해당 상품에 적용되지 않는 할인코드입니다." };
      }
    }
    if (promo.targetCategoryIds && input.categoryIds) {
      const ids = promo.targetCategoryIds.split(",").map(Number).filter(Boolean);
      if (!input.categoryIds.some(cid => ids.includes(cid))) {
        return { valid: false, message: "해당 카테고리에 적용되지 않는 할인코드입니다." };
      }
    }

    const discountText = promo.discountType === "percent"
      ? `${promo.discountValue}%${promo.maxDiscountAmount ? ` (최대 ${promo.maxDiscountAmount.toLocaleString()}원)` : ""}`
      : `${promo.discountValue.toLocaleString()}원`;

    return { valid: true, promo, discountText };
  }),

  redeem: protectedProcedure.input(z.object({
    code: z.string().min(1),
    orderId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const promo = await db.getPromoCodeByCode(input.code);
    if (!promo) throw new TRPCError({ code: "NOT_FOUND", message: "존재하지 않는 할인코드입니다." });

    const userId = ctx.user.id;
    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "할인코드 사용 기간이 아닙니다." });
    }
    if (!promo.isActive) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "사용 할 수 없는 할인코드입니다." });
    }
    if (promo.totalUsageLimit !== -1 && promo.usedCount >= promo.totalUsageLimit) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "할인코드가 모두 소진되었습니다." });
    }

    const userUsageCount = await db.getPromoCodeUsageCountByUser(promo.id, userId);
    if (userUsageCount >= promo.perUserLimit) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `한 사람당 ${promo.perUserLimit}회만 사용 가능한 할인코드입니다.` });
    }

    await db.recordPromoCodeUsage(promo.id, userId, input.orderId);
    await db.incrementPromoCodeUsedCount(promo.id);

    const discountText = promo.discountType === "percent"
      ? `${promo.discountValue}%${promo.maxDiscountAmount ? ` (최대 ${promo.maxDiscountAmount.toLocaleString()}원)` : ""}`
      : `${promo.discountValue.toLocaleString()}원`;

    return { success: true, promoCodeId: promo.id, discountText, promoCodeName: promo.name };
  }),

  myUsageHistory: protectedProcedure.query(async ({ ctx }) => {
    return db.getPromoCodeUsageHistory(ctx.user.id);
  }),
});
