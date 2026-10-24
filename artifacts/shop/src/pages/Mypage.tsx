import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import {
  Package, Tag, Award, User, MapPin, MessageSquare,
  Star, Heart, LogOut, ChevronRight, Plus, Pencil, Trash2,
  CheckCircle, AlertCircle, X, LayoutDashboard, Truck, RotateCcw, Gift, Copy, Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/api";
import { orderStatusJa, claimTypeJa, claimStatusJa, settleCaseJa } from "@/lib/labels";
import { setCheckoutItems } from "@/pages/Checkout";

const TOKEN = () => localStorage.getItem("seoulmono_token") || "";
const authFetch = (url: string, opts: RequestInit = {}) =>
  fetch(url, { ...opts, headers: { Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json", ...(opts.headers || {}) } });

type Section = "dashboard" | "orders" | "claims" | "coupon" | "points" | "profile" | "address" | "inquiry" | "review" | "wishlist";

const MY_SHOPPING: { key: Section; label: string; icon: any }[] = [
  { key: "orders", label: "注文/配送状況", icon: Package },
  { key: "claims", label: "交換/返品/キャンセル", icon: RotateCcw },
  { key: "coupon", label: "クーポン", icon: Tag },
  { key: "points", label: "ポイント", icon: Award },
];
const MY_INFO: { key: Section; label: string; icon: any }[] = [
  { key: "profile", label: "会員情報の変更", icon: User },
  { key: "address", label: "お届け先管理", icon: MapPin },
  { key: "inquiry", label: "お問い合わせ履歴", icon: MessageSquare },
  { key: "review", label: "レビュー管理", icon: Star },
  { key: "wishlist", label: "お気に入りリスト", icon: Heart },
];

// ────── 공통 컴포넌트 ──────────────────────────────────────────

function SectionBox({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyBox({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ padding: "60px 0", textAlign: "center", color: "#bbb" }}>
      <Icon size={36} color="#ddd" style={{ marginBottom: 12 }} />
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    "주문접수": { label: "注文受付", color: "#f5a623", bg: "#fff8e8" },
    "결제완료": { label: "お支払い完了", color: "#8B5E3C", bg: "#e8f8f0" },
    "배송준비": { label: "発送準備中", color: "#7B68EE", bg: "#f0eeff" },
    "배송중": { label: "配送中", color: "#2196f3", bg: "#e3f2fd" },
    "배송완료": { label: "配送完了", color: "#888", bg: "#f5f5f5" },
    "주문취소": { label: "注文キャンセル", color: "#f44336", bg: "#fff3f3" },
    "반품": { label: "返品", color: "#f44336", bg: "#fff3f3" },
  };
  const s = map[status] || { label: status || "処理中", color: "#888", bg: "#f5f5f5" };
  return <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: "4px 10px", borderRadius: 4 }}>{s.label}</span>;
}

function Toast({ msg, type = "success", onClose }: { msg: string; type?: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
      background: type === "success" ? "#8B5E3C" : "#d32f2f", color: "#fff",
      padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    }}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  );
}

// ────── 주문 상세 모달 ─────────────────────────────────────────
interface OrderDetail {
  od_id: string; od_status: string; od_time: string; od_settle_case: string;
  od_receipt_price: number; od_cart_price: number; od_send_cost: number; od_memo: string;
  od_b_name: string; od_b_hp: string; od_b_zip1: string; od_b_addr1: string; od_b_addr2: string;
  od_invoice: string; od_delivery_company: string;
  items: { ct_id: number; it_id: string; it_name: string; ct_price: number; ct_qty: number; ct_option: string; ct_status: string; it_img1: string }[];
}

function OrderDetailModal({ odId, onClose, navigate }: { odId: string; onClose: () => void; navigate: (to: string) => void }) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`/api/shop/my-orders/${odId}`).then(r => r.json())
      .then(d => setDetail(d)).catch(() => {}).finally(() => setLoading(false));
  }, [odId]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111" }}>注文詳細</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#aaa", lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 32px" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>読み込み中...</div>
          ) : !detail ? (
            <div style={{ padding: 40, textAlign: "center", color: "#e53935" }}>注文情報を読み込めません</div>
          ) : (
            <>
              {/* 주문 정보 헤더 */}
              <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#888" }}>注文番号</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#222", fontFamily: "monospace" }}>{detail.od_id}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#888" }}>注文日時</span>
                  <span style={{ fontSize: 13, color: "#333" }}>{new Date(detail.od_time).toLocaleString("ja-JP")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>お支払い方法</span>
                  <span style={{ fontSize: 13, color: "#333" }}>{settleCaseJa(detail.od_settle_case)}</span>
                </div>
              </div>

              {/* 주문 상품 */}
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#111" }}>ご注文商品</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {detail.items.map(item => (
                  <div key={item.ct_id} onClick={() => { navigate(`/item/${item.it_id}`); onClose(); }}
                    style={{ display: "flex", gap: 12, padding: 12, border: "1px solid #f0f0f0", borderRadius: 10, cursor: "pointer", background: "#fff" }}>
                    <div style={{ width: 60, height: 60, flexShrink: 0, background: "#f8f8f8", borderRadius: 8, overflow: "hidden" }}>
                      {item.it_img1 && <img src={item.it_img1} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#222" }}>{item.it_name}</p>
                      <p style={{ margin: "0 0 3px", fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>商品番号: {item.it_id}</p>
                      {item.ct_option && <p style={{ margin: "0 0 3px", fontSize: 11, color: "#aaa" }}>オプション: {item.ct_option}</p>}
                      <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{formatPrice(item.ct_price)} × {item.ct_qty}点</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#8B5E3C" }}>{formatPrice(item.ct_price * item.ct_qty)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 배송지 */}
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#111" }}>お届け先</p>
              <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#222" }}>{detail.od_b_name}</p>
                {detail.od_b_hp && <p style={{ margin: "0 0 6px", fontSize: 13, color: "#666" }}>{detail.od_b_hp}</p>}
                <p style={{ margin: "0 0 6px", fontSize: 13, color: "#555" }}>
                  {detail.od_b_zip1 && `(${detail.od_b_zip1}) `}{detail.od_b_addr1} {detail.od_b_addr2}
                </p>
                {detail.od_memo && <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>配送メモ: {detail.od_memo}</p>}
              </div>

              {/* 배송 추적 */}
              {(detail.od_invoice || detail.od_delivery_company) && (
                <div style={{ background: "#F2E4D0", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#8B5E3C" }}>配送状況</p>
                  {detail.od_delivery_company && <p style={{ margin: "0 0 4px", fontSize: 13, color: "#333" }}>配送業者: {detail.od_delivery_company}</p>}
                  {detail.od_invoice && <p style={{ margin: 0, fontSize: 13, color: "#333" }}>送り状番号: <strong>{detail.od_invoice}</strong></p>}
                </div>
              )}

              {/* 결제 금액 */}
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#111" }}>お支払い金額</p>
              <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#888" }}>商品金額</span>
                  <span style={{ fontSize: 13 }}>{formatPrice(detail.od_cart_price)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>送料</span>
                  <span style={{ fontSize: 13 }}>{detail.od_send_cost > 0 ? formatPrice(detail.od_send_cost) : "無料"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>お支払い合計</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#8B5E3C" }}>{formatPrice(detail.od_receipt_price)}</span>
                </div>
              </div>
              <ClaimFormInModal odId={detail.od_id} odStatus={detail.od_status} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ────── 클레임 신청 인모달 폼 ────────────────────────────────────
const PRE_SHIPPING = ["결제완료", "입금대기", "입금확인", "주문접수", "주문완료", "상품준비중", "배송준비"];

function ClaimFormInModal({ odId, odStatus, onCancelled }: { odId: string; odStatus: string; onCancelled?: () => void }) {
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
              {claimTypeJa(t)}
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

// ────── 주문 섹션 ──────────────────────────────────────────────
interface Order {
  od_id: string; od_status: string; od_receipt_price: number; od_cart_price: number;
  od_send_cost: number; od_settle_case: string; od_time: string; od_memo: string;
  od_b_name: string; od_b_hp: string;
  first_it_id: string; first_item: string; first_img: string; item_count: number; first_qty: number;
}

function OrdersSection({ reorderMode = false }: { reorderMode?: boolean }) {
  const [, navigate] = useLocation();
  const [days, setDays] = useState(30);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);


  const load = useCallback(() => {
    setLoading(true);
    authFetch(`/api/shop/my-orders?days=${days}`)
      .then(r => r.json()).then(d => setOrders(d.orders || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const handleReorder = (od: Order) => {
    setCheckoutItems([{ it_id: od.first_it_id, it_name: od.first_item, it_price: od.od_cart_price, it_img1: od.first_img, quantity: od.first_qty }]);
    navigate("/checkout");
  };

  return (
    <>
    <SectionBox
      title={reorderMode ? "再注文" : "注文/配送状況"}
      action={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 8px", fontSize: 12, background: "#fff" }}>
            <option value={7}>7日</option><option value={30}>1か月</option>
            <option value={90}>3か月</option><option value={180}>6か月</option>
          </select>
        </div>
      }
    >
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>読み込み中...</div>
        : orders.length === 0 ? <EmptyBox icon={Package} text="注文履歴がありません" />
        : (
          <div>
            {orders.map(od => (
              <div key={od.od_id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ padding: "10px 20px", background: "#f8f9fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#888" }}>注文番号 {od.od_id}</span>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{od.od_time?.slice(0, 10)}</span>
                  </div>
                  <StatusBadge status={od.od_status} />
                </div>
                <div style={{ padding: "14px 20px", display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 60, height: 60, flexShrink: 0, background: "#f5f5f5", borderRadius: 6, overflow: "hidden", border: "1px solid #eee" }}>
                    {od.first_img
                      ? <img src={od.first_img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><Package size={18} color="#ddd" /></div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 3px", fontSize: 14, color: "#222", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {od.first_item}{od.item_count > 1 ? ` 他${od.item_count - 1}点` : ""}
                    </p>
                    <p style={{ margin: "0 0 3px", fontSize: 13, color: "#888" }}>{formatPrice(od.od_receipt_price)} · {od.od_settle_case}</p>
                    {od.od_b_name && <p style={{ margin: 0, fontSize: 12, color: "#bbb" }}>お受け取り人: {od.od_b_name} {od.od_b_hp}</p>}
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    {reorderMode ? (
                      <button onClick={() => handleReorder(od)}
                        style={{ fontSize: 12, color: "#fff", background: "#8B5E3C", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontWeight: 600 }}>
                        再注文
                      </button>
                    ) : (
                      <button onClick={() => navigate(`/mypage/order/${od.od_id}`)}
                        style={{ fontSize: 11, color: "#8B5E3C", background: "#F2E4D0", border: "1px solid #c5e8d0", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
                        詳細を見る
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </SectionBox>
    </>
  );
}

// ────── 쿠폰 섹션 ──────────────────────────────────────────────
interface Coupon {
  cp_no: number; cp_name: string; cp_type: number; cp_price: number;
  cp_minimum: number; cp_maximum: number; cp_start: string; cp_end: string; used: boolean;
}

function CouponSection() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"unused" | "used">("unused");

  useEffect(() => {
    authFetch("/api/shop/my-coupons").then(r => r.json())
      .then(d => setCoupons(d.coupons || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = coupons.filter(c => tab === "unused" ? !c.used : c.used);

  return (
    <SectionBox title="クーポン">
      <div style={{ padding: "0 20px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 0 }}>
        {(["unused", "used"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "12px 20px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? "#8B5E3C" : "#aaa", borderBottom: tab === t ? "2px solid #8B5E3C" : "2px solid transparent" }}>
            {t === "unused" ? `未使用(${coupons.filter(c => !c.used).length})` : `使用済み(${coupons.filter(c => c.used).length})`}
          </button>
        ))}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>読み込み中...</div>
        : filtered.length === 0 ? <EmptyBox icon={Tag} text="クーポンがありません" />
        : (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(c => (
              <div key={c.cp_no} style={{ border: `1px solid ${c.used ? "#eee" : "#8B5E3C"}`, borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: c.used ? 0.5 : 1, background: c.used ? "#f9f9f9" : "#fff" }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#111" }}>{c.cp_name}</p>
                  <p style={{ margin: "0 0 4px", fontSize: 14, color: "#8B5E3C", fontWeight: 600 }}>
                    {c.cp_type === 1 ? `${c.cp_price}%オフ` : `${formatPrice(c.cp_price)}オフ`}
                    {c.cp_minimum > 0 ? ` (${formatPrice(c.cp_minimum)}以上)` : ""}
                  </p>
                  {c.cp_end && <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>~{c.cp_end?.slice(0, 10)} まで</p>}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.used ? "#bbb" : "#8B5E3C", background: c.used ? "#f0f0f0" : "#e8f8f0", padding: "6px 14px", borderRadius: 6 }}>
                  {c.used ? "使用済み" : "使用可能"}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </SectionBox>
  );
}

// ────── 포인트 섹션 ──────────────────────────────────────────────
interface PointEntry { content: string; point: number; balance: number; datetime: string; }

function PointsSection() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/shop/points-history").then(r => r.json())
      .then(d => { setBalance(d.balance || 0); setHistory(d.history || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <SectionBox title="ポイント履歴">
      <div style={{ padding: "20px", background: "#f0f9f4", borderBottom: "1px solid #e0f0e8", display: "flex", alignItems: "center", gap: 14 }}>
        <Award size={32} color="#8B5E3C" />
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 12, color: "#888" }}>現在の保有ポイント</p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#8B5E3C" }}>{balance.toLocaleString()} D</p>
        </div>
      </div>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>読み込み中...</div>
        : history.length === 0 ? <EmptyBox icon={Award} text="ポイント履歴がありません" />
        : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8f9fa" }}>
              {["日時", "内容", "ポイント", "残高"].map(h => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 12, color: "#888", fontWeight: 600, textAlign: "left", borderBottom: "1px solid #eee" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "#aaa" }}>{h.datetime?.slice(0, 10)}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "#333" }}>{h.content}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: h.point >= 0 ? "#8B5E3C" : "#f44336" }}>
                    {h.point >= 0 ? "+" : ""}{h.point.toLocaleString()} D
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "#555" }}>{h.balance.toLocaleString()} D</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </SectionBox>
  );
}


// ────── 교환/반품/취소 내역 섹션 ────────────────────────────────
interface ClaimItem {
  id: number; od_id: string; claim_type: string; reason: string;
  status: string; admin_memo: string; created_at: string; first_item: string;
}

function ClaimTypeBadge({ type }: { type: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    "교환": { color: "#7c3aed", bg: "#f5f3ff" },
    "반품": { color: "#dc2626", bg: "#fef2f2" },
    "환불": { color: "#ea580c", bg: "#fff7ed" },
    "취소": { color: "#6b7280", bg: "#f9fafb" },
  };
  const s = map[type] || { color: "#888", bg: "#f5f5f5" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: "3px 9px", borderRadius: 20, border: `1px solid ${s.color}30` }}>{claimTypeJa(type)}</span>
  );
}

function ClaimStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    "접수": { color: "#f59e0b", bg: "#fffbeb" },
    "처리중": { color: "#3b82f6", bg: "#eff6ff" },
    "승인": { color: "#8B5E3C", bg: "#f0f9f4" },
    "반려": { color: "#ef4444", bg: "#fef2f2" },
    "완료": { color: "#6b7280", bg: "#f9fafb" },
  };
  const s = map[status] || { color: "#888", bg: "#f5f5f5" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: "3px 9px", borderRadius: 20, border: `1px solid ${s.color}30` }}>{claimStatusJa(status)}</span>
  );
}

function ClaimsSection() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/shop/claims")
      .then(r => r.json())
      .then(d => setClaims(d.claims || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SectionBox title="交換/返品/返金/キャンセル履歴">
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>読み込み中...</div>
      ) : claims.length === 0 ? (
        <EmptyBox icon={RotateCcw} text="リクエスト履歴がありません" />
      ) : (
        <div>
          {claims.map(c => (
            <div key={c.id} style={{ borderBottom: "1px solid #f5f5f5", padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <ClaimTypeBadge type={c.claim_type} />
                  <ClaimStatusBadge status={c.status} />
                </div>
                <span style={{ fontSize: 12, color: "#bbb", whiteSpace: "nowrap" }}>{c.created_at?.slice(0, 10)}</span>
              </div>
              <p style={{ margin: "0 0 3px", fontSize: 12, color: "#aaa", fontFamily: "monospace" }}>注文番号: {c.od_id}</p>
              {c.first_item && (
                <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#222" }}>{c.first_item}</p>
              )}
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "#555" }}>理由: {c.reason}</p>
              {c.admin_memo && (
                <div style={{ background: "#f0f9f4", borderRadius: 8, padding: "8px 12px", marginTop: 6, borderLeft: "3px solid #8B5E3C" }}>
                  <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "#8B5E3C" }}>管理者メモ</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#333", whiteSpace: "pre-wrap" }}>{c.admin_memo}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionBox>
  );
}

// ────── 회원정보수정 섹션 ──────────────────────────────────────
interface MyInfo {
  mb_id: string; mb_name: string; mb_email: string; mb_hp: string;
  mb_sex: string; mb_birth: string;
  mb_zip1: string; mb_zip2: string; mb_addr1: string; mb_addr2: string; mb_addr3: string;
  mb_point: number; mb_deposit: number;
}

function ProfileSection({ onInfoUpdate }: { onInfoUpdate: (info: MyInfo) => void }) {
  const [info, setInfo] = useState<MyInfo | null>(null);
  const [form, setForm] = useState({ mb_name: "", mb_hp: "", mb_email: "", mb_sex: "", mb_birth: "", mb_zip1: "", mb_zip2: "", mb_addr1: "", mb_addr2: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [tab, setTab] = useState<"info" | "password">("info");

  useEffect(() => {
    authFetch("/api/shop/my-info").then(r => r.json()).then(d => {
      setInfo(d);
      setForm({ mb_name: d.mb_name, mb_hp: d.mb_hp, mb_email: d.mb_email, mb_sex: d.mb_sex, mb_birth: d.mb_birth, mb_zip1: d.mb_zip1, mb_zip2: d.mb_zip2, mb_addr1: d.mb_addr1, mb_addr2: d.mb_addr2 });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch("/api/shop/my-profile", { method: "PUT", body: JSON.stringify({ ...form, mb_addr3: "" }) });
      const data = await res.json();
      if (!res.ok) { setToast({ msg: data.error || "保存に失敗しました", type: "error" }); return; }
      setToast({ msg: "保存しました", type: "success" });
      if (info) { const updated = { ...info, ...form }; setInfo(updated); onInfoUpdate(updated); }
    } finally { setSaving(false); }
  };

  const handleChangePw = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) { setToast({ msg: "新しいパスワードが一致しません", type: "error" }); return; }
    if (pwForm.new_password.length < 6) { setToast({ msg: "パスワードは6文字以上で入力してください", type: "error" }); return; }
    setSavingPw(true);
    try {
      const res = await authFetch("/api/shop/my-profile", { method: "PUT", body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }) });
      const data = await res.json();
      if (!res.ok) { setToast({ msg: data.error || "変更に失敗しました", type: "error" }); return; }
      setToast({ msg: "パスワードを変更しました", type: "success" });
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
    } finally { setSavingPw(false); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>読み込み中...</div>;

  return (
    <SectionBox title="会員情報の変更">
      {/* 탭 */}
      <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
        {(["info", "password"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "12px 24px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? "#8B5E3C" : "#aaa", borderBottom: tab === t ? "2px solid #8B5E3C" : "2px solid transparent" }}>
            {t === "info" ? "基本情報" : "パスワード変更"}
          </button>
        ))}
      </div>

      <div style={{ padding: 24 }}>
        {tab === "info" ? (
          <>
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "#f8f9fa", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <User size={14} color="#aaa" />
              <span style={{ fontSize: 13, color: "#666" }}>ID: <strong>{info?.mb_id}</strong></span>
            </div>
            <PField label="お名前" value={form.mb_name} onChange={f("mb_name")} />
            <PField label="メールアドレス" type="email" value={form.mb_email} onChange={f("mb_email")} />
            <PField label="携帯電話" type="tel" value={form.mb_hp} onChange={f("mb_hp")} placeholder="090-0000-0000" />
            <button onClick={handleSave} disabled={saving}
              style={{ width: "100%", height: 48, background: saving ? "#aaa" : "#8B5E3C", border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", marginTop: 8 }}>
              {saving ? "保存中..." : "保存する"}
            </button>
          </>
        ) : (
          <>
            <PField label="現在のパスワード" type="password" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} />
            <PField label="新しいパスワード" type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} />
            <PField label="新しいパスワード(確認)" type="password" value={pwForm.confirm_password} onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))} />
            <button onClick={handleChangePw} disabled={savingPw}
              style={{ width: "100%", height: 48, background: savingPw ? "#aaa" : "#8B5E3C", border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 700, cursor: savingPw ? "not-allowed" : "pointer", marginTop: 8 }}>
              {savingPw ? "変更中..." : "パスワードを変更"}
            </button>
          </>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </SectionBox>
  );
}

function PField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>{label}</label>
      <input {...props} style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = "#8B5E3C"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />
    </div>
  );
}

// ────── 배송지관리 섹션 ──────────────────────────────────────────
interface Address {
  ma_id: number; ma_name: string; ma_hp: string;
  ma_zip1: string; ma_zip2: string; ma_addr1: string; ma_addr2: string; ma_addr3: string;
  ma_default: boolean;
}

function AddressSection() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = () => {
    setLoading(true);
    authFetch("/api/shop/addresses").then(r => r.json())
      .then(d => setAddresses(d.addresses || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openPostcode = async () => {
    const zipcode = (editing?.ma_zip1 || "").replace(/\D/g, "");
    if (zipcode.length !== 7) {
      setToast({ msg: "7桁の郵便番号を入力してください", type: "error" });
      return;
    }
    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
      const data = await response.json();
      const address = data.results?.[0];
      if (!address) throw new Error("該当する住所が見つかりません。住所を直接入力してください。");
      setEditing(previous => ({ ...previous, ma_zip1: zipcode, ma_addr1: `${address.address1}${address.address2}${address.address3}` }));
    } catch (error) {
      setToast({ msg: error instanceof Error ? error.message : "住所検索に失敗しました", type: "error" });
    }
  };

  const handleSave = async () => {
    if (!editing?.ma_name || !editing?.ma_addr1) { setToast({ msg: "お受け取り人とご住所を入力してください", type: "error" }); return; }
    setSaving(true);
    try {
      const url = isNew ? "/api/shop/addresses" : `/api/shop/addresses/${editing.ma_id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await authFetch(url, { method, body: JSON.stringify(editing) });
      const data = await res.json();
      if (!res.ok) { setToast({ msg: data.error || "保存に失敗しました", type: "error" }); return; }
      setToast({ msg: isNew ? "お届け先を追加しました" : "更新しました", type: "success" });
      setEditing(null); setIsNew(false); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (ma_id: number) => {
    if (!confirm("お届け先を削除してもよろしいですか?")) return;
    await authFetch(`/api/shop/addresses/${ma_id}`, { method: "DELETE" });
    setToast({ msg: "削除しました", type: "success" }); load();
  };

  const handleDefault = async (addr: Address) => {
    await authFetch(`/api/shop/addresses/${addr.ma_id}`, { method: "PUT", body: JSON.stringify({ ...addr, ma_default: true }) });
    load();
  };

  const startNew = () => {
    setEditing({ ma_name: "", ma_hp: "", ma_zip1: "", ma_zip2: "", ma_addr1: "", ma_addr2: "", ma_addr3: "", ma_default: false });
    setIsNew(true);


  };

  const ef = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => setEditing(prev => ({ ...prev, [k]: e.target.value } as any));

  return (
    <SectionBox title="お届け先管理" action={
      <button onClick={startNew} style={{ display: "flex", alignItems: "center", gap: 4, background: "#8B5E3C", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        <Plus size={13} /> お届け先を追加
      </button>
    }>
      {editing && (
        <div style={{ padding: 20, borderBottom: "2px solid #8B5E3C", background: "#FDF6EE" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#8B5E3C" }}>{isNew ? "お届け先を追加" : "お届け先を編集"}</h3>
          <PField label="お受け取り人 *" value={editing.ma_name || ""} onChange={ef("ma_name")} />
          <PField label="携帯電話" type="tel" value={editing.ma_hp || ""} onChange={ef("ma_hp")} placeholder="090-0000-0000" />

          {/* 우편번호 + 주소 검색 embed */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 6, fontWeight: 600 }}>郵便番号 / ご住所 *</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="text" inputMode="numeric" maxLength={8} value={editing.ma_zip1 || ""} onChange={ef("ma_zip1")}
                placeholder="郵便番号"
                style={{ flex: "0 0 120px", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "9px 12px", fontSize: 13, background: "#fafafa", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={openPostcode}
                style={{ flex: 1, height: 40, background: "#8B5E3C", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <MapPin size={14} />
                住所検索
              </button>
            </div>

            <input
              type="text"
              value={editing.ma_addr1 || ""}
              onChange={ef("ma_addr1")}
              placeholder="住所"
              style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "9px 12px", fontSize: 14, boxSizing: "border-box", background: "#fafafa" }}
            />
          </div>

          <PField label="建物名・部屋番号" value={editing.ma_addr2 || ""} onChange={ef("ma_addr2")} placeholder="建物名・部屋番号など" />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 16, cursor: "pointer" }}>
            <input type="checkbox" checked={!!editing.ma_default} onChange={e => setEditing(prev => ({ ...prev, ma_default: e.target.checked } as any))} />
            基本のお届け先に設定
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 1, height: 42, background: "#8B5E3C", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {saving ? "保存中..." : "保存"}
            </button>
            <button onClick={() => { setEditing(null); setIsNew(false); }}
              style={{ height: 42, background: "#fff", border: "1px solid #ddd", borderRadius: 8, color: "#888", fontSize: 14, padding: "0 16px", cursor: "pointer" }}>
              キャンセル
            </button>
          </div>
        </div>
      )}
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>読み込み中...</div>
        : addresses.length === 0 ? <EmptyBox icon={MapPin} text="保存されたお届け先がありません" />
        : (
          <div>
            {addresses.map(addr => (
              <div key={addr.ma_id} style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{addr.ma_name}</span>
                      {addr.ma_default && <span style={{ fontSize: 11, fontWeight: 700, color: "#8B5E3C", background: "#e8f8f0", padding: "2px 8px", borderRadius: 4 }}>基本</span>}
                    </div>
                    {addr.ma_hp && <p style={{ margin: "0 0 2px", fontSize: 13, color: "#666" }}>{addr.ma_hp}</p>}
                    <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{addr.ma_addr1} {addr.ma_addr2} {addr.ma_zip1 && `(${addr.ma_zip1})`}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {!addr.ma_default && (
                      <button onClick={() => handleDefault(addr)}
                        style={{ fontSize: 11, color: "#8B5E3C", background: "#e8f8f0", border: "1px solid #b8e6cc", borderRadius: 5, padding: "4px 8px", cursor: "pointer" }}>
                        基本に設定
                      </button>
                    )}
                    <button onClick={() => { setEditing({ ...addr }); setIsNew(false); }}
                      style={{ fontSize: 11, color: "#666", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 5, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                      <Pencil size={10} /> 編集
                    </button>
                    <button onClick={() => handleDelete(addr.ma_id)}
                      style={{ fontSize: 11, color: "#f44336", background: "#fff3f3", border: "1px solid #ffcdd2", borderRadius: 5, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                      <Trash2 size={10} /> 削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </SectionBox>
  );
}

// ────── 1:1 문의 섹션 ──────────────────────────────────────────
interface Inquiry { wr_id: number; wr_subject: string; wr_content: string; wr_datetime: string; has_reply: boolean; }

function InquirySection() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ subject: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = () => {
    setLoading(true);
    authFetch("/api/shop/inquiries").then(r => r.json())
      .then(d => setInquiries(d.inquiries || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.content.trim()) { setToast({ msg: "タイトルと内容を入力してください", type: "error" }); return; }
    setSubmitting(true);
    try {
      const res = await authFetch("/api/shop/inquiries", { method: "POST", body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setToast({ msg: data.error || "登録に失敗しました", type: "error" }); return; }
      setToast({ msg: "お問い合わせを送信しました", type: "success" });
      setForm({ subject: "", content: "" }); setWriting(false); load();
    } finally { setSubmitting(false); }
  };

  return (
    <SectionBox title="お問い合わせ履歴" action={
      <button onClick={() => setWriting(!writing)}
        style={{ display: "flex", alignItems: "center", gap: 4, background: "#8B5E3C", border: "none", borderRadius: 6, color: "#fff", padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        {writing ? <><X size={13} /> キャンセル</> : <><Plus size={13} /> お問い合わせ作成</>}
      </button>
    }>
      {writing && (
        <form onSubmit={handleSubmit} style={{ padding: 20, borderBottom: "2px solid #8B5E3C", background: "#FDF6EE" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#8B5E3C" }}>お問い合わせ作成</h3>
          <PField label="件名 *" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="件名を入力してください" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>内容 *</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="お問い合わせ内容を詳しく入力してください"
              style={{ width: "100%", minHeight: 120, border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          <button type="submit" disabled={submitting}
            style={{ height: 42, background: "#8B5E3C", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, padding: "0 28px", cursor: "pointer" }}>
            {submitting ? "送信中..." : "お問い合わせを送信"}
          </button>
        </form>
      )}
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>読み込み中...</div>
        : inquiries.length === 0 ? <EmptyBox icon={MessageSquare} text="お問い合わせ履歴がありません" />
        : (
          <div>
            {inquiries.map(inq => (
              <div key={inq.wr_id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <button onClick={() => setExpanded(expanded === inq.wr_id ? null : inq.wr_id)}
                  style={{ width: "100%", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 14, color: "#222", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inq.wr_subject}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#aaa" }}>{inq.wr_datetime?.slice(0, 10)}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: inq.has_reply ? "#8B5E3C" : "#f5a623", background: inq.has_reply ? "#e8f8f0" : "#fff8e8", padding: "3px 10px", borderRadius: 4 }}>
                      {inq.has_reply ? "回答済み" : "回答待ち"}
                    </span>
                    <ChevronRight size={14} color="#bbb" style={{ transform: expanded === inq.wr_id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                  </div>
                </button>
                {expanded === inq.wr_id && (
                  <div style={{ padding: "0 20px 16px", background: "#f8f9fa" }}>
                    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "14px 16px", fontSize: 13, color: "#444", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {inq.wr_content}
                    </div>
                    {!inq.has_reply && <p style={{ margin: "10px 0 0", fontSize: 12, color: "#aaa" }}>回答待ちです。営業日基準で1~2日以内にご回答いたします。</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </SectionBox>
  );
}

// ────── 리뷰 섹션 ──────────────────────────────────────────────
function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange?.(s)}
          style={{ background: "none", border: "none", padding: 2, cursor: onChange ? "pointer" : "default", fontSize: 20, color: s <= rating ? "#f59e0b" : "#ddd", lineHeight: 1 }}>★</button>
      ))}
    </div>
  );
}

function ReviewSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    authFetch("/api/shop/my-reviews").then(r => r.json())
      .then(d => setReviews(d.reviews || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const del = async (wr_id: number) => {
    if (!confirm("レビューを削除してもよろしいですか?")) return;
    await authFetch(`/api/shop/reviews/${wr_id}`, { method: "DELETE" });
    setReviews(prev => prev.filter(r => r.wr_id !== wr_id));
  };

  return (
    <SectionBox title="レビュー管理">
      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 14 }}>読み込み中...</div>
      ) : reviews.length === 0 ? (
        <EmptyBox icon={Star} text="投稿したレビューがありません" />
      ) : (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map(r => (
            <div key={r.wr_id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", background: "#f5f5f5", flexShrink: 0 }}>
                  {r.it_img1 && <img src={r.it_img1} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#222" }}>{r.it_name}</p>
                  <StarRating rating={r.wr_rating} />
                </div>
                <button onClick={() => del(r.wr_id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 4, alignSelf: "flex-start" }}>
                  <Trash2 size={16} />
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>{r.wr_content}</p>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#bbb" }}>{new Date(r.wr_datetime).toLocaleDateString("ja-JP")}</p>
            </div>
          ))}
        </div>
      )}
    </SectionBox>
  );
}

// ────── 찜리스트 섹션 ──────────────────────────────────────────
function WishlistSection() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<{ it_id: string; it_name: string; it_price: number; it_img1: string; it_soldout: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/shop/wishlist").then(r => r.json())
      .then(d => setItems(d.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const removeWish = async (it_id: string) => {
    await authFetch(`/api/shop/wishlist/${it_id}`, { method: "POST" });
    setItems(prev => prev.filter(i => i.it_id !== it_id));
  };

  if (loading) return <SectionBox title="お気に入りリスト"><div style={{ padding: 24, textAlign: "center", color: "#aaa" }}>読み込み中...</div></SectionBox>;
  if (items.length === 0) return <SectionBox title="お気に入りリスト"><EmptyBox icon={Heart} text="お気に入りの商品がありません" /></SectionBox>;
  return (
    <SectionBox title="お気に入りリスト">
      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {items.map(item => (
          <div key={item.it_id} style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: 6, right: 6, zIndex: 1 }}>
              <button onClick={() => removeWish(item.it_id)}
                style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                <Heart size={13} fill="#e91e63" color="#e91e63" />
              </button>
            </div>
            <div onClick={() => navigate(`/item/${item.it_id}`)} style={{ cursor: "pointer" }}>
              <div style={{ background: "#f8f8f8", aspectRatio: "1/1" }}>
                {item.it_img1 && <img src={item.it_img1} alt={item.it_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              </div>
              <div style={{ padding: "8px 10px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.it_name}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#8B5E3C" }}>{formatPrice(item.it_price)}</p>
                {item.it_soldout === "1" && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#e53935" }}>売り切れ</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionBox>
  );
}

// ────── 대시보드 섹션 ──────────────────────────────────────────
interface DashboardData {
  member: { mb_name: string; mb_email: string; mb_hp: string; mb_point: number };
  order_counts: Record<string, number>;
  recent_orders: { od_id: string; od_status: string; od_receipt_price: number; od_settle_case: string; od_time: string; first_item: string; first_img: string; item_count: number }[];
  coupon_unused: number;
  coupon_total: number;
  inquiry_total: number;
  inquiry_unanswered: number;
  review_count: number;
}

function DashboardSection({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/shop/my-dashboard").then(r => r.json())
      .then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const orderStatusFlow = [
    { key: "주문접수",  label: "注文受付",  icon: Package,  color: "#f5a623", bg: "#fff8e8" },
    { key: "처리중",    label: "お支払い/入金", icon: Award,    color: "#7B68EE", bg: "#f0eeff" },
    { key: "배송준비",  label: "発送準備中",  icon: RotateCcw,color: "#2196f3", bg: "#e3f2fd" },
    { key: "배송중",    label: "配送中",    icon: Truck,    color: "#009688", bg: "#e0f2f1" },
    { key: "배송완료",  label: "配送完了",  icon: CheckCircle, color: "#8B5E3C", bg: "#e8f8f0" },
  ];

  const activityCards = [
    { label: "使用可能クーポン", value: data ? `${data.coupon_unused}枚` : "-", sub: data ? `全${data.coupon_total}枚` : "", color: "#e91e63", bg: "#fce4ec", icon: Tag, onClick: () => onNavigate("coupon") },
    { label: "保有ポイント",   value: data ? `${data.member.mb_point.toLocaleString()} pt` : "-", sub: "お買い物にご利用ください", color: "#ff9800", bg: "#fff3e0", icon: Award, onClick: () => onNavigate("points") },
    { label: "お問い合わせ",     value: data ? `${data.inquiry_total}件` : "-", sub: data && data.inquiry_unanswered > 0 ? `回答待ち ${data.inquiry_unanswered}件` : "すべて回答済み", color: "#2196f3", bg: "#e3f2fd", icon: MessageSquare, onClick: () => onNavigate("inquiry") },
    { label: "投稿レビュー",     value: data ? `${data.review_count}件` : "-", sub: "レビュー履歴", color: "#9c27b0", bg: "#f3e5f5", icon: Star, onClick: () => onNavigate("review") },
  ];

  if (loading) {
    return <div style={{ padding: "60px 0", textAlign: "center", color: "#aaa", fontSize: 14 }}>読み込み中...</div>;
  }

  return (
    <div>
      {/* 주문 배송 현황 */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111" }}>注文 / 配送状況</h2>
          <button onClick={() => onNavigate("orders")} style={{ fontSize: 12, color: "#8B5E3C", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            すべて見る →
          </button>
        </div>
        <div style={{ display: "flex" }}>
          {orderStatusFlow.map((s, i) => {
            const cnt = data?.order_counts?.[s.key] || 0;
            return (
              <button key={s.key} onClick={() => onNavigate("orders")}
                style={{ flex: 1, padding: "16px 8px", background: "none", border: "none", borderRight: i < orderStatusFlow.length - 1 ? "1px solid #f5f5f5" : "none", cursor: "pointer", textAlign: "center", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fa")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: cnt > 0 ? s.bg : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                  <s.icon size={17} color={cnt > 0 ? s.color : "#ccc"} />
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: cnt > 0 ? s.color : "#bbb" }}>{cnt}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#999", lineHeight: 1.3 }}>{s.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 활동 요약 카드 4개 */}
      <div className="dashboard-activity-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {activityCards.map(card => (
          <button key={card.label} onClick={card.onClick}
            style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "16px 12px", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s", display: "block" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <card.icon size={16} color={card.color} />
            </div>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: "#999", fontWeight: 500 }}>{card.label}</p>
            <p style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 900, color: "#111" }}>{card.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#bbb" }}>{card.sub}</p>
          </button>
        ))}
      </div>

      {/* 최근 주문 */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111" }}>最近の注文</h2>
          <button onClick={() => onNavigate("orders")} style={{ fontSize: 12, color: "#8B5E3C", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            すべて見る →
          </button>
        </div>
        {!data?.recent_orders?.length ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#bbb" }}>
            <Package size={32} color="#ddd" style={{ marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 14 }}>最近の注文履歴はありません</p>
          </div>
        ) : (
          <div>
            {data.recent_orders.map(od => (
              <div key={od.od_id} style={{ padding: "14px 20px", borderBottom: "1px solid #f8f8f8", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, flexShrink: 0, background: "#f5f5f5", borderRadius: 8, overflow: "hidden", border: "1px solid #eee" }}>
                  {od.first_img
                    ? <img src={od.first_img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><Package size={18} color="#ddd" /></div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 14, color: "#222", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {od.first_item}{od.item_count > 1 ? ` 他${od.item_count - 1}点` : ""}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#999" }}>{od.od_time?.slice(0, 10)}</p>
                    <span style={{ fontSize: 12, color: "#aaa" }}>·</span>
                    <p style={{ margin: 0, fontSize: 12, color: "#888", fontWeight: 600 }}>{od.od_receipt_price.toLocaleString()}円</p>
                  </div>
                </div>
                <StatusBadge status={od.od_status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 보낸 선물 내역 */}
      <GiftSummarySection />

      <style>{`
        @media (max-width: 600px) {
          .dashboard-activity-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

const GIFT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:        { label: "住所入力待ち",    color: "#d97706", bg: "#fef3c7" },
  address_filled: { label: "お届け先入力完了", color: "#8B5E3C", bg: "#d1fae5" },
  shipped:        { label: "配送中",         color: "#2196f3", bg: "#e3f2fd" },
  delivered:      { label: "配送完了",       color: "#888",    bg: "#f5f5f5" },
};

function GiftSummarySection() {
  const token = localStorage.getItem("seoulmono_token") || "";
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch("/api/shop/gift/orders/my", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setGifts(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyLink = (t: string) => {
    const link = `${window.location.origin}/gift/recipient/${t}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(t);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111", display: "flex", alignItems: "center", gap: 6 }}>
          <Gift size={15} color="#8B5E3C" /> 送ったギフト
        </h2>
        <a href="/gift/my" style={{ fontSize: 12, color: "#8B5E3C", textDecoration: "none", fontWeight: 600 }}>すべて見る →</a>
      </div>
      {loading ? (
        <div style={{ padding: "30px 0", textAlign: "center", color: "#bbb", fontSize: 13 }}>読み込み中...</div>
      ) : gifts.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#bbb" }}>
          <Gift size={32} color="#ddd" style={{ marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 14 }}>送ったギフトの履歴はありません</p>
        </div>
      ) : (
        <div>
          {gifts.map((g: any) => {
            const st = GIFT_STATUS[g.status] || { label: g.status, color: "#888", bg: "#f5f5f5" };
            return (
              <button
                key={g.id}
                onClick={() => navigate(`/gift/order/${g.id}`)}
                style={{ padding: "13px 20px", borderBottom: "1px solid #f8f8f8", display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: 38, height: 38, background: "#FDF6EE", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Gift size={16} color="#8B5E3C" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 13.5, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {g.set_name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#aaa" }}>{g.created_at?.slice(0, 10)}</span>
                    {g.recipient_name && <span style={{ fontSize: 11, color: "#888" }}>→ {g.recipient_name}</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: "1px 7px", borderRadius: 20 }}>{st.label}</span>
                  </div>
                </div>
                <ChevronRight size={14} color="#ccc" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const VALID_SECTIONS: Section[] = ["dashboard","orders","claims","coupon","points","profile","address","inquiry","review","wishlist"];

// ────── 메인 마이페이지 ──────────────────────────────────────────
export default function Mypage() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();

  const initSection = (): Section => {
    const s = new URLSearchParams(window.location.search).get("section");
    return (VALID_SECTIONS.includes(s as Section) ? s : "dashboard") as Section;
  };

  const [section, setSection] = useState<Section>(initSection);
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    authFetch("/api/shop/my-info").then(r => r.json()).then(d => setMyInfo(d)).catch(() => {});
  }, [user]);

  const handleLogout = () => { logout(); navigate("/"); };

  if (!user) return null;

  const allMenus = [{ key: "dashboard" as Section, label: "マイ状況" }, ...MY_SHOPPING, ...MY_INFO];
  const currentLabel = allMenus.find(m => m.key === section)?.label || "";

  const handleNav = (s: Section) => { setSection(s); setMobileSidebarOpen(false); };

  const sidebarContent = (
    <>
      <div style={{ background: "#8B5E3C", borderRadius: "10px 10px 0 0", padding: "18px 16px" }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>マイページ</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{user.mb_name}様、ようこそ</p>
        {myInfo && (
          <div style={{ marginTop: 10 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>保有ポイント</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>{myInfo.mb_point.toLocaleString()} D</p>
          </div>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid #eee", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
        <SideBtn label="マイ状況" icon={<LayoutDashboard size={13} />} active={section === "dashboard"}
          onClick={() => handleNav("dashboard")} />

        <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, color: "#8B5E3C", letterSpacing: 0.5, borderTop: "1px solid #f5f5f5" }}>MYショッピング</div>
        {MY_SHOPPING.map(({ key, label, icon: Icon }) => (
          <SideBtn key={key} label={label} icon={<Icon size={13} />} active={section === key}
            onClick={() => handleNav(key)} />
        ))}

        <div style={{ padding: "10px 16px 4px", fontSize: 11, fontWeight: 700, color: "#8B5E3C", letterSpacing: 0.5, marginTop: 4, borderTop: "1px solid #f5f5f5" }}>MY情報</div>
        {MY_INFO.map(({ key, label, icon: Icon }) => (
          <SideBtn key={key} label={label} icon={<Icon size={13} />} active={section === key}
            onClick={() => handleNav(key)} />
        ))}

        <div style={{ padding: "10px 16px", borderTop: "1px solid #f5f5f5", marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#aaa", padding: "4px 0" }}>
            <LogOut size={12} /> ログアウト
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      {/* 모바일 상단 탭 바 */}
      <div className="mypage-mobile-header" style={{ display: "none", background: "#8B5E3C", padding: "12px 16px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>マイページ · {currentLabel}</p>
          <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, padding: "4px 10px", color: "#fff", fontSize: 12, cursor: "pointer" }}>
            メニュー
          </button>
        </div>
        {myInfo && (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
            ポイント {myInfo.mb_point.toLocaleString()} pt
          </span>
        )}
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {mobileSidebarOpen && (
        <div className="mypage-mobile-menu" style={{ background: "#fff", border: "1px solid #eee", padding: "8px 0" }}>
          <button onClick={() => handleNav("dashboard")}
            style={{ width: "100%", padding: "12px 20px", background: section === "dashboard" ? "#FDF6EE" : "none", border: "none", borderLeft: section === "dashboard" ? "3px solid #8B5E3C" : "3px solid transparent", cursor: "pointer", fontSize: 14, color: section === "dashboard" ? "#8B5E3C" : "#555", fontWeight: section === "dashboard" ? 700 : 400, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
            <LayoutDashboard size={14} /> マイ状況
          </button>
          {[...MY_SHOPPING, ...MY_INFO].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => handleNav(key)}
              style={{ width: "100%", padding: "12px 20px", background: section === key ? "#FDF6EE" : "none", border: "none", borderLeft: section === key ? "3px solid #8B5E3C" : "3px solid transparent", cursor: "pointer", fontSize: 14, color: section === key ? "#8B5E3C" : "#555", fontWeight: section === key ? 700 : 400, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}

      <div className="page-wrap" style={{ paddingTop: 20, paddingBottom: 80 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* 사이드바 (데스크탑) */}
          <aside className="mypage-sidebar" style={{ width: 180, flexShrink: 0 }}>
            {sidebarContent}
          </aside>

          {/* 콘텐츠 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {section === "dashboard" && <DashboardSection onNavigate={handleNav} />}
            {section === "orders" && <OrdersSection />}
            {section === "claims" && <ClaimsSection />}
            {section === "coupon" && <CouponSection />}
            {section === "points" && <PointsSection />}
            {section === "profile" && <ProfileSection onInfoUpdate={info => setMyInfo(info)} />}
            {section === "address" && <AddressSection />}
            {section === "inquiry" && <InquirySection />}
            {section === "review" && <ReviewSection />}
            {section === "wishlist" && <WishlistSection />}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .mypage-sidebar { display: none !important; }
          .mypage-mobile-header { display: block !important; }
          .mypage-mobile-menu { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function SideBtn({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 7, width: "100%",
      padding: "9px 16px", background: active ? "#FDF6EE" : "none",
      border: "none", borderLeft: active ? "3px solid #8B5E3C" : "3px solid transparent",
      cursor: "pointer", fontSize: 13, color: active ? "#8B5E3C" : "#555",
      fontWeight: active ? 700 : 400, textAlign: "left",
    }}>
      {icon} {label}
    </button>
  );
}
