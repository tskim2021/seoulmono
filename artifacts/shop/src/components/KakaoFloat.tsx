import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function KakaoFloat() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const openKakao = () => {
    window.open("http://pf.kakao.com/_BRqxkn/chat", "_blank");
  };

  return (
    <>
      <style>{`
        .kakao-float-wrap {
          position: fixed;
          right: 16px;
          bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 16px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 210;
        }
        @media (min-width: 768px) {
          .kakao-float-wrap {
            bottom: 32px;
            right: 28px;
          }
        }
        .kakao-channel-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .kakao-channel-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #FEE500;
          box-shadow: 0 4px 16px rgba(0,0,0,0.22);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
        }
        .kakao-channel-label {
          font-size: 10px;
          font-weight: 800;
          color: #3C1E1E;
          background: #FEE500;
          border-radius: 10px;
          padding: 2px 7px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
      `}</style>

      <div className="kakao-float-wrap">
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            title="맨 위로"
            style={{
              width: 44, height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.96)",
              border: "1px solid #ddd",
              boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronUp size={20} color="#555" />
          </button>
        )}

        <button
          className="kakao-channel-btn"
          onClick={openKakao}
          title="카카오톡 채널 문의"
        >
          <div className="kakao-channel-icon">
            <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
              <ellipse cx="14" cy="11" rx="13" ry="10" fill="#3C1E1E" />
              <path d="M6 22 Q14 26 22 22 L20 17 Q14 21 8 17 Z" fill="#FEE500" />
              <rect x="8" y="8" width="3.5" height="6" rx="1.75" fill="#FEE500" />
              <rect x="12.25" y="6" width="3.5" height="8" rx="1.75" fill="#FEE500" />
              <rect x="16.5" y="8" width="3.5" height="6" rx="1.75" fill="#FEE500" />
            </svg>
            <span style={{ fontSize: 9, fontWeight: 900, color: "#3C1E1E", letterSpacing: -0.3, lineHeight: 1 }}>
              TALK
            </span>
          </div>
          <span className="kakao-channel-label">카카오 문의</span>
        </button>
      </div>
    </>
  );
}
