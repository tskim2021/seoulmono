import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Layout from "@/components/Layout";
import Paginator from "@/components/Paginator";
import { trpc } from "@/lib/trpc";
import { proxyImage } from "@/lib/utils";
import { Search, HelpCircle, MessageCircle, CheckCircle2 } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const LIMIT = 20;

export default function QnAList() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);

  useSEO({ title: "商品Q&A", description: "ソウルモノ 商品Q&A掲示板" });

  const queryInput = useMemo(() => ({
    page,
    limit: LIMIT,
    search: search || undefined,
    productId: selectedProductId,
    onlyUnanswered,
  }), [page, search, selectedProductId, onlyUnanswered]);

  const { data, isLoading } = trpc.community.allProductQnA.useQuery(queryInput);

  const qnaProducts = useMemo(() => {
    if (!data?.posts) return [];
    const seen = new Set<number>();
    const result: { id: number; name: string }[] = [];
    for (const p of data.posts) {
      if (p.productId && !seen.has(p.productId)) {
        seen.add(p.productId);
        if (p.productName) result.push({ id: p.productId, name: p.productName });
      }
    }
    return result;
  }, [data?.posts]);

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);
  const posts = data?.posts ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  useEffect(() => { setPage(1); }, [selectedProductId, onlyUnanswered]);

  return (
    <Layout>
      <div className="container py-8">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">ホーム</Link>
          <span>/</span>
          <span className="text-foreground font-medium">商品Q&amp;A</span>
        </div>

        <h1 className="text-2xl font-bold mb-5">商品Q&amp;A</h1>

        {/* 필터 영역 */}
        <div className="border rounded-lg bg-secondary/30 p-4 mb-4">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <select
              className="border rounded px-3 py-2 text-sm bg-background min-w-[180px]"
              value={selectedProductId ?? ""}
              onChange={e => setSelectedProductId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">すべての商品</option>
              {qnaProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnanswered}
                onChange={e => setOnlyUnanswered(e.target.checked)}
                className="w-4 h-4 accent-stone-700"
              />
              未回答のみ表示
            </label>

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
              <Search className="w-3.5 h-3.5" />検索
            </button>
          </form>
        </div>

        {/* 총 개수 */}
        <div className="border-l-4 border-stone-600 bg-stone-50 dark:bg-stone-900/30 px-4 py-2.5 mb-4 text-sm text-stone-700 dark:text-stone-300">
          全 <strong>{(data?.total ?? 0).toLocaleString()}</strong>件のQ&amp;Aが登録されています。
        </div>

        {/* 테이블 */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-400 border-b">
                <th className="py-3 px-3 text-center font-semibold w-14 hidden sm:table-cell">番号</th>
                <th className="py-3 px-3 text-center font-semibold w-20 hidden md:table-cell">商品</th>
                <th className="py-3 px-4 text-left font-semibold">タイトル</th>
                <th className="py-3 px-3 text-center font-semibold w-24 hidden md:table-cell">投稿者</th>
                <th className="py-3 px-3 text-center font-semibold w-24 hidden sm:table-cell">日付</th>
                <th className="py-3 px-3 text-center font-semibold w-24 hidden sm:table-cell">回答</th>
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
                    <td className="py-4 px-3 hidden sm:table-cell"><div className="h-4 bg-muted rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <HelpCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">登録されたQ&amp;Aはありません。</p>
                  </td>
                </tr>
              ) : (
                posts.map((post: any, idx: number) => {
                  const rowNum = (data?.total ?? 0) - ((page - 1) * LIMIT) - idx;
                  const dateStr = post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "")
                    : "";
                  return (
                    <tr key={post.id} className="hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => navigate(`/community/qna/${post.id}`)}>
                      <td className="py-3 px-3 text-center text-sm text-muted-foreground hidden sm:table-cell">{rowNum}</td>
                      <td className="py-3 px-3 text-center hidden md:table-cell">
                        {post.productThumbnail ? (
                          <img
                            src={proxyImage(post.productThumbnail)}
                            alt={post.productName ?? ""}
                            className="w-14 h-14 object-cover rounded border mx-auto"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-muted rounded border mx-auto flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium line-clamp-1">{post.title}</div>
                        {post.productName && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-stone-400">📦</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{post.productName}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-sm text-muted-foreground hidden md:table-cell truncate max-w-[90px]">
                        {post.isSecret ? "非公開" : (post.displayName || (post.userName ?? "匿名"))}
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3 text-center hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                        {post.isAnswered ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />回答済み
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500">
                            <MessageCircle className="w-3.5 h-3.5" />待機中
                          </span>
                        )}
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
