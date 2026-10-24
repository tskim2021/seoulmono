import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

// ─── Chatbot Settings Router ───
export const chatbotAdminRouter = router({
  // 챗봇 설정 조회
  getSettings: publicProcedure.query(async () => {
    return await db.getChatbotSettings();
  }),

  // 챗봇 설정 업데이트 (관리자 전용)
  updateSettings: adminProcedure.input(z.object({
    greetingMessage: z.string().optional(),
    isEnabled: z.number().min(0).max(1).optional(),
    systemPromptOverride: z.string().nullable().optional(),
    maxTurns: z.number().min(1).max(100).optional(),
    responseUnavailableMessage: z.string().optional(),
    operatingHoursStart: z.string().optional(),
    operatingHoursEnd: z.string().optional(),
  })).mutation(async ({ input }) => {
    await db.upsertChatbotSettings(input);
    return { success: true };
  }),

  // ─── Categories ───
  // 카테고리 목록 조회 (활성화된 것만)
  getCategories: publicProcedure.query(async () => {
    return await db.getChatbotCategories();
  }),

  // 모든 카테고리 조회 (관리자 전용)
  getAllCategories: adminProcedure.query(async () => {
    return await db.getAllChatbotCategories();
  }),

  // 카테고리 생성 (관리자 전용)
  createCategory: adminProcedure.input(z.object({
    name: z.string().min(1).max(100),
    icon: z.string().max(50).optional(),
    description: z.string().optional(),
    sortOrder: z.number().default(0),
    isActive: z.number().min(0).max(1).default(1),
    parentId: z.number().nullable().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createChatbotCategory(input);
    return { id };
  }),

  // 카테고리 수정 (관리자 전용)
  updateCategory: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).max(100).optional(),
    icon: z.string().max(50).optional(),
    description: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.number().min(0).max(1).optional(),
    parentId: z.number().nullable().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateChatbotCategory(id, data);
    return { success: true };
  }),

  // 카테고리 삭제 (관리자 전용)
  deleteCategory: adminProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    await db.deleteChatbotCategory(input.id);
    return { success: true };
  }),

  // ─── QnA ───
  // 카테고리별 문답 조회
  getQnaByCategory: publicProcedure.input(z.object({
    categoryId: z.number(),
  })).query(async ({ input }) => {
    return await db.getChatbotQnaByCategory(input.categoryId);
  }),

  // 모든 문답 조회 (관리자 전용)
  getAllQna: adminProcedure.query(async () => {
    return await db.getAllChatbotQna();
  }),

  // 문답 생성 (관리자 전용)
  createQna: adminProcedure.input(z.object({
    categoryId: z.number(),
    question: z.string().min(1),
    answer: z.string().min(1),
    sortOrder: z.number().default(0),
    isActive: z.number().min(0).max(1).default(1),
  })).mutation(async ({ input }) => {
    const id = await db.createChatbotQna(input);
    return { id };
  }),

  // 문답 수정 (관리자 전용)
  updateQna: adminProcedure.input(z.object({
    id: z.number(),
    categoryId: z.number().optional(),
    question: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
    sortOrder: z.number().optional(),
    isActive: z.number().min(0).max(1).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateChatbotQna(id, data);
    return { success: true };
  }),

  // 문답 삭제 (관리자 전용)
  deleteQna: adminProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    await db.deleteChatbotQna(input.id);
    return { success: true };
  }),

  // ─── Conversations ───
  // 대화 이력 목록 조회 (관리자 전용)
  getConversations: adminProcedure.input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
  })).query(async ({ input }) => {
    return await db.getChatbotConversations(input.page, input.limit);
  }),

  // 대화 이력 상세 조회 (관리자 전용)
  getConversationById: adminProcedure.input(z.object({
    id: z.number(),
  })).query(async ({ input }) => {
    return await db.getChatbotConversationById(input.id);
  }),
});
