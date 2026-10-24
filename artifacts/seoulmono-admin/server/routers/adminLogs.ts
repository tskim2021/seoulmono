import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const adminLogsRouter = router({
  list: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    adminId: z.number().optional(),
    action: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAdminActionLogs({
      page: input?.page ?? 1,
      limit: input?.limit ?? 50,
      adminId: input?.adminId,
      action: input?.action,
      entityType: input?.entityType,
      entityId: input?.entityId,
      dateFrom: input?.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input?.dateTo ? new Date(input.dateTo) : undefined,
    });
  }),

  adminList: adminProcedure.query(async () => {
    const result = await db.getAdminActionLogs({ page: 1, limit: 1000 });
    const seen = new Map<number, { name: string; email: string }>();
    for (const row of result.rows) {
      if (!seen.has(row.adminId)) seen.set(row.adminId, { name: row.adminName, email: row.adminEmail ?? "" });
    }
    return Array.from(seen.entries()).map(([id, info]) => ({ id, name: info.name, email: info.email }));
  }),
});
