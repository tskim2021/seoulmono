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
      toast.error("カテゴリーを選択してください。");
      return;
    }
    try {
      if (editingQna) {
        await updateMutation.mutateAsync({
          id: editingQna.id,
          ...formData,
        });
        toast.success("Q&Aを更新しました。");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Q&Aを追加しました。");
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("操作に失敗しました。");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("このQ&Aを削除しますか？")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Q&Aを削除しました。");
      refetch();
    } catch (error) {
      toast.error("削除に失敗しました。");
    }
  };

  const filteredQna = useMemo(() => {
    if (!qnaList) return [];
    if (selectedCategory === "all") return qnaList;
    return qnaList.filter((q) => q.categoryId === selectedCategory);
  }, [qnaList, selectedCategory]);

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c) => c.id === categoryId)?.name || "不明";
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
            Q&A管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            カテゴリー別の質問と回答を管理します。Markdown形式に対応しています。
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Q&Aを追加
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Q&A一覧</CardTitle>
              <CardDescription>
                カテゴリーで絞り込んでQ&Aを管理できます。
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">すべてのカテゴリー</option>
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
              <p>登録されたQ&Aがありません。</p>
              <p className="text-sm mt-1">Q&Aを追加して、チャットボットの応答を構成してください。</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>カテゴリー</TableHead>
                  <TableHead>質問</TableHead>
                  <TableHead>回答 (プレビュー)</TableHead>
                  <TableHead className="text-center">表示順</TableHead>
                  <TableHead className="text-center">ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
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
                        {qna.isActive ? "有効" : "無効"}
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
            <DialogTitle>{editingQna ? "Q&Aの編集" : "Q&Aの追加"}</DialogTitle>
            <DialogDescription>
              チャットボットが応答する質問と回答を{editingQna ? "編集" : "追加"}します。回答はMarkdown形式に対応しています。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">カテゴリー *</Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value={0}>カテゴリーを選択してください</option>
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
              <Label htmlFor="question">質問 *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="例: 送料はいくらですか？"
                required
              />
            </div>

            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">編集</TabsTrigger>
                <TabsTrigger value="preview">プレビュー</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="space-y-2">
                <Label htmlFor="answer">回答 (Markdown対応) *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="回答内容を入力してください。Markdown形式を使用できます。&#10;&#10;例:&#10;送料は以下のとおりです:&#10;- 3万円以上: **送料無料**&#10;- 3万円未満: 3,000円"
                  rows={12}
                  required
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  **굵게**, *기울임*, [링크](URL), - 목록 등 마크다운 문법을 사용할 수 있습니다.
                </p>
              </TabsContent>
              <TabsContent value="preview" className="space-y-2">
                <Label>回答プレビュー</Label>
                <div className="border rounded-md p-4 min-h-[300px] bg-muted/30">
                  {formData.answer ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{formData.answer}</Streamdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">回答を入力するとプレビューが表示されます。</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">表示順</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">有効化</Label>
                <div className="flex items-center h-10">
                  <Switch
                    id="isActive"
                    checked={formData.isActive === 1}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? 1 : 0 })}
                  />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formData.isActive ? "有効" : "無効"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  editingQna ? "更新" : "追加"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
