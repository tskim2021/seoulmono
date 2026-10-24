import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const cartRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getCartItems(ctx.user.id);
  }),
  summary: protectedProcedure.query(async ({ ctx }) => {
    const items = await db.getCartItems(ctx.user.id);
    const benefit = await db.getGradeBenefit(ctx.user.grade);
    
    const subtotal = items.reduce((sum, item) => {
      const price = item.optionPrice ?? item.product?.salePrice ?? item.product?.price ?? 0;
      return sum + (price * item.quantity);
    }, 0);
    const gradeDiscount = benefit ? Math.floor(subtotal * benefit.discountRate / 100) : 0;
    const total = subtotal - gradeDiscount;
    const freeShippingThreshold = benefit?.freeShippingThreshold ?? 50000;
    const shippingFee = (freeShippingThreshold === 0 || total >= freeShippingThreshold) ? 0 : 3000;
    
    return {
      items,
      subtotal,
      gradeDiscount,
      shippingFee,
      total: total + shippingFee,
      benefit: benefit ? {
        grade: ctx.user.grade,
        discountRate: benefit.discountRate,
        pointRate: benefit.pointRate,
        freeShippingThreshold: benefit.freeShippingThreshold,
      } : null,
    };
  }),
  add: protectedProcedure.input(z.object({
    productId: z.number(),
    quantity: z.number().min(1),
    options: z.record(z.string(), z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    // 등급 제한 확인
    const product = await db.getProductById(input.productId);
    if (!product) throw new Error("상품을 찾을 수 없습니다");
    
    const gradeOrder = { bronze: 0, silver: 1, gold: 2, vip: 3, vvip: 4 };
    const userGrade = ctx.user.grade;
    const canPurchase = gradeOrder[userGrade] >= gradeOrder[product.minGrade];
    
    if (!canPurchase) {
      const gradeLabels: Record<string, string> = {
        bronze: "브론즈",
        silver: "실버",
        gold: "골드",
        vip: "VIP",
        vvip: "VVIP",
      };
      throw new Error(`이 상품은 ${gradeLabels[product.minGrade]} 등급 이상부터 구매 가능합니다.`);
    }
    
    await db.addToCart(ctx.user.id, input.productId, input.quantity, input.options);
    return { success: true };
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    quantity: z.number().min(1).optional(),
    options: z.record(z.string(), z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    await db.updateCartItem(id, ctx.user.id, data);
    return { success: true };
  }),
  remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await db.removeCartItem(input.id, ctx.user.id);
    return { success: true };
  }),
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await db.clearCart(ctx.user.id);
    return { success: true };
  }),
  adminCarts: adminProcedure.input(z.object({
    search: z.string().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(20),
  })).query(async ({ input }) => {
    return db.getAdminCarts(input);
  }),
  adminConvertCartToOrder: adminProcedure.input(z.object({
    userId: z.number(),
    recipientName: z.string().min(1),
    recipientNameEn: z.string().optional(),
    recipientPhone: z.string().min(1),
    zipCode: z.string().min(1),
    address1: z.string().min(1),
    address2: z.string().optional(),
    addressEn1: z.string().optional(),
    addressEn2: z.string().optional(),
    memo: z.string().optional(),
    paymentStatus: z.enum(["pending", "paid"]),
    clearCart: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    const cartItemsData = await db.getCartItems(input.userId);
    if (cartItemsData.length === 0) {
      throw new Error("장바구니가 비어있습니다.");
    }

    const items = cartItemsData.map(i => ({
      productId: i.productId,
      productName: i.product?.name ?? `상품 #${i.productId}`,
      productThumbnail: i.product?.thumbnail ?? undefined,
      price: i.optionPrice ?? i.product?.salePrice ?? i.product?.price ?? 0,
      quantity: i.quantity,
      options: i.options as Record<string, string> | undefined,
    }));

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderNumber = db.generateOrderNumber();

    const orderId = await db.createOrder({
      userId: input.userId,
      orderNumber,
      source: "admin",
      totalAmount: subtotal,
      shippingFee: 0,
      pointsUsed: 0,
      pointsEarned: 0,
      couponId: null,
      couponDiscount: 0,
      discountAmount: 0,
      recipientName: input.recipientName,
      recipientNameEn: input.recipientNameEn ?? null,
      recipientPhone: input.recipientPhone,
      zipCode: input.zipCode,
      address1: input.address1,
      address2: input.address2 ?? null,
      addressEn1: input.addressEn1 ?? null,
      addressEn2: input.addressEn2 ?? null,
      memo: input.memo ?? null,
      status: input.paymentStatus === "paid" ? "paid" : "pending",
    }, items);

    if (input.clearCart) {
      await db.clearCart(input.userId);
    }

    await db.logAdminAction({
      adminId: ctx.user.id,
      adminName: ctx.user.name ?? ctx.user.email ?? "admin",
      action: "cart_convert_to_order",
      entityType: "order",
      entityId: orderId,
      description: `장바구니 주문 전환: userId=${input.userId}, orderNumber=${orderNumber}`,
    });

    return { orderId, orderNumber };
  }),
});
