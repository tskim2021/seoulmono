// バックエンドが返す韓国語のステータス値を、画面表示用の日本語に変換するマップ。
// 比較ロジックには元の韓国語の値をそのまま使い、表示時のみここで変換する。

export const ORDER_STATUS_JA: Record<string, string> = {
  "주문접수": "注文受付",
  "주문완료": "注文完了",
  "입금대기": "入金待ち",
  "입금확인": "入金確認済み",
  "결제완료": "お支払い完了",
  "상품준비중": "商品準備中",
  "배송준비": "発送準備中",
  "배송중": "配送中",
  "배송완료": "配送完了",
  "주문취소": "注文キャンセル",
  "반품": "返品",
  "교환": "交換",
  "환불": "返金",
  "취소": "キャンセル",
  "처리중": "処理中",
};

export const CLAIM_TYPE_JA: Record<string, string> = {
  "교환": "交換",
  "반품": "返品",
  "환불": "返金",
  "취소": "キャンセル",
};

export const CLAIM_STATUS_JA: Record<string, string> = {
  "접수": "受付",
  "처리중": "処理中",
  "승인": "承認",
  "반려": "却下",
  "완료": "完了",
};

export const SETTLE_CASE_JA: Record<string, string> = {
  "무통장": "銀行振込",
  "무통장입금": "銀行振込",
  "신용카드": "クレジットカード",
  "카드": "クレジットカード",
  "계좌이체": "口座振替",
  "실시간계좌이체": "口座振替",
  "가상계좌": "仮想口座",
  "휴대폰": "携帯電話決済",
  "포인트": "ポイント",
};

export const orderStatusJa = (s: string) => ORDER_STATUS_JA[s] ?? s;
export const claimTypeJa = (s: string) => CLAIM_TYPE_JA[s] ?? s;
export const claimStatusJa = (s: string) => CLAIM_STATUS_JA[s] ?? s;
export const settleCaseJa = (s: string) => SETTLE_CASE_JA[s] ?? s;
