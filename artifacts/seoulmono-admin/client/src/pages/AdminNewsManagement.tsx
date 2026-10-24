import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Newspaper, Plus, Pencil, Trash2, Eye, Search, Loader2, Zap, Globe, FlaskConical } from "lucide-react";
import Paginator from "@/components/Paginator";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const SECTION_LABELS: Record<string, string> = {
  domestic: "国内ニュース",
  international: "海外ニュース",
  research: "研究・論文",
};

const SECTION_COLORS: Record<string, string> = {
  domestic: "bg-blue-100 text-blue-700",
  international: "bg-emerald-100 text-emerald-700",
  research: "bg-purple-100 text-purple-700",
};

export default function AdminNewsManagement() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSection, setFormSection] = useState<string>("domestic");
  const [formSourceUrl, setFormSourceUrl] = useState("");

  const { data: categoriesData } = trpc.category.list.useQuery();
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  const { data, isLoading, refetch } = trpc.news.list.useQuery({
    categoryId: selectedCategory !== "all" ? Number(selectedCategory) : undefined,
    newsSection: selectedSection !== "all" ? selectedSection : undefined,
    page,
    limit: 20,
    search: searchQuery || undefined,
  });

  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => {
      toast.success("ニュースを登録しました。");
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => {
      toast.success("ニュースを更新しました。");
      setShowEditDialog(false);
      setEditingNews(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => {
      toast.success("ニュースを削除しました。");
      setShowDeleteConfirm(false);
      setDeletingId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateMutation = trpc.news.generateNow.useMutation({
    onSuccess: (result) => {
      toast.success(`ニュース${result.generated}件を生成しました。`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormCategory("");
    setFormSection("domestic");
    setFormSourceUrl("");
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formContent.trim() || !formCategory) {
      toast.error("必須項目をすべて入力してください。");
      return;
    }
    createMutation.mutate({
      title: formTitle,
      content: formContent,
      categoryId: Number(formCategory),
      newsSection: formSection as "domestic" | "international" | "research",
      sourceUrl: formSourceUrl || undefined,
    });
  };

  const handleEdit = (news: any) => {
    setEditingNews(news);
    setFormTitle(news.title);
    setFormContent(news.content);
    setFormCategory(String(news.categoryId));
    setFormSection(news.newsSection || "domestic");
    setFormSourceUrl(news.sourceUrl || "");
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!editingNews) return;
    updateMutation.mutate({
      id: editingNews.id,
      title: formTitle,
      content: formContent,
      categoryId: Number(formCategory),
      newsSection: formSection,
      sourceUrl: formSourceUrl || undefined,
    });
  };

  const handleToggleHidden = (news: any) => {
    updateMutation.mutate({
      id: news.id,
      isHidden: news.isHidden === 1 ? 0 : 1,
    });
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);
  const formatDate = (d: string | Date) => new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">ニュース管理</h1>
            <p className="text-sm text-muted-foreground">健康ニュースの記事を管理します。</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (!selectedCategory || selectedCategory === "all") {
              toast.error("カテゴリーを選択してください。");
              return;
            }
            generateMutation.mutate({ categoryId: Number(selectedCategory) });
          }} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
            AIニュース生成
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="w-4 h-4 mr-1" /> ニュース作成
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="カテゴリー" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのカテゴリー</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSection} onValueChange={(v) => { setSelectedSection(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="セクション" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのセクション</SelectItem>
            <SelectItem value="domestic">国内ニュース</SelectItem>
            <SelectItem value="international">海外ニュース</SelectItem>
            <SelectItem value="research">研究・論文</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="タイトルを検索..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* 뉴스 목록 테이블 */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">セクション</th>
              <th className="text-left px-4 py-3 font-medium">カテゴリー</th>
              <th className="text-left px-4 py-3 font-medium">タイトル</th>
              <th className="text-left px-4 py-3 font-medium">閲覧</th>
              <th className="text-left px-4 py-3 font-medium">作成日</th>
              <th className="text-left px-4 py-3 font-medium">タイプ</th>
              <th className="text-right px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">読み込み中...</td></tr>
            ) : data?.posts && data.posts.length > 0 ? (
              data.posts.map((news: any) => (
                <tr key={news.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{news.id}</td>
                  <td className="px-4 py-3">
                    {news.newsSection && (
                      <Badge variant="secondary" className={`text-xs ${SECTION_COLORS[news.newsSection] || ""}`}>
                        {SECTION_LABELS[news.newsSection] || news.newsSection}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {categories.find((c: any) => c.id === news.categoryId)?.name || "-"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate font-medium">{news.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{news.viewCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(news.createdAt)}</td>
                  <td className="px-4 py-3">
                    {news.isAutoGenerated === 1 ? (
                      <Badge variant="outline" className="text-xs text-blue-600">AI</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">手動</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(`/news/${news.id}`, "_blank")}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(news)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => { setDeletingId(news.id); setShowDeleteConfirm(true); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">登録されたニュースはありません。</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />

      {/* 뉴스 작성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ニュース作成</DialogTitle>
            <DialogDescription>新しい健康ニュースを作成します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">カテゴリー *</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="カテゴリーを選択" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ニュースセクション *</label>
                <Select value={formSection} onValueChange={setFormSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestic">国内ニュース</SelectItem>
                    <SelectItem value="international">海外ニュース</SelectItem>
                    <SelectItem value="research">研究・論文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">タイトル *</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="ニュースのタイトル" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">本文 * (Markdown対応)</label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="ニュース本文を入力してください..." rows={12} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">出典URL (任意)</label>
              <Input value={formSourceUrl} onChange={(e) => setFormSourceUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>キャンセル</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              登録
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 뉴스 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ニュース編集</DialogTitle>
            <DialogDescription>ニュースの内容を編集します。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">カテゴリー</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="カテゴリーを選択" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ニュースセクション</label>
                <Select value={formSection} onValueChange={setFormSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestic">国内ニュース</SelectItem>
                    <SelectItem value="international">海外ニュース</SelectItem>
                    <SelectItem value="research">研究・論文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">タイトル</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">本文 (Markdown対応)</label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={12} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">出典URL</label>
              <Input value={formSourceUrl} onChange={(e) => setFormSourceUrl(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>キャンセル</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ニュース削除</DialogTitle>
            <DialogDescription>このニュースを削除しますか？削除したニュースは復元できません。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
