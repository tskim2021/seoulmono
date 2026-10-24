import { useState, useMemo } from "react";
import { useGetProducts, useGetCategories, type Product } from "@workspace/api-client-react";
import { useCart, type CartItem } from "../store/cart";
import { Button, Card, Input } from "../components/ui";
import { formatCurrency, cn } from "../lib/utils";
import { Search, Loader2, Image as ImageIcon, Check, Package, Plus, Minus, ShoppingCart, X, ChevronUp, ChevronDown, Trash2, Tag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "../hooks/use-toast";

function imgUrl(p: string) {
  if (!p) return "";
  if (p.startsWith("http") || p.startsWith("/api/")) return p;
  return `/api/product-image/${p}`;
}

interface CategoryNode {
  ca_id: string;
  ca_name: string;
  children?: CategoryNode[];
}

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "name_asc">("newest");
  const [pageSize, setPageSize] = useState(20);
  const [cat1, setCat1] = useState("");
  const [cat2, setCat2] = useState("");
  const [cat3, setCat3] = useState("");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartExpanded, setCartExpanded] = useState(false);
  const [, setLocation] = useLocation();

  const { data: catData } = useGetCategories();
  const activeCategory = cat3 || cat2 || cat1 || undefined;
  const { data: prodData, isLoading } = useGetProducts({
    page: 1,
    limit: pageSize,
    search: search || undefined,
    category: activeCategory,
    sort,
  });

  const addItem = useCart((s) => s.addItem);
  const cartItems = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.removeItem);
  const getTotal = useCart((s) => s.getTotal);

  const tree: CategoryNode[] = useMemo(() => {
    return (catData as any)?.tree || [];
  }, [catData]);

  const level2List = useMemo(() => {
    if (!cat1) return [];
    const parent = tree.find((c) => c.ca_id === cat1);
    return parent?.children || [];
  }, [tree, cat1]);

  const level3List = useMemo(() => {
    if (!cat2) return [];
    const parent = level2List.find((c) => c.ca_id === cat2);
    return parent?.children || [];
  }, [level2List, cat2]);

  const handleCat1Change = (id: string) => {
    setCat1(id);
    setCat2("");
    setCat3("");
  };
  const handleCat2Change = (id: string) => {
    setCat2(id);
    setCat3("");
  };

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, val: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  };

  const handleAddToCart = (product: Product) => {
    const qty = getQty(product.it_id);
    const boxOpt = (product as any).box_option;
    const effectivePrice = boxOpt ? boxOpt.box_price : product.it_price;
    const optionLabel = boxOpt ? boxOpt.io_id : "1個";

    setAddingToCart(product.it_id);
    addItem({ ...product, it_price: effectivePrice, it_name: `${product.it_name} (${optionLabel})` }, qty);
    toast({
      title: "カートに追加しました",
      description: `${product.it_name} ${optionLabel} × ${qty}`,
    });
    if (!cartExpanded) setCartExpanded(true);
    setTimeout(() => setAddingToCart(null), 1000);
  };

  const totalCount = prodData?.total ?? 0;
  const cartTotal = getTotal();

  return (
    <div className={cn("space-y-6 animate-in fade-in duration-500", cartItems.length > 0 && "pb-24")}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl premium-shadow border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">商品一覧</h1>
          <p className="text-slate-500 mt-2 font-medium">
            ご希望の商品を検索してカートに追加してください。
          </p>
        </div>
        <div className="w-full md:w-80 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-12 bg-slate-50/50"
            placeholder="商品名で検索..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 premium-shadow">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-slate-500 w-16 shrink-0">大分類</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCat1Change("")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                !cat1
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              すべて
            </button>
            {tree.map((c) => (
              <button
                key={c.ca_id}
                onClick={() => handleCat1Change(c.ca_id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  cat1 === c.ca_id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {c.ca_name}
              </button>
            ))}
          </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-sm font-bold text-slate-500 w-16 shrink-0">並び替え</span>
          <button
            onClick={() => setSort("newest")}
            className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all", sort === "newest" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
          >
            登録順
          </button>
          <button
            onClick={() => setSort("price_desc")}
            className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all", sort === "price_desc" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
          >
            価格の高い順
          </button>
          <button
            onClick={() => setSort("price_asc")}
            className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all", sort === "price_asc" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
          >
            価格の低い順
          </button>
          <button
            onClick={() => setSort("name_asc")}
            className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all", sort === "name_asc" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
          >
            名前順
          </button>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="ml-auto h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700"
          >
            <option value={10}>10件ずつ表示</option>
            <option value={20}>20件ずつ表示</option>
            <option value={50}>50件ずつ表示</option>
          </select>
        </div>
        </div>

        {level2List.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <span className="text-sm font-bold text-slate-500 w-16 shrink-0">中分類</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCat2Change("")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  !cat2
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                すべて
              </button>
              {level2List.map((c) => (
                <button
                  key={c.ca_id}
                  onClick={() => handleCat2Change(c.ca_id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    cat2 === c.ca_id
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {c.ca_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {level3List.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <span className="text-sm font-bold text-slate-500 w-16 shrink-0">小分類</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCat3("")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  !cat3
                    ? "bg-violet-500 text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                すべて
              </button>
              {level3List.map((c) => (
                <button
                  key={c.ca_id}
                  onClick={() => setCat3(c.ca_id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    cat3 === c.ca_id
                      ? "bg-violet-500 text-white"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {c.ca_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500 font-medium px-1">
        合計 <span className="font-bold text-primary">{totalCount}</span>件の商品
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : prodData?.products?.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">該当する商品がありません</h3>
          <p className="text-slate-500 mt-2">別のキーワードやカテゴリをお試しください。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {prodData?.products.map((product) => {
            const boxOpt = (product as any).box_option;
            const boxQty = Number(boxOpt?.box_qty || product.it_2 || 0) || null;
            const boxPrice = boxOpt?.box_price ? Number(boxOpt.box_price) : Number(product.it_price) || 0;
            const unitPrice = boxOpt?.unit_price ? Number(boxOpt.unit_price) : (boxQty ? Math.round(boxPrice / boxQty) : null);
            const displayPrice = boxPrice;
            const unitLabel = boxQty ? `1ケース(${boxQty}個入)` : "1個";
            const qty = getQty(product.it_id);
            const isSoldOut = product.it_stock_qty !== undefined && product.it_stock_qty <= 0;
            const retailUnitPrice = product.it_cust_price ? Number(product.it_cust_price) : null;
            const discountRate = unitPrice && retailUnitPrice && retailUnitPrice > unitPrice
              ? Math.round((1 - unitPrice / retailUnitPrice) * 100)
              : null;

            return (
              <Card
                key={product.it_id}
                className="flex flex-col group hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                <Link href={`/products/${product.it_id}`} className="block">
                  <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center cursor-pointer">
                    {product.it_img1 ? (
                      <img
                        src={imgUrl(product.it_img1)}
                        alt={product.it_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).parentElement!.querySelector(".fallback-icon")?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <ImageIcon className={cn("w-12 h-12 text-slate-300 fallback-icon", product.it_img1 ? "hidden" : "")} />
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-xl">
                          品切れ
                        </span>
                      </div>
                    )}
                    {discountRate && discountRate > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg shadow-lg">
                        {discountRate}% OFF
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-5 flex flex-col flex-1">
                  {product.ca_name && (
                    <span className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">
                      {product.ca_name}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 line-clamp-2">
                    {product.it_name}
                  </h3>
                  {(product.it_maker || product.it_shelf_life) && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 flex-wrap">
                      {product.it_maker && <span>{product.it_maker}</span>}
                      {product.it_shelf_life && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">賞味期限 {product.it_shelf_life}</span>
                      )}
                    </div>
                  )}

                  {boxQty && (
                    <span className="inline-flex items-center self-start px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md mb-3">
                      {unitLabel}
                    </span>
                  )}

                  <div className="mt-auto pt-3">
                    <div className="mb-3">
                      {product.it_cust_price && product.it_cust_price > displayPrice && (
                        <p className="text-sm text-slate-400 line-through decoration-slate-400 decoration-1 mb-0.5">
                          {formatCurrency(product.it_cust_price)}
                        </p>
                      )}
                      <p className="text-xl font-black text-slate-900">
                        {formatCurrency(displayPrice)}
                      </p>
                      {boxQty ? (
                        <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                          <p>ケース入数 1ケース {boxQty}個入</p>
                          <p>単品価格 {formatCurrency(unitPrice || 0)}</p>
                          <p>ケース金額 {formatCurrency(displayPrice)}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setQty(product.it_id, qty - 1)}
                          className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                          disabled={isSoldOut}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-0.5 px-1">
                          <span className="text-xs text-blue-600 font-bold">ケース</span>
                          <input
                            type="number"
                            className="w-8 text-center font-bold bg-transparent border-none focus:ring-0 p-0 text-sm"
                            value={qty}
                            onChange={(e) => setQty(product.it_id, parseInt(e.target.value) || 1)}
                            min={1}
                            disabled={isSoldOut}
                          />
                        </div>
                        <button
                          onClick={() => setQty(product.it_id, qty + 1)}
                          className="p-2 hover:bg-slate-200 text-slate-600 transition-colors"
                          disabled={isSoldOut}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <Button
                        size="sm"
                        className={cn(
                          "flex-1 h-10 font-bold transition-all duration-300",
                          addingToCart === product.it_id
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : ""
                        )}
                        onClick={() => handleAddToCart(product)}
                        disabled={isSoldOut}
                      >
                        {addingToCart === product.it_id ? (
                          <><Check className="w-4 h-4 mr-1" /> 追加済み</>
                        ) : (
                          "追加"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 md:left-72 right-0 z-40 transition-all duration-300">
          {cartExpanded && (
            <div className="bg-white border-t border-x border-slate-200 rounded-t-2xl shadow-2xl max-h-64 overflow-y-auto mx-2 md:mx-4">
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item.it_id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.it_name}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(item.it_price)}</p>
                    </div>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shrink-0">
                      <button
                        onClick={() => updateQty(item.it_id, item.cart_qty - 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-0.5 px-1">
                        <span className="text-[10px] text-blue-600 font-bold">ケース</span>
                        <span className="w-6 text-center font-bold text-sm">{item.cart_qty}</span>
                      </div>
                      <button
                        onClick={() => updateQty(item.it_id, item.cart_qty + 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-black text-slate-900 w-20 text-right shrink-0">
                      {formatCurrency(item.it_price * item.cart_qty)}
                    </span>
                    <button
                      onClick={() => removeItem(item.it_id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] mx-0">
            <div className="flex items-center gap-4 px-4 md:px-6 py-3">
              <button
                onClick={() => setCartExpanded(!cartExpanded)}
                className="flex items-center gap-2 text-slate-700 hover:text-primary transition-colors"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItems.length}
                  </span>
                </div>
                <span className="font-bold text-sm hidden sm:inline">選択内容</span>
                {cartExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>

              <div className="flex-1 text-right">
                <span className="text-sm text-slate-500">合計</span>
                <span className="text-xl font-black text-primary ml-2">{formatCurrency(cartTotal)}</span>
                <span className="text-xs text-slate-400 ml-1">({cartItems.reduce((s, i) => s + i.cart_qty, 0)}ケース)</span>
              </div>

              <Button
                onClick={() => setLocation("/cart")}
                className="h-11 px-6 font-bold"
              >
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                発注する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
