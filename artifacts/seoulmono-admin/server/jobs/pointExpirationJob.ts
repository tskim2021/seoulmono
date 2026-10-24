import { sendExpirationNotifications } from "../pointExpirationNotification";

/**
 * 포인트 만료 예정 알림 배치 작업
 * 매일 오전 9시에 실행되어 7일 이내 만료 예정 포인트가 있는 사용자에게 알림 발송
 */
export async function runPointExpirationNotificationJob(): Promise<void> {
  console.log("[PointExpirationJob] Starting point expiration notification job...");
  
  try {
    const result = await sendExpirationNotifications(7);
    
    console.log("[PointExpirationJob] Job completed:", {
      totalUsers: result.totalUsers,
      emailSent: result.emailSent,
      pushSent: result.pushSent,
      failed: result.failed,
    });
    
    if (result.totalUsers > 0) {
      console.log(`[PointExpirationJob] Sent notifications to ${result.totalUsers} users (Email: ${result.emailSent}, Push: ${result.pushSent}, Failed: ${result.failed})`);
    } else {
      console.log("[PointExpirationJob] No users with expiring points found");
    }
  } catch (error) {
    console.error("[PointExpirationJob] Job failed:", error);
    throw error;
  }
}

// 개발 환경에서 테스트용 즉시 실행 함수
export async function runPointExpirationNotificationJobNow(): Promise<{
  totalUsers: number;
  emailSent: number;
  pushSent: number;
  failed: number;
}> {
  console.log("[PointExpirationJob] Running job immediately for testing...");
  return await sendExpirationNotifications(7);
}
