import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { formatPrice, formatDateTime, getOrderStatusLabel, getOrderStatusColor, formatOrderNumber, productHref } from "@/lib/utils";
import { ArrowLeft, Package, ShoppingCart, ShoppingBag, Truck, MapPin, CheckCircle2, Clock, ExternalLink, AlertCircle, RotateCcw, CalendarDays, Star, Gift, Globe, Shield, Plane, XCircle, Loader2, Copy } from "lucide-react";
import { useParams, Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { ReviewDialog } from "@/components/ReviewDialog";
import { formatShippingDescription as formatShippingDesc } from "@/lib/shippingDescriptionFormatter";

// 국제배송 단계
const intlShipmentSteps = [
  { key: "accepted", label: "접수", icon: Package },
  { key: "export_customs", label: "출발국 통관", icon: Shield },
  { key: "in_transit_intl", label: "국제운송", icon: Plane },
  { key: "import_customs", label: "도착국 통관", icon: Globe },
  { key: "out_for_delivery", label: "현지배송", icon: Truck },
  { key: "delivered", label: "배달완료", icon: CheckCircle2 },
];

// shipment status를 국제배송 단계에 매핑
function mapToIntlStep(status: string): number {
  const mapping: Record<string, number> = {
    pending: 0,
    ready: 0,
    accepted: 0,
    picked_up: 0,
    export_customs: 1,
    departed_origin: 2,
    in_transit: 2,
    in_transit_intl: 2,
    arrived_destination: 3,
    import_customs: 3,
    customs_cleared: 3,
    customs_departure: 1,
    customs_arrival: 3,
    in_transit_domestic: 4,
    out_for_delivery: 4,
    delivered: 5,
    failed: -1,
    returned: -1,
    alert: -1,
  };
  return mapping[status] ?? 0;
}

function InternationalProgressBar({ status }: { status: string }) {
  const currentIdx = mapToIntlStep(status);

  if (status === "failed" || status === "returned" || status === "alert") {
    return (
      <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-destructive text-xs">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{status === "returned" ? "반송 처리되었습니다." : status === "alert" ? "배송 주의 — 고객센터 문의 필요" : "배송 오류 — 고객센터 문의 필요"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {intlShipmentSteps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            {idx > 0 && (
              <div className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${idx <= currentIdx ? "bg-primary" : "bg-border"}`} style={{ left: "-50%" }} />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={`text-[10px] mt-1.5 text-center leading-tight ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ShipmentTimeline({ history }: { history: { id: number; status: string; location: string | null; description: string | null; occurredAt: Date }[] }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="space-y-0">
      {history.map((entry, idx) => {
        const isFirst = idx === 0;
        const displayDesc = formatShippingDesc(entry.description || entry.status);
        return (
          <div key={entry.id} className="flex gap-3 relative">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isFirst ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Clock className="w-3 h-3" />
              </div>
              {idx < history.length - 1 && <div className="w-px flex-1 bg-border min-h-6" />}
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isFirst ? "text-foreground" : "text-muted-foreground"}`}>{displayDesc}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatDateTime(entry.occurredAt)}</span>
                {entry.location && <span className="text-xs text-muted-foreground">· {entry.location}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderItemRow({ item, orderStatus, onReviewSuccess, pointSettings, itemDiscount }: { item: any; orderStatus: string; onReviewSuccess: () => void; pointSettings?: { pointsPerReview: number; pointsPerPhotoReview: number } | null; itemDiscount: number }) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const isCancelled = !!item.cancelledAt;
  const { data: reviewStatus } = trpc.reviews.checkReviewStatus.useQuery(
    { orderItemId: item.id },
    { enabled: orderStatus === "delivered" && !isCancelled }
  );
  const reviewPoints = (pointSettings?.pointsPerReview ?? 100) + (pointSettings?.pointsPerPhotoReview ?? 200);

  return (
    <>
      <div className={`flex gap-3 items-center ${isCancelled ? "opacity-60" : ""}`}>
        <Link href={productHref(item.product?.slug)} className="block w-16 h-16 rounded-lg bg-secondary/30 overflow-hidden shrink-0 hover:opacity-80 transition-opacity">
          {(item.productThumbnail || item.product?.thumbnail) ? (
            <img src={(item.productThumbnail || item.product?.thumbnail) as string} alt="" className={`w-full h-full object-cover ${isCancelled ? "grayscale" : ""}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 opacity-20" />
            </div>
          )}
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={productHref(item.product?.slug)} className={`text-sm font-medium hover:text-primary hover:underline transition-colors ${isCancelled ? "line-through text-muted-foreground" : ""}`}>{item.productName}</Link>
            {isCancelled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium shrink-0">취소됨</span>
            )}
            {isCancelled && item.refundedAt && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium shrink-0">
                환불 완료 {new Date(item.refundedAt).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
            )}
          </div>
          {item.options && (
            <p className="text-xs text-muted-foreground">
              {Object.entries(item.options as Record<string, string>)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">수량: {item.quantity}</p>
          {isCancelled && item.cancelReason && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">취소 사유: {item.cancelReason}</p>
          )}
          
          {!isCancelled && orderStatus === "delivered" && (
            <div className="mt-2">
              {reviewStatus?.hasReview ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>리뷰 작성 완료</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setReviewDialogOpen(true)}
                  className="h-7 text-xs gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Star className="w-3 h-3" />
                  리뷰 작성하고 {reviewPoints}P 받기
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className={`text-sm font-bold price-text ${isCancelled ? "line-through text-muted-foreground" : ""}`}>
            {formatPrice(item.price * item.quantity)}
          </span>
          {itemDiscount > 0 && !isCancelled && (
            <p className="text-xs text-emerald-600 font-medium mt-0.5">-{formatPrice(itemDiscount)} 할인</p>
          )}
        </div>
      </div>

      {!isCancelled && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          orderItemId={item.id}
          productName={item.productName}
          productThumbnail={item.productThumbnail || item.product?.thumbnail}
          onSuccess={onReviewSuccess}
        />
      )}
    </>
  );
}

function ItemTrackingSection({
  shipment,
  orderStatus,
  onRefresh,
  isRefreshing,
  onShowTimeline,
}: {
  shipment: any | null;
  orderStatus: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onShowTimeline: (shipment: any) => void;
}) {
  if (!shipment) {
    return (
      <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">운송장 미등록 — 관리자가 운송장 번호를 등록하면 배송 추적이 가능합니다.</p>
      </div>
    );
  }

  const estimatedDate = shipment.estimatedDeliveryDate
    ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })
    : null;

  return (
    <div className="mt-2 border rounded-lg p-3 bg-muted/20">
      {/* 상단: 운송장 번호 + 버튼 */}
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs font-mono text-muted-foreground truncate">{shipment.trackingNumber}</span>
          {estimatedDate && shipment.status !== "delivered" && (
            <span className="text-[10px] text-primary shrink-0">· {estimatedDate} 예상</span>
          )}
          {shipment.status === "delivered" && shipment.actualDeliveryDate && (
            <span className="text-[10px] text-emerald-600 shrink-0">· {formatDateTime(shipment.actualDeliveryDate)} 배달완료</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {shipment.status !== "delivered" && (
            <button onClick={onRefresh} disabled={isRefreshing} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 disabled:opacity-50">
              <RotateCcw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}
          {shipment.history && shipment.history.length > 0 && (
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => onShowTimeline(shipment)}>
              <Clock className="w-3 h-3" />
              배송추적이력 ({shipment.history.length}건)
            </Button>
          )}
        </div>
      </div>

      {/* 진행 바 */}
      <InternationalProgressBar status={shipment.status} />
    </div>
  );
}

export default function OrderDetail() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id!);
  const utils = trpc.useUtils();
  const { data: order, isLoading, error, refetch } = trpc.order.getById.useQuery({ id: orderId }, { retry: false });
  const { data: itemShipments } = trpc.shipping.trackOrderItems.useQuery(
    { orderId },
    { enabled: !!order && ["shipping", "delivered", "customs_hold"].includes(order.status) }
  );
  const { data: shippingPolicy } = trpc.shipping.policies.useQuery();
  const { data: pointSettings } = trpc.community.reviewPointSettings.useQuery();
  const { data: pendingReviews } = trpc.order.pendingReviews.useQuery();
  const { data: payment } = trpc.payment.getPaymentByOrderId.useQuery({ orderId }, { enabled: !!order });
  
  const [refreshingShipmentId, setRefreshingShipmentId] = useState<number | null>(null);
  const refreshByShipment = trpc.shipping.refreshTrackingByShipment.useMutation({
    onMutate: (vars) => { setRefreshingShipmentId(vars.shipmentId); },
    onSuccess: (data) => {
      setRefreshingShipmentId(null);
      if (!data.success) {
        toast.info(data.message || "배송 정보를 아직 조회할 수 없습니다.");
        return;
      }
      if (data.delivered) {
        toast.success("배송이 완료되었습니다! 리뷰를 작성해주세요.");
      } else if (data.eventsCount > 0) {
        toast.success(`배송 정보가 업데이트되었습니다. (${data.eventsCount}개 새 이벤트)`);
      } else {
        toast.info("배송 정보가 최신 상태입니다.");
      }
      utils.order.getById.invalidate({ id: orderId });
      utils.shipping.trackOrderItems.invalidate({ orderId });
    },
    onError: (err: any) => { setRefreshingShipmentId(null); toast.error(err.message); },
  });
  const confirmPayment = trpc.order.confirmPayment.useMutation({
    onSuccess: () => { toast.success("결제가 확인되었습니다"); utils.order.getById.invalidate({ id: orderId }); },
  });

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [trackingModalShipment, setTrackingModalShipment] = useState<any | null>(null);
  const [cancelItemIds, setCancelItemIds] = useState<number[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const cancelItems = trpc.order.cancelItems.useMutation({
    onSuccess: (result) => {
      const msg = result.allCancelled
        ? `주문이 전체 취소되었습니다. 환불 금액: ${formatPrice(result.refundAmount)}`
        : `${result.cancelledCount}개 상품이 취소되었습니다. 환불 금액: ${formatPrice(result.refundAmount)}`;
      toast.success(msg);
      setShowCancelDialog(false);
      setCancelItemIds([]);
      setCancelReason("");
      setRefundBankName("");
      setRefundAccountNumber("");
      refetch();
      utils.payment.getPaymentByOrderId.invalidate({ orderId });
    },
    onError: (err: any) => toast.error(err.message),
  });



  if (isLoading) return <MyPageLayout title="주문 상세"><div className="animate-pulse space-y-4"><div className="h-8 bg-secondary rounded w-1/3" /><div className="h-40 bg-secondary rounded" /></div></MyPageLayout>;
  if (error || !order) return <MyPageLayout title="주문 상세"><div className="text-center py-20"><div className="flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-muted-foreground" /><h2 className="text-xl font-bold">주문을 찾을 수 없습니다</h2><p className="text-muted-foreground">요청하신 주문 정보가 존재하지 않거나 접근 권한이 없습니다.</p><Link href="/mypage/orders"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />주문내역으로</Button></Link></div></div></MyPageLayout>;

  // 배송비 표시 텍스트
  const shippingFeeText = (() => {
    if (order.shippingFee === 0) {
      if (shippingPolicy) {
        if (shippingPolicy.freeShipping) {
          return "무료 (국제배송)";
        }
        if (shippingPolicy.freeShippingThreshold > 0 && order.totalAmount >= shippingPolicy.freeShippingThreshold) {
          return `무료 (${formatPrice(shippingPolicy.freeShippingThreshold)} 이상 구매)`;
        }
      }
      return "무료 (국제배송)";
    }
    return formatPrice(order.shippingFee);
  })();

  return (
    <MyPageLayout title="주문 상세">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">주문번호: {formatOrderNumber(order.orderNumber)} · {formatDateTime(order.createdAt)}</p>
          <div className="flex items-center gap-2">
            {order.items.some((i: any) => i.cancelledAt) && order.items.some((i: any) => !i.cancelledAt) && (
              <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${getOrderStatusColor("partial_cancel")}`}>{getOrderStatusLabel("partial_cancel")}</span>
            )}
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${getOrderStatusColor(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
          </div>
        </div>

        {/* 통관검사 안내 배너 */}
        {order.status === "customs_hold" && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-200">통관검사대기</h4>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 leading-relaxed">
                  고객님의 주문상품이 세관의 통관검사 대상으로 선정되었습니다.<br />
                  자세한 내용은 공지사항의 [통관검사대기 안내] 글을 참고 부탁드립니다.
                </p>
                <Link href="/bbs/board.php?bo_table=notice">
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 text-xs h-7 border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/30"
                  >
                    공지사항 바로가기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">주문 상품</h3>
            {["pending", "paid"].includes(order.status) && order.items.some((i: any) => !i.cancelledAt) && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                onClick={() => { setCancelItemIds([]); setCancelReason(""); setShowCancelDialog(true); }}
              >
                <XCircle className="w-3.5 h-3.5" />
                상품 취소 신청
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {(() => {
              const couponDiscount = (order as any).couponDiscount ?? 0;
              const gradeDiscount = Math.max(0, ((order as any).discountAmount ?? 0) - couponDiscount);
              const activeItems = order.items.filter((i: any) => !i.cancelledAt);
              const totalSubtotal = activeItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
              // 쿠폰 할인은 noDiscount 제외 상품만 기준으로 비례 배분
              const couponEligibleSubtotal = activeItems
                .filter((i: any) => i.product?.noDiscount !== 1)
                .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
              const showPerItemTracking = !!itemShipments && ["shipping", "delivered", "customs_hold"].includes(order.status);
              return order.items.map((item: any) => {
                const isCancelled = !!item.cancelledAt;
                const itemSubtotal = item.price * item.quantity;
                const isNoDiscount = item.product?.noDiscount === 1;
                const itemGradeDiscount = (gradeDiscount > 0 && totalSubtotal > 0 && !isCancelled)
                  ? Math.round(gradeDiscount * itemSubtotal / totalSubtotal)
                  : 0;
                const itemCouponDiscount = (!isNoDiscount && couponDiscount > 0 && couponEligibleSubtotal > 0 && !isCancelled)
                  ? Math.round(couponDiscount * itemSubtotal / couponEligibleSubtotal)
                  : 0;
                const itemDiscount = itemGradeDiscount + itemCouponDiscount;
                const itemShipment = (!isCancelled && showPerItemTracking)
                  ? (itemShipments.byItemId[item.id] ?? itemShipments.fallback ?? null)
                  : null;
                return (
                  <div key={item.id}>
                    <OrderItemRow item={item} orderStatus={order.status} onReviewSuccess={refetch} pointSettings={pointSettings} itemDiscount={itemDiscount} />
                    {!isCancelled && showPerItemTracking && (
                      <ItemTrackingSection
                        shipment={itemShipment}
                        orderStatus={order.status}
                        onRefresh={() => itemShipment && refreshByShipment.mutate({ shipmentId: itemShipment.id })}
                        isRefreshing={!!itemShipment && refreshingShipmentId === itemShipment.id}
                        onShowTimeline={setTrackingModalShipment}
                      />
                    )}
                  </div>
                );
              });
            })()}
          </div>
          {/* 같은 상품 다시 구매 */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {order.items.map((item: any) => (
                <Link key={item.id} href={productHref(item.product?.slug)}>
                  <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 hover:bg-primary/5 hover:border-primary/30">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {order.items.length > 1 ? `${(item.productName as string).slice(0, 12)}${(item.productName as string).length > 12 ? '...' : ''} 다시 구매` : '같은 상품 다시 구매'}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">배송 정보</h3>
          <div className="space-y-2 text-sm">
            <div className="flex"><span className="text-muted-foreground w-20">수령인</span><span>{order.recipientName}{(order as any).recipientNameEn ? ` (${(order as any).recipientNameEn})` : ""}</span></div>
            <div className="flex"><span className="text-muted-foreground w-20">연락처</span><span>{order.recipientPhone}</span></div>
            <div className="flex"><span className="text-muted-foreground w-20">주소</span><span>[{order.zipCode}] {order.address1} {order.address2}</span></div>
            {(order as any).addressEn1 && (
              <div className="flex"><span className="text-muted-foreground w-20">영문주소</span><span className="text-blue-600 dark:text-blue-400 text-xs">{(order as any).addressEn2 ? `${(order as any).addressEn2}, ${(order as any).addressEn1}` : (order as any).addressEn1}</span></div>
            )}
            {order.memo && <div className="flex"><span className="text-muted-foreground w-20">메모</span><span>{order.memo}</span></div>}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">결제 정보</h3>
          {(() => {
            const couponDiscount = (order as any).couponDiscount ?? 0;
            const discountAmount = (order as any).discountAmount ?? 0;
            const gradeDiscount = Math.max(0, discountAmount - couponDiscount);
            const hasCancelledItems = order.items?.some((i: any) => i.cancelledAt);
            return (
            <div className="space-y-2 text-sm">
              {hasCancelledItems && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  일부 취소 후 잔여 금액 기준입니다
                </p>
              )}
              {/* 상품금액 (active items only after cancellation) */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">상품금액</span>
                <span className="price-text">{formatPrice(order.totalAmount)}</span>
              </div>
              {/* 등급 할인 (grade portion only) */}
              {gradeDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    등급 할인
                  </span>
                  <span className="text-emerald-600 price-text">-{formatPrice(gradeDiscount)}</span>
                </div>
              )}
              {/* 쿠폰 할인 */}
              {couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1 flex-wrap">
                    <Gift className="w-3 h-3" />
                    쿠폰 할인
                    {(order as any).couponName && (
                      <span className="text-xs px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded font-medium">{(order as any).couponName}</span>
                    )}
                  </span>
                  <span className="text-emerald-600 price-text">-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              {/* 배송비 */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">배송비</span>
                <span className={`price-text ${order.shippingFee === 0 ? "text-emerald-600" : ""}`}>{shippingFeeText}</span>
              </div>
              {/* 포인트 사용 */}
              {order.pointsUsed > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">포인트 사용</span>
                  <span className="text-destructive price-text">-{formatPrice(order.pointsUsed)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>총 결제금액</span>
                <span className="text-primary price-text">
                  {formatPrice(order.totalAmount - discountAmount + order.shippingFee - order.pointsUsed)}
                </span>
              </div>
            </div>
            );
          })()}
            {order.pointsEarned > 0 && <p className="text-xs text-muted-foreground">적립 예정 포인트: {order.pointsEarned.toLocaleString()}P</p>}
        </div>

        {/* 취소/환불 정보 - 결제 완료 후 취소된 경우 (미입금 상태 제외) */}
        {order.status !== "pending" && payment?.status !== "pending" && order.items.some((i: any) => i.cancelledAt) && (() => {
          const cancelledItems = order.items.filter((i: any) => i.cancelledAt);
          const cancelledTotal = cancelledItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
          const currentCoupon = (order as any).couponDiscount ?? 0;
          const currentDiscount = (order as any).discountAmount ?? 0;
          // 쿠폰 차감: 잔여 쿠폰 ÷ 잔여 쿠폰적용 상품금액 = 취소 상품의 쿠폰 비율
          const activeItems = order.items.filter((i: any) => !i.cancelledAt);
          const couponEligibleActive = activeItems.filter((i: any) => i.product?.noDiscount !== 1).reduce((s: number, i: any) => s + i.price * i.quantity, 0);
          const couponEligibleCancelled = cancelledItems.filter((i: any) => i.product?.noDiscount !== 1).reduce((s: number, i: any) => s + i.price * i.quantity, 0);
          const couponReduction = (currentCoupon > 0 && couponEligibleActive > 0)
            ? Math.round(currentCoupon * couponEligibleCancelled / couponEligibleActive)
            : (currentCoupon > 0 && couponEligibleActive === 0 ? currentCoupon : 0);
          const gradeDiscount = currentDiscount - currentCoupon;
          const gradeReduction = gradeDiscount > 0 ? Math.round(gradeDiscount * cancelledTotal / (order.totalAmount || 1)) : 0;
          const refundAmount = cancelledTotal - couponReduction - gradeReduction;
          return (
            <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/40 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 font-medium mb-3">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span className="text-rose-700 dark:text-rose-400 font-semibold">취소 / 환불 정보</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">취소 상품 ({cancelledItems.length}개)</span>
                  <span className="font-medium">{formatPrice(cancelledTotal)}</span>
                </div>
                {couponReduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">쿠폰 할인 차감</span>
                    <span className="text-rose-500">-{formatPrice(couponReduction)}</span>
                  </div>
                )}
                {gradeReduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">등급 할인 차감</span>
                    <span className="text-rose-500">-{formatPrice(gradeReduction)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-pink-200 dark:border-pink-800/40 pt-2 mt-1">
                  <span className="text-rose-700 dark:text-rose-400">환불 금액</span>
                  <span className="text-rose-600 text-base">{formatPrice(refundAmount)}</span>
                </div>
                {cancelledItems.some((i: any) => i.refundedAt) && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">환불 완료</span>
                    <span className="text-xs text-muted-foreground ml-1">{new Date(cancelledItems.find((i: any) => i.refundedAt)?.refundedAt).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Bank Transfer Payment Info */}
        {payment && payment.paymentMethod === "bank_transfer" && (
          <div className={`border rounded-xl p-6 mb-6 ${
            payment.status === "pending" ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
          }`}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              {payment.status === "pending" ? (
                <><Clock className="w-4 h-4 text-amber-600" /><span className="text-amber-900">입금 대기 중</span></>
              ) : (
                <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-emerald-900">입금 확인 완료</span></>
              )}
            </h3>
            {payment.status === "pending" ? (
              <div className="space-y-3">
                <div className="bg-white border border-amber-300 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-900 mb-2">입금 계좌 정보</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">은행명</span><span className="font-medium">{payment.bankAccount?.bankName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">계좌번호</span><span className="font-mono font-medium">{payment.bankAccount?.accountNumber}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">예금주</span><span className="font-medium">{payment.bankAccount?.accountHolder}</span></div>
                    <Separator className="my-2" />
                    <div className="flex justify-between"><span className="text-muted-foreground">입금금액</span><span className="font-bold text-amber-900 price-text">{formatPrice(payment.depositAmount ?? 0)}</span></div>
                    {payment.depositorName && <div className="flex justify-between"><span className="text-muted-foreground">입금자명</span><span className="font-medium">{payment.depositorName}</span></div>}
                  </div>
                </div>
                {payment.expiresAt && (
                  <div className="bg-amber-100 border border-amber-300 rounded-lg p-3">
                    <p className="text-xs text-amber-900 leading-relaxed">
                      ⚠️ <strong>{new Date(payment.expiresAt).toLocaleString("ko-KR")}</strong>까지 입금하지 않으시면 주문이 자동 취소됩니다.
                    </p>
                  </div>
                )}
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong className="text-amber-800">입금 확인은 관리자가 수동으로 처리하고 있으며, 1일 2회 확인이 진행됩니다.</strong>
                  </p>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong className="text-amber-800">입금 후 24시간 이내에는 확인까지 시간이 소요될 수 있으며, 주말 및 공휴일에는 처리가 지연될 수 있습니다.</strong>
                  </p>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong className="text-amber-800">24시간이 지나도 입금 확인이 되지 않을 경우 고객센터로 문의해 주시기 바랍니다.</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-emerald-300 rounded-lg p-4">
                <p className="text-sm text-emerald-900 mb-2">입금이 확인되었습니다. 배송 준비 중입니다.</p>
                {payment.confirmedAt && (
                  <p className="text-xs text-muted-foreground">확인 시간: {formatDateTime(payment.confirmedAt)}</p>
                )}
              </div>
            )}
          </div>
        )}

      {/* 상품 취소 다이얼로그 */}
      <Dialog open={showCancelDialog} onOpenChange={open => { if (!cancelItems.isPending) setShowCancelDialog(open); }}>
        <DialogContent className="max-w-md flex flex-col max-h-[90vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              상품 취소 신청
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const activeItems = order.items.filter((i: any) => !i.cancelledAt);
            const activeTotal = activeItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
            const coupon = (order as any).couponDiscount ?? 0;
            const gradeOnly = ((order as any).discountAmount ?? 0) - coupon; // discountAmount엔 쿠폰 포함 → 등급만 분리

            // 쿠폰은 noDiscount 제외 상품만 기준으로 배분
            const couponEligibleTotal = activeItems
              .filter((i: any) => i.product?.noDiscount !== 1)
              .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

            const selectedItems = activeItems.filter((i: any) => cancelItemIds.includes(i.id));
            const selectedTotal = selectedItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
            const couponEligibleSelected = selectedItems
              .filter((i: any) => i.product?.noDiscount !== 1)
              .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
            const couponReduction = couponEligibleTotal > 0 ? Math.round(coupon * couponEligibleSelected / couponEligibleTotal) : 0;
            const gradeReduction = activeTotal > 0 ? Math.round(gradeOnly * selectedTotal / activeTotal) : 0;
            const refundAmount = selectedTotal - couponReduction - gradeReduction;

            const isBankTransfer = (payment?.paymentMethod ?? (order as any).paymentMethod) === "bank_transfer";
            const paymentConfirmed = payment?.status === "confirmed" || (order as any).paymentStatus === "confirmed";
            const isPendingPayment = isBankTransfer && !paymentConfirmed; // 미입금 상태
            const bankInfoMissing = isBankTransfer && !isPendingPayment && cancelItemIds.length > 0 && (!refundBankName.trim() || !refundAccountNumber.trim());

            return (
              <>
                <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-1">
                <div className="space-y-2 my-2">
                  {activeItems.map((item: any) => {
                    const itemTotal = item.price * item.quantity;
                    const isNoDiscountItem = item.product?.noDiscount === 1;
                    const itemCoupon = (!isNoDiscountItem && couponEligibleTotal > 0) ? Math.round(coupon * itemTotal / couponEligibleTotal) : 0;
                    const itemGrade = activeTotal > 0 ? Math.round(gradeOnly * itemTotal / activeTotal) : 0;
                    const itemRefund = itemTotal - itemCoupon - itemGrade;
                    const isSelected = cancelItemIds.includes(item.id);
                    return (
                      <label key={item.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? "border-rose-300 bg-rose-50 dark:bg-rose-950/20" : "hover:bg-accent"}`}>
                        <input
                          type="checkbox"
                          className="accent-rose-600 w-4 h-4 flex-shrink-0"
                          checked={isSelected}
                          onChange={e => setCancelItemIds(prev =>
                            e.target.checked ? [...prev, item.id] : prev.filter(x => x !== item.id)
                          )}
                        />
                        {(item.productThumbnail || item.product?.thumbnail) && (
                          <img src={item.productThumbnail || item.product?.thumbnail} alt={item.productName} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug truncate">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">수량 {item.quantity}개 · {formatPrice(itemTotal)}</span>
                            {itemCoupon > 0 && (
                              <span className="text-xs text-rose-600 bg-rose-100 dark:bg-rose-950/30 px-1.5 py-0.5 rounded font-medium">쿠폰 -{formatPrice(itemCoupon)}</span>
                            )}
                            {itemGrade > 0 && (
                              <span className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded font-medium">할인 -{formatPrice(itemGrade)}</span>
                            )}
                          </div>
                          {!isPendingPayment && (itemCoupon > 0 || itemGrade > 0) && (
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">환불 예상: {formatPrice(itemRefund)}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {cancelItemIds.length > 0 && !isPendingPayment && (
                  <div className="rounded-lg bg-muted/50 border p-3 text-sm space-y-1.5">
                    <p className="font-semibold text-sm mb-1">환불 예상 내역</p>
                    <div className="flex justify-between text-muted-foreground">
                      <span>취소 상품 합계 ({cancelItemIds.length}개)</span>
                      <span>{formatPrice(selectedTotal)}</span>
                    </div>
                    {couponReduction > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span className="flex items-center gap-1">
                          <span className="text-xs px-1 py-0.5 bg-rose-100 dark:bg-rose-950/30 text-rose-600 rounded font-semibold">쿠폰</span>
                          차감
                        </span>
                        <span>-{formatPrice(couponReduction)}</span>
                      </div>
                    )}
                    {gradeReduction > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>상품 할인 차감</span>
                        <span>-{formatPrice(gradeReduction)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t pt-1.5">
                      <span>환불 금액</span>
                      <span className="text-emerald-700 dark:text-emerald-400">{formatPrice(refundAmount)}</span>
                    </div>
                  </div>
                )}

                {/* 무통장송금 환불 계좌 입력 (입금 확인된 경우만) */}
                {isBankTransfer && !isPendingPayment && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 p-3 space-y-2">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">환불 받을 계좌 정보</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">무통장송금 주문 취소 시 환불 계좌가 필요합니다.</p>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">예금주 (본인 명의만 가능)</label>
                      <Input
                        className="h-9 text-sm bg-muted/50"
                        value={user?.name ?? ""}
                        readOnly
                        disabled
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">은행명 <span className="text-rose-500">*</span></label>
                      <Input
                        className="h-9 text-sm"
                        placeholder="예: 신한은행, 국민은행..."
                        value={refundBankName}
                        onChange={e => setRefundBankName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">계좌번호 <span className="text-rose-500">*</span></label>
                      <Input
                        className="h-9 text-sm"
                        placeholder="숫자만 입력 (예: 110-123-456789)"
                        value={refundAccountNumber}
                        onChange={e => setRefundAccountNumber(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">취소 사유 (선택)</label>
                  <Input
                    className="h-9 text-sm"
                    placeholder="단순 변심, 주문 실수 등..."
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                  />
                </div>
                </div>{/* end scrollable area */}
                <DialogFooter className="gap-2 mt-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(false)} disabled={cancelItems.isPending}>닫기</Button>
                  <Button
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                    disabled={cancelItemIds.length === 0 || cancelItems.isPending || bankInfoMissing}
                    onClick={() => cancelItems.mutate({
                      orderId: order.id,
                      itemIds: cancelItemIds,
                      reason: cancelReason || undefined,
                      refundBankInfo: isBankTransfer ? { bankName: refundBankName.trim(), accountNumber: refundAccountNumber.trim(), accountHolder: user?.name ?? "" } : undefined,
                    })}
                  >
                    {cancelItems.isPending ? "처리 중..." : isPendingPayment ? `${cancelItemIds.length}개 취소 신청` : `${cancelItemIds.length}개 취소 (환불 ${formatPrice(refundAmount)})`}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 상품별 배송추적이력 모달 */}
      {trackingModalShipment && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setTrackingModalShipment(null)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between p-5 border-b flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="font-bold text-base">배송 타임라인</span>
                  {trackingModalShipment.history && (
                    <span className="text-sm text-muted-foreground">{trackingModalShipment.history.length}건</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{trackingModalShipment.trackingNumber}</p>
              </div>
              <button
                onClick={() => setTrackingModalShipment(null)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors ml-4 flex-shrink-0"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* 추적번호 박스 */}
            <div className="mx-4 mt-4 border rounded-xl p-4 flex-shrink-0">
              <p className="text-[11px] text-muted-foreground mb-0.5">운송장 번호</p>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-base font-mono">{trackingModalShipment.trackingNumber}</p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => { navigator.clipboard.writeText(trackingModalShipment.trackingNumber ?? ""); toast.success("복사됨"); }}
                  >
                    <Copy className="w-3 h-3" />복사
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <a href={`https://t.17track.net/en#nums=${trackingModalShipment.trackingNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />17track
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* 타임라인 */}
            <div className="overflow-y-auto flex-1 px-4 py-4">
              {!trackingModalShipment.history || trackingModalShipment.history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">아직 배송 이력이 없습니다</p>
                  <p className="text-xs mt-1">배송 정보 새로고침 후 다시 확인해주세요</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {trackingModalShipment.history.map((entry: any, idx: number) => {
                    const isFirst = idx === 0;
                    const isDelivered = entry.status === "delivered" || (entry.description ?? "").includes("배달 완료");
                    const iconBg = isDelivered ? "bg-blue-500 text-white" : (isFirst ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground");
                    const displayDesc = formatShippingDesc(entry.description || entry.status);
                    return (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          {idx < trackingModalShipment.history.length - 1 && (
                            <div className="w-px flex-1 bg-border min-h-4" />
                          )}
                        </div>
                        <div className={`flex-1 min-w-0 ${idx < trackingModalShipment.history.length - 1 ? "pb-4" : "pb-1"}`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${isDelivered ? "text-blue-600 font-semibold" : (isFirst ? "text-foreground" : "text-muted-foreground")}`}>
                              {displayDesc}
                            </span>
                            {isFirst && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${isDelivered ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-primary/10 text-primary border-primary/20"}`}>현재</span>
                            )}
                          </div>
                          {entry.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 flex-shrink-0" />{entry.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(entry.occurredAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end px-5 py-3 border-t flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => setTrackingModalShipment(null)} className="h-7 text-xs">닫기</Button>
            </div>
          </div>
        </div>
      )}

    </MyPageLayout>
  );
}
