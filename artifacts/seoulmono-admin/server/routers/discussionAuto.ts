import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import * as db from "../db";
import { generateDiscussionPost, generateAllEnabledDiscussionPosts } from "../services/discussionGenerator";
import { restartDiscussionScheduler, getDiscussionSchedulerStatus } from "../jobs/discussionScheduler";

export const discussionAutoRouter = router({
  // 설정 목록 조회
  getSettings: adminProcedure.query(async () => {
    const settings = await db.getDiscussionAutoSettings();
    const schedulerStatus = getDiscussionSchedulerStatus();
    return { settings, schedulerStatus };
  }),

  // 설정 상세 조회
  getSettingById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getDiscussionAutoSettingById(input.id);
    }),

  // 설정 생성
  createSetting: adminProcedure
    .input(
      z.object({
        topic: z.string().min(1, "テーマを入力してください"),
        categoryId: z.number().nullable().optional(),
        generateTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:mm形式で入力してください").default("09:00"),
        keywords: z.string().optional(),
        keywordsEn: z.string().optional(),
        promptTemplate: z.string().optional(),
        discussionStyle: z.enum(["debate", "opinion", "question", "poll", "experience"]).default("debate"),
        autoPublish: z.number().default(1),
        autoGenerateImage: z.number().default(0),
        isEnabled: z.number().default(1),
      })
    )
    .mutation(async ({ input }) => {
      const result = await db.createDiscussionAutoSetting({
        topic: input.topic,
        categoryId: input.categoryId ?? null,
        generateTime: input.generateTime,
        keywords: input.keywords ?? null,
        keywordsEn: input.keywordsEn ?? null,
        promptTemplate: input.promptTemplate ?? null,
        discussionStyle: input.discussionStyle,
        autoPublish: input.autoPublish,
        autoGenerateImage: input.autoGenerateImage,
        isEnabled: input.isEnabled,
      });

      // 스케줄러 재시작
      await restartDiscussionScheduler();

      return result;
    }),

  // 설정 수정
  updateSetting: adminProcedure
    .input(
      z.object({
        id: z.number(),
        topic: z.string().min(1).optional(),
        categoryId: z.number().nullable().optional(),
        generateTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        keywords: z.string().nullable().optional(),
        keywordsEn: z.string().nullable().optional(),
        promptTemplate: z.string().nullable().optional(),
        discussionStyle: z.enum(["debate", "opinion", "question", "poll", "experience"]).optional(),
        autoPublish: z.number().optional(),
        autoGenerateImage: z.number().optional(),
        isEnabled: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateDiscussionAutoSetting(id, data);

      // 스케줄러 재시작 (시간 변경 반영)
      await restartDiscussionScheduler();

      return { success: true };
    }),

  // 설정 삭제
  deleteSetting: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteDiscussionAutoSetting(input.id);

      // 스케줄러 재시작
      await restartDiscussionScheduler();

      return { success: true };
    }),

  // 수동 실행 (특정 설정)
  generateNow: adminProcedure
    .input(z.object({ settingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const setting = await db.getDiscussionAutoSettingById(input.settingId);
      if (!setting) throw new Error("設定が見つかりません");

      const result = await generateDiscussionPost(setting, ctx.user.id, "manual");
      return result;
    }),

  // 전체 수동 실행 (활성화된 모든 설정)
  generateAllNow: adminProcedure.mutation(async ({ ctx }) => {
    const result = await generateAllEnabledDiscussionPosts(ctx.user.id, "manual");
    return result;
  }),

  // 실행 로그 조회
  getLogs: adminProcedure
    .input(
      z.object({
        settingId: z.number().optional(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input }) => {
      return db.getDiscussionAutoLogs(input.settingId, input.page, input.limit);
    }),
});
