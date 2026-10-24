import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime, formatOrderNumber } from "@/lib/utils";
import {
  Shield, AlertTriangle, RefreshCw, ExternalLink, Clock, Package, Loader2, Truck, ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminCustomsHold() {
  const { data: customsHoldList, isLoading, refetch } = trpc.shipping.adminCustomsHoldList.useQuery();
  const refreshMut = trpc.shipping.adminRefreshTracking.useMutation();
  const [refreshingIds, setRefreshingIds] = useState<Set<number>>(new Set());

  const handleRefresh = async (orderId: number) => {
    setRefreshingIds(prev => new Set(prev).add(orderId));
    try {
      const result = await refreshMut.mutateAsync({ orderId });
      if (result.success) {
        toast.success(`配送情報を更新しました。(${result.eventsCount}件追加)`);
        refetch();
      } else {
        toast.error(result.message || "配送情報を取得できません。");
      }
    } catch (e: any) {
      toast.error(e.message || "再読み込みに失敗しました");
    } finally {
      setRefreshingIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleRefreshAll = async () => {
    if (!customsHoldList || customsHoldList.length === 0) return;
    toast.info("すべての通関検査注文を再読み込みします...");
    for (const item of customsHoldList) {
      await handleRefresh(item.orderId);
      // 1초 간격으로 요청 (우체국 사이트 부하 방지)
      await new Promise(r => setTimeout(r, 1000));
    }
    toast.success("すべての通関検査注文の再読み込みが完了しました");
  };

  const getDaysHeld = (customsHoldAt: string | Date | null) => {
    if (!customsHoldAt) return null;
    const holdDate = new Date(customsHoldAt);
    const now = new Date();
    const diffMs = now.getTime() - holdDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const getDaysHeldColor = (days: number | null) => {
    if (days === null) return "text-muted-foreground";
    if (days >= 14) return "text-red-600 font-bold";
    if (days >= 7) return "text-orange-500 font-semibold";
    return "text-yellow-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const holdCount = customsHoldList?.length || 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            通関検査状況
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            通関検査で留め置かれている注文をリアルタイムで監視します
          </p>
        </div>
        <Button onClick={handleRefreshAll} variant="outline" className="gap-2" disabled={holdCount === 0}>
          <RefreshCw className="w-4 h-4" />
          すべて再読み込み
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">通関検査待ち</p>
                <p className="text-2xl font-bold">{holdCount}件</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">7日以上滞留</p>
                <p className="text-2xl font-bold">
                  {customsHoldList?.filter(item => {
                    const days = getDaysHeld(item.customsHoldAt);
                    return days !== null && days >= 7;
                  }).length || 0}件
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">14日以上滞留</p>
                <p className="text-2xl font-bold text-red-600">
                  {customsHoldList?.filter(item => {
                    const days = getDaysHeld(item.customsHoldAt);
                    return days !== null && days >= 14;
                  }).length || 0}件
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 통관검사 목록 */}
      {holdCount === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">通関検査待ちの注文はありません</h3>
            <p className="text-sm text-muted-foreground mt-1">
              すべての注文が正常に通関処理されています
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {customsHoldList?.map((item) => {
            const daysHeld = getDaysHeld(item.customsHoldAt);
            const isRefreshing = refreshingIds.has(item.orderId);

            return (
              <Card key={item.shipmentId} className="border-l-4 border-l-red-500">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* 왼쪽: 주문 정보 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link href={`/admin/orders/${item.orderId}`}>
                          <span className="font-semibold text-primary hover:underline cursor-pointer">
                            {formatOrderNumber(item.orderNumber)}
                          </span>
                        </Link>
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          通関検査待ち
                        </Badge>
                        {daysHeld !== null && (
                          <span className={`text-sm ${getDaysHeldColor(daysHeld)}`}>
                            {daysHeld}日目の滞留中
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">追跡番号: </span>
                          <span className="font-mono font-medium">{item.trackingNumber}</span>
                        </div>
                        {item.customsOffice && (
                          <div>
                            <span className="text-muted-foreground">税関: </span>
                            <span className="font-medium text-red-600">{item.customsOffice}</span>
                          </div>
                        )}
                        {item.customsNumber && (
                          <div>
                            <span className="text-muted-foreground">通関番号: </span>
                            <span className="font-mono font-bold text-red-600">{item.customsNumber}</span>
                          </div>
                        )}
                        {item.customsHoldAt && (
                          <div>
                            <span className="text-muted-foreground">検査開始日: </span>
                            <span>{formatDateTime(item.customsHoldAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* 주문 상품 정보 */}
                      {item.items && item.items.length > 0 && (
                        <div className="text-sm bg-muted/50 rounded-lg p-3">
                          <span className="text-muted-foreground">注文商品: </span>
                          {item.items.map((orderItem: any, idx: number) => (
                            <span key={idx}>
                              {orderItem.productName}
                              {orderItem.quantity > 1 && ` x${orderItem.quantity}`}
                              {idx < item.items.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 주문자 정보 */}
                      {item.userName && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">注文者: </span>
                          <span>{item.userName}</span>
                          {item.userEmail && (
                            <span className="text-muted-foreground ml-2">({item.userEmail})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 오른쪽: 액션 버튼 */}
                    <div className="flex flex-col gap-2 lg:min-w-[160px]">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleRefresh(item.orderId)}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        再読み込み
                      </Button>
                      <Link href={`/admin/orders/${item.orderId}`}>
                        <Button size="sm" variant="outline" className="gap-2 w-full">
                          <Package className="w-4 h-4" />
                          注文詳細
                        </Button>
                      </Link>
                      <a
                        href={`https://service.epost.go.kr/trace.RetrieveEmsRigiTraceList.comm?POST_CODE=${item.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline" className="gap-2 w-full">
                          <ExternalLink className="w-4 h-4" />
                          郵便局で追跡
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 안내 */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">通関検査のご案内</h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• 通関検査待ちの状態は、郵便局サイトを直接クロールして検知します。</li>
            <li>• 「인천공항본부세관 통관번호:XXXXXX」形式の赤色表示が検知されると、自動的に通関検査の状態に切り替わります。</li>
            <li>• 配送同期スケジューラーが定期的に自動確認しますが、手動で再読み込みすることもできます。</li>
            <li>• 通関検査が検知されると、管理者に通知が送信されます。</li>
            <li>• 14日以上滞留した場合は、税関へ直接お問い合わせください。</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
