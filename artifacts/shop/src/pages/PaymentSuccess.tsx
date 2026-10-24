import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, Package, MapPin, CreditCard, Banknote, Building2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatPrice } from "@/lib/api";

const TOKEN_KEY = "seoulmono_token";
const CHECKOUT_KEY = "seoulmono_checkout";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderResult, setOrderResult] = useState<any>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pg = params.get("pg");

    if (pg === "stripe") {
      const pendingId = params.get("pending_id");
      const sessionId = params.get("session_id");

      if (!pendingId) {
        setError("決済情報が正しくありません。");
        setLoading(false);
        return;
      }

      let cd: any = null;
      try { cd = JSON.parse(sessionStorage.getItem("stripe_checkout_data") || ""); }
      catch {}

      if (!cd) {
        setError("注文情報が見つかりません。すでに処理済みの決済か、セッションの有効期限が切れています。");
        setLoading(false);
        return;
      }

      setCheckoutData(cd);

      const token = cd.token || localStorage.getItem(TOKEN_KEY);

      fetch("/api/shop/stripe/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pending_id: pendingId, session_id: sessionId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.error) { setError(data.error); return; }
          setOrderResult(data);
          sessionStorage.removeItem("stripe_checkout_data");
          sessionStorage.removeItem(CHECKOUT_KEY);
        })
        .catch(() => setError("注文処理中にエラーが発生しました。"))
        .finally(() => setLoading(false));
      return;
    }

    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setError("決済情報が正しくありません。");
      setLoading(false);
      return;
    }

    let cd: any = null;
    try { cd = JSON.parse(sessionStorage.getItem("toss_checkout_data") || ""); }
    catch {}

    if (!cd) {
      setError("注文情報が見つかりません。すでに処理済みの決済か、セッションの有効期限が切れています。");
      setLoading(false);
      return;
    }

    setCheckoutData(cd);

    const token = cd.token || localStorage.getItem(TOKEN_KEY);

    fetch("/api/shop/toss/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
        items: cd.items.map((i: any) => ({
          it_id: i.it_id,
          qty: i.quantity,
          option: i.option,
          option_price: i.option_price,
        })),
        name: cd.name,
        phone: cd.phone,
        email: cd.email,
        postcode: cd.postcode,
        addr1: cd.addr1,
        addr2: cd.addr2,
        memo: cd.memo,
        coupon_no: cd.coupon_no,
        point_use: cd.point_use,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setOrderResult(data);
        sessionStorage.removeItem("toss_checkout_data");
        sessionStorage.removeItem(CHECKOUT_KEY);
      })
      .catch(() => setError("注文処理中にエラーが発生しました。"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div className="toss-spinner" />
            <p style={{ color: "#666", marginTop: 16 }}>決済を処理しています...</p>
          </div>
        </div>
        <Footer />
        <style>{`
          .toss-spinner {
            width: 48px; height: 48px;
            border: 4px solid #ddd;
            border-top-color: #8B5E3C;
            border-radius: 50%;
            animation: tossSpin 0.8s linear infinite;
            margin: 0 auto;
          }
          @keyframes tossSpin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <XCircle size={56} color="#e53935" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>決済処理エラー</h2>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 1.6 }}>{error}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => navigate("/checkout")}
                style={{ height: 48, padding: "0 24px", background: "#8B5E3C", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                注文ページへ
              </button>
              <button onClick={() => navigate("/")}
                style={{ height: 48, padding: "0 24px", background: "#fff", border: "1px solid #ddd", borderRadius: 12, color: "#555", fontSize: 15, cursor: "pointer" }}>
                ホームへ
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!orderResult || !checkoutData) return null;

  const DoneSection = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 12, border: "1px solid #eee", textAlign: "left" }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: "#222", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>{icon}{title}</p>
      {children}
    </div>
  );

  const DoneRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7, alignItems: "flex-start" }}>
      <span style={{ color: "#888", flexShrink: 0, minWidth: 70 }}>{label}</span>
      <span style={{ color: "#333", textAlign: "right", wordBreak: "break-word" }}>{value || "-"}</span>
    </div>
  );

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 80px" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "32px 24px", textAlign: "center", border: "1px solid #eee", marginBottom: 12 }}>
          <CheckCircle size={52} color="#8B5E3C" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>ご注文が完了しました!</h2>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            注文番号: <strong style={{ color: "#8B5E3C", fontFamily: "monospace" }}>{orderResult.od_id}</strong>
          </p>
        </div>

        <DoneSection title="ご注文商品" icon={<Package size={15} />}>
          {checkoutData.items.map((item: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < checkoutData.items.length - 1 ? 12 : 0, paddingBottom: i < checkoutData.items.length - 1 ? 12 : 0, borderBottom: i < checkoutData.items.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", background: "#f5f5f5", border: "1px solid #eee", flexShrink: 0 }}>
                {item.it_img1 && <img src={item.it_img1} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, color: "#222", fontWeight: 600 }}>{item.it_name}</p>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>商品番号: {item.it_id}</p>
                {item.option && <p style={{ margin: "0 0 2px", fontSize: 12, color: "#aaa" }}>オプション: {item.option}</p>}
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{item.quantity}点 · {formatPrice((item.it_price + (item.option_price || 0)) * item.quantity)}</p>
              </div>
            </div>
          ))}
        </DoneSection>

        <DoneSection title="お届け先情報" icon={<MapPin size={15} />}>
          <DoneRow label="お受け取り人" value={checkoutData.name} />
          <DoneRow label="ご連絡先" value={checkoutData.phone} />
          <DoneRow label="ご住所" value={<>{checkoutData.postcode && <span style={{ fontSize: 12, background: "#f0f9f4", color: "#8B5E3C", borderRadius: 4, padding: "1px 6px", marginRight: 6 }}>{checkoutData.postcode}</span>}{checkoutData.addr1} {checkoutData.addr2}</>} />
          {checkoutData.memo && <DoneRow label="配送メモ" value={checkoutData.memo} />}
        </DoneSection>

        <DoneSection title="お支払い金額" icon={<Banknote size={15} />}>
          <DoneRow label="商品金額" value={formatPrice(orderResult.od_cart_price)} />
          {orderResult.coupon_discount > 0 && <DoneRow label="クーポン割引" value={<span style={{ color: "#e53935" }}>-{formatPrice(orderResult.coupon_discount)}</span>} />}
          {orderResult.point_use > 0 && <DoneRow label="ポイント利用" value={<span style={{ color: "#e53935" }}>-{formatPrice(orderResult.point_use)}</span>} />}
          <DoneRow label="送料" value={orderResult.od_send_cost === 0 ? <span style={{ color: "#8B5E3C" }}>無料</span> : formatPrice(orderResult.od_send_cost)} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, borderTop: "1px solid #eee", paddingTop: 10, marginTop: 6 }}>
            <span>お支払い合計</span>
            <span style={{ color: "#8B5E3C" }}>{formatPrice(orderResult.od_receipt_price)}</span>
          </div>
        </DoneSection>

        <div style={{ background: "#f0f9f4", border: "1.5px solid #b8e6cc", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#8B5E3C", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
            <CreditCard size={15} /> {new URLSearchParams(window.location.search).get("pg") === "stripe" ? "Stripeカード決済完了" : "TossPaymentsカード決済完了"}
          </p>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>決済は正常に処理されました。</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {checkoutData.token && (
            <button onClick={() => navigate("/mypage")}
              style={{ height: 50, background: "#8B5E3C", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              注文履歴を確認
            </button>
          )}
          <button onClick={() => navigate("/")}
            style={{ height: 46, background: "#fff", border: "1px solid #ddd", borderRadius: 12, color: "#555", fontSize: 14, cursor: "pointer" }}>
            ショッピングを続ける
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
