import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Eye, Calendar, User, MessageSquare, Trash2, Pin, EyeOff, CornerDownRight } from "lucide-react";

export default function InfoBoardDetail({ postIdProp }: { postIdProp?: number } = {}) {
  const { id } = useParams<{ id: string }>();
  const postId = postIdProp ?? Number(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [replyText, setReplyText] = useState("");

  const utils = trpc.useUtils();
  const { data: post, isLoading } = trpc.infoBoard.postById.useQuery({ id: postId });
  const { data: comments } = trpc.infoBoard.comments.useQuery({ postId });

  const createComment = trpc.infoBoard.createComment.useMutation({
    onSuccess: () => {
      utils.infoBoard.comments.invalidate({ postId });
      utils.infoBoard.postById.invalidate({ id: postId });
      setCommentText("");
      setReplyTo(null);
      setReplyText("");
      toast.success("コメントを投稿しました。");
    },
    onError: () => toast.error("コメントの投稿に失敗しました。"),
  });

  const deleteComment = trpc.infoBoard.deleteComment.useMutation({
    onSuccess: () => {
      utils.infoBoard.comments.invalidate({ postId });
      utils.infoBoard.postById.invalidate({ id: postId });
      toast.success("コメントを削除しました。");
    },
  });

  const deletePost = trpc.infoBoard.deletePost.useMutation({
    onSuccess: () => {
      toast.success("投稿を削除しました。");
      navigate("/bbs/board.php?bo_table=info");
    },
  });

  const togglePin = trpc.infoBoard.adminTogglePin.useMutation({
    onSuccess: () => {
      utils.infoBoard.postById.invalidate({ id: postId });
      toast.success("固定状態を変更しました。");
    },
  });

  const toggleHide = trpc.infoBoard.adminToggleHide.useMutation({
    onSuccess: () => {
      utils.infoBoard.postById.invalidate({ id: postId });
      toast.success("非表示状態を変更しました。");
    },
  });

  const handleSubmitComment = (parentId?: number) => {
    const content = parentId ? replyText : commentText;
    if (!content.trim()) return;
    createComment.mutate({ postId, content: content.trim(), parentId });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <Layout>
      <div className="min-h-screen bg-white">
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-64 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">投稿が見つかりません。</p>
          <Link href="/bbs/board.php?bo_table=info">
            <Button variant="outline">一覧へ</Button>
          </Link>
        </div>
      </div>
      </Layout>
    );
  }

  // 댓글을 부모-자식 구조로 정리
  const topLevelComments = (comments ?? []).filter((c: any) => !c.parentId);
  const childComments = (comments ?? []).filter((c: any) => c.parentId);
  const getChildren = (parentId: number) => childComments.filter((c: any) => c.parentId === parentId);

  return (
    <Layout>
      <div className="container py-8">
        {/* 상단 네비게이션 */}
        <Link href="/bbs/board.php?bo_table=info" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />목록으로
        </Link>

        <article className="bg-card border rounded-xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-3">
              {post.isPinned ? <Pin className="w-4 h-4 inline mr-1.5 text-amber-600" /> : null}
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center"><User className="w-3 h-3" /></div>
                <span className="font-medium text-foreground">{post.userName || "익명"}</span>
              </div>
              <span>{formatDate(post.createdAt)}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.viewCount}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{post.commentCount}</span>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-4 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }} />

          {/* 이미지 */}
          {post.images && (post.images as string[]).length > 0 && (
            <div className="mb-8">
              <div className="mt-6 space-y-3">
                {(post.images as string[]).map((img, i) => (
                  <img key={i} src={img} alt={`첨부 이미지 ${i + 1}`} className="max-w-full rounded-lg border" />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/bbs/board.php?bo_table=info">
              <Button variant="outline" size="sm">一覧</Button>
            </Link>
            <div className="flex gap-2">
              {user?.role === "admin" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => togglePin.mutate({ id: postId, isPinned: post.isPinned ? 0 : 1 })} className="gap-1">
                    <Pin className="w-3.5 h-3.5" />
                    {post.isPinned ? "固定を解除" : "固定"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleHide.mutate({ id: postId, isHidden: post.isHidden ? 0 : 1 })} className="gap-1">
                    <EyeOff className="w-3.5 h-3.5" />
                    {post.isHidden ? "非表示を解除" : "非表示にする"}
                  </Button>
                </>
              )}
              {(user?.id === post.userId || user?.role === "admin") && (
                <>
                  <Link href={`/info-board/edit/${postId}`}>
                    <Button variant="outline" size="sm">更新</Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => { if (confirm("정말 삭제하시겠습니까?")) deletePost.mutate({ id: postId }); }}>
                    삭제
                  </Button>
                </>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* 댓글 섹션 */}
          <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            댓글 {comments?.length ?? 0}개
          </h3>

          {/* 댓글 목록 */}
          <div className="space-y-0">
            {topLevelComments.map((comment: any) => (
              <div key={comment.id}>
                {/* 부모 댓글 */}
                <div className="py-3 px-4 border-b border-gray-100 hover:bg-gray-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${comment.isAdmin ? "text-amber-700" : "text-gray-700"}`}>
                        {comment.userName || "익명"}
                        {comment.isAdmin ? <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">管理者</span> : null}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setReplyTo(replyTo?.id === comment.id ? null : { id: comment.id, name: comment.userName || "익명" })}
                        className="text-xs text-gray-400 hover:text-amber-600"
                      >
                        답글
                      </button>
                      {(user?.id === comment.userId || user?.role === "admin") && (
                        <button
                          onClick={() => {
                            if (confirm("댓글을 삭제하시겠습니까?")) deleteComment.mutate({ id: comment.id });
                          }}
                          className="text-xs text-gray-400 hover:text-red-500 ml-2"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>

                {/* 답글 입력 */}
                {replyTo?.id === comment.id && user && (
                  <div className="py-3 px-4 pl-10 bg-gray-50 border-b border-gray-100">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder={`${replyTo?.name ?? ''}님에게 답글 작성...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[60px] text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitComment(comment.id)}
                          disabled={!replyText.trim() || createComment.isPending}
                        >
                          등록
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setReplyTo(null); setReplyText(""); }}>
                          취소
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 자식 댓글 */}
                {getChildren(comment.id).map((child: any) => (
                  <div key={child.id} className="py-3 px-4 pl-10 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <CornerDownRight className="w-3 h-3 text-gray-400" />
                        <span className={`text-sm font-medium ${child.isAdmin ? "text-amber-700" : "text-gray-700"}`}>
                          {child.userName || "익명"}
                          {child.isAdmin ? <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">管理者</span> : null}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(child.createdAt)}</span>
                      </div>
                      {(user?.id === child.userId || user?.role === "admin") && (
                        <button
                          onClick={() => {
                            if (confirm("댓글을 삭제하시겠습니까?")) deleteComment.mutate({ id: child.id });
                          }}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap ml-5">{child.content}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 댓글 입력 */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            {user ? (
              <div className="flex gap-2">
                <Textarea
                  placeholder="コメントを入力してください..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px] text-sm resize-none bg-white"
                  rows={3}
                />
                <Button
                  onClick={() => handleSubmitComment()}
                  disabled={!commentText.trim() || createComment.isPending}
                  className="self-end"
                >
                  등록
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">コメントを投稿するにはログインが必要です。</p>
                <a href={getLoginUrl()}>
                  <Button variant="outline" size="sm">ログイン</Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </article>
      </div>
    </Layout>
  );
}
