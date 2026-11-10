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
  domestic: "국내 뉴스",
  international: "해외 뉴스",
  research: "연구/논문",
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
      toast.success("뉴스가 등록되었습니다.");
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => {
      toast.success("뉴스가 수정되었습니다.");
      setShowEditDialog(false);
      setEditingNews(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => {
      toast.success("뉴스가 삭제되었습니다.");
      setShowDeleteConfirm(false);
      setDeletingId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateMutation = trpc.news.generateNow.useMutation({
    onSuccess: (result) => {
      toast.success(`뉴스 ${result.generated}건이 생성되었습니다.`);
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
      toast.error("필수 항목을 모두 입력해주세요.");
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
            <h1 className="text-2xl font-bold">뉴스 관리</h1>
            <p className="text-sm text-muted-foreground">건강뉴스 게시글을 관리합니다.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (!selectedCategory || selectedCategory === "all") {
              toast.error("카테고리를 선택해주세요.");
              return;
            }
            generateMutation.mutate({ categoryId: Number(selectedCategory) });
          }} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
            AI 뉴스 생성
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="w-4 h-4 mr-1" /> 뉴스 작성
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSection} onValueChange={(v) => { setSelectedSection(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="섹션" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 섹션</SelectItem>
            <SelectItem value="domestic">국내 뉴스</SelectItem>
            <SelectItem value="international">해외 뉴스</SelectItem>
            <SelectItem value="research">연구/논문</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="제목 검색..."
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
              <th className="text-left px-4 py-3 font-medium">섹션</th>
              <th className="text-left px-4 py-3 font-medium">카테고리</th>
              <th className="text-left px-4 py-3 font-medium">제목</th>
              <th className="text-left px-4 py-3 font-medium">조회</th>
              <th className="text-left px-4 py-3 font-medium">작성일</th>
              <th className="text-left px-4 py-3 font-medium">타입</th>
              <th className="text-right px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">로딩 중...</td></tr>
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
                      <Badge variant="outline" className="text-xs">수동</Badge>
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
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">등록된 뉴스가 없습니다.</td></tr>
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
            <DialogTitle>뉴스 작성</DialogTitle>
            <DialogDescription>새로운 건강뉴스를 작성합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">카테고리 *</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">뉴스 섹션 *</label>
                <Select value={formSection} onValueChange={setFormSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestic">국내 뉴스</SelectItem>
                    <SelectItem value="international">해외 뉴스</SelectItem>
                    <SelectItem value="research">연구/논문</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">제목 *</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="뉴스 제목" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">본문 * (마크다운 지원)</label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="뉴스 본문을 작성하세요..." rows={12} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">출처 URL (선택)</label>
              <Input value={formSourceUrl} onChange={(e) => setFormSourceUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>취소</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 뉴스 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>뉴스 수정</DialogTitle>
            <DialogDescription>뉴스 내용을 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">카테고리</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">뉴스 섹션</label>
                <Select value={formSection} onValueChange={setFormSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestic">국내 뉴스</SelectItem>
                    <SelectItem value="international">해외 뉴스</SelectItem>
                    <SelectItem value="research">연구/논문</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">제목</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">본문 (마크다운 지원)</label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={12} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">출처 URL</label>
              <Input value={formSourceUrl} onChange={(e) => setFormSourceUrl(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>취소</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>뉴스 삭제</DialogTitle>
            <DialogDescription>이 뉴스를 삭제하시겠습니까? 삭제된 뉴스는 복구할 수 없습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>취소</Button>
            <Button variant="destructive" onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
