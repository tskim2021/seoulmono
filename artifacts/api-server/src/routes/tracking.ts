import { Router } from "express";
import { authMiddleware } from "../lib/auth";

const router = Router();

const CARRIER_CODE_MAP: Record<string, string> = {
  "CJ대한통운": "04",
  "한진택배": "05",
  "로젠택배": "06",
  "롯데택배": "08",
  "롯데글로벌로지스": "08",
  "우체국택배": "01",
  "경동택배": "23",
  "대신택배": "22",
  "일양로지스": "32",
  "KG로지스": "30",
  "천일택배": "12",
  "합동택배": "16",
  "CU편의점택배": "49",
  "GS포스트박스": "60",
  "팬택": "46",
};

export interface TrackingEvent {
  time: string;
  status: string;
  location: string;
  level: number;
}

export interface TrackingResult {
  invoice: string;
  carrier: string;
  carrier_tel?: string;
  events: TrackingEvent[];
  last_status?: string;
  last_location?: string;
  fallback_url: string;
}

router.get("/tracking/:invoice_no", authMiddleware, async (req, res) => {
  const { invoice_no } = req.params;
  const { carrier } = req.query as { carrier?: string };

  const fallback_url = `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${invoice_no}`;

  const apiKey = process.env["SWEETTRACKER_API_KEY"];

  if (!apiKey) {
    return res.json({
      invoice: invoice_no,
      carrier: carrier || "CJ대한통운",
      events: [],
      fallback_url,
      no_api_key: true,
    } satisfies TrackingResult & { no_api_key: boolean });
  }

  const carrierCode = (carrier && CARRIER_CODE_MAP[carrier]) || "04";

  try {
    const url = new URL("https://info.sweettracker.co.kr/api/v1/trackingInfo");
    url.searchParams.set("t_key", apiKey);
    url.searchParams.set("t_code", carrierCode);
    url.searchParams.set("t_invoice", invoice_no);

    const resp = await fetch(url.toString(), {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      return res.json({
        invoice: invoice_no,
        carrier: carrier || "CJ대한통운",
        events: [],
        fallback_url,
        error: `APIエラー: ${resp.status}`,
      });
    }

    const data = await resp.json() as {
      trackingDetails?: Array<{
        timeString?: string;
        kind?: string;
        where?: string;
        level?: number;
      }>;
      lastDetail?: { kind?: string; where?: string; level?: number };
      carrier?: { name?: string; tel?: string };
      invoice?: string;
      msg?: string;
    };

    if (data.msg) {
      return res.json({
        invoice: invoice_no,
        carrier: carrier || "CJ대한통운",
        events: [],
        fallback_url,
        error: data.msg,
      });
    }

    const events: TrackingEvent[] = (data.trackingDetails || []).map((d) => ({
      time: d.timeString || "",
      status: d.kind || "",
      location: d.where || "",
      level: d.level || 0,
    }));

    if (events.length === 0) {
      return res.json({
        invoice: invoice_no,
        carrier: data.carrier?.name || carrier || "CJ대한통운",
        carrier_tel: data.carrier?.tel,
        events: [],
        fallback_url,
        error: "まだ配送履歴がありません。配送業者に送り状が登録された後、もう一度ご確認ください。",
      });
    }

    const lastDetail = data.lastDetail;

    return res.json({
      invoice: invoice_no,
      carrier: data.carrier?.name || carrier || "CJ대한통운",
      carrier_tel: data.carrier?.tel,
      events,
      last_status: lastDetail?.kind,
      last_location: lastDetail?.where,
      fallback_url,
    } satisfies TrackingResult);
  } catch (err) {
    return res.json({
      invoice: invoice_no,
      carrier: carrier || "CJ대한통운",
      events: [],
      fallback_url,
      error: "配送情報を取得できませんでした。",
    });
  }
});

export default router;
