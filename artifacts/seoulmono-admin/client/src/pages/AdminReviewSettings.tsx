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
      toast.success("리뷰 포인트 설정이 저장되었습니다");
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
          <h1 className="text-3xl font-bold mb-2">리뷰 포인트 설정</h1>
          <p className="text-muted-foreground">
            리뷰 작성 및 좋아요 달성 시 지급되는 포인트를 설정합니다
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
                  리뷰 작성 포인트
                </CardTitle>
                <CardDescription>
                  고객이 리뷰를 작성할 때 지급되는 포인트를 설정합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="pointsPerReview">기본 리뷰 작성 포인트</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pointsPerReview"
                      type="number"
                      min="0"
                      value={pointsPerReview}
                      onChange={(e) => setPointsPerReview(Number(e.target.value))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">포인트</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    리뷰 작성 시 기본으로 지급되는 포인트입니다
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="minRatingForPoints" className="flex items-center gap-2">
                    최소 별점 요구사항
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
                    <span className="text-sm text-muted-foreground">점 이상</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    포인트를 지급하기 위한 최소 별점입니다 (1~5점)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 사진 리뷰 추가 포인트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  사진 리뷰 추가 포인트
                </CardTitle>
                <CardDescription>
                  사진이 포함된 리뷰 작성 시 추가로 지급되는 포인트를 설정합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Label htmlFor="pointsPerPhotoReview">사진 리뷰 추가 포인트</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pointsPerPhotoReview"
                      type="number"
                      min="0"
                      value={pointsPerPhotoReview}
                      onChange={(e) => setPointsPerPhotoReview(Number(e.target.value))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">포인트</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    사진이 포함된 리뷰 작성 시 기본 포인트에 추가로 지급됩니다
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 좋아요 달성 보너스 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5" />
                  좋아요 달성 보너스
                </CardTitle>
                <CardDescription>
                  리뷰가 일정 좋아요 수를 달성할 때마다 작성자에게 지급되는 보너스 포인트를 설정합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="likePointsThreshold">좋아요 임계값</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="likePointsThreshold"
                      type="number"
                      min="1"
                      value={likePointsThreshold}
                      onChange={(e) => setLikePointsThreshold(Number(e.target.value))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">개당</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    이 값의 배수마다 포인트가 지급됩니다 (예: 10개 설정 시 10개, 20개, 30개... 달성 시 지급)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pointsPerLikeThreshold">임계값 달성 시 지급 포인트</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pointsPerLikeThreshold"
                      type="number"
                      min="0"
                      value={pointsPerLikeThreshold}
                      onChange={(e) => setPointsPerLikeThreshold(Number(e.target.value))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">포인트</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    좋아요 임계값 달성 시마다 리뷰 작성자에게 지급되는 포인트입니다
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Award className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">예시</p>
                      <p className="text-xs text-muted-foreground">
                        좋아요 임계값 {likePointsThreshold}개, 지급 포인트 {pointsPerLikeThreshold}포인트로 설정 시:
                        <br />
                        리뷰가 {likePointsThreshold}개 좋아요 달성 → {pointsPerLikeThreshold}포인트 지급
                        <br />
                        리뷰가 {likePointsThreshold * 2}개 좋아요 달성 → {pointsPerLikeThreshold}포인트 추가 지급
                        <br />
                        리뷰가 {likePointsThreshold * 3}개 좋아요 달성 → {pointsPerLikeThreshold}포인트 추가 지급
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg">
                {updateSettings.isPending ? "저장 중..." : "설정 저장"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
