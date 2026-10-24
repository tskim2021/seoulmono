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
        toast.success("FAQ가 수정되었습니다.");
      } else {
        await createFaq.mutateAsync(formData);
        toast.success("FAQ가 추가되었습니다.");
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("오류가 발생했습니다.");
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    try {
      await deleteFaq.mutateAsync({ id });
      toast.success("FAQ가 삭제되었습니다.");
      refetch();
    } catch (error) {
      toast.error("오류가 발생했습니다.");
    }
  };
  
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FAQ 관리</CardTitle>
              <CardDescription>자주 묻는 질문을 관리합니다</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  FAQ 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedFaq ? "FAQ 수정" : "FAQ 추가"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">카테고리</label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {FAQ_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">질문</label>
                    <Input
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="질문을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">답변</label>
                    <Textarea
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="답변을 입력하세요"
                      rows={6}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">정렬 순서</label>
                      <Input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">활성화</label>
                      <Select value={formData.isActive.toString()} onValueChange={(value) => setFormData({ ...formData, isActive: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">활성</SelectItem>
                          <SelectItem value="0">비활성</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
                    <Button onClick={handleSubmit}>저장</Button>
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
                <SelectValue placeholder="전체 카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {FAQ_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>질문</TableHead>
                <TableHead className="text-center">조회수</TableHead>
                <TableHead className="text-center">정렬</TableHead>
                <TableHead className="text-center">상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    등록된 FAQ가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq: any) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <Badge variant="outline">{faq.category}</Badge>
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
                        {faq.isActive ? "활성" : "비활성"}
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
