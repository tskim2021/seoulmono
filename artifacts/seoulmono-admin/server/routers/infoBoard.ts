import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  getBoardBySlug,
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getComments,
  createComment,
  deleteComment,
  createNotification,
} from "../db";

// 정보나눔 게시판 전용 라우터
export const infoBoardRouter = router({
  // 정보나눔 게시판 정보 조회
  board: publicProcedure.query(async () => {
    const board = await getBoardBySlug("info");
    return board;
  }),

  // 게시글 목록 (페이지네이션, 검색, 카테고리 필터)
  posts: publicProcedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(20),
        search: z.string().optional(),
        categoryId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const board = await getBoardBySlug("info");
      if (!board) throw new Error("정보나눔 게시판을 찾을 수 없습니다.");
      const result = await getPosts(board.id, input.page, input.limit, input.search, input.categoryId);
      return result;
    }),

  // 게시글 상세 조회
  postById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const post = await getPostById(input.id);
      return post;
    }),

  // 게시글 작성
  createPost: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "제목을 입력해주세요"),
        content: z.string().min(1, "내용을 입력해주세요"),
        images: z.array(z.string()).optional(),
        categoryId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const board = await getBoardBySlug("info");
      if (!board) throw new Error("정보나눔 게시판을 찾을 수 없습니다.");
      const result = await createPost({
        boardId: board.id,
        userId: ctx.user.id,
        title: input.title,
        content: input.content,
        images: input.images ?? null,
        rating: null,
        productId: null,
        orderId: null,
        orderItemId: null,
        categoryId: input.categoryId ?? null,
      });
      return result;
    }),

  // 게시글 수정
  updatePost: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1),
        content: z.string().min(1),
        images: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await updatePost(input.id, ctx.user.id, {
        title: input.title,
        content: input.content,
        images: input.images ?? null,
      });
      return result;
    }),

  // 게시글 삭제
  deletePost: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      const result = await deletePost(input.id, ctx.user.id, isAdmin);
      return result;
    }),

  // 댓글 목록
  comments: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      const result = await getComments(input.postId);
      return result;
    }),

  // 댓글 작성
  createComment: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        content: z.string().min(1, "댓글을 입력해주세요"),
        parentId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await createComment({
        postId: input.postId,
        userId: ctx.user.id,
        content: input.content,
        parentId: input.parentId ?? null,
        isAdmin: ctx.user.role === "admin" ? 1 : 0,
      });

      // 게시글 작성자에게 알림
      try {
        const post = await getPostById(input.postId);
        if (post && post.userId !== ctx.user.id) {
          await createNotification(
            post.userId,
            "comment",
            "정보나눔 게시글에 새 댓글",
            `"${post.title}"에 ${ctx.user.name || "익명"}님이 댓글을 달았습니다.`,
            `/info-board/${input.postId}`
          );
        }
      } catch (e) {
        // 알림 실패해도 댓글 작성은 성공
      }

      return result;
    }),

  // 댓글 삭제
  deleteComment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      const result = await deleteComment(input.id, ctx.user.id, isAdmin);
      return result;
    }),

  // 관리자: 게시글 고정/숨기기
  adminTogglePin: adminProcedure
    .input(z.object({ id: z.number(), isPinned: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { posts: postsTable } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      await database!.update(postsTable).set({ isPinned: input.isPinned }).where(eq(postsTable.id, input.id));
      return { success: true };
    }),

  adminToggleHide: adminProcedure
    .input(z.object({ id: z.number(), isHidden: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { posts: postsTable } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const database = await getDb();
      await database!.update(postsTable).set({ isHidden: input.isHidden }).where(eq(postsTable.id, input.id));
      return { success: true };
    }),
});
