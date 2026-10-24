import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Play, Loader2, Clock, FileText, CheckCircle2,
  XCircle, AlertCircle, Bot, Settings2, History, Zap, ArrowLeft, ImageIcon
} from "lucide-react";
import { Link } from "wouter";

const STYLE_OPTIONS = [
  { value: "informative", label: "정보 전달형", desc: "핵심 정보를 체계적으로 정리" },
  { value: "guide", label: "가이드/안내형", desc: "단계별 안내와 설명" },
  { value: "tips", label: "팁/노하우형", desc: "실용적인 팁과 노하우" },
  { value: "comparison", label: "비교/분석형", desc: "객관적 비교와 분석" },
  { value: "news", label: "뉴스/트렌드형", desc: "최신 트렌드와 동향" },
];

function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AdminInfoBoardAuto() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    topic: "",
    categoryId: null as number | null,
    generateTime: "09:00",
    keywords: "",
    keywordsEn: "",
    promptTemplate: "",
    postStyle: "informative" as "informative" | "guide" | "tips" | "comparison" | "news",
    autoPublish: 1,
    autoGenerateImage: 0,
    isEnabled: 1,
  });
  const [logSettingFilter, setLogSettingFilter] = useState<number | undefined>(undefined);
  const [logPage, setLogPage] = useState(1);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: settingsData, isLoading } = trpc.infoBoardAuto.getSettings.useQuery();
  const { data: categories } = trpc.category.list.useQuery();
  const { data: logsData } = trpc.infoBoardAuto.getLogs.useQuery({ settingId: logSettingFilter, page: logPage, limit: 15 });

  const createMutation = trpc.infoBoardAuto.createSetting.useMutation({
    onSuccess: () => {
      toast.success("설정이 생성되었습니다");
      utils.infoBoardAuto.getSettings.invalidate();
      setShowDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.infoBoardAuto.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("설정이 수정되었습니다");
      utils.infoBoardAuto.getSettings.invalidate();
      setShowDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.infoBoardAuto.deleteSetting.useMutation({
    onSuccess: () => {
      toast.success("설정이 삭제되었습니다");
      utils.infoBoardAuto.getSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateNowMutation = trpc.infoBoardAuto.generateNow.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`글이 생성되었습니다: "${result.title}"`);
      } else {
        toast.error(`생성 실패: ${result.error}`);
      }
      utils.infoBoardAuto.getLogs.invalidate();
      setGeneratingId(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setGeneratingId(null);
    },
  });

  function resetForm() {
    setEditingId(null);
    setForm({
      topic: "", categoryId: null, generateTime: "09:00",
      keywords: "", keywordsEn: "", promptTemplate: "",
      postStyle: "informative", autoPublish: 1, autoGenerateImage: 0, isEnabled: 1,
    });
  }

  function openCreate() {
    resetForm();
    setShowDialog(true);
  }

  function openEdit(setting: any) {
    setEditingId(setting.id);
    setForm({
      topic: setting.topic,
      categoryId: setting.categoryId,
      generateTime: setting.generateTime,
      keywords: setting.keywords || "",
      keywordsEn: setting.keywordsEn || "",
      promptTemplate: setting.promptTemplate || "",
      postStyle: setting.postStyle as "informative" | "guide" | "tips" | "comparison" | "news",
      autoPublish: setting.autoPublish,
      autoGenerateImage: setting.autoGenerateImage ?? 0,
      isEnabled: setting.isEnabled,
    });
    setShowDialog(true);
  }

  function handleSave() {
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form, keywords: form.keywords || null, keywordsEn: form.keywordsEn || null, promptTemplate: form.promptTemplate || null });
    } else {
      createMutation.mutate(form);
    }
  }

  function handleDelete(id: number) {
    if (confirm("정말 삭제하시겠습니까?")) {
      deleteMutation.mutate({ id });
    }
  }

  function handleGenerateNow(settingId: number) {
    setGeneratingId(settingId);
    generateNowMutation.mutate({ settingId });
  }

  const getCategoryName = (catId: number | null) => {
    if (!catId || !categories) return "전체";
    const cat = categories.find((c: any) => c.id === catId);
    return cat?.name || "알 수 없음";
  };

  const settings = settingsData?.settings ?? [];
  const schedulerStatus = settingsData?.schedulerStatus;
  const logs = logsData?.logs ?? [];
  const logsTotal = logsData?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6" />
            정보나눔 AI 자동글 설정
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI가 매일 지정된 시간에 정보나눔 게시판에 자동으로 유익한 글을 작성합니다.
            주제, 키워드, 작성 스타일을 설정하여 원하는 콘텐츠를 자동 생성하세요.
          </p>
        </div>
      </div>

      {/* 스케줄러 상태 */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">스케줄러 상태</p>
              <p className="text-sm text-muted-foreground">
                {schedulerStatus?.isActive
                  ? `활성 (매일 ${schedulerStatus.scheduleTime} KST 실행)`
                  : "비활성 - 활성화된 설정이 없습니다"}
              </p>
            </div>
          </div>
          <Badge variant={schedulerStatus?.isActive ? "default" : "secondary"}>
            {schedulerStatus?.isActive ? "실행 중" : "중지"}
          </Badge>
        </div>
      </div>

      {/* 설정 목록 */}
      <div className="bg-card border rounded-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            자동글 설정 목록
          </h2>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> 설정 추가
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>등록된 자동글 설정이 없습니다.</p>
            <p className="text-sm mt-1">"설정 추가" 버튼을 눌러 첫 설정을 만들어보세요.</p>
          </div>
        ) : (
          <div className="divide-y">
            {settings.map((s: any) => (
              <div key={s.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={s.isEnabled ? "default" : "secondary"} className="text-[10px]">
                        {s.isEnabled ? "활성" : "비활성"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {STYLE_OPTIONS.find(o => o.value === s.postStyle)?.label || s.postStyle}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.generateTime} KST
                      </span>
                    </div>
                    <h3 className="font-medium truncate">{s.topic}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>카테고리: {getCategoryName(s.categoryId)}</span>
                      {s.keywords && <span>키워드: {s.keywords.split(",").slice(0, 3).join(", ")}{s.keywords.split(",").length > 3 ? "..." : ""}</span>}
                      {s.autoGenerateImage ? <span className="flex items-center gap-0.5"><ImageIcon className="w-3 h-3" /> 이미지 자동생성</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateNow(s.id)}
                      disabled={generatingId === s.id}
                      title="즉시 글 생성"
                    >
                      {generatingId === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span className="ml-1 hidden sm:inline">실행</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 실행 로그 */}
      <div className="bg-card border rounded-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <History className="w-4 h-4" />
            실행 로그
          </h2>
          <div className="flex items-center gap-2">
            <Select value={logSettingFilter?.toString() || "all"} onValueChange={(v) => { setLogSettingFilter(v === "all" ? undefined : Number(v)); setLogPage(1); }}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="전체 설정" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 설정</SelectItem>
                {settings.map((s: any) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            실행 로그가 없습니다.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2 px-4 font-medium">상태</th>
                    <th className="text-left py-2 px-4 font-medium">생성된 제목</th>
                    <th className="text-left py-2 px-4 font-medium">실행 방식</th>
                    <th className="text-left py-2 px-4 font-medium">소요 시간</th>
                    <th className="text-left py-2 px-4 font-medium">실행 시각</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="py-2 px-4">
                        {log.status === "success" ? (
                          <Badge variant="default" className="text-[10px] bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />성공</Badge>
                        ) : log.status === "failed" ? (
                          <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />실패</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]"><AlertCircle className="w-3 h-3 mr-1" />건너뜀</Badge>
                        )}
                      </td>
                      <td className="py-2 px-4 max-w-[300px] truncate">
                        {log.generatedTitle || (log.errorMessage ? <span className="text-destructive text-xs">{log.errorMessage}</span> : "-")}
                      </td>
                      <td className="py-2 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {log.triggeredBy === "manual" ? <><Zap className="w-3 h-3 mr-1" />수동</> : <><Clock className="w-3 h-3 mr-1" />자동</>}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-muted-foreground text-xs">
                        {log.executionTimeMs ? `${(log.executionTimeMs / 1000).toFixed(1)}초` : "-"}
                      </td>
                      <td className="py-2 px-4 text-muted-foreground text-xs">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logsTotal > 15 && (
              <div className="flex items-center justify-center gap-2 p-3 border-t">
                <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage(p => p - 1)}>이전</Button>
                <span className="text-xs text-muted-foreground">{logPage} / {Math.ceil(logsTotal / 15)}</span>
                <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(logsTotal / 15)} onClick={() => setLogPage(p => p + 1)}>다음</Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 설정 생성/수정 다이얼로그 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "설정 수정" : "새 자동글 설정"}</DialogTitle>
            <DialogDescription>
              AI가 자동으로 작성할 정보나눔 글의 주제와 스타일을 설정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 활성화 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">활성화</label>
              <Button
                variant={form.isEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setForm(f => ({ ...f, isEnabled: f.isEnabled ? 0 : 1 }))}
              >
                {form.isEnabled ? "활성" : "비활성"}
              </Button>
            </div>

            <Separator />

            {/* 주제 */}
            <div>
              <label className="text-sm font-medium block mb-1">주제 *</label>
              <Input
                value={form.topic}
                onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="예: 건강식품 정보, 영양제 가이드, 운동과 건강"
              />
              <p className="text-xs text-muted-foreground mt-1">AI가 이 주제에 맞는 글을 작성합니다.</p>
            </div>

            {/* 카테고리 */}
            <div>
              <label className="text-sm font-medium block mb-1">상품 카테고리</label>
              <Select
                value={form.categoryId?.toString() || "none"}
                onValueChange={(v) => setForm(f => ({ ...f, categoryId: v === "none" ? null : Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">전체 (카테고리 없음)</SelectItem>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">글이 게시될 때 연결할 상품 카테고리입니다.</p>
            </div>

            {/* 생성 시간 */}
            <div>
              <label className="text-sm font-medium block mb-1">생성 시간 (KST)</label>
              <Input
                type="time"
                value={form.generateTime}
                onChange={(e) => setForm(f => ({ ...f, generateTime: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">매일 이 시간에 자동으로 글이 생성됩니다. (한국 시간 기준)</p>
            </div>

            {/* 작성 스타일 */}
            <div>
              <label className="text-sm font-medium block mb-1">작성 스타일</label>
              <Select value={form.postStyle} onValueChange={(v) => setForm(f => ({ ...f, postStyle: v as typeof f.postStyle }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">- {opt.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* 키워드 */}
            <div>
              <label className="text-sm font-medium block mb-1">키워드 (한국어)</label>
              <Input
                value={form.keywords}
                onChange={(e) => setForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder="예: 비타민, 오메가3, 프로바이오틱스"
              />
              <p className="text-xs text-muted-foreground mt-1">쉼표로 구분. AI가 이 키워드를 참고하여 글을 작성합니다.</p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">키워드 (영어)</label>
              <Input
                value={form.keywordsEn}
                onChange={(e) => setForm(f => ({ ...f, keywordsEn: e.target.value }))}
                placeholder="예: vitamin, omega-3, probiotics"
              />
              <p className="text-xs text-muted-foreground mt-1">영어 키워드 (선택사항). 해외 자료 참고 시 사용됩니다.</p>
            </div>

            <Separator />

            {/* 커스텀 프롬프트 */}
            <div>
              <label className="text-sm font-medium block mb-1">커스텀 프롬프트 (선택사항)</label>
              <Textarea
                value={form.promptTemplate}
                onChange={(e) => setForm(f => ({ ...f, promptTemplate: e.target.value }))}
                placeholder="AI에게 전달할 커스텀 지시사항을 입력하세요. 비워두면 기본 프롬프트가 사용됩니다."
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                AI의 역할, 어조, 특별한 요구사항 등을 지정할 수 있습니다.
                비워두면 건강/의약품 전문 콘텐츠 작성자 기본 프롬프트가 사용됩니다.
              </p>
            </div>

            {/* 이미지 자동 생성 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  이미지 자동 생성
                </label>
                <p className="text-xs text-muted-foreground">AI가 글 내용에 어울리는 대표 이미지를 자동으로 생성하여 첨부합니다.</p>
              </div>
              <Button
                variant={form.autoGenerateImage ? "default" : "outline"}
                size="sm"
                onClick={() => setForm(f => ({ ...f, autoGenerateImage: f.autoGenerateImage ? 0 : 1 }))}
              >
                {form.autoGenerateImage ? "사용" : "미사용"}
              </Button>
            </div>

            {/* 자동 게시 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">자동 게시</label>
                <p className="text-xs text-muted-foreground">생성된 글을 바로 게시판에 공개합니다.</p>
              </div>
              <Button
                variant={form.autoPublish ? "default" : "outline"}
                size="sm"
                onClick={() => setForm(f => ({ ...f, autoPublish: f.autoPublish ? 0 : 1 }))}
              >
                {form.autoPublish ? "자동 게시" : "수동 게시"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>취소</Button>
            <Button
              onClick={handleSave}
              disabled={!form.topic || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editingId ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
