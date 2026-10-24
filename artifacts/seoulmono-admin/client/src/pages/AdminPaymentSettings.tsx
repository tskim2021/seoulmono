import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, CreditCard, DollarSign, Banknote, Trash2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

const STRIPE_FIELDS = ["publishableKey", "secretKey", "webhookSecret"] as const;
const STRIPE_LABELS: Record<string, string> = {
  publishableKey: "Publishable Key (公開キー, pk_live_...)",
  secretKey: "Secret Key (シークレットキー, sk_live_...)",
  webhookSecret: "Webhook Secret (任意, whsec_...)",
};

function maskKey(key: string) {
  if (!key || key.length < 12) return "***";
  return key.slice(0, 10) + "..." + key.slice(-4);
}

function isLiveKey(key: string) {
  return key.includes("_live_");
}

export function AdminPaymentSettings() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [apiConfig, setApiConfig] = useState("");
  const [stripeFields, setStripeFields] = useState<Record<string, string>>({ publishableKey: "", secretKey: "", webhookSecret: "" });
  const [description, setDescription] = useState("");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const { data: methods, refetch } = trpc.paymentSettings.adminGetAllMethods.useQuery();

  const toggleMethod = trpc.paymentSettings.adminToggleMethod.useMutation({
    onSuccess: () => { toast.success("決済手段の設定を更新しました。"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateApiConfig = trpc.paymentSettings.adminUpdateApiConfig.useMutation({
    onSuccess: () => { toast.success("API設定を保存しました。"); setEditingId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteKeys = trpc.stripe.adminDeleteKeys.useMutation({
    onSuccess: () => { toast.success("Stripeキーを削除しました。"); refetch(); },
    onError: (e) => toast.error("削除に失敗しました: " + e.message),
  });

  const handleToggle = (id: number, currentStatus: number) => {
    toggleMethod.mutate({ id, isEnabled: currentStatus === 1 ? 0 : 1 });
  };

  const handleEdit = (method: any) => {
    setEditingId(method.id);
    setDescription(method.description || "");
    if (method.methodCode === "stripe") {
      try {
        const parsed = JSON.parse(method.apiConfig || "{}");
        setStripeFields({
          publishableKey: parsed.publishableKey || "",
          secretKey: parsed.secretKey || "",
          webhookSecret: parsed.webhookSecret || "",
        });
      } catch {
        setStripeFields({ publishableKey: "", secretKey: "", webhookSecret: "" });
      }
      setApiConfig("");
    } else {
      setApiConfig(method.apiConfig || "");
    }
  };

  const handleSave = (id: number, methodCode: string) => {
    const finalApiConfig = methodCode === "stripe"
      ? JSON.stringify({ ...stripeFields, currency: "krw" })
      : apiConfig;
    updateApiConfig.mutate({ id, apiConfig: finalApiConfig, description });
  };

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getIcon = (methodCode: string) => {
    switch (methodCode) {
      case "stripe": return <CreditCard className="h-5 w-5 text-violet-600" />;
      case "bank_transfer": return <Banknote className="h-5 w-5 text-green-600" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">決済設定</h1>
        <p className="text-muted-foreground text-sm">
          利用する決済手段を有効化し、API設定を管理します。有効化された決済手段のみがお客様に表示されます。
        </p>
      </div>

      <div className="grid gap-6">
        {methods?.map((method) => {
          let parsedConfig: Record<string, string> = {};
          try { parsedConfig = JSON.parse(method.apiConfig || "{}"); } catch {}
          const hasKeys = method.methodCode === "stripe"
            ? !!(parsedConfig.publishableKey && parsedConfig.secretKey)
            : !!method.apiConfig;
          const liveMode = parsedConfig.publishableKey ? isLiveKey(parsedConfig.publishableKey) : false;

          return (
            <Card key={method.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIcon(method.methodCode)}
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{method.methodName}</CardTitle>
                        {method.methodCode === "stripe" && hasKeys && (
                          <Badge variant={liveMode ? "default" : "secondary"} className={liveMode ? "bg-green-600" : ""}>
                            {liveMode ? "本番" : "テスト"}
                          </Badge>
                        )}
                        {method.methodCode === "stripe" && (
                          hasKeys
                            ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                            : <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <CardDescription>{method.description || (method.methodCode === "stripe" ? "Stripe グローバルカード決済" : "")}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={method.isEnabled === 1}
                    onCheckedChange={() => handleToggle(method.id, method.isEnabled)}
                  />
                </div>
              </CardHeader>

              {method.methodCode !== "bank_transfer" && (
                <CardContent>
                  {editingId === method.id ? (
                    <div className="space-y-4">
                      {method.methodCode === "stripe" ? (
                        <div className="space-y-3">
                          {STRIPE_FIELDS.map((field) => (
                            <div key={field}>
                              <label className="text-sm font-medium mb-1 block">{STRIPE_LABELS[field]}</label>
                              <div className="flex gap-2">
                                <Input
                                  type={showSecrets[field] ? "text" : "password"}
                                  value={stripeFields[field] || ""}
                                  onChange={(e) => setStripeFields(prev => ({ ...prev, [field]: e.target.value }))}
                                  placeholder={`${STRIPE_LABELS[field]}を入力してください`}
                                  className="font-mono text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleShowSecret(field)}
                                >
                                  {showSecrets[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground">
                            Stripeダッシュボード → Developers → API keys で発行したキーを入力してください。
                            Webhook Secret は Stripe Dashboard → Webhooks で確認してください。
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="text-sm font-medium mb-2 block">API設定 (JSON)</label>
                          <Textarea
                            value={apiConfig}
                            onChange={(e) => setApiConfig(e.target.value)}
                            placeholder='{"apiKey": "your_api_key"}'
                            rows={4}
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium mb-2 block">説明</label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="管理者用の説明を入力してください"
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => handleSave(method.id, method.methodCode)}>保存</Button>
                        <Button variant="outline" onClick={() => setEditingId(null)}>キャンセル</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {method.methodCode === "stripe" ? (
                        <div className="space-y-3">
                          {hasKeys ? (
                            <div className="bg-muted/40 rounded-lg p-3 space-y-2 font-mono text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Publishable Key</span>
                                <span>{maskKey(parsedConfig.publishableKey || "")}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Secret Key</span>
                                <span>{maskKey(parsedConfig.secretKey || "")}</span>
                              </div>
                              {parsedConfig.webhookSecret && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Webhook Secret</span>
                                  <span>{maskKey(parsedConfig.webhookSecret)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">通貨</span>
                                <span className="uppercase">{parsedConfig.currency || "krw"}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-amber-600 mb-2">
                              Stripeキーが設定されていません。キーを登録してください。
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(method)}>
                              {hasKeys ? "キーを編集" : "キーを登録"}
                            </Button>
                            {hasKeys && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("Stripe 키를 삭제하시겠습니까? 결제가 비활성화됩니다.")) {
                                    deleteKeys.mutate();
                                  }
                                }}
                                disabled={deleteKeys.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                キーを削除
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {method.apiConfig ? (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">API設定が保存されています。</p>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(method)}>設定を編集</Button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">API設定が必要です。</p>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(method)}>API設定を追加</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>決済手段ガイド</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Stripe (クレジットカード)</h3>
            <p className="text-sm text-muted-foreground">
              世界中のクレジットカード決済に対応。<a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">stripe.com</a>で登録後、APIキーを発行してください。
              Webhookは<a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary underline">Stripeダッシュボード → Webhooks</a>で設定します。
              エンドポイントURL: <code className="text-xs bg-muted px-1 rounded">/api/stripe/webhook</code>
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">銀行振込</h3>
            <p className="text-sm text-muted-foreground">
              国内銀行口座への振込。別途API設定は不要です。振込先口座は「決済管理」メニューで設定してください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPaymentSettings;
