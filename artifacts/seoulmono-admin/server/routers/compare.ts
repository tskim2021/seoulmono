import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const compareRouter = router({
  // 여러 상품 정보 한 번에 조회
  getProducts: publicProcedure
    .input(z.object({ productIds: z.array(z.number()).max(4) }))
    .query(async ({ input }) => {
      const products = await Promise.all(
        input.productIds.map(id => db.getProductById(id))
      );
      return products.filter(p => p !== null);
    }),
});
