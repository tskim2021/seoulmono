import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

const FAQ_CATEGORIES = ["상품", "주문/배송", "결제", "반품/교환", "회원/포인트", "기타"];
const FAQ_CATEGORY_LABELS: Record<string, string> = { "상품": "商品", "주문/배송": "注文/配送", "결제": "お支払い", "반품/교환": "返品/交換", "회원/포인트": "会員/ポイント", "기타": "その他" };

export default function AdminFAQ() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  
  const { data: faqs = [], refetch } = trpc.admin.getFaqs.useQuery({ category: filterCategory });
  const createFaq = trpc.admin.createFaq.useMutation();
  const updateFaq = trpc.admin.updateFaq.useMutation();
  const deleteFaq = trpc.admin.deleteFaq.useMutation();
  
  const [formData, setFormData] = useState({
    category: "",
    question: "",
    answer: "",
    sortOrder: 0,
    isActive: 1,
  });
  
  const handleOpenDialog = (faq?: any) => {
    if (faq) {
      setSelectedFaq(faq);
      setFormData({
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        isActive: faq.isActive,
      });
    } else {
      setSelectedFaq(null);
      setFormData({
        category: "",
        question: "",
        answer: "",
        sortOrder: 0,
        isActive: 1,
      });
    }
    setDialogOpen(true);
  };
  
  const handleSubmit = async () => {
    try {
      if (selectedFaq) {
        await updateFaq.mutateAsync({ id: selectedFaq.id, ...formData });
        toast.success("FAQを更新しました。");
      } else {
        await createFaq.mutateAsync(formData);
        toast.success("FAQを追加しました。");
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("エラーが発生しました。");
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("本当に削除しますか？")) return;
    
    try {
      await deleteFaq.mutateAsync({ id });
      toast.success("FAQを削除しました。");
      refetch();
    } catch (error) {
      toast.error("エラーが発生しました。");
    }
  };
  
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FAQ管理</CardTitle>
              <CardDescription>よくあるご質問を管理します</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  FAQを追加
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedFaq ? "FAQの編集" : "FAQの追加"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">カテゴリー</label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {FAQ_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{FAQ_CATEGORY_LABELS[cat] ?? cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">質問</label>
                    <Input
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="質問を入力してください"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">回答</label>
                    <Textarea
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="回答を入力してください"
                      rows={6}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">表示順</label>
                      <Input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">有効化</label>
                      <Select value={formData.isActive.toString()} onValueChange={(value) => setFormData({ ...formData, isActive: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">有効</SelectItem>
                          <SelectItem value="0">無効</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
                    <Button onClick={handleSubmit}>保存</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={filterCategory || "all"} onValueChange={(value) => setFilterCategory(value === "all" ? undefined : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="すべてのカテゴリー" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのカテゴリー</SelectItem>
                {FAQ_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{FAQ_CATEGORY_LABELS[cat] ?? cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>カテゴリー</TableHead>
                <TableHead>質問</TableHead>
                <TableHead className="text-center">閲覧数</TableHead>
                <TableHead className="text-center">表示順</TableHead>
                <TableHead className="text-center">ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    登録されたFAQはありません
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq: any) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <Badge variant="outline">{FAQ_CATEGORY_LABELS[faq.category] ?? faq.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{faq.question}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        {faq.viewCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{faq.sortOrder}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={faq.isActive ? "default" : "secondary"}>
                        {faq.isActive ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(faq)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(faq.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
