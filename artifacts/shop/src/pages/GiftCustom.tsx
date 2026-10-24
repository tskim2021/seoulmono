import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, Plus, Minus, Search, Gift, ChevronRight, Loader2, X } from "lucide-react";
import { addToGiftCart, getGiftCart, updateGiftCartQty, removeFromGiftCart, getGiftCartCount, GIFT_CART_EVENT } from "@/lib/gift-cart";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = import.meta.env.VITE_API_URL ?? "";

function imgUrl(p: string) {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  if (p.startsWith("/")) return p;
  return `/api/product-image/${p}`;
}
function fmtPrice(n: number) { return n > 0 ? n.toLocaleString() + "원" : "가격 문의"; }

const CATS = [
  { id: "", label: "전체", emoji: "🎁" },
  { id: "10", label: "과자류", emoji: "🍪" },
  { id: "20", label: "유지류", emoji: "🫙" },
  { id: "30", label: "통조림캔류", emoji: "🥫" },
];

interface Product {
  it_id: string;
  it_name: string;
  it_img1: string;
  it_price: number;
  ca_id: string;
}

export default function GiftCustom() {
  const [, navigate] = useLocation();
  const [cat, setCat] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [giftCart, setGiftCart] = useState(getGiftCart);
  const [cartCount, setCartCount] = useState(getGiftCartCount);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toastMsg, setToastMsg] = useState("");

  const refresh = useCallback(() => {
    setGiftCart(getGiftCart());
    setCartCount(getGiftCartCount());
  }, []);

  useEffect(() => {
    window.addEventListener(GIFT_CART_EVENT, refresh);
    return () => window.removeEventListener(GIFT_CART_EVENT, refresh);
  }, [refresh]);

  useEffect(() => {
    setLoading(true);
    const url = `${API_BASE}/api/shop/gift/catalog?ca_id=${cat}&search=${encodeURIComponent(query)}&page=${page}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setProducts(d.items || []); setTotal(d.total || 0); })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [cat, query, page]);

  const cartQty = (it_id: string) => giftCart.find(c => c.it_id === it_id)?.quantity ?? 0;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 1800);
  };

  const handleAdd = (p: Product) => {
    addToGiftCart({ it_id: p.it_id, it_name: p.it_name, it_price: p.it_price, it_img1: p.it_img1, quantity: 1, ca_id: p.ca_id });
    showToast("선물 장바구니에 담았습니다");
  };

  const handleQty = (it_id: string, delta: number) => {
    const cur = cartQty(it_id);
    const next = cur + delta;
    if (next <= 0) removeFromGiftCart(it_id);
    else updateGiftCartQty(it_id, next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
    setPage(1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 120 }}>
      {/* 헤더 */}
      <div style={{ background: "linear-gradient(135deg,#8B5E3C 0%,#25a870 100%)", padding: "22px 20px 28px", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <button onClick={() => navigate("/gift")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer", marginBottom: 14 }}>
            ← 선물하기
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>직접 골라서 선물세트 만들기</h1>
          <p style={{ fontSize: 14, opacity: 0.85, margin: 0 }}>원하는 상품을 골라 나만의 선물세트를 구성하세요</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
        {/* 검색 */}
        <form onSubmit={handleSearch} style={{ margin: "20px 0 16px", display: "flex", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "0 14px", gap: 8 }}>
            <Search size={16} color="#aaa" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="상품명으로 검색..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, height: 44, background: "transparent" }}
            />
            {search && <button type="button" onClick={() => { setSearch(""); setQuery(""); setPage(1); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><X size={14} color="#aaa" /></button>}
          </div>
          <button type="submit" style={{ background: "#8B5E3C", border: "none", color: "#fff", borderRadius: 12, padding: "0 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>검색</button>
        </form>

        {/* 카테고리 탭 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => { setCat(c.id); setPage(1); }}
              style={{
                background: cat === c.id ? "#8B5E3C" : "#fff",
                color: cat === c.id ? "#fff" : "#555",
                border: cat === c.id ? "none" : "1.5px solid #e0e0e0",
                borderRadius: 20, padding: "8px 18px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* 상품 그리드 */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 size={32} color="#8B5E3C" className="animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
            <ShoppingBag size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 15 }}>상품이 없습니다</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
            {products.map(p => {
              const qty = cartQty(p.it_id);
              return (
                <div key={p.it_id} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #f0f0f0", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  {/* 이미지 */}
                  <div style={{ width: "100%", aspectRatio: "1", background: "#f5f5f5", overflow: "hidden", position: "relative" }}>
                    <img
                      src={imgUrl(p.it_img1)}
                      alt={p.it_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      loading="lazy"
                    />
                    {qty > 0 && (
                      <div style={{ position: "absolute", top: 8, right: 8, background: "#8B5E3C", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
                        {qty}
                      </div>
                    )}
                  </div>
                  {/* 정보 */}
                  <div style={{ padding: "12px 12px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 12.5, color: "#333", margin: "0 0 6px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                      {p.it_name}
                    </p>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#8B5E3C" }}>{fmtPrice(p.it_price)}</span>
                    {/* 수량 컨트롤 */}
                    <div style={{ marginTop: 10 }}>
                      {qty === 0 ? (
                        <button
                          onClick={() => handleAdd(p)}
                          style={{ width: "100%", background: "#8B5E3C", border: "none", color: "#fff", borderRadius: 10, height: 36, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                        >
                          <Plus size={14} /> 담기
                        </button>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1.5px solid #8B5E3C", borderRadius: 10, overflow: "hidden" }}>
                          <button onClick={() => handleQty(p.it_id, -1)} style={{ width: 36, height: 36, background: "#f0f9f4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Minus size={13} color="#8B5E3C" />
                          </button>
                          <span style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#8B5E3C" }}>{qty}</span>
                          <button onClick={() => handleQty(p.it_id, 1)} style={{ width: 36, height: 36, background: "#f0f9f4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Plus size={13} color="#8B5E3C" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {total > 24 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
            {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13 }}>이전</button>}
            <span style={{ lineHeight: "38px", fontSize: 13, color: "#888" }}>{page} / {Math.ceil(total / 24)}</span>
            {page * 24 < total && <button onClick={() => setPage(p => p + 1)} style={{ background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13 }}>다음</button>}
          </div>
        )}
      </div>

      {/* 담기 토스트 */}
      {toastMsg && (
        <div style={{ position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)", background: "rgba(29,138,90,0.95)", color: "#fff", borderRadius: 24, padding: "11px 24px", fontSize: 13, fontWeight: 700, zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
          🛍️ {toastMsg}
        </div>
      )}

      {/* 하단 고정 CTA */}
      {cartCount > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #eee", padding: "14px 20px", zIndex: 100, boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ maxWidth: 500, margin: "0 auto" }}>
            <button
              onClick={() => navigate("/gift/cart")}
              style={{ width: "100%", height: 54, background: "linear-gradient(135deg,#8B5E3C,#25a870)", border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 16px rgba(29,138,90,0.35)" }}
            >
              <Gift size={20} />
              선물 장바구니 보기 ({cartCount}개)
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
