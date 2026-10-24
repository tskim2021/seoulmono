import { useLocation } from "wouter";
import { CheckCircle } from "lucide-react";

export default function RegisterSuccess() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name") || "고객";

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
    }}>
      <div style={{
        maxWidth: 440,
        width: "100%",
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #eee",
        padding: "48px 32px",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#e8f8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <CheckCircle size={40} color="#8B5E3C" strokeWidth={2} />
        </div>

        <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: "#111" }}>
          회원가입 완료!
        </h1>

        <p style={{ margin: "0 0 8px", fontSize: 17, color: "#333", fontWeight: 600 }}>
          <span style={{ color: "#8B5E3C" }}>{name}</span> 고객님,
        </p>
        <p style={{ margin: "0 0 32px", fontSize: 17, color: "#333" }}>
          seoulmono 가입을 환영합니다 🎉
        </p>

        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#888", lineHeight: 1.6 }}>
          지금 로그인하시면 첫 구매 혜택을 누리실 수 있습니다.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "#8B5E3C",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            로그인하기
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "#fff",
              color: "#555",
              border: "1px solid #ddd",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            쇼핑 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
