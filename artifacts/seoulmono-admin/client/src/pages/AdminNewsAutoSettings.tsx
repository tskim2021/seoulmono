import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Save, Loader2, Info, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminNewsAutoSettings() {
  const { data: settings, isLoading, refetch } = trpc.news.autoSettings.useQuery();
  const { data: categoriesData } = trpc.category.list.useQuery();

  const updateMutation = trpc.news.updateAutoSetting.useMutation({
    onSuccess: () => {
      toast.success("設定を保存しました。");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateMutation = trpc.news.generateNow.useMutation({
    onSuccess: (result) => {
      toast.success(`ニュース${result.generated}件を生成しました。`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">ニュース自動生成設定</h1>
          <p className="text-sm text-muted-foreground">カテゴリー別のAIニュース自動生成を設定します。毎日午前9時(KST)に、有効なカテゴリーのニュースが自動生成されます。</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">自動生成のご案内</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>有効なカテゴリーでは、毎日午前9時に国内・海外・研究ニュースが各1件ずつ自動生成されます。</li>
            <li>キーワードを設定すると、そのキーワードに関連するニュースが生成されます。</li>
            <li>プロンプトテンプレートをカスタマイズして、ニュースのスタイルを調整できます。</li>
            <li>「今すぐ生成」ボタンで手動でニュースを生成することもできます。</li>
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        {settings && settings.length > 0 ? (
          settings.map((setting: any) => (
            <SettingCard
              key={setting.categoryId}
              setting={setting}
              categoryName={categoriesData?.find((c: any) => c.id === setting.categoryId)?.name || `カテゴリー ${setting.categoryId}`}
              onSave={(data) => updateMutation.mutate({ categoryId: setting.categoryId, ...data })}
              onGenerate={() => generateMutation.mutate({ categoryId: setting.categoryId })}
              isSaving={updateMutation.isPending}
              isGenerating={generateMutation.isPending}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>自動生成の設定がありません。</p>
            <p className="text-sm mt-1">カテゴリーが登録されているかご確認ください。</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingCard({
  setting,
  categoryName,
  onSave,
  onGenerate,
  isSaving,
  isGenerating,
}: {
  setting: any;
  categoryName: string;
  onSave: (data: any) => void;
  onGenerate: () => void;
  isSaving: boolean;
  isGenerating: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(setting.isEnabled === 1);
  const [keywords, setKeywords] = useState(setting.keywords || "");
  const [keywordsEn, setKeywordsEn] = useState(setting.keywordsEn || "");
  const [promptTemplate, setPromptTemplate] = useState(setting.promptTemplate || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setIsEnabled(setting.isEnabled === 1);
    setKeywords(setting.keywords || "");
    setKeywordsEn(setting.keywordsEn || "");
    setPromptTemplate(setting.promptTemplate || "");
    setHasChanges(false);
  }, [setting]);

  const handleSave = () => {
    onSave({
      isEnabled: isEnabled ? 1 : 0,
      keywords,
      keywordsEn,
      promptTemplate: promptTemplate || undefined,
    });
    setHasChanges(false);
  };

  const markChanged = () => setHasChanges(true);

  return (
    <div className="border rounded-xl p-5 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base">{categoryName}</h3>
          {isEnabled ? (
            <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" /> 有効</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs"><XCircle className="w-3 h-3 mr-1" /> 無効</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
            今すぐ生成
          </Button>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">自動生成</span>
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              onClick={() => { setIsEnabled(!isEnabled); markChanged(); }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium mb-1 block">キーワード (日本語)</label>
          <Input
            value={keywords}
            onChange={(e) => { setKeywords(e.target.value); markChanged(); }}
            placeholder="薄毛, 発毛, 頭皮ケア"
          />
          <p className="text-xs text-muted-foreground mt-1">カンマ区切りで入力</p>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">キーワード (英語)</label>
          <Input
            value={keywordsEn}
            onChange={(e) => { setKeywordsEn(e.target.value); markChanged(); }}
            placeholder="hair loss, hair care, scalp"
          />
          <p className="text-xs text-muted-foreground mt-1">海外ニュースの生成に使用</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block">カスタムプロンプト (任意)</label>
        <Textarea
          value={promptTemplate}
          onChange={(e) => { setPromptTemplate(e.target.value); markChanged(); }}
          placeholder="デフォルトのプロンプトを使用する場合は空欄のままにしてください。カスタムプロンプトを入力すると、AIがそのスタイルでニュースを生成します。"
          rows={3}
        />
      </div>

      {hasChanges && (
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            設定保存
          </Button>
        </div>
      )}
    </div>
  );
}
