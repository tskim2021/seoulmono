import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, X, Plus } from "lucide-react";
import { toast } from "sonner";

export default function DiscussionWrite() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: categories } = trpc.category.list.useQuery();
  const { data: existing } = trpc.discussion.getById.useQuery(
    { id: Number(id) },
    { enabled: isEdit }
  );

  useEffect(() => {
    if (existing && isEdit) {
      setTitle(existing.title);
      setContent(existing.content);
      setCategoryId(existing.categoryId ? String(existing.categoryId) : "none");
      setTags((existing.tags as string[] | null) ?? []);
    }
  }, [existing, isEdit]);

  const createMutation = trpc.discussion.create.useMutation({
    onSuccess: (data) => {
      toast.success("토론이 등록되었습니다");
      navigate(`/discussions/${data.id}`);
    },
    onError: (err) => {
      toast.error(err.message || "등록에 실패했습니다");
    },
  });

  const updateMutation = trpc.discussion.update.useMutation({
    onSuccess: () => {
      toast.success("토론이 수정되었습니다");
      navigate(`/discussions/${id}`);
    },
    onError: (err) => {
      toast.error(err.message || "수정에 실패했습니다");
    },
  });

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }

    const data = {
      title: title.trim(),
      content: content.trim(),
      categoryId: categoryId !== "none" ? Number(categoryId) : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (isEdit) {
      updateMutation.mutate({ id: Number(id), ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (authLoading) {
    return (
      <Layout><div className="container py-8 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div></Layout>
    );
  }

  if (!user) {
    return (
      <Layout><div className="container py-16 text-center">
        <h2 className="text-xl font-semibold mb-4">로그인이 필요합니다</h2>
        <Button asChild>
          <a href={getLoginUrl()}>로그인</a>
        </Button>
      </div></Layout>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
    <div className="container py-8 max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => navigate(isEdit ? `/discussions/${id}` : "/discussions")}>
        <ArrowLeft className="h-4 w-4" /> {isEdit ? "토론으로 돌아가기" : "토론 목록"}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "토론 수정" : "새 토론 시작"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 카테고리 */}
            <div className="space-y-2">
              <Label>카테고리 (선택)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">카테고리 없음</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="토론 제목을 입력해주세요"
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/255</p>
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content">내용 <span className="text-destructive">*</span></Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="자유롭게 의견을 나눠보세요. 건강, 제품 사용 경험, 궁금한 점 등 어떤 주제든 환영합니다."
                rows={12}
                className="resize-y min-h-[200px]"
              />
            </div>

            {/* 태그 */}
            <div className="space-y-2">
              <Label>태그 (최대 5개)</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="태그 입력 후 Enter"
                  maxLength={20}
                  disabled={tags.length >= 5}
                />
                <Button type="button" variant="outline" onClick={handleAddTag} disabled={tags.length >= 5 || !tagInput.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 제출 */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/discussions/${id}` : "/discussions")}>
                취소
              </Button>
              <Button type="submit" disabled={isPending || !title.trim() || !content.trim()} className="gap-2">
                <Send className="h-4 w-4" />
                {isPending ? "처리 중..." : isEdit ? "수정 완료" : "토론 등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </Layout>
  );
}
