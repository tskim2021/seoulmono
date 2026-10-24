import { useState } from "react";
import { Truck, X, Loader2, ExternalLink, MapPin, Clock, CheckCircle2, Package, AlertCircle } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";

interface TrackingEvent {
  time: string;
  status: string;
  location: string;
  level: number;
}

interface TrackingResult {
  invoice: string;
  carrier: string;
  carrier_tel?: string;
  events: TrackingEvent[];
  last_status?: string;
  last_location?: string;
  fallback_url: string;
  no_api_key?: boolean;
  error?: string;
}

interface TrackingModalProps {
  invoiceNo: string;
  carrier?: string;
  onClose: () => void;
}

function getLevelIcon(level: number, isLast: boolean) {
  if (level >= 6) return <CheckCircle2 className={`w-5 h-5 ${isLast ? "text-green-500" : "text-slate-400"}`} />;
  if (level >= 3) return <Truck className={`w-5 h-5 ${isLast ? "text-blue-500" : "text-slate-400"}`} />;
  if (level >= 2) return <Package className={`w-5 h-5 ${isLast ? "text-amber-500" : "text-slate-400"}`} />;
  return <Package className={`w-5 h-5 ${isLast ? "text-slate-600" : "text-slate-400"}`} />;
}

function getLevelColor(level: number, isLast: boolean) {
  if (!isLast) return "bg-slate-100 text-slate-500";
  if (level >= 6) return "bg-green-50 text-green-700 border border-green-200";
  if (level >= 3) return "bg-blue-50 text-blue-700 border border-blue-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}

export default function TrackingModal({ invoiceNo, carrier, onClose }: TrackingModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchTracking = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...(carrier ? { carrier } : {}) });
      const data = await customFetch<TrackingResult>(`/api/tracking/${invoiceNo}?${params}`);
      setResult(data);
    } catch {
      setResult({
        invoice: invoiceNo,
        carrier: carrier || "CJ대한통운",
        events: [],
        fallback_url: `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${invoiceNo}`,
        error: "배송 정보를 불러오지 못했습니다.",
      });
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  if (!fetched && !loading) {
    fetchTracking();
  }

  const events = result?.events ?? [];
  const hasEvents = events.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-lg">배송 조회</h2>
              <p className="text-xs text-slate-500 font-medium">{result?.carrier || carrier || "CJ대한통운"} · 송장번호 {invoiceNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-slate-500 font-medium">배송 정보를 불러오는 중...</p>
            </div>
          )}

          {!loading && result && (result.no_api_key || result.error) && !hasEvents && (
            <div className="p-6">
              {result.no_api_key ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800 text-sm">배송조회 API 미설정</p>
                      <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                        sweettracker API 키가 설정되지 않아 인앱 조회가 불가합니다.<br />
                        아래 버튼을 눌러 택배사 홈페이지에서 확인하세요.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{result.error}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="font-bold">{result.carrier}</span>
                  {result.carrier_tel && <span className="text-slate-400">· {result.carrier_tel}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span className="font-mono font-bold text-slate-800">{invoiceNo}</span>
                </div>
              </div>

              <a
                href={result.fallback_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm"
              >
                <Truck className="w-4 h-4" />
                {result.carrier || "CJ대한통운"} 홈페이지에서 조회
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {!loading && hasEvents && (
            <div className="p-6">
              {result?.last_status && (
                <div className={`rounded-xl px-4 py-3 mb-5 flex items-center gap-3 ${getLevelColor(events[0].level, true)}`}>
                  {getLevelIcon(events[0].level, true)}
                  <div>
                    <p className="font-black text-sm">{result.last_status}</p>
                    {result.last_location && (
                      <p className="text-xs font-medium mt-0.5 opacity-80">{result.last_location}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-slate-200" />
                <div className="space-y-0">
                  {[...events].reverse().map((ev, idx) => {
                    const isLast = idx === 0;
                    return (
                      <div key={idx} className="relative flex gap-4 pl-1 pb-5 last:pb-0">
                        <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${isLast ? "bg-blue-100" : "bg-slate-100"}`}>
                          {getLevelIcon(ev.level, isLast)}
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-bold ${isLast ? "text-slate-900" : "text-slate-600"}`}>
                              {ev.status}
                            </p>
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <p className="text-xs text-slate-500">{ev.location}</p>
                            </div>
                          )}
                          {ev.time && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <p className="text-xs text-slate-400">{ev.time}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100">
                <a
                  href={result?.fallback_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  {result?.carrier || "CJ대한통운"} 홈페이지에서 보기
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
