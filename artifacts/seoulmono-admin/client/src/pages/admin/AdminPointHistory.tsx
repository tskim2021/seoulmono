import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime, formatOrderNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Search } from "lucide-react";
import Paginator from "@/components/Paginator";

export default function AdminPointHistory() {
  const [page, setPage] = useState(1);
  const [userEmail, setUserEmail] = useState<string>("");
  const [type, setType] = useState<"earn" | "use" | "admin" | "refund" | "all">("all");
  const limit = 20;

  const { data, isLoading } = trpc.user.adminPointHistory.useQuery({
    userEmail: userEmail ? userEmail : undefined,
    type: type === "all" ? undefined : type,
    page,
    limit,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  const getTypeLabel = (t: string) => {
    switch (t) {
      case "earn": return "적립";
      case "use": return "사용";
      case "admin": return "관리자 지급";
      case "refund": return "환불";
      default: return t;
    }
  };

  const getTypeBadgeVariant = (t: string) => {
    switch (t) {
      case "earn": return "default";
      case "use": return "destructive";
      case "admin": return "secondary";
      case "refund": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ポイント履歴管理</h1>
        <p className="text-muted-foreground mt-2">全会員のポイント付与・使用履歴を確認できます。</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">会員メールアドレス</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="会員のメールアドレスを入力"
                  value={userEmail}
                  onChange={(e) => {
                    setUserEmail(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">種類</label>
              <Select value={type} onValueChange={(v: any) => { setType(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="earn">付与</SelectItem>
                  <SelectItem value="use">使用</SelectItem>
                  <SelectItem value="admin">管理者付与</SelectItem>
                  <SelectItem value="refund">返金</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setUserEmail("");
                  setType("all");
                  setPage(1);
                }}
                className="w-full"
              >
                초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">포인트 내역 ({data?.total ?? 0}건)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
          ) : (data?.history ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">該当する履歴がありません</div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">会員</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">種類</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">説明</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">ポイント</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">注文番号</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.history.map((h) => (
                      <tr key={h.id} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-3 px-4 text-sm">{h.id}</td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-medium">{h.userName ?? "알 수 없음"}</p>
                            <p className="text-xs text-muted-foreground">ID: {h.userId}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getTypeBadgeVariant(h.type) as any}>
                            {getTypeLabel(h.type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">{h.description}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {h.amount < 0 ? (
                              <TrendingDown className="w-4 h-4 text-destructive" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-emerald-500" />
                            )}
                            <span className={`font-bold ${h.amount < 0 ? "text-destructive" : "text-emerald-600"}`}>
                              {h.amount < 0 ? "-" : "+"}{Math.abs(h.amount).toLocaleString()}P
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {h.orderNumber ? `#${formatOrderNumber(h.orderNumber)}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDateTime(h.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data!.history.map((h) => (
                  <div key={h.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{h.userName ?? "알 수 없음"}</p>
                        <p className="text-xs text-muted-foreground">ID: {h.userId}</p>
                      </div>
                      <Badge variant={getTypeBadgeVariant(h.type) as any}>
                        {getTypeLabel(h.type)}
                      </Badge>
                    </div>
                    <p className="text-sm">{h.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1">
                        {h.amount < 0 ? (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className={`font-bold ${h.amount < 0 ? "text-destructive" : "text-emerald-600"}`}>
                          {h.amount < 0 ? "-" : "+"}{Math.abs(h.amount).toLocaleString()}P
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(h.createdAt)}
                      </span>
                    </div>
                    {h.orderNumber && (
                      <p className="text-xs text-muted-foreground">주문번호: #{formatOrderNumber(h.orderNumber)}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="pt-4 border-t">
                <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
