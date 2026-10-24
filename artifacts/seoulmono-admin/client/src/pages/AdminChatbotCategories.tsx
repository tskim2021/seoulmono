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
        toast.success("カテゴリーを更新しました。");
      } else {
        await createMutation.mutateAsync({
          ...formData,
          icon: formData.icon || undefined,
          description: formData.description || undefined,
        });
        toast.success("カテゴリーを追加しました。");
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("操作に失敗しました。");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("このカテゴリーを削除しますか？")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("カテゴリーを削除しました。");
      refetch();
    } catch (error) {
      toast.error("削除に失敗しました。");
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
            カテゴリー管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            チャットボットの会話フローのカテゴリーを管理します。最大2階層まで対応しています。
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          カテゴリーを追加
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>カテゴリー一覧</CardTitle>
          <CardDescription>
            親カテゴリーと子カテゴリーを管理できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizedCategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderTree className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>登録されたカテゴリーがありません。</p>
              <p className="text-sm mt-1">カテゴリーを追加して、チャットボットの会話フローを構成してください。</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>カテゴリー名</TableHead>
                  <TableHead>アイコン</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead className="text-center">表示順</TableHead>
                  <TableHead className="text-center">ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
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
                          {category.isActive ? "有効" : "無効"}
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
                            {child.isActive ? "有効" : "無効"}
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
            <DialogTitle>{editingCategory ? "カテゴリーの編集" : "カテゴリーの追加"}</DialogTitle>
            <DialogDescription>
              チャットボットの会話フローで使用するカテゴリーを{editingCategory ? "編集" : "追加"}します。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">カテゴリー名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: 商品のお問い合わせ、配送のお問い合わせ"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">アイコン (任意)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="例: 📦, 🚚, 💰"
              />
              <p className="text-xs text-muted-foreground">
                絵文字またはアイコン名を入力してください。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明 (任意)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="このカテゴリーの簡単な説明"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">親カテゴリー (任意)</Label>
              <select
                id="parentId"
                value={formData.parentId || ""}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">なし (最上位カテゴリー)</option>
                {categories
                  ?.filter((c) => !c.parentId && c.id !== editingCategory?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground">
                子カテゴリーにする場合は、親カテゴリーを選択してください。
              </p>
            </div>

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
                  editingCategory ? "更新" : "追加"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
