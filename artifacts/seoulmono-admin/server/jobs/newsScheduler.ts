import cron, { type ScheduledTask } from "node-cron";
import { generateAllEnabledNews } from "../services/newsGenerator";
import * as db from "../db";

let newsTask: ScheduledTask | null = null;

/**
 * 뉴스 자동 생성 스케줄러를 시작합니다.
 * 매일 오전 9시(KST)에 활성화된 모든 카테고리에 대해 뉴스를 자동 생성합니다.
 */
export function startNewsScheduler() {
  if (newsTask) {
    newsTask.stop();
  }

  // 매일 오전 9시 (KST)
  newsTask = cron.schedule('0 9 * * *', async () => {
    console.log('[NewsScheduler] Starting auto news generation...');
    try {
      // 시스템 사용자 ID (관리자) 조회 - owner 사용
      const systemUserId = await getSystemUserId();
      if (!systemUserId) {
        console.error('[NewsScheduler] No system user found for news generation');
        return;
      }

      const result = await generateAllEnabledNews(systemUserId);
      console.log(`[NewsScheduler] Completed: ${result.totalGenerated} articles generated`);
      
      for (const cat of result.categoryResults) {
        if (cat.errors.length > 0) {
          console.warn(`[NewsScheduler] Category ${cat.categoryId} errors:`, cat.errors);
        }
      }
    } catch (error) {
      console.error('[NewsScheduler] Auto generation failed:', error);
    }
  }, {
    timezone: 'Asia/Seoul'
  });

  console.log('[NewsScheduler] News auto-generation scheduled (daily at 9:00 AM KST)');
}

async function getSystemUserId(): Promise<number | null> {
  try {
    const database = await db.getDb();
    if (!database) return null;
    
    // owner 사용자 또는 첫 번째 admin 사용자 찾기
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const admins = await database.select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);
    
    return admins[0]?.id ?? null;
  } catch {
    return null;
  }
}

export function stopNewsScheduler() {
  if (newsTask) {
    newsTask.stop();
    newsTask = null;
    console.log('[NewsScheduler] Stopped');
  }
}
