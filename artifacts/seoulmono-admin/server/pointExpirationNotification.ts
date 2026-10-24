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
    const userName = name || "お客様";
    const expirationDate = earliestExpiration.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const subject = `[ソウルモノ] ${totalExpiring.toLocaleString()}ポイントがまもなく失効します`;
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
            <h1 style="margin: 0;">⏰ ポイント失効予定のお知らせ</h1>
          </div>
          <div class="content">
            <p>${userName}様、いつもご利用ありがとうございます。</p>
            
            <div class="alert-box">
              <p style="margin: 0; font-weight: 600;">保有ポイントがまもなく失効します。</p>
            </div>
            
            <p><strong>失効予定ポイント:</strong></p>
            <div class="points">${totalExpiring.toLocaleString()}P</div>
            
            <p><strong>失効予定日:</strong> ${expirationDate}</p>
            
            <p>失効前にポイントをご利用いただくと、さまざまな特典をお受けいただけます。</p>
            
            <a href="${process.env.VITE_APP_URL || "https://youngcart.manus.space"}/mypage/points" class="button">
              ポイント履歴を確認する
            </a>
            
            <div class="footer">
              <p>このメールは送信専用です。お問い合わせはカスタマーサポートまでお願いいたします。</p>
              <p>&copy; 2025 ソウルモノ. All rights reserved.</p>
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
      "ポイント失効予定のお知らせ",
      `${totalExpiring.toLocaleString()}ポイントが${expirationDate}に失効します。今すぐご利用ください！`,
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
