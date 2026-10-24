import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetBankSettings, useUpdateBankSettings, getGetBankSettingsQueryKey, customFetch } from "@workspace/api-client-react";
import { Card, Button } from "../components/ui";
import { Building2, Save, Loader2, Gift, Ticket, ArrowRight, CreditCard, ToggleLeft, ToggleRight, FileText, Phone, MapPin, MessageCircle } from "lucide-react";
import { toast } from "../hooks/use-toast";
import { useLocation } from "wouter";
import RichMemoEditor from "../components/RichMemoEditor";

export default function AdminBankSettings() {
  const [, navigate] = useLocation();
  const { data: settings, isLoading } = useGetBankSettings();
  const updateSettings = useUpdateBankSettings();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
    account_holder: "",
    memo: "",
  });

  // 결제수단 설정
  const [payForm, setPayForm] = useState({
    bank_enabled: true,
    card_enabled: false,
    portone_imp_code: "",
    inicis_mid: "",
  });

  const { data: paySettingsData } = useQuery({
    queryKey: ["settings-payment"],
    queryFn: () => customFetch<{ bank_enabled: boolean; card_enabled: boolean; portone_imp_code: string; inicis_mid: string }>("/api/settings/payment"),
  });

  useEffect(() => {
    if (paySettingsData) {
      setPayForm({
        bank_enabled: paySettingsData.bank_enabled ?? true,
        card_enabled: paySettingsData.card_enabled ?? false,
        portone_imp_code: paySettingsData.portone_imp_code || "",
        inicis_mid: paySettingsData.inicis_mid || "",
      });
    }
  }, [paySettingsData]);

  const updatePaySettings = useMutation({
    mutationFn: (data: typeof payForm) =>
      customFetch("/api/settings/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-payment"] });
      toast({ title: "결제수단 설정이 저장되었습니다" });
    },
    onError: () => {
      toast({ title: "저장 실패", variant: "destructive" });
    },
  });

  const { data: generalSettings, isLoading: isLoadingGeneral } = useQuery({
    queryKey: ["settings-general"],
    queryFn: () => customFetch<{ signup_point: number }>("/api/settings/general"),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["coupon-zones"],
    queryFn: () => customFetch<{ zones: any[] }>("/api/admin/coupon-zones"),
  });
  const couponZones = zonesData?.zones || [];

  const { data: signupCouponData } = useQuery({
    queryKey: ["settings-signup-coupon"],
    queryFn: () => customFetch<{ signup_coupon_id: number }>("/api/settings/signup-coupon"),
  });

  const [signupPointStr, setSignupPointStr] = useState("0");
  const [signupCouponId, setSignupCouponId] = useState(0);

  // 카카오 채널 추가 포인트
  const [kakaoPointStr, setKakaoPointStr] = useState("1000");
  const { data: shopAdminSettings } = useQuery({
    queryKey: ["shop-admin-settings"],
    queryFn: () => customFetch<Record<string, string>>("/api/shop-admin/settings"),
  });
  useEffect(() => {
    if (shopAdminSettings?.kakao_channel_point !== undefined) {
      setKakaoPointStr(shopAdminSettings.kakao_channel_point);
    }
  }, [shopAdminSettings]);

  const updateKakaoPoint = useMutation({
    mutationFn: (data: { kakao_channel_point: string }) =>
      customFetch("/api/shop-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-admin-settings"] });
      toast({ title: "카카오 채널 추가 포인트가 저장되었습니다" });
    },
    onError: () => {
      toast({ title: "저장 실패", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (generalSettings) {
      setSignupPointStr(String(generalSettings.signup_point ?? 0));
    }
  }, [generalSettings]);

  useEffect(() => {
    if (signupCouponData) {
      setSignupCouponId(signupCouponData.signup_coupon_id ?? 0);
    }
  }, [signupCouponData]);

  const currentCoupon = couponZones.find((z: any) => z.cz_id === signupCouponId);

  const updateSignupCoupon = useMutation({
    mutationFn: (data: { signup_coupon_id: number }) =>
      customFetch("/api/settings/signup-coupon", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-signup-coupon"] });
      toast({ title: "신규 가입 쿠폰이 저장되었습니다" });
    },
    onError: () => {
      toast({ title: "저장 실패", variant: "destructive" });
    },
  });

  const updateGeneral = useMutation({
    mutationFn: (data: { signup_point: number }) =>
      customFetch("/api/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-general"] });
      toast({ title: "신규 가입 포인트가 저장되었습니다" });
    },
    onError: () => {
      toast({ title: "저장 실패", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        bank_name: settings.bank_name || "",
        account_number: settings.account_number || "",
        account_holder: settings.account_holder || "",
        memo: settings.memo || "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({ data: form });
      queryClient.invalidateQueries({ queryKey: getGetBankSettingsQueryKey() });
      toast({ title: "입금계좌 정보가 저장되었습니다" });
    } catch {
      toast({ title: "저장 실패", variant: "destructive" });
    }
  };

  // ── 사업자/푸터 정보 ──────────────────────────────────────────
  const [footerForm, setFooterForm] = useState({
    company: "", ceo: "", address: "", business_num: "",
    tel: "", online_num: "", privacy: "",
    cs_tel: "", cs_hours: "", cs_lunch: "",
  });
  const [footerLoaded, setFooterLoaded] = useState(false);

  const { data: footerData } = useQuery({
    queryKey: ["settings-footer-config"],
    queryFn: () => customFetch<Record<string, string>>("/api/settings/footer-config"),
  });

  useEffect(() => {
    if (footerData && !footerLoaded) {
      setFooterForm({
        company: footerData.company || "",
        ceo: footerData.ceo || "",
        address: footerData.address || "",
        business_num: footerData.business_num || "",
        tel: footerData.tel || "",
        online_num: footerData.online_num || "",
        privacy: footerData.privacy || "",
        cs_tel: footerData.cs_tel || "",
        cs_hours: footerData.cs_hours || "",
        cs_lunch: footerData.cs_lunch || "",
      });
      setFooterLoaded(true);
    }
  }, [footerData, footerLoaded]);

  const updateFooter = useMutation({
    mutationFn: (data: typeof footerForm) =>
      customFetch("/api/settings/footer-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-footer-config"] });
      toast({ title: "사업자 정보가 저장되었습니다" });
    },
    onError: () => {
      toast({ title: "저장 실패", variant: "destructive" });
    },
  });

  const setF = (key: keyof typeof footerForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFooterForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">시스템 설정</h1>
        <p className="text-slate-500 mt-2 font-medium">입금계좌 및 회원 관련 기본 설정을 관리합니다.</p>
      </div>

      {/* 결제수단 설정 */}
      <Card className="max-w-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">결제수단 설정</h2>
            <p className="text-sm text-slate-500">쇼핑몰 결제 방법을 활성화/비활성화합니다.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 무통장입금 토글 */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">무통장입금</p>
                <p className="text-xs text-slate-500">주문 후 계좌이체로 입금</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPayForm(f => ({ ...f, bank_enabled: !f.bank_enabled }))}
              className="flex items-center gap-2 text-sm font-semibold"
            >
              {payForm.bank_enabled
                ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              <span className={payForm.bank_enabled ? "text-emerald-600" : "text-slate-400"}>
                {payForm.bank_enabled ? "사용" : "미사용"}
              </span>
            </button>
          </div>

          {/* 신용카드 토글 */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">신용카드 (KG이니시스)</p>
                <p className="text-xs text-slate-500">이니시스 직접 연동 카드 결제</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPayForm(f => ({ ...f, card_enabled: !f.card_enabled }))}
              className="flex items-center gap-2 text-sm font-semibold"
            >
              {payForm.card_enabled
                ? <ToggleRight className="w-8 h-8 text-blue-500" />
                : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              <span className={payForm.card_enabled ? "text-blue-600" : "text-slate-400"}>
                {payForm.card_enabled ? "사용" : "미사용"}
              </span>
            </button>
          </div>

          {/* 카드 사용 시 이니시스 직접 연동 설정 */}
          {payForm.card_enabled && (
            <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">KG이니시스 직접 연동 설정</p>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  이니시스 상점아이디 (MID) <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="INIpayTest (테스트) 또는 실제 상점아이디"
                  value={payForm.inicis_mid}
                  onChange={e => setPayForm(f => ({ ...f, inicis_mid: e.target.value, portone_imp_code: e.target.value }))}
                />
              </div>
              <p className="text-xs text-blue-600">
                이니시스에서 발급받은 상점아이디(MID)를 입력하세요.<br />
                테스트 환경에서는 <strong>INIpayTest</strong>를 사용합니다.<br />
                운영 전환 시 서버 환경변수 INICIS_MID와 INICIS_SIGN_KEY도 설정해주세요.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
          <Button
            onClick={() => updatePaySettings.mutate(payForm)}
            disabled={updatePaySettings.isPending}
            className="flex items-center gap-2"
          >
            {updatePaySettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            저장하기
          </Button>
        </div>
      </Card>

      <Card className="max-w-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <Ticket className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">신규 가입 쿠폰</h2>
            <p className="text-sm text-slate-500">파트너사 신규 가입 승인 시 자동으로 발급되는 쿠폰</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">현재 설정된 쿠폰</label>
          {currentCoupon ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-xl">
              <Ticket className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-purple-900 text-sm">{currentCoupon.cz_subject}</p>
                <p className="text-xs text-purple-600 mt-0.5">
                  {currentCoupon.cp_type === 1 ? `${currentCoupon.cp_price}% 할인` : `${Number(currentCoupon.cp_price).toLocaleString()}원 할인`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-400">
              <Ticket className="w-5 h-5 text-slate-300" />
              사용 안 함
            </div>
          )}
          <button
            onClick={() => navigate("/admin/coupons")}
            className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            쿠폰 관리 메뉴에서 변경
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </Card>

      <Card className="max-w-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Gift className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">신규 가입 포인트</h2>
            <p className="text-sm text-slate-500">파트너사 신규 가입 승인 시 자동으로 지급되는 포인트</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">지급 포인트</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                className="w-full px-4 py-3 border-2 rounded-xl text-sm transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 pr-14"
                value={signupPointStr}
                onChange={e => {
                  const v = e.target.value;
                  if (v === "" || /^\d+$/.test(v)) setSignupPointStr(v);
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">P</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">0 입력 시 포인트를 지급하지 않습니다.</p>
          </div>
          <div className="pt-6">
            <Button
              onClick={() => updateGeneral.mutate({ signup_point: Number(signupPointStr) || 0 })}
              disabled={updateGeneral.isPending}
              className="flex items-center gap-2 h-12 px-6"
            >
              {updateGeneral.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              저장
            </Button>
          </div>
        </div>
      </Card>

      {/* 카카오 채널 추가 포인트 */}
      <Card className="max-w-2xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">카카오 채널 추가 포인트</h2>
            <p className="text-sm text-slate-500">쇼핑몰 메인에서 카카오 채널 친구 추가 시 지급되는 포인트</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">지급 포인트</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                className="w-full px-4 py-3 border-2 rounded-xl text-sm transition-all focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 pr-14"
                value={kakaoPointStr}
                onChange={e => {
                  const v = e.target.value;
                  if (v === "" || /^\d+$/.test(v)) setKakaoPointStr(v);
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">P</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">0 입력 시 포인트를 지급하지 않습니다.</p>
          </div>
          <div className="pt-6">
            <Button
              onClick={() => updateKakaoPoint.mutate({ kakao_channel_point: kakaoPointStr || "0" })}
              disabled={updateKakaoPoint.isPending}
              className="flex items-center gap-2 h-12 px-6"
            >
              {updateKakaoPoint.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              저장
            </Button>
          </div>
        </div>
      </Card>

      <Card className="max-w-2xl p-8">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">입금 계좌 정보</h2>
            <p className="text-sm text-slate-500">주문 시 파트너사에게 표시됩니다.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">은행명 <span className="text-red-500">*</span></label>
            <input
              className="w-full px-4 py-3 border-2 rounded-xl text-sm transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="예: 국민은행, 신한은행, 기업은행"
              value={form.bank_name}
              onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">계좌번호 <span className="text-red-500">*</span></label>
            <input
              className="w-full px-4 py-3 border-2 rounded-xl text-sm transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="예: 123-456-789012"
              value={form.account_number}
              onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">예금주 <span className="text-red-500">*</span></label>
            <input
              className="w-full px-4 py-3 border-2 rounded-xl text-sm transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="예: (주)ソウルモノ"
              value={form.account_holder}
              onChange={e => setForm(f => ({ ...f, account_holder: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">안내 메모</label>
            <RichMemoEditor
              value={form.memo}
              onChange={html => setForm(f => ({ ...f, memo: html }))}
            />
            <p className="text-xs text-slate-400 mt-1">굵기·기울임·밑줄·글자색 서식 적용 가능. 파트너사 화면에 그대로 표시됩니다.</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-400">변경사항은 저장 후 즉시 반영됩니다.</p>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="flex items-center gap-2"
          >
            {updateSettings.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
            ) : (
              <><Save className="w-4 h-4" /> 저장하기</>
            )}
          </Button>
        </div>
      </Card>

      {(form.bank_name || form.account_number) && (
        <Card className="max-w-2xl mt-8 p-6">
          <h3 className="text-sm font-bold text-slate-500 mb-4">미리보기 (파트너사에게 이렇게 표시됩니다)</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-blue-900">무통장입금 계좌 안내</h4>
            </div>
            <div className="space-y-1.5 text-sm">
              {form.bank_name && <p className="text-blue-800"><span className="font-semibold">은행:</span> {form.bank_name}</p>}
              {form.account_number && <p className="text-blue-800"><span className="font-semibold">계좌번호:</span> {form.account_number}</p>}
              {form.account_holder && <p className="text-blue-800"><span className="font-semibold">예금주:</span> {form.account_holder}</p>}
              {form.memo && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-blue-700 text-sm leading-relaxed [&_p]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: form.memo }} />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── 사업자 / 푸터 정보 ── */}
      <Card className="max-w-2xl p-8 mt-6">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">사업자 / 푸터 정보</h2>
            <p className="text-sm text-slate-500">쇼핑몰 하단 푸터에 표시되는 사업자 정보입니다.</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* 법인명 + 대표이사 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">법인명</label>
              <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="주식회사 와이앤에이치에스" value={footerForm.company} onChange={setF("company")} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">대표이사</label>
              <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="윤석민" value={footerForm.ceo} onChange={setF("ceo")} />
            </div>
          </div>

          {/* 사업자번호 + 전화 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">사업자번호</label>
              <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="429-81-03401" value={footerForm.business_num} onChange={setF("business_num")} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">전화번호</label>
              <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="02-0000-0000" value={footerForm.tel} onChange={setF("tel")} />
            </div>
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />주소</label>
            <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="서울특별시 중랑구 용마산로 536 (망우동)" value={footerForm.address} onChange={setF("address")} />
          </div>

          {/* 통신판매업 + 개인정보책임자 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">통신판매업 신고번호</label>
              <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="2024-서울중랑-1470" value={footerForm.online_num} onChange={setF("online_num")} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">개인정보책임자</label>
              <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="윤석민" value={footerForm.privacy} onChange={setF("privacy")} />
            </div>
          </div>

          {/* 고객센터 구분선 */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-slate-500" />
              <p className="text-sm font-bold text-slate-600">고객센터 정보</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">고객센터 전화번호</label>
                <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="1588-0000" value={footerForm.cs_tel} onChange={setF("cs_tel")} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">운영시간</label>
                <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="평일 : 10:00 ~ 18:00" value={footerForm.cs_hours} onChange={setF("cs_hours")} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">점심/휴일 안내</label>
                <input className="w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="점심시간 : 12:00 ~ 13:00  일요일 / 공휴일 휴무" value={footerForm.cs_lunch} onChange={setF("cs_lunch")} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-400">저장 즉시 쇼핑몰 하단 푸터에 반영됩니다.</p>
          <Button
            size="lg"
            onClick={() => updateFooter.mutate(footerForm)}
            disabled={updateFooter.isPending}
            className="flex items-center gap-2"
          >
            {updateFooter.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</> : <><Save className="w-4 h-4" /> 저장하기</>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
