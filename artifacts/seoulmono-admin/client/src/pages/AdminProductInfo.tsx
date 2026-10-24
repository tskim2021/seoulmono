import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Sparkles, HelpCircle, BookOpen, Pill, AlertTriangle, FileText, GripVertical, Eye, EyeOff, Loader2 } from "lucide-react";

const SECTION_TYPES = [
  { value: "faq", label: "よくあるご質問 (FAQ)", icon: HelpCircle, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { value: "usage", label: "使用方法", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { value: "dosage", label: "用量・用法", icon: Pill, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { value: "sideEffects", label: "副作用", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { value: "precautions", label: "注意事項", icon: FileText, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
] as const;

type SectionType = typeof SECTION_TYPES[number]["value"];

export default function AdminProductInfo({ productId, productName, productDescription }: { productId: number; productName: string; productDescription?: string }) {
  const utils = trpc.useUtils();
  const { data: sections, isLoading } = trpc.productInfo.adminGetByProduct.useQuery({ productId });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ sectionType: "faq" as SectionType, title: "", content: "", sortOrder: 0 });
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const createMut = trpc.productInfo.create.useMutation({
    onSuccess: () => { utils.productInfo.adminGetByProduct.invalidate({ productId }); utils.productInfo.getByProduct.invalidate({ productId }); setDialogOpen(false); toast.success("情報を登録しました。"); },
    onError: (err) => toast.error(err.message),
  });
  const updateMut = trpc.productInfo.update.useMutation({
    onSuccess: () => { utils.productInfo.adminGetByProduct.invalidate({ productId }); utils.productInfo.getByProduct.invalidate({ productId }); setDialogOpen(false); toast.success("情報を更新しました。"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMut = trpc.productInfo.delete.useMutation({
    onSuccess: () => { utils.productInfo.adminGetByProduct.invalidate({ productId }); utils.productInfo.getByProduct.invalidate({ productId }); toast.success("削除しました。"); },
    onError: (err) => toast.error(err.message),
  });
  const toggleActiveMut = trpc.productInfo.update.useMutation({
    onSuccess: () => { utils.productInfo.adminGetByProduct.invalidate({ productId }); utils.productInfo.getByProduct.invalidate({ productId }); },
  });
  const generateMut = trpc.productInfo.generateDraft.useMutation({
    onSuccess: (result) => {
      setGeneratingType(null);
      if (result.success) {
        utils.productInfo.adminGetByProduct.invalidate({ productId });
        utils.productInfo.getByProduct.invalidate({ productId });
        toast.success(`${result.label} ${result.count}件をAIで生成しました。`);
      } else {
        toast.error(result.error || "AI生成に失敗しました。");
      }
    },
    onError: (err) => { setGeneratingType(null); toast.error(err.message); },
  });

  const openCreate = (type: SectionType) => {
    setEditItem(null);
    setForm({ sectionType: type, title: "", content: "", sortOrder: 0 });
    setDialogOpen(true);
  };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ sectionType: item.sectionType, title: item.title, content: item.content, sortOrder: item.sortOrder });
    setDialogOpen(true);
  };
  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error("タイトルと内容を入力してください。"); return; }
    if (editItem) {
      updateMut.mutate({ id: editItem.id, title: form.title, content: form.content, sortOrder: form.sortOrder });
    } else {
      createMut.mutate({ productId, sectionType: form.sectionType, title: form.title, content: form.content, sortOrder: form.sortOrder });
    }
  };
  const handleDelete = (id: number) => {
    if (confirm("本当に削除しますか？")) deleteMut.mutate({ id });
  };
  const handleToggleActive = (item: any) => {
    toggleActiveMut.mutate({ id: item.id, isActive: item.isActive === 1 ? 0 : 1 });
  };
  const handleGenerate = (type: SectionType) => {
    if (generatingType) return;
    setGeneratingType(type);
    generateMut.mutate({ productId, productName, productDescription, sectionType: type });
  };

  // 섹션 타입별 그룹핑
  const grouped = SECTION_TYPES.map(config => ({
    ...config,
    items: (sections ?? []).filter((s: any) => s.sectionType === config.value),
  }));

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={`admin-info-skeleton-${i}`} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">商品情報管理</h3>
        <p className="text-xs text-muted-foreground">FAQ、使用方法、副作用など商品の詳細情報を管理します</p>
      </div>

      {grouped.map(group => {
        const Icon = group.icon;
        return (
          <div key={group.value} className={`border rounded-lg overflow-hidden`}>
            {/* 섹션 헤더 */}
            <div className={`flex items-center justify-between p-4 ${group.bg}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${group.color}`} />
                <span className={`font-medium text-sm ${group.color}`}>{group.label}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{group.items.length}件</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleGenerate(group.value)}
                  disabled={!!generatingType}
                >
                  {generatingType === group.value ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> AI生成中...</>
                  ) : (
                    <><Sparkles className="w-3 h-3 mr-1" /> AI自動生成</>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openCreate(group.value)}>
                  <Plus className="w-3 h-3 mr-1" /> 追加
                </Button>
              </div>
            </div>

            {/* 항목 리스트 */}
            {group.items.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                登録された項目がありません。直接追加するか、AI自動生成をご利用ください。
              </div>
            ) : (
              <div className="divide-y">
                {group.items.map((item: any) => (
                  <div key={item.id} className={`p-4 flex items-start gap-3 ${item.isActive === 0 ? "opacity-50 bg-muted/30" : ""}`}>
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{item.title}</span>
                        {item.isAutoGenerated === 1 && <Badge variant="secondary" className="text-[9px] px-1 py-0">AI</Badge>}
                        {item.isActive === 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">無効</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{item.content}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleToggleActive(item)} title={item.isActive === 1 ? "無効化" : "有効化"}>
                        {item.isActive === 1 ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "情報の編集" : "情報の追加"}</DialogTitle>
            <DialogDescription>
              {SECTION_TYPES.find(s => s.value === form.sectionType)?.label} の項目を{editItem ? "編集" : "追加"}します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editItem && (
              <div>
                <label className="text-sm font-medium">セクションタイプ</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background mt-1"
                  value={form.sectionType}
                  onChange={e => setForm(f => ({ ...f, sectionType: e.target.value as SectionType }))}
                >
                  {SECTION_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">
                {form.sectionType === "faq" ? "質問" : "タイトル"}
              </label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={form.sectionType === "faq" ? "質問を入力してください" : "タイトルを入力してください"}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {form.sectionType === "faq" ? "回答" : "内容"}
              </label>
              <Textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={form.sectionType === "faq" ? "回答を入力してください" : "内容を入力してください"}
                rows={6}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">表示順</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="mt-1 w-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {editItem ? "更新" : "登録"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
