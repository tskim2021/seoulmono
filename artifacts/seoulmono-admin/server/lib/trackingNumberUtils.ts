/**
 * 운송장 번호 패턴 기반 국제/국내 배송 자동 감지 유틸리티
 * 
 * 국제우편 등기 번호 형식: 2글자 영문(서비스코드) + 9자리 숫자 + 2글자 국가코드
 * 예: LP081797327IN, RM060772744IN, EA123456789KR
 * 
 * 서비스 코드:
 * - LP: Letter Post (국제등기소포)
 * - LM: Letter Mail (국제등기우편)
 * - EA/EM/EX: EMS (국제특급우편)
 * - RM/RR: Registered Mail (국제등기우편)
 * - CP/CX: Parcel (국제소포)
 * - RB/RC/RD/RE/RF/RG/RH/RI/RJ/RK/RL/RN/RO/RP/RQ/RS/RT/RU/RV/RW/RX/RY/RZ: 등기우편 변형
 */

// 국제우편 등기 번호 패턴 (UPU S10 표준)
const INTERNATIONAL_POSTAL_PATTERN = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

// 국제우편 서비스 코드 (첫 2글자)
const INTERNATIONAL_SERVICE_CODES = [
  'LP', 'LM', 'LN', 'LO', 'LX', 'LZ',  // Letter Post
  'EA', 'EB', 'EC', 'ED', 'EE', 'EF', 'EG', 'EH', 'EI', 'EJ', 'EK', 'EL', 'EM', 'EN', 'EX',  // EMS
  'RA', 'RB', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'RI', 'RJ', 'RK', 'RL', 'RM', 'RN', 'RO', 'RP', 'RQ', 'RR', 'RS', 'RT', 'RU', 'RV', 'RW', 'RX', 'RY', 'RZ',  // Registered
  'CA', 'CB', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI', 'CJ', 'CK', 'CL', 'CM', 'CN', 'CO', 'CP', 'CQ', 'CR', 'CS', 'CT', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',  // Parcel
  'VA', 'VB', 'VC', 'VD', 'VE', 'VF', 'VG', 'VH', 'VI', 'VJ', 'VK', 'VL', 'VM', 'VN', 'VO', 'VP', 'VQ', 'VR', 'VS', 'VT', 'VU', 'VV', 'VW', 'VX', 'VY', 'VZ',  // Insured
];

/**
 * 운송장 번호가 국제우편 등기 형식인지 확인
 * UPU S10 표준: 2글자 서비스코드 + 9자리 숫자 + 2글자 국가코드
 */
export function isInternationalTrackingNumber(trackingNumber: string): boolean {
  if (!trackingNumber) return false;
  const upper = trackingNumber.trim().toUpperCase();
  
  // 기본 패턴 매칭 (XX000000000XX)
  if (!INTERNATIONAL_POSTAL_PATTERN.test(upper)) return false;
  
  // 서비스 코드 확인
  const serviceCode = upper.substring(0, 2);
  return INTERNATIONAL_SERVICE_CODES.includes(serviceCode);
}

/**
 * 운송장 번호 기반으로 적절한 shippingType을 결정
 * 국제우편 등기 패턴이면 'international', 아니면 기존 값 유지
 */
export function detectShippingType(trackingNumber: string, currentType?: string): 'international' | 'domestic' {
  if (isInternationalTrackingNumber(trackingNumber)) {
    return 'international';
  }
  // 국제 패턴이 아닌 경우 기존 값 유지, 기본값은 domestic
  return (currentType as 'international' | 'domestic') || 'domestic';
}

/**
 * 우체국 크롤링이 필요한 운송장인지 확인
 * 국제우편 등기 번호는 우체국 사이트에서 직접 크롤링해야 정확한 통관 정보를 얻을 수 있음
 */
export function needsKoreaPostCrawling(trackingNumber: string): boolean {
  return isInternationalTrackingNumber(trackingNumber);
}
