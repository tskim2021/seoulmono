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
    from: `"${settings.smtpFromName ?? "탈모학교"}" <${settings.smtpFrom ?? settings.smtpUser}>`,
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
  if (!smtp) return { success: false, error: "SMTP 설정이 되어있지 않습니다." };
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
      const content = `📧 이메일 발송 알림\n수신자: ${params.to}\n제목: ${params.subject}`;
      success = await notifyOwner({ title: `[이메일] ${params.subject}`, content });
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
  const footerText = template?.footerText || "탈모학교 - 해외직구 전문 쇼핑몰";
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
          <img src="${logoUrl}" alt="\ud0c8\ubaa8\ud559\uad50" />
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
          <strong>⚠️ 본 메일은 발신 전용 메일입니다</strong><br>
          회신하셔도 답변을 받으실 수 없습니다.<br>
          문의사항은 탈모학교 [1:1문의]로 연락 부탁드립니다.
        </div>
        <div class="contact-links">
          <a href="https://talmoschool.com/mypage/inquiry">1:1문의</a>
          <a href="https://talmoschool.com/">탈모학교 쇼핑몰 바로가기</a>
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
  <title>배송 완료 - 리뷰 요청</title>
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
        <img src="${LOGO_URL}" alt="탈모학교" />
      </div>
      <div class="body">
        <div class="title">배송이 완료되었습니다!</div>
        <div class="content">
          <p>안녕하세요, <strong>${params.customerName}</strong>님!</p>
          <p>주문하신 <strong>${params.productName}</strong>이(가) 무사히 배송 완료되었습니다.</p>
          <div class="info">
            <div class="info-row"><span class="info-label">주문번호</span><span class="info-value">${params.orderNumber}</span></div>
            <div class="info-row"><span class="info-label">상품명</span><span class="info-value">${params.productName}</span></div>
          </div>
          <p>상품은 만족스러우셨나요? 리뷰를 남겨주시면 다른 고객분들께 큰 도움이 됩니다.</p>
        </div>
        <div class="action">
          <a href="${params.reviewUrl}" class="btn">리뷰 작성하기</a>
        </div>
        <p class="tip">리뷰 작성 시 포인트 적립 혜택 있음</p>
      </div>
      <div class="divider"></div>
      <div class="footer">
        <div class="notice-box">
          <strong>⚠️ 본 메일은 발신 전용 메일입니다</strong><br>
          회신하셔도 답변을 받으실 수 없습니다.<br>
          문의사항은 탈모학교 [1:1문의]로 연락 부탁드립니다.
        </div>
        <div class="contact-links">
          <a href="https://talmoschool.com/mypage/inquiry">1:1문의</a>
          <a href="https://talmoschool.com/">탈모학교 쇼핑몰 바로가기</a>
        </div>
        <p>본 메일은 발신 전용입니다.</p>
        <p>&copy; 2026 탈모학교</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
