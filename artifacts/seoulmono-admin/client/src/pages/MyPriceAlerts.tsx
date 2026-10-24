import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, proxyImage, productHref, formatDateTime } from "@/lib/utils";
import { TrendingDown, TrendingUp, Trash2, Bell, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";

export default function MyPriceAlerts() {
  useSEO({ title: "価格アラート", description: "気になる商品の価格変動通知", noindex: true });
  const { isAuthenticated, loading } = useAuth();
  const { data: alerts, refetch } = trpc.priceAlert.list.useQuery(undefined, { enabled: isAuthenticated });
  const deleteMutation = trpc.priceAlert.delete.useMutation({
    onSuccess: () => {
      toast.success("価格アラートを削除しました");
      refetch();
    },
  });

  if (!loading && !isAuthenticated) {
    return (
      <MyPageLayout title="価格アラート">
        <div className="text-center py-20">
          <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold mb-2">ログインが必要です</h2>
          <Button asChild className="mt-4"><a href={getLoginUrl()}>ログイン</a></Button>
        </div>
      </MyPageLayout>
    );
  }

  return (
    <MyPageLayout title="価格アラート">
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <Bell className="w-4 h-4 inline mr-1" />
          お気に入りに入れた商品の価格が変動すると（値上げ・値下げとも）このページに表示されます。
        </p>
      </div>

      {(alerts ?? []).length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-semibold mb-2">登録された価格アラートはありません</h3>
          <p className="text-sm text-muted-foreground mb-4">
            お気に入りに商品を追加すると、価格変動時に自動でアラートが登録されます
          </p>
          <Link href="/wishlist">
            <Button>お気に入りを見る</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(alerts as any[]).map((alert) => {
            const currentPrice = alert.product?.salePrice || alert.product?.price || 0;
            const hasChanged = !!alert.changedAt;
            const isDown = alert.changeDirection === 'down';
            const isUp = alert.changeDirection === 'up';

            return (
              <div key={alert.id} className={`bg-card border rounded-xl p-5 transition-all hover:shadow-md ${hasChanged ? (isDown ? "border-emerald-200 dark:border-emerald-800" : "border-rose-200 dark:border-rose-800") : ""}`}>
                <div className="flex gap-4">
                  <Link href={productHref(alert.product?.slug)} className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                      {alert.product?.thumbnail ? (
                        <img src={proxyImage(alert.product.thumbnail)} alt={alert.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2 flex-wrap">
                      <Link href={productHref(alert.product?.slug)}>
                        <h3 className="font-semibold text-base hover:text-primary transition-colors line-clamp-1">
                          {alert.product?.name || "商品情報なし"}
                        </h3>
                      </Link>
                      {hasChanged && isDown && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs shrink-0">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          値下げ
                        </Badge>
                      )}
                      {hasChanged && isUp && (
                        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-0 text-xs shrink-0">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          値上げ
                        </Badge>
                      )}
                    </div>

                    {hasChanged && alert.previousPrice ? (
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(alert.previousPrice)}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-lg font-bold ${isDown ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {formatPrice(currentPrice)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">現在価格:</span>
                        <span className="text-lg font-bold price-text">{formatPrice(currentPrice)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>登録時の価格: <span className="font-medium text-foreground">{formatPrice(alert.originalPrice)}</span></span>
                      {hasChanged && alert.changedAt && (
                        <span>変動日: <span className="font-medium text-foreground">{formatDateTime(alert.changedAt)}</span></span>
                      )}
                      {!hasChanged && (
                        <span className="text-muted-foreground">変動なし</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate({ id: alert.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MyPageLayout>
  );
}
