/**
 * 마이페이지 - 내 리뷰 관리
 */

import MyPageLayout from "@/components/MyPageLayout";
import { productHref, formatPrice, getOrderStatusLabel, formatDate, formatOrderNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Star, Pencil, Trash2, Gift, Package } from "lucide-react";
import Paginator from "@/components/Paginator";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ReviewDialog } from "@/components/ReviewDialog";

export default function MyReviews() {
  useAuth({ redirectOnUnauthenticated: true });
  const [page, setPage] = useState(1);
  const [editingReview, setEditingReview] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: reviewData, isLoading } = trpc.reviews.getMyReviews.useQuery({
    page,
    limit: 10,
  });
  const { data: reviewPending } = trpc.order.pendingReviews.useQuery();
  const { data: pointSettings } = trpc.community.reviewPointSettings.useQuery();

  const textPoints = pointSettings?.pointsPerReview ?? 100;
  const photoPoints = pointSettings?.pointsPerPhotoReview ?? 200;
  const isPointEnabled = pointSettings?.isActive === 1;
  const totalPossiblePoints = textPoints + photoPoints;

  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      toast.success("レビューを削除しました。");
      utils.reviews.getMyReviews.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (reviewId: number) => {
    if (confirm("정말 이 리뷰를 삭제하시겠습니까?")) {
      deleteReview.mutate({ reviewId });
    }
  };

  if (isLoading) {
    return (
      <MyPageLayout title="マイレビュー">
        <p className="text-center text-muted-foreground py-12">読み込み中...</p>
      </MyPageLayout>
    );
  }

  return (
    <MyPageLayout title="マイレビュー">

      {/* 리뷰 작성 대기 */}
      {(reviewPending ?? []).length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-200">レビュー投稿待ち</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {isPointEnabled ? (
                    <>レビュー投稿で最大 <strong>{totalPossiblePoints.toLocaleString()}P</strong> 적립!</>
                  ) : "ご購入商品のレビューをお寄せください"}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300">
              {reviewPending!.length}건
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
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">텍스트 {textPoints}P + 포토 {photoPoints}P</span>
                    </div>
                  )}
                </div>
                <Link href={`/mypage/orders/${order.orderId}`}>
                  <Button size="sm" className="text-xs h-7 gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 flex-shrink-0">
                    <Star className="w-3 h-3" />리뷰작성
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">レビュー一覧</h3>
        <span className="text-sm text-muted-foreground">총 {reviewData?.total ?? 0}건</span>
      </div>

        {!reviewData || reviewData.total === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">投稿したレビューはありません。</p>
            <Link href="/mypage/orders">
              <Button>注文履歴を見る</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {reviewData.reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  {/* 상품 정보 */}
                  <Link href={productHref(review.productSlug)}>
                    <div className="flex gap-3 mb-4 hover:opacity-80 transition-opacity">
                      <div className="w-16 h-16 rounded-lg bg-secondary/30 overflow-hidden shrink-0">
                        {review.productThumbnail && (
                          <img
                            src={review.productThumbnail.replace(/"/g, "")}
                            alt={review.productName || ""}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{review.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* 리뷰 내용 */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (review.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <h4 className="font-semibold mb-1">{review.title}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {review.content}
                    </p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((img: string, idx: number) => (
                          <img
                            key={idx}
                            src={img}
                            alt="レビュー写真"
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 수정/삭제 버튼 */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingReview(review)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(review.id)}
                      disabled={deleteReview.isPending}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <Paginator page={page} totalPages={reviewData.totalPages} onPageChange={setPage} className="mt-6" />
          </>
        )}
    </MyPageLayout>
  );
}
