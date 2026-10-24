import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, MessageSquareText, Filter } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Qna = {
  id: number;
  categoryId: number;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
};

type Category = {
  id: number;
  name: string;
  parentId: number | null;
};

export default function AdminChatbotQna() {
  const { data: qnaList, isLoading: qnaLoading, refetch } = trpc.chatbotAdmin.getAllQna.useQuery();
  const { data: categories, isLoading: catLoading } = trpc.chatbotAdmin.getAllCategories.useQuery();
  const createMutation = trpc.chatbotAdmin.createQna.useMutation();
  const updateMutation = trpc.chatbotAdmin.updateQna.useMutation();
  const deleteMutation = trpc.chatbotAdmin.deleteQna.useMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQna, setEditingQna] = useState<Qna | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [formData, setFormData] = useState({
    categoryId: 0,
    question: "",
    answer: "",
    sortOrder: 0,
    isActive: 1,
  });

  const handleOpenDialog = (qna?: Qna) => {
    if (qna) {
      setEditingQna(qna);
      setFormData({
        categoryId: qna.categoryId,
        question: qna.question,
        answer: qna.answer,
        sortOrder: qna.sortOrder,
        isActive: qna.isActive,
      });
    } else {
      setEditingQna(null);
      setFormData({
        categoryId: selectedCategory === "all" ? 0 : selectedCategory,
        question: "",
        answer: "",
        sortOrder: 0,
        isActive: 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error("카테고리를 선택해주세요.");
      return;
    }
    try {
      if (editingQna) {
        await updateMutation.mutateAsync({
          id: editingQna.id,
          ...formData,
        });
        toast.success("문답이 수정되었습니다.");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("문답이 추가되었습니다.");
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("작업에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 문답을 삭제하시겠습니까?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("문답이 삭제되었습니다.");
      refetch();
    } catch (error) {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const filteredQna = useMemo(() => {
    if (!qnaList) return [];
    if (selectedCategory === "all") return qnaList;
    return qnaList.filter((q) => q.categoryId === selectedCategory);
  }, [qnaList, selectedCategory]);

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c) => c.id === categoryId)?.name || "알 수 없음";
  };

  if (qnaLoading || catLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquareText className="w-6 h-6" />
            문답 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            카테고리별 질문과 답변을 관리합니다. 마크다운 형식을 지원합니다.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          문답 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>문답 목록</CardTitle>
              <CardDescription>
                카테고리별로 필터링하여 문답을 관리할 수 있습니다.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">전체 카테고리</option>
                {categories?.filter((c) => !c.parentId).map((cat) => (
                  <optgroup key={cat.id} label={cat.name}>
                    <option value={cat.id}>{cat.name}</option>
                    {categories
                      ?.filter((c) => c.parentId === cat.id)
                      .map((subCat) => (
                        <option key={subCat.id} value={subCat.id}>
                          └ {subCat.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQna.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquareText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>등록된 문답이 없습니다.</p>
              <p className="text-sm mt-1">문답을 추가하여 챗봇 응답을 구성하세요.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>카테고리</TableHead>
                  <TableHead>질문</TableHead>
                  <TableHead>답변 (미리보기)</TableHead>
                  <TableHead className="text-center">정렬순서</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQna.map((qna) => (
                  <TableRow key={qna.id}>
                    <TableCell>
                      <Badge variant="outline">{getCategoryName(qna.categoryId)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{qna.question}</div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {qna.answer}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{qna.sortOrder}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={qna.isActive ? "default" : "secondary"}>
                        {qna.isActive ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(qna)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(qna.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQna ? "문답 수정" : "문답 추가"}</DialogTitle>
            <DialogDescription>
              챗봇이 응답할 질문과 답변을 {editingQna ? "수정" : "추가"}합니다. 답변은 마크다운 형식을 지원합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">카테고리 *</Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value={0}>카테고리를 선택하세요</option>
                {categories?.filter((c) => !c.parentId).map((cat) => (
                  <>
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                    {categories
                      ?.filter((c) => c.parentId === cat.id)
                      .map((subCat) => (
                        <option key={subCat.id} value={subCat.id}>
                          └ {subCat.name}
                        </option>
                      ))}
                  </>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">질문 *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="예: 배송비는 얼마인가요?"
                required
              />
            </div>

            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">편집</TabsTrigger>
                <TabsTrigger value="preview">미리보기</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="space-y-2">
                <Label htmlFor="answer">답변 (마크다운 지원) *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="답변 내용을 입력하세요. 마크다운 형식을 사용할 수 있습니다.&#10;&#10;예:&#10;배송비는 다음과 같습니다:&#10;- 3만원 이상: **무료배송**&#10;- 3만원 미만: 3,000원"
                  rows={12}
                  required
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  **굵게**, *기울임*, [링크](URL), - 목록 등 마크다운 문법을 사용할 수 있습니다.
                </p>
              </TabsContent>
              <TabsContent value="preview" className="space-y-2">
                <Label>답변 미리보기</Label>
                <div className="border rounded-md p-4 min-h-[300px] bg-muted/30">
                  {formData.answer ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{formData.answer}</Streamdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">답변을 입력하면 미리보기가 표시됩니다.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">정렬 순서</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">활성화</Label>
                <div className="flex items-center h-10">
                  <Switch
                    id="isActive"
                    checked={formData.isActive === 1}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? 1 : 0 })}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formData.isActive ? "활성" : "비활성"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  editingQna ? "수정" : "추가"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
