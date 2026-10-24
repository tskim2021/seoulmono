import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";

export default function MyInquiries() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useSEO({
    title: "나의 1:1문의 내역",
    description: "탈모학교 1:1 문의 내역",
    noindex: true,
  });

  const { data, isLoading } = trpc.community.myInquiries.useQuery({
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
    if (post.needsHuman === 1) {
      return <Badge className="bg-orange-500 hover:bg-orange-600 shrink-0">상담사 답변 대기중</Badge>;
    }
    if (post.isAnswered) {
      return <Badge className="bg-green-600 hover:bg-green-700 shrink-0">상담완료</Badge>;
    }
    if (post.hasHumanReply) {
      return <Badge className="bg-teal-500 hover:bg-teal-600 shrink-0">상담사 답변 완료</Badge>;
    }
    return <Badge variant="secondary" className="shrink-0">답변 대기</Badge>;
  };

  return (
    <MyPageLayout title="나의 1:1문의 내역">
      <div className="flex justify-end mb-6">
        <Button onClick={() => navigate("/customer-service/inquiry")}>
          <Plus className="w-4 h-4 mr-2" />
          새 문의 작성
        </Button>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="문의 제목 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="text-center py-12">로딩 중...</div>
      ) : !data || data.posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>문의 내역이 없습니다.</p>
            <Button
              variant="outline"
              onClick={() => navigate("/customer-service/inquiry")}
              className="mt-4"
            >
              첫 문의 작성하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {data.posts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/inquiry/${post.id}`)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(post.createdAt)}</p>
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
