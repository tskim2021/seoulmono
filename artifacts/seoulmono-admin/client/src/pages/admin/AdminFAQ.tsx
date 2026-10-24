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
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// 쇼핑몰 FAQ 페이지의 카테고리 탭과 똑같이 맞춘 값이다(탭이 이 이름으로 걸러 보여준다). 이름을 바꾸면 고객 화면에서 사라진다.
const FAQ_CATEGORIES = ["회원/정보", "주문/결제", "배송", "취소/교환/반품", "서비스/기타"];

type FormState = { category: string; questionJa: string; answerJa: string; question: string; answer: string; sortOrder: number; isActive: number };
const EMPTY: FormState = { category: "", questionJa: "", answerJa: "", question: "", answer: "", sortOrder: 0, isActive: 1 };

export default function AdminFAQ() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);

  const { data: faqs = [], refetch } = trpc.admin.getFaqs.useQuery({ category: filterCategory });
  const createFaq = trpc.admin.createFaq.useMutation();
  const updateFaq = trpc.admin.updateFaq.useMutation();
  const deleteFaq = trpc.admin.deleteFaq.useMutation();

  const [formData, setFormData] = useState<FormState>(EMPTY);

  const handleOpenDialog = (faq?: any) => {
    if (faq) {
      setSelectedFaq(faq);
      setFormData({
        category: faq.category,
        questionJa: faq.questionJa || "",
        answerJa: faq.answerJa || "",
        // 한국어 칸에는 일본어가 없을 때 대신 들어가 있던 값만 보여준다(같은 글이 두 칸에 중복되어 보이지 않도록)
        question: faq.questionJa && faq.question === faq.questionJa ? "" : faq.question,
        answer: faq.answerJa && faq.answer === faq.answerJa ? "" : faq.answer,
        sortOrder: faq.sortOrder,
        isActive: faq.isActive,
      });
    } else {
      setSelectedFaq(null);
      setFormData(EMPTY);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.category) { toast.error("카테고리를 선택하세요."); return; }
    const hasJa = formData.questionJa.trim() && formData.answerJa.trim();
    if (!formData.questionJa.trim() && !formData.question.trim()) { toast.error("질문을 입력하세요."); return; }
    if (formData.isActive === 1 && !hasJa) {
      toast.error("공개하려면 일본어 질문과 답변이 모두 필요합니다. 아직 번역이 없으면 '비공개'로 저장하세요.");
      return;
    }
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
    } catch (error: any) {
      toast.error(error?.message || "오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 고객 화면에서도 사라집니다.")) return;
    try {
      await deleteFaq.mutateAsync({ id });
      toast.success("FAQを削除しました。");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "오류가 발생했습니다.");
    }
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FAQ 관리</CardTitle>
              <CardDescription>
                이 목록이 쇼핑몰의 「자주 묻는 질문」 페이지에 그대로 나옵니다. 고객은 <strong>일본어</strong> 내용만 봅니다(한국어는 관리용).{" "}
                <a href="https://seoulmono.com/faq" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  고객 화면 보기 <ExternalLink className="w-3 h-3" />
                </a>
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  FAQ 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
                    <p className="text-xs font-semibold text-primary">고객 화면에 보이는 내용 (일본어)</p>
                    <div>
                      <label className="text-sm font-medium">질문 (일본어)</label>
                      <Input
                        value={formData.questionJa}
                        onChange={(e) => setFormData({ ...formData, questionJa: e.target.value })}
                        placeholder="例：配送にはどのくらいかかりますか？"
                        maxLength={500}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">답변 (일본어)</label>
                      <Textarea
                        value={formData.answerJa}
                        onChange={(e) => setFormData({ ...formData, answerJa: e.target.value })}
                        placeholder="回答を入力してください（改行できます）"
                        rows={6}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">관리용 (한국어, 선택) — 고객에게는 보이지 않습니다</p>
                    <div>
                      <label className="text-sm font-medium">질문 (한국어)</label>
                      <Input
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        placeholder="한국어 질문 (번역 전 초안으로도 쓸 수 있습니다)"
                        maxLength={500}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">답변 (한국어)</label>
                      <Textarea
                        value={formData.answer}
                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        placeholder="한국어 답변"
                        rows={4}
                      />
                    </div>
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
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>カテゴリー</TableHead>
                <TableHead>질문 (고객 화면 기준)</TableHead>
                <TableHead className="text-center">並び替え</TableHead>
                <TableHead className="text-center">ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    등록된 FAQ가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq: any) => {
                  const missingJa = !faq.questionJa || !faq.answerJa;
                  return (
                    <TableRow key={faq.id}>
                      <TableCell>
                        <Badge variant="outline">{faq.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate">{faq.questionJa || faq.question}</div>
                        {faq.questionJa && faq.question && faq.question !== faq.questionJa && (
                          <div className="truncate text-xs text-muted-foreground">{faq.question}</div>
                        )}
                        {missingJa && (
                          <div className="text-xs text-red-600 mt-0.5">
                            일본어 내용이 없습니다{faq.isActive ? " — 고객 화면에 한국어가 그대로 보입니다. 일본어를 채우거나 비공개로 바꾸세요." : ""}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{faq.sortOrder}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={faq.isActive ? "default" : "secondary"}>
                          {faq.isActive ? "공개" : "비공개"}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
