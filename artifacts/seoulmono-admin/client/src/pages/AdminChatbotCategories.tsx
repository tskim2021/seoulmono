import React, { useState } from "react";
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
import { Loader2, Plus, Pencil, Trash2, FolderTree, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Category = {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
  sortOrder: number;
  isActive: number;
  parentId: number | null;
  createdAt: Date;
};

export default function AdminChatbotCategories() {
  const { data: categories, isLoading, refetch } = trpc.chatbotAdmin.getAllCategories.useQuery();
  const createMutation = trpc.chatbotAdmin.createCategory.useMutation();
  const updateMutation = trpc.chatbotAdmin.updateCategory.useMutation();
  const deleteMutation = trpc.chatbotAdmin.deleteCategory.useMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: "",
    sortOrder: 0,
    isActive: 1,
    parentId: null as number | null,
  });

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        icon: category.icon || "",
        description: category.description || "",
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        parentId: category.parentId,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        icon: "",
        description: "",
        sortOrder: 0,
        isActive: 1,
        parentId: null,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          ...formData,
          icon: formData.icon || undefined,
          description: formData.description || undefined,
        });
        toast.success("카테고리가 수정되었습니다.");
      } else {
        await createMutation.mutateAsync({
          ...formData,
          icon: formData.icon || undefined,
          description: formData.description || undefined,
        });
        toast.success("카테고리가 추가되었습니다.");
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("작업에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("카테고리가 삭제되었습니다.");
      refetch();
    } catch (error) {
      toast.error("삭제에 실패했습니다.");
    }
  };

  // 카테고리를 트리 구조로 정렬
  const organizedCategories = categories
    ? categories.reduce((acc, cat) => {
        if (!cat.parentId) {
          acc.push({
            ...cat,
            children: categories.filter((c) => c.parentId === cat.id).sort((a, b) => a.sortOrder - b.sortOrder),
          });
        }
        return acc;
      }, [] as (Category & { children: Category[] })[]).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  if (isLoading) {
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
            <FolderTree className="w-6 h-6" />
            카테고리 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            챗봇 대화 흐름의 카테고리를 관리합니다. 최대 2단계 구조를 지원합니다.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          카테고리 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>카테고리 목록</CardTitle>
          <CardDescription>
            상위 카테고리와 하위 카테고리를 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizedCategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderTree className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>등록된 카테고리가 없습니다.</p>
              <p className="text-sm mt-1">카테고리를 추가하여 챗봇 대화 흐름을 구성하세요.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>카테고리명</TableHead>
                  <TableHead>아이콘</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead className="text-center">정렬순서</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizedCategories.map((category) => (
                  <React.Fragment key={category.id}>
                    <TableRow>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.icon || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{category.description || "-"}</TableCell>
                      <TableCell className="text-center">{category.sortOrder}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(category)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {category.children.map((child) => (
                      <TableRow key={child.id} className="bg-muted/30">
                        <TableCell className="font-medium pl-8">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            {child.name}
                          </div>
                        </TableCell>
                        <TableCell>{child.icon || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">{child.description || "-"}</TableCell>
                        <TableCell className="text-center">{child.sortOrder}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={child.isActive ? "default" : "secondary"}>
                            {child.isActive ? "활성" : "비활성"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(child)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(child.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "카테고리 수정" : "카테고리 추가"}</DialogTitle>
            <DialogDescription>
              챗봇 대화 흐름에 사용될 카테고리를 {editingCategory ? "수정" : "추가"}합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">카테고리명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 상품 문의, 배송 문의"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">아이콘 (선택)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="예: 📦, 🚚, 💰"
              />
              <p className="text-xs text-muted-foreground">
                이모지 또는 아이콘 이름을 입력하세요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="이 카테고리에 대한 간단한 설명"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">상위 카테고리 (선택)</Label>
              <select
                id="parentId"
                value={formData.parentId || ""}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">없음 (최상위 카테고리)</option>
                {categories
                  ?.filter((c) => !c.parentId && c.id !== editingCategory?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground">
                하위 카테고리로 만들려면 상위 카테고리를 선택하세요.
              </p>
            </div>

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
                  editingCategory ? "수정" : "추가"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
