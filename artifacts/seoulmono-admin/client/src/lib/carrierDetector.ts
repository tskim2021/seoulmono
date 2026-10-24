export interface CarrierOption {
  id: number;
  code: string;
  name: string;
}

/**
 * 운송장 번호 패턴으로 택배사를 자동 감지합니다.
 */
export function detectCarrierByTracking(
  tracking: string,
  carriers: CarrierOption[],
): CarrierOption | undefined {
  const t = tracking.trim().toUpperCase();
  if (!t) return undefined;

  // 우체국 EMS 국제: 2 uppercase letters + 8~9 digits + 2 uppercase letters (e.g. LP019195290IN)
  if (/^[A-Z]{2}\d{8,9}[A-Z]{2}$/.test(t)) {
    return carriers.find(c => c.code === "ems" || c.code === "epost_ems");
  }

  // DHL: JD 접두사 또는 특정 패턴
  if (/^JD\d+$/.test(t)) {
    return carriers.find(c => c.code === "dhl");
  }

  // 한진택배: 12자리 숫자
  if (/^\d{12}$/.test(t)) {
    return carriers.find(c => c.code === "hanjin");
  }

  // 로젠택배: 11자리 숫자
  if (/^\d{11}$/.test(t)) {
    return (
      carriers.find(c => c.code === "logen") ??
      carriers.find(c => c.code === "lotte")
    );
  }

  // CJ대한통운: 10자리 숫자
  if (/^\d{10}$/.test(t)) {
    return carriers.find(c => c.code === "cj");
  }

  // 우체국 국내: 13자리 숫자 (6으로 시작)
  if (/^6\d{12}$/.test(t)) {
    return carriers.find(c => c.code === "epost");
  }

  return undefined;
}
