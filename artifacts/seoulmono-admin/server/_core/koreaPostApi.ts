/**
 * 우체국 국제우편(EMS) 배송조회 - 사이트 직접 크롤링
 * 
 * 공공데이터포털 API가 불안정하여 우체국 사이트를 직접 크롤링합니다.
 * URL: https://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm?POST_CODE={trackingNumber}
 */

import { execSync } from "child_process";

export interface KoreaPostEvent {
  processDate: string;      // "2026.02.03 09:42"
  processStatus: string;    // "통관검사대기"
  postOffice: string;       // "국제우편물류센터"
  details: string;          // "인천공항본부세관\n통관번호:242471"
  isAlert: boolean;         // 빨간색 표시 여부 (통관 문제)
}

export interface CustomsInfo {
  customsOffice: string;    // "인천공항본부세관"
  customsNumber: string;    // "242471"
  detectedAt: string;       // "2026.02.03 09:42"
}

export interface KoreaPostTrackingResult {
  trackingNumber: string;
  deliveryResult: string;   // "통관검사대기", "배달완료" 등
  serviceType: string;      // "국제등기" 등
  events: KoreaPostEvent[];
  customsInfo: CustomsInfo | null;  // 통관 문제 시 세관 정보
  hasCustomsIssue: boolean;         // 통관 문제 여부
  mappedStatus: string;             // 시스템 상태 매핑 결과
}

const KOREA_POST_URL = "https://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm";

/**
 * 우체국 사이트에서 국제우편 배송 정보 크롤링
 */
export async function getKoreaPostTracking(trackingNumber: string): Promise<KoreaPostTrackingResult | null> {
  // 1차: Node.js fetch 시도
  try {
    console.log(`[KoreaPost] Crawling tracking info for ${trackingNumber} (fetch)`);
    const url = `${KOREA_POST_URL}?POST_CODE=${encodeURIComponent(trackingNumber)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (response.ok) {
      const html = await response.text();
      return parseKoreaPostHtml(html, trackingNumber);
    }
    console.error(`[KoreaPost] HTTP ${response.status} for ${trackingNumber}`);
  } catch (error: any) {
    console.warn(`[KoreaPost] fetch failed for ${trackingNumber}: ${error.message}`);
  }

  // 2차: curl 폴백 (TLS 호환성 문제 우회)
  try {
    console.log(`[KoreaPost] Falling back to curl for ${trackingNumber}`);
    const url = `${KOREA_POST_URL}?POST_CODE=${encodeURIComponent(trackingNumber)}`;
    const html = execSync(
      `curl -s --connect-timeout 5 --max-time 8 "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Accept-Language: ko-KR,ko;q=0.9"`,
      { encoding: "utf-8", timeout: 10000 }
    );
    if (html && html.length > 1000) {
      console.log(`[KoreaPost] curl success for ${trackingNumber}, ${html.length} chars`);
      return parseKoreaPostHtml(html, trackingNumber);
    }
    console.error(`[KoreaPost] curl returned empty/short response for ${trackingNumber}`);
  } catch (error: any) {
    console.error(`[KoreaPost] curl also failed for ${trackingNumber}: ${error.message}`);
  }

  return null;
}

/**
 * 우체국 HTML 파싱
 */
export function parseKoreaPostHtml(html: string, trackingNumber: string = "TEST"): KoreaPostTrackingResult | null {
  // ─── Table 1: 기본 정보 (배달결과, 서비스종류) ───
  let deliveryResult = "";
  let serviceType = "";

  // 첫 번째 테이블에서 배달결과 추출
  const table1Match = html.match(/<table[^>]*>[\s\S]*?<\/table>/);
  if (table1Match) {
    const table1 = table1Match[0];
    const rows1 = table1.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    
    if (rows1.length >= 2) {
      const dataCells = extractCellTexts(rows1[1]);
      // 순서: EMS번호, 보내는분/접수일자, 받는분, 수령인/배달일자, 배달결과, 서비스종류
      if (dataCells.length >= 6) {
        deliveryResult = dataCells[4].trim();
        serviceType = dataCells[5].trim();
      }
    }
  }

  // ─── Table 2: 배송 이력 ───
  const events: KoreaPostEvent[] = [];
  let customsInfo: CustomsInfo | null = null;
  let hasCustomsIssue = false;

  // 이벤트 테이블 찾기 (두 번째 테이블 또는 "처리현황" 헤더가 있는 테이블)
  const allTables = html.match(/<table[^>]*>[\s\S]*?<\/table>/g) || [];
  let eventTable: string | null = null;
  // 처리현황 헤더가 있는 테이블 우선 탐색
  for (const t of allTables) {
    if (t.includes("처리현황") || t.includes("처리일시")) {
      eventTable = t;
      break;
    }
  }
  // 없으면 두 번째 테이블 사용
  if (!eventTable && allTables.length >= 2) {
    eventTable = allTables[1];
  }
  // 그래도 없으면 첫 번째 테이블이 이벤트 테이블인지 확인
  if (!eventTable && allTables.length === 1 && (allTables[0].includes("처리현황") || allTables[0].includes("처리일시"))) {
    eventTable = allTables[0];
  }
  if (eventTable) {
    const table2 = eventTable;
    const rows2 = table2.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];

    for (let i = 1; i < rows2.length; i++) { // 헤더 행 건너뛰기
      const row = rows2[i];
      const cells = extractCellTexts(row);
      
      if (cells.length < 3) continue;

      const processDate = cells[0].trim();
      const processStatus = cells[1].trim();
      const postOffice = cells[2].trim();
      const details = cells.length >= 4 ? cells[3].trim() : "";

      // 빨간색 표시 감지 (style에 red, color:#ff, color:#F 등)
      const isAlert = checkRedAlert(row);

      const event: KoreaPostEvent = {
        processDate,
        processStatus,
        postOffice,
        details,
        isAlert,
      };
      events.push(event);

      // 통관 문제 감지: "통관검사대기" + 빨간색 표시 또는 세관 정보
      if (processStatus.includes("통관검사대기")) {
        hasCustomsIssue = true;

        // 세관명 및 통관번호 추출
        const parsed = parseCustomsDetails(details);
        if (parsed) {
          customsInfo = {
            customsOffice: parsed.customsOffice,
            customsNumber: parsed.customsNumber,
            detectedAt: processDate,
          };
        } else {
          // 세관 정보가 없더라도 통관검사대기면 문제로 간주
          customsInfo = {
            customsOffice: postOffice,
            customsNumber: "",
            detectedAt: processDate,
          };
        }
      }
    }
  }

  if (events.length === 0 && !deliveryResult) {
    console.log(`[KoreaPost] No tracking data found for ${trackingNumber}`);
    return null;
  }

  // 시스템 상태 매핑
  const mappedStatus = mapKoreaPostStatus(events, hasCustomsIssue, deliveryResult);

  console.log(`[KoreaPost] ${trackingNumber}: ${events.length} events, customsIssue=${hasCustomsIssue}, status=${mappedStatus}`);
  if (customsInfo) {
    console.log(`[KoreaPost] Customs: ${customsInfo.customsOffice} #${customsInfo.customsNumber} (detected: ${customsInfo.detectedAt})`);
  }

  return {
    trackingNumber,
    deliveryResult,
    serviceType,
    events,
    customsInfo,
    hasCustomsIssue,
    mappedStatus,
  };
}

/**
 * 우체국 이벤트를 시스템 상태로 매핑
 */
export function mapKoreaPostStatus(
  events: KoreaPostEvent[],
  hasCustomsIssue: boolean = false,
  deliveryResult: string = ""
): string {
  // 통관검사 문제가 있으면 무조건 customs_hold
  if (hasCustomsIssue) {
    return "customs_hold";
  }

  // 배달결과 필드 기반 판단
  if (deliveryResult) {
    const dr = deliveryResult.toLowerCase();
    if (dr.includes("배달완료") || dr.includes("delivered")) return "delivered";
    if (dr.includes("통관검사")) return "customs_hold";
  }

  // 최신 이벤트 기반 판단 (이벤트는 시간순 - 마지막이 최신)
  if (events.length === 0) return "accepted";

  const latestEvent = events[events.length - 1];
  const status = latestEvent.processStatus;

  // 통관검사대기
  if (status.includes("통관검사대기")) return "customs_hold";

  // 배달완료
  if (status.includes("배달완료") || status.includes("delivered")) return "delivered";

  // 배달출발
  if (status.includes("배달출발") || status.includes("배달준비")) return "out_for_delivery";

  // 통관 관련
  if (status.includes("통관")) {
    if (status.includes("도착") || latestEvent.postOffice.includes("국제우편물류센터")) return "import_customs";
    if (status.includes("출발")) return "export_customs";
    return "import_customs";
  }

  // 교환국 도착
  if (status.includes("교환국") && status.includes("도착")) return "arrived_destination";

  // 발송 관련
  if (status.includes("발송") || status.includes("출발") || status.includes("도착")) return "in_transit_intl";

  // 접수
  if (status.includes("접수")) return "accepted";

  return "in_transit_intl";
}

/**
 * 세관 정보 파싱: "인천공항본부세관통관번호:242471" → { customsOffice, customsNumber }
 */
function parseCustomsDetails(details: string): { customsOffice: string; customsNumber: string } | null {
  if (!details) return null;

  let customsOffice = "";
  let customsNumber = "";

  // "인천공항본부세관" 등 세관명 추출
  const officeMatch = details.match(/([\uAC00-\uD7AF]+세관)/);
  if (officeMatch) {
    customsOffice = officeMatch[1];
  }

  // "통관번호:242471" 추출
  const numberMatch = details.match(/통관번호\s*[:：]\s*(\d+)/);
  if (numberMatch) {
    customsNumber = numberMatch[1];
  }

  if (customsOffice || customsNumber) {
    return { customsOffice, customsNumber };
  }

  return null;
}

/**
 * HTML 행에서 빨간색 표시 감지
 */
function checkRedAlert(rowHtml: string): boolean {
  // style 속성에서 red 색상 감지
  const redPatterns = [
    /color\s*:\s*red/i,
    /color\s*:\s*#[fF]{2}0{4}/,      // #FF0000
    /color\s*:\s*#[fF]00/,            // #F00
    /color\s*:\s*rgb\s*\(\s*255/,     // rgb(255,0,0)
    /<font[^>]*color\s*=\s*["']?red/i,
    /<font[^>]*color\s*=\s*["']?#[fF]{2}0/,
    /class\s*=\s*["'][^"']*red/i,
    /class\s*=\s*["'][^"']*danger/i,
    /class\s*=\s*["'][^"']*alert/i,
  ];

  return redPatterns.some(pattern => pattern.test(rowHtml));
}

/**
 * HTML 행에서 셀 텍스트 추출
 */
function extractCellTexts(rowHtml: string): string[] {
  const cells = rowHtml.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || [];
  return cells.map(cell => {
    // HTML 태그 제거하고 텍스트만 추출
    return cell
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  });
}
