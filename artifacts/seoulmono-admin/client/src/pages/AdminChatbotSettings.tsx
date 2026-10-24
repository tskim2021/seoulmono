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
      toast.success("챗봇 설정이 저장되었습니다.");
    } catch (error) {
      toast.error("설정 저장에 실패했습니다.");
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
          AI 챗봇 기본 설정
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI 상담사의 전반적인 동작을 설정합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>챗봇 활성화</CardTitle>
            <CardDescription>
              챗봇 위젯의 표시 여부를 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isEnabled" className="font-medium">챗봇 활성화</Label>
                <p className="text-sm text-muted-foreground">
                  활성화 시 쇼핑몰에 챗봇 위젯이 표시됩니다.
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
            <CardTitle>인사말 설정</CardTitle>
            <CardDescription>
              챗봇을 열었을 때 표시되는 환영 메시지입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="greetingMessage">인사말 메시지</Label>
              <Textarea
                id="greetingMessage"
                value={formData.greetingMessage}
                onChange={(e) => setFormData({ ...formData, greetingMessage: e.target.value })}
                placeholder="안녕하세요! 탈모학교 AI 상담사입니다. 무엇을 도와드릴까요?"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시스템 프롬프트</CardTitle>
            <CardDescription>
              AI에게 전달되는 역할 및 정책 지시문입니다. 비워두면 기본 프롬프트가 사용됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemPromptOverride">시스템 프롬프트 (선택사항)</Label>
              <Textarea
                id="systemPromptOverride"
                value={formData.systemPromptOverride}
                onChange={(e) => setFormData({ ...formData, systemPromptOverride: e.target.value })}
                placeholder="기본 프롬프트를 사용하려면 비워두세요"
                rows={8}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                고급 사용자 전용: AI의 역할, 답변 스타일, 정책 등을 커스터마이징할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>대화 설정</CardTitle>
            <CardDescription>
              대화 턴수 및 응답 불가 시 안내 메시지를 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxTurns">최대 대화 턴수</Label>
              <Input
                id="maxTurns"
                type="number"
                min={1}
                max={100}
                value={formData.maxTurns}
                onChange={(e) => setFormData({ ...formData, maxTurns: parseInt(e.target.value) || 20 })}
              />
              <p className="text-xs text-muted-foreground">
                한 세션당 최대 문답 횟수 (기본 20회)
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="responseUnavailableMessage">응답 불가 안내 메시지</Label>
              <Textarea
                id="responseUnavailableMessage"
                value={formData.responseUnavailableMessage}
                onChange={(e) => setFormData({ ...formData, responseUnavailableMessage: e.target.value })}
                placeholder="죄송합니다. 해당 질문에 대한 답변을 찾을 수 없습니다."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                AI가 답변할 수 없을 때 표시할 안내 메시지
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>운영 시간</CardTitle>
            <CardDescription>
              챗봇의 운영 시간을 설정합니다. 운영 시간 외에는 안내 메시지가 표시됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operatingHoursStart">시작 시간</Label>
                <Input
                  id="operatingHoursStart"
                  type="time"
                  value={formData.operatingHoursStart}
                  onChange={(e) => setFormData({ ...formData, operatingHoursStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatingHoursEnd">종료 시간</Label>
                <Input
                  id="operatingHoursEnd"
                  type="time"
                  value={formData.operatingHoursEnd}
                  onChange={(e) => setFormData({ ...formData, operatingHoursEnd: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              24시간 운영: 00:00 ~ 23:59
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                설정 저장
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
