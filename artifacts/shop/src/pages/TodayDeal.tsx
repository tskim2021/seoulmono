import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Share2, Lock, ChevronLeft, ShoppingBasket, ExternalLink } from "lucide-react";
import { getTodayDeal, formatPrice, discountRate, type ShopItem } from "@/lib/api";
import { addToCart } from "@/lib/cart";

const SNS_SESSION_KEY = "seoulmono_sns_access";

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

interface TodayDealCardProps {
  item: ShopItem;
  snsAccess: boolean;
  onCartAdd: () => void;
  onItemClick: (id: string) => void;
}

function TodayDealCard({ item, snsAccess, onCartAdd, onItemClick }: TodayDealCardProps) {
  const [cartAdded, setCartAdded] = useState(false);
  const disc = discountRate(item.it_cust_price, item.it_price);

  const handleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!snsAccess) return;
    if (item.it_soldout === "1") return;
    addToCart(item, 1);
    onCartAdd();
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1400);
  };

  return (
    <div
      className="product-card"
      onClick={() => onItemClick(item.it_id)}
      style={{ cursor: "pointer", position: "relative" }}
    >
      <div style={{ position: "relative" }}>
        <img
          src={item.it_img1.startsWith("http") ? item.it_img1 : item.it_img1.startsWith("/") ? item.it_img1 : `/api/product-image/${item.it_img1}`}
          alt={item.it_name}
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        {disc > 0 && (
          <span style={{ position: "absolute", top: 6, left: 6, background: "#e03a5a", color: "#fff", fontSize: 11, fontWeight: 800, borderRadius: 4, padding: "2px 7px" }}>
            {disc}%
          </span>
        )}
        {item.it_soldout === "1" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "#333", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 4 }}>품절</span>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 10px 12px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: "#333", lineHeight: 1.4, fontWeight: 500, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.it_name}
        </p>
        {disc > 0 && item.it_cust_price > 0 && (
          <p style={{ margin: "0 0 2px", fontSize: 11, color: "#bbb", textDecoration: "line-through" }}>
            {formatPrice(item.it_cust_price)}
          </p>
        )}
        <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#8B5E3C" }}>
          {formatPrice(item.it_price)}
        </p>
        {/* 장바구니 버튼 */}
        {snsAccess ? (
          <button
            onClick={handleCart}
            disabled={item.it_soldout === "1"}
            style={{
              width: "100%", padding: "8px 0", borderRadius: 6, fontSize: 12, fontWeight: 700,
              cursor: item.it_soldout === "1" ? "not-allowed" : "pointer", border: "none",
              background: cartAdded ? "#8B5E3C" : item.it_soldout === "1" ? "#e0e0e0" : "#f0f7f4",
              color: cartAdded ? "#fff" : item.it_soldout === "1" ? "#aaa" : "#8B5E3C",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 0.2s",
            }}
          >
            <ShoppingBasket size={13} />
            {cartAdded ? "담았습니다!" : item.it_soldout === "1" ? "품절" : "장바구니"}
          </button>
        ) : (
          <div style={{
            width: "100%", padding: "8px 0", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: "#f5f5f5", color: "#aaa", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 4,
          }}>
            <Lock size={11} /> SNS 접속 시 구매 가능
          </div>
        )}
      </div>
    </div>
  );
}

export default function TodayDeal() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [snsAccess, setSnsAccess] = useState(false);
  const [cartMsg, setCartMsg] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("from") === "sns") {
      sessionStorage.setItem(SNS_SESSION_KEY, "1");
    }
    const hasAccess = sessionStorage.getItem(SNS_SESSION_KEY) === "1";
    setSnsAccess(hasAccess);
    getTodayDeal(40).then(setItems).catch(() => setItems([]));
  }, []);

  const onCartAdd = () => {
    setCartMsg(true);
    setTimeout(() => setCartMsg(false), 1400);
  };

  const SNS_URL = ""; // URL은 추후 설정

  return (
    <div style={{ minHeight: "100vh", background: "#f9f9f9" }}>
      {/* 헤더 배너 */}
      <div style={{
        background: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
        color: "#fff", padding: "32px 20px 28px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14, marginBottom: 16, padding: 0 }}
          >
            <ChevronLeft size={18} /> 홈으로
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <Share2 size={16} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>SNS 한정</span>
            </div>
            {snsAccess && (
              <div style={{ background: "rgba(255,255,255,0.3)", borderRadius: 12, padding: "6px 14px", fontSize: 12, fontWeight: 700 }}>
                ✓ 구매 가능 상태
              </div>
            )}
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
            오늘만 이 가격!
          </h1>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
            SNS를 통해 접속하면 특별가로 구매할 수 있어요
          </p>
          {/* SNS 바로가기 버튼 */}
          {!snsAccess && SNS_URL && (
            <a
              href={SNS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#fff", color: "#c0392b", borderRadius: 24,
                padding: "10px 20px", fontSize: 14, fontWeight: 800, textDecoration: "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              }}
            >
              <ExternalLink size={15} /> SNS에서 구매하기
            </a>
          )}
          {!snsAccess && !SNS_URL && (
            <div style={{
              background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.35)",
              borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#fff",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Lock size={15} />
              <span>SNS 링크를 통해 접속하면 구매 버튼이 활성화됩니다</span>
            </div>
          )}
        </div>
      </div>

      {/* 상품 목록 */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {!snsAccess && (
          <div style={{
            background: "#fff3f3", border: "1.5px solid #fecaca", borderRadius: 12,
            padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <Lock size={18} color="#e74c3c" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "#c0392b" }}>구매하려면 SNS 링크로 접속하세요</p>
              <p style={{ margin: 0, fontSize: 12, color: "#888" }}>상품 구경은 자유롭게 가능합니다. SNS 공유 링크를 통해 접속하시면 특가 구매 버튼이 활성화됩니다.</p>
            </div>
          </div>
        )}

        {items === null ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#aaa" }}>
            <Share2 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 600 }}>준비 중인 특가 상품입니다</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>곧 업데이트될 예정입니다!</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>총 {items.length}개 특가 상품</p>
            <div className="product-grid">
              {items.map(item => (
                <TodayDealCard
                  key={item.it_id}
                  item={item}
                  snsAccess={snsAccess}
                  onCartAdd={onCartAdd}
                  onItemClick={(id) => navigate(`/item/${id}`)}
                />
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
          장바구니에 담았습니다
        </div>
      )}
    </div>
  );
}
