import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import * as g5stats from "../g5stats";
import { storagePut } from "../storage";
import fs2adm from "fs";
import path2adm from "path";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { gnuboardPasswordHash } from "../g5";
import { reviewPointSettings, siteSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";

export const adminRouter = router({
  stats: adminProcedure.query(async () => {
    return db.getAdminStats();
  }),
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user.role === "admin";
  }),

  // 통계 대시보드 강화
  salesTrend: adminProcedure.input(z.object({
    period: z.enum(["daily", "weekly", "monthly"]),
    days: z.number().optional(),
  })).query(async ({ input }) => {
    return g5stats.getSalesTrend(input.period, input.days ?? 30);
  }),
  topProducts: adminProcedure.input(z.object({
    limit: z.number().optional(),
  })).query(async ({ input }) => {
    return g5stats.getTopProducts(input.limit ?? 10);
  }),
  newUsersTrend: adminProcedure.input(z.object({
    days: z.number().optional(),
  })).query(async ({ input }) => {
    return g5stats.getNewUsersTrend(input.days ?? 30);
  }),

  // ─── Categories ───
  categories: adminProcedure.query(async () => {
    return db.getAllCategoriesAdmin();
  }),
  createCategory: adminProcedure.input(z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    parentId: z.number().nullable().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    await db.createCategory(input as any);
    return { success: true };
  }),
  updateCategory: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    slug: z.string().optional(),
    parentId: z.number().nullable().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateCategory(id, data as any);
    return { success: true };
  }),
  deleteCategory: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteCategory(input.id);
    return { success: true };
  }),

  // ─── Products ───
  products: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    categoryId: z.number().optional(),
    parentCategoryId: z.number().optional(),
    sort: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getProducts({
      page: input?.page ?? 1,
      limit: input?.limit ?? 50,
      search: input?.search,
      status: "all",
      categoryId: input?.categoryId,
      parentCategoryId: input?.parentCategoryId,
      sort: input?.sort,
    });
  }),
  createProduct: adminProcedure.input(z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    categoryId: z.number(),
    price: z.number().min(0),
    salePrice: z.number().nullable().optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    thumbnail: z.string().optional(),
    images: z.any().optional(),
    stock: z.number().optional(),
    status: z.string().optional(),
    isFeatured: z.number().optional(),
    isNew: z.number().optional(),
    isBest: z.number().optional(),
    pointRate: z.number().min(0).optional(),
    pointRateType: z.enum(["percent", "fixed"]).optional(),
  })).mutation(async ({ input }) => {
    const defaultRate = await db.getSetting("defaultProductPointRate");
    const productData = {
      ...input,
      pointRate: input.pointRate ?? Number(defaultRate ?? "0"),
      pointRateType: input.pointRateType ?? "percent",
    };
    const id = await db.createProduct(productData as any);
    return { success: true, id };
  }),
  updateProduct: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    slug: z.string().optional(),
    categoryId: z.number().optional(),
    price: z.number().optional(),
    salePrice: z.number().nullable().optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    thumbnail: z.string().optional(),
    images: z.any().optional(),
    stock: z.number().optional(),
    status: z.string().optional(),
    isFeatured: z.number().optional(),
    isNew: z.number().optional(),
    isBest: z.number().optional(),
    pointRate: z.number().min(0).optional(),
    pointRateType: z.enum(["percent", "fixed"]).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateProduct(id, data as any);
    return { success: true };
  }),
  deleteProduct: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteProduct(input.id);
    return { success: true };
  }),

  // ─── Orders ───
  orders: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    status: z.string().optional(),
    noTrackingNumber: z.boolean().optional(),
    source: z.string().optional(),
    search: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    paymentMethod: z.string().optional(),
    sortBy: z.string().optional(),
    sortAsc: z.boolean().optional(),
    hasRefund: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllOrders(
      input?.page ?? 1,
      input?.limit ?? 20,
      input?.status,
      input?.noTrackingNumber,
      input?.source,
      input?.search,
      input?.dateFrom,
      input?.dateTo,
      input?.paymentMethod,
      input?.sortBy,
      input?.sortAsc,
      input?.hasRefund,
    );
  }),
  orderTabCounts: adminProcedure.input(z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getOrderTabCounts(input?.dateFrom, input?.dateTo);
  }),
  updateAdminNotes: adminProcedure.input(z.object({
    orderId: z.number(),
    notes: z.string(),
  })).mutation(async ({ input, ctx }) => {
    await db.updateOrderAdminNotes(input.orderId, input.notes);
    // 탈모1 역반영
    try {
      const order = await db.getOrderById(input.orderId);
      if (order?.source === "gnuboard" && order.orderNumber?.startsWith("GNU-")) {
        const { getGnuApiConfig, pushMemoToGnuboard } = await import("../jobs/gnuApiSync");
        const cfg = await getGnuApiConfig();
        if (cfg.baseUrl && cfg.token) {
          await pushMemoToGnuboard(cfg, { orderNumber: order.orderNumber, memo: input.notes });
        }
      }
    } catch (e: any) { console.error("[Admin:updateAdminNotes] 탈모1 역반영 실패:", e.message); }
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "order.updateAdminNotes", entityType: "order", entityId: input.orderId,
      description: `주문 #${input.orderId} 메모 수정`,
      detail: { orderId: input.orderId, notes: input.notes.substring(0, 100) },
    });
    return { success: true };
  }),
  bulkUpdateStatus: adminProcedure.input(z.object({
    orderIds: z.array(z.number()),
    status: z.string(),
  })).mutation(async ({ input, ctx }) => {
    await db.bulkUpdateOrderStatuses(input.orderIds, input.status);
    // 탈모1 역반영 (gnuboard 주문만)
    try {
      const { getGnuApiConfig, pushOrderStatusToGnuboard } = await import("../jobs/gnuApiSync");
      const cfg = await getGnuApiConfig();
      if (cfg.baseUrl && cfg.token) {
        for (const orderId of input.orderIds) {
          const order = await db.getOrderById(orderId);
          if (order?.source === "gnuboard" && order.orderNumber?.startsWith("GNU-")) {
            await pushOrderStatusToGnuboard(cfg, { orderNumber: order.orderNumber, status: input.status }).catch(() => {});
          }
        }
      }
    } catch (e: any) { console.error("[Admin:bulkUpdateStatus] 탈모1 역반영 실패:", e.message); }
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "order.bulkUpdateStatus", entityType: "order",
      description: `주문 ${input.orderIds.length}건 일괄 상태 변경 → ${input.status}`,
      detail: { orderIds: input.orderIds, status: input.status },
    });
    return { success: true, count: input.orderIds.length };
  }),
  orderDetail: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const order = await db.getOrderById(input.id);
    if (!order) return null;
    const items = await db.getOrderItems(order.id);
    return { ...order, items };
  }),
  updateOrderStatus: adminProcedure.input(z.object({
    id: z.number(),
    status: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const orderBefore = await db.getOrderById(input.id);
    await db.updateOrderStatus(input.id, input.status);
    // 탈모1 역반영
    try {
      if (orderBefore?.source === "gnuboard" && orderBefore.orderNumber?.startsWith("GNU-")) {
        const { getGnuApiConfig, pushOrderStatusToGnuboard } = await import("../jobs/gnuApiSync");
        const cfg = await getGnuApiConfig();
        if (cfg.baseUrl && cfg.token) {
          await pushOrderStatusToGnuboard(cfg, { orderNumber: orderBefore.orderNumber, status: input.status });
        }
      }
    } catch (e: any) { console.error("[Admin:updateOrderStatus] 탈모1 역반영 실패:", e.message); }
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "order.updateStatus", entityType: "order", entityId: input.id,
      description: `주문 #${orderBefore?.orderNumber ?? input.id} 상태 변경: ${orderBefore?.status ?? "?"} → ${input.status}`,
      detail: { orderId: input.id, orderNumber: orderBefore?.orderNumber, from: orderBefore?.status, to: input.status },
    });
    return { success: true };
  }),

  // ─── Users ───
  users: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    role: z.string().optional(),
    sortBy: z.string().optional(),
    searchField: z.string().optional(),
    dateField: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    statusFilter: z.string().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllUsers(
      input?.page ?? 1, input?.limit ?? 20, input?.search, input?.role, input?.sortBy,
      input?.searchField, input?.dateField, input?.dateFrom, input?.dateTo, input?.statusFilter,
    );
  }),
  userStatusCounts: adminProcedure.query(async () => {
    return db.getUserStatusCounts();
  }),
  updateUserMailReceive: adminProcedure.input(z.object({ id: z.number(), value: z.boolean() })).mutation(async ({ input }) => {
    await db.updateUserMailReceive(input.id, input.value);
    return { success: true };
  }),
  updateUserBlocked: adminProcedure.input(z.object({ id: z.number(), blocked: z.boolean() })).mutation(async ({ input }) => {
    await db.updateUserBlocked(input.id, input.blocked);
    return { success: true };
  }),
  userDetail: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getUserById(input.id);
  }),
  updateUser: adminProcedure.input(z.object({
    id: z.number(),
    grade: z.string().optional(),
    points: z.number().optional(),
    role: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateUserGradeAndPoints(id, data);
    return { success: true };
  }),
  addUserPoints: adminProcedure.input(z.object({
    userId: z.number(),
    amount: z.number(),
    description: z.string(),
  })).mutation(async ({ input }) => {
    await db.addPoints(input.userId, input.amount, "admin", input.description);
    return { success: true };
  }),

  // ─── CS Search (통합 고객 조회) ───
  csSearch: adminProcedure.input(z.object({ query: z.string().min(1) })).query(async ({ input }) => {
    const q = input.query.trim();
    // 주문번호로 검색 시 (숫자 또는 ORD- 패턴)
    const looksLikeOrder = /^\d{8,}$/.test(q) || /^ORD/i.test(q);
    if (looksLikeOrder) {
      const order = await db.getOrderByNumber(q);
      if (order && order.userId) {
        const user = await db.getUserById(order.userId);
        if (user) {
          const userOrders = await db.getUserOrders(order.userId, 1, 10);
          return { type: "order" as const, user, orders: userOrders.orders, total: userOrders.total };
        }
      }
    }
    // 회원 이름/이메일/전화로 검색
    const result = await db.getAllUsers(1, 10, q, undefined, "createdAt");
    return { type: "user" as const, users: result.users, total: result.total };
  }),

  // ─── User Detail Management ───
  userDetailFull: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const user = await db.getUserById(input.id);
    if (!user) return null;
    const [userAddresses, userOrders, pointHist, liveStats] = await Promise.all([
      db.getUserAddresses(input.id),
      db.getUserOrders(input.id, 1, 50),
      db.getPointHistory(input.id, 1, 50),
      db.getUserLiveStats(input.id),
    ]);
    return {
      user,
      addresses: userAddresses,
      orders: userOrders.orders,
      ordersTotal: userOrders.total,
      pointHistory: pointHist.history,
      pointHistoryTotal: pointHist.total,
      liveOrderCount: liveStats.orderCount,
      liveTotalPaid: liveStats.totalPaid,
    };
  }),
  updateUserInfo: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    grade: z.string().optional(),
    role: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateUserGradeAndPoints(id, data as any);
    return { success: true };
  }),
  resetUserPassword: adminProcedure.input(z.object({
    id: z.number(),
    password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  })).mutation(async ({ input, ctx }) => {
    const hashed = gnuboardPasswordHash(input.password);
    await db.updateUserPassword(input.id, hashed);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "user.resetPassword", entityType: "user", entityId: input.id,
      description: `회원 #${input.id} 비밀번호 초기화`,
      detail: { userId: input.id },
    });
    return { success: true };
  }),
  updateUserAddress: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    recipient: z.string().optional(),
    phone: z.string().optional(),
    zipCode: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    addressEn1: z.string().optional(),
    addressEn2: z.string().optional(),
    isDefault: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.adminUpdateAddress(id, data);
    return { success: true };
  }),
  deleteUserAddress: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.adminDeleteAddress(input.id);
    return { success: true };
  }),
  userOrders: adminProcedure.input(z.object({
    userId: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getUserOrders(input.userId, input.page ?? 1, input.limit ?? 20);
  }),
  userPointHistory: adminProcedure.input(z.object({
    userId: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getPointHistory(input.userId, input.page ?? 1, input.limit ?? 20);
  }),

  // ─── Boards ───
  boards: adminProcedure.query(async () => {
    return db.getAllBoardsAdmin();
  }),
  createBoard: adminProcedure.input(z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    boardType: z.enum(["free", "review", "qna", "notice"]),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    await db.createBoard(input);
    return { success: true };
  }),
  updateBoard: adminProcedure.input(z.object({
    id: z.number(),
    slug: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    boardType: z.string().optional(),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateBoard(id, data);
    return { success: true };
  }),
  deleteBoard: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteBoard(input.id);
    return { success: true };
  }),
  posts: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    boardId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.adminGetAllPosts(input?.page ?? 1, input?.limit ?? 20, input?.boardId);
  }),
  deletePost: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.adminDeletePost(input.id);
    return { success: true };
  }),
  comments: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.adminGetAllComments(input?.page ?? 1, input?.limit ?? 20);
  }),
  deleteComment: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.adminDeleteComment(input.id);
    return { success: true };
  }),

  // ─── Top Banner Text ───
  getTopBannerText: adminProcedure.query(async () => {
    const val = await db.getSetting("topBannerText");
    return { text: val ?? "🌿 인도 직배송 해외직구 전문 쇼핑몰 · 탈모학교" };
  }),
  setTopBannerText: adminProcedure.input(z.object({ text: z.string() })).mutation(async ({ input }) => {
    await db.upsertSetting("topBannerText", input.text, "상단 공지 배너 텍스트");
    return { success: true };
  }),

  // ─── Banners ───
  banners: adminProcedure.query(async () => {
    return db.getAllBanners();
  }),
  createBanner: adminProcedure.input(z.object({
    title: z.string().min(1),
    imageUrl: z.string().min(1),
    mobileImageUrl: z.string().optional(),
    linkUrl: z.string().optional(),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    await db.createBanner(input);
    return { success: true };
  }),
  updateBanner: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    imageUrl: z.string().optional(),
    mobileImageUrl: z.string().optional(),
    linkUrl: z.string().optional(),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateBanner(id, data);
    return { success: true };
  }),
  deleteBanner: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteBanner(input.id);
    return { success: true };
  }),
  // ─── 기획전 ───
  exhibitions: adminProcedure.query(async () => db.getExhibitions()),
  exhibition: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getExhibition(input.id)),
  saveExhibition: adminProcedure.input(z.object({
    id: z.number().optional(),
    title: z.string().trim().min(1).max(100),
    subtitle: z.string().trim().max(200),
    isActive: z.number().min(0).max(1),
    sortOrder: z.number().int(),
    itemIds: z.array(z.number()).max(24),
  })).mutation(async ({ input }) => db.saveExhibition(input)),
  setExhibitionActive: adminProcedure.input(z.object({ id: z.number(), isActive: z.number().min(0).max(1) })).mutation(async ({ input }) => { await db.setExhibitionActive(input.id, input.isActive); return { success: true }; }),
  deleteExhibition: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteExhibition(input.id); return { success: true }; }),
  // ─── 로그인 페이지 이벤트 배너 ───
  loginBanners: adminProcedure.query(async () => db.getLoginBanners()),
  createLoginBanner: adminProcedure.input(z.object({
    title: z.string().min(1).max(200),
    imageUrl: z.string().min(1).refine((v) => /^(\/|https?:\/\/)/.test(v), "이미지 주소가 올바르지 않습니다"),
    linkUrl: z.string().max(1000).refine((v) => v === "" || /^(\/(?!\/)|https?:\/\/)/.test(v), "링크는 / 또는 http(s):// 로 시작해야 합니다").optional(),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => { await db.createLoginBanner(input); return { success: true }; }),
  updateLoginBanner: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().min(1).max(200).optional(),
    imageUrl: z.string().min(1).refine((v) => /^(\/|https?:\/\/)/.test(v), "이미지 주소가 올바르지 않습니다").optional(),
    linkUrl: z.string().max(1000).refine((v) => v === "" || /^(\/(?!\/)|https?:\/\/)/.test(v), "링크는 / 또는 http(s):// 로 시작해야 합니다").optional(),
    isActive: z.number().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateLoginBanner(id, data); return { success: true }; }),
  deleteLoginBanner: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteLoginBanner(input.id); return { success: true }; }),
  activeBanners: protectedProcedure.query(async () => {
    return db.getActiveBanners();
  }),

  // ─── Search Keywords ───
  keywords: adminProcedure.query(async () => {
    return db.getAdminKeywords(50);
  }),
  updateKeyword: adminProcedure.input(z.object({
    id: z.number(),
    searchCount: z.number().min(0).optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    await db.updateKeyword(input.id, { searchCount: input.searchCount, sortOrder: input.sortOrder });
    return { success: true };
  }),
  addKeyword: adminProcedure.input(z.object({
    keyword: z.string().min(1),
    searchCount: z.number().min(0).optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    await db.addKeyword(input.keyword, input.searchCount ?? 0, input.sortOrder ?? 0);
    return { success: true };
  }),
  deleteKeyword: adminProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    await db.deleteKeyword(input.id);
    return { success: true };
  }),
  batchUpdateKeywordsSortOrder: adminProcedure.input(z.array(z.object({
    id: z.number(),
    sortOrder: z.number(),
  }))).mutation(async ({ input }) => {
    await db.batchUpdateKeywordsSortOrder(input);
    return { success: true };
  }),

  // ─── Chart Stats ───
  dailySales: adminProcedure.input(z.object({
    days: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return g5stats.getDailySalesStats(input?.days ?? 30);
  }),
  monthlySales: adminProcedure.input(z.object({
    months: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return g5stats.getMonthlySalesStats(input?.months ?? 12);
  }),
  orderStatusDistribution: adminProcedure.query(async () => {
    return g5stats.getOrderStatusDistribution();
  }),
  categorySales: adminProcedure.query(async () => {
    return g5stats.getCategorySalesStats();
  }),

  // ─── Review Point Settings ───


  // ─── Image Upload ───
  uploadImage: adminProcedure.input(z.object({
    base64: z.string(),
    fileName: z.string(),
    contentType: z.string(),
  })).mutation(async ({ input }) => {
    const ext = input.fileName.split(".").pop() || "jpg";
    const id = nanoid(12);
    const buffer = Buffer.from(input.base64, "base64");
    const dir = path2adm.join("/var/www/g9shop/artifacts/api-server/uploads/item", id);
    fs2adm.mkdirSync(dir, { recursive: true });
    const filename = `${id}.${ext}`;
    fs2adm.writeFileSync(path2adm.join(dir, filename), buffer);
    return { url: `/api/product-image/${id}/${filename}` };
  }),

  // ─── Low Stock Options ───
  lowStockOptions: adminProcedure.query(async () => {
    return g5stats.getLowStockOptions(10);
  }),

  // ─── Grade Benefits ───
  gradeBenefits: adminProcedure.query(async () => {
    return db.getAllGradeBenefits();
  }),
  updateGradeBenefit: adminProcedure.input(z.object({
    grade: z.enum(["bronze", "silver", "gold", "vip", "vvip"]),
    discountRate: z.number().optional(),
    pointRate: z.number().optional(),
    freeShippingThreshold: z.number().optional(),
    description: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { grade, ...data } = input;
    await db.updateGradeBenefit(grade, data);
    return { success: true };
  }),
  
  // 배송 현황 대시보드
  shippingSummary: adminProcedure.query(async () => {
    return db.getShippingSummary();
  }),
  delayedShipments: adminProcedure.input(z.object({
    daysThreshold: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getDelayedShipments(input.daysThreshold ?? 3);
  }),
  shippingPerformanceByCarrier: adminProcedure.query(async () => {
    return db.getShippingPerformanceByCarrier();
  }),
  shippingPerformanceByRegion: adminProcedure.query(async () => {
    return db.getShippingPerformanceByRegion();
  }),
  monthlyShippingStats: adminProcedure.input(z.object({
    months: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getMonthlyShippingStats(input.months ?? 6);
  }),

  // 리뷰 포인트 설정
  getReviewPointSettings: adminProcedure.query(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not initialized");
    const [settings] = await database
      .select()
      .from(reviewPointSettings)
      .where(eq(reviewPointSettings.isActive, 1))
      .limit(1);
    
    if (!settings) {
      // 설정이 없으면 기본값 삽입
      await database.insert(reviewPointSettings).values({
        pointsPerReview: 100,
        pointsPerPhotoReview: 200,
        minRatingForPoints: 1,
        likePointsThreshold: 10,
        pointsPerLikeThreshold: 50,
        isActive: 1,
      });
      return {
        pointsPerReview: 100,
        pointsPerPhotoReview: 200,
        minRatingForPoints: 1,
        likePointsThreshold: 10,
        pointsPerLikeThreshold: 50,
      };
    }
    
    return settings;
  }),
  
  updateReviewPointSettings: adminProcedure.input(z.object({
    pointsPerReview: z.number().min(0),
    pointsPerPhotoReview: z.number().min(0),
    minRatingForPoints: z.number().min(1).max(5),
    likePointsThreshold: z.number().min(1),
    pointsPerLikeThreshold: z.number().min(0),
  })).mutation(async ({ input }) => {
    const database = await getDb();
    if (!database) throw new Error("Database not initialized");
    const [existing] = await database
      .select()
      .from(reviewPointSettings)
      .where(eq(reviewPointSettings.isActive, 1))
      .limit(1);
    
    if (existing) {
      await database
        .update(reviewPointSettings)
        .set(input)
        .where(eq(reviewPointSettings.id, existing.id));
    } else {
      await database.insert(reviewPointSettings).values({
        ...input,
        isActive: 1,
      });
    }
    
    return { success: true };
  }),
  
  // 이메일 템플릿 설정
  getEmailTemplate: adminProcedure.query(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not initialized");
    const { emailTemplates } = await import("../../drizzle/schema");
    const [template] = await database.select().from(emailTemplates).limit(1);
    return template || null;
  }),
  
  updateEmailTemplate: adminProcedure.input(z.object({
    logoUrl: z.string().optional(),
    primaryColor: z.string(),
    footerText: z.string().optional(),
    footerLinks: z.string().optional(),
  })).mutation(async ({ input }) => {
    const database = await getDb();
    if (!database) throw new Error("Database not initialized");
    const { emailTemplates } = await import("../../drizzle/schema");
    
    const [existing] = await database.select().from(emailTemplates).limit(1);
    if (existing) {
      await database.update(emailTemplates).set(input).where(eq(emailTemplates.id, existing.id));
    } else {
      await database.insert(emailTemplates).values(input as any);
    }
    
    return { success: true };
  }),
  
  // 이메일 발송 이력
  emailLogs: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    userId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getEmailLogs(input?.page ?? 1, input?.limit ?? 20, input?.userId);
  }),
  
  resendEmail: adminProcedure.input(z.object({
    logId: z.number(),
  })).mutation(async ({ input }) => {
    return db.resendEmail(input.logId);
  }),

  // 이메일 템플릿 미리보기 (샘플 데이터로 렌더링)
  previewEmailTemplate: adminProcedure
    .input(z.object({
      type: z.enum(["generic", "order_confirm", "payment_confirm", "shipping_start", "review_request", "customs_hold", "welcome", "auto_cancel", "point_expire"]),
    }))
    .query(async ({ input }) => {
      const { generateEmailTemplate } = await import("../_core/email");
      const { generateReviewRequestEmail } = await import("../_core/email");
      const { generateCustomsHoldEmail } = await import("../_core/customsHoldEmail");

      if (input.type === "review_request") {
        return {
          subject: "[탈모학교] 배송이 완료되었습니다 - 리뷰를 남겨주세요",
          html: generateReviewRequestEmail({
            customerName: "김탈모",
            orderNumber: "ORD-2026-001234",
            productName: "탈모케어 샴푸 500ml",
            reviewUrl: "https://talmoschool.com/shop/itemusewrite.php",
          }),
        };
      }

      if (input.type === "customs_hold") {
        return {
          subject: "[탈모학교] 통관검사 안내 - 배송이 잠시 지연됩니다",
          html: generateCustomsHoldEmail({
            customerName: "김탈모",
            orderNumber: "ORD-2026-001234",
            orderId: 999,
            customsNumber: "123456789",
            customerPhone: "010-1234-5678",
          }),
        };
      }

      if (input.type === "order_confirm") {
        return {
          subject: "[탈모학교] 주문이 접수되었습니다",
          html: await generateEmailTemplate({
            title: "주문이 접수되었습니다",
            content: `안녕하세요, <strong>김탈모</strong>님!\n\n주문이 정상적으로 접수되었습니다.\n\n• 주문번호: ORD-2026-001234\n• 상품명: 탈모케어 샴푸 500ml\n• 주문금액: 32,000원\n\n입금 확인 후 배송이 시작됩니다.\n감사합니다!`,
            actionUrl: "https://talmoschool.com/mypage/orders",
            actionText: "주문 내역 확인",
          }),
        };
      }

      if (input.type === "payment_confirm") {
        return {
          subject: "[\uD0C8\uBAA8\uD559\uAD50] \uC785\uAE08 \uD655\uC778 \uC644\uB8CC - \uBC30\uC1A1\uC744 \uC900\uBE44\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4",
          html: await generateEmailTemplate({
            title: "\uC785\uAE08 \uD655\uC778 \uC644\uB8CC",
            content: `\uC548\uB155\uD558\uC138\uC694, <strong>\uAE40\uD0C8\uBAA8</strong>\uB2D8!\n\n\uC8FC\uBB38\uAE08 \uC785\uAE08\uC774 \uC815\uC0C1\uC801\uC73C\uB85C \uD655\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4.\n\n\u2022 \uC8FC\uBB38\uBC88\uD638: ORD-2026-001234\n\u2022 \uC785\uAE08\uC561: 32,000\uC6D0\n\u2022 \uCD9C\uAE08\uC740\uD589: \uAD6D\uBBFC\uC740\uD589\n\n\uC0C1\uD488 \uBC1C\uC1A1\uC744 \uC900\uBE44\uD558\uACE0 \uC788\uC73C\uBA70, \uBC30\uC1A1 \uC2DC\uC791 \uC2DC \uB2E4\uC2DC \uC54C\uB824\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.\n\uAC10\uC0AC\uD569\uB2C8\uB2E4!`,
            actionUrl: "https://talmoschool.com/mypage/orders",
            actionText: "\uC8FC\uBB38 \uB0B4\uC5ED \uD655\uC778",
          }),
        };
      }

      if (input.type === "shipping_start") {
        return {
          subject: "[\uBC30\uC1A1\uC2DC\uC791] \uC8FC\uBB38\uBC88\uD638 ORD-2026-001234 - CJ\uB300\uD55C\uD1B5\uC6B4",
          html: await generateEmailTemplate({
            title: "\uC0C1\uD488\uC774 \uBC1C\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
            content: `\uC548\uB155\uD558\uC138\uC694, <strong>\uAE40\uD0C8\uBAA8</strong>\uB2D8!\n\n\uC8FC\uBB38\uD558\uC2E0 \uC0C1\uD488\uC774 \uBC1C\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.\n\n\u2022 \uC8FC\uBB38\uBC88\uD638: ORD-2026-001234\n\u2022 \uC6B4\uC1A1\uC0AC: CJ\uB300\uD55C\uD1B5\uC6B4\n\u2022 \uC1A1\uC7A5\uBC88\uD638: 123456789012\n\n\uBC30\uC1A1 \uD604\uD669\uC740 \uB9C8\uC774\uD398\uC774\uC9C0\uC5D0\uC11C \uD655\uC778\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.\n\uAC10\uC0AC\uD569\uB2C8\uB2E4!`,
            actionUrl: "https://talmoschool.com/mypage/orders",
            actionText: "\uBC30\uC1A1 \uD604\uD669 \uD655\uC778",
          }),
        };
      }

      if (input.type === "welcome") {
        return {
          subject: "[\uD0C8\uBAA8\uD559\uAD50] \uD68C\uC6D0\uAC00\uC785\uC744 \uD658\uC601\uD569\uB2C8\uB2E4!",
          html: await generateEmailTemplate({
            title: "\uAE40\uD0C8\uBAA8\uB2D8, \uD0C8\uBAA8\uD559\uAD50\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4!",
            content: `\uC548\uB155\uD558\uC138\uC694, \uAE40\uD0C8\uBAA8\uB2D8!\n\n\uD0C8\uBAA8\uD559\uAD50\uC5D0 \uAC00\uC785\uD574 \uC8FC\uC154\uC11C \uAC10\uC0AC\uD569\uB2C8\uB2E4.\n\n\uD0C8\uBAA8\uD559\uAD50\uB294 \uC778\uB3C4 \uC758\uC57D\uD488 \uD574\uC678\uC9C1\uAD6C \uC804\uBB38 \uC1FC\uD551\uBAB4\uB85C, \uD0C8\uBAA8, \uC131\uAE30\uB2A5, \uD53C\uBD80\uBBF8\uC6A9, \uB2E4\uC774\uC5B4\uD2B8 \uB4F1 \uB2E4\uC591\uD55C \uC81C\uD488\uC744 \uD569\uB9AC\uC801\uC778 \uAC00\uACA9\uC5D0 \uC81C\uACF5\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.\n\n\uC9C0\uAE08 \uBC14\uB85C \uC1FC\uD551\uC744 \uC2DC\uC791\uD574 \uBCF4\uC138\uC694!`,
            actionUrl: "https://talmoschool.com/products",
            actionText: "\uC1FC\uD551 \uC2DC\uC791\uD558\uAE30",
          }),
        };
      }

      if (input.type === "auto_cancel") {
        return {
          subject: "[\uC790\uB3D9 \uCDE8\uC18C] \uC8FC\uBB38\uBC88\uD638 ORD-2026-001234 - \uC785\uAE08 \uAE30\uD55C \uB9CC\uB8CC",
          html: await generateEmailTemplate({
            title: "\uC8FC\uBB38 \uC790\uB3D9 \uCDE8\uC18C \uC548\uB0B4",
            content: `\uC548\uB155\uD558\uC138\uC694, <strong>\uAE40\uD0C8\uBAA8</strong>\uB2D8.\n\n\uC8FC\uBB38\uD558\uC2E0 \uC8FC\uBB38\uC758 \uC785\uAE08 \uAE30\uD55C\uC774 \uB9CC\uB8CC\uB418\uC5B4 \uC790\uB3D9 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.\n\n\u2022 \uC8FC\uBB38\uBC88\uD638: ORD-2026-001234\n\u2022 \uCDE8\uC18C\uC0AC\uC720: \uC785\uAE08 \uAE30\uD55C \uB9CC\uB8CC\n\n\uC7AC\uC8FC\uBB38\uC744 \uC6D0\uD558\uC2DC\uBA74 \uC0C8\uB85C \uC8FC\uBB38\uD574 \uC8FC\uC138\uC694.\n\uBB38\uC758\uC0AC\uD56D\uC740 1:1\uBB38\uC758\uB97C \uC774\uC6A9\uD574 \uC8FC\uC138\uC694.`,
            actionUrl: "https://talmoschool.com/mypage/inquiry",
            actionText: "1:1 \uBB38\uC758\uD558\uAE30",
          }),
        };
      }

      if (input.type === "point_expire") {
        return {
          subject: "[\uD0C8\uBAA8\uD559\uAD50] \uD3EC\uC778\uD2B8 \uC18C\uBA78 \uC608\uC815 \uC54C\uB9BC",
          html: await generateEmailTemplate({
            title: "\uC18C\uBA78 \uC608\uC815 \uD3EC\uC778\uD2B8 \uC54C\uB9BC",
            content: `\uC548\uB155\uD558\uC138\uC694, \uAE40\uD0C8\uBAA8\uB2D8.\n\n\uBCF4\uC720 \uC911\uC778 \uD3EC\uC778\uD2B8 \uC911 <strong>5,000P</strong>\uAC00 30\uC77C \uB0B4\uC5D0 \uC18C\uBA78\uB429\uB2C8\uB2E4.\n\n\u2022 \uC18C\uBA78 \uC608\uC815\uC77C: 2026-07-15\n\u2022 \uC18C\uBA78 \uC608\uC815 \uD3EC\uC778\uD2B8: 5,000P\n\n\uC18C\uBA78\uC744 \uB9C9\uAE30 \uC704\uD574\uC11C\uB294 \uC9C0\uAE08 \uBC14\uB85C \uC0AC\uC6A9\uD574 \uC8FC\uC138\uC694!`,
            actionUrl: "https://talmoschool.com/products",
            actionText: "\uCF00\uC774\uC2A4 \uC1FC\uD551\uD558\uAE30",
          }),
        };
      }

      // generic
      return {
        subject: "[탈모학교] 중요 알림",
        html: await generateEmailTemplate({
          title: "이메일 알림 제목",
          content: `안녕하세요!\n\n이것은 일반 알림 이메일 예시입니다.\n\n중요한 내용을 여기에 작성합니다.\n라인 간격, 강조 텍스트 등 기본 스타일을 미리 확인해 보세요.`,
          actionUrl: "https://talmoschool.com",
          actionText: "탈모학교 바로가기",
        }),
      };
    }),
  
  // FAQ 관리 (쇼핑몰 고객 화면의 FAQ = shop_faqs 와 같은 데이터)
  getFaqs: adminProcedure.input(z.object({
    category: z.string().optional(),
    isActive: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getFaqs(input?.category, input?.isActive);
  }),

  createFaq: adminProcedure.input(z.object({
    category: z.enum(db.FAQ_CATEGORIES),
    question: z.string().max(500).optional(),
    answer: z.string().max(5000).optional(),
    questionJa: z.string().max(500).optional(),
    answerJa: z.string().max(5000).optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    isActive: z.number().int().min(0).max(1).optional(),
  })).mutation(async ({ input }) => {
    const qJa = (input.questionJa ?? "").trim();
    const aJa = (input.answerJa ?? "").trim();
    if (!qJa && !(input.question ?? "").trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "질문을 입력하세요." });
    if ((input.isActive ?? 1) === 1 && (!qJa || !aJa)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "공개하려면 일본어 질문과 답변이 모두 필요합니다(고객은 일본어만 봅니다). 아직 번역이 없으면 비공개로 저장하세요." });
    }
    const id = await db.createFaq(input);
    return { id };
  }),

  updateFaq: adminProcedure.input(z.object({
    id: z.number().int(),
    category: z.enum(db.FAQ_CATEGORIES).optional(),
    question: z.string().max(500).optional(),
    answer: z.string().max(5000).optional(),
    questionJa: z.string().max(500).optional(),
    answerJa: z.string().max(5000).optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    isActive: z.number().int().min(0).max(1).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const cur = await db.getFaqById(id);
    if (!cur) throw new TRPCError({ code: "NOT_FOUND", message: "FAQ를 찾을 수 없습니다." });
    const qJa = (data.questionJa ?? cur.questionJa).trim();
    const aJa = (data.answerJa ?? cur.answerJa).trim();
    if ((data.isActive ?? cur.isActive) === 1 && (!qJa || !aJa)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "공개하려면 일본어 질문과 답변이 모두 필요합니다(고객은 일본어만 봅니다). 아직 번역이 없으면 비공개로 저장하세요." });
    }
    await db.updateFaq(id, data);
    return { success: true };
  }),

  deleteFaq: adminProcedure.input(z.object({
    id: z.number().int(),
  })).mutation(async ({ input }) => {
    await db.deleteFaq(input.id);
    return { success: true };
  }),

  // 1:1 문의 답변 관리
  getInquiries: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    status: z.enum(["all", "pending", "answered"]).optional(),
  })).query(async ({ input }) => {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const result = await db.getRealInquiries(page, limit, input.search);
    let filtered = result.posts;
    if (input.status === "pending") filtered = filtered.filter(p => !p.isAnswered);
    if (input.status === "answered") filtered = filtered.filter(p => p.isAnswered);
    return { posts: filtered, total: result.total };
  }),

  getInquiryReplies: adminProcedure.input(z.object({
    postId: z.number(),
  })).query(async ({ input }) => {
    return db.getRealInquiryReplies(input.postId);
  }),

  createInquiryReply: adminProcedure.input(z.object({
    postId: z.number(),
    content: z.string(),
    attachments: z.array(z.string()).optional(),
  })).mutation(async ({ input, ctx }) => {
    const id = await db.createRealInquiryReply(
      input.postId,
      input.content,
      String(ctx.user.id),
      ctx.user.name || "관리자",
      ctx.user.email || ""
    );
    return { id };
  }),

  markInquiryAnswered: adminProcedure.input(z.object({
    postId: z.number(),
  })).mutation(async ({ input }) => {
    await db.markRealInquiryAnswered(input.postId);
    return { success: true };
  }),

  updateInquiryReply: adminProcedure.input(z.object({
    id: z.number(),
    content: z.string(),
    attachments: z.array(z.string()).nullable().optional(),
  })).mutation(async ({ input }) => {
    await db.updateRealInquiryReply(input.id, input.content);
    return { success: true };
  }),

  deleteInquiryReply: adminProcedure.input(z.object({
    id: z.number(),
    postId: z.number(),
  })).mutation(async ({ input }) => {
    await db.deleteRealInquiryReply(input.id, input.postId);
    return { success: true };
  }),

  getPointSettings: adminProcedure.query(async () => {
    const settings = await db.getSettings([
      "registrationPoints",
      "defaultProductPointRate",
    ]);
    return {
      registrationPoints: Number(settings.registrationPoints ?? "0"),
      defaultProductPointRate: Number(settings.defaultProductPointRate ?? "0"),
    };
  }),

  updatePointSettings: adminProcedure.input(z.object({
    registrationPoints: z.number().min(0),
    defaultProductPointRate: z.number().min(0).max(100),
  })).mutation(async ({ input }) => {
    await db.upsertSetting("registrationPoints", String(input.registrationPoints), "회원가입 적립 포인트");
    await db.upsertSetting("defaultProductPointRate", String(input.defaultProductPointRate), "기본 상품 포인트 적립률(%)");
    return { success: true };
  }),

  bulkUpdateProductPointRate: adminProcedure.input(z.object({
    categoryId: z.number().optional(),
    pointRate: z.number().min(0).max(100),
  })).mutation(async ({ input }) => {
    const count = await db.bulkUpdateProductPointRate(input.pointRate, input.categoryId);
    return { success: true, updatedCount: count };
  }),

  getSettings: adminProcedure.query(async () => {
    return db.getAllSettings();
  }),

  upsertSetting: adminProcedure.input(z.object({
    key: z.string(),
    value: z.string(),
    label: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.upsertSetting(input.key, input.value, input.label);
    return { success: true };
  }),

  getSmtpSettings: adminProcedure.query(async () => {
    const settings = await db.getSettings([
      "smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFrom", "smtpFromName", "smtpSecure", "smtpBcc",
    ]);
    return {
      host: settings.smtpHost ?? "",
      port: Number(settings.smtpPort ?? "587"),
      user: settings.smtpUser ?? "",
      pass: settings.smtpPass ? "********" : "",
      from: settings.smtpFrom ?? "",
      fromName: settings.smtpFromName ?? "탈모학교",
      secure: settings.smtpSecure === "true",
      bcc: settings.smtpBcc ?? "",
    };
  }),

  updateSmtpSettings: adminProcedure.input(z.object({
    host: z.string().min(1),
    port: z.number(),
    user: z.string().min(1),
    pass: z.string().optional(),
    from: z.string().optional(),
    fromName: z.string().optional(),
    secure: z.boolean(),
    bcc: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.upsertSetting("smtpHost", input.host, "SMTP 호스트");
    await db.upsertSetting("smtpPort", String(input.port), "SMTP 포트");
    await db.upsertSetting("smtpUser", input.user, "SMTP 사용자");
    if (input.pass && input.pass !== "********") {
      await db.upsertSetting("smtpPass", input.pass, "SMTP 비밀번호");
    }
    const fromAddr = input.from?.trim() || input.user;
    await db.upsertSetting("smtpFrom", fromAddr, "발신 이메일");
    await db.upsertSetting("smtpFromName", input.fromName ?? "탈모학교", "발신자 이름");
    await db.upsertSetting("smtpSecure", String(input.secure), "SMTP SSL");
    await db.upsertSetting("smtpBcc", input.bcc?.trim() ?? "", "숨은 참조 (BCC)");
    return { success: true };
  }),

  testSmtpEmail: adminProcedure.input(z.object({
    to: z.string().email(),
  })).mutation(async ({ input }) => {
    const { sendEmailViaSMTP } = await import("../_core/email");
    const result = await sendEmailViaSMTP({
      to: input.to,
      subject: "[탈모학교] SMTP 테스트 메일",
      html: "<h2>SMTP 연동 테스트</h2><p>이 메일이 수신되었다면 SMTP 설정이 정상적으로 완료된 것입니다.</p><p>탈모학교 관리자 시스템</p>",
    });
    return result;
  }),

  syncGnuboardOrders: adminProcedure.mutation(async () => {
    const { syncOrdersFromGnuboard } = await import("../jobs/gnuboardSync");
    return syncOrdersFromGnuboard();
  }),

  // ─── GNU API 방식 (PHP 폴링) ───────────────────────────────────
  getGnuApiConfig: adminProcedure.query(async () => {
    const { getGnuApiConfig } = await import("../jobs/gnuApiSync");
    return getGnuApiConfig();
  }),

  saveGnuApiConfig: adminProcedure.input(z.object({
    baseUrl: z.string(),
    token: z.string(),
    enabled: z.boolean(),
  })).mutation(async ({ input }) => {
    await db.upsertSetting("gnuApiBaseUrl", input.baseUrl, "탈모1 API 기본 URL");
    await db.upsertSetting("gnuApiToken", input.token, "탈모1 API 토큰");
    await db.upsertSetting("gnuApiEnabled", String(input.enabled), "탈모1 API 동기화 사용");
    return { success: true };
  }),

  syncGnuApiOrders: adminProcedure.mutation(async () => {
    const { getGnuApiConfig, syncOrdersFromApi } = await import("../jobs/gnuApiSync");
    const cfg = await getGnuApiConfig();
    if (!cfg.baseUrl || !cfg.token) throw new Error("API 설정이 없습니다. 먼저 기본 URL과 토큰을 저장하세요.");
    return syncOrdersFromApi(cfg);
  }),

  syncGnuApiProducts: adminProcedure.mutation(async () => {
    const { getGnuApiConfig, syncProductsFromApi } = await import("../jobs/gnuApiSync");
    const cfg = await getGnuApiConfig();
    if (!cfg.baseUrl || !cfg.token) throw new Error("API 설정이 없습니다.");
    return syncProductsFromApi(cfg);
  }),

  syncGnuApiMembers: adminProcedure.mutation(async () => {
    const { getGnuApiConfig, syncMembersFromApi } = await import("../jobs/gnuApiSync");
    const cfg = await getGnuApiConfig();
    if (!cfg.baseUrl || !cfg.token) throw new Error("API 설정이 없습니다.");
    return syncMembersFromApi(cfg);
  }),

  getGnuApiSyncStatus: adminProcedure.query(async () => {
    const s = await db.getSettings([
      "gnuApiLastOrderSync", "gnuApiLastProductSync", "gnuApiLastMemberSync",
      "gnuApiBaseUrl", "gnuApiEnabled",
    ]);
    return {
      lastOrderSync: s.gnuApiLastOrderSync ?? null,
      lastProductSync: s.gnuApiLastProductSync ?? null,
      lastMemberSync: s.gnuApiLastMemberSync ?? null,
      baseUrl: s.gnuApiBaseUrl ?? "",
      enabled: s.gnuApiEnabled === "true",
    };
  }),

  importGnuboardReviews: adminProcedure.mutation(async () => {
    const mysqlLib = await import("mysql2/promise");
    const GNU_BASE_URL = "https://talmoschool.com";

    const my = await mysqlLib.default.createConnection({
      host: process.env.TALMO_MYSQL_HOST,
      user: process.env.TALMO_MYSQL_USER,
      password: process.env.TALMO_MYSQL_PASSWORD,
      database: process.env.TALMO_MYSQL_DATABASE,
      connectTimeout: 15000,
    });

    const appDb = await mysqlLib.default.createConnection({ uri: process.env.DATABASE_URL });

    try {
      const [boardRows] = await appDb.query(`SELECT id FROM \`boards\` WHERE slug='review' LIMIT 1`) as any[];
      if (!boardRows.length) return { error: "review board 없음" };
      const boardId = boardRows[0].id as number;

      await appDb.query(`DELETE FROM \`posts\` WHERE \`boardId\`=?`, [boardId]);

      const [productRows] = await appDb.query(`SELECT id, slug, thumbnail FROM \`products\``) as any[];
      const productMap = new Map<string, { id: number; thumbnail: string | null }>();
      for (const p of productRows) {
        const parts = (p.slug as string).split("-");
        const gnuId = parts[parts.length - 1];
        if (gnuId) productMap.set(gnuId, { id: p.id, thumbnail: p.thumbnail });
      }

      const [userRows] = await appDb.query(`SELECT id, \`openId\` FROM \`users\` WHERE \`openId\` LIKE 'gnuboard_%'`) as any[];
      const userMap = new Map<string, number>();
      for (const u of userRows) {
        const mbId = String(u.openId).replace(/^gnuboard_/, "");
        if (mbId) userMap.set(mbId, u.id as number);
      }

      const [adminRows] = await appDb.query(`SELECT id FROM \`users\` WHERE role='admin' LIMIT 1`) as any[];
      const adminUserId = (adminRows as any[])[0]?.id ?? 1;

      const [reviews] = await my.query(
        `SELECT is_id, it_id, mb_id, is_name, is_score, is_subject, is_content, is_time, cimg_1, cimg_2, cimg_3
         FROM g5_shop_item_use WHERE is_confirm = 1 ORDER BY is_time ASC`
      ) as any[];

      const mbIds = [...new Set((reviews as any[]).map((r: any) => r.mb_id).filter(Boolean))];
      const mbNickMap = new Map<string, string>();
      if (mbIds.length > 0) {
        const placeholders = mbIds.map(() => "?").join(",");
        const [members] = await my.query(
          `SELECT mb_id, mb_nick, mb_name FROM g5_member WHERE mb_id IN (${placeholders})`,
          mbIds
        ) as any[];
        for (const m of members) mbNickMap.set(m.mb_id, m.mb_nick || m.mb_name || m.mb_id);
      }

      let inserted = 0, unmatched = 0;
      for (const r of reviews as any[]) {
        const product = productMap.get(String(r.it_id));
        const images: string[] = [];
        for (const img of [r.cimg_1, r.cimg_2, r.cimg_3]) {
          if (img?.trim()) images.push(`${GNU_BASE_URL}/data/item_use/${img.trim()}`);
        }
        const userId = userMap.get(r.mb_id) ?? adminUserId;
        const createdAt = r.is_time && !String(r.is_time).startsWith("0000") ? new Date(r.is_time) : new Date();
        const content = (r.is_content ?? "").trim() || r.is_subject || "";
        const title = (r.is_subject ?? "").trim() || "상품 후기";
        const rating = Math.min(5, Math.max(1, Number(r.is_score) || 5));
        const imagesJson = images.length > 0 ? JSON.stringify(images) : null;

        await appDb.query(
          `INSERT INTO \`posts\` (\`boardId\`, \`userId\`, \`productId\`, title, content, rating, images,
                             \`viewCount\`, \`commentCount\`, \`likeCount\`,
                             \`isNotice\`, \`isPinned\`, \`isHidden\`, \`isBest\`, \`isAutoGenerated\`,
                             \`createdAt\`, \`updatedAt\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?)`,
          [boardId, userId, product?.id ?? null, title, content, rating, imagesJson, createdAt, createdAt]
        );

        if (product) inserted++; else unmatched++;
      }

      return { success: true, total: (reviews as any[]).length, matched: inserted, unmatched };
    } finally {
      await my.end();
      await appDb.end();
    }
  }),

  // ─── API Key Settings ───
  getApiSettings: adminProcedure.query(async () => {
    const settings = await db.getSettings(["seventeentrack_api_key"]);
    const key = settings["seventeentrack_api_key"] ?? "";
    return {
      hasSeventeentrackKey: !!key,
      seventeentrackApiKey: key
        ? (key.length > 12 ? key.slice(0, 8) + "..." + key.slice(-4) : "***")
        : null,
    };
  }),

  setApiSetting: adminProcedure
    .input(z.object({
      key: z.enum(["seventeentrack_api_key"]),
      value: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const descriptions: Record<string, string> = {
        seventeentrack_api_key: "17track 배송 추적 API 키",
      };
      await db.upsertSetting(input.key, input.value, descriptions[input.key]);
      return { success: true };
    }),

  deleteApiSetting: adminProcedure
    .input(z.object({
      key: z.enum(["seventeentrack_api_key"]),
    }))
    .mutation(async ({ input }) => {
      const dbInstance = await getDb();
      if (dbInstance) {
        await dbInstance.delete(siteSettings).where(eq(siteSettings.settingKey, input.key));
      }
      return { success: true };
    }),

  testTrackingApi: adminProcedure
    .input(z.object({ apiKey: z.string() }))
    .mutation(async ({ input }) => {
      let keyToTest = input.apiKey;
      if (!keyToTest) {
        const settings = await db.getSettings(["seventeentrack_api_key"]);
        keyToTest = settings["seventeentrack_api_key"] ?? "";
      }
      if (!keyToTest) {
        return { success: false, message: "API 키가 설정되지 않았습니다." };
      }
      try {
        const response = await fetch("https://api.17track.net/track/v2.4/gettrackinfo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "17token": keyToTest,
          },
          body: JSON.stringify([{ number: "TEST000000000" }]),
          signal: AbortSignal.timeout(8000),
        });
        if (response.status === 401 || response.status === 403) {
          return { success: false, message: "API 키가 유효하지 않습니다. (인증 실패)" };
        }
        const data = await response.json();
        if (data.code === 0 || (data.code >= -18019999 && data.code <= -18019000)) {
          return { success: true, message: "API 키가 정상 작동합니다." };
        }
        if (data.code === -18010009) {
          return { success: false, message: "API 키가 유효하지 않습니다." };
        }
        return { success: true, message: `연결 성공 (코드: ${data.code})` };
      } catch (e: any) {
        return { success: false, message: "연결 실패: " + e.message };
      }
    }),

  // ─── Visitor Stats ───
  visitorStats: adminProcedure.input(z.object({
    days: z.number().optional(),
  })).query(async ({ input }) => {
    const { getVisitorStats } = await import("../middleware/visitorTracker");
    return getVisitorStats(input.days ?? 30);
  }),
  visitorLogList: adminProcedure.input(z.object({
    start: z.string(),
    end: z.string(),
    page: z.number().optional(),
    limit: z.number().optional(),
  })).query(async ({ input }) => {
    const { getVisitorLogList } = await import("../middleware/visitorTracker");
    return getVisitorLogList({
      start: input.start,
      end: input.end,
      page: input.page ?? 1,
      limit: input.limit ?? 50,
    });
  }),
});
