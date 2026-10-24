import { useGetDashboard, customFetch } from "@workspace/api-client-react";
import { ja } from "../lib/ja";
import { Card, Badge } from "../components/ui";
import { formatCurrency, getStatusColor, cn } from "../lib/utils";
import { Users, Package, Clock, CheckCircle2, TrendingUp, Wallet, Building2, Bell, MessageSquare, UserCheck, Eye, MessageCircle, Trophy, ShoppingBag, Crown, BarChart2, TrendingDown, Search, CalendarRange, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── 날짜 유틸 ──────────────────────────────────────────────────────────────
function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
function getPreset(preset: string): { start: string; end: string } {
  const now = new Date();
  const today = toDateStr(now);
  if (preset === "오늘") return { start: today, end: today };
  if (preset === "어제") {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    const s = toDateStr(y); return { start: s, end: s };
  }
  if (preset === "이번주") {
    const day = now.getDay(); // 0=sun
    const diff = day === 0 ? 6 : day - 1; // Mon=0
    const mon = new Date(now); mon.setDate(now.getDate() - diff);
    return { start: toDateStr(mon), end: today };
  }
  if (preset === "지난주") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const mon = new Date(now); mon.setDate(now.getDate() - diff - 7);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: toDateStr(mon), end: toDateStr(sun) };
  }
  if (preset === "이번달") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toDateStr(first), end: today };
  }
  return { start: today, end: today };
}

// ── 매출통계 카드 ────────────────────────────────────────────────────────────
function SalesStatsCard() {
  const [activePreset, setActivePreset] = useState("이번달");
  const [range, setRange] = useState(() => getPreset("이번달"));
  const [customStart, setCustomStart] = useState(range.start);
  const [customEnd, setCustomEnd] = useState(range.end);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sales-stats", range.start, range.end],
    queryFn: () =>
      customFetch<any>(`/api/admin/sales-stats?start=${range.start}&end=${range.end}`),
    enabled: !!range.start && !!range.end,
  });

  const PRESETS = ["오늘", "어제", "이번주", "지난주", "이번달"];

  function applyPreset(p: string) {
    setActivePreset(p);
    const r = getPreset(p);
    setRange(r);
    setCustomStart(r.start);
    setCustomEnd(r.end);
  }

  function applyCustom() {
    if (!customStart || !customEnd) return;
    setActivePreset("");
    setRange({ start: customStart, end: customEnd });
  }

  const chartData = useMemo(() => (data?.by_day || []).map((d: any) => ({
    label: d.day.slice(5).replace("-", "/"),
    금액: Math.round(d.amount / 10000),
    건수: d.order_count,
  })), [data]);

  const StatBox = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <Card className="p-0 overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
          <CalendarRange className="w-5 h-5 text-emerald-600" />
          売上統計
        </h3>

        {/* 프리셋 버튼 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all",
                activePreset === p
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-600"
              )}
            >{ja(p)}</button>
          ))}
        </div>

        {/* 기간 검색 */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={e => { setCustomStart(e.target.value); setActivePreset(""); }}
            className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400 bg-white"
          />
          <span className="text-slate-400 text-xs font-bold shrink-0">~</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => { setCustomEnd(e.target.value); setActivePreset(""); }}
            className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400 bg-white"
          />
          <button
            onClick={applyCustom}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Search className="w-3 h-3" />照会
          </button>
        </div>
      </div>

      <div className="p-5 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">読み込み中...</div>
        ) : !data ? null : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatBox label="純売上 (キャンセル除く)" value={formatCurrency(data.net_amount)} sub={`${data.net_count}件`} color="bg-emerald-50" />
              <StatBox label="総注文件数" value={`${data.order_count}件`} sub={`キャンセル ${data.cancelled_count}件`} color="bg-blue-50" />
              <StatBox label="総決済金額" value={formatCurrency(data.total_amount)} color="bg-slate-50" />
              <StatBox label="購入顧客数" value={`${data.unique_customers}名`} color="bg-violet-50" />
            </div>

            {chartData.length > 0 && (
              <div className="mt-2">
                <p className="text-[11px] text-slate-400 font-bold mb-1 px-1">日別売上 (万円)</p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={chartData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }} barSize={chartData.length > 15 ? 6 : 12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      interval={chartData.length > 10 ? Math.ceil(chartData.length / 8) - 1 : 0} />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload, label }: any) =>
                        active && payload?.length ? (
                          <div className="bg-white border border-slate-200 rounded-lg shadow px-3 py-2 text-xs">
                            <p className="font-bold text-slate-600 mb-0.5">{label}</p>
                            <p className="text-emerald-600 font-bold">{payload[0]?.value?.toLocaleString()}万円</p>
                            <p className="text-slate-400">{payload[0]?.payload?.건수}件</p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="금액" fill="#059669" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

const RANK_COLORS = [
  { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", icon: "text-amber-500" },
  { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", icon: "text-slate-400" },
  { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", icon: "text-orange-400" },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-white font-black text-xs">1</span>;
  if (rank === 2) return <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-white font-black text-xs">2</span>;
  if (rank === 3) return <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-300 text-white font-black text-xs">3</span>;
  return <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">{rank}</span>;
}

export default function AdminDashboard() {
  const { data, isLoading } = useGetDashboard();
  const [buyerTab, setBuyerTab] = useState<"month" | "alltime">("month");
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="p-10 text-center text-slate-500">データを読み込み中...</div>;
  if (!data) return null;

  const stats = [
    { label: "新規注文受付", value: data.pending_orders, icon: Package, color: "bg-blue-500", light: "bg-blue-50", unit: "件", link: "/admin/orders?status=주문접수" },
    { label: "処理中/配送準備", value: data.processing_orders, icon: Clock, color: "bg-amber-500", light: "bg-amber-50", unit: "件", link: "/admin/orders?status=처리중" },
    { label: "配送完了", value: data.completed_orders, icon: CheckCircle2, color: "bg-emerald-500", light: "bg-emerald-50", unit: "件", link: "/admin/orders?status=배송완료" },
    { label: "承認待ち", value: data.pending_members, icon: UserCheck, color: "bg-purple-500", light: "bg-purple-50", unit: "件", link: "/admin/members" },
    { label: "未回答のお問い合わせ", value: data.unanswered_qna || 0, icon: MessageSquare, color: "bg-red-500", light: "bg-red-50", unit: "件", link: "/admin/qna" },
  ];

  const regionOrders: { city: string; count: number }[] = (data as any).region_orders || [];

  const CITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "포천": { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    "양주": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
    "동두천": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    "의정부": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">管理者ダッシュボード</h1>
        <p className="text-slate-500 mt-2 font-medium">全体の発注状況と取引先の状況を一目で確認できます。</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={idx}
              onClick={() => stat.link && setLocation(stat.link)}
              className={`p-5 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 ${stat.link ? "cursor-pointer" : ""}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.light}`}>
                <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <p className="text-slate-500 font-bold text-xs mb-0.5">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}<span className="text-sm text-slate-400 font-bold ml-1">{stat.unit}</span></p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── 特別地域の注文状況 ── */}
      {regionOrders.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-700">特別地域の注文状況</h2>
            <span className="text-xs text-slate-400">(累計)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {regionOrders.map(({ city, count }) => {
              const c = CITY_COLORS[city] || { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
              return (
                <Card
                  key={city}
                  onClick={() => setLocation(`/admin/orders?special_region=true&city=${encodeURIComponent(city)}`)}
                  className={`p-4 border-2 ${c.border} ${c.bg} cursor-pointer hover:-translate-y-1 transition-transform duration-300`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className={`w-3.5 h-3.5 ${c.text}`} />
                    <span className={`text-xs font-bold ${c.text}`}>{ja(city)}</span>
                  </div>
                  <p className={`text-2xl font-black ${c.text}`}>
                    {count.toLocaleString()}<span className="text-sm font-bold ml-1">件</span>
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 구매내역 · 회원가입 차트 섹션 ── */}
      {(() => {
        const monthlyOrders: { month: string; order_count: number; total_amount: number }[] =
          (data as any).monthly_orders || [];
        const monthlyMembers: { month: string; count: number }[] =
          (data as any).monthly_members || [];

        const orderChartData = monthlyOrders.map(d => ({
          label: d.month.slice(5) + "月",
          건수: d.order_count,
          금액: Math.round(d.total_amount / 10000),
        }));

        const memberChartData = monthlyMembers.map(d => ({
          label: d.month.slice(5) + "月",
          가입: d.count,
        }));

        const totalOrderAmount = monthlyOrders.reduce((s, d) => s + d.total_amount, 0);
        const totalOrderCount = monthlyOrders.reduce((s, d) => s + d.order_count, 0);
        const totalMemberCount = monthlyMembers.reduce((s, d) => s + d.count, 0);

        const CustomOrderTooltip = ({ active, payload, label }: any) => {
          if (!active || !payload?.length) return null;
          return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
              <p className="font-bold text-slate-700 mb-1">{label}</p>
              {payload.map((p: any) => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
                  {p.dataKey === "금액" ? `${p.value.toLocaleString()}万円` : `${p.value}件`}
                </p>
              ))}
            </div>
          );
        };

        const CustomMemberTooltip = ({ active, payload, label }: any) => {
          if (!active || !payload?.length) return null;
          return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
              <p className="font-bold text-slate-700 mb-1">{label}</p>
              <p className="font-semibold text-violet-600">新規登録 {payload[0]?.value}名</p>
            </div>
          );
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 구매내역 차트 */}
            <Card className="p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    購入履歴 (直近12か月)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">キャンセル・返品を除く</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">累計注文</p>
                  <p className="text-lg font-black text-slate-900">{totalOrderCount.toLocaleString()}<span className="text-xs text-slate-400 ml-1">件</span></p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(totalOrderAmount)}</p>
                </div>
              </div>
              {orderChartData.length === 0 ? (
                <div className="flex items-center justify-center h-52 text-slate-400 text-sm">データがありません</div>
              ) : (
                <div className="px-2 pt-4 pb-2">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={orderChartData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}件`} width={36} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}万`} width={36} />
                      <Tooltip content={<CustomOrderTooltip />} />
                      <Bar yAxisId="left" dataKey="건수" fill="#1D8A5A" radius={[4, 4, 0, 0]} maxBarSize={22} />
                      <Bar yAxisId="right" dataKey="금액" fill="#a7f3d0" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-5 mt-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-3 h-3 rounded-sm bg-[#1D8A5A] inline-block" />注文件数</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-3 h-3 rounded-sm bg-[#a7f3d0] inline-block" />決済金額(万円)</span>
                  </div>
                </div>
              )}
            </Card>

            {/* 회원가입 차트 */}
            <Card className="p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-500" />
                    会員登録履歴 (直近12か月)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">月別の新規登録者</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">期間内の登録</p>
                  <p className="text-lg font-black text-slate-900">{totalMemberCount.toLocaleString()}<span className="text-xs text-slate-400 ml-1">名</span></p>
                  <p className="text-sm font-bold text-violet-500">有効会員 計 {(data as any).total_members || 0}名</p>
                </div>
              </div>
              {memberChartData.length === 0 ? (
                <div className="flex items-center justify-center h-52 text-slate-400 text-sm">データがありません</div>
              ) : (
                <div className="px-2 pt-4 pb-2">
                  <ResponsiveContainer width="100%" height={210}>
                    <AreaChart data={memberChartData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}名`} width={36} allowDecimals={false} />
                      <Tooltip content={<CustomMemberTooltip />} />
                      <Area type="monotone" dataKey="가입" stroke="#7c3aed" strokeWidth={2.5} fill="url(#memberGrad)" dot={{ r: 3.5, fill: "#7c3aed", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#7c3aed" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center mt-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-3 h-3 rounded-sm bg-violet-500 inline-block" />月別の新規登録</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              最近の注文履歴
            </h3>
            <Link href="/admin/orders" className="text-sm font-bold text-primary hover:underline">すべて見る</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">注文番号</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">取引先</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">ステータス</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">決済金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_orders.slice(0, 5).map(order => (
                  <tr key={order.od_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">#{order.od_id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{order.company_name}</td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(order.od_status)}>{ja(order.od_status)}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{formatCurrency(order.od_receipt_price)}</td>
                  </tr>
                ))}
                {data.recent_orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500 font-medium">最近の注文はありません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <SalesStatsCard />
      </div>

      {/* ユーザー別購入ランキング */}
      <div className="mb-8">
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              ユーザー別購入ランキング
              <Badge className="bg-amber-100 text-amber-700 text-xs font-bold">
                {buyerTab === "month" ? (data as any).settlement_month : "全期間"}
              </Badge>
            </h3>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setBuyerTab("month")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${buyerTab === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                今月
              </button>
              <button
                onClick={() => setBuyerTab("alltime")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${buyerTab === "alltime" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                全期間
              </button>
            </div>
          </div>

          {(() => {
            const buyers = buyerTab === "month"
              ? ((data as any).top_buyers || [])
              : ((data as any).top_buyers_all_time || []);

            if (buyers.length === 0) {
              return (
                <div className="px-6 py-12 text-center text-slate-400 font-medium">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  {buyerTab === "month" ? "今月の注文履歴はありません。" : "注文履歴はありません。"}
                </div>
              );
            }

            const maxAmount = buyers[0]?.total_amount || 1;

            return (
              <div className="p-6">
                {/* 상위 3명 하이라이트 */}
                {buyers.length >= 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {[buyers[1], buyers[0], buyers[2]].map((b: any, idx: number) => {
                      if (!b) return <div key={idx} />;
                      const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                      const podiumH = rank === 1 ? "pt-0" : rank === 2 ? "pt-4" : "pt-6";
                      const colors = RANK_COLORS[rank - 1];
                      return (
                        <div key={b.mb_id} className={`flex flex-col items-center text-center ${podiumH}`}>
                          <div className={`relative w-16 h-16 rounded-2xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center mb-2`}>
                            {rank === 1 && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-amber-400" />}
                            <span className="text-2xl font-black text-slate-600">{(b.mb_name || b.mb_id || "?").slice(0, 1).toUpperCase()}</span>
                          </div>
                          <RankBadge rank={rank} />
                          <p className="text-sm font-bold text-slate-900 mt-1.5 truncate max-w-full">{b.mb_name || b.mb_id}</p>
                          {b.company_name && <p className="text-xs text-slate-400 truncate max-w-full">{b.company_name}</p>}
                          <p className={`text-base font-black mt-1 ${colors.text}`}>{formatCurrency(b.total_amount)}</p>
                          <p className="text-xs text-slate-400">注文 {b.order_count}件</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4위 이하 리스트 */}
                {buyers.length > 3 && (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-400 w-10 text-center">順位</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-400">会員</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-400 text-center hidden sm:table-cell">注文件数</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-400 text-right">購入金額</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-400 hidden md:table-cell" style={{ width: 160 }}></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {buyers.slice(3).map((b: any, idx: number) => {
                          const rank = idx + 4;
                          const pct = Math.round((b.total_amount / maxAmount) * 100);
                          return (
                            <tr key={b.mb_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 text-center"><RankBadge rank={rank} /></td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-bold text-slate-900">{b.mb_name || b.mb_id}</p>
                                {b.company_name && <p className="text-xs text-slate-400">{b.company_name}</p>}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-500 text-center hidden sm:table-cell">{b.order_count}件</td>
                              <td className="px-4 py-3 text-sm font-black text-slate-900 text-right">{formatCurrency(b.total_amount)}</td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                  <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              お知らせ
            </h3>
            <Link href="/notices" className="text-sm font-bold text-primary hover:underline">すべて見る</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recent_notices?.map((n: any) => (
              <Link key={n.wr_id} href="/notices" className="block px-6 py-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{n.wr_subject}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.wr_name} · {n.wr_datetime?.slice(0, 10)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{n.wr_hit}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{n.wr_comment}</span>
                  </div>
                </div>
              </Link>
            ))}
            {(!data.recent_notices || data.recent_notices.length === 0) && (
              <div className="px-6 py-10 text-center text-slate-500 font-medium">登録されたお知らせはありません。</div>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-500" />
              最近のお問い合わせ
              {(data.unanswered_qna || 0) > 0 && (
                <Badge className="bg-red-100 text-red-700 text-xs font-bold">未回答 {data.unanswered_qna}件</Badge>
              )}
            </h3>
            <Link href="/admin/qna" className="text-sm font-bold text-primary hover:underline">すべて見る</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recent_qna?.map((q: any) => (
              <Link key={q.wr_id} href={`/admin/qna/${q.wr_id}`} className="block px-6 py-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{q.wr_subject}</p>
                      {q.wr_comment === 0 && <Badge className="bg-red-100 text-red-600 text-[10px] shrink-0">未回答</Badge>}
                      {q.wr_comment > 0 && <Badge className="bg-emerald-100 text-emerald-600 text-[10px] shrink-0">回答済み</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {q.company_name || q.wr_name}{q.company_name ? ` (${q.wr_name})` : ""} · {q.wr_datetime?.slice(0, 10)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {(!data.recent_qna || data.recent_qna.length === 0) && (
              <div className="px-6 py-10 text-center text-slate-500 font-medium">登録されたお問い合わせはありません。</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
