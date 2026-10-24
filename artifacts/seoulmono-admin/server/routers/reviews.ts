/**
 * 리뷰 작성 및 관리 라우터
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { posts, orders, orderItems, products, reviewPointSettings, pointHistory, users, boards, reviewLikes } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { desc, asc, isNotNull } from "drizzle-orm";

export const reviewsRouter = router({
  /**
   * 리뷰 좋아요 토글
   */
  toggleLike: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // 기존 좋아요 확인
      const existing = await db
        .select()
        .from(reviewLikes)
        .where(
          and(
            eq(reviewLikes.postId, input.postId),
            eq(reviewLikes.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // 좋아요 취소
        await db
          .delete(reviewLikes)
          .where(
            and(
              eq(reviewLikes.postId, input.postId),
              eq(reviewLikes.userId, ctx.user.id)
            )
          );

        // 리뷰 likeCount 감소
        await db
          .update(posts)
          .set({ likeCount: sql`${posts.likeCount} - 1` })
          .where(eq(posts.id, input.postId));

        return { liked: false };
      } else {
        // 좋아요 추가
        await db.insert(reviewLikes).values({
          postId: input.postId,
          userId: ctx.user.id,
        });

        // 리뷰 likeCount 증가
        await db
          .update(posts)
          .set({ likeCount: sql`${posts.likeCount} + 1` })
          .where(eq(posts.id, input.postId));

        // 리뷰 작성자 확인
        const review = await db
          .select({ userId: posts.userId, likeCount: posts.likeCount })
          .from(posts)
          .where(eq(posts.id, input.postId))
          .limit(1);

        if (review.length > 0) {
          const newLikeCount = review[0].likeCount || 0;
          
          // 포인트 설정 조회
          const [pointSettings] = await db
            .select()
            .from(reviewPointSettings)
            .where(eq(reviewPointSettings.isActive, 1))
            .limit(1);

          if (pointSettings) {
            const threshold = pointSettings.likePointsThreshold || 10;
            const pointsToGive = pointSettings.pointsPerLikeThreshold || 50;

            // 임계값 달성 시 포인트 지급 (예: 10개, 20개, 30개...)
            if (newLikeCount % threshold === 0 && newLikeCount > 0) {
              await db.insert(pointHistory).values({
                userId: review[0].userId,
                amount: pointsToGive,
                type: "earn",
                description: `리뷰 좋아요 ${newLikeCount}개 달성 보너스`,
                createdAt: new Date(),
              });

              await db
                .update(users)
                .set({ points: sql`${users.points} + ${pointsToGive}` })
                .where(eq(users.id, review[0].userId));
            }
          }
        }

        return { liked: true };
      }
    }),

  /**
   * 상품별 리뷰 통계 (평균 평점, 총 리뷰수, 점수별 분포)
   */
  getProductReviewStats: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      // 전체 통계
      const [stats] = await db
        .select({
          totalCount: sql<number>`count(*)`,
          avgRating: sql<number>`COALESCE(AVG(rating), 0)`,
        })
        .from(posts)
        .where(and(eq(posts.productId, input.productId), isNotNull(posts.rating)));

      // 점수별 분포
      const distribution = await db
        .select({
          rating: posts.rating,
          count: sql<number>`count(*)`,
        })
        .from(posts)
        .where(and(eq(posts.productId, input.productId), isNotNull(posts.rating)))
        .groupBy(posts.rating);

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const d of distribution) {
        if (d.rating) ratingDistribution[d.rating] = Number(d.count);
      }

      // 포토 리뷰 수
      const [photoStats] = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(
          and(
            eq(posts.productId, input.productId),
            isNotNull(posts.rating),
            sql`COALESCE(jsonb_array_length(${posts.images}), 0) > 0`
          )
        );

      return {
        totalCount: Number(stats.totalCount),
        avgRating: Number(Number(stats.avgRating).toFixed(2)),
        ratingDistribution,
        photoReviewCount: Number(photoStats.count),
      };
    }),

  /**
   * 상품별 포토 리뷰 이미지 갤러리
   */
  getProductPhotoGallery: publicProcedure
    .input(z.object({
      productId: z.number(),
      limit: z.number().min(1).max(50).default(8),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      const photoReviews = await db
        .select({
          id: posts.id,
          images: posts.images,
          userName: users.name,
          rating: posts.rating,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .where(
          and(
            eq(posts.productId, input.productId),
            isNotNull(posts.rating),
            sql`COALESCE(jsonb_array_length(${posts.images}), 0) > 0`
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(input.limit);

      // 이미지 목록 평탄화 (리뷰ID 포함)
      const allImages: { reviewId: number; imageUrl: string; userName: string | null; rating: number | null }[] = [];
      for (const review of photoReviews) {
        if (review.images && Array.isArray(review.images)) {
          for (const img of review.images) {
            allImages.push({
              reviewId: review.id,
              imageUrl: img,
              userName: review.userName,
              rating: review.rating,
            });
          }
        }
      }

      return { images: allImages };
    }),

  /**
   * 사용자가 특정 리뷰에 좋아요를 눌렀는지 확인
   */
  checkLike: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db
        .select()
        .from(reviewLikes)
        .where(
          and(
            eq(reviewLikes.postId, input.postId),
            eq(reviewLikes.userId, ctx.user.id)
          )
        )
        .limit(1);

      return { liked: existing.length > 0 };
    }),

  // 상품별 리뷰 목록 조회 (별점 필터링, 정렬 기능)
  getProductReviews: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        rating: z.number().min(1).max(5).optional(), // 별점 필터 (1-5)
        sortBy: z.enum(["latest", "rating_high", "rating_low", "helpful"]).default("latest"),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not initialized" });

      const offset = (input.page - 1) * input.limit;

      // WHERE 조건 구성
      const conditions = [
        eq(posts.productId, input.productId),
        isNotNull(posts.rating), // 리뷰만 조회 (rating이 있는 게시글)
      ];

      if (input.rating) {
        conditions.push(eq(posts.rating, input.rating));
      }

      // 정렬 조건
      let orderByClause;
      switch (input.sortBy) {
        case "rating_high":
          orderByClause = [desc(posts.rating), desc(posts.createdAt)];
          break;
        case "rating_low":
          orderByClause = [asc(posts.rating), desc(posts.createdAt)];
          break;
        case "helpful":
          // 추천순은 나중에 likes 테이블 추가 시 구현
          orderByClause = [desc(posts.createdAt)];
          break;
        case "latest":
        default:
          orderByClause = [desc(posts.createdAt)];
          break;
      }

      const reviews = await db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          rating: posts.rating,
          images: posts.images,
          createdAt: posts.createdAt,
          userId: posts.userId,
          userName: users.name,
          openId: users.openId,
          orderItemId: posts.orderItemId,
          likeCount: posts.likeCount,
          orderId: posts.orderId,
          orderStatus: orders.status,
          productName: products.name,
          productThumbnail: sql<string>`(${products.images}->>0)`,
          productSlug: products.slug,
        })
        .from(posts)
        .leftJoin(users, eq(posts.userId, users.id))
        .leftJoin(orders, eq(posts.orderId, orders.id))
        .leftJoin(products, eq(posts.productId, products.id))
        .where(and(...conditions))
        .orderBy(...orderByClause)
        .limit(input.limit)
        .offset(offset);

      // 구매인증 여부 + 표시명 가공
      const { formatDisplayName } = await import("../db");
      const reviewsWithVerification = reviews.map(r => ({
        ...r,
        displayName: formatDisplayName(r.userName, r.openId),
        isVerifiedPurchase: !!(r.orderItemId && r.orderId && r.orderStatus && ["delivered", "paid", "preparing", "shipping"].includes(r.orderStatus)),
      }));

      // 전체 개수 조회
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(and(...conditions));

      return {
        reviews: reviewsWithVerification,
        total: count,
        page: input.page,
        totalPages: Math.ceil(count / input.limit),
      };
    }),

  /**
   * 리뷰 작성
   */
  create: protectedProcedure
    .input(
      z.object({
        orderItemId: z.number(),
        rating: z.number().min(1).max(5),
        title: z.string().min(1).max(255),
        content: z.string().min(10),
        images: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // 1. 주문 아이템 확인
      const [orderItem] = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.id, input.orderItemId))
        .limit(1);

      if (!orderItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "주문 아이템을 찾을 수 없습니다.",
        });
      }

      // 2. 주문 확인 (배송 완료 여부 및 소유권 확인)
      const [order] = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
        })
        .from(orders)
        .where(eq(orders.id, orderItem.orderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "주문을 찾을 수 없습니다.",
        });
      }

      if (order.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "본인의 주문에만 리뷰를 작성할 수 있습니다.",
        });
      }

      if (order.status !== "delivered") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "배송 완료된 주문에만 리뷰를 작성할 수 있습니다.",
        });
      }

      // 3. 이미 리뷰를 작성했는지 확인
      const [existingReview] = await db
        .select({ id: posts.id })
        .from(posts)
        .where(
          and(
            eq(posts.userId, userId),
            eq(posts.orderItemId, input.orderItemId)
          )
        )
        .limit(1);

      if (existingReview) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "이미 리뷰를 작성하셨습니다.",
        });
      }

      // 4. 리뷰 게시판 ID 조회 (boardType = 'review')
      const [reviewBoard] = await db
        .select({ id: boards.id })
        .from(boards)
        .where(eq(boards.boardType, "review"))
        .limit(1);

      if (!reviewBoard) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "리뷰 게시판을 찾을 수 없습니다.",
        });
      }

      const boardId = reviewBoard.id;

      // 5. 리뷰 작성
      const [result] = await db.insert(posts).values({
        boardId,
        userId,
        productId: orderItem.productId,
        orderId: orderItem.orderId,
        orderItemId: input.orderItemId,
        title: input.title,
        content: input.content,
        images: input.images || [],
        rating: input.rating,
        isNotice: 0,
        isPinned: 0,
        viewCount: 0,
        commentCount: 0,
        isAnswered: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const reviewId = Number(result.insertId);

      // 6. 상품의 리뷰 수 및 평균 평점 업데이트
      await db.execute(sql`
        UPDATE products
        SET reviewCount = reviewCount + 1,
            avgRating = (
              SELECT AVG(rating)
              FROM posts
              WHERE productId = ${orderItem.productId} AND rating IS NOT NULL
            )
        WHERE id = ${orderItem.productId}
      `);

      // 7. 리뷰 포인트 지급
      const [pointSettings] = await db
        .select()
        .from(reviewPointSettings)
        .where(eq(reviewPointSettings.isActive, 1))
        .limit(1);

      if (pointSettings) {
        let pointsToGive = pointSettings.pointsPerReview;

        // 사진 리뷰인 경우 추가 포인트
        if (input.images && input.images.length > 0) {
          pointsToGive += pointSettings.pointsPerPhotoReview;
        }

        // 최소 별점 확인
        if (input.rating >= pointSettings.minRatingForPoints) {
          // 포인트 지급 이력 저장
          await db.insert(pointHistory).values({
            userId,
            amount: pointsToGive,
            type: "earn",
            description: `리뷰 작성 (주문 #${orderItem.orderId})`,
            orderId: orderItem.orderId,
            createdAt: new Date(),
          });

          // 사용자 포인트 업데이트
          await db.execute(sql`
            UPDATE users
            SET points = points + ${pointsToGive}
            WHERE id = ${userId}
          `);
        }
      }

      return {
        success: true,
        reviewId,
        message: "리뷰가 작성되었습니다.",
      };
    }),

  /**
   * 사용자 작성 리뷰 목록 조회
   */
  getMyReviews: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const offset = (input.page - 1) * input.limit;

      const reviews = await db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          rating: posts.rating,
          images: posts.images,
          createdAt: posts.createdAt,
          productId: posts.productId,
          productName: products.name,
          productSlug: products.slug,
          productThumbnail: sql<string>`(${products.images}->>0)`,
        })
        .from(posts)
        .leftJoin(products, eq(posts.productId, products.id))
        .where(
          and(
            eq(posts.userId, ctx.user.id),
            isNotNull(posts.rating) // 리뷰만 조회
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(input.limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(
          and(
            eq(posts.userId, ctx.user.id),
            isNotNull(posts.rating)
          )
        );

      return {
        reviews,
        total: count,
        page: input.page,
        totalPages: Math.ceil(count / input.limit),
      };
    }),

  /**
   * 리뷰 수정
   */
  update: protectedProcedure
    .input(
      z.object({
        reviewId: z.number(),
        rating: z.number().min(1).max(5),
        title: z.string().min(1).max(255),
        content: z.string().min(10),
        images: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // 리뷰 소유권 확인
      const [review] = await db
        .select({ id: posts.id, userId: posts.userId, productId: posts.productId, rating: posts.rating })
        .from(posts)
        .where(eq(posts.id, input.reviewId))
        .limit(1);

      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "리뷰를 찾을 수 없습니다." });
      }

      if (review.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "본인의 리뷰만 수정할 수 있습니다." });
      }

      // 리뷰 수정
      await db
        .update(posts)
        .set({
          rating: input.rating,
          title: input.title,
          content: input.content,
          images: input.images || [],
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.reviewId));

      // 별점이 변경되었다면 상품의 평균 평점 업데이트
      if (review.rating !== input.rating) {
        await db.execute(sql`
          UPDATE products
          SET avgRating = (
            SELECT AVG(rating)
            FROM posts
            WHERE productId = ${review.productId} AND rating IS NOT NULL
          )
          WHERE id = ${review.productId}
        `);
      }

      return { success: true, message: "리뷰가 수정되었습니다." };
    }),

  /**
   * 리뷰 삭제
   */
  delete: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // 리뷰 소유권 확인
      const [review] = await db
        .select({ id: posts.id, userId: posts.userId, productId: posts.productId })
        .from(posts)
        .where(eq(posts.id, input.reviewId))
        .limit(1);

      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "리뷰를 찾을 수 없습니다." });
      }

      if (review.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "본인의 리뷰만 삭제할 수 있습니다." });
      }

      // 리뷰 삭제
      await db.delete(posts).where(eq(posts.id, input.reviewId));

      // 상품의 리뷰 수 및 평균 평점 업데이트
      await db.execute(sql`
        UPDATE products
        SET reviewCount = reviewCount - 1,
            avgRating = (
              SELECT AVG(rating)
              FROM posts
              WHERE productId = ${review.productId} AND rating IS NOT NULL
            )
        WHERE id = ${review.productId}
      `);

      return { success: true, message: "리뷰가 삭제되었습니다." };
    }),

  /**
   * 주문 아이템의 리뷰 작성 여부 확인
   */
  checkReviewStatus: protectedProcedure
    .input(z.object({ orderItemId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const [review] = await db
        .select({ id: posts.id, rating: posts.rating, title: posts.title, createdAt: posts.createdAt })
        .from(posts)
        .where(
          and(
            eq(posts.userId, ctx.user.id),
            eq(posts.orderItemId, input.orderItemId)
          )
        )
        .limit(1);

      return {
        hasReview: !!review,
        review: review || null,
      };
    }),
});
