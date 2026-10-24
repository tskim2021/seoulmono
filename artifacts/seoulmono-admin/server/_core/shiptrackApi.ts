/**
 * shiptrack.co.kr 배송조회 스크래퍼
 * CJ Korea Express (cjkorex) 등 국내 택배 조회 지원
 * URL: https://track.shiptrack.co.kr/{carrierCode}/{trackingNumber}
 */

import { execSync } from "child_process";

export interface ShiptrackEvent {
  date: string;        // "2026-05-30 08:31"
  status: string;      // "입항"
  source: string;      // "관세청"
  location: string;    // "부산항"
}

export interface ShiptrackResult {
  trackingNumber: string;
  carrierCode: string;
  events: ShiptrackEvent[];
  latestStatus: string;
  mappedStatus: string;
}

const SHIPTRACK_BASE = "https://track.shiptrack.co.kr";

/** 순수 숫자 10~12자리 → cjkorex 추정 */
export function isCjKorexNumber(trackingNumber: string): boolean {
  return /^\d{10,13}$/.test(trackingNumber.trim());
}

/** HTML 태그 제거 및 공백 정리 */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * 주어진 carrier 코드 아래 tracking number가 포함된 HTML에서 이벤트 파싱
 *
 * 실제 HTML 구조:
 * <li class="timeline-inverted">
 *   <div class="timeline-date">2026-05-30<span ...>08:31</span></div>
 *   <div class="timeline-badge ...">...</div>
 *   <div class="timeline-panel">
 *     <div class="timeline-body">
 *       입항
 *       <span class="sht-event-src">관세청</span>
 *       <span class="location">부산항</span>
 *       <span class="location">PANSTAR MIRACLE [...]</span>
 *     </div>
 *   </div>
 * </li>
 */
function parseShiptrackHtml(html: string, trackingNumber: string, carrierCode: string): ShiptrackResult | null {
  const events: ShiptrackEvent[] = [];

  // timeline-inverted li 단위로 분리
  const liPattern = /<li class="timeline-inverted">([\s\S]*?)<\/li>/g;
  let match;

  while ((match = liPattern.exec(html)) !== null) {
    const block = match[1];

    // 날짜/시간 파싱: <div class="timeline-date">2026-05-30<span ...>08:31</span>
    const dateMatch = block.match(/<div class="timeline-date">\s*([0-9\-]+)\s*<span[^>]*>\s*([0-9:]+)\s*<\/span>/);
    const datePart = dateMatch?.[1]?.trim() ?? "";
    const timePart = dateMatch?.[2]?.trim() ?? "";
    const dateStr = datePart && timePart ? `${datePart} ${timePart}` : datePart;

    if (!dateStr) continue;

    // timeline-body 전체 내용 추출 (lazy match — timeline-body 안엔 nested div 없음)
    const bodyMatch = block.match(/<div class="timeline-body">([\s\S]*?)<\/div>/);
    const bodyRaw = bodyMatch?.[1] ?? "";

    // sht-event-src 출처 추출
    const srcMatch = bodyRaw.match(/<span class="sht-event-src">([\s\S]*?)<\/span>/);
    const source = srcMatch ? stripTags(srcMatch[1]) : "";

    // 첫 번째 location span 추출
    const locationMatch = bodyRaw.match(/<span class="location">([\s\S]*?)<\/span>/);
    const location = locationMatch ? stripTags(locationMatch[1]) : "";

    // 이벤트 텍스트: sht-event-src 이전의 텍스트 노드
    // (spans를 모두 제거하고 남은 직접 텍스트)
    const beforeSrc = srcMatch
      ? bodyRaw.slice(0, bodyRaw.indexOf(srcMatch[0]))
      : bodyRaw.replace(/<span class="location"[^>]*>[\s\S]*?<\/span>/g, "");
    const status = stripTags(beforeSrc);

    if (status) {
      events.push({ date: dateStr, status, source, location });
    }
  }

  if (events.length === 0) return null;

  const latestStatus = events[0]?.status ?? "";
  const mappedStatus = mapShiptrackStatus(latestStatus);

  return { trackingNumber, carrierCode, events, latestStatus, mappedStatus };
}

function mapShiptrackStatus(status: string): string {
  const s = status.replace(/\s/g, "");
  if (/배달완료|배달됨/.test(s)) return "delivered";
  if (/배달중|배달출발|배달준비/.test(s)) return "out_for_delivery";
  if (/통관완료|세관통과|통관목록접수/.test(s)) return "customs_cleared";
  if (/통관|세관/.test(s)) return "import_customs";
  if (/입항|도착국도착|국내도착/.test(s)) return "arrived_destination";
  if (/출항|출발교환국출발|항공기출발/.test(s)) return "in_transit_intl";
  if (/접수|발송/.test(s)) return "accepted";
  return "in_transit";
}

export async function getShiptrackTracking(
  trackingNumber: string,
  carrierCode = "cjkorex"
): Promise<ShiptrackResult | null> {
  const url = `${SHIPTRACK_BASE}/${carrierCode}/${encodeURIComponent(trackingNumber)}`;

  // 1차: fetch
  try {
    console.log(`[Shiptrack] Crawling ${carrierCode}/${trackingNumber} (fetch)`);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const html = await res.text();
      const result = parseShiptrackHtml(html, trackingNumber, carrierCode);
      if (result) {
        console.log(`[Shiptrack] 조회 성공: ${trackingNumber}, 이벤트 수: ${result.events.length}`);
        return result;
      } else {
        console.log(`[Shiptrack] HTML 파싱 실패 또는 이벤트 없음 (HTML 길이: ${html.length})`);
      }
    }
  } catch (e: any) {
    console.warn(`[Shiptrack] fetch 실패: ${e.message}`);
  }

  // 2차: curl 폴백
  try {
    console.log(`[Shiptrack] Falling back to curl for ${trackingNumber}`);
    const html = execSync(
      `curl -s --connect-timeout 6 --max-time 10 "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Accept-Language: ko-KR,ko;q=0.9"`,
      { encoding: "utf-8", timeout: 12000 }
    );
    if (html && html.length > 500) {
      const result = parseShiptrackHtml(html, trackingNumber, carrierCode);
      if (result) {
        console.log(`[Shiptrack] curl 성공: ${trackingNumber}, 이벤트 수: ${result.events.length}`);
        return result;
      }
    }
  } catch (e: any) {
    console.error(`[Shiptrack] curl 실패: ${e.message}`);
  }

  return null;
}
