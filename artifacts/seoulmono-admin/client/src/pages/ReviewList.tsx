import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Layout from "@/components/Layout";
import Paginator from "@/components/Paginator";
import { trpc } from "@/lib/trpc";
import { proxyImage } from "@/lib/utils";
import { Search } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const LIMIT = 20;

function StarRating({ rating }: { rating: number | null | undefined }) {
  if (!rating) return <span className="text-muted-foreground text-xs">-</span>;
  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-base leading-none ${i < rating ? "text-red-500" : "text-gray-200"}`}>★</span>
      ))}
    </div>
  );
}

export default function ReviewList() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);

  useSEO({ title: "お客様レビュー", description: "ソウルモノ お客様レビュー掲示板" });

  const { data: board } = trpc.community.boardBySlug.useQuery({ slug: "review" });

  const queryInput = useMemo(() => ({
    boardId: board?.id ?? 0,
    page,
    limit: LIMIT,
    search: search || undefined,
    categoryId: selectedCategoryId,
    productId: selectedProductId,
  }), [board?.id, page, search, selectedCategoryId, selectedProductId]);

  const { data, isLoading } = trpc.community.posts.useQuery(queryInput, { enabled: !!board });
  const { data: reviewProducts } = trpc.community.reviewProducts.useQuery(
    { boardId: board?.id ?? 0 },
    { enabled: !!board }
  );
  const { data: cats } = trpc.admin.categories.useQuery();

  const parentCats = useMemo(() => (cats ?? []).filter((c: any) => !c.parentId), [cats]);

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);
  const posts = data?.posts ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  useEffect(() => { setPage(1); }, [selectedCategoryId, selectedProductId]);

  const filteredProducts = useMemo(() => {
    if (!reviewProducts) return [];
    if (!selectedCategoryId) return reviewProducts;
    return reviewProducts.filter((p: any) => {
      const cat = (cats ?? []).find((c: any) => c.id === p.categoryId);
      if (!cat) return false;
      if (cat.parentId === selectedCategoryId) return true;
      if (cat.id === selectedCategoryId) return true;
      return false;
    });
  }, [reviewProducts, selectedCategoryId, cats]);

  return (
    <Layout>
      <div className="container py-8">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">ホーム</Link>
          <span>/</span>
          <span className="text-foreground font-medium">お客様レビュー</span>
        </div>

        <h1 className="text-2xl font-bold mb-5">お客様レビュー</h1>

        {/* 필터 영역 */}
        <div className="border rounded-lg bg-secondary/30 p-4 mb-4">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <select
              className="border rounded px-3 py-2 text-sm bg-background min-w-[120px]"
              value={selectedCategoryId ?? ""}
              onChange={e => {
                setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined);
                setSelectedProductId(undefined);
              }}
            >
              <option value="">カテゴリー</option>
              {parentCats.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              className="border rounded px-3 py-2 text-sm bg-background min-w-[180px]"
              value={selectedProductId ?? ""}
              onChange={e => setSelectedProductId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">商品名</option>
              {filteredProducts.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <input
              className="border rounded px-3 py-2 text-sm bg-background flex-1 min-w-[160px]"
              placeholder="検索キーワード"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded text-sm font-semibold bg-stone-700 text-white hover:bg-stone-800 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />검색하기
            </button>
          </form>
        </div>

        {/* 총 개수 */}
        <div className="border-l-4 border-stone-600 bg-stone-50 dark:bg-stone-900/30 px-4 py-2.5 mb-4 text-sm text-stone-700 dark:text-stone-300">
          총 <strong>{(data?.total ?? 0).toLocaleString()}</strong>개의 후기가 등록되어 있습니다.
        </div>

        {/* 테이블 */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-400 border-b">
                <th className="py-3 px-3 text-center font-semibold w-14 hidden sm:table-cell">番号</th>
                <th className="py-3 px-3 text-center font-semibold w-20 hidden md:table-cell">写真</th>
                <th className="py-3 px-4 text-left font-semibold">投稿者</th>
                <th className="py-3 px-3 text-center font-semibold w-24 hidden md:table-cell">氏名</th>
                <th className="py-3 px-3 text-center font-semibold w-24 hidden sm:table-cell">日付</th>
                <th className="py-3 px-3 text-center font-semibold w-28 hidden sm:table-cell">評価</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-3 hidden sm:table-cell"><div className="h-4 bg-muted rounded mx-auto w-6" /></td>
                    <td className="py-4 px-3 hidden md:table-cell"><div className="h-14 w-14 bg-muted rounded mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-muted rounded w-3/4 mb-1" /><div className="h-3 bg-muted rounded w-1/2" /></td>
                    <td className="py-4 px-3 hidden md:table-cell"><div className="h-4 bg-muted rounded w-12 mx-auto" /></td>
                    <td className="py-4 px-3 hidden sm:table-cell"><div className="h-3 bg-muted rounded w-16 mx-auto" /></td>
                    <td className="py-4 px-3 hidden sm:table-cell"><div className="h-4 bg-muted rounded w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">登録されたレビューはありません。</td>
                </tr>
              ) : (
                posts.map((post: any, idx: number) => {
                  const rowNum = (data?.total ?? 0) - ((page - 1) * LIMIT) - idx;
                  const dateStr = post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "")
                    : "";
                  let postImages: string[] = [];
                  if (Array.isArray(post.images)) postImages = post.images;
                  else if (typeof post.images === 'string' && post.images) {
                    try { postImages = JSON.parse(post.images); } catch { postImages = []; }
                  }
                  const thumbSrc = postImages[0] ?? post.productThumbnail ?? null;
                  return (
                    <tr key={post.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-3 text-center text-sm text-muted-foreground hidden sm:table-cell">{rowNum}</td>
                      <td className="py-3 px-3 text-center hidden md:table-cell">
                        {thumbSrc ? (
                          <img
                            src={proxyImage(thumbSrc)}
                            alt={post.productName ?? ""}
                            className="w-14 h-14 object-cover rounded border mx-auto"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-muted rounded border mx-auto flex items-center justify-center text-[10px] text-muted-foreground">なし</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/shop/itemuseview.php?is_id=${post.id}`} className="block hover:text-primary transition-colors">
                          <div className="text-sm font-medium line-clamp-1">{post.title}</div>
                          {post.productName && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-stone-400">🏠</span>
                              <span className="text-xs text-muted-foreground line-clamp-1">{post.productName}</span>
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-center text-sm text-muted-foreground hidden md:table-cell truncate max-w-[90px]">
                        {post.displayName || (post.userName ?? "익명")}
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3 text-center hidden sm:table-cell">
                        <StarRating rating={post.rating} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
      </div>
    </Layout>
  );
}
