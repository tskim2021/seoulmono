/**
 * 무통장 입금 관련 이메일 템플릿
 */

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface BankTransferNotificationParams {
  orderNumber: string;
  amount: number;
  depositorName: string;
  bankAccount: BankAccount;
  expiresAt: Date;
  autoCancelHours: number;
}

interface BankTransferConfirmationParams {
  orderNumber: string;
  amount: number;
  confirmedAt: Date;
}

/**
 * 입금 계좌 안내 이메일 HTML 생성
 */
export function generateBankTransferNotificationEmail(params: BankTransferNotificationParams): string {
  const { orderNumber, amount, depositorName, bankAccount, expiresAt, autoCancelHours } = params;
  
  const formattedAmount = amount.toLocaleString("ko-KR");
  const formattedExpires = expiresAt.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>입금 계좌 안내</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Malgun Gothic', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">입금 계좌 안내</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">주문번호: ${orderNumber}</p>
            </td>
          </tr>

          <!-- 안내 메시지 -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                주문해 주셔서 감사합니다.<br>
                아래 계좌로 <strong style="color: #667eea;">${autoCancelHours}시간 이내</strong>에 입금해 주시면 상품 준비를 시작합니다.
              </p>
            </td>
          </tr>

          <!-- 입금 정보 카드 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; border-radius: 8px; border: 2px solid #667eea;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">입금 은행</p>
                          <p style="margin: 6px 0 0 0; font-size: 18px; color: #111827; font-weight: 700;">${bankAccount.bankName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">계좌번호</p>
                          <p style="margin: 6px 0 0 0; font-size: 20px; color: #111827; font-weight: 700; letter-spacing: 1px;">${bankAccount.accountNumber}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">예금주</p>
                          <p style="margin: 6px 0 0 0; font-size: 18px; color: #111827; font-weight: 700;">${bankAccount.accountHolder}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">입금 금액</p>
                          <p style="margin: 6px 0 0 0; font-size: 24px; color: #dc2626; font-weight: 700;">${formattedAmount}원</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">입금자명</p>
                          <p style="margin: 6px 0 0 0; font-size: 18px; color: #111827; font-weight: 700;">${depositorName}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 입금 기한 경고 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.6;">
                      <strong>⚠️ 입금 기한:</strong> ${formattedExpires}<br>
                      기한 내 입금하지 않으시면 주문이 자동으로 취소됩니다.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 안내 사항 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 700;">안내 사항</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #4b5563;">
                <li>입금자명이 주문자명과 다를 경우 입금 확인이 지연될 수 있습니다.</li>
                <li>입금 확인은 영업일 기준 1~2시간 소요될 수 있습니다.</li>
                <li>입금 확인 후 상품 준비를 시작하며, 배송 시작 시 별도 안내드립니다.</li>
                <li>주문 취소를 원하시면 고객센터로 문의해 주세요.</li>
              </ul>
            </td>
          </tr>

          <!-- CTA 버튼 -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || "https://example.com"}/orders" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                주문 내역 확인하기
              </a>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                본 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해 주세요.<br>
                © 2026 탈모학교 Clone. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 입금 확인 완료 이메일 HTML 생성
 */
export function generateBankTransferConfirmationEmail(params: BankTransferConfirmationParams): string {
  const { orderNumber, amount, confirmedAt } = params;
  
  const formattedAmount = amount.toLocaleString("ko-KR");
  const formattedConfirmed = confirmedAt.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>입금 확인 완료</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Malgun Gothic', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">입금이 확인되었습니다</h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">주문번호: ${orderNumber}</p>
            </td>
          </tr>

          <!-- 확인 메시지 -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                입금이 정상적으로 확인되었습니다.<br>
                지금부터 상품 준비를 시작하며, 배송 시작 시 별도로 안내드리겠습니다.
              </p>
            </td>
          </tr>

          <!-- 입금 정보 카드 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border-radius: 8px; border: 2px solid #10b981;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">입금 확인 시간</p>
                          <p style="margin: 6px 0 0 0; font-size: 18px; color: #111827; font-weight: 700;">${formattedConfirmed}</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">입금 금액</p>
                          <p style="margin: 6px 0 0 0; font-size: 24px; color: #10b981; font-weight: 700;">${formattedAmount}원</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 다음 단계 안내 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 700;">다음 단계</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #4b5563;">
                <li>상품 준비가 완료되면 배송을 시작합니다.</li>
                <li>배송 시작 시 운송장 번호와 함께 알림을 보내드립니다.</li>
                <li>배송 조회는 주문 내역 페이지에서 확인하실 수 있습니다.</li>
                <li>예상 배송 기간은 영업일 기준 10~14일입니다.</li>
              </ul>
            </td>
          </tr>

          <!-- CTA 버튼 -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || "https://example.com"}/orders" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                주문 내역 확인하기
              </a>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                본 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해 주세요.<br>
                © 2026 탈모학교 Clone. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
