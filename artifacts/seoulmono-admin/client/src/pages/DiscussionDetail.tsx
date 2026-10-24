import { useState, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  ThumbsUp, MessageSquare, Eye, ArrowLeft, Pin, Lock, CornerDownRight,
  Trash2, Edit, User, Clock, Send, MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type CommentWithUser = {
  id: number;
  discussionId: number;
  userId: number;
  parentId: number | null;
  content: string;
  likeCount: number;
  isHidden: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  userName: string | null;
};

export default function DiscussionDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const utils = trpc.useUtils();

  const discussionId = Number(id);
  const { data: discussion, isLoading } = trpc.discussion.getById.useQuery({ id: discussionId });
  const { data: comments = [] } = trpc.discussion.getComments.useQuery({ discussionId });

  // 좋아요 상태
  const discussionIds = useMemo(() => discussion ? [discussion.id] : [], [discussion]);
  const commentIds = useMemo(() => comments.map((c: CommentWithUser) => c.id), [comments]);
  const { data: likedDiscussions = [] } = trpc.discussion.getUserLikes.useQuery(
    { targetType: "discussion", targetIds: discussionIds },
    { enabled: !!user && discussionIds.length > 0 }
  );
  const { data: likedComments = [] } = trpc.discussion.getUserLikes.useQuery(
    { targetType: "comment", targetIds: commentIds },
    { enabled: !!user && commentIds.length > 0 }
  );

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; userName: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: number; content: string } | null>(null);

  const toggleLike = trpc.discussion.toggleLike.useMutation({
    onSuccess: () => {
      utils.discussion.getById.invalidate({ id: discussionId });
      utils.discussion.getComments.invalidate({ discussionId });
      utils.discussion.getUserLikes.invalidate();
    },
  });

  const createComment = trpc.discussion.createComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      setReplyTo(null);
      utils.discussion.getComments.invalidate({ discussionId });
      utils.discussion.getById.invalidate({ id: discussionId });
      toast.success("コメントを投稿しました");
    },
  });

  const updateComment = trpc.discussion.updateComment.useMutation({
    onSuccess: () => {
      setEditingComment(null);
      utils.discussion.getComments.invalidate({ discussionId });
      toast.success("コメントを更新しました");
    },
  });

  const deleteComment = trpc.discussion.deleteComment.useMutation({
    onSuccess: () => {
      utils.discussion.getComments.invalidate({ discussionId });
      utils.discussion.getById.invalidate({ id: discussionId });
      toast.success("コメントを削除しました");
    },
  });

  const deleteDiscussion = trpc.discussion.delete.useMutation({
    onSuccess: () => {
      navigate("/discussions");
      toast.success("ディスカッションを削除しました");
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate({
      discussionId,
      parentId: replyTo?.id,
      content: commentText.trim(),
    });
  };

  const handleEditComment = () => {
    if (!editingComment || !editingComment.content.trim()) return;
    updateComment.mutate({ id: editingComment.id, content: editingComment.content.trim() });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatRelative = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return d.toLocaleDateString("ja-JP");
  };

  // 스레드 구조 빌드
  const rootComments = useMemo(() => comments.filter((c: CommentWithUser) => !c.parentId), [comments]);
  const repliesMap = useMemo(() => {
    const map = new Map<number, CommentWithUser[]>();
    comments.forEach((c: CommentWithUser) => {
      if (c.parentId) {
        if (!map.has(c.parentId)) map.set(c.parentId, []);
        map.get(c.parentId)!.push(c);
      }
    });
    return map;
  }, [comments]);

  if (isLoading) {
    return (
      <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-12 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
      </Layout>
    );
  }

  if (!discussion) {
    return (
      <Layout>
      <div className="container py-16 text-center">
        <h2 className="text-xl font-semibold mb-2">ディスカッションが見つかりません</h2>
        <Button variant="outline" onClick={() => navigate("/discussions")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> 一覧に戻る
        </Button>
      </div>
      </Layout>
    );
  }

  const isAuthor = user?.id === discussion.userId;
  const isAdmin = user?.role === "admin";
  const isLiked = likedDiscussions.includes(discussion.id);

  const renderComment = (comment: CommentWithUser, depth = 0) => {
    const replies = repliesMap.get(comment.id) || [];
    const isCommentLiked = likedComments.includes(comment.id);
    const isCommentAuthor = user?.id === comment.userId;
    const isEditing = editingComment?.id === comment.id;

    return (
      <div key={comment.id} className={depth > 0 ? "ml-6 sm:ml-10 border-l-2 border-muted pl-4" : ""}>
        <div className="py-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.userName ?? "匿名"}</span>
                {comment.userId === discussion.userId && (
                  <Badge variant="secondary" className="text-xs py-0">投稿者</Badge>
                )}
                <span className="text-xs text-muted-foreground">{formatRelative(comment.createdAt)}</span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingComment.content}
                    onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditComment} disabled={updateComment.isPending}>
                      保存
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              )}

              {!isEditing && (
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => user ? toggleLike.mutate({ targetType: "comment", targetId: comment.id }) : undefined}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      isCommentLiked ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${isCommentLiked ? "fill-current" : ""}`} />
                    {comment.likeCount > 0 && comment.likeCount}
                  </button>
                  {user && discussion.isClosed !== 1 && (
                    <button
                      onClick={() => setReplyTo({ id: comment.id, userName: comment.userName ?? "匿名" })}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <CornerDownRight className="h-3.5 w-3.5" /> 返信
                    </button>
                  )}
                  {(isCommentAuthor || isAdmin) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {isCommentAuthor && (
                          <DropdownMenuItem onClick={() => setEditingComment({ id: comment.id, content: comment.content })}>
                            <Edit className="h-3.5 w-3.5 mr-2" /> 編集
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteComment.mutate({ id: comment.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> 削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 대댓글 렌더링 */}
        {replies.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  return (
    <Layout>
    <div className="container py-8 max-w-4xl">
      {/* 뒤로가기 */}
      <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => navigate("/discussions")}>
        <ArrowLeft className="h-4 w-4" /> ディスカッション一覧
      </Button>

      {/* 토론 본문 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {discussion.isPinned === 1 && (
              <Badge variant="secondary" className="gap-1"><Pin className="h-3 w-3" /> 固定</Badge>
            )}
            {discussion.isClosed === 1 && (
              <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" /> 終了</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{discussion.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" /> {discussion.userName ?? "匿名"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatDate(discussion.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> 閲覧 {discussion.viewCount}
            </span>
          </div>
          {(discussion.tags as string[] | null)?.length ? (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {(discussion.tags as string[]).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {discussion.content}
          </div>

          {/* 좋아요 + 액션 */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            <div className="flex items-center gap-4">
              <button
                onClick={() => user ? toggleLike.mutate({ targetType: "discussion", targetId: discussion.id }) : undefined}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  isLiked
                    ? "bg-primary/10 border-primary text-primary"
                    : "hover:bg-accent border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span className="font-medium">{discussion.likeCount}</span>
              </button>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" /> コメント {discussion.commentCount}
              </span>
            </div>

            {(isAuthor || isAdmin) && (
              <div className="flex gap-2">
                {isAuthor && (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/discussions/${discussion.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-1" /> 編集
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> 削除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>ディスカッションの削除</AlertDialogTitle>
                      <AlertDialogDescription>
                        このディスカッションとすべてのコメントが削除されます。この操作は元に戻せません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteDiscussion.mutate({ id: discussion.id })}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        削除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <div className="space-y-0">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          コメント {comments.length > 0 && `(${comments.length})`}
        </h3>

        {/* 댓글 입력 */}
        {user ? (
          discussion.isClosed !== 1 ? (
            <Card className="mb-6">
              <CardContent className="p-4">
                {replyTo && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground bg-muted rounded px-3 py-1.5">
                    <CornerDownRight className="h-3.5 w-3.5" />
                    <span><strong>{replyTo.userName}</strong>さんへの返信</span>
                    <button onClick={() => setReplyTo(null)} className="ml-auto text-xs hover:text-foreground">キャンセル</button>
                  </div>
                )}
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyTo ? `${replyTo.userName}さんへの返信を入力...` : "コメントを入力してください..."}
                  rows={3}
                  className="mb-3"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || createComment.isPending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {createComment.isPending ? "投稿中..." : "コメントを投稿"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="py-4 text-center text-muted-foreground">
                <Lock className="h-5 w-5 mx-auto mb-2" />
                このディスカッションは終了しているため、新しいコメントを投稿できません。
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="mb-6">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground mb-2">コメントを投稿するにはログインが必要です。</p>
              <Button asChild size="sm">
                <a href={getLoginUrl()}>ログイン</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 댓글 목록 */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>まだコメントがありません。最初のコメントを投稿してみましょう！</p>
          </div>
        ) : (
          <div className="divide-y">
            {rootComments.map((comment: CommentWithUser) => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
}
