import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card } from "../components/ui";
import { cn } from "../lib/utils";
import { toast } from "../hooks/use-toast";
import {
  Gift, Plus, Search, X, Loader2, Package, ChevronRight,
  Save, Tag, Pencil, Trash2, ImageOff, ToggleLeft, ToggleRight,
  PackageX, Eye, EyeOff, CheckCircle2, AlertTriangle,
  ShoppingBag, MapPin, Truck, RefreshCw, ChevronDown, ChevronUp,
  Copy, Check, Phone, User,
} from "lucide-react";

// ── 공통 ─────────────────────────────────────────────────────────────────────
function imgUrl(p: string) {
  if (!p) return "";
  if (p.startsWith("http") || p.startsWith("/api/")) return p;
  return `/api/product-image/${p}`;
}
function formatPrice(n: number | string) { return Number(n || 0).toLocaleString() + "円"; }

const MAIN_TABS = [
  { ca_id: "10", label: "お菓子類", emoji: "🍪" },
  { ca_id: "20", label: "食用油類", emoji: "🫙" },
  { ca_id: "30", label: "缶詰類", emoji: "🥫" },
];

const CA_OPTIONS = [
  { value: "10", label: "お菓子類 (ca_id: 10)" },
  { value: "20", label: "食用油類 (ca_id: 20)" },
  { value: "30", label: "缶詰類 (ca_id: 30)" },
];

// ── API 훅 ───────────────────────────────────────────────────────────────────
function useItems(ca_id: string, page: number, search: string) {
  return useQuery({
    queryKey: ["gift-items", ca_id, page, search],
    queryFn: () => customFetch<any>(
      `/api/shop-admin/gift/items?ca_id=${ca_id}&page=${page}&limit=15&search=${encodeURIComponent(search)}`
    ),
  });
}

function useItemDetail(it_id: string | null) {
  return useQuery({
    queryKey: ["gift-item-detail", it_id],
    queryFn: () => customFetch<any>(`/api/shop-admin/gift/items/${it_id}`),
    enabled: !!it_id,
  });
}

function useGiftCategories() {
  return useQuery({
    queryKey: ["admin-gift-categories"],
    queryFn: () => customFetch<any[]>("/api/shop-admin/gift/categories"),
  });
}

function useSetProducts(caid: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-gift-set-products", caid],
    queryFn: () => customFetch<any[]>(`/api/shop-admin/gift/set-products/${caid}`),
    enabled,
  });
}

// ── 옵션 편집기 ──────────────────────────────────────────────────────────────
type OptionRow = { io_id: string; io_price: number; io_use: number; _key: number };

function OptionEditor({ options, onChange }: { options: OptionRow[]; onChange: (opts: OptionRow[]) => void }) {
  const add = () => onChange([...options, { io_id: "", io_price: 0, io_use: 1, _key: Date.now() }]);
  const remove = (k: number) => onChange(options.filter(o => o._key !== k));
  const update = (k: number, field: keyof OptionRow, val: any) =>
    onChange(options.map(o => o._key === k ? { ...o, [field]: val } : o));

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <div key={opt._key} className="flex items-center gap-2">
          <input
            value={opt.io_id}
            onChange={e => update(opt._key, "io_id", e.target.value)}
            placeholder="オプション値 (例: 3個入り、小)"
            className="flex-1 h-8 px-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="number"
            value={opt.io_price}
            onChange={e => update(opt._key, "io_price", Number(e.target.value))}
            placeholder="追加金額"
            className="w-24 h-8 px-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <select
            value={opt.io_use}
            onChange={e => update(opt._key, "io_use", Number(e.target.value))}
            className="h-8 px-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
          >
            <option value={1}>使用</option>
            <option value={0}>停止</option>
          </select>
          <button onClick={() => remove(opt._key)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> オプションを追加
      </button>
    </div>
  );
}

// ── 상품 폼 모달 ─────────────────────────────────────────────────────────────
type ItemForm = {
  ca_id: string;
  it_name: string;
  it_img1: string;
  it_price: number;
  it_cust_price: number;
  it_use: number;
  it_soldout: number;
  it_basic: string;
  it_option_subject: string;
  options: OptionRow[];
};

const emptyForm = (ca_id: string): ItemForm => ({
  ca_id,
  it_name: "",
  it_img1: "",
  it_price: 0,
  it_cust_price: 0,
  it_use: 1,
  it_soldout: 0,
  it_basic: "",
  it_option_subject: "",
  options: [],
});

function ItemModal({
  mode,
  it_id,
  defaultCaId,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  it_id?: string;
  defaultCaId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mainCaIdFromDefault = defaultCaId.length >= 2 ? defaultCaId.slice(0, 2) : defaultCaId;
  const [mainCaId, setMainCaId] = useState(mainCaIdFromDefault);
  const [form, setForm] = useState<ItemForm>(emptyForm(defaultCaId));
  const [imgPreview, setImgPreview] = useState("");
  const queryClient = useQueryClient();

  const { data: giftCategories = [] } = useGiftCategories();
  const catList = giftCategories as any[];
  const currentMainCat = catList.find((c: any) => c.ca_id === mainCaId);
  const subCategories: any[] = currentMainCat?.sub_categories ?? [];

  const { data: detail, isLoading: detailLoading } = useItemDetail(mode === "edit" ? (it_id ?? null) : null);

  useEffect(() => {
    if (mode === "edit" && detail) {
      const caid: string = detail.ca_id ?? defaultCaId;
      const maid = caid.length >= 2 ? caid.slice(0, 2) : caid;
      setMainCaId(maid);
      setForm({
        ca_id: caid,
        it_name: detail.it_name ?? "",
        it_img1: detail.it_img1 ?? "",
        it_price: detail.it_price ?? 0,
        it_cust_price: detail.it_cust_price ?? 0,
        it_use: detail.it_use ?? 1,
        it_soldout: detail.it_soldout ?? 0,
        it_basic: detail.it_basic ?? "",
        it_option_subject: detail.it_option_subject ?? "",
        options: (detail.options ?? []).map((o: any, i: number) => ({
          io_id: o.io_id,
          io_price: o.io_price,
          io_use: o.io_use,
          _key: i,
        })),
      });
      setImgPreview(detail.it_img1 ?? "");
    }
  }, [detail]);

  const handleMainCaChange = (newMain: string) => {
    setMainCaId(newMain);
    setForm(prev => ({ ...prev, ca_id: newMain }));
  };

  const set = (k: keyof ItemForm, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: () =>
      mode === "create"
        ? customFetch("/api/shop-admin/gift/items", { method: "POST", body: JSON.stringify(form) })
        : customFetch(`/api/shop-admin/gift/items/${it_id}`, { method: "PUT", body: JSON.stringify(form) }),
    onSuccess: () => {
      toast({ title: mode === "create" ? "商品の登録完了" : "商品の更新完了" });
      queryClient.invalidateQueries({ queryKey: ["gift-items"] });
      onSaved();
    },
    onError: (e: any) => toast({ title: "保存に失敗しました: " + (e.message ?? ""), variant: "destructive" }),
  });

  const handleImgBlur = (url: string) => {
    setImgPreview(url);
    set("it_img1", url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <Gift className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black text-slate-900">
            {mode === "create" ? "商品登録" : "商品編集"}
          </h2>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        {mode === "edit" && detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* 카테고리 + 사용여부 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">第1階層カテゴリ *</label>
                  <select
                    value={mainCaId}
                    onChange={e => handleMainCaChange(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  >
                    {CA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">第2階層カテゴリ *</label>
                  {subCategories.length > 0 ? (
                    <select
                      value={form.ca_id.length === 4 ? form.ca_id : ""}
                      onChange={e => set("ca_id", e.target.value)}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">-- 選択 --</option>
                      {subCategories.map((s: any) => (
                        <option key={s.ca_id} value={s.ca_id}>{s.ca_name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full h-9 px-3 border border-slate-100 rounded-lg text-sm text-slate-400 flex items-center bg-slate-50">
                      サブカテゴリなし
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">使用有無</label>
                  <select value={form.it_use} onChange={e => set("it_use", Number(e.target.value))}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary">
                    <option value={1}>使用</option>
                    <option value={0}>停止</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">品切れ有無</label>
                  <select value={form.it_soldout} onChange={e => set("it_soldout", Number(e.target.value))}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary">
                    <option value={0}>正常</option>
                    <option value={1}>品切れ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 상품명 */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">商品名 *</label>
              <input
                value={form.it_name}
                onChange={e => set("it_name", e.target.value)}
                placeholder="商品名を入力してください"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* 이미지 */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">画像URL</label>
              <div className="flex gap-3">
                <input
                  value={form.it_img1}
                  onChange={e => set("it_img1", e.target.value)}
                  onBlur={e => setImgPreview(e.target.value)}
                  placeholder="画像URLまたはパス (例: 1234567890/image.jpg)"
                  className="flex-1 h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
                {imgPreview ? (
                  <img
                    src={imgUrl(imgPreview)}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = ""; }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <ImageOff className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            </div>

            {/* 가격 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">希望小売価格 (円)</label>
                <input
                  type="number" min={0}
                  value={form.it_price}
                  onChange={e => set("it_price", Number(e.target.value))}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">B2B仕入価格 (円)</label>
                <input
                  type="number" min={0}
                  value={form.it_cust_price}
                  onChange={e => set("it_cust_price", Number(e.target.value))}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* 상품 설명 */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">商品説明</label>
              <textarea
                value={form.it_basic}
                onChange={e => set("it_basic", e.target.value)}
                placeholder="商品説明を入力してください"
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* 옵션 */}
            <div className="border border-slate-100 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">オプション区分名</label>
                <input
                  value={form.it_option_subject}
                  onChange={e => set("it_option_subject", e.target.value)}
                  placeholder="例: 容量、数量、種類"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              {form.it_option_subject && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block">
                    オプション一覧 <span className="text-slate-400 font-normal">(値・追加金額・使用有無)</span>
                  </label>
                  <OptionEditor
                    options={form.options}
                    onChange={opts => set("options", opts)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100">
            キャンセル
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.it_name || !form.ca_id || form.ca_id.length < 4}
            className="px-5 h-9 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === "create" ? "登録" : "更新を保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 삭제 확인 모달 ────────────────────────────────────────────────────────────
function DeleteModal({ item, onClose, onDeleted }: { item: any; onClose: () => void; onDeleted: () => void }) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => customFetch(`/api/shop-admin/gift/items/${item.it_id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "商品を無効にしました" });
      queryClient.invalidateQueries({ queryKey: ["gift-items"] });
      onDeleted();
    },
    onError: () => toast({ title: "削除に失敗しました", variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-black text-slate-900">商品の無効化</p>
            <p className="text-xs text-slate-500">削除後、セットからも除外されます</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
          <strong className="text-slate-900">{item.it_name}</strong>
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            キャンセル
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex-1 h-9 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 flex items-center justify-center gap-1.5"
          >
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            無効にする
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 상품 목록 탭 ──────────────────────────────────────────────────────────────
function ItemListTab({ ca_id }: { ca_id: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedSubCaId, setSelectedSubCaId] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "create" | { mode: "edit"; it_id: string }>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: giftCategories = [] } = useGiftCategories();
  const catList = giftCategories as any[];
  const currentMainCat = catList.find((c: any) => c.ca_id === ca_id);
  const subList: any[] = currentMainCat?.sub_categories ?? [];

  const activeCaId = selectedSubCaId ?? ca_id;
  const { data, isLoading } = useItems(activeCaId, page, search);
  const items: any[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const handleSubCat = (sub: string | null) => { setSelectedSubCaId(sub); setPage(1); setSearch(""); setSearchInput(""); };

  return (
    <div className="space-y-4">
      {/* 2차 분류 필터 탭 */}
      {subList.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => handleSubCat(null)}
            className={cn(
              "px-3 h-8 rounded-lg text-xs font-bold transition-all border",
              !selectedSubCaId
                ? "bg-primary text-white border-primary"
                : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
            )}
          >
            すべて
          </button>
          {subList.map((sub: any) => (
            <button
              key={sub.ca_id}
              onClick={() => handleSubCat(sub.ca_id)}
              className={cn(
                "px-3 h-8 rounded-lg text-xs font-bold transition-all border",
                selectedSubCaId === sub.ca_id
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
              )}
            >
              {sub.ca_name}
            </button>
          ))}
        </div>
      )}

      {/* 툴바 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="商品名で検索..."
              className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button onClick={handleSearch} className="px-4 h-9 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700">
            検索
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-500">合計 {total}件</span>
          <button
            onClick={() => setModal("create")}
            className="flex items-center gap-1.5 h-9 px-4 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> 商品登録
          </button>
        </div>
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <Package className="w-10 h-10 text-slate-200 mb-3" />
          <p className="text-slate-400 font-medium">登録された商品がありません</p>
          <button onClick={() => setModal("create")} className="mt-3 text-sm text-primary font-bold hover:underline">
            商品を登録する →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div
              key={item.it_id}
              className={cn(
                "flex items-center gap-4 p-3.5 rounded-xl border transition-all",
                item.it_use ? "bg-white border-slate-100 hover:border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"
              )}
            >
              {/* 이미지 */}
              <div className="w-12 h-12 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0">
                {item.it_img1 ? (
                  <img src={item.it_img1} alt="" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900 truncate">{item.it_name}</p>
                  {!item.it_use && (
                    <span className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded font-medium">停止</span>
                  )}
                  {item.it_soldout ? (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">品切れ</span>
                  ) : null}
                  {item.it_option_subject && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                      オプション: {item.it_option_subject}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-primary font-bold">{formatPrice(item.it_price)}</span>
                  {item.it_cust_price > 0 && (
                    <span className="text-xs text-slate-400">B2B {formatPrice(item.it_cust_price)}</span>
                  )}
                  <span className="text-xs text-slate-400">ca_id: {item.ca_id}</span>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setModal({ mode: "edit", it_id: item.it_id })}
                  className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 hover:bg-primary/5 flex items-center justify-center transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 h-8 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            前へ
          </button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 h-8 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            次へ
          </button>
        </div>
      )}

      {/* 모달 */}
      {modal === "create" && (
        <ItemModal
          mode="create"
          defaultCaId={selectedSubCaId ?? ca_id}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}
      {modal !== null && modal !== "create" && modal.mode === "edit" && (
        <ItemModal
          mode="edit"
          it_id={modal.it_id}
          defaultCaId={selectedSubCaId ?? ca_id}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── 세트 구성 탭 ──────────────────────────────────────────────────────────────
function SetConfigPanel({ sub }: { sub: any }) {
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [cfg, setCfg] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useSetProducts(sub.ca_id, true);
  const subCfg = cfg ?? sub;
  const isDirty = cfg !== null;

  const saveMutation = useMutation({
    mutationFn: () => customFetch(`/api/shop-admin/gift/set-config/${sub.ca_id}`, {
      method: "PUT",
      body: JSON.stringify({
        slot_count: Number(subCfg.slot_count),
        price: Number(subCfg.price),
        description: subCfg.description ?? "",
        is_active: Number(subCfg.is_active),
        sort_order: Number(subCfg.sort_order ?? 0),
      }),
    }),
    onSuccess: () => {
      toast({ title: "設定の保存完了" });
      queryClient.invalidateQueries({ queryKey: ["admin-gift-categories"] });
      setCfg(null);
    },
    onError: () => toast({ title: "保存に失敗しました", variant: "destructive" }),
  });

  const addMutation = useMutation({
    mutationFn: (it_id: string) => customFetch(`/api/shop-admin/gift/set-products/${sub.ca_id}`, {
      method: "POST", body: JSON.stringify({ it_id }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-set-products", sub.ca_id] });
      setSearchResults([]); setSearchQ("");
      toast({ title: "商品の追加完了" });
    },
    onError: () => toast({ title: "追加に失敗しました", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => customFetch(`/api/shop-admin/gift/set-products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-set-products", sub.ca_id] });
      toast({ title: "商品を削除しました" });
    },
    onError: () => toast({ title: "削除に失敗しました", variant: "destructive" }),
  });

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await customFetch<any[]>(
        `/api/shop-admin/gift/search-products?q=${encodeURIComponent(searchQ)}&ca_id=${sub.ca_id}`
      );
      setSearchResults(res as any[]);
    } catch { toast({ title: "検索エラー", variant: "destructive" }); }
    setSearching(false);
  };

  const set = (k: string, v: any) => setCfg((prev: any) => ({ ...(prev ?? sub), [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Tag className="w-4 h-4 text-primary" />
        <h3 className="font-black text-slate-900">{sub.ca_name}</h3>
        <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full ml-auto",
          sub.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500")}>
          {sub.is_active ? "有効" : "無効"}
        </span>
      </div>

      {/* 설정 */}
      <div className="flex items-end gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block">構成数</label>
          <input type="number" min={1} max={20} value={subCfg.slot_count ?? 1}
            onChange={e => set("slot_count", e.target.value)}
            className="w-20 h-8 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block">最低金額</label>
          <input type="number" min={0} value={subCfg.price ?? 0}
            onChange={e => set("price", e.target.value)}
            className="w-28 h-8 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block">ステータス</label>
          <select value={subCfg.is_active ?? 1} onChange={e => set("is_active", Number(e.target.value))}
            className="h-8 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none">
            <option value={1}>有効</option>
            <option value={0}>無効</option>
          </select>
        </div>
        <button onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}
          className={cn("h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto",
            isDirty ? "bg-primary text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed")}>
          {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          保存
        </button>
      </div>

      {/* 상품 검색 */}
      <div>
        <p className="text-xs font-bold text-slate-600 mb-2">商品を追加 (このセットに表示する商品を指定)</p>
        <div className="flex gap-2">
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="登録済みの商品名で検索..."
            className="flex-1 h-8 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
          <button onClick={handleSearch} disabled={searching}
            className="px-3 h-8 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1">
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} 検索
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 border border-emerald-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {searchResults.map((r: any) => (
              <div key={r.it_id} className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-50 last:border-0 hover:bg-emerald-50">
                <img src={imgUrl(r.it_img1)} alt="" className="w-8 h-8 rounded object-cover bg-slate-100 flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{r.it_name}</p>
                  <p className="text-xs text-primary font-bold">{formatPrice(r.it_price)}</p>
                </div>
                <button onClick={() => addMutation.mutate(r.it_id)} disabled={addMutation.isPending}
                  className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 등록 상품 */}
      <div>
        <p className="text-sm font-bold text-slate-700 mb-2">
          セット表示商品 <span className="text-primary">{(products as any[]).length}件</span>
        </p>
        {isLoading ? (
          <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (products as any[]).length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
            登録された商品なし — 上の検索から追加してください
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {(products as any[]).map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-xl">
                <img src={imgUrl(p.it_img1)} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.it_name}</p>
                  <p className="text-xs text-primary font-bold">{formatPrice(p.it_price)}</p>
                </div>
                <button onClick={() => removeMutation.mutate(p.id)} disabled={removeMutation.isPending}
                  className="w-6 h-6 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SetConfigTab({ ca_id }: { ca_id: string }) {
  const { data: categories = [], isLoading } = useGiftCategories();
  const [selectedSubCaId, setSelectedSubCaId] = useState<string | null>(null);

  const catList = categories as any[];
  const currentMain = catList.find((c: any) => c.ca_id === ca_id);
  const subList: any[] = currentMain?.sub_categories ?? [];
  const selectedSub = subList.find((s: any) => s.ca_id === selectedSubCaId) ?? subList[0] ?? null;

  if (isLoading) return <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  return (
    <div className="flex gap-5 min-h-[500px]">
      {/* 좌측: 서브카테고리 */}
      <div className="w-52 flex-shrink-0 space-y-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">サブメニュー</p>
        {subList.map((sub: any) => {
          const isActive = (selectedSub?.ca_id ?? subList[0]?.ca_id) === sub.ca_id;
          return (
            <button key={sub.ca_id} onClick={() => setSelectedSubCaId(sub.ca_id)}
              className={cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all",
                isActive ? "bg-primary text-white shadow-sm" : "text-slate-700 hover:bg-slate-100")}>
              <Tag className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-white/80" : "text-slate-400")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{sub.ca_name}</p>
                <p className={cn("text-xs", isActive ? "text-white/70" : "text-slate-400")}>{sub.slot_count}点構成</p>
              </div>
              <ChevronRight className={cn("w-3 h-3 flex-shrink-0", isActive ? "text-white/60" : "text-slate-300")} />
            </button>
          );
        })}
      </div>

      {/* 우측: 패널 */}
      <div className="flex-1 min-w-0">
        {selectedSub ? (
          <Card className="p-5 h-full overflow-y-auto">
            <SetConfigPanel key={selectedSub.ca_id} sub={selectedSub} />
          </Card>
        ) : (
          <Card className="p-10 flex flex-col items-center justify-center h-full text-center">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mb-2" />
            <p className="text-slate-400">左のサブメニューを選択してください</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── 패키지 관리 탭 ───────────────────────────────────────────────────────────
const CA_LABEL: Record<string, { label: string; emoji: string }> = {
  "10": { label: "お菓子類", emoji: "🍪" },
  "20": { label: "食用油類", emoji: "🫙" },
  "30": { label: "缶詰類", emoji: "🥫" },
};

type PkgForm = {
  name: string; description: string; price: number;
  thumb_img: string; ca_id: string; item_count: number;
  sort_order: number; is_active: number;
};

const emptyPkgForm = (): PkgForm => ({
  name: "", description: "", price: 0,
  thumb_img: "", ca_id: "10", item_count: 1,
  sort_order: 0, is_active: 1,
});

function PkgFormModal({
  pkg, onClose, onSaved,
}: { pkg: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<PkgForm>(
    pkg ? {
      name: pkg.name, description: pkg.description ?? "",
      price: pkg.price ?? 0, thumb_img: pkg.thumb_img ?? "",
      ca_id: pkg.ca_id, item_count: pkg.item_count ?? 1,
      sort_order: pkg.sort_order ?? 0, is_active: pkg.is_active ?? 1,
    } : emptyPkgForm()
  );
  const [saving, setSaving] = useState(false);
  const [pkgItems, setPkgItems] = useState<any[]>(pkg?.items ?? []);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = !!pkg;

  const set = (k: keyof PkgForm, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await customFetch<any[]>(
        `/api/shop-admin/gift/packages/search-items?q=${encodeURIComponent(searchQ)}&ca_id=${form.ca_id}`
      );
      setSearchResults(res as any[]);
    } catch { toast({ title: "検索エラー", variant: "destructive" }); }
    setSearching(false);
  };

  const addItem = async (item: any) => {
    if (!isEdit) {
      setPkgItems(prev => [...prev, { ...item, id: Date.now(), quantity: 1, _temp: true }]);
      setSearchResults([]);
      setSearchQ("");
      return;
    }
    try {
      const r = await customFetch<any>(`/api/shop-admin/gift/packages/${pkg.id}/items`, {
        method: "POST",
        body: JSON.stringify({ it_id: item.it_id, it_name: item.it_name, it_img1: item.it_img1, quantity: 1 }),
      });
      setPkgItems(prev => [...prev, { ...item, id: (r as any).id, quantity: 1 }]);
      setSearchResults([]);
      setSearchQ("");
      queryClient.invalidateQueries({ queryKey: ["admin-gift-packages"] });
      toast({ title: "商品の追加完了" });
    } catch { toast({ title: "追加に失敗しました", variant: "destructive" }); }
  };

  const removeItem = async (itemId: number, temp: boolean) => {
    if (temp || !isEdit) {
      setPkgItems(prev => prev.filter(i => i.id !== itemId));
      return;
    }
    try {
      await customFetch(`/api/shop-admin/gift/packages/${pkg.id}/items/${itemId}`, { method: "DELETE" });
      setPkgItems(prev => prev.filter(i => i.id !== itemId));
      queryClient.invalidateQueries({ queryKey: ["admin-gift-packages"] });
      toast({ title: "商品を削除しました" });
    } catch { toast({ title: "削除に失敗しました", variant: "destructive" }); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "パッケージ名を入力してください", variant: "destructive" }); return; }
    setSaving(true);
    try {
      let pkgId = pkg?.id;
      if (isEdit) {
        await customFetch(`/api/shop-admin/gift/packages/${pkgId}`, {
          method: "PUT", body: JSON.stringify(form),
        });
      } else {
        const r = await customFetch<any>("/api/shop-admin/gift/packages", {
          method: "POST", body: JSON.stringify(form),
        });
        pkgId = (r as any).id;
        // 임시 아이템들 저장
        for (const item of pkgItems) {
          await customFetch(`/api/shop-admin/gift/packages/${pkgId}/items`, {
            method: "POST",
            body: JSON.stringify({ it_id: item.it_id, it_name: item.it_name, it_img1: item.it_img1, quantity: item.quantity ?? 1 }),
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["admin-gift-packages"] });
      toast({ title: isEdit ? "パッケージの更新完了" : "パッケージの登録完了" });
      onSaved();
    } catch (e: any) {
      toast({ title: "保存に失敗しました: " + (e.message ?? ""), variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            {isEdit ? "パッケージ編集" : "パッケージ登録"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 mb-1 block">パッケージ名 *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="例: お菓子類 3個入りギフトセット"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 mb-1 block">説明</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="パッケージの簡単な説明"
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">カテゴリ</label>
              <select value={form.ca_id} onChange={e => set("ca_id", e.target.value)}
                className="w-full h-9 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none">
                {MAIN_TABS.map(t => <option key={t.ca_id} value={t.ca_id}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">入数</label>
              <input type="number" min={1} value={form.item_count} onChange={e => set("item_count", Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">販売価格 (円)</label>
              <input type="number" min={0} value={form.price} onChange={e => set("price", Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">表示順</label>
              <input type="number" min={0} value={form.sort_order} onChange={e => set("sort_order", Number(e.target.value))}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 mb-1 block">代表画像</label>
              {/* 미리보기 */}
              {form.thumb_img ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 mb-2 bg-slate-50">
                  <img src={form.thumb_img}
                    alt="プレビュー" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => set("thumb_img", "")}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70">✕</button>
                </div>
              ) : (
                <div className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center mb-2 bg-slate-50 text-slate-400 text-sm">
                  画像をアップロードするかURLを入力してください
                </div>
              )}
              {/* 파일 업로드 버튼 */}
              <label className="block w-full">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 w-full justify-center">
                  📁 画像ファイルをアップロード
                </span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append("image", file);
                    try {
                      const token = localStorage.getItem("token") || "";
                      const res = await fetch(`/api/shop-admin/gift/packages/upload-image`, {
                        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
                      });
                      const d = await res.json();
                      if (d.url) set("thumb_img", d.url);
                      else toast({ title: d.error ?? "アップロードに失敗しました", variant: "destructive" });
                    } catch { toast({ title: "アップロードエラー", variant: "destructive" }); }
                  }}
                />
              </label>
              <p className="text-xs text-slate-400 mt-1">またはURLを直接入力</p>
              <input value={form.thumb_img} onChange={e => set("thumb_img", e.target.value)}
                placeholder="https://... または /uploads/gift-packages/..."
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">ステータス</label>
              <select value={form.is_active} onChange={e => set("is_active", Number(e.target.value))}
                className="w-full h-9 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none">
                <option value={1}>有効</option>
                <option value={0}>無効</option>
              </select>
            </div>
          </div>

          {/* 구성 상품 */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">構成商品 ({pkgItems.length}件)</p>
            {/* 상품 검색 */}
            <div className="flex gap-2 mb-2">
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="商品名で検索..."
                className="flex-1 h-8 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" />
              <button onClick={handleSearch} disabled={searching}
                className="px-3 h-8 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mb-2 border border-emerald-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {searchResults.map(r => (
                  <div key={r.it_id} className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-50 last:border-0 hover:bg-emerald-50 cursor-pointer"
                    onClick={() => addItem(r)}>
                    <img src={imgUrl(r.it_img1)} alt="" className="w-8 h-8 rounded object-cover bg-slate-100 flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{r.it_name}</p>
                      <p className="text-xs text-primary font-bold">{formatPrice(r.it_price)}</p>
                    </div>
                    <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* 등록된 아이템 */}
            {pkgItems.length === 0 ? (
              <div className="py-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
                構成商品を検索して追加してください
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {pkgItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <img src={imgUrl(item.it_img1)} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-200 flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.it_name}</p>
                    </div>
                    <button onClick={() => removeItem(item.id, !!item._temp)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="px-6 py-4 border-t border-slate-100">
          <button onClick={handleSave} disabled={saving}
            className="w-full h-10 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "更新を保存" : "パッケージ登録"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PackageManageTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<null | "create" | { pkg: any }>(null);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["admin-gift-packages"],
    queryFn: () => customFetch<any[]>("/api/shop-admin/gift/packages"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customFetch(`/api/shop-admin/gift/packages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-packages"] });
      toast({ title: "パッケージの削除完了" });
    },
    onError: () => toast({ title: "削除に失敗しました", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, pkg }: { id: number; pkg: any }) =>
      customFetch(`/api/shop-admin/gift/packages/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...pkg, is_active: pkg.is_active ? 0 : 1 }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-gift-packages"] }),
  });

  const pkgList = packages as any[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-600">
          合計 <span className="text-primary">{pkgList.length}</span>件のパッケージ
        </p>
        <button onClick={() => setModal("create")}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">
          <Plus className="w-4 h-4" /> パッケージ登録
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : pkgList.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <Gift className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">登録されたギフトパッケージがありません</p>
          <button onClick={() => setModal("create")}
            className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold">
            最初のパッケージを登録
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {pkgList.map((pkg: any) => {
            const cat = CA_LABEL[pkg.ca_id] ?? { label: "その他", emoji: "🎁" };
            return (
              <div key={pkg.id} className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 transition-colors">
                {/* 썸네일 */}
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl">
                  {pkg.thumb_img ? (
                    <img src={pkg.thumb_img} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : cat.emoji}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{pkg.name}</p>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                      pkg.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                    )}>
                      {pkg.is_active ? "有効" : "無効"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400">{cat.emoji} {cat.label}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">{pkg.item_count}個入り</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-bold text-primary">{formatPrice(pkg.price)}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">構成 {pkg.item_count_actual}種類</span>
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{pkg.description}</p>
                  )}
                </div>

                {/* 액션 */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleActiveMutation.mutate({ id: pkg.id, pkg })}
                    title={pkg.is_active ? "無効にする" : "有効にする"}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                    {pkg.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setModal({ pkg })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-500">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => {
                    if (confirm(`「${pkg.name}」パッケージを削除しますか？`)) deleteMutation.mutate(pkg.id);
                  }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === "create" && (
        <PkgFormModal pkg={null} onClose={() => setModal(null)} onSaved={() => setModal(null)} />
      )}
      {modal && modal !== "create" && (
        <PkgFormModal pkg={(modal as any).pkg} onClose={() => setModal(null)} onSaved={() => setModal(null)} />
      )}
    </div>
  );
}

// ── 선물 주문 관리 탭 ────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:        { label: "待機中",      color: "#92400e", bg: "#fef3c7" },
  address_filled: { label: "配送先入力済み", color: "#1e40af", bg: "#dbeafe" },
  preparing:      { label: "準備中",      color: "#5b21b6", bg: "#ede9fe" },
  shipped:        { label: "発送済み",    color: "#065f46", bg: "#d1fae5" },
  delivered:      { label: "配送完了",    color: "#374151", bg: "#f3f4f6" },
  cancelled:      { label: "キャンセル",  color: "#991b1b", bg: "#fee2e2" },
};

interface GiftOrderItem { it_id: string; it_name: string; it_img1: string; quantity: number }
interface GiftOrder {
  id: number; token: string; set_name: string; set_ca_id: string; slot_count: number;
  status: string; sender_mb_id: string; sender_message?: string;
  recipient_name?: string; recipient_phone?: string; recipient_postcode?: string;
  recipient_address?: string; recipient_address_detail?: string; address_filled_at?: string;
  tracking_number?: string; admin_memo?: string; created_at: string;
  items: GiftOrderItem[];
}

function GiftOrderRow({ order, onRefresh }: { order: GiftOrder; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.tracking_number || "");
  const [memo, setMemo] = useState(order.admin_memo || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const receiveUrl = `${window.location.origin.replace("/order-system", "")}/shop/gift/receive/${order.token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(receiveUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`/api/shop-admin/gift/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, tracking_number: tracking, memo }),
      });
      const d = await r.json();
      if (d.ok) { toast({ title: "保存しました" }); onRefresh(); }
      else toast({ title: d.error || "保存に失敗しました", variant: "destructive" });
    } catch { toast({ title: "エラーが発生しました", variant: "destructive" }); }
    setSaving(false);
  };

  const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const hasAddress = !!order.recipient_address;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
      {/* 헤더 행 */}
      <div
        className="flex items-center gap-3 p-4 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0">
          <span className="text-slate-400 text-xs font-mono">#{order.id}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-slate-900 truncate">{order.set_name}</span>
            <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>
              {st.label}
            </span>
            {order.set_ca_id === "custom" && (
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">オリジナル構成</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><User size={11} />{order.sender_mb_id}</span>
            <span>{order.slot_count}点構成</span>
            <span>{new Date(order.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            {hasAddress && <span className="flex items-center gap-1 text-blue-600"><MapPin size={11} />配送先入力済み</span>}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {order.tracking_number && (
            <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg font-bold">
              <Truck size={11} />{order.tracking_number}
            </span>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {/* 확장 패널 */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 상품 목록 */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">📦 構成商品</p>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item, i) => (
                  <div key={i} className="relative group" title={item.it_name}>
                    <img src={imgUrl(item.it_img1)} alt={item.it_name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    {item.quantity > 1 && (
                      <span className="absolute -top-1 -right-1 bg-slate-700 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{item.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
              {order.sender_message && (
                <div className="mt-3 bg-pink-50 border border-pink-100 rounded-lg p-2.5">
                  <p className="text-xs text-pink-600 font-bold mb-1">💌 ギフトメッセージ</p>
                  <p className="text-xs text-slate-700">{order.sender_message}</p>
                </div>
              )}
            </div>

            {/* 수령인 정보 */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><MapPin size={11} />配送先情報</p>
              {hasAddress ? (
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm space-y-1">
                  <p className="font-bold">{order.recipient_name} <span className="text-slate-400 font-normal text-xs">{order.recipient_phone}</span></p>
                  <p className="text-slate-600 text-xs">[{order.recipient_postcode}] {order.recipient_address}</p>
                  {order.recipient_address_detail && <p className="text-slate-600 text-xs">{order.recipient_address_detail}</p>}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  <p className="font-bold mb-1">配送先未入力</p>
                  <p>受取人がまだ配送先を入力していません。</p>
                  <button onClick={handleCopy} className="mt-2 flex items-center gap-1.5 text-xs bg-white border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-colors font-bold">
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? "コピーしました！" : "配送先入力リンクをコピー"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 상태 변경 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-600">🔧 注文処理</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">ステータス変更</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                  {Object.entries(STATUS_MAP).map(([v, s]) => (
                    <option key={v} value={v}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">送り状番号</label>
                <input value={tracking} onChange={e => setTracking(e.target.value)}
                  placeholder="送り状番号を入力"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">管理者メモ</label>
                <input value={memo} onChange={e => setMemo(e.target.value)}
                  placeholder="社内メモ"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                保存
              </button>
              {hasAddress && (
                <button onClick={handleCopy}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "コピーしました" : "リンクをコピー"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GiftOrdersTab() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ orders: GiftOrder[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (status) params.set("status", status);
      const r = await fetch(`/api/shop-admin/gift/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(await r.json());
    } catch { toast({ title: "データを読み込めませんでした", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [status, page]);

  const STATUS_FILTERS = [
    { value: "", label: "すべて" },
    { value: "pending", label: "待機中" },
    { value: "address_filled", label: "配送先入力" },
    { value: "preparing", label: "準備中" },
    { value: "shipped", label: "発送済み" },
    { value: "delivered", label: "配送完了" },
    { value: "cancelled", label: "キャンセル" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                status === f.value ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300")}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={fetchOrders} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-bold">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />更新
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /></div>
      ) : !data || data.orders.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">ギフト注文がありません</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-3">合計 {data.total}件</p>
          {data.orders.map(order => (
            <GiftOrderRow key={order.id} order={order} onRefresh={fetchOrders} />
          ))}
          {/* 페이지네이션 */}
          {data.total > 15 && (
            <div className="flex justify-center gap-2 mt-4">
              {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold hover:bg-slate-50">前へ</button>}
              <span className="px-4 py-2 text-sm text-slate-500">{page} / {Math.ceil(data.total / 15)}</span>
              {page * 15 < data.total && <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold hover:bg-slate-50">次へ</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminGifts() {
  const [activeTab, setActiveTab] = useState("10");
  const [viewMode, setViewMode] = useState<"items" | "sets" | "packages" | "orders">("packages");

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ギフト管理</h1>
          <p className="text-slate-500 mt-1 font-medium">ギフトパッケージの登録・編集・削除、および商品・セット構成を管理します。</p>
        </div>
        {/* 뷰 전환 */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
          <button onClick={() => setViewMode("orders")}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              viewMode === "orders" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <ShoppingBag className="w-4 h-4" /> 注文管理
          </button>
          <button onClick={() => setViewMode("packages")}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              viewMode === "packages" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Gift className="w-4 h-4" /> パッケージ管理
          </button>
          <button onClick={() => setViewMode("items")}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              viewMode === "items" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Package className="w-4 h-4" /> 商品管理
          </button>
          <button onClick={() => setViewMode("sets")}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              viewMode === "sets" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Tag className="w-4 h-4" /> セット構成
          </button>
        </div>
      </div>

      {/* 카테고리 탭 (items/sets 모드에서만 표시) */}
      {(viewMode === "items" || viewMode === "sets") && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {MAIN_TABS.map((tab) => (
            <button key={tab.ca_id} onClick={() => setActiveTab(tab.ca_id)}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                activeTab === tab.ca_id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              <span>{tab.emoji}</span>{tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 컨텐츠 */}
      <Card className="p-6">
        {viewMode === "orders" ? (
          <GiftOrdersTab />
        ) : viewMode === "packages" ? (
          <PackageManageTab />
        ) : viewMode === "items" ? (
          <ItemListTab key={activeTab} ca_id={activeTab} />
        ) : (
          <SetConfigTab key={activeTab} ca_id={activeTab} />
        )}
      </Card>
    </div>
  );
}
