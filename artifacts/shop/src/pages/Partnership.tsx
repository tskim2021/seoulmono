import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Megaphone, Handshake, Send, CheckCircle, Building2, User, Phone, Mail, AlignLeft, FileText } from "lucide-react";

const TYPES = ["광고 문의", "제휴 문의", "공동구매 제안", "기타 문의"];

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
      setError("필수 항목을 모두 입력해주세요."); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/shop/partnership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "문의 등록에 실패했습니다."); return; }
      setDone(true);
    } catch { setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."); } finally { setLoading(false); }
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
              <ChevronLeft size={15} /> 홈으로
            </button>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Megaphone size={22} color="#fff" />
              </div>
              <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Handshake size={22} color="#fff" />
              </div>
            </div>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px" }}>광고 / 제휴 문의</h1>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
              seoulmono과 함께 성장할 파트너를 기다립니다.<br />
              광고, 제휴, 공동구매 등 다양한 방식으로 협력해드립니다.
            </p>
          </div>
        </div>

        {/* 안내 카드 */}
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { icon: <Megaphone size={20} color="#8B5E3C" />, title: "광고 문의", desc: "배너·이메일·SNS 광고" },
              { icon: <Handshake size={20} color="#8B5E3C" />, title: "제휴 문의", desc: "공동마케팅·입점 제안" },
              { icon: <Building2 size={20} color="#8B5E3C" />, title: "공동구매 제안", desc: "단체·기업 구매 협의" },
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
              <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 900, color: "#8B5E3C" }}>문의가 접수되었습니다</h2>
              <p style={{ margin: "0 0 8px", fontSize: 14, color: "#555", lineHeight: 1.7 }}>
                소중한 문의 감사합니다.<br />담당자가 빠른 시일 내 연락드리겠습니다.
              </p>
              <p style={{ margin: "0 0 24px", fontSize: 12, color: "#aaa" }}>평일 10:00 ~ 18:00 기준 1~2 영업일 내 회신</p>
              <button onClick={() => nav("/")} style={{ padding: "12px 32px", background: "#8B5E3C", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                홈으로 돌아가기
              </button>
            </div>
          ) : (
            /* 문의 폼 */
            <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={17} color="#8B5E3C" /> 문의 내용
              </h2>

              {/* 문의 유형 */}
              <Field label="문의 유형" required>
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
                    >{t}</button>
                  ))}
                </div>
              </Field>

              {/* 회사명 */}
              <Field label="회사/브랜드명">
                <div style={{ position: "relative" }}>
                  <Building2 size={14} color="#aaa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={set("company_name")}
                    placeholder="회사 또는 브랜드명 (선택)"
                    style={{ ...inputStyle, paddingLeft: 34 }}
                    onFocus={focus} onBlur={blur}
                  />
                </div>
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* 담당자명 */}
                <Field label="담당자명" required>
                  <div style={{ position: "relative" }}>
                    <User size={14} color="#aaa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      value={form.contact_name}
                      onChange={set("contact_name")}
                      placeholder="홍길동"
                      required
                      style={{ ...inputStyle, paddingLeft: 34 }}
                      onFocus={focus} onBlur={blur}
                    />
                  </div>
                </Field>

                {/* 연락처 */}
                <Field label="연락처" required>
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
              <Field label="이메일" required>
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
              <Field label="제목" required>
                <div style={{ position: "relative" }}>
                  <AlignLeft size={14} color="#aaa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={form.subject}
                    onChange={set("subject")}
                    placeholder="문의 제목을 입력해주세요"
                    required
                    style={{ ...inputStyle, paddingLeft: 34 }}
                    onFocus={focus} onBlur={blur}
                  />
                </div>
              </Field>

              {/* 내용 */}
              <Field label="문의 내용" required>
                <textarea
                  value={form.content}
                  onChange={set("content")}
                  placeholder="광고/제휴 제안 내용을 상세히 작성해주세요.&#10;(예: 제안 규모, 기간, 예산, 목적 등)"
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
                  평일 10:00~18:00 기준 1~2 영업일 내 회신 드립니다.<br />
                  긴급 문의: 010-2051-5692
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
                  {loading ? "접수 중..." : "문의 접수하기"}
                </button>
              </div>
            </form>
          )}
        </div>
    </div>
  );
}
