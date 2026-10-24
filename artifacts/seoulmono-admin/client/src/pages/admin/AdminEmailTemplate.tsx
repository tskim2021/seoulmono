import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import {
  Mail, Palette, Image, FileText, Eye, Settings, RefreshCw,
  ShoppingBag, Star, AlertTriangle, Bell, ChevronRight,
  CheckCircle, Truck, UserPlus, XCircle, Timer,
} from "lucide-react";

type TemplateType = "generic" | "order_confirm" | "payment_confirm" | "shipping_start" | "review_request" | "customs_hold" | "welcome" | "auto_cancel" | "point_expire";

const TEMPLATE_DEFS: { type: TemplateType; label: string; icon: React.ElementType; desc: string; badge?: string }[] = [
  {
    type: "generic",
    label: "一般通知",
    icon: Bell,
    desc: "汎用メールテンプレート (スタイルの基準)",
  },
  {
    type: "order_confirm",
    label: "ご注文受付 / お振込のご案内",
    icon: ShoppingBag,
    desc: "銀行振込での注文時に振込先口座を案内",
    badge: "自動送信",
  },
  {
    type: "payment_confirm",
    label: "入金確認完了",
    icon: CheckCircle,
    desc: "入金確認後の発送開始のご案内",
    badge: "自動送信",
  },
  {
    type: "shipping_start",
    label: "発送開始",
    icon: Truck,
    desc: "商品の発送および追跡番号のご案内",
    badge: "自動送信",
  },
  {
    type: "review_request",
    label: "レビューのお願い",
    icon: Star,
    desc: "配送完了後のレビュー投稿のご案内",
    badge: "自動送信",
  },
  {
    type: "customs_hold",
    label: "通関検査のご案内",
    icon: AlertTriangle,
    desc: "通関検査の対象となった場合の返送のご案内",
    badge: "自動送信",
  },
  {
    type: "welcome",
    label: "会員登録のお礼",
    icon: UserPlus,
    desc: "新規会員登録完了時のウェルカムメール",
    badge: "自動送信",
  },
  {
    type: "auto_cancel",
    label: "注文の自動キャンセル",
    icon: XCircle,
    desc: "入金期限切れ時の自動キャンセルのご案内",
    badge: "自動送信",
  },
  {
    type: "point_expire",
    label: "ポイント失効予定",
    icon: Timer,
    desc: "失効予定ポイントのご案内",
    badge: "自動送信",
  },
];

function TemplatePreviewPane({ type }: { type: TemplateType }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { data, isLoading, refetch } = trpc.admin.previewEmailTemplate.useQuery({ type });

  useEffect(() => {
    if (data?.html && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(data.html);
        doc.close();
      }
    }
  }, [data?.html]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">実際に送信されるメールのデザインをプレビューします。(サンプルデータ使用)</p>
          {data?.subject && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">件名:</span>
              <code className="text-xs bg-secondary px-2 py-0.5 rounded">{data.subject}</code>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          再読み込み
        </Button>
      </div>

      {isLoading ? (
        <div className="border rounded-xl h-[600px] flex items-center justify-center bg-secondary/20">
          <div className="text-sm text-muted-foreground animate-pulse">テンプレートを読み込み中...</div>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-gray-50 shadow-inner">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 border-b">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-gray-500">メールプレビュー</span>
          </div>
          <iframe
            ref={iframeRef}
            className="w-full"
            style={{ height: "640px", border: "none" }}
            title="メールプレビュー"
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}

export default function AdminEmailTemplate() {
  const [activeTab, setActiveTab] = useState<"settings" | TemplateType>("settings");
  const { data: template } = trpc.admin.getEmailTemplate.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    logoUrl: "",
    primaryColor: "#3a2a2a",
    footerText: "",
    footerLinks: "[]",
  });

  useEffect(() => {
    if (template) {
      setForm({
        logoUrl: template.logoUrl || "",
        primaryColor: template.primaryColor || "#3a2a2a",
        footerText: template.footerText || "",
        footerLinks: template.footerLinks || "[]",
      });
    }
  }, [template]);

  const updateTemplate = trpc.admin.updateEmailTemplate.useMutation({
    onSuccess: () => {
      toast.success("メールテンプレートを保存しました");
      utils.admin.getEmailTemplate.invalidate();
      utils.admin.previewEmailTemplate.invalidate();
    },
    onError: (error) => {
      toast.error(`保存に失敗しました: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    try {
      JSON.parse(form.footerLinks);
    } catch {
      toast.error("フッターリンクのJSON形式が正しくありません");
      return;
    }
    updateTemplate.mutate(form);
  };

  const isTemplateTab = activeTab !== "settings";
  const currentTemplateDef = TEMPLATE_DEFS.find((t) => t.type === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6" />
          メールテンプレート
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          送信されるメールのデザインと内容を設定し、プレビューで確認します
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b">
        <div className="flex gap-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "settings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="w-4 h-4" />
            テンプレート設定
          </button>

          <div className="flex items-center px-2 text-muted-foreground/30">
            <ChevronRight className="w-4 h-4" />
          </div>

          {TEMPLATE_DEFS.map((def) => {
            const Icon = def.icon;
            return (
              <button
                key={def.type}
                onClick={() => setActiveTab(def.type)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === def.type
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {def.label}
                {def.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {def.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 설정 탭 */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Image className="w-4 h-4" />
                ロゴURL
              </Label>
              <Input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://talmoschool.com/shop/logo.png"
              />
              <p className="text-xs text-muted-foreground mt-1">
                メールヘッダーに表示するロゴ画像のURL (空欄の場合はデフォルトのロゴを使用)
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4" />
                メインカラー
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  placeholder="#3a2a2a"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ボタンおよび強調色 (Hexコード)。一般通知、ご注文受付メールに適用されます。
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                フッターテキスト
              </Label>
              <Input
                value={form.footerText}
                onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                placeholder="ソウルモノ - コミュニティEコマースプラットフォーム"
              />
              <p className="text-xs text-muted-foreground mt-1">
                メール下部に表示するテキスト
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                フッターリンク (JSON)
              </Label>
              <Textarea
                value={form.footerLinks}
                onChange={(e) => setForm({ ...form, footerLinks: e.target.value })}
                placeholder='[{"text":"利用規約","url":"/terms"},{"text":"プライバシーポリシー","url":"/privacy"}]'
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                フッターに表示するリンク一覧 (JSON配列形式)
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={updateTemplate.isPending}>
                {updateTemplate.isPending ? "保存中..." : "保存する"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  template &&
                  setForm({
                    logoUrl: template.logoUrl || "",
                    primaryColor: template.primaryColor || "#3a2a2a",
                    footerText: template.footerText || "",
                    footerLinks: template.footerLinks || "[]",
                  })
                }
              >
                リセット
              </Button>
            </div>
          </Card>

          {/* 템플릿 목록 안내 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              メールテンプレート一覧
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              上のタブをクリックすると、各メールを実際のサンプルデータでプレビューできます。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATE_DEFS.map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.type}
                    onClick={() => setActiveTab(def.type)}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-secondary/40 transition-colors text-left group"
                  >
                    <div className="mt-0.5 w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{def.label}</span>
                        {def.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {def.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{def.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* 미리보기 탭들 */}
      {isTemplateTab && currentTemplateDef && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <currentTemplateDef.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{currentTemplateDef.label}</h3>
              <p className="text-sm text-muted-foreground">{currentTemplateDef.desc}</p>
            </div>
            {currentTemplateDef.badge && (
              <Badge variant="outline" className="ml-auto">
                {currentTemplateDef.badge}
              </Badge>
            )}
          </div>

          <TemplatePreviewPane type={activeTab as TemplateType} />

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              * 템플릿 디자인(로고·색상·푸터)은 <strong>템플릿 설정</strong> 탭에서 변경하세요
            </p>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("settings")} className="gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              設定へ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
