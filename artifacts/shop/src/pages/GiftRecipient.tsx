import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { MapPin, Phone, User, Loader2, Check, AlertCircle, ChevronRight } from "lucide-react";

declare global {
  interface Window { daum: any }
}

interface GiftOrder {
  id: number; set_name: string; slot_count: number;
  sender_message?: string; status: string; created_at: string;
  recipient_name?: string; address_filled: boolean;
  items: { it_id: string; it_name: string; it_img1: string }[];
}

function imgUrl(p: string) {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  if (p.startsWith("/")) return p;
  return `/api/product-image/${p}`;
}

const COLORS = {
  bg: "#FFFCF9",
  surface: "#FFFFFF",
  textMain: "#2D2A26",
  textMuted: "#9E9590",
  textSoft: "#B5ADA8",
  accent: "#D4726A",
  accentSoft: "#FDF1F0",
  accentLight: "#FAEAE8",
  border: "#F0EAE6",
  borderFocus: "#E8D5D2",
  success: "#5A9E7A",
  successBg: "#F0FAF4",
  successBorder: "#D4EDE0",
  shadow: "0 2px 12px rgba(45, 30, 25, 0.06)",
  shadowUp: "0 8px 32px rgba(45, 30, 25, 0.10)",
};

export default function GiftRecipientPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<GiftOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/shop/gift/recipient/${token}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setOrder(data); if (data.address_filled) setDone(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const openPostcode = () => {
    if (window.daum?.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data: any) => {
          setPostcode(data.zonecode);
          setAddress(data.roadAddress || data.jibunAddress);
        },
      }).open();
    } else {
      alert("住所検索機能を読み込み中です。しばらくしてからもう一度お試しください。");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) { alert("必須項目をすべて入力してください"); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`/api/shop/gift/recipient/${token}/address`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_name: name, recipient_phone: phone, recipient_postcode: postcode, recipient_address: address, recipient_address_detail: addressDetail }),
      });
      const data = await r.json();
      if (data.ok) setDone(true);
      else alert(data.error || "保存に失敗しました");
    } catch { alert("エラーが発生しました。もう一度お試しください。"); }
    setSubmitting(false);
  };

  const S = {
    page: { minHeight: "100vh", background: COLORS.bg, fontFamily: "'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: COLORS.textMain } as React.CSSProperties,
    maxW: { maxWidth: 420, margin: "0 auto", padding: "0 20px 48px" } as React.CSSProperties,
    card: { background: COLORS.surface, borderRadius: 20, border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadow } as React.CSSProperties,
    label: { display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textMuted, marginBottom: 8, letterSpacing: "0.2px" } as React.CSSProperties,
    input: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${COLORS.border}`, borderRadius: 14, padding: "14px 14px 14px 42px", fontSize: 15, color: COLORS.textMain, background: COLORS.surface, outline: "none", fontFamily: "inherit", transition: "border-color .2s, box-shadow .2s" } as React.CSSProperties,
    inputBare: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${COLORS.border}`, borderRadius: 14, padding: 14, fontSize: 15, color: COLORS.textMain, background: COLORS.surface, outline: "none", fontFamily: "inherit", transition: "border-color .2s, box-shadow .2s" } as React.CSSProperties,
  };

  if (loading) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} style={{ color: COLORS.accent, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ ...S.page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <AlertCircle size={44} style={{ color: "#ddd", marginBottom: 16 }} />
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#555", margin: "0 0 6px" }}>ギフトが見つかりません</h2>
        <p style={{ fontSize: 14, color: "#aaa", textAlign: "center" }}>リンクの有効期限が切れているか、存在しないギフトです。</p>
      </div>
    );
  }

  return (
    <>
      <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" async />
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .gf{animation:fadeUp .5s cubic-bezier(.2,.8,.2,1) both}
        .gf-1{animation-delay:0s}
        .gf-2{animation-delay:.08s}
        .gf-3{animation-delay:.16s}
        .gf-4{animation-delay:.24s}
        .gf-5{animation-delay:.32s}
        .gift-input:focus { border-color:${COLORS.accent} !important; box-shadow:0 0 0 3px rgba(212,114,106,.12) !important; }
        .gift-input-bare:focus { border-color:${COLORS.accent} !important; box-shadow:0 0 0 3px rgba(212,114,106,.12) !important; }
      `}</style>

      <div style={S.page}>

        {/* ── Hero: clean, warm, minimal ── */}
        <div style={{ textAlign: "center", padding: "52px 24px 8px" }}>
          <div className="gf gf-1" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: "50%", background: COLORS.accentSoft, marginBottom: 20 }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>🎁</span>
          </div>
          <h1 className="gf gf-2" style={{ fontSize: 26, fontWeight: 800, color: COLORS.textMain, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            ギフトが届きました
          </h1>
          <p className="gf gf-3" style={{ fontSize: 15, color: COLORS.textMuted, margin: 0, lineHeight: 1.5 }}>
            大切な方が心を込めて贈ってくださいました
          </p>
        </div>

        <div style={S.maxW}>

          {/* ── Gift Card ── */}
          {order && (
            <div className="gf gf-2" style={{ ...S.card, padding: "24px 20px", marginTop: 28, marginBottom: 14 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: COLORS.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 24 }}>🎀</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: COLORS.textMain, lineHeight: 1.35 }}>{order.set_name}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: COLORS.textSoft }}>{order.slot_count}点セット</p>
                </div>
              </div>

              {/* Items */}
              {order.items.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: order.sender_message ? 16 : 0 }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img
                        src={imgUrl(item.it_img1)} alt={item.it_name}
                        style={{ width: 64, height: 64, borderRadius: 14, objectFit: "cover", border: `1.5px solid ${COLORS.border}`, display: "block" }}
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Message */}
              {order.sender_message && (
                <div style={{ background: COLORS.accentSoft, borderRadius: 14, padding: "14px 16px", border: `1px solid ${COLORS.accentLight}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 13 }}>💌</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.accent, letterSpacing: "0.3px" }}>ギフトメッセージ</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "#5c4a4a", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                    {order.sender_message}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Done State ── */}
          {done ? (
            <div className="gf gf-3" style={{ ...S.card, padding: "36px 24px", textAlign: "center", border: `1px solid ${COLORS.successBorder}`, background: COLORS.successBg }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, #5A9E7A, #4A8F6A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 18px",
                boxShadow: "0 6px 20px rgba(90,158,122,.30)",
              }}>
                <Check size={28} color="#fff" strokeWidth={3} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: COLORS.textMain, margin: "0 0 8px" }}>お届け先が登録されました</h3>
              <p style={{ fontSize: 14, color: COLORS.textMuted, margin: 0, lineHeight: 1.7 }}>
                ご入力いただいた住所にギフトをお届けします。<br />ありがとうございます!
              </p>
              <div style={{ marginTop: 18, padding: "12px 14px", background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.successBorder}`, fontSize: 13, color: COLORS.success }}>
                📦 発送準備が完了しましたらSMSでご案内します
              </div>
            </div>
          ) : (

            /* ── Form ── */
            <form onSubmit={handleSubmit} className="gf gf-3" style={{ ...S.card, padding: "26px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h3 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 800, color: COLORS.textMain, display: "flex", alignItems: "center", gap: 7 }}>
                  <MapPin size={16} color={COLORS.accent} />
                  お届け先入力
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textSoft }}>ギフトをお受け取りになる住所を入力してください</p>
              </div>

              {/* Name */}
              <div>
                <label style={S.label}>お受け取り人のお名前 *</label>
                <div style={{ position: "relative" }}>
                  <User size={15} color={COLORS.textSoft} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input className="gift-input" style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="お名前を入力してください" required />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={S.label}>ご連絡先 *</label>
                <div style={{ position: "relative" }}>
                  <Phone size={15} color={COLORS.textSoft} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input className="gift-input" style={S.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" type="tel" required />
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={S.label}>ご住所 *</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    className="gift-input-bare"
                    style={{ ...S.inputBare, width: 100, cursor: "pointer", color: postcode ? COLORS.textMain : COLORS.textSoft, background: postcode ? COLORS.surface : "#FAF8F6" }}
                    value={postcode} readOnly placeholder="郵便番号"
                    onClick={openPostcode}
                  />
                  <button type="button" onClick={openPostcode} style={{
                    flex: 1, border: `1.5px solid ${COLORS.border}`, borderRadius: 14,
                    background: COLORS.surface, color: COLORS.accent,
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}>
                    住所検索 <ChevronRight size={14} />
                  </button>
                </div>
                <input
                  className="gift-input-bare"
                  style={{ ...S.inputBare, marginBottom: 8, cursor: "pointer", color: address ? COLORS.textMain : COLORS.textSoft, background: address ? COLORS.surface : "#FAF8F6" }}
                  value={address} readOnly placeholder="基本住所"
                  onClick={openPostcode}
                />
                <input
                  className="gift-input-bare gift-input"
                  style={{ ...S.inputBare, cursor: "text" }}
                  value={addressDetail} onChange={e => setAddressDetail(e.target.value)}
                  placeholder="建物名・部屋番号など"
                />
              </div>

              <button
                type="submit" disabled={submitting}
                style={{
                  width: "100%", height: 54,
                  background: submitting ? "#d5d0cc" : COLORS.accent,
                  border: "none", borderRadius: 16, color: "#fff",
                  fontSize: 16, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: submitting ? "none" : "0 4px 16px rgba(212,114,106,.35)",
                  transition: "all .2s",
                }}
              >
                {submitting ? (
                  <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> 登録中...</>
                ) : (
                  <><Check size={17} strokeWidth={2.5} /> お届け先を確認</>
                )}
              </button>

              <p style={{ margin: 0, textAlign: "center", fontSize: 12, color: COLORS.textSoft }}>
                ご入力いただいた情報は配送目的のみに使用されます
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
