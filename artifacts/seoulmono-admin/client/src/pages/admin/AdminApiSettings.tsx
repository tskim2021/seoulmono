import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Trash2, ExternalLink, RefreshCw } from "lucide-react";

export default function AdminApiSettings() {
  const [inputKey, setInputKey] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: settings, refetch, isLoading } = trpc.admin.getApiSettings.useQuery();

  const setKey = trpc.admin.setApiSetting.useMutation({
    onSuccess: () => {
      toast.success("APIキーを保存しました。");
      setInputKey("");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error("保存に失敗しました: " + e.message),
  });

  const deleteKey = trpc.admin.deleteApiSetting.useMutation({
    onSuccess: () => {
      toast.success("APIキーを削除しました。");
      setEditing(false);
      setInputKey("");
      refetch();
    },
    onError: (e) => toast.error("削除に失敗しました: " + e.message),
  });

  const testKey = trpc.admin.testTrackingApi.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("APIキーは正常に動作しています。");
      } else {
        toast.error("接続テストに失敗しました: " + data.message);
      }
    },
    onError: (e) => toast.error("接続テストに失敗しました: " + e.message),
  });

  const handleSave = () => {
    if (!inputKey.trim()) {
      toast.error("APIキーを入力してください。");
      return;
    }
    setKey.mutate({ key: "seventeentrack_api_key", value: inputKey.trim() });
  };

  const handleDelete = () => {
    if (!confirm("APIキーを削除しますか？ 削除後はサーバーでの自動配送追跡が動作しなくなります。")) return;
    deleteKey.mutate({ key: "seventeentrack_api_key" });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">APIキー設定</h1>
      <p className="text-sm text-muted-foreground mb-6">配送追跡など外部サービス連携に必要なAPIキーを管理します。</p>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            17track 配送追跡API
          </CardTitle>
          <CardDescription>
            国際配送の追跡番号で配送状況を自動追跡します。キーがない場合、お客様ご自身で外部サイトから照会していただく必要があります。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> 読み込み中...
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                {settings?.hasSeventeentrackKey ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">APIキー設定済み</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{settings.seventeentrackApiKey}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 shrink-0">
                      有効
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">APIキー未設定</p>
                      <p className="text-xs text-muted-foreground">キーを設定すると、サーバーが自動的に配送状況を取得します。</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">未設定</Badge>
                  </>
                )}
              </div>

              {(editing || !settings?.hasSeventeentrackKey) && (
                <div className="space-y-3 p-4 border rounded-lg bg-card">
                  <Label htmlFor="apikey" className="text-sm font-medium">
                    {settings?.hasSeventeentrackKey ? "新しいAPIキーを入力" : "APIキーを入力"}
                  </Label>
                  <p className="text-xs text-muted-foreground -mt-1">
                    下の<strong>キーの発行方法</strong>を参考に、17trackでコピーしたキーを貼り付けてください。
                  </p>
                  <div className="relative">
                    <Input
                      id="apikey"
                      type={showInput ? "text" : "password"}
                      placeholder="例: 1234abcd5678efgh..."
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      className="pr-10 font-mono text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowInput(!showInput)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={setKey.isPending} size="sm">
                      {setKey.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      保存
                    </Button>
                    {settings?.hasSeventeentrackKey && (
                      <Button variant="outline" size="sm" onClick={() => { setEditing(false); setInputKey(""); }}>
                        キャンセル
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {settings?.hasSeventeentrackKey && !editing && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Key className="w-3 h-3 mr-1" /> APIキーを変更
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testKey.mutate({ apiKey: "" })}
                    disabled={testKey.isPending}
                  >
                    {testKey.isPending
                      ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      : <RefreshCw className="w-3 h-3 mr-1" />
                    }
                    接続テスト
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:border-destructive/50"
                    onClick={handleDelete}
                    disabled={deleteKey.isPending}
                  >
                    {deleteKey.isPending
                      ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      : <Trash2 className="w-3 h-3 mr-1" />
                    }
                    キーを削除
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            キーの発行方法
            <a
              href="https://www.17track.net/en/apidoc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs font-normal flex items-center gap-0.5 hover:underline"
            >
              公式ドキュメント <ExternalLink className="w-3 h-3" />
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-muted-foreground space-y-2.5 list-decimal list-inside">
            <li>
              <a href="https://www.17track.net" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                www.17track.net
              </a>
              でアカウント登録 (無料)
            </li>
            <li>ログイン後、<strong className="text-foreground">右上のプロフィールアイコン</strong>をクリック</li>
            <li>
              <strong className="text-foreground">My 17track</strong> を選択 →{" "}
              <strong className="text-foreground">API</strong> タブをクリック
            </li>
            <li>
              <strong className="text-foreground">Create API Key</strong> ボタンをクリック →{" "}
              生成されたキーをすべてコピー
            </li>
            <li>上の入力欄に貼り付けて <strong className="text-foreground">保存</strong> をクリック</li>
          </ol>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
            <p>• <strong className="text-foreground">無料プラン:</strong> 月100件まで追跡</p>
            <p>• <strong className="text-foreground">有料プラン:</strong> より多い件数とWebhookに対応</p>
            <p>• APIキーがなくても、お客様ページから外部リンクで17trackを直接照会できます</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
