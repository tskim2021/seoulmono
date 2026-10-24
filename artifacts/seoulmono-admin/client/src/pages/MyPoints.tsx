import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDateTime } from "@/lib/utils";
import { Star, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function MyPoints() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const { data: profile } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const [page, setPage] = useState(1);
  const { data } = trpc.user.points.useQuery({ page, limit: 10 }, { enabled: isAuthenticated });
  const { data: expiringData } = trpc.user.expiringPoints.useQuery({ daysBeforeExpiration: 30 }, { enabled: isAuthenticated });

  return (
    <MyPageLayout title="ポイント">

        {/* 失効予定ポイント通知 */}
        {expiringData && expiringData.totalExpiring > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-1">
                  30日以内に失効予定のポイント
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  <strong className="font-bold">{expiringData.totalExpiring.toLocaleString()}P</strong>がまもなく失効します。
                  {expiringData.items.length > 0 && expiringData.items[0].expiresAt && (
                    <span className="ml-1">
                      (最短 {new Date(expiringData.items[0].expiresAt).toLocaleDateString('ja-JP')} 失効)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mb-8">
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Star className="w-5 h-5 text-primary" /></div>
              <span className="text-sm text-muted-foreground">保有ポイント</span>
            </div>
            <p className="text-3xl font-bold">{(profile?.points ?? 0).toLocaleString()}<span className="text-lg text-muted-foreground ml-1">P</span></p>
          </div>
        </div>

        {/* History */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4">ポイント履歴</h3>
          {(data?.history ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">ポイント履歴はありません</p>
          ) : (
            <div className="space-y-3">
              {data!.history.map(h => (
                <div key={h.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    {h.type === "earn" || h.type === "admin" || h.type === "refund" ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{h.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${h.type === "use" ? "text-destructive" : "text-emerald-600"}`}>
                    {h.type === "use" ? "-" : "+"}{Math.abs(h.amount).toLocaleString()}P
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          {(data?.total ?? 0) > 10 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {Math.ceil((data?.total ?? 0) / 10)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil((data?.total ?? 0) / 10)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
    </MyPageLayout>
  );
}
