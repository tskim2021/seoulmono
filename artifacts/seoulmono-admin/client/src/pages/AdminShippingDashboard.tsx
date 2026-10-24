import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatOrderNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Package, Truck, CheckCircle, AlertCircle, RefreshCw, ShieldAlert, Clock, Play, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const INTERVAL_OPTIONS = [
  { value: 1, label: "毎時" },
  { value: 2, label: "2時間" },
  { value: 3, label: "3時間" },
  { value: 6, label: "6時間" },
  { value: 12, label: "12時間" },
  { value: 24, label: "24時間 (1日)" },
  { value: 48, label: "48時間 (2日)" },
];

export default function AdminShippingDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [syncRunning, setSyncRunning] = useState(false);
  
  // 배송 현황 요약 조회
  const { data: summary, refetch } = trpc.admin.shippingSummary.useQuery();
  const { data: delayedShipments } = trpc.admin.delayedShipments.useQuery({ daysThreshold: 3 });
  const { data: carrierPerformance } = trpc.admin.shippingPerformanceByCarrier.useQuery();
  const { data: regionPerformance } = trpc.admin.shippingPerformanceByRegion.useQuery();
  const { data: monthlyStats } = trpc.admin.monthlyShippingStats.useQuery({ months: 6 });
  
  // 스케줄러 설정 조회
  const { data: schedulerConfig, refetch: refetchConfig } = trpc.shipping.getSchedulerConfig.useQuery();
  const updateScheduler = trpc.shipping.updateSchedulerConfig.useMutation({
    onSuccess: (data) => {
      refetchConfig();
      toast.success("スケジューラー設定を保存しました。");
    },
    onError: () => toast.error("スケジューラー設定の変更に失敗しました。"),
  });
  const runSyncNow = trpc.shipping.runSyncNow.useMutation({
    onSuccess: (data) => {
      refetchConfig();
      refetch();
      setSyncRunning(false);
      const r = data.result;
      toast.success(`배송 동기화 완료: ${r.syncedCount}건 성공, ${r.failedCount}건 실패 (${r.total}건 중)`);
    },
    onError: () => {
      setSyncRunning(false);
      toast.error("配送同期の実行に失敗しました。");
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast.success("配送状況を更新しました。");
  };

  const handleRunSyncNow = () => {
    setSyncRunning(true);
    runSyncNow.mutate();
  };

  const handleToggleEnabled = (enabled: boolean) => {
    updateScheduler.mutate({ enabled });
  };

  const handleChangeInterval = (hours: number) => {
    updateScheduler.mutate({ intervalHours: hours });
  };

  const lastRunResult = schedulerConfig?.lastRunResult ? (() => {
    try { return JSON.parse(schedulerConfig.lastRunResult); } catch { return null; }
  })() : null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">配送状況ダッシュボード</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>
      
      {/* 배송 현황 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">配送準備中</p>
              <p className="text-3xl font-bold mt-2">{summary?.pending ?? 0}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">配送中</p>
              <p className="text-3xl font-bold mt-2">{summary?.inTransit ?? 0}</p>
            </div>
            <Truck className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6 border-rose-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-600">通関検査待ち</p>
              <p className="text-3xl font-bold mt-2 text-rose-600">{summary?.customsHold ?? 0}</p>
            </div>
            <ShieldAlert className="w-10 h-10 text-rose-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">配送完了</p>
              <p className="text-3xl font-bold mt-2">{summary?.delivered ?? 0}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">配送失敗・遅延</p>
              <p className="text-3xl font-bold mt-2">{summary?.failed ?? 0}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </Card>
      </div>
      
      {/* 배송 지연 알림 */}
      {delayedShipments && delayedShipments.length > 0 && (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-orange-900">배송 지연 주문 ({delayedShipments.length}건)</h2>
          </div>
          <p className="text-sm text-orange-700 mb-4">3日以上配送準備中の注文があります。ご確認ください。</p>
          <div className="space-y-2">
            {delayedShipments.map((shipment: any) => (
              <div key={shipment.id} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">注文番号: {formatOrderNumber(shipment.orderNumber)}</p>
                  <p className="text-xs text-muted-foreground">고객: {shipment.user?.name} ({shipment.user?.email})</p>
                  <p className="text-xs text-muted-foreground">운송장: {shipment.trackingNumber || "미등록"}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                    {shipment.delayedDays}일 지연
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* 배송 성과 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 국제배송 성과 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">国際配送の実績</h2>
          {carrierPerformance && carrierPerformance.length > 0 ? (
            <div className="space-y-3">
              {carrierPerformance.map((carrier: any) => (
                <div key={carrier.carrierId} className="border-b pb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{carrier.carrierName}</span>
                    <span className="text-sm text-muted-foreground">총 {carrier.totalShipments}건</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">成功率</p>
                      <p className="font-medium">{carrier.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">平均配送日数</p>
                      <p className="font-medium">{carrier.avgDeliveryDays ? `${Number(carrier.avgDeliveryDays).toFixed(1)}일` : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">配達完了</p>
                      <p className="font-medium">{carrier.deliveredShipments}건</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">データがありません。</p>
          )}
        </Card>
        
        {/* 국가별 배송 소요 시간 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">国別の配送所要時間</h2>
          {regionPerformance && regionPerformance.length > 0 ? (
            <div className="space-y-3">
              {regionPerformance.map((region: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">{region.region}</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">{region.avgDeliveryDays ? `${Number(region.avgDeliveryDays).toFixed(1)}일` : "N/A"}</p>
                    <p className="text-xs text-muted-foreground">{region.totalShipments}건</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">データがありません。</p>
          )}
        </Card>
      </div>
      
      {/* 월별 배송 실적 */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">月別配送実績 (直近6か月)</h2>
        {monthlyStats && monthlyStats.length > 0 ? (
          <>
            {/* 차트 */}
            <div className="mb-6">
              <Line
                data={{
                  labels: monthlyStats.map((stat: any) => stat.month),
                  datasets: [
                    {
                      label: "配達完了",
                      data: monthlyStats.map((stat: any) => stat.delivered),
                      borderColor: "rgb(34, 197, 94)",
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: "配送中",
                      data: monthlyStats.map((stat: any) => stat.inTransit),
                      borderColor: "rgb(249, 115, 22)",
                      backgroundColor: "rgba(249, 115, 22, 0.1)",
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: "失敗",
                      data: monthlyStats.map((stat: any) => stat.failed),
                      borderColor: "rgb(239, 68, 68)",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  aspectRatio: 2.5,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                    tooltip: {
                      mode: "index" as const,
                      intersect: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </div>
            {/* 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">月</th>
                    <th className="text-right py-2">配送合計</th>
                    <th className="text-right py-2">配達完了</th>
                    <th className="text-right py-2">配送中</th>
                    <th className="text-right py-2">失敗</th>
                    <th className="text-right py-2">成功率</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((stat: any) => (
                    <tr key={stat.month} className="border-b">
                      <td className="py-2">{stat.month}</td>
                      <td className="text-right">{stat.totalShipments}</td>
                      <td className="text-right">{stat.delivered}</td>
                      <td className="text-right">{stat.inTransit}</td>
                      <td className="text-right">{stat.failed}</td>
                      <td className="text-right">{((stat.delivered / stat.totalShipments) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">データがありません。</p>
        )}
      </Card>
      
      {/* 배송 동기화 스케줄러 설정 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">配送同期スケジューラー</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          17track API를 통해 배송 상태를 자동으로 새로고침하는 주기를 설정합니다. 배송 완료, 통관검사 등의 상태 변경이 감지되면 고객에게 자동으로 알림과 이메일이 발송됩니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 활성화 토글 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">自動同期</h3>
            <div className="flex items-center gap-3">
              <Switch
                checked={schedulerConfig?.enabled ?? true}
                onCheckedChange={handleToggleEnabled}
                disabled={updateScheduler.isPending}
              />
              <span className={`text-sm font-medium ${schedulerConfig?.enabled !== false ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {schedulerConfig?.enabled !== false ? "有効化" : "無効化"}
              </span>
            </div>
          </div>

          {/* 동기화 주기 선택 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">同期間隔</h3>
            <div className="flex flex-wrap gap-2">
              {INTERVAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleChangeInterval(opt.value)}
                  disabled={updateScheduler.isPending || schedulerConfig?.enabled === false}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    (schedulerConfig?.intervalHours ?? 12) === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  } ${schedulerConfig?.enabled === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 수동 실행 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">手動実行</h3>
            <Button
              onClick={handleRunSyncNow}
              disabled={syncRunning}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Play className={`w-3.5 h-3.5 ${syncRunning ? 'animate-pulse' : ''}`} />
              {syncRunning ? "同期中..." : "今すぐ実行"}
            </Button>
          </div>
        </div>

        {/* 마지막 실행 정보 */}
        {schedulerConfig?.lastRunAt && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">最終実行:</span>
              <span className="font-medium">
                {new Date(schedulerConfig.lastRunAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
              </span>
              {lastRunResult && (
                <span className="text-xs text-muted-foreground ml-2">
                  (성공 {lastRunResult.syncedCount}건 / 실패 {lastRunResult.failedCount}건 / 총 {lastRunResult.total}건)
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* 최근 배송 목록 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">最近の配送一覧</h2>
        {summary?.recentShipments && summary.recentShipments.length > 0 ? (
          <div className="space-y-3">
            {summary.recentShipments.map((shipment: any) => (
              <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">注文番号: {formatOrderNumber(shipment.orderNumber)}</p>
                  <p className="text-sm text-muted-foreground">운송장: {shipment.trackingNumber}</p>
                  <p className="text-xs text-muted-foreground">{shipment.carrier?.name}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    shipment.status === "delivered" ? "bg-green-100 text-green-800" :
                    shipment.status === "out_for_delivery" ? "bg-blue-100 text-blue-800" :
                    shipment.status === "in_transit" ? "bg-orange-100 text-orange-800" :
                    shipment.status === "import_customs" ? "bg-rose-100 text-rose-700" :
                    shipment.status === "customs_departure" ? "bg-amber-100 text-amber-800" :
                    shipment.status === "customs_arrival" ? "bg-amber-100 text-amber-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {shipment.status === "delivered" ? "配達完了" :
                     shipment.status === "out_for_delivery" ? "현지배송" :
                     shipment.status === "in_transit" || shipment.status === "in_transit_intl" ? "국제운송" :
                     shipment.status === "export_customs" ? "출발국 통관" :
                     shipment.status === "import_customs" ? "도착국 통관" :
                     shipment.status === "customs_cleared" ? "통관완료" :
                     (shipment.status === "picked_up" || shipment.status === "accepted") ? "접수" :
                     "배송준비"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">配送履歴がありません。</p>
        )}
      </Card>
    </div>
  );
}
