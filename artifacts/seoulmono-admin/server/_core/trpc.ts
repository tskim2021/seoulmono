import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// 쇼핑몰(g5) 실주문에 반영되지 않는 옛 a2_* 쓰기 프로시저. 호출되면 DB 오류 대신 분명한 안내를 낸다.
const LEGACY_ORDER_WRITES = new Set<string>([
  'admin.updateOrderStatus',
  'admin.bulkUpdateStatus',
  'admin.updateAdminNotes',
  'order.adminUpdateStatus',
  'order.adminPartialCancel',
  'order.adminUncancelItem',
  'order.adminUpdateItemStatus',
  'order.adminMarkOrderRefunded',
  'order.adminMarkRefunded',
  'order.adminMarkRefundPending',
  'bulkActions.updateOrdersStatus',
  'bulkActions.deleteOrders',
  'shipping.adminCreateShipment',
  'shipping.adminBulkCreateShipment',
  'shipping.adminUpdateShipmentStatus',
  'shipping.adminUpdateShipmentInfo',
  'shipping.adminConfirmCustoms',
  'shipping.adminRefreshTracking',
  'shipping.adminBulkRefreshTracking',
  'shipping.adminSyncAllTracking',
  'shipping.adminUpdateReturnRequest',
  'shipping.runSyncNow',
  'shipping.updateSchedulerConfig',
  'excelUpload.parseTrackingExcel',
  'excelUpload.bulkCreateShipments',
  'payment.adminConfirmPayment',
  'payment.adminCancelPaymentConfirmation',
  'payment.adminCreateBankAccount',
  'payment.adminUpdateBankAccount',
  'payment.adminDeleteBankAccount',
  'payment.adminUpdateAutoCancelHours',
]);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next, path } = opts;
    if (LEGACY_ORDER_WRITES.has(path)) {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: '이 기능은 실제 주문에 반영되지 않아 중지되었습니다. 「주문 처리 (출고)」 메뉴를 사용하세요.' });
    }

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
