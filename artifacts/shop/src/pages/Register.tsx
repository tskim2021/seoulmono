import { useState } from "react";
import { useLocation } from "wouter";

interface FieldRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldRow({ label, required, children }: FieldRowProps) {
  return (
    <div className="reg-field-row">
      <div className="reg-field-label">
        <span style={{ fontSize: 14, color: "#333", fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: "#e53e3e", marginLeft: 2 }}>*</span>}
        </span>
      </div>
      <div className="reg-field-content">{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 4,
  fontSize: 14,
  color: "#333",
  outline: "none",
  boxSizing: "border-box",
};

const smallBtnStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#555",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const greenBtnStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#8B5E3C",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function Register() {
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    userId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    nickname: "",
    email: "",
    emailDomain: "",
  });

  const [idStatus, setIdStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [nickStatus, setNickStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [customDomain, setCustomDomain] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (key === "userId") setIdStatus(null);
    if (key === "nickname") setNickStatus(null);
    if (key === "email" || key === "emailDomain") { setCodeSent(false); setCodeVerified(false); }
  };

  const emailFull = form.email && form.emailDomain ? `${form.email}@${form.emailDomain}` : "";

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  const handleCheckId = async () => {
    const id = form.userId.trim();
    if (!id) { setIdStatus({ ok: false, msg: "아이디를 입력해 주세요." }); return; }
    try {
      const r = await fetch(`/api/auth/check-id?mb_id=${encodeURIComponent(id)}`);
      const d = await r.json();
      if (d.available) setIdStatus({ ok: true, msg: d.message });
      else setIdStatus({ ok: false, msg: d.message || d.error });
    } catch {
      setIdStatus({ ok: false, msg: "확인 중 오류가 발생했습니다." });
    }
  };

  const handleCheckNick = async () => {
    const nick = form.nickname.trim();
    if (!nick) { setNickStatus({ ok: false, msg: "닉네임을 입력해 주세요." }); return; }
    try {
      const r = await fetch(`/api/auth/check-nick?mb_nick=${encodeURIComponent(nick)}`);
      const d = await r.json();
      if (d.available) setNickStatus({ ok: true, msg: d.message });
      else setNickStatus({ ok: false, msg: d.message || d.error });
    } catch {
      setNickStatus({ ok: false, msg: "확인 중 오류가 발생했습니다." });
    }
  };

  const handleSendCode = async () => {
    if (!emailFull) { alert("이메일 주소를 입력해 주세요."); return; }
    setCodeSending(true);
    try {
      const r = await fetch("/api/auth/email-send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFull }),
      });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "인증번호 발송에 실패했습니다."); return; }
      setCodeSent(true);
      setCodeVerified(false);
      setEmailCode("");
      // 10분 타이머
      let sec = 600;
      setCodeTimer(sec);
      const iv = setInterval(() => {
        sec--;
        setCodeTimer(sec);
        if (sec <= 0) clearInterval(iv);
      }, 1000);
      alert("인증번호가 이메일로 발송되었습니다. (10분 이내 입력)");
    } catch {
      alert("인증번호 발송 중 오류가 발생했습니다.");
    } finally {
      setCodeSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!emailCode.trim()) { alert("인증번호를 입력해 주세요."); return; }
    try {
      const r = await fetch("/api/auth/email-verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFull, code: emailCode.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "인증에 실패했습니다."); return; }
      setCodeVerified(true);
      alert("이메일 인증이 완료되었습니다.");
    } catch {
      alert("인증 확인 중 오류가 발생했습니다.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId) { alert("아이디를 입력해 주세요."); return; }
    if (idStatus?.ok === false) { alert("아이디 중복확인을 해 주세요."); return; }
    if (!form.password) { alert("비밀번호를 입력해 주세요."); return; }
    if (form.password.length < 8) { alert("비밀번호는 8자 이상이어야 합니다."); return; }
    if (form.password !== form.passwordConfirm) { alert("비밀번호가 일치하지 않습니다."); return; }
    if (!form.name) { alert("이름을 입력해 주세요."); return; }
    if (!emailFull) { alert("이메일 주소를 입력해 주세요."); return; }
    if (!codeVerified) { alert("이메일 인증을 완료해 주세요."); return; }
    if (!agreeTerms) { alert("이용약관에 동의해 주세요."); return; }
    if (!agreePrivacy) { alert("개인정보처리방침에 동의해 주세요."); return; }

    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/register-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mb_id: form.userId.trim(),
          mb_password: form.password,
          mb_name: form.name.trim(),
          mb_nick: form.nickname.trim() || form.name.trim(),
          mb_email: emailFull,
          agree_marketing: agreeMarketing,
        }),
      });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "가입 중 오류가 발생했습니다."); return; }

      if (d.token && d.user) {
        localStorage.setItem("seoulmono_token", d.token);
        localStorage.setItem("seoulmono_user", JSON.stringify(d.user));
        window.dispatchEvent(new Event("storage"));
      }
      navigate(`/register-success?name=${encodeURIComponent(form.name.trim())}`);
    } catch {
      alert("가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const emailDomains = ["직접입력", "naver.com", "gmail.com", "daum.net", "kakao.com", "nate.com", "hotmail.com", "yahoo.co.kr"];

  const timerStr = codeSent && !codeVerified && codeTimer > 0
    ? `${Math.floor(codeTimer / 60)}:${String(codeTimer % 60).padStart(2, "0")}`
    : null;

  return (
    <div style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px" }}>
        <h1 style={{ textAlign: "center", fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 8 }}>회원가입</h1>
        <p style={{ textAlign: "right", fontSize: 13, color: "#888", marginBottom: 24 }}>*필수 항목입니다.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ borderTop: "2px solid #8B5E3C" }}>
            {/* 아이디 */}
            <FieldRow label="아이디" required>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={form.userId}
                  onChange={set("userId")}
                  placeholder="영문 소문자/숫자 4~16자"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button type="button" onClick={handleCheckId} style={smallBtnStyle}>중복확인</button>
              </div>
              {idStatus && (
                <p style={{ fontSize: 12, color: idStatus.ok ? "#8B5E3C" : "#e53e3e", marginTop: 4 }}>
                  {idStatus.msg}
                </p>
              )}
            </FieldRow>

            {/* 비밀번호 */}
            <FieldRow label="비밀번호" required>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="영문/숫자/특수문자 조합 8~20자"
                style={inputStyle}
              />
            </FieldRow>

            {/* 비밀번호 재입력 */}
            <FieldRow label="비밀번호 재입력" required>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={set("passwordConfirm")}
                placeholder="비밀번호를 한번 더 입력해 주세요"
                style={{
                  ...inputStyle,
                  borderColor: form.passwordConfirm && form.password !== form.passwordConfirm ? "#e53e3e" : "#ddd",
                }}
              />
              {form.passwordConfirm && form.password !== form.passwordConfirm && (
                <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>비밀번호가 일치하지 않습니다.</p>
              )}
            </FieldRow>

            {/* 이름 */}
            <FieldRow label="이름" required>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="이름"
                style={inputStyle}
              />
            </FieldRow>

            {/* 닉네임 */}
            <FieldRow label="닉네임" required>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={set("nickname")}
                  placeholder="닉네임"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button type="button" onClick={handleCheckNick} style={smallBtnStyle}>중복확인</button>
              </div>
              {nickStatus && (
                <p style={{ fontSize: 12, color: nickStatus.ok ? "#8B5E3C" : "#e53e3e", marginTop: 4 }}>
                  {nickStatus.msg}
                </p>
              )}
            </FieldRow>

            {/* 이메일 (인증) */}
            <FieldRow label="이메일" required>
              <div className="reg-email-row" style={{ marginBottom: 8 }}>
                <input
                  type="text"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="E-mail"
                  disabled={codeVerified}
                  style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                />
                <span style={{ color: "#999", flexShrink: 0 }}>@</span>
                {customDomain ? (
                  <input
                    type="text"
                    value={form.emailDomain}
                    onChange={set("emailDomain")}
                    placeholder="직접 입력"
                    disabled={codeVerified}
                    style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                  />
                ) : (
                  <select
                    disabled={codeVerified}
                    onChange={e => {
                      if (e.target.value === "직접입력") {
                        setCustomDomain(true);
                        setForm(f => ({ ...f, emailDomain: "" }));
                      } else {
                        setCustomDomain(false);
                        setForm(f => ({ ...f, emailDomain: e.target.value }));
                      }
                    }}
                    style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                  >
                    {emailDomains.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={codeSending || codeVerified}
                  style={{ ...greenBtnStyle, opacity: (codeSending || codeVerified) ? 0.6 : 1 }}
                >
                  {codeSending ? "발송중..." : codeSent ? "재발송" : "인증번호"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    type="text"
                    value={emailCode}
                    onChange={e => setEmailCode(e.target.value)}
                    placeholder="인증번호 6자리"
                    disabled={!codeSent || codeVerified}
                    maxLength={6}
                    style={{
                      ...inputStyle,
                      background: codeSent && !codeVerified ? "#fff" : "#f9f9f9",
                      color: codeVerified ? "#8B5E3C" : "#333",
                      paddingRight: timerStr ? 56 : 12,
                    }}
                  />
                  {timerStr && (
                    <span style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      fontSize: 12, color: codeTimer < 60 ? "#e53e3e" : "#888", fontWeight: 600,
                    }}>
                      {timerStr}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={!codeSent || codeVerified}
                  style={{
                    ...smallBtnStyle,
                    background: codeVerified ? "#8B5E3C" : "#555",
                    opacity: (!codeSent || codeVerified) ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  {codeVerified ? "인증완료" : "확인"}
                </button>
              </div>
              {codeVerified && (
                <p style={{ fontSize: 12, color: "#8B5E3C", marginTop: 4, fontWeight: 600 }}>✓ 인증이 완료되었습니다.</p>
              )}
              {codeSent && !codeVerified && codeTimer === 0 && (
                <p style={{ fontSize: 12, color: "#e53e3e", marginTop: 4 }}>인증번호가 만료되었습니다. 재발송해 주세요.</p>
              )}
            </FieldRow>
          </div>

          {/* 약관동의 */}
          <div style={{ marginTop: 32, border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ background: "#f9f9f9", padding: "14px 20px", borderBottom: "1px solid #eee" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={agreeAll}
                  onChange={e => handleAgreeAll(e.target.checked)}
                  style={{ accentColor: "#8B5E3C", width: 17, height: 17 }}
                />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>전체 동의</span>
              </label>
            </div>
            <div style={{ padding: "8px 0" }}>
              {[
                { key: "terms", label: "이용약관 동의", state: agreeTerms, setState: setAgreeTerms, required: true, path: "/terms" },
                { key: "privacy", label: "개인정보처리방침 동의", state: agreePrivacy, setState: setAgreePrivacy, required: true, path: "/privacy" },
                { key: "marketing", label: "마케팅 정보 수신 동의 (선택)", state: agreeMarketing, setState: setAgreeMarketing, required: false, path: null },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 20px", borderBottom: "1px solid #f5f5f5" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={e => {
                        item.setState(e.target.checked);
                        if (!e.target.checked) setAgreeAll(false);
                        else if (agreeTerms && agreePrivacy && agreeMarketing) setAgreeAll(true);
                      }}
                      style={{ accentColor: "#8B5E3C", width: 15, height: 15 }}
                    />
                    <span style={{ fontSize: 14, color: "#333" }}>
                      {item.required && <span style={{ color: "#e53e3e" }}>[필수] </span>}
                      {!item.required && <span style={{ color: "#888" }}>[선택] </span>}
                      {item.label}
                    </span>
                  </label>
                  {item.path && (
                    <a
                      href={`${BASE}${item.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: "none", border: "none", fontSize: 12, color: "#aaa", cursor: "pointer", flexShrink: 0, textDecoration: "underline" }}
                    >
                      보기
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                flex: 1, padding: "15px 0",
                background: "#fff", color: "#555", border: "1px solid #ddd",
                borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 2, padding: "15px 0",
                background: submitting ? "#aaa" : "#8B5E3C", color: "#fff", border: "none",
                borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {submitting ? "가입 처리 중..." : "가입하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
