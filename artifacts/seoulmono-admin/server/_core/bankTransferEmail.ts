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
  
  const formattedAmount = amount.toLocaleString("ja-JP");
  const formattedExpires = expiresAt.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>お振込先のご案内</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Malgun Gothic', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- 헤더 -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">お振込先のご案内</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">ご注文番号: ${orderNumber}</p>
            </td>
          </tr>

          <!-- 안내 메시지 -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                ご注文ありがとうございます。<br>
                下記の口座に<strong style="color: #667eea;">${autoCancelHours}時間以内</strong>にお振込みいただくと、商品の準備を開始いたします。
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
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">お振込先銀行</p>
                          <p style="margin: 6px 0 0 0; font-size: 18px; color: #111827; font-weight: 700;">${bankAccount.bankName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">口座番号</p>
                          <p style="margin: 6px 0 0 0; font-size: 20px; color: #111827; font-weight: 700; letter-spacing: 1px;">${bankAccount.accountNumber}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">口座名義</p>
                          <p style="margin: 6px 0 0 0; font-size: 18px; color: #111827; font-weight: 700;">${bankAccount.accountHolder}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">お振込金額</p>
                          <p style="margin: 6px 0 0 0; font-size: 24px; color: #dc2626; font-weight: 700;">${formattedAmount}円</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">お振込名義</p>
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
                      <strong>⚠️ お振込期限:</strong> ${formattedExpires}<br>
                      期限内にご入金がない場合、ご注文は自動的にキャンセルされます。
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 안내 사항 -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 700;">ご案内</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #4b5563;">
                <li>お振込名義がご注文者名と異なる場合、ご入金の確認が遅れることがあります。</li>
                <li>ご入金の確認には営業日で1〜2時間ほどかかる場合があります。</li>
                <li>ご入金確認後に商品の準備を開始し、発送時に別途ご案内いたします。</li>
                <li>ご注文のキャンセルをご希望の場合は、カスタマーサポートまでお問い合わせください。</li>
              </ul>
            </td>
          </tr>

          <!-- CTA 버튼 -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || "https://example.com"}/orders" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                ご注文履歴を確認する
              </a>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                このメールは送信専用です。お問い合わせはカスタマーサポートまでお願いいたします。<br>
                © 2026 ソウルモノ. All rights reserved.
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
  
  const formattedAmount = amount.toLocaleString("ja-JP");
  const formattedConfirmed = confirmedAt.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ご入金確認完了</title>
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
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">ご入金を確認しました</h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">ご注文番号: ${orderNumber}</p>
            </td>
          </tr>

          <!-- 확인 메시지 -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                ご入金を確認いたしました。<br>
                これより商品の準備を開始し、発送時に別途ご案内いたします。
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
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">ご入金確認日時</p>
                          <p style="margin: 6px 0 0 0; font-size: 18px; color: #111827; font-weight: 700;">${formattedConfirmed}</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">お振込金額</p>
                          <p style="margin: 6px 0 0 0; font-size: 24px; color: #10b981; font-weight: 700;">${formattedAmount}円</p>
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
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 700;">今後の流れ</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #4b5563;">
                <li>商品の準備が整い次第、発送いたします。</li>
                <li>発送時に追跡番号とあわせてお知らせいたします。</li>
                <li>配送状況はご注文履歴ページでご確認いただけます。</li>
                <li>お届け予定期間は営業日で10〜14日です。</li>
              </ul>
            </td>
          </tr>

          <!-- CTA 버튼 -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || "https://example.com"}/orders" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                ご注文履歴を確認する
              </a>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                このメールは送信専用です。お問い合わせはカスタマーサポートまでお願いいたします。<br>
                © 2026 ソウルモノ. All rights reserved.
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
