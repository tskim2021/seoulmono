import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateTime, productHref, proxyImage } from "@/lib/utils";
import { ArrowLeft, Eye, MessageCircle, Trash2, Reply, Star, User, CheckCircle } from "lucide-react";
import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ReviewImageGallery } from "@/components/ImageLightbox";
import { useSEO } from "@/hooks/useSEO";
function CommentSection({ postId }: { postId: number }) {
  const { user, isAuthenticated } = useAuth();
  const { data: comments, isLoading } = trpc.community.comments.useQuery({ postId });
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const createComment = trpc.community.createComment.useMutation({
    onSuccess: () => { setContent(""); setReplyTo(null); setReplyContent(""); utils.community.comments.invalidate({ postId }); toast.success("コメントを投稿しました"); },
    onError: () => toast.error("コメントの投稿に失敗しました"),
  });
  const deleteComment = trpc.community.deleteComment.useMutation({
    onSuccess: () => { utils.community.comments.invalidate({ postId }); toast.success("コメントを削除しました"); },
  });

  const topLevel = (comments ?? []).filter(c => !c.parentId);
  const getReplies = (parentId: number) => (comments ?? []).filter(c => c.parentId === parentId);

  const renderComment = (comment: any, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-8 border-l-2 border-border/60 pl-4" : ""}`}>
      <div className="py-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium">{comment.userName ?? "익명"}</span>
          {comment.isAdmin === 1 && <Badge variant="secondary" className="text-[10px] px-1.5">管理者</Badge>}
          <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        <div className="flex items-center gap-3 mt-2">
          {isAuthenticated && !isReply && (
            <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <Reply className="w-3 h-3" />답글
            </button>
          )}
          {(user?.id === comment.userId || user?.role === "admin") && (
            <button onClick={() => deleteComment.mutate({ id: comment.id })} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
              <Trash2 className="w-3 h-3" />삭제
            </button>
          )}
        </div>
        {/* Reply form */}
        {replyTo === comment.id && (
          <div className="mt-3 ml-8">
            <Textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="返信を入力してください..." rows={2} className="text-sm" />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setReplyTo(null)}>キャンセル</Button>
              <Button size="sm" onClick={() => createComment.mutate({ postId, content: replyContent, parentId: comment.id })} disabled={!replyContent.trim()}>返信を投稿</Button>
            </div>
          </div>
        )}
      </div>
      {/* Replies */}
      {getReplies(comment.id).map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <div>
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />댓글 {comments?.length ?? 0}
      </h3>
      {/* Comment form */}
      {isAuthenticated ? (
        <div className="mb-6">
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="コメントを入力してください..." rows={3} className="text-sm" />
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={() => createComment.mutate({ postId, content })} disabled={!content.trim() || createComment.isPending}>コメントを投稿</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-6 p-4 bg-secondary/50 rounded-lg text-center">コメントを投稿するにはログインしてください。</p>
      )}
      {/* Comments list */}
      <div className="divide-y divide-border/60">
        {topLevel.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">まだコメントがありません</p>
        ) : (
          topLevel.map(c => renderComment(c))
        )}
      </div>
    </div>
  );
}

function ReviewRepliesSection({ postId }: { postId: number }) {
  const { data: replies } = trpc.community.reviewReplies.useQuery({ postId });
  if (!replies || replies.length === 0) return null;
  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-primary" /> \uAD00\uB9AC\uC790 \uB2F5\uBCC0</h3>
      {replies.map(reply => (
        <div key={reply.id} className="bg-primary/5 border border-primary/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-primary">\uAD00\uB9AC\uC790</span>
            <span className="text-xs text-muted-foreground">{formatDateTime(reply.createdAt)}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
        </div>
      ))}
    </div>
  );
}

export default function PostDetail({ postIdProp }: { postIdProp?: number } = {}) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const postId = postIdProp ?? parseInt(id!);
  const { data: post, isLoading, error } = trpc.community.postById.useQuery({ id: postId }, { retry: false });

  useSEO({
    title: post?.title,
    description: post?.content ? post.content.slice(0, 160) : undefined,
    ogType: "article",
  });

  const deletePost = trpc.community.deletePost.useMutation({
    onSuccess: () => { toast.success("投稿を削除しました"); window.history.back(); },
  });

  if (isLoading) {
    return <Layout><div className="container py-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-secondary rounded w-1/2" /><div className="h-4 bg-secondary rounded w-1/4" /><div className="h-64 bg-secondary rounded" /></div></div></Layout>;
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold mb-2">投稿が見つかりません</h2>
          <p className="text-muted-foreground mb-4">お探しの投稿は存在しないか、削除されました。</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}><ArrowLeft className="w-4 h-4 mr-1" />前のページ</Button>
            <Button asChild><Link href="/community/free">掲示板へ</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  const postImages = (post.images as string[] | null) ?? [];

  return (
    <Layout>
      <div className="container py-8">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />목록으로
        </button>

        <article className="bg-card border rounded-xl p-6 md:p-8">
          {/* Product info (for reviews) */}
          {post.productThumbnail && post.productName && post.productSlug && (
            <Link href={productHref(post.productSlug)} className="flex items-center gap-3 mb-4 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
              <img src={proxyImage(post.productThumbnail)} alt="" className="w-16 h-16 object-cover rounded border" />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">レビュー商品</span>
                <span className="text-sm font-medium line-clamp-2">{post.productName}</span>
              </div>
            </Link>
          )}
          {/* Header */}
          <div className="mb-6">
            {post.rating && (
              <div className="flex items-center gap-3 mb-2">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={`post-rating-${i}`} className={`w-4 h-4 ${i < post.rating! ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}</div>
                {post.orderId && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                    <CheckCircle className="w-3 h-3 mr-1" /> 구매 인증
                  </Badge>
                )}
              </div>
            )}
            <h1 className="text-xl font-bold mb-3">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center"><User className="w-3 h-3" /></div>
                <span className="font-medium text-foreground">{post.displayName ?? post.userName ?? "익명"}</span>
              </div>
              <span>{formatDateTime(post.createdAt)}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.viewCount}</span>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</div>

          {/* Images with lightbox */}
          {postImages.length > 0 && (
            <div className="mb-8">
              <ReviewImageGallery images={postImages} maxVisible={6} />
            </div>
          )}

          {/* Actions */}
          {(user?.id === post.userId || user?.role === "admin") && (
            <div className="flex gap-2 justify-end mb-6">
              <Button variant="outline" size="sm" asChild><Link href={`/community/post/${post.id}/edit`}>更新</Link></Button>
              <Button variant="destructive" size="sm" onClick={() => { if (confirm("정말 삭제하시겠습니까?")) deletePost.mutate({ id: post.id }); }}>削除</Button>
            </div>
          )}

          {/* Review Replies (admin answers) */}
          {post.rating && <ReviewRepliesSection postId={postId} />}

          <Separator className="my-6" />

          {/* Comments */}
          <CommentSection postId={postId} />
        </article>
      </div>
    </Layout>
  );
}
