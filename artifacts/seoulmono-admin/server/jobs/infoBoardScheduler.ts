import cron, { type ScheduledTask } from "node-cron";
import { generateAllEnabledInfoBoardPosts } from "../services/infoBoardGenerator";
import * as db from "../db";

let infoBoardTask: ScheduledTask | null = null;
let currentScheduleTime: string | null = null;

/**
 * 정보나눔 AI 자동글 스케줄러를 시작합니다.
 * 활성화된 설정들의 generateTime에 맞춰 매일 실행합니다.
 */
export async function startInfoBoardScheduler() {
  if (infoBoardTask) {
    infoBoardTask.stop();
    infoBoardTask = null;
  }

  // 활성화된 설정들 조회
  const settings = await db.getEnabledInfoBoardAutoSettings();
  if (settings.length === 0) {
    console.log("[InfoBoardScheduler] No enabled settings found, scheduler not started.");
    currentScheduleTime = null;
    return;
  }

  // 가장 빠른 시간으로 스케줄 설정 (여러 설정이 있을 경우)
  // 모든 설정은 동일 시간에 실행됨 (각 설정별 시간 지원)
  const generateTime = settings[0].generateTime || "09:00";
  const [hour, minute] = generateTime.split(":").map(Number);

  const cronExpr = `${minute} ${hour} * * *`;
  currentScheduleTime = generateTime;

  infoBoardTask = cron.schedule(cronExpr, async () => {
    console.log("[InfoBoardScheduler] Starting auto info board post generation...");
    try {
      const systemUserId = await getSystemUserId();
      if (!systemUserId) {
        console.error("[InfoBoardScheduler] No system user found");
        return;
      }

      const result = await generateAllEnabledInfoBoardPosts(systemUserId, "scheduler");
      console.log(`[InfoBoardScheduler] Completed: ${result.totalGenerated} posts generated`);

      for (const r of result.results) {
        if (!r.success) {
          console.warn(`[InfoBoardScheduler] Setting ${r.settingId} failed: ${r.error}`);
        }
      }
    } catch (error) {
      console.error("[InfoBoardScheduler] Auto generation failed:", error);
    }
  }, {
    timezone: "Asia/Tokyo",
  });

  console.log(`[InfoBoardScheduler] Scheduled daily at ${generateTime} KST (${settings.length} active settings)`);
}

/**
 * 스케줄러를 재시작합니다 (설정 변경 시 호출).
 */
export async function restartInfoBoardScheduler() {
  console.log("[InfoBoardScheduler] Restarting...");
  await startInfoBoardScheduler();
}

/**
 * 스케줄러를 중지합니다.
 */
export function stopInfoBoardScheduler() {
  if (infoBoardTask) {
    infoBoardTask.stop();
    infoBoardTask = null;
    currentScheduleTime = null;
    console.log("[InfoBoardScheduler] Stopped");
  }
}

/**
 * 스케줄러 상태를 반환합니다.
 */
export function getInfoBoardSchedulerStatus() {
  return {
    isActive: infoBoardTask !== null,
    scheduleTime: currentScheduleTime,
  };
}

async function getSystemUserId(): Promise<number | null> {
  try {
    const database = await db.getDb();
    if (!database) return null;

    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const admins = await database
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    return admins[0]?.id ?? null;
  } catch {
    return null;
  }
}
