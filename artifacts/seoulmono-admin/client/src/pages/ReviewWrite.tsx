import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReviewImageUploader from "@/components/ReviewImageUploader";
import { formatPrice, proxyImage } from "@/lib/utils";
import { Star, ArrowLeft, Gift, Camera, CheckCircle, ShoppingBag, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function ReviewWrite() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);

  const productId = parseInt(params.get("productId") ?? "0", 10);
  const orderId = parseInt(params.get("orderId") ?? "0", 10);
  const orderItemId = parseInt(params.get("orderItemId") ?? "0", 10);

  const { data: product } = trpc.product.getById.useQuery({ id: productId }, { enabled: productId > 0 });
  const { data: pointSettings } = trpc.community.reviewPointSettings.useQuery();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const createReview = trpc.community.createReview.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setEarnedPoints(data.pointsEarned);
      toast.success("レビューを登録しました！");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const isPointEnabled = pointSettings?.isActive === 1;
  const textPoints = pointSettings?.pointsPerReview ?? 100;
  const photoPoints = pointSettings?.pointsPerPhotoReview ?? 200;
  const minRating = pointSettings?.minRatingForPoints ?? 1;

  const currentPoints = rating >= minRating ? textPoints + (images.length > 0 ? photoPoints : 0) : 0;

  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!productId || !orderId || !orderItemId) {
    return (
      <Layout>
        <div className="container py-20 max-w-lg mx-auto text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold mb-2">不正なアクセスです</h2>
          <p className="text-muted-foreground mb-4">レビュー投稿に必要な情報が不足しています。<br />マイページのレビュー投稿ボタンからアクセスしてください。</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}><ArrowLeft className="w-4 h-4 mr-1" />戻る</Button>
            <Button onClick={() => navigate("/mypage")}>マイページ</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="container py-16 max-w-lg mx-auto text-center">
          <div className="bg-card border rounded-2xl p-10">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">レビューを登録しました！</h2>
            <p className="text-muted-foreground mb-4">貴重なレビューをありがとうございます。</p>

            {earnedPoints > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-amber-700 dark:text-amber-300 text-lg">
                    {earnedPoints.toLocaleString()}P 獲得！
                  </span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  レビュー投稿ポイントが自動で付与されました
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/mypage")}>マイページ</Button>
              <Button onClick={() => navigate(`/products/${product?.slug ?? ""}`)}>商品を見る</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("タイトルを入力してください。"); return; }
    if (!content.trim()) { toast.error("内容を入力してください。"); return; }
    if (content.length < 10) { toast.error("内容を10文字以上入力してください。"); return; }

    createReview.mutate({
      productId,
      orderId,
      orderItemId,
      title: title.trim(),
      content: content.trim(),
      images: images.length > 0 ? images : undefined,
      rating,
    });
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl mx-auto">
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>

        <h1 className="text-2xl font-bold mb-6">レビューを書く</h1>

        {/* Product info */}
        {product && (
          <div className="bg-card border rounded-xl p-4 mb-6 flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {product.thumbnail ? (
                <img src={proxyImage(product.thumbnail)} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div>
              <Badge variant="outline" className="text-xs mb-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="w-3 h-3 mr-1" /> 購入確認済み
              </Badge>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground price-text">{formatPrice(product.salePrice ?? product.price)}</p>
            </div>
          </div>
        )}

        {/* Point info banner */}
        {isPointEnabled && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">レビュー投稿ポイントのご案内</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-amber-700 dark:text-amber-400">
                  <span>テキストレビュー: <strong>{textPoints}P</strong></span>
                  <span>フォト追加: <strong>+{photoPoints}P</strong></span>
                  <span>評価{minRating}点以上</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-amber-600 dark:text-amber-400">獲得予定</p>
                <p className="font-bold text-lg text-amber-700 dark:text-amber-300">{currentPoints}P</p>
              </div>
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <label className="block text-sm font-semibold mb-3">評価</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">{rating}点</span>
          </div>
        </div>

        {/* Title */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <label className="block text-sm font-semibold mb-2">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="レビューのタイトルを入力してください"
            className="w-full px-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            maxLength={100}
          />
        </div>

        {/* Content */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold">内容</label>
            <span className={`text-xs ${rating >= minRating ? "text-green-600" : "text-muted-foreground"}`}>
              {content.length}文字
            </span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="商品を使用した感想を詳しくお書きください"
            rows={6}
            className="w-full px-4 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
          />
          {isPointEnabled && rating < minRating && (
            <p className="text-xs text-amber-600 mt-1">
              評価{minRating}点以上でポイントが付与されます
            </p>
          )}
        </div>

        {/* Image upload */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold">
              <Camera className="w-4 h-4 inline mr-1" />
              写真を添付
            </label>
            {isPointEnabled && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                写真添付で +{photoPoints}P
              </Badge>
            )}
          </div>
          <ReviewImageUploader images={images} onChange={setImages} maxImages={5} />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <div>
            {isPointEnabled && currentPoints > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                <Gift className="w-4 h-4 inline mr-1" />
                レビュー登録で <strong>{currentPoints}P</strong> 獲得予定
              </p>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={createReview.isPending || !title.trim() || !content.trim()}
            className="px-8"
            size="lg"
          >
            {createReview.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 登録中...</>
            ) : (
              "レビューを登録"
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
