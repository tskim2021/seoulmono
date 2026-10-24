import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Package, CreditCard, CheckCircle, MapPin, ChevronDown, Plus, Building2, Banknote, Search, Tag, Award, X, ChevronRight, User, Phone } from "lucide-react";
import { formatPrice } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { calcShipping, detectRegion, getRegionLabel, getRegionColor, getFreeThreshold } from "@/lib/shipping";

const TOKEN_KEY = "seoulmono_token";
const CHECKOUT_KEY = "seoulmono_checkout";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface CheckoutItem {
  it_id: string;
  it_name: string;
  it_price: number;
  it_img1: string;
  quantity: number;
  option?: string;
  option_price?: number;
}

export function setCheckoutItems(items: CheckoutItem[]) {
  sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(items));
}

function getCheckoutItems(): CheckoutItem[] {
  try { return JSON.parse(sessionStorage.getItem(CHECKOUT_KEY) || "[]"); }
  catch { return []; }
}

interface SavedAddress {
  ma_id: number; ma_name: string; ma_hp: string;
  ma_zip1: string; ma_zip2: string; ma_addr1: string; ma_addr2: string; ma_addr3: string;
  ma_default: boolean;
}

interface PaymentSettings {
  bank_enabled: boolean; card_enabled: boolean;
}

interface KcpConfig {
  enabled: boolean;
  site_cd: string;
  pc_script: string;
  mode: "test" | "live";
}

interface StripeConfig {
  enabled: boolean;
  publishable_key: string;
  currency: string;
}

type Step = "form" | "done";
type PayMethod = "bank" | "card" | "stripe" | null;

interface BankInfo { bank_name: string; bank_num: string; bank_holder: string; bank_memo: string; }

function authFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("form");
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderResult, setOrderResult] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddrPicker, setShowAddrPicker] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>(null);
  const [paySettings, setPaySettings] = useState<PaymentSettings>({
    bank_enabled: true, card_enabled: false,
  });
  const [bankInfo, setBankInfo] = useState<BankInfo>({ bank_name: "", bank_num: "", bank_holder: "", bank_memo: "" });
  const isGuest = !localStorage.getItem(TOKEN_KEY) || new URLSearchParams(window.location.search).has("guest");

  const [form, setForm] = useState({
    name: "", nameKana: "", phone: "", email: "",
    postcode: "", addr1: "", addr2: "", memo: "",
  });
  const [nameParts, setNameParts] = useState({ lastName: "", firstName: "", lastNameKana: "", firstNameKana: "" });
  const setNamePart = (k: keyof typeof nameParts) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...nameParts, [k]: e.target.value };
    setNameParts(next);
    setForm(f => ({
      ...f,
      name: `${next.lastName}${next.firstName}`,
      nameKana: `${next.lastNameKana} ${next.firstNameKana}`.trim(),
    }));
  };
  const [postcodeLookupError, setPostcodeLookupError] = useState("");
  const [postcodeLoading, setPostcodeLoading] = useState(false);

  interface CouponItem { cp_no: number; cp_name: string; cp_price: number; cp_minimum: number; cp_maximum: number; }
  const [availableCoupons, setAvailableCoupons] = useState<CouponItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
  const [showCouponPicker, setShowCouponPicker] = useState(false);
  const [myPoints, setMyPoints] = useState(0);
  const [pointInput, setPointInput] = useState("");
  const [pointUse, setPointUse] = useState(0);
  const [mbId, setMbId] = useState("");
  const [kcpConfig, setKcpConfig] = useState<KcpConfig | null>(null);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);

  useEffect(() => {
    const loaded = getCheckoutItems();
    if (loaded.length === 0) { navigate("/"); return; }

    // 비로그인 → 로그인 페이지로 이동 (비회원 구매는 ?guest 파라미터로 허용)
    const token = localStorage.getItem(TOKEN_KEY);
    const guestMode = new URLSearchParams(window.location.search).has("guest");
    if (!token && !guestMode) { navigate("/login"); return; }

    setItems(loaded);

    const kcpParams = new URLSearchParams(window.location.search);
    if (kcpParams.get("kcp") === "fail") {
      setError(kcpParams.get("message") || "KCP決済に失敗しました。");
    }
    if (kcpParams.get("stripe") === "cancel") {
      setError("Stripe決済がキャンセルされました。");
    }

    fetch("/api/settings/payment")
      .then(r => r.json())
      .then((s: PaymentSettings) => { setPaySettings(s); })
      .catch(() => {});

    fetch("/api/shop/kcp/config")
      .then(r => r.json())
      .then((c: KcpConfig) => {
        setKcpConfig(c);
        // KCP 결제창 스크립트는 내부적으로 jQuery 등 여러 스크립트를 비동기로 추가 로드하므로,
        // 결제 버튼을 누른 시점이 아니라 미리 로드해 두어 타이밍 문제를 방지한다.
        if (c.enabled && !(window as any).KCP_Pay_Execute_Web && !document.querySelector(`script[src="${c.pc_script}"]`)) {
          const script = document.createElement("script");
          script.src = c.pc_script;
          document.head.appendChild(script);
        }
      })
      .catch(() => {});

    fetch("/api/shop/stripe/config")
      .then(r => r.json())
      .then((c: StripeConfig) => setStripeConfig(c))
      .catch(() => {});

    fetch("/api/shop/footer-config", { cache: "no-store" })
      .then(r => r.json())
      .then((d: any) => {
        setBankInfo({ bank_name: d.bank_name || "", bank_num: d.bank_num || "", bank_holder: d.bank_holder || "", bank_memo: d.bank_memo || "" });
      })
      .catch(() => {});

    const meToken = localStorage.getItem(TOKEN_KEY);
    if (meToken) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${meToken}` } })
        .then(r => r.ok ? r.json() : null)
        .then(u => { if (u) { setForm(f => ({ ...f, name: u.mb_name || "", phone: u.mb_hp || "", email: u.mb_email || "" })); setMbId(u.mb_id || ""); } })
        .catch(() => {});
      authFetch("/api/shop/addresses").then(r => r.json()).then(d => {
        const addrs: SavedAddress[] = d.addresses || [];
        setSavedAddresses(addrs);
        const def = addrs.find(a => a.ma_default) || addrs[0];
        if (def) setForm(f => ({ ...f, postcode: def.ma_zip1 || "", addr1: def.ma_addr1 || "", addr2: [def.ma_addr2, def.ma_addr3].filter(Boolean).join(" ") }));
      }).catch(() => {});
      authFetch("/api/shop/points-history").then(r => r.json())
        .then(d => setMyPoints(d.balance || 0)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const sub = items.reduce((s, i) => s + i.it_price * i.quantity, 0);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    authFetch(`/api/shop/available-coupons?amount=${sub}`)
      .then(r => r.json()).then(d => setAvailableCoupons(d.coupons || [])).catch(() => {});
  }, [items]);

  const subtotal = items.reduce((s, i) => s + i.it_price * i.quantity, 0);
  const shipping = subtotal > 0 ? calcShipping(subtotal, form.postcode, form.addr1) : 0;
  const shippingRegion = detectRegion(form.postcode, form.addr1);
  const regionLabel = getRegionLabel(shippingRegion);
  const regionColor = getRegionColor(shippingRegion);
  const freeThreshold = getFreeThreshold(shippingRegion);
  const couponDiscount = selectedCoupon ? Math.min(selectedCoupon.cp_price, subtotal) : 0;
  const total = Math.max(0, subtotal + shipping - couponDiscount - pointUse);

  const applyPoint = () => {
    const p = Math.max(0, Math.min(Number(pointInput) || 0, myPoints, subtotal - couponDiscount));
    setPointUse(p);
    setPointInput(String(p));
  };
  const useAllPoints = () => {
    const p = Math.min(myPoints, Math.max(0, subtotal - couponDiscount));
    setPointUse(p);
    setPointInput(String(p));
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const applyAddress = (addr: SavedAddress) => {
    setForm(f => ({ ...f, postcode: addr.ma_zip1 || "", addr1: addr.ma_addr1 || "", addr2: [addr.ma_addr2, addr.ma_addr3].filter(Boolean).join(" ") }));
    setShowAddrPicker(false);
  };

  const validate = () => {
    if (!form.name || !form.phone || !form.addr1) { setError("お受け取り人、ご連絡先、ご住所をすべて入力してください"); return false; }
    if (!form.nameKana.trim()) { setError("フリガナを入力してください"); return false; }
    if (!/^[゠-ヿー　\s]+$/.test(form.nameKana.trim())) { setError("フリガナは全角カタカナで入力してください"); return false; }
    return true;
  };

  const buildMemo = () => {
    const parts = [];
    if (form.nameKana.trim()) parts.push(`フリガナ: ${form.nameKana.trim()}`);
    if (form.memo.trim()) parts.push(form.memo.trim());
    return parts.join("\n");
  };

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
    const formatted = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
    setForm(f => ({ ...f, postcode: formatted }));
    setPostcodeLookupError("");
    if (digits.length === 7) {
      setPostcodeLoading(true);
      fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`)
        .then(r => r.json())
        .then(data => {
          const result = data.results?.[0];
          if (result) {
            setForm(f => ({ ...f, addr1: `${result.address1}${result.address2}${result.address3}` }));
          } else {
            setPostcodeLookupError("郵便番号に該当する住所が見つかりませんでした。手入力してください。");
          }
        })
        .catch(() => setPostcodeLookupError("住所の自動取得に失敗しました。手入力してください。"))
        .finally(() => setPostcodeLoading(false));
    }
  };

  const submitBankOrder = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      let res: Response;
      if (isGuest) {
        res = await fetch("/api/shop/guest-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(i => ({ it_id: i.it_id, qty: i.quantity, option: i.option, option_price: i.option_price })),
            name: form.name, phone: form.phone, email: form.email,
            postcode: form.postcode, addr1: form.addr1, addr2: form.addr2, memo: buildMemo(),
          }),
        });
      } else {
        res = await authFetch("/api/shop/orders", {
          method: "POST",
          body: JSON.stringify({
            items: items.map(i => ({ it_id: i.it_id, qty: i.quantity, option: i.option, option_price: i.option_price })),
            name: form.name, phone: form.phone, email: form.email,
            postcode: form.postcode, addr1: form.addr1, addr2: form.addr2, memo: buildMemo(),
            payment_method: "bank",
            coupon_no: selectedCoupon?.cp_no || null,
            point_use: pointUse,
          }),
        });
      }
      let data: any = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) { setError(data.error || `注文に失敗しました (${res.status})`); return; }
      setOrderResult(data); sessionStorage.removeItem(CHECKOUT_KEY); setStep("done");
      (window as any).ReactNativeWebView?.postMessage(JSON.stringify({ type: "order_complete", od_id: data?.od_id }));
    } catch (e: any) { setError(e?.message || "注文リクエストに失敗しました"); } finally { setLoading(false); }
  };

  const submitCardOrder = async () => {
    if (!validate()) return;
    if (!kcpConfig?.enabled) { setError("カード決済をご利用いただけません。"); return; }
    setLoading(true); setError("");
    try {
      const orderName = items[0].it_name + (items.length > 1 ? ` 他${items.length - 1}点` : "");

      const prepRes = await authFetch("/api/shop/kcp/prepare", {
        method: "POST",
        body: JSON.stringify({
          items: items.map(i => ({ it_id: i.it_id, qty: i.quantity, option: i.option, option_price: i.option_price })),
          name: form.name, phone: form.phone, email: form.email,
          postcode: form.postcode, addr1: form.addr1, addr2: form.addr2, memo: buildMemo(),
          coupon_no: selectedCoupon?.cp_no || null,
          point_use: pointUse,
        }),
      });
      const prep = await prepRes.json();
      if (!prepRes.ok) throw new Error(prep.error || "KCP決済の準備に失敗しました");

      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const orderInfo: Record<string, string> = {
        site_cd: kcpConfig.site_cd,
        site_name: "ソウルモノ",
        shop_name: "ソウルモノ",
        pay_method: isMobile ? "CARD" : "100000000000",
        ordr_idxx: prep.order_id,
        good_name: orderName.slice(0, 100),
        good_mny: String(prep.amount),
        currency: isMobile ? "410" : "WON",
        buyr_name: form.name,
        buyr_mail: form.email || "",
        buyr_tel2: form.phone,
        shop_user_id: mbId || "member",
        eng_flag: "Y",
        used_card_CCXX: "Y",
        used_card_YN: "Y",
        used_card: "CCXA:CCXB:CCXC",
        good_expr: "0",
        pending_id: prep.pending_id,
        res_cd: "", res_msg: "", enc_info: "", enc_data: "", tran_cd: "", tno: "",
      };

      if (isMobile) {
        if (!prep.approval_key || !prep.pay_url) throw new Error("KCPモバイル取引登録に失敗しました");
        Object.assign(orderInfo, {
          approval_key: prep.approval_key,
          PayUrl: prep.pay_url,
          Ret_URL: prep.ret_url,
          param_opt_1: prep.pending_id,
        });
      }

      const kcpForm = document.createElement("form");
      kcpForm.name = "kcp_order_info";
      kcpForm.method = "post";
      kcpForm.style.display = "none";
      Object.entries(orderInfo).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden"; input.name = k; input.value = v;
        kcpForm.appendChild(input);
      });
      document.body.appendChild(kcpForm);

      if (isMobile) {
        kcpForm.action = prep.pay_url.substring(0, prep.pay_url.lastIndexOf("/")) + "/jsp/encodingFilter/encodingFilter.jsp";
        kcpForm.submit();
        return;
      }

      // kcp_spay_hub.js는 내부적으로 jQuery 등 여러 스크립트를 비동기로 추가 로드한 뒤에야
      // KCP_Pay_Execute_Web을 정의하므로, 스크립트 태그의 onload만으로는 준비 완료를 보장할 수 없다.
      // 함수가 실제로 등록될 때까지 짧은 간격으로 폴링한다.
      const waitForKcpReady = (timeoutMs = 10000): Promise<void> =>
        new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            if (typeof (window as any).KCP_Pay_Execute_Web === "function") { resolve(); return; }
            if (Date.now() - start > timeoutMs) { reject(new Error("NHN KCP決済画面を読み込めませんでした。しばらくしてからもう一度お試しください。")); return; }
            setTimeout(check, 100);
          };
          check();
        });

      if (!(window as any).KCP_Pay_Execute_Web && !document.querySelector(`script[src="${kcpConfig.pc_script}"]`)) {
        const script = document.createElement("script");
        script.src = kcpConfig.pc_script;
        document.head.appendChild(script);
      }
      await waitForKcpReady();

      await new Promise<void>((resolve, reject) => {
        (window as any).m_Completepayment = async (approvalResult: any, closeFn: any) => {
          try {
            if ((window as any).GetField) (window as any).GetField(kcpForm, approvalResult);
            const confirmBody: Record<string, string> = { pending_id: prep.pending_id };
            new FormData(kcpForm).forEach((v, k) => { confirmBody[k] = String(v); });
            if (confirmBody.res_cd !== "0000") throw new Error(confirmBody.res_msg || "KCPカード認証がキャンセルされました");
            const confRes = await authFetch("/api/shop/kcp/confirm", { method: "POST", body: JSON.stringify(confirmBody) });
            const confData = await confRes.json();
            if (!confRes.ok) throw new Error(confData.error || "KCP決済の承認に失敗しました");
            setOrderResult(confData);
            sessionStorage.removeItem(CHECKOUT_KEY);
            setStep("done");
            (window as any).ReactNativeWebView?.postMessage(JSON.stringify({ type: "order_complete", od_id: confData?.od_id }));
            resolve();
          } catch (err) {
            try { closeFn?.(); } catch {}
            reject(err);
          }
        };
        try {
          (window as any).KCP_Pay_Execute_Web(kcpForm);
        } catch (err) { reject(err); }
      });
    } catch (e: any) {
      setError(e?.message || "決済処理中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const submitStripeOrder = async () => {
    if (!validate()) return;
    if (!stripeConfig?.enabled) { setError("Stripe決済をご利用いただけません。"); return; }
    setLoading(true); setError("");
    try {
      const res = await authFetch("/api/shop/stripe/create-session", {
        method: "POST",
        body: JSON.stringify({
          items: items.map(i => ({ it_id: i.it_id, qty: i.quantity, option: i.option, option_price: i.option_price })),
          name: form.name, phone: form.phone, email: form.email,
          postcode: form.postcode, addr1: form.addr1, addr2: form.addr2, memo: buildMemo(),
          coupon_no: selectedCoupon?.cp_no || null,
          point_use: pointUse,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Stripe決済の準備に失敗しました");
      if (!data.url) throw new Error("Stripe決済URLを取得できませんでした");
      sessionStorage.setItem("stripe_checkout_data", JSON.stringify({
        items, name: form.name, phone: form.phone, email: form.email,
        postcode: form.postcode, addr1: form.addr1, addr2: form.addr2,
        token: localStorage.getItem(TOKEN_KEY) || "",
      }));
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message || "決済処理中にエラーが発生しました。");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payMethod) { setError("お支払い方法を選択してください。"); return; }
    if (payMethod === "card") submitCardOrder();
    else if (payMethod === "stripe") submitStripeOrder();
    else submitBankOrder();
  };

  const availableMethods = [
    paySettings.bank_enabled && { key: "bank" as PayMethod, label: "銀行振込", desc: "ご注文後に口座へお振り込み", icon: <Building2 size={18} color={payMethod === "bank" ? "#8B5E3C" : "#888"} /> },
    kcpConfig?.enabled && { key: "card" as PayMethod, label: "クレジットカード", desc: `NHN KCP 海外カード決済${kcpConfig.mode === "test" ? " (テスト)" : ""}`, icon: <CreditCard size={18} color={payMethod === "card" ? "#8B5E3C" : "#888"} /> },
    stripeConfig?.enabled && { key: "stripe" as PayMethod, label: "Stripeカード決済", desc: "Visa、Mastercardなどの海外カード決済", icon: <CreditCard size={18} color={payMethod === "stripe" ? "#8B5E3C" : "#888"} /> },
  ].filter(Boolean) as { key: PayMethod; label: string; desc: string; icon: React.ReactNode }[];

  /* ── 완료 화면 ── */
  if (step === "done" && orderResult) {
    const isCard = orderResult.payment_method === "신용카드";
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
          {/* 완료 배너 */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "32px 24px", textAlign: "center", border: "1px solid #eee", marginBottom: 12 }}>
            <CheckCircle size={52} color="#8B5E3C" style={{ marginBottom: 12 }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>ご注文が完了しました!</h2>
            <p style={{ fontSize: 13, color: "#888", margin: 0 }}>注文番号: <strong style={{ color: "#8B5E3C", fontFamily: "monospace" }}>{orderResult.od_id}</strong></p>
          </div>

          {/* 주문 상품 */}
          <DoneSection title="ご注文商品" icon={<Package size={15} />}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < items.length - 1 ? 12 : 0, paddingBottom: i < items.length - 1 ? 12 : 0, borderBottom: i < items.length - 1 ? "1px solid #f0f0f0" : "none" }}>
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

          {/* 주문자 정보 */}
          <DoneSection title="ご注文者情報" icon={<User size={15} />}>
            <DoneRow label="お名前" value={form.name} />
            <DoneRow label="ご連絡先" value={form.phone} />
            {form.email && <DoneRow label="メールアドレス" value={form.email} />}
          </DoneSection>

          {/* 배송지 정보 */}
          <DoneSection title="お届け先情報" icon={<MapPin size={15} />}>
            <DoneRow label="お受け取り人" value={form.name} />
            <DoneRow label="ご連絡先" value={form.phone} />
            <DoneRow label="ご住所" value={<>{form.postcode && <span style={{ fontSize: 12, background: "#f0f9f4", color: "#8B5E3C", borderRadius: 4, padding: "1px 6px", marginRight: 6 }}>{form.postcode}</span>}{form.addr1} {form.addr2}</>} />
            {form.memo && <DoneRow label="配送メモ" value={form.memo} />}
          </DoneSection>

          {/* 결제 금액 */}
          <DoneSection title="お支払い金額" icon={<Banknote size={15} />}>
            <DoneRow label="商品金額" value={formatPrice(orderResult.od_cart_price)} />
            {orderResult.coupon_discount > 0 && <DoneRow label="クーポン割引" value={<span style={{ color: "#e53935" }}>-{formatPrice(orderResult.coupon_discount)}</span>} />}
            {orderResult.point_use > 0 && <DoneRow label="ポイント利用" value={<span style={{ color: "#e53935" }}>-{formatPrice(orderResult.point_use)}</span>} />}
            <DoneRow label="送料" value={orderResult.od_send_cost === 0 ? <span style={{ color: "#8B5E3C" }}>無料</span> : formatPrice(orderResult.od_send_cost)} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, borderTop: "1px solid #eee", paddingTop: 10, marginTop: 6 }}>
              <span>お支払い合計</span><span style={{ color: "#8B5E3C" }}>{formatPrice(orderResult.od_receipt_price)}</span>
            </div>
          </DoneSection>

          {/* 입금 안내 / 카드 */}
          {isCard ? (
            <div style={{ background: "#f0f9f4", border: "1.5px solid #b8e6cc", borderRadius: 14, padding: "20px", marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#8B5E3C", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}><CreditCard size={15} /> クレジットカード決済完了</p>
              <p style={{ fontSize: 13, color: "#555", margin: 0 }}>決済は正常に処理されました。</p>
            </div>
          ) : (
            <div style={{ background: "#f0f9f4", border: "1.5px solid #b8e6cc", borderRadius: 14, padding: "20px", marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#8B5E3C", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}><Building2 size={15} /> 銀行振込のご案内</p>
              <DoneRow label="振込先銀行" value={orderResult.bank_name || "情報なし"} />
              <DoneRow label="口座番号" value={orderResult.bank_num || "情報なし"} />
              <DoneRow label="口座名義" value={orderResult.bank_holder || "情報なし"} />
              <DoneRow label="お振込金額" value={<strong style={{ color: "#8B5E3C", fontSize: 15 }}>{formatPrice(orderResult.od_receipt_price)}</strong>} />
              <p style={{ fontSize: 12, color: "#888", margin: "12px 0 0", lineHeight: 1.7, background: "#fff", borderRadius: 8, padding: "10px 12px" }}>
                お振込名義は <strong style={{ color: "#8B5E3C" }}>{form.name}</strong> でお願いします。<br />入金確認後に発送いたします。
              </p>
            </div>
          )}

          {/* 비회원 SMS 안내 */}
          {orderResult.guest && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fbbf24", borderRadius: 14, padding: "18px 20px", marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Phone size={20} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", margin: "0 0 6px" }}>注文番号をSMSでお送りしました</p>
                <p style={{ fontSize: 13, color: "#78350f", margin: 0, lineHeight: 1.6 }}>
                  ご入力の番号 <strong>{form.phone}</strong> 宛に<br />
                  注文番号 <strong style={{ fontFamily: "monospace", color: "#8B5E3C" }}>{orderResult.od_id}</strong> をSMSでお送りしました。<br />
                  銀行振込のご入金後に発送いたします。
                </p>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {!orderResult.guest && (
              <button onClick={() => navigate("/mypage")} style={{ height: 50, background: "#8B5E3C", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>注文履歴を確認</button>
            )}
            <button onClick={() => navigate("/")} style={{ height: 46, background: orderResult.guest ? "#8B5E3C" : "#fff", border: orderResult.guest ? "none" : "1px solid #ddd", borderRadius: 12, color: orderResult.guest ? "#fff" : "#555", fontSize: orderResult.guest ? 15 : 14, fontWeight: orderResult.guest ? 700 : 400, cursor: "pointer" }}>ショッピングを続ける</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ── 주문 폼 ── */
  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", paddingBottom: 80 }}>
      <Header />
      {/* 서브 헤더 */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate(-1 as any)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ChevronLeft size={22} color="#333" />
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>ご注文手続き</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px" }}>

          {/* 2단 레이아웃 */}
          <div className="checkout-grid">

            {/* ── 왼쪽: 입력 폼 ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>

              {/* 주문 상품 */}
              <Section title={<><Package size={15} /> ご注文商品</>}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: i > 0 ? "12px 0 0" : "0", borderTop: i > 0 ? "1px solid #f0f0f0" : "none" }}>
                    <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", background: "#f5f5f5", flexShrink: 0 }}>
                      {item.it_img1 && <img src={item.it_img1} alt={item.it_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, color: "#222", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.it_name}</p>
                      <p style={{ fontSize: 11, color: "#aaa", margin: "0 0 4px", fontFamily: "monospace" }}>商品番号: {item.it_id}</p>
                      {item.option && <p style={{ fontSize: 12, color: "#999", margin: "0 0 4px" }}>オプション: {item.option}</p>}
                      <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{item.quantity}点 · <strong>{formatPrice(item.it_price * item.quantity)}</strong></p>
                    </div>
                  </div>
                ))}
              </Section>

              {/* 비회원 안내 배너 */}
              {isGuest && (
                <div style={{ background: "#fffbeb", border: "1.5px solid #fbbf24", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Phone size={18} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#92400e" }}>ゲスト購入</p>
                    <p style={{ margin: 0, fontSize: 12.5, color: "#78350f", lineHeight: 1.6 }}>
                      ご注文完了後、ご入力の連絡先に注文番号をSMSでお送りします。<br />
                      クーポン・ポイント特典はログイン後にご利用いただけます。
                    </p>
                  </div>
                </div>
              )}

              {/* 주문자 정보 */}
              <Section title="ご注文者情報">
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#222", marginBottom: 8 }}>
                    お名前（漢字） <span style={{ color: "#e53935" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>姓（必須）</label>
                      <input type="text" value={nameParts.lastName} onChange={setNamePart("lastName")} placeholder="例：山田" required
                        style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = "#8B5E3C"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>名（必須）</label>
                      <input type="text" value={nameParts.firstName} onChange={setNamePart("firstName")} placeholder="例：太郎" required
                        style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = "#8B5E3C"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#222", marginBottom: 8 }}>
                    フリガナ（カタカナ） <span style={{ color: "#e53935" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>セイ（必須）</label>
                      <input type="text" value={nameParts.lastNameKana} onChange={setNamePart("lastNameKana")} placeholder="例：ヤマダ" required
                        style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = "#8B5E3C"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>メイ（必須）</label>
                      <input type="text" value={nameParts.firstNameKana} onChange={setNamePart("firstNameKana")} placeholder="例：タロウ" required
                        style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = "#8B5E3C"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#aaa", margin: "6px 0 0" }}>※カタカナで入力してください</p>
                </div>

                <Field label="ご連絡先 *" type="tel" value={form.phone} onChange={set("phone")} placeholder="090-0000-0000" required />
                <Field label="メールアドレス" type="email" value={form.email} onChange={set("email")} placeholder="email@example.com" />
              </Section>

              {/* 배송지 */}
              <Section title={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={15} />お届け先</span>
                  {!isGuest && (
                    <button type="button" onClick={() => setShowAddressModal(true)}
                      style={{ fontSize: 12, color: "#8B5E3C", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, fontWeight: 600 }}>
                      <Plus size={13} />お届け先管理
                    </button>
                  )}
                </div>
              }>
                {savedAddresses.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <button type="button" onClick={() => setShowAddrPicker(!showAddrPicker)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1.5px solid #8B5E3C", borderRadius: 8, background: "#f0f9f4", cursor: "pointer", fontSize: 13, color: "#8B5E3C", fontWeight: 600 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} />保存済みのお届け先から選択</span>
                      <ChevronDown size={16} style={{ transform: showAddrPicker ? "rotate(180deg)" : "none", transition: "0.2s" }} />
                    </button>
                    {showAddrPicker && (
                      <div style={{ border: "1px solid #ddd", borderRadius: 8, marginTop: 4, overflow: "hidden" }}>
                        {savedAddresses.map((addr, i) => (
                          <button key={addr.ma_id} type="button" onClick={() => applyAddress(addr)}
                            style={{ width: "100%", padding: "12px 14px", background: "#fff", border: "none", borderBottom: i < savedAddresses.length - 1 ? "1px solid #f0f0f0" : "none", cursor: "pointer", textAlign: "left" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{addr.ma_name}</span>
                              {addr.ma_default && <span style={{ fontSize: 11, fontWeight: 700, color: "#8B5E3C", background: "#e8f8f0", padding: "1px 6px", borderRadius: 4 }}>基本</span>}
                            </div>
                            {addr.ma_hp && <p style={{ margin: "0 0 2px", fontSize: 12, color: "#888" }}>{addr.ma_hp}</p>}
                            <p style={{ margin: 0, fontSize: 12, color: "#666" }}>{addr.ma_addr1} {addr.ma_addr2}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 郵便番号 */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>郵便番号 *</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, color: "#555", fontWeight: 700 }}>〒</span>
                    <input
                      type="text" inputMode="numeric" value={form.postcode} onChange={handlePostcodeChange}
                      placeholder="123-4567" maxLength={8} required
                      style={{ width: 140, border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}
                    />
                    {postcodeLoading && <span style={{ fontSize: 12, color: "#888" }}>検索中...</span>}
                  </div>
                  {postcodeLookupError && <p style={{ fontSize: 11, color: "#e53935", margin: "6px 0 0" }}>{postcodeLookupError}</p>}
                </div>
                <Field label="都道府県・市区町村 *" type="text" value={form.addr1} onChange={set("addr1")} placeholder="郵便番号入力で自動入力されます" required />
                <Field label="番地・建物名・部屋番号" type="text" value={form.addr2} onChange={set("addr2")} placeholder="番地・建物名・部屋番号など" />
              </Section>

              {/* 배송 메모 */}
              <Section title="配送のご要望">
                <div>
                  <textarea value={form.memo} onChange={set("memo")}
                    placeholder="配送に関するご要望を入力してください（例：置き配、宅配ボックス指定など）"
                    style={{ width: "100%", minHeight: 72, border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = "#8B5E3C"}
                    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = "#e0e0e0"}
                  />
                </div>
              </Section>

              {/* ── 쿠폰 ── */}
              {!isGuest && (
                <Section title={<><Tag size={15} /> クーポンを使う</>}>
                  {availableCoupons.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>ご利用可能なクーポンがありません。</p>
                  ) : selectedCoupon ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0f9f4", border: "1.5px solid #8B5E3C", borderRadius: 10, padding: "12px 14px" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#8B5E3C" }}>{selectedCoupon.cp_name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 13, color: "#555" }}>{formatPrice(selectedCoupon.cp_price)}オフ</p>
                      </div>
                      <button type="button" onClick={() => setSelectedCoupon(null)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4 }}>
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowCouponPicker(true)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", border: "1.5px solid #e0e0e0", borderRadius: 10, background: "#fff", cursor: "pointer", fontSize: 14, color: "#333" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Tag size={14} color="#888" />クーポンを選択 ({availableCoupons.length}枚利用可能)</span>
                      <ChevronRight size={16} color="#aaa" />
                    </button>
                  )}
                </Section>
              )}

              {/* ── 포인트 ── */}
              {!isGuest && (
                <Section title={<><Award size={15} /> ポイントを使う</>}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "#555" }}>保有ポイント:</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: myPoints > 0 ? "#8B5E3C" : "#aaa" }}>{myPoints.toLocaleString()} D</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number" value={pointInput} onChange={e => setPointInput(e.target.value)}
                      placeholder="使用するポイントを入力"
                      min={0} max={myPoints}
                      disabled={myPoints === 0}
                      style={{ flex: 1, border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: myPoints === 0 ? "#fafafa" : "#fff" }}
                      onFocus={e => e.target.style.borderColor = "#8B5E3C"}
                      onBlur={e => e.target.style.borderColor = "#e0e0e0"}
                    />
                    <button type="button" onClick={applyPoint} disabled={myPoints === 0}
                      style={{ flexShrink: 0, padding: "0 14px", height: 42, background: "#8B5E3C", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: myPoints === 0 ? "not-allowed" : "pointer", opacity: myPoints === 0 ? 0.5 : 1 }}>
                      適用
                    </button>
                    <button type="button" onClick={useAllPoints} disabled={myPoints === 0}
                      style={{ flexShrink: 0, padding: "0 12px", height: 42, background: "#fff", border: "1.5px solid #8B5E3C", borderRadius: 8, color: "#8B5E3C", fontSize: 13, fontWeight: 700, cursor: myPoints === 0 ? "not-allowed" : "pointer", opacity: myPoints === 0 ? 0.5 : 1, whiteSpace: "nowrap" }}>
                      全額使用
                    </button>
                  </div>
                  {pointUse > 0 && (
                    <p style={{ fontSize: 13, color: "#8B5E3C", margin: "8px 0 0", fontWeight: 600 }}>
                      {pointUse.toLocaleString()}pt 使用 → {formatPrice(pointUse)} 割引
                    </p>
                  )}
                </Section>
              )}
            </div>

            {/* ── 오른쪽: 결제 정보 (sticky) ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="checkout-sticky-right">

                {/* 결제 방법 */}
                <Section title={<><Banknote size={15} /> お支払い方法</>}>
                  {availableMethods.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#888", textAlign: "center", padding: "12px 0" }}>ご利用可能なお支払い方法がありません。</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {availableMethods.map(m => (
                        <button key={m.key} type="button" onClick={() => setPayMethod(m.key)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                            border: `2px solid ${payMethod === m.key ? "#8B5E3C" : "#e0e0e0"}`,
                            borderRadius: 12, background: payMethod === m.key ? "#f0f9f4" : "#fff",
                            cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                          }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, border: `2px solid ${payMethod === m.key ? "#8B5E3C" : "#ccc"}`, background: payMethod === m.key ? "#8B5E3C" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {payMethod === m.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                          </div>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: payMethod === m.key ? "#e8f4ec" : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {m.icon}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: payMethod === m.key ? "#8B5E3C" : "#222" }}>{m.label}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>{m.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </Section>

                {/* 무통장입금 계좌 안내 (무통장 선택 시) */}
                {payMethod === "bank" && (
                  <div style={{ background: "#f0f9f4", border: "1.5px solid #b8e6cc", borderRadius: 14, padding: "18px 20px" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#8B5E3C", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                      <Building2 size={15} /> 銀行振込のご案内
                    </p>
                    {bankInfo.bank_num ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                          <span style={{ color: "#888" }}>振込先銀行</span>
                          <span style={{ color: "#333", fontWeight: 600 }}>{bankInfo.bank_name}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                          <span style={{ color: "#888" }}>口座番号</span>
                          <span style={{ color: "#8B5E3C", fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>{bankInfo.bank_num}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
                          <span style={{ color: "#888" }}>口座名義</span>
                          <span style={{ color: "#333", fontWeight: 600 }}>{bankInfo.bank_holder}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#888", margin: 0, background: "#fff", borderRadius: 8, padding: "10px 12px", lineHeight: 1.7 }}>
                          ご注文後、<strong style={{ color: "#8B5E3C" }}>上記口座へお振り込み</strong>ください。<br />
                          お振込名義は <strong style={{ color: "#8B5E3C" }}>{form.name || "ご注文者名"}</strong> でお願いします。<br />
                          入金確認後に発送いたします。
                        </p>
                        {bankInfo.bank_memo && (
                          <p style={{ fontSize: 12, color: "#555", margin: "8px 0 0", background: "#fff", borderRadius: 8, padding: "10px 12px", lineHeight: 1.8, whiteSpace: "pre-line", borderLeft: "3px solid #8B5E3C" }}>
                            {bankInfo.bank_memo}
                          </p>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: 13, color: "#888", margin: 0 }}>口座情報が登録されていません。管理者にお問い合わせください。</p>
                    )}
                  </div>
                )}

                {/* NHN KCP 안내 (카드 선택 시) */}
                {payMethod === "card" && (
                  <div style={{ background: "#fff", borderRadius: 14, padding: "16px", border: "1px solid #eee" }}>
                    <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.7 }}>
                      注文ボタンを押すと、NHN KCP海外カード決済画面が開きます。{kcpConfig?.mode === "test" ? " (テストモード)" : ""}
                    </p>
                  </div>
                )}

                {/* Stripe 안내 (Stripe 선택 시) */}
                {payMethod === "stripe" && (
                  <div style={{ background: "#fff", borderRadius: 14, padding: "16px", border: "1px solid #eee" }}>
                    <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.7 }}>
                      注文ボタンを押すと、Stripe決済ページに移動します。
                    </p>
                  </div>
                )}

                {/* 주문 금액 요약 */}
                <Section title="お支払い金額">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <SummaryRow label="商品金額" value={formatPrice(subtotal)} />
                    <SummaryRow label="送料" value={
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {regionLabel && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: regionColor, background: regionColor + "18", borderRadius: 4, padding: "1px 6px" }}>
                            {regionLabel}
                          </span>
                        )}
                        <span style={{ color: shipping === 0 ? "#8B5E3C" : "#333", fontWeight: 600 }}>
                          {shipping === 0 ? "無料" : formatPrice(shipping)}
                        </span>
                      </span>
                    } />
                    {subtotal > 0 && subtotal < freeThreshold && shippingRegion !== "jeju" && shippingRegion !== "island" && (
                      <p style={{ fontSize: 11, color: "#aaa", margin: "-4px 0 0", lineHeight: 1.5 }}>
                        {formatPrice(freeThreshold - subtotal)} 追加で基本送料が無料
                      </p>
                    )}
                    {shippingRegion === "jeju" && (
                      <p style={{ fontSize: 11, color: "#1565c0", margin: "-4px 0 0", lineHeight: 1.5 }}>
                        済州島の追加送料3,000円を含む
                      </p>
                    )}
                    {shippingRegion === "island" && (
                      <p style={{ fontSize: 11, color: "#e65100", margin: "-4px 0 0", lineHeight: 1.5 }}>
                        離島・山間部の追加送料5,000円を含む
                      </p>
                    )}
                    {couponDiscount > 0 && (
                      <SummaryRow label="クーポン割引" value={<span style={{ color: "#e91e63", fontWeight: 600 }}>- {formatPrice(couponDiscount)}</span>} />
                    )}
                    {pointUse > 0 && (
                      <SummaryRow label="ポイント利用" value={<span style={{ color: "#ff9800", fontWeight: 600 }}>- {formatPrice(pointUse)}</span>} />
                    )}
                    <div style={{ borderTop: "2px solid #8B5E3C", paddingTop: 12, marginTop: 4 }}>
                      <SummaryRow
                        label="お支払い合計"
                        value={<span style={{ fontSize: 22, fontWeight: 900, color: "#8B5E3C" }}>{formatPrice(total)}</span>}
                        bold
                      />
                    </div>
                  </div>
                </Section>

                {error && (
                  <div style={{ background: "#fff3f3", border: "1px solid #ffcdd2", borderRadius: 8, padding: "12px 16px", color: "#d32f2f", fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading || availableMethods.length === 0 || !payMethod}
                  style={{ width: "100%", height: 54, background: (loading || availableMethods.length === 0 || !payMethod) ? "#aaa" : "#8B5E3C", border: "none", borderRadius: 12, color: "#fff", fontSize: 17, fontWeight: 700, cursor: (loading || availableMethods.length === 0 || !payMethod) ? "not-allowed" : "pointer" }}>
                  {loading ? "処理中..." : !payMethod ? "お支払い方法を選択してください" : payMethod === "card" ? `${formatPrice(total)} カードで決済する` : payMethod === "stripe" ? `${formatPrice(total)} Stripeで決済する` : `${formatPrice(total)} 銀行振込で注文する`}
                </button>

                <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", margin: "8px 0 0", lineHeight: 1.6 }}>
                  注文内容を確認し、購入手続きに同意します。
                </p>
              </div>
            </div>

          </div>
        </div>
      </form>

      {showCouponPicker && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={() => setShowCouponPicker(false)} />
          <div style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 -4px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>クーポンを選択</h3>
              <button onClick={() => setShowCouponPicker(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#aaa", lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {availableCoupons.map(c => (
                  <button key={c.cp_no} type="button" onClick={() => { setSelectedCoupon(c); setShowCouponPicker(false); }}
                    style={{ width: "100%", textAlign: "left", background: "#fff", border: "1.5px solid #eee", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#222" }}>{c.cp_name}</p>
                        <p style={{ margin: 0, fontSize: 13, color: "#8B5E3C", fontWeight: 700 }}>{formatPrice(c.cp_price)}オフ</p>
                        {c.cp_minimum > 0 && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>{formatPrice(c.cp_minimum)}以上のご注文時</p>}
                      </div>
                      <Tag size={24} color="#8B5E3C" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddressModal && (
        <ShippingAddressModal
          addresses={savedAddresses}
          onSelect={(addr) => {
            applyAddress(addr);
            setShowAddressModal(false);
          }}
          onClose={() => setShowAddressModal(false)}
          onRefresh={() => {
            authFetch("/api/shop/addresses").then(r => r.json()).then(d => {
              setSavedAddresses(d.addresses || []);
            }).catch(() => {});
          }}
        />
      )}

      <style>{`
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 20px;
          align-items: start;
        }
        .checkout-sticky-right {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: sticky;
          top: 68px;
        }
        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
          .checkout-sticky-right {
            position: static;
          }
        }
      `}</style>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
      <div style={{ padding: "13px 16px", borderBottom: "1px solid #f0f0f0", fontSize: 14, fontWeight: 700, color: "#222", display: "flex", alignItems: "center", gap: 6 }}>
        {title}
      </div>
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>{label}</label>
      <input {...props}
        style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}
        onFocus={e => e.target.style.borderColor = "#8B5E3C"}
        onBlur={e => e.target.style.borderColor = "#e0e0e0"}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <span style={{ fontSize: 13, color: "#888", width: 72, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#222", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: bold ? 15 : 13 }}>
      <span style={{ color: bold ? "#111" : "#888", fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

interface AddrForm { ma_name: string; ma_hp: string; ma_zip1: string; ma_addr1: string; ma_addr2: string; ma_default: boolean; }
const emptyAddrForm = (): AddrForm => ({ ma_name: "", ma_hp: "", ma_zip1: "", ma_addr1: "", ma_addr2: "", ma_default: false });

function ShippingAddressModal({ addresses, onSelect, onClose, onRefresh }: {
  addresses: SavedAddress[];
  onSelect: (addr: SavedAddress) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<(AddrForm & { ma_id?: number }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<SavedAddress[]>(addresses);
  const [modalPostcodeError, setModalPostcodeError] = useState("");
  const [modalPostcodeLoading, setModalPostcodeLoading] = useState(false);

  const reload = () => {
    authFetch("/api/shop/addresses").then(r => r.json()).then(d => {
      setList(d.addresses || []);
      onRefresh();
    }).catch(() => {});
  };

  const ef = (k: keyof AddrForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditing(prev => prev ? { ...prev, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value } : prev);

  const handleModalPostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
    const formatted = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
    setEditing(prev => prev ? { ...prev, ma_zip1: formatted } : prev);
    setModalPostcodeError("");
    if (digits.length === 7) {
      setModalPostcodeLoading(true);
      fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`)
        .then(r => r.json())
        .then(data => {
          const result = data.results?.[0];
          if (result) {
            setEditing(prev => prev ? { ...prev, ma_addr1: `${result.address1}${result.address2}${result.address3}` } : prev);
          } else {
            setModalPostcodeError("郵便番号に該当する住所が見つかりませんでした。手入力してください。");
          }
        })
        .catch(() => setModalPostcodeError("住所の自動取得に失敗しました。手入力してください。"))
        .finally(() => setModalPostcodeLoading(false));
    }
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.ma_name || !editing.ma_addr1) { alert("お受け取り人とご住所を入力してください"); return; }
    setSaving(true);
    const isNew = !editing.ma_id;
    const url = isNew ? "/api/shop/addresses" : `/api/shop/addresses/${editing.ma_id}`;
    const method = isNew ? "POST" : "PUT";
    await authFetch(url, { method, body: JSON.stringify(editing) });
    setSaving(false);
    setEditing(null);
    setShowForm(false);
    reload();
  };

  const del = async (id: number) => {
    if (!confirm("このお届け先を削除してもよろしいですか?")) return;
    await authFetch(`/api/shop/addresses/${id}`, { method: "DELETE" });
    reload();
  };

  const setDefault = async (addr: SavedAddress) => {
    await authFetch(`/api/shop/addresses/${addr.ma_id}`, { method: "PUT", body: JSON.stringify({ ...addr, ma_default: true }) });
    reload();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.22)" }}>
        {/* 헤더 */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111" }}>お届け先管理</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#aaa", lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* 스크롤 본문 */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>
          {/* 새 배송지 폼 */}
          {showForm && editing ? (
            <div style={{ background: "#f8f9fa", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#8B5E3C" }}>
                {editing.ma_id ? "お届け先を編集" : "お届け先を追加"}
              </h4>
              <MiniField label="お受け取り人 *" value={editing.ma_name} onChange={ef("ma_name")} placeholder="お名前" />
              <MiniField label="ご連絡先" value={editing.ma_hp} onChange={ef("ma_hp")} placeholder="090-0000-0000" />
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: "#888", fontWeight: 600, display: "block", marginBottom: 5 }}>郵便番号 *</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: "#555", fontWeight: 700 }}>〒</span>
                  <input value={editing.ma_zip1} onChange={handleModalPostcodeChange} inputMode="numeric" placeholder="123-4567" maxLength={8}
                    style={{ width: 130, border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "9px 11px", fontSize: 13, boxSizing: "border-box" }} />
                  {modalPostcodeLoading && <span style={{ fontSize: 12, color: "#888" }}>検索中...</span>}
                </div>
                {modalPostcodeError && <p style={{ fontSize: 11, color: "#e53935", margin: "0 0 6px" }}>{modalPostcodeError}</p>}
                <input value={editing.ma_addr1} onChange={ef("ma_addr1")} placeholder="都道府県・市区町村（郵便番号入力で自動入力）"
                  style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "9px 11px", fontSize: 13, boxSizing: "border-box", marginBottom: 6 }} />
                <input value={editing.ma_addr2} onChange={ef("ma_addr2")} placeholder="番地・建物名・部屋番号など"
                  style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "9px 11px", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#444", cursor: "pointer", marginBottom: 14 }}>
                <input type="checkbox" checked={editing.ma_default} onChange={ef("ma_default")} />
                基本のお届け先に設定
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowForm(false); setEditing(null); }}
                  style={{ flex: 1, height: 40, background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#555" }}>キャンセル</button>
                <button onClick={save} disabled={saving}
                  style={{ flex: 2, height: 40, background: "#8B5E3C", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => { setEditing(emptyAddrForm()); setShowForm(true); }}
              style={{ width: "100%", height: 44, marginBottom: 16, background: "#f0f9f4", border: "1.5px dashed #8B5E3C", borderRadius: 10, color: "#8B5E3C", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Plus size={15} />お届け先を追加
            </button>
          )}

          {/* 배송지 목록 */}
          {list.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#bbb", fontSize: 14 }}>
              <MapPin size={32} style={{ opacity: 0.3, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
              保存されたお届け先がありません
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {list.map(addr => (
                <div key={addr.ma_id} style={{ border: "1.5px solid #eee", borderRadius: 12, padding: 14, background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{addr.ma_name}</span>
                      {addr.ma_default && <span style={{ fontSize: 11, fontWeight: 700, color: "#8B5E3C", background: "#e8f8f0", padding: "1px 6px", borderRadius: 4 }}>基本</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {!addr.ma_default && (
                        <button onClick={() => setDefault(addr)}
                          style={{ fontSize: 11, color: "#888", background: "none", border: "1px solid #ddd", borderRadius: 5, padding: "3px 7px", cursor: "pointer" }}>基本に設定</button>
                      )}
                      <button onClick={() => { setEditing({ ...addr, ma_addr2: [addr.ma_addr2, addr.ma_addr3].filter(Boolean).join(" ") }); setShowForm(true); }}
                        style={{ fontSize: 11, color: "#555", background: "none", border: "1px solid #ddd", borderRadius: 5, padding: "3px 7px", cursor: "pointer" }}>編集</button>
                      <button onClick={() => del(addr.ma_id)}
                        style={{ fontSize: 11, color: "#e53935", background: "none", border: "1px solid #ffcdd2", borderRadius: 5, padding: "3px 7px", cursor: "pointer" }}>削除</button>
                    </div>
                  </div>
                  {addr.ma_hp && <p style={{ margin: "0 0 3px", fontSize: 12, color: "#888" }}>{addr.ma_hp}</p>}
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "#555" }}>{addr.ma_addr1} {addr.ma_addr2} {addr.ma_zip1 && `(${addr.ma_zip1})`}</p>
                  <button onClick={() => onSelect(addr)}
                    style={{ width: "100%", height: 38, background: "#8B5E3C", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    このお届け先に配送
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 12, color: "#888", fontWeight: 600, display: "block", marginBottom: 5 }}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "9px 11px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = "#8B5E3C"}
        onBlur={e => e.target.style.borderColor = "#e0e0e0"} />
    </div>
  );
}
