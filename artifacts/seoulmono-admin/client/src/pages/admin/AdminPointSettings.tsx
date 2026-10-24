import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Gift, Package, Loader2, Calendar, Clock, AlertCircle, Play, Bell } from "lucide-react";

export default function AdminPointSettings() {
  const { data, isLoading } = trpc.admin.getPointSettings.useQuery();
  const categories = trpc.admin.categories.useQuery();
  const updateSettings = trpc.admin.updatePointSettings.useMutation({
    onSuccess: () => toast.success("ポイント設定を保存しました。"),
    onError: (e) => toast.error(e.message),
  });
  const bulkUpdate = trpc.admin.bulkUpdateProductPointRate.useMutation({
    onSuccess: (d) => toast.success(`${d.updatedCount}件の商品のポイント付与率を変更しました。`),
    onError: (e) => toast.error(e.message),
  });

  const utils = trpc.useUtils();
  const { data: currentMonths, isLoading: expirationLoading } = trpc.user.getPointExpirationMonths.useQuery();
  const setMonthsMut = trpc.user.adminSetPointExpirationMonths.useMutation({
    onSuccess: () => { utils.user.getPointExpirationMonths.invalidate(); toast.success("ポイント有効期限ポリシーを保存しました。"); },
    onError: (err) => toast.error(err.message),
  });
  const expirePointsMut = trpc.user.adminExpirePoints.useMutation({
    onSuccess: (result) => toast.success(`${result.expiredCount}件のポイントが失効しました。(合計 ${result.totalExpiredPoints.toLocaleString()}P)`),
    onError: (err) => toast.error(err.message),
  });
  const testNotificationMut = trpc.user.adminTestExpirationNotification.useMutation({
    onSuccess: (result) => toast.success(`通知送信完了: ${result.totalUsers}名 (メール: ${result.emailSent}、プッシュ: ${result.pushSent}、失敗: ${result.failed})`),
    onError: (err) => toast.error(err.message),
  });

  const [regPoints, setRegPoints] = useState("");
  const [defaultRate, setDefaultRate] = useState("1");
  const [bulkRate, setBulkRate] = useState("1");
  const [bulkCategoryId, setBulkCategoryId] = useState<number | undefined>(undefined);
  const [expirationMonths, setExpirationMonths] = useState(12);

  useEffect(() => {
    if (data) {
      setRegPoints(String(data.registrationPoints));
      setDefaultRate(String(data.defaultProductPointRate));
    }
  }, [data]);

  useMemo(() => {
    if (currentMonths !== undefined) setExpirationMonths(currentMonths);
  }, [currentMonths]);

  if (isLoading || expirationLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ポイント設定</h1>

      <div className="space-y-5">
        {/* ── 적립 설정 ── */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            ポイント付与設定
          </h2>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium block mb-1.5">会員登録ポイント</label>
              <p className="text-xs text-muted-foreground mb-2">新規会員登録時に自動で付与されるポイント</p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} value={regPoints} onChange={(e) => setRegPoints(e.target.value)} placeholder="0" className="w-28" />
                  <span className="text-sm text-muted-foreground">P</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1000, 2000, 5000, 10000].map((v) => (
                    <button key={v} type="button" onClick={() => setRegPoints(String(v))}
                      className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                        regPoints === String(v) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-accent"
                      }`}
                    >{v.toLocaleString()}</button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">商品ポイントの基本付与率</label>
              <p className="text-xs text-muted-foreground mb-2">新規登録される商品の基本ポイント付与率(%)</p>
              <div className="flex items-center gap-2 max-w-xs">
                <Input type="number" min={0} max={100} value={defaultRate} onChange={(e) => setDefaultRate(e.target.value)} className="w-28" />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <Button onClick={() => updateSettings.mutate({ registrationPoints: Number(regPoints) || 0, defaultProductPointRate: Number(defaultRate) || 0 })} disabled={updateSettings.isPending} size="sm">
              {updateSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              付与設定を保存
            </Button>
          </div>
        </div>

        {/* ── 일괄 변경 ── */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            商品ポイント付与率の一括変更
          </h2>
          <p className="text-xs text-muted-foreground mb-3">カテゴリー別または全商品のポイント付与率を一括で変更します。</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select className="border rounded px-2 py-1.5 text-sm bg-background w-full sm:w-40"
              value={bulkCategoryId ?? ""}
              onChange={(e) => setBulkCategoryId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">すべての商品</option>
              {(categories.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={100} value={bulkRate} onChange={(e) => setBulkRate(e.target.value)} className="w-20" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <Button variant="outline" size="sm"
              onClick={() => { if (!confirm(`${bulkCategoryId ? "選択したカテゴリーの" : "すべての"}商品のポイント付与率を${bulkRate}%に変更しますか？`)) return; bulkUpdate.mutate({ pointRate: Number(bulkRate) || 0, categoryId: bulkCategoryId }); }}
              disabled={bulkUpdate.isPending}
            >
              {bulkUpdate.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              一括変更
            </Button>
          </div>
        </div>

        {/* ── 만료 설정 ── */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            ポイント有効期限設定
          </h2>
          <p className="text-xs text-muted-foreground mb-4">ポイント付与後、自動的に失効するまでの期間を設定します。</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ポイント有効期間</label>
              <div className="flex items-center gap-2">
                <Input type="number" value={expirationMonths}
                  onChange={(e) => setExpirationMonths(Math.max(1, Math.min(120, Number(e.target.value))))}
                  className="w-28" min={1} max={120}
                />
                <span className="text-sm text-muted-foreground">か月</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ポイント付与日から{expirationMonths}か月後に自動的に失効します。
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1.5">適用例</p>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
                <p>• 2026年1月1日付与 → {new Date(new Date(2026, 0, 1).setMonth(expirationMonths)).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} 失効</p>
                <p>• 2026年6月15日付与 → {new Date(new Date(2026, 5, 15).setMonth(5 + expirationMonths)).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} 失効</p>
              </div>
            </div>

            <Button size="sm"
              onClick={() => { if (expirationMonths < 1 || expirationMonths > 120) { toast.error("有効期間は1〜120か月の範囲で設定してください。"); return; } setMonthsMut.mutate({ months: expirationMonths }); }}
              disabled={setMonthsMut.isPending}
            >
              {setMonthsMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              有効期限設定を保存
            </Button>
          </div>
        </div>

        {/* ── 수동 만료 / 알림 테스트 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border rounded-xl p-5">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              手動失効処理
            </h2>
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                <ul className="text-xs text-orange-700 dark:text-orange-400 space-y-0.5 list-disc list-inside">
                  <li>有効期限が過ぎたポイントを即時に差し引きます。</li>
                  <li>処理されたポイントは復元できません。</li>
                </ul>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full"
              onClick={() => { if (confirm("失効したポイントを今すぐ処理しますか？")) expirePointsMut.mutate(); }}
              disabled={expirePointsMut.isPending}
            >
              {expirePointsMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
              失効ポイントを今すぐ処理
            </Button>
          </div>

          <div className="bg-card border rounded-xl p-5">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              失効予定通知テスト
            </h2>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5 list-disc list-inside">
                <li>7日以内に失効予定のユーザーへ通知を送信</li>
                <li>毎日午前9時に自動実行</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" className="w-full"
              onClick={() => testNotificationMut.mutate()}
              disabled={testNotificationMut.isPending}
            >
              {testNotificationMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Bell className="w-4 h-4 mr-1" />}
              通知テストを実行
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
