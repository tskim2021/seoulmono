import * as db from "./db";
import { sendEmail } from "./_core/email";

/**
 * 포인트 만료 예정 이메일 발송
 */
export async function sendPointExpirationEmail(
  email: string,
  name: string | null,
  totalExpiring: number,
  earliestExpiration: Date
): Promise<boolean> {
  try {
    const userName = name || "회원";
    const expirationDate = earliestExpiration.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const subject = `[탈모학교] ${totalExpiring.toLocaleString()}P 포인트가 곧 만료됩니다`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .points { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">⏰ 포인트 만료 예정 안내</h1>
          </div>
          <div class="content">
            <p>${userName}님, 안녕하세요!</p>
            
            <div class="alert-box">
              <p style="margin: 0; font-weight: 600;">보유하신 포인트가 곧 만료됩니다.</p>
            </div>
            
            <p><strong>만료 예정 포인트:</strong></p>
            <div class="points">${totalExpiring.toLocaleString()}P</div>
            
            <p><strong>만료 예정일:</strong> ${expirationDate}</p>
            
            <p>만료 전에 포인트를 사용하시면 다양한 혜택을 받으실 수 있습니다.</p>
            
            <a href="${process.env.VITE_APP_URL || "https://youngcart.manus.space"}/mypage/points" class="button">
              포인트 내역 확인하기
            </a>
            
            <div class="footer">
              <p>이 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해주세요.</p>
              <p>&copy; 2025 탈모학교. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("[PointExpirationNotification] Email send failed:", error);
    return false;
  }
}

/**
 * 포인트 만료 예정 푸시 알림 발송
 */
export async function sendPointExpirationPush(
  userId: number,
  totalExpiring: number,
  earliestExpiration: Date
): Promise<boolean> {
  try {
    const expirationDate = earliestExpiration.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });

    await db.createNotification(
      userId,
      "point",
      "포인트 만료 예정 안내",
      `${totalExpiring.toLocaleString()}P가 ${expirationDate}에 만료됩니다. 지금 사용하세요!`,
      "/mypage/points"
    );

    return true;
  } catch (error) {
    console.error("[PointExpirationNotification] Push send failed:", error);
    return false;
  }
}

/**
 * 만료 예정 포인트 알림 일괄 발송
 */
export async function sendExpirationNotifications(daysBeforeExpiration: number = 7): Promise<{
  totalUsers: number;
  emailSent: number;
  pushSent: number;
  failed: number;
}> {
  const users = await db.getUsersWithExpiringPoints(daysBeforeExpiration);

  let emailSent = 0;
  let pushSent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      // 이메일 발송
      if (user.email) {
        const emailSuccess = await sendPointExpirationEmail(
          user.email,
          user.name,
          user.totalExpiring,
          user.earliestExpiration
        );
        if (emailSuccess) emailSent++;
      }

      // 푸시 알림 발송
      const pushSuccess = await sendPointExpirationPush(
        user.userId,
        user.totalExpiring,
        user.earliestExpiration
      );
      if (pushSuccess) pushSent++;
    } catch (error) {
      console.error(`[PointExpirationNotification] Failed for user ${user.userId}:`, error);
      failed++;
    }
  }

  return {
    totalUsers: users.length,
    emailSent,
    pushSent,
    failed,
  };
}
