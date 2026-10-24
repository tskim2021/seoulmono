import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useCart } from "../store/cart";
import { useCreateOrder, useGetAddresses, useCreateAddress, useDeleteAddress, getGetAddressesQueryKey, useGetBankSettings, useGetMe, customFetch } from "@workspace/api-client-react";
import type { DeliveryAddress } from "@workspace/api-client-react";
import { Button, Card, Input } from "../components/ui";
import { formatCurrency } from "../lib/utils";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, X, MapPin, Mail, User, Check, Building2, Ticket, Coins } from "lucide-react";
import { toast } from "../hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    daum: any;
  }
}

function AddressForm({ initial, onSave, onCancel }: {
  initial?: DeliveryAddress | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    ad_subject: initial?.ad_subject || "",
    ad_name: initial?.ad_name || "",
    ad_hp: initial?.ad_hp || "",
    ad_addr1: initial?.ad_addr1 || "",
    ad_addr2: initial?.ad_addr2 || "",
    ad_addr3: initial?.ad_addr3 || "",
    ad_zip1: initial?.ad_zip ? initial.ad_zip.substring(0, 3) : "",
    ad_zip2: initial?.ad_zip ? initial.ad_zip.substring(3) : "",
    ad_default: initial?.ad_default === 1,
  });

  const searchAddress = () => {
    if (!window.daum?.Postcode) {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => openPostcode();
      document.head.appendChild(script);
    } else {
      openPostcode();
    }
  };

  const openPostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const zip = data.zonecode || "";
        setForm(f => ({
          ...f,
          ad_addr1: data.roadAddress || data.jibunAddress || "",
          ad_addr3: data.buildingName ? ` (${data.buildingName})` : "",
          ad_zip1: zip.substring(0, 3),
          ad_zip2: zip.substring(3),
        }));
      }
    }).open();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">배송지명</label>
        <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="예: 회사, 물류센터"
          value={form.ad_subject} onChange={e => setForm(f => ({ ...f, ad_subject: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">수령인 <span className="text-red-500">*</span></label>
        <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="수령인 이름"
          value={form.ad_name} onChange={e => setForm(f => ({ ...f, ad_name: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">연락처</label>
        <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="010-0000-0000"
          value={form.ad_hp} onChange={e => setForm(f => ({ ...f, ad_hp: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">주소 <span className="text-red-500">*</span></label>
        <div className="flex gap-2 mb-2">
          <input className="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50" placeholder="우편번호"
            value={form.ad_zip1 ? `${form.ad_zip1}${form.ad_zip2}` : ""} readOnly />
          <button type="button" onClick={searchAddress}
            className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 whitespace-nowrap">
            주소 검색
          </button>
        </div>
        <input className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 mb-2" placeholder="기본주소"
          value={form.ad_addr1} readOnly />
        <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="상세주소 입력"
          value={form.ad_addr2} onChange={e => setForm(f => ({ ...f, ad_addr2: e.target.value }))} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.ad_default}
          onChange={e => setForm(f => ({ ...f, ad_default: e.target.checked }))}
          className="w-4 h-4 rounded border-slate-300" />
        <span className="text-sm text-slate-600">기본 배송지로 설정</span>
      </label>
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={() => {
          if (!form.ad_name.trim()) { toast({ title: "수령인을 입력해주세요", variant: "destructive" }); return; }
          if (!form.ad_addr1.trim()) { toast({ title: "주소를 입력해주세요", variant: "destructive" }); return; }
          onSave(form);
        }}>저장</Button>
        <Button variant="outline" onClick={onCancel}>취소</Button>
      </div>
    </div>
  );
}

function OrderModal({ onClose, onSubmit, isPending, totalPrice }: {
  onClose: () => void;
  onSubmit: (data: { ad_id?: number; send_cost: number; bill_name: string; bill_hp: string; bill_email: string; memo: string; coupon_no?: number; use_point?: number }) => void;
  isPending: boolean;
  totalPrice: number;
}) {
  const { data: addresses = [], refetch } = useGetAddresses();
  const { data: bankSettings } = useGetBankSettings();
  const { data: me } = useGetMe({ query: { staleTime: 0 } });
  const queryClient = useQueryClient();
  const createAddr = useCreateAddress();
  const deleteAddr = useDeleteAddress();

  const { data: couponsData } = useQuery({
    queryKey: ["my-coupons"],
    queryFn: () => customFetch<{ coupons: any[] }>("/api/my/coupons"),
  });
  const availableCoupons = (couponsData?.coupons || []).filter((c: any) => !c.is_expired);

  const [selectedAddrId, setSelectedAddrId] = useState<number | undefined>();
  const [showAddForm, setShowAddForm] = useState(false);
  const [sendCost, setSendCost] = useState(0);
  const [sendCostType, setSendCostType] = useState<"착불" | "선불" | "직접입력">("착불");
  const [customCost, setCustomCost] = useState("");
  const [billName, setBillName] = useState("");
  const [billHp, setBillHp] = useState("");
  const [billEmail, setBillEmail] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedCouponNo, setSelectedCouponNo] = useState<number | undefined>();
  const [usePointStr, setUsePointStr] = useState("");

  const myPoint = Number(me?.mb_point || 0);
  const selectedCoupon = availableCoupons.find((c: any) => c.cp_no === selectedCouponNo);

  let couponDiscount = 0;
  if (selectedCoupon) {
    if (selectedCoupon.cp_type === 1) {
      couponDiscount = Math.floor(totalPrice * selectedCoupon.cp_price / 100);
      if (selectedCoupon.cp_maximum > 0 && couponDiscount > selectedCoupon.cp_maximum) couponDiscount = selectedCoupon.cp_maximum;
    } else {
      couponDiscount = Math.min(selectedCoupon.cp_price, totalPrice);
    }
  }
  const afterCoupon = totalPrice + sendCost - couponDiscount;
  const usePoint = Math.min(Number(usePointStr) || 0, myPoint, afterCoupon > 0 ? afterCoupon : 0);
  const finalTotal = Math.max(0, afterCoupon - usePoint);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddrId) {
      const def = addresses.find((a: DeliveryAddress) => a.ad_default === 1);
      setSelectedAddrId(def ? def.ad_id : addresses[0].ad_id);
    }
  }, [addresses, selectedAddrId]);

  useEffect(() => {
    if (sendCostType === "착불") setSendCost(0);
    else if (sendCostType === "직접입력") setSendCost(Number(customCost) || 0);
  }, [sendCostType, customCost]);

  const handleSaveAddress = async (formData: any) => {
    try {
      await createAddr.mutateAsync({ data: formData });
      queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() });
      setShowAddForm(false);
      refetch();
    } catch {
      toast({ title: "배송지 저장 실패", variant: "destructive" });
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("배송지를 삭제하시겠습니까?")) return;
    try {
      await deleteAddr.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() });
      if (selectedAddrId === id) setSelectedAddrId(undefined);
      refetch();
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900">발주 정보 확인</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> 배송지
              </h3>
              <button onClick={() => setShowAddForm(true)}
                className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> 새 배송지
              </button>
            </div>

            {showAddForm && (
              <div className="mb-4 p-4 bg-slate-50 rounded-xl border">
                <h4 className="font-semibold text-sm mb-3">새 배송지 추가</h4>
                <AddressForm onSave={handleSaveAddress} onCancel={() => setShowAddForm(false)} />
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {addresses.map((addr: DeliveryAddress) => (
                <div key={addr.ad_id}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedAddrId === addr.ad_id ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setSelectedAddrId(addr.ad_id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAddrId === addr.ad_id ? "border-primary bg-primary" : "border-slate-300"
                      }`}>
                        {selectedAddrId === addr.ad_id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{addr.ad_name}</span>
                          {addr.ad_subject && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{addr.ad_subject}</span>}
                          {addr.ad_default === 1 && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-medium">기본</span>}
                        </div>
                        <p className="text-sm text-slate-600">{addr.ad_addr1} {addr.ad_addr2} {addr.ad_addr3}</p>
                        {addr.ad_hp && <p className="text-xs text-slate-500 mt-0.5">{addr.ad_hp}</p>}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.ad_id); }}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {addresses.length === 0 && !showAddForm && (
                <div className="text-center py-6 text-slate-400 text-sm">
                  등록된 배송지가 없습니다. 새 배송지를 추가해주세요.
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-800 mb-3">배송비</h3>
            <div className="flex gap-2">
              {(["착불", "선불", "직접입력"] as const).map(type => (
                <button key={type}
                  onClick={() => setSendCostType(type)}
                  className={`px-4 py-2 text-sm rounded-lg border-2 font-medium transition-all ${
                    sendCostType === type ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}>
                  {type}
                </button>
              ))}
            </div>
            {sendCostType === "착불" && (
              <p className="text-sm text-slate-500 mt-2">배송비를 수령 시 지불합니다.</p>
            )}
            {sendCostType === "선불" && (
              <div className="mt-2">
                <p className="text-sm text-slate-500">배송비가 주문금액에 포함됩니다.</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[3000, 5000, 10000].map(cost => (
                    <button key={cost}
                      onClick={() => { setSendCost(cost); }}
                      className={`px-3 py-1.5 text-sm rounded-lg border ${
                        sendCost === cost ? "border-primary bg-primary/10 text-primary font-medium" : "border-slate-200"
                      }`}>
                      {formatCurrency(cost)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sendCostType === "직접입력" && (
              <div className="mt-2">
                <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="배송비 금액 입력" value={customCost}
                  onChange={e => setCustomCost(e.target.value)} />
              </div>
            )}
          </section>

          {(availableCoupons.length > 0 || myPoint > 0) && (
            <section>
              <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-600" /> 쿠폰 / 포인트 사용
              </h3>
              <div className="space-y-3">
                {availableCoupons.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">쿠폰 선택</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={selectedCouponNo ?? ""}
                      onChange={e => setSelectedCouponNo(e.target.value ? Number(e.target.value) : undefined)}
                    >
                      <option value="">사용 안 함</option>
                      {availableCoupons.map((c: any) => {
                        const minOk = c.cp_minimum <= 0 || totalPrice >= c.cp_minimum;
                        const discLabel = c.cp_type === 1 ? `${c.cp_price}% 할인` : `${c.cp_price.toLocaleString()}원 할인`;
                        return (
                          <option key={c.cp_no} value={c.cp_no} disabled={!minOk}>
                            {c.cp_subject} ({discLabel}){!minOk ? ` — 최소 ${c.cp_minimum.toLocaleString()}원` : ""}
                          </option>
                        );
                      })}
                    </select>
                    {selectedCoupon && couponDiscount > 0 && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">쿠폰 할인: -{formatCurrency(couponDiscount)}</p>
                    )}
                  </div>
                )}
                {myPoint > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      포인트 사용 <span className="text-slate-400 font-normal">(보유: {myPoint.toLocaleString()}P)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        placeholder="사용할 포인트"
                        min="0"
                        max={myPoint}
                        value={usePointStr}
                        onChange={e => setUsePointStr(e.target.value)}
                      />
                      <button
                        className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 font-medium"
                        onClick={() => setUsePointStr(String(Math.min(myPoint, afterCoupon > 0 ? afterCoupon : myPoint)))}
                      >
                        전액 사용
                      </button>
                    </div>
                    {usePoint > 0 && (
                      <p className="text-xs text-blue-600 font-medium mt-1">포인트 차감: -{formatCurrency(usePoint)}</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> 세금계산서 정보
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">담당자명</label>
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="세금계산서 담당자"
                  value={billName} onChange={e => setBillName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">연락처</label>
                <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="010-0000-0000"
                  value={billHp} onChange={e => setBillHp(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">이메일</label>
                <input type="email" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="example@company.com"
                  value={billEmail} onChange={e => setBillEmail(e.target.value)} />
              </div>
            </div>
          </section>

          {bankSettings && (bankSettings.bank_name || bankSettings.account_number) && (
            <section>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900">무통장입금 계좌 안내</h4>
                </div>
                <div className="space-y-1.5 text-sm">
                  {bankSettings.bank_name && <p className="text-blue-800"><span className="font-semibold">은행:</span> {bankSettings.bank_name}</p>}
                  {bankSettings.account_number && <p className="text-blue-800"><span className="font-semibold">계좌번호:</span> {bankSettings.account_number}</p>}
                  {bankSettings.account_holder && <p className="text-blue-800"><span className="font-semibold">예금주:</span> {bankSettings.account_holder}</p>}
                  {bankSettings.memo && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-blue-700 text-sm leading-relaxed [&_p]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: bankSettings.memo }} />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-base font-bold text-slate-800 mb-3">요청사항</h3>
            <textarea className="w-full p-3 rounded-xl border text-sm resize-none" rows={3}
              placeholder="배송 관련 요청사항을 입력해주세요."
              value={memo} onChange={e => setMemo(e.target.value)} />
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-5 space-y-3">
          <div className="text-sm space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>상품금액</span><span>{formatCurrency(totalPrice)}</span>
            </div>
            {sendCost > 0 && <div className="flex justify-between"><span>배송비</span><span>{formatCurrency(sendCost)}</span></div>}
            {couponDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>쿠폰 할인</span><span>-{formatCurrency(couponDiscount)}</span></div>}
            {usePoint > 0 && <div className="flex justify-between text-blue-600"><span>포인트 사용</span><span>-{formatCurrency(usePoint)}</span></div>}
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-base">
              <span>최종 결제금액</span><span className="text-primary text-lg">{formatCurrency(finalTotal)}</span>
            </div>
          </div>
          <Button size="lg" className="w-full h-14 text-lg" disabled={isPending}
            onClick={() => onSubmit({ ad_id: selectedAddrId, send_cost: sendCost, bill_name: billName, bill_hp: billHp, bill_email: billEmail, memo, coupon_no: selectedCouponNo, use_point: usePoint || undefined })}>
            {isPending ? "주문 처리 중..." : "발주 신청하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [, setLocation] = useLocation();
  const { items, removeItem, updateQty, getTotal, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();

  const handleOrder = (data: { ad_id?: number; send_cost: number; bill_name: string; bill_hp: string; bill_email: string; memo: string; coupon_no?: number; use_point?: number }) => {
    if (items.length === 0) return;

    createOrder({
      data: {
        items: items.map(i => ({ it_id: i.it_id, qty: i.cart_qty, price: i.it_price })),
        memo: data.memo.trim() || undefined,
        ad_id: data.ad_id,
        send_cost: data.send_cost,
        bill_name: data.bill_name.trim() || undefined,
        bill_hp: data.bill_hp.trim() || undefined,
        bill_email: data.bill_email.trim() || undefined,
        coupon_no: data.coupon_no,
        use_point: data.use_point,
      }
    }, {
      onSuccess: () => {
        toast({ title: "주문이 완료되었습니다", variant: "default" });
        clearCart();
        setShowOrderModal(false);
        setLocation("/orders");
      },
      onError: (err: any) => {
        toast({ title: "주문 실패", description: err?.data?.error || err?.message || "오류가 발생했습니다", variant: "destructive" });
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 premium-shadow">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">장바구니가 비어있습니다</h2>
        <p className="text-slate-500 mb-8">상품목록에서 필요하신 상품을 담아주세요.</p>
        <Link href="/">
          <Button size="lg">상품 담으러 가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">장바구니</h1>
        <p className="text-slate-500 mt-2 font-medium">선택하신 상품 내역을 확인하고 발주를 진행해주세요.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden premium-shadow">
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-500">
              <div className="col-span-6">상품정보</div>
              <div className="col-span-3 text-center">수량</div>
              <div className="col-span-2 text-right">주문금액</div>
              <div className="col-span-1 text-center">삭제</div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {items.map(item => (
                <div key={item.it_id} className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
                  <div className="col-span-1 sm:col-span-6 flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.it_img1 ? (
                        <img src={item.it_img1} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No img</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight mb-1">{item.it_name}</h4>
                      <p className="text-slate-500 font-medium">{formatCurrency(item.it_price)}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-1 sm:col-span-3 flex items-center justify-between sm:justify-center">
                    <span className="sm:hidden text-sm font-bold text-slate-500">수량: </span>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => updateQty(item.it_id, item.cart_qty - 1)}
                        className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-0.5 px-1">
                        <span className="text-xs text-blue-600 font-bold">박스</span>
                        <input 
                          type="number" 
                          className="w-10 text-center font-bold bg-transparent border-none focus:ring-0 p-0"
                          value={item.cart_qty}
                          onChange={(e) => updateQty(item.it_id, parseInt(e.target.value) || 1)}
                          min={1}
                        />
                      </div>
                      <button 
                        onClick={() => updateQty(item.it_id, item.cart_qty + 1)}
                        className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 flex justify-between sm:justify-end items-center">
                    <span className="sm:hidden text-sm font-bold text-slate-500">금액: </span>
                    <span className="font-black text-slate-900 text-lg">{formatCurrency(item.it_price * item.cart_qty)}</span>
                  </div>

                  <div className="col-span-1 sm:col-span-1 flex justify-end sm:justify-center">
                    <button 
                      onClick={() => removeItem(item.it_id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-96 shrink-0">
          <Card className="p-6 sticky top-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">주문 결제 정보</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>총 상품금액 ({items.length}종 / {items.reduce((s, i) => s + i.cart_qty, 0)}박스)</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium pb-4 border-b border-slate-100">
                <span>배송비</span>
                <span className="text-sm text-slate-400">주문 시 선택</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="font-bold text-slate-900">상품 합계</span>
                <span className="text-3xl font-black text-primary">{formatCurrency(getTotal())}</span>
              </div>
            </div>

            <Button size="lg" className="w-full h-14 text-lg" onClick={() => setShowOrderModal(true)}>
              발주 신청하기 <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        </div>
      </div>

      {showOrderModal && (
        <OrderModal
          onClose={() => setShowOrderModal(false)}
          onSubmit={handleOrder}
          isPending={isPending}
          totalPrice={getTotal()}
        />
      )}
    </div>
  );
}
