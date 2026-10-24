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
      toast.success("API 키가 저장되었습니다.");
      setInputKey("");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error("저장 실패: " + e.message),
  });

  const deleteKey = trpc.admin.deleteApiSetting.useMutation({
    onSuccess: () => {
      toast.success("API 키가 삭제되었습니다.");
      setEditing(false);
      setInputKey("");
      refetch();
    },
    onError: (e) => toast.error("삭제 실패: " + e.message),
  });

  const testKey = trpc.admin.testTrackingApi.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("API 키가 정상 작동합니다.");
      } else {
        toast.error("연결 테스트 실패: " + data.message);
      }
    },
    onError: (e) => toast.error("연결 테스트 실패: " + e.message),
  });

  const handleSave = () => {
    if (!inputKey.trim()) {
      toast.error("API 키를 입력해주세요.");
      return;
    }
    setKey.mutate({ key: "seventeentrack_api_key", value: inputKey.trim() });
  };

  const handleDelete = () => {
    if (!confirm("API 키를 삭제하시겠습니까? 삭제 후에는 서버 자동 배송 추적이 작동하지 않습니다.")) return;
    deleteKey.mutate({ key: "seventeentrack_api_key" });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">API 키 설정</h1>
      <p className="text-sm text-muted-foreground mb-6">배송 추적 등 외부 서비스 연동에 필요한 API 키를 관리합니다.</p>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            17track 배송 추적 API
          </CardTitle>
          <CardDescription>
            국제배송 운송장 번호로 배송 상태를 자동 추적합니다. 키가 없으면 고객이 직접 외부 사이트에서 조회해야 합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> 로딩 중...
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                {settings?.hasSeventeentrackKey ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">API 키 설정됨</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{settings.seventeentrackApiKey}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 shrink-0">
                      활성
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">API 키 미설정</p>
                      <p className="text-xs text-muted-foreground">키를 설정하면 서버에서 자동으로 배송 상태를 가져옵니다.</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">미설정</Badge>
                  </>
                )}
              </div>

              {(editing || !settings?.hasSeventeentrackKey) && (
                <div className="space-y-3 p-4 border rounded-lg bg-card">
                  <Label htmlFor="apikey" className="text-sm font-medium">
                    {settings?.hasSeventeentrackKey ? "새 API 키 입력" : "API 키 입력"}
                  </Label>
                  <p className="text-xs text-muted-foreground -mt-1">
                    아래 <strong>키 발급 방법</strong>을 참고해 17track에서 복사한 키를 붙여넣으세요.
                  </p>
                  <div className="relative">
                    <Input
                      id="apikey"
                      type={showInput ? "text" : "password"}
                      placeholder="예: 1234abcd5678efgh..."
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
                      저장
                    </Button>
                    {settings?.hasSeventeentrackKey && (
                      <Button variant="outline" size="sm" onClick={() => { setEditing(false); setInputKey(""); }}>
                        취소
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {settings?.hasSeventeentrackKey && !editing && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Key className="w-3 h-3 mr-1" /> API 키 변경
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
                    연결 테스트
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
                    키 삭제
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
            키 발급 방법
            <a
              href="https://www.17track.net/en/apidoc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs font-normal flex items-center gap-0.5 hover:underline"
            >
              공식 문서 <ExternalLink className="w-3 h-3" />
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-muted-foreground space-y-2.5 list-decimal list-inside">
            <li>
              <a href="https://www.17track.net" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                www.17track.net
              </a>
              에서 회원가입 (무료)
            </li>
            <li>로그인 후 <strong className="text-foreground">우측 상단 프로필 아이콘</strong> 클릭</li>
            <li>
              <strong className="text-foreground">My 17track</strong> 선택 →{" "}
              <strong className="text-foreground">API</strong> 탭 클릭
            </li>
            <li>
              <strong className="text-foreground">Create API Key</strong> 버튼 클릭 →{" "}
              생성된 키 전체 복사
            </li>
            <li>위 입력란에 붙여넣고 <strong className="text-foreground">저장</strong> 클릭</li>
          </ol>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
            <p>• <strong className="text-foreground">무료 플랜:</strong> 월 100건 추적</p>
            <p>• <strong className="text-foreground">유료 플랜:</strong> 더 많은 건수 및 웹훅 지원</p>
            <p>• API 키 없이도 고객 페이지에서 외부 링크로 17track 직접 조회 가능</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
