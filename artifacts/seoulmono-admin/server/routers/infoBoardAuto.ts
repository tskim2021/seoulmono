import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import * as db from "../db";
import { generateInfoBoardPost, generateAllEnabledInfoBoardPosts } from "../services/infoBoardGenerator";
import { restartInfoBoardScheduler, getInfoBoardSchedulerStatus } from "../jobs/infoBoardScheduler";

export const infoBoardAutoRouter = router({
  // 설정 목록 조회
  getSettings: adminProcedure.query(async () => {
    const settings = await db.getInfoBoardAutoSettings();
    const schedulerStatus = getInfoBoardSchedulerStatus();
    return { settings, schedulerStatus };
  }),

  // 설정 상세 조회
  getSettingById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getInfoBoardAutoSettingById(input.id);
    }),

  // 설정 생성
  createSetting: adminProcedure
    .input(
      z.object({
        topic: z.string().min(1, "주제를 입력해주세요"),
        categoryId: z.number().nullable().optional(),
        generateTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:mm 형식이어야 합니다").default("09:00"),
        keywords: z.string().optional(),
        keywordsEn: z.string().optional(),
        promptTemplate: z.string().optional(),
        postStyle: z.enum(["informative", "guide", "tips", "comparison", "news"]).default("informative"),
        autoPublish: z.number().default(1),
        autoGenerateImage: z.number().default(0),
        isEnabled: z.number().default(1),
      })
    )
    .mutation(async ({ input }) => {
      const result = await db.createInfoBoardAutoSetting({
        topic: input.topic,
        categoryId: input.categoryId ?? null,
        generateTime: input.generateTime,
        keywords: input.keywords ?? null,
        keywordsEn: input.keywordsEn ?? null,
        promptTemplate: input.promptTemplate ?? null,
        postStyle: input.postStyle,
        autoPublish: input.autoPublish,
        autoGenerateImage: input.autoGenerateImage,
        isEnabled: input.isEnabled,
      });

      // 스케줄러 재시작
      await restartInfoBoardScheduler();

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
        postStyle: z.enum(["informative", "guide", "tips", "comparison", "news"]).optional(),
        autoPublish: z.number().optional(),
        autoGenerateImage: z.number().optional(),
        isEnabled: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateInfoBoardAutoSetting(id, data);

      // 스케줄러 재시작 (시간 변경 반영)
      await restartInfoBoardScheduler();

      return { success: true };
    }),

  // 설정 삭제
  deleteSetting: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteInfoBoardAutoSetting(input.id);

      // 스케줄러 재시작
      await restartInfoBoardScheduler();

      return { success: true };
    }),

  // 수동 실행 (특정 설정)
  generateNow: adminProcedure
    .input(z.object({ settingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const setting = await db.getInfoBoardAutoSettingById(input.settingId);
      if (!setting) throw new Error("설정을 찾을 수 없습니다");

      const result = await generateInfoBoardPost(setting, ctx.user.id, "manual");
      return result;
    }),

  // 전체 수동 실행 (활성화된 모든 설정)
  generateAllNow: adminProcedure.mutation(async ({ ctx }) => {
    const result = await generateAllEnabledInfoBoardPosts(ctx.user.id, "manual");
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
      return db.getInfoBoardAutoLogs(input.settingId, input.page, input.limit);
    }),
});
