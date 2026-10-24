import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor, formatOrderNumber } from "@/lib/utils";
import { Package, ShoppingBag, Truck, CheckCircle2, FileText, Star, ImageOff, XCircle } from "lucide-react";
import Paginator from "@/components/Paginator";
import { Link } from "wouter";
import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { toast } from "sonner";



export default function MyOrders() {
  useSEO({ title: "注文履歴", description: "ご注文履歴をご確認ください。", noindex: true });
  useAuth({ redirectOnUnauthenticated: true });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading, refetch } = trpc.order.myOrders.useQuery({ page, limit: 10 });
  const totalPages = Math.ceil((data?.total ?? 0) / 10);
  const cancelOrder = trpc.order.cancel.useMutation({
    onSuccess: () => { toast.success("注文をキャンセルしました。"); refetch(); },
    onError: (err) => toast.error(err.message || "취소에 실패했습니다."),
  });

  const statusFilters = [
    { value: "all", label: "すべて" },
    { value: "pending", label: "入金前" },
    { value: "paid", label: "支払い済み" },
    { value: "shipping", label: "配送中" },
    { value: "delivered", label: "配送完了" },
  ];

  const filteredOrders = statusFilter === "all"
    ? (data?.orders ?? [])
    : (data?.orders ?? []).filter(o => o.status === statusFilter);

  return (
    <MyPageLayout title="注文履歴">

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right space-y-1.5">
                    <Skeleton className="h-5 w-16 ml-auto rounded-full" />
                    <Skeleton className="h-3.5 w-20 ml-auto" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg">
                  <Skeleton className="w-12 h-12 rounded-md shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-3/4" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Skeleton className="h-7 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">注文履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-card border rounded-xl p-5 hover:elegant-shadow transition-all">
                {/* Header: 주문번호 + 상태/금액 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${order.status === "shipping" ? "bg-blue-100 text-blue-600" : order.status === "delivered" ? "bg-emerald-100 text-emerald-600" : order.status === "customs_hold" ? "bg-rose-100 text-rose-600" : "bg-muted text-muted-foreground"}`}>
                      {order.status === "shipping" ? <Truck className="w-4 h-4" /> : order.status === "delivered" ? <CheckCircle2 className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{formatOrderNumber(order.orderNumber)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getOrderStatusColor(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                      {'hasCancelledItems' in order && order.hasCancelledItems && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getOrderStatusColor("partial_cancel")}`}>{getOrderStatusLabel("partial_cancel")}</span>
                      )}
                    </div>
                    <p className="text-sm font-bold price-text mt-1">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>

                {/* 대표 상품 정보 */}
                {'firstProductName' in order && order.firstProductName && (
                  <div className="flex items-center gap-3 mb-3 p-2.5 bg-muted/40 rounded-lg">
                    {/* 썸네일: 여러 상품이면 최대 3개까지 여백과 함께 표시 */}
                    <div className="flex items-center shrink-0" style={{ gap: '5px' }}>
                      {('productThumbnails' in order && Array.isArray(order.productThumbnails) && order.productThumbnails.length > 0
                        ? (order.productThumbnails as string[]).slice(0, 3)
                        : order.firstProductThumbnail ? [order.firstProductThumbnail as string] : []
                      ).map((thumb, idx) => (
                        <div
                          key={idx}
                          className="w-12 h-12 rounded-md border overflow-hidden bg-muted shrink-0"
                        >
                          <img
                            src={thumb}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      ))}
                      {!('productThumbnails' in order && Array.isArray(order.productThumbnails) && order.productThumbnails.length > 0) && !order.firstProductThumbnail && (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center border shrink-0">
                          <ImageOff className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      {'firstProductId' in order && order.firstProductId ? (
                        <Link href={`/products/${order.firstProductId}`} className="text-sm font-medium truncate block hover:text-primary hover:underline transition-colors">{order.firstProductName as string}</Link>
                      ) : (
                        <p className="text-sm font-medium truncate">{order.firstProductName as string}</p>
                      )}
                      {'itemCount' in order && Number(order.itemCount) > 1 && (
                        <p className="text-xs text-muted-foreground">외 {Number(order.itemCount) - 1}건</p>
                      )}
                    </div>
                  </div>
                )}


                {/* 환불 정보 */}
                {'totalRefundAmount' in order && (order.status === 'cancelled' || ('hasCancelledItems' in order && order.hasCancelledItems)) && (order as any).totalRefundAmount > 0 && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {(order as any).allRefunded ? (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">返金完了</span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">返金予定</span>
                      )}
                      {(order as any).firstRefundedAt && (
                        <span className="text-xs text-muted-foreground">{formatDate((order as any).firstRefundedAt)}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatPrice((order as any).totalRefundAmount)}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Link href={`/mypage/orders/${order.id}`}>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      <FileText className="w-3 h-3 mr-1" />
                      주문상세보기
                    </Button>
                  </Link>
                  {["pending", "paid", "preparing"].includes(order.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={order.status === "preparing" || cancelOrder.isPending}
                      onClick={() => {
                        if (!confirm("주문을 취소하시겠습니까?")) return;
                        cancelOrder.mutate({ orderId: order.id });
                      }}
                      title={order.status === "preparing" ? "商品準備中はキャンセルできません" : "注文キャンセル"}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      주문취소
                    </Button>
                  )}
                  {["shipping", "delivered", "customs_hold"].includes(order.status) && (
                    <Link href={`/mypage/orders/${order.id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-7 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/30">
                        <Truck className="w-3 h-3 mr-1" />
                        배송추적
                      </Button>
                    </Link>
                  )}
                  {order.status === "delivered" && 'hasReview' in order && !order.hasReview && (
                    <Link href={`/mypage/orders/${order.id}`}>
                      <Button size="sm" className="text-xs h-7 gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                        <Star className="w-3 h-3" />
                        리뷰작성
                      </Button>
                    </Link>
                  )}
                  {order.status === "delivered" && 'hasReview' in order && order.hasReview && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      리뷰 작성완료
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
    </MyPageLayout>
  );
}
