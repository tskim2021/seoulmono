import { useEffect, useRef } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const TOKEN_KEY = "seoulmono_token";

function authFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
}

export default function InicisReturn() {
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if (status === "cancel") {
      if (window.opener) {
        window.opener.postMessage({ type: "INICIS_RESULT", success: false, error: "결제가 취소되었습니다." }, "*");
      }
      window.close();
      return;
    }

    const authToken = params.get("authToken") || (document as any).__inicis_authToken;
    const authUrl = params.get("authUrl") || (document as any).__inicis_authUrl;
    const netCancelUrl = params.get("netCancelUrl") || "";
    const mid = params.get("mid") || "";
    const oid = params.get("oid") || "";
    const price = params.get("price") || params.get("TotPrice") || "";

    if (!authToken || !authUrl) {
      if (window.opener) {
        window.opener.postMessage({ type: "INICIS_RESULT", success: false, error: "결제 인증 정보가 없습니다." }, "*");
      }
      window.close();
      return;
    }

    authFetch(`${BASE}/api/shop/inicis/confirm`, {
      method: "POST",
      body: JSON.stringify({ authToken, authUrl, netCancelUrl, mid, oid, price }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          if (window.opener) {
            window.opener.postMessage({ type: "INICIS_RESULT", success: true, tid: data.tid }, "*");
          }
        } else {
          if (window.opener) {
            window.opener.postMessage({ type: "INICIS_RESULT", success: false, error: data.error || "결제 승인 실패" }, "*");
          }
        }
        window.close();
      })
      .catch(() => {
        if (window.opener) {
          window.opener.postMessage({ type: "INICIS_RESULT", success: false, error: "결제 처리 중 오류가 발생했습니다." }, "*");
        }
        window.close();
      });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", color: "#333" }}>
      <div style={{ width: 40, height: 40, border: "4px solid #eee", borderTop: "4px solid #8B5E3C", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 16 }} />
      <p style={{ fontSize: 15, color: "#555" }}>결제 처리 중입니다...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
