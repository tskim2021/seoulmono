/**
 * 17track 배송 추적 API 클라이언트
 * https://api.17track.net/en/doc
 */

import { ENV } from "./env";

const API_BASE_URL = "https://api.17track.net/track";
const API_VERSION = "v2.4";

export interface TrackingEvent {
  time: number; // Unix timestamp (milliseconds)
  timeZone: string;
  timeUtc: string;
  description: string;
  location?: string;
  details?: string;
}

export interface TrackingInfo {
  number: string; // 운송장 번호
  carrier: number; // 택배사 코드
  carrierName?: string;
  status: number; // 메인 상태 (0-8)
  subStatus: number; // 서브 상태
  statusText: string;
  subStatusText: string;
  lastEvent?: TrackingEvent;
  events: TrackingEvent[];
  originCountry?: string;
  destinationCountry?: string;
  pickupTime?: number;
  deliveryTime?: number;
}

export interface SeventeenTrackResponse {
  code: number;
  data: {
    accepted: Array<{
      number: string;
      carrier: number;
    }>;
    rejected: Array<{
      number: string;
      error: {
        code: number;
        message: string;
      };
    }>;
  };
}

export interface TrackingDetailsItem {
  number: string;
  carrier: number;
  track_info?: {
    tracking: {
      providers: Array<{
        provider: {
          key: string;
          name: string;
        };
        events: Array<{
          time_iso: string;
          time_utc: string;
          description: string;
          location?: string;
          stage?: string;
        }>;
      }>;
    };
    latest_status: {
      status: number;
      sub_status: number;
    };
    latest_event?: {
      time_iso: string;
      time_utc: string;
      description: string;
      location?: string;
    };
    time_metrics?: {
      days_after_order?: number;
      days_of_transit?: number;
      days_of_transit_done?: number;
      days_after_last_update?: number;
    };
  };
}

export interface TrackingDetailsResponse {
  code: number;
  // v2.4: /gettrackinfo도 /register와 동일한 accepted/rejected 구조 반환
  data: {
    accepted: TrackingDetailsItem[];
    rejected: Array<{ number: string; error: { code: number; message: string } }>;
  };
}

// 17track 메인 상태 매핑
const STATUS_MAP: Record<number, string> = {
  0: "pending", // NotFound
  1: "pending", // InfoReceived
  2: "in_transit", // InTransit
  3: "picked_up", // PickUp
  4: "out_for_delivery", // OutForDelivery
  5: "delivered", // Delivered
  6: "delivered", // Delivered (alternative code)
  7: "failed", // Alert/Exception
  8: "failed", // Expired/Returned
};

/**
 * 17track API 호출 헬퍼
 */
async function callApi(endpoint: string, body: any): Promise<any> {
  let apiKey = ENV.seventeentrackApiKey;
  if (!apiKey) {
    try {
      const { getSetting } = await import("../db");
      const dbKey = await getSetting("seventeentrack_api_key");
      if (dbKey) apiKey = dbKey;
    } catch {}
  }
  if (!apiKey) {
    console.error("[17track] API key not configured");
    throw new Error("17track API key not configured");
  }

  const url = `${API_BASE_URL}/${API_VERSION}${endpoint}`;
  
  console.log(`[17track] Calling API: ${endpoint}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "17token": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[17track] API error: ${response.status} ${response.statusText}`);
      throw new Error(`17track API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      console.error(`[17track] API returned error code: ${data.code}`, data);
      throw new Error(`17track API error: ${data.code}`);
    }

    return data;
  } catch (error) {
    console.error("[17track] API call failed:", error);
    throw error;
  }
}

/**
 * 여러 운송장 번호 일괄 등록 (최대 40개)
 */
export async function bulkRegisterTracking(trackingNumbers: string[]): Promise<{ accepted: string[]; rejected: string[] }> {
  if (trackingNumbers.length === 0) return { accepted: [], rejected: [] };
  const payload = trackingNumbers.map(n => ({ number: n, carrier: 0 }));
  try {
    const response: SeventeenTrackResponse = await callApi("/register", payload);
    const accepted = (response.data.accepted ?? []).map((a: any) => a.number as string);
    const rejected = (response.data.rejected ?? []).map((r: any) => r.number as string);
    console.log(`[17track] Bulk register: ${accepted.length} accepted, ${rejected.length} rejected`);
    return { accepted, rejected };
  } catch (error) {
    console.error(`[17track] Bulk register failed:`, error);
    return { accepted: [], rejected: trackingNumbers };
  }
}

/**
 * 운송장 번호 등록
 */
export async function registerTracking(trackingNumber: string, carrierCode?: number): Promise<boolean> {
  try {
    const response: SeventeenTrackResponse = await callApi("/register", [
      {
        number: trackingNumber,
        carrier: carrierCode || 0, // 0 = auto-detect
      },
    ]);

    if (response.data.accepted.length > 0) {
      console.log(`[17track] Successfully registered: ${trackingNumber}`);
      return true;
    } else if (response.data.rejected.length > 0) {
      const rejection = response.data.rejected[0];
      console.error(`[17track] Registration rejected: ${rejection.error.message}`);
      return false;
    }

    return false;
  } catch (error) {
    console.error(`[17track] Failed to register tracking number: ${trackingNumber}`, error);
    return false;
  }
}

/**
 * 배송 추적 정보 조회
 */
export async function getTrackingInfo(trackingNumber: string): Promise<TrackingInfo | null> {
  try {
    const response: TrackingDetailsResponse = await callApi("/gettrackinfo", [
      {
        number: trackingNumber,
      },
    ]);

    // v2.4 API: data.accepted[0] 에서 추적 정보 추출
    const trackData = response.data?.accepted?.[0];
    if (!trackData || !trackData.track_info) {
      const rejected = response.data?.rejected?.[0];
      console.log(`[17track] No tracking info available for: ${trackingNumber} (data: ${JSON.stringify(response.data)?.substring(0, 120)})`);
      return null;
    }

    const trackInfo = trackData.track_info!;
    const latestStatus = trackInfo.latest_status;
    
    // 이벤트 목록 구성
    const events: TrackingEvent[] = [];
    if (trackInfo.tracking?.providers) {
      for (const provider of trackInfo.tracking.providers) {
        for (const event of provider.events) {
          events.push({
            time: new Date(event.time_iso).getTime(),
            timeZone: event.time_iso,
            timeUtc: event.time_utc,
            description: event.description,
            location: event.location,
            details: event.stage,
          });
        }
      }
    }

    // 시간순 정렬 (최신순)
    events.sort((a, b) => b.time - a.time);

    const result: TrackingInfo = {
      number: trackingNumber,
      carrier: trackData.carrier,
      status: latestStatus.status,
      subStatus: latestStatus.sub_status,
      statusText: getStatusText(latestStatus.status),
      subStatusText: getSubStatusText(latestStatus.sub_status),
      events,
      lastEvent: events[0],
    };

    console.log(`[17track] Retrieved tracking info for: ${trackingNumber}, status: ${result.statusText}`);
    return result;
  } catch (error) {
    console.error(`[17track] Failed to get tracking info: ${trackingNumber}`, error);
    return null;
  }
}

/**
 * 메인 상태 텍스트 변환
 */
function getStatusText(status: number): string {
  const texts: Record<number, string> = {
    0: "追跡情報なし",
    1: "情報受信済み",
    2: "輸送中",
    3: "集荷完了",
    4: "配達中",
    5: "配達失敗",
    6: "配達完了",
    7: "例外発生",
    8: "期限切れ",
  };
  return texts[status] || "不明";
}

/**
 * 서브 상태 텍스트 변환
 */
function getSubStatusText(subStatus: number): string {
  const texts: Record<number, string> = {
    0: "",
    1: "情報受信",
    2: "発送準備",
    3: "集荷完了",
    10: "輸送中",
    11: "到着",
    12: "通関中",
    13: "通関完了",
    20: "配達中",
    30: "配達失敗",
    31: "再配達予定",
    35: "配達完了",
    36: "受領サイン完了",
    40: "例外発生",
    50: "期限切れ",
  };
  return texts[subStatus] || "";
}

/**
 * 17track 상태를 시스템 상태로 변환
 */
export function mapStatusToSystem(status: number): string {
  return STATUS_MAP[status] || "pending";
}
