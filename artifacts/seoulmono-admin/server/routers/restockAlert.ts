import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { restockAlerts, products, productOptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { createNotification } from "../db";

export const restockAlertRouter = router({
  // 재입고 알림 신청
  create: protectedProcedure
    .input(z.object({
      productId: z.number(),
      optionName: z.string().optional(),
      optionValue: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      // 중복 확인
      const existing = await db.select().from(restockAlerts).where(
        and(
          eq(restockAlerts.userId, ctx.user.id),
          eq(restockAlerts.productId, input.productId),
          input.optionName ? eq(restockAlerts.optionName, input.optionName) : undefined,
          input.optionValue ? eq(restockAlerts.optionValue, input.optionValue) : undefined
        )
      );
      
      if (existing.length > 0) {
        return { success: false, message: "이미 알림 신청한 상품입니다" };
      }
      
      await db.insert(restockAlerts).values({
        userId: ctx.user.id,
        productId: input.productId,
        optionName: input.optionName,
        optionValue: input.optionValue,
      });
      
      return { success: true, message: "재입고 알림이 신청되었습니다" };
    }),
  
  // 내 재입고 알림 목록
  myAlerts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const alerts = await db
      .select({
        id: restockAlerts.id,
        productId: restockAlerts.productId,
        productName: products.name,
        productSlug: products.slug,
        productThumbnail: products.thumbnail,
        optionName: restockAlerts.optionName,
        optionValue: restockAlerts.optionValue,
        isNotified: restockAlerts.isNotified,
        createdAt: restockAlerts.createdAt,
        notifiedAt: restockAlerts.notifiedAt,
      })
      .from(restockAlerts)
      .leftJoin(products, eq(restockAlerts.productId, products.id))
      .where(eq(restockAlerts.userId, ctx.user.id))
      .orderBy(restockAlerts.createdAt);
    
    return alerts;
  }),
  
  // 내 재입고 알림 목록 (list 별칭)
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const alerts = await db
      .select({
        id: restockAlerts.id,
        productId: restockAlerts.productId,
        productName: products.name,
        productSlug: products.slug,
        productThumbnail: products.thumbnail,
        optionName: restockAlerts.optionName,
        optionValue: restockAlerts.optionValue,
        isNotified: restockAlerts.isNotified,
        createdAt: restockAlerts.createdAt,
        notifiedAt: restockAlerts.notifiedAt,
      })
      .from(restockAlerts)
      .leftJoin(products, eq(restockAlerts.productId, products.id))
      .where(eq(restockAlerts.userId, ctx.user.id))
      .orderBy(restockAlerts.createdAt);
    
    return alerts;
  }),
  
  // 재입고 알림 삭제
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db.delete(restockAlerts).where(
        and(
          eq(restockAlerts.id, input.id),
          eq(restockAlerts.userId, ctx.user.id)
        )
      );
      return { success: true };
    }),
  
  // 재입고 알림 발송 (관리자 또는 시스템이 호출)
  checkAndNotify: protectedProcedure
    .input(z.object({
      productId: z.number(),
      optionName: z.string().optional(),
      optionValue: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      // 해당 상품/옵션에 대한 알림 신청자 조회
      const alerts = await db.select().from(restockAlerts).where(
        and(
          eq(restockAlerts.productId, input.productId),
          eq(restockAlerts.isNotified, 0),
          input.optionName ? eq(restockAlerts.optionName, input.optionName) : undefined,
          input.optionValue ? eq(restockAlerts.optionValue, input.optionValue) : undefined
        )
      );
      
      // 각 사용자에게 알림 발송
      for (const alert of alerts) {
        const product = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
        if (product.length === 0) continue;
        
        await createNotification(
          alert.userId,
          "system",
          `[재입고] ${product[0].name}${alert.optionValue ? ` (${alert.optionValue})` : ""} 상품이 재입고되었습니다!`,
          "/product/" + product[0].slug
        );
        
        // 알림 발송 표시
        await db.update(restockAlerts)
          .set({ isNotified: 1, notifiedAt: new Date() })
          .where(eq(restockAlerts.id, alert.id));
      }
      
      return { success: true, notifiedCount: alerts.length };
    }),
});
