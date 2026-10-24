import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserById(ctx.user.id);
  }),
  updateProfile: protectedProcedure.input(z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    emailNotifications: z.number().optional(),
    emailNotifyOrder: z.number().optional(),
    emailNotifyPoint: z.number().optional(),
    emailNotifyReview: z.number().optional(),
    emailNotifyComment: z.number().optional(),
    emailNotifySystem: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    await db.updateUserProfile(ctx.user.id, input);
    return { success: true };
  }),
  changePassword: protectedProcedure.input(z.object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
    newPassword: z.string().min(8, "새 비밀번호는 8자 이상이어야 합니다"),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
  })).mutation(async ({ ctx, input }) => {
    if (input.newPassword !== input.confirmPassword) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "새 비밀번호가 일치하지 않습니다" });
    }
    const user = await db.getUserWithPasswordById(ctx.user.id);
    if (!user || !user.password) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "소셜 로그인 계정은 비밀번호 변경이 불가합니다" });
    }
    const isValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isValid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "현재 비밀번호가 올바르지 않습니다" });
    }
    const hashed = await bcrypt.hash(input.newPassword, 10);
    await db.updateUserPassword(ctx.user.id, hashed);
    return { success: true };
  }),
  // Addresses
  addresses: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserAddresses(ctx.user.id);
  }),
  createAddress: protectedProcedure.input(z.object({
    name: z.string().min(1),
    recipient: z.string().min(1),
    recipientNameEn: z.string().optional(),
    phone: z.string().min(1),
    zipCode: z.string().min(1),
    address1: z.string().min(1),
    address2: z.string().optional(),
    addressEn1: z.string().optional(),
    addressEn2: z.string().optional(),
    isDefault: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    await db.createAddress({ ...input, userId: ctx.user.id, recipientNameEn: input.recipientNameEn ?? null, address2: input.address2 ?? null, addressEn1: input.addressEn1 ?? null, addressEn2: input.addressEn2 ?? null, isDefault: input.isDefault ?? 0 });
    return { success: true };
  }),
  updateAddress: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    recipient: z.string().min(1).optional(),
    recipientNameEn: z.string().optional(),
    phone: z.string().min(1).optional(),
    zipCode: z.string().min(1).optional(),
    address1: z.string().min(1).optional(),
    address2: z.string().optional(),
    addressEn1: z.string().optional(),
    addressEn2: z.string().optional(),
    isDefault: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    await db.updateAddress(id, ctx.user.id, data);
    return { success: true };
  }),
  deleteAddress: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await db.deleteAddress(input.id, ctx.user.id);
    return { success: true };
  }),
  // Points
  points: protectedProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getPointHistory(ctx.user.id, input?.page ?? 1, input?.limit ?? 20);
  }),
  // Notifications
  notifications: protectedProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getUserNotifications(ctx.user.id, input?.page ?? 1, input?.limit ?? 20);
  }),
  markNotificationRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await db.markNotificationRead(input.id, ctx.user.id);
    return { success: true };
  }),
  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
  deleteNotification: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await db.deleteNotification(input.id, ctx.user.id);
    return { success: true };
  }),
  deleteAllNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    await db.deleteAllNotifications(ctx.user.id);
    return { success: true };
  }),
  // Admin
  adminList: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllUsers(input?.page ?? 1, input?.limit ?? 20);
  }),
  adminUpdateUser: adminProcedure.input(z.object({
    id: z.number(),
    grade: z.string().optional(),
    points: z.number().optional(),
    role: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    await db.updateUserGradeAndPoints(id, data);
    const parts: string[] = [];
    if (data.grade) parts.push(`등급: ${data.grade}`);
    if (data.points !== undefined) parts.push(`포인트: ${data.points}`);
    if (data.role) parts.push(`권한: ${data.role}`);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "user.update", entityType: "user", entityId: id,
      description: `회원 #${id} 정보 수정 (${parts.join(", ")})`,
      detail: { userId: id, changes: data },
    });
    return { success: true };
  }),
  adminAddPoints: adminProcedure.input(z.object({
    userId: z.number(),
    amount: z.number(),
    description: z.string(),
  })).mutation(async ({ input, ctx }) => {
    await db.addPoints(input.userId, input.amount, "admin", input.description);
    await db.createNotification(input.userId, "point", "포인트가 지급되었습니다", `${input.amount.toLocaleString()}P - ${input.description}`, `/mypage/points`);
    await db.logAdminAction({
      adminId: ctx.user.id, adminName: ctx.user.name || ctx.user.email || `admin#${ctx.user.id}`,
      action: "user.addPoints", entityType: "user", entityId: input.userId,
      description: `회원 #${input.userId} 포인트 ${input.amount > 0 ? "지급" : "차감"} ${Math.abs(input.amount).toLocaleString()}P - ${input.description}`,
      detail: { userId: input.userId, amount: input.amount, description: input.description },
    });
    return { success: true };
  }),
  // Admin - 전체 포인트 내역 조회
  adminPointHistory: adminProcedure.input(z.object({
    userEmail: z.string().optional(),
    type: z.enum(["earn", "use", "admin", "refund"]).optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllPointHistory(input?.userEmail, input?.type, input?.page ?? 1, input?.limit ?? 20);
  }),
  // Point Expiration
  expiringPoints: protectedProcedure.input(z.object({
    daysBeforeExpiration: z.number().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getExpiringPoints(ctx.user.id, input?.daysBeforeExpiration ?? 30);
  }),
  getPointExpirationMonths: protectedProcedure.query(async () => {
    return db.getPointExpirationMonths();
  }),
  adminSetPointExpirationMonths: adminProcedure.input(z.object({
    months: z.number().min(1).max(120),
  })).mutation(async ({ input }) => {
    await db.setPointExpirationMonths(input.months);
    return { success: true };
  }),
  adminExpirePoints: adminProcedure.mutation(async () => {
    return db.expirePoints();
  }),
  adminTestExpirationNotification: adminProcedure.mutation(async () => {
    const { runPointExpirationNotificationJobNow } = await import("../jobs/pointExpirationJob");
    return runPointExpirationNotificationJobNow();
  }),
});
