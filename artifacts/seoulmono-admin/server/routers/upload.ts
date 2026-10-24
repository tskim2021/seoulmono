/**
 * 파일 업로드 라우터
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

export const uploadRouter = router({
  /**
   * 이미지 업로드 (리뷰 사진 등)
   */
  uploadImage: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        base64Data: z.string(), // base64 인코딩된 이미지 데이터
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // base64 디코딩
        const buffer = Buffer.from(input.base64Data, "base64");

        // 파일 크기 체크 (5MB 제한)
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "파일 크기는 5MB를 초과할 수 없습니다.",
          });
        }

        // S3에 업로드
        const fileKey = `reviews/${ctx.user.id}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);

        return { url };
      } catch (error) {
        console.error("Image upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "이미지 업로드에 실패했습니다.",
        });
      }
    }),

  /**
   * 문의 첨부파일 업로드 (이미지)
   */
  uploadInquiryImage: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        base64Data: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const buffer = Buffer.from(input.base64Data, "base64");

        // 파일 크기 체크 (10MB 제한)
        if (buffer.length > 10 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "파일 크기는 10MB를 초과할 수 없습니다.",
          });
        }

        // 이미지 파일만 허용
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(input.contentType)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "이미지 파일만 업로드할 수 있습니다. (JPG, PNG, GIF, WebP)",
          });
        }

        // S3에 업로드
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `inquiries/${ctx.user.id}/${Date.now()}-${randomSuffix}-${input.filename}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);

        return { url };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Inquiry image upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "이미지 업로드에 실패했습니다.",
        });
      }
    }),
});
