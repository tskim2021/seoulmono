import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
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
    return db.getSalesTrend(input.period, input.days ?? 30);
  }),
  topProducts: adminProcedure.input(z.object({
    limit: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getTopProducts(input.limit ?? 10);
  }),
  newUsersTrend: adminProcedure.input(z.object({
    days: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getNewUsersTrend(input.days ?? 30);
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
      description: `注文 #${input.orderId} メモ編集`,
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
      description: `注文${input.orderIds.length}件の一括ステータス変更 → ${input.status}`,
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
      description: `注文 #${orderBefore?.orderNumber ?? input.id} ステータス変更: ${orderBefore?.status ?? "?"} → ${input.status}`,
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
    password: z.string().min(6, "パスワードは6文字以上で入力してください"),
  })).mutation(async ({ input, ctx }) => {
    const hashed = gnuboardPasswordHash(input.password);
    await db.updateUserPassword(input.id, hashed);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "user.resetPassword", entityType: "user", entityId: input.id,
      description: `会員 #${input.id} パスワード初期化`,
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
    return { text: val ?? "🌿 インド直送・海外個人輸入専門ショップ · ソウルモノ" };
  }),
  setTopBannerText: adminProcedure.input(z.object({ text: z.string() })).mutation(async ({ input }) => {
    await db.upsertSetting("topBannerText", input.text, "上部お知らせバナーテキスト");
    return { success: true };
  }),

  // ─── Banners ───
  banners: adminProcedure.query(async () => {
    return db.getAllBanners();
  }),
  createBanner: adminProcedure.input(z.object({
    title: z.string().min(1),
    imageUrl: z.string().min(1),
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
    return db.getDailySalesStats(input?.days ?? 30);
  }),
  monthlySales: adminProcedure.input(z.object({
    months: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getMonthlySalesStats(input?.months ?? 12);
  }),
  orderStatusDistribution: adminProcedure.query(async () => {
    return db.getOrderStatusDistribution();
  }),
  categorySales: adminProcedure.query(async () => {
    return db.getCategorySalesStats();
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
    return db.getLowStockOptions(10);
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
          subject: "[ソウルモノ] 配送が完了しました - レビューをお寄せください",
          html: generateReviewRequestEmail({
            customerName: "山田太郎",
            orderNumber: "ORD-2026-001234",
            productName: "ヘアケアシャンプー 500ml",
            reviewUrl: "https://talmoschool.com/shop/itemusewrite.php",
          }),
        };
      }

      if (input.type === "customs_hold") {
        return {
          subject: "[ソウルモノ] 通関検査のお知らせ - 配送が遅れる場合があります",
          html: generateCustomsHoldEmail({
            customerName: "山田太郎",
            orderNumber: "ORD-2026-001234",
            orderId: 999,
            customsNumber: "123456789",
            customerPhone: "010-1234-5678",
          }),
        };
      }

      if (input.type === "order_confirm") {
        return {
          subject: "[ソウルモノ] ご注文を承りました",
          html: await generateEmailTemplate({
            title: "ご注文を承りました",
            content: `いつもご利用ありがとうございます。<strong>山田太郎</strong>様\n\nご注文を正常に承りました。\n\n• ご注文番号: ORD-2026-001234\n• 商品名: ヘアケアシャンプー 500ml\n• ご注文金額: 32,000円\n\nご入金確認後、発送を開始いたします。\nどうぞよろしくお願いいたします。`,
            actionUrl: "https://talmoschool.com/mypage/orders",
            actionText: "ご注文履歴を確認",
          }),
        };
      }

      if (input.type === "payment_confirm") {
        return {
          subject: "[ソウルモノ] ご入金を確認しました - 発送の準備をしています",
          html: await generateEmailTemplate({
            title: "ご入金確認完了",
            content: `いつもご利用ありがとうございます。<strong>山田太郎</strong>様\n\nご注文代金のご入金を確認いたしました。\n\n• ご注文番号: ORD-2026-001234\n• ご入金額: 32,000円\n• お振込元銀行: ○○銀行\n\n商品の発送準備を進めております。発送開始時に改めてお知らせいたします。\nどうぞよろしくお願いいたします。`,
            actionUrl: "https://talmoschool.com/mypage/orders",
            actionText: "ご注文履歴を確認",
          }),
        };
      }

      if (input.type === "shipping_start") {
        return {
          subject: "[発送のお知らせ] ご注文番号 ORD-2026-001234 - CJ大韓通運",
          html: await generateEmailTemplate({
            title: "商品を発送しました",
            content: `いつもご利用ありがとうございます。<strong>山田太郎</strong>様\n\nご注文の商品を発送いたしました。\n\n• ご注文番号: ORD-2026-001234\n• 配送業者: CJ大韓通運\n• 追跡番号: 123456789012\n\n配送状況はマイページでご確認いただけます。\nどうぞよろしくお願いいたします。`,
            actionUrl: "https://talmoschool.com/mypage/orders",
            actionText: "配送状況を確認",
          }),
        };
      }

      if (input.type === "welcome") {
        return {
          subject: "[ソウルモノ] ご登録ありがとうございます！",
          html: await generateEmailTemplate({
            title: "山田太郎様、ソウルモノへようこそ！",
            content: `いつもご利用ありがとうございます。山田太郎様\n\nソウルモノにご登録いただきありがとうございます。\n\nソウルモノはインドの医薬品などを個人輸入でお届けする専門ショップで、薄毛ケア、男性機能、スキンケア、ダイエットなど、さまざまな商品をお手頃な価格でご提供しています。\n\nさっそくお買い物を始めましょう！`,
            actionUrl: "https://talmoschool.com/products",
            actionText: "ショッピングを始める",
          }),
        };
      }

      if (input.type === "auto_cancel") {
        return {
          subject: "[自動キャンセル] ご注文番号 ORD-2026-001234 - お振込期限切れ",
          html: await generateEmailTemplate({
            title: "ご注文の自動キャンセルのお知らせ",
            content: `いつもご利用ありがとうございます。<strong>山田太郎</strong>様\n\nご注文のお振込期限を過ぎたため、自動的にキャンセルされました。\n\n• ご注文番号: ORD-2026-001234\n• キャンセル理由: お振込期限切れ\n\n再度ご注文をご希望の場合は、あらためてご注文ください。\nご不明な点は個別お問い合わせをご利用ください。`,
            actionUrl: "https://talmoschool.com/mypage/inquiry",
            actionText: "個別に問い合わせる",
          }),
        };
      }

      if (input.type === "point_expire") {
        return {
          subject: "[ソウルモノ] ポイント失効予定のお知らせ",
          html: await generateEmailTemplate({
            title: "失効予定ポイントのお知らせ",
            content: `いつもご利用ありがとうございます。山田太郎様\n\n保有ポイントのうち<strong>5,000ポイント</strong>が30日以内に失効します。\n\n• 失効予定日: 2026-07-15\n• 失効予定ポイント: 5,000ポイント\n\n失効を防ぐため、今すぐご利用ください！`,
            actionUrl: "https://talmoschool.com/products",
            actionText: "ショッピングをする",
          }),
        };
      }

      // generic
      return {
        subject: "[ソウルモノ] 重要なお知らせ",
        html: await generateEmailTemplate({
          title: "メール通知のタイトル",
          content: `こんにちは。\n\nこれは一般的なお知らせメールのサンプルです。\n\n重要な内容をここに記載します。\n行間や強調テキストなどの基本スタイルをあらかじめご確認ください。`,
          actionUrl: "https://talmoschool.com",
          actionText: "ソウルモノへ",
        }),
      };
    }),
  
  // FAQ 관리
  getFaqs: adminProcedure.input(z.object({
    category: z.string().optional(),
    isActive: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getFaqs(input?.category, input?.isActive);
  }),
  
  createFaq: adminProcedure.input(z.object({
    category: z.string(),
    question: z.string(),
    answer: z.string(),
    sortOrder: z.number().optional(),
    isActive: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createFaq(input);
    return { id };
  }),
  
  updateFaq: adminProcedure.input(z.object({
    id: z.number(),
    category: z.string().optional(),
    question: z.string().optional(),
    answer: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateFaq(id, data);
    return { success: true };
  }),
  
  deleteFaq: adminProcedure.input(z.object({
    id: z.number(),
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
      ctx.user.name || "管理者",
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
    await db.upsertSetting("registrationPoints", String(input.registrationPoints), "会員登録ポイント");
    await db.upsertSetting("defaultProductPointRate", String(input.defaultProductPointRate), "基本商品ポイント還元率(%)");
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
      fromName: settings.smtpFromName ?? "ソウルモノ",
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
    await db.upsertSetting("smtpHost", input.host, "SMTPホスト");
    await db.upsertSetting("smtpPort", String(input.port), "SMTPポート");
    await db.upsertSetting("smtpUser", input.user, "SMTPユーザー");
    if (input.pass && input.pass !== "********") {
      await db.upsertSetting("smtpPass", input.pass, "SMTPパスワード");
    }
    const fromAddr = input.from?.trim() || input.user;
    await db.upsertSetting("smtpFrom", fromAddr, "送信元メールアドレス");
    await db.upsertSetting("smtpFromName", input.fromName ?? "ソウルモノ", "送信者名");
    await db.upsertSetting("smtpSecure", String(input.secure), "SMTP SSL");
    await db.upsertSetting("smtpBcc", input.bcc?.trim() ?? "", "BCC（非表示の宛先）");
    return { success: true };
  }),

  testSmtpEmail: adminProcedure.input(z.object({
    to: z.string().email(),
  })).mutation(async ({ input }) => {
    const { sendEmailViaSMTP } = await import("../_core/email");
    const result = await sendEmailViaSMTP({
      to: input.to,
      subject: "[ソウルモノ] SMTPテストメール",
      html: "<h2>SMTP連携テスト</h2><p>このメールが届いていれば、SMTP設定は正常に完了しています。</p><p>ソウルモノ 管理システム</p>",
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
    await db.upsertSetting("gnuApiBaseUrl", input.baseUrl, "旧システムAPI ベースURL");
    await db.upsertSetting("gnuApiToken", input.token, "旧システムAPI トークン");
    await db.upsertSetting("gnuApiEnabled", String(input.enabled), "旧システムAPI 同期を使用");
    return { success: true };
  }),

  syncGnuApiOrders: adminProcedure.mutation(async () => {
    const { getGnuApiConfig, syncOrdersFromApi } = await import("../jobs/gnuApiSync");
    const cfg = await getGnuApiConfig();
    if (!cfg.baseUrl || !cfg.token) throw new Error("API設定がありません。先にベースURLとトークンを保存してください。");
    return syncOrdersFromApi(cfg);
  }),

  syncGnuApiProducts: adminProcedure.mutation(async () => {
    const { getGnuApiConfig, syncProductsFromApi } = await import("../jobs/gnuApiSync");
    const cfg = await getGnuApiConfig();
    if (!cfg.baseUrl || !cfg.token) throw new Error("API設定がありません。");
    return syncProductsFromApi(cfg);
  }),

  syncGnuApiMembers: adminProcedure.mutation(async () => {
    const { getGnuApiConfig, syncMembersFromApi } = await import("../jobs/gnuApiSync");
    const cfg = await getGnuApiConfig();
    if (!cfg.baseUrl || !cfg.token) throw new Error("API設定がありません。");
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
      if (!boardRows.length) return { error: "レビュー掲示板がありません" };
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
        const title = (r.is_subject ?? "").trim() || "商品レビュー";
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
        seventeentrack_api_key: "17track 配送追跡APIキー",
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
        return { success: false, message: "APIキーが設定されていません。" };
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
          return { success: false, message: "APIキーが無効です。（認証失敗）" };
        }
        const data = await response.json();
        if (data.code === 0 || (data.code >= -18019999 && data.code <= -18019000)) {
          return { success: true, message: "APIキーは正常に動作しています。" };
        }
        if (data.code === -18010009) {
          return { success: false, message: "APIキーが無効です。" };
        }
        return { success: true, message: `接続に成功しました (コード: ${data.code})` };
      } catch (e: any) {
        return { success: false, message: "接続に失敗しました: " + e.message };
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
