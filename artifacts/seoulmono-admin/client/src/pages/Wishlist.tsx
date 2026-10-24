import MyPageLayout from "@/components/MyPageLayout";
import ProductCard from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, proxyImage, productHref, formatDateTime } from "@/lib/utils";
import { Heart, Bell, TrendingDown, TrendingUp, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";

export default function Wishlist() {
  useSEO({ title: "お気に入り", description: "気になる商品一覧", noindex: true });
  const { isAuthenticated, loading } = useAuth();

  const utils = trpc.useUtils();
  const { data: items, isLoading: wishLoading } = trpc.wishlist.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: alerts, refetch: refetchAlerts } = trpc.priceAlert.list.useQuery(undefined, { enabled: isAuthenticated });
  const deletePriceAlert = trpc.priceAlert.delete.useMutation({
    onSuccess: () => { toast.success("価格アラートを削除しました"); refetchAlerts(); },
  });
  const removeWishlist = trpc.wishlist.toggle.useMutation({
    onSuccess: () => { toast.success("お気に入りから削除しました"); utils.wishlist.list.invalidate(); },
  });

  if (!loading && !isAuthenticated) {
    return (
      <MyPageLayout title="お気に入り">
        <div className="text-center py-20">
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold mb-2">ログインが必要です</h2>
          <p className="text-muted-foreground text-sm mb-6">お気に入りをご利用になるにはログインしてください</p>
          <Button asChild><a href={getLoginUrl()}>ログイン</a></Button>
        </div>
      </MyPageLayout>
    );
  }

  const wishItems = items ?? [];
  const priceAlertList = (alerts as any[]) ?? [];
  const changedAlerts = priceAlertList.filter((a: any) => a.changedAt);

  return (
    <MyPageLayout title="お気に入り">
      <div className="space-y-8">

        {/* ── 위시리스트 ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">気になる商品</h2>
            {wishItems.length > 0 && <span className="text-xs text-muted-foreground">({wishItems.length}개)</span>}
          </div>

          {wishLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-secondary/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : wishItems.length === 0 ? (
            <div className="bg-card border rounded-xl p-10 text-center">
              <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="font-semibold mb-1">お気に入りは空です</p>
              <p className="text-muted-foreground text-sm mb-5">気に入った商品を保存してみましょう</p>
              <Button asChild variant="outline"><Link href="/products">買い物を続ける</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {wishItems.map(item => item.product && (
                <div key={item.id} className="relative group/card">
                  <ProductCard product={item.product} />
                  <button
                    onClick={() => removeWishlist.mutate({ productId: item.productId })}
                    disabled={removeWishlist.isPending}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-rose-50 disabled:opacity-50"
                    title="お気に入りから削除"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 가격 알림 ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">価格変動アラート</h2>
            {changedAlerts.length > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{changedAlerts.length}개 변동</Badge>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <Bell className="w-4 h-4 inline mr-1" />
              위시리스트에 담긴 상품의 가격이 변동되면(인상·인하 모두) 알림으로 안내해 드립니다.
            </p>
          </div>

          {changedAlerts.length === 0 ? (
            <div className="bg-card border rounded-xl p-10 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground">まだ価格が変動した商品はありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {changedAlerts.map((alert: any) => {
                const currentPrice = alert.product?.salePrice || alert.product?.price || 0;
                const hasChanged = !!alert.changedAt;
                const isDown = alert.changeDirection === "down";
                const isUp = alert.changeDirection === "up";
                return (
                  <div key={alert.id} className={`bg-card border rounded-xl p-5 transition-all hover:shadow-md ${hasChanged ? (isDown ? "border-emerald-200 dark:border-emerald-800" : "border-rose-200 dark:border-rose-800") : ""}`}>
                    <div className="flex gap-4">
                      <Link href={productHref(alert.product?.slug)} className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                          {alert.product?.thumbnail ? (
                            <img src={proxyImage(alert.product.thumbnail)} alt={alert.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-7 h-7 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                          <Link href={productHref(alert.product?.slug)}>
                            <h3 className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
                              {alert.product?.name || "상품 정보 없음"}
                            </h3>
                          </Link>
                          {hasChanged && isDown && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs shrink-0">
                              <TrendingDown className="w-3 h-3 mr-1" />가격 인하
                            </Badge>
                          )}
                          {hasChanged && isUp && (
                            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-0 text-xs shrink-0">
                              <TrendingUp className="w-3 h-3 mr-1" />가격 인상
                            </Badge>
                          )}
                        </div>
                        {hasChanged && alert.previousPrice ? (
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm text-muted-foreground line-through">{formatPrice(alert.previousPrice)}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className={`text-base font-bold ${isDown ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {formatPrice(currentPrice)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base font-bold price-text">{formatPrice(currentPrice)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span>登録時の価格: <span className="font-medium text-foreground">{formatPrice(alert.originalPrice)}</span></span>
                          {hasChanged && alert.changedAt && (
                            <span>変動日: <span className="font-medium text-foreground">{formatDateTime(alert.changedAt)}</span></span>
                          )}
                          {!hasChanged && <span>変動なし</span>}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => deletePriceAlert.mutate({ id: alert.id })} disabled={deletePriceAlert.isPending}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </MyPageLayout>
  );
}
