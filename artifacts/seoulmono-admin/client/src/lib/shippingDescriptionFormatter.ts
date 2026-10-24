/**
 * 배송 이력 상세설명 프론트엔드 포맷팅 유틸리티
 * 기존 DB에 저장된 지저분한 description을 깔끔하게 표시합니다.
 */

/** 英語配送ステータス → 日本語翻訳マップ (대소문자 무시, 부분 매칭) */
const EN_KO_MAP: [RegExp, string][] = [
  // ── 배달 완료 / 배달 ─────────────────────────────────────────
  [/^delivered$/i,                                      "配達完了"],
  [/^out\s*for\s*delivery/i,                            "配達に出発"],
  [/^item\s*received\s*at\s*delivery\s*office/i,        "配達局に到着"],
  [/^delivery\s*attempt/i,                              "配達試行"],
  [/^delivery\s*failed/i,                               "配達失敗"],
  [/^delivery\s*exception/i,                            "配達異常"],
  [/^undeliverable/i,                                   "配達不能"],
  [/^addressee\s*not\s*at\s*home/i,                     "不在"],
  [/^notice\s*left/i,                                   "不在票投函"],
  [/^held\s*at\s*post\s*office/i,                       "郵便局で保管中"],
  [/^available\s*for\s*pickup/i,                        "受取可能"],

  // ── 항공기 관련 ───────────────────────────────────────────────
  [/^aircraft\s*departure/i,                            "航空機出発"],
  [/^aircraft\s*arrival/i,                              "航空機到着"],
  [/^on\s*board\s*aircraft/i,                           "航空機搭載"],
  [/^loaded\s*on\s*flight/i,                            "航空機搭載"],
  [/^flight\s*departure/i,                              "航空機出発"],
  [/^flight\s*arrival/i,                                "航空機到着"],
  [/^bag\s*unloaded\s*at\s*destination\s*airport/i,     "到着空港で荷降ろし完了"],
  [/^bag\s*unloaded/i,                                  "航空機荷降ろし完了"],
  [/^loaded$/i,                                         "積込完了"],
  [/^assigned\s*to\s*load\s*plan/i,                     "貨物積載割当"],

  // ── 교환국 ────────────────────────────────────────────────────
  [/^arrival\s*at\s*office\s*of\s*exchange/i,           "国際交換局に到着"],
  [/^departure\s*from\s*office\s*of\s*exchange/i,       "国際交換局を出発"],
  [/^departed\s*from\s*office\s*of\s*exchange/i,        "国際交換局を出発"],
  [/^office\s*of\s*exchange\s*arrival/i,                "国際交換局に到着"],
  [/^office\s*of\s*exchange\s*departure/i,              "国際交換局を出発"],

  // ── 접수 / 수거 ───────────────────────────────────────────────
  [/^acceptance$/i,                                     "受付"],
  [/^accepted$/i,                                       "受付"],
  [/^posted$/i,                                         "発送"],
  [/^dispatched$/i,                                     "発送"],
  [/^picked\s*up$/i,                                    "集荷完了"],
  [/^pick\s*up$/i,                                      "集荷"],
  [/^collection$/i,                                     "集荷"],
  [/^collected$/i,                                      "集荷完了"],
  [/^package\s*received/i,                              "荷物受付"],
  [/^package\s*accepted/i,                              "荷物受付"],
  [/^package\s*processed/i,                             "処理完了"],
  [/^processing\s*complete/i,                           "処理完了"],
  [/^shipment\s*information\s*received/i,               "送り状登録"],
  [/^shipment\s*information\s*sent/i,                   "送り状登録"],
  [/^label\s*created/i,                                 "ラベル作成"],

  // ── 운송 중 ───────────────────────────────────────────────────
  [/^in\s*transit\s*to\s*destination/i,                 "目的地へ輸送中"],
  [/^in\s*transit$/i,                                   "輸送中"],
  [/^forwarded/i,                                       "転送"],
  [/^transfer$/i,                                       "移送"],
  [/^transferred$/i,                                    "移送完了"],
  [/^arrived\s*at\s*destination/i,                      "到着国に到着"],
  [/^arrived\s*at\s*post\s*office/i,                    "郵便局に到着"],
  [/^arrived\s*at\s*hub/i,                              "ハブに到着"],
  [/^arrived\s*at\s*sort\s*facility/i,                  "仕分けセンターに到着"],
  [/^sorting\s*complete/i,                              "仕分け完了"],

  // ── 통관 ──────────────────────────────────────────────────────
  [/^customs\s*clearance\s*complete/i,                  "通関完了"],
  [/^customs\s*clearance\s*started/i,                   "通関手続き中"],
  [/^customs\s*clearance/i,                             "通関"],
  [/^cleared\s*customs/i,                               "通関完了"],
  [/^held\s*by\s*customs/i,                             "税関で保留"],
  [/^import\s*customs/i,                                "輸入通関"],
  [/^export\s*customs/i,                                "輸出通関"],
  [/^customs$/i,                                        "通関"],
  [/^handed\s*over\s*to\s*customs/i,                    "税関へ引渡し"],
  [/^released\s*by\s*customs/i,                         "税関通過"],
  [/^waiting\s*for\s*clearance/i,                       "通関待ち"],

  // ── 반송 ──────────────────────────────────────────────────────
  [/^returned\s*to\s*sender/i,                          "返送"],
  [/^return\s*to\s*sender/i,                            "返送"],
  [/^returned$/i,                                       "返送"],
];

function translateEnglish(text: string): string {
  for (const [pattern, korean] of EN_KO_MAP) {
    if (pattern.test(text.trim())) return korean;
  }
  return text;
}

const STATUS_DISPLAY_MAP: Record<string, string> = {
  "발송준비": "航空発送",
  "발송교환국에도착": "発送交換局に到着",
  "교환국도착": "国内到着",
  "교환국 도착": "国内到着",
  "배달준비": "配達開始",
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
