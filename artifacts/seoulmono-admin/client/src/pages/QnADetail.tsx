import { Link, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { proxyImage } from "@/lib/utils";
import { ChevronLeft, HelpCircle, User, Calendar, MessageCircle, CheckCircle2, Clock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, ".").replace(/\.$/, "");
}

export default function QnADetail({ postId }: { postId: number }) {
  const [, navigate] = useLocation();

  const { data: post, isLoading: postLoading } = trpc.community.postById.useQuery({ id: postId });
  const { data: comments = [], isLoading: commentsLoading } = trpc.community.comments.useQuery(
    { postId },
    { enabled: !!post }
  );

  useSEO({
    title: post ? `Q&A: ${post.title}` : "상품 Q&A",
    description: post?.content ?? "상품 Q&A 상세",
  });

  if (postLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container py-16 text-center text-muted-foreground">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Q&A를 찾을 수 없습니다.</p>
          <button onClick={() => navigate("/community/qna")} className="mt-4 text-sm underline">목록으로</button>
        </div>
      </Layout>
    );
  }

  const p = post as any;

  return (
    <Layout>
      <div className="container py-8">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">홈</Link>
          <span>/</span>
          <Link href="/community/qna" className="hover:text-foreground">상품 Q&amp;A</Link>
          <span>/</span>
          <span className="text-foreground font-medium line-clamp-1">{p.title}</span>
        </div>

        {/* 상품 정보 */}
        {(p.productName || p.productThumbnail) && (
          <Link href={p.productItId ? `/shop/item.php?it_id=${p.productItId}` : p.productSlug ? `/product/${p.productSlug}` : "#"}>
            <div className="flex items-center gap-3 border rounded-lg p-3 mb-5 hover:bg-accent/30 transition-colors">
              {p.productThumbnail ? (
                <img src={proxyImage(p.productThumbnail)} alt={p.productName ?? ""} className="w-12 h-12 object-cover rounded border shrink-0" />
              ) : (
                <div className="w-12 h-12 bg-muted rounded border shrink-0 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-muted-foreground/30" />
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">관련 상품</p>
                <p className="text-sm font-medium">{p.productName}</p>
              </div>
            </div>
          </Link>
        )}

        {/* 질문 */}
        <div className="border rounded-xl overflow-hidden mb-4">
          <div className="flex items-start gap-3 p-5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">Q</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-base font-semibold">{p.title}</h1>
                {p.isAnswered ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3" />답변완료
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                    <Clock className="w-3 h-3" />대기중
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{p.content}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.authorName ?? p.userName ?? "익명"}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(p.createdAt)}</span>
                {comments.length > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{comments.length}개의 답변</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 답변 */}
        {commentsLoading ? (
          <div className="animate-pulse h-20 bg-muted rounded-xl" />
        ) : comments.length > 0 ? (
          <div className="space-y-3">
            {(comments as any[]).map((comment: any) => (
              <div key={comment.id} className="border rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 overflow-hidden">
                <div className="flex items-start gap-3 p-5">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0 mt-0.5">A</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">{comment.isAdmin ? "관리자" : (comment.userName ?? "익명")}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-xl p-8 text-center text-muted-foreground">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">아직 답변이 등록되지 않았습니다.</p>
          </div>
        )}

        {/* 목록으로 버튼 */}
        <div className="mt-8">
          <button
            onClick={() => navigate("/community/qna")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />목록으로
          </button>
        </div>
      </div>
    </Layout>
  );
}
