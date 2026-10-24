import cron, { type ScheduledTask } from "node-cron";
import { runShippingSyncJob } from "./shippingSyncJob";
import type { ShippingSyncSchedulerConfig } from "../db";

let currentTask: ScheduledTask | null = null;
let currentIntervalHours: number = 12;
let isRunning = false;

/**
 * 시간 간격을 cron 표현식으로 변환
 */
function intervalToCron(hours: number): string {
  if (hours <= 0) hours = 12;
  if (hours >= 48) return "0 0 */2 * *";
  if (hours >= 24) return "0 0 * * *";
  if (hours === 12) return "0 0,12 * * *";
  if (hours === 1) return "0 * * * *";
  return `0 */${hours} * * *`;
}

/**
 * 스케줄러 상태 조회
 */
export function getSchedulerStatus() {
  return {
    isActive: currentTask !== null,
    intervalHours: currentIntervalHours,
    isRunning,
  };
}

/**
 * 배송 동기화 스케줄러 시작
 */
export function startShippingSyncScheduler(config: ShippingSyncSchedulerConfig) {
  // 기존 태스크 정리
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }

  if (!config.enabled) {
    console.log("[Scheduler] Shipping sync scheduler is disabled.");
    return;
  }

  currentIntervalHours = config.intervalHours;
  const cronExpr = intervalToCron(config.intervalHours);

  currentTask = cron.schedule(cronExpr, async () => {
    if (isRunning) {
      console.log("[Scheduler] Shipping sync already running, skipping...");
      return;
    }

    isRunning = true;
    try {
      console.log(`[Scheduler] Running shipping sync (interval: ${config.intervalHours}h)...`);
      const result = await runShippingSyncJob();

      // 마지막 실행 결과 저장
      const { updateShippingSyncLastRun } = await import("../db");
      await updateShippingSyncLastRun(result);

      console.log(`[Scheduler] Shipping sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);
    } catch (error) {
      console.error("[Scheduler] Shipping sync job failed:", error);
    } finally {
      isRunning = false;
    }
  }, {
    timezone: "Asia/Seoul",
  });

  console.log(`[Scheduler] Shipping sync scheduler started (every ${config.intervalHours}h, cron: ${cronExpr})`);
}

/**
 * 스케줄러 재시작 (설정 변경 시 호출)
 */
export function restartShippingSyncScheduler(config: ShippingSyncSchedulerConfig) {
  console.log(`[Scheduler] Restarting shipping sync scheduler (enabled: ${config.enabled}, interval: ${config.intervalHours}h)...`);
  startShippingSyncScheduler(config);
}

/**
 * 스케줄러 중지
 */
export function stopShippingSyncScheduler() {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
    console.log("[Scheduler] Shipping sync scheduler stopped.");
  }
}
