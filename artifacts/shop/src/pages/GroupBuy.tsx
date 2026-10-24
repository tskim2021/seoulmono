import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Users, ChevronLeft } from "lucide-react";
import { getGroupBuy, formatPrice, discountRate, type ShopItem } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", background: "#fff", border: "1px solid #f0f0f0" }}>
      <div style={{ aspectRatio: "1/1", background: "#f0f0f0" }} />
      <div style={{ padding: 10 }}>
        <div style={{ height: 12, background: "#eee", borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 12, background: "#eee", borderRadius: 4, width: "70%", marginBottom: 10 }} />
        <div style={{ height: 16, background: "#eee", borderRadius: 4, width: "50%" }} />
      </div>
    </div>
  );
}

export default function GroupBuy() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [cartMsg, setCartMsg] = useState(false);

  useEffect(() => {
    getGroupBuy(40).then(setItems).catch(() => setItems([]));
  }, []);

  const onCartAdd = () => {
    setCartMsg(true);
    setTimeout(() => setCartMsg(false), 1400);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9f9f9" }}>
      {/* 헤더 배너 */}
      <div style={{
        background: "linear-gradient(135deg, #1a4e8a 0%, #2563eb 100%)",
        color: "#fff", padding: "32px 20px 28px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14, marginBottom: 16, padding: 0 }}
          >
            <ChevronLeft size={18} /> ホームへ
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={18} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>共同購入</span>
            </div>
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
            みんなで買えばもっとお得に!
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
            共同購入特価でお届けするseoulmono厳選商品
          </p>
        </div>
      </div>

      {/* 상품 목록 */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {items === null ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#aaa" }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600 }}>準備中の共同購入商品です</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>まもなく更新予定です。今しばらくお待ちください!</p>
            <button
              onClick={() => navigate("/")}
              style={{ marginTop: 20, padding: "10px 24px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              ホームに戻る
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>全{items.length}点の商品</p>
            <div className="product-grid">
              {items.map(item => (
                <ProductCard key={item.it_id} item={item} onCartAdd={onCartAdd} />
              ))}
            </div>
          </>
        )}
      </div>

      {cartMsg && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "rgba(29,138,90,0.96)", color: "#fff",
          padding: "12px 24px", borderRadius: 24, fontSize: 14, fontWeight: 700,
          boxShadow: "0 4px 20px rgba(0,0,0,0.22)", zIndex: 9999, whiteSpace: "nowrap",
        }}>
          カートに追加しました
        </div>
      )}
    </div>
  );
}
