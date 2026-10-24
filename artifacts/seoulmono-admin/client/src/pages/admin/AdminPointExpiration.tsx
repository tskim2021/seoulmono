import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calendar, Clock, AlertCircle, Play, Loader2, Bell } from "lucide-react";

export default function AdminPointExpiration() {
  const utils = trpc.useUtils();
  const { data: currentMonths, isLoading } = trpc.user.getPointExpirationMonths.useQuery();
  const setMonthsMut = trpc.user.adminSetPointExpirationMonths.useMutation({
    onSuccess: () => {
      utils.user.getPointExpirationMonths.invalidate();
      toast.success("포인트 만료 정책이 저장되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });
  const expirePointsMut = trpc.user.adminExpirePoints.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.expiredCount}건의 포인트가 만료되었습니다. (총 ${result.totalExpiredPoints.toLocaleString()}P)`);
    },
    onError: (err) => toast.error(err.message),
  });
  const testNotificationMut = trpc.user.adminTestExpirationNotification.useMutation({
    onSuccess: (result) => {
      toast.success(`알림 발송 완료: ${result.totalUsers}명 (이메일: ${result.emailSent}, 푸시: ${result.pushSent}, 실패: ${result.failed})`);
    },
    onError: (err) => toast.error(err.message),
  });

  const [expirationMonths, setExpirationMonths] = useState(12);

  // Load current setting when data arrives
  useMemo(() => {
    if (currentMonths !== undefined) {
      setExpirationMonths(currentMonths);
    }
  }, [currentMonths]);

  const handleSave = () => {
    if (expirationMonths < 1 || expirationMonths > 120) {
      toast.error("만료 기간은 1~120개월 사이로 설정해주세요.");
      return;
    }
    setMonthsMut.mutate({ months: expirationMonths });
  };

  const handleExpireNow = () => {
    if (!confirm("만료된 포인트를 즉시 처리하시겠습니까?")) return;
    expirePointsMut.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">포인트 만료 설정</h1>
        <p className="text-muted-foreground">포인트 적립 후 자동 소멸되는 기간을 설정합니다.</p>
      </div>

      <div className="space-y-6">
        {/* 만료 정책 설정 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">만료 기간 설정</h2>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">포인트 만료 기간</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={expirationMonths}
                  onChange={(e) => setExpirationMonths(Math.max(1, Math.min(120, Number(e.target.value))))}
                  className="w-32"
                  min={1}
                  max={120}
                />
                <span className="text-sm text-muted-foreground">개월</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                포인트 적립일로부터 {expirationMonths}개월 후 자동 소멸됩니다.
              </p>
            </div>

            {/* 미리보기 */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">적용 예시</p>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <p>• 2026년 1월 1일 적립 → {new Date(new Date(2026, 0, 1).setMonth(expirationMonths)).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 만료</p>
                <p>• 2026년 6월 15일 적립 → {new Date(new Date(2026, 5, 15).setMonth(5 + expirationMonths)).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 만료</p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={setMonthsMut.isPending} className="w-full">
              {setMonthsMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              설정 저장
            </Button>
          </div>
        </Card>

        {/* 수동 만료 처리 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">수동 만료 처리</h2>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                <div className="text-sm text-orange-700 dark:text-orange-400">
                  <p className="font-medium mb-1">만료 처리 안내</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>만료일이 지난 포인트를 즉시 차감합니다.</li>
                    <li>자동 배치 작업이 실행되지 않았을 때 사용하세요.</li>
                    <li>처리된 포인트는 복구할 수 없습니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleExpireNow} 
              disabled={expirePointsMut.isPending}
              variant="outline"
              className="w-full"
            >
              {expirePointsMut.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              만료 포인트 즉시 처리
            </Button>
          </div>
        </Card>

        {/* 알림 테스트 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">만료 예정 알림 테스트</h2>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <p className="font-medium mb-1">알림 테스트 안내</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>7일 이내 만료 예정 포인트가 있는 사용자에게 알림을 발송합니다.</li>
                    <li>이메일 및 푸시 알림이 동시에 발송됩니다.</li>
                    <li>정상 운영 시 매일 오전 9시에 자동 실행됩니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => testNotificationMut.mutate()} 
              disabled={testNotificationMut.isPending}
              variant="outline"
              className="w-full"
            >
              {testNotificationMut.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              알림 테스트 실행
            </Button>
          </div>
        </Card>

        {/* 안내 사항 */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-sm font-semibold mb-3">참고 사항</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>포인트 적립(earn) 및 관리자 지급(admin) 시에만 만료일이 설정됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>사용(use) 및 환불(refund) 포인트는 만료되지 않습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>만료 정책 변경은 이후 적립되는 포인트부터 적용됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>사용자는 마이페이지에서 만료 예정 포인트를 확인할 수 있습니다.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
