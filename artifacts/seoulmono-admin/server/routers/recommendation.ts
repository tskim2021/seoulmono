import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { products, orderItems, orders, wishlistItems, cartItems } from "../../drizzle/schema";
import { eq, and, desc, ne, inArray, notInArray, sql, isNotNull } from "drizzle-orm";

/**
 * 상품 추천 알고리즘
 * 
 * 1. 협업 필터링 (Collaborative Filtering)
 *    - "이 상품을 구매한 사람들이 함께 구매한 상품" 추천
 *    - 주문 이력 기반으로 상품 간 연관성 계산
 * 
 * 2. 콘텐츠 기반 필터링 (Content-Based Filtering)
 *    - 같은 카테고리 + 비슷한 가격대 상품 추천
 *    - 현재 보고 있는 상품과 유사한 상품 추천
 * 
 * 3. 개인화 추천 (Personalized)
 *    - 사용자의 구매 이력, 위시리스트, 장바구니 기반 추천
 *    - 최근 본 상품의 카테고리 기반 추천
 * 
 * 4. 인기도 기반 (Popularity-Based)
 *    - 조회수, 판매량, 평점 기반 추천
 */

export const recommendationRouter = router({
  // 1. 함께 구매한 상품 추천 (협업 필터링)
  boughtTogether: publicProcedure.input(z.object({
    productId: z.number(),
    limit: z.number().default(6),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    // 이 상품을 포함한 주문의 다른 상품들 찾기
    const relatedItems = await db
      .select({
        productId: orderItems.productId,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(orderItems)
      .where(
        inArray(
          orderItems.orderId,
          db.select({ orderId: orderItems.orderId })
            .from(orderItems)
            .where(eq(orderItems.productId, input.productId))
        )
      )
      .groupBy(orderItems.productId)
      .having(ne(orderItems.productId, input.productId))
      .orderBy(desc(sql`count`))
      .limit(input.limit);

    if (relatedItems.length === 0) return [];

    const productIds = relatedItems.map((r: { productId: number }) => r.productId);
    const result = await db
      .select()
      .from(products)
      .where(and(
        inArray(products.id, productIds),
        eq(products.status, "active")
      ));

    // 원래 순서 유지
    return productIds
      .map((id: number) => result.find((p: { id: number }) => p.id === id))
      .filter(Boolean);
  }),

  // 2. 유사 상품 추천 (콘텐츠 기반)
  similar: publicProcedure.input(z.object({
    productId: z.number(),
    limit: z.number().default(6),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    // 현재 상품 정보 가져오기
    const [currentProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId))
      .limit(1);

    if (!currentProduct) return [];

    const price = currentProduct.salePrice ?? currentProduct.price;
    const priceMin = Math.floor(price * 0.5);
    const priceMax = Math.ceil(price * 2.0);

    // 같은 카테고리 + 비슷한 가격대 상품
    const result = await db
      .select()
      .from(products)
      .where(and(
        eq(products.categoryId, currentProduct.categoryId),
        ne(products.id, input.productId),
        eq(products.status, "active"),
        sql`COALESCE(${products.salePrice}, ${products.price}) BETWEEN ${priceMin} AND ${priceMax}`
      ))
      .orderBy(desc(products.avgRating), desc(products.viewCount))
      .limit(input.limit);

    // 같은 카테고리에서 부족하면 다른 카테고리에서 보충
    if (result.length < input.limit) {
      const remaining = input.limit - result.length;
      const existingIds = [input.productId, ...result.map((p: { id: number }) => p.id)];
      const moreProducts = await db
        .select()
        .from(products)
        .where(and(
          eq(products.status, "active"),
          notInArray(products.id, existingIds),
          sql`COALESCE(${products.salePrice}, ${products.price}) BETWEEN ${priceMin} AND ${priceMax}`
        ))
        .orderBy(desc(products.avgRating), desc(products.viewCount))
        .limit(remaining);
      result.push(...moreProducts);
    }

    return result;
  }),

  // 3. 개인화 추천 (로그인 사용자)
  personalized: protectedProcedure.input(z.object({
    limit: z.number().default(8),
  }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { products: [], reason: "サービスをご利用いただけません" };
    const limit = input?.limit ?? 8;

    // 사용자의 구매 이력에서 카테고리 선호도 분석
    const purchasedCategories = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.userId, ctx.user.id))
      .groupBy(products.categoryId)
      .orderBy(desc(sql`count`))
      .limit(3);

    // 위시리스트 카테고리 분석
    const wishlistCategories = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, ctx.user.id))
      .groupBy(products.categoryId)
      .orderBy(desc(sql`count`))
      .limit(3);

    // 이미 구매한 상품 ID 목록
    const purchasedProductIds = await db
      .select({ productId: orderItems.productId })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.userId, ctx.user.id));

    const excludeIds = purchasedProductIds.map((p: { productId: number }) => p.productId);

    // 선호 카테고리 합산
    const categoryScores = new Map<number, number>();
    purchasedCategories.forEach((c: { categoryId: number; count: number }) => {
      categoryScores.set(c.categoryId, (categoryScores.get(c.categoryId) ?? 0) + c.count * 3);
    });
    wishlistCategories.forEach((c: { categoryId: number; count: number }) => {
      categoryScores.set(c.categoryId, (categoryScores.get(c.categoryId) ?? 0) + c.count * 2);
    });

    const topCategories = Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    let reason = "あなたへのおすすめ";

    if (topCategories.length > 0) {
      // 선호 카테고리에서 미구매 인기 상품 추천
      const conditions = [
        eq(products.status, "active"),
        inArray(products.categoryId, topCategories),
      ];
      if (excludeIds.length > 0) {
        conditions.push(notInArray(products.id, excludeIds));
      }

      const recommended = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.avgRating), desc(products.viewCount))
        .limit(limit);

      if (recommended.length >= 4) {
        reason = "購入履歴に基づくおすすめ";
        return { products: recommended, reason };
      }
    }

    // 데이터 부족 시 인기 상품으로 대체
    const fallbackConditions = [eq(products.status, "active")];
    if (excludeIds.length > 0) {
      fallbackConditions.push(notInArray(products.id, excludeIds));
    }

    const popular = await db
      .select()
      .from(products)
      .where(and(...fallbackConditions))
      .orderBy(desc(products.viewCount), desc(products.avgRating))
      .limit(limit);

    reason = topCategories.length > 0 ? "関心のあるカテゴリに基づくおすすめ" : "人気商品のおすすめ";
    return { products: popular, reason };
  }),

  // 4. 실시간 트렌드 상품 (인기도 기반)
  trending: publicProcedure.input(z.object({
    limit: z.number().default(8),
    period: z.enum(["day", "week", "month"]).default("week"),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const limit = input?.limit ?? 8;
    const period = input?.period ?? "week";

    // 기간별 판매량 기반 트렌드
    const periodDays = period === "day" ? 1 : period === "week" ? 7 : 30;
    const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const trendingProducts = await db
      .select({
        productId: orderItems.productId,
        salesCount: sql<number>`SUM(${orderItems.quantity})`.as("salesCount"),
      })
      .from(orderItems)
      .where(sql`${orderItems.createdAt} >= ${sinceDate}`)
      .groupBy(orderItems.productId)
      .orderBy(desc(sql`salesCount`))
      .limit(limit);

    if (trendingProducts.length === 0) {
      // 판매 데이터 없으면 조회수 기반
      return db
        .select()
        .from(products)
        .where(eq(products.status, "active"))
        .orderBy(desc(products.viewCount))
        .limit(limit);
    }

    const productIds = trendingProducts.map((t: { productId: number }) => t.productId);
    const result = await db
      .select()
      .from(products)
      .where(and(
        inArray(products.id, productIds),
        eq(products.status, "active")
      ));

    return productIds
      .map((id: number) => result.find((p: { id: number }) => p.id === id))
      .filter(Boolean);
  }),
});
