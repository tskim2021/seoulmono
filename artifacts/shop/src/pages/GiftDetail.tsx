import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Gift, Loader2, Package, Send, Phone,
  User, MessageSquare, Copy, Check, ExternalLink, AlertCircle,
  Cake, Sun, GraduationCap, Heart, PenLine, Share2, Truck,
  CreditCard, Building2,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CAT_THEMES: Record<string, { accent: string; grad: string; emoji: string }> = {
  "10": { accent: "#92400e", grad: "linear-gradient(135deg,#78350f 0%,#b45309 100%)", emoji: "🍪" },
  "20": { accent: "#4A2C0A", grad: "linear-gradient(135deg,#3E2008 0%,#1a6b40 100%)", emoji: "🫙" },
  "30": { accent: "#1e3a5f", grad: "linear-gradient(135deg,#1e3a5f 0%,#1d4a8a 100%)", emoji: "🥫" },
};
const DEFAULT_THEME = { accent: "#4A2C0A", grad: "linear-gradient(135deg,#0d2b1a 0%,#1a5c35 100%)", emoji: "🎁" };

const CAT_TABS = [
  { id: "", label: "すべて", emoji: "🎁" },
  { id: "10", label: "お菓子類", emoji: "🍪" },
  { id: "20", label: "油脂類", emoji: "🫙" },
  { id: "30", label: "缶詰類", emoji: "🥫" },
];

interface GiftPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  thumb_img: string;
  ca_id: string;
  item_count: number;
  items: { id: number; it_id: string; it_name: string; it_img1: string; quantity: number }[];
}

const GUIDE_STEPS = [
  { n: "1", Icon: Gift,     title: "ギフトパッケージを選ぶ", desc: "お気に入りのギフトパッケージをお選びください",        color: "#8B5E3C" },
  { n: "2", Icon: PenLine,  title: "メッセージ作成",     desc: "受取人様への温かいメッセージをご記入ください", color: "#8B5E3C" },
  { n: "3", Icon: Share2,   title: "リンクを送る",       desc: "KakaoTalkやSMSでギフトリンクを送りましょう",      color: "#8B5E3C" },
  { n: "4", Icon: Truck,    title: "seoulmonoが配送",   desc: "受取人様が住所を入力するとすぐに発送します",  color: "#8B5E3C" },
];

const USE_CASES = [
  { Icon: Cake,          title: "誕生日ギフト", desc: "大切な人の誕生日を特別に",    bg: "#fff0f5", iconColor: "#e11d78" },
  { Icon: Sun,           title: "季節のご挨拶ギフト", desc: "旧正月・秋夕に感謝の気持ちを",  bg: "#fff8ed", iconColor: "#d97706" },
  { Icon: GraduationCap, title: "記念日ギフト", desc: "卒業・昇進・入学のお祝いに",      bg: "#eff6ff", iconColor: "#2563eb" },
  { Icon: Heart,         title: "感謝ギフト", desc: "お世話になった方へ感謝の気持ちを",    bg: "#fdf4ff", iconColor: "#9333ea" },
];

const MSG_TEMPLATES = [
  { id: "birthday", emoji: "🎂", label: "誕生日のお祝い", text: "お誕生日おめでとうございます!健康で幸せな一日をお過ごしください 🎉" },
  { id: "thanks",   emoji: "🙏", label: "感謝のメッセージ", text: "いつもありがとうございます。ささやかな贈り物で気持ちをお届けします 😊" },
  { id: "holiday",  emoji: "🎊", label: "季節のご挨拶", text: "良いお正月をお迎えください!ご家族と幸せな時間をお過ごしください 🌸" },
  { id: "cheer",    emoji: "💪", label: "応援メッセージ", text: "いつも応援しています。頑張ってください!ファイト! 🔥" },
  { id: "congrat",  emoji: "🎓", label: "お祝いのメッセージ", text: "おめでとうございます!これからも輝く日々が続きますように ✨" },
  { id: "custom",   emoji: "✏️", label: "自分で入力", text: "" },
];

export default function GiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [, navigate] = useLocation();

  const [pkg, setPkg] = useState<GiftPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  // 주문 폼 상태
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [giftToken, setGiftToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  // 결제 단계 상태
  const [modalStep, setModalStep] = useState<"form" | "pay">("form");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [payMethod, setPayMethod] = useState<"bank" | "card" | null>(null);
  const [bankInfo, setBankInfo] = useState({ bank_name: "", bank_num: "", bank_holder: "", bank_memo: "" });
  const [paySettings, setPaySettings] = useState({ bank_enabled: true, card_enabled: false });
  const [payError, setPayError] = useState("");

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

  useEffect(() => {
    if (!id) return;
    fetch(`/api/shop/gift/packages/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setPkg(data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  const theme = pkg ? (CAT_THEMES[pkg.ca_id] || DEFAULT_THEME) : DEFAULT_THEME;

  const handleGift = () => {
    if (!user) {
      navigate(`${BASE}/login?redirect=/gift/${id}`);
      return;
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!pkg) return;
    if (!senderName.trim() || !senderPhone.trim()) { setPayError("送り主のお名前とご連絡先を入力してください。"); return; }
    if (!payMethod) { setPayError("お支払い方法を選択してください。"); return; }
    setPayError("");
    setSubmitting(true);
    try {
      const r = await fetch("/api/shop/gift/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          set_ca_id: pkg.ca_id,
          set_name: pkg.name,
          slot_count: pkg.item_count,
          items: pkg.items.map(it => ({
            it_id: it.it_id,
            it_name: it.it_name,
            it_img1: it.it_img1,
            quantity: it.quantity,
          })),
          recipient_name: recipientName || null,
          recipient_phone: recipientPhone || null,
          sender_message: message || null,
          sender_name: senderName,
          sender_phone: senderPhone,
          payment_method: payMethod,
        }),
      });
      const data = await r.json();
      if (data.token) {
        setGiftToken(data.token);
      } else {
        setPayError(data.error || "ギフトの送信に失敗しました");
      }
    } catch {
      setPayError("エラーが発生しました。もう一度お試しください。");
    }
    setSubmitting(false);
  };

  const giftLink = giftToken
    ? `${window.location.origin}${BASE}/gift/recipient/${giftToken}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(giftLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareKakao = async () => {
    const shareText = `${pkg?.name} のギフトが届きました!\n下のリンクから住所を入力してください。\n${giftLink}`;
    if (typeof window !== "undefined" && (window as any).Kakao?.isInitialized?.()) {
      (window as any).Kakao.Share.sendDefault({
        objectType: "text",
        text: shareText,
        link: { mobileWebUrl: giftLink, webUrl: giftLink },
      });
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: `${pkg?.name} のギフトが届きました!`, text: shareText, url: giftLink });
        return;
      } catch { /* キャンセル時は無視 */ }
    }
    copyLink();
    alert("Kakao共有を使用するには、Kakao JSキーを設定してください。\nリンクをクリップボードにコピーしました。");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 size={40} color="#8B5E3C" className="animate-spin" />
      </div>
    );
  }

  if (notFound || !pkg) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <AlertCircle size={48} color="#ddd" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 17, color: "#555" }}>ギフトパッケージが見つかりません</p>
        <button onClick={() => navigate(`${BASE}/gift`)}
          style={{ marginTop: 16, padding: "10px 24px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700 }}>
          一覧へ
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>

      {/* ── 상단 이미지/히어로 ── */}
      <div style={{ background: theme.grad, position: "relative", overflow: "hidden", minHeight: 280 }}>
        {/* 장식 원 */}
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.1)" }} />
        <div style={{ position: "absolute", left: -30, bottom: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />

        <div className="page-wrap" style={{ padding: "24px 20px 36px", position: "relative" }}>
          <button
            onClick={() => navigate(`${BASE}/gift`)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "rgba(255,255,255,.2)", border: "none",
              borderRadius: 20, padding: "6px 14px",
              color: "#fff", fontSize: 13, cursor: "pointer",
              marginBottom: 24, backdropFilter: "blur(4px)",
            }}
          >
            <ArrowLeft size={14} /> 一覧へ
          </button>

          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 카테고리 배지 */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,.25)", borderRadius: 20,
                padding: "5px 14px", fontSize: 13, fontWeight: 700, color: "#fff",
                marginBottom: 12, backdropFilter: "blur(4px)",
              }}>
                <span>{theme.emoji}</span>
                {pkg.item_count}点入りギフトセット
              </div>

              <h1 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.25 }}>
                {pkg.name}
              </h1>

              {pkg.description && (
                <p style={{ margin: "0 0 18px", fontSize: 14, color: "rgba(255,255,255,.85)", lineHeight: 1.65 }}>
                  {pkg.description}
                </p>
              )}

              {pkg.price > 0 && (
                <div style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,.95)", borderRadius: 14,
                  padding: "10px 20px",
                }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: theme.accent }}>
                    {pkg.price.toLocaleString()}円
                  </span>
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>~</span>
                </div>
              )}
            </div>

            {/* 패키지 이미지 */}
            {pkg.thumb_img && (
              <div style={{ flexShrink: 0, width: "clamp(100px,22%,180px)", borderRadius: 18, overflow: "hidden", boxShadow: "0 12px 36px rgba(0,0,0,.22)" }}>
                <img src={pkg.thumb_img} alt={pkg.name}
                  style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* — 카테고리 탭 — */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="page-wrap" style={{ display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto" }}>
          {CAT_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === pkg.ca_id) return;
                setActiveTab(tab.id);
                navigate(`${BASE}/gift` + (tab.id ? `?cat=${tab.id}` : ""));
              }}
              style={{
                flexShrink: 0, padding: "7px 16px", borderRadius: 24,
                border: (tab.id ? tab.id === pkg.ca_id : !pkg.ca_id) ? "none" : "1.5px solid #e8e8e8",
                cursor: "pointer", fontWeight: 700, fontSize: 13,
                background: (tab.id ? tab.id === pkg.ca_id : !pkg.ca_id) ? theme.accent : "#fff",
                color: (tab.id ? tab.id === pkg.ca_id : !pkg.ca_id) ? "#fff" : "#555",
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-wrap" style={{ padding: "0 16px 100px" }}>

        {/* — 구성 상품 — */}
        {pkg.items.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "22px 20px", margin: "20px 0 0", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Package size={18} color={theme.accent} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#111" }}>
                構成商品 <span style={{ color: theme.accent, fontSize: 14 }}>{pkg.items.length}点</span>
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {pkg.items.map(item => (
                <div key={item.id} style={{
                  border: "1.5px solid #f0f0f0", borderRadius: 14,
                  overflow: "hidden", background: "#fafafa",
                }}>
                  <div style={{ height: 100, background: "#eee", position: "relative", overflow: "hidden" }}>
                    {item.it_img1 ? (
                      <img src={item.it_img1} alt={item.it_name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>🎁</div>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px 10px" }}>
                    <p style={{
                      margin: "0 0 3px", fontSize: 11.5, fontWeight: 600, color: "#333",
                      lineHeight: 1.4, overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                    }}>
                      {item.it_name}
                    </p>
                    {item.quantity > 1 && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: theme.accent }}>
                        × {item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 이용 안내 섹션 ── */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "32px 20px 28px", margin: "16px 0 0", boxShadow: "0 2px 16px rgba(0,0,0,.06)" }}>
          {/* 헤더 */}
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#8B5E3C", fontWeight: 700, textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase" }}>Gift Guide</p>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#111", textAlign: "center", letterSpacing: "-0.5px", lineHeight: 1.3 }}>
            こんな日は、seoulmonoで
          </h2>
          <p style={{ margin: "0 0 26px", fontSize: 13, color: "#999", textAlign: "center" }}>悩む時間は短く、想いは深く</p>

          {/* 사용 상황 카드 2×2 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 28 }}>
            {USE_CASES.map((uc, i) => (
              <div key={i} style={{
                background: uc.bg,
                borderRadius: 18, padding: "18px 14px 16px",
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,.07)",
                }}>
                  <uc.Icon size={22} color={uc.iconColor} strokeWidth={2} />
                </div>
                <div>
                  <p style={{ margin: "0 0 3px", fontSize: 13.5, fontWeight: 800, color: "#111" }}>{uc.title}</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: "#888", lineHeight: 1.55 }}>{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 구분선 */}
          <div style={{ height: 1, background: "#f0f0f0", margin: "0 0 24px" }} />

          {/* 이용 방법 */}
          <p style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 800, color: "#111", textAlign: "center", letterSpacing: "-0.2px" }}>
            ギフトの贈り方
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {GUIDE_STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative" }}>
                {/* 세로 연결선 */}
                {i < GUIDE_STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", left: 19, top: 44, bottom: 0,
                    width: 2, background: "linear-gradient(to bottom, #d1fae5, #f0fdf7)",
                    zIndex: 0,
                  }} />
                )}
                {/* 아이콘 원 */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, #8B5E3C, #25a065)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, boxShadow: "0 3px 10px rgba(29,138,90,.25)",
                  position: "relative", zIndex: 1,
                  marginBottom: i < GUIDE_STEPS.length - 1 ? 0 : 0,
                }}>
                  <step.Icon size={17} color="#fff" strokeWidth={2.2} />
                </div>
                {/* 텍스트 */}
                <div style={{ flex: 1, paddingBottom: i < GUIDE_STEPS.length - 1 ? 22 : 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13.5, fontWeight: 800, color: "#111", paddingTop: 10 }}>
                    <span style={{ color: "#8B5E3C", marginRight: 4 }}>{step.n}.</span>{step.title}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 유의사항 ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px", margin: "16px 0 0", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#555" }}>ギフトサービスのご注意</p>
          {[
            "ギフトリンクを受取人様にお送りし、住所が入力されると配送が始まります。",
            "ご購入後の交換・返品は、商品ごとのご案内に従って処理されます。",
            "ギフトリンクでの住所入力は1回のみ可能です。",
            "配送予定時間はご注文時に確認でき、状況により変更される場合があります。",
          ].map((notice, i) => (
            <p key={i} style={{ margin: "0 0 5px", fontSize: 12, color: "#888", lineHeight: 1.6, paddingLeft: 10, position: "relative" }}>
              <span style={{ position: "absolute", left: 0 }}>·</span>
              {notice}
            </p>
          ))}
        </div>
      </div>

      {/* ── 하단 고정 선물하기 버튼 ── */}
      <div style={{
        position: "fixed", bottom: "var(--mobile-nav-height, 0px)", left: 0, right: 0,
        background: "#fff", borderTop: "1px solid #eee",
        padding: "10px 20px", zIndex: 50,
        boxShadow: "0 -3px 12px rgba(0,0,0,.07)",
        display: "flex", justifyContent: "flex-end", alignItems: "center",
      }}>
        <div className="page-wrap" style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleGift}
            style={{
              padding: "10px 28px",
              background: "linear-gradient(90deg, #8B5E3C, #25a065)",
              color: "#fff", border: "none",
              borderRadius: 10, fontSize: 14,
              fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 2px 10px rgba(29,138,90,.3)",
            }}
          >
            <Gift size={15} />
            {user ? "このギフトをすぐに贈る" : "ログインしてギフトを贈る"}
          </button>
        </div>
      </div>

      {/* ── 선물하기 모달 ── */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)",
            zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={e => { if (e.target === e.currentTarget && !giftToken) setShowModal(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: "24px 24px 0 0",
            width: "100%", maxWidth: 560,
            maxHeight: "85vh", overflow: "y-auto",
            boxShadow: "0 -8px 40px rgba(0,0,0,.2)",
          }}>
            {/* 모달 헤더 */}
            <div style={{ padding: "20px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {modalStep === "pay" && !giftToken && (
                  <button onClick={() => setModalStep("form")} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px 2px 0", display: "flex", alignItems: "center" }}>
                    <ArrowLeft size={18} color="#555" />
                  </button>
                )}
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#111" }}>
                  {giftToken ? "ギフトリンク作成完了 🎉" : modalStep === "pay" ? "お支払い" : "ギフトを贈る"}
                </h3>
              </div>
              {!giftToken && modalStep === "form" && (
                <button onClick={() => setShowModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#aaa", lineHeight: 1 }}>
                  ×
                </button>
              )}
            </div>

            <div style={{ padding: "18px 22px 28px", overflowY: "auto", maxHeight: "70vh" }}>

              {!giftToken && modalStep === "form" ? (
                <>
                  {/* 선택된 패키지 미리보기 */}
                  <div style={{
                    background: `${theme.accent}10`, border: `1.5px solid ${theme.accent}25`,
                    borderRadius: 14, padding: "12px 14px", marginBottom: 20,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 24 }}>{theme.emoji}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#111" }}>{pkg.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>{pkg.item_count}点入り · {pkg.price > 0 ? `${pkg.price.toLocaleString()}円` : ""}</p>
                    </div>
                  </div>

                  {/* 받는 분 이름 (선택) */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#555", marginBottom: 6 }}>
                      お受け取り人のお名前 <span style={{ color: "#aaa", fontWeight: 400 }}>(任意)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <User size={15} color="#bbb" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        value={recipientName}
                        onChange={e => setRecipientName(e.target.value)}
                        placeholder="山田 太郎"
                        style={{
                          width: "100%", height: 44, paddingLeft: 36, paddingRight: 14,
                          border: "1.5px solid #eee", borderRadius: 12,
                          fontSize: 14, outline: "none", boxSizing: "border-box",
                          fontFamily: "inherit",
                        }}
                        onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = theme.accent; }}
                        onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "#eee"; }}
                      />
                    </div>
                  </div>

                  {/* 연락처 (선택) */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#555", marginBottom: 6 }}>
                      ご連絡先 <span style={{ color: "#aaa", fontWeight: 400 }}>(任意)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Phone size={15} color="#bbb" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        value={recipientPhone}
                        onChange={e => setRecipientPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        type="tel"
                        style={{
                          width: "100%", height: 44, paddingLeft: 36, paddingRight: 14,
                          border: "1.5px solid #eee", borderRadius: 12,
                          fontSize: 14, outline: "none", boxSizing: "border-box",
                          fontFamily: "inherit",
                        }}
                        onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = theme.accent; }}
                        onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "#eee"; }}
                      />
                    </div>
                  </div>

                  {/* 메시지 */}
                  <div style={{ marginBottom: 22 }}>
                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#555", marginBottom: 10 }}>
                      ギフトメッセージ <span style={{ color: "#aaa", fontWeight: 400 }}>(任意)</span>
                    </label>

                    {/* 템플릿 카드 그리드 */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                      {MSG_TEMPLATES.map(t => {
                        const isSelected = selectedTemplate === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTemplate(t.id);
                              if (t.id !== "custom") setMessage(t.text);
                              else setMessage("");
                            }}
                            style={{
                              border: isSelected ? `2px solid ${theme.accent}` : "1.5px solid #eee",
                              borderRadius: 14,
                              padding: "12px 8px 10px",
                              background: isSelected ? `${theme.accent}12` : "#fafafa",
                              cursor: "pointer",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                              transition: "all .15s",
                            }}
                          >
                            <span style={{ fontSize: 22 }}>{t.emoji}</span>
                            <span style={{
                              fontSize: 11, fontWeight: 700,
                              color: isSelected ? theme.accent : "#666",
                              textAlign: "center", lineHeight: 1.3,
                            }}>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 선택된 템플릿 미리보기 / 직접 입력 */}
                    {selectedTemplate && (
                      <div style={{ position: "relative" }}>
                        {selectedTemplate === "custom" ? (
                          <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="温かい気持ちを込めて、メッセージをご記入ください"
                            rows={3}
                            autoFocus
                            style={{
                              width: "100%", padding: "12px 14px",
                              border: `1.5px solid ${theme.accent}`,
                              borderRadius: 12,
                              fontSize: 14, outline: "none", resize: "none",
                              boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6,
                              background: "#fff",
                            }}
                          />
                        ) : (
                          <div style={{
                            background: `${theme.accent}09`,
                            border: `1.5px solid ${theme.accent}30`,
                            borderRadius: 12, padding: "14px 16px",
                            fontSize: 14, color: "#333", lineHeight: 1.7,
                            position: "relative",
                          }}>
                            <MessageSquare size={14} color={theme.accent} style={{ marginRight: 6, verticalAlign: "middle", opacity: 0.7 }} />
                            {message}
                            <button
                              type="button"
                              onClick={() => setSelectedTemplate("custom")}
                              style={{
                                position: "absolute", top: 10, right: 10,
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: 11, color: "#999", fontWeight: 600,
                              }}
                            >編集</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setModalStep("pay")}
                    style={{
                      width: "100%", padding: "15px 0",
                      background: `linear-gradient(90deg, #8B5E3C, #25a065)`,
                      color: "#fff", border: "none", borderRadius: 14,
                      fontSize: 15, fontWeight: 900, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <CreditCard size={18} />
                    お支払いへ
                  </button>
                </>
              ) : !giftToken && modalStep === "pay" ? (
                /* ── 결제 단계 ── */
                (() => {
                  const payMethods = [
                    paySettings.bank_enabled && { key: "bank" as const, label: "銀行振込", desc: "ご注文後に口座へお振り込み", icon: <Building2 size={16} /> },
                    paySettings.card_enabled && { key: "card" as const, label: "クレジットカード", desc: "TossPaymentsカード決済", icon: <CreditCard size={16} /> },
                  ].filter(Boolean) as { key: "bank"|"card"; label: string; desc: string; icon: React.ReactNode }[];
                  const pkgPrice = pkg?.price || 0;
                  return (
                    <>
                      {/* 보내는 분 정보 */}
                      <div style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: "0 0 10px" }}>送り主情報</p>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>お名前</label>
                          <div style={{ position: "relative" }}>
                            <User size={14} color="#bbb" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                            <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="山田 太郎"
                              style={{ width: "100%", height: 42, paddingLeft: 32, paddingRight: 12, border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#666", display: "block", marginBottom: 4 }}>ご連絡先</label>
                          <div style={{ position: "relative" }}>
                            <Phone size={14} color="#bbb" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                            <input value={senderPhone} onChange={e => setSenderPhone(e.target.value)} placeholder="01012345678" type="tel"
                              style={{ width: "100%", height: 42, paddingLeft: 32, paddingRight: 12, border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                          </div>
                        </div>
                      </div>

                      {/* 결제수단 */}
                      <div style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: "0 0 10px" }}>お支払い方法</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {payMethods.map(m => (
                            <button key={m.key} onClick={() => setPayMethod(m.key)}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `2px solid ${payMethod === m.key ? "#8B5E3C" : "#e5e7eb"}`, borderRadius: 10, background: payMethod === m.key ? "#FEF6ED" : "#fff", cursor: "pointer", textAlign: "left" }}>
                              <span style={{ color: payMethod === m.key ? "#8B5E3C" : "#888" }}>{m.icon}</span>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: payMethod === m.key ? "#8B5E3C" : "#333" }}>{m.label}</p>
                                <p style={{ margin: 0, fontSize: 11.5, color: "#999" }}>{m.desc}</p>
                              </div>
                              <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${payMethod === m.key ? "#8B5E3C" : "#ddd"}`, background: payMethod === m.key ? "#8B5E3C" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {payMethod === m.key && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 무통장 계좌 안내 */}
                      {payMethod === "bank" && (bankInfo.bank_num || bankInfo.bank_name) && (
                        <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 800, color: "#4A2C0A", margin: "0 0 8px" }}>お振込先口座情報</p>
                          {bankInfo.bank_name && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, color: "#555" }}>銀行名</span><span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{bankInfo.bank_name}</span></div>}
                          {bankInfo.bank_num && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, color: "#555" }}>口座番号</span><span style={{ fontSize: 12, fontWeight: 700, color: "#111", fontFamily: "monospace" }}>{bankInfo.bank_num}</span></div>}
                          {bankInfo.bank_holder && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, color: "#555" }}>口座名義</span><span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{bankInfo.bank_holder}</span></div>}
                          {pkgPrice > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: "#555" }}>お振込金額</span><span style={{ fontSize: 13, fontWeight: 900, color: "#8B5E3C" }}>{pkgPrice.toLocaleString()}円</span></div>}
                          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#16a34a" }}>入金確認後にギフトを発送します。</p>
                        </div>
                      )}

                      {payError && <p style={{ color: "#e53935", fontSize: 12.5, margin: "0 0 10px", textAlign: "center" }}>{payError}</p>}

                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                          width: "100%", padding: "15px 0",
                          background: submitting ? "#ccc" : `linear-gradient(90deg, #8B5E3C, #25a065)`,
                          color: "#fff", border: "none", borderRadius: 14,
                          fontSize: 15, fontWeight: 900,
                          cursor: submitting ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                      >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {submitting ? "処理中..." : payMethod === "bank" ? "お振り込みしてギフトリンクを受け取る" : "お支払いしてギフトリンクを受け取る"}
                      </button>
                    </>
                  );
                })()
              ) : (
                /* ── 링크 완성 화면 ── */
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                  <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#111" }}>
                    ギフトリンクが作成されました!
                  </p>
                  <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "#666", lineHeight: 1.6 }}>
                    下のリンクを受取人様にお送りください。<br />
                    受取人様が住所を入力するとすぐに配送されます。
                  </p>

                  {/* 링크 박스 */}
                  <div style={{
                    background: "#f8f9fa", border: "1.5px solid #eee",
                    borderRadius: 14, padding: "12px 14px",
                    marginBottom: 14, textAlign: "left",
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#888", wordBreak: "break-all", lineHeight: 1.6 }}>
                      {giftLink}
                    </p>
                  </div>

                  {/* 버튼 그룹 */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={copyLink}
                      style={{
                        flex: 1, padding: "13px 0",
                        background: copied ? "#8B5E3C" : "#f5f5f5",
                        color: copied ? "#fff" : "#333",
                        border: "none", borderRadius: 12,
                        fontSize: 14, fontWeight: 800, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all .2s",
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? "コピーしました!" : "リンクをコピー"}
                    </button>
                    <button
                      onClick={shareKakao}
                      style={{
                        flex: 1, padding: "13px 0",
                        background: "#FEE500",
                        color: "#3C1E1E", border: "none", borderRadius: 12,
                        fontSize: 14, fontWeight: 800, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <ExternalLink size={16} /> Kakaoで共有
                    </button>
                  </div>

                  {/* 문자 전송 */}
                  {!showSmsInput ? (
                    <button
                      onClick={() => setShowSmsInput(true)}
                      style={{
                        marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                        width: "100%", padding: "13px 0",
                        background: "linear-gradient(135deg, #00b894, #00cec9)",
                        color: "#fff", border: "none", borderRadius: 12,
                        fontSize: 14, fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      <Phone size={16} strokeWidth={2.5} />
                      SMSで送信する
                    </button>
                  ) : (
                    <div style={{ marginTop: 10, background: "#f0faf8", border: "1.5px solid #00b894", borderRadius: 12, padding: "14px" }}>
                      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: "#00856e" }}>受取人様の電話番号</p>
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
                                body: JSON.stringify({ phone: smsPhone, giftLink, setName: pkg?.name }),
                              });
                              const d = await r.json();
                              if (d.ok) { setSmsSent(true); setTimeout(() => { setSmsSent(false); setShowSmsInput(false); setSmsPhone(""); }, 2500); }
                              else alert(d.error || "送信に失敗しました");
                            } catch { alert("エラーが発生しました。"); }
                            setSmsSending(false);
                          }}
                          style={{
                            padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                            background: smsSent ? "#8B5E3C" : "#00b894", color: "#fff",
                            fontWeight: 800, fontSize: 13, flexShrink: 0,
                            opacity: (smsSending || smsPhone.length < 10) ? 0.6 : 1,
                          }}
                        >
                          {smsSending ? "送信中..." : smsSent ? "✓ 送信完了" : "送信"}
                        </button>
                      </div>
                      <button onClick={() => { setShowSmsInput(false); setSmsPhone(""); }}
                        style={{ marginTop: 8, background: "none", border: "none", fontSize: 11, color: "#aaa", cursor: "pointer" }}>
                        キャンセル
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => { setShowModal(false); navigate(`${BASE}/gift`); }}
                    style={{
                      marginTop: 10, width: "100%", padding: "12px 0",
                      background: "none", border: "1.5px solid #eee",
                      borderRadius: 12, fontSize: 13.5, fontWeight: 700,
                      color: "#888", cursor: "pointer",
                    }}
                  >
                    一覧に戻る
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
