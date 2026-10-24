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
  { value: "informative", label: "情報提供型", desc: "要点を体系的に整理" },
  { value: "guide", label: "ガイド・案内型", desc: "ステップごとの案内と説明" },
  { value: "tips", label: "ヒント・ノウハウ型", desc: "実用的なヒントとノウハウ" },
  { value: "comparison", label: "比較・分析型", desc: "客観的な比較と分析" },
  { value: "news", label: "ニュース・トレンド型", desc: "最新のトレンドと動向" },
];

function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
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
      toast.success("設定を作成しました");
      utils.infoBoardAuto.getSettings.invalidate();
      setShowDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.infoBoardAuto.updateSetting.useMutation({
    onSuccess: () => {
      toast.success("設定を更新しました");
      utils.infoBoardAuto.getSettings.invalidate();
      setShowDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.infoBoardAuto.deleteSetting.useMutation({
    onSuccess: () => {
      toast.success("設定を削除しました");
      utils.infoBoardAuto.getSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateNowMutation = trpc.infoBoardAuto.generateNow.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`記事を生成しました: "${result.title}"`);
      } else {
        toast.error(`生成に失敗しました: ${result.error}`);
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
    if (confirm("本当に削除しますか？")) {
      deleteMutation.mutate({ id });
    }
  }

  function handleGenerateNow(settingId: number) {
    setGeneratingId(settingId);
    generateNowMutation.mutate({ settingId });
  }

  const getCategoryName = (catId: number | null) => {
    if (!catId || !categories) return "すべて";
    const cat = categories.find((c: any) => c.id === catId);
    return cat?.name || "不明";
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
            情報共有 AI自動投稿設定
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AIが毎日指定された時刻に、情報共有掲示板へ有益な記事を自動で投稿します。
            テーマ、キーワード、執筆スタイルを設定して、希望するコンテンツを自動生成しましょう。
          </p>
        </div>
      </div>

      {/* 스케줄러 상태 */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">スケジューラーの状態</p>
              <p className="text-sm text-muted-foreground">
                {schedulerStatus?.isActive
                  ? `有効 (毎日 ${schedulerStatus.scheduleTime} KST に実行)`
                  : "無効 - 有効な設定がありません"}
              </p>
            </div>
          </div>
          <Badge variant={schedulerStatus?.isActive ? "default" : "secondary"}>
            {schedulerStatus?.isActive ? "実行中" : "停止"}
          </Badge>
        </div>
      </div>

      {/* 설정 목록 */}
      <div className="bg-card border rounded-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            自動投稿設定一覧
          </h2>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> 設定を追加
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>登録された自動投稿設定がありません。</p>
            <p className="text-sm mt-1">「設定を追加」ボタンを押して最初の設定を作成してください。</p>
          </div>
        ) : (
          <div className="divide-y">
            {settings.map((s: any) => (
              <div key={s.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={s.isEnabled ? "default" : "secondary"} className="text-[10px]">
                        {s.isEnabled ? "有効" : "無効"}
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
                      <span>カテゴリー: {getCategoryName(s.categoryId)}</span>
                      {s.keywords && <span>キーワード: {s.keywords.split(",").slice(0, 3).join(", ")}{s.keywords.split(",").length > 3 ? "..." : ""}</span>}
                      {s.autoGenerateImage ? <span className="flex items-center gap-0.5"><ImageIcon className="w-3 h-3" /> 画像自動生成</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateNow(s.id)}
                      disabled={generatingId === s.id}
                      title="今すぐ記事を生成"
                    >
                      {generatingId === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span className="ml-1 hidden sm:inline">実行</span>
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
            実行ログ
          </h2>
          <div className="flex items-center gap-2">
            <Select value={logSettingFilter?.toString() || "all"} onValueChange={(v) => { setLogSettingFilter(v === "all" ? undefined : Number(v)); setLogPage(1); }}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="すべての設定" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての設定</SelectItem>
                {settings.map((s: any) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            実行ログがありません。
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2 px-4 font-medium">ステータス</th>
                    <th className="text-left py-2 px-4 font-medium">生成されたタイトル</th>
                    <th className="text-left py-2 px-4 font-medium">実行方式</th>
                    <th className="text-left py-2 px-4 font-medium">所要時間</th>
                    <th className="text-left py-2 px-4 font-medium">実行日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="py-2 px-4">
                        {log.status === "success" ? (
                          <Badge variant="default" className="text-[10px] bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />成功</Badge>
                        ) : log.status === "failed" ? (
                          <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />失敗</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]"><AlertCircle className="w-3 h-3 mr-1" />スキップ</Badge>
                        )}
                      </td>
                      <td className="py-2 px-4 max-w-[300px] truncate">
                        {log.generatedTitle || (log.errorMessage ? <span className="text-destructive text-xs">{log.errorMessage}</span> : "-")}
                      </td>
                      <td className="py-2 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {log.triggeredBy === "manual" ? <><Zap className="w-3 h-3 mr-1" />手動</> : <><Clock className="w-3 h-3 mr-1" />自動</>}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-muted-foreground text-xs">
                        {log.executionTimeMs ? `${(log.executionTimeMs / 1000).toFixed(1)}秒` : "-"}
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
                <Button variant="outline" size="sm" disabled={logPage <= 1} onClick={() => setLogPage(p => p - 1)}>前へ</Button>
                <span className="text-xs text-muted-foreground">{logPage} / {Math.ceil(logsTotal / 15)}</span>
                <Button variant="outline" size="sm" disabled={logPage >= Math.ceil(logsTotal / 15)} onClick={() => setLogPage(p => p + 1)}>次へ</Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 설정 생성/수정 다이얼로그 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "設定の編集" : "新しい自動投稿設定"}</DialogTitle>
            <DialogDescription>
              AIが自動で作成する情報共有記事のテーマとスタイルを設定します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 활성화 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">有効化</label>
              <Button
                variant={form.isEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setForm(f => ({ ...f, isEnabled: f.isEnabled ? 0 : 1 }))}
              >
                {form.isEnabled ? "有効" : "無効"}
              </Button>
            </div>

            <Separator />

            {/* 주제 */}
            <div>
              <label className="text-sm font-medium block mb-1">テーマ *</label>
              <Input
                value={form.topic}
                onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="例: 健康食品の情報、サプリメントガイド、運動と健康"
              />
              <p className="text-xs text-muted-foreground mt-1">AIがこのテーマに合った記事を作成します。</p>
            </div>

            {/* 카테고리 */}
            <div>
              <label className="text-sm font-medium block mb-1">商品カテゴリー</label>
              <Select
                value={form.categoryId?.toString() || "none"}
                onValueChange={(v) => setForm(f => ({ ...f, categoryId: v === "none" ? null : Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリーを選択 (任意)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">すべて (カテゴリーなし)</SelectItem>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">記事の公開時に関連付ける商品カテゴリーです。</p>
            </div>

            {/* 생성 시간 */}
            <div>
              <label className="text-sm font-medium block mb-1">生成時刻 (KST)</label>
              <Input
                type="time"
                value={form.generateTime}
                onChange={(e) => setForm(f => ({ ...f, generateTime: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">毎日この時刻に記事が自動生成されます。(韓国時間基準)</p>
            </div>

            {/* 작성 스타일 */}
            <div>
              <label className="text-sm font-medium block mb-1">執筆スタイル</label>
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
              <label className="text-sm font-medium block mb-1">キーワード (日本語)</label>
              <Input
                value={form.keywords}
                onChange={(e) => setForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder="例: ビタミン, オメガ3, プロバイオティクス"
              />
              <p className="text-xs text-muted-foreground mt-1">カンマ区切り。AIがこのキーワードを参考に記事を作成します。</p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">キーワード (英語)</label>
              <Input
                value={form.keywordsEn}
                onChange={(e) => setForm(f => ({ ...f, keywordsEn: e.target.value }))}
                placeholder="例: vitamin, omega-3, probiotics"
              />
              <p className="text-xs text-muted-foreground mt-1">英語キーワード (任意)。海外の資料を参照する際に使用されます。</p>
            </div>

            <Separator />

            {/* 커스텀 프롬프트 */}
            <div>
              <label className="text-sm font-medium block mb-1">カスタムプロンプト (任意)</label>
              <Textarea
                value={form.promptTemplate}
                onChange={(e) => setForm(f => ({ ...f, promptTemplate: e.target.value }))}
                placeholder="AIに渡すカスタム指示を入力してください。空欄の場合はデフォルトのプロンプトが使用されます。"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                AIの役割、口調、特別な要件などを指定できます。
                空欄の場合、健康・医薬品専門コンテンツライター向けのデフォルトプロンプトが使用されます。
              </p>
            </div>

            {/* 이미지 자동 생성 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  画像自動生成
                </label>
                <p className="text-xs text-muted-foreground">AIが記事内容に合った代表画像を自動生成して添付します。</p>
              </div>
              <Button
                variant={form.autoGenerateImage ? "default" : "outline"}
                size="sm"
                onClick={() => setForm(f => ({ ...f, autoGenerateImage: f.autoGenerateImage ? 0 : 1 }))}
              >
                {form.autoGenerateImage ? "使用" : "未使用"}
              </Button>
            </div>

            {/* 자동 게시 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">自動公開</label>
                <p className="text-xs text-muted-foreground">生成された記事をすぐに掲示板へ公開します。</p>
              </div>
              <Button
                variant={form.autoPublish ? "default" : "outline"}
                size="sm"
                onClick={() => setForm(f => ({ ...f, autoPublish: f.autoPublish ? 0 : 1 }))}
              >
                {form.autoPublish ? "自動公開" : "手動公開"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>キャンセル</Button>
            <Button
              onClick={handleSave}
              disabled={!form.topic || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editingId ? "更新" : "生成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
