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
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>통관검사 안내 (반송 필요)</title>
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
        <img src="${LOGO_URL}" alt="탈모학교" />
      </div>
      <div class="body">
        <div class="title">통관검사 안내 (반송 필수)</div>
        <div class="content">
          <p>안녕하세요, <strong>${customerName}</strong>님!</p>
          <p>주문하신 상품이 세관의 통관검사 대상으로 선정되었습니다.</p>
          <div class="info">
            <div class="info-row"><span class="info-label">주문번호</span><span class="info-value">${orderNumber}</span></div>
            <div class="info-row"><span class="info-label">현재 상태</span><span class="info-value" style="color:${ALERT};">통관검사 대상 → 반송 필요</span></div>
            ${customsNumber ? `<div class="info-row"><span class="info-label">통관번호</span><span class="info-value">${customsNumber}</span></div>` : ""}
          </div>

          <div class="notice">
            <h4>⚠️ 반드시 알아두시면 되는 사항</h4>
            <ul>
              <li>통관검사 대상으로 선정된 상품은 <strong>의사 소견서 없이 통관이 진행되지 않습니다</strong>.</li>
              <li>통관검사로 인해 배송이 불가한 경우, 탈모학교에서 <strong>추가 비용 없이 새 상품을 재발송</strong>해 드립니다.</li>
              <li>통관이 여러 차례 진행되지 않더라도 해당 이력은 고객에게 불이익으로 남지 않으며, 고객 정보에 별도로 누적되지 않습니다.</li>
              <li>재배송이 진행되는 경우, 영업일 기준 <strong>3~5일 이내</strong>에 배송정보에 새로운 송장번호가 등록됩니다.</li>
            </ul>
          </div>

          <div class="reassurance">
            <strong>🛡️ 탈모학교에서 즉시 새제품으로 재배송을 시작합니다</strong>
          </div>

          <div class="action">
            <a href="${mailtoLink}" class="btn-secondary" style="margin-bottom:10px;display:inline-block;">✉️ 반송메일 바로 보내기</a>
          </div>

          <div class="mail-guide">
            <h5>✓ 버튼 클릭 후 자동 입력되는 정보</h5>
            <ol>
              <li>받는 사람: <code>minwon9@korea.kr</code></li>
              <li>제목: <code>${customsNumber ? `${customsNumber}, ${customerName}, ${customerPhone ?? ""}, 반송 요청합니다.` : "통관번호, 성명, 전화번호, 반송 요청합니다."}</code></li>
              <li>본문: <code>${customsNumber ? `${customsNumber}, ${customerName}, ${customerPhone ?? ""}, 반송 요청합니다.` : "통관번호, 성명, 전화번호, 반송 요청합니다."}</code></li>
            </ol>
            <p style="margin-top:8px;font-size:11px;color:#9a3412;">
              * 아래 버튼을 눌러면 메일 프로그램이 자동으로 실행되며 위 정보이 자동 입력됩니다.
            </p>
          </div>

          <div class="action">
            <a href="${orderUrl}" class="btn">주문 상세 확인</a>
          </div>
        </div>
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
