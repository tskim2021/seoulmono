import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, Button, Badge } from "../components/ui";
import { Ticket, Plus, Trash2, Loader2, Users, Gift, ChevronDown, ChevronUp, Search, X, Star, StarOff } from "lucide-react";
import { toast } from "../hooks/use-toast";
import { formatCurrency } from "../lib/utils";

interface CouponZone {
  cz_id: number;
  cz_subject: string;
  cp_type: number;
  cp_price: number;
  cp_minimum: number;
  cp_maximum: number;
  cz_start: string;
  cz_end: string;
  cz_period: number;
  cz_period_date: string;
  cz_datetime: string;
  issued_count: number;
  used_count: number;
}

interface Partner {
  mb_id: string;
  mb_name: string;
  company_name: string;
}

function CouponZoneForm({ initial, onSave, onCancel }: {
  initial?: Partial<CouponZone>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    cz_subject: initial?.cz_subject || "",
    cp_type: initial?.cp_type ?? 0,
    cp_price: initial?.cp_price ?? 0,
    cp_minimum: initial?.cp_minimum ?? 0,
    cp_maximum: initial?.cp_maximum ?? 0,
    cz_period: initial?.cz_period ?? 0,
    cz_period_date: initial?.cz_period_date && initial.cz_period_date !== "0000-00-00" ? initial.cz_period_date : "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.cz_subject.trim()) {
      toast({ title: "쿠폰명을 입력해주세요", variant: "destructive" });
      return;
    }
    if (form.cp_price <= 0) {
      toast({ title: "할인 금액/비율을 입력해주세요", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        cz_period_date: form.cz_period_date || "0000-00-00",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">쿠폰명 <span className="text-red-500">*</span></label>
        <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="예: 신규가입 축하 쿠폰"
          value={form.cz_subject} onChange={e => setForm(f => ({ ...f, cz_subject: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">할인 유형</label>
          <select className="w-full px-3 py-2 border rounded-lg text-sm"
            value={form.cp_type} onChange={e => setForm(f => ({ ...f, cp_type: Number(e.target.value) }))}>
            <option value={0}>정액 할인 (원)</option>
            <option value={1}>정률 할인 (%)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            할인 {form.cp_type === 1 ? "비율 (%)" : "금액 (원)"} <span className="text-red-500">*</span>
          </label>
          <input type="number" min="0" className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder={form.cp_type === 1 ? "10" : "5000"}
            value={form.cp_price || ""} onChange={e => setForm(f => ({ ...f, cp_price: Number(e.target.value) }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">최소 주문금액 (원)</label>
          <input type="number" min="0" step="1000" className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="0 (제한 없음)"
            value={form.cp_minimum || ""} onChange={e => setForm(f => ({ ...f, cp_minimum: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">최대 할인금액 (원)</label>
          <input type="number" min="0" step="1000" className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="0 (제한 없음)"
            value={form.cp_maximum || ""} onChange={e => setForm(f => ({ ...f, cp_maximum: Number(e.target.value) }))} />
          <p className="text-xs text-slate-400 mt-1">정률 할인 시에만 적용됩니다.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">유효 기간 (일)</label>
          <input type="number" min="0" className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="0 (기간 제한 없음)"
            value={form.cz_period || ""} onChange={e => setForm(f => ({ ...f, cz_period: Number(e.target.value) }))} />
          <p className="text-xs text-slate-400 mt-1">발급일로부터 N일 후 만료</p>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">만료 날짜 (고정)</label>
          <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm"
            value={form.cz_period_date} onChange={e => setForm(f => ({ ...f, cz_period_date: e.target.value }))} />
          <p className="text-xs text-slate-400 mt-1">특정 날짜에 만료 (기간보다 우선)</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          {initial?.cz_id ? "수정" : "생성"}
        </Button>
      </div>
    </div>
  );
}

function IssueModal({ zone, onClose }: { zone: CouponZone; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: partnersData } = useQuery({
    queryKey: ["partners-list"],
    queryFn: () => customFetch<{ partners: Partner[] }>("/api/orders/partners"),
  });
  const partners = partnersData?.partners || [];

  const filtered = partners.filter(p =>
    !search || p.company_name.includes(search) || p.mb_name.includes(search) || p.mb_id.includes(search)
  );

  const toggleSelect = (mbId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(mbId)) next.delete(mbId);
      else next.add(mbId);
      return next;
    });
  };

  const issueMutation = useMutation({
    mutationFn: () => customFetch<any>(`/api/admin/coupon-zones/${zone.cz_id}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mb_ids: Array.from(selectedIds) }),
    }),
    onSuccess: (data: any) => {
      toast({ title: `${data.issued}명에게 쿠폰이 발급되었습니다${data.failed > 0 ? ` (${data.failed}명 실패)` : ""}` });
      queryClient.invalidateQueries({ queryKey: ["coupon-zones"] });
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      onClose();
    },
    onError: () => toast({ title: "발급 실패", variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-bold text-slate-900">쿠폰 발급</h3>
            <p className="text-sm text-slate-500 mt-0.5">{zone.cz_subject}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" placeholder="업체명, 담당자명, 아이디 검색"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>{selectedIds.size}명 선택됨</span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedIds(new Set(filtered.map(p => p.mb_id)))} className="text-primary hover:underline">전체 선택</button>
              <button onClick={() => setSelectedIds(new Set())} className="text-red-500 hover:underline">선택 해제</button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 && <p className="text-center py-6 text-slate-400 text-sm">검색 결과가 없습니다.</p>}
          {filtered.map(p => (
            <div key={p.mb_id} onClick={() => toggleSelect(p.mb_id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                selectedIds.has(p.mb_id) ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
              }`}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                selectedIds.has(p.mb_id) ? "border-primary bg-primary" : "border-slate-300"
              }`}>
                {selectedIds.has(p.mb_id) && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">{p.company_name || p.mb_name}</p>
                <p className="text-xs text-slate-500">{p.mb_id} {p.mb_name && p.company_name && `/ ${p.mb_name}`}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Button className="w-full" disabled={selectedIds.size === 0 || issueMutation.isPending}
            onClick={() => issueMutation.mutate()}>
            {issueMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
            {selectedIds.size}명에게 발급
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editZone, setEditZone] = useState<CouponZone | null>(null);
  const [issueZone, setIssueZone] = useState<CouponZone | null>(null);
  const [expandedZone, setExpandedZone] = useState<number | null>(null);
  const [couponPage, setCouponPage] = useState(1);
  const [filterCzId, setFilterCzId] = useState<number | null>(null);
  const [filterMbId, setFilterMbId] = useState("");

  const { data: zonesData, isLoading: isLoadingZones } = useQuery({
    queryKey: ["coupon-zones"],
    queryFn: () => customFetch<{ zones: CouponZone[] }>("/api/admin/coupon-zones"),
  });
  const zones = zonesData?.zones || [];

  const { data: signupCouponData } = useQuery({
    queryKey: ["settings-signup-coupon"],
    queryFn: () => customFetch<{ signup_coupon_id: number }>("/api/settings/signup-coupon"),
  });
  const signupCouponId = signupCouponData?.signup_coupon_id ?? 0;

  const updateSignupCoupon = useMutation({
    mutationFn: (cz_id: number) =>
      customFetch("/api/settings/signup-coupon", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signup_coupon_id: cz_id }),
      }),
    onSuccess: (_data, cz_id) => {
      queryClient.invalidateQueries({ queryKey: ["settings-signup-coupon"] });
      toast({ title: cz_id === 0 ? "신규 가입 쿠폰 설정이 해제되었습니다" : "신규 가입 쿠폰으로 설정되었습니다" });
    },
    onError: () => toast({ title: "설정 실패", variant: "destructive" }),
  });

  const [mbIdInput, setMbIdInput] = useState("");

  const { data: couponsData, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ["admin-coupons", couponPage, filterCzId, filterMbId],
    queryFn: () => customFetch<{ coupons: any[]; total: number; page: number; limit: number }>(
      `/api/admin/coupons?page=${couponPage}&limit=20${filterCzId ? `&cz_id=${filterCzId}` : ""}${filterMbId ? `&mb_id=${encodeURIComponent(filterMbId)}` : ""}`
    ),
  });
  const coupons = couponsData?.coupons || [];
  const couponTotal = couponsData?.total || 0;
  const couponTotalPages = Math.ceil(couponTotal / 20);

  const createZone = useMutation({
    mutationFn: (data: any) => customFetch<any>("/api/admin/coupon-zones", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupon-zones"] });
      toast({ title: "쿠폰 종류가 생성되었습니다" });
      setShowForm(false);
    },
    onError: (err: any) => toast({ title: "생성 실패", description: err?.data?.error || "", variant: "destructive" }),
  });

  const updateZone = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => customFetch<any>(`/api/admin/coupon-zones/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupon-zones"] });
      toast({ title: "쿠폰 종류가 수정되었습니다" });
      setEditZone(null);
    },
    onError: (err: any) => toast({ title: "수정 실패", description: err?.data?.error || "", variant: "destructive" }),
  });

  const deleteZone = useMutation({
    mutationFn: (id: number) => customFetch<any>(`/api/admin/coupon-zones/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupon-zones"] });
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "쿠폰 종류가 삭제되었습니다" });
    },
    onError: (err: any) => toast({ title: "삭제 실패", description: err?.data?.error || "", variant: "destructive" }),
  });

  const deleteCoupon = useMutation({
    mutationFn: (no: number) => customFetch<any>(`/api/admin/coupons/${no}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      queryClient.invalidateQueries({ queryKey: ["coupon-zones"] });
      toast({ title: "쿠폰이 삭제되었습니다" });
    },
    onError: (err: any) => toast({ title: "삭제 실패", description: err?.data?.error || "", variant: "destructive" }),
  });

  const handleDeleteZone = (zone: CouponZone) => {
    if (!confirm(`"${zone.cz_subject}" 쿠폰 종류를 삭제하시겠습니까?\n발급된 미사용 쿠폰도 함께 삭제됩니다.`)) return;
    deleteZone.mutate(zone.cz_id);
  };

  const handleDeleteCoupon = (cp: any) => {
    if (!confirm("이 쿠폰을 삭제하시겠습니까?")) return;
    deleteCoupon.mutate(cp.cp_no);
  };

  if (isLoadingZones) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">쿠폰 관리</h1>
          <p className="text-slate-500 mt-2 font-medium">쿠폰 종류를 만들고 파트너사에게 발급합니다.</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditZone(null); }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> 쿠폰 종류 만들기
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="font-bold text-slate-900 mb-4">새 쿠폰 종류 만들기</h2>
          <CouponZoneForm
            onSave={data => createZone.mutateAsync(data)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <div className="space-y-4 mb-10">
        <h2 className="text-lg font-bold text-slate-800">쿠폰 종류 목록</h2>
        {zones.length === 0 && (
          <Card className="p-12 text-center">
            <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">등록된 쿠폰 종류가 없습니다.</p>
            <p className="text-sm text-slate-400 mt-1">쿠폰 종류 만들기 버튼을 클릭해서 첫 번째 쿠폰을 만들어 보세요.</p>
          </Card>
        )}
        {zones.map(zone => (
          <Card key={zone.cz_id} className="p-5">
            {editZone?.cz_id === zone.cz_id ? (
              <div>
                <h3 className="font-bold text-slate-900 mb-4">쿠폰 종류 수정</h3>
                <CouponZoneForm
                  initial={zone}
                  onSave={data => updateZone.mutateAsync({ id: zone.cz_id, data })}
                  onCancel={() => setEditZone(null)}
                />
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-lg">{zone.cz_subject}</h3>
                      <Badge className={zone.cp_type === 1 ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}>
                        {zone.cp_type === 1 ? `${zone.cp_price}% 할인` : formatCurrency(zone.cp_price) + " 할인"}
                      </Badge>
                      {signupCouponId === zone.cz_id && (
                        <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Star className="w-3 h-3" /> 신규가입 쿠폰
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                      {zone.cp_minimum > 0 && <span>최소 주문 {formatCurrency(zone.cp_minimum)}</span>}
                      {zone.cp_maximum > 0 && zone.cp_type === 1 && <span>최대 {formatCurrency(zone.cp_maximum)} 할인</span>}
                      {zone.cz_period > 0 && <span>발급일부터 {zone.cz_period}일 유효</span>}
                      {zone.cz_period_date && zone.cz_period_date !== "0000-00-00" && <span>{zone.cz_period_date} 만료</span>}
                      <span className="text-slate-400">|</span>
                      <span>발급 {zone.issued_count}건</span>
                      <span>사용 {zone.used_count}건</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {signupCouponId === zone.cz_id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSignupCoupon.mutate(0)}
                        disabled={updateSignupCoupon.isPending}
                        className="flex items-center gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <StarOff className="w-3.5 h-3.5" /> 신규가입 해제
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateSignupCoupon.mutate(zone.cz_id)}
                        disabled={updateSignupCoupon.isPending}
                        className="flex items-center gap-1 border-amber-300 text-amber-600 hover:bg-amber-50"
                      >
                        <Star className="w-3.5 h-3.5" /> 신규가입 쿠폰으로 설정
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setIssueZone(zone)} className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> 발급
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditZone(zone)}>수정</Button>
                    <button onClick={() => handleDeleteZone(zone)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setExpandedZone(expandedZone === zone.cz_id ? null : zone.cz_id)}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {expandedZone === zone.cz_id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    발급 내역 보기 ({zone.issued_count}건)
                  </button>
                  <button
                    onClick={() => { setFilterCzId(zone.cz_id); setCouponPage(1); }}
                    className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
                  >
                    아래 목록에서 필터
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800 mb-3">
          발급된 쿠폰 목록
          {filterCzId && <span className="ml-2 text-sm font-normal text-primary">— {zones.find(z => z.cz_id === filterCzId)?.cz_subject} 필터</span>}
          {filterMbId && <span className="ml-2 text-sm font-normal text-blue-600">— {filterMbId} 회원 필터</span>}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setFilterMbId(mbIdInput.trim()); setCouponPage(1); }} className="flex gap-2">
            <input
              className="px-3 py-2 border rounded-lg text-sm w-52"
              placeholder="아이디로 회원 검색"
              value={mbIdInput}
              onChange={e => setMbIdInput(e.target.value)}
            />
            <button type="submit" className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">검색</button>
            {filterMbId && (
              <button type="button" onClick={() => { setFilterMbId(""); setMbIdInput(""); setCouponPage(1); }}
                className="px-3 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">초기화</button>
            )}
          </form>
          <div className="flex items-center gap-2 ml-auto">
            {filterCzId && (
              <button onClick={() => { setFilterCzId(null); setCouponPage(1); }}
                className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> 쿠폰종류 필터 해제
              </button>
            )}
            <span className="text-sm text-slate-500">총 {couponTotal}건</span>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoadingCoupons ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">발급된 쿠폰이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-bold text-slate-500">쿠폰명</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-500">보유 회원</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-500">할인 내용</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-500">유효기간</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-500">상태</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-500">발급일</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c: any) => (
                  <tr key={c.cp_no} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{c.cp_subject}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-medium">{c.company_name || c.mb_id}</p>
                      {c.company_name && <p className="text-xs text-slate-400">{c.mb_id}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.cp_type === 1 ? `${c.cp_price}% 할인` : formatCurrency(c.cp_price) + " 할인"}
                      {c.cp_minimum > 0 && <span className="text-xs text-slate-400 block">{formatCurrency(c.cp_minimum)} 이상</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {c.cp_end && c.cp_end !== "0000-00-00" ? c.cp_end : "제한 없음"}
                    </td>
                    <td className="py-3 px-4">
                      {c.od_id ? (
                        <Badge className="bg-slate-100 text-slate-500">사용됨</Badge>
                      ) : c.is_expired ? (
                        <Badge className="bg-red-100 text-red-600">만료</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700">사용 가능</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{c.cp_datetime?.slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      {!c.od_id && (
                        <button onClick={() => handleDeleteCoupon(c)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {couponTotalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={couponPage === 1} onClick={() => setCouponPage(p => p - 1)}>이전</Button>
            <span className="text-sm text-slate-600">{couponPage} / {couponTotalPages}</span>
            <Button variant="outline" size="sm" disabled={couponPage >= couponTotalPages} onClick={() => setCouponPage(p => p + 1)}>다음</Button>
          </div>
        )}
      </Card>

      {issueZone && <IssueModal zone={issueZone} onClose={() => setIssueZone(null)} />}
    </div>
  );
}
