import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { products, orders, users } from "../../drizzle/schema";
import { inArray, eq } from "drizzle-orm";

export const bulkActionsRouter = router({
  // 상품 일괄 삭제
  deleteProducts: adminProcedure
    .input(z.object({ productIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.delete(products).where(inArray(products.id, input.productIds));
      return { success: true, count: input.productIds.length };
    }),

  // 상품 일괄 카테고리 변경
  updateProductsCategory: adminProcedure
    .input(z.object({ productIds: z.array(z.number()), categoryId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.update(products)
        .set({ categoryId: input.categoryId })
        .where(inArray(products.id, input.productIds));
      return { success: true, count: input.productIds.length };
    }),

  // 상품 일괄 상태 변경
  updateProductsStatus: adminProcedure
    .input(z.object({ 
      productIds: z.array(z.number()), 
      status: z.enum(["active", "inactive", "soldout"]) 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.update(products)
        .set({ status: input.status })
        .where(inArray(products.id, input.productIds));
      return { success: true, count: input.productIds.length };
    }),

  // 상품 일괄 포인트 적립률 변경
  updateProductsPointRate: adminProcedure
    .input(z.object({ productIds: z.array(z.number()), pointRate: z.number().min(0), pointRateType: z.enum(["percent", "fixed"]).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      const setData: any = { pointRate: input.pointRate };
      if (input.pointRateType) setData.pointRateType = input.pointRateType;
      await db.update(products)
        .set(setData)
        .where(inArray(products.id, input.productIds));
      return { success: true, count: input.productIds.length };
    }),

  updateProductsFlags: adminProcedure
    .input(z.object({
      productIds: z.array(z.number()),
      flag: z.enum(["isFeatured", "isNew", "isBest"]),
      value: z.number().min(0).max(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.update(products)
        .set({ [input.flag]: input.value })
        .where(inArray(products.id, input.productIds));
      return { success: true, count: input.productIds.length };
    }),

  // 상품 일괄 특가(할인가) 설정
  updateProductsSalePrice: adminProcedure
    .input(z.object({
      productIds: z.array(z.number()),
      salePrice: z.number().min(0).nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.update(products)
        .set({ salePrice: input.salePrice })
        .where(inArray(products.id, input.productIds));
      return { success: true, count: input.productIds.length };
    }),

  // 주문 일괄 상태 변경
  updateOrdersStatus: adminProcedure
    .input(z.object({ 
      orderIds: z.array(z.number()), 
      status: z.enum(["pending", "paid", "preparing", "shipping", "delivered", "cancelled", "refunded", "customs_hold"]) 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.update(orders)
        .set({ status: input.status })
        .where(inArray(orders.id, input.orderIds));
      return { success: true, count: input.orderIds.length };
    }),

  // 주문 일괄 삭제
  deleteOrders: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.delete(orders).where(inArray(orders.id, input.ids));
      return { success: true, count: input.ids.length };
    }),

  // 회원 일괄 등급 변경
  updateUsersGrade: adminProcedure
    .input(z.object({ 
      userIds: z.array(z.number()), 
      grade: z.enum(["bronze", "silver", "gold", "vip", "vvip"]) 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.update(users)
        .set({ grade: input.grade })
        .where(inArray(users.id, input.userIds));
      return { success: true, count: input.userIds.length };
    }),

  // 회원 일괄 역할 변경
  updateUsersRole: adminProcedure
    .input(z.object({ 
      userIds: z.array(z.number()), 
      role: z.enum(["user", "admin"]) 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.update(users)
        .set({ role: input.role })
        .where(inArray(users.id, input.userIds));
      return { success: true, count: input.userIds.length };
    }),

  // 회원 일괄 삭제
  deleteUsers: adminProcedure
    .input(z.object({ userIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.delete(users).where(inArray(users.id, input.userIds));
      return { success: true, count: input.userIds.length };
    }),
});
