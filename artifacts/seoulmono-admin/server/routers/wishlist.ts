import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const wishlistRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getWishlistItems(ctx.user.id);
  }),
  toggle: protectedProcedure.input(z.object({ productId: z.number() })).mutation(async ({ ctx, input }) => {
    const isAdded = await db.toggleWishlist(ctx.user.id, input.productId);
    return { success: true, isAdded };
  }),
  check: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ ctx, input }) => {
    return db.isInWishlist(ctx.user.id, input.productId);
  }),
});
