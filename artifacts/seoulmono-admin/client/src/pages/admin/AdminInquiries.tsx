import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MessageSquareText, ChevronLeft, Pencil, Trash2, Bot, User, Send, X, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import Paginator from "@/components/Paginator";

type StatusFilter = "all" | "pending" | "answered";

export default function AdminInquiries() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [editReply, setEditReply] = useState<{ id: number; content: string } | null>(null);

  const { data, isLoading } = trpc.admin.getInquiries.useQuery({ page, limit: 20, search, status });

  // posts 갱신 시 selectedPost도 동기화
  useEffect(() => {
    if (selectedPost && data?.posts) {
      const updated = data.posts.find((p: any) => p.id === selectedPost.id);
      if (updated) {
        setSelectedPost(updated);
      }
    }
  }, [data?.posts, selectedPost?.id]);
  const { data: replies = [], isLoading: repliesLoading } = trpc.admin.getInquiryReplies.useQuery(
    { postId: selectedPost?.id ?? 0 },
    { enabled: !!selectedPost }
  );

  const createReply = trpc.admin.createInquiryReply.useMutation({
    onSuccess: () => {
      toast.success("回答を登録しました");
      setReplyText("");
      utils.admin.getInquiryReplies.invalidate({ postId: selectedPost?.id });
      utils.admin.getInquiries.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateReply = trpc.admin.updateInquiryReply.useMutation({
    onSuccess: () => {
      toast.success("回答を更新しました");
      setEditReply(null);
      utils.admin.getInquiryReplies.invalidate({ postId: selectedPost?.id });
    },
    onError: (e) => toast.error(e.message),
  });
  const markAnswered = trpc.admin.markInquiryAnswered.useMutation({
    onSuccess: () => {
      toast.success("対応完了にしました");
      utils.admin.getInquiries.invalidate();
      utils.admin.getInquiryReplies.invalidate({ postId: selectedPost?.id });
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteReply = trpc.admin.deleteInquiryReply.useMutation({
    onSuccess: () => {
      toast.success("回答を削除しました");
      utils.admin.getInquiryReplies.invalidate({ postId: selectedPost?.id });
      utils.admin.getInquiries.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const statusTabs: { label: string; value: StatusFilter; color?: string }[] = [
    { label: "すべて", value: "all" },
    { label: "回答待ち", value: "pending", color: "text-amber-600" },
    { label: "回答済み", value: "answered", color: "text-emerald-600" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSelectPost = (post: any) => {
    setSelectedPost(post);
    setReplyText("");
    setEditReply(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquareText className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">お問い合わせ管理</h1>
        {total > 0 && <Badge variant="secondary">{total}건</Badge>}
      </div>

      {selectedPost ? (
        /* ── 상세 뷰 ── */
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)}>
            <ChevronLeft className="w-4 h-4 mr-1" />목록으로
          </Button>

          {/* 문의 내용 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{selectedPost.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPost.userName ?? "알 수 없음"} · {formatDateTime(selectedPost.createdAt)}
                    {selectedPost.replyEmail && <> · 답변받을 이메일: {selectedPost.replyEmail}</>}
                  </p>
                </div>
                {selectedPost.needsHuman
                  ? <Badge className="bg-orange-100 text-orange-700 border-0 shrink-0">担当者の回答待ち</Badge>
                  : selectedPost.isAnswered
                    ? <Badge className="bg-emerald-100 text-emerald-700 border-0 shrink-0">対応完了</Badge>
                    : selectedPost.hasHumanReply
                      ? <Badge className="bg-teal-100 text-teal-700 border-0 shrink-0">担当者回答登録済み</Badge>
                      : <Badge className="bg-amber-100 text-amber-700 border-0 shrink-0">回答待ち</Badge>
                }
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
              {selectedPost.attachments && selectedPost.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedPost.attachments.map((a: any, i: number) => (
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border bg-secondary/30">
                      <img src={a.url} alt={a.originalname} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 답변 목록 */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              답변 내역 {replies.length > 0 && `(${replies.length}건)`}
            </h2>
            {repliesLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">読み込み中...</div>
            ) : replies.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-lg">
                아직 답변이 없습니다
              </div>
            ) : (
              replies.map((reply: any) => (
                <Card key={reply.id} className={reply.isAutoReply ? "border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800" : "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800"}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {reply.isAutoReply
                          ? <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-xs gap-1"><Bot className="w-3 h-3" />自動応答</Badge>
                          : <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs gap-1"><User className="w-3 h-3" />担当者</Badge>
                        }
                        <span className="text-xs text-muted-foreground">{formatDateTime(reply.createdAt)}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setEditReply({ id: reply.id, content: reply.content })}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("이 답변을 삭제하시겠습니까?")) deleteReply.mutate({ id: reply.id, postId: selectedPost.id }); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {editReply?.id === reply.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editReply.content}
                          onChange={e => setEditReply({ ...editReply, content: e.target.value })}
                          rows={4}
                          className="text-sm"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setEditReply(null)}>
                            <X className="w-3.5 h-3.5 mr-1" />취소
                          </Button>
                          <Button size="sm" onClick={() => updateReply.mutate({ id: editReply.id, content: editReply.content })}
                            disabled={updateReply.isPending}>
                            저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* 새 답변 작성 */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary">新しい回答を作成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="お客様に送る回答を入力してください..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={5}
                className="text-sm resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => { if (!replyText.trim()) return; createReply.mutate({ postId: selectedPost.id, content: replyText.trim() }); }}
                  disabled={!replyText.trim() || createReply.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {createReply.isPending ? "登録中..." : "回答を登録"}
                </Button>
                {!selectedPost.isAnswered && (
                  <Button
                    variant="destructive"
                    onClick={() => markAnswered.mutate({ postId: selectedPost.id })}
                    disabled={markAnswered.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {markAnswered.isPending ? "処理中..." : "対応完了"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ── 목록 뷰 ── */
        <div className="space-y-4">
          {/* 검색 + 필터 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <Input
                placeholder="タイトルで検索..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </form>
            <div className="flex gap-1 border rounded-lg p-1 bg-secondary/30">
              {statusTabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => { setStatus(tab.value); setPage(1); }}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    status === tab.value
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  } ${tab.color ?? ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 테이블 */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">番号</TableHead>
                    <TableHead>タイトル</TableHead>
                    <TableHead className="w-28">投稿者</TableHead>
                    <TableHead className="w-36">投稿日時</TableHead>
                    <TableHead className="w-24 text-center">ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><div className="h-4 bg-secondary/50 rounded animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        {search ? `"${search}" 검색 결과가 없습니다` : "お問い合わせがありません"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post: any) => (
                      <TableRow
                        key={post.id}
                        className="cursor-pointer hover:bg-secondary/40 transition-colors"
                        onClick={() => handleSelectPost(post)}
                      >
                        <TableCell className="text-center text-xs text-muted-foreground">{post.id}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${!post.isAnswered ? "text-foreground" : "text-muted-foreground"}`}>
                            {post.title}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{post.userName ?? "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(post.createdAt)}</TableCell>
                        <TableCell className="text-center">
                          {post.needsHuman
                            ? <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">担当者待ち</Badge>
                            : post.isAnswered
                              ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">対応完了</Badge>
                              : post.hasHumanReply
                                ? <Badge className="bg-teal-100 text-teal-700 border-0 text-xs">担当者回答</Badge>
                                : <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">待機中</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Paginator currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
