/**
 * 배송 이력 상세설명 프론트엔드 포맷팅 유틸리티
 * 기존 DB에 저장된 지저분한 description을 깔끔하게 표시합니다.
 */

/** 영어 배송 상태 → 한국어 번역 맵 (대소문자 무시, 부분 매칭) */
const EN_KO_MAP: [RegExp, string][] = [
  // ── 배달 완료 / 배달 ─────────────────────────────────────────
  [/^delivered$/i,                                      "배달 완료"],
  [/^out\s*for\s*delivery/i,                            "배달 출발"],
  [/^item\s*received\s*at\s*delivery\s*office/i,        "배달 준비소 도착"],
  [/^delivery\s*attempt/i,                              "배달 시도"],
  [/^delivery\s*failed/i,                               "배달 실패"],
  [/^delivery\s*exception/i,                            "배달 이상"],
  [/^undeliverable/i,                                   "배달 불가"],
  [/^addressee\s*not\s*at\s*home/i,                     "부재중"],
  [/^notice\s*left/i,                                   "부재 안내 투입"],
  [/^held\s*at\s*post\s*office/i,                       "우체국 보관 중"],
  [/^available\s*for\s*pickup/i,                        "수령 가능"],

  // ── 항공기 관련 ───────────────────────────────────────────────
  [/^aircraft\s*departure/i,                            "항공기 출발"],
  [/^aircraft\s*arrival/i,                              "항공기 도착"],
  [/^on\s*board\s*aircraft/i,                           "항공기 탑재"],
  [/^loaded\s*on\s*flight/i,                            "항공기 탑재"],
  [/^flight\s*departure/i,                              "항공기 출발"],
  [/^flight\s*arrival/i,                                "항공기 도착"],
  [/^bag\s*unloaded\s*at\s*destination\s*airport/i,     "도착 공항 하역 완료"],
  [/^bag\s*unloaded/i,                                  "항공기 하역 완료"],
  [/^loaded$/i,                                         "적재 완료"],
  [/^assigned\s*to\s*load\s*plan/i,                     "화물 적재 배정"],

  // ── 교환국 ────────────────────────────────────────────────────
  [/^arrival\s*at\s*office\s*of\s*exchange/i,           "국제 교환국 도착"],
  [/^departure\s*from\s*office\s*of\s*exchange/i,       "국제 교환국 출발"],
  [/^departed\s*from\s*office\s*of\s*exchange/i,        "국제 교환국 출발"],
  [/^office\s*of\s*exchange\s*arrival/i,                "국제 교환국 도착"],
  [/^office\s*of\s*exchange\s*departure/i,              "국제 교환국 출발"],

  // ── 접수 / 수거 ───────────────────────────────────────────────
  [/^acceptance$/i,                                     "접수"],
  [/^accepted$/i,                                       "접수"],
  [/^posted$/i,                                         "발송"],
  [/^dispatched$/i,                                     "발송"],
  [/^picked\s*up$/i,                                    "수거 완료"],
  [/^pick\s*up$/i,                                      "수거"],
  [/^collection$/i,                                     "수거"],
  [/^collected$/i,                                      "수거 완료"],
  [/^package\s*received/i,                              "상품 접수"],
  [/^package\s*accepted/i,                              "상품 접수"],
  [/^package\s*processed/i,                             "처리 완료"],
  [/^processing\s*complete/i,                           "처리 완료"],
  [/^shipment\s*information\s*received/i,               "운송장 등록"],
  [/^shipment\s*information\s*sent/i,                   "운송장 등록"],
  [/^label\s*created/i,                                 "라벨 생성"],

  // ── 운송 중 ───────────────────────────────────────────────────
  [/^in\s*transit\s*to\s*destination/i,                 "목적지로 운송 중"],
  [/^in\s*transit$/i,                                   "운송 중"],
  [/^forwarded/i,                                       "전달"],
  [/^transfer$/i,                                       "이송"],
  [/^transferred$/i,                                    "이송 완료"],
  [/^arrived\s*at\s*destination/i,                      "도착국 도착"],
  [/^arrived\s*at\s*post\s*office/i,                    "우체국 도착"],
  [/^arrived\s*at\s*hub/i,                              "허브 도착"],
  [/^arrived\s*at\s*sort\s*facility/i,                  "분류 센터 도착"],
  [/^sorting\s*complete/i,                              "분류 완료"],

  // ── 통관 ──────────────────────────────────────────────────────
  [/^customs\s*clearance\s*complete/i,                  "통관 완료"],
  [/^customs\s*clearance\s*started/i,                   "통관 진행 중"],
  [/^customs\s*clearance/i,                             "통관"],
  [/^cleared\s*customs/i,                               "통관 완료"],
  [/^held\s*by\s*customs/i,                             "세관 보류"],
  [/^import\s*customs/i,                                "수입 통관"],
  [/^export\s*customs/i,                                "수출 통관"],
  [/^customs$/i,                                        "통관"],
  [/^handed\s*over\s*to\s*customs/i,                    "세관 인도"],
  [/^released\s*by\s*customs/i,                         "세관 통과"],
  [/^waiting\s*for\s*clearance/i,                       "통관 대기"],

  // ── 반송 ──────────────────────────────────────────────────────
  [/^returned\s*to\s*sender/i,                          "반송"],
  [/^return\s*to\s*sender/i,                            "반송"],
  [/^returned$/i,                                       "반송"],
];

function translateEnglish(text: string): string {
  for (const [pattern, korean] of EN_KO_MAP) {
    if (pattern.test(text.trim())) return korean;
  }
  return text;
}

const STATUS_DISPLAY_MAP: Record<string, string> = {
  "발송준비": "항공발송",
  "발송교환국에도착": "발송교환국 도착",
  "교환국도착": "국내 도착",
  "교환국 도착": "국내 도착",
  "배달준비": "배송 시작",
};

function mapStatusDisplay(status: string): string {
  return STATUS_DISPLAY_MAP[status] || translateEnglish(status);
}

function cleanDetails(rawDetails: string): string {
  if (!rawDetails) return "";

  let text = rawDetails;

  text = text.replace(/[\r\n\t]/g, " ");
  text = text.replace(/\s{2,}/g, " ");
  text = text.replace(/,\s*,/g, ",");
  text = text.replace(/,?\s*발송횟수\s*:\s*[A-Z0-9]+\s*/g, "");
  text = text.replace(/,?\s*운송편명\s*:\s*$/g, "");
  text = text.replace(/,?\s*운송편명\s*:\s*(?=\s*[-,)]|$)/g, "");
  text = text.replace(/\(집배원 정보 보기\)/g, "").trim();
  text = text.replace(/배달준비\s+배달준비/g, "배달준비");
  text = text.replace(/,\s*(?=\S+\s*(?:또는\s*\S+\s*)?:\s*)/g, " - ");
  text = text.replace(/^[\s,]+|[\s,]+$/g, "");
  text = text.replace(/\(\s*\)/g, "");
  text = text.replace(/\(\s*,\s*/g, "(");
  text = text.replace(/,\s*\)/g, ")");
  text = text.replace(/\s{2,}/g, " ").trim();
  text = text.replace(/,\s*$/, "").trim();
  text = text.replace(/\(\s*\)/g, "").trim();

  return text;
}

export function formatShippingDescription(description: string): string {
  if (!description) return "";

  // "상태 - 위치 (상세)" 패턴
  const match = description.match(/^(.+?)\s*-\s*(.+?)\s*\(([\s\S]+)\)\s*$/);
  if (match) {
    const [, rawStatus, location, rawDetails] = match;
    const status = mapStatusDisplay(rawStatus.trim());
    const details = cleanDetails(rawDetails);
    if (details) {
      return `${status} - ${location.trim()} (${details})`;
    }
    return `${status} - ${location.trim()}`;
  }

  // "상태 - 위치" 패턴
  const simpleMatch = description.match(/^(.+?)\s*-\s*(.+)$/);
  if (simpleMatch) {
    const [, rawStatus, location] = simpleMatch;
    const status = mapStatusDisplay(rawStatus.trim());
    return `${status} - ${location.trim()}`;
  }

  // 단독 상태 텍스트
  return mapStatusDisplay(description.trim());
}
