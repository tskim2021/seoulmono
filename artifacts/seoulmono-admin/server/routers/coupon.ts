import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

const targetFields = {
  targetType: z.enum(["all", "product", "category"]).optional(),
  targetProductIds: z.string().nullable().optional(),
  targetCategoryIds: z.string().nullable().optional(),
  assignType: z.enum(["all", "specific"]).optional(),
  assignUserIds: z.string().nullable().optional(),
};

export const couponRouter = router({
  adminList: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllCoupons(input?.page ?? 1, input?.limit ?? 20);
  }),

  adminCreate: adminProcedure.input(z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.number().min(1),
    minOrderAmount: z.number().min(0).optional(),
    maxDiscountAmount: z.number().nullable().optional(),
    totalQuantity: z.number().optional(),
    perUserLimit: z.number().nullable().optional(),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.number().optional(),
    ...targetFields,
  })).mutation(async ({ input }) => {
    const id = await db.createCoupon({
      ...input,
      minOrderAmount: input.minOrderAmount ?? 0,
      maxDiscountAmount: input.maxDiscountAmount ?? null,
      totalQuantity: input.totalQuantity ?? -1,
      perUserLimit: input.perUserLimit ?? null,
      isActive: input.isActive ?? 1,
      targetType: input.targetType ?? "all",
      targetProductIds: input.targetProductIds ?? null,
      targetCategoryIds: input.targetCategoryIds ?? null,
      assignType: input.assignType ?? "all",
      assignUserIds: input.assignUserIds ?? null,
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
    totalQuantity: z.number().optional(),
    perUserLimit: z.number().nullable().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    isActive: z.number().optional(),
    ...targetFields,
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCoupon(id, data as any);
    return { success: true };
  }),

  adminDelete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCoupon(input.id);
    return { success: true };
  }),

  adminIssueCoupon: adminProcedure.input(z.object({
    couponId: z.number(),
    userIds: z.array(z.number()),
  })).mutation(async ({ input }) => {
    let issued = 0;
    for (const userId of input.userIds) {
      try {
        await db.issueCouponToUser(userId, input.couponId, true);
        issued++;
      } catch {}
    }
    return { success: true, issued };
  }),

  adminIssueToAll: adminProcedure.input(z.object({
    couponId: z.number(),
  })).mutation(async ({ input }) => {
    const userIds = await db.getAllUserIds();
    let issued = 0;
    for (const userId of userIds) {
      try {
        await db.issueCouponToUser(userId, input.couponId, true);
        issued++;
      } catch {}
    }
    return { success: true, issued, total: userIds.length };
  }),

  available: protectedProcedure.query(async ({ ctx }) => {
    return db.getActiveCouponsForDownload(ctx.user.id);
  }),

  myCoupons: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserCoupons(ctx.user.id);
  }),

  forOrder: protectedProcedure.input(z.object({
    orderAmount: z.number(),
    productIds: z.array(z.number()).optional(),
    categoryIds: z.array(z.number()).optional(),
  })).query(async ({ ctx, input }) => {
    return db.getAvailableUserCoupons(ctx.user.id, input.orderAmount, input.productIds, input.categoryIds);
  }),

  download: protectedProcedure.input(z.object({
    couponId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    try {
      await db.issueCouponToUser(ctx.user.id, input.couponId);
      return { success: true };
    } catch (err: any) {
      throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
    }
  }),

  downloadByCode: protectedProcedure.input(z.object({
    code: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const coupon = await db.getCouponByCode(input.code);
    if (!coupon) throw new TRPCError({ code: "NOT_FOUND", message: "存在しないクーポンコードです。" });
    try {
      const userCouponId = await db.issueCouponToUser(ctx.user.id, coupon.id);
      return { success: true, couponName: coupon.name, couponId: coupon.id, userCouponId };
    } catch (err: any) {
      throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
    }
  }),
});
