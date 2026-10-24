import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Megaphone, Handshake, Send, CheckCircle, Building2, User, Phone, Mail, AlignLeft, FileText } from "lucide-react";

const TYPES = ["광고 문의", "제휴 문의", "공동구매 제안", "기타 문의"];
const TYPE_JA: Record<string, string> = { "광고 문의": "広告のお問い合わせ", "제휴 문의": "提携のお問い合わせ", "공동구매 제안": "共同購入のご提案", "기타 문의": "その他のお問い合わせ" };

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#e53e3e", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #e0e0e0",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

export default function PartnershipPage() {
  const [, nav] = useLocation();
  const [form, setForm] = useState({
    inquiry_type: "광고 문의",
    company_name: "",
    contact_name: "",
    phone: "",
    email: "",
    subject: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = "#8B5E3C";
  };
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = "#e0e0e0";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact_name || !form.phone || !form.email || !form.subject || !form.content) {
      setError("必須項目をすべて入力してください。"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/shop/partnership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "お問い合わせの送信に失敗しました。"); return; }
      setDone(true);
    } catch { setError("サーバーエラーが発生しました。しばらくしてからもう一度お試しください。"); } finally { setLoading(false); }
  };

  return (
    <div style={{ background: "#f7f8fa", minHeight: "60vh" }}>

        {/* 상단 배너 */}
        <div style={{
          background: "linear-gradient(135deg, #8B5E3C 0%, #0e6b41 100%)",
          padding: "40px 20px 32px",
          color: "#fff",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <button onClick={() => nav("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 4, fontSize: 13, padding: 0, marginBottom: 16 }}>
              <ChevronLeft size={15} /> ホームへ
            </button>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Megaphone size={22} color="#fff" />
              </div>
              <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Handshake size={22} color="#fff" />
              </div>
            </div>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px" }}>広告 / 提携のお問い合わせ</h1>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
              ソウルモノと一緒に成長するパートナーをお待ちしています。<br />
              広告、提携、共同購入など、さまざまな形で協力いたします。
            </p>
          </div>
        </div>

        {/* 안내 카드 */}
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { icon: <Megaphone size={20} color="#8B5E3C" />, title: "広告のお問い合わせ", desc: "バナー・メール・SNS広告" },
              { icon: <Handshake size={20} color="#8B5E3C" />, title: "提携のお問い合わせ", desc: "共同マーケティング・出店のご提案" },
              { icon: <Building2 size={20} color="#8B5E3C" />, title: "共同購入のご提案", desc: "団体・法人購入のご相談" },
            ].map(c => (
              <div key={c.title} style={{ background: "#fff", borderRadius: 12, padding: "16px 14px", border: "1.5px solid #F2E4D0", textAlign: "center" }}>
                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>{c.icon}</div>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#8B5E3C" }}>{c.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{c.desc}</p>
              </div>
            ))}
          </div>

          {/* 완료 화면 */}
          {done ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: "48px 24px", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ width: 64, height: 64, background: "#F2E4D0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle size={32} color="#8B5E3C" />
              </div>
              <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 900, color: "#8B5E3C" }}>お問い合わせを受け付けました</h2>
              <p style={{ margin: "0 0 8px", fontSize: 14, color: "#555", lineHeight: 1.7 }}>
                お問い合わせありがとうございます。<br />担当者より近日中にご連絡いたします。
              </p>
              <p style={{ margin: "0 0 24px", fontSize: 12, color: "#aaa" }}>平日 10:00 ~ 18:00 基準で1~2営業日以内にご返信</p>
              <button onClick={() => nav("/")} style={{ padding: "12px 32px", background: "#8B5E3C", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ホームに戻る
              </button>
            </div>
          ) : (
            /* 문의 폼 */
            <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={17} color="#8B5E3C" /> お問い合わせ内容
              </h2>

              {/* 문의 유형 */}
              <Field label="お問い合わせ種別" required>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, inquiry_type: t }))}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 20,
                        border: `1.5px solid ${form.inquiry_type === t ? "#8B5E3C" : "#e0e0e0"}`,
                        background: form.inquiry_type === t ? "#F2E4D0" : "#fff",
                        color: form.inquiry_type === t ? "#8B5E3C" : "#666",
                        fontSize: 13,
                        fontWeight: form.inquiry_type === t ? 700 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >{TYPE_JA[t] ?? t}</button>
                  ))}
                </div>
              </Field>

              {/* 회사명 */}
              <Field label="会社名/ブランド名">
                <div style={{ position: "relative" }}>
                  <Building2 size={14} color="#aaa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={set("company_name")}
                    placeholder="会社名またはブランド名 (任意)"
                    style={{ ...inputStyle, paddingLeft: 34 }}
                    onFocus={focus} onBlur={blur}
                  />
                </div>
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* 담당자명 */}
                <Field label="ご担当者名" required>
                  <div style={{ position: "relative" }}>
                    <User size={14} color="#aaa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      value={form.contact_name}
                      onChange={set("contact_name")}
                      placeholder="山田 太郎"
                      required
                      style={{ ...inputStyle, paddingLeft: 34 }}
                      onFocus={focus} onBlur={blur}
                    />
                  </div>
                </Field>

                {/* 연락처 */}
                <Field label="ご連絡先" required>
                  <div style={{ position: "relative" }}>
                    <Phone size={14} color="#aaa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="010-0000-0000"
                      required
                      style={{ ...inputStyle, paddingLeft: 34 }}
                      onFocus={focus} onBlur={blur}
                    />
                  </div>
                </Field>
              </div>

              {/* 이메일 */}
              <Field label="メールアドレス" required>
                <div style={{ position: "relative" }}>
                  <Mail size={14} color="#aaa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="example@company.com"
                    required
                    style={{ ...inputStyle, paddingLeft: 34 }}
                    onFocus={focus} onBlur={blur}
                  />
                </div>
              </Field>

              {/* 제목 */}
              <Field label="件名" required>
                <div style={{ position: "relative" }}>
                  <AlignLeft size={14} color="#aaa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={form.subject}
                    onChange={set("subject")}
                    placeholder="件名を入力してください"
                    required
                    style={{ ...inputStyle, paddingLeft: 34 }}
                    onFocus={focus} onBlur={blur}
                  />
                </div>
              </Field>

              {/* 내용 */}
              <Field label="お問い合わせ内容" required>
                <textarea
                  value={form.content}
                  onChange={set("content")}
                  placeholder="広告・提携のご提案内容を詳しくご記入ください。&#10;(例: 規模、期間、予算、目的など)"
                  required
                  rows={7}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 160 }}
                  onFocus={focus} onBlur={blur}
                />
              </Field>

              {error && (
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#e53e3e", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 8, padding: "10px 14px" }}>
                  {error}
                </p>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: 11, color: "#aaa", lineHeight: 1.6 }}>
                  平日 10:00~18:00 基準で1~2営業日以内にご返信いたします。<br />
                  お急ぎの場合: 010-2051-5692
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "13px 28px",
                    background: loading ? "#aaa" : "linear-gradient(135deg,#8B5E3C,#0e6b41)",
                    border: "none", borderRadius: 10, color: "#fff",
                    fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(29,138,90,0.3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Send size={15} />
                  {loading ? "送信中..." : "お問い合わせを送信する"}
                </button>
              </div>
            </form>
          )}
        </div>
    </div>
  );
}
