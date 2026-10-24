import { useState } from "react";
import { useLocation } from "wouter";
import { User, Mail, Lock, ArrowLeft, CheckCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const inputWrap: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  border: "1px solid #ddd", borderRadius: 8, padding: "12px 14px",
  marginBottom: 14, background: "#fff",
};
const inputStyle: React.CSSProperties = {
  flex: 1, border: "none", outline: "none", fontSize: 14, color: "#333", background: "transparent",
};
const btnStyle: React.CSSProperties = {
  width: "100%", padding: "14px 0", borderRadius: 8, border: "none",
  background: "#8B5E3C", color: "#fff", fontSize: 15, fontWeight: 700,
  cursor: "pointer", marginTop: 4,
};

export default function FindAccount() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"id" | "pw">("id");

  const [idName, setIdName] = useState("");
  const [idEmail, setIdEmail] = useState("");
  const [idLoading, setIdLoading] = useState(false);
  const [idResult, setIdResult] = useState<{ masked: string } | null>(null);
  const [idError, setIdError] = useState("");

  const [pwId, setPwId] = useState("");
  const [pwEmail, setPwEmail] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdError(""); setIdResult(null);
    if (!idName.trim()) { setIdError("お名前を入力してください。"); return; }
    if (!idEmail.trim()) { setIdError("メールアドレスを入力してください。"); return; }
    setIdLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/find-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: idName.trim(), email: idEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setIdError(data.error || "エラーが発生しました。"); return; }
      setIdResult({ masked: data.masked });
    } catch {
      setIdError("サーバーエラーが発生しました。");
    } finally {
      setIdLoading(false);
    }
  };

  const handleFindPw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwDone(false);
    if (!pwId.trim()) { setPwError("IDを入力してください。"); return; }
    if (!pwEmail.trim()) { setPwError("メールアドレスを入力してください。"); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${BASE}api/auth/find-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mb_id: pwId.trim(), email: pwEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || "エラーが発生しました。"); return; }
      setPwDone(true);
    } catch {
      setPwError("サーバーエラーが発生しました。");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "52px 16px 40px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#888", fontSize: 13, marginBottom: 20, padding: 0 }}>
            <ArrowLeft size={14} /> ログインに戻る
          </button>

          <div style={{ background: "#fff", borderRadius: 14, padding: 36, border: "1px solid #eee", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 26px", textAlign: "center" }}>ID / パスワードの確認</h2>

            <div style={{ display: "flex", border: "1px solid #ddd", borderRadius: 8, marginBottom: 28, overflow: "hidden" }}>
              {(["id", "pw"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  border: "none", background: tab === t ? "#fff" : "#fafafa",
                  color: tab === t ? "#8B5E3C" : "#aaa",
                  borderBottom: tab === t ? "2px solid #8B5E3C" : "2px solid transparent",
                  borderRight: t === "id" ? "1px solid #ddd" : "none",
                  transition: "all 0.15s",
                }}>
                  {t === "id" ? "IDを確認" : "パスワードを再発行"}
                </button>
              ))}
            </div>

            {tab === "id" && (
              <>
                {idResult ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <CheckCircle size={48} color="#8B5E3C" style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 15, color: "#333", margin: "0 0 8px" }}>IDをメールで送信しました。</p>
                    <p style={{ fontSize: 13, color: "#888", margin: "0 0 24px" }}>ID: <strong style={{ color: "#8B5E3C" }}>{idResult.masked}</strong></p>
                    <button onClick={() => navigate("/login")} style={{ ...btnStyle, marginTop: 0 }}>ログインへ進む</button>
                    <button onClick={() => { setIdResult(null); setIdName(""); setIdEmail(""); }} style={{ ...btnStyle, background: "#f0f0f0", color: "#555", marginTop: 10 }}>もう一度確認する</button>
                  </div>
                ) : (
                  <form onSubmit={handleFindId}>
                    <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>ご登録時のお名前とメールアドレスを入力してください。</p>
                    <div style={inputWrap}>
                      <User size={16} color="#bbb" />
                      <input type="text" value={idName} onChange={e => setIdName(e.target.value)} placeholder="お名前" style={inputStyle} />
                    </div>
                    <div style={inputWrap}>
                      <Mail size={16} color="#bbb" />
                      <input type="email" value={idEmail} onChange={e => setIdEmail(e.target.value)} placeholder="メールアドレス" style={inputStyle} />
                    </div>
                    {idError && <div style={{ background: "#fff3f3", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#d32f2f" }}>{idError}</div>}
                    <button type="submit" style={{ ...btnStyle, opacity: idLoading ? 0.7 : 1 }} disabled={idLoading}>
                      {idLoading ? "確認中…" : "IDを確認"}
                    </button>
                  </form>
                )}
              </>
            )}

            {tab === "pw" && (
              <>
                {pwDone ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <CheckCircle size={48} color="#8B5E3C" style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 15, color: "#333", margin: "0 0 8px" }}>仮パスワードをメールで送信しました。</p>
                    <p style={{ fontSize: 13, color: "#888", margin: "0 0 24px" }}>ログイン後、マイページでパスワードを変更してください。</p>
                    <button onClick={() => navigate("/login")} style={{ ...btnStyle, marginTop: 0 }}>ログインへ進む</button>
                    <button onClick={() => { setPwDone(false); setPwId(""); setPwEmail(""); }} style={{ ...btnStyle, background: "#f0f0f0", color: "#555", marginTop: 10 }}>もう一度確認する</button>
                  </div>
                ) : (
                  <form onSubmit={handleFindPw}>
                    <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>ご登録時のIDとメールアドレスを入力してください。</p>
                    <div style={inputWrap}>
                      <User size={16} color="#bbb" />
                      <input type="text" value={pwId} onChange={e => setPwId(e.target.value)} placeholder="ID" style={inputStyle} />
                    </div>
                    <div style={inputWrap}>
                      <Lock size={16} color="#bbb" />
                      <input type="email" value={pwEmail} onChange={e => setPwEmail(e.target.value)} placeholder="メールアドレス" style={inputStyle} />
                    </div>
                    {pwError && <div style={{ background: "#fff3f3", border: "1px solid #ffcdd2", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#d32f2f" }}>{pwError}</div>}
                    <button type="submit" style={{ ...btnStyle, opacity: pwLoading ? 0.7 : 1 }} disabled={pwLoading}>
                      {pwLoading ? "確認中…" : "仮パスワードを発行"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
