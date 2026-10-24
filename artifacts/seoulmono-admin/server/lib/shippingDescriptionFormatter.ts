/**
 * 배송 이력 상세설명 포맷팅 유틸리티
 * 
 * 우체국 크롤링 데이터의 불필요한 공백, 탭, 캐리지리턴, 빈 쉼표를 제거하고
 * 처리현황명을 사용자 친화적으로 변환합니다.
 */

/**
 * 처리현황명을 사용자 친화적으로 변환
 */
const STATUS_DISPLAY_MAP: Record<string, string> = {
  "발송준비": "항공발송",
  "발송교환국에도착": "발송교환국 도착",
  "교환국도착": "국내 도착",
  "교환국 도착": "국내 도착",
  "배달준비": "배송 시작",
};

/** 제거할 불필요한 내부 코드 필드 */
const REMOVE_FIELDS = ["발송횟수", "운송편명"];

export function mapStatusDisplay(processStatus: string): string {
  return STATUS_DISPLAY_MAP[processStatus] || processStatus;
}

/**
 * 우체국 크롤링 details 텍스트를 정리
 * 
 * 전략:
 * 1. 제어문자(\r, \n, \t) 제거
 * 2. 쉼표로 split → 빈 항목 제거
 * 3. "키:" 로 끝나는 항목과 다음 값 항목 합치기
 * 4. 불필요한 내부 코드 필드(발송횟수, 운송편명) 제거
 * 5. 값이 없는 "키:" 패턴 제거
 * 6. " - "로 join
 */
export function cleanKoreaPostDetails(rawDetails: string): string {
  if (!rawDetails) return "";

  let text = rawDetails;

  // "(집배원 정보 보기)" 텍스트 제거 (split 전에 처리)
  text = text.replace(/\(집배원 정보 보기\)/g, "");

  // 제어 문자 → 공백
  text = text.replace(/[\r\n\t]/g, " ");

  // 쉼표로 분리하고 빈 항목 제거
  const parts = text.split(",").map(s => s.trim()).filter(s => s.length > 0);

  // "키:" 로 끝나는 항목과 다음 값 항목 합치기
  const merged: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].endsWith(":") && i + 1 < parts.length && !parts[i + 1].includes(":")) {
      merged.push(parts[i] + " " + parts[i + 1]);
      i++;
    } else {
      merged.push(parts[i]);
    }
  }

  // 불필요한 내부 코드 필드 제거
  const filtered = merged.filter(item => {
    return !REMOVE_FIELDS.some(f => item.startsWith(f + " :") || item.startsWith(f + ":"));
  });

  // 값이 없는 "키:" 패턴 제거
  const cleaned = filtered.filter(item => {
    return !/^.+?\s*:\s*$/.test(item);
  });

  // "배달준비 배달준비" 같은 중복 제거
  const result = cleaned.join(" - ").replace(/배달준비\s+배달준비/g, "배달준비");

  // 연속 공백 정리
  return result.replace(/\s{2,}/g, " ").trim();
}

/**
 * 전체 description 포맷팅 (processStatus - postOffice (details) 형식)
 * 
 * 입력: "접수 - IN400099 (접수우체국우편번호 :\r, IN400099, \r, ...)"
 * 출력: "접수 - IN400099 (접수우체국우편번호 : IN400099 - 중계국 또는 도착국가 : 대한민국(KR))"
 */
export function formatShippingDescription(description: string): string {
  if (!description) return "";

  // "상태 - 위치 (상세)" 패턴 매칭
  const match = description.match(/^(.+?)\s*-\s*(.+?)\s*\(([\s\S]+)\)\s*$/);
  if (match) {
    const [, rawStatus, location, rawDetails] = match;
    const status = mapStatusDisplay(rawStatus.trim());
    const details = cleanKoreaPostDetails(rawDetails);
    
    if (details) {
      return `${status} - ${location.trim()} (${details})`;
    }
    return `${status} - ${location.trim()}`;
  }

  // "상태 - 위치" 패턴 (상세 없음)
  const simpleMatch = description.match(/^(.+?)\s*-\s*(.+)$/);
  if (simpleMatch) {
    const [, rawStatus, location] = simpleMatch;
    const status = mapStatusDisplay(rawStatus.trim());
    return `${status} - ${location.trim()}`;
  }

  return description;
}

/**
 * 우체국 크롤링 이벤트에서 DB 저장용 description 생성
 * (저장 시점에 포맷팅 적용)
 */
export function buildKoreaPostDescription(
  processStatus: string,
  postOffice: string,
  details: string
): string {
  const displayStatus = mapStatusDisplay(processStatus);
  
  if (!details) {
    return `${displayStatus} - ${postOffice}`;
  }

  const cleanedDetails = cleanKoreaPostDetails(details.replace(/\n/g, ", "));
  
  if (cleanedDetails) {
    return `${displayStatus} - ${postOffice} (${cleanedDetails})`;
  }
  
  return `${displayStatus} - ${postOffice}`;
}
