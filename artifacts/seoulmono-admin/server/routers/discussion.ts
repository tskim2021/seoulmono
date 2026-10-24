import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const discussionRouter = router({
  // 공개: 토론 목록 조회
  list: publicProcedure.input(z.object({
    categoryId: z.number().optional(),
    search: z.string().optional(),
    sort: z.enum(["newest", "popular", "most_comments", "views"]).optional(),
    tag: z.string().optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(50).optional(),
  }).optional()).query(async ({ input }) => {
    return db.getDiscussions({
      categoryId: input?.categoryId,
      search: input?.search,
      sort: input?.sort,
      tag: input?.tag,
      page: input?.page ?? 1,
      limit: input?.limit ?? 20,
    });
  }),

  // 공개: 인기 토론 조회
  popular: publicProcedure.input(z.object({
    limit: z.number().min(1).max(20).optional(),
  }).nullish()).query(async ({ input }) => {
    return db.getPopularDiscussions(input?.limit ?? 5);
  }),

  // 공개: 토론 상세 조회
  getById: publicProcedure.input(z.object({
    id: z.number(),
  })).query(async ({ input }) => {
    const discussion = await db.getDiscussionById(input.id);
    if (!discussion) return null;
    // 조회수 증가
    await db.incrementDiscussionViewCount(input.id);
    return discussion;
  }),

  // 로그인: 토론 생성
  create: protectedProcedure.input(z.object({
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    categoryId: z.number().optional(),
    tags: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const id = await db.createDiscussion({
      userId: ctx.user.id,
      title: input.title,
      content: input.content,
      categoryId: input.categoryId,
      tags: input.tags,
    });
    return { id };
  }),

  // 로그인: 토론 수정
  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().min(1).max(255).optional(),
    content: z.string().min(1).optional(),
    categoryId: z.number().optional(),
    tags: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    await db.updateDiscussion(id, ctx.user.id, data as any, ctx.user.role === "admin");
    return { success: true };
  }),

  // 로그인: 토론 삭제
  delete: protectedProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ ctx, input }) => {
    await db.deleteDiscussion(input.id, ctx.user.id, ctx.user.role === "admin");
    return { success: true };
  }),

  // 공개: 댓글 목록 조회
  getComments: publicProcedure.input(z.object({
    discussionId: z.number(),
  })).query(async ({ input }) => {
    return db.getDiscussionComments(input.discussionId);
  }),

  // 로그인: 댓글 작성
  createComment: protectedProcedure.input(z.object({
    discussionId: z.number(),
    parentId: z.number().optional(),
    content: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const id = await db.createDiscussionComment({
      discussionId: input.discussionId,
      userId: ctx.user.id,
      parentId: input.parentId,
      content: input.content,
    });
    // 토론 작성자에게 알림
    const discussion = await db.getDiscussionById(input.discussionId);
    if (discussion && discussion.userId !== ctx.user.id) {
      await db.createNotification(
        discussion.userId,
        "discussion",
        "토론에 새 댓글이 달렸습니다",
        `"${discussion.title}"에 ${ctx.user.name || '익명'}님이 댓글을 달았습니다.`,
        `/discussions/${input.discussionId}`
      );
    }
    // 대댓글인 경우, 원댓글 작성자에게도 알림
    if (input.parentId) {
      const parentComment = await db.getDiscussionCommentById(input.parentId);
      if (parentComment && parentComment.userId !== ctx.user.id && parentComment.userId !== discussion?.userId) {
        await db.createNotification(
          parentComment.userId,
          "discussion",
          "답글이 달렸습니다",
          `${ctx.user.name || '익명'}님이 내 댓글에 답글을 달았습니다.`,
          `/discussions/${input.discussionId}`
        );
      }
    }
    return { id };
  }),

  // 로그인: 댓글 수정
  updateComment: protectedProcedure.input(z.object({
    id: z.number(),
    content: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    await db.updateDiscussionComment(input.id, ctx.user.id, input.content, ctx.user.role === "admin");
    return { success: true };
  }),

  // 로그인: 댓글 삭제
  deleteComment: protectedProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ ctx, input }) => {
    await db.deleteDiscussionComment(input.id, ctx.user.id, ctx.user.role === "admin");
    return { success: true };
  }),

  // 로그인: 좋아요 토글
  toggleLike: protectedProcedure.input(z.object({
    targetType: z.enum(["discussion", "comment"]),
    targetId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    return db.toggleDiscussionLike(ctx.user.id, input.targetType, input.targetId);
  }),

  // 로그인: 사용자의 좋아요 상태 조회
  getUserLikes: protectedProcedure.input(z.object({
    targetType: z.enum(["discussion", "comment"]),
    targetIds: z.array(z.number()),
  })).query(async ({ ctx, input }) => {
    return db.getUserDiscussionLikes(ctx.user.id, input.targetType, input.targetIds);
  }),

  // 관리자: 고정 토글
  adminTogglePin: adminProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    await db.adminToggleDiscussionPin(input.id);
    return { success: true };
  }),

  // 관리자: 마감 토글
  adminToggleClose: adminProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    await db.adminToggleDiscussionClose(input.id);
    return { success: true };
  }),

  // 관리자: 숨김 토글
  adminToggleHide: adminProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    await db.adminToggleDiscussionHide(input.id);
    return { success: true };
  }),
});
