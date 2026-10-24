import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Gift, Package, Copy, Check, Phone, MapPin,
  MessageSquareHeart, Loader2, Share2, ExternalLink, Truck, Clock,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:        { label: "주소 대기중",   color: "#d97706", bg: "#fef3c7", icon: Clock },
  address_filled: { label: "배송지 입력완료", color: "#059669", bg: "#d1fae5", icon: MapPin },
  shipped:        { label: "배송중",        color: "#2563eb", bg: "#dbeafe", icon: Truck },
  delivered:      { label: "배송완료",      color: "#6b7280", bg: "#f3f4f6", icon: Package },
};

interface GiftOrder {
  id: number; token: string; set_name: string; slot_count: number;
  set_ca_id: string;
  recipient_name?: string; recipient_phone?: string;
  recipient_postcode?: string; recipient_address?: string; recipient_address_detail?: string;
  sender_message?: string; status: string;
  created_at: string; address_filled_at?: string;
  tracking_number?: string; admin_memo?: string;
  items: { it_id: string; it_name: string; it_img1: string; quantity: number }[];
}

export default function GiftOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [, navigate] = useLocation();
  const [order, setOrder] = useState<GiftOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    if (!user) { navigate(`${BASE}/login`); return; }
    fetch(`/api/shop/gift/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); } else { setOrder(data); }
        setLoading(false);
      })
      .catch(() => { setError("불러오는 중 오류가 발생했습니다."); setLoading(false); });
  }, [id, user]);

  const giftLink = order ? `${window.location.origin}${BASE}/gift/recipient/${order.token}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(giftLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareKakao = () => {
    if (!order) return;
    const text = `${order.set_name} 선물이 도착했어요! 🎁\n아래 링크에서 배송지를 입력해주세요.\n${giftLink}`;
    if ((window as any).Kakao?.isInitialized?.()) {
      (window as any).Kakao.Share.sendDefault({
        objectType: "text", text,
        link: { mobileWebUrl: giftLink, webUrl: giftLink },
      });
    } else if (navigator.share) {
      navigator.share({ title: `${order.set_name} 선물이 도착했어요!`, text, url: giftLink });
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Loader2 size={32} color="#8B5E3C" className="animate-spin" />
    </div>
  );

  if (error || !order) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <p style={{ color: "#999" }}>{error || "주문을 찾을 수 없습니다."}</p>
      <button onClick={() => navigate(`${BASE}/gift/my`)}
        style={{ marginTop: 16, padding: "10px 24px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>
        목록으로
      </button>
    </div>
  );

  const st = STATUS_MAP[order.status] || { label: order.status, color: "#888", bg: "#f5f5f5", icon: Package };
  const StatusIcon = st.icon;
  const addressFilled = order.status !== "pending";

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f8", paddingBottom: 80 }}>

      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="page-wrap" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate(`${BASE}/gift/my`)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#555", fontWeight: 600, padding: 0 }}>
            <ArrowLeft size={18} /> 뒤로
          </button>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#111" }}>보낸 선물 상세</h1>
        </div>
      </div>

      <div className="page-wrap" style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>

        {/* 상태 카드 */}
        <div style={{
          background: `linear-gradient(135deg, ${st.bg}, #fff)`,
          border: `1.5px solid ${st.color}33`,
          borderRadius: 18, padding: "20px 22px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: st.bg, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: `0 4px 14px ${st.color}33`,
          }}>
            <StatusIcon size={24} color={st.color} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: st.color, background: st.bg, padding: "3px 10px", borderRadius: 20 }}>
                {st.label}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#111", letterSpacing: "-0.3px" }}>{order.set_name}</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#999" }}>
              주문일: {new Date(order.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* 구성 상품 */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 6 }}>
            <Gift size={15} color="#8B5E3C" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>구성 상품</span>
            <span style={{ fontSize: 12, color: "#bbb", marginLeft: 4 }}>{order.slot_count}개입</span>
          </div>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", background: "#f7f7f7", flexShrink: 0, border: "1px solid #eee" }}>
                  {item.it_img1 ? (
                    <img src={item.it_img1} alt={item.it_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>🎁</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#111" }}>{item.it_name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>수량 {item.quantity}개</p>
                </div>
              </div>
            ))}
            {order.items.length === 0 && (
              <p style={{ margin: 0, color: "#bbb", fontSize: 13 }}>구성 상품 정보가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 메시지 */}
        {order.sender_message && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", marginBottom: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 6 }}>
              <MessageSquareHeart size={15} color="#c2640a" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>선물 메시지</span>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#444", lineHeight: 1.7, background: "#fef9f0", borderRadius: 10, padding: "12px 14px", borderLeft: "3px solid #c2640a" }}>
                {order.sender_message}
              </p>
            </div>
          </div>
        )}

        {/* 받는 분 정보 */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={15} color="#2563eb" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>받는 분 정보</span>
          </div>
          <div style={{ padding: "14px 18px" }}>
            {!addressFilled ? (
              <div style={{ textAlign: "center", padding: "16px 0", color: "#bbb" }}>
                <Clock size={28} color="#e5e7eb" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 13 }}>아직 배송지를 입력하지 않았습니다</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ccc" }}>아래 링크를 받는 분께 전달해주세요</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "👤", label: "이름",    value: order.recipient_name },
                  { icon: "📱", label: "연락처",  value: order.recipient_phone },
                  { icon: "📮", label: "우편번호", value: order.recipient_postcode },
                  { icon: "📍", label: "주소",    value: order.recipient_address },
                  { icon: "🏠", label: "상세주소", value: order.recipient_address_detail },
                ].filter(r => r.value).map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: "#aaa", marginBottom: 2 }}>{row.label}</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#222" }}>{row.value}</p>
                    </div>
                  </div>
                ))}
                {order.address_filled_at && (
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#bbb" }}>
                    입력일시: {new Date(order.address_filled_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 배송 추적 */}
        {order.tracking_number && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", marginBottom: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 6 }}>
              <Truck size={15} color="#2563eb" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>배송 추적</span>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#444" }}>운송장 번호: <strong>{order.tracking_number}</strong></p>
            </div>
          </div>
        )}

        {/* 선물 링크 공유 */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 6 }}>
            <Share2 size={15} color="#7c3aed" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>선물 링크</span>
          </div>
          <div style={{ padding: "14px 18px" }}>
            <div style={{ background: "#f8f9fa", border: "1.5px solid #eee", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#888", wordBreak: "break-all", lineHeight: 1.6 }}>{giftLink}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyLink} style={{
                flex: 1, padding: "11px 0",
                background: copied ? "#8B5E3C" : "#f5f5f5",
                color: copied ? "#fff" : "#333",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                transition: "all .2s",
              }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "복사됨!" : "링크 복사"}
              </button>
              <button onClick={shareKakao} style={{
                flex: 1, padding: "11px 0",
                background: "#FEE500", color: "#3C1E1E",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                <ExternalLink size={14} /> 카카오 공유
              </button>
            </div>
            {!showSmsInput ? (
              <button
                onClick={() => setShowSmsInput(true)}
                style={{
                  marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  width: "100%", padding: "11px 0",
                  background: "linear-gradient(135deg, #00b894, #00cec9)",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 13, fontWeight: 800, cursor: "pointer",
                }}>
                <Phone size={14} strokeWidth={2.5} /> 문자로 전송하기
              </button>
            ) : (
              <div style={{ marginTop: 8, background: "#f0faf8", border: "1.5px solid #00b894", borderRadius: 12, padding: "14px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: "#00856e" }}>받는 분 전화번호</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="tel" value={smsPhone}
                    onChange={e => setSmsPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="01012345678"
                    style={{
                      flex: 1, padding: "10px 12px", borderRadius: 8,
                      border: "1.5px solid #b2dfdb", fontSize: 14, outline: "none",
                    }}
                  />
                  <button
                    disabled={smsSending || smsSent || smsPhone.length < 10}
                    onClick={async () => {
                      setSmsSending(true);
                      try {
                        const r = await fetch("/api/shop/gift/send-sms", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ phone: smsPhone, giftLink, setName: order.set_name }),
                        });
                        const d = await r.json();
                        if (d.ok) { setSmsSent(true); setTimeout(() => { setSmsSent(false); setShowSmsInput(false); setSmsPhone(""); }, 2500); }
                        else alert(d.error || "발송 실패");
                      } catch { alert("오류가 발생했습니다."); }
                      setSmsSending(false);
                    }}
                    style={{
                      padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                      background: smsSent ? "#8B5E3C" : "#00b894", color: "#fff",
                      fontWeight: 800, fontSize: 13, flexShrink: 0,
                      opacity: (smsSending || smsPhone.length < 10) ? 0.6 : 1,
                    }}
                  >
                    {smsSending ? "발송중..." : smsSent ? "✓ 발송완료" : "전송"}
                  </button>
                </div>
                <button onClick={() => { setShowSmsInput(false); setSmsPhone(""); }}
                  style={{ marginTop: 8, background: "none", border: "none", fontSize: 11, color: "#aaa", cursor: "pointer" }}>
                  취소
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
