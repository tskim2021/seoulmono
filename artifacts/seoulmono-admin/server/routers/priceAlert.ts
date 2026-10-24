import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const priceAlertRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getPriceAlerts(ctx.user.id);
  }),

  create: protectedProcedure.input(z.object({
    productId: z.number(),
    originalPrice: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const id = await db.createPriceAlert({
      userId: ctx.user.id,
      productId: input.productId,
      originalPrice: input.originalPrice,
    });
    return { success: true, id };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await db.deletePriceAlert(input.id, ctx.user.id);
    return { success: true };
  }),
});
