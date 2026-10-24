import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, Gift, Package } from "lucide-react";
import { getCart, removeFromCart, updateCartQty, type CartItem } from "@/lib/cart";
import { getGiftCart, removeFromGiftCart, updateGiftCartQty, type GiftCartItem, GIFT_CART_EVENT } from "@/lib/gift-cart";
import { formatPrice, getImageUrl } from "@/lib/api";
import { setCheckoutItems } from "@/pages/Checkout";
import { calcShipping } from "@/lib/shipping";

function cartKey(c: CartItem) { return `${c.it_id}${c.option ? `_${c.option}` : ""}`; }


type Tab = "regular" | "gift";

export default function Cart() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("regular");

  // ── 일반 장바구니 ──────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>(() => getCart());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(getCart().map(cartKey)));

  const refreshCart = useCallback(() => {
    const c = getCart();
    setCart(c);
    setSelectedIds(prev => {
      const keys = new Set(c.map(cartKey));
      const next = new Set<string>();
      for (const k of prev) { if (keys.has(k)) next.add(k); }
      if (next.size === 0) keys.forEach(k => next.add(k));
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, [refreshCart]);

  const key = (c: CartItem) => `${c.it_id}${c.option ? `_${c.option}` : ""}`;
  const selectedItems = cart.filter(c => selectedIds.has(key(c)));
  const subtotal = selectedItems.reduce((sum, c) => sum + c.it_price * c.quantity, 0);
  const shipping = subtotal > 0 ? calcShipping(subtotal, "", "") : 0;
  const total = subtotal + shipping;

  const handleRemove = (c: CartItem) => { removeFromCart(c.it_id, c.option); refreshCart(); };
  const handleQty = (c: CartItem, qty: number) => { updateCartQty(c.it_id, qty, c.option); refreshCart(); };
  const handleOrder = () => {
    if (selectedItems.length === 0) return;
    setCheckoutItems(selectedItems);
    navigate("/checkout");
  };
  const toggleSelect = (k: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  };
  const toggleAll = () => {
    if (selectedIds.size === cart.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(cart.map(key)));
  };

  // ── 선물 장바구니 ──────────────────────────────────────────────────────────
  const [giftCart, setGiftCart] = useState<GiftCartItem[]>(() => getGiftCart());

  const refreshGift = useCallback(() => setGiftCart(getGiftCart()), []);

  useEffect(() => {
    window.addEventListener(GIFT_CART_EVENT, refreshGift);
    return () => window.removeEventListener(GIFT_CART_EVENT, refreshGift);
  }, [refreshGift]);

  const giftTotal = giftCart.reduce((s, c) => s + c.it_price * c.quantity, 0);

  // URL hash로 초기 탭 결정
  useEffect(() => {
    if (window.location.hash === "#gift") setTab("gift");
  }, []);

  const regularCount = cart.length;
  const giftCount = giftCart.length;

  // ── 공통 탭 헤더 ────────────────────────────────────────────────────────────
  const TabHeader = () => (
    <div style={{ display: "flex", border: "2px solid #f0f0f0", borderRadius: 14, padding: 4, marginBottom: 24, background: "#f8f8f8" }}>
      {[
        { id: "regular" as Tab, icon: <ShoppingCart size={16} />, label: "通常カート", count: regularCount },
        { id: "gift" as Tab, icon: <Gift size={16} />, label: "ギフトカート", count: giftCount },
      ].map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            height: 44, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700,
            transition: "all 0.2s",
            background: tab === t.id ? "#fff" : "transparent",
            color: tab === t.id ? "#8B5E3C" : "#888",
            boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
          }}
        >
          {t.icon} {t.label}
          {t.count > 0 && (
            <span style={{ background: tab === t.id ? "#8B5E3C" : "#ccc", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 900 }}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // ── 일반 장바구니 탭 ────────────────────────────────────────────────────────
  if (tab === "regular") {
    if (cart.length === 0) {
      return (
        <div className="page-wrap" style={{ paddingTop: 30, paddingBottom: 80 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>カート</h1>
          <TabHeader />
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <ShoppingCart size={56} color="#ddd" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, color: "#333", marginBottom: 8, fontWeight: 700 }}>通常カートは空です</h2>
            <p style={{ color: "#aaa", marginBottom: 28, fontSize: 14 }}>お気に入りの商品を入れてみましょう</p>
            <button onClick={() => navigate("/")} style={{ background: "#8B5E3C", border: "none", color: "#fff", padding: "13px 36px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              ショッピングを続ける
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="page-wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>カート</h1>
        <TabHeader />
        <div className="cart-layout" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: "2px solid #222", borderTop: "1px solid #eee" }}>
              <input type="checkbox" checked={selectedIds.size === cart.length && cart.length > 0} onChange={toggleAll} style={{ width: 16, height: 16, cursor: "pointer", marginRight: 10 }} />
              <span style={{ fontSize: 13, color: "#444" }}>すべて選択 ({selectedIds.size}/{cart.length})</span>
            </div>
            {cart.map(item => {
              const k = key(item);
              return (
                <div key={k} style={{ display: "flex", gap: 12, padding: "14px", borderBottom: "1px solid #eee", alignItems: "flex-start" }}>
                  <input type="checkbox" checked={selectedIds.has(k)} onChange={() => toggleSelect(k)} style={{ width: 16, height: 16, cursor: "pointer", marginTop: 2, flexShrink: 0 }} />
                  <div onClick={() => navigate(`/item/${item.it_id}`)} style={{ width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: "#f5f5f5", border: "1px solid #eee", flexShrink: 0, cursor: "pointer" }}>
                    {item.it_img1
                      ? <img src={item.it_img1} alt={item.it_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} loading="lazy" />
                      : <div style={{ width: "100%", height: "100%", background: "#eee" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p onClick={() => navigate(`/item/${item.it_id}`)} style={{ fontSize: 14, color: "#222", margin: "0 0 4px", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.it_name}</p>
                    {item.option && <p style={{ fontSize: 12, color: "#999", margin: "0 0 8px" }}>オプション: {item.option}</p>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
                        <button onClick={() => handleQty(item, item.quantity - 1)} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", border: "none", cursor: "pointer" }}><Minus size={12} /></button>
                        <span style={{ width: 32, textAlign: "center", fontSize: 13, fontWeight: 600 }}>{item.quantity}</span>
                        <button onClick={() => handleQty(item, item.quantity + 1)} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", border: "none", cursor: "pointer" }}><Plus size={12} /></button>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{formatPrice(item.it_price * item.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(item)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 4, flexShrink: 0 }}><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
          <div className="cart-summary" style={{ width: 300, flexShrink: 0, position: "sticky", top: 90 }}>
            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px" }}>ご注文内容</h3>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: "#777" }}>商品金額</span><span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: "#777" }}>送料</span>
                <span style={{ fontWeight: 600, color: shipping === 0 && subtotal > 0 ? "#8B5E3C" : "#333" }}>
                  {subtotal === 0 ? "-" : shipping === 0 ? "無料" : formatPrice(shipping)}
                </span>
              </div>
              {subtotal > 0 && subtotal < 40000 && (
                <div style={{ background: "#F2E4D0", borderRadius: 8, padding: "9px 12px", marginBottom: 12, fontSize: 12, color: "#8B5E3C" }}>
                  {formatPrice(40000 - subtotal)} 追加で送料無料!
                </div>
              )}
              {subtotal > 0 && (
                <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "8px 12px", marginBottom: 4, fontSize: 11, color: "#888", lineHeight: 1.6 }}>
                  済州島 +3,000円 · 離島・山間部 +5,000円 追加
                </div>
              )}
              <div style={{ borderTop: "1px solid #eee", paddingTop: 14, marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700 }}>
                <span>お支払い合計</span><span style={{ color: "#8B5E3C" }}>{formatPrice(total)}</span>
              </div>
              <button onClick={handleOrder} disabled={selectedIds.size === 0} style={{ width: "100%", height: 50, background: "#8B5E3C", border: "none", borderRadius: 10, color: "#fff", fontSize: 16, fontWeight: 700, cursor: selectedIds.size === 0 ? "not-allowed" : "pointer", marginTop: 18, opacity: selectedIds.size === 0 ? 0.5 : 1 }}>
                注文する
              </button>
              <button onClick={() => navigate("/")} style={{ width: "100%", height: 44, background: "none", border: "1px solid #ddd", borderRadius: 10, color: "#555", fontSize: 13, cursor: "pointer", marginTop: 10 }}>ショッピングを続ける</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 선물 장바구니 탭 ────────────────────────────────────────────────────────
  return (
    <div className="page-wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>カート</h1>
      <TabHeader />

      {giftCart.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <Gift size={56} color="#ddd" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, color: "#333", marginBottom: 8, fontWeight: 700 }}>ギフトカートは空です</h2>
          <p style={{ color: "#aaa", marginBottom: 28, fontSize: 14 }}>ギフトにする商品をお選びください</p>
          <button onClick={() => navigate("/gift/custom")} style={{ background: "#8B5E3C", border: "none", color: "#fff", padding: "13px 36px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginRight: 10 }}>
            商品を選ぶ
          </button>
          <button onClick={() => navigate("/gift")} style={{ background: "none", border: "1.5px solid #8B5E3C", color: "#8B5E3C", padding: "13px 36px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            ギフトパッケージを見る
          </button>
        </div>
      ) : (
        <div className="cart-layout" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div style={{ padding: "10px 14px", borderBottom: "2px solid #8B5E3C", borderTop: "1px solid #eee", display: "flex", alignItems: "center", gap: 8 }}>
              <Gift size={15} color="#8B5E3C" />
              <span style={{ fontSize: 13, color: "#8B5E3C", fontWeight: 700 }}>ギフト構成商品 ({giftCart.length}点)</span>
            </div>
            {giftCart.map(item => (
              <div key={item.it_id} style={{ display: "flex", gap: 12, padding: "14px", borderBottom: "1px solid #eee", alignItems: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: "#f5f5f5", border: "1px solid #eee", flexShrink: 0 }}>
                  <img src={getImageUrl(item.it_img1)} alt={item.it_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} loading="lazy" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, color: "#222", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.it_name}</p>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#8B5E3C" }}>{item.it_price > 0 ? formatPrice(item.it_price * item.quantity) : "-"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
                  <button onClick={() => { const next = item.quantity - 1; if (next <= 0) removeFromGiftCart(item.it_id); else updateGiftCartQty(item.it_id, next); }} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", border: "none", cursor: "pointer" }}><Minus size={12} /></button>
                  <span style={{ width: 32, textAlign: "center", fontSize: 13, fontWeight: 600 }}>{item.quantity}</span>
                  <button onClick={() => updateGiftCartQty(item.it_id, item.quantity + 1)} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", border: "none", cursor: "pointer" }}><Plus size={12} /></button>
                </div>
                <button onClick={() => removeFromGiftCart(item.it_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 4, flexShrink: 0 }}><Trash2 size={16} /></button>
              </div>
            ))}
            <button onClick={() => navigate("/gift/custom")} style={{ margin: "16px", background: "none", border: "1.5px dashed #d0d0d0", borderRadius: 10, padding: "12px", width: "calc(100% - 32px)", fontSize: 13, color: "#999", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Plus size={14} /> 商品を追加する
            </button>
          </div>
          <div className="cart-summary" style={{ width: 300, flexShrink: 0, position: "sticky", top: 90 }}>
            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}><Gift size={16} color="#8B5E3C" /> ギフト内容</h3>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: "#777" }}>構成商品 ({giftCart.length}点)</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(giftTotal)}</span>
              </div>
              <div style={{ background: "#f0f9f4", borderRadius: 8, padding: "9px 12px", marginBottom: 16, fontSize: 12, color: "#8B5E3C", lineHeight: 1.6 }}>
                📦 送料は受取人様の住所入力後に確定します
              </div>
              <div style={{ borderTop: "1px solid #eee", paddingTop: 14, marginTop: 0, display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700 }}>
                <span>商品金額</span><span style={{ color: "#8B5E3C" }}>{formatPrice(giftTotal)}</span>
              </div>
              <button onClick={() => navigate("/gift/cart")} style={{ width: "100%", height: 50, background: "linear-gradient(135deg,#8B5E3C,#25a870)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Gift size={16} /> ギフトリンクを作る
              </button>
              <button onClick={() => navigate("/gift/custom")} style={{ width: "100%", height: 44, background: "none", border: "1px solid #ddd", borderRadius: 10, color: "#555", fontSize: 13, cursor: "pointer", marginTop: 10 }}>商品をもっと選ぶ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
