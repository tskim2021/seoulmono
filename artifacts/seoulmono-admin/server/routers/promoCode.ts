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
    if (!promo) return { valid: false, message: "存在しない割引コードです。" };
    if (!promo.isActive) return { valid: false, message: "ご利用いただけない割引コードです。" };

    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      return { valid: false, message: "割引コードの利用期間外です。" };
    }
    if (promo.totalUsageLimit !== -1 && promo.usedCount >= promo.totalUsageLimit) {
      return { valid: false, message: "割引コードは上限に達しました。" };
    }
    if (input.orderAmount && input.orderAmount < promo.minOrderAmount) {
      return { valid: false, message: `${promo.minOrderAmount.toLocaleString()}円以上のご購入でご利用いただけます。` };
    }
    if (promo.targetProductIds && input.productIds) {
      const ids = promo.targetProductIds.split(",").map(Number).filter(Boolean);
      if (!input.productIds.some(pid => ids.includes(pid))) {
        return { valid: false, message: "この商品には適用できない割引コードです。" };
      }
    }
    if (promo.targetCategoryIds && input.categoryIds) {
      const ids = promo.targetCategoryIds.split(",").map(Number).filter(Boolean);
      if (!input.categoryIds.some(cid => ids.includes(cid))) {
        return { valid: false, message: "このカテゴリには適用できない割引コードです。" };
      }
    }

    const discountText = promo.discountType === "percent"
      ? `${promo.discountValue}%${promo.maxDiscountAmount ? ` (最大${promo.maxDiscountAmount.toLocaleString()}円)` : ""}`
      : `${promo.discountValue.toLocaleString()}円`;

    return { valid: true, promo, discountText };
  }),

  redeem: protectedProcedure.input(z.object({
    code: z.string().min(1),
    orderId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const promo = await db.getPromoCodeByCode(input.code);
    if (!promo) throw new TRPCError({ code: "NOT_FOUND", message: "存在しない割引コードです。" });

    const userId = ctx.user.id;
    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "割引コードの利用期間外です。" });
    }
    if (!promo.isActive) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "ご利用いただけない割引コードです。" });
    }
    if (promo.totalUsageLimit !== -1 && promo.usedCount >= promo.totalUsageLimit) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "割引コードは上限に達しました。" });
    }

    const userUsageCount = await db.getPromoCodeUsageCountByUser(promo.id, userId);
    if (userUsageCount >= promo.perUserLimit) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `お一人様${promo.perUserLimit}回までご利用いただける割引コードです。` });
    }

    await db.recordPromoCodeUsage(promo.id, userId, input.orderId);
    await db.incrementPromoCodeUsedCount(promo.id);

    const discountText = promo.discountType === "percent"
      ? `${promo.discountValue}%${promo.maxDiscountAmount ? ` (最大${promo.maxDiscountAmount.toLocaleString()}円)` : ""}`
      : `${promo.discountValue.toLocaleString()}円`;

    return { success: true, promoCodeId: promo.id, discountText, promoCodeName: promo.name };
  }),

  myUsageHistory: protectedProcedure.query(async ({ ctx }) => {
    return db.getPromoCodeUsageHistory(ctx.user.id);
  }),
});
