import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import {
  ChevronRight, Heart, ShoppingCart, Plus, Minus, Star,
  Phone, MessageCircle, Home, Truck, Package, Gift,
  Clock, Shield, Users, AlertCircle,
  Send, Lock, CheckCircle,
} from "lucide-react";

import { getShopItem, getShopItems, type ShopItemDetail, type ShopItem, formatPrice, discountRate, getImageUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { NOTICE_CATEGORY_MAP, parseNotice } from "@/lib/itemNotice";
import { addToCart } from "@/lib/cart";
import { setCheckoutItems } from "@/pages/Checkout";
import { orderStatusJa } from "@/lib/labels";

function thumbUrl(src: string, w: number): string {
  if (!src) return src;
  if (src.startsWith("/api/product-image/")) return `${src}?w=${w}`;
  return src;
}

function parseOptQty(optId: string): number {
  const m = optId.match(/[(\[（](\d+)입[)\]）]/);
  return m ? parseInt(m[1]) : 1;
}

function getEndOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return { days, hours, mins, secs };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [target.getTime()]);
  return time;
}

function LowestPriceBanner() {
  const target = useRef(getEndOfMonth());
  const { days, hours, mins, secs } = useCountdown(target.current);
  const pad = (n: number) => String(n).padStart(2, "0");

  const Block = ({ val }: { val: string }) => (
    <div style={{ display: "flex", gap: 2 }}>
      {val.split("").map((d, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 32, background: "rgba(0,0,0,0.3)", color: "#fff",
          fontSize: 16, fontWeight: 800, borderRadius: 6,
          fontVariantNumeric: "tabular-nums", backdropFilter: "blur(4px)",
        }}>{d}</span>
      ))}
    </div>
  );

  return (
    <div style={{
      background: "linear-gradient(135deg, #0d7a4f 0%, #8B5E3C 50%, #22a06b 100%)",
      borderRadius: 14, padding: "16px 20px", marginBottom: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 10, boxShadow: "0 4px 16px rgba(29,138,90,0.25)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          background: "#fff", color: "#0d7a4f", fontSize: 11, fontWeight: 900,
          padding: "4px 10px", borderRadius: 20, letterSpacing: 0.5,
        }}>最安値に挑戦</span>
        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600 }}>
          残り期間
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Block val={String(days)} />
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>日</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: 300 }}>:</span>
        <Block val={pad(hours)} />
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>時間</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: 300 }}>:</span>
        <Block val={pad(mins)} />
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>分</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: 300 }}>:</span>
        <Block val={pad(secs)} />
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>秒</span>
      </div>
    </div>
  );
}

const TABS = [
  { key: "detail",   label: "商品説明" },
  { key: "notice",   label: "商品情報表示" },
  { key: "exchange", label: "交換/返品" },
  { key: "review",   label: "レビュー" },
  { key: "qna",      label: "Q&A" },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function Item() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [item, setItem] = useState<ShopItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedOption, setSelectedOption] = useState("");
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<{ od_id: string; od_status: string; od_time: string }[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("detail");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [relatedItems, setRelatedItems] = useState<ShopItem[]>([]);

  const sectionRefs = useRef<Record<TabKey, HTMLDivElement | null>>({
    detail: null, notice: null, exchange: null, review: null, qna: null,
  });
  const tabBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    setActiveImg(0); setQty(1); setSelectedOption("");
    getShopItem(id)
      .then(d => {
        setItem({ ...d, options: d.options || [] });
        fetch(`/api/shop/items/${id}/related`)
          .then(r => r.json())
          .then(r => setRelatedItems(r.items || []))
          .catch(() => {});
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
    const token = localStorage.getItem("seoulmono_token");
    if (token && id) {
      fetch(`/api/shop/wishlist/${id}/status`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setWishlisted(d.wished || false)).catch(() => {});
      fetch(`/api/shop/my-orders/item/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setPurchaseOrders(d.orders || [])).catch(() => {});
    }
  }, [id]);

  const toggleWishlist = async () => {
    const token = localStorage.getItem("seoulmono_token");
    if (!token) { alert("ログイン後にご利用ください"); return; }
    if (wishLoading) return;
    setWishLoading(true);
    try {
      const res = await fetch(`/api/shop/wishlist/${id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWishlisted(data.wished);
    } catch {} finally { setWishLoading(false); }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const id = e.target.getAttribute("data-section") as TabKey;
            if (id) setActiveTab(id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [item]);

  const scrollToSection = (key: TabKey) => {
    const el = sectionRefs.current[key];
    if (!el) return;
    const h = tabBarRef.current?.offsetHeight || 52;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - h - 8, behavior: "smooth" });
    setActiveTab(key);
  };

  if (loading) return <SkeletonDetail />;
  if (!item) return null;

  const disc = discountRate(item.it_cust_price, item.it_price);
  const optObj = item.options.find(o => o.io_id === selectedOption);
  const optPriceAdd = optObj?.io_price || 0;
  const finalPrice = item.it_price + optPriceAdd;
  const totalPrice = finalPrice * qty;
  const isSoldout = item.it_soldout === "1";
  const isReady = item.it_soldout === "2";
  const canBuy = !isSoldout && !isReady;

  const handleAddToCart = () => {
    if (!item || !canBuy) return;
    addToCart({ ...item, it_price: finalPrice, it_img1: item.images[0] || "" }, qty, selectedOption || undefined, optPriceAdd);
    setAdded(true); setTimeout(() => setAdded(false), 2000);
  };

  const prepareCheckout = (guest: boolean) => {
    if (!item || !canBuy) return;
    setCheckoutItems([{
      it_id: item.it_id, it_name: item.it_name, it_price: finalPrice,
      it_img1: item.images[0] || item.it_img1 || "",
      quantity: qty, option: selectedOption || undefined, option_price: optPriceAdd || undefined,
    }]);
    navigate(guest ? "/checkout?guest=1" : "/checkout");
  };

  const handleBuy = () => {
    if (!item || !canBuy) return;
    const token = localStorage.getItem("seoulmono_token");
    if (!token) { setShowBuyModal(true); return; }
    prepareCheckout(false);
  };

  return (
    <div style={{ background: "#fafafa", minHeight: "100vh" }}>
      <div className="page-wrap" style={{ paddingTop: 20, paddingBottom: 48 }}>

        {/* 브레드크럼 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 24, fontSize: 12, color: "#bbb", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 12, padding: 0, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#8B5E3C")}
            onMouseLeave={e => (e.currentTarget.style.color = "#bbb")}>ホーム</button>
          {item.ca_name && (
            <>
              <ChevronRight size={11} strokeWidth={1.5} />
              <button onClick={() => navigate(`/list?ca_id=${item.ca_id}`)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 12, padding: 0, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#8B5E3C")}
                onMouseLeave={e => (e.currentTarget.style.color = "#bbb")}>{item.ca_name}</button>
            </>
          )}
          <ChevronRight size={11} strokeWidth={1.5} />
          <span style={{ color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>{item.it_name}</span>
        </div>

        {/* 메인 2컬럼 */}
        <div className="item-top-layout">

          {/* 좌: 이미지 */}
          <div className="item-image-section">
            {/* 메인 이미지 */}
            <div style={{
              position: "relative", background: "#fff", borderRadius: 16, overflow: "hidden",
              aspectRatio: "1/1", boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
              marginBottom: 12,
            }}>
              {item.images[activeImg]
                ? <img src={thumbUrl(item.images[activeImg], 800)} alt={item.it_name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", transition: "opacity 0.2s" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd", fontSize: 14 }}>画像なし</div>
              }

              {/* 할인 뱃지 */}
              {disc > 0 && !isSoldout && !isReady && (
                <div style={{
                  position: "absolute", top: 14, left: 14,
                  background: "#fa622f", color: "#fff",
                  fontSize: 13, fontWeight: 900, padding: "5px 10px",
                  borderRadius: 8, lineHeight: 1,
                }}>{disc}%</div>
              )}

              {isSoldout && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>SOLD OUT</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>売り切れの商品です</span>
                </div>
              )}
              {isReady && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#555", fontSize: 17, fontWeight: 700, background: "#fff", padding: "10px 28px", borderRadius: 30, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>販売準備中</span>
                </div>
              )}

              {/* 이미지 인디케이터 */}
              {item.images.length > 1 && (
                <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
                  {item.images.map((_, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      style={{
                        width: i === activeImg ? 20 : 7, height: 7, borderRadius: 4, border: "none",
                        cursor: "pointer", padding: 0, transition: "all 0.2s",
                        background: i === activeImg ? "#8B5E3C" : "rgba(255,255,255,0.7)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      }} />
                  ))}
                </div>
              )}
            </div>

            {/* 썸네일 */}
            {item.images.length > 1 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {item.images.slice(0, 6).map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{
                      width: 64, height: 64, padding: 0, flexShrink: 0,
                      border: `2px solid ${i === activeImg ? "#8B5E3C" : "transparent"}`,
                      borderRadius: 10, overflow: "hidden", cursor: "pointer",
                      background: "#fff", transition: "all 0.15s",
                      boxShadow: i === activeImg ? "0 0 0 3px rgba(29,138,90,0.15)" : "0 1px 6px rgba(0,0,0,0.08)",
                    }}>
                    <img src={thumbUrl(img, 120)} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </button>
                ))}
              </div>
            )}

            {/* 관련 상품 — 이미지 아래 */}
            {relatedItems.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <RelatedSlider
                  title={`${item?.ca_name || "同じカテゴリー"} の他の商品`}
                  items={relatedItems}
                />
              </div>
            )}
          </div>

          {/* 우: 상품 정보 */}
          <div className="item-info-section">

            {/* 카테고리 태그 */}
            {item.ca_name && (
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#8B5E3C", fontWeight: 600, background: "#FEF6ED", padding: "3px 10px", borderRadius: 20 }}>{item.ca_name}</span>
              </div>
            )}

            {/* 상품명 */}
            <h1 style={{ fontSize: 21, fontWeight: 700, color: "#111", margin: "0 0 12px", lineHeight: 1.5, letterSpacing: -0.3 }}>{item.it_name}</h1>

            {/* 별점 */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} fill={i < Math.round(item.it_use_avg) ? "#FFB800" : "none"} color={i < Math.round(item.it_use_avg) ? "#FFB800" : "#e0e0e0"} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: "#333", fontWeight: 700 }}>{item.it_use_avg.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: "#bbb" }}>({item.it_use_cnt}件)</span>
            </div>

            {/* 최저가도전 배너 */}
            {item.filter1 === "12" && <LowestPriceBanner />}

            {/* 가격 카드 */}
            <div style={{
              background: "#fff", borderRadius: 14, padding: "20px 22px",
              marginBottom: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
            }}>
              {disc > 0 && item.it_cust_price > item.it_price ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#bbb", textDecoration: "line-through" }}>
                      定価 {formatPrice(item.it_cust_price)}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#fa622f",
                      background: "#fff3ef", padding: "2px 7px", borderRadius: 4,
                    }}>{disc}%オフ</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: "#111", letterSpacing: -1 }}>
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                </>
              ) : (
                <span style={{ fontSize: 32, fontWeight: 900, color: "#111", letterSpacing: -1 }}>{formatPrice(finalPrice)}</span>
              )}

              {/* 배송 */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f5f5f5", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Truck size={13} color="#8B5E3C" />
                  <span style={{ fontSize: 12, color: "#555" }}>通常配送 <strong style={{ color: "#111" }}>4,000円</strong></span>
                  <span style={{ fontSize: 11, color: "#8B5E3C", background: "#FEF6ED", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>40,000円以上で送料無料</span>
                </div>
              </div>
            </div>

            {/* 정보 rows */}
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", marginBottom: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
              <InfoRow label="購入ポイント">
                <span style={{ color: "#666", fontSize: 13 }}>ログイン後にポイント還元特典をご利用いただけます。</span>
              </InfoRow>
              <InfoRow label="クーポン&特典">
                <span style={{ color: "#8B5E3C", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 600 }}>
                  開催中のクーポン&特典を確認 <ChevronRight size={13} />
                </span>
              </InfoRow>
              {item.it_origin && <InfoRow label="原産地"><span style={{ fontSize: 13, color: "#444" }}>{item.it_origin}</span></InfoRow>}
              {item.it_maker && <InfoRow label="メーカー"><span style={{ fontSize: 13, color: "#444" }}>{item.it_maker}</span></InfoRow>}
              {item.box_qty > 0 && <InfoRow label="ケース入数"><span style={{ fontSize: 13, color: "#444" }}>{item.box_qty}個</span></InfoRow>}
              {item.it_shelf_life && <InfoRow label="賞味期限"><span style={{ fontSize: 13, color: "#444" }}>{item.it_shelf_life}</span></InfoRow>}
              <InfoRow label="商品番号"><span style={{ fontSize: 12, color: "#aaa", fontFamily: "monospace" }}>{item.it_id}</span></InfoRow>
            </div>

            {/* 선택옵션 */}
            {item.options.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#333", margin: "0 0 12px" }}>数量を選択</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {item.options.map(opt => {
                    const finalP = item.it_price + opt.io_price;
                    const optQty = parseOptQty(opt.io_id);
                    const origTotal = item.it_cust_price * optQty;
                    const d = origTotal > finalP ? Math.round((1 - finalP / origTotal) * 100) : 0;
                    const isSel = selectedOption === opt.io_id;
                    return (
                      <button key={opt.io_id} onClick={() => setSelectedOption(opt.io_id)}
                        style={{
                          padding: "10px 18px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                          border: `2px solid ${isSel ? "#8B5E3C" : "#ebebeb"}`,
                          background: isSel ? "#FEF6ED" : "#fafafa",
                          transition: "all 0.15s", minWidth: 90,
                          boxShadow: isSel ? "0 0 0 3px rgba(29,138,90,0.1)" : "none",
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? "#8B5E3C" : "#222", whiteSpace: "nowrap" }}>{opt.io_id}</div>
                        <div style={{ fontSize: 11, marginTop: 3, color: d > 0 ? "#fa622f" : (isSel ? "#8B5E3C" : "#999"), whiteSpace: "nowrap" }}>
                          {d > 0 ? `${d}% ` : ""}{formatPrice(finalP)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 수량 + 총가격 */}
            {!isSoldout && (item.options.length === 0 || selectedOption !== "") && (
              <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: "#555", fontWeight: 600 }}>数量</span>
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e8e8e8", borderRadius: 10, overflow: "hidden", background: "#f8f8f8" }}>
                    <button onClick={() => setQty(Math.max(1, qty - 1))}
                      style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "#555" }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ width: 50, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#111", background: "#fff", lineHeight: "42px" }}>{qty}</span>
                    <button onClick={() => setQty(qty + 1)}
                      style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "#555" }}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: 13, color: "#aaa" }}>
                    {optObj ? optObj.io_id : "基本"} × {qty}点
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 13, color: "#888" }}>合計</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: "#fa622f", letterSpacing: -0.5 }}>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            {isReady ? (
              <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#bbb" }}>
                販売準備中です
              </div>
            ) : isSoldout ? (
              <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0", borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#bbb" }}>
                売り切れの商品です
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* 찜하기 */}
                <button onClick={toggleWishlist} disabled={wishLoading}
                  style={{
                    width: 56, height: 56, flexShrink: 0,
                    border: `2px solid ${wishlisted ? "#e91e63" : "#e8e8e8"}`,
                    borderRadius: 14, background: wishlisted ? "#fff0f5" : "#fff",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 2,
                    transition: "all 0.2s", boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  }}>
                  <Heart size={20} fill={wishlisted ? "#e91e63" : "none"} color={wishlisted ? "#e91e63" : "#ccc"} />
                  <span style={{ fontSize: 9, color: wishlisted ? "#e91e63" : "#ccc", fontWeight: 700, lineHeight: 1 }}>お気に入り</span>
                </button>
                {/* 장바구니 */}
                <button onClick={handleAddToCart}
                  style={{
                    flex: 1, height: 56, border: "2px solid #8B5E3C", borderRadius: 14,
                    background: added ? "#8B5E3C" : "#fff", color: added ? "#fff" : "#8B5E3C",
                    fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  }}>
                  {added ? <><CheckCircle size={16} />追加しました</> : <><ShoppingCart size={16} />カート</>}
                </button>
                {/* 바로구매 */}
                <button onClick={handleBuy}
                  style={{
                    flex: 1.2, height: 56, border: "none", borderRadius: 14,
                    background: "linear-gradient(135deg, #8B5E3C 0%, #22a06b 100%)",
                    color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(29,138,90,0.35)",
                    letterSpacing: 0.3,
                  }}>
                  今すぐ購入
                </button>
              </div>
            )}

            {/* 신뢰 배지 */}
            <div style={{ display: "flex", gap: 12, marginTop: 18, justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { icon: <Shield size={13} color="#8B5E3C" />, text: "直接買い付け" },
                { icon: <Truck size={13} color="#8B5E3C" />, text: "当日出荷" },
                { icon: <CheckCircle size={13} color="#8B5E3C" />, text: "正規品保証" },
              ].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" }}>
                  {b.icon}<span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 탭 + 섹션 ── */}
        <div style={{ marginTop: 64 }}>
          <div ref={tabBarRef} style={{
            position: "sticky", top: 0, zIndex: 50, background: "#fff",
            borderBottom: "1px solid #ebebeb", display: "flex",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            {TABS.map((tab, idx) => (
              <button key={tab.key} onClick={() => scrollToSection(tab.key)}
                style={{
                  flex: 1, padding: "16px 0", background: "transparent",
                  border: "none", borderBottom: `2.5px solid ${activeTab === tab.key ? "#8B5E3C" : "transparent"}`,
                  cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
                  color: activeTab === tab.key ? "#8B5E3C" : "#888",
                  transition: "all 0.2s", marginBottom: -1,
                }}>{tab.label}</button>
            ))}
          </div>

          {/* 상품설명 */}
          <div ref={el => { sectionRefs.current.detail = el; }} data-section="detail"
            style={{ paddingTop: 48, paddingBottom: 64, borderBottom: "8px solid #f3f4f6" }}>
            <SectionTitle>商品説明</SectionTitle>
            {item.it_explan
              ? <div className="item-desc-content" dangerouslySetInnerHTML={{ __html: item.it_explan.replace(/https?:\/\/seoulmono\.com\/data\//g, "https://thegaongill17.mycafe24.com/data/") }} />
              : <EmptyBox text="商品の詳細情報がありません。" />}
          </div>

          {/* 상품정보고시 */}
          <div ref={el => { sectionRefs.current.notice = el; }} data-section="notice"
            style={{ paddingTop: 48, paddingBottom: 64, borderBottom: "8px solid #f3f4f6" }}>
            <SectionTitle>商品情報表示</SectionTitle>
            {(() => {
              const notice = parseNotice((item as any).it_info || "");
              const cat = notice ? NOTICE_CATEGORY_MAP[notice.category] : null;
              if (!notice || !cat) {
                return <EmptyBox text="商品情報表示の内容がありません。" />;
              }
              return (
                <div style={{ maxWidth: 760, margin: "0 auto" }}>
                  <div style={{ fontSize: 12, color: "#aaa", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                    <Shield size={12} color="#bbb" />
                    商品情報表示 — <strong style={{ color: "#888" }}>{cat.title}</strong>
                  </div>
                  <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #ebebeb" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <tbody>
                        {cat.fields.map((field, idx) => {
                          const val = notice.fields[field.key] || "-";
                          return (
                            <tr key={field.key} style={{ borderBottom: idx < cat.fields.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                              <td style={{ width: "36%", padding: "13px 18px", background: "#fafafa", color: "#666", fontWeight: 600, verticalAlign: "top", lineHeight: 1.5, fontSize: 12 }}>
                                {field.label}
                              </td>
                              <td style={{ padding: "13px 18px", color: "#333", verticalAlign: "top", lineHeight: 1.7 }}>
                                {val === "상품상세참조" ? "商品詳細ページをご参照ください" : val}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 교환/반품 안내 */}
          <div ref={el => { sectionRefs.current.exchange = el; }} data-section="exchange"
            style={{ paddingTop: 48, paddingBottom: 64, borderBottom: "8px solid #f3f4f6" }}>
            <SectionTitle>交換/返品のご案内</SectionTitle>
            <ExchangeSection />
          </div>

          {/* 구매 내역 배너 */}
          {purchaseOrders.length > 0 && (
            <div style={{
              margin: "28px 0 0", padding: "16px 20px",
              background: "linear-gradient(135deg, #FEF6ED, #d4f0e3)",
              borderRadius: 14, display: "flex", alignItems: "center", gap: 14,
              border: "1px solid #c2e8d5",
            }}>
              <div style={{ width: 38, height: 38, background: "#8B5E3C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#0d7a4f" }}>購入済みの商品です</p>
                <p style={{ margin: 0, fontSize: 12, color: "#5a9a78" }}>
                  最近の注文: {new Date(purchaseOrders[0].od_time).toLocaleDateString("ja-JP")} · {orderStatusJa(purchaseOrders[0].od_status)}
                  {purchaseOrders.length > 1 && ` (全${purchaseOrders.length}回)`}
                </p>
              </div>
              <button onClick={() => {
                const el = sectionRefs.current.review;
                if (el) el.querySelector("button[data-write]")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              }} style={{ padding: "8px 16px", background: "#8B5E3C", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                レビューを書く
              </button>
            </div>
          )}

          {/* 리뷰 */}
          <div ref={el => { sectionRefs.current.review = el; }} data-section="review"
            style={{ paddingTop: 48, paddingBottom: 64, borderBottom: "8px solid #f3f4f6" }}>
            <SectionTitle>
              商品レビュー
              {item.it_use_cnt > 0 && (
                <span style={{ fontSize: 14, fontWeight: 400, color: "#aaa", marginLeft: 8 }}>({item.it_use_cnt}件)</span>
              )}
            </SectionTitle>
            <ReviewSection avg={item.it_use_avg} count={item.it_use_cnt} itemId={item.it_id} />
          </div>

          {/* Q&A */}
          <div ref={el => { sectionRefs.current.qna = el; }} data-section="qna"
            style={{ paddingTop: 48, paddingBottom: 64, borderBottom: relatedItems.length > 0 ? "8px solid #f3f4f6" : "none" }}>
            <SectionTitle>商品Q&A</SectionTitle>
            <QnaSection itemId={item.it_id} />
          </div>

          {/* 관련 상품 */}
          {relatedItems.length > 0 && (
            <RelatedSlider
              title={`${item.ca_name || "同じカテゴリー"} の他の商品`}
              items={relatedItems}
            />
          )}
        </div>
      </div>

      {/* 비회원구매 모달 */}
      {showBuyModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowBuyModal(false)} />
          <div style={{
            position: "relative", background: "#fff", borderRadius: 20, padding: "36px 32px 28px",
            width: "min(90vw, 380px)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center",
          }}>
            <div style={{ width: 64, height: 64, background: "#FEF6ED", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Lock size={28} color="#8B5E3C" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 10px" }}>ログインが必要なサービスです</h3>
            <p style={{ fontSize: 13.5, color: "#777", margin: "0 0 28px", lineHeight: 1.7 }}>
              ログインするとクーポン・ポイント特典をご利用いただけます。<br />
              ゲストとしてもご購入いただけます。
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => { setShowBuyModal(false); navigate("/login"); }}
                style={{ width: "100%", height: 50, background: "linear-gradient(135deg, #8B5E3C, #22a06b)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(29,138,90,0.3)" }}>
                ログインする
              </button>
              <button onClick={() => { setShowBuyModal(false); prepareCheckout(true); }}
                style={{ width: "100%", height: 50, background: "#fff", color: "#8B5E3C", border: "2px solid #8B5E3C", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                ゲストとして購入する
              </button>
              <button onClick={() => setShowBuyModal(false)}
                style={{ width: "100%", height: 42, background: "#f5f5f5", color: "#999", border: "none", borderRadius: 12, fontSize: 14, cursor: "pointer" }}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 하단 고정 버튼 */}
      <div className="mobile-buy-bar">
        {isReady ? (
          <div style={{ flex: 1, height: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#bbb" }}>販売準備中</div>
        ) : isSoldout ? (
          <div style={{ flex: 1, height: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "#eee", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#bbb" }}>売り切れ</div>
        ) : (
          <>
            <button onClick={handleAddToCart}
              style={{ flex: 1, height: 50, border: "2px solid #8B5E3C", borderRadius: 10, background: added ? "#8B5E3C" : "#fff", color: added ? "#fff" : "#8B5E3C", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <ShoppingCart size={15} />{added ? "追加しました" : "カート"}
            </button>
            <button onClick={handleBuy}
              style={{ flex: 2, height: 50, border: "none", borderRadius: 10, background: "linear-gradient(135deg, #8B5E3C, #22a06b)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              注文する
            </button>
          </>
        )}
      </div>

      <style>{`
        .item-top-layout { display: flex; gap: 40px; align-items: stretch; }
        .item-image-section { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .item-info-section { flex: 1; min-width: 0; }
        .item-desc-content { max-width: 860px; margin: 0 auto; line-height: 1.8; text-align: center; }
        .item-desc-content img { max-width: 100% !important; width: auto !important; height: auto !important; display: block; margin: 0 auto; }
        .item-desc-content table { margin: 0 auto; max-width: 100%; }
        .item-desc-content p { margin: 0; }
        .item-desc-content * { max-width: 100%; box-sizing: border-box; }
        .mobile-buy-bar { display: none; position: fixed; bottom: 60px; left: 0; right: 0; z-index: 100; background: #fff; border-top: 1px solid #f0f0f0; padding: 10px 16px; gap: 8px; box-shadow: 0 -4px 20px rgba(0,0,0,0.08); }
        .exchange-benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cs-contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .shipping-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .shipping-table td { padding: 12px 16px; border: 1px solid #f0f0f0; vertical-align: top; }
        .shipping-table .label-cell { background: #fafafa; color: #666; font-weight: 600; width: 120px; white-space: nowrap; }
        .review-stars-row { display: flex; gap: 4px; align-items: center; }
        .qna-item { border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; margin-bottom: 10px; }
        @media (max-width: 768px) {
          .item-top-layout { flex-direction: column; gap: 0; }
          .item-image-section { width: 100%; margin-bottom: 20px; }
          .mobile-buy-bar { display: flex !important; }
          .exchange-benefits-grid { grid-template-columns: 1fr; gap: 10px; }
          .cs-contact-grid { grid-template-columns: 1fr; }
          .shipping-table .label-cell { width: 80px; }
        }
      `}</style>
    </div>
  );
}

/* ── 교환/반품 안내 ── */
function ExchangeSection() {
  const benefits = [
    { icon: <Package size={22} color="#8B5E3C" />, title: "ケース単位でのご購入で追加割引", desc: "商品に表示されているケース単位ごとに割引が自動で適用されます。" },
    { icon: <Gift size={22} color="#8B5E3C" />, title: "自分で作るギフトセット", desc: "追加で組み合わせてギフトセットを作りたい場合は「DIYギフトセット」をご利用ください。" },
    { icon: <Truck size={22} color="#8B5E3C" />, title: "40,000円以上で送料無料", desc: "40,000円以上のご購入で送料無料。それ以外は送料4,000円がかかります。" },
    { icon: <Shield size={22} color="#8B5E3C" />, title: "安心してご購入ください", desc: "複数のセラーが集まるプラットフォームではなく、自社で物流を運営し、直接仕入れて販売するseoulmonoです。" },
    { icon: <Users size={22} color="#8B5E3C" />, title: "大容量は別途お問い合わせ", desc: "法人・団体でのご購入の場合は、別途ご連絡いただければ指定日の出荷が可能です。" },
    { icon: <Clock size={22} color="#8B5E3C" />, title: "賞味期限のご案内", desc: "賞味期限が1か月未満の商品は「賞味期限間近」として別途割引価格で販売します。" },
  ];

  return (
    <div>
      {/* 혜택 카드 */}
      <div className="exchange-benefits-grid" style={{ marginBottom: 40 }}>
        {benefits.map((b, i) => (
          <div key={i} style={{
            display: "flex", gap: 14, alignItems: "flex-start",
            padding: "18px 20px", background: "#fff", borderRadius: 14,
            border: "1px solid #f0f0f0", boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#FEF6ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{b.icon}</div>
            <div>
              <p style={{ margin: "0 0 5px", fontWeight: 700, fontSize: 13, color: "#111" }}>{b.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#777", lineHeight: 1.7 }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 고객행복센터 */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "36px 28px", marginBottom: 36, border: "1px solid #f0f0f0", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h3 style={{ color: "#111", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>お客様サポートセンター</h3>
          <p style={{ color: "#777", fontSize: 13, margin: 0 }}>ご利用の際にご不便な点がございましたらお知らせください</p>
        </div>
        <div className="cs-contact-grid">
          {[
            { icon: <Phone size={20} color="#8B5E3C" />, title: "お電話でのお問い合わせ", lines: ["月~土曜日", "午前7時 ~ 午後6時", "1644-1107"] },
            { icon: <MessageCircle size={20} color="#8B5E3C" />, title: "KakaoTalkでのお問い合わせ", lines: ["月~土 午前7時 ~ 午後6時", "日・祝日 午前7時 ~ 午後1時", "KakaoTalkで「seoulmono」を検索"] },
            { icon: <Home size={20} color="#8B5E3C" />, title: "ウェブサイトからのお問い合わせ", lines: ["365日", "ログイン > マイページ > お問い合わせ", "営業時間内に順次回答"] },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fafafa", borderRadius: 14, padding: "22px 16px", textAlign: "center", border: "1px solid #f0f0f0" }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: "#FEF6ED", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>{c.icon}</div>
              <p style={{ color: "#111", fontWeight: 700, fontSize: 14, margin: "0 0 10px" }}>{c.title}</p>
              {c.lines.map((l, j) => (
                <p key={j} style={{
                  color: l === "1644-1107" ? "#8B5E3C" : "#777",
                  margin: "0 0 3px", lineHeight: 1.6,
                  fontWeight: l === "1644-1107" ? 800 : 400,
                  fontSize: l === "1644-1107" ? 17 : 12,
                }}>{l}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 배송정보 */}
      <h4 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <Truck size={16} color="#8B5E3C" />配送情報
      </h4>
      <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 32, border: "1px solid #f0f0f0" }}>
        <table className="shipping-table">
          <tbody>
            <tr><td className="label-cell">配送業者</td><td>CJ大韓通運</td><td className="label-cell">基本送料</td><td>4,000円 (40,000円以上で無料、離島・山間部は追加)</td></tr>
            <tr><td className="label-cell">送り状番号</td><td colSpan={3}>発送後に個別にご案内</td></tr>
            <tr><td className="label-cell">同梱配送</td><td colSpan={3}>可能</td></tr>
            <tr>
              <td className="label-cell">配送期間</td>
              <td colSpan={3} style={{ lineHeight: 1.9 }}>
                ご注文完了後、平均1~3日以内に発送 (営業日基準)<br />
                離島・山間部は3~5日ほど追加でかかる場合があります。
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 교환 및 환불안내 */}
      <h4 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <Shield size={16} color="#8B5E3C" />交換・返金のご案内
      </h4>
      <div style={{ background: "#fafafa", borderRadius: 14, padding: "20px 22px", fontSize: 13, color: "#555", lineHeight: 2, border: "1px solid #f0f0f0" }}>
        {[
          "交換・返品に関する一般的な事項は、関係法令が優先されます。",
          "販売者の提示事項が関係法令よりも消費者に有利な場合は、販売者の提示事項が適用されます。",
          "交換・返金をご希望の場合は、お客様サポートセンターまでお問い合わせください。",
          "お客様都合(イメージ違いなど)での交換・返品の場合、往復送料をご負担いただきます。",
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#8B5E3C", fontWeight: 700, marginTop: 2, flexShrink: 0 }}>·</span>
            <span>{t}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, padding: "14px 16px", background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#8B5E3C", fontWeight: 700, flexShrink: 0 }}>·</span>
            <span>表示・広告内容または契約内容と異なる場合は、交換・返金が可能です</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#8B5E3C", fontWeight: 700, flexShrink: 0 }}>·</span>
            <span>商品受領後30日以内、または事実を知った日から30日以内であれば申込みの撤回が可能です</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 리뷰 섹션 ── */
function ReviewStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={size} fill={s <= rating ? "#FFB800" : "none"} color={s <= rating ? "#FFB800" : "#e0e0e0"} />)}
    </span>
  );
}

function ReviewSection({ avg, count, itemId }: { avg: number; count: number; itemId: string }) {
  const fullStars = Math.round(avg);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showWrite, setShowWrite] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  useEffect(() => {
    fetch(`/api/shop/reviews?it_id=${itemId}&limit=20`).then(r => r.json())
      .then(d => setReviews(Array.isArray(d) ? d : [])).catch(() => {});
  }, [itemId]);

  const submitReview = async () => {
    const token = localStorage.getItem("seoulmono_token");
    if (!token) { setSubmitMsg("ログイン後にレビューを投稿できます。"); return; }
    if (!content.trim()) { setSubmitMsg("内容を入力してください。"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/shop/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ it_id: itemId, wr_content: content, wr_rating: rating }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitMsg(data.error || "エラーが発生しました。"); return; }
      setSubmitMsg("レビューを登録しました!");
      setContent(""); setShowWrite(false);
      const newRes = await fetch(`/api/shop/reviews?it_id=${itemId}&limit=20`).then(r => r.json());
      setReviews(Array.isArray(newRes) ? newRes : []);
    } catch { setSubmitMsg("エラーが発生しました。"); } finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* 별점 요약 */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: "28px 24px", marginBottom: 24,
        display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0",
      }}>
        <div style={{ textAlign: "center", minWidth: 90 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: "#111", lineHeight: 1, letterSpacing: -2 }}>{avg > 0 ? avg.toFixed(1) : "0.0"}</div>
          <div style={{ display: "flex", gap: 2, justifyContent: "center", margin: "10px 0 6px" }}>
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill={i < fullStars ? "#FFB800" : "none"} color={i < fullStars ? "#FFB800" : "#e0e0e0"} />)}
          </div>
          <div style={{ fontSize: 12, color: "#bbb" }}>全{count}件</div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          {[5, 4, 3, 2, 1].map(n => {
            const cnt = reviews.filter(r => Math.round(Number(r.wr_rating) || r.rating || 0) === n).length;
            const pct = reviews.length > 0 ? Math.round((cnt / reviews.length) * 100) : 0;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#aaa", width: 10, textAlign: "right" }}>{n}</span>
                <Star size={10} fill="#FFB800" color="#FFB800" />
                <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #FFB800, #FFD060)", borderRadius: 3, transition: "width 0.4s" }} />
                </div>
                <span style={{ fontSize: 11, color: "#ccc", width: 20, textAlign: "right" }}>{cnt}</span>
              </div>
            );
          })}
        </div>
        <button data-write onClick={() => { setShowWrite(!showWrite); setSubmitMsg(""); }}
          style={{
            padding: "12px 22px", background: showWrite ? "#f5f5f5" : "#8B5E3C",
            color: showWrite ? "#888" : "#fff", border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: showWrite ? "none" : "0 4px 12px rgba(29,138,90,0.25)",
          }}>
          {showWrite ? "閉じる" : "レビューを書く"}
        </button>
      </div>

      {/* 리뷰 작성 폼 */}
      {showWrite && (
        <div style={{
          background: "#fff", borderRadius: 16, padding: "24px", marginBottom: 24,
          border: "2px solid #8B5E3C", boxShadow: "0 4px 20px rgba(29,138,90,0.1)",
        }}>
          <p style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>レビュー投稿</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "#666" }}>評価</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 28, lineHeight: 1, color: s <= rating ? "#FFB800" : "#e0e0e0", transition: "color 0.15s" }}>★</button>
              ))}
            </div>
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="商品のご感想をお寄せください..."
            style={{ width: "100%", minHeight: 110, border: "1.5px solid #e8e8e8", borderRadius: 10, padding: "12px 14px", fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.7 }} />
          {submitMsg && (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: submitMsg.includes("登録") ? "#8B5E3C" : "#e53935", fontWeight: 600 }}>{submitMsg}</p>
          )}
          <button onClick={submitReview} disabled={submitting}
            style={{ marginTop: 12, padding: "11px 28px", background: "#8B5E3C", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(29,138,90,0.25)" }}>
            {submitting ? "登録中..." : "レビューを登録"}
          </button>
        </div>
      )}

      {/* 리뷰 목록 */}
      {reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}>
          <div style={{ width: 60, height: 60, background: "#f5f5f5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Star size={28} color="#ddd" />
          </div>
          <p style={{ margin: "0 0 6px", fontSize: 14, color: "#bbb" }}>まだレビューがありません。</p>
          <p style={{ margin: 0, fontSize: 12, color: "#ccc" }}>最初のレビューを書いてみましょう!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((r: any, i: number) => {
            const initials = (r.mb_name || r.wr_name || "匿名").charAt(0);
            return (
              <div key={r.wr_id || i} style={{
                background: "#fff", borderRadius: 14, padding: "20px 22px",
                border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #8B5E3C, #22a06b)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{r.mb_name || r.wr_name || "匿名"}</span>
                      <ReviewStars rating={Math.round(Number(r.wr_rating) || r.rating || 0)} size={12} />
                    </div>
                    <span style={{ fontSize: 11, color: "#ccc" }}>{r.wr_datetime ? new Date(r.wr_datetime).toLocaleDateString("ja-JP") : ""}</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "#444", lineHeight: 1.7 }}>{r.wr_content || r.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Q&A 섹션 ── */
function QnaSection({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;
    setSubmitted(true);
    setOpen(false);
    setSubject("");
    setContent("");
  };

  return (
    <div>
      {/* 안내 + 버튼 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 7, alignItems: "center", color: "#bbb", fontSize: 13 }}>
          <AlertCircle size={14} color="#ccc" />
          <span>ログイン後に商品へのお問い合わせができます。</span>
        </div>
        <button onClick={() => setOpen(!open)}
          style={{
            padding: "11px 22px", background: open ? "#f5f5f5" : "#8B5E3C",
            color: open ? "#888" : "#fff", border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
            boxShadow: open ? "none" : "0 4px 12px rgba(29,138,90,0.25)",
          }}>
          <Send size={13} />お問い合わせ
        </button>
      </div>

      {/* 문의 작성 폼 */}
      {open && (
        <form onSubmit={handleSubmit} style={{
          border: "2px solid #8B5E3C", borderRadius: 16, padding: "24px",
          marginBottom: 24, background: "#fff", boxShadow: "0 4px 20px rgba(29,138,90,0.1)",
        }}>
          <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 15, color: "#111" }}>商品へのお問い合わせ</p>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="件名を入力してください"
            style={{ width: "100%", border: "1.5px solid #e8e8e8", borderRadius: 10, padding: "11px 14px", fontSize: 14, marginBottom: 10, boxSizing: "border-box", outline: "none" }} />
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="お問い合わせ内容を詳しく入力してください&#10;(商品に関するお問い合わせのみお願いします。個人情報は含めないでください。)"
            rows={5}
            style={{ width: "100%", border: "1.5px solid #e8e8e8", borderRadius: 10, padding: "11px 14px", fontSize: 13, resize: "vertical", boxSizing: "border-box", lineHeight: 1.7, outline: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#666", cursor: "pointer" }}>
              <input type="checkbox" checked={isSecret} onChange={e => setIsSecret(e.target.checked)} style={{ accentColor: "#8B5E3C", width: 15, height: 15 }} />
              <Lock size={12} color="#aaa" />非公開で登録
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setOpen(false)}
                style={{ padding: "10px 20px", border: "1.5px solid #e8e8e8", borderRadius: 10, background: "#fff", fontSize: 13, cursor: "pointer", color: "#777" }}>キャンセル</button>
              <button type="submit"
                style={{ padding: "10px 24px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>登録する</button>
            </div>
          </div>
        </form>
      )}

      {submitted && (
        <div style={{ padding: "16px 20px", background: "#FEF6ED", border: "1px solid #c2e8d5", borderRadius: 12, marginBottom: 20, fontSize: 13, color: "#8B5E3C", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={16} />お問い合わせを受け付けました。営業日基準で1~2日以内にご回答いたします。
        </div>
      )}

      {/* 빈 상태 */}
      <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>
        <div style={{ width: 60, height: 60, background: "#f5f5f5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <MessageCircle size={28} color="#ddd" />
        </div>
        <p style={{ margin: "0 0 6px", fontSize: 14, color: "#bbb" }}>商品へのお問い合わせはまだありません。</p>
        <p style={{ margin: 0, fontSize: 12, color: "#ccc" }}>ご不明な点はお問い合わせボタンからお寄せください。</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 28px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ display: "inline-block", width: 4, height: 20, background: "#8B5E3C", borderRadius: 2, flexShrink: 0 }} />
      {children}
    </h3>
  );
}

function EmptyBox({ text }: { text: string }) {
  return <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc", fontSize: 14 }}>{text}</div>;
}

function RelatedSlider({ title, items }: { title: string; items: ShopItem[] }) {
  const [, navigate] = useLocation();
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const didDrag = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true; didDrag.current = false;
    startX.current = e.pageX;
    scrollStart.current = trackRef.current?.scrollLeft ?? 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    const dx = e.pageX - startX.current;
    if (Math.abs(dx) > 4) didDrag.current = true;
    trackRef.current.scrollLeft = scrollStart.current - dx;
  };
  const onMouseUp = () => { isDragging.current = false; };

  return (
    <div style={{ paddingTop: 40, paddingBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-block", width: 4, height: 20, background: "#8B5E3C", borderRadius: 2 }} />
          {title}
        </h3>
        <button
          onClick={() => navigate(`/list?ca_id=${items[0]?.ca_id || ""}`)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#999", display: "flex", alignItems: "center", gap: 2 }}
        >
          もっと見る <span style={{ fontSize: 15 }}>›</span>
        </button>
      </div>
      <div
        ref={trackRef}
        style={{ overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab", userSelect: "none" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div style={{ display: "flex", gap: 12, width: "max-content", paddingBottom: 4 }}>
          {items.map(p => (
            <div
              key={p.it_id}
              style={{ width: "clamp(140px, 22vw, 200px)", flexShrink: 0, cursor: "pointer" }}
              onClick={() => { if (!didDrag.current) navigate(`/item/${p.it_id}`); }}
            >
              <div style={{ aspectRatio: "1/1", borderRadius: 12, overflow: "hidden", background: "#e8e8e8", marginBottom: 8 }}>
                <img
                  src={getImageUrl(p.it_img1)}
                  alt={p.it_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <p style={{ margin: "0 0 3px", fontSize: 12.5, color: "#333", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.it_name}</p>
              {p.it_cust_price > 0 && p.it_cust_price < p.it_price && (
                <p style={{ margin: "0 0 1px", fontSize: 11, color: "#bbb", textDecoration: "line-through" }}>{p.it_price.toLocaleString()}円</p>
              )}
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#1e9e5e" }}>
                {(p.it_cust_price > 0 ? p.it_cust_price : p.it_price).toLocaleString()}円
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`.related-track::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "13px 20px", borderBottom: "1px solid #f7f7f7", alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, color: "#aaa", fontWeight: 600, width: 64, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <div style={{ flex: 1, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div style={{ background: "#fafafa", minHeight: "100vh" }}>
      <div className="page-wrap" style={{ paddingTop: 24 }}>
        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ aspectRatio: "1/1", background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)", backgroundSize: "200% 100%", borderRadius: 16, animation: "shimmer 1.4s infinite" }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ height: 14, width: "40%", background: "#f0f0f0", borderRadius: 6 }} />
            <div style={{ height: 22, width: "85%", background: "#f0f0f0", borderRadius: 6 }} />
            <div style={{ height: 18, width: "70%", background: "#f0f0f0", borderRadius: 6 }} />
            <div style={{ height: 80, background: "#f0f0f0", borderRadius: 14, marginTop: 8 }} />
            <div style={{ height: 120, background: "#f0f0f0", borderRadius: 14 }} />
            <div style={{ height: 56, background: "#f0f0f0", borderRadius: 14, marginTop: 8 }} />
          </div>
        </div>
      </div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}
