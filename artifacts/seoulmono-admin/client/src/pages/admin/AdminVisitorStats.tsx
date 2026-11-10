import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, UserPlus, Repeat, Smartphone, Monitor, Tablet } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Paginator from "@/components/Paginator";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor className="w-4 h-4" />,
  mobile: <Smartphone className="w-4 h-4" />,
  tablet: <Tablet className="w-4 h-4" />,
};

const DEVICE_LABELS: Record<string, string> = {
  desktop: "데스킱",
  mobile: "모바일",
  tablet: "탭릿",
};

export default function AdminVisitorStats() {
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);
  const [logPage, setLogPage] = useState(1);
  const [logRange, setLogRange] = useState<{ start: string; end: string }>(() => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    return { start, end };
  });

  const { data: stats } = trpc.admin.visitorStats.useQuery({ days: periodDays });
  const { data: logs } = trpc.admin.visitorLogList.useQuery({
    start: logRange.start,
    end: logRange.end,
    page: logPage,
    limit: 50,
  });

  const summary = stats?.summary ?? { totalVisits: 0, uniqueVisitors: 0, newVisitors: 0, returningVisitors: 0 };

  const lineChartData = useMemo(() => {
    const daily = stats?.daily ?? [];
    return {
      labels: daily.map((d: any) => d.date.slice(5)),
      datasets: [
        {
          label: "총 방문 수",
          data: daily.map((d: any) => d.totalVisits),
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: "유니크 방문자",
          data: daily.map((d: any) => d.uniqueVisitors),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  }, [stats]);

  const pageChartData = useMemo(() => {
    const pages = (stats?.pages ?? []).slice(0, 10);
    return {
      labels: pages.map((p: any) => p.path.length > 20 ? p.path.slice(0, 20) + "..." : p.path),
      datasets: [
        {
          label: "방문 수",
          data: pages.map((p: any) => p.visits),
          backgroundColor: "#6366f1",
          borderRadius: 4,
        },
      ],
    };
  }, [stats]);

  const deviceChartData = useMemo(() => {
    const devices = stats?.devices ?? [];
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
    return {
      labels: devices.map((d: any) => DEVICE_LABELS[d.device] || d.device),
      datasets: [
        {
          data: devices.map((d: any) => d.count),
          backgroundColor: colors.slice(0, devices.length),
          borderWidth: 0,
        },
      ],
    };
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">접속자 통계</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={periodDays === d ? "default" : "outline"}
              onClick={() => setPeriodDays(d as any)}
            >
              {d}일
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-muted-foreground">총 방문</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalVisits.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">유니크 방문자</span>
          </div>
          <p className="text-2xl font-bold">{summary.uniqueVisitors.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">신규 방문자</span>
          </div>
          <p className="text-2xl font-bold">{summary.newVisitors.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">재방문자</span>
          </div>
          <p className="text-2xl font-bold">{summary.returningVisitors.toLocaleString()}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">일일 방문 트렌드</h3>
          <div className="h-64">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-4">인기 페이지 TOP 10</h3>
          <div className="h-64">
            <Bar
              data={pageChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">기기별 방문</h3>
          <div className="h-48 flex items-center justify-center">
            <Pie
              data={deviceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "right" } },
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {(stats?.devices ?? []).map((d: any) => (
              <div key={d.device} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {DEVICE_ICONS[d.device] || <Monitor className="w-4 h-4" />}
                  <span>{DEVICE_LABELS[d.device] || d.device}</span>
                </div>
                <span className="font-medium">{d.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Daily Table */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold mb-4">일자별 요약</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">날짜</th>
                  <th className="text-right py-2 px-2">총 방문</th>
                  <th className="text-right py-2 px-2">유니크</th>
                  <th className="text-right py-2 px-2">신규</th>
                  <th className="text-right py-2 px-2">재방문</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.daily ?? []).map((row: any, i: number) => (
                  <tr key={i} className="border-b border-muted/50 hover:bg-muted/30">
                    <td className="py-2 px-2">{row.date}</td>
                    <td className="text-right py-2 px-2 font-medium">{row.totalVisits.toLocaleString()}</td>
                    <td className="text-right py-2 px-2">{row.uniqueVisitors.toLocaleString()}</td>
                    <td className="text-right py-2 px-2 text-blue-600">{row.newVisitors.toLocaleString()}</td>
                    <td className="text-right py-2 px-2 text-amber-600">{row.returningVisitors.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Detailed Log Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">상세 로그</h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={logRange.start}
              onChange={(e) => setLogRange((r) => ({ ...r, start: e.target.value }))}
              className="border rounded px-2 py-1 text-sm"
            />
            <span className="text-muted-foreground">~</span>
            <input
              type="date"
              value={logRange.end}
              onChange={(e) => setLogRange((r) => ({ ...r, end: e.target.value }))}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">시간</th>
                <th className="text-left py-2 px-2">세션</th>
                <th className="text-left py-2 px-2">경로</th>
                <th className="text-left py-2 px-2">IP</th>
                <th className="text-left py-2 px-2">기기</th>
                <th className="text-left py-2 px-2">신규</th>
              </tr>
            </thead>
            <tbody>
              {(logs?.logs ?? []).map((log: any) => (
                <tr key={log.id} className="border-b border-muted/50 hover:bg-muted/30">
                  <td className="py-2 px-2 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="py-2 px-2 font-mono text-xs text-muted-foreground">{log.sessionId.slice(0, 12)}...</td>
                  <td className="py-2 px-2 max-w-[200px] truncate">{log.path}</td>
                  <td className="py-2 px-2 text-muted-foreground">{log.ip || "-"}</td>
                  <td className="py-2 px-2">
                    <Badge variant="outline" className="text-xs">
                      {DEVICE_LABELS[log.device] || log.device}
                    </Badge>
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant={log.isNew === "yes" ? "default" : "secondary"} className="text-xs">
                      {log.isNew === "yes" ? "신규" : "재방"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Paginator
            page={logPage}
            totalPages={Math.ceil((logs?.total ?? 0) / 50)}
            onPageChange={setLogPage}
          />
        </div>
      </Card>
    </div>
  );
}
