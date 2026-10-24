import cron, { type ScheduledTask } from "node-cron";
import { generateAllEnabledDiscussionPosts } from "../services/discussionGenerator";
import * as db from "../db";

let discussionTask: ScheduledTask | null = null;
let currentScheduleTime: string | null = null;

/**
 * 토론광장 AI 자동 토론 스케줄러를 시작합니다.
 * 활성화된 설정들의 generateTime에 맞춰 매일 실행합니다.
 */
export async function startDiscussionScheduler() {
  if (discussionTask) {
    discussionTask.stop();
    discussionTask = null;
  }

  // 활성화된 설정들 조회
  const settings = await db.getEnabledDiscussionAutoSettings();
  if (settings.length === 0) {
    console.log("[DiscussionScheduler] No enabled settings found, scheduler not started.");
    currentScheduleTime = null;
    return;
  }

  // 가장 빠른 시간으로 스케줄 설정
  const generateTime = settings[0].generateTime || "09:00";
  const [hour, minute] = generateTime.split(":").map(Number);

  const cronExpr = `${minute} ${hour} * * *`;
  currentScheduleTime = generateTime;

  discussionTask = cron.schedule(cronExpr, async () => {
    console.log("[DiscussionScheduler] Starting auto discussion generation...");
    try {
      const systemUserId = await getSystemUserId();
      if (!systemUserId) {
        console.error("[DiscussionScheduler] No system user found");
        return;
      }

      const result = await generateAllEnabledDiscussionPosts(systemUserId, "scheduler");
      console.log(`[DiscussionScheduler] Completed: ${result.totalGenerated} discussions generated`);

      for (const r of result.results) {
        if (!r.success) {
          console.warn(`[DiscussionScheduler] Setting ${r.settingId} failed: ${r.error}`);
        }
      }
    } catch (error) {
      console.error("[DiscussionScheduler] Auto generation failed:", error);
    }
  }, {
    timezone: "Asia/Tokyo",
  });

  console.log(`[DiscussionScheduler] Scheduled daily at ${generateTime} KST (${settings.length} active settings)`);
}

/**
 * 스케줄러를 재시작합니다 (설정 변경 시 호출).
 */
export async function restartDiscussionScheduler() {
  console.log("[DiscussionScheduler] Restarting...");
  await startDiscussionScheduler();
}

/**
 * 스케줄러를 중지합니다.
 */
export function stopDiscussionScheduler() {
  if (discussionTask) {
    discussionTask.stop();
    discussionTask = null;
    currentScheduleTime = null;
    console.log("[DiscussionScheduler] Stopped");
  }
}

/**
 * 스케줄러 상태를 반환합니다.
 */
export function getDiscussionSchedulerStatus() {
  return {
    isActive: discussionTask !== null,
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
