import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Search, Eye, MessageCircle } from "lucide-react";
import Paginator from "@/components/Paginator";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";

const SECTION_COLORS: Record<string, string> = {
  domestic: "bg-blue-100 text-blue-700",
  international: "bg-emerald-100 text-emerald-700",
  research: "bg-purple-100 text-purple-700",
};

const SECTION_LABELS: Record<string, string> = {
  domestic: "国内",
  international: "海外",
  research: "研究",
};

export default function NewsList() {
  useSEO({ title: "健康ニュース - カテゴリー別 国内外の健康ニュース" });
  // URL 파라미터에서 카테고리 추출
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get("category");

  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    categoryParam ? Number(categoryParam) : undefined
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: categoriesData } = trpc.category.list.useQuery();
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  const { data, isLoading } = trpc.news.list.useQuery({
    categoryId: selectedCategory,
    page,
    limit,
    search: searchQuery || undefined,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  const handleCategoryChange = (catId?: number) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "たった今";
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}日前`;
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
  };

  const stripMarkdown = (text: string) => {
    return text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`[^`]+`/g, "")
      .replace(/\n/g, " ")
      .trim();
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        {/* 헤더 */}
        <section className="border-b border-border/60">
          <div className="container py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">健康ニュース</h1>
                <p className="text-sm text-muted-foreground">カテゴリー別の国内外の健康ニュースと最新研究情報</p>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-6">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedCategory === undefined ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => handleCategoryChange(undefined)}
            >
              すべてのカテゴリー
            </Button>
            {categories.map((cat: any) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* 검색 */}
          <div className="flex justify-end mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ニュースを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm">検索</Button>
            </form>
          </div>

          {/* 뉴스 카드 그리드 */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={`skeleton-${i}`} className="overflow-hidden">
                  <CardContent className="p-5">
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data?.posts && data.posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.posts.map((news: any) => (
                <Link key={news.id} href={`/news/${news.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-3">
                        {news.newsSection && (
                          <Badge variant="secondary" className={`text-xs ${SECTION_COLORS[news.newsSection] || ""}`}>
                            {SECTION_LABELS[news.newsSection] || news.newsSection}
                          </Badge>
                        )}
                        {news.isAutoGenerated === 1 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">AI</Badge>
                        )}
                        {news.categoryId && (
                          <Badge variant="outline" className="text-xs">
                            {categories.find((c: any) => c.id === news.categoryId)?.name || ""}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {news.title}
                      </h3>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3 flex-1">
                        {stripMarkdown(news.content).slice(0, 150)}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                        <span>{formatDate(news.createdAt)}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {news.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {news.commentCount}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Newspaper className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">登録されたニュースはありません。</p>
              <p className="text-sm text-muted-foreground/70 mt-1">まもなく新しい健康ニュースが更新されます。</p>
            </div>
          )}

          {/* 페이지네이션 */}
          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
        </div>
      </div>
    </Layout>
  );
}
