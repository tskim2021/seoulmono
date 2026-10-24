import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";

export default function MyQnA() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useSEO({
    title: "マイ商品Q&A",
    description: "ソウルモノ 商品Q&A履歴",
    noindex: true,
  });

  const { data, isLoading } = trpc.community.myQnA.useQuery({
    page,
    limit: 10,
    search: search || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const getStatusBadge = (post: any) => {
    if (post.hasHumanReply) {
      return <Badge className="bg-teal-500 hover:bg-teal-600 shrink-0">回答済み</Badge>;
    }
    if (post.isAnswered) {
      return <Badge className="bg-green-600 hover:bg-green-700 shrink-0">回答済み</Badge>;
    }
    return <Badge variant="secondary" className="shrink-0">回答待ち</Badge>;
  };

  return (
    <MyPageLayout title="マイ商品Q&A">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Q&Aタイトルを検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="text-center py-12">読み込み中...</div>
      ) : !data || data.posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Q&A履歴がありません。</p>
            <Button
              variant="outline"
              onClick={() => navigate("/community/qna")}
              className="mt-4"
            >
              Q&A 게시판 가기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {data.posts.map((post: any) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/community/qna/${post.id}`)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(post.createdAt)}
                        </span>
                        {post.productName && (
                          <span className="text-xs text-primary truncate">
                            {post.productName}
                          </span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(post)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.total > 10 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                이전
              </Button>
              <span className="flex items-center px-4">
                {page} / {Math.ceil(data.total / 10)}
              </span>
              <Button variant="outline" disabled={page >= Math.ceil(data.total / 10)} onClick={() => setPage(p => p + 1)}>
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </MyPageLayout>
  );
}
