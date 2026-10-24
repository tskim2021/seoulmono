import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, PenLine, BookOpen, Eye, Pin } from "lucide-react";
import Paginator from "@/components/Paginator";
import { useSEO } from "@/hooks/useSEO";

export default function InfoBoardList() {
  useSEO({ title: "情報共有 - 健康情報シェア掲示板" });
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const limit = 20;

  const { data: categoriesData } = trpc.category.list.useQuery();
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  const { data, isLoading } = trpc.infoBoard.posts.useQuery({
    page,
    limit,
    search: search || undefined,
    categoryId: selectedCategory,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (catId?: number) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "たった今";
    if (diffH < 24) return `${diffH}時間前`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 3) return `${diffD}日前`;
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  const isNew = (date: Date | string) =>
    Date.now() - new Date(date).getTime() < 86400000 * 1;

  return (
    <Layout>
      <div className="bg-gradient-to-b from-green-50/40 to-white min-h-screen">
        {/* 페이지 헤더 */}
        <section className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">情報共有</h1>
                  <p className="text-sm text-muted-foreground">健康に関する役立つ情報を自由にシェアしましょう</p>
                </div>
              </div>
              {user ? (
                <Link href="/info-board/write">
                  <Button size="sm" className="gap-1.5">
                    <PenLine className="w-4 h-4" />
                    投稿する
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <PenLine className="w-4 h-4" />
                    ログインして投稿
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="container py-6">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === undefined
                  ? "bg-green-700 text-white shadow-sm"
                  : "bg-white border border-border text-muted-foreground hover:border-green-500 hover:text-green-700"
              }`}
            >
              すべて
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-green-700 text-white shadow-sm"
                    : "bg-white border border-border text-muted-foreground hover:border-green-500 hover:text-green-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 검색 + 통계 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground">
              全 <span className="font-semibold text-foreground">{data?.total ?? 0}</span>件
              {search && (
                <span className="ml-1.5 text-green-700">· &ldquo;{search}&rdquo; の検索結果</span>
              )}
            </p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="タイトルを検索..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-8 h-9 w-52 text-sm"
                />
              </div>
              <Button type="submit" size="sm" variant="outline">検索</Button>
            </form>
          </div>

          {/* 게시글 테이블 */}
          <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/60 text-xs text-muted-foreground border-b">
                  <th className="py-3 px-4 text-center font-medium w-14 hidden sm:table-cell">番号</th>
                  <th className="py-3 px-4 text-left font-medium">タイトル</th>
                  <th className="py-3 px-4 text-center font-medium w-24 hidden md:table-cell">投稿者</th>
                  <th className="py-3 px-4 text-center font-medium w-20 hidden md:table-cell">日付</th>
                  <th className="py-3 px-4 text-center font-medium w-14 hidden sm:table-cell">閲覧</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3.5 px-4 hidden sm:table-cell"><Skeleton className="h-3.5 w-8 mx-auto" /></td>
                      <td className="py-3.5 px-4"><Skeleton className="h-3.5 w-full max-w-sm" /></td>
                      <td className="py-3.5 px-4 hidden md:table-cell"><Skeleton className="h-3.5 w-16 mx-auto" /></td>
                      <td className="py-3.5 px-4 hidden md:table-cell"><Skeleton className="h-3.5 w-12 mx-auto" /></td>
                      <td className="py-3.5 px-4 hidden sm:table-cell"><Skeleton className="h-3.5 w-8 mx-auto" /></td>
                    </tr>
                  ))
                ) : data?.posts && data.posts.length > 0 ? (
                  data.posts.map((post: any, idx: number) => {
                    const pinned = post.isPinned === 1;
                    const newPost = isNew(post.createdAt);
                    const catName = categories.find((c: any) => c.id === post.categoryId)?.name;
                    const rowNum = data.total - (page - 1) * limit - idx;

                    return (
                      <tr
                        key={post.id}
                        className={`group transition-colors ${
                          pinned ? "bg-green-50/70 hover:bg-green-50" : "hover:bg-accent/30"
                        }`}
                      >
                        {/* 번호 */}
                        <td className="py-3.5 px-4 text-xs text-muted-foreground text-center hidden sm:table-cell">
                          {pinned ? (
                            <Pin className="w-3.5 h-3.5 text-green-600 mx-auto" />
                          ) : (
                            rowNum
                          )}
                        </td>

                        {/* 제목 */}
                        <td className="py-3.5 px-4">
                          <Link href={`/bbs/board.php?bo_table=info&wr_id=${post.id + 25}`} className="group/link flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {pinned && <Pin className="w-3 h-3 text-green-600 shrink-0 sm:hidden" />}
                              {catName && (
                                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 leading-none">
                                  {catName}
                                </span>
                              )}
                              <span className="text-sm font-medium group-hover/link:text-green-700 transition-colors line-clamp-1">
                                {post.title}
                              </span>
                              {post.commentCount > 0 && (
                                <span className="text-xs text-green-600 font-bold shrink-0">
                                  [{post.commentCount}]
                                </span>
                              )}
                              {newPost && (
                                <span className="shrink-0 text-[9px] font-bold text-white bg-red-500 px-1 py-px rounded leading-none">
                                  NEW
                                </span>
                              )}
                            </div>
                            {/* 모바일 메타 */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground md:hidden">
                              <span>{post.userName || "匿名"}</span>
                              <span>·</span>
                              <span>{formatDate(post.createdAt)}</span>
                              <span>·</span>
                              <Eye className="w-3 h-3" />
                              <span>{post.viewCount}</span>
                            </div>
                          </Link>
                        </td>

                        {/* 작성자 */}
                        <td className="py-3.5 px-4 text-sm text-muted-foreground text-center hidden md:table-cell">
                          <span className="max-w-[80px] truncate block mx-auto">{post.userName || "匿名"}</span>
                        </td>

                        {/* 날짜 */}
                        <td className="py-3.5 px-4 text-xs text-muted-foreground text-center hidden md:table-cell whitespace-nowrap">
                          {formatDate(post.createdAt)}
                        </td>

                        {/* 조회수 */}
                        <td className="py-3.5 px-4 text-xs text-muted-foreground text-center hidden sm:table-cell">
                          <span className="flex items-center justify-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.viewCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <BookOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {search ? `「${search}」の検索結果がありません。` : "登録された投稿がありません。"}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">最初の情報をシェアしてみましょう！</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 하단: 페이지네이션 + 글쓰기 버튼 */}
          <div className="relative flex items-center justify-center mt-6">
            <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
            {user && (
              <div className="absolute right-0">
                <Link href="/info-board/write">
                  <Button size="sm" className="gap-1.5">
                    <PenLine className="w-3.5 h-3.5" />
                    投稿する
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
