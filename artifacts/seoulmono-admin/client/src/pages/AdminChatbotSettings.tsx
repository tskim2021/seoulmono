import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Bot } from "lucide-react";
import { toast } from "sonner";

export default function AdminChatbotSettings() {
  const { data: settings, isLoading } = trpc.chatbotAdmin.getSettings.useQuery();
  const updateMutation = trpc.chatbotAdmin.updateSettings.useMutation();

  const [formData, setFormData] = useState({
    greetingMessage: "",
    isEnabled: 1,
    systemPromptOverride: "",
    maxTurns: 20,
    responseUnavailableMessage: "",
    operatingHoursStart: "00:00",
    operatingHoursEnd: "23:59",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        greetingMessage: settings.greetingMessage || "",
        isEnabled: settings.isEnabled,
        systemPromptOverride: settings.systemPromptOverride || "",
        maxTurns: settings.maxTurns,
        responseUnavailableMessage: settings.responseUnavailableMessage || "",
        operatingHoursStart: settings.operatingHoursStart || "00:00",
        operatingHoursEnd: settings.operatingHoursEnd || "23:59",
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        ...formData,
        systemPromptOverride: formData.systemPromptOverride || null,
      });
      toast.success("チャットボット設定を保存しました。");
    } catch (error) {
      toast.error("設定の保存に失敗しました。");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6" />
          AIチャットボット基本設定
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AIアシスタントの全体的な動作を設定します。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>チャットボットの有効化</CardTitle>
            <CardDescription>
              チャットボットウィジェットの表示有無を設定します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isEnabled" className="font-medium">チャットボットを有効化</Label>
                <p className="text-sm text-muted-foreground">
                  有効にすると、ショップにチャットボットウィジェットが表示されます。
                </p>
              </div>
              <Switch
                id="isEnabled"
                checked={formData.isEnabled === 1}
                onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked ? 1 : 0 })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>あいさつ文設定</CardTitle>
            <CardDescription>
              チャットボットを開いたときに表示されるウェルカムメッセージです。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="greetingMessage">あいさつメッセージ</Label>
              <Textarea
                id="greetingMessage"
                value={formData.greetingMessage}
                onChange={(e) => setFormData({ ...formData, greetingMessage: e.target.value })}
                placeholder="こんにちは！ソウルモノのAIアシスタントです。どのようなご用件でしょうか？"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>システムプロンプト</CardTitle>
            <CardDescription>
              AIに渡される役割・ポリシーの指示文です。空欄の場合はデフォルトのプロンプトが使用されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemPromptOverride">システムプロンプト (任意)</Label>
              <Textarea
                id="systemPromptOverride"
                value={formData.systemPromptOverride}
                onChange={(e) => setFormData({ ...formData, systemPromptOverride: e.target.value })}
                placeholder="デフォルトのプロンプトを使用する場合は空欄のままにしてください"
                rows={8}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                上級者向け: AIの役割、回答スタイル、ポリシーなどをカスタマイズできます。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>会話設定</CardTitle>
            <CardDescription>
              会話のターン数と、回答不可時の案内メッセージを設定します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxTurns">最大会話ターン数</Label>
              <Input
                id="maxTurns"
                type="number"
                min={1}
                max={100}
                value={formData.maxTurns}
                onChange={(e) => setFormData({ ...formData, maxTurns: parseInt(e.target.value) || 20 })}
              />
              <p className="text-xs text-muted-foreground">
                1セッションあたりの最大やり取り回数 (デフォルト20回)
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="responseUnavailableMessage">回答不可時の案内メッセージ</Label>
              <Textarea
                id="responseUnavailableMessage"
                value={formData.responseUnavailableMessage}
                onChange={(e) => setFormData({ ...formData, responseUnavailableMessage: e.target.value })}
                placeholder="申し訳ございません。該当のご質問に対する回答が見つかりませんでした。"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                AIが回答できない場合に表示する案内メッセージ
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>運営時間</CardTitle>
            <CardDescription>
              チャットボットの運営時間を設定します。運営時間外は案内メッセージが表示されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operatingHoursStart">開始時間</Label>
                <Input
                  id="operatingHoursStart"
                  type="time"
                  value={formData.operatingHoursStart}
                  onChange={(e) => setFormData({ ...formData, operatingHoursStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatingHoursEnd">終了時間</Label>
                <Input
                  id="operatingHoursEnd"
                  type="time"
                  value={formData.operatingHoursEnd}
                  onChange={(e) => setFormData({ ...formData, operatingHoursEnd: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              24時間運営: 00:00 ~ 23:59
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                設定を保存
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
