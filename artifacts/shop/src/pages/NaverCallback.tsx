import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const TOKEN_KEY = "seoulmono_token";
const USER_KEY = "seoulmono_user";

export default function NaverCallback() {
  const [, navigate] = useLocation();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error || !code) {
      navigate("/login");
      return;
    }

    const redirectUri = `${window.location.origin}/shop/naver-callback`;

    fetch(`/api/auth/naver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state, redirect_uri: redirectUri }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          const rn = (window as any).ReactNativeWebView;
          if (rn && data.user) {
            rn.postMessage(JSON.stringify({
              type: "login",
              userName: data.user.mb_name,
              userEmail: data.user.mb_email,
              token: data.token,
            }));
          }
          window.location.replace(import.meta.env.BASE_URL || "/");
        } else {
          alert(data.error || "네이버 로그인에 실패했습니다.");
          navigate("/login");
        }
      })
      .catch(() => {
        alert("네트워크 오류가 발생했습니다.");
        navigate("/login");
      });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ width: 44, height: 44, border: "4px solid #8B5E3C", borderTop: "4px solid #eee", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 18 }} />
      <p style={{ fontSize: 15, color: "#555", fontWeight: 600 }}>네이버 로그인 처리 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
