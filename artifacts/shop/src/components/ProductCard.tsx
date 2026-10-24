import { useState } from "react";
import { useLocation } from "wouter";
import { ShoppingCart, Heart, ShoppingBasket } from "lucide-react";
import type { ShopItem } from "@/lib/api";
import { formatPrice, discountRate, getImageUrl } from "@/lib/api";
import { addToCart } from "@/lib/cart";

interface ProductCardProps {
  item: ShopItem;
  onCartAdd?: () => void;
  showRank?: number;
  large?: boolean;
}

const BASE = import.meta.env.BASE_URL;

export default function ProductCard({ item, onCartAdd, showRank, large }: ProductCardProps) {
  const [, navigate] = useLocation();
  const [cartAdded, setCartAdded] = useState(false);
  const disc = discountRate(item.it_cust_price, item.it_price);
  const isSoldout = item.it_soldout === "1";
  const isReady = item.it_soldout === "2";

  const handleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldout || isReady) return;
    addToCart(item, 1);
    onCartAdd?.();
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1400);
  };

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden elegant-shadow hover:elegant-shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => navigate(`/item/${item.it_id}`)}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-secondary/30 shrink-0 ${large ? "flex-1 min-h-[180px]" : "aspect-square"}`}>
        {/* Rank badge */}
        {showRank && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-14 z-[2] pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 100%)" }}
            />
            <span className="absolute bottom-2 left-2.5 z-[3] font-black italic leading-none"
              style={{
                fontFamily: "'Arial Black', sans-serif",
                fontSize: showRank <= 3 ? 28 : 22,
                color: showRank === 1 ? "#FFD700" : showRank === 2 ? "#C8C8D0" : showRank === 3 ? "#E8935A" : "#fff",
                textShadow: "0 1px 4px rgba(0,0,0,0.55)",
                letterSpacing: "-1px",
              }}>
              {showRank}
            </span>
          </>
        )}

        {/* Discount badge */}
        {disc > 0 && (
          <div className="absolute top-2 left-2 z-[3] flex flex-col gap-1">
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{disc}%
            </span>
          </div>
        )}

        {/* Soldout overlay */}
        {isSoldout && (
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center z-[4]">
            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">売り切れ</span>
          </div>
        )}
        {isReady && (
          <div className="absolute inset-0 bg-white/55 flex items-center justify-center z-[4]">
            <span className="text-gray-600 font-bold text-xs bg-white/92 px-3 py-1 rounded-full border border-border">販売準備中</span>
          </div>
        )}

        {/* Product image */}
        {item.it_img1 ? (
          <img
            src={getImageUrl(item.it_img1, large ? 800 : 400)}
            alt={item.it_name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${large ? "object-contain" : ""}`}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12 opacity-20" />
          </div>
        )}

        {/* Quick cart on hover */}
        {!isSoldout && !isReady && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[3]">
            <button
              onClick={handleCart}
              className="w-8 h-8 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center hover:bg-primary text-primary-foreground shadow-sm transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Cart button row */}
      {isReady ? (
        <div className="w-full py-2.5 bg-muted border-t border-border flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground shrink-0">
          販売準備中
        </div>
      ) : (
        <button
          onClick={handleCart}
          className={`w-full py-2.5 border-t border-border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all shrink-0 ${
            isSoldout
              ? "bg-muted text-muted-foreground cursor-default"
              : cartAdded
              ? "bg-primary/10 text-primary"
              : "bg-card hover:bg-accent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBasket className={`w-3.5 h-3.5 ${cartAdded ? "text-primary" : ""}`} />
          {cartAdded ? "追加しました!" : "カートに入れる"}
        </button>
      )}

      {/* Info */}
      <div className={`${large ? "p-3.5" : "p-2.5"} flex flex-col gap-1 shrink-0`}>
        <h3 className={`line-clamp-2 leading-snug ${large ? "text-sm font-semibold min-h-[44px]" : "text-xs font-normal text-foreground/90 min-h-[38px]"}`}>
          {item.it_name}
        </h3>
        <div className="mt-1">
          {item.it_cust_price > item.it_price && disc > 0 && (
            <p className={`text-muted-foreground line-through mb-0.5 ${large ? "text-xs" : "text-[11px]"}`}>
              {item.it_cust_price.toLocaleString()}円
            </p>
          )}
          <div className="flex items-baseline gap-1">
            {disc > 0 && (
              <span className={`font-bold text-destructive ${large ? "text-base" : "text-sm"}`}>{disc}%</span>
            )}
            <span className={`font-bold text-foreground price-text ${large ? "text-lg" : "text-sm"}`}>
              {formatPrice(item.it_price)}
            </span>
          </div>
          {item.it_use_cnt > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-amber-400 text-[11px]">★</span>
              <span className="text-[11px] text-muted-foreground">
                {item.it_use_avg.toFixed(1)} ({item.it_use_cnt})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
