import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, Badge, Button } from "../components/ui";
import { formatCurrency, cn } from "../lib/utils";
import {
  Search, Loader2, Plus, Trash2, CheckSquare, Square,
  Package, Filter, ChevronLeft, ChevronRight, Copy, DollarSign, X, CalendarClock,
  ShoppingBag, Eye, ArrowUpDown
} from "lucide-react";
import { Input, Label } from "../components/ui";
import { toast } from "../hooks/use-toast";
import { Link, useLocation } from "wouter";

function imgUrl(p: string) {
  if (!p) return "";
  if (p.startsWith("http") || p.startsWith("/api/")) return p;
  return `/api/product-image/${p}`;
}

type BatchTab = "none" | "delete" | "sale" | "display" | "price" | "shelflife";
type SortKey = "newest" | "price_asc" | "price_desc" | "name_asc";

const PAGE_SIZES = [10, 20, 50];
const PAGE_WINDOW = 5;

function useAdminProducts(params: any) {
  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      if (params.search) qs.set("search", params.search);
      if (params.category) qs.set("category", params.category);
      if (params.it_use !== undefined && params.it_use !== "") qs.set("it_use", params.it_use);
      if (params.image_source) qs.set("image_source", params.image_source);
      return customFetch<any>(`/api/admin/products?${qs.toString()}`);
    },
  });
}

function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => customFetch<any>("/api/admin/categories"),
  });
}

function useCategoryStats() {
  return useQuery({
    queryKey: ["admin-category-stats"],
    queryFn: () => customFetch<any>("/api/admin/products/category-stats"),
    staleTime: 30000,
  });
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [makerFilter, setMakerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [useFilter, setUseFilter] = useState("");
  const [imgSourceFilter, setImgSourceFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [pageSize, setPageSize] = useState(30);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeBatchTab, setActiveBatchTab] = useState<BatchTab>("none");
  const [priceAction, setPriceAction] = useState("adjust_price_percent");
  const [priceDirection, setPriceDirection] = useState<"up" | "down">("up");
  const [priceValue, setPriceValue] = useState("");
  const [shelfLifeValue, setShelfLifeValue] = useState("");

  const { data: catData } = useAdminCategories();
  const categories = catData?.categories || [];
  const activeCategories = categories.filter((c: any) => String(c.ca_use) === "1");

  const { data: statsData } = useCategoryStats();
  const summary = statsData?.summary;
  const catStats: any[] = statsData?.categories || [];

  useEffect(() => {
    setPage(1);
  }, [search, makerFilter, categoryFilter, useFilter, imgSourceFilter, sortKey, pageSize]);

  const { data, isLoading } = useAdminProducts({ page, limit: pageSize, search, category: categoryFilter, maker: makerFilter, it_use: useFilter, image_source: imgSourceFilter, sort: sortKey });
  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * pageSize, total);
  const pageNumbers = useMemo(() => {
    if (totalPages <= PAGE_WINDOW) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half = Math.floor(PAGE_WINDOW / 2);
    let start = Math.max(1, page - half);
    let end = start + PAGE_WINDOW - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - PAGE_WINDOW + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customFetch(`/api/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "削除完了" });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => {
      toast({ title: "削除に失敗しました", description: err?.message, variant: "destructive" });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      customFetch("/api/admin/products/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: ids }),
      }),
    onSuccess: () => {
      toast({ title: "一括削除完了", description: `${selectedIds.size}件の商品を削除しました。` });
      setSelectedIds(new Set());
      setActiveBatchTab("none");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => {
      toast({ title: "削除に失敗しました", description: err?.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, it_use }: { id: string; it_use: string }) =>
      customFetch("/api/admin/products/batch-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: [id], it_use }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => {
      toast({ title: "ステータス変更に失敗しました", description: err?.message, variant: "destructive" });
    },
  });

  const batchStatusMutation = useMutation({
    mutationFn: (data: { product_ids: string[]; it_use: string }) =>
      customFetch("/api/admin/products/batch-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_: any, variables: { product_ids: string[]; it_use: string }) => {
      const label = variables.it_use === "1" ? "販売中" : "販売停止";
      toast({ title: `一括${label} 完了`, description: `${selectedIds.size}件の商品を${label}にしました。` });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => {
      toast({ title: "ステータス変更に失敗しました", description: err?.message, variant: "destructive" });
    },
  });

  const copyMutation = useMutation({
    mutationFn: (id: string) => customFetch<any>(`/api/admin/products/${id}/copy`, { method: "POST" }),
    onSuccess: (data: any) => {
      toast({ title: "商品のコピー完了", description: "コピーした商品の編集ページに移動します。" });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate(`/admin/products/${data.it_id}`);
    },
    onError: (err: any) => {
      toast({ title: "コピーに失敗しました", description: err?.message, variant: "destructive" });
    },
  });

  const batchPriceMutation = useMutation({
    mutationFn: (data: { product_ids: string[]; action: string; value: number }) =>
      customFetch("/api/admin/products/batch-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "価格の更新完了", description: `${selectedIds.size}件の商品の価格を更新しました。` });
      setPriceValue("");
      setActiveBatchTab("none");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => {
      toast({ title: "価格の更新に失敗しました", description: err?.message, variant: "destructive" });
    },
  });

  const batchShelfLifeMutation = useMutation({
    mutationFn: (data: { product_ids: string[]; shelf_life: string }) =>
      customFetch("/api/admin/products/batch-shelf-life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "賞味期限の一括変更完了", description: `${selectedIds.size}件の商品の賞味期限を変更しました。` });
      setShelfLifeValue("");
      setActiveBatchTab("none");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) => {
      toast({ title: "賞味期限の変更に失敗しました", description: err?.message, variant: "destructive" });
    },
  });

  const handleBatchShelfLife = () => {
    if (!shelfLifeValue.trim()) {
      toast({ title: "賞味期限を入力してください", variant: "destructive" });
      return;
    }
    batchShelfLifeMutation.mutate({ product_ids: Array.from(selectedIds), shelf_life: shelfLifeValue.trim() });
  };

  const handleBatchPrice = () => {
    const val = Number(priceValue);
    if (isNaN(val) || val <= 0) {
      toast({ title: "0より大きい数値を入力してください", variant: "destructive" });
      return;
    }
    const finalValue = priceDirection === "down" ? -val : val;
    batchPriceMutation.mutate({ product_ids: Array.from(selectedIds), action: priceAction, value: finalValue });
  };

  const selectedProducts = products.filter((p: any) => selectedIds.has(p.it_id));

  const calcPreviewPrice = (currentPrice: number) => {
    const val = Number(priceValue) || 0;
    if (val <= 0) return currentPrice;
    const signedVal = priceDirection === "down" ? -val : val;
    switch (priceAction) {
      case "set_price":
      case "set_cust_price":
        return val;
      case "adjust_price_percent":
        return Math.round(currentPrice * (1 + signedVal / 100));
      case "adjust_price_amount":
        return currentPrice + signedVal;
      default:
        return currentPrice;
    }
  };

  const handleCopy = (p: any) => {
    if (confirm(`「${p.it_name}」をコピーしますか？`)) {
      copyMutation.mutate(p.it_id);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map((p: any) => p.it_id)));
  };

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setMakerFilter("");
    setCategoryFilter("");
    setUseFilter("");
    setImgSourceFilter("");
    setSortKey("newest");
    setPage(1);
  };

  const handleDelete = (product: any) => {
    if (!confirm(`「${product.it_name}」を削除してもよろしいですか？`)) return;
    deleteMutation.mutate(product.it_id);
  };

  const handleBatchDelete = () => {
    if (!confirm(`選択した${selectedIds.size}件の商品を削除してもよろしいですか？\nこの操作は元に戻せません。`)) return;
    batchDeleteMutation.mutate(Array.from(selectedIds));
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">商品管理</h1>
          <p className="text-slate-500 mt-1 font-medium">商品の登録・編集・削除を行います。合計 {total}件</p>
        </div>
        <Button onClick={() => navigate("/admin/products/new")} className="h-10">
          <Plus className="w-4 h-4 mr-1.5" /> 商品登録
        </Button>
      </div>

      {/* 이미지 교체 필요 배너 — summary 조건 밖에서 독립 렌더 */}
      <button
        onClick={() => { setImgSourceFilter(imgSourceFilter === "kakao" ? "" : "kakao"); setCategoryFilter(""); setUseFilter(""); setPage(1); }}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", borderRadius: "12px", border: "2px solid",
          fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
          backgroundColor: imgSourceFilter === "kakao" ? "#f97316" : "#fff7ed",
          color: imgSourceFilter === "kakao" ? "#fff" : "#c2410c",
          borderColor: imgSourceFilter === "kakao" ? "#f97316" : "#fdba74",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          🔶 画像の差し替えが必要な商品
          <span style={{
            fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "9999px",
            backgroundColor: imgSourceFilter === "kakao" ? "rgba(255,255,255,0.25)" : "#fed7aa",
            color: imgSourceFilter === "kakao" ? "#fff" : "#9a3412",
          }}>クリックすると該当商品のみ表示されます</span>
        </span>
        <span style={{ fontSize: "24px", fontWeight: 900 }}>{Number(summary?.kakao_img_count || 0).toLocaleString()}件</span>
      </button>

      {/* 카테고리별 통계 */}
      {summary && (
        <div className="space-y-3">
          {/* 요약 바 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { label: "すべて", value: summary.total, color: "bg-slate-100 text-slate-700", filter: () => { setUseFilter(""); setCategoryFilter(""); setImgSourceFilter(""); } },
              { label: "販売中", value: summary.use_on, color: "bg-emerald-50 text-emerald-700", filter: () => { setUseFilter("1"); setCategoryFilter(""); setImgSourceFilter(""); } },
              { label: "非表示", value: summary.use_off, color: "bg-amber-50 text-amber-700", filter: () => { setUseFilter("0"); setCategoryFilter(""); setImgSourceFilter(""); } },
              { label: "品切れ", value: summary.soldout, color: "bg-red-50 text-red-600", filter: null },
              { label: "カテゴリ未設定 ⚠️", value: summary.unassigned, color: "bg-purple-50 text-purple-700", filter: null },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-3 ${s.color} ${s.filter ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                onClick={() => s.filter?.()}>
                <p className="text-xs font-medium opacity-70">{s.label}</p>
                <p className="text-2xl font-black mt-0.5">{Number(s.value || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* 1차 카테고리 칩 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter("")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!categoryFilter ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              すべて {Number(summary.total || 0).toLocaleString()}
            </button>
            {catStats.filter(c => c.ca_name).map((c) => (
              <button
                key={c.ca_2}
                onClick={() => { setCategoryFilter(c.ca_2); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${categoryFilter === c.ca_2 ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700"}`}
              >
                {c.ca_name} <span className="opacity-70">{Number(c.total || 0)}</span>
                {Number(c.use_off) > 0 && <span className="ml-1 text-amber-500">({c.use_off}非表示)</span>}
              </button>
            ))}
            {catStats.filter(c => !c.ca_name).map((c) => (
              <button key="uncat"
                onClick={() => { setCategoryFilter(c.ca_2 || ""); setPage(1); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-all">
                未分類 {Number(c.total || 0)}
              </button>
            ))}
          </div>
        </div>
      )}

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">検索・フィルター</span>
          <button onClick={clearFilters} className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
            <X className="w-3 h-3" /> リセット
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <select
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-primary transition-all md:col-span-4"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">カテゴリ 第1階層</option>
            {activeCategories.filter((c: any) => c.ca_id.length === 2).map((c: any) => (
              <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>
            ))}
          </select>
          <select
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-primary transition-all md:col-span-4"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">カテゴリ 第2階層</option>
            {activeCategories.filter((c: any) => c.ca_id.length === 4).map((c: any) => (
              <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>
            ))}
          </select>
          <select
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-primary transition-all md:col-span-4"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">カテゴリ 第3階層</option>
            {activeCategories.filter((c: any) => c.ca_id.length === 6).map((c: any) => (
              <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-primary transition-all"
              placeholder="商品名・商品コードで検索..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <input
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-primary transition-all md:col-span-3"
            placeholder="メーカーで検索..."
            value={makerFilter}
            onChange={(e) => { setMakerFilter(e.target.value); setPage(1); }}
          />
          <select
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-primary transition-all md:col-span-3"
            value={useFilter}
            onChange={(e) => { setUseFilter(e.target.value); setPage(1); }}
          >
            <option value="">すべてのステータス</option>
            <option value="1">販売中</option>
            <option value="0">販売停止</option>
          </select>
          <select
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-primary transition-all md:col-span-3"
            value={imgSourceFilter}
            onChange={(e) => { setImgSourceFilter(e.target.value); setPage(1); }}
          >
            <option value="">すべての画像</option>
            <option value="kakao">🔶 カカオ仮画像</option>
            <option value="original">元の画像</option>
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <select
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-primary transition-all"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="newest">登録順</option>
            <option value="price_desc">価格の高い順</option>
            <option value="price_asc">価格の低い順</option>
            <option value="name_asc">名前順</option>
          </select>
          <select
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-primary transition-all"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}件ずつ表示</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 overflow-x-auto">
          {selectedIds.size > 0 && (
            <span className="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 border-r border-slate-200 whitespace-nowrap">{selectedIds.size}件選択</span>
          )}
          {([
            { key: "delete" as BatchTab, label: "選択削除", icon: Trash2, color: "text-red-600" },
            { key: "sale" as BatchTab, label: "販売変更", icon: ShoppingBag, color: "text-emerald-600" },
            { key: "display" as BatchTab, label: "表示変更", icon: Eye, color: "text-violet-600" },
            { key: "price" as BatchTab, label: "販売価格変更", icon: DollarSign, color: "text-blue-600" },
            { key: "shelflife" as BatchTab, label: "賞味期限変更", icon: CalendarClock, color: "text-orange-600" },
          ]).map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveBatchTab(activeBatchTab === key ? "none" : key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap",
                activeBatchTab === key
                  ? `${color} border-current bg-white`
                  : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-white/60"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
          {selectedIds.size > 0 && (
            <button onClick={() => { setSelectedIds(new Set()); setActiveBatchTab("none"); }} className="ml-auto px-3 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {activeBatchTab !== "none" && (
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/30">
            {selectedIds.size === 0 ? (
              <p className="text-sm text-slate-500">変更する商品を先に選択してください。</p>
            ) : activeBatchTab === "delete" ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600">選択した<b>{selectedIds.size}件</b>の商品を削除します。</p>
                <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-8" onClick={handleBatchDelete} disabled={batchDeleteMutation.isPending}>
                  {batchDeleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                  {batchDeleteMutation.isPending ? "削除中..." : "削除を実行"}
                </Button>
              </div>
            ) : activeBatchTab === "sale" ? (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-slate-600">選択した<b>{selectedIds.size}件</b>の商品の販売ステータスを変更します。</p>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8" onClick={() => batchStatusMutation.mutate({ product_ids: Array.from(selectedIds), it_use: "1" })} disabled={batchStatusMutation.isPending}>
                  販売中に変更
                </Button>
                <Button size="sm" variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100 h-8" onClick={() => batchStatusMutation.mutate({ product_ids: Array.from(selectedIds), it_use: "0" })} disabled={batchStatusMutation.isPending}>
                  販売停止に変更
                </Button>
              </div>
            ) : activeBatchTab === "display" ? (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-slate-600">選択した<b>{selectedIds.size}件</b>の商品の表示ステータスを変更します。</p>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white h-8" onClick={() => batchStatusMutation.mutate({ product_ids: Array.from(selectedIds), it_use: "1" })} disabled={batchStatusMutation.isPending}>
                  表示する
                </Button>
                <Button size="sm" variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100 h-8" onClick={() => batchStatusMutation.mutate({ product_ids: Array.from(selectedIds), it_use: "0" })} disabled={batchStatusMutation.isPending}>
                  表示しない
                </Button>
                <span className="text-xs text-slate-400">※ 表示ステータスと販売ステータスは同一に管理されます。</span>
              </div>
            ) : activeBatchTab === "price" ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">選択した<b>{selectedIds.size}件</b>の商品の販売価格を変更します。</p>
                <div className="flex items-end gap-3 flex-wrap">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">変更方法</Label>
                    <select
                      className="h-9 px-3 rounded-lg bg-white border border-slate-300 text-sm font-bold"
                      value={priceAction}
                      onChange={(e) => setPriceAction(e.target.value)}
                    >
                      <option value="adjust_price_percent">販売価格の割合調整 (%)</option>
                      <option value="adjust_price_amount">販売価格の金額調整 (円)</option>
                      <option value="set_price">販売価格を一括設定</option>
                      <option value="set_cust_price">希望小売価格を一括設定</option>
                    </select>
                  </div>
                  {(priceAction === "adjust_price_percent" || priceAction === "adjust_price_amount") && (
                    <div className="flex gap-1">
                      <button className={cn("h-9 px-3 rounded-lg text-sm font-bold border transition-all", priceDirection === "up" ? "bg-red-50 border-red-300 text-red-600" : "bg-white border-slate-300 text-slate-400")} onClick={() => setPriceDirection("up")}>▲ 値上げ</button>
                      <button className={cn("h-9 px-3 rounded-lg text-sm font-bold border transition-all", priceDirection === "down" ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-white border-slate-300 text-slate-400")} onClick={() => setPriceDirection("down")}>▼ 値下げ</button>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-slate-500 mb-1">
                      {priceAction === "set_price" ? "販売価格 (円)" :
                       priceAction === "set_cust_price" ? "希望小売価格 (円)" :
                       priceAction.includes("percent") ? "割合 (%)" : "金額 (円)"}
                    </Label>
                    <Input type="number" min="0" className="h-9 w-32" value={priceValue} onChange={(e: any) => setPriceValue(e.target.value)} placeholder={priceAction.includes("percent") ? "10" : "1000"} />
                  </div>
                  <Button size="sm" className="h-9" onClick={handleBatchPrice} disabled={batchPriceMutation.isPending || !priceValue}>
                    {batchPriceMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                    適用
                  </Button>
                </div>
                {selectedProducts.length > 0 && Number(priceValue) > 0 && (
                  <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-slate-50 border-b text-slate-500">
                        <th className="text-left px-2 py-1.5 font-medium">商品名</th>
                        <th className="text-right px-2 py-1.5 font-medium w-24">現在価格</th>
                        <th className="text-center px-2 py-1.5 w-6">→</th>
                        <th className="text-right px-2 py-1.5 font-medium w-24">変更後</th>
                        <th className="text-right px-2 py-1.5 font-medium w-20">差額</th>
                      </tr></thead>
                      <tbody>
                        {selectedProducts.slice(0, 10).map((p: any) => {
                          const cur = priceAction.includes("cust") ? Number(p.it_cust_price) || 0 : Number(p.it_price) || 0;
                          const nw = calcPreviewPrice(cur);
                          const d = nw - cur;
                          return (
                            <tr key={p.it_id} className="border-b last:border-b-0">
                              <td className="px-2 py-1.5 truncate max-w-[180px]">{p.it_name}</td>
                              <td className="text-right px-2 py-1.5 text-slate-500 font-mono">₩{cur.toLocaleString()}</td>
                              <td className="text-center px-2 py-1.5 text-slate-300">→</td>
                              <td className="text-right px-2 py-1.5 font-bold font-mono">₩{nw.toLocaleString()}</td>
                              <td className={cn("text-right px-2 py-1.5 font-mono font-bold", d > 0 ? "text-red-500" : d < 0 ? "text-blue-500" : "text-slate-400")}>{d > 0 ? `+${d.toLocaleString()}` : d.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {selectedProducts.length > 10 && <div className="text-center text-xs text-slate-400 py-1 border-t bg-slate-50">他 {selectedProducts.length - 10}件</div>}
                  </div>
                )}
              </div>
            ) : activeBatchTab === "shelflife" ? (
              <div className="flex items-end gap-3 flex-wrap">
                <p className="text-sm text-slate-600 self-center">選択した<b>{selectedIds.size}件</b>の商品の賞味期限を変更します。</p>
                <div>
                  <Label className="text-xs text-slate-500 mb-1">賞味期限</Label>
                  <Input className="h-9 w-48" value={shelfLifeValue} onChange={(e: any) => setShelfLifeValue(e.target.value)} placeholder="例: 6か月、2025-12-31" />
                </div>
                <Button size="sm" className="h-9 bg-orange-600 hover:bg-orange-700" onClick={handleBatchShelfLife} disabled={batchShelfLifeMutation.isPending || !shelfLifeValue.trim()}>
                  {batchShelfLifeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  適用
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <Card className="py-20 text-center">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">商品がありません</h3>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="px-3 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600">
                      {selectedIds.size === products.length && products.length > 0 ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">商品</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">ケース入数</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-right whitespace-nowrap">単品販売価格</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-right whitespace-nowrap">希望小売価格</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">在庫</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">付加情報</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">ショップ表示</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center whitespace-nowrap w-24">ステータス</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p: any) => {
                  const boxQty = Number(p.it_2 || 0) || null;
                  const boxPrice = Number(p.it_price) || 0;
                  const custPrice = Number(p.it_cust_price) || 0;
                  const unitPrice = boxQty ? Math.round(boxPrice / boxQty) : null;
                  const isSelected = selectedIds.has(p.it_id);
                  return (
                    <tr
                      key={p.it_id}
                      className={cn(
                        "hover:bg-blue-50/20 cursor-pointer transition-colors",
                        isSelected && "bg-blue-50/40"
                      )}
                      onClick={() => navigate(`/admin/products/${p.it_id}`)}
                    >
                    {/* 체크박스 */}
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(p.it_id)} className="text-slate-300 hover:text-blue-500 transition-colors">
                        {isSelected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>

                    {/* 상품 (이미지 + 코드 + 상품명 + 카테고리) */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0">
                          {p.it_img1 ? (
                            <img
                              src={imgUrl(p.it_img1)}
                              alt=""
                              className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-sm"
                              onError={(e) => {
                                const el = e.target as HTMLImageElement;
                                el.style.display = "none";
                                const fb = el.nextElementSibling as HTMLElement;
                                if (fb) fb.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div className={cn("w-14 h-14 bg-slate-100 rounded-xl items-center justify-center border border-slate-200", p.it_img1 ? "hidden" : "flex")}>
                            <Package className="w-6 h-6 text-slate-300" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 font-mono mb-0.5">{p.it_id}</p>
                          <p className="font-semibold text-sm text-slate-800 leading-snug break-keep line-clamp-2">{p.it_name}</p>
                          <div className="mt-1 flex items-center gap-1 flex-wrap">
                            {p.image_source === "kakao" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-500 border border-orange-200">
                                🔶 カカオ仮画像
                              </span>
                            )}
                            {p.ca_name ? (
                              <>
                                {p.ca_name_root && p.ca_name_root !== p.ca_name && (
                                  <>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                      {p.ca_name_root}
                                    </span>
                                    <span className="text-slate-300 text-[10px]">›</span>
                                  </>
                                )}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-100">
                                  {p.ca_name}
                                </span>
                              </>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-500 border border-amber-200">
                                ⚠ 未分類
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 박스입수 */}
                    <td className="px-3 py-3 text-center">
                      {boxQty ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-sm font-bold text-slate-700">{boxQty}<span className="text-xs font-normal text-slate-400">入</span></span>
                          {unitPrice !== null && (
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">1個あたり {formatCurrency(unitPrice)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">-</span>
                      )}
                    </td>

                    {/* 낱개판매가 */}
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{formatCurrency(boxPrice)}</span>
                    </td>

                    {/* 소비자가 */}
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm text-slate-500 whitespace-nowrap">{custPrice > 0 ? formatCurrency(custPrice) : "-"}</span>
                    </td>

                    {/* 재고 */}
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        "text-sm font-bold",
                        Number(p.it_stock_qty) <= 0 ? "text-red-500" :
                        Number(p.it_stock_qty) < 10 ? "text-amber-500" : "text-slate-700"
                      )}>{p.it_stock_qty ?? "-"}</span>
                    </td>

                    {/* 부가정보 (과세 + 유통기한) */}
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {String(p.it_notax) === "1" ? (
                          <Badge className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 font-semibold border border-emerald-100">非課税</Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 font-semibold border border-amber-100">課税</Badge>
                        )}
                        {p.it_shelf_life ? (
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">{p.it_shelf_life}</span>
                        ) : (
                          <span className="text-[10px] text-slate-200">-</span>
                        )}
                      </div>
                    </td>

                    {/* 쇼핑몰 노출 진단 */}
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const visible = p.it_use === "1";
                        const hasImg = !!p.it_img1;
                        const hasCat = !!p.ca_name;
                        if (!visible) return (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-200 whitespace-nowrap">🔴 販売停止</span>
                          </div>
                        );
                        const issues: string[] = [];
                        if (!hasImg) issues.push("画像なし");
                        if (!hasCat) issues.push("未分類");
                        if (issues.length === 0) return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 whitespace-nowrap">✅ 表示中</span>
                        );
                        return (
                          <div className="flex flex-col items-center gap-1">
                            {issues.map(iss => (
                              <span key={iss} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap">⚠️ {iss}</span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 상태 */}
                    <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {p.it_use === "1" ? (
                        <button onClick={() => toggleStatusMutation.mutate({ id: p.it_id, it_use: "0" })} title="クリックで販売停止">
                          <Badge className="bg-emerald-500 text-white text-[10px] cursor-pointer hover:bg-emerald-600 transition-colors whitespace-nowrap px-2.5 py-1 font-semibold shadow-sm">販売中</Badge>
                        </button>
                      ) : (
                        <button onClick={() => toggleStatusMutation.mutate({ id: p.it_id, it_use: "1" })} title="クリックで販売中">
                          <Badge className="bg-slate-200 text-slate-500 text-[10px] cursor-pointer hover:bg-slate-300 transition-colors whitespace-nowrap px-2.5 py-1 font-semibold">販売停止</Badge>
                        </button>
                      )}
                    </td>

                    {/* 관리 */}
                    <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-0.5">
                        <Link href={`/admin/products/${p.it_id}`} className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">編集</Link>
                        <button onClick={() => handleCopy(p)} disabled={copyMutation.isPending} className="px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-0.5">
                          <Copy className="w-3 h-3" />コピー
                        </button>
                        <button onClick={() => handleDelete(p)} className="px-2 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">削除</button>
                      </div>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-500">全{total}件中 {pageStart}-{pageEnd}件</p>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {pageNumbers[0] > 1 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setPage(1)}>1</Button>
                    {pageNumbers[0] > 2 && <span className="text-slate-400 px-1">...</span>}
                  </>
                )}
                {pageNumbers.map((num) => (
                  <Button
                    key={num}
                    variant={num === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(num)}
                    className={num === page ? "font-bold" : ""}
                  >
                    {num}
                  </Button>
                ))}
                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="text-slate-400 px-1">...</span>}
                    <Button variant="outline" size="sm" onClick={() => setPage(totalPages)}>{totalPages}</Button>
                  </>
                )}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
