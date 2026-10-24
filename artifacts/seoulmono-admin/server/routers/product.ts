import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

const optionValueSchema = z.object({ value: z.string().min(1), englishValue: z.string().optional(), price: z.number().min(0), stock: z.number().min(0).optional() });

export const productRouter = router({
  list: publicProcedure.input(z.object({
    categoryId: z.number().optional(),
    search: z.string().optional(),
    sort: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    isFeatured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    isBest: z.boolean().optional(),
    onSale: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    // Record search keyword if present
    if (input?.search && input.search.trim().length >= 2) {
      db.recordSearchKeyword(input.search).catch(() => {});
    }
    return db.getProducts(input ?? {});
  }),
  popularKeywords: publicProcedure.query(async () => {
    return db.getPopularKeywords(10);
  }),
  autocomplete: publicProcedure.input(z.object({
    query: z.string().min(1).max(50),
  })).query(async ({ input }) => {
    const keywordSuggestions = await db.searchKeywordSuggestions(input.query, 4);
    const productSuggestions = await db.searchProductNames(input.query, 6);
    const seen = new Set(keywordSuggestions.map((s: any) => s.keyword));
    const combined = [...keywordSuggestions];
    for (const p of productSuggestions) {
      if (!seen.has(p.keyword)) {
        combined.push(p);
        seen.add(p.keyword);
      }
    }
    return combined.slice(0, 8);
  }),
  getRelated: adminProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
    return db.getRelatedProducts(input.productId);
  }),
  setRelated: adminProcedure.input(z.object({ productId: z.number(), relatedIds: z.array(z.number()).max(12) })).mutation(async ({ input }) => {
    const count = await db.setRelatedProducts(input.productId, input.relatedIds);
    return { success: true, count };
  }),
  getByIds: publicProcedure.input(z.object({ ids: z.array(z.number()) })).query(async ({ input }) => {
    return db.getProductsByIds(input.ids);
  }),
  getByItId: publicProcedure.input(z.object({ itId: z.string() })).query(async ({ input, ctx }) => {
    const product = await db.getProductByItId(input.itId);
    if (!product) return null;
    await db.incrementViewCount(product.id);
    const options = await db.getProductOptions(product.id);
    const reviews = await db.getProductReviews(product.id, 1, 5);
    const gradeOrder = { bronze: 0, silver: 1, gold: 2, vip: 3, vvip: 4 };
    const userGrade = ctx.user?.grade ?? "bronze";
    const canPurchase = gradeOrder[userGrade] >= gradeOrder[product.minGrade];
    return { ...product, options, reviews: reviews.reviews, reviewTotal: reviews.total, canPurchase };
  }),
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input, ctx }) => {
    const product = await db.getProductBySlug(input.slug);
    if (!product) return null;
    await db.incrementViewCount(product.id);
    const options = await db.getProductOptions(product.id);
    const reviews = await db.getProductReviews(product.id, 1, 5);
    
    // 등급 제한 확인
    const gradeOrder = { bronze: 0, silver: 1, gold: 2, vip: 3, vvip: 4 };
    const userGrade = ctx.user?.grade ?? "bronze";
    const canPurchase = gradeOrder[userGrade] >= gradeOrder[product.minGrade];
    
    return { ...product, options, reviews: reviews.reviews, reviewTotal: reviews.total, canPurchase };
  }),
  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getProductById(input.id);
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    categoryId: z.number(),
    description: z.string().optional(),
    content: z.string().optional(),
    price: z.number().min(0),
    salePrice: z.number().nullable().optional(),
    stock: z.number().min(0).optional(),
    images: z.array(z.string()).optional(),
    thumbnail: z.string().optional(),
    status: z.enum(["active", "inactive", "soldout"]).optional(),
    isFeatured: z.number().optional(),
    isNew: z.number().optional(),
    isBest: z.number().optional(),
    noDiscount: z.number().optional(),
    pointRate: z.number().optional(),
    pointRateType: z.enum(["percent", "fixed"]).optional(),
    sortOrder: z.number().optional(),
    hashtags: z.array(z.string()).optional(),
    options: z.array(z.object({
      name: z.string().min(1),
      values: z.array(optionValueSchema).min(1),
      isRequired: z.number().optional(),
      sortOrder: z.number().optional(),
    })).optional(),
  })).mutation(async ({ input }) => {
    const { options, ...productData } = input;
    const productId = await db.createProduct(productData as any);
    if (options && productId) {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await db.createProductOption({
          productId,
          name: opt.name,
          values: opt.values,
          sortOrder: opt.sortOrder ?? i,
          isRequired: opt.isRequired ?? 1,
        });
      }
    }
    return { success: true, productId };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    categoryId: z.number().optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    price: z.number().min(0).optional(),
    salePrice: z.number().nullable().optional(),
    stock: z.number().min(0).optional(),
    images: z.array(z.string()).optional(),
    thumbnail: z.string().optional(),
    status: z.enum(["active", "inactive", "soldout"]).optional(),
    isFeatured: z.number().optional(),
    isNew: z.number().optional(),
    isBest: z.number().optional(),
    noDiscount: z.number().optional(),
    pointRate: z.number().optional(),
    pointRateType: z.enum(["percent", "fixed"]).optional(),
    sortOrder: z.number().optional(),
    hashtags: z.array(z.string()).optional(),
    options: z.array(z.object({
      name: z.string().min(1),
      values: z.array(optionValueSchema).min(1),
      isRequired: z.number().optional(),
      sortOrder: z.number().optional(),
    })).optional(),
  })).mutation(async ({ input }) => {
    const { id, options, ...data } = input;
    
    // 재입고 알림 발송 체크 (stock 변경 시)
    if (data.stock !== undefined) {
      const prevProduct = await db.getProductById(id);
      if (prevProduct && prevProduct.stock === 0 && data.stock > 0) {
        // 품절에서 재입고로 변경된 경우 - 재입고 알림 발송
        const alerts = await db.getRestockAlertsByProductId(id);
        for (const alert of alerts) {
          try {
            await db.createNotification(
              alert.userId,
              "system",
              "재입고 알림",
              `신청하신 상품 "${prevProduct.name}"이 재입고되었습니다. 지금 바로 구매하세요!`,
              `/products/${prevProduct.slug}`
            );
          } catch (e) {
            console.error(`Failed to send restock notification to user ${alert.userId}:`, e);
          }
        }
        // 알림 발송 후 재입고 알림 삭제
        await db.deleteRestockAlertsByProductId(id);
      }
    }
    
    // 가격 변동 감지를 위해 업데이트 전 현재 가격 스냅샷
    let priceChangeParams: { productId: number; name: string; slug: string; newPrice: number } | null = null;
    if (data.price !== undefined || data.salePrice !== undefined) {
      const prevProduct = await db.getProductById(id);
      if (prevProduct) {
        const prevEffectivePrice = prevProduct.salePrice || prevProduct.price;
        const newSalePrice = data.salePrice !== undefined ? data.salePrice : prevProduct.salePrice;
        const newBasePrice = data.price !== undefined ? data.price : prevProduct.price;
        const resolvedNewPrice = newSalePrice || newBasePrice;
        if (resolvedNewPrice !== prevEffectivePrice) {
          priceChangeParams = { productId: id, name: prevProduct.name, slug: prevProduct.slug, newPrice: resolvedNewPrice };
        }
      }
    }

    await db.updateProduct(id, data as any);

    // 상품 업데이트 성공 후 가격 변동 알림 발송
    if (priceChangeParams) {
      try {
        await db.notifyPriceChanges(priceChangeParams.productId, priceChangeParams.name, priceChangeParams.slug, priceChangeParams.newPrice);
      } catch (e) {
        console.error("[priceAlert] notifyPriceChanges failed:", e);
      }
    }
    if (options) {
      await db.deleteProductOptions(id);
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await db.createProductOption({
          productId: id,
          name: opt.name,
          values: opt.values,
          sortOrder: opt.sortOrder ?? i,
          isRequired: opt.isRequired ?? 1,
        });
      }
    }
    return { success: true };
  }),
  // ─── Option CRUD (individual) ───
  getOptions: publicProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
    return db.getProductOptions(input.productId);
  }),
  createOption: adminProcedure.input(z.object({
    productId: z.number(),
    name: z.string().min(1),
    values: z.array(optionValueSchema).min(1),
    sortOrder: z.number().optional(),
    isRequired: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createProductOption(input);
    return { success: true, id };
  }),
  updateOption: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    values: z.array(optionValueSchema).optional(),
    sortOrder: z.number().optional(),
    isRequired: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateProductOption(id, data);
    // TODO: 재고 증가 시 재입고 알림 자동 발송 (현재는 수동 호출)
    return { success: true };
  }),
  deleteOption: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteProductOption(input.id);
    return { success: true };
  }),
  adminBatchUpdateSortOrder: adminProcedure.input(z.array(z.object({
    id: z.number(),
    sortOrder: z.number(),
  }))).mutation(async ({ input }) => {
    await db.batchUpdateProductsSortOrder(input);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteProductOptions(input.id);
    await db.deleteProduct(input.id);
    return { success: true };
  }),
  publicBanners: publicProcedure.query(async () => {
    return db.getActiveBanners();
  }),
  topBannerText: publicProcedure.query(async () => {
    const val = await db.getSetting("topBannerText");
    return { text: val ?? "🌿 인도 직배송 해외직구 전문 쇼핑몰 · 탈모학교" };
  }),
});
