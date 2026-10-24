import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ClipboardList, Search, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import Paginator from "@/components/Paginator";

const ACTION_LABELS: Record<string, string> = {
  "order.updateStatus": "注文ステータス変更",
  "order.bulkUpdateStatus": "注文ステータス一括変更",
  "order.partialCancel": "一部キャンセル",
  "order.markRefunded": "返金完了",
  "order.markItemRefunded": "商品返金完了",
  "order.markItemRefundPending": "返金待ち",
  "order.updateAdminNotes": "注文メモ編集",
  "payment.confirm": "入金確認",
  "user.update": "会員情報編集",
  "user.addPoints": "ポイント付与/減算",
};

const ENTITY_LABELS: Record<string, string> = {
  order: "注文",
  orderItem: "注文商品",
  user: "会員",
};

const ACTION_COLORS: Record<string, string> = {
  "order.updateStatus": "bg-blue-100 text-blue-800",
  "order.bulkUpdateStatus": "bg-indigo-100 text-indigo-800",
  "order.partialCancel": "bg-orange-100 text-orange-800",
  "order.markRefunded": "bg-red-100 text-red-800",
  "order.markItemRefunded": "bg-red-100 text-red-800",
  "order.markItemRefundPending": "bg-yellow-100 text-yellow-800",
  "order.updateAdminNotes": "bg-gray-100 text-gray-800",
  "payment.confirm": "bg-green-100 text-green-800",
  "user.update": "bg-purple-100 text-purple-800",
  "user.addPoints": "bg-teal-100 text-teal-800",
};

export default function AdminActionLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");
  const [adminIdFilter, setAdminIdFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { data, isLoading, refetch } = trpc.adminLogs.list.useQuery({
    page,
    limit: 50,
    action: actionFilter !== "all" ? actionFilter : undefined,
    adminId: adminIdFilter !== "all" ? Number(adminIdFilter) : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo ? dateTo + "T23:59:59" : undefined,
  });

  const { data: admins } = trpc.adminLogs.adminList.useQuery();

  const totalPages = data ? Math.ceil(data.total / 50) : 0;

  const formatDate = (d: string | Date) => {
    const dt = new Date(d);
    return dt.toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            管理者操作履歴
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            管理者ごとの操作履歴 — 誰が、いつ、何を行ったかを確認します
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1" /> 再読み込み
        </Button>
      </div>

      {/* 필터 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="w-44">
            <Select value={adminIdFilter} onValueChange={v => { setAdminIdFilter(v); setPage(1); }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="管理者を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての管理者</SelectItem>
                {admins?.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-52">
            <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="操作の種類" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての操作</SelectItem>
                {Object.entries(ACTION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="date"
              className="h-8 text-xs w-36"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            />
            <span className="text-xs text-muted-foreground">~</span>
            <Input
              type="date"
              className="h-8 text-xs w-36"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
          {(actionFilter !== "all" || adminIdFilter !== "all" || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setActionFilter("all"); setAdminIdFilter("all"); setDateFrom(""); setDateTo(""); setPage(1); }}
            >
              フィルターをリセット
            </Button>
          )}
        </div>
      </Card>

      {/* 로그 테이블 */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">読み込み中...</div>
        ) : !data?.rows?.length ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <ClipboardList className="w-8 h-8 opacity-30" />
            <p className="text-sm">操作履歴がありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium w-40">操作日時</th>
                  <th className="px-4 py-2 text-left font-medium w-28">管理者</th>
                  <th className="px-4 py-2 text-left font-medium w-36">操作の種類</th>
                  <th className="px-4 py-2 text-left font-medium w-20">対象</th>
                  <th className="px-4 py-2 text-left font-medium">内容</th>
                  <th className="px-4 py-2 text-center font-medium w-14">詳細</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(row => (
                  <>
                    <tr key={row.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-medium text-xs">{row.adminName}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">{row.adminEmail ?? `#${row.adminId}`}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${ACTION_COLORS[row.action] || "bg-gray-100 text-gray-800"}`}>
                          {ACTION_LABELS[row.action] || row.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {ENTITY_LABELS[row.entityType] || row.entityType}
                        {row.entityId ? ` #${row.entityId}` : ""}
                      </td>
                      <td className="px-4 py-2 text-xs">{row.description}</td>
                      <td className="px-4 py-2 text-center">
                        {row.detail && (
                          <button
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                          >
                            {expandedRow === row.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedRow === row.id && row.detail && (
                      <tr key={`${row.id}-detail`} className="border-b bg-muted/10">
                        <td colSpan={6} className="px-4 py-2">
                          <pre className="text-[11px] text-muted-foreground overflow-x-auto bg-muted/30 rounded p-2">
                            {JSON.stringify(row.detail, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <Paginator currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
