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
        subject: `[탈모학교] 주문하신 상품이 픽업되었습니다 (주문번호: ${orderNumber})`,
        body: `
안녕하세요 ${customerName}님,

주문하신 상품이 택배사에 픽업되어 배송이 시작되었습니다.

📦 주문 정보
- 주문번호: ${orderNumber}
- 운송장번호: ${trackingNumber}
- 배송 상태: ${statusText}
${estimatedDeliveryDate ? `- 예상 배송일: ${estimatedDeliveryDate.toLocaleDateString('ko-KR')}` : ''}

마이페이지에서 실시간 배송 추적이 가능합니다.

감사합니다.
탈모학교 드림
        `.trim(),
      };
    
    case "in_transit":
    case "in_transit_intl":
    case "in_transit_domestic":
      return {
        subject: `[탈모학교] 주문하신 상품이 배송 중입니다 (주문번호: ${orderNumber})`,
        body: `
안녕하세요 ${customerName}님,

주문하신 상품이 현재 배송 중입니다.

📦 주문 정보
- 주문번호: ${orderNumber}
- 운송장번호: ${trackingNumber}
- 배송 상태: ${statusText}
${estimatedDeliveryDate ? `- 예상 배송일: ${estimatedDeliveryDate.toLocaleDateString('ko-KR')}` : ''}

마이페이지에서 실시간 배송 추적이 가능합니다.

감사합니다.
탈모학교 드림
        `.trim(),
      };
    
    case "out_for_delivery":
      return {
        subject: `[탈모학교] 주문하신 상품이 배송 중입니다 - 곧 도착합니다! (주문번호: ${orderNumber})`,
        body: `
안녕하세요 ${customerName}님,

주문하신 상품이 고객님께 배송되고 있습니다.
오늘 중 도착 예정입니다!

📦 주문 정보
- 주문번호: ${orderNumber}
- 운송장번호: ${trackingNumber}
- 배송 상태: ${statusText}

마이페이지에서 실시간 배송 추적이 가능합니다.

감사합니다.
탈모학교 드림
        `.trim(),
      };
    
    case "delivered":
      return {
        subject: `[탈모학교] 주문하신 상품이 배송 완료되었습니다 (주문번호: ${orderNumber})`,
        body: `
안녕하세요 ${customerName}님,

주문하신 상품이 성공적으로 배송 완료되었습니다.

📦 주문 정보
- 주문번호: ${orderNumber}
- 운송장번호: ${trackingNumber}
- 배송 상태: ${statusText}

상품은 만족하셨나요?
마이페이지에서 리뷰를 작성하시면 포인트를 적립해드립니다!

감사합니다.
탈모학교 드림
        `.trim(),
      };
    
    default:
      return {
        subject: `[탈모학교] 배송 상태가 업데이트되었습니다 (주문번호: ${orderNumber})`,
        body: `
안녕하세요 ${customerName}님,

주문하신 상품의 배송 상태가 업데이트되었습니다.

📦 주문 정보
- 주문번호: ${orderNumber}
- 운송장번호: ${trackingNumber}
- 배송 상태: ${statusText}

마이페이지에서 실시간 배송 추적이 가능합니다.

감사합니다.
탈모학교 드림
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
      title: `배송 알림 발송: ${data.orderNumber}`,
      content: `${data.customerName}(${data.customerEmail})님께 ${data.statusText} 알림 이메일 발송됨`,
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
