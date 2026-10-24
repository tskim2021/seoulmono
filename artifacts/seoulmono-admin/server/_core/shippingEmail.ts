/**
 * 배송 상태 변경 시 고객 이메일 알림
 */

import { notifyOwner } from "./notification";

export interface ShippingEmailData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  status: string;
  statusText: string;
  estimatedDeliveryDate?: Date;
}

/**
 * 배송 상태별 이메일 제목 및 내용 생성
 */
function getEmailContent(data: ShippingEmailData): { subject: string; body: string } {
  const { customerName, orderNumber, trackingNumber, statusText, estimatedDeliveryDate } = data;
  
  switch (data.status) {
    case "picked_up":
      return {
        subject: `[ソウルモノ] ご注文商品が集荷されました (ご注文番号: ${orderNumber})`,
        body: `
${customerName}様

いつもご利用ありがとうございます。

ご注文の商品が配送業者に集荷され、配送が始まりました。

📦 ご注文情報
- ご注文番号: ${orderNumber}
- 追跡番号: ${trackingNumber}
- 配送状況: ${statusText}
${estimatedDeliveryDate ? `- 配送予定日: ${estimatedDeliveryDate.toLocaleDateString('ja-JP')}` : ''}

マイページでリアルタイムの配送追跡をご確認いただけます。

ご利用ありがとうございました。
ソウルモノ
        `.trim(),
      };
    
    case "in_transit":
    case "in_transit_intl":
    case "in_transit_domestic":
      return {
        subject: `[ソウルモノ] ご注文商品を配送中です (ご注文番号: ${orderNumber})`,
        body: `
${customerName}様

いつもご利用ありがとうございます。

ご注文の商品は現在配送中です。

📦 ご注文情報
- ご注文番号: ${orderNumber}
- 追跡番号: ${trackingNumber}
- 配送状況: ${statusText}
${estimatedDeliveryDate ? `- 配送予定日: ${estimatedDeliveryDate.toLocaleDateString('ja-JP')}` : ''}

マイページでリアルタイムの配送追跡をご確認いただけます。

ご利用ありがとうございました。
ソウルモノ
        `.trim(),
      };
    
    case "out_for_delivery":
      return {
        subject: `[ソウルモノ] ご注文商品を配達中です - まもなく到着します！ (ご注文番号: ${orderNumber})`,
        body: `
${customerName}様

いつもご利用ありがとうございます。

ご注文の商品をお客様のもとへ配達しています。
本日中にお届け予定です！

📦 ご注文情報
- ご注文番号: ${orderNumber}
- 追跡番号: ${trackingNumber}
- 配送状況: ${statusText}

マイページでリアルタイムの配送追跡をご確認いただけます。

ご利用ありがとうございました。
ソウルモノ
        `.trim(),
      };
    
    case "delivered":
      return {
        subject: `[ソウルモノ] ご注文商品の配送が完了しました (ご注文番号: ${orderNumber})`,
        body: `
${customerName}様

いつもご利用ありがとうございます。

ご注文の商品が無事に配送完了いたしました。

📦 ご注文情報
- ご注文番号: ${orderNumber}
- 追跡番号: ${trackingNumber}
- 配送状況: ${statusText}

商品はいかがでしたか？
マイページからレビューを投稿いただくと、ポイントを付与いたします！

ご利用ありがとうございました。
ソウルモノ
        `.trim(),
      };
    
    default:
      return {
        subject: `[ソウルモノ] 配送状況が更新されました (ご注文番号: ${orderNumber})`,
        body: `
${customerName}様

いつもご利用ありがとうございます。

ご注文商品の配送状況が更新されました。

📦 ご注文情報
- ご注文番号: ${orderNumber}
- 追跡番号: ${trackingNumber}
- 配送状況: ${statusText}

マイページでリアルタイムの配送追跡をご確認いただけます。

ご利用ありがとうございました。
ソウルモノ
        `.trim(),
      };
  }
}

/**
 * 배송 상태 변경 이메일 발송
 * 실제 이메일 서비스가 없으므로 notifyOwner로 대체
 */
export async function sendShippingStatusEmail(data: ShippingEmailData): Promise<boolean> {
  try {
    const { subject, body } = getEmailContent(data);
    
    console.log(`[ShippingEmail] Sending email to ${data.customerEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    
    // 실제 이메일 서비스 연동 시 여기서 발송
    // 현재는 관리자에게 알림으로 전달
    await notifyOwner({
      title: `配送通知を送信: ${data.orderNumber}`,
      content: `${data.customerName}(${data.customerEmail})様へ ${data.statusText} の通知メールを送信しました`,
    });
    
    return true;
  } catch (error) {
    console.error("[ShippingEmail] Failed to send email:", error);
    return false;
  }
}

/**
 * 알림을 발송해야 하는 상태인지 확인
 */
export function shouldSendEmailForStatus(status: string): boolean {
  const notifiableStatuses = [
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
  ];
  return notifiableStatuses.includes(status);
}
