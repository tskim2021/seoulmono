import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BROWN = "#8B5E3C";
const BROWN_DARK = "#5C3317";
const BROWN_LIGHT = "#FDF6EE";
const BROWN_BORDER = "#DEC4A8";

const inputWrap: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  border: `1px solid ${BROWN_BORDER}`, borderRadius: 10,
  padding: "14px 16px", marginBottom: 10, background: "#fff",
};
const inputStyle: React.CSSProperties = {
  flex: 1, border: "none", outline: "none",
  fontSize: 15, color: "#333", background: "transparent",
};

export default function Login() {
  const [, navigate] = useLocation();
  const { login, loading, user } = useAuth();
  const [userId, setUserId] = useState(() => localStorage.getItem("seoulmono_saved_id") || "");
  const [password, setPassword] = useState("");
  const [saveId, setSaveId] = useState(() => !!localStorage.getItem("seoulmono_saved_id"));
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) navigate(user.is_admin ? "/admin/products" : "/");
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!userId.trim()) { setErrorMsg("IDを入力してください。"); return; }
    if (!password.trim()) { setErrorMsg("パスワードを入力してください。"); return; }
    try {
      await login(userId.trim(), password);
      if (saveId) localStorage.setItem("seoulmono_saved_id", userId.trim());
      else localStorage.removeItem("seoulmono_saved_id");
    } catch (err: any) {
      setErrorMsg(err.message || "ログインに失敗しました。");
    }
  };

  return (
    <div style={{ background: BROWN_LIGHT, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: BROWN, letterSpacing: "0.12em", textTransform: "uppercase" }}>Welcome</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: BROWN_DARK, letterSpacing: "-0.5px" }}>ソウルモノ</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#999" }}>ログインしてショッピングを始めましょう</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 18, padding: "32px 28px", boxShadow: "0 4px 24px rgba(139,94,60,0.10)", border: `1px solid ${BROWN_BORDER}` }}>

          {/* 아이디 로그인 */}
          <form onSubmit={handleLogin}>
              <div style={inputWrap}>
                <User size={16} color={BROWN_BORDER} />
                <input type="text" value={userId} onChange={e => setUserId(e.target.value)}
                  placeholder="IDを入力してください。" style={inputStyle} />
              </div>
              <div style={inputWrap}>
                <Lock size={16} color={BROWN_BORDER} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="パスワードを入力してください。" style={inputStyle} />
              </div>

              {errorMsg && (
                <div style={{ background: "#fff3f3", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#d32f2f" }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#666", cursor: "pointer" }}>
                  <input type="checkbox" checked={saveId} onChange={e => setSaveId(e.target.checked)} style={{ accentColor: BROWN }} />
                  IDを保存
                </label>
                <button type="button" onClick={() => navigate("/find-account")}
                  style={{ background: "none", border: "none", fontSize: 13, color: "#aaa", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                  ID/パスワードをお忘れの方
                </button>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "14px 0", background: BROWN, color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: "pointer", letterSpacing: "-0.3px" }}>
                {loading ? "ログイン中..." : "ログインする"}
              </button>
          </form>
        </div>

        {/* 회원가입 유도 */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span style={{ fontSize: 14, color: "#999" }}>まだ会員ではありませんか?</span>{" "}
          <button
            onClick={() => navigate("/register")}
            style={{ background: "none", border: "none", fontSize: 14, fontWeight: 800, color: BROWN, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            会員登録
          </button>
        </div>
      </div>
    </div>
  );
}
