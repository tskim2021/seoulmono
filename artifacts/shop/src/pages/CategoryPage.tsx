import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronRight, Search, ShoppingCart } from "lucide-react";
import { getCartCount } from "@/lib/cart";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORY_ICONS = [
  { ca_id: "190", name: "비타민", img: "/cat_10.png" },
  { ca_id: "200", name: "영양제", img: "/cat_20.png" },
  { ca_id: "210", name: "유산균", img: "/cat_30.png" },
  { ca_id: "220", name: "슬리밍/이너뷰티", img: "/cat_40.png" },
];

const MAIN_CATEGORIES = [
  { ca_id: "190", name: "비타민", isNew: false },
  { ca_id: "200", name: "영양제", isNew: false },
  { ca_id: "210", name: "유산균", isNew: false },
  { ca_id: "220", name: "슬리밍/이너뷰티", isNew: false },
];

const SUB_CATEGORIES: Record<string, string[]> = {};

export default function CategoryPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedCa, setSelectedCa] = useState("190");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column" }}>

      {/* Top bar (mobile-style) */}
      <div style={{
        background: "#fff",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #eee",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#222" }}>카테고리</span>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => navigate("/search")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Search size={20} color="#333" />
          </button>
          <button onClick={() => navigate("/cart")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" }}>
            <ShoppingCart size={20} color="#333" />
            {cartCount > 0 && (
              <span style={{
                position: "absolute", top: -2, right: -4,
                background: "#8B5E3C", color: "#fff",
                borderRadius: "50%", width: 16, height: 16,
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{cartCount > 99 ? "99+" : cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Login banner */}
      {!user && (
        <div style={{
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, color: "#555" }}>로그인하고 다양한 혜택을 받아보세요.</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => navigate("/login")}
              style={{ padding: "5px 12px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              로그인
            </button>
            <button
              onClick={() => navigate("/register")}
              style={{ padding: "5px 12px", background: "#fff", color: "#8B5E3C", border: "1px solid #8B5E3C", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              회원가입
            </button>
          </div>
        </div>
      )}

      {/* Quick tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 4px" }} className="no-scrollbar">
          {[
            { label: "HOME", href: "/" },
            { label: "마이페이지", href: "/mypage" },
            { label: "주문/배송", href: "/mypage" },
            { label: "고객센터", href: "#" },
            { label: "쿠폰/혜택", href: "#" },
          ].map(tab => (
            <button
              key={tab.label}
              onClick={() => navigate(tab.href)}
              style={{
                padding: "10px 14px",
                background: "none", border: "none",
                fontSize: 12, color: "#555", cursor: "pointer",
                whiteSpace: "nowrap", fontWeight: 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category icon row */}
      <div style={{ background: "#fff", padding: "12px 0", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", overflowX: "auto", gap: 0, padding: "0 8px" }} className="no-scrollbar">
          {CATEGORY_ICONS.map(cat => (
            <button
              key={cat.ca_id}
              onClick={() => { setSelectedCa(cat.ca_id); }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                padding: "0 8px",
                background: "none", border: "none", cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 52, height: 52,
                borderRadius: "50%",
                border: selectedCa === cat.ca_id ? "2.5px solid #8B5E3C" : "2.5px solid transparent",
                overflow: "hidden",
                transition: "border-color 0.15s",
                background: "#f5f5f5",
              }}>
                <img
                  src={cat.img}
                  alt={cat.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <span style={{
                fontSize: 10,
                color: selectedCa === cat.ca_id ? "#8B5E3C" : "#555",
                fontWeight: selectedCa === cat.ca_id ? 700 : 400,
                textAlign: "center", lineHeight: 1.3, maxWidth: 56,
              }}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Left panel - main categories */}
        <div style={{
          width: 110,
          flexShrink: 0,
          background: "#fff",
          borderRight: "1px solid #eee",
          overflowY: "auto",
        }}>
          {MAIN_CATEGORIES.map(cat => (
            <button
              key={cat.ca_id}
              onClick={() => setSelectedCa(cat.ca_id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "14px 10px",
                background: selectedCa === cat.ca_id ? "#FDF6EE" : "none",
                border: "none",
                borderBottom: "1px solid #f5f5f5",
                borderLeft: selectedCa === cat.ca_id ? "3px solid #8B5E3C" : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{
                fontSize: 12,
                color: selectedCa === cat.ca_id ? "#8B5E3C" : "#444",
                fontWeight: selectedCa === cat.ca_id ? 700 : 400,
                lineHeight: 1.4,
              }}>
                {cat.name}
              </span>
              {cat.isNew && (
                <span style={{
                  fontSize: 8, fontWeight: 800,
                  color: "#8B5E3C",
                  letterSpacing: -0.5,
                  flexShrink: 0,
                  marginLeft: 2,
                }}>
                  N
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right panel - subcategories + banner */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 80px" }}>

          {/* Promo banner */}
          <div style={{
            background: "linear-gradient(135deg, #e8f8f0 0%, #c6f0d8 100%)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid #b8e8cc",
          }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "#8B5E3C", fontWeight: 600 }}>
                seoulmono에서 상품을 구매하시고 리뷰를 작성하면
              </p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#8B5E3C" }}>
                리뷰 1000p 적립
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "#5a9a7a" }}>
                이벤트 기간: 2024.71 – 이벤트 종료 후 까지
              </p>
            </div>
            <div style={{
              width: 52, height: 52,
              background: "#8B5E3C",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: "#fff", textAlign: "center", lineHeight: 1.4 }}>
                soro{"\n"}soro
              </span>
            </div>
          </div>

          {/* Current category header */}
          <button
            onClick={() => navigate(`/list?ca_id=${selectedCa}`)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", background: "none", border: "none", cursor: "pointer",
              padding: "8px 0 10px",
              borderBottom: "1.5px solid #eee", marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: "#222" }}>
              {MAIN_CATEGORIES.find(c => c.ca_id === selectedCa)?.name || ""}
            </span>
            <ChevronRight size={16} color="#888" />
          </button>

          {/* Subcategories */}
          {(SUB_CATEGORIES[selectedCa] || []).map(sub => (
            <button
              key={sub}
              onClick={() => navigate(`/list?ca_id=${selectedCa}&q=${encodeURIComponent(sub)}`)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: "none", border: "none", cursor: "pointer",
                padding: "11px 4px",
                fontSize: 13, color: "#555",
                borderBottom: "1px solid #f5f5f5",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#8B5E3C"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#555"; }}
            >
              {sub}
            </button>
          ))}

          {/* Next categories */}
          {MAIN_CATEGORIES.filter(c => c.ca_id !== selectedCa).slice(0, 3).map(cat => (
            <div key={cat.ca_id} style={{ marginTop: 14 }}>
              <button
                onClick={() => { setSelectedCa(cat.ca_id); navigate(`/list?ca_id=${cat.ca_id}`); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  padding: "8px 0 10px",
                  borderBottom: "1.5px solid #eee", marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: "#222" }}>{cat.name}</span>
                <ChevronRight size={16} color="#888" />
              </button>
              {(SUB_CATEGORIES[cat.ca_id] || []).slice(0, 4).map(sub => (
                <button
                  key={sub}
                  onClick={() => navigate(`/list?ca_id=${cat.ca_id}`)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: "none", border: "none", cursor: "pointer",
                    padding: "10px 4px",
                    fontSize: 13, color: "#555",
                    borderBottom: "1px solid #f5f5f5",
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
