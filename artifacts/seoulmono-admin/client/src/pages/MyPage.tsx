import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getOrderStatusLabel, getOrderStatusColor, formatDate, formatOrderNumber } from "@/lib/utils";
import { Package, Star, Pencil, Gift, ShoppingBag, Ticket, Heart } from "lucide-react";
import { Link } from "wouter";
import { useSEO } from "@/hooks/useSEO";

export default function MyPage() {
  useSEO({ title: "マイページ", description: "アカウント情報、注文履歴、ポイント、クーポンの管理", noindex: true });
  const { isAuthenticated } = useAuth();
  const { data: profile } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: ordersData } = trpc.order.myOrders.useQuery({ page: 1, limit: 5 }, { enabled: isAuthenticated });
  const { data: reviewPending } = trpc.order.pendingReviews.useQuery(undefined, { enabled: isAuthenticated });
  const { data: pointSettings } = trpc.community.reviewPointSettings.useQuery();
  const { data: myCoupons } = trpc.coupon.myCoupons.useQuery(undefined, { enabled: isAuthenticated });
  const { data: wishlist } = trpc.wishlist.list.useQuery(undefined, { enabled: isAuthenticated });

  const textPoints = pointSettings?.pointsPerReview ?? 100;
  const photoPoints = pointSettings?.pointsPerPhotoReview ?? 200;
  const isPointEnabled = pointSettings?.isActive === 1;
  const totalPossiblePoints = textPoints + photoPoints;
  const activeCoupons = (myCoupons ?? []).filter((c: any) => !c.usedAt).length;

  return (
    <MyPageLayout>
      <h1 className="text-2xl font-bold mb-6">マイページ</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/mypage/orders">
          <div className="bg-card border rounded-xl p-4 hover:elegant-shadow transition-all text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{ordersData?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">注文</p>
          </div>
        </Link>
        <Link href="/mypage/points">
          <div className="bg-card border rounded-xl p-4 hover:elegant-shadow transition-all text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{(profile?.points ?? 0).toLocaleString()}<span className="text-sm font-normal">P</span></p>
            <p className="text-xs text-muted-foreground mt-1">ポイント</p>
          </div>
        </Link>
        <Link href="/mypage/coupons">
          <div className="bg-card border rounded-xl p-4 hover:elegant-shadow transition-all text-center">
            <Ticket className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">{activeCoupons}</p>
            <p className="text-xs text-muted-foreground mt-1">クーポン</p>
          </div>
        </Link>
        <Link href="/wishlist">
          <div className="bg-card border rounded-xl p-4 hover:elegant-shadow transition-all text-center">
            <Heart className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <p className="text-2xl font-bold">{wishlist?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">お気に入り</p>
          </div>
        </Link>
      </div>

      {(reviewPending ?? []).length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-200">レビュー投稿待ち</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {isPointEnabled ? (
                    <>レビュー投稿で最大 <strong>{totalPossiblePoints.toLocaleString()}P</strong> 獲得！</>
                  ) : "ご購入商品のレビューをお寄せください"}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300">
              {reviewPending!.length}件
            </Badge>
          </div>
          <div className="space-y-2">
            {reviewPending!.slice(0, 3).map((order: any) => (
              <div key={order.orderId} className="bg-white/80 dark:bg-card/80 backdrop-blur rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">注文番号: {formatOrderNumber(order.orderNumber)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)} · {formatPrice(order.totalAmount)}</p>
                  {isPointEnabled && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Gift className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">テキスト {textPoints}P + フォト {photoPoints}P</span>
                    </div>
                  )}
                </div>
                <Link href={`/mypage/orders/${order.orderId}`}>
                  <Button size="sm" className="text-xs h-7 gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 flex-shrink-0">
                    <Star className="w-3 h-3" />レビューを書く
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">最近の注文</h3>
          <Link href="/mypage/orders" className="text-sm text-primary hover:underline">すべて見る</Link>
        </div>
        {(ordersData?.orders ?? []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">注文履歴はありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ordersData!.orders.map(order => (
              <Link key={order.id} href={`/mypage/orders/${order.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{formatOrderNumber(order.orderNumber)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusColor(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                    <p className="text-sm font-bold mt-1 price-text">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MyPageLayout>
  );
}
