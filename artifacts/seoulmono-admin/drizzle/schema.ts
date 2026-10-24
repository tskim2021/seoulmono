import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, customType } from "drizzle-orm/mysql-core";

const json = customType<{ data: any; driverData: string }>({
  dataType() { return "json"; },
  fromDriver(value: unknown): any {
    if (typeof value === "string") {
      try { return JSON.parse(value); } catch { return value; }
    }
    return value;
  },
  toDriver(value: any): string {
    return JSON.stringify(value);
  },
});

// ─── Users ───
export const users = mysqlTable("a2_users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  phone: varchar("phone", { length: 20 }),
  grade: mysqlEnum("grade", ["bronze", "silver", "gold", "vip", "vvip"]).default("bronze").notNull(),
  points: int("points").default(0).notNull(),
  totalSpent: int("totalSpent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  emailNotifications: int("emailNotifications").default(1).notNull(),
  emailNotifyOrder: int("emailNotifyOrder").default(1).notNull(),
  emailNotifyPoint: int("emailNotifyPoint").default(1).notNull(),
  emailNotifyReview: int("emailNotifyReview").default(1).notNull(),
  emailNotifyComment: int("emailNotifyComment").default(1).notNull(),
  emailNotifySystem: int("emailNotifySystem").default(1).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ───
export const categories = mysqlTable("a2_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  parentId: int("parentId"),
  description: text("description"),
  imageUrl: text("imageUrl"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ───
export const products = mysqlTable("a2_products", {
  id: int("id").autoincrement().primaryKey(),
  itId: varchar("itId", { length: 50 }),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  content: text("content"),
  price: int("price").notNull(),
  salePrice: int("salePrice"),
  stock: int("stock").default(0).notNull(),
  images: json("images").$type<string[]>(),
  thumbnail: text("thumbnail"),
  status: mysqlEnum("status", ["active", "inactive", "soldout"]).default("active").notNull(),
  isFeatured: int("isFeatured").default(0).notNull(),
  isNew: int("isNew").default(0).notNull(),
  isBest: int("isBest").default(0).notNull(),
  noDiscount: int("noDiscount").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  reviewCount: int("reviewCount").default(0).notNull(),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }).default("0.00"),
  pointRate: int("pointRate").default(1).notNull(),
  pointRateType: text("pointRateType").default("percent").notNull(),
  minGrade: mysqlEnum("minGrade", ["bronze", "silver", "gold", "vip", "vvip"]).default("bronze").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  hashtags: json("hashtags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Product Options ───
export type OptionValue = { value: string; englishValue?: string; price: number; stock?: number };

export const productOptions = mysqlTable("a2_productOptions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  values: json("optionValues").$type<OptionValue[]>().notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isRequired: int("isRequired").default(1).notNull(),
});

export type ProductOption = typeof productOptions.$inferSelect;

// ─── Cart Items ───
export const cartItems = mysqlTable("a2_cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  options: json("options").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;

// ─── Wishlist ───
export const wishlistItems = mysqlTable("a2_wishlistItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WishlistItem = typeof wishlistItems.$inferSelect;

// ─── Price Alerts ───
export const priceAlerts = mysqlTable("a2_priceAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  targetPrice: int("targetPrice").notNull(),
  originalPrice: int("originalPrice").notNull(),
  previousPrice: int("previousPrice"),
  changeDirection: text("changeDirection"),
  changedAt: timestamp("changedAt"),
  isNotified: int("isNotified").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  notifiedAt: timestamp("notifiedAt"),
});

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

// ─── Restock Alerts ───
export const restockAlerts = mysqlTable("a2_restockAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  optionName: varchar("optionName", { length: 100 }),
  optionValue: varchar("optionValue", { length: 100 }),
  isNotified: int("isNotified").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  notifiedAt: timestamp("notifiedAt"),
});

export type RestockAlert = typeof restockAlerts.$inferSelect;
export type InsertRestockAlert = typeof restockAlerts.$inferInsert;

// ─── Addresses ───
export const addresses = mysqlTable("a2_addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  recipient: varchar("recipient", { length: 50 }).notNull(),
  recipientNameEn: varchar("recipientNameEn", { length: 100 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  zipCode: varchar("zipCode", { length: 10 }).notNull(),
  address1: varchar("address1", { length: 255 }).notNull(),
  address2: varchar("address2", { length: 255 }),
  addressEn1: varchar("addressEn1", { length: 255 }),
  addressEn2: varchar("addressEn2", { length: 255 }),
  isDefault: int("isDefault").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

// ─── Orders ───
export const orders = mysqlTable("a2_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderNumber: varchar("orderNumber", { length: 30 }).notNull().unique(),
  source: varchar("source", { length: 20 }).default("new").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "preparing", "shipping", "delivered", "cancelled", "refunded", "customs_hold"]).default("pending").notNull(),
  totalAmount: int("totalAmount").notNull(),
  discountAmount: int("discountAmount").default(0).notNull(),
  shippingFee: int("shippingFee").default(0).notNull(),
  pointsUsed: int("pointsUsed").default(0).notNull(),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  couponId: int("couponId"),
  couponDiscount: int("couponDiscount").default(0).notNull(),
  promoCodeId: int("promoCodeId"),
  promoCodeDiscount: int("promoCodeDiscount").default(0).notNull(),
  recipientName: varchar("recipientName", { length: 50 }).notNull(),
  recipientNameEn: varchar("recipientNameEn", { length: 50 }),
  recipientPhone: varchar("recipientPhone", { length: 20 }).notNull(),
  zipCode: varchar("zipCode", { length: 10 }).notNull(),
  address1: varchar("address1", { length: 255 }).notNull(),
  address2: varchar("address2", { length: 255 }),
  addressEn1: varchar("addressEn1", { length: 255 }),
  addressEn2: varchar("addressEn2", { length: 255 }),
  memo: text("memo"),
  adminNotes: text("adminNotes"),
  paidAt: timestamp("paidAt"),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ───
export const orderItems = mysqlTable("a2_orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId"),
  productName: varchar("productName", { length: 255 }).notNull(),
  productThumbnail: text("productThumbnail"),
  price: int("price").notNull(),
  quantity: int("quantity").notNull(),
  options: json("options").$type<Record<string, string>>(),
  cancelledAt: timestamp("cancelledAt"),
  cancelReason: varchar("cancelReason", { length: 500 }),
  refundAmount: int("refundAmount"),
  refundedAt: timestamp("refundedAt").default(null),
  itemStatus: varchar("itemStatus", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ─── Point History ───
export const pointHistory = mysqlTable("a2_pointHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["earn", "use", "admin", "refund"]).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  orderId: int("orderId"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointHistoryEntry = typeof pointHistory.$inferSelect;

// ─── Board (Community) ───
export const boards = mysqlTable("a2_boards", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  boardType: mysqlEnum("boardType", ["free", "review", "qna", "notice", "news", "info"]).notNull(),
  isActive: int("isActive").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Board = typeof boards.$inferSelect;

// ─── Site Settings ───
export const siteSettings = mysqlTable("a2_siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  description: varchar("description", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// ─── Posts ───
export const posts = mysqlTable("a2_posts", {
  id: int("id").autoincrement().primaryKey(),
  boardId: int("boardId").notNull(),
  userId: int("userId").notNull(),
  productId: int("productId"),
  orderId: int("orderId"),
  orderItemId: int("orderItemId"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  images: json("images").$type<string[]>(),
  rating: int("rating"),
  isNotice: int("isNotice").default(0).notNull(),
  isPinned: int("isPinned").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  isHidden: int("isHidden").default(0).notNull(),
  isBest: int("isBest").default(0).notNull(),
  isAnswered: int("isAnswered").default(0).notNull(),
  needsHuman: int("needsHuman").default(0).notNull(),
  categoryId: int("categoryId"),
  isAutoGenerated: int("isAutoGenerated").default(0).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  newsSection: varchar("newsSection", { length: 50 }),
  authorName: varchar("authorName", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// ─── Comments ───
export const comments = mysqlTable("a2_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  parentId: int("parentId"),
  content: text("content").notNull(),
  isAdmin: int("isAdmin").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// ─── Notifications ───
export const notifications = mysqlTable("a2_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["order", "comment", "point", "system", "review", "inquiry", "discussion"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Banners ───
export const banners = mysqlTable("a2_banners", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  mobileImageUrl: text("mobileImageUrl"),
  linkUrl: text("linkUrl"),
  isActive: int("isActive").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Banner = typeof banners.$inferSelect;

// ─── Search Keywords ───
export const searchKeywords = mysqlTable("a2_searchKeywords", {
  id: int("id").autoincrement().primaryKey(),
  keyword: varchar("keyword", { length: 100 }).notNull().unique(),
  searchCount: int("searchCount").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  lastSearchedAt: timestamp("lastSearchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchKeyword = typeof searchKeywords.$inferSelect;

// ─── Coupons ───
export const coupons = mysqlTable("a2_coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["percent", "fixed"]).notNull(),
  discountValue: int("discountValue").notNull(),
  minOrderAmount: int("minOrderAmount").default(0).notNull(),
  maxDiscountAmount: int("maxDiscountAmount"),
  totalQuantity: int("totalQuantity").default(-1).notNull(),
  usedCount: int("usedCount").default(0).notNull(),
  perUserLimit: int("perUserLimit"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: int("isActive").default(1).notNull(),
  targetType: varchar("targetType", { length: 20 }).default("all").notNull(),
  targetProductIds: text("targetProductIds"),
  targetCategoryIds: text("targetCategoryIds"),
  assignType: varchar("assignType", { length: 20 }).default("all").notNull(),
  assignUserIds: text("assignUserIds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// ─── Promo Codes (Discount Codes) ───
export const promoCodes = mysqlTable("a2_promoCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discountType: mysqlEnum("promoDiscountType", ["percent", "fixed"]).notNull(),
  discountValue: int("discountValue").notNull(),
  minOrderAmount: int("minOrderAmount").default(0).notNull(),
  maxDiscountAmount: int("maxDiscountAmount"),
  totalUsageLimit: int("totalUsageLimit").default(-1).notNull(),
  usedCount: int("usedCount").default(0).notNull(),
  perUserLimit: int("perUserLimit").default(1).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: int("isActive").default(1).notNull(),
  targetProductIds: text("targetProductIds"),
  targetCategoryIds: text("targetCategoryIds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

export const promoCodeUsages = mysqlTable("a2_promoCodeUsages", {
  id: int("id").autoincrement().primaryKey(),
  promoCodeId: int("promoCodeId").notNull(),
  userId: int("userId").notNull(),
  orderId: int("orderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PromoCodeUsage = typeof promoCodeUsages.$inferSelect;
export type InsertPromoCodeUsage = typeof promoCodeUsages.$inferInsert;

// ─── User Coupons ───
export const userCoupons = mysqlTable("a2_userCoupons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  couponId: int("couponId").notNull(),
  isUsed: int("isUsed").default(0).notNull(),
  usedAt: timestamp("usedAt"),
  orderId: int("orderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserCoupon = typeof userCoupons.$inferSelect;

// ─── Review Replies (Admin) ───
export const reviewReplies = mysqlTable("a2_reviewReplies", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReviewReply = typeof reviewReplies.$inferSelect;
export type InsertReviewReply = typeof reviewReplies.$inferInsert;

// ─── Shipping Carriers ───
export const shippingCarriers = mysqlTable("a2_shippingCarriers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  trackingUrlTemplate: text("trackingUrlTemplate"),
  isActive: int("isActive").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShippingCarrier = typeof shippingCarriers.$inferSelect;
export type InsertShippingCarrier = typeof shippingCarriers.$inferInsert;

// ─── Shipments ───
export const shipments = mysqlTable("a2_shipments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  orderItemId: int("orderItemId"),
  carrierId: int("carrierId").notNull(),
  trackingNumber: varchar("trackingNumber", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "accepted", "export_customs", "departed_origin", "in_transit_intl", "arrived_destination", "import_customs", "customs_cleared", "in_transit_domestic", "returned", "customs_hold", "customs_arrival", "customs_departure", "alert"]).default("pending").notNull(),
  shippingType: mysqlEnum("shippingType", ["domestic", "international"]).default("international").notNull(),
  webhookRegistered: int("webhookRegistered").default(0).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  estimatedDeliveryDate: timestamp("estimatedDeliveryDate"),
  actualDeliveryDate: timestamp("actualDeliveryDate"),
  shippedAt: timestamp("shippedAt"),
  customsNumber: varchar("customsNumber", { length: 50 }),
  customsOffice: varchar("customsOffice", { length: 100 }),
  customsHoldAt: timestamp("customsHoldAt"),
  customsConfirmed: int("customsConfirmed").default(0).notNull(),
  customsConfirmedAt: timestamp("customsConfirmedAt"),
  customsConfirmedBy: int("customsConfirmedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;

// ─── Shipping History ───
export const shippingHistory = mysqlTable("a2_shippingHistory", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  status: mysqlEnum("status", ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "accepted", "export_customs", "departed_origin", "in_transit_intl", "arrived_destination", "import_customs", "customs_cleared", "in_transit_domestic", "returned"]).notNull(),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  rawStatus: text("rawStatus"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShippingHistoryEntry = typeof shippingHistory.$inferSelect;

// ─── Shipping Policies ───
export const shippingPolicies = mysqlTable("a2_shippingPolicies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  baseFee: int("baseFee").default(3000).notNull(),
  freeShippingThreshold: int("freeShippingThreshold").default(50000).notNull(),
  additionalFee: int("additionalFee").default(0).notNull(),
  additionalFeeRegions: json("additionalFeeRegions").$type<string[]>(),
  isDefault: int("isDefault").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ShippingPolicy = typeof shippingPolicies.$inferSelect;
export type InsertShippingPolicy = typeof shippingPolicies.$inferInsert;

// ─── Return Requests ───
export const returnRequests = mysqlTable("a2_returnRequests", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["return", "exchange"]).notNull(),
  status: mysqlEnum("returnStatus", ["requested", "approved", "collecting", "collected", "completed", "rejected"]).default("requested").notNull(),
  reason: text("reason").notNull(),
  detailReason: text("detailReason"),
  images: json("images").$type<string[]>(),
  adminMemo: text("adminMemo"),
  returnTrackingNumber: varchar("returnTrackingNumber", { length: 100 }),
  returnCarrierId: int("returnCarrierId"),
  refundAmount: int("refundAmount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReturnRequest = typeof returnRequests.$inferSelect;
export type InsertReturnRequest = typeof returnRequests.$inferInsert;

// ─── Grade Benefits ───
export const gradeBenefits = mysqlTable("a2_gradeBenefits", {
  id: int("id").autoincrement().primaryKey(),
  grade: mysqlEnum("benefitGrade", ["bronze", "silver", "gold", "vip", "vvip"]).notNull().unique(),
  discountRate: int("discountRate").default(0).notNull(),
  pointRate: int("pointRate").default(1).notNull(),
  freeShippingThreshold: int("freeShippingThreshold").default(0).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GradeBenefit = typeof gradeBenefits.$inferSelect;
export type InsertGradeBenefit = typeof gradeBenefits.$inferInsert;

// ─── Grade Upgrade Conditions ───
export const gradeUpgradeConditions = mysqlTable("a2_gradeUpgradeConditions", {
  id: int("id").autoincrement().primaryKey(),
  grade: mysqlEnum("upgradeGrade", ["bronze", "silver", "gold", "vip", "vvip"]).notNull().unique(),
  minTotalSpent: int("minTotalSpent").default(0).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GradeUpgradeCondition = typeof gradeUpgradeConditions.$inferSelect;
export type InsertGradeUpgradeCondition = typeof gradeUpgradeConditions.$inferInsert;

// ─── Chatbot Settings ───
export const chatbotSettings = mysqlTable("a2_chatbotSettings", {
  id: int("id").autoincrement().primaryKey(),
  greetingMessage: text("greetingMessage").notNull().default("안녕하세요! AI 상담사입니다. 무엇을 도와드릴까요?"),
  isEnabled: int("isEnabled").default(1).notNull(),
  systemPromptOverride: text("systemPromptOverride"),
  maxTurns: int("maxTurns").default(20).notNull(),
  responseUnavailableMessage: text("responseUnavailableMessage").default("죄송합니다. 해당 질문에 대한 답변을 찾을 수 없습니다."),
  operatingHoursStart: varchar("operatingHoursStart", { length: 5 }).default("00:00"),
  operatingHoursEnd: varchar("operatingHoursEnd", { length: 5 }).default("23:59"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ChatbotSettings = typeof chatbotSettings.$inferSelect;
export type InsertChatbotSettings = typeof chatbotSettings.$inferInsert;

// ─── Chatbot Categories ───
export const chatbotCategories = mysqlTable("a2_chatbotCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatbotCategory = typeof chatbotCategories.$inferSelect;
export type InsertChatbotCategory = typeof chatbotCategories.$inferInsert;

// ─── Chatbot QnA ───
export const chatbotQna = mysqlTable("a2_chatbotQna", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ChatbotQna = typeof chatbotQna.$inferSelect;
export type InsertChatbotQna = typeof chatbotQna.$inferInsert;

// ─── Chatbot Conversations ───
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export const chatbotConversations = mysqlTable("a2_chatbotConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  messages: json("messages").$type<ChatMessage[]>().notNull(),
  satisfaction: int("satisfaction"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = typeof chatbotConversations.$inferInsert;

// ─── Review Point Settings ───
export const reviewPointSettings = mysqlTable("a2_reviewPointSettings", {
  id: int("id").autoincrement().primaryKey(),
  pointsPerReview: int("pointsPerReview").default(100).notNull(),
  pointsPerPhotoReview: int("pointsPerPhotoReview").default(200).notNull(),
  minRatingForPoints: int("minRatingForPoints").default(1).notNull(),
  likePointsThreshold: int("likePointsThreshold").default(10).notNull(),
  pointsPerLikeThreshold: int("pointsPerLikeThreshold").default(50).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ReviewPointSetting = typeof reviewPointSettings.$inferSelect;
export type InsertReviewPointSetting = typeof reviewPointSettings.$inferInsert;

// ─── Review Likes ───
export const reviewLikes = mysqlTable("a2_reviewLikes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReviewLike = typeof reviewLikes.$inferSelect;
export type InsertReviewLike = typeof reviewLikes.$inferInsert;

// ─── Email Templates ───
export const emailTemplates = mysqlTable("a2_emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#3b82f6").notNull(),
  footerText: text("footerText"),
  footerLinks: text("footerLinks"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// ─── Email Logs ───
export const emailLogs = mysqlTable("a2_emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  status: mysqlEnum("emailLogStatus", ["sent", "failed"]).default("sent").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

// ─── FAQ ───
export const faqs = mysqlTable("a2_faqs", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = typeof faqs.$inferInsert;

// ─── Inquiry Replies ───
export const inquiryReplies = mysqlTable("a2_inquiryReplies", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  adminId: int("adminId").notNull(),
  content: text("content").notNull(),
  attachments: json("attachments").$type<string[]>(),
  isAutoReply: int("isAutoReply").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type InquiryReply = typeof inquiryReplies.$inferSelect;
export type InsertInquiryReply = typeof inquiryReplies.$inferInsert;

// ─── Bank Accounts ───
export const bankAccounts = mysqlTable("a2_bankAccounts", {
  id: int("id").autoincrement().primaryKey(),
  bankName: varchar("bankName", { length: 50 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(),
  accountHolder: varchar("accountHolder", { length: 50 }).notNull(),
  isActive: int("isActive").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

// ─── Payments ───
export const payments = mysqlTable("a2_payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "card", "virtual_account"]).notNull(),
  bankAccountId: int("bankAccountId"),
  depositorName: varchar("depositorName", { length: 50 }),
  depositAmount: int("depositAmount"),
  expiresAt: timestamp("expiresAt"),
  status: mysqlEnum("paymentStatus", ["pending", "confirmed", "cancelled", "expired"]).default("pending").notNull(),
  confirmedAt: timestamp("confirmedAt"),
  confirmedBy: int("confirmedBy"),
  adminMemo: text("adminMemo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Payment Methods Settings ───
export const paymentMethods = mysqlTable("a2_paymentMethods", {
  id: int("id").autoincrement().primaryKey(),
  methodCode: varchar("methodCode", { length: 50 }).notNull().unique(),
  methodName: varchar("methodName", { length: 100 }).notNull(),
  isEnabled: int("isEnabled").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  apiConfig: text("apiConfig"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

// ─── News Auto Settings ───
export const newsAutoSettings = mysqlTable("a2_newsAutoSettings", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  isEnabled: int("isEnabled").default(1).notNull(),
  frequency: varchar("frequency", { length: 20 }).default("daily").notNull(),
  generateTime: varchar("generateTime", { length: 5 }).default("09:00").notNull(),
  keywords: text("keywords"),
  keywordsEn: text("keywordsEn"),
  promptTemplate: text("promptTemplate"),
  autoPublish: int("autoPublish").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NewsAutoSetting = typeof newsAutoSettings.$inferSelect;
export type InsertNewsAutoSetting = typeof newsAutoSettings.$inferInsert;

// ─── Product Info Sections ───
export const productInfoSections = mysqlTable("a2_productInfoSections", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  sectionType: mysqlEnum("sectionType", ["faq", "usage", "dosage", "sideEffects", "precautions"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  isAutoGenerated: int("isAutoGenerated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ProductInfoSection = typeof productInfoSections.$inferSelect;
export type InsertProductInfoSection = typeof productInfoSections.$inferInsert;

// ─── Discussions ───
export const discussions = mysqlTable("a2_discussions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  tags: json("tags").$type<string[]>(),
  viewCount: int("viewCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  isPinned: int("isPinned").default(0).notNull(),
  isClosed: int("isClosed").default(0).notNull(),
  isHidden: int("isHidden").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Discussion = typeof discussions.$inferSelect;
export type InsertDiscussion = typeof discussions.$inferInsert;

// ─── Discussion Comments ───
export const discussionComments = mysqlTable("a2_discussionComments", {
  id: int("id").autoincrement().primaryKey(),
  discussionId: int("discussionId").notNull(),
  userId: int("userId").notNull(),
  parentId: int("parentId"),
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  isHidden: int("isHidden").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type DiscussionComment = typeof discussionComments.$inferSelect;
export type InsertDiscussionComment = typeof discussionComments.$inferInsert;

// ─── Discussion Likes ───
export const discussionLikes = mysqlTable("a2_discussionLikes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetType: mysqlEnum("targetType", ["discussion", "comment"]).notNull(),
  targetId: int("targetId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DiscussionLike = typeof discussionLikes.$inferSelect;

// ─── InfoBoard Auto Post Settings ───
export const infoBoardAutoSettings = mysqlTable("a2_infoBoardAutoSettings", {
  id: int("id").autoincrement().primaryKey(),
  isEnabled: int("isEnabled").default(0).notNull(),
  categoryId: int("categoryId"),
  generateTime: varchar("generateTime", { length: 5 }).default("09:00").notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  keywords: text("keywords"),
  keywordsEn: text("keywordsEn"),
  promptTemplate: text("promptTemplate"),
  postStyle: mysqlEnum("postStyle", ["informative", "guide", "tips", "comparison", "news"]).default("informative").notNull(),
  autoPublish: int("autoPublish").default(1).notNull(),
  autoGenerateImage: int("autoGenerateImage").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type InfoBoardAutoSetting = typeof infoBoardAutoSettings.$inferSelect;
export type InsertInfoBoardAutoSetting = typeof infoBoardAutoSettings.$inferInsert;

// ─── InfoBoard Auto Post Logs ───
export const infoBoardAutoLogs = mysqlTable("a2_infoBoardAutoLogs", {
  id: int("id").autoincrement().primaryKey(),
  settingId: int("settingId").notNull(),
  status: mysqlEnum("infoBoardLogStatus", ["success", "failed", "skipped"]).notNull(),
  postId: int("postId"),
  generatedTitle: varchar("generatedTitle", { length: 255 }),
  errorMessage: text("errorMessage"),
  executionTimeMs: int("executionTimeMs"),
  triggeredBy: mysqlEnum("infoBoardTriggeredBy", ["scheduler", "manual"]).default("scheduler").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InfoBoardAutoLog = typeof infoBoardAutoLogs.$inferSelect;
export type InsertInfoBoardAutoLog = typeof infoBoardAutoLogs.$inferInsert;

// ─── Discussion Auto Post Settings ───
export const discussionAutoSettings = mysqlTable("a2_discussionAutoSettings", {
  id: int("id").autoincrement().primaryKey(),
  isEnabled: int("isEnabled").default(0).notNull(),
  categoryId: int("categoryId"),
  generateTime: varchar("generateTime", { length: 5 }).default("09:00").notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  keywords: text("keywords"),
  keywordsEn: text("keywordsEn"),
  promptTemplate: text("promptTemplate"),
  discussionStyle: mysqlEnum("discussionStyle", ["debate", "opinion", "question", "poll", "experience"]).default("debate").notNull(),
  autoPublish: int("autoPublish").default(1).notNull(),
  autoGenerateImage: int("autoGenerateImage").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type DiscussionAutoSetting = typeof discussionAutoSettings.$inferSelect;
export type InsertDiscussionAutoSetting = typeof discussionAutoSettings.$inferInsert;

// ─── Admin Action Logs ───
export const adminActionLogs = mysqlTable("a2_adminActionLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  adminName: varchar("adminName", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: varchar("entityId", { length: 100 }),
  description: text("description"),
  detail: json("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AdminActionLog = typeof adminActionLogs.$inferSelect;
export type InsertAdminActionLog = typeof adminActionLogs.$inferInsert;

// ─── Discussion Auto Post Logs ───
export const discussionAutoLogs = mysqlTable("a2_discussionAutoLogs", {
  id: int("id").autoincrement().primaryKey(),
  settingId: int("settingId").notNull(),
  status: mysqlEnum("discussionLogStatus", ["success", "failed", "skipped"]).notNull(),
  discussionId: int("discussionId"),
  generatedTitle: varchar("generatedTitle", { length: 255 }),
  errorMessage: text("errorMessage"),
  executionTimeMs: int("executionTimeMs"),
  triggeredBy: mysqlEnum("discussionTriggeredBy", ["scheduler", "manual"]).default("scheduler").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DiscussionAutoLog = typeof discussionAutoLogs.$inferSelect;
export type InsertDiscussionAutoLog = typeof discussionAutoLogs.$inferInsert;

// ─── Visitor Logs ───
export const visitorLogs = mysqlTable("a2_visitorLogs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: int("userId"),
  ip: varchar("ip", { length: 45 }),
  path: varchar("path", { length: 255 }).notNull(),
  userAgent: varchar("userAgent", { length: 255 }),
  referer: varchar("referer", { length: 255 }),
  country: varchar("country", { length: 2 }),
  device: varchar("device", { length: 20 }).default("desktop"),
  isNew: mysqlEnum("isNew", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VisitorLog = typeof visitorLogs.$inferSelect;
export type InsertVisitorLog = typeof visitorLogs.$inferInsert;
