import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Gift, Trash2, Plus, Minus, Send, Copy, Check,
  MessageCircle, Loader2, ChevronRight, ArrowLeft, ExternalLink, Package,
  CreditCard, Building2, User, Phone,
} from "lucide-react";
import {
  getGiftCart, removeFromGiftCart, updateGiftCartQty, clearGiftCart,
  getGiftCartTotal, GIFT_CART_EVENT, type GiftCartItem
} from "@/lib/gift-cart";
import { useAuth } from "@/contexts/AuthContext";

type PayStep = "cart" | "pay";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = import.meta.env.VITE_API_URL ?? "";
function fmtPrice(n: number) { return n > 0 ? n.toLocaleString() + "円" : "-"; }

function imgUrl(p: string) {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  if (p.startsWith("/")) return p;
  return `/api/product-image/${p}`;
}

export default function GiftCartPage() {
  const [, navigate] = useLocation();
  const { user, token } = useAuth();
  const [cart, setCart] = useState<GiftCartItem[]>(getGiftCart);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ token: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [payStep, setPayStep] = useState<PayStep>("cart");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [payMethod, setPayMethod] = useState<"bank" | "card" | null>(null);
  const [bankInfo, setBankInfo] = useState({ bank_name: "", bank_num: "", bank_holder: "", bank_memo: "" });
  const [paySettings, setPaySettings] = useState({ bank_enabled: true, card_enabled: false });
  const [payError, setPayError] = useState("");

  const refresh = useCallback(() => setCart(getGiftCart()), []);

  useEffect(() => {
    window.addEventListener(GIFT_CART_EVENT, refresh);
    return () => window.removeEventListener(GIFT_CART_EVENT, refresh);
  }, [refresh]);

  useEffect(() => {
    const tok = localStorage.getItem("seoulmono_token");
    if (tok) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${tok}` } })
        .then(r => r.ok ? r.json() : null)
        .then(u => { if (u) { setSenderName(u.mb_name || ""); setSenderPhone(u.mb_hp || ""); } })
        .catch(() => {});
    }
    fetch("/api/shop/footer-config")
      .then(r => r.json())
      .then(d => setBankInfo({ bank_name: d.bank_name || "", bank_num: d.bank_num || "", bank_holder: d.bank_holder || "", bank_memo: d.bank_memo || "" }))
      .catch(() => {});
    fetch("/api/settings/payment")
      .then(r => r.json())
      .then(s => setPaySettings(s))
      .catch(() => {});
  }, []);

  const total = cart.reduce((s, c) => s + c.it_price * c.quantity, 0);

  const handleQty = (it_id: string, delta: number) => {
    const cur = cart.find(c => c.it_id === it_id)?.quantity ?? 0;
    const next = cur + delta;
    if (next <= 0) removeFromGiftCart(it_id);
    else updateGiftCartQty(it_id, next);
  };

  const handleOrder = async () => {
    if (!user) { navigate("/login"); return; }
    if (cart.length === 0) return;
    if (!senderName.trim() || !senderPhone.trim()) { setPayError("送り主のお名前とご連絡先を入力してください。"); return; }
    if (!payMethod) { setPayError("お支払い方法を選択してください。"); return; }
    setPayError("");
    setSubmitting(true);
    try {
      const tok = localStorage.getItem("seoulmono_token");
      const r = await fetch(`${API_BASE}/api/shop/gift/orders/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({
          items: cart.map(c => ({ it_id: c.it_id, it_name: c.it_name, it_img1: imgUrl(c.it_img1), quantity: c.quantity })),
          sender_message: message,
          set_name: "オリジナルギフトセット",
          sender_name: senderName,
          sender_phone: senderPhone,
          payment_method: payMethod,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        const receiveUrl = `${window.location.origin}${BASE}/gift/recipient/${data.token}`;
        setResult({ token: data.token, url: receiveUrl });
        clearGiftCart();
      } else {
        setPayError(data.error || "注文に失敗しました");
      }
    } catch {
      setPayError("エラーが発生しました。もう一度お試しください。");
    }
    setSubmitting(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleKakao = () => {
    if (!result) return;
    const msg = encodeURIComponent(`ソウルモノからギフトが届きました!\nお届け先を入力してください:\n${result.url}`);
    window.open(`https://open.kakao.com/o/share?text=${msg}`, "_blank");
  };

  const [showSmsInput, setShowSmsInput] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handleSms = async () => {
    if (!result || smsPhone.length < 10) return;
    setSmsSending(true);
    try {
      const r = await fetch("/api/shop/gift/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: smsPhone, giftLink: result.url, setName: "ギフトセット" }),
      });
      const d = await r.json();
      if (d.ok) {
        setSmsSent(true);
        setTimeout(() => { setSmsSent(false); setShowSmsInput(false); setSmsPhone(""); }, 2500);
      } else {
        alert(d.error || "送信に失敗しました");
      }
    } catch { alert("エラーが発生しました。"); }
    setSmsSending(false);
  };

  // ── 주문 완료 화면 ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          {/* 성공 아이콘 */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 80, height: 80, background: "linear-gradient(135deg,#8B5E3C,#25a870)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 28px rgba(29,138,90,0.35)" }}>
              <Gift size={40} color="#fff" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#111", margin: "0 0 8px" }}>ギフトリンクが作成されました!</h2>
            <p style={{ fontSize: 14, color: "#666", margin: 0 }}>このリンクを受取人様に共有すると、お届け先を直接入力してギフトをお受け取りいただけます</p>
          </div>

          {/* URL 박스 */}
          <div style={{ background: "#fff", border: "1.5px solid #d1fae5", borderRadius: 16, padding: "16px", marginBottom: 16, boxShadow: "0 4px 16px rgba(29,138,90,0.1)" }}>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>お届け先入力リンク</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <p style={{ flex: 1, fontSize: 12.5, color: "#374151", wordBreak: "break-all", margin: 0, fontFamily: "monospace", background: "#f9fafb", borderRadius: 8, padding: "8px 10px" }}>
                {result.url}
              </p>
              <button onClick={handleCopy} style={{ background: copied ? "#8B5E3C" : "#f3f4f6", border: "none", borderRadius: 10, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
                {copied ? <Check size={18} color="#fff" /> : <Copy size={18} color="#555" />}
              </button>
            </div>
          </div>

          {/* 공유 버튼들 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <button
              onClick={handleCopy}
              style={{ background: copied ? "#8B5E3C" : "#fff", border: `1.5px solid ${copied ? "#8B5E3C" : "#e0e0e0"}`, borderRadius: 14, height: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 700, color: copied ? "#fff" : "#333", cursor: "pointer", transition: "all 0.2s" }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "コピーしました!" : "リンクをコピー"}
            </button>
            {!showSmsInput ? (
              <button
                onClick={() => setShowSmsInput(true)}
                style={{ background: "#3b82f6", border: "none", borderRadius: 14, height: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}
              >
                <MessageCircle size={18} />
                SMSで送る
              </button>
            ) : (
              <div style={{ borderRadius: 14, border: "1.5px solid #3b82f6", background: "#eff6ff", padding: "12px 14px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: "#1d4ed8" }}>受取人様の電話番号</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="tel" value={smsPhone}
                    onChange={e => setSmsPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="01012345678" autoFocus
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1.5px solid #bfdbfe", fontSize: 14, outline: "none" }}
                  />
                  <button
                    onClick={handleSms}
                    disabled={smsSending || smsSent || smsPhone.length < 10}
                    style={{
                      padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                      background: smsSent ? "#8B5E3C" : "#3b82f6", color: "#fff",
                      fontWeight: 800, fontSize: 13, flexShrink: 0,
                      opacity: (smsSending || smsPhone.length < 10) ? 0.6 : 1,
                    }}
                  >
                    {smsSending ? "送信中..." : smsSent ? "✓ 完了" : "送信"}
                  </button>
                </div>
                <button onClick={() => { setShowSmsInput(false); setSmsPhone(""); }}
                  style={{ marginTop: 6, background: "none", border: "none", fontSize: 11, color: "#93c5fd", cursor: "pointer" }}>
                  キャンセル
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => window.open(result.url, "_blank")}
            style={{ width: "100%", height: 48, background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#555", cursor: "pointer", marginBottom: 20 }}
          >
            <ExternalLink size={16} />
            受取人画面のプレビュー
          </button>

          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.6 }}>
              💡 リンクをKakaoTalkやSMSなどで受取人様にお送りください。受取人様がお届け先を入力すると、管理者が確認のうえ発送します。
            </p>
          </div>

          <button onClick={() => navigate("/gift")} style={{ width: "100%", marginTop: 20, height: 48, background: "#8B5E3C", border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            ギフトトップへ
          </button>
        </div>
      </div>
    );
  }

  // ── 결제 단계 ────────────────────────────────────────────────────────────────
  if (payStep === "pay") {
    const payMethods = [
      paySettings.bank_enabled && { key: "bank" as const, label: "銀行振込", desc: "ご注文後に口座へお振り込み", icon: <Building2 size={18} /> },
      paySettings.card_enabled && { key: "card" as const, label: "クレジットカード", desc: "TossPaymentsカード決済", icon: <CreditCard size={18} /> },
    ].filter(Boolean) as { key: "bank" | "card"; label: string; desc: string; icon: React.ReactNode }[];

    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 80 }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50 }}>
          <button onClick={() => setPayStep("cart")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ArrowLeft size={22} color="#333" />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: "#111", margin: 0 }}>お支払い</h1>
        </div>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>
          {/* 주문 요약 */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f0", padding: "16px 18px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: "0 0 10px" }}>ご注文商品 ({cart.length}点)</p>
            {cart.slice(0, 3).map(c => (
              <div key={c.it_id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "#f5f5f5", flexShrink: 0 }}>
                  <img src={imgUrl(c.it_img1)} alt={c.it_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
                <p style={{ flex: 1, margin: 0, fontSize: 12.5, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.it_name} ×{c.quantity}</p>
              </div>
            ))}
            {cart.length > 3 && <p style={{ fontSize: 12, color: "#aaa", margin: "4px 0 0" }}>他 {cart.length - 3}点</p>}
            <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#888" }}>お支払い合計</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#8B5E3C" }}>{fmtPrice(total)}</span>
            </div>
          </div>

          {/* 보내는 분 정보 */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f0", padding: "18px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 14px" }}>送り主情報</p>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>お名前</label>
              <div style={{ position: "relative" }}>
                <User size={15} color="#bbb" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="山田 太郎"
                  style={{ width: "100%", height: 44, paddingLeft: 36, paddingRight: 12, border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: "#555", display: "block", marginBottom: 5 }}>ご連絡先</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} color="#bbb" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="01012345678" type="tel"
                  style={{ width: "100%", height: 44, paddingLeft: 36, paddingRight: 12, border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>

          {/* 결제수단 */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f0", padding: "18px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 14px" }}>お支払い方法</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {payMethods.map(m => (
                <button key={m.key} onClick={() => setPayMethod(m.key)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `2px solid ${payMethod === m.key ? "#8B5E3C" : "#e5e7eb"}`, borderRadius: 12, background: payMethod === m.key ? "#FEF6ED" : "#fff", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ color: payMethod === m.key ? "#8B5E3C" : "#888" }}>{m.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: payMethod === m.key ? "#8B5E3C" : "#333" }}>{m.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#999" }}>{m.desc}</p>
                  </div>
                  <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", border: `2px solid ${payMethod === m.key ? "#8B5E3C" : "#ddd"}`, background: payMethod === m.key ? "#8B5E3C" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {payMethod === m.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 무통장 계좌 안내 */}
          {payMethod === "bank" && (bankInfo.bank_num || bankInfo.bank_name) && (
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#4A2C0A", margin: "0 0 10px" }}>お振込先口座情報</p>
              {bankInfo.bank_name && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12.5, color: "#555" }}>銀行名</span><span style={{ fontSize: 12.5, fontWeight: 700, color: "#111" }}>{bankInfo.bank_name}</span></div>}
              {bankInfo.bank_num && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12.5, color: "#555" }}>口座番号</span><span style={{ fontSize: 12.5, fontWeight: 700, color: "#111", fontFamily: "monospace" }}>{bankInfo.bank_num}</span></div>}
              {bankInfo.bank_holder && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12.5, color: "#555" }}>口座名義</span><span style={{ fontSize: 12.5, fontWeight: 700, color: "#111" }}>{bankInfo.bank_holder}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12.5, color: "#555" }}>お振込金額</span><span style={{ fontSize: 14, fontWeight: 900, color: "#8B5E3C" }}>{fmtPrice(total)}</span></div>
              {bankInfo.bank_memo && <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "#888", lineHeight: 1.6, background: "#fff", borderRadius: 8, padding: "8px 10px" }}>{bankInfo.bank_memo}</p>}
              <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#16a34a" }}>入金確認後にギフトを発送します。</p>
            </div>
          )}

          {payError && <p style={{ color: "#e53935", fontSize: 13, margin: "0 0 12px", textAlign: "center" }}>{payError}</p>}

          <button
            onClick={handleOrder}
            disabled={submitting}
            style={{ width: "100%", height: 56, background: submitting ? "#9ca3af" : "linear-gradient(135deg,#8B5E3C,#25a870)", border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 900, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 6px 20px rgba(29,138,90,0.35)" }}
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            {submitting ? "処理中..." : payMethod === "bank" ? `${fmtPrice(total)} をお振り込みしてギフトリンクを受け取る` : "お支払いしてギフトリンクを受け取る"}
          </button>
        </div>
      </div>
    );
  }

  // ── 빈 장바구니 ─────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Package size={60} color="#d1d5db" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#374151", marginBottom: 8 }}>ギフトカートは空です</h2>
        <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 28 }}>ギフトにする商品を入れてみましょう</p>
        <button onClick={() => navigate("/gift/custom")} style={{ background: "#8B5E3C", border: "none", color: "#fff", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          商品を選びに行く
        </button>
      </div>
    );
  }

  // ── 메인 장바구니 + 체크아웃 ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 100 }}>
      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => navigate("/gift/custom")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={22} color="#333" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 900, color: "#111", margin: 0 }}>ギフトカート</h1>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#888" }}>{cart.length}点の商品</span>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>
        {/* 상품 목록 */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f0", overflow: "hidden", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 8 }}>
            <Gift size={16} color="#8B5E3C" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>選択した商品 ({cart.length})</span>
          </div>
          {cart.map(item => (
            <div key={item.it_id} style={{ display: "flex", gap: 12, padding: "14px 18px", borderBottom: "1px solid #f5f5f5", alignItems: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", background: "#f5f5f5", flexShrink: 0 }}>
                <img src={imgUrl(item.it_img1)} alt={item.it_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, color: "#222", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.it_name}</p>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#8B5E3C" }}>{fmtPrice(item.it_price)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e0e0e0", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                <button onClick={() => handleQty(item.it_id, -1)} style={{ width: 30, height: 30, background: "#f9f9f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Minus size={12} />
                </button>
                <span style={{ width: 28, textAlign: "center", fontSize: 13, fontWeight: 700 }}>{item.quantity}</span>
                <button onClick={() => handleQty(item.it_id, 1)} style={{ width: 30, height: 30, background: "#f9f9f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={12} />
                </button>
              </div>
              <button onClick={() => removeFromGiftCart(item.it_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4, flexShrink: 0 }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#888" }}>商品金額合計</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#8B5E3C" }}>{fmtPrice(total)}</span>
          </div>
        </div>

        {/* 선물 메시지 */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f0", padding: "18px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <label style={{ fontSize: 14, fontWeight: 800, color: "#111", display: "block", marginBottom: 10 }}>
            💌 ギフトメッセージ <span style={{ fontWeight: 400, color: "#aaa", fontSize: 12 }}>(任意)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="受取人様へのメッセージを入力してください..."
            maxLength={200}
            style={{ width: "100%", height: 90, border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#374151" }}
          />
          <p style={{ textAlign: "right", fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>{message.length}/200</p>
        </div>

        {/* 안내 박스 */}
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, color: "#0369a1", margin: 0, lineHeight: 1.7 }}>
            <strong>📦 ギフト配送のご案内</strong><br />
            ご注文後に作成されたリンクを受取人様にお送りください。<br />
            受取人様がお届け先を直接入力すると、管理者の確認後に発送されます。
          </p>
        </div>

        {/* 로그인 필요 안내 */}
        {!user && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#9a3412", margin: 0 }}>
              ⚠️ ギフトのご注文はログイン後にご利用いただけます。
            </p>
          </div>
        )}

        {/* 결제하기 버튼 */}
        <button
          onClick={!user ? () => navigate("/login") : () => setPayStep("pay")}
          disabled={cart.length === 0}
          style={{ width: "100%", height: 56, background: "linear-gradient(135deg,#8B5E3C,#25a870)", border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 6px 20px rgba(29,138,90,0.35)", transition: "all 0.2s" }}
        >
          <CreditCard size={20} />
          {!user ? "ログインしてお支払い" : "お支払いへ進む"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
