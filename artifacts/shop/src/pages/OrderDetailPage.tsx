import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { CheckCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { settleCaseJa } from "@/lib/labels";

const TOKEN = () => localStorage.getItem("seoulmono_token") || "";
const authFetch = (url: string, opts: RequestInit = {}) =>
  fetch(url, { ...opts, headers: { Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json", ...(opts.headers || {}) } });

interface OrderDetail {
  od_id: string; od_status: string; od_time: string; od_settle_case: string;
  od_receipt_price: number; od_cart_price: number; od_send_cost: number; od_memo: string;
  od_b_name: string; od_b_hp: string; od_b_zip1: string; od_b_addr1: string; od_b_addr2: string;
  od_invoice: string; od_delivery_company: string;
  items: { ct_id: number; it_id: string; it_name: string; ct_price: number; ct_qty: number; ct_option: string; ct_status: string; it_img1: string }[];
}

const CLAIM_JA: Record<string, string> = { "교환": "交換", "반품": "返品", "환불": "返金", "취소": "キャンセル" };
const PRE_SHIPPING = ["결제완료", "입금대기", "입금확인", "주문접수", "주문완료", "상품준비중", "배송준비"];

function ClaimForm({ odId, odStatus, onCancelled }: { odId: string; odStatus: string; onCancelled?: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [claimType, setClaimType] = useState("교환");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const canRequest = !["주문취소", "반품", "교환", "환불"].includes(odStatus);
  if (!canRequest) return null;

  const isPreShipping = PRE_SHIPPING.includes(odStatus);

  const handleSubmit = async () => {
    if (!reason.trim()) { setError("理由を入力してください"); return; }
    setSubmitting(true); setError("");
    try {
      // 배송 전 취소 → 즉시 취소 + 결제 취소
      if (claimType === "취소" && isPreShipping) {
        const res = await authFetch(`/api/shop/orders/${odId}/cancel`, {
          method: "POST",
          body: JSON.stringify({ reason }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "キャンセルに失敗しました"); return; }
        setSubmitted(true);
        onCancelled?.();
        return;
      }
      // 그 외 (교환/반품/환불/배송 후 취소) → 클레임 접수
      const res = await authFetch("/api/shop/claims", {
        method: "POST",
        body: JSON.stringify({ od_id: odId, claim_type: claimType, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "リクエストに失敗しました"); return; }
      setSubmitted(true);
    } catch { setError("ネットワークエラーが発生しました"); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div style={{ marginTop: 20, background: "#f0f9f4", borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
        <CheckCircle size={28} color="#8B5E3C" style={{ marginBottom: 8 }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#8B5E3C" }}>{claimType === "취소" && isPreShipping ? "ご注文がキャンセルされました" : "リクエストを受け付けました"}</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>{claimType === "취소" && isPreShipping ? "お支払いも同時にキャンセルされました。" : "マイページ > 交換/返品/キャンセル履歴で処理状況をご確認ください"}</p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div style={{ marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
        <button onClick={() => setShowForm(true)}
          style={{ width: "100%", height: 44, background: "#fff3f3", border: "1.5px solid #ffcdd2", borderRadius: 10, color: "#d32f2f", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <RotateCcw size={15} /> 交換 / 返品 / 返金 / キャンセルのお申し込み
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
      <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: "#111" }}>交換・返品のお申し込み</p>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>リクエスト種別</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["교환", "반품", "환불", "취소"] as const).map(t => (
            <button key={t} type="button" onClick={() => setClaimType(t)}
              style={{ padding: "7px 16px", borderRadius: 8, border: `2px solid ${claimType === t ? "#8B5E3C" : "#ddd"}`, background: claimType === t ? "#f0f9f4" : "#fff", color: claimType === t ? "#8B5E3C" : "#555", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {CLAIM_JA[t] ?? t}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>理由 *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="交換/返品/返金/キャンセルの理由を入力してください"
          style={{ width: "100%", minHeight: 80, border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
        />
      </div>
      {error && <p style={{ margin: "0 0 10px", fontSize: 13, color: "#e53935" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setShowForm(false)}
          style={{ flex: 1, height: 42, background: "#f5f5f5", border: "none", borderRadius: 8, color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          キャンセル
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          style={{ flex: 2, height: 42, background: "#d32f2f", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
          {submitting ? "処理中..." : "申し込む"}
        </button>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ odId: string }>();
  const odId = params.odId;
  const [, navigate] = useLocation();
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!odId) return;
    authFetch(`/api/shop/my-orders/${odId}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [odId]);

  return (
    <div className="page-wrap" style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 64px" }}>
      <button
        onClick={() => navigate("/mypage")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft size={18} /> 注文/配送状況に戻る
      </button>

      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 24px" }}>注文詳細</h2>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#aaa" }}>読み込み中...</div>
      ) : !detail ? (
        <div style={{ padding: 60, textAlign: "center", color: "#e53935" }}>注文情報を読み込めません</div>
      ) : (
        <>
          <div style={{ background: "#f8f9fa", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#888" }}>注文番号</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#222", fontFamily: "monospace" }}>{detail.od_id}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#888" }}>注文日時</span>
              <span style={{ fontSize: 13, color: "#333" }}>{new Date(detail.od_time).toLocaleString("ja-JP")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#888" }}>お支払い方法</span>
              <span style={{ fontSize: 13, color: "#333" }}>{settleCaseJa(detail.od_settle_case)}</span>
            </div>
          </div>

          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111" }}>ご注文商品</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {detail.items.map(item => (
              <div key={item.ct_id} onClick={() => navigate(`/item/${item.it_id}`)}
                style={{ display: "flex", gap: 12, padding: 14, border: "1px solid #f0f0f0", borderRadius: 12, cursor: "pointer", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 64, height: 64, flexShrink: 0, background: "#f8f8f8", borderRadius: 10, overflow: "hidden" }}>
                  {item.it_img1 && <img src={item.it_img1} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 13.5, fontWeight: 600, color: "#222" }}>{item.it_name}</p>
                  <p style={{ margin: "0 0 3px", fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>商品番号: {item.it_id}</p>
                  {item.ct_option && <p style={{ margin: "0 0 3px", fontSize: 11, color: "#aaa" }}>オプション: {item.ct_option}</p>}
                  <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{formatPrice(item.ct_price)} × {item.ct_qty}点</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#8B5E3C" }}>{formatPrice(item.ct_price * item.ct_qty)}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111" }}>お届け先</p>
          <div style={{ background: "#f8f9fa", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#222" }}>{detail.od_b_name}</p>
            {detail.od_b_hp && <p style={{ margin: "0 0 6px", fontSize: 13, color: "#666" }}>{detail.od_b_hp}</p>}
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#555" }}>
              {detail.od_b_zip1 && `(${detail.od_b_zip1}) `}{detail.od_b_addr1} {detail.od_b_addr2}
            </p>
            {detail.od_memo && <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>配送メモ: {detail.od_memo}</p>}
          </div>

          {(detail.od_invoice || detail.od_delivery_company) && (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111" }}>配送状況</p>
              <div style={{ background: "#F2E4D0", borderRadius: 14, padding: "14px 20px", marginBottom: 24 }}>
                {detail.od_delivery_company && <p style={{ margin: "0 0 4px", fontSize: 13, color: "#333" }}>配送業者: {detail.od_delivery_company}</p>}
                {detail.od_invoice && <p style={{ margin: 0, fontSize: 13, color: "#333" }}>送り状番号: <strong>{detail.od_invoice}</strong></p>}
              </div>
            </>
          )}

          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#111" }}>お支払い金額</p>
          <div style={{ background: "#f8f9fa", borderRadius: 14, padding: "16px 20px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#888" }}>商品金額</span>
              <span style={{ fontSize: 13 }}>{formatPrice(detail.od_cart_price)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #eee" }}>
              <span style={{ fontSize: 13, color: "#888" }}>送料</span>
              <span style={{ fontSize: 13 }}>{detail.od_send_cost > 0 ? formatPrice(detail.od_send_cost) : "無料"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>お支払い合計</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#8B5E3C" }}>{formatPrice(detail.od_receipt_price)}</span>
            </div>
          </div>

          <ClaimForm odId={detail.od_id} odStatus={detail.od_status} />
        </>
      )}
    </div>
  );
}
