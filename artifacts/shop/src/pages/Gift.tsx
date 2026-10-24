import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, ChevronRight, Heart, Share2, Gift } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const BROWN = "#8B5E3C";
const BROWN_DARK = "#5C3317";
const BROWN_LIGHT = "#FDF6EE";
const BROWN_MID = "#F2E4D0";
const BROWN_BORDER = "#DEC4A8";
const BROWN_MUTED = "#A07850";

const CAT_TABS = [
  { id: "", label: "전체", emoji: "🎁" },
  { id: "10", label: "과자류", emoji: "🍪" },
  { id: "20", label: "유지류", emoji: "🫙" },
  { id: "30", label: "통조림캔류", emoji: "🥫" },
];

interface GiftPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  thumb_img: string;
  ca_id: string;
  item_count: number;
  preview_items: { it_name: string; it_img1: string }[];
}

function GiftCard({ pkg, onClick }: { pkg: GiftPackage; onClick: () => void }) {
  const [liked, setLiked] = useState(false);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        border: `1px solid ${BROWN_BORDER}`,
        display: "flex",
        flexDirection: "column",
      }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(139,94,60,0.18)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.07)")}
    >
      {/* 이미지 영역 */}
      <div style={{ position: "relative", paddingTop: "100%", background: BROWN_LIGHT, flexShrink: 0 }}>
        {pkg.thumb_img ? (
          <img
            src={pkg.thumb_img}
            alt={pkg.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>🎁</div>
        )}

        {/* 찜 버튼 */}
        <button
          onClick={e => { e.stopPropagation(); setLiked(l => !l); }}
          style={{
            position: "absolute", top: 10, right: 10, zIndex: 2,
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(255,255,255,0.92)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          }}
        >
          <Heart size={16} fill={liked ? "#e53935" : "none"} stroke={liked ? "#e53935" : "#999"} strokeWidth={2} />
        </button>

        {/* 구성 뱃지 */}
        {pkg.item_count > 0 && (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            background: "rgba(0,0,0,0.55)", color: "#fff",
            borderRadius: 20, padding: "3px 10px",
            fontSize: 11, fontWeight: 700,
          }}>
            {pkg.item_count}종 구성
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <p style={{
          margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#222",
          lineHeight: 1.4, letterSpacing: "-0.2px",
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
          minHeight: "2.8em",
        }}>
          {pkg.name}
        </p>

        {pkg.description && (
          <p style={{
            margin: "0 0 10px", fontSize: 12, color: "#888",
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as any,
          }}>
            {pkg.description}
          </p>
        )}

        <div style={{ flex: 1 }} />

        {/* 가격 */}
        <p style={{ margin: "8px 0 10px", fontSize: 17, fontWeight: 900, color: BROWN_DARK, letterSpacing: "-0.5px" }}>
          {pkg.price > 0 ? `${pkg.price.toLocaleString()}원` : "가격 문의"}
        </p>

        {/* 선물하기 버튼 */}
        <button
          onClick={e => { e.stopPropagation(); /* navigate */ }}
          style={{
            width: "100%", padding: "11px 0",
            background: BROWN,
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 800, cursor: "pointer",
            letterSpacing: "-0.2px",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = BROWN_DARK)}
          onMouseLeave={e => (e.currentTarget.style.background = BROWN)}
        >
          🎁 선물하기
        </button>
      </div>
    </div>
  );
}

function HowToSection() {
  const steps = [
    { emoji: "🎁", title: "선물 선택", desc: "마음에 드는\n선물 고르기" },
    { emoji: "✍️", title: "메시지 작성", desc: "따뜻한 마음\n카드 메시지" },
    { emoji: "📨", title: "링크 전달", desc: "카카오·문자로\n링크 전달" },
    { emoji: "📦", title: "배송지 입력", desc: "받는 분이 직접\n주소 입력" },
  ];
  return (
    <div style={{ background: BROWN_LIGHT, borderBottom: `1px solid ${BROWN_BORDER}`, padding: "28px 0" }}>
      <div className="page-wrap">
        <p style={{ margin: "0 0 20px", fontSize: 13, fontWeight: 700, color: BROWN, textAlign: "center", letterSpacing: "0.05em" }}>
          🎀 주소 몰라도 선물할 수 있어요
        </p>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0, maxWidth: 560, margin: "0 auto" }}>
          {steps.map((s, i) => (
            <div key={s.title} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "#fff", border: `2px solid ${BROWN_BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, marginBottom: 8,
                  boxShadow: "0 2px 8px rgba(139,94,60,0.10)",
                }}>
                  {s.emoji}
                </div>
                <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 800, color: "#222" }}>{s.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#888", lineHeight: 1.4, whiteSpace: "pre-line" }}>{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight size={16} color={BROWN_BORDER} style={{ flexShrink: 0, marginBottom: 30 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GiftPage() {
  const [, navigate] = useLocation();
  const [packages, setPackages] = useState<GiftPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    setLoading(true);
    const url = activeTab ? `/api/shop/gift/packages?ca_id=${activeTab}` : "/api/shop/gift/packages";
    fetch(url)
      .then(r => r.json())
      .then(data => { setPackages(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTab]);

  return (
    <div style={{ minHeight: "100vh", background: "#f9f5f1" }}>

      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BROWN_BORDER}` }}>
        <div className="page-wrap" style={{ padding: "18px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: BROWN, letterSpacing: "0.12em", textTransform: "uppercase" }}>Gift</p>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: BROWN_DARK, letterSpacing: "-0.5px" }}>선물하기</h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => navigate(`${BASE}/gift/my`)}
                style={{
                  padding: "8px 14px", background: BROWN_LIGHT, color: BROWN_DARK,
                  border: `1px solid ${BROWN_BORDER}`, borderRadius: 20,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                받은 선물함
              </button>
              <button
                onClick={() => navigate(`${BASE}/gift/custom`)}
                style={{
                  padding: "8px 14px", background: BROWN, color: "#fff",
                  border: "none", borderRadius: 20,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                + 직접 구성
              </button>
            </div>
          </div>

          {/* 카테고리 탭 */}
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 1 }}>
            {CAT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flexShrink: 0, padding: "10px 18px",
                  border: "none",
                  borderBottom: activeTab === tab.id ? `2px solid ${BROWN}` : "2px solid transparent",
                  background: "transparent",
                  color: activeTab === tab.id ? BROWN_DARK : "#888",
                  fontWeight: activeTab === tab.id ? 800 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* How-to 안내 */}
      <HowToSection />

      {/* 상품 그리드 */}
      <div className="page-wrap" style={{ padding: "28px 0 80px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <Loader2 size={36} color={BROWN} className="animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: "#fff", borderRadius: 20,
            border: `2px dashed ${BROWN_BORDER}`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#333", margin: "0 0 6px" }}>등록된 선물 패키지가 없습니다</p>
            <p style={{ fontSize: 13, color: "#999" }}>관리자 페이지에서 선물 패키지를 등록해주세요</p>
          </div>
        ) : (
          <div className="gift-grid">
            {packages.map(pkg => (
              <GiftCard
                key={pkg.id}
                pkg={pkg}
                onClick={() => navigate(`${BASE}/gift/${pkg.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .gift-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .gift-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .gift-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
      `}</style>
    </div>
  );
}
