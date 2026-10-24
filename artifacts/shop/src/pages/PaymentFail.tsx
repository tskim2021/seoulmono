import { useLocation } from "wouter";
import { XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PaymentFail() {
  const [, navigate] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || "";
  const message = params.get("message") || "결제가 취소되었습니다.";

  const isCancel = code === "PAY_PROCESS_CANCELED" || code === "USER_CANCEL";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <XCircle size={56} color={isCancel ? "#ff9800" : "#e53935"} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>
            {isCancel ? "결제가 취소되었습니다" : "결제에 실패했습니다"}
          </h2>
          {!isCancel && code && (
            <p style={{ fontSize: 12, color: "#aaa", marginBottom: 6, fontFamily: "monospace" }}>오류코드: {code}</p>
          )}
          <p style={{ fontSize: 14, color: "#666", marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => navigate("/checkout")}
              style={{ height: 48, padding: "0 24px", background: "#8B5E3C", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              다시 시도하기
            </button>
            <button onClick={() => navigate("/")}
              style={{ height: 48, padding: "0 24px", background: "#fff", border: "1px solid #ddd", borderRadius: 12, color: "#555", fontSize: 15, cursor: "pointer" }}>
              홈으로
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
