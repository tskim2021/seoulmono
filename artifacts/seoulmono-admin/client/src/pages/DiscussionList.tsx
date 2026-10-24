import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquare, ThumbsUp, Eye, Search, Plus, Pin, Lock,
  Clock, TrendingUp, MessageCircle, BarChart3,
  User
} from "lucide-react";
import Paginator from "@/components/Paginator";
import { useSEO } from "@/hooks/useSEO";

const SORT_OPTIONS = [
  { value: "newest", label: "최신순", icon: Clock },
  { value: "popular", label: "인기순", icon: TrendingUp },
  { value: "most_comments", label: "댓글순", icon: MessageCircle },
  { value: "views", label: "조회순", icon: BarChart3 },
];

export default function DiscussionList() {
  useSEO({ title: "토론광장 - 자유 토론 커뮤니티" });
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: categoriesData } = trpc.category.list.useQuery();
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  const queryInput = useMemo(() => ({
    search: search || undefined,
    sort: sort as any,
    categoryId: selectedCategory,
    page,
    limit,
  }), [search, sort, selectedCategory, page, limit]);

  const { data, isLoading } = trpc.discussion.list.useQuery(queryInput);

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (catId?: number) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return d.toLocaleDateString("ko-KR");
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30">
        {/* 헤더 */}
        <section className="border-b border-border/60">
          <div className="container py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">토론광장</h1>
                  <p className="text-sm text-muted-foreground">건강, 제품, 생활에 대해 자유롭게 이야기를 나눠보세요</p>
                </div>
              </div>
              {user ? (
                <Button onClick={() => navigate("/discussions/write")} className="gap-2">
                  <Plus className="h-4 w-4" /> 새 토론 시작
                </Button>
              ) : (
                <Button asChild>
                  <a href={getLoginUrl()}>로그인 후 토론 참여</a>
                </Button>
              )}
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
              전체 카테고리
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

          {/* 정렬 + 검색 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setSort(s.value); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    sort === s.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="토론 검색..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm">검색</Button>
            </form>
          </div>

          {/* 토론 목록 */}
          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5">
                      <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                      <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !data?.discussions.length ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">아직 토론이 없습니다</h3>
                  <p className="text-muted-foreground mb-4">첫 번째 토론을 시작해보세요!</p>
                  {user && (
                    <Button onClick={() => navigate("/discussions/write")} className="gap-2">
                      <Plus className="h-4 w-4" /> 새 토론 시작
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {data.discussions.map((discussion) => (
                  <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start gap-4">
                          {/* 좌측: 좋아요 수 */}
                          <div className="hidden sm:flex flex-col items-center min-w-[50px] pt-1">
                            <ThumbsUp className="h-4 w-4 text-muted-foreground mb-1" />
                            <span className="text-sm font-semibold">{discussion.likeCount}</span>
                          </div>

                          {/* 중앙: 제목 + 메타 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {discussion.isPinned === 1 && (
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  <Pin className="h-3 w-3" /> 고정
                                </Badge>
                              )}
                              {discussion.isClosed === 1 && (
                                <Badge variant="outline" className="gap-1 text-xs">
                                  <Lock className="h-3 w-3" /> 마감
                                </Badge>
                              )}
                              {discussion.categoryId && (
                                <Badge variant="outline" className="text-xs">
                                  {categories.find((c: any) => c.id === discussion.categoryId)?.name || ""}
                                </Badge>
                              )}
                              <h3 className="font-semibold text-base truncate">{discussion.title}</h3>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                              {discussion.content.replace(/<[^>]*>/g, "").slice(0, 120)}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {discussion.userName ?? "익명"}
                              </span>
                              <span>{formatDate(discussion.createdAt)}</span>
                              {(discussion.tags as string[] | null)?.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs py-0 px-1.5">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* 우측: 댓글/조회 */}
                          <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground min-w-[60px]">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {discussion.commentCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {discussion.viewCount}
                            </span>
                            <span className="flex items-center gap-1 sm:hidden">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              {discussion.likeCount}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />

            {/* 총 게시글 수 */}
            {data && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                총 {data.total}개의 토론
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
