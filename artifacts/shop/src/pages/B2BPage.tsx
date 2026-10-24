import { useState } from "react";

export default function B2BPage() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mb_id: id, mb_password: pw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "로그인 실패"); return; }
      if (!data.user?.is_admin) {
        setError("관리자 권한이 없습니다");
        return;
      }
      localStorage.setItem("token", data.token);
      window.location.href = "/b2b/";
    } catch { setError("네트워크 오류가 발생했습니다"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 400, margin: "0 16px",
        background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20,
        padding: "48px 40px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, background: "linear-gradient(135deg,#8B5E3C,#1a8a55)",
            borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 26,
          }}>🔐</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            관리자 로그인
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            seoulmono 관리자 전용 페이지입니다
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <input
              type="text" value={id} onChange={e => setId(e.target.value)}
              placeholder="아이디" autoComplete="username" required
              style={{
                width: "100%", height: 50, padding: "0 16px", boxSizing: "border-box",
                background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: 12, fontSize: 14, color: "#fff", outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(39,174,112,0.7)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <input
              type="password" value={pw} onChange={e => setPw(e.target.value)}
              placeholder="비밀번호" autoComplete="current-password" required
              style={{
                width: "100%", height: 50, padding: "0 16px", boxSizing: "border-box",
                background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: 12, fontSize: 14, color: "#fff", outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(39,174,112,0.7)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: "10px 14px", background: "rgba(229,57,53,0.15)",
              border: "1px solid rgba(229,57,53,0.4)", borderRadius: 10,
              fontSize: 13, color: "#ff6b6b", textAlign: "center",
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", height: 52, background: loading
              ? "rgba(39,174,112,0.5)"
              : "linear-gradient(135deg,#8B5E3C,#1a8a55)",
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s", letterSpacing: "-0.3px",
          }}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
