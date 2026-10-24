import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calendar, Clock, AlertCircle, Play, Loader2, Bell } from "lucide-react";

export default function AdminPointExpiration() {
  const utils = trpc.useUtils();
  const { data: currentMonths, isLoading } = trpc.user.getPointExpirationMonths.useQuery();
  const setMonthsMut = trpc.user.adminSetPointExpirationMonths.useMutation({
    onSuccess: () => {
      utils.user.getPointExpirationMonths.invalidate();
      toast.success("ポイント有効期限ポリシーを保存しました。");
    },
    onError: (err) => toast.error(err.message),
  });
  const expirePointsMut = trpc.user.adminExpirePoints.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.expiredCount}件のポイントが失効しました。(合計 ${result.totalExpiredPoints.toLocaleString()}P)`);
    },
    onError: (err) => toast.error(err.message),
  });
  const testNotificationMut = trpc.user.adminTestExpirationNotification.useMutation({
    onSuccess: (result) => {
      toast.success(`通知送信完了: ${result.totalUsers}名 (メール: ${result.emailSent}、プッシュ: ${result.pushSent}、失敗: ${result.failed})`);
    },
    onError: (err) => toast.error(err.message),
  });

  const [expirationMonths, setExpirationMonths] = useState(12);

  // Load current setting when data arrives
  useMemo(() => {
    if (currentMonths !== undefined) {
      setExpirationMonths(currentMonths);
    }
  }, [currentMonths]);

  const handleSave = () => {
    if (expirationMonths < 1 || expirationMonths > 120) {
      toast.error("有効期間は1〜120か月の範囲で設定してください。");
      return;
    }
    setMonthsMut.mutate({ months: expirationMonths });
  };

  const handleExpireNow = () => {
    if (!confirm("失効したポイントを今すぐ処理しますか？")) return;
    expirePointsMut.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">ポイント有効期限設定</h1>
        <p className="text-muted-foreground">ポイント付与後、自動的に失効するまでの期間を設定します。</p>
      </div>

      <div className="space-y-6">
        {/* 만료 정책 설정 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">有効期間設定</h2>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ポイント有効期間</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={expirationMonths}
                  onChange={(e) => setExpirationMonths(Math.max(1, Math.min(120, Number(e.target.value))))}
                  className="w-32"
                  min={1}
                  max={120}
                />
                <span className="text-sm text-muted-foreground">か月</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ポイント付与日から{expirationMonths}か月後に自動的に失効します。
              </p>
            </div>

            {/* 미리보기 */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">適用例</p>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <p>• 2026年1月1日付与 → {new Date(new Date(2026, 0, 1).setMonth(expirationMonths)).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} 失効</p>
                <p>• 2026年6月15日付与 → {new Date(new Date(2026, 5, 15).setMonth(5 + expirationMonths)).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} 失効</p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={setMonthsMut.isPending} className="w-full">
              {setMonthsMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              設定を保存
            </Button>
          </div>
        </Card>

        {/* 수동 만료 처리 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">手動失効処理</h2>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                <div className="text-sm text-orange-700 dark:text-orange-400">
                  <p className="font-medium mb-1">失効処理のご案内</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>有効期限が過ぎたポイントを即時に差し引きます。</li>
                    <li>自動バッチ処理が実行されなかった場合にご利用ください。</li>
                    <li>処理されたポイントは復元できません。</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleExpireNow} 
              disabled={expirePointsMut.isPending}
              variant="outline"
              className="w-full"
            >
              {expirePointsMut.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              失効ポイントを今すぐ処理
            </Button>
          </div>
        </Card>

        {/* 알림 테스트 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">失効予定通知テスト</h2>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <p className="font-medium mb-1">通知テストのご案内</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>7日以内に失効予定のポイントがあるユーザーへ通知を送信します。</li>
                    <li>メールとプッシュ通知が同時に送信されます。</li>
                    <li>通常運用時は毎日午前9時に自動実行されます。</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => testNotificationMut.mutate()} 
              disabled={testNotificationMut.isPending}
              variant="outline"
              className="w-full"
            >
              {testNotificationMut.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              通知テストを実行
            </Button>
          </div>
        </Card>

        {/* 안내 사항 */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-sm font-semibold mb-3">参考事項</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>ポイント付与(earn)および管理者付与(admin)の場合のみ有効期限が設定されます。</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>使用(use)および返金(refund)ポイントは失効しません。</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>失効ポリシーの変更は、以降に付与されるポイントから適用されます。</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>ユーザーはマイページで失効予定ポイントを確認できます。</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
