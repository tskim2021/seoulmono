import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { Card } from "../components/ui";
import { Search, X, Plus, Package, Loader2, AlertTriangle, Eye, EyeOff, Pencil, Check, RotateCcw } from "lucide-react";
import { toast } from "../hooks/use-toast";

const SECTIONS = [
  { key: "new",            label: "신상품",           filter1: "2",  color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", desc: "홈 '신상품' 섹션에 표시됩니다" },
  { key: "brand",          label: "ソウルモノ 브랜드",     filter1: "3",  color: "bg-indigo-500",  light: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200",  desc: "홈 'ソウルモノ브랜드 상품' 섹션에 표시됩니다" },
  { key: "first_purchase", label: "첫구매 100원",      filter1: "13", color: "bg-sky-500",     light: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",     desc: "홈 '첫구매 100원' 배너 아래 섹션에 표시됩니다" },
  { key: "expire",         label: "유통기한 임박특가", filter1: "8",  color: "bg-red-500",     light: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     desc: "오늘의 특가 '유통기한 임박' 탭에 표시됩니다" },
  { key: "time",           label: "타임특가",          filter1: "9",  color: "bg-orange-500",  light: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  desc: "오늘의 특가 '타임특가' 탭에 표시됩니다" },
  { key: "limited",        label: "한정특가",          filter1: "10", color: "bg-pink-500",    light: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200",    desc: "오늘의 특가 '한정특가' 탭에 표시됩니다" },
  { key: "brand_special",  label: "브랜드특가",        filter1: "11", color: "bg-purple-500",  light: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  desc: "오늘의 특가 '브랜드특가' 탭에 표시됩니다" },
  { key: "lowest",         label: "최저가 도전",       filter1: "12", color: "bg-teal-500",    light: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200",    desc: "홈 '최저가 도전' 섹션에 표시됩니다" },
];

interface SectionItem {
  it_id: string;
  it_name: string;
  it_price: number;
  it_img1: string;
  ca_name: string;
  it_soldout: string;
  filter1: string;
}

interface FPItem {
  id: number;
  it_id: string;
  it_name: string;
  orig_name: string;
  custom_name: string;
  it_price: number;
  orig_price: number;
  it_img1: string;
  custom_img: string;
  is_visible: number;
  sort_order: number;
  it_soldout: string;
  ca_name: string;
}

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(opts.headers || {}) },
  });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
  return json;
}

// ─── 첫구매 100원 전용 매니저 ──────────────────────────────────────────────

function FirstPurchaseManager() {
  const qc = useQueryClient();
  const section = SECTIONS.find(s => s.key === "first_purchase")!;

  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SectionItem[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ custom_name: "", custom_price: 100, custom_img: "", sort_order: 0 });

  const { data, isLoading } = useQuery<{ items: FPItem[] }>({
    queryKey: ["fp-items"],
    queryFn: () => customFetch("/api/admin/first-purchase/items"),
  });

  const items = data?.items || [];

  const addMutation = useMutation({
    mutationFn: (it_id: string) => apiFetch("/api/admin/first-purchase/items", { method: "POST", body: JSON.stringify({ it_id }) }),
    onSuccess: (_, it_id) => {
      qc.invalidateQueries({ queryKey: ["fp-items"] });
      setSearchResults(prev => prev.filter(i => i.it_id !== it_id));
      toast({ title: "상품이 추가되었습니다" });
    },
    onError: () => toast({ title: "추가 실패", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/first-purchase/items/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fp-items"] }); toast({ title: "상품이 제거되었습니다" }); },
    onError: () => toast({ title: "제거 실패", variant: "destructive" }),
  });

  const visibilityMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/first-purchase/items/${id}/visibility`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fp-items"] }),
    onError: () => toast({ title: "변경 실패", variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, form }: { id: number; form: typeof editForm }) =>
      apiFetch(`/api/admin/first-purchase/items/${id}`, { method: "PUT", body: JSON.stringify(form) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fp-items"] });
      setEditingId(null);
      toast({ title: "수정되었습니다" });
    },
    onError: () => toast({ title: "수정 실패", variant: "destructive" }),
  });

  const openEdit = (item: FPItem) => {
    setEditingId(item.id);
    setEditForm({ custom_name: item.custom_name, custom_price: item.it_price, custom_img: item.custom_img, sort_order: item.sort_order });
  };

  const handleSearch = (q: string) => {
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await customFetch<{ items: SectionItem[] }>(`/api/admin/first-purchase/search?q=${encodeURIComponent(q)}`);
        setSearchResults(data.items || []);
      } catch {
        setSearchResults([]);
      } finally { setSearching(false); }
    }, 400);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3 ${section.light} ${section.text}`}>
          <span className={`w-2 h-2 rounded-full ${section.color}`} />
          {section.desc}
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{section.label}</h1>
        <p className="text-slate-500 mt-1 font-medium">원본 상품은 변경되지 않으며, 이 목록에서만 별도로 관리됩니다.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 등록된 상품 목록 */}
        <Card className="overflow-hidden">
          <div className={`px-6 py-4 flex items-center justify-between ${section.light} border-b ${section.border}`}>
            <div>
              <h2 className={`font-black text-base ${section.text}`}>등록된 상품</h2>
              <p className="text-xs text-slate-500 mt-0.5">노출/비노출 및 상품 정보를 직접 수정하세요</p>
            </div>
            <span className={`text-sm font-black px-3 py-1 rounded-full ${section.color} text-white`}>{items.length}개</span>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">불러오는 중...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">등록된 상품이 없습니다</p>
              <p className="text-xs mt-1">우측에서 상품을 검색해 추가하세요</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
              {items.map(item => (
                <div key={item.id}>
                  {/* 상품 행 */}
                  <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${item.is_visible ? "hover:bg-slate-50" : "bg-slate-50/60 opacity-60 hover:opacity-80"}`}>
                    {/* 썸네일 */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 relative">
                      {item.it_img1
                        ? <img src={item.it_img1} alt="" className="w-full h-full object-contain" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-5 h-5" /></div>
                      }
                      {!item.is_visible && (
                        <div className="absolute inset-0 bg-slate-400/40 flex items-center justify-center">
                          <EyeOff className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{item.it_name}</p>
                        {item.custom_name && (
                          <span className="text-xs bg-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded flex-shrink-0">수정됨</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.ca_name && <span className="text-xs text-slate-400">{item.ca_name}</span>}
                        <span className="text-xs font-black text-sky-600">{formatPrice(item.it_price)}</span>
                        {item.orig_price > 0 && item.it_price !== item.orig_price && (
                          <span className="text-xs text-slate-400 line-through">{formatPrice(item.orig_price)}</span>
                        )}
                        {!item.is_visible && (
                          <span className="text-xs bg-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded">비노출</span>
                        )}
                        {item.it_soldout === "1" && (
                          <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">품절</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">ID: {item.it_id}</p>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* 노출/비노출 토글 */}
                      <button
                        onClick={() => visibilityMutation.mutate(item.id)}
                        disabled={visibilityMutation.isPending}
                        title={item.is_visible ? "비노출로 변경" : "노출로 변경"}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${item.is_visible ? "bg-sky-50 text-sky-500 hover:bg-sky-100" : "bg-slate-200 text-slate-400 hover:bg-slate-300"}`}
                      >
                        {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      {/* 수정 */}
                      <button
                        onClick={() => editingId === item.id ? setEditingId(null) : openEdit(item)}
                        title="상품 수정"
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${editingId === item.id ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-500"}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {/* 제거 */}
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                        title="섹션에서 제거"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 인라인 수정 패널 */}
                  {editingId === item.id && (
                    <div className="px-4 pb-4 bg-amber-50 border-b border-amber-100">
                      <div className="bg-white rounded-xl border border-amber-200 p-4 space-y-3">
                        <p className="text-xs font-black text-amber-700 uppercase tracking-wide">상품 수정 (원본 상품은 변경되지 않습니다)</p>

                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">상품명</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                            placeholder={`원본: ${item.orig_name}`}
                            value={editForm.custom_name}
                            onChange={e => setEditForm(f => ({ ...f, custom_name: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">판매 가격 (원)</label>
                          <input
                            type="number"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                            value={editForm.custom_price}
                            min={0}
                            onChange={e => setEditForm(f => ({ ...f, custom_price: Number(e.target.value) }))}
                          />
                          <p className="text-xs text-slate-400 mt-1">원본 가격: {formatPrice(item.orig_price)}</p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">이미지 URL (선택)</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                            placeholder="비워두면 원본 이미지 사용"
                            value={editForm.custom_img}
                            onChange={e => setEditForm(f => ({ ...f, custom_img: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">정렬 순서</label>
                          <input
                            type="number"
                            className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                            value={editForm.sort_order}
                            onChange={e => setEditForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                          />
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => editMutation.mutate({ id: item.id, form: editForm })}
                            disabled={editMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-lg text-xs font-bold hover:bg-sky-600 transition-colors disabled:opacity-60"
                          >
                            {editMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            저장
                          </button>
                          <button
                            onClick={() => setEditForm({ custom_name: "", custom_price: item.orig_price, custom_img: "", sort_order: item.sort_order })}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            원본으로 초기화
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="ml-auto px-3 py-2 text-slate-400 rounded-lg text-xs hover:text-slate-600 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 상품 검색 + 추가 */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-black text-base text-slate-800">상품 검색 및 추가</h2>
            <p className="text-xs text-slate-500 mt-0.5">원본 상품을 가져와 첫구매 100원 상품으로 등록합니다</p>
          </div>

          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 transition-colors"
                placeholder="상품명 또는 상품코드 입력..."
                value={searchQ}
                onChange={e => handleSearch(e.target.value)}
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
              {!searching && searchQ && (
                <button onClick={() => { setSearchQ(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            {!searchQ && (
              <div className="p-10 text-center text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">상품을 검색해보세요</p>
                <p className="text-xs mt-1">가져온 상품은 원본 데이터를 유지한 채 100원으로 등록됩니다</p>
              </div>
            )}
            {searchQ && !searching && searchResults.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                <p className="text-sm font-bold">검색 결과가 없습니다</p>
                <p className="text-xs mt-1">이미 등록된 상품이거나 검색어를 확인해주세요</p>
              </div>
            )}
            {searchResults.map(item => (
              <div key={item.it_id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                  {item.it_img1
                    ? <img src={item.it_img1} alt="" className="w-full h-full object-contain" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-5 h-5" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.it_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.ca_name && <span className="text-xs text-slate-400">{item.ca_name}</span>}
                    <span className="text-xs text-slate-500">{formatPrice(item.it_price)}</span>
                    <span className="text-xs font-black text-sky-600">→ 100원</span>
                  </div>
                </div>
                <button
                  onClick={() => addMutation.mutate(item.it_id)}
                  disabled={addMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white flex-shrink-0 bg-sky-500 hover:bg-sky-600 transition-colors disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  가져오기
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── 일반 섹션 매니저 (hooks 규칙 준수: 별도 컴포넌트) ────────────────────────

interface SectionItemWithUse extends SectionItem {
  it_use: string;
}

function SectionManager({ section }: { section: typeof SECTIONS[0] }) {
  const qc = useQueryClient();
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SectionItem[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQ("");
    setSearchResults([]);
  }, [section.key]);

  const { data: sectionData, isLoading: sectionLoading } = useQuery<{ items: SectionItemWithUse[]; is_fallback: boolean }>({
    queryKey: ["main-shop-products", section.filter1],
    queryFn: () => customFetch(`/api/admin/main-shop/section-products?filter1=${section.filter1}`),
  });

  const assignMutation = useMutation({
    mutationFn: ({ it_id, filter1 }: { it_id: string; filter1: string }) =>
      apiFetch("/api/admin/main-shop/assign", { method: "POST", body: JSON.stringify({ it_id, filter1 }) }),
    onSuccess: (_, { it_id }) => {
      qc.invalidateQueries({ queryKey: ["main-shop-products", section.filter1] });
      setSearchResults(prev => prev.filter(i => i.it_id !== it_id));
      toast({ title: "상품이 추가되었습니다" });
    },
    onError: () => toast({ title: "추가 실패", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (it_id: string) =>
      apiFetch(`/api/admin/main-shop/assign/${it_id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["main-shop-products", section.filter1] });
      toast({ title: "상품이 제거되었습니다" });
    },
    onError: () => toast({ title: "제거 실패", variant: "destructive" }),
  });

  const visibilityMutation = useMutation({
    mutationFn: (it_id: string) =>
      apiFetch(`/api/admin/main-shop/assign/${it_id}/visibility`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["main-shop-products", section.filter1] }),
    onError: () => toast({ title: "변경 실패", variant: "destructive" }),
  });

  const handleSearch = (q: string) => {
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await customFetch<{ items: SectionItem[] }>(`/api/admin/main-shop/search?q=${encodeURIComponent(q)}`);
        const currentIds = new Set((sectionData?.items || []).map(i => i.it_id));
        setSearchResults((data.items || []).filter((i: SectionItem) => !currentIds.has(i.it_id)));
      } catch {
        setSearchResults([]);
      } finally { setSearching(false); }
    }, 400);
  };

  const currentItems = sectionData?.items || [];
  const isFallback = sectionData?.is_fallback ?? false;

  return (
    <div className="animate-in fade-in duration-300">
      {/* 헤더 */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3 ${section.light} ${section.text}`}>
          <span className={`w-2 h-2 rounded-full ${section.color}`} />
          {section.desc}
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{section.label}</h1>
        <p className="text-slate-500 mt-1 font-medium">이 섹션에 표시할 상품을 관리합니다.</p>
      </div>

      {/* fallback 경고 배너 */}
      {isFallback && (
        <div className="flex items-start gap-3 px-5 py-4 mb-5 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">이 섹션에 배정된 상품이 없습니다</p>
            <p className="text-xs text-amber-600 mt-0.5">
              현재 홈화면에는 <strong>최신 등록 상품</strong>이 자동으로 표시되고 있습니다.
              오른쪽에서 상품을 검색해 이 섹션에 직접 배정하면 홈화면에 반영됩니다.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 현재 섹션 상품 목록 */}
        <Card className="overflow-hidden">
          <div className={`px-6 py-4 flex items-center justify-between ${isFallback ? "bg-amber-50 border-b border-amber-100" : `${section.light} border-b ${section.border}`}`}>
            <div>
              <h2 className={`font-black text-base ${isFallback ? "text-amber-700" : section.text}`}>
                {isFallback ? "자동 표시 중 (최신상품)" : "등록된 상품"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isFallback ? "직접 배정된 상품이 없어 최신 등록순으로 표시됩니다" : "노출/비노출 토글 및 섹션 제거 가능"}
              </p>
            </div>
            <span className={`text-sm font-black px-3 py-1 rounded-full ${isFallback ? "bg-amber-400 text-white" : `${section.color} text-white`}`}>
              {isFallback ? "자동" : `${currentItems.length}개`}
            </span>
          </div>

          {sectionLoading ? (
            <div className="p-10 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">불러오는 중...</p>
            </div>
          ) : isFallback || currentItems.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">직접 배정된 상품이 없습니다</p>
              <p className="text-xs mt-1">우측에서 상품을 검색해 이 섹션에 추가하세요</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
              {currentItems.map(item => {
                const isVisible = item.it_use === "1";
                return (
                  <div key={item.it_id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${isVisible ? "hover:bg-slate-50" : "bg-slate-50/60"}`}>
                    {/* 썸네일 */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 relative">
                      {item.it_img1
                        ? <img src={item.it_img1} alt="" className={`w-full h-full object-contain ${!isVisible ? "opacity-40" : ""}`} />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-5 h-5" /></div>
                      }
                      {!isVisible && (
                        <div className="absolute inset-0 bg-slate-400/40 flex items-center justify-center">
                          <EyeOff className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-sm font-bold truncate max-w-[160px] ${isVisible ? "text-slate-800" : "text-slate-400"}`}>{item.it_name}</p>
                        {!isVisible && <span className="text-xs bg-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded flex-shrink-0">비노출</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.ca_name && <span className="text-xs text-slate-400">{item.ca_name}</span>}
                        <span className="text-xs font-bold text-slate-600">{formatPrice(item.it_price)}</span>
                        {item.it_soldout === "1" && (
                          <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">품절</span>
                        )}
                      </div>
                    </div>
                    {/* 액션 버튼 */}
                    {!isFallback && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* 노출/비노출 토글 */}
                        <button
                          onClick={() => visibilityMutation.mutate(item.it_id)}
                          disabled={visibilityMutation.isPending}
                          title={isVisible ? "비노출로 변경" : "노출로 변경"}
                          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${isVisible ? "bg-emerald-50 text-emerald-500 hover:bg-emerald-100" : "bg-slate-200 text-slate-400 hover:bg-slate-300"}`}
                        >
                          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        {/* 섹션에서 제거 */}
                        <button
                          onClick={() => removeMutation.mutate(item.it_id)}
                          disabled={removeMutation.isPending}
                          title="섹션에서 제거"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 상품 검색 + 추가 */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-black text-base text-slate-800">상품 검색 및 추가</h2>
            <p className="text-xs text-slate-500 mt-0.5">상품명 또는 상품 코드로 검색 후 추가하세요</p>
          </div>

          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="상품명 또는 상품코드 입력..."
                value={searchQ}
                onChange={e => handleSearch(e.target.value)}
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
              {!searching && searchQ && (
                <button
                  onClick={() => { setSearchQ(""); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            {!searchQ && (
              <div className="p-10 text-center text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">상품을 검색해보세요</p>
                <p className="text-xs mt-1">검색 결과에서 바로 이 섹션에 추가할 수 있습니다</p>
              </div>
            )}
            {searchQ && !searching && searchResults.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                <p className="text-sm font-bold">검색 결과가 없습니다</p>
                <p className="text-xs mt-1">이미 이 섹션에 추가된 상품이거나 검색어를 확인해주세요</p>
              </div>
            )}
            {searchResults.map(item => {
              const alreadySection = item.filter1 && item.filter1 !== "" && item.filter1 !== "0"
                ? SECTIONS.find(s => s.filter1 === item.filter1)
                : null;
              return (
                <div key={item.it_id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    {item.it_img1
                      ? <img src={item.it_img1} alt="" className="w-full h-full object-contain" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-5 h-5" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.it_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.ca_name && <span className="text-xs text-slate-400">{item.ca_name}</span>}
                      <span className="text-xs font-bold text-slate-600">{formatPrice(item.it_price)}</span>
                      {alreadySection && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${alreadySection.light} ${alreadySection.text}`}>
                          현재: {alreadySection.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => assignMutation.mutate({ it_id: item.it_id, filter1: section.filter1 })}
                    disabled={assignMutation.isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white flex-shrink-0 ${section.color} hover:opacity-90 transition-opacity`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    추가
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AdminMainShop({ params }: { params?: { section?: string } }) {
  const sectionKey = params?.section || "new";
  const section = SECTIONS.find(s => s.key === sectionKey) || SECTIONS[0];

  if (sectionKey === "first_purchase") {
    return <FirstPurchaseManager />;
  }

  return <SectionManager section={section} />;
}
