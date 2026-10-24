/**
 * 통관검사 안내 이메일 템플릿
 * 주문 상태가 customs_hold로 변경될 때 고객에게 발송
 */

export interface CustomsHoldEmailData {
  customerName: string;
  orderNumber: string;
  orderId: number;
  customsNumber?: string | null;
  customerPhone?: string | null;
}

/**
 * 통관검사 안내 이메일 HTML 생성
 *
 * 새 정책: 통관검사 대상은 반송이 필요한 정작과 하인이 아니라,
 * 반송이 날까지 배송이 진행되지 않음을 알리고 직접 반송 요청 메일 밭을 링크를 제공.
 */
export function generateCustomsHoldEmail(data: CustomsHoldEmailData): string {
  const {
    customerName,
    orderNumber,
    orderId,
    customsNumber,
    customerPhone,
  } = data;

  const orderUrl = `/mypage/orders/${orderId}`;
  const LOGO_URL = "https://talmoschool.com/shop/logo.png";
  const ALERT = "#c2410c";
  const SUCCESS = "#166534";

  // 메일토 링크: 받는 사람·제목·본문이 자동 입력되어 야 함
  const mailtoTo = encodeURIComponent("minwon9@korea.kr");
  const mailtoSubject = encodeURIComponent(
    customsNumber
      ? `${customsNumber}, ${customerName}, ${customerPhone ?? ""}, 반송 요청합니다.`
      : "통관번호, 성명, 전화번호, 반송 요청합니다."
  );
  const mailtoBody = encodeURIComponent(
    customsNumber
      ? `${customsNumber}, ${customerName}, ${customerPhone ?? ""}, 반송 요청합니다.`
      : "통관번호, 성명, 전화번호, 반송 요청합니다."
  );
  const mailtoLink = `mailto:${mailtoTo}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>通関検査のお知らせ（返送が必要です）</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background: #f8f7f5; -webkit-text-size-adjust: 100%; }
    .wrapper { max-width: 480px; margin: 0 auto; padding: 16px; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .header { padding: 20px; text-align: center; border-bottom: 1px solid #f0eeeb; }
    .header img { max-width: 160px; height: auto; display: block; margin: 0 auto; }
    .body { padding: 24px 20px; }
    .title { font-size: 18px; font-weight: 700; margin-bottom: 16px; line-height: 1.4; color: ${ALERT}; }
    .content { font-size: 14px; color: #444; line-height: 1.7; word-break: keep-all; }
    .content p { margin-bottom: 12px; }
    .info { background: #fff7ed; border-radius: 8px; border-left: 3px solid ${ALERT}; padding: 14px 16px; margin: 16px 0; font-size: 13px; }
    .info-row { display: flex; justify-content: space-between; margin: 4px 0; }
    .info-label { color: #888; }
    .info-value { color: #1a1a1a; font-weight: 600; }
    .notice { background: #faf9f7; border-radius: 8px; padding: 14px 16px; margin: 16px 0; font-size: 13px; }
    .notice h4 { font-size: 13px; margin-bottom: 8px; color: #1a1a1a; }
    .notice ul { padding-left: 16px; margin: 0; }
    .notice li { margin: 4px 0; color: #555; }
    .reassurance {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 14px 16px;
      margin: 16px 0;
      font-size: 13px;
      color: ${SUCCESS};
      text-align: center;
    }
    .reassurance strong { font-size: 14px; display: block; margin-bottom: 4px; }
    .action { margin: 20px 0; text-align: center; }
    .btn { display: inline-block; padding: 11px 24px; background: ${ALERT}; color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600; }
    .btn-secondary { display: inline-block; padding: 11px 24px; background: #3a2a2a; color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600; }
    .divider { height: 1px; background: #f0eeeb; margin: 0 20px; }
    .footer { padding: 16px 20px; text-align: center; font-size: 12px; color: #888; line-height: 1.6; }
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
    .notice-box strong { color: #991b1b; }
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
      background: #3a2a2a;
      color: #fff !important;
      text-decoration: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .mail-guide {
      background: #fff7ed;
      border: 1px dashed #fdba74;
      border-radius: 8px;
      padding: 12px 14px;
      margin: 12px 0;
      font-size: 12px;
      color: #7c2d12;
      text-align: left;
    }
    .mail-guide h5 { font-size: 13px; margin-bottom: 6px; color: #c2410c; }
    .mail-guide ol { padding-left: 16px; margin: 0; }
    .mail-guide li { margin: 3px 0; }
    .mail-guide code {
      background: #fff;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 11px;
      border: 1px solid #fed7aa;
    }
    @media screen and (max-width: 480px) {
      .wrapper { padding: 8px; }
      .body { padding: 20px 16px; }
      .title { font-size: 16px; }
      .content { font-size: 13px; }
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
        <div class="title">通関検査のお知らせ（返送が必要です）</div>
        <div class="content">
          <p>いつもご利用ありがとうございます。<strong>${customerName}</strong>様</p>
          <p>ご注文の商品が税関の通関検査の対象となりました。</p>
          <div class="info">
            <div class="info-row"><span class="info-label">ご注文番号</span><span class="info-value">${orderNumber}</span></div>
            <div class="info-row"><span class="info-label">現在の状況</span><span class="info-value" style="color:${ALERT};">通関検査対象 → 返送が必要</span></div>
            ${customsNumber ? `<div class="info-row"><span class="info-label">通関番号</span><span class="info-value">${customsNumber}</span></div>` : ""}
          </div>

          <div class="notice">
            <h4>⚠️ 必ずご確認いただきたい事項</h4>
            <ul>
              <li>通関検査の対象となった商品は、<strong>医師の所見書がないと通関が進みません</strong>。</li>
              <li>通関検査により配送ができない場合、ソウルモノが<strong>追加費用なしで新しい商品を再発送</strong>いたします。</li>
              <li>通関が複数回進まなかった場合でも、その履歴がお客様の不利益になることはなく、お客様情報に別途蓄積されることもありません。</li>
              <li>再発送となる場合、営業日で<strong>3〜5日以内</strong>に配送情報へ新しい追跡番号が登録されます。</li>
            </ul>
          </div>

          <div class="reassurance">
            <strong>🛡️ ソウルモノがただちに新しい商品の再発送を開始します</strong>
          </div>

          <div class="action">
            <a href="${mailtoLink}" class="btn-secondary" style="margin-bottom:10px;display:inline-block;">✉️ 返送メールを今すぐ送る</a>
          </div>

          <div class="mail-guide">
            <h5>✓ ボタンをクリックすると自動入力される情報</h5>
            <ol>
              <li>宛先: <code>minwon9@korea.kr</code></li>
              <li>件名: <code>${customsNumber ? `${customsNumber}, ${customerName}, ${customerPhone ?? ""}, 반송 요청합니다.` : "통관번호, 성명, 전화번호, 반송 요청합니다."}</code></li>
              <li>本文: <code>${customsNumber ? `${customsNumber}, ${customerName}, ${customerPhone ?? ""}, 반송 요청합니다.` : "통관번호, 성명, 전화번호, 반송 요청합니다."}</code></li>
            </ol>
            <p style="margin-top:8px;font-size:11px;color:#9a3412;">
              * 아래 버튼을 눌러면 메일 프로그램이 자동으로 실행되며 위 정보이 자동 입력됩니다.
            </p>
          </div>

          <div class="action">
            <a href="${orderUrl}" class="btn">ご注文詳細を確認</a>
          </div>
        </div>
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
