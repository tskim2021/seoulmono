import { eq, and, ne, desc, asc, like, sql, inArray, or, isNotNull, isNull, gte, not, lt, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { getTableColumns } from "drizzle-orm";
import {
  InsertUser, users, categories, products, productOptions,
  cartItems, wishlistItems,
  priceAlerts, restockAlerts, addresses, orders, orderItems,
  pointHistory, boards, posts, comments, notifications, banners,
  searchKeywords, siteSettings, coupons, userCoupons, promoCodes, promoCodeUsages, reviewReplies,
  emailLogs, faqs, inquiryReplies,
  shippingCarriers, shipments, shippingHistory, shippingPolicies, returnRequests,
  gradeBenefits, gradeUpgradeConditions,
  chatbotSettings, chatbotCategories, chatbotQna, chatbotConversations,
  reviewPointSettings,
  bankAccounts, payments, paymentMethods,
  type InsertCategory, type InsertProduct, type InsertPost,
  type InsertPromoCode,
  type InsertComment, type InsertAddress, type InsertOrder,
  type InsertCoupon, type InsertReviewReply, type InsertShipment,
  type InsertFaq, type InsertInquiryReply,
  type InsertShippingCarrier, type InsertShippingPolicy, type InsertReturnRequest,
  type OptionValue, type GradeBenefit, type InsertGradeBenefit,
  type GradeUpgradeCondition, type InsertGradeUpgradeCondition,
  type ChatbotSettings, type InsertChatbotSettings,
  type ChatbotCategory, type InsertChatbotCategory,
  type ChatbotQna, type InsertChatbotQna,
  type ChatbotConversation, type InsertChatbotConversation,
  type InsertBankAccount, type InsertPayment, type InsertPaymentMethod,
  newsAutoSettings, type NewsAutoSetting, type InsertNewsAutoSetting,
  productInfoSections, type ProductInfoSection, type InsertProductInfoSection,
  discussions, type Discussion, type InsertDiscussion,
  discussionComments, type DiscussionComment, type InsertDiscussionComment,
  discussionLikes, type DiscussionLike,
  infoBoardAutoSettings, type InfoBoardAutoSetting, type InsertInfoBoardAutoSetting,
  infoBoardAutoLogs, type InfoBoardAutoLog, type InsertInfoBoardAutoLog,
  discussionAutoSettings, type DiscussionAutoSetting, type InsertDiscussionAutoSetting,
  discussionAutoLogs, type DiscussionAutoLog, type InsertDiscussionAutoLog
} from "../drizzle/schema";
import { ENV } from './_core/env';
// === seoulmono-admin: 그누보드5(kapp_s001) 어댑터 ===
import {
  g5GetMemberByEmailOrId,
  g5GetMemberById,
  g5GetMemberByNo,
  mapMemberToUser,
  verifyGnuboardPassword,
  g5q,
  g5one,
  mapOrderToTalmo,
  G5_ORDER_COLS,
} from "./g5";


let _db: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        typeCast(field, next) {
          if (field.type === "BLOB") {
            const val = field.string();
            if (val === null || val === undefined) return null;
            const s = val.trimStart();
            if (s.startsWith("[") || s.startsWith("{")) {
              try { return JSON.parse(val); } catch { return val; }
            }
            return val;
          }
          return next();
        },
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  // [연결됨] g5 계정은 운영 DB(g5_member)에 쓰지 않는다.
  // 로그인 시각 갱신 정도의 부수 효과도 만들지 않기 위해 무시한다.
  if (user.openId.startsWith("g5:")) return;
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

function stripPassword<T extends Record<string, unknown>>(user: T): Omit<T, 'password'> {
  const { password, ...safe } = user;
  return safe;
}

export async function getUserByOpenId(openId: string) {
  // [연결됨] g5_member. openId 는 `g5:<mb_id>` 형식이다.
  if (openId?.startsWith("g5:")) {
    const m = await g5GetMemberById(openId.slice(3));
    if (!m) return undefined;
    return stripPassword(mapMemberToUser(m));
  }
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? stripPassword(result[0]) : undefined;
}

export async function getUserByEmail(email: string) {
  // [연결됨] g5_member. 이메일 또는 그누보드 아이디로 찾는다.
  const m = await g5GetMemberByEmailOrId(email);
  return m ? mapMemberToUser(m) : undefined;
}

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPassword(userId: number, hashedPassword: string) {
  await g5q("UPDATE g5_member SET mb_password = ? WHERE mb_no = ?", [hashedPassword, userId]);
}

export async function findUserByNameAndPhone(name: string, phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users)
    .where(and(eq(users.name, name), eq(users.phone, phone)))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getUserWithPasswordById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function getUserById(id: number) {
  // [연결됨] g5_member.mb_no
  if (!id) return undefined;
  const m = await g5GetMemberByNo(id);
  return m ? stripPassword(mapMemberToUser(m)) : undefined;
}

export async function updateUserProfile(userId: number, data: { name?: string; phone?: string; email?: string; emailNotifications?: number; emailNotifyOrder?: number; emailNotifyPoint?: number; emailNotifyReview?: number; emailNotifyComment?: number; emailNotifySystem?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getAllUserIds(): Promise<number[]> {
  const rows = await g5q<{ mb_no: number }>("SELECT mb_no FROM g5_member");
  return rows.map((r) => Number(r.mb_no));
}

export async function getAllUsers(
  page = 1,
  limit = 20,
  search?: string,
  role?: string,
  sortBy?: string,
  searchField?: string,
  dateField?: string,
  dateFrom?: string,
  dateTo?: string,
  statusFilter?: string,
) {
  const offset = (page - 1) * limit;
  const where: string[] = [];
  const params: any[] = [];
  if (search) {
    const col = searchField === "name" ? "m.mb_name" : searchField === "nick" ? "m.mb_nick" : searchField === "phone" ? "m.mb_hp" : "m.mb_id";
    where.push(`${col} LIKE ?`);
    params.push(`%${search}%`);
  }
  if (role === "admin") where.push("m.mb_level >= 10");
  else if (role === "user") where.push("m.mb_level < 10");
  const dateCol = dateField === "lastLogin" ? "m.mb_today_login" : "m.mb_datetime";
  if (dateFrom) { where.push(`${dateCol} >= ?`); params.push(`${dateFrom} 00:00:00`); }
  if (dateTo) { where.push(`${dateCol} <= ?`); params.push(`${dateTo} 23:59:59`); }
  if (statusFilter === "blocked") where.push("(m.mb_intercept_date IS NOT NULL AND m.mb_intercept_date != '')");
  else if (statusFilter === "withdrawn") where.push("(m.mb_leave_date IS NOT NULL AND m.mb_leave_date != '')");
  else if (statusFilter === "normal") where.push("(m.mb_leave_date IS NULL OR m.mb_leave_date = '') AND (m.mb_intercept_date IS NULL OR m.mb_intercept_date = '')");
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  let orderSql: string;
  switch (sortBy) {
    case "name": orderSql = "ORDER BY m.mb_name ASC"; break;
    case "lastSignedIn": orderSql = "ORDER BY m.mb_today_login DESC"; break;
    case "orderCount": orderSql = "ORDER BY order_count DESC"; break;
    case "totalPaid": orderSql = "ORDER BY total_paid DESC"; break;
    case "points": orderSql = "ORDER BY m.mb_point DESC"; break;
    case "createdAt_asc": orderSql = "ORDER BY m.mb_datetime ASC"; break;
    default: orderSql = "ORDER BY m.mb_datetime DESC";
  }
  const rows = await g5q<any>(
    `SELECT m.mb_no, m.mb_id, m.mb_name, m.mb_email, m.mb_hp, m.mb_level, m.mb_point, m.mb_datetime, m.mb_today_login,
            m.mb_leave_date, m.mb_intercept_date, m.mb_email_certify, m.mb_mailling,
            COUNT(DISTINCT o.od_id) AS order_count,
            COALESCE(SUM(o.od_receipt_price), 0) AS total_paid
     FROM g5_member m
     LEFT JOIN g5_shop_order o ON o.mb_id = m.mb_id
     ${whereSql}
     GROUP BY m.mb_no
     ${orderSql}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const countRow = await g5one<{ c: number }>(`SELECT COUNT(*) AS c FROM g5_member m ${whereSql}`, params);
  const users = rows.map((r: any) => {
    const isWithdrawn = !!(r.mb_leave_date && r.mb_leave_date !== "");
    const isBlocked = !!(r.mb_intercept_date && r.mb_intercept_date !== "");
    return {
      id: Number(r.mb_no),
      openId: `g5:${r.mb_id}`,
      loginId: r.mb_id,
      name: r.mb_name || r.mb_id,
      email: r.mb_email || null,
      loginMethod: "g5",
      role: Number(r.mb_level) >= 10 ? "admin" : "user",
      phone: r.mb_hp || null,
      grade: "bronze",
      totalSpent: Number(r.total_paid) || 0,
      createdAt: r.mb_datetime,
      lastSignedIn: r.mb_today_login,
      orderCount: Number(r.order_count) || 0,
      totalPaid: Number(r.total_paid) || 0,
      points: Number(r.mb_point) || 0,
      status: isWithdrawn ? "withdrawn" : isBlocked ? "blocked" : "normal",
      emailCertified: !!(r.mb_email_certify && String(r.mb_email_certify) !== "0000-00-00 00:00:00"),
      mailReceive: Number(r.mb_mailling) === 1,
    };
  });
  return { users, total: Number(countRow?.c) || 0 };
}

export async function getUserStatusCounts() {
  const row = await g5one<{ blocked: number; withdrawn: number }>(
    `SELECT
       SUM(CASE WHEN mb_intercept_date IS NOT NULL AND mb_intercept_date != '' THEN 1 ELSE 0 END) AS blocked,
       SUM(CASE WHEN mb_leave_date IS NOT NULL AND mb_leave_date != '' THEN 1 ELSE 0 END) AS withdrawn
     FROM g5_member`
  );
  return { blocked: Number(row?.blocked) || 0, withdrawn: Number(row?.withdrawn) || 0 };
}

export async function updateUserMailReceive(userId: number, value: boolean) {
  await g5q("UPDATE g5_member SET mb_mailling = ? WHERE mb_no = ?", [value ? 1 : 0, userId]);
}

export async function updateUserBlocked(userId: number, blocked: boolean) {
  if (blocked) {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await g5q("UPDATE g5_member SET mb_intercept_date = ? WHERE mb_no = ?", [now, userId]);
  } else {
    await g5q("UPDATE g5_member SET mb_intercept_date = '' WHERE mb_no = ?", [userId]);
  }
}export async function updateUserGradeAndPoints(userId: number, data: { grade?: string; points?: number; totalSpent?: number; role?: string }) {
  if (data.role !== undefined) {
    await g5q("UPDATE g5_member SET mb_level = ? WHERE mb_no = ?", [data.role === "admin" ? 10 : 1, userId]);
  }
  if (data.points !== undefined) {
    await g5q("UPDATE g5_member SET mb_point = ? WHERE mb_no = ?", [Number(data.points) || 0, userId]);
  }
}
export async function adminGetAllPosts(page = 1, limit = 20, boardId?: number) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions: any[] = [];
  if (boardId) conditions.push(eq(posts.boardId, boardId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [result, countResult] = await Promise.all([
    db.select({ post: posts, userName: users.name, boardName: boards.name }).from(posts).leftJoin(users, eq(posts.userId, users.id)).leftJoin(boards, eq(posts.boardId, boards.id)).where(whereClause).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(whereClause),
  ]);
  return { posts: result.map(r => ({ ...r.post, userName: r.userName, boardName: r.boardName })), total: countResult[0]?.count ?? 0 };
}

export async function adminDeletePost(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(comments).where(eq(comments.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
}

export async function adminGetAllComments(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { comments: [], total: 0 };
  const offset = (page - 1) * limit;
  const [result, countResult] = await Promise.all([
    db.select({ comment: comments, userName: users.name }).from(comments).leftJoin(users, eq(comments.userId, users.id)).orderBy(desc(comments.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(comments),
  ]);
  return { comments: result.map(r => ({ ...r.comment, userName: r.userName })), total: countResult[0]?.count ?? 0 };
}

export async function adminDeleteComment(id: number) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  if (result.length > 0) {
    await db.delete(comments).where(eq(comments.id, id));
    await db.update(posts).set({ commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)` }).where(eq(posts.id, result[0].postId));
  }
}

// ─── Categories ───
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, 1)).orderBy(asc(categories.sortOrder));
}

export async function getAllCategoriesAdmin() {
  const rows = await g5q<{ ca_id: string; ca_name: string; ca_head_html: string }>(
    "SELECT ca_id, ca_name, ca_head_html FROM g5_shop_category ORDER BY ca_id"
  );
  return rows.map((r) => ({
    id: Number(r.ca_id),
    name: r.ca_name,
    slug: r.ca_id,
    parentId: null as number | null,
    description: r.ca_head_html || "",
    imageUrl: "",
    isActive: 1,
    sortOrder: Number(r.ca_id),
  }));
}

export async function getCategoryBySlug(slug: string) {
  const row = await g5one<{ ca_id: string; ca_name: string; ca_head_html: string }>(
    "SELECT ca_id, ca_name, ca_head_html FROM g5_shop_category WHERE ca_id = ?",
    [slug]
  );
  if (!row) return undefined;
  return {
    id: Number(row.ca_id),
    name: row.ca_name,
    slug: row.ca_id,
    parentId: null as number | null,
    description: row.ca_head_html || "",
    imageUrl: "",
    isActive: 1,
    sortOrder: Number(row.ca_id),
  };
}
export async function createCategory(data: any) {
  const maxRow = await g5one<{ m: number }>("SELECT MAX(CAST(ca_id AS UNSIGNED)) AS m FROM g5_shop_category");
  const newId = String((Number(maxRow?.m) || 0) + 10);
  await g5q(
    `INSERT INTO g5_shop_category (ca_id, ca_name, ca_order, ca_use, ca_head_html, ca_tail_html, ca_mobile_head_html, ca_mobile_tail_html)
     VALUES (?, ?, ?, '1', ?, '', '', '')`,
    [newId, data.name ?? "", Number(data.sortOrder) || 0, data.description || ""]
  );
  return Number(newId);
}

export async function updateCategory(id: number, data: any) {
  const sets: string[] = [];
  const params: any[] = [];
  if (data.name !== undefined) { sets.push("ca_name = ?"); params.push(data.name); }
  if (data.sortOrder !== undefined) { sets.push("ca_order = ?"); params.push(Number(data.sortOrder) || 0); }
  if (data.isActive !== undefined) { sets.push("ca_use = ?"); params.push(data.isActive ? "1" : "0"); }
  if (data.description !== undefined) { sets.push("ca_head_html = ?"); params.push(data.description || ""); }
  if (sets.length === 0) return;
  params.push(String(id));
  await g5q(`UPDATE g5_shop_category SET ${sets.join(", ")} WHERE ca_id = ?`, params);
}

export async function deleteCategory(id: number) {
  await g5q("DELETE FROM g5_shop_category WHERE ca_id = ?", [String(id)]);
}// ─── Products ───
function mapItImages(r) {
  const cols = [r.it_img1, r.it_img2, r.it_img3, r.it_img4, r.it_img5, r.it_img6, r.it_img7, r.it_img8, r.it_img9, r.it_img10];
  return cols.filter(Boolean).map((v) => (String(v).startsWith("/api/product-image/") ? v : `/api/product-image/${v}`));
}

export async function getProducts(opts: { categoryId?: number; parentCategoryId?: number; search?: string; sort?: string; page?: number; limit?: number; status?: string; isFeatured?: boolean; isNew?: boolean; isBest?: boolean; onSale?: boolean }) {
  const { categoryId, search, sort = "newest", page = 1, limit = 20, status } = opts;
  const offset = (page - 1) * limit;
  const where: string[] = [];
  const params: any[] = [];
  if (categoryId) { where.push("ca_id = ?"); params.push(String(categoryId)); }
  if (search) { where.push("it_name LIKE ?"); params.push(`%${search}%`); }
  if (status === "soldout") where.push("it_soldout = '1'");
  else if (status === "active") where.push("it_use = '1' AND it_soldout != '1'");
  else if (!status) where.push("it_use = '1'");
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  let orderSql: string;
  switch (sort) {
    case "price_asc": orderSql = "ORDER BY it_price ASC"; break;
    case "price_desc": orderSql = "ORDER BY it_price DESC"; break;
    case "name_asc": orderSql = "ORDER BY it_name ASC"; break;
    case "name_desc": orderSql = "ORDER BY it_name DESC"; break;
    case "sortOrder_asc": orderSql = "ORDER BY it_order ASC, it_time DESC"; break;
    case "sortOrder_desc": orderSql = "ORDER BY it_order DESC, it_time DESC"; break;
    default: orderSql = "ORDER BY it_time DESC";
  }
  const rows = await g5q<any>(
    `SELECT it_id, it_name, it_price, it_cust_price, ca_id, it_stock_qty, it_use, it_soldout, it_img1, it_img2, it_img3, it_img4, it_img5, it_img6, it_img7, it_img8, it_img9, it_img10, it_order, it_point, it_point_type, it_basic, it_explan FROM g5_shop_item ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const countRow = await g5one<{ c: number }>(`SELECT COUNT(*) AS c FROM g5_shop_item ${whereSql}`, params);
  const productsOut = rows.map((r: any) => {
    const price = Number(r.it_cust_price) || Number(r.it_price) || 0;
    const sellPrice = Number(r.it_price) || 0;
    const images = mapItImages(r);
    return {
      id: Number(r.it_id),
      itId: r.it_id,
      name: r.it_name,
      slug: r.it_id,
      description: r.it_basic || "",
      content: r.it_explan || "",
      thumbnail: images[0] ?? null,
      images,
      categoryId: r.ca_id ? Number(r.ca_id) : null,
      price,
      salePrice: sellPrice > 0 && sellPrice < price ? sellPrice : null,
      pointRate: Number(r.it_point) || 0,
      pointRateType: Number(r.it_point_type) === 1 ? "fixed" : "percent",
      stock: Number(r.it_stock_qty) || 0,
      status: r.it_soldout === "1" ? "soldout" : (r.it_use === "1" ? "active" : "inactive"),
      sortOrder: Number(r.it_order) || 0,
      isFeatured: 0,
      isNew: 0,
      isBest: 0,
      noDiscount: 0,
    };
  });
  return { products: productsOut, total: Number(countRow?.c) || 0 };
}
export async function getProductBySlug(slug: string) {
  return getProductByItId(slug);
}

export async function getProductByItId(itId: string) {
  if (!/^\d+$/.test(itId)) return undefined;
  const r = await g5one<any>(
    "SELECT it_id, it_name, it_price, it_cust_price, ca_id, it_stock_qty, it_use, it_soldout, it_img1, it_order, it_point, it_point_type, it_basic FROM g5_shop_item WHERE it_id = ?",
    [itId]
  );
  if (!r) return undefined;
  const price = Number(r.it_cust_price) || Number(r.it_price) || 0;
  const sellPrice = Number(r.it_price) || 0;
  return {
    id: Number(r.it_id),
    itId: r.it_id,
    name: r.it_name,
    slug: r.it_id,
    thumbnail: r.it_img1 ? (r.it_img1.startsWith("/api/product-image/") ? r.it_img1 : `/api/product-image/${r.it_img1}`) : null,
    categoryId: r.ca_id ? Number(r.ca_id) : null,
    price,
    salePrice: sellPrice > 0 && sellPrice < price ? sellPrice : null,
    description: r.it_basic || "",
    pointRate: Number(r.it_point) || 0,
    pointRateType: Number(r.it_point_type) === 1 ? "fixed" : "percent",
    stock: Number(r.it_stock_qty) || 0,
    status: r.it_soldout === "1" ? "soldout" : (r.it_use === "1" ? "active" : "inactive"),
    sortOrder: Number(r.it_order) || 0,
    isFeatured: 0,
    isNew: 0,
    isBest: 0,
    noDiscount: 0,
  };
}

export async function getProductById(id: number) {
  return getProductByItId(String(id));
}
export async function getProductOptions(productId: number) {
  const rows = await g5q<any>(
    "SELECT io_no, io_id, io_price, io_stock_qty FROM g5_shop_item_option WHERE it_id = ? AND io_use = 1 ORDER BY io_no ASC",
    [String(productId)]
  );
  if (rows.length === 0) return [];
  return [{
    id: 0,
    productId,
    name: "옵션",
    values: rows.map((r: any) => ({
      value: r.io_id,
      englishValue: "",
      price: Number(r.io_price) || 0,
      stock: Number(r.io_stock_qty) || 0,
      io_no: r.io_no,
    })),
    sortOrder: 0,
    isRequired: 1,
  }];
}

export async function createProduct(data: any) {
  const itId = String(Math.floor(Date.now() / 1000));
  const custPrice = Number(data.price) || 0;
  const sellPrice = (data.salePrice != null && Number(data.salePrice) > 0) ? Number(data.salePrice) : custPrice;
  const images: string[] = Array.isArray(data.images) ? data.images.slice(0, 10) : (data.thumbnail ? [data.thumbnail] : []);
  const imgCols = [0,1,2,3,4,5,6,7,8,9].map((i) => images[i] || "");
  await g5q(
    `INSERT INTO g5_shop_item (it_id, it_name, ca_id, it_price, it_cust_price, it_stock_qty, it_use, it_basic, it_explan, it_img1, it_img2, it_img3, it_img4, it_img5, it_img6, it_img7, it_img8, it_img9, it_img10, it_point, it_point_type, it_order, it_time, it_update_time, store_mb_id, it_quo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), '', '')`,
    [
      itId,
      data.name ?? "",
      data.categoryId ? String(data.categoryId) : "",
      sellPrice,
      custPrice,
      Number(data.stock) || 0,
      data.status === "inactive" ? "0" : "1",
      data.description || "",
      data.content || "",
      ...imgCols,
      Number(data.pointRate) || 0,
      data.pointRateType === "fixed" ? 1 : 2,
      Number(data.sortOrder) || 0,
    ]
  );
  return Number(itId);
}

export async function updateProduct(id: number, data: any) {
  const sets: string[] = [];
  const params: any[] = [];
  if (data.name !== undefined) { sets.push("it_name = ?"); params.push(data.name); }
  if (data.categoryId !== undefined) { sets.push("ca_id = ?"); params.push(data.categoryId ? String(data.categoryId) : ""); }
  if (data.stock !== undefined) { sets.push("it_stock_qty = ?"); params.push(Number(data.stock) || 0); }
  if (data.status !== undefined) { sets.push("it_use = ?"); params.push(data.status === "inactive" ? "0" : "1"); }
  if (data.status !== undefined) { sets.push("it_soldout = ?"); params.push(data.status === "soldout" ? "1" : "0"); }
  if (data.description !== undefined) { sets.push("it_basic = ?"); params.push(data.description || ""); }
  if (data.content !== undefined) { sets.push("it_explan = ?"); params.push(data.content || ""); }
  if (data.images !== undefined) {
    const images: string[] = Array.isArray(data.images) ? data.images.slice(0, 10) : [];
    for (let i = 0; i < 10; i++) { sets.push(`it_img${i + 1} = ?`); params.push(images[i] || ""); }
  } else if (data.thumbnail !== undefined) {
    sets.push("it_img1 = ?"); params.push(data.thumbnail || "");
  }
  if (data.pointRate !== undefined) { sets.push("it_point = ?"); params.push(Number(data.pointRate) || 0); }
  if (data.pointRateType !== undefined) { sets.push("it_point_type = ?"); params.push(data.pointRateType === "fixed" ? 1 : 2); }
  if (data.sortOrder !== undefined) { sets.push("it_order = ?"); params.push(Number(data.sortOrder) || 0); }
  // price / salePrice: 정가(it_cust_price)와 실판매가(it_price)는 서로 영향을 주므로 함께 다룬다.
  if (data.price !== undefined || data.salePrice !== undefined) {
    const current = await g5one<any>("SELECT it_price, it_cust_price FROM g5_shop_item WHERE it_id = ?", [id]);
    const custPrice = data.price !== undefined ? Number(data.price) || 0 : Number(current?.it_cust_price) || 0;
    const sellPrice = data.salePrice !== undefined
      ? ((data.salePrice != null && Number(data.salePrice) > 0) ? Number(data.salePrice) : custPrice)
      : Number(current?.it_price) || custPrice;
    sets.push("it_cust_price = ?"); params.push(custPrice);
    sets.push("it_price = ?"); params.push(sellPrice);
  }
  if (sets.length === 0) return;
  sets.push("it_update_time = NOW()");
  params.push(String(id));
  await g5q(`UPDATE g5_shop_item SET ${sets.join(", ")} WHERE it_id = ?`, params);
}
export async function batchUpdateProductsSortOrder(items: { id: number; sortOrder: number }[]) {
  if (items.length === 0) return;
  await Promise.all(items.map(({ id, sortOrder }) =>
    g5q("UPDATE g5_shop_item SET it_order = ? WHERE it_id = ?", [sortOrder, String(id)])
  ));
}

export async function deleteProduct(id: number) {
  await g5q("DELETE FROM g5_shop_item WHERE it_id = ?", [String(id)]);
}

export async function incrementViewCount(id: number) {
  await g5q("UPDATE g5_shop_item SET it_hit = it_hit + 1 WHERE it_id = ?", [String(id)]);
}

export async function createProductOption(data: { productId: number; name: string; values: OptionValue[]; sortOrder?: number; isRequired?: number }) {
  for (const v of data.values as any[]) {
    const label = data.name && data.name !== "옵션" ? `${data.name}: ${v.value}` : v.value;
    await g5q(
      "INSERT INTO g5_shop_item_option (io_id, io_type, it_id, io_price, io_stock_qty, io_noti_qty, io_use) VALUES (?, 1, ?, ?, ?, 0, 1)",
      [label, String(data.productId), Number(v.price) || 0, Number(v.stock) || 0]
    );
  }
  return 0;
}

export async function updateProductOption(id: number, data: { name?: string; values?: OptionValue[]; sortOrder?: number; isRequired?: number }) {
  // 개별 옵션 행 수정은 지원하지 않음 (상품 수정 시 삭제후 재생성 방식을 쓰기 때문)
  return;
}

export async function deleteProductOption(id: number) {
  return;
}

export async function deleteProductOptions(productId: number) {
  await g5q("DELETE FROM g5_shop_item_option WHERE it_id = ?", [String(productId)]);
}

export async function decreaseOptionStock(productId: number, selectedOptions: Record<string, string>, quantity: number) {
  const db = await getDb();
  if (!db) return;
  const options = await getProductOptions(productId);
  for (const opt of options) {
    const selectedValue = selectedOptions[opt.name];
    if (!selectedValue) continue;
    const values = opt.values as OptionValue[];
    const updated = values.map(v => {
      if (v.value === selectedValue && v.stock !== undefined) {
        return { ...v, stock: Math.max(0, v.stock - quantity) };
      }
      return v;
    });
    await db.update(productOptions).set({ values: updated }).where(eq(productOptions.id, opt.id));
  }
}

export async function increaseOptionStock(productId: number, selectedOptions: Record<string, string>, quantity: number) {
  const db = await getDb();
  if (!db) return;
  const options = await getProductOptions(productId);
  for (const opt of options) {
    const selectedValue = selectedOptions[opt.name];
    if (!selectedValue) continue;
    const values = opt.values as OptionValue[];
    const updated = values.map(v => {
      if (v.value === selectedValue && v.stock !== undefined) {
        return { ...v, stock: v.stock + quantity };
      }
      return v;
    });
    await db.update(productOptions).set({ values: updated }).where(eq(productOptions.id, opt.id));
  }
}

export async function getLowStockOptions(threshold = 10) {
  const db = await getDb();
  if (!db) return [];
  const allOptions = await db.select().from(productOptions);
  const lowStock: { productId: number; optionName: string; optionValue: string; stock: number }[] = [];
  for (const opt of allOptions) {
    const values = opt.values as OptionValue[];
    for (const v of values) {
      if (v.stock !== undefined && v.stock <= threshold) {
        lowStock.push({ productId: opt.productId, optionName: opt.name, optionValue: v.value, stock: v.stock });
      }
    }
  }
  return lowStock;
}

// ─── Cart ───
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId)).orderBy(desc(cartItems.createdAt));
  const productIds = items.map(i => i.productId);
  if (productIds.length === 0) return [];
  const prods = await db.select().from(products).where(inArray(products.id, productIds));
  const prodMap = new Map(prods.map(p => [p.id, p]));
  // Fetch options for all products in cart
  const opts = await db.select().from(productOptions).where(inArray(productOptions.productId, productIds));
  const optsMap = new Map<number, typeof opts>();
  for (const o of opts) {
    if (!optsMap.has(o.productId)) optsMap.set(o.productId, []);
    optsMap.get(o.productId)!.push(o);
  }
  return items.map(item => {
    const product = prodMap.get(item.productId);
    // Calculate option price if options are selected
    let optionPrice: number | null = null;
    if (item.options && product) {
      const itemOpts = item.options as Record<string, string>;
      const prodOpts = optsMap.get(item.productId) ?? [];
      let maxPrice = 0;
      for (const po of prodOpts) {
        const selectedVal = itemOpts[po.name];
        if (selectedVal) {
          const vals = po.values as OptionValue[];
          const found = vals.find(v => v.value === selectedVal);
          if (found && found.price > maxPrice) maxPrice = found.price;
        }
      }
      if (maxPrice > 0) optionPrice = maxPrice;
    }
    return { ...item, product, optionPrice };
  });
}

export async function getAdminCarts(params: { search?: string; page: number; pageSize: number }) {
  // seoulmono 실서비스는 장바구니를 서버에 저장하지 않고(결제 전까지 브라우저측에만 존재),
  // 실데이터가 없어 항상 빈 결과를 반환한다.
  return { rows: [], total: 0 };
}

export async function addToCart(userId: number, productId: number, quantity: number, options?: Record<string, string>) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))).limit(1);
  if (existing.length > 0) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + quantity, options: options ?? existing[0].options }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity, options: options ?? null });
  }
}

export async function updateCartItem(id: number, userId: number, data: { quantity?: number; options?: Record<string, string> }) {
  const db = await getDb();
  if (!db) return;
  await db.update(cartItems).set(data).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function removeCartItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ─── Wishlist ───
export async function getWishlistItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId)).orderBy(desc(wishlistItems.createdAt));
  const productIds = items.map(i => i.productId);
  if (productIds.length === 0) return [];
  const prods = await db.select().from(products).where(inArray(products.id, productIds));
  const prodMap = new Map(prods.map(p => [p.id, p]));
  return items.map(item => ({ ...item, product: prodMap.get(item.productId) }));
}

export async function toggleWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))).limit(1);
  if (existing.length > 0) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, existing[0].id));
    // 위시리스트에서 제거 시 가격 알림도 삭제
    await db.delete(priceAlerts).where(and(eq(priceAlerts.userId, userId), eq(priceAlerts.productId, productId)));
    return false;
  } else {
    await db.insert(wishlistItems).values({ userId, productId });
    // 위시리스트 추가 시 가격 알림 자동 생성
    const product = await getProductById(productId);
    if (product) {
      const currentPrice = product.salePrice || product.price;
      await db.insert(priceAlerts).values({
        userId,
        productId,
        targetPrice: currentPrice,
        originalPrice: currentPrice,
      });
    }
    return true;
  }
}

export async function isInWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))).limit(1);
  return result.length > 0;
}

// ─── Addresses ───
export async function getUserAddresses(userId: number) {
  const member = await g5one<{ mb_id: string }>("SELECT mb_id FROM g5_member WHERE mb_no = ?", [userId]);
  if (!member) return [];
  const rows = await g5q<any>(
    "SELECT * FROM g5_member_address WHERE mb_id = ? ORDER BY ma_default DESC, ma_id DESC",
    [member.mb_id]
  );
  return rows.map((a: any) => ({
    id: Number(a.ma_id),
    userId,
    name: a.ma_name || "",
    recipient: a.ma_name || "",
    phone: a.ma_hp || "",
    zipCode: [a.ma_zip1, a.ma_zip2].filter(Boolean).join("-"),
    address1: a.ma_addr1 || "",
    address2: [a.ma_addr2, a.ma_addr3].filter(Boolean).join(" "),
    addressEn1: null,
    addressEn2: null,
    isDefault: a.ma_default === "1" ? 1 : 0,
    createdAt: null,
  }));
}

export async function createAddress(data: InsertAddress) {
  const db = await getDb();
  if (!db) return;
  if (data.isDefault) {
    await db.update(addresses).set({ isDefault: 0 }).where(eq(addresses.userId, data.userId));
  }
  await db.insert(addresses).values(data);
}

export async function updateAddress(id: number, userId: number, data: Partial<InsertAddress>) {
  const db = await getDb();
  if (!db) return;
  if (data.isDefault) {
    await db.update(addresses).set({ isDefault: 0 }).where(eq(addresses.userId, userId));
  }
  await db.update(addresses).set(data).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
}

export async function deleteAddress(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
}

// 주문 완료 후 배송지 자동 저장 (중복 주소는 건너뜀)
export async function saveAddressFromOrder(userId: number, data: {
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address1: string;
  address2?: string | null;
  addressEn1?: string | null;
  addressEn2?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(addresses).where(eq(addresses.userId, userId));
  const isDuplicate = existing.some(a =>
    a.recipient === data.recipientName &&
    a.phone === data.recipientPhone &&
    a.zipCode === data.zipCode &&
    a.address1 === data.address1 &&
    (a.address2 ?? "") === (data.address2 ?? "")
  );
  if (isDuplicate) return;
  const isFirst = existing.length === 0;
  const count = existing.length + 1;
  await db.insert(addresses).values({
    userId,
    name: `お届け先 ${count}`,
    recipient: data.recipientName,
    phone: data.recipientPhone,
    zipCode: data.zipCode,
    address1: data.address1,
    address2: data.address2 ?? null,
    addressEn1: data.addressEn1 ?? null,
    addressEn2: data.addressEn2 ?? null,
    isDefault: isFirst ? 1 : 0,
  });
}

// ─── Admin Address Management ───
export async function adminUpdateAddress(id: number, data: any) {
  const addr = await g5one<{ mb_id: string }>("SELECT mb_id FROM g5_member_address WHERE ma_id = ?", [id]);
  if (!addr) return;
  if (data.isDefault) {
    await g5q("UPDATE g5_member_address SET ma_default = '0' WHERE mb_id = ?", [addr.mb_id]);
  }
  const sets: string[] = [];
  const params: any[] = [];
  const nameVal = data.recipient !== undefined ? data.recipient : data.name;
  if (nameVal !== undefined) { sets.push("ma_name = ?"); params.push(nameVal); }
  if (data.phone !== undefined) { sets.push("ma_hp = ?"); params.push(data.phone); }
  if (data.zipCode !== undefined) { sets.push("ma_zip1 = ?"); params.push(data.zipCode); }
  if (data.address1 !== undefined) { sets.push("ma_addr1 = ?"); params.push(data.address1); }
  if (data.address2 !== undefined) { sets.push("ma_addr2 = ?"); params.push(data.address2); }
  if (data.isDefault !== undefined) { sets.push("ma_default = ?"); params.push(data.isDefault ? "1" : "0"); }
  if (sets.length === 0) return;
  params.push(id);
  await g5q(`UPDATE g5_member_address SET ${sets.join(", ")} WHERE ma_id = ?`, params);
}

export async function adminDeleteAddress(id: number) {
  await g5q("DELETE FROM g5_member_address WHERE ma_id = ?", [id]);
}

// ─── Orders ───
export async function createOrder(data: InsertOrder, items: { productId: number; productName: string; productThumbnail?: string; price: number; quantity: number; options?: Record<string, string> }[]) {
  const db = await getDb();
  if (!db) return;
  const [{ id: orderId }] = await db.insert(orders).values(data).$returningId();
  if (items.length > 0) {
    await db.insert(orderItems).values(items.map(item => ({ ...item, orderId, productThumbnail: item.productThumbnail ?? null, options: item.options ?? null })));
    // 옵션 재고 차감
    for (const item of items) {
      if (item.options) {
        await decreaseOptionStock(item.productId, item.options, item.quantity);
      }
    }
  }
  return orderId;
}

export async function getUserLiveStats(userId: number): Promise<{ orderCount: number; totalPaid: number }> {
  const member = await g5one<{ mb_id: string }>("SELECT mb_id FROM g5_member WHERE mb_no = ?", [userId]);
  if (!member) return { orderCount: 0, totalPaid: 0 };
  const CANCELLED_STATUSES = ["취소", "반품"];
  const row = await g5one<{ orderCount: number; totalPaid: number }>(
    `SELECT COUNT(*) AS orderCount, COALESCE(SUM(od_receipt_price), 0) AS totalPaid FROM g5_shop_order WHERE mb_id = ? AND od_status NOT IN (${CANCELLED_STATUSES.map(() => "?").join(",")})`,
    [member.mb_id, ...CANCELLED_STATUSES]
  );
  return {
    orderCount: Number(row?.orderCount) || 0,
    totalPaid: Number(row?.totalPaid) || 0,
  };
}

export async function getUserOrders(userId: number, page = 1, limit = 10) {
  const member = await g5one<{ mb_id: string }>("SELECT mb_id FROM g5_member WHERE mb_no = ?", [userId]);
  if (!member) return { orders: [], total: 0 };
  const offset = (page - 1) * limit;
  const rows = await g5q<any>(
    `SELECT od_id, od_name, od_hp, od_status, od_receipt_price, od_coupon, od_time
     FROM g5_shop_order WHERE mb_id = ? ORDER BY od_time DESC LIMIT ? OFFSET ?`,
    [member.mb_id, limit, offset]
  );
  const countRow = await g5one<{ c: number }>("SELECT COUNT(*) AS c FROM g5_shop_order WHERE mb_id = ?", [member.mb_id]);
  const orders = rows.map((r: any) => ({
    id: Number(r.od_id),
    orderNumber: String(r.od_id),
    status: mapOdStatus(r.od_status),
    totalAmount: Number(r.od_receipt_price) || 0,
    discountAmount: Number(r.od_coupon) || 0,
    pointsUsed: 0,
    recipientName: r.od_name,
    createdAt: new Date(String(r.od_time || "").replace(" ", "T")),
  }));
  return { orders, total: Number(countRow?.c) || 0 };
}

export async function getPendingReviewOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // 배송 완료된 주문 중 리뷰가 작성되지 않은 주문 조회
  const result = await db.select({
    orderId: orders.id,
    orderNumber: orders.orderNumber,
    createdAt: orders.createdAt,
    totalAmount: orders.totalAmount,
  })
    .from(orders)
    .innerJoin(shipments, eq(orders.id, shipments.orderId))
    .leftJoin(posts, and(
      eq(posts.orderId, orders.id),
      eq(posts.userId, orders.userId)
    ))
    .where(and(
      eq(orders.userId, userId),
      eq(shipments.status, 'delivered'),
      sql`${posts.id} IS NULL` // 리뷰가 없는 경우
    ))
    .orderBy(desc(orders.createdAt))
    .limit(5);
  return result;
}

const OD_STATUS_TO_CODE: Record<string, string> = {
  "취소": "cancelled", "반품": "cancelled", "주문취소": "cancelled",
  "배송완료": "delivered", "구매확정": "delivered",
  "배송중": "shipping",
  "상품준비중": "preparing", "배송준비중": "preparing",
  "입금확인": "paid", "결제완료": "paid",
  "주문접수": "pending",
};
function mapOdStatus(s: string | null | undefined): string {
  const v = (s || "").trim();
  return OD_STATUS_TO_CODE[v] ?? "pending";
}
const CODE_TO_OD_STATUS: Record<string, string[]> = {
  pending: ["주문", "입금대기", "주문접수"],
  paid: ["입금확인", "결제완료"],
  preparing: ["상품준비중", "배송준비중"],
  shipping: ["배송중"],
  delivered: ["배송완료", "구매확정"],
  cancelled: ["취소", "반품", "주문취소"],
};

export async function getOrderById(id: number | string) {
  const row = await g5one<any>("SELECT * FROM g5_shop_order WHERE od_id = ?", [id]);
  if (!row) return undefined;
  const member = row.mb_id ? await g5one<{ mb_no: number }>("SELECT mb_no FROM g5_member WHERE mb_id = ?", [row.mb_id]) : null;
  return {
    id: Number(row.od_id),
    orderNumber: String(row.od_id),
    userId: member ? Number(member.mb_no) : null,
    userEmail: row.od_email || null,
    recipientName: row.od_name,
    recipientPhone: row.od_hp,
    status: mapOdStatus(row.od_status),
    totalAmount: Number(row.od_receipt_price) || (Number(row.od_cart_price) || 0) + (Number(row.od_send_cost) || 0),
    shippingFee: Number(row.od_send_cost) || 0,
    discountAmount: Number(row.od_coupon) || 0,
    pointsUsed: 0,
    createdAt: new Date(String(row.od_time || "").replace(" ", "T")),
    address: [row.od_addr1, row.od_addr2, row.od_addr3].filter(Boolean).join(" "),
    memo: row.od_memo || "",
    adminNotes: row.od_shop_memo || "",
    couponName: null as string | null,
    source: "seoulmono",
  };
}

export async function getOrderItems(orderId: number | string) {
  const rows = await g5q<any>(
    "SELECT ct_id, it_id, it_name, ct_qty, ct_price, ct_option, ct_cancel_status FROM g5_shop_cart WHERE od_id = ?",
    [orderId]
  );
  return rows.map((r: any) => ({
    id: Number(r.ct_id),
    orderId,
    productId: r.it_id ? Number(r.it_id) : null,
    productName: r.it_name,
    quantity: Number(r.ct_qty) || 1,
    price: Number(r.ct_price) || 0,
    options: r.ct_option || null,
    cancelledAt: r.ct_cancel_status && String(r.ct_cancel_status) !== "0" ? new Date() : null,
    refundAmount: null as number | null,
    product: {
      id: r.it_id ? Number(r.it_id) : null,
      name: r.it_name,
      thumbnail: null as string | null,
      slug: r.it_id ? String(r.it_id) : null,
      noDiscount: 0,
    },
  }));
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  
  // 취소 시 재고 복구
  if (status === "cancelled") {
    const items = await getOrderItems(id);
    for (const item of items) {
      if (item.options) {
        await increaseOptionStock(item.productId, item.options as Record<string, string>, item.quantity);
      }
    }
  }
  
  const updateData: any = { status };
  if (status === "paid") updateData.paidAt = new Date();
  if (status === "shipping") updateData.shippedAt = new Date();
  if (status === "delivered") updateData.deliveredAt = new Date();
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

export async function markAllItemsCancelled(orderId: number, wasPaid: boolean, order?: any) {
  const database = await getDb();
  if (!database) return;
  const allItems = await getOrderItems(orderId);
  const activeItems = allItems.filter(i => !i.cancelledAt);
  if (activeItems.length === 0) return;
  const cancelledItemsTotal = activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const couponReduction = order?.couponDiscount ?? 0;
  const gradeOnly = Math.max(0, (order?.discountAmount ?? 0) - couponReduction);
  const refundTotal = wasPaid ? Math.max(0, cancelledItemsTotal - couponReduction - gradeOnly) : 0;
  for (const item of activeItems) {
    const itemTotal = item.price * item.quantity;
    const itemRefund = (wasPaid && cancelledItemsTotal > 0) ? Math.round(refundTotal * itemTotal / cancelledItemsTotal) : 0;
    await database.update(orderItems)
      .set({ cancelledAt: new Date(), refundAmount: itemRefund })
      .where(eq(orderItems.id, item.id));
  }
}

export async function partialCancelOrderItems(
  orderId: number,
  itemIds: number[],
  reason?: string,
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const order = await getOrderById(orderId);
  const allItems = await getOrderItems(orderId);
  const itemsToCancel = allItems.filter(i => itemIds.includes(i.id) && !i.cancelledAt);

  // 취소 전 현재 활성 아이템 총액
  const currentActiveTotal = allItems
    .filter(i => !i.cancelledAt)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 취소 아이템 총액
  const cancelledItemsTotal = itemsToCancel.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 쿠폰 비례 계산: noDiscount 제외한 쿠폰 적용 가능 금액 기준으로만 계산
  const currentCoupon = order?.couponDiscount ?? 0;
  const currentGradeOnly = Math.max(0, (order?.discountAmount ?? 0) - currentCoupon);

  // 쿠폰 적용 가능 활성 아이템 총액 (취소 전)
  const eligibleActiveTotal = allItems
    .filter(i => !i.cancelledAt && !i.product?.noDiscount)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
  // 취소 아이템 중 쿠폰 적용 가능한 아이템 총액
  const eligibleCancelledTotal = itemsToCancel
    .filter(i => !i.product?.noDiscount)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const couponReduction = eligibleActiveTotal > 0
    ? Math.round(currentCoupon * eligibleCancelledTotal / eligibleActiveTotal)
    : 0;
  const discountReduction = currentActiveTotal > 0
    ? Math.round(currentGradeOnly * cancelledItemsTotal / currentActiveTotal)
    : 0;

  // 환불 금액 = 취소 아이템 합계 - 쿠폰 차감 - 등급할인 차감
  const refundAmount = cancelledItemsTotal - couponReduction - discountReduction;

  for (const item of itemsToCancel) {
    const itemTotal = item.price * item.quantity;
    const itemRefund = currentActiveTotal > 0
      ? Math.round(refundAmount * itemTotal / cancelledItemsTotal)
      : itemTotal;
    await db.update(orderItems)
      .set({ cancelledAt: new Date(), cancelReason: reason ?? null, refundAmount: itemRefund })
      .where(eq(orderItems.id, item.id));
    if (item.productId && item.options) {
      await increaseOptionStock(item.productId, item.options as Record<string, string>, item.quantity);
    }
  }

  const updatedItems = await getOrderItems(orderId);
  const activeItems = updatedItems.filter(i => !i.cancelledAt);
  const newTotal = activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const newCoupon = Math.max(0, currentCoupon - couponReduction);
  const newDiscount = Math.max(0, (order?.discountAmount ?? 0) - couponReduction - discountReduction);

  if (activeItems.length === 0) {
    await db.update(orders)
      .set({ status: "cancelled", totalAmount: 0, couponDiscount: 0, discountAmount: 0 })
      .where(eq(orders.id, orderId));
    // 입금금액도 0으로 초기화
    await db.update(payments).set({ depositAmount: 0, updatedAt: new Date() }).where(eq(payments.orderId, orderId));
  } else {
    await db.update(orders)
      .set({ totalAmount: newTotal, couponDiscount: newCoupon, discountAmount: newDiscount })
      .where(eq(orders.id, orderId));
    // 입금금액 = 잔여 상품금액 - 쿠폰/할인 - 포인트
    const newDepositAmount = Math.max(0, newTotal - newCoupon - (order?.pointsUsed ?? 0));
    await db.update(payments).set({ depositAmount: newDepositAmount, updatedAt: new Date() }).where(eq(payments.orderId, orderId));
  }

  return {
    cancelledCount: itemsToCancel.length,
    allCancelled: activeItems.length === 0,
    refundAmount,
    couponReduction,
    discountReduction,
  };
}

export async function updateOrderItemStatus(itemId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(orderItems)
    .set({ itemStatus: status })
    .where(eq(orderItems.id, itemId));
}

export async function uncancelOrderItem(orderId: number, itemId: number, newStatus: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const allItems = await getOrderItems(orderId);
  const item = allItems.find(i => i.id === itemId);
  if (!item || !item.cancelledAt) throw new Error("この商品はキャンセル状態ではありません。");

  // 아이템 복원: cancelledAt 제거 + 해당 아이템의 itemStatus만 변경
  await db.update(orderItems)
    .set({ cancelledAt: null, cancelReason: null, itemStatus: newStatus })
    .where(eq(orderItems.id, itemId));

  if (item.productId && item.options) {
    await decreaseOptionStock(item.productId, item.options as Record<string, string>, item.quantity);
  }

  const updatedItems = await getOrderItems(orderId);
  const activeItems = updatedItems.filter(i => !i.cancelledAt);
  const newTotal = activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 주문 전체 상태는 변경하지 않음 (다른 아이템에 영향 방지)
  // 단, 모든 아이템이 취소됐다가 복원되는 경우(주문 자체가 cancelled)에만 주문 상태 갱신
  const currentOrderRow = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const orderData = currentOrderRow[0];
  const orderWasFullyCancelled = orderData?.status === "cancelled";

  // 쿠폰 할인 재계산: 비례 공식 대신 실제 쿠폰 기준으로 처음부터 계산
  let newCoupon = 0;
  if (orderData?.couponId) {
    const couponData = await getCouponById(orderData.couponId);
    if (couponData) {
      // 쿠폰 적용 가능한 활성 아이템 합산 (noDiscount 제외)
      const eligibleTotal = activeItems
        .filter(i => !i.product?.noDiscount)
        .reduce((sum, i) => sum + i.price * i.quantity, 0);
      newCoupon = calculateCouponDiscount(couponData, eligibleTotal);
    }

    // 전체 취소 후 복원 시: 쿠폰이 "미사용" 상태로 반환됐을 수 있으므로 다시 "사용됨"으로 표시
    if (orderWasFullyCancelled) {
      // unuseCouponByOrderId가 호출된 후 isUsed=0, orderId=null 상태인 쿠폰을 찾아 재사용 처리
      const uc = await db.select().from(userCoupons)
        .where(and(
          eq(userCoupons.couponId, orderData.couponId),
          eq(userCoupons.isUsed, 0),
          isNull(userCoupons.orderId),
        ))
        .limit(1);
      if (uc[0]) {
        await db.update(userCoupons)
          .set({ isUsed: 1, usedAt: new Date(), orderId })
          .where(eq(userCoupons.id, uc[0].id));
        await db.update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.id, orderData.couponId));
      }
    }
  }

  const newDiscount = newCoupon; // 등급 할인 미사용

  if (orderWasFullyCancelled) {
    await db.update(orders)
      .set({ status: newStatus as any, totalAmount: newTotal, couponDiscount: newCoupon, discountAmount: newDiscount })
      .where(eq(orders.id, orderId));
  } else {
    await db.update(orders)
      .set({ totalAmount: newTotal, couponDiscount: newCoupon, discountAmount: newDiscount })
      .where(eq(orders.id, orderId));
  }

  // 입금금액도 잔여 금액 기준으로 업데이트
  const newDepositAmount = Math.max(0, newTotal - newCoupon - (orderData?.pointsUsed ?? 0));
  await db.update(payments).set({ depositAmount: newDepositAmount, updatedAt: new Date() }).where(eq(payments.orderId, orderId));

  return { ok: true };
}

export async function getAllOrders(
  page = 1,
  limit = 20,
  status?: string,
  noTrackingNumber?: boolean,
  source?: string,
  search?: string,
  dateFrom?: string,
  dateTo?: string,
  paymentMethod?: string,
  sortBy?: string,
  sortAsc?: boolean,
  hasRefund?: boolean,
) {
  const offset = (page - 1) * limit;
  const where: string[] = [];
  const params: any[] = [];

  if (noTrackingNumber) {
    where.push("od_status = ?");
    params.push("배송중");
    where.push("(od_tno IS NULL OR od_tno = '')");
  } else if (status && status !== "partial_cancel") {
    const parts = status.split(",").map((s) => s.trim()).filter(Boolean);
    const odValues = parts.flatMap((p) => CODE_TO_OD_STATUS[p] ?? []);
    if (odValues.length) {
      where.push(`od_status IN (${odValues.map(() => "?").join(",")})`);
      params.push(...odValues);
    }
  }
  if (search) {
    where.push("(od_name LIKE ? OR od_hp LIKE ? OR od_tel LIKE ? OR od_id LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (dateFrom) { where.push("od_time >= ?"); params.push(dateFrom); }
  if (dateTo) { where.push("od_time <= ?"); params.push(`${dateTo} 23:59:59`); }

  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  let orderSql = "ORDER BY od_time DESC";
  if (sortBy === "totalAmount") orderSql = `ORDER BY od_receipt_price ${sortAsc ? "ASC" : "DESC"}`;
  else if (sortBy === "status") orderSql = `ORDER BY od_status ${sortAsc ? "ASC" : "DESC"}`;
  else if (sortAsc) orderSql = "ORDER BY od_time ASC";

  const rows = await g5q<any>(
    `SELECT od_id, mb_id, od_name, od_email, od_hp, od_status, od_receipt_price, od_cart_price, od_send_cost, od_coupon, od_time, od_tno, od_delivery_company, od_shop_memo FROM g5_shop_order ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const countRow = await g5one<{ c: number }>(`SELECT COUNT(*) AS c FROM g5_shop_order ${whereSql}`, params);

  const ordersWithItems = await Promise.all(rows.map(async (r: any) => {
    const items = await getOrderItems(r.od_id);
    return {
      id: Number(r.od_id),
      orderNumber: String(r.od_id),
      userEmail: r.od_email || null,
      recipientName: r.od_name,
      recipientPhone: r.od_hp,
      status: mapOdStatus(r.od_status),
      totalAmount: Number(r.od_receipt_price) || (Number(r.od_cart_price) || 0) + (Number(r.od_send_cost) || 0),
      shippingFee: Number(r.od_send_cost) || 0,
      discountAmount: Number(r.od_coupon) || 0,
      pointsUsed: 0,
      createdAt: new Date(String(r.od_time || "").replace(" ", "T")),
      paymentId: null as number | null,
      paymentStatus: null as string | null,
      paymentMethod: null as string | null,
      shipment: r.od_tno ? { id: 0, trackingNumber: r.od_tno, carrier: r.od_delivery_company || null, status: mapOdStatus(r.od_status) } : null,
      adminNotes: r.od_shop_memo || "",
      items,
    };
  }));

  return { orders: ordersWithItems, total: Number(countRow?.c) || 0 };
}
export async function getOrderTabCounts(dateFrom?: string, dateTo?: string) {
  const where: string[] = [];
  const params: any[] = [];
  if (dateFrom) { where.push("od_time >= ?"); params.push(dateFrom); }
  if (dateTo) { where.push("od_time <= ?"); params.push(`${dateTo} 23:59:59`); }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  const rows = await g5q<{ od_status: string; c: number }>(
    `SELECT od_status, COUNT(*) AS c FROM g5_shop_order ${whereSql} GROUP BY od_status`,
    params
  );
  const result: Record<string, number> = { pending: 0, paid: 0, preparing: 0, shipping: 0, delivered: 0, customs_hold: 0, cancelled: 0 };
  let total = 0;
  for (const row of rows) {
    const code = mapOdStatus(row.od_status);
    result[code] = (result[code] ?? 0) + Number(row.c);
    total += Number(row.c);
  }
  return {
    pending: result.pending,
    paid: result.paid,
    preparing: result.preparing,
    shipping: result.shipping,
    delivered: result.delivered,
    customs_hold: result.customs_hold,
    cancelled: result.cancelled,
    partialCancelled: 0,
    refunded: 0,
    total,
  };
}
export async function updateOrderAdminNotes(orderId: number, notes: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ adminNotes: notes, updatedAt: new Date() }).where(eq(orders.id, orderId));
}

export async function bulkUpdateOrderStatuses(orderIds: number[], status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(inArray(orders.id, orderIds));
}

function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  return `${y}${m}${d}${rand}`;
}

export { generateOrderNumber };

// ─── Points ───
export async function addPoints(userId: number, amount: number, type: "earn" | "use" | "admin" | "refund", description: string, orderId?: number) {
  const member = await g5one<{ mb_id: string; mb_point: number }>("SELECT mb_id, mb_point FROM g5_member WHERE mb_no = ?", [userId]);
  if (!member) return;
  const delta = type === "use" ? -Math.abs(amount) : amount;
  const newBalance = (Number(member.mb_point) || 0) + delta;
  await g5q("UPDATE g5_member SET mb_point = ? WHERE mb_no = ?", [newBalance, userId]);
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  await g5q(
    `INSERT INTO g5_point (mb_id, po_datetime, po_content, po_point, po_use_point, po_expired, po_expire_date, po_mb_point, po_rel_table, po_rel_id, po_rel_action)
     VALUES (?, ?, ?, ?, ?, 0, '0000-00-00', ?, '@admin', ?, ?)`,
    [member.mb_id, now, description, delta > 0 ? delta : 0, delta < 0 ? Math.abs(delta) : 0, newBalance, orderId ? String(orderId) : "", type]
  );
}

export async function getPointHistory(userId: number, page = 1, limit = 20) {
  const member = await g5one<{ mb_id: string }>("SELECT mb_id FROM g5_member WHERE mb_no = ?", [userId]);
  if (!member) return { history: [], total: 0 };
  const offset = (page - 1) * limit;
  const rows = await g5q<any>(
    "SELECT po_id, po_datetime, po_content, po_point, po_use_point, po_rel_action FROM g5_point WHERE mb_id = ? ORDER BY po_datetime DESC, po_id DESC LIMIT ? OFFSET ?",
    [member.mb_id, limit, offset]
  );
  const countRow = await g5one<{ c: number }>("SELECT COUNT(*) AS c FROM g5_point WHERE mb_id = ?", [member.mb_id]);
  const history = rows.map((r: any) => ({
    id: Number(r.po_id),
    createdAt: new Date(String(r.po_datetime || "").replace(" ", "T")),
    type: r.po_rel_action || "",
    amount: Number(r.po_point) || 0,
    description: r.po_content || "",
  }));
  return { history, total: Number(countRow?.c) || 0 };
}

export async function hasOrderEarnPoints(orderId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: pointHistory.id }).from(pointHistory)
    .where(and(eq(pointHistory.orderId, orderId), eq(pointHistory.type, "earn")))
    .limit(1);
  return result.length > 0;
}

export async function getAllPointHistory(userEmail?: string, type?: "earn" | "use" | "admin" | "refund", page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const where: string[] = [];
  const params: any[] = [];

  if (userEmail) {
    where.push("m.mb_email LIKE ?");
    params.push(`%${userEmail}%`);
  }
  // po_rel_action is a clean enum only for points this app awarded itself (addPoints());
  // native Gnuboard5 point events (login rewards, board-write rewards, etc.) store a
  // free-text Korean action label there instead, so infer earn/use from the point
  // columns for anything that isn't one of our own enum values.
  if (type === "refund") { where.push("p.po_rel_action = ?"); params.push("refund"); }
  else if (type === "admin") { where.push("(p.po_rel_action = 'admin' OR (p.po_rel_action NOT IN ('earn','use','refund') AND (p.po_rel_action LIKE 'admin%' OR p.po_point < 0)))"); }
  else if (type === "earn") { where.push("(p.po_rel_action = 'earn' OR (p.po_rel_action NOT IN ('use','admin','refund') AND p.po_rel_action NOT LIKE 'admin%' AND p.po_point >= 0))"); }
  else if (type === "use") { where.push("p.po_rel_action = ?"); params.push("use"); }

  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

  const rows = await g5q<any>(
    `SELECT p.po_id, p.mb_id, p.po_datetime, p.po_content, p.po_point, p.po_use_point, p.po_rel_action,
            m.mb_no, m.mb_name, m.mb_email
     FROM g5_point p
     LEFT JOIN g5_member m ON m.mb_id = p.mb_id
     ${whereSql}
     ORDER BY p.po_datetime DESC, p.po_id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const countRow = await g5one<{ c: number }>(
    `SELECT COUNT(*) AS c FROM g5_point p LEFT JOIN g5_member m ON m.mb_id = p.mb_id ${whereSql}`,
    params
  );

  const history = rows.map((r: any) => {
    const raw = (r.po_rel_action || "").trim();
    const point = Number(r.po_point) || 0;
    const derivedType: "earn" | "use" | "admin" | "refund" =
      raw === "earn" || raw === "use" || raw === "admin" || raw === "refund"
        ? raw
        : raw.toLowerCase().startsWith("admin")
        ? "admin"
        : (point < 0 ? "admin" : "earn");
    return {
      id: Number(r.po_id),
      userId: r.mb_no ? Number(r.mb_no) : null,
      userName: r.mb_name || r.mb_id,
      userEmail: r.mb_email || null,
      amount: point,
      type: derivedType,
      description: r.po_content || "",
      orderId: null as number | null,
      orderNumber: null as string | null,
      createdAt: new Date(String(r.po_datetime || "").replace(" ", "T")),
    };
  });

  return { history, total: Number(countRow?.c) || 0 };
}

// ─── Boards & Posts ───
export async function getAllBoards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boards).where(eq(boards.isActive, 1)).orderBy(asc(boards.sortOrder));
}

export async function getAllBoardsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boards).orderBy(asc(boards.sortOrder));
}

export async function createBoard(data: { slug: string; name: string; description?: string; boardType: "free" | "review" | "qna" | "notice"; isActive?: number; sortOrder?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(boards).values({ ...data, description: data.description ?? null, isActive: data.isActive ?? 1, sortOrder: data.sortOrder ?? 0 });
}

export async function updateBoard(id: number, data: Partial<{ slug: string; name: string; description: string; boardType: string; isActive: number; sortOrder: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(boards).set(data as any).where(eq(boards.id, id));
}

export async function deleteBoard(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(boards).where(eq(boards.id, id));
}

export async function getBoardBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(boards).where(eq(boards.slug, slug)).limit(1);
  return result[0];
}

export async function getPosts(boardId: number, page = 1, limit = 20, search?: string, categoryId?: number, productId?: number, userId?: number) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = [eq(posts.boardId, boardId)];
  if (search) conditions.push(like(posts.title, `%${search}%`));
  if (categoryId) conditions.push(eq(posts.categoryId, categoryId));
  if (productId) conditions.push(eq(posts.productId, productId));
  if (userId) conditions.push(eq(posts.userId, userId));
  const whereClause = and(...conditions);
  const [result, countResult] = await Promise.all([
    db.select({
      post: posts,
      userName: users.name,
      openId: users.openId,
      userGrade: users.grade,
      productName: products.name,
      productThumbnail: products.thumbnail,
      productSlug: products.slug,
      hasHumanReply: sql<number>`(SELECT COUNT(*) FROM inquiryReplies WHERE inquiryReplies.postId = posts.id AND inquiryReplies.isAutoReply = 0)`,
    }).from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(products, eq(posts.productId, products.id))
      .where(whereClause)
      .orderBy(desc(posts.isPinned), desc(posts.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(whereClause),
  ]);
  return { posts: result.map(r => ({ ...r.post, userName: r.post.authorName ?? r.userName, displayName: formatDisplayName(r.post.authorName ?? r.userName, r.openId, r.post.id), userGrade: r.userGrade, productName: r.productName, productThumbnail: r.productThumbnail, productSlug: r.productSlug, hasHumanReply: r.hasHumanReply > 0 })), total: countResult[0]?.count ?? 0 };
}

export async function getReviewBoardProducts(boardId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .selectDistinct({ id: products.id, name: products.name, thumbnail: products.thumbnail, categoryId: products.categoryId })
    .from(posts)
    .innerJoin(products, eq(posts.productId, products.id))
    .where(and(eq(posts.boardId, boardId), isNotNull(posts.productId)))
    .orderBy(asc(products.name));
  return result;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    post: posts,
    userName: users.name,
    openId: users.openId,
    productName: products.name,
    productThumbnail: products.thumbnail,
    productSlug: products.slug,
    productItId: products.itId,
    hasHumanReply: sql<number>`(SELECT COUNT(*) FROM inquiryReplies WHERE inquiryReplies.postId = posts.id AND inquiryReplies.isAutoReply = 0)`,
  }).from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .leftJoin(products, eq(posts.productId, products.id))
    .where(eq(posts.id, id))
    .limit(1);
  if (result.length === 0) return undefined;
  await db.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, id));
  const r = result[0];
  return { ...r.post, userName: r.post.authorName ?? r.userName, displayName: formatDisplayName(r.post.authorName ?? r.userName, r.openId, r.post.id), productName: r.productName, productThumbnail: r.productThumbnail, productSlug: r.productSlug, productItId: r.productItId, hasHumanReply: r.hasHumanReply > 0 };
}

export async function createPost(data: InsertPost) {
  const db = await getDb();
  if (!db) return;
  const [{ id }] = await db.insert(posts).values(data).$returningId();
  return id;
}

export async function updatePost(id: number, userId: number, data: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set(data).where(and(eq(posts.id, id), eq(posts.userId, userId)));
}

export async function adminUpdatePost(id: number, data: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set(data).where(eq(posts.id, id));
}

export async function deletePost(id: number, userId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return;
  const condition = isAdmin ? eq(posts.id, id) : and(eq(posts.id, id), eq(posts.userId, userId));
  await db.delete(posts).where(condition);
}

// ─── Comments ───
export async function getComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    comment: comments,
    userName: users.name,
    userRole: users.role,
  }).from(comments).leftJoin(users, eq(comments.userId, users.id)).where(eq(comments.postId, postId)).orderBy(asc(comments.createdAt));
  return result.map(r => ({ ...r.comment, userName: r.userName, userRole: r.userRole }));
}

export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) return;
  await db.insert(comments).values(data);
  await db.update(posts).set({ commentCount: sql`${posts.commentCount} + 1` }).where(eq(posts.id, data.postId));
}

export async function deleteComment(id: number, userId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  if (result.length === 0) return;
  const condition = isAdmin ? eq(comments.id, id) : and(eq(comments.id, id), eq(comments.userId, userId));
  await db.delete(comments).where(condition);
  await db.update(posts).set({ commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)` }).where(eq(posts.id, result[0].postId));
}

// ─── Notifications ───
export async function getUserNotifications(userId: number, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { notifications: [], total: 0, unreadCount: 0 };
  const offset = (page - 1) * limit;
  const [result, countResult, unreadResult] = await Promise.all([
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0))),
  ]);
  return { notifications: result, total: countResult[0]?.count ?? 0, unreadCount: unreadResult[0]?.count ?? 0 };
}

export async function createNotification(userId: number, type: "order" | "comment" | "point" | "system" | "review" | "inquiry" | "discussion", title: string, message: string, link?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ userId, type, title, message, link: link ?? null });
  
  // 사용자에게 이메일 발송 (이메일 알림 수신 설정이 켜져 있는 경우에만)
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(r => r[0]);
  if (!user?.email || user.emailNotifications === 0) return;
  
  // 유형별 이메일 알림 설정 확인
  const typeSettings: Record<typeof type, keyof typeof user> = {
    order: "emailNotifyOrder",
    point: "emailNotifyPoint",
    review: "emailNotifyReview",
    comment: "emailNotifyComment",
    system: "emailNotifySystem",
    inquiry: "emailNotifyComment", // 문의 답변 알림은 댓글 알림 설정을 따름
    discussion: "emailNotifyComment", // 토론 알림은 댓글 알림 설정을 따름
  };
  const settingKey = typeSettings[type];
  if (settingKey && user[settingKey] === 0) return;
  
  // 이메일 발송
  {
    const { sendEmail, generateEmailTemplate } = await import("./_core/email");
    const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || "https://youngcart.manus.space";
    const actionUrl = link ? `${baseUrl}${link}` : undefined;
    const html = await generateEmailTemplate({
      title,
      content: message,
      actionUrl,
      actionText: actionUrl ? "確認する" : undefined,
    });
    await sendEmail({ to: user.email, subject: `[ソウルモノ] ${title}`, html, userId: user.id }).catch((e: any) => {
      console.warn("[createNotification] Email send failed (non-critical):", e?.message ?? e);
    });
  }
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: 1 }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.userId, userId));
}

export async function deleteNotification(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function deleteAllNotifications(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(eq(notifications.userId, userId));
}

// ─── Banners ───
export async function getActiveBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(banners).where(eq(banners.isActive, 1)).orderBy(asc(banners.sortOrder));
}

export async function getAllBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(banners).orderBy(asc(banners.sortOrder));
}

export async function createBanner(data: { title: string; imageUrl: string; linkUrl?: string; isActive?: number; sortOrder?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(banners).values({ ...data, linkUrl: data.linkUrl ?? null, isActive: data.isActive ?? 1, sortOrder: data.sortOrder ?? 0 });
}

export async function updateBanner(id: number, data: Partial<{ title: string; imageUrl: string; linkUrl: string; isActive: number; sortOrder: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(banners).set(data).where(eq(banners.id, id));
}

export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(banners).where(eq(banners.id, id));
}

// ─── Admin Stats ───
export async function getAdminStats() {
  // [연결됨] seoulmono 운영 DB(kapp_s001)
  //   회원   = g5_member
  //   상품   = g5_shop_item (판매중단/삭제분 제외)
  //   주문   = g5_shop_order
  //   매출   = 실 수납액 SUM(od_receipt_price)
  const [userRow, orderRow, productRow, revenueRow, recent] = await Promise.all([
    g5one<{ c: number }>("SELECT COUNT(*) AS c FROM g5_member"),
    g5one<{ c: number }>("SELECT COUNT(*) AS c FROM g5_shop_order"),
    g5one<{ c: number }>("SELECT COUNT(*) AS c FROM g5_shop_item WHERE it_use = '1'"),
    g5one<{ t: number }>("SELECT COALESCE(SUM(od_receipt_price), 0) AS t FROM g5_shop_order"),
    g5q(`SELECT ${G5_ORDER_COLS} FROM g5_shop_order ORDER BY od_time DESC LIMIT 5`),
  ]);
  return {
    totalUsers: Number(userRow?.c ?? 0),
    totalOrders: Number(orderRow?.c ?? 0),
    totalProducts: Number(productRow?.c ?? 0),
    totalRevenue: Number(revenueRow?.t ?? 0),
    recentOrders: recent.map(mapOrderToTalmo),
    // 통관보류는 그누보드 스키마에 대응 상태가 없다.
    customsHoldCount: 0,
  };
}

// ─── Search Keywords ───
export async function recordSearchKeyword(keyword: string) {
  const db = await getDb();
  if (!db) return;
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return;
  try {
    await db.insert(searchKeywords).values({ keyword: trimmed }).onDuplicateKeyUpdate({ set: { searchCount: sql`${searchKeywords.searchCount} + 1`, lastSearchedAt: new Date() } });
  } catch (e) {
    console.warn("[Search] Failed to record keyword:", e);
  }
}

export async function getPopularKeywords(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    keyword: searchKeywords.keyword,
    searchCount: searchKeywords.searchCount,
  }).from(searchKeywords).orderBy(desc(searchKeywords.sortOrder), desc(searchKeywords.searchCount)).limit(limit);
}

export async function getAdminKeywords(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: searchKeywords.id,
    keyword: searchKeywords.keyword,
    searchCount: searchKeywords.searchCount,
    sortOrder: searchKeywords.sortOrder,
    lastSearchedAt: searchKeywords.lastSearchedAt,
  }).from(searchKeywords).orderBy(desc(searchKeywords.sortOrder), desc(searchKeywords.searchCount)).limit(limit);
}

export async function updateKeyword(id: number, data: { searchCount?: number; sortOrder?: number }) {
  const db = await getDb();
  if (!db) return;
  const setData: any = {};
  if (data.searchCount !== undefined) setData.searchCount = data.searchCount;
  if (data.sortOrder !== undefined) setData.sortOrder = data.sortOrder;
  await db.update(searchKeywords).set(setData).where(eq(searchKeywords.id, id));
}

export async function addKeyword(keyword: string, searchCount = 0, sortOrder = 0) {
  const db = await getDb();
  if (!db) return;
  await db.insert(searchKeywords).values({ keyword: keyword.trim().toLowerCase(), searchCount, sortOrder }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
}

export async function deleteKeyword(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(searchKeywords).where(eq(searchKeywords.id, id));
}

export async function batchUpdateKeywordsSortOrder(items: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db || items.length === 0) return;
  await Promise.all(items.map(({ id, sortOrder }) =>
    db.update(searchKeywords).set({ sortOrder }).where(eq(searchKeywords.id, id))
  ));
}

export async function searchKeywordSuggestions(prefix: string, limit = 8) {
  const db = await getDb();
  if (!db) return [];
  const trimmed = prefix.trim().toLowerCase();
  if (!trimmed || trimmed.length < 1) return [];
  return db.select({
    keyword: searchKeywords.keyword,
    searchCount: searchKeywords.searchCount,
  }).from(searchKeywords)
    .where(like(searchKeywords.keyword, `${trimmed}%`))
    .orderBy(desc(searchKeywords.searchCount))
    .limit(limit);
}

export async function searchProductNames(query: string, limit = 6) {
  const db = await getDb();
  if (!db) return [];
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 1) return [];
  const result = await db.select({ name: products.name })
    .from(products)
    .where(and(
      eq(products.status, "active"),
      or(
        like(sql`LOWER(${products.name})`, `%${trimmed}%`),
      )
    ))
    .limit(limit);
  return result.map(r => ({ keyword: r.name, searchCount: 0 }));
}

export async function getProductsByIds(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return [];
  return db.select().from(products).where(inArray(products.id, ids));
}

// ─── Chart Stats ───
export async function getDailySalesStats(days = 30) {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql`
    SELECT 
      DATE(\`createdAt\`) as date,
      COUNT(*) as orderCount,
      COALESCE(SUM(\`totalAmount\`), 0) as revenue
    FROM orders
    WHERE \`createdAt\` >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
    GROUP BY DATE(\`createdAt\`)
    ORDER BY date ASC
  `);
  return (rows as any[]).map((r: any) => ({
    date: r.date,
    orderCount: Number(r.orderCount),
    revenue: Number(r.revenue),
  }));
}

export async function getOrderStatusDistribution() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    status: orders.status,
    count: sql<number>`count(*)`,
  }).from(orders).groupBy(orders.status);
  return result;
}

export async function getMonthlySalesStats(months = 12) {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql`
    SELECT 
      DATE_FORMAT(\`createdAt\`, '%Y-%m') as month,
      COUNT(*) as orderCount,
      COALESCE(SUM(\`totalAmount\`), 0) as revenue
    FROM orders
    WHERE \`createdAt\` >= DATE_SUB(NOW(), INTERVAL ${months} MONTH)
    GROUP BY DATE_FORMAT(\`createdAt\`, '%Y-%m')
    ORDER BY month ASC
  `);
  return (rows as any[]).map((r: any) => ({
    month: r.month,
    orderCount: Number(r.orderCount),
    revenue: Number(r.revenue),
  }));
}

export async function getCategorySalesStats() {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql`
    SELECT 
      c.name as categoryName,
      COUNT(DISTINCT oi.\`orderId\`) as orderCount,
      COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
    FROM \`orderItems\` oi
    JOIN products p ON oi.\`productId\` = p.id
    JOIN categories c ON p.\`categoryId\` = c.id
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
    LIMIT 10
  `);
  return (rows as any[]).map((r: any) => ({
    categoryName: r.categoryName,
    orderCount: Number(r.orderCount),
    revenue: Number(r.revenue),
  }));
}

// ─── Product Reviews (posts with boardType=review) ───
function hashToString(hash: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  let h = Math.abs(hash);
  for (let i = 0; i < 5; i++) {
    result += chars[h % chars.length];
    h = Math.floor(h / chars.length);
  }
  return result;
}

function getPostHash(postId: number): string {
  let hash = 0;
  const str = String(postId);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hashToString(hash);
}

export function formatDisplayName(name: string | null, openId: string | null, postId?: number): string {
  if (!name && !openId) return "匿名";
  if (postId !== undefined) {
    const prefix = String.fromCharCode(97 + (postId % 26));
    return (prefix + getPostHash(postId)).slice(0, 4) + "***";
  }
  const maskedId = openId ? openId.slice(0, Math.min(4, openId.length)) + "***" : "***";
  return maskedId;
}

export async function getProductReviews(productId: number, page = 1, limit = 10) {
  const db = await getDb();
  if (!db) return { reviews: [], total: 0 };
  const offset = (page - 1) * limit;
  const [result, countResult] = await Promise.all([
    db.select({
      post: posts,
      userName: users.name,
      openId: users.openId,
    }).from(posts).leftJoin(users, eq(posts.userId, users.id)).where(eq(posts.productId, productId)).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.productId, productId)),
  ]);
  return { reviews: result.map(r => ({ ...r.post, userName: r.userName, displayName: formatDisplayName(r.userName, r.openId, r.post.id) })), total: countResult[0]?.count ?? 0 };
}


// ─── Site Settings ───
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return result[0]?.settingValue ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const result = await db.select().from(siteSettings).where(inArray(siteSettings.settingKey, keys));
  const map: Record<string, string> = {};
  for (const row of result) {
    map[row.settingKey] = row.settingValue;
  }
  return map;
}

export async function getAllSettings(): Promise<{ key: string; value: string }[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(siteSettings);
  return result.map(r => ({ key: r.settingKey, value: r.settingValue }));
}

export async function upsertSetting(key: string, value: string, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(siteSettings).values({ settingKey: key, settingValue: value, description: description ?? null })
    .onDuplicateKeyUpdate({ set: { settingValue: value } });
}

// ─── Sitemap Helpers ───
export async function getAllProductSlugs(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ slug: products.slug }).from(products).where(eq(products.status, "active"));
  return result.map(r => r.slug);
}

export async function getAllBoardSlugs(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ slug: boards.slug }).from(boards).where(eq(boards.isActive, 1));
  return result.map(r => r.slug);
}

// ─── Bulk Product Point Rate ───
export async function bulkUpdateProductPointRate(pointRate: number, categoryId?: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const condition = categoryId ? eq(products.categoryId, categoryId) : undefined;
  const result = await db.update(products).set({ pointRate }).where(condition);
  return result.rowCount ?? 0;
}

// ─── Review Pending (리뷰 대기 주문 목록) ───
export async function getReviewPendingItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // 배송완료 상태의 주문 항목 중 아직 리뷰를 작성하지 않은 것
  const allDeliveredItems = await db.select({
    orderItemId: orderItems.id,
    orderId: orderItems.orderId,
    productId: orderItems.productId,
    productName: orderItems.productName,
    productThumbnail: orderItems.productThumbnail,
    price: orderItems.price,
    quantity: orderItems.quantity,
    options: orderItems.options,
    deliveredAt: orders.deliveredAt,
    orderNumber: orders.orderNumber,
  }).from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.userId, userId), eq(orders.status, "delivered")))
    .orderBy(desc(orders.deliveredAt));

  if (allDeliveredItems.length === 0) return [];

  // 이미 리뷰를 작성한 orderItemId 목록
  const existingReviews = await db.select({ orderItemId: posts.orderItemId })
    .from(posts)
    .where(and(eq(posts.userId, userId), sql`${posts.orderItemId} IS NOT NULL`));

  const reviewedItemIds = new Set(existingReviews.map(r => r.orderItemId));

  return allDeliveredItems.filter(item => !reviewedItemIds.has(item.orderItemId));
}

// ─── Review with Point (리뷰 작성 + 포인트 적립) ───
export async function createReviewWithPoints(data: {
  boardId: number;
  userId: number;
  productId: number;
  orderId: number;
  orderItemId: number;
  title: string;
  content: string;
  images?: string[];
  rating: number;
}): Promise<{ postId: number; pointsEarned: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 중복 체크 - 동일 orderItemId에 대해 이미 리뷰 작성했는지
  const existing = await db.select({ id: posts.id }).from(posts)
    .where(and(eq(posts.userId, data.userId), eq(posts.orderItemId, data.orderItemId)))
    .limit(1);
  if (existing.length > 0) throw new Error("この注文商品にはすでにレビューを投稿済みです。");

  // 리뷰 포인트 설정 조회
  const settingsResult = await db.select().from(reviewPointSettings).where(eq(reviewPointSettings.isActive, 1)).limit(1);
  const settings = settingsResult[0];
  
  if (!settings) {
    // 설정이 없으면 포인트 지급 안함
    const [{ id: postId }] = await db.insert(posts).values({
      boardId: data.boardId,
      userId: data.userId,
      productId: data.productId,
      orderId: data.orderId,
      orderItemId: data.orderItemId,
      title: data.title,
      content: data.content,
      images: data.images ?? null,
      rating: data.rating,
    }).$returningId();
    await db.update(products).set({
      reviewCount: sql`${products.reviewCount} + 1`,
      avgRating: sql`(SELECT COALESCE(AVG(rating), 0) FROM posts WHERE productId = ${data.productId} AND rating IS NOT NULL)`,
    }).where(eq(products.id, data.productId));
    return { postId, pointsEarned: 0 };
  }

  const isEnabled = settings.isActive === 1;
  const textPoints = settings.pointsPerReview;
  const photoPoints = settings.pointsPerPhotoReview;
  const minRating = settings.minRatingForPoints;

  // 리뷰 등록
  const [{ id: postId }] = await db.insert(posts).values({
    boardId: data.boardId,
    userId: data.userId,
    productId: data.productId,
    orderId: data.orderId,
    orderItemId: data.orderItemId,
    title: data.title,
    content: data.content,
    images: data.images ?? null,
    rating: data.rating,
  }).$returningId();

  // 상품 리뷰 카운트 및 평점 업데이트
  await db.update(products).set({
    reviewCount: sql`${products.reviewCount} + 1`,
    avgRating: sql`(SELECT COALESCE(AVG(rating), 0) FROM posts WHERE productId = ${data.productId} AND rating IS NOT NULL)`,
  }).where(eq(products.id, data.productId));

  // 포인트 적립 계산
  let pointsEarned = 0;
  if (isEnabled && data.rating >= minRating) {
    pointsEarned = textPoints;
    if (data.images && data.images.length > 0) {
      pointsEarned += photoPoints;
    }

    // 포인트 적립
    await db.update(users).set({
      points: sql`${users.points} + ${pointsEarned}`,
    }).where(eq(users.id, data.userId));

    // 포인트 히스토리 기록
    const hasPhotos = data.images && data.images.length > 0;
    await db.insert(pointHistory).values({
      userId: data.userId,
      amount: pointsEarned,
      type: "earn",
      description: hasPhotos ? `フォトレビュー投稿ポイント (${textPoints}P + ${photoPoints}P)` : `レビュー投稿ポイント (${textPoints}P)`,
      orderId: data.orderId,
    });

    // 알림 발송
    await db.insert(notifications).values({
      userId: data.userId,
      type: "point",
      title: "レビューポイント付与",
      message: `レビュー投稿により${pointsEarned.toLocaleString()}ポイントが付与されました。`,
      link: `/community/review`,
    });
  }

  return { postId, pointsEarned };
}

// ─── Review Point Settings ───
export async function getReviewPointSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reviewPointSettings).where(eq(reviewPointSettings.isActive, 1)).limit(1);
  return result[0] || null;
}

export async function updateReviewPointSettings(data: {
  pointsPerReview?: number;
  pointsPerPhotoReview?: number;
  minRatingForPoints?: number;
  isActive?: number;
}) {
  const db = await getDb();
  if (!db) return;
  // ID 1인 설정 업데이트 (기본 설정)
  await db.update(reviewPointSettings).set(data).where(eq(reviewPointSettings.id, 1));
}



// ─── Coupons ───

export async function getAllCoupons(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const rows = await g5q<any>(
    `SELECT z.cz_id, z.cz_subject, z.cz_limit, z.cz_start, z.cz_end, z.cz_period,
            z.cp_method, z.cp_target, z.cp_target2, z.cp_price, z.cp_type, z.cp_minimum, z.cp_maximum,
            (SELECT COUNT(*) FROM g5_shop_coupon c WHERE c.cz_id = z.cz_id) AS issuedCount,
            (SELECT COUNT(*) FROM g5_shop_coupon c WHERE c.cz_id = z.cz_id AND c.od_id IS NOT NULL) AS usedCount
     FROM g5_shop_coupon_zone z ORDER BY z.cz_id DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const countRow = await g5one<{ c: number }>("SELECT COUNT(*) AS c FROM g5_shop_coupon_zone");
  const coupons = rows.map((z: any) => ({
    id: Number(z.cz_id),
    code: `CZ-${z.cz_id}`,
    name: z.cz_subject,
    description: "",
    discountType: Number(z.cp_type) === 1 ? "percent" : "fixed",
    discountValue: Number(z.cp_price) || 0,
    minOrderAmount: Number(z.cp_minimum) || 0,
    maxDiscountAmount: Number(z.cp_maximum) > 0 ? Number(z.cp_maximum) : null,
    totalQuantity: z.cz_limit != null ? Number(z.cz_limit) : -1,
    perUserLimit: null as number | null,
    startDate: z.cz_start && z.cz_start !== "0000-00-00" ? new Date(z.cz_start) : new Date(),
    endDate: z.cz_end && z.cz_end !== "0000-00-00" ? new Date(z.cz_end) : new Date(Date.now() + 30 * 86400000),
    isActive: 1,
    targetType: Number(z.cp_method) === 0 ? "product" : Number(z.cp_method) === 2 ? "category" : "all",
    targetProductIds: Number(z.cp_method) === 0 ? (z.cp_target || null) : null,
    targetCategoryIds: Number(z.cp_method) === 2 ? (z.cp_target2 || null) : null,
    assignType: "all",
    assignUserIds: null as string | null,
    usedCount: Number(z.usedCount) || 0,
    issuedCount: Number(z.issuedCount) || 0,
    createdAt: new Date(),
  }));
  return { coupons, total: Number(countRow?.c) || 0 };
}

export async function getCouponById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  return result[0];
}

export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coupons).where(sql`LOWER(${coupons.code}) = LOWER(${code})`).limit(1);
  return result[0];
}

export async function createCoupon(data: any) {
  const start = data.startDate ? new Date(data.startDate) : new Date();
  const end = data.endDate ? new Date(data.endDate) : new Date(Date.now() + 30 * 86400000);
  const czStart = start.toISOString().slice(0, 10);
  const czEnd = end.toISOString().slice(0, 10);
  const cpMethod = data.targetType === "product" ? 0 : data.targetType === "category" ? 2 : 1;
  const cpTarget = data.targetType === "product" ? (data.targetProductIds || "") : "";
  const cpTarget2 = data.targetType === "category" ? (data.targetCategoryIds || "") : "";
  const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
  const result: any = await g5q(
    `INSERT INTO g5_shop_coupon_zone
      (cz_type, cz_subject, cz_limit, cz_period_date, cz_start, cz_end, cz_file, cz_period, cz_point,
       cp_method, cp_target, cp_target2, mb_level, cp_price, cp_type, cp_trunc, cp_minimum, cp_maximum, cz_download, cz_datetime)
     VALUES (0, ?, ?, '0000-00-00', ?, ?, '', 0, 0, ?, ?, ?, 1, ?, ?, 0, ?, ?, 0, ?)`,
    [
      data.name ?? "",
      data.totalQuantity && data.totalQuantity > 0 ? data.totalQuantity : 9999,
      czStart, czEnd,
      cpMethod, cpTarget, cpTarget2,
      Number(data.discountValue) || 0,
      data.discountType === "percent" ? 1 : 0,
      Number(data.minOrderAmount) || 0,
      Number(data.maxDiscountAmount) || 0,
      nowStr,
    ]
  );
  const czId = result.insertId;
  if (data.assignType === "specific" && data.assignUserIds) {
    const userIds = String(data.assignUserIds).split(",").map(Number).filter(Boolean);
    for (const uid of userIds) {
      try { await issueCouponToUser(uid, czId, true); } catch {}
    }
  } else {
    const allIds = await getAllUserIds();
    for (const uid of allIds) {
      try { await issueCouponToUser(uid, czId, true); } catch {}
    }
  }
  return czId;
}

export async function updateCoupon(id: number, data: any) {
  const sets: string[] = [];
  const params: any[] = [];
  if (data.name !== undefined) { sets.push("cz_subject = ?"); params.push(data.name); }
  if (data.discountValue !== undefined) { sets.push("cp_price = ?"); params.push(Number(data.discountValue) || 0); }
  if (data.discountType !== undefined) { sets.push("cp_type = ?"); params.push(data.discountType === "percent" ? 1 : 0); }
  if (data.minOrderAmount !== undefined) { sets.push("cp_minimum = ?"); params.push(Number(data.minOrderAmount) || 0); }
  if (data.maxDiscountAmount !== undefined) { sets.push("cp_maximum = ?"); params.push(Number(data.maxDiscountAmount) || 0); }
  if (data.totalQuantity !== undefined) { sets.push("cz_limit = ?"); params.push(data.totalQuantity && data.totalQuantity > 0 ? data.totalQuantity : 9999); }
  if (data.startDate !== undefined) { sets.push("cz_start = ?"); params.push(new Date(data.startDate).toISOString().slice(0, 10)); }
  if (data.endDate !== undefined) { sets.push("cz_end = ?"); params.push(new Date(data.endDate).toISOString().slice(0, 10)); }
  if (data.targetType !== undefined) {
    const cpMethod = data.targetType === "product" ? 0 : data.targetType === "category" ? 2 : 1;
    sets.push("cp_method = ?"); params.push(cpMethod);
    sets.push("cp_target = ?"); params.push(data.targetType === "product" ? (data.targetProductIds || "") : "");
    sets.push("cp_target2 = ?"); params.push(data.targetType === "category" ? (data.targetCategoryIds || "") : "");
  }
  if (sets.length === 0) return;
  params.push(id);
  await g5q(`UPDATE g5_shop_coupon_zone SET ${sets.join(", ")} WHERE cz_id = ?`, params);
}

export async function deleteCoupon(id: number) {
  // 이미 사용된(주문에 연결된) 쿠폰은 기록 보존을 위해 남겠다
  await g5q("DELETE FROM g5_shop_coupon WHERE cz_id = ? AND od_id IS NULL", [id]);
  await g5q("DELETE FROM g5_shop_coupon_zone WHERE cz_id = ?", [id]);
}

// ─── User Coupons ───

export async function getUserCoupons(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    userCoupon: userCoupons,
    coupon: coupons,
  }).from(userCoupons)
    .innerJoin(coupons, eq(userCoupons.couponId, coupons.id))
    .where(eq(userCoupons.userId, userId))
    .orderBy(desc(userCoupons.createdAt));
  return result.map(r => ({ ...r.userCoupon, coupon: r.coupon }));
}

export async function getAvailableUserCoupons(userId: number, orderAmount: number, productIds?: number[], categoryIds?: number[]) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const result = await db.select({
    userCoupon: userCoupons,
    coupon: coupons,
  }).from(userCoupons)
    .innerJoin(coupons, eq(userCoupons.couponId, coupons.id))
    .where(and(
      eq(userCoupons.userId, userId),
      eq(userCoupons.isUsed, 0),
      eq(coupons.isActive, 1),
      sql`${coupons.startDate} <= ${now}`,
      sql`${coupons.endDate} >= ${now}`,
      sql`${coupons.minOrderAmount} <= ${orderAmount}`,
    ))
    .orderBy(desc(coupons.discountValue));
  return result
    .filter(r => {
      const c = r.coupon;
      if (c.targetType === "product" && c.targetProductIds && productIds) {
        const ids = c.targetProductIds.split(",").map(Number).filter(Boolean);
        if (!productIds.some(pid => ids.includes(pid))) return false;
      }
      if (c.targetType === "category" && c.targetCategoryIds && categoryIds) {
        const ids = c.targetCategoryIds.split(",").map(Number).filter(Boolean);
        if (!categoryIds.some(cid => ids.includes(cid))) return false;
      }
      return true;
    })
    .map(r => ({ ...r.userCoupon, coupon: r.coupon }));
}

function cryptoRandomHex(): string {
  let out = "";
  for (let i = 0; i < 32; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

export async function issueCouponToUser(userId: number, couponId: number, isAdmin = false) {
  const member = await g5one<{ mb_id: string }>("SELECT mb_id FROM g5_member WHERE mb_no = ?", [userId]);
  if (!member) throw new Error("会員が見つかりません。");
  const existing = await g5one<{ cp_no: number }>(
    "SELECT cp_no FROM g5_shop_coupon WHERE cz_id = ? AND mb_id = ?",
    [couponId, member.mb_id]
  );
  if (existing) throw new Error("すでに発行済みのクーポンです。");
  const zone = await g5one<any>("SELECT * FROM g5_shop_coupon_zone WHERE cz_id = ?", [couponId]);
  if (!zone) throw new Error("クーポンが見つかりません。");
  const cpId = cryptoRandomHex();
  const now = new Date();
  const nowStr = now.toISOString().slice(0, 19).replace("T", " ");
  const cpStart = zone.cz_start && zone.cz_start !== "0000-00-00" ? zone.cz_start : now.toISOString().slice(0, 10);
  const cpEnd = zone.cz_end && zone.cz_end !== "0000-00-00" ? zone.cz_end : "2099-12-31";
  await g5q(
    `INSERT INTO g5_shop_coupon
      (cp_id, cp_subject, mb_id, cz_id, cp_start, cp_end,
       cp_price, cp_type, cp_method, cp_trunc, cp_minimum, cp_maximum, cp_target, cp_datetime)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?)`,
    [cpId, zone.cz_subject, member.mb_id, couponId, cpStart, cpEnd,
     Number(zone.cp_price) || 0, Number(zone.cp_type) || 0, Number(zone.cp_method) || 0,
     Number(zone.cp_trunc) || 0, Number(zone.cp_minimum) || 0, Number(zone.cp_maximum) || 0, nowStr]
  );
  return cpId;
}

export async function useCoupon(userCouponId: number, orderId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(userCoupons).set({ isUsed: 1, usedAt: new Date(), orderId }).where(eq(userCoupons.id, userCouponId));
  // Increment coupon used count
  const uc = await db.select().from(userCoupons).where(eq(userCoupons.id, userCouponId)).limit(1);
  if (uc.length > 0) {
    await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, uc[0].couponId));
  }
}

export async function unuseCoupon(userCouponId: number) {
  const db = await getDb();
  if (!db) return;
  const uc = await db.select().from(userCoupons).where(eq(userCoupons.id, userCouponId)).limit(1);
  await db.update(userCoupons).set({ isUsed: 0, usedAt: null, orderId: null }).where(eq(userCoupons.id, userCouponId));
  if (uc.length > 0) {
    await db.update(coupons).set({ usedCount: sql`GREATEST(0, ${coupons.usedCount} - 1)` }).where(eq(coupons.id, uc[0].couponId));
  }
}

export async function unuseCouponByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return;
  const uc = await db.select().from(userCoupons).where(eq(userCoupons.orderId, orderId)).limit(1);
  if (uc.length === 0) return;
  await db.update(userCoupons).set({ isUsed: 0, usedAt: null, orderId: null }).where(eq(userCoupons.id, uc[0].id));
  await db.update(coupons).set({ usedCount: sql`GREATEST(0, ${coupons.usedCount} - 1)` }).where(eq(coupons.id, uc[0].couponId));
}

export function calculateCouponDiscount(coupon: { discountType: string; discountValue: number; maxDiscountAmount: number | null }, orderAmount: number): number {
  let discount = 0;
  if (coupon.discountType === "percent") {
    discount = Math.floor(orderAmount * coupon.discountValue / 100);
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else {
    discount = coupon.discountValue;
  }
  return Math.min(discount, orderAmount);
}

export async function getActiveCouponsForDownload(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const all = await db.select().from(coupons).where(and(
    eq(coupons.isActive, 1),
    sql`${coupons.startDate} <= ${now}`,
    sql`${coupons.endDate} >= ${now}`,
    or(
      eq(coupons.totalQuantity, -1),
      sql`${coupons.usedCount} < ${coupons.totalQuantity}`
    )
  )).orderBy(desc(coupons.createdAt));
  if (!userId) return all;
  return all.filter(c => {
    if (c.assignType === "specific" && c.assignUserIds) {
      const ids = c.assignUserIds.split(",").map(Number).filter(Boolean);
      return ids.includes(userId);
    }
    return true;
  });
}

// ─── Promo Codes ───

export async function getAllPromoCodes(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const offset = (page - 1) * limit;
  return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt)).limit(limit).offset(offset);
}

export async function getPromoCodeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  return result[0];
}

export async function getPromoCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promoCodes).where(sql`LOWER(${promoCodes.code}) = LOWER(${code})`).limit(1);
  return result[0];
}

export async function createPromoCode(data: InsertPromoCode) {
  const db = await getDb();
  if (!db) return;
  const [{ id }] = await db.insert(promoCodes).values(data).$returningId();
  return id;
}

export async function updatePromoCode(id: number, data: Partial<InsertPromoCode>) {
  const db = await getDb();
  if (!db) return;
  await db.update(promoCodes).set(data).where(eq(promoCodes.id, id));
}

export async function deletePromoCode(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(promoCodeUsages).where(eq(promoCodeUsages.promoCodeId, id));
  await db.delete(promoCodes).where(eq(promoCodes.id, id));
}

export async function getPromoCodeUsageCountByUser(promoCodeId: number, userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(promoCodeUsages)
    .where(and(eq(promoCodeUsages.promoCodeId, promoCodeId), eq(promoCodeUsages.userId, userId)));
  return Number(result[0]?.count ?? 0);
}

export async function recordPromoCodeUsage(promoCodeId: number, userId: number, orderId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(promoCodeUsages).values({ promoCodeId, userId, orderId: orderId ?? null });
}

export async function incrementPromoCodeUsedCount(promoCodeId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(promoCodes).set({ usedCount: sql`${promoCodes.usedCount} + 1` }).where(eq(promoCodes.id, promoCodeId));
}

export async function decrementPromoCodeUsedCount(promoCodeId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(promoCodes).set({ usedCount: sql`GREATEST(0, ${promoCodes.usedCount} - 1)` }).where(eq(promoCodes.id, promoCodeId));
}

export async function deletePromoCodeUsageByOrderId(promoCodeId: number, orderId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(promoCodeUsages).where(
    and(eq(promoCodeUsages.promoCodeId, promoCodeId), eq(promoCodeUsages.orderId, orderId))
  );
}

export async function getPromoCodeUsageHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    usage: promoCodeUsages,
    promoCode: promoCodes,
  }).from(promoCodeUsages)
    .innerJoin(promoCodes, eq(promoCodeUsages.promoCodeId, promoCodes.id))
    .where(eq(promoCodeUsages.userId, userId))
    .orderBy(desc(promoCodeUsages.createdAt));
  return result.map(r => ({ ...r.usage, promoCode: r.promoCode }));
}

export function calculatePromoDiscount(promo: { discountType: string; discountValue: number; maxDiscountAmount: number | null }, orderAmount: number): number {
  let discount = 0;
  if (promo.discountType === "percent") {
    discount = Math.floor(orderAmount * promo.discountValue / 100);
    if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) {
      discount = promo.maxDiscountAmount;
    }
  } else {
    discount = promo.discountValue;
  }
  return Math.min(discount, orderAmount);
}

// ─── Review Replies ───

export async function getReviewReplies(postId: number) {
  const rows = await g5q<any>(
    "SELECT wr_id, wr_content, wr_datetime, mb_id FROM g5_write_review WHERE wr_parent_id = ? AND wr_is_comment = 1 ORDER BY wr_datetime ASC",
    [postId]
  );
  return rows.map((r: any) => ({
    id: r.wr_id,
    postId,
    content: r.wr_content,
    userName: r.mb_id || "管理者",
    createdAt: r.wr_datetime,
  }));
}

export async function createReviewReply(data: { postId: number; userId?: number; content: string }) {
  const parent = await g5one<any>("SELECT it_id FROM g5_write_review WHERE wr_id = ?", [data.postId]);
  await g5q(
    `INSERT INTO g5_write_review (mb_id, it_id, od_id, wr_subject, wr_content, wr_rating, wr_datetime, wr_ip, wr_is_comment, wr_parent_id)
     VALUES (?, ?, '', '관리자 답변', ?, 0, NOW(), '', 1, ?)`,
    ["admin", parent?.it_id || "", data.content, data.postId]
  );
  return 0;
}

export async function updateReviewReply(id: number, content: string) {
  await g5q("UPDATE g5_write_review SET wr_content = ? WHERE wr_id = ? AND wr_is_comment = 1", [content, id]);
}

export async function deleteReviewReply(id: number) {
  await g5q("DELETE FROM g5_write_review WHERE wr_id = ? AND wr_is_comment = 1", [id]);
}

export async function getReviewsForAdmin(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const rows = await g5q<any>(
    `SELECT r.wr_id, r.it_id, r.wr_subject, r.wr_content, r.wr_rating, r.wr_datetime, r.mb_id,
            m.mb_name, m.mb_email, i.it_name, i.it_img1,
            (SELECT COUNT(*) FROM g5_write_review c WHERE c.wr_parent_id = r.wr_id AND c.wr_is_comment = 1) AS replyCount
     FROM g5_write_review r
     LEFT JOIN g5_member m ON m.mb_id = r.mb_id
     LEFT JOIN g5_shop_item i ON i.it_id = r.it_id
     WHERE r.wr_is_comment = 0
     ORDER BY r.wr_datetime DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const countRow = await g5one<{ c: number }>("SELECT COUNT(*) AS c FROM g5_write_review WHERE wr_is_comment = 0");
  return {
    reviews: rows.map((r: any) => ({
      id: r.wr_id,
      productId: r.it_id ? Number(r.it_id) : null,
      productName: r.it_name || null,
      productThumbnail: r.it_img1 ? (String(r.it_img1).startsWith("/api/product-image/") ? r.it_img1 : `/api/product-image/${r.it_img1}`) : null,
      title: r.wr_subject || "",
      content: r.wr_content || "",
      rating: Number(r.wr_rating) || 0,
      userName: r.mb_name || r.mb_id || "匿名",
      userEmail: r.mb_email || null,
      createdAt: r.wr_datetime,
      replyCount: Number(r.replyCount) || 0,
    })),
    total: Number(countRow?.c) || 0,
  };
}// ─── Q&A Helpers ───

export async function getProductQnA(productId: number, page = 1, limit = 10) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };
  const qnaBoards = await db.select().from(boards).where(eq(boards.boardType, "qna")).limit(1);
  if (qnaBoards.length === 0) return { posts: [], total: 0 };
  const boardId = qnaBoards[0].id;
  const offset = (page - 1) * limit;
  const [items, countResult] = await Promise.all([
    db.select({
      post: posts,
      userName: users.name,
      openId: users.openId,
    }).from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(and(eq(posts.boardId, boardId), eq(posts.productId, productId)))
      .orderBy(desc(posts.createdAt))
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts)
      .where(and(eq(posts.boardId, boardId), eq(posts.productId, productId))),
  ]);
  return {
    posts: items.map(r => ({ ...r.post, userName: r.userName, displayName: formatDisplayName(r.userName, r.openId, r.post.id) })),
    total: countResult[0]?.count ?? 0,
  };
}

export async function getAllProductQnA(opts: {
  page?: number;
  limit?: number;
  search?: string;
  productId?: number;
  onlyUnanswered?: boolean;
}) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const offset = (page - 1) * limit;

  const qnaBoards = await db.select().from(boards).where(eq(boards.boardType, "qna")).limit(1);
  if (qnaBoards.length === 0) return { posts: [], total: 0 };
  const boardId = qnaBoards[0].id;

  const conditions: any[] = [eq(posts.boardId, boardId), isNotNull(posts.productId)];
  if (opts.onlyUnanswered) conditions.push(eq(posts.isAnswered, 0));
  if (opts.productId) conditions.push(eq(posts.productId, opts.productId));
  if (opts.search) conditions.push(like(posts.title, `%${opts.search}%`));

  const where = and(...conditions);

  const [items, countResult] = await Promise.all([
    db.select({
      post: posts,
      userName: users.name,
      openId: users.openId,
      productName: products.name,
      productThumbnail: products.thumbnail,
      productSlug: products.slug,
      commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.postId = ${posts.id})`,
    }).from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(products, eq(posts.productId, products.id))
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(where),
  ]);

  return {
    posts: items.map(r => ({
      ...r.post,
      userName: r.post.authorName ?? r.userName,
      displayName: formatDisplayName(r.post.authorName ?? r.userName, r.openId, r.post.id),
      productName: r.productName,
      productThumbnail: r.productThumbnail,
      productSlug: r.productSlug,
      commentCount: r.commentCount,
    })),
    total: countResult[0]?.count ?? 0,
  };
}

export async function getProductQnAForAdmin(opts: {
  page?: number;
  limit?: number;
  onlyUnanswered?: boolean;
}) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 30;
  const offset = (page - 1) * limit;

  const qnaBoards = await db.select().from(boards).where(eq(boards.boardType, "qna")).limit(1);
  if (qnaBoards.length === 0) return { posts: [], total: 0 };
  const boardId = qnaBoards[0].id;

  const conditions: any[] = [eq(posts.boardId, boardId), isNotNull(posts.productId)];
  if (opts.onlyUnanswered) conditions.push(eq(posts.isAnswered, 0));

  const where = and(...conditions);

  const [items, countResult] = await Promise.all([
    db.select({
      post: posts,
      userName: users.name,
      userEmail: users.email,
      productName: products.name,
      productThumbnail: products.thumbnail,
      commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.postId = ${posts.id})`,
    }).from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(products, eq(posts.productId, products.id))
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(where),
  ]);

  return {
    posts: items.map(r => ({
      ...r.post,
      userName: r.post.authorName ?? r.userName,
      userEmail: r.userEmail,
      productName: r.productName,
      productThumbnail: r.productThumbnail,
      commentCount: r.commentCount,
    })),
    total: countResult[0]?.count ?? 0,
  };
}

export async function createProductQnA(data: {
  userId: number;
  productId: number;
  title: string;
  content: string;
}) {
  const db = await getDb();
  if (!db) return;
  const qnaBoards = await db.select().from(boards).where(eq(boards.boardType, "qna")).limit(1);
  if (qnaBoards.length === 0) throw new Error("Q&A掲示板がありません。");
  const boardId = qnaBoards[0].id;
  
  const [{ id }] = await db.insert(posts).values({
    boardId,
    userId: data.userId,
    productId: data.productId,
    title: data.title,
    content: data.content,
  }).$returningId();
  return id;
}

// ═══════════════════════════════════════════════════
// ─── Shipping Carriers (택배사) ───
// ═══════════════════════════════════════════════════

export async function getAllCarriers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shippingCarriers).orderBy(asc(shippingCarriers.sortOrder));
}

export async function getActiveCarriers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shippingCarriers).where(eq(shippingCarriers.isActive, 1)).orderBy(asc(shippingCarriers.sortOrder));
}

export async function getCarrierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [carrier] = await db.select().from(shippingCarriers).where(eq(shippingCarriers.id, id));
  return carrier;
}

export async function createCarrier(data: InsertShippingCarrier) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const [{ id }] = await db.insert(shippingCarriers).values(data).$returningId();
  return id;
}

export async function updateCarrier(id: number, data: Partial<InsertShippingCarrier>) {
  const db = await getDb();
  if (!db) return;
  await db.update(shippingCarriers).set(data).where(eq(shippingCarriers.id, id));
}

export async function deleteCarrier(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(shippingCarriers).where(eq(shippingCarriers.id, id));
}

// ═══════════════════════════════════════════════════
// ─── Shipments (배송 정보) ───
// ═══════════════════════════════════════════════════

export async function createShipment(data: InsertShipment) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const [{ id: shipmentId }] = await db.insert(shipments).values(data).$returningId();

  // 17track에 자동 등록
  try {
    const { registerTracking } = await import("./_core/17trackApi");
    await registerTracking(data.trackingNumber);
    console.log(`[Shipment] Registered tracking ${data.trackingNumber} to 17track`);
  } catch (error) {
    console.error(`[Shipment] Failed to register tracking to 17track:`, error);
    // 17track 등록 실패해도 shipment 생성은 계속 진행
  }
  
  return shipmentId;
}

export async function getShipmentByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, orderId)).orderBy(desc(shipments.createdAt)).limit(1);
  return shipment;
}

export async function getShipmentByOrderItemId(orderItemId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [shipment] = await db.select().from(shipments).where(eq(shipments.orderItemId, orderItemId)).orderBy(desc(shipments.createdAt)).limit(1);
  return shipment;
}

export async function getShipmentsForOrder(orderId: number): Promise<{ byItemId: Record<number, typeof shipments.$inferSelect>; fallback: typeof shipments.$inferSelect | null }> {
  const db = await getDb();
  if (!db) return { byItemId: {}, fallback: null };
  try {
    const all = await db.select().from(shipments).where(eq(shipments.orderId, orderId)).orderBy(desc(shipments.createdAt));
    const byItemId: Record<number, typeof shipments.$inferSelect> = {};
    let fallback: typeof shipments.$inferSelect | null = null;
    for (const s of all) {
      if (s.orderItemId) {
        if (!byItemId[s.orderItemId]) byItemId[s.orderItemId] = s;
      } else {
        if (!fallback) fallback = s;
      }
    }
    return { byItemId, fallback };
  } catch {
    return { byItemId: {}, fallback: null };
  }
}

export async function getShipmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
  return shipment;
}

export async function updateShipmentStatus(id: number, status: string, location?: string, description?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, any> = { status };
  if (status === "delivered") {
    updateData.actualDeliveryDate = new Date();
  }
  if (status === "picked_up" || status === "in_transit") {
    updateData.shippedAt = new Date();
  }
  await db.update(shipments).set(updateData).where(eq(shipments.id, id));
  await db.insert(shippingHistory).values({
    shipmentId: id,
    status: status as any,
    location,
    description: description || getShipmentStatusDescription(status),
    occurredAt: new Date(),
  });
}

// 상태만 업데이트 (시스템 이벤트 추가 없이)
export async function updateShipmentStatusOnly(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, any> = { status };
  if (status === "delivered") {
    updateData.actualDeliveryDate = new Date();
  }
  if (status === "picked_up" || status === "in_transit" || status === "in_transit_intl" || status === "departed_origin") {
    updateData.shippedAt = new Date();
  }
  await db.update(shipments).set(updateData).where(eq(shipments.id, id));
}

// 통관 정보 업데이트 (통관번호, 세관명, 통관검사 시작일)
export async function updateShipmentCustomsInfo(id: number, data: { customsNumber?: string; customsOffice?: string; customsHoldAt?: Date }) {
  const db = await getDb();
  if (!db) return;
  await db.update(shipments).set(data).where(eq(shipments.id, id));
}

export async function updateShipmentCustomsConfirm(id: number, data: { customsConfirmed: number; customsConfirmedAt?: Date; customsConfirmedBy?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(shipments).set(data).where(eq(shipments.id, id));
}

// 통관검사 중인 주문 조회 (관리자 대시보드용)
export async function getCustomsHoldShipments() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      shipmentId: shipments.id,
      orderId: shipments.orderId,
      trackingNumber: shipments.trackingNumber,
      status: shipments.status,
      customsNumber: shipments.customsNumber,
      customsOffice: shipments.customsOffice,
      customsHoldAt: shipments.customsHoldAt,
      createdAt: shipments.createdAt,
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      userId: orders.userId,
      totalAmount: orders.totalAmount,
      userName: users.name,
      userEmail: users.email,
    })
    .from(shipments)
    .innerJoin(orders, eq(shipments.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(
      or(
        eq(orders.status, "customs_hold"),
        isNotNull(shipments.customsNumber)
      )
    )
    .orderBy(desc(shipments.customsHoldAt));
  
  // 각 주문의 상품 정보도 가져오기
  const enriched = await Promise.all(result.map(async (r) => {
    const items = await getOrderItems(r.orderId);
    return { ...r, items };
  }));
  
  return enriched;
}

// 배송 정보 수정 (택배사, 운송장 번호, 배송 유형)
export async function updateShipmentInfo(id: number, data: { carrierId?: number; trackingNumber?: string; shippingType?: 'international' | 'domestic' }) {
  const db = await getDb();
  if (!db) return;
  await db.update(shipments).set(data).where(eq(shipments.id, id));
}

// 배송 중인 모든 shipment 조회 (자동 동기화용)
export async function getActiveShipments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shipments).where(
    and(
      not(eq(shipments.status, 'delivered')),
      not(eq(shipments.status, 'failed')),
      not(eq(shipments.status, 'returned')),
    )
  );
}

function getShipmentStatusDescription(status: string): string {
  const map: Record<string, string> = {
    ready: "配送の準備中です。",
    picked_up: "配送業者が商品を集荷しました。",
    in_transit: "配送中です。",
    out_for_delivery: "配達に出発しました。",
    delivered: "配達が完了しました。",
    failed: "配送に失敗しました。",
  };
  return map[status] || "ステータスが変更されました。";
}

export async function getShippingHistoryByShipmentId(shipmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shippingHistory).where(
    and(eq(shippingHistory.shipmentId, shipmentId), ne(shippingHistory.description, "운송장이 등록되었습니다."))
  ).orderBy(desc(shippingHistory.occurredAt));
}

export async function createShippingHistory(data: { shipmentId: number; status: string; location: string; description: string; timestamp: Date }) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  
  // status를 enum 값으로 변환 (기본값: in_transit)
  const validStatuses = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed",
    "accepted", "export_customs", "departed_origin", "in_transit_intl", "arrived_destination",
    "import_customs", "customs_cleared", "in_transit_domestic", "returned"];
  const enumStatus = validStatuses.includes(data.status) ? data.status : "in_transit";
  
  const result = await db.insert(shippingHistory).values({
    shipmentId: data.shipmentId,
    status: enumStatus as any,
    location: data.location,
    description: data.description,
    rawStatus: data.status, // 원본 status 저장
    occurredAt: data.timestamp,
  }).$returningId();
  return result[0].id;
}

export async function getShipmentWithCarrier(orderId: number) {
  const shipment = await getShipmentByOrderId(orderId);
  if (!shipment) return null;
  const carrier = await getCarrierById(shipment.carrierId);
  const history = await getShippingHistoryByShipmentId(shipment.id);
  return { ...shipment, carrier, history };
}

export async function getAllShipments(page = 1, limit = 20, status?: string) {
  const db = await getDb();
  if (!db) return { shipments: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = status ? [eq(shipments.status, status as any)] : [];
  const [rows, countResult] = await Promise.all([
    db.select().from(shipments).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(shipments.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(shipments).where(conditions.length ? and(...conditions) : undefined),
  ]);
  return { shipments: rows, total: countResult[0].count };
}

// 발송 대기 주문 (paid/preparing 상태이면서 shipment가 없는 주문)
export async function getPendingShipmentOrders(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  const offset = (page - 1) * limit;
  const result = await db.select().from(orders)
    .where(or(eq(orders.status, "paid"), eq(orders.status, "preparing")))
    .orderBy(desc(orders.createdAt))
    .limit(limit).offset(offset);
  const ordersWithShipment = await Promise.all(result.map(async (order) => {
    const shipment = await getShipmentByOrderId(order.id);
    return { ...order, hasShipment: !!shipment };
  }));
  const pendingOrders = ordersWithShipment.filter(o => !o.hasShipment);
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(orders)
    .where(or(eq(orders.status, "paid"), eq(orders.status, "preparing")));
  return { orders: pendingOrders, total: countResult.count };
}

// 배송 현황 통계
export async function getShippingStats() {
  const db = await getDb();
  if (!db) return { pending: 0, shipping: 0, delivered: 0, failed: 0, customsHold: 0 };
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(orders)
    .where(or(eq(orders.status, "paid"), eq(orders.status, "preparing")));
  const [shippingCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments)
    .where(or(eq(shipments.status, "pending"), eq(shipments.status, "picked_up"), eq(shipments.status, "in_transit"), eq(shipments.status, "out_for_delivery")));
  const [deliveredCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments)
    .where(eq(shipments.status, "delivered"));
  const [failedCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments)
    .where(eq(shipments.status, "failed"));
  const [customsHoldCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments)
    .where(eq(shipments.status, "import_customs"));
  return {
    pending: pendingCount.count,
    shipping: shippingCount.count,
    delivered: deliveredCount.count,
    failed: failedCount.count,
    customsHold: customsHoldCount.count,
  };
}

// ═══════════════════════════════════════════════════
// ─── Shipping Policies (배송비 정책) ───
// ═══════════════════════════════════════════════════

export async function getAllShippingPolicies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shippingPolicies).orderBy(desc(shippingPolicies.isDefault), asc(shippingPolicies.id));
}

export async function getDefaultShippingPolicy() {
  const db = await getDb();
  if (!db) return undefined;
  const [policy] = await db.select().from(shippingPolicies).where(eq(shippingPolicies.isDefault, 1)).limit(1);
  return policy;
}

export async function createShippingPolicy(data: InsertShippingPolicy) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const [{ id }] = await db.insert(shippingPolicies).values(data).$returningId();
  return id;
}

export async function updateShippingPolicy(id: number, data: Partial<InsertShippingPolicy>) {
  const db = await getDb();
  if (!db) return;
  await db.update(shippingPolicies).set(data).where(eq(shippingPolicies.id, id));
}

export async function deleteShippingPolicy(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(shippingPolicies).where(eq(shippingPolicies.id, id));
}

export function calculateShippingFee(totalAmount: number, address: string, policies: { baseFee: number; freeShippingThreshold: number; additionalFee: number; additionalFeeRegions: string[] | null; isDefault: number }[]): number {
  const defaultPolicy = policies.find(p => p.isDefault === 1);
  if (!defaultPolicy) return 3000;
  let fee = totalAmount >= defaultPolicy.freeShippingThreshold ? 0 : defaultPolicy.baseFee;
  // 추가 배송비 정책 확인
  const additionalPolicies = policies.filter(p => p.isDefault === 0 && p.additionalFeeRegions);
  for (const policy of additionalPolicies) {
    if (policy.additionalFeeRegions?.some(region => address.includes(region))) {
      fee += policy.additionalFee;
      break;
    }
  }
  return fee;
}

// ═══════════════════════════════════════════════════
// ─── Return Requests (반품/교환) ───
// ═══════════════════════════════════════════════════

export async function createReturnRequest(data: InsertReturnRequest) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const [{ id }] = await db.insert(returnRequests).values(data).$returningId();
  return id;
}

export async function getReturnRequestsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(returnRequests).where(eq(returnRequests.orderId, orderId)).orderBy(desc(returnRequests.createdAt));
}

export async function getReturnRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [request] = await db.select().from(returnRequests).where(eq(returnRequests.id, id));
  return request;
}

export async function updateReturnRequest(id: number, data: Partial<InsertReturnRequest & { adminMemo?: string; status?: string }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(returnRequests).set(data).where(eq(returnRequests.id, id));
}

export async function getAllReturnRequests(page = 1, limit = 20, status?: string) {
  const db = await getDb();
  if (!db) return { requests: [], total: 0 };
  const offset = (page - 1) * limit;
  const conditions = status ? [eq(returnRequests.status, status as any)] : [];
  const [rows, countResult] = await Promise.all([
    db.select().from(returnRequests).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(returnRequests.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(returnRequests).where(conditions.length ? and(...conditions) : undefined),
  ]);
  // 주문 정보 조인
  const enriched = await Promise.all(rows.map(async (r) => {
    const order = await getOrderById(r.orderId);
    const user = await getUserById(r.userId);
    return { ...r, order, user };
  }));
  return { requests: enriched, total: countResult[0].count };
}

export async function getReturnRequestsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(returnRequests).where(eq(returnRequests.userId, userId)).orderBy(desc(returnRequests.createdAt));
}

// ─── Price Alerts ───
export async function getPriceAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const alerts = await db.select().from(priceAlerts).where(eq(priceAlerts.userId, userId)).orderBy(desc(priceAlerts.createdAt));
  // 상품 정보 조인
  const enriched = await Promise.all(alerts.map(async (alert) => {
    const product = await getProductById(alert.productId);
    return { ...alert, product };
  }));
  return enriched;
}

export async function createPriceAlert(data: { userId: number; productId: number; originalPrice: number }) {
  const db = await getDb();
  if (!db) return 0;
  const [{ id }] = await db.insert(priceAlerts).values({ ...data, targetPrice: data.originalPrice }).$returningId();
  return id;
}

export async function deletePriceAlert(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(priceAlerts).where(and(eq(priceAlerts.id, id), eq(priceAlerts.userId, userId)));
}

export async function getPriceAlertsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(priceAlerts).where(eq(priceAlerts.productId, productId));
}

export async function notifyPriceChanges(productId: number, productName: string, productSlug: string, newPrice: number) {
  const db = await getDb();
  if (!db) return 0;
  const alerts = await getPriceAlertsByProduct(productId);
  let notifiedCount = 0;
  for (const alert of alerts) {
    const lastPrice = alert.targetPrice;
    if (newPrice === lastPrice) continue;
    const direction = newPrice < lastPrice ? 'down' : 'up';
    const dirLabel = direction === 'down' ? '値下げ' : '値上げ';
    let notified = false;
    try {
      await createNotification(
        alert.userId,
        "system",
        `お気に入り商品の価格${dirLabel}`,
        `「${productName}」の価格が${lastPrice.toLocaleString()}円 → ${newPrice.toLocaleString()}円に変更されました。`,
        `/products/${productSlug}`
      );
      notified = true;
    } catch (e) {
      console.error(`[priceAlert] Failed to notify user ${alert.userId}:`, e);
    }
    await db.update(priceAlerts).set({
      previousPrice: lastPrice,
      targetPrice: newPrice,
      changeDirection: direction,
      changedAt: new Date(),
      isNotified: notified ? 1 : 0,
      notifiedAt: notified ? new Date() : undefined,
    }).where(eq(priceAlerts.id, alert.id));
    notifiedCount++;
  }
  return notifiedCount;
}



// ─── Admin Statistics (Enhanced Dashboard) ───
export async function getSalesTrend(period: "daily" | "weekly" | "monthly", days: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const ordersData = await db
    .select({
      createdAt: orders.createdAt,
      totalAmount: orders.totalAmount,
      status: orders.status,
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      inArray(orders.status, ["paid", "preparing", "shipping", "delivered"])
    ))
    .orderBy(orders.createdAt);
  
  // 데이터 그룹화
  const groupedData: Record<string, { date: string; sales: number; count: number }> = {};
  
  ordersData.forEach((order) => {
    const date = new Date(order.createdAt);
    let key: string;
    
    if (period === "daily") {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (period === "weekly") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else { // monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groupedData[key]) {
      groupedData[key] = { date: key, sales: 0, count: 0 };
    }
    groupedData[key].sales += order.totalAmount;
    groupedData[key].count += 1;
  });
  
  return Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTopProducts(limit: number) {
  const db = await getDb();
  if (!db) return [];
  
  const topProducts = await db
    .select({
      productId: orderItems.productId,
      productName: products.name,
      productSlug: products.slug,
      productThumbnail: products.thumbnail,
      totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
      totalRevenue: sql<number>`SUM(${orderItems.quantity} * ${orderItems.price})`,
      orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .where(inArray(orders.status, ["paid", "preparing", "shipping", "delivered"]))
    .groupBy(orderItems.productId, products.name, products.slug, products.thumbnail)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(limit);
  
  return topProducts;
}

export async function getNewUsersTrend(days: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const usersData = await db
    .select({
      createdAt: users.createdAt,
    })
    .from(users)
    .where(gte(users.createdAt, startDate))
    .orderBy(users.createdAt);
  
  // 일별로 그룹화
  const groupedData: Record<string, { date: string; count: number }> = {};
  
  usersData.forEach((user) => {
    const date = new Date(user.createdAt);
    const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!groupedData[key]) {
      groupedData[key] = { date: key, count: 0 };
    }
    groupedData[key].count += 1;
  });
  
  return Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));
}


// ─── Grade Benefits ───
export async function getAllGradeBenefits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gradeBenefits).orderBy(asc(gradeBenefits.id));
}

export async function getGradeBenefit(grade: "bronze" | "silver" | "gold" | "vip" | "vvip") {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(gradeBenefits).where(eq(gradeBenefits.grade, grade)).limit(1);
  return result[0] ?? null;
}

export async function updateGradeBenefit(grade: "bronze" | "silver" | "gold" | "vip" | "vvip", data: Partial<InsertGradeBenefit>) {
  const db = await getDb();
  if (!db) return;
  await db.update(gradeBenefits).set(data).where(eq(gradeBenefits.grade, grade));
}

// ─── Grade Upgrade Conditions ───
export async function getAllGradeUpgradeConditions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gradeUpgradeConditions).orderBy(asc(gradeUpgradeConditions.minTotalSpent));
}

export async function updateGradeUpgradeCondition(grade: "bronze" | "silver" | "gold" | "vip" | "vvip", data: Partial<InsertGradeUpgradeCondition>) {
  const db = await getDb();
  if (!db) return;
  await db.update(gradeUpgradeConditions).set(data).where(eq(gradeUpgradeConditions.grade, grade));
}

// 자동 등급 승급 확인 및 적용
export async function checkAndUpgradeUserGrade(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const user = await getUserById(userId);
  if (!user) return null;
  
  const conditions = await getAllGradeUpgradeConditions();
  const sortedConditions = conditions.sort((a, b) => b.minTotalSpent - a.minTotalSpent);
  
  let newGrade = user.grade;
  for (const condition of sortedConditions) {
    if (user.totalSpent >= condition.minTotalSpent) {
      newGrade = condition.grade;
      break;
    }
  }
  
  if (newGrade !== user.grade) {
    await db.update(users).set({ grade: newGrade }).where(eq(users.id, userId));
    return { oldGrade: user.grade, newGrade };
  }
  
  return null;
}

// ─── Restock Alerts ───
export async function getRestockAlertsByProductId(productId: number) {
  return [] as any[];
}

export async function deleteRestockAlertsByProductId(productId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(restockAlerts).where(eq(restockAlerts.productId, productId));
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result[0];
}

// ─── Shipping Summary (Admin Dashboard) ───
export async function getShippingSummary() {
  const db = await getDb();
  if (!db) return { pending: 0, inTransit: 0, delivered: 0, failed: 0, recentShipments: [] };
  
  // 상태별 배송 건수 집계
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments).where(eq(shipments.status, "pending"));
  const [pickedUpCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments).where(eq(shipments.status, "picked_up"));
  const [inTransitCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments).where(eq(shipments.status, "in_transit"));
  const [outForDeliveryCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments).where(eq(shipments.status, "out_for_delivery"));
  const [deliveredCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments).where(eq(shipments.status, "delivered"));
  const [failedCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments).where(eq(shipments.status, "failed"));
  const [customsHoldCount] = await db.select({ count: sql<number>`count(*)` }).from(shipments).where(eq(shipments.status, "import_customs"));
  
  // 최근 배송 목록 (최근 20건)
  const recentShipments = await db
    .select({
      id: shipments.id,
      orderId: shipments.orderId,
      trackingNumber: shipments.trackingNumber,
      status: shipments.status,
      createdAt: shipments.createdAt,
      carrier: {
        id: shippingCarriers.id,
        name: shippingCarriers.name,
        code: shippingCarriers.code,
      },
      orderNumber: orders.orderNumber,
    })
    .from(shipments)
    .leftJoin(shippingCarriers, eq(shipments.carrierId, shippingCarriers.id))
    .leftJoin(orders, eq(shipments.orderId, orders.id))
    .orderBy(desc(shipments.createdAt))
    .limit(20);
  
  return {
    pending: (pendingCount?.count ?? 0),
    inTransit: (pickedUpCount?.count ?? 0) + (inTransitCount?.count ?? 0) + (outForDeliveryCount?.count ?? 0),
    delivered: (deliveredCount?.count ?? 0),
    failed: (failedCount?.count ?? 0),
    customsHold: (customsHoldCount?.count ?? 0),
    recentShipments,
  };
}

// ─── Delayed Shipments (Admin Alert) ───
export async function getDelayedShipments(daysThreshold: number = 3) {
  const db = await getDb();
  if (!db) return [];
  
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
  
  const delayedShipments = await db
    .select({
      id: shipments.id,
      orderId: shipments.orderId,
      orderNumber: orders.orderNumber,
      status: shipments.status,
      createdAt: shipments.createdAt,
      trackingNumber: shipments.trackingNumber,
      carrier: {
        id: shippingCarriers.id,
        name: shippingCarriers.name,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      delayedDays: sql<number>`EXTRACT(DAY FROM NOW() - ${shipments.createdAt})::int`,
    })
    .from(shipments)
    .leftJoin(orders, eq(shipments.orderId, orders.id))
    .leftJoin(shippingCarriers, eq(shipments.carrierId, shippingCarriers.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .where(
      and(
        eq(shipments.status, "pending"),
        sql`${shipments.createdAt} < ${thresholdDate.toISOString().slice(0, 19).replace('T', ' ')}`
      )
    )
    .orderBy(shipments.createdAt);
  
  return delayedShipments;
}

// ─── Get Shipment by Tracking Number ───
export async function getShipmentByTrackingNumber(trackingNumber: string) {
  const db = await getDb();
  if (!db) return null;
  
  const [shipment] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.trackingNumber, trackingNumber))
    .limit(1);
  
  return shipment || null;
}

// ─── Shipping Performance Analytics ───
export async function getShippingPerformanceByCarrier() {
  const db = await getDb();
  if (!db) return [];
  
  const performance = await db
    .select({
      carrierId: shipments.carrierId,
      carrierName: shippingCarriers.name,
      totalShipments: sql<number>`COUNT(*)`,
      deliveredShipments: sql<number>`SUM(CASE WHEN ${shipments.status} = 'delivered' THEN 1 ELSE 0 END)`,
      avgDeliveryDays: sql<number>`AVG(CASE WHEN ${shipments.status} = 'delivered' THEN EXTRACT(DAY FROM ${shipments.updatedAt} - ${shipments.createdAt}) ELSE NULL END)`,
      successRate: sql<number>`ROUND(SUM(CASE WHEN ${shipments.status} = 'delivered' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2)`,
    })
    .from(shipments)
    .leftJoin(shippingCarriers, eq(shipments.carrierId, shippingCarriers.id))
    .groupBy(shipments.carrierId, shippingCarriers.name)
    .orderBy(sql`COUNT(*) DESC`);
  
  return performance;
}

export async function getShippingPerformanceByRegion() {
  const db = await getDb();
  if (!db) return [];
  
  const performance = await db
    .select({
      region: sql<string>`SPLIT_PART(${orders.address1}, ' ', 1)`,
      totalShipments: sql<number>`COUNT(*)`,
      avgDeliveryDays: sql<number>`AVG(CASE WHEN ${shipments.status} = 'delivered' THEN EXTRACT(DAY FROM ${shipments.updatedAt} - ${shipments.createdAt}) ELSE NULL END)`,
    })
    .from(shipments)
    .leftJoin(orders, eq(shipments.orderId, orders.id))
    .where(sql`${orders.address1} IS NOT NULL`)
    .groupBy(sql`SPLIT_PART(${orders.address1}, ' ', 1)`)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);
  
  return performance;
}

export async function getMonthlyShippingStats(months: number = 6) {
  const db = await getDb();
  if (!db) return [];
  
  // Use raw SQL to avoid Drizzle ORM table prefix issues in GROUP BY/ORDER BY
  const [rows] = await db.execute(sql`
    SELECT 
      DATE_FORMAT(\`createdAt\`, '%Y-%m') as month,
      COUNT(*) as totalShipments,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN status IN ('picked_up', 'in_transit', 'out_for_delivery') THEN 1 ELSE 0 END) as inTransit,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM shipments
    WHERE \`createdAt\` >= DATE_SUB(NOW(), INTERVAL ${months} MONTH)
    GROUP BY DATE_FORMAT(\`createdAt\`, '%Y-%m')
    ORDER BY month ASC
  `);
  
  return (rows as any[]).map((r: any) => ({
    month: r.month,
    totalShipments: Number(r.totalShipments),
    delivered: Number(r.delivered),
    inTransit: Number(r.inTransit),
    failed: Number(r.failed),
  }));
}

// ─── Chatbot Settings ───
export async function getChatbotSettings(): Promise<ChatbotSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chatbotSettings).limit(1);
  return result[0] ?? null;
}

export async function upsertChatbotSettings(data: Partial<InsertChatbotSettings>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getChatbotSettings();
  if (existing) {
    await db.update(chatbotSettings).set(data).where(eq(chatbotSettings.id, existing.id));
  } else {
    await db.insert(chatbotSettings).values({ id: 1, ...data });
  }
}

// ─── Chatbot Categories ───
export async function getChatbotCategories(): Promise<ChatbotCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatbotCategories).where(eq(chatbotCategories.isActive, 1)).orderBy(chatbotCategories.sortOrder);
}

export async function getAllChatbotCategories(): Promise<ChatbotCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatbotCategories).orderBy(chatbotCategories.sortOrder);
}

export async function getChatbotCategoryById(id: number): Promise<ChatbotCategory | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chatbotCategories).where(eq(chatbotCategories.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createChatbotCategory(data: InsertChatbotCategory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [{ id }] = await db.insert(chatbotCategories).values(data).$returningId();
  return id;
}

export async function updateChatbotCategory(id: number, data: Partial<InsertChatbotCategory>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(chatbotCategories).set(data).where(eq(chatbotCategories.id, id));
}

export async function deleteChatbotCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(chatbotCategories).where(eq(chatbotCategories.id, id));
}

// ─── Chatbot QnA ───
export async function getChatbotQnaByCategory(categoryId: number): Promise<ChatbotQna[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatbotQna).where(and(eq(chatbotQna.categoryId, categoryId), eq(chatbotQna.isActive, 1))).orderBy(chatbotQna.sortOrder);
}

export async function getAllChatbotQna(): Promise<ChatbotQna[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatbotQna).orderBy(chatbotQna.categoryId, chatbotQna.sortOrder);
}

export async function getChatbotQnaById(id: number): Promise<ChatbotQna | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chatbotQna).where(eq(chatbotQna.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createChatbotQna(data: InsertChatbotQna): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [{ id }] = await db.insert(chatbotQna).values(data).$returningId();
  return id;
}

export async function updateChatbotQna(id: number, data: Partial<InsertChatbotQna>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(chatbotQna).set(data).where(eq(chatbotQna.id, id));
}

export async function deleteChatbotQna(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(chatbotQna).where(eq(chatbotQna.id, id));
}

// ─── Chatbot Conversations ───
export async function createChatbotConversation(data: InsertChatbotConversation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [{ id }] = await db.insert(chatbotConversations).values(data).$returningId();
  return id;
}

export async function saveChatbotConversation(data: {
  userId?: number;
  userMessage: string;
  botResponse: string;
  productId?: number;
}): Promise<number> {
  // 세션 ID 생성 (사용자 ID + 타임스탬프)
  const sessionId = `${data.userId || 'anon'}-${Date.now()}`;
  
  // 메시지 배열 형식으로 변환
  const now = Date.now();
  const messages = [
    { role: 'user' as const, content: data.userMessage, timestamp: now },
    { role: 'assistant' as const, content: data.botResponse, timestamp: now + 1 },
  ];
  
  return await createChatbotConversation({
    userId: data.userId,
    sessionId,
    messages,
  });
}

export async function updateChatbotConversation(id: number, data: Partial<InsertChatbotConversation>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(chatbotConversations).set(data).where(eq(chatbotConversations.id, id));
}

export async function getChatbotConversations(page: number = 1, limit: number = 20): Promise<{ conversations: ChatbotConversation[]; total: number }> {
  const db = await getDb();
  if (!db) return { conversations: [], total: 0 };
  
  const offset = (page - 1) * limit;
  const conversations = await db.select().from(chatbotConversations).orderBy(desc(chatbotConversations.createdAt)).limit(limit).offset(offset);
  const totalResult = await db.select({ count: sql<number>`COUNT(*)` }).from(chatbotConversations);
  const total = totalResult[0]?.count ?? 0;
  
  return { conversations, total };
}

export async function getChatbotConversationById(id: number): Promise<ChatbotConversation | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chatbotConversations).where(eq(chatbotConversations.id, id)).limit(1);
  return result[0] ?? null;
}

// ─── Point Expiration ───
export async function getPointExpirationMonths(): Promise<number> {
  const db = await getDb();
  if (!db) return 12; // 기본값 12개월
  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, "pointExpirationMonths")).limit(1);
  return result[0] ? parseInt(result[0].settingValue) : 12;
}

export async function setPointExpirationMonths(months: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(siteSettings).values({
    settingKey: "pointExpirationMonths",
    settingValue: String(months),
    description: "ポイント有効期間（月単位）",
  }).onDuplicateKeyUpdate({ set: { settingValue: String(months) } });
}

export async function getExpiringPoints(userId: number, daysBeforeExpiration: number = 30): Promise<{ totalExpiring: number; items: typeof pointHistory.$inferSelect[] }> {
  const db = await getDb();
  if (!db) return { totalExpiring: 0, items: [] };
  
  const now = new Date();
  const targetDate = new Date(now.getTime() + daysBeforeExpiration * 24 * 60 * 60 * 1000);
  
  const result = await db.select()
    .from(pointHistory)
    .where(
      and(
        eq(pointHistory.userId, userId),
        or(eq(pointHistory.type, "earn"), eq(pointHistory.type, "admin")),
        sql`${pointHistory.expiresAt} IS NOT NULL`,
        sql`${pointHistory.expiresAt} <= ${targetDate}`,
        sql`${pointHistory.expiresAt} > ${now}`
      )
    )
    .orderBy(pointHistory.expiresAt);
  
  const totalExpiring = result.reduce((sum, item) => sum + item.amount, 0);
  return { totalExpiring, items: result };
}

export async function expirePoints(): Promise<{ expiredCount: number; totalExpiredPoints: number }> {
  const db = await getDb();
  if (!db) return { expiredCount: 0, totalExpiredPoints: 0 };
  
  const now = new Date();
  
  // 만료된 포인트 조회
  const expiredPoints = await db.select()
    .from(pointHistory)
    .where(
      and(
        or(eq(pointHistory.type, "earn"), eq(pointHistory.type, "admin")),
        sql`${pointHistory.expiresAt} IS NOT NULL`,
        sql`${pointHistory.expiresAt} <= ${now}`
      )
    );
  
  if (expiredPoints.length === 0) {
    return { expiredCount: 0, totalExpiredPoints: 0 };
  }
  
  // 사용자별로 만료된 포인트 합산
  const userExpiredPoints = new Map<number, number>();
  for (const point of expiredPoints) {
    const current = userExpiredPoints.get(point.userId) ?? 0;
    userExpiredPoints.set(point.userId, current + point.amount);
  }
  
  // 각 사용자의 포인트 차감 및 만료 내역 기록
  for (const [userId, totalExpired] of Array.from(userExpiredPoints.entries())) {
    // 포인트 차감
    await db.update(users)
      .set({ points: sql`GREATEST(0, ${users.points} - ${totalExpired})` })
      .where(eq(users.id, userId));
    
    // 만료 내역 기록
    await db.insert(pointHistory).values({
      userId,
      amount: -totalExpired,
      type: "use",
      description: "ポイント失効",
      expiresAt: null,
    });
  }
  
  // 만료 처리된 포인트 삭제 (또는 상태 변경)
  await db.delete(pointHistory).where(
    and(
      or(eq(pointHistory.type, "earn"), eq(pointHistory.type, "admin")),
      sql`${pointHistory.expiresAt} IS NOT NULL`,
      sql`${pointHistory.expiresAt} <= ${now}`
    )
  );
  
  const totalExpiredPoints = Array.from(userExpiredPoints.values()).reduce((sum, val) => sum + val, 0);
  return { expiredCount: expiredPoints.length, totalExpiredPoints };
}

// ─── Point Expiration Notification ───
export async function getUsersWithExpiringPoints(daysBeforeExpiration: number = 7): Promise<Array<{ userId: number; email: string | null; name: string | null; totalExpiring: number; earliestExpiration: Date }>> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const targetDate = new Date(now.getTime() + daysBeforeExpiration * 24 * 60 * 60 * 1000);
  
  // 만료 예정 포인트가 있는 사용자 조회
  const expiringPoints = await db.select({
    userId: pointHistory.userId,
    amount: pointHistory.amount,
    expiresAt: pointHistory.expiresAt,
  })
    .from(pointHistory)
    .where(
      and(
        or(eq(pointHistory.type, "earn"), eq(pointHistory.type, "admin")),
        sql`${pointHistory.expiresAt} IS NOT NULL`,
        sql`${pointHistory.expiresAt} <= ${targetDate}`,
        sql`${pointHistory.expiresAt} > ${now}`
      )
    )
    .orderBy(pointHistory.expiresAt);
  
  if (expiringPoints.length === 0) return [];
  
  // 사용자별로 그룹화
  const userPointsMap = new Map<number, { totalExpiring: number; earliestExpiration: Date }>();
  for (const point of expiringPoints) {
    if (!point.expiresAt) continue;
    
    const current = userPointsMap.get(point.userId);
    if (!current) {
      userPointsMap.set(point.userId, {
        totalExpiring: point.amount,
        earliestExpiration: point.expiresAt,
      });
    } else {
      current.totalExpiring += point.amount;
      if (point.expiresAt < current.earliestExpiration) {
        current.earliestExpiration = point.expiresAt;
      }
    }
  }
  
  // 사용자 정보 조회
  const userIds = Array.from(userPointsMap.keys());
  const usersData = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
  })
    .from(users)
    .where(sql`${users.id} IN (${userIds.join(',')})`);
  
  // 결과 조합
  return usersData.map(user => {
    const pointData = userPointsMap.get(user.id)!;
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      totalExpiring: pointData.totalExpiring,
      earliestExpiration: pointData.earliestExpiration,
    };
  });
}

// ─── Email Logs ───
export async function getEmailLogs(page: number = 1, limit: number = 20, userId?: number) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0, page, limit };
  
  const offset = (page - 1) * limit;
  const conditions = userId ? eq(emailLogs.userId, userId) : undefined;
  
  const logs = await db
    .select()
    .from(emailLogs)
    .where(conditions)
    .orderBy(desc(emailLogs.sentAt))
    .limit(limit)
    .offset(offset);
  
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(emailLogs)
    .where(conditions);
  
  return { logs, total: count, page, limit };
}

export async function resendEmail(logId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [log] = await db.select().from(emailLogs).where(eq(emailLogs.id, logId)).limit(1);
  if (!log) throw new Error("Email log not found");
  
  const { sendEmail } = await import("./_core/email");
  const success = await sendEmail({
    to: log.recipient,
    subject: log.subject,
    html: log.htmlContent,
    userId: log.userId || undefined,
  });
  
  return { success };
}

// ─── FAQ ───
export async function getFaqs(category?: string, isActive?: boolean) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (category) conditions.push(eq(faqs.category, category));
  if (isActive !== undefined) conditions.push(eq(faqs.isActive, isActive ? 1 : 0));
  
  return db
    .select()
    .from(faqs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(faqs.sortOrder), desc(faqs.createdAt));
}

export async function getFaqById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [faq] = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
  
  // 조회수 증가
  if (faq) {
    await db.update(faqs).set({ viewCount: faq.viewCount + 1 }).where(eq(faqs.id, id));
  }
  
  return faq || null;
}

export async function createFaq(data: InsertFaq) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [{ id }] = await db.insert(faqs).values(data).$returningId();
  return id;
}

export async function updateFaq(id: number, data: Partial<InsertFaq>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.update(faqs).set(data).where(eq(faqs.id, id));
}

export async function deleteFaq(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.delete(faqs).where(eq(faqs.id, id));
}

// ─── Inquiry Replies ───
export async function getInquiryReplies(postId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({
      id: inquiryReplies.id,
      postId: inquiryReplies.postId,
      adminId: inquiryReplies.adminId,
      adminName: users.name,
      content: inquiryReplies.content,
      isAutoReply: inquiryReplies.isAutoReply,
      attachments: inquiryReplies.attachments,
      createdAt: inquiryReplies.createdAt,
      updatedAt: inquiryReplies.updatedAt,
    })
    .from(inquiryReplies)
    .leftJoin(users, eq(inquiryReplies.adminId, users.id))
    .where(eq(inquiryReplies.postId, postId))
    .orderBy(asc(inquiryReplies.createdAt));
}

export async function getFirstAdminUserId(): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  return result[0]?.id ?? null;
}

export async function requestHumanAgent(postId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set({ needsHuman: 1 }).where(eq(posts.id, postId));
}

export async function createInquiryReply(data: InsertInquiryReply) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const [{ id: replyId }] = await db.insert(inquiryReplies).values(data).$returningId();
  
  // 문의 작성자에게 알림 발송 (인앱 + 이메일)
  const [post] = await db.select().from(posts).where(eq(posts.id, data.postId)).limit(1);
  if (post) {
    const contentPreview = data.content.length > 100 
      ? data.content.substring(0, 100) + "..." 
      : data.content;
    
    const isAuto = (data as any).isAutoReply === 1;
    await createNotification(
      post.userId,
      "inquiry",
      isAuto ? "個別お問い合わせの自動応答が登録されました" : "個別お問い合わせの担当者回答が登録されました",
      `お問い合わせいただいた「${post.title}」への${isAuto ? "自動応答" : "担当者の回答"}が登録されました。\n\n内容: ${contentPreview}`,
      `/inquiry/${post.id}`
    );
    
    // 상담사 답변 등록 시 needsHuman 리셋 (isAnswered는 관리자가 [상담완료] 버튼 누를 때만 설정)
    if (!isAuto) {
      await db.update(posts).set({ needsHuman: 0 }).where(eq(posts.id, data.postId));
    }
  }

  return replyId;
}

export async function updateInquiryReply(id: number, content: string, attachments?: string[] | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const updateData: Record<string, any> = { content };
  if (attachments !== undefined) {
    updateData.attachments = attachments;
  }
  
  await db.update(inquiryReplies).set(updateData).where(eq(inquiryReplies.id, id));
}

export async function deleteInquiryReply(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db.delete(inquiryReplies).where(eq(inquiryReplies.id, id));
}

// ─── 1:1 문의 (real data: g5_write_qna) ───
// The customer-facing "1:1 문의" mypage tab (real shop backend, /shop/inquiries)
// reads/writes g5_write_qna directly: a question is a wr_is_comment=0 row, a
// reply is a wr_is_comment=1 row with wr_parent = the question's wr_id (same
// mechanism the site's native /boards/qna/:id/comment endpoint already uses).
// There's no dedicated "resolved" column, so wr_1 (an unused generic Gnuboard5
// board extension field) is repurposed as a simple '1' = 상담완료 flag.
export async function getRealInquiries(page = 1, limit = 20, search?: string) {
  const offset = (page - 1) * limit;
  let where = "WHERE q.wr_is_comment = 0";
  const params: any[] = [];
  if (search) { where += " AND q.wr_subject LIKE ?"; params.push(`%${search}%`); }
  const rows = await g5q<any>(
    `SELECT q.wr_id, q.wr_subject, q.wr_content, q.wr_datetime, q.wr_comment, q.wr_1, q.wr_2, q.wr_email, q.mb_id, m.mb_name
     FROM g5_write_qna q
     LEFT JOIN g5_member m ON m.mb_id = q.mb_id
     ${where}
     ORDER BY q.wr_id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const countRow = await g5one<{ c: number }>(
    `SELECT COUNT(*) AS c FROM g5_write_qna q ${where}`,
    params
  );
  return {
    posts: rows.map((r: any) => ({
      id: Number(r.wr_id),
      title: r.wr_subject || "",
      content: r.wr_content || "",
      userName: r.mb_name || r.mb_id || null,
      replyEmail: r.wr_email || null,
      attachments: parseQnaAttachments(r.wr_1),
      createdAt: r.wr_datetime instanceof Date ? r.wr_datetime : new Date(String(r.wr_datetime || "").replace(" ", "T")),
      isAnswered: r.wr_2 === "1",
      hasHumanReply: Number(r.wr_comment) > 0,
      needsHuman: false,
    })),
    total: Number(countRow?.c) || 0,
  };
}

function parseQnaAttachments(wr1: string | null | undefined): { url: string; originalname: string }[] {
  if (!wr1) return [];
  try {
    const parsed = JSON.parse(wr1);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((f: any) => ({ url: `/api/boards/files/${f.filename}`, originalname: f.originalname || f.filename }));
  } catch {
    return [];
  }
}

export async function getRealInquiryReplies(postId: number) {
  const rows = await g5q<any>(
    "SELECT wr_id, wr_content, wr_datetime FROM g5_write_qna WHERE wr_parent = ? AND wr_is_comment = 1 ORDER BY wr_id ASC",
    [postId]
  );
  return rows.map((r: any) => ({
    id: Number(r.wr_id),
    content: r.wr_content || "",
    createdAt: r.wr_datetime instanceof Date ? r.wr_datetime : new Date(String(r.wr_datetime || "").replace(" ", "T")),
    isAutoReply: false,
  }));
}

export async function createRealInquiryReply(postId: number, content: string, adminId: string, adminName: string, adminEmail: string) {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const result: any = await g5q(
    `INSERT INTO g5_write_qna (
      wr_num, wr_reply, wr_parent, wr_is_comment, wr_comment, wr_comment_reply,
      ca_name, wr_option, wr_subject, wr_content, wr_seo_title,
      wr_link1, wr_link2, wr_link1_hit, wr_link2_hit, wr_hit, wr_good, wr_nogood,
      mb_id, wr_password, wr_name, wr_email, wr_homepage,
      wr_datetime, wr_file, wr_last, wr_ip,
      wr_facebook_user, wr_twitter_user,
      wr_1, wr_2, wr_3, wr_4, wr_5, wr_6, wr_7, wr_8, wr_9, wr_10
    ) VALUES (0, '', ?, 1, 0, '', '', 'html1', '', ?, '', '', '', 0, 0, 0, 0, 0, ?, '', ?, ?, '', ?, 0, ?, '', '', '', '', '', '', '', '', '', '', '', '', '')`,
    [postId, content, adminId, adminName, adminEmail, now, now]
  );
  await g5q("UPDATE g5_write_qna SET wr_comment = wr_comment + 1, wr_last = ? WHERE wr_id = ?", [now, postId]);
  notifyInquiryReplyByEmail(postId, content).catch(() => {});
  return Number(result.insertId);
}

async function notifyInquiryReplyByEmail(postId: number, content: string) {
  const question = await g5one<{ wr_email: string }>("SELECT wr_email FROM g5_write_qna WHERE wr_id = ?", [postId]);
  const email = question?.wr_email?.trim();
  if (!email) return;
  await fetch("http://127.0.0.1:8080/api/internal/inquiry-reply-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, content }),
  });
}

export async function updateRealInquiryReply(replyId: number, content: string) {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  await g5q("UPDATE g5_write_qna SET wr_content = ?, wr_last = ? WHERE wr_id = ? AND wr_is_comment = 1", [content, now, replyId]);
}

export async function deleteRealInquiryReply(replyId: number, postId: number) {
  await g5q("DELETE FROM g5_write_qna WHERE wr_id = ? AND wr_is_comment = 1", [replyId]);
  await g5q("UPDATE g5_write_qna SET wr_comment = GREATEST(wr_comment - 1, 0) WHERE wr_id = ?", [postId]);
}

export async function markRealInquiryAnswered(postId: number) {
  await g5q("UPDATE g5_write_qna SET wr_2 = '1' WHERE wr_id = ?", [postId]);
}

// ─── Shipping Sync Scheduler Settings ───
export interface ShippingSyncSchedulerConfig {
  enabled: boolean;          // 활성화 여부
  intervalHours: number;     // 동기화 주기 (시간 단위)
  lastRunAt: string | null;  // 마지막 실행 시간 (ISO string)
  lastRunResult: string | null; // 마지막 실행 결과 JSON
}

const SCHEDULER_SETTINGS_KEYS = {
  enabled: "shippingSyncEnabled",
  intervalHours: "shippingSyncIntervalHours",
  lastRunAt: "shippingSyncLastRunAt",
  lastRunResult: "shippingSyncLastRunResult",
};

export async function getShippingSyncSchedulerConfig(): Promise<ShippingSyncSchedulerConfig> {
  const db = await getDb();
  if (!db) return { enabled: true, intervalHours: 12, lastRunAt: null, lastRunResult: null };

  const keys = Object.values(SCHEDULER_SETTINGS_KEYS);
  const result = await db.select().from(siteSettings).where(inArray(siteSettings.settingKey, keys));
  const map: Record<string, string> = {};
  for (const row of result) {
    map[row.settingKey] = row.settingValue;
  }

  return {
    enabled: map[SCHEDULER_SETTINGS_KEYS.enabled] !== "false",
    intervalHours: parseInt(map[SCHEDULER_SETTINGS_KEYS.intervalHours] || "12") || 12,
    lastRunAt: map[SCHEDULER_SETTINGS_KEYS.lastRunAt] || null,
    lastRunResult: map[SCHEDULER_SETTINGS_KEYS.lastRunResult] || null,
  };
}

export async function updateShippingSyncSchedulerConfig(config: { enabled?: boolean; intervalHours?: number }): Promise<void> {
  const db = await getDb();
  if (!db) return;

  if (config.enabled !== undefined) {
    await db.insert(siteSettings).values({
      settingKey: SCHEDULER_SETTINGS_KEYS.enabled,
      settingValue: String(config.enabled),
      description: "配送同期スケジューラーの有効状態",
    }).onDuplicateKeyUpdate({ set: { settingValue: String(config.enabled) } });
  }

  if (config.intervalHours !== undefined) {
    await db.insert(siteSettings).values({
      settingKey: SCHEDULER_SETTINGS_KEYS.intervalHours,
      settingValue: String(config.intervalHours),
      description: "配送同期の間隔（時間単位）",
    }).onDuplicateKeyUpdate({ set: { settingValue: String(config.intervalHours) } });
  }
}

export async function updateShippingSyncLastRun(result: { syncedCount: number; failedCount: number; deliveredCount?: number; total: number }): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date().toISOString();
  await db.insert(siteSettings).values({
    settingKey: SCHEDULER_SETTINGS_KEYS.lastRunAt,
    settingValue: now,
    description: "配送同期の最終実行時間",
  }).onDuplicateKeyUpdate({ set: { settingValue: now } });

  await db.insert(siteSettings).values({
    settingKey: SCHEDULER_SETTINGS_KEYS.lastRunResult,
    settingValue: JSON.stringify(result),
    description: "配送同期の最終実行結果",
  }).onDuplicateKeyUpdate({ set: { settingValue: JSON.stringify(result) } });
}


// ─── Bank Accounts ───
export async function getBankAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bankAccounts)
    .where(eq(bankAccounts.isActive, 1))
    .orderBy(asc(bankAccounts.sortOrder));
}

export async function getAllBankAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bankAccounts)
    .orderBy(asc(bankAccounts.sortOrder));
}

export async function getBankAccountById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bankAccounts)
    .where(eq(bankAccounts.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createBankAccount(data: InsertBankAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [{ id }] = await db.insert(bankAccounts).values(data).$returningId();
  return { id };
}

export async function updateBankAccount(id: number, data: Partial<InsertBankAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bankAccounts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bankAccounts.id, id));
}

export async function deleteBankAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
}

// ─── Payments ───
export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [{ id }] = await db.insert(payments).values(data).$returningId();
  const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return row;
}

export async function getPaymentByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments)
    .where(eq(payments.orderId, orderId))
    .limit(1);
  return result[0] || null;
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments)
    .where(eq(payments.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getPendingPayments() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    payment: payments,
    order: orders,
    user: users,
    bankAccount: bankAccounts,
  })
  .from(payments)
  .leftJoin(orders, eq(payments.orderId, orders.id))
  .leftJoin(users, eq(orders.userId, users.id))
  .leftJoin(bankAccounts, eq(payments.bankAccountId, bankAccounts.id))
  .where(eq(payments.status, "pending"))
  .orderBy(desc(payments.createdAt));
}

export async function confirmPayment(paymentId: number, adminId: number, memo?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  
  // 트랜잭션으로 처리
  return db.transaction(async (tx) => {
    // 1. 결제 상태 업데이트
    await tx.update(payments)
      .set({
        status: "confirmed",
        confirmedAt: now,
        confirmedBy: adminId,
        adminMemo: memo,
        updatedAt: now,
      })
      .where(eq(payments.id, paymentId));
    
    // 2. 결제 정보 조회
    const payment = await tx.select().from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    
    // 3. 주문 상태 업데이트 (pending → paid)
    if (payment[0]) {
      await tx.update(orders)
        .set({ status: "paid", paidAt: now, updatedAt: now })
        .where(eq(orders.id, payment[0].orderId));

      // 4. 비취소 아이템의 itemStatus="pending" 해제 → order.status("paid")로 통일
      await tx.update(orderItems)
        .set({ itemStatus: null })
        .where(
          and(
            eq(orderItems.orderId, payment[0].orderId),
            isNull(orderItems.cancelledAt),
            eq(orderItems.itemStatus, "pending")
          )
        );
    }
    
    return payment[0];
  });
}

export async function cancelPaymentConfirmation(paymentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  return db.transaction(async (tx) => {
    const [payment] = await tx.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) throw new Error("お支払い情報が見つかりません。");
    await tx.update(payments)
      .set({ status: "pending", confirmedAt: null, confirmedBy: null, updatedAt: now })
      .where(eq(payments.id, paymentId));
    await tx.update(orders)
      .set({ status: "pending", paidAt: null, updatedAt: now })
      .where(eq(orders.id, payment.orderId));
    return payment;
  });
}

export async function getExpiredPendingPayments(now: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    payment: payments,
    order: orders,
    user: users,
  })
  .from(payments)
  .leftJoin(orders, eq(payments.orderId, orders.id))
  .leftJoin(users, eq(orders.userId, users.id))
  .where(
    and(
      eq(payments.status, "pending"),
      lt(payments.expiresAt, now)
    )
  )
  .orderBy(asc(payments.expiresAt));
}

export async function expirePayment(paymentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  
  return db.transaction(async (tx) => {
    // 1. 결제 상태 업데이트
    await tx.update(payments)
      .set({ status: "expired", updatedAt: now })
      .where(eq(payments.id, paymentId));
    
    // 2. 결제 정보 조회
    const payment = await tx.select().from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    
    if (!payment[0]) return null;
    
    // 3. 주문 상태 업데이트 (pending → cancelled)
    await tx.update(orders)
      .set({ status: "cancelled", updatedAt: now })
      .where(eq(orders.id, payment[0].orderId));
    
    // 4. 재고 복구
    const items = await tx.select().from(orderItems)
      .where(eq(orderItems.orderId, payment[0].orderId));
    
    for (const item of items) {
      await tx.update(products)
        .set({ stock: sql`stock + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }
    
    return payment[0];
  });
}

// ─── Payment Methods Settings ───
export async function getAllPaymentMethods() {
  const database = await getDb();
  if (!database) return [];
  
  return database.select().from(paymentMethods)
    .orderBy(paymentMethods.sortOrder);
}

export async function getEnabledPaymentMethods() {
  const database = await getDb();
  if (!database) return [];
  
  return database.select().from(paymentMethods)
    .where(eq(paymentMethods.isEnabled, 1))
    .orderBy(paymentMethods.sortOrder);
}

export async function getPaymentMethodByCode(methodCode: string) {
  const database = await getDb();
  if (!database) return null;
  
  const result = await database.select().from(paymentMethods)
    .where(eq(paymentMethods.methodCode, methodCode))
    .limit(1);
  
  return result[0] || null;
}

export async function updatePaymentMethod(id: number, data: Partial<InsertPaymentMethod>) {
  const database = await getDb();
  if (!database) return null;
  
  await database.update(paymentMethods)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(paymentMethods.id, id));
  
  const result = await database.select().from(paymentMethods)
    .where(eq(paymentMethods.id, id))
    .limit(1);
  
  return result[0] || null;
}

// ─── News System ───

export async function getNewsBoardId(): Promise<number | null> {
  const database = await getDb();
  if (!database) return null;
  const result = await database.select({ id: boards.id })
    .from(boards)
    .where(eq(boards.boardType, "news"))
    .limit(1);
  return result[0]?.id ?? null;
}

export async function getNewsPosts(options: {
  categoryId?: number;
  newsSection?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const database = await getDb();
  if (!database) return { posts: [], total: 0 };
  
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const offset = (page - 1) * limit;

  const newsBoardId = await getNewsBoardId();
  if (!newsBoardId) return { posts: [], total: 0 };

  const conditions: any[] = [
    eq(posts.boardId, newsBoardId),
    eq(posts.isHidden, 0),
  ];
  if (options.categoryId) {
    conditions.push(eq(posts.categoryId, options.categoryId));
  }
  if (options.newsSection) {
    conditions.push(eq(posts.newsSection, options.newsSection));
  }
  if (options.search) {
    conditions.push(
      or(
        like(posts.title, `%${options.search}%`),
        like(posts.content, `%${options.search}%`)
      )
    );
  }

  const whereClause = and(...conditions);

  const [newsRows, countResult] = await Promise.all([
    database.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      categoryId: posts.categoryId,
      newsSection: posts.newsSection,
      isAutoGenerated: posts.isAutoGenerated,
      sourceUrl: posts.sourceUrl,
      viewCount: posts.viewCount,
      commentCount: posts.commentCount,
      likeCount: posts.likeCount,
      createdAt: posts.createdAt,
      userId: posts.userId,
      userName: users.name,
    })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(whereClause)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset),
    database.select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(whereClause),
  ]);

  return {
    posts: newsRows,
    total: countResult[0]?.count ?? 0,
  };
}

export async function getNewsPostById(id: number) {
  const database = await getDb();
  if (!database) return null;

  // Increment view count
  await database.update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, id));

  const result = await database.select({
    id: posts.id,
    title: posts.title,
    content: posts.content,
    categoryId: posts.categoryId,
    newsSection: posts.newsSection,
    isAutoGenerated: posts.isAutoGenerated,
    sourceUrl: posts.sourceUrl,
    viewCount: posts.viewCount,
    commentCount: posts.commentCount,
    likeCount: posts.likeCount,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    userId: posts.userId,
    userName: users.name,
  })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function createNewsPost(data: {
  title: string;
  content: string;
  categoryId: number;
  newsSection: string; // 'domestic', 'international', 'research'
  isAutoGenerated?: number;
  sourceUrl?: string;
  userId: number;
}) {
  const database = await getDb();
  if (!database) return null;

  const newsBoardId = await getNewsBoardId();
  if (!newsBoardId) return null;

  const result = await database.insert(posts).values({
    boardId: newsBoardId,
    userId: data.userId,
    title: data.title,
    content: data.content,
    categoryId: data.categoryId,
    newsSection: data.newsSection,
    isAutoGenerated: data.isAutoGenerated ?? 0,
    sourceUrl: data.sourceUrl ?? null,
  }).$returningId();

  return result[0]?.id ?? null;
}

export async function updateNewsPost(id: number, data: {
  title?: string;
  content?: string;
  categoryId?: number;
  newsSection?: string;
  isHidden?: number;
  sourceUrl?: string;
}) {
  const database = await getDb();
  if (!database) return;

  await database.update(posts)
    .set(data)
    .where(eq(posts.id, id));
}

export async function deleteNewsPost(id: number) {
  const database = await getDb();
  if (!database) return;

  await database.delete(posts).where(eq(posts.id, id));
}

export async function getLatestNewsByCategory(categoryId: number, limit = 3) {
  const database = await getDb();
  if (!database) return [];

  const newsBoardId = await getNewsBoardId();
  if (!newsBoardId) return [];

  return database.select({
    id: posts.id,
    title: posts.title,
    content: posts.content,
    categoryId: posts.categoryId,
    newsSection: posts.newsSection,
    isAutoGenerated: posts.isAutoGenerated,
    viewCount: posts.viewCount,
    createdAt: posts.createdAt,
  })
    .from(posts)
    .where(
      and(
        eq(posts.boardId, newsBoardId),
        eq(posts.categoryId, categoryId),
        eq(posts.isHidden, 0)
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

export async function getLatestNewsForHome(limit = 3) {
  const database = await getDb();
  if (!database) return [];

  const newsBoardId = await getNewsBoardId();
  if (!newsBoardId) return [];

  return database.select({
    id: posts.id,
    title: posts.title,
    content: posts.content,
    categoryId: posts.categoryId,
    newsSection: posts.newsSection,
    isAutoGenerated: posts.isAutoGenerated,
    viewCount: posts.viewCount,
    createdAt: posts.createdAt,
  })
    .from(posts)
    .where(
      and(
        eq(posts.boardId, newsBoardId),
        eq(posts.isHidden, 0)
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

// ─── News Auto Settings ───

export async function getNewsAutoSettings() {
  const database = await getDb();
  if (!database) return [];

  return database.select({
    id: newsAutoSettings.id,
    categoryId: newsAutoSettings.categoryId,
    isEnabled: newsAutoSettings.isEnabled,
    frequency: newsAutoSettings.frequency,
    generateTime: newsAutoSettings.generateTime,
    keywords: newsAutoSettings.keywords,
    keywordsEn: newsAutoSettings.keywordsEn,
    promptTemplate: newsAutoSettings.promptTemplate,
    autoPublish: newsAutoSettings.autoPublish,
    categoryName: categories.name,
    categorySlug: categories.slug,
  })
    .from(newsAutoSettings)
    .leftJoin(categories, eq(newsAutoSettings.categoryId, categories.id))
    .orderBy(newsAutoSettings.categoryId);
}

export async function getNewsAutoSettingByCategory(categoryId: number) {
  const database = await getDb();
  if (!database) return null;

  const result = await database.select()
    .from(newsAutoSettings)
    .where(eq(newsAutoSettings.categoryId, categoryId))
    .limit(1);

  return result[0] ?? null;
}

export async function updateNewsAutoSetting(categoryId: number, data: {
  isEnabled?: number;
  frequency?: string;
  generateTime?: string;
  keywords?: string;
  keywordsEn?: string;
  promptTemplate?: string;
  autoPublish?: number;
}) {
  const database = await getDb();
  if (!database) return;

  const existing = await getNewsAutoSettingByCategory(categoryId);
  if (existing) {
    await database.update(newsAutoSettings)
      .set(data)
      .where(eq(newsAutoSettings.categoryId, categoryId));
  } else {
    await database.insert(newsAutoSettings).values({
      categoryId,
      ...data,
    } as any);
  }
}

export async function getEnabledNewsAutoSettings() {
  const database = await getDb();
  if (!database) return [];

  return database.select({
    id: newsAutoSettings.id,
    categoryId: newsAutoSettings.categoryId,
    isEnabled: newsAutoSettings.isEnabled,
    frequency: newsAutoSettings.frequency,
    generateTime: newsAutoSettings.generateTime,
    keywords: newsAutoSettings.keywords,
    keywordsEn: newsAutoSettings.keywordsEn,
    promptTemplate: newsAutoSettings.promptTemplate,
    autoPublish: newsAutoSettings.autoPublish,
    categoryName: categories.name,
    categorySlug: categories.slug,
  })
    .from(newsAutoSettings)
    .leftJoin(categories, eq(newsAutoSettings.categoryId, categories.id))
    .where(eq(newsAutoSettings.isEnabled, 1));
}


// ─── Product Info Sections (FAQ, 사용방법, 용량/용법, 부작용, 주의사항) ───

export async function getProductInfoSections(productId: number, sectionType?: string) {
  const database = await getDb();
  if (!database) return [];
  const conditions = [eq(productInfoSections.productId, productId), eq(productInfoSections.isActive, 1)];
  if (sectionType) conditions.push(eq(productInfoSections.sectionType, sectionType as any));
  return database.select().from(productInfoSections).where(and(...conditions)).orderBy(asc(productInfoSections.sortOrder), asc(productInfoSections.id));
}

export async function getProductInfoSectionsAdmin(productId: number) {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(productInfoSections).where(eq(productInfoSections.productId, productId)).orderBy(asc(productInfoSections.sectionType), asc(productInfoSections.sortOrder));
}

export async function createProductInfoSection(data: { productId: number; sectionType: string; title: string; content: string; sortOrder?: number; isAutoGenerated?: number }) {
  const database = await getDb();
  if (!database) return null;
  const [{ id }] = await database.insert(productInfoSections).values({
    productId: data.productId,
    sectionType: data.sectionType as any,
    title: data.title,
    content: data.content,
    sortOrder: data.sortOrder ?? 0,
    isAutoGenerated: data.isAutoGenerated ?? 0,
  }).$returningId();
  return id;
}

export async function updateProductInfoSection(id: number, data: { title?: string; content?: string; sortOrder?: number; isActive?: number }) {
  const database = await getDb();
  if (!database) return;
  await database.update(productInfoSections).set(data).where(eq(productInfoSections.id, id));
}

export async function deleteProductInfoSection(id: number) {
  const database = await getDb();
  if (!database) return;
  await database.delete(productInfoSections).where(eq(productInfoSections.id, id));
}

export async function bulkCreateProductInfoSections(sections: { productId: number; sectionType: string; title: string; content: string; sortOrder?: number; isAutoGenerated?: number }[]) {
  const database = await getDb();
  if (!database) return;
  if (sections.length === 0) return;
  await database.insert(productInfoSections).values(
    sections.map(s => ({
      productId: s.productId,
      sectionType: s.sectionType as any,
      title: s.title,
      content: s.content,
      sortOrder: s.sortOrder ?? 0,
      isAutoGenerated: s.isAutoGenerated ?? 0,
    }))
  );
}

// ─── Discussions (자유 토론) ───
export async function getDiscussions(opts: { categoryId?: number; search?: string; sort?: string; page?: number; limit?: number; tag?: string }) {
  const db = await getDb();
  if (!db) return { discussions: [], total: 0 };
  const { categoryId, search, sort = "newest", page = 1, limit = 20, tag } = opts;
  const offset = (page - 1) * limit;
  const conditions: any[] = [eq(discussions.isHidden, 0)];
  if (categoryId) conditions.push(eq(discussions.categoryId, categoryId));
  if (search) conditions.push(or(like(discussions.title, `%${search}%`), like(discussions.content, `%${search}%`)));
  if (tag) conditions.push(sql`JSON_CONTAINS(${discussions.tags}, ${JSON.stringify(tag)}, '$')`);
  const whereClause = and(...conditions);

  let orderClause;
  switch (sort) {
    case "popular": orderClause = desc(discussions.likeCount); break;
    case "most_comments": orderClause = desc(discussions.commentCount); break;
    case "views": orderClause = desc(discussions.viewCount); break;
    default: orderClause = desc(discussions.createdAt);
  }

  const [result, countResult] = await Promise.all([
    db.select({ discussion: discussions, userName: users.name })
      .from(discussions)
      .leftJoin(users, eq(discussions.userId, users.id))
      .where(whereClause)
      .orderBy(desc(discussions.isPinned), orderClause)
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(discussions).where(whereClause),
  ]);
  return {
    discussions: result.map(r => ({ ...r.discussion, userName: r.userName })),
    total: countResult[0]?.count ?? 0,
  };
}

export async function getDiscussionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ discussion: discussions, userName: users.name })
    .from(discussions)
    .leftJoin(users, eq(discussions.userId, users.id))
    .where(eq(discussions.id, id))
    .limit(1);
  if (result.length === 0) return undefined;
  return { ...result[0].discussion, userName: result[0].userName };
}

export async function createDiscussion(data: { userId: number; categoryId?: number; title: string; content: string; tags?: string[] }) {
  const db = await getDb();
  if (!db) return 0;
  const [{ id }] = await db.insert(discussions).values({
    userId: data.userId,
    categoryId: data.categoryId ?? null,
    title: data.title,
    content: data.content,
    tags: data.tags ?? null,
  }).$returningId();
  return id;
}

export async function updateDiscussion(id: number, userId: number, data: { title?: string; content?: string; tags?: string[]; categoryId?: number }, isAdmin = false) {
  const db = await getDb();
  if (!db) return;
  const conditions = isAdmin ? [eq(discussions.id, id)] : [eq(discussions.id, id), eq(discussions.userId, userId)];
  await db.update(discussions).set(data as any).where(and(...conditions));
}

export async function deleteDiscussion(id: number, userId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return;
  // 댓글과 좋아요도 함께 삭제
  await db.delete(discussionLikes).where(
    and(eq(discussionLikes.targetType, "discussion"), eq(discussionLikes.targetId, id))
  );
  // 댓글의 좋아요 삭제
  const commentIds = await db.select({ id: discussionComments.id }).from(discussionComments).where(eq(discussionComments.discussionId, id));
  if (commentIds.length > 0) {
    await db.delete(discussionLikes).where(
      and(eq(discussionLikes.targetType, "comment"), inArray(discussionLikes.targetId, commentIds.map(c => c.id)))
    );
  }
  await db.delete(discussionComments).where(eq(discussionComments.discussionId, id));
  const conditions = isAdmin ? [eq(discussions.id, id)] : [eq(discussions.id, id), eq(discussions.userId, userId)];
  await db.delete(discussions).where(and(...conditions));
}

export async function incrementDiscussionViewCount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(discussions).set({ viewCount: sql`${discussions.viewCount} + 1` }).where(eq(discussions.id, id));
}

// ─── Discussion Comments (스레드형 댓글) ───
export async function getDiscussionComments(discussionId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ comment: discussionComments, userName: users.name })
    .from(discussionComments)
    .leftJoin(users, eq(discussionComments.userId, users.id))
    .where(eq(discussionComments.discussionId, discussionId))
    .orderBy(asc(discussionComments.createdAt));
  return result.map(r => ({ ...r.comment, userName: r.userName }));
}

export async function createDiscussionComment(data: { discussionId: number; userId: number; parentId?: number; content: string }) {
  const db = await getDb();
  if (!db) return 0;
  const [{ id }] = await db.insert(discussionComments).values({
    discussionId: data.discussionId,
    userId: data.userId,
    parentId: data.parentId ?? null,
    content: data.content,
  }).$returningId();
  // commentCount 증가
  await db.update(discussions).set({ commentCount: sql`${discussions.commentCount} + 1` }).where(eq(discussions.id, data.discussionId));
  return id;
}

export async function updateDiscussionComment(id: number, userId: number, content: string, isAdmin = false) {
  const db = await getDb();
  if (!db) return;
  const conditions = isAdmin ? [eq(discussionComments.id, id)] : [eq(discussionComments.id, id), eq(discussionComments.userId, userId)];
  await db.update(discussionComments).set({ content }).where(and(...conditions));
}

export async function deleteDiscussionComment(id: number, userId: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select().from(discussionComments).where(eq(discussionComments.id, id)).limit(1);
  if (result.length === 0) return;
  const comment = result[0];
  const conditions = isAdmin ? [eq(discussionComments.id, id)] : [eq(discussionComments.id, id), eq(discussionComments.userId, userId)];
  // 좋아요 삭제
  await db.delete(discussionLikes).where(and(eq(discussionLikes.targetType, "comment"), eq(discussionLikes.targetId, id)));
  // 대댓글도 삭제
  await db.delete(discussionComments).where(eq(discussionComments.parentId, id));
  await db.delete(discussionComments).where(and(...conditions));
  // commentCount 감소
  await db.update(discussions).set({ commentCount: sql`GREATEST(${discussions.commentCount} - 1, 0)` }).where(eq(discussions.id, comment.discussionId));
}

// ─── Discussion Likes ───
export async function toggleDiscussionLike(userId: number, targetType: "discussion" | "comment", targetId: number) {
  const db = await getDb();
  if (!db) return { liked: false };
  const existing = await db.select().from(discussionLikes)
    .where(and(eq(discussionLikes.userId, userId), eq(discussionLikes.targetType, targetType), eq(discussionLikes.targetId, targetId)))
    .limit(1);

  if (existing.length > 0) {
    // 좋아요 취소
    await db.delete(discussionLikes).where(eq(discussionLikes.id, existing[0].id));
    if (targetType === "discussion") {
      await db.update(discussions).set({ likeCount: sql`GREATEST(${discussions.likeCount} - 1, 0)` }).where(eq(discussions.id, targetId));
    } else {
      await db.update(discussionComments).set({ likeCount: sql`GREATEST(${discussionComments.likeCount} - 1, 0)` }).where(eq(discussionComments.id, targetId));
    }
    return { liked: false };
  } else {
    // 좋아요
    await db.insert(discussionLikes).values({ userId, targetType, targetId });
    if (targetType === "discussion") {
      await db.update(discussions).set({ likeCount: sql`${discussions.likeCount} + 1` }).where(eq(discussions.id, targetId));
    } else {
      await db.update(discussionComments).set({ likeCount: sql`${discussionComments.likeCount} + 1` }).where(eq(discussionComments.id, targetId));
    }
    return { liked: true };
  }
}

export async function getUserDiscussionLikes(userId: number, targetType: "discussion" | "comment", targetIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (targetIds.length === 0) return [];
  const result = await db.select().from(discussionLikes)
    .where(and(eq(discussionLikes.userId, userId), eq(discussionLikes.targetType, targetType), inArray(discussionLikes.targetId, targetIds)));
  return result.map(r => r.targetId);
}

// ─── Discussion Admin ───
export async function adminToggleDiscussionPin(id: number) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select({ isPinned: discussions.isPinned }).from(discussions).where(eq(discussions.id, id)).limit(1);
  if (result.length > 0) {
    await db.update(discussions).set({ isPinned: result[0].isPinned ? 0 : 1 }).where(eq(discussions.id, id));
  }
}

export async function adminToggleDiscussionClose(id: number) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select({ isClosed: discussions.isClosed }).from(discussions).where(eq(discussions.id, id)).limit(1);
  if (result.length > 0) {
    await db.update(discussions).set({ isClosed: result[0].isClosed ? 0 : 1 }).where(eq(discussions.id, id));
  }
}

export async function adminToggleDiscussionHide(id: number) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select({ isHidden: discussions.isHidden }).from(discussions).where(eq(discussions.id, id)).limit(1);
  if (result.length > 0) {
    await db.update(discussions).set({ isHidden: result[0].isHidden ? 0 : 1 }).where(eq(discussions.id, id));
  }
}

export async function getPopularDiscussions(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ discussion: discussions, userName: users.name })
    .from(discussions)
    .leftJoin(users, eq(discussions.userId, users.id))
    .where(eq(discussions.isHidden, 0))
    .orderBy(desc(discussions.likeCount), desc(discussions.commentCount))
    .limit(limit);
  return result.map(r => ({ ...r.discussion, userName: r.userName }));
}


// ─── 메인 페이지 통합: 상품 정보 하이라이트 ───
export async function getProductInfoHighlights(limit = 6) {
  const database = await getDb();
  if (!database) return [];
  const result = await database.select({
    productId: productInfoSections.productId,
    sectionType: productInfoSections.sectionType,
    title: productInfoSections.title,
    content: productInfoSections.content,
    updatedAt: productInfoSections.updatedAt,
    productName: products.name,
    productSlug: products.slug,
    productImage: products.thumbnail,
  })
    .from(productInfoSections)
    .innerJoin(products, eq(productInfoSections.productId, products.id))
    .where(eq(productInfoSections.isActive, 1))
    .orderBy(desc(productInfoSections.updatedAt))
    .limit(limit);
  return result;
}


// ─── 토론 댓글 개별 조회 ───
export async function getDiscussionCommentById(id: number) {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(discussionComments).where(eq(discussionComments.id, id)).limit(1);
  return result[0];
}


// ─── InfoBoard Auto Post Settings ───

export async function getInfoBoardAutoSettings(): Promise<InfoBoardAutoSetting[]> {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(infoBoardAutoSettings).orderBy(desc(infoBoardAutoSettings.createdAt));
}

export async function getInfoBoardAutoSettingById(id: number): Promise<InfoBoardAutoSetting | undefined> {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(infoBoardAutoSettings).where(eq(infoBoardAutoSettings.id, id)).limit(1);
  return result[0];
}

export async function getEnabledInfoBoardAutoSettings(): Promise<InfoBoardAutoSetting[]> {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(infoBoardAutoSettings).where(eq(infoBoardAutoSettings.isEnabled, 1));
}

export async function createInfoBoardAutoSetting(data: Omit<InsertInfoBoardAutoSetting, "id" | "createdAt" | "updatedAt">): Promise<{ id: number }> {
  const database = await getDb();
  if (!database) throw new Error("DB not available");
  const [{ id }] = await database.insert(infoBoardAutoSettings).values(data).$returningId();
  return { id };
}

export async function updateInfoBoardAutoSetting(id: number, data: Partial<InsertInfoBoardAutoSetting>): Promise<void> {
  const database = await getDb();
  if (!database) return;
  await database.update(infoBoardAutoSettings).set(data).where(eq(infoBoardAutoSettings.id, id));
}

export async function deleteInfoBoardAutoSetting(id: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  await database.delete(infoBoardAutoSettings).where(eq(infoBoardAutoSettings.id, id));
}

// ─── InfoBoard Auto Post Logs ───

export async function getInfoBoardAutoLogs(settingId?: number, page = 1, limit = 20): Promise<{ logs: InfoBoardAutoLog[]; total: number }> {
  const database = await getDb();
  if (!database) return { logs: [], total: 0 };
  const offset = (page - 1) * limit;

  const conditions = settingId ? eq(infoBoardAutoLogs.settingId, settingId) : undefined;

  const [logs, countResult] = await Promise.all([
    conditions
      ? database.select().from(infoBoardAutoLogs).where(conditions).orderBy(desc(infoBoardAutoLogs.createdAt)).limit(limit).offset(offset)
      : database.select().from(infoBoardAutoLogs).orderBy(desc(infoBoardAutoLogs.createdAt)).limit(limit).offset(offset),
    conditions
      ? database.select({ count: sql<number>`count(*)` }).from(infoBoardAutoLogs).where(conditions)
      : database.select({ count: sql<number>`count(*)` }).from(infoBoardAutoLogs),
  ]);

  return { logs, total: countResult[0]?.count ?? 0 };
}

export async function createInfoBoardAutoLog(data: Omit<InsertInfoBoardAutoLog, "id" | "createdAt">): Promise<{ id: number }> {
  const database = await getDb();
  if (!database) throw new Error("DB not available");
  const [{ id }] = await database.insert(infoBoardAutoLogs).values(data).$returningId();
  return { id };
}

// ─── Discussion Auto Post Settings ───

export async function getDiscussionAutoSettings(): Promise<DiscussionAutoSetting[]> {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(discussionAutoSettings).orderBy(desc(discussionAutoSettings.createdAt));
}

export async function getDiscussionAutoSettingById(id: number): Promise<DiscussionAutoSetting | undefined> {
  const database = await getDb();
  if (!database) return undefined;
  const result = await database.select().from(discussionAutoSettings).where(eq(discussionAutoSettings.id, id)).limit(1);
  return result[0];
}

export async function getEnabledDiscussionAutoSettings(): Promise<DiscussionAutoSetting[]> {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(discussionAutoSettings).where(eq(discussionAutoSettings.isEnabled, 1));
}

export async function createDiscussionAutoSetting(data: Omit<InsertDiscussionAutoSetting, "id" | "createdAt" | "updatedAt">): Promise<{ id: number }> {
  const database = await getDb();
  if (!database) throw new Error("DB not available");
  const [{ id }] = await database.insert(discussionAutoSettings).values(data).$returningId();
  return { id };
}

export async function updateDiscussionAutoSetting(id: number, data: Partial<InsertDiscussionAutoSetting>): Promise<void> {
  const database = await getDb();
  if (!database) return;
  await database.update(discussionAutoSettings).set(data).where(eq(discussionAutoSettings.id, id));
}

export async function deleteDiscussionAutoSetting(id: number): Promise<void> {
  const database = await getDb();
  if (!database) return;
  await database.delete(discussionAutoSettings).where(eq(discussionAutoSettings.id, id));
}

// ─── Discussion Auto Post Logs ───

export async function getDiscussionAutoLogs(settingId?: number, page = 1, limit = 20): Promise<{ logs: DiscussionAutoLog[]; total: number }> {
  const database = await getDb();
  if (!database) return { logs: [], total: 0 };
  const offset = (page - 1) * limit;

  const conditions = settingId ? eq(discussionAutoLogs.settingId, settingId) : undefined;

  const [logs, countResult] = await Promise.all([
    conditions
      ? database.select().from(discussionAutoLogs).where(conditions).orderBy(desc(discussionAutoLogs.createdAt)).limit(limit).offset(offset)
      : database.select().from(discussionAutoLogs).orderBy(desc(discussionAutoLogs.createdAt)).limit(limit).offset(offset),
    conditions
      ? database.select({ count: sql<number>`count(*)` }).from(discussionAutoLogs).where(conditions)
      : database.select({ count: sql<number>`count(*)` }).from(discussionAutoLogs),
  ]);

  return { logs, total: countResult[0]?.count ?? 0 };
}

export async function createDiscussionAutoLog(data: Omit<InsertDiscussionAutoLog, "id" | "createdAt">): Promise<{ id: number }> {
  const database = await getDb();
  if (!database) throw new Error("DB not available");
  const [{ id }] = await database.insert(discussionAutoLogs).values(data).$returningId();
  return { id };
}

// ─── 환불 관리 ───
export async function getRefundableItems(page = 1, limit = 20, onlyPending = true) {
  const database = await getDb();
  if (!database) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const conds: any[] = [
    isNotNull(orderItems.cancelledAt),
    sql`\`orderItems\`.\`refundAmount\` IS NOT NULL AND \`orderItems\`.\`refundAmount\` > 0`,
  ];
  if (onlyPending) conds.push(sql`(\`orderItems\`.\`refundedAt\` IS NULL OR \`orderItems\`.\`refundedAt\` = '0000-00-00 00:00:00')`);

  const [rows, countRows] = await Promise.all([
    database
      .select({
        item: orderItems,
        order: orders,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .where(and(...conds))
      .orderBy(desc(orderItems.cancelledAt))
      .limit(limit)
      .offset(offset),
    database
      .select({ count: sql<number>`COUNT(*)` })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...conds)),
  ]);
  return { items: rows, total: Number(countRows[0]?.count ?? 0) };
}

export async function getClaims(page = 1, limit = 30, status?: string) {
  const offset = (page - 1) * limit;
  let where = "WHERE 1=1";
  const params: any[] = [];
  if (status && status !== "전체") { where += " AND c.status = ?"; params.push(status); }
  const rows = await g5q<any>(
    `SELECT c.id, c.od_id, c.mb_id, c.claim_type, c.reason, c.status, c.admin_memo,
            c.created_at, c.updated_at,
            o.od_status, o.od_name, o.od_hp, o.od_receipt_price,
            m.mb_name, m.mb_hp, m.mb_email,
            (SELECT it_name FROM g5_shop_cart WHERE od_id = c.od_id LIMIT 1) as first_item
     FROM seoulmono_claims c
     LEFT JOIN g5_shop_order o ON o.od_id = c.od_id
     LEFT JOIN g5_member m ON m.mb_id = c.mb_id
     ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const countRow = await g5one<{ c: number }>(
    `SELECT COUNT(*) AS c FROM seoulmono_claims c ${where}`,
    params
  );
  return {
    items: rows.map((r: any) => ({
      id: Number(r.id),
      odId: String(r.od_id),
      claimType: r.claim_type as string,
      reason: r.reason as string,
      status: r.status as string,
      adminMemo: (r.admin_memo as string) || "",
      createdAt: r.created_at instanceof Date ? r.created_at : new Date(String(r.created_at || "").replace(" ", "T")),
      updatedAt: r.updated_at instanceof Date ? r.updated_at : new Date(String(r.updated_at || "").replace(" ", "T")),
      odStatus: (r.od_status as string) || null,
      itemName: (r.first_item as string) || "-",
      totalAmount: Number(r.od_receipt_price) || 0,
      userName: (r.mb_name as string) || (r.od_name as string) || "-",
      userPhone: (r.mb_hp as string) || (r.od_hp as string) || "",
      userEmail: (r.mb_email as string) || "",
    })),
    total: Number(countRow?.c) || 0,
  };
}

export async function markOrderRefunded(orderId: number) {
  const database = await getDb();
  if (!database) throw new Error("DB not available");
  await database.update(orderItems)
    .set({ refundedAt: new Date() })
    .where(and(eq(orderItems.orderId, orderId), isNotNull(orderItems.cancelledAt)));
}

export async function markOrderItemRefunded(itemId: number) {
  const database = await getDb();
  if (!database) throw new Error("DB not available");
  await database.update(orderItems)
    .set({ refundedAt: new Date() })
    .where(eq(orderItems.id, itemId));
}

export async function markOrderItemRefundPending(itemId: number) {
  const database = await getDb();
  if (!database) throw new Error("DB not available");
  await database.update(orderItems)
    .set({ refundedAt: sql`NULL` })
    .where(eq(orderItems.id, itemId));
}

export async function updateClaimStatus(id: number, status?: string, adminMemo?: string) {
  const updates: string[] = [];
  const params: any[] = [];
  if (status) { updates.push("status = ?"); params.push(status); }
  if (adminMemo !== undefined) { updates.push("admin_memo = ?"); params.push(adminMemo); }
  if (updates.length === 0) return;
  params.push(id);
  await g5q(`UPDATE seoulmono_claims SET ${updates.join(", ")} WHERE id = ?`, params);
}

// ─── Admin Action Logs ───
export async function logAdminAction(opts: {
  adminId: number;
  adminName: string;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  description?: string;
  detail?: Record<string, any>;
}) {
  try {
    const database = await getDb();
    if (!database) return;
    const { adminActionLogs } = await import("../drizzle/schema");
    await database.insert(adminActionLogs).values({
      adminId: opts.adminId,
      adminName: opts.adminName,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId != null ? String(opts.entityId) : null,
      description: opts.description ?? null,
      detail: opts.detail ?? null,
    });
  } catch (e) {
    console.error("[logAdminAction] Failed to log:", e);
  }
}

export async function getAdminActionLogs(opts: {
  page?: number;
  limit?: number;
  adminId?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const database = await getDb();
  if (!database) return { rows: [], total: 0 };
  const { adminActionLogs, users } = await import("../drizzle/schema");
  const { desc, and, eq, gte, lte, like } = await import("drizzle-orm");

  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (opts.adminId) conditions.push(eq(adminActionLogs.adminId, opts.adminId));
  if (opts.action) conditions.push(eq(adminActionLogs.action, opts.action));
  if (opts.entityType) conditions.push(eq(adminActionLogs.entityType, opts.entityType));
  if (opts.entityId) conditions.push(eq(adminActionLogs.entityId, opts.entityId));
  if (opts.dateFrom) conditions.push(gte(adminActionLogs.createdAt, opts.dateFrom));
  if (opts.dateTo) conditions.push(lte(adminActionLogs.createdAt, opts.dateTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    database.select({
      log: adminActionLogs,
      adminEmail: users.email,
    }).from(adminActionLogs)
      .leftJoin(users, eq(adminActionLogs.adminId, users.id))
      .where(where)
      .orderBy(desc(adminActionLogs.createdAt))
      .limit(limit)
      .offset(offset),
    database.select({ count: adminActionLogs.id }).from(adminActionLogs).where(where),
  ]);

  const enriched = rows.map(r => ({ ...r.log, adminEmail: r.adminEmail }));
  return { rows: enriched, total: countResult.length };
}


/**
 * [seoulmono-admin] 로그인 비밀번호 검증.
 * g5 계정은 그누보드 PBKDF2/md5, 그 외(a2_users)는 bcrypt 를 쓴다.
 */
export async function verifyUserPassword(user: any, plain: string): Promise<boolean> {
  if (!user?.password) return false;
  if (user.loginMethod === "g5" || String(user.openId || "").startsWith("g5:")) {
    return verifyGnuboardPassword(plain, user.password);
  }
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.compare(plain, user.password);
}
