/**
 * 관리자 리뷰 포인트 설정 페이지
 */

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Star, ThumbsUp, Image, Award } from "lucide-react";

export default function AdminReviewSettings() {
  const { data: settings, isLoading } = trpc.admin.getReviewPointSettings.useQuery();
  const utils = trpc.useUtils();

  const [pointsPerReview, setPointsPerReview] = useState(100);
  const [pointsPerPhotoReview, setPointsPerPhotoReview] = useState(200);
  const [minRatingForPoints, setMinRatingForPoints] = useState(1);
  const [likePointsThreshold, setLikePointsThreshold] = useState(10);
  const [pointsPerLikeThreshold, setPointsPerLikeThreshold] = useState(50);

  useEffect(() => {
    if (settings) {
      setPointsPerReview(settings.pointsPerReview);
      setPointsPerPhotoReview(settings.pointsPerPhotoReview);
      setMinRatingForPoints(settings.minRatingForPoints);
      setLikePointsThreshold(settings.likePointsThreshold);
      setPointsPerLikeThreshold(settings.pointsPerLikeThreshold);
    }
  }, [settings]);

  const updateSettings = trpc.admin.updateReviewPointSettings.useMutation({
    onSuccess: () => {
      toast.success("レビューポイント設定を保存しました");
      utils.admin.getReviewPointSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    updateSettings.mutate({
      pointsPerReview,
      pointsPerPhotoReview,
      minRatingForPoints,
      likePointsThreshold,
      pointsPerLikeThreshold,
    });
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">レビューポイント設定</h1>
          <p className="text-muted-foreground">
            レビュー投稿およびいいね達成時に付与されるポイントを設定します
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 리뷰 작성 포인트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  レビュー投稿ポイント
                </CardTitle>
                <CardDescription>
                  お客様がレビューを投稿した際に付与されるポイントを設定します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="pointsPerReview">基本レビュー投稿ポイント</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pointsPerReview"
                      type="number"
                      min="0"
                      value={pointsPerReview}
                      onChange={(e) => setPointsPerReview(Number(e.target.value))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">ポイント</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    レビュー投稿時に基本として付与されるポイントです
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="minRatingForPoints" className="flex items-center gap-2">
                    最低評価の要件
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="minRatingForPoints"
                      type="number"
                      min="1"
                      max="5"
                      value={minRatingForPoints}
                      onChange={(e) => setMinRatingForPoints(Number(e.target.value))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">点以上</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ポイントを付与するための最低評価です (1〜5点)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 사진 리뷰 추가 포인트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  写真付きレビュー追加ポイント
                </CardTitle>
                <CardDescription>
                  写真付きレビューの投稿時に追加で付与されるポイントを設定します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Label htmlFor="pointsPerPhotoReview">写真付きレビュー追加ポイント</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pointsPerPhotoReview"
                      type="number"
                      min="0"
                      value={pointsPerPhotoReview}
                      onChange={(e) => setPointsPerPhotoReview(Number(e.target.value))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">ポイント</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    写真付きレビューの投稿時に、基本ポイントに加えて付与されます
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 좋아요 달성 보너스 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5" />
                  いいね達成ボーナス
                </CardTitle>
                <CardDescription>
                  レビューが一定のいいね数を達成するごとに、投稿者へ付与されるボーナスポイントを設定します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="likePointsThreshold">いいねのしきい値</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="likePointsThreshold"
                      type="number"
                      min="1"
                      value={likePointsThreshold}
                      onChange={(e) => setLikePointsThreshold(Number(e.target.value))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">件ごと</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    この値の倍数ごとにポイントが付与されます (例: 10件に設定した場合、10件、20件、30件...達成時に付与)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pointsPerLikeThreshold">しきい値達成時の付与ポイント</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pointsPerLikeThreshold"
                      type="number"
                      min="0"
                      value={pointsPerLikeThreshold}
                      onChange={(e) => setPointsPerLikeThreshold(Number(e.target.value))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">ポイント</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    いいねのしきい値を達成するたびにレビュー投稿者へ付与されるポイントです
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Award className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">例</p>
                      <p className="text-xs text-muted-foreground">
                        いいねのしきい値 {likePointsThreshold}件、付与ポイント {pointsPerLikeThreshold}ポイントに設定した場合:
                        <br />
                        レビューが{likePointsThreshold}件のいいねを達成 → {pointsPerLikeThreshold}ポイント付与
                        <br />
                        レビューが{likePointsThreshold * 2}件のいいねを達成 → {pointsPerLikeThreshold}ポイント追加付与
                        <br />
                        レビューが{likePointsThreshold * 3}件のいいねを達成 → {pointsPerLikeThreshold}ポイント追加付与
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg">
                {updateSettings.isPending ? "保存中..." : "設定を保存"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
