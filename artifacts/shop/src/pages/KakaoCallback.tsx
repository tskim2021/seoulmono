import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const TOKEN_KEY = "seoulmono_token";
const USER_KEY = "seoulmono_user";

export default function KakaoCallback() {
  const [, navigate] = useLocation();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      navigate("/login");
      return;
    }

    // 서버와 동일한 경로(/shop/kakao-callback)로 고정
    const redirectUri = `${window.location.origin}/shop/kakao-callback`;

    fetch(`/api/auth/kakao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
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
          // 카카오 채널 추가 대기 중이면 홈으로 복귀 시 파라미터 전달
          const kakaoChannelPending = localStorage.getItem("kakao_channel_pending");
          if (kakaoChannelPending) {
            localStorage.removeItem("kakao_channel_pending");
            window.location.replace(`${BASE || "/"}?kakao_channel=1`);
          } else {
            window.location.replace(`${BASE || "/"}`);
          }
        } else {
          alert(data.error || "Kakaoログインに失敗しました。");
          navigate("/login");
        }
      })
      .catch(() => {
        alert("ネットワークエラーが発生しました。");
        navigate("/login");
      });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ width: 44, height: 44, border: "4px solid #FEE500", borderTop: "4px solid #3C1E1E", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 18 }} />
      <p style={{ fontSize: 15, color: "#555", fontWeight: 600 }}>Kakaoログイン処理中...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
