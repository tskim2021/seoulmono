import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function InfoBoardWrite() {
  const { id } = useParams<{ id: string }>();
  const editId = id ? Number(id) : null;
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 수정 모드: 기존 데이터 로드
  const { data: existingPost } = trpc.infoBoard.postById.useQuery(
    { id: editId! },
    { enabled: !!editId }
  );

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content);
    }
  }, [existingPost]);

  const createPost = trpc.infoBoard.createPost.useMutation({
    onSuccess: (result) => {
      toast.success("投稿を登録しました。");
      navigate(`/info-board/${(result as any).id}`);
    },
    onError: (err) => {
      toast.error(err.message || "게시글 등록에 실패했습니다.");
      setIsSaving(false);
    },
  });

  const updatePost = trpc.infoBoard.updatePost.useMutation({
    onSuccess: () => {
      toast.success("投稿を更新しました。");
      navigate(`/info-board/${editId}`);
    },
    onError: (err) => {
      toast.error(err.message || "게시글 수정에 실패했습니다.");
      setIsSaving(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("タイトルと内容をすべて入力してください。");
      return;
    }
    setIsSaving(true);
    if (editId) {
      updatePost.mutate({ id: editId, title: title.trim(), content: content.trim() });
    } else {
      createPost.mutate({ title: title.trim(), content: content.trim() });
    }
  };

  if (loading) {
    return (
      <Layout><div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div></Layout>
    );
  }

  if (!user) {
    return (
      <Layout><div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">ログインが必要です。</p>
          <a href={getLoginUrl()}>
            <Button>ログイン</Button>
          </a>
        </div>
      </div></Layout>
    );
  }

  return (
    <Layout>
    <div className="min-h-screen bg-white">
      <div className="container max-w-4xl py-8">
        {/* 상단 네비게이션 */}
        <Link href="/bbs/board.php?bo_table=info" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          정보나눔 목록
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {editId ? "投稿の編集" : "情報共有 投稿作成"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">タイトル</label>
            <Input
              placeholder="タイトルを入力してください"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
              maxLength={200}
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">内容</label>
            <Textarea
              placeholder="健康に関する情報を自由に共有してください..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] text-sm leading-relaxed resize-none"
              rows={20}
            />
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Link href="/bbs/board.php?bo_table=info">
              <Button type="button" variant="outline">キャンセル</Button>
            </Link>
            <Button type="submit" disabled={isSaving || !title.trim() || !content.trim()} className="gap-2">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editId ? "更新完了" : "登録"}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </Layout>
  );
}
