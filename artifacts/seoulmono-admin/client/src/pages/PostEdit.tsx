import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ReviewImageUploader from "@/components/ReviewImageUploader";

export default function PostEdit() {
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id!);
  const { user, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const { data: post, isLoading } = trpc.community.postById.useQuery({ id: postId });
  const { data: boards } = trpc.community.boards.useQuery();
  const boardType = post && boards ? boards.find((b: any) => b.id === post.boardId)?.boardType : undefined;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (post && !initialized) {
      setTitle(post.title);
      setContent(post.content ?? "");
      setRating(post.rating ?? 5);
      setImages((post.images as string[] | null) ?? []);
      setInitialized(true);
    }
  }, [post, initialized]);

  const updatePost = trpc.community.updatePost.useMutation({
    onSuccess: () => {
      toast.success("投稿を更新しました");
      if (boardType === "review") {
        navigate(`/shop/itemuseview.php?is_id=${postId}`);
      } else {
        navigate(`/community/post/${postId}`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("タイトルと内容を入力してください");
      return;
    }
    updatePost.mutate({
      id: postId,
      title,
      content,
      images: images.length > 0 ? images : undefined,
      rating: boardType === "review" ? rating : undefined,
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">投稿が見つかりません。</p>
        </div>
      </Layout>
    );
  }

  // 본인 글만 수정 가능
  if (user && post.userId !== user.id && user.role !== "admin") {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">編集権限がありません。</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-3xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />돌아가기
        </button>

        <div className="bg-card border rounded-xl p-6 md:p-8">
          <h1 className="text-xl font-bold mb-6">投稿の編集</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm mb-1.5 block">タイトル</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="タイトルを入力してください" />
            </div>

            {boardType === "review" && (
              <div>
                <Label className="text-sm mb-1.5 block">評価</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setRating(n)} className="p-0.5">
                      <Star className={`w-6 h-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm mb-1.5 block">内容</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="内容を入力してください" rows={12} />
            </div>

            {/* Image Upload */}
            <ReviewImageUploader images={images} onChange={setImages} maxImages={5} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>キャンセル</Button>
              <Button type="submit" disabled={updatePost.isPending}>
                {updatePost.isPending ? "更新中..." : "更新する"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
