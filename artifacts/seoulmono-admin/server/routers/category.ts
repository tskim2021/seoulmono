import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const categoryRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllCategories();
  }),
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    return db.getCategoryBySlug(input.slug);
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    parentId: z.number().nullable().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    await db.createCategory({ ...input, parentId: input.parentId ?? null, isActive: 1 });
    return { success: true };
  }),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    parentId: z.number().nullable().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCategory(id, data);
    return { success: true };
  }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCategory(input.id);
    return { success: true };
  }),
});
