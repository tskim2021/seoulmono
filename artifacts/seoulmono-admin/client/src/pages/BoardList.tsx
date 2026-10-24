import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Search, PenSquare, Eye, MessageCircle, Pin } from "lucide-react";
import Paginator from "@/components/Paginator";
import { useParams, Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";

export default function BoardList({ slugProp }: { slugProp?: string } = {}) {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugProp ?? slugParam;
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => { setPage(1); setSearch(""); setSearchInput(""); }, [slug]);

  const { data: board, isLoading: boardLoading } = trpc.community.boardBySlug.useQuery({ slug: slug! });

  useSEO({
    title: board?.name ? `${board.name} 게시판` : "커뮤니티",
    description: board?.description ?? `탈모학교 커뮤니티 게시판`,
  });
  const queryInput = useMemo(() => ({
    boardId: board?.id ?? 0,
    page,
    limit: 20,
    search: search || undefined,
  }), [board?.id, page, search]);
  const { data, isLoading } = trpc.community.posts.useQuery(queryInput, { enabled: !!board });

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const boardTypeLabel: Record<string, string> = { free: "자유게시판", review: "고객 리뷰", qna: "Q&A", notice: "공지사항" };

  return (
    <Layout>
      <div className="container py-8">
        {/* Board nav */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">홈</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{board?.name ?? boardTypeLabel[slug!] ?? "게시판"}</span>
        </div>



        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">{board?.name ?? boardTypeLabel[slug!]}</h1>
            {board?.description && <p className="text-sm text-muted-foreground mt-0.5">{board.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="검색..." className="w-48 h-9 pl-8 text-sm rounded-full" />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            </form>
            {isAuthenticated && board?.boardType !== "notice" && (
              <Button size="sm" onClick={() => navigate(`/community/${slug}/write`)}>
                <PenSquare className="w-4 h-4 mr-1" />글쓰기
              </Button>
            )}
          </div>
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : (data?.posts ?? []).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">게시글이 없습니다</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50 text-xs text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium w-16 hidden sm:table-cell">번호</th>
                  <th className="text-left py-3 px-4 font-medium">제목</th>
                  <th className="text-left py-3 px-4 font-medium w-24 hidden md:table-cell">작성자</th>
                  <th className="text-center py-3 px-4 font-medium w-24 hidden md:table-cell">날짜</th>
                  <th className="text-center py-3 px-4 font-medium w-16 hidden sm:table-cell">조회</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data!.posts.map(post => (
                  <tr key={post.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">{post.id}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={slug === "notice"
                          ? `/bbs/board.php?bo_table=notice&wr_id=${post.id}`
                          : `/community/post/${post.id}`
                        }
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        {post.isPinned === 1 && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
                        {post.productThumbnail && (
                          <img src={post.productThumbnail} alt="" className="w-10 h-10 object-cover rounded border shrink-0" />
                        )}
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-medium line-clamp-1">{post.title}</span>
                          {post.productName && (
                            <span className="text-xs text-muted-foreground line-clamp-1">{post.productName}</span>
                          )}
                        </div>
                        {post.commentCount > 0 && <span className="text-xs text-primary font-medium shrink-0">[{post.commentCount}]</span>}
                        {post.rating && (
                          <div className="flex shrink-0">{Array.from({ length: post.rating }).map((_, i) => <span key={`${post.id}-star-${i}`} className="text-amber-400 text-xs">★</span>)}</div>
                        )}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell truncate max-w-[100px]">{post.userName ?? "익명"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground text-center hidden md:table-cell">{formatDate(post.createdAt)}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground text-center hidden sm:table-cell">{post.viewCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
      </div>
    </Layout>
  );
}
