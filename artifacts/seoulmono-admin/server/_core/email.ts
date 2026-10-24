import { notifyOwner } from "./notification";
import nodemailer from "nodemailer";

async function getSmtpTransporter() {
  const { getSettings } = await import("../db");
  const settings = await getSettings([
    "smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFrom", "smtpFromName", "smtpSecure", "smtpBcc",
  ]);
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) return null;
  return {
    transporter: nodemailer.createTransport({
      host: settings.smtpHost,
      port: Number(settings.smtpPort ?? "587"),
      secure: settings.smtpSecure === "true",
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
      tls: { rejectUnauthorized: false },
    }),
    from: `"${settings.smtpFromName ?? "ソウルモノ"}" <${settings.smtpFrom ?? settings.smtpUser}>`,
    bcc: settings.smtpBcc ?? undefined,
  };
}

export async function sendEmailViaSMTP(params: {
  to: string;
  subject: string;
  html: string;
  bcc?: string;
}): Promise<{ success: boolean; error?: string }> {
  const smtp = await getSmtpTransporter();
  if (!smtp) return { success: false, error: "SMTPが設定されていません。" };
  try {
    await smtp.transporter.sendMail({
      from: smtp.from,
      to: params.to,
      bcc: params.bcc ?? smtp.bcc,
      subject: params.subject,
      html: params.html,
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  userId?: number;
  bcc?: string;
}): Promise<boolean> {
  let success = false;
  let errorMessage: string | null = null;

  const smtp = await getSmtpTransporter();
  if (smtp) {
    try {
      await smtp.transporter.sendMail({
        from: smtp.from,
        to: params.to,
        bcc: params.bcc ?? smtp.bcc,
        subject: params.subject,
        html: params.html,
      });
      success = true;
    } catch (e: any) {
      errorMessage = e.message;
      console.error("[Email] SMTP send failed:", e.message);
    }
  }

  if (!success) {
    try {
      const content = `📧 メール送信通知\n宛先: ${params.to}\n件名: ${params.subject}`;
      success = await notifyOwner({ title: `[メール] ${params.subject}`, content });
    } catch {
      // 알림 서비스 미설정 시 조용히 실패 (주문/결제 흐름에 영향 없음)
      success = false;
    }
    if (!success) errorMessage = errorMessage ?? "Failed to send";
  }

  try {
    const { getDb } = await import("../db");
    const { emailLogs } = await import("../../drizzle/schema");
    const db = await getDb();
    if (db) {
      await db.insert(emailLogs).values({
        userId: params.userId || null,
        recipient: params.to,
        subject: params.subject,
        htmlContent: params.html,
        status: success ? "sent" : "failed",
        errorMessage,
      });
    }
  } catch (e) {
    console.error("Failed to log email:", e);
  }

  return success;
}

/**
 * 배송 완료 후 리뷰 요청 이메일 템플릿
 */
/**
 * 범용 이메일 템플릿 생성
 */
export async function generateEmailTemplate(params: {
  title: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
}): Promise<string> {
  const { title, content, actionUrl, actionText } = params;

  const { getDb } = await import("../db");
  const { emailTemplates } = await import("../../drizzle/schema");
  const db = await getDb();
  let template = null;
  if (db) {
    const result = await db.select().from(emailTemplates).limit(1);
    template = result[0];
  }

  const logoUrl = template?.logoUrl || "https://talmoschool.com/shop/logo.png";
  const primaryColor = template?.primaryColor || "#3a2a2a";
  const footerText = template?.footerText || "ソウルモノ - 海外個人輸入専門ショップ";
  const footerLinks = template?.footerLinks ? JSON.parse(template.footerLinks) : [];

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f8f7f5;
      -webkit-text-size-adjust: 100%;
    }
    .wrapper {
      max-width: 480px;
      margin: 0 auto;
      padding: 16px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .header {
      padding: 20px;
      text-align: center;
      border-bottom: 1px solid #f0eeeb;
    }
    .logo {
      display: inline-block;
    }
    .logo img {
      max-width: 160px;
      height: auto;
      display: block;
    }
    .body {
      padding: 24px 20px;
    }
    .title {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .content {
      font-size: 14px;
      color: #444;
      line-height: 1.7;
      white-space: pre-wrap;
      word-break: keep-all;
    }
    .content p { margin-bottom: 12px; }
    .content strong { color: #1a1a1a; }
    .action {
      margin: 24px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      background: ${primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      -webkit-text-size-adjust: none;
    }
    .divider {
      height: 1px;
      background: #f0eeeb;
      margin: 0 20px;
    }
    .footer {
      padding: 36px 20px 16px;
      text-align: center;
      font-size: 12px;
      color: #888;
      line-height: 1.6;
    }
    .footer a {
      color: #888;
      text-decoration: none;
    }
    .footer-links {
      margin-top: 8px;
    }
    .footer-links a {
      display: inline-block;
      margin: 0 6px;
      color: #666;
    }
    .notice-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 12px;
      color: #991b1b;
      text-align: center;
      line-height: 1.6;
    }
    .notice-box strong {
      color: #991b1b;
    }
    .contact-links {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #e5e5e5;
    }
    .contact-links a {
      display: inline-block;
      padding: 8px 16px;
      background: ${primaryColor};
      color: #fff !important;
      text-decoration: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    @media screen and (max-width: 480px) {
      .wrapper { padding: 8px; }
      .body { padding: 20px 16px; }
      .title { font-size: 16px; }
      .content { font-size: 13px; }
      .btn { padding: 11px 24px; font-size: 13px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">
          <img src="${logoUrl}" alt="ソウルモノ" />
        </div>
      </div>
      <div class="body">
        <div class="title">${title}</div>
        <div class="content">${content}</div>
        ${actionUrl && actionText ? `
        <div class="action">
          <a href="${actionUrl}" class="btn">${actionText}</a>
        </div>
        ` : ""}
      </div>
      <div class="divider"></div>
      <div class="footer">
        <div class="notice-box">
          <strong>⚠️ このメールは送信専用です</strong><br>
          ご返信いただいてもお答えできません。<br>
          お問い合わせはソウルモノの［個別お問い合わせ］までお願いいたします。
        </div>
        <div class="contact-links">
          <a href="https://talmoschool.com/mypage/inquiry">個別お問い合わせ</a>
          <a href="https://talmoschool.com/">ソウルモノのショップへ</a>
        </div>
        <p>${footerText}</p>
        ${footerLinks.length > 0 ? `<div class="footer-links">${footerLinks.map((link: any) => `<a href="${link.url}">${link.text}</a>`).join(" \u00b7 ")}</div>` : ""}
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 배송 완료 후 리뷰 요청 이메일 템플릿
 */
export function generateReviewRequestEmail(params: {
  customerName: string;
  orderNumber: string;
  productName: string;
  reviewUrl: string;
}): string {
  const LOGO_URL = "https://talmoschool.com/shop/logo.png";
  const PRIMARY = "#3a2a2a";
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>配送完了 - レビューのお願い</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background: #f8f7f5; -webkit-text-size-adjust: 100%; }
    .wrapper { max-width: 480px; margin: 0 auto; padding: 16px; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .header { padding: 20px; text-align: center; border-bottom: 1px solid #f0eeeb; }
    .header img { max-width: 160px; height: auto; display: block; margin: 0 auto; }
    .body { padding: 24px 20px; }
    .title { font-size: 18px; font-weight: 700; margin-bottom: 16px; line-height: 1.4; }
    .content { font-size: 14px; color: #444; line-height: 1.7; word-break: keep-all; }
    .content p { margin-bottom: 12px; }
    .info { background: #faf9f7; border-radius: 8px; padding: 14px 16px; margin: 16px 0; font-size: 13px; }
    .info-row { display: flex; justify-content: space-between; margin: 4px 0; }
    .info-label { color: #888; }
    .info-value { color: #1a1a1a; font-weight: 600; }
    .action { margin: 24px 0; text-align: center; }
    .btn { display: inline-block; padding: 12px 28px; background: ${PRIMARY}; color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; -webkit-text-size-adjust: none; }
    .tip { font-size: 12px; color: #888; margin-top: 12px; text-align: center; }
    .divider { height: 1px; background: #f0eeeb; margin: 0 20px; }
    .footer { padding: 26px 20px 16px; text-align: center; font-size: 12px; color: #888; line-height: 1.6; }
    @media screen and (max-width: 480px) {
      .wrapper { padding: 8px; }
      .body { padding: 20px 16px; }
      .title { font-size: 16px; }
      .content { font-size: 13px; }
      .btn { padding: 11px 24px; font-size: 13px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="${LOGO_URL}" alt="ソウルモノ" />
      </div>
      <div class="body">
        <div class="title">配送が完了しました！</div>
        <div class="content">
          <p>いつもご利用ありがとうございます。<strong>${params.customerName}</strong>様</p>
          <p>ご注文の<strong>${params.productName}</strong>が無事に配送完了いたしました。</p>
          <div class="info">
            <div class="info-row"><span class="info-label">ご注文番号</span><span class="info-value">${params.orderNumber}</span></div>
            <div class="info-row"><span class="info-label">商品名</span><span class="info-value">${params.productName}</span></div>
          </div>
          <p>商品はいかがでしたか？レビューをお寄せいただけますと、他のお客様の大きな参考になります。</p>
        </div>
        <div class="action">
          <a href="${params.reviewUrl}" class="btn">レビューを書く</a>
        </div>
        <p class="tip">レビュー投稿でポイントがもらえます</p>
      </div>
      <div class="divider"></div>
      <div class="footer">
        <div class="notice-box">
          <strong>⚠️ このメールは送信専用です</strong><br>
          ご返信いただいてもお答えできません。<br>
          お問い合わせはソウルモノの［個別お問い合わせ］までお願いいたします。
        </div>
        <div class="contact-links">
          <a href="https://talmoschool.com/mypage/inquiry">個別お問い合わせ</a>
          <a href="https://talmoschool.com/">ソウルモノのショップへ</a>
        </div>
        <p>このメールは送信専用です。</p>
        <p>&copy; 2026 ソウルモノ</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
