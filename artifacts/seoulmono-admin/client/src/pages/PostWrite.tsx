import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star } from "lucide-react";
import { useParams, useLocation, useSearch } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import ReviewImageUploader from "@/components/ReviewImageUploader";

export default function PostWrite() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const productIdParam = params.get("productId");

  const { data: board } = trpc.community.boardBySlug.useQuery({ slug: slug! });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<string[]>([]);

  const createPost = trpc.community.createPost.useMutation({
    onSuccess: (data) => {
      toast.success("게시글이 등록되었습니다");
      if (slug === "review") {
        navigate(`/shop/itemuseview.php?is_id=${data.postId}`);
      } else {
        navigate(`/community/post/${data.postId}`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }
    if (!board) return;
    createPost.mutate({
      boardId: board.id,
      title,
      content,
      images: images.length > 0 ? images : undefined,
      rating: board.boardType === "review" ? rating : undefined,
      productId: productIdParam ? parseInt(productIdParam) : undefined,
    });
  };

  const boardTypeLabel: Record<string, string> = { free: "자유게시판", review: "고객 리뷰", qna: "Q&A", notice: "공지사항" };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />돌아가기
        </button>

        <div className="bg-card border rounded-xl p-6 md:p-8">
          <h1 className="text-xl font-bold mb-6">{boardTypeLabel[slug!] ?? "게시판"} 글쓰기</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm mb-1.5 block">제목</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요" />
            </div>

            {board?.boardType === "review" && (
              <div>
                <Label className="text-sm mb-1.5 block">평점</Label>
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
              <Label className="text-sm mb-1.5 block">내용</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용을 입력하세요" rows={12} />
            </div>

            {/* Image Upload */}
            <ReviewImageUploader images={images} onChange={setImages} maxImages={5} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>취소</Button>
              <Button type="submit" disabled={createPost.isPending}>
                {createPost.isPending ? "등록 중..." : "등록하기"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
