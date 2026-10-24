import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, proxyImage, formatOrderNumber } from "@/lib/utils";
import { ShoppingCart, CheckCircle, Ticket, ChevronDown, X, Truck, CreditCard, Banknote, Loader2, Tag, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import KoreanAddressSearch, { type AddressData } from "@/components/KoreanAddressSearch";
import { StripeCardInput, type StripeCardHandle } from "@/components/StripePaymentForm";
import { loadStripe } from "@stripe/stripe-js";

export default function Checkout() {
  const { user, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const { data: cartItems } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: summary } = trpc.cart.summary.useQuery(undefined, { enabled: isAuthenticated });
  const { data: addresses } = trpc.user.addresses.useQuery(undefined, { enabled: isAuthenticated });
  const { data: profile } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });

  const [form, setForm] = useState({
    recipientName: "",
    recipientPhone: "",
    zipCode: "",
    address1: "",
    address2: "",
    addressEn1: "",
    addressEn2: "",
    memo: "",
    pointsUsed: 0,
    paymentMethod: "" as string,
    depositorName: "",
    bankAccountId: null as number | null,
    recipientNameEn: "",
  });
  const [addressData, setAddressData] = useState<Partial<AddressData>>({});
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
  const [isTranslatingName, setIsTranslatingName] = useState(false);
  const [debounceNameTimer, setDebounceNameTimer] = useState<NodeJS.Timeout | null>(null);
  const translateMut = trpc.address.translateToEnglish.useMutation();
  const { data: enabledMethods } = trpc.paymentSettings.getEnabledMethods.useQuery();
  const { data: bankAccounts } = trpc.payment.getBankAccounts.useQuery(undefined, { enabled: form.paymentMethod === "bank_transfer" });
  const [showCouponSelect, setShowCouponSelect] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [orderComplete, setOrderComplete] = useState<{ orderNumber: string; paymentMethod?: string; bankAccount?: { bankName: string; accountNumber: string; accountHolder: string } | null; depositAmount?: number; depositorName?: string; expiresAt?: Date } | null>(null);
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");

  const stripeCardRef = useRef<StripeCardHandle>(null);

  const { data: stripeKeyData } = trpc.stripe.getPublishableKey.useQuery(undefined, {
    enabled: !!(enabledMethods?.some(m => m.methodCode === "stripe")),
  });
  const chargeWithPaymentMethod = trpc.stripe.chargeWithPaymentMethod.useMutation();

  const items = cartItems ?? [];
  const subtotal = summary?.subtotal ?? 0;
  const gradeDiscount = summary?.gradeDiscount ?? 0;
  const benefit = summary?.benefit;

  const cartProductIds = useMemo(() => items.map(i => i.productId), [items]);
  const cartCategoryIds = useMemo(() => {
    const ids = items.map(i => (i as any).product?.categoryId).filter(Boolean);
    return [...new Set(ids)] as number[];
  }, [items]);

  const utils = trpc.useUtils();

  const { data: availableCoupons } = trpc.coupon.forOrder.useQuery(
    { orderAmount: subtotal, productIds: cartProductIds, categoryIds: cartCategoryIds },
    { enabled: isAuthenticated && subtotal > 0 }
  );

  // Validate promo code (discount code)
  const validatePromo = trpc.promoCode.validate.useQuery(
    { code: promoCode.trim(), orderAmount: subtotal, productIds: cartProductIds, categoryIds: cartCategoryIds },
    { enabled: false }
  );
  const redeemPromoMut = trpc.promoCode.redeem.useMutation({
    onSuccess: (data) => {
      toast.success(`"${data.promoCodeName}" 프로모코드가 적용되었습니다`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    try {
      const result = await validatePromo.refetch();
      if (!result.data?.valid) {
        toast.error(result.data?.message ?? "유효하지 않은 프로모코드입니다");
        return;
      }
      setAppliedPromo(result.data.promo);
      toast.success(`"${result.data.promo.name}" 프로모코드 적용됨 (${result.data.discountText})`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Calculate coupon discount
  const selectedCoupon = useMemo(() => {
    if (!selectedCouponId || !availableCoupons) return null;
    return availableCoupons.find(c => c.id === selectedCouponId) ?? null;
  }, [selectedCouponId, availableCoupons]);

  // Items eligible for coupon (exclude noDiscount products, respect targetType)
  const couponEligibleItems = useMemo(() => {
    if (!selectedCoupon) return [];
    const coupon = selectedCoupon.coupon;
    return items.filter(item => {
      const product = item.product as any;
      if (product?.noDiscount) return false;
      if (coupon.targetType === "product") {
        const ids = coupon.targetProductIds ? coupon.targetProductIds.split(",").map(Number) : [];
        return ids.includes(item.productId);
      }
      if (coupon.targetType === "category") {
        const ids = (coupon as any).targetCategoryIds ? (coupon as any).targetCategoryIds.split(",").map(Number) : [];
        return ids.includes(product?.categoryId);
      }
      return true;
    });
  }, [selectedCoupon, items]);

  const eligibleSubtotal = useMemo(() => {
    return couponEligibleItems.reduce((sum, item) => {
      const price = ((item as any).optionPrice ?? item.product?.salePrice ?? item.product?.price ?? 0) * item.quantity;
      return sum + price;
    }, 0);
  }, [couponEligibleItems]);

  const couponDiscount = useMemo(() => {
    if (!selectedCoupon || eligibleSubtotal === 0) return 0;
    const coupon = selectedCoupon.coupon;
    let discount = 0;
    if (coupon.discountType === "percent") {
      discount = Math.floor(eligibleSubtotal * coupon.discountValue / 100);
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(coupon.discountValue, eligibleSubtotal);
    }
    return discount;
  }, [selectedCoupon, eligibleSubtotal]);

  // Per-item coupon discount (proportional split)
  const itemCouponDiscounts = useMemo(() => {
    const map: Record<number, number> = {};
    if (!selectedCoupon || couponDiscount === 0 || eligibleSubtotal === 0) return map;
    const eligibleIds = new Set(couponEligibleItems.map(i => i.id));
    const eligible = items.filter(i => eligibleIds.has(i.id));
    let remaining = couponDiscount;
    eligible.forEach((item, idx) => {
      const price = ((item as any).optionPrice ?? item.product?.salePrice ?? item.product?.price ?? 0) * item.quantity;
      if (idx === eligible.length - 1) {
        map[item.id] = remaining;
      } else {
        const share = Math.floor(couponDiscount * price / eligibleSubtotal);
        map[item.id] = share;
        remaining -= share;
      }
    });
    return map;
  }, [selectedCoupon, couponDiscount, eligibleSubtotal, couponEligibleItems, items]);

  // Calculate promo code discount
  const promoDiscount = useMemo(() => {
    if (!appliedPromo || subtotal === 0) return 0;
    const promo = appliedPromo;
    let discount = 0;
    if (promo.discountType === "percent") {
      discount = Math.floor(subtotal * promo.discountValue / 100);
      if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) {
        discount = promo.maxDiscountAmount;
      }
    } else {
      discount = Math.min(promo.discountValue, subtotal);
    }
    return discount;
  }, [appliedPromo, subtotal]);

  const shippingFee = 0; // 국제배송 무료
  const total = subtotal - gradeDiscount + shippingFee - form.pointsUsed - couponDiscount - promoDiscount;

  const createOrder = trpc.order.create.useMutation({
    onSuccess: (data) => {
      const selectedAccount = form.paymentMethod === "bank_transfer" && form.bankAccountId
        ? (bankAccounts ?? []).find((a: any) => a.id === form.bankAccountId) ?? null
        : null;
      const autoCancelHours = 48;
      const expiresAt = form.paymentMethod === "bank_transfer" ? new Date(Date.now() + autoCancelHours * 3600 * 1000) : undefined;
      setOrderComplete({
        orderNumber: data.orderNumber,
        paymentMethod: form.paymentMethod,
        bankAccount: selectedAccount,
        depositAmount: total,
        depositorName: form.depositorName,
        expiresAt,
      });
      toast.success("주문이 완료되었습니다");
    },
    onError: (err) => toast.error(err.message),
  });

  // Fill from saved address
  const fillAddress = useCallback(async (addr: any) => {
    if (!addr) return;
    setForm(f => ({
      ...f,
      recipientName: addr.recipient,
      recipientNameEn: addr.recipientNameEn ?? "",
      recipientPhone: addr.phone,
      zipCode: addr.zipCode,
      address1: addr.address1,
      address2: addr.address2 ?? "",
      addressEn1: addr.addressEn1 ?? "",
      addressEn2: addr.addressEn2 ?? "",
    }));
    setAddressData({
      zipCode: addr.zipCode,
      address1: addr.address1,
      address2: addr.address2 ?? "",
      addressEn1: addr.addressEn1 ?? "",
      addressEn2: addr.addressEn2 ?? "",
    });
    // 영문이름이 없으면 한국 이름을 자동 번역
    if (!addr.recipientNameEn && addr.recipient) {
      setIsTranslatingName(true);
      try {
        const result = await translateMut.mutateAsync({ koreanText: addr.recipient });
        setForm(f => ({ ...f, recipientNameEn: result.englishText }));
      } catch {
        // 번역 실패 시 무시
      } finally {
        setIsTranslatingName(false);
      }
    }
  }, [translateMut]);

  // Handle address search result
  const handleAddressChange = useCallback((data: AddressData) => {
    setAddressData(data);
    setForm(f => ({
      ...f,
      zipCode: data.zipCode,
      address1: data.address1,
      address2: data.address2,
      addressEn1: data.addressEn1,
      addressEn2: data.addressEn2,
    }));
  }, []);

  // Handle recipient name change with auto-translation
  const handleRecipientNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm(f => ({ ...f, recipientName: val }));

    // 자동 번역: 입력 멈춘 후 1초 뒤에 번역 시작
    if (debounceNameTimer) clearTimeout(debounceNameTimer);

    if (val) {
      const timer = setTimeout(async () => {
        setIsTranslatingName(true);
        try {
          const result = await translateMut.mutateAsync({ koreanText: val });
          setForm(f => ({ ...f, recipientNameEn: result.englishText }));
        } catch (error) {
          console.error("Translation error:", error);
        } finally {
          setIsTranslatingName(false);
        }
      }, 1000);
      setDebounceNameTimer(timer);
    } else {
      setForm(f => ({ ...f, recipientNameEn: "" }));
    }
  }, [debounceNameTimer, translateMut]);

  if (orderComplete) {
    const isBankTransfer = orderComplete.paymentMethod === "bank_transfer";
    return (
      <Layout>
        <div className="container py-16 max-w-lg mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <h1 className="text-2xl font-bold mb-2">주문이 완료되었습니다</h1>
            <p className="text-muted-foreground mb-1">주문번호: <span className="font-mono font-semibold">{formatOrderNumber(orderComplete.orderNumber)}</span></p>
          </div>

          {isBankTransfer && orderComplete.bankAccount && (
            <div className="mb-8 rounded-xl border-2 border-amber-300 bg-amber-50 p-6">
              <h2 className="font-bold text-amber-800 text-lg mb-4 flex items-center gap-2">
                <span>📌</span> 입금 계좌 안내
              </h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-amber-200">
                  <tr><td className="py-2 text-amber-700 font-medium w-24">입금 계좌</td><td className="py-2 font-semibold">{orderComplete.bankAccount.bankName} {orderComplete.bankAccount.accountNumber}</td></tr>
                  <tr><td className="py-2 text-amber-700 font-medium">예금주</td><td className="py-2">{orderComplete.bankAccount.accountHolder}</td></tr>
                  <tr><td className="py-2 text-amber-700 font-medium">입금 금액</td><td className="py-2 font-bold text-lg">{(orderComplete.depositAmount ?? 0).toLocaleString()}원</td></tr>
                  <tr><td className="py-2 text-amber-700 font-medium">입금자명</td><td className="py-2">{orderComplete.depositorName}</td></tr>
                  {orderComplete.expiresAt && (
                    <tr><td className="py-2 text-amber-700 font-medium">입금 기한</td><td className="py-2 text-red-600 font-semibold">{orderComplete.expiresAt.toLocaleString("ko-KR")}</td></tr>
                  )}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-amber-700 bg-amber-100 rounded p-3">
                ⚠️ 입금 기한 내에 입금하지 않으면 주문이 자동으로 취소됩니다.<br />
                입금자명과 주문자명이 다를 경우 확인이 지연될 수 있습니다.
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center mb-6">주문 내역은 마이페이지에서 확인하실 수 있습니다.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline"><Link href="/mypage/orders">주문내역 보기</Link></Button>
            <Button asChild><Link href="/products">쇼핑 계속하기</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  const buildOrderData = (effZipCode: string, effAddress1: string, effAddressEn1: string) => ({
    items: items.map(item => ({
      productId: item.productId,
      productName: item.product?.name ?? "",
      productThumbnail: item.product?.thumbnail ?? undefined,
      price: (item as any).optionPrice ?? item.product?.salePrice ?? item.product?.price ?? 0,
      quantity: item.quantity,
      options: item.options ?? undefined,
    })),
    ...form,
    zipCode: effZipCode,
    address1: effAddress1,
    address2: form.address2 || addressData.address2 || undefined,
    addressEn1: effAddressEn1 || undefined,
    addressEn2: form.addressEn2 || addressData.addressEn2 || undefined,
    memo: form.memo || undefined,
    recipientNameEn: form.recipientNameEn || undefined,
    userCouponId: selectedCouponId ?? undefined,
    promoCodeId: appliedPromo?.id ?? undefined,
    paymentMethod: form.paymentMethod as any,
    depositorName: form.paymentMethod === "bank_transfer" ? form.depositorName : undefined,
    bankAccountId: form.paymentMethod === "bank_transfer" && form.bankAccountId ? form.bankAccountId : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effZipCode = form.zipCode || addressData.zipCode || "";
    const effAddress1 = form.address1 || addressData.address1 || "";
    const effAddressEn1 = form.addressEn1 || addressData.addressEn1 || "";
    if (effZipCode && effAddress1 && !form.zipCode) {
      setForm(f => ({ ...f, zipCode: effZipCode, address1: effAddress1, addressEn1: effAddressEn1, address2: addressData.address2 || f.address2, addressEn2: addressData.addressEn2 || f.addressEn2 }));
    }
    if (!form.recipientName) { toast.error("수령인을 입력해주세요"); return; }
    if (!form.recipientPhone) { toast.error("연락처를 입력해주세요"); return; }
    if (!effZipCode || !effAddress1) { toast.error("배송지 주소를 검색해주세요"); return; }
    if (!effAddressEn1) { toast.error("영문 주소를 확인해주세요. 국제배송에 영문 주소가 필요합니다."); return; }
    if (items.length === 0) { toast.error("장바구니가 비어있습니다"); return; }
    if (!form.paymentMethod) { toast.error("결제 방식을 선택해주세요"); return; }

    if (form.paymentMethod === "bank_transfer") {
      if (!form.depositorName) { toast.error("입금자명을 입력해주세요"); return; }
      if (!form.bankAccountId) { toast.error("입금 계좌를 선택해주세요"); return; }
      createOrder.mutate(buildOrderData(effZipCode, effAddress1, effAddressEn1));
      return;
    }

    // 그누보드 방식: 카드 정보 → 서버에서 직접 결제 → 주문 저장
    if (form.paymentMethod === "stripe") {
      if (!stripeCardRef.current) {
        toast.error("카드 입력 폼을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      setIsStripeProcessing(true);
      try {
        // 1. 카드 정보에서 PaymentMethod 생성 (클라이언트)
        const paymentMethodId = await stripeCardRef.current.createPaymentMethod();

        // 2. 서버에서 직접 결제 처리 (Stripe metadata: 주문번호만 기록, 개인정보 미전송)
        const result = await chargeWithPaymentMethod.mutateAsync({ paymentMethodId, amount: total });

        // 3. 3DS 인증이 필요한 경우 (일부 해외 카드)
        if (result.requiresAction && result.clientSecret) {
          const stripe = await loadStripe(stripeKeyData!.publishableKey);
          const { error } = await stripe!.handleNextAction({ clientSecret: result.clientSecret });
          if (error) throw new Error(error.message ?? "3D Secure 인증 실패");
        }

        // 4. 결제 완료 → 주문 저장 (Stripe와 동일한 주문번호 사용)
        const orderData = {
          ...buildOrderData(effZipCode, effAddress1, effAddressEn1),
          preGeneratedOrderNumber: result.orderNumber,
        };
        createOrder.mutate(orderData, {
          onSuccess: (data) => {
            setOrderComplete({ orderNumber: data.orderNumber, paymentMethod: "stripe" });
            toast.success("결제 및 주문이 완료되었습니다");
          },
          onError: (err) => toast.error("주문 저장 오류: " + err.message),
        });
      } catch (err: any) {
        toast.error(err.message ?? "결제 중 오류가 발생했습니다");
      } finally {
        setIsStripeProcessing(false);
      }
      return;
    }

    createOrder.mutate(buildOrderData(effZipCode, effAddress1, effAddressEn1));
  };

  const formatCouponLabel = (coupon: { name: string; discountType: string; discountValue: number; maxDiscountAmount: number | null }) => {
    if (coupon.discountType === "percent") {
      const maxStr = coupon.maxDiscountAmount ? ` (최대 ${formatPrice(coupon.maxDiscountAmount)})` : "";
      return `${coupon.name} - ${coupon.discountValue}% 할인${maxStr}`;
    }
    return `${coupon.name} - ${formatPrice(coupon.discountValue)} 할인`;
  };

  const defaultAddr = addresses?.find(a => a.isDefault) ?? addresses?.[0];

  return (
    <Layout>
      <div className="container py-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">주문서 작성</h1>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping */}
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-semibold mb-4">배송 정보</h2>

                {/* 저장된 배송지 선택 드롭다운 */}
                {addresses && addresses.length > 0 && (
                  <div className="mb-5 p-3 bg-muted/40 rounded-lg border">
                    <label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 저장된 배송지에서 선택
                    </label>
                    <select
                      className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary mt-1"
                      value={selectedAddressId === "new" ? "new" : String(selectedAddressId)}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "new") {
                          setSelectedAddressId("new");
                        } else {
                          const id = Number(val);
                          setSelectedAddressId(id);
                          const addr = addresses.find(a => a.id === id);
                          if (addr) fillAddress(addr);
                        }
                      }}
                    >
                      <option value="new">✏️ 직접 입력</option>
                      {addresses.map(addr => (
                        <option key={addr.id} value={String(addr.id)}>
                          {addr.isDefault ? "⭐ " : ""}{addr.name} — {addr.recipient} / {addr.address1}{addr.address2 ? ` ${addr.address2}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 국제배송 무료배송 안내 */}
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <Truck className="w-4 h-4 shrink-0" />
                  <span>국제배송 <strong>무료배송</strong> | 예상 배송일: 7~14일</span>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <Label className="text-sm mb-1.5 block">수령인</Label>
                    <Input
                      value={form.recipientName}
                      onChange={handleRecipientNameChange}
                      placeholder="이름"
                    />
                  </div>

                  <div>
                    <Label className="text-sm mb-1.5 block">수령인(영문명)</Label>
                    <div className="relative">
                      <Input
                        value={form.recipientNameEn}
                        onChange={e => setForm(f => ({ ...f, recipientNameEn: e.target.value }))}
                        placeholder="영문 이름 (예: Hong Gildong)"
                        className="text-sm"
                      />
                      {isTranslatingName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">국제배송을 위해 영문 이름이 필요합니다. 자동 변환되며 직접 수정도 가능합니다.</p>
                  </div>

                  <div>
                    <Label className="text-sm mb-1.5 block">연락처</Label>
                    <Input
                      value={form.recipientPhone}
                      onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))}
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>

                {/* 한국 주소 검색 + 영문 주소 변환 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">배송지 주소</Label>
                  <KoreanAddressSearch
                    value={addressData}
                    onChange={handleAddressChange}
                    showEnglishPreview={true}
                    compact={true}
                  />
                </div>

                <div className="mt-4">
                  <Label className="text-sm mb-1.5 block">배송 메모</Label>
                  <Textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="배송시 요청사항" rows={2} />
                </div>

              </div>

              {/* Items */}
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-semibold mb-4">주문 상품 ({items.length})</h2>
                <div className="space-y-3">
                  {items.map(item => {
                    const product = item.product as any;
                    const basePrice = ((item as any).optionPrice ?? product?.salePrice ?? product?.price ?? 0) * item.quantity;
                    const itemDiscount = itemCouponDiscounts[item.id] ?? 0;
                    const isNoDiscount = product?.noDiscount === 1;
                    const finalPrice = basePrice - itemDiscount;
                    return (
                      <div key={item.id} className="flex gap-3 items-start">
                        <div className="w-14 h-14 rounded-lg bg-secondary/30 overflow-hidden shrink-0">
                          {product?.thumbnail ? <img src={proxyImage(product.thumbnail)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-5 h-5 opacity-20" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{product?.name}</p>
                          <p className="text-xs text-muted-foreground">수량: {item.quantity}</p>
                          {selectedCoupon && isNoDiscount && (
                            <span className="inline-block text-[11px] text-orange-500 font-medium bg-orange-50 dark:bg-orange-950/20 px-1.5 py-0.5 rounded mt-0.5">할인 제외 상품</span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {itemDiscount > 0 ? (
                            <>
                              <p className="text-xs text-muted-foreground line-through">{formatPrice(basePrice)}</p>
                              <p className="text-xs text-destructive font-medium">-{formatPrice(itemDiscount)}</p>
                              <p className="text-sm font-bold text-primary price-text">{formatPrice(finalPrice)}</p>
                            </>
                          ) : (
                            <span className="text-sm font-bold price-text">{formatPrice(basePrice)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4" /> 결제 방식</h2>
                {enabledMethods && enabledMethods.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {enabledMethods.map(method => {
                      const icons: Record<string, any> = {
                        stripe: CreditCard,
                        airwallex: CreditCard,
                        "2checkout": CreditCard,
                        payoneer: CreditCard,
                        bank_transfer: Banknote,
                      };
                      const labels: Record<string, string> = {
                        stripe: "Stripe",
                        airwallex: "Airwallex",
                        "2checkout": "2Checkout",
                        payoneer: "Payoneer",
                        bank_transfer: "무통장 입금",
                      };
                      const Icon = icons[method.methodCode] || CreditCard;
                      const label = labels[method.methodCode] || method.methodName;
                      
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, paymentMethod: method.methodCode }))}
                          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                            form.paymentMethod === method.methodCode
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${form.paymentMethod === method.methodCode ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-sm font-medium ${form.paymentMethod === method.methodCode ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">사용 가능한 결제 수단이 없습니다. 관리자에게 문의하세요.</p>
                )}

                {/* 신용카드 선택 시 카드 입력창 바로 표시 (그누보드 방식) */}
                {form.paymentMethod === "stripe" && stripeKeyData?.publishableKey && (
                  <div className="mt-4 pt-4 border-t">
                    <StripeCardInput
                      ref={stripeCardRef}
                      publishableKey={stripeKeyData.publishableKey}
                    />
                  </div>
                )}

                {/* 무통장 입금 선택 시 추가 입력 */}
                {form.paymentMethod === "bank_transfer" && (
                  <div className="mt-4 space-y-3 pt-4 border-t">
                    <div>
                      <Label className="text-sm mb-1.5 block">입금자명 *</Label>
                      <Input
                        value={form.depositorName}
                        onChange={e => setForm(f => ({ ...f, depositorName: e.target.value }))}
                        placeholder="입금하실 분의 성함을 입력해주세요"
                      />
                      <p className="text-xs text-muted-foreground mt-1">입금자명이 주문자명과 다를 경우 입금 확인이 지연될 수 있습니다.</p>
                    </div>
                    <div>
                      <Label className="text-sm mb-1.5 block">입금 계좌 선택 *</Label>
                      {bankAccounts && bankAccounts.length > 0 ? (
                        <div className="space-y-2">
                          {bankAccounts.map(account => (
                            <button
                              key={account.id}
                              type="button"
                              onClick={() => setForm(f => ({ ...f, bankAccountId: account.id }))}
                              className={`w-full text-left p-3 border rounded-lg transition-all ${
                                form.bankAccountId === account.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <p className="font-medium text-sm">{account.bankName}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{account.accountNumber}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">예금주: {account.accountHolder}</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">사용 가능한 입금 계좌가 없습니다.</p>
                      )}
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800 leading-relaxed">
                        ⚠️ 주문 후 48시간 이내에 입금하지 않으시면 주문이 자동으로 취소됩니다.<br />
                        입금 확인 후 상품 준비를 시작하며, 배송 시작 시 별도로 안내드립니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon / Promo Code */}
              <div className="bg-card border rounded-xl p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Ticket className="w-4 h-4" /> 쿠폰 / 프로모코드 적용</h2>

                {/* Promo Code 입력 */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> 프로모코드 (할인코드)</p>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">{appliedPromo.name}</p>
                        <p className="text-xs text-primary font-semibold">-{formatPrice(promoDiscount)} 할인</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setAppliedPromo(null); setPromoCode(""); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="프로모코드를 입력하세요"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), promoCode.trim() && handleApplyPromo())}
                        className="flex-1 font-mono tracking-wider"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => promoCode.trim() && handleApplyPromo()}
                        disabled={!promoCode.trim() || validatePromo.isFetching}
                      >
                        {validatePromo.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "적용"}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="mb-4" />

                {/* 보유 쿠폰 선택 */}
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Ticket className="w-3 h-3" /> 보유 쿠폰</p>
                {selectedCoupon ? (
                  <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{selectedCoupon.coupon.name}</p>
                      <p className="text-xs text-primary font-semibold">-{formatPrice(couponDiscount)} 할인</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedCouponId(null); setShowCouponSelect(false); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setShowCouponSelect(!showCouponSelect)}>
                      <span className="text-muted-foreground">
                        {availableCoupons && availableCoupons.length > 0 ? `사용 가능한 쿠폰 ${availableCoupons.length}장` : "사용 가능한 쿠폰이 없습니다"}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showCouponSelect ? "rotate-180" : ""}`} />
                    </Button>
                    {showCouponSelect && availableCoupons && availableCoupons.length > 0 && (
                      <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
                        {availableCoupons.map(uc => (
                          <button
                            key={uc.id}
                            type="button"
                            className="w-full text-left p-3 hover:bg-secondary/50 transition-colors"
                            onClick={() => { setSelectedCouponId(uc.id); setShowCouponSelect(false); }}
                          >
                            <p className="text-sm font-medium">{formatCouponLabel(uc.coupon)}</p>
                            {uc.coupon.minOrderAmount > 0 && (
                              <p className="text-xs text-muted-foreground">{formatPrice(uc.coupon.minOrderAmount)} 이상 구매 시</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Points */}
              {profile && profile.points > 0 && (
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="font-semibold mb-4">포인트 사용</h2>
                  <div className="flex items-center gap-3">
                    <Input type="number" min={0} max={Math.min(profile.points, subtotal)} value={form.pointsUsed} onChange={e => setForm(f => ({ ...f, pointsUsed: Math.min(Number(e.target.value) || 0, profile.points, subtotal) }))} className="w-40" />
                    <span className="text-sm text-muted-foreground">보유: {profile.points.toLocaleString()}P</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, pointsUsed: Math.min(profile.points, subtotal) }))}>전액사용</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <div className="bg-card border rounded-xl p-6 sticky top-24">
                <h3 className="font-semibold mb-4">결제 요약</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">상품금액</span><span className="price-text">{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">배송비 (국제배송)</span><span className="text-emerald-600 font-medium">무료</span></div>
                  {promoDiscount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">프로모코드 할인</span><span className="text-destructive price-text">-{formatPrice(promoDiscount)}</span></div>}
                  {couponDiscount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">쿠폰 할인</span><span className="text-destructive price-text">-{formatPrice(couponDiscount)}</span></div>}
                  {form.pointsUsed > 0 && <div className="flex justify-between"><span className="text-muted-foreground">포인트 할인</span><span className="text-destructive price-text">-{formatPrice(form.pointsUsed)}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg"><span>총 결제금액</span><span className="text-primary price-text">{formatPrice(total)}</span></div>
                </div>
                <Button type="submit" className="w-full mt-6" size="lg" disabled={createOrder.isPending || isStripeProcessing}>
                  {(createOrder.isPending || isStripeProcessing) ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isStripeProcessing ? "카드 결제 처리중..." : "주문 처리중..."}</>
                  ) : `${formatPrice(total)} 결제하기`}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center mt-3">주문 완료 시 이용약관에 동의한 것으로 간주합니다.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
