import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Ticket, Clock, CheckCircle2, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MyCoupons() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const { data: myCoupons, isLoading } = trpc.coupon.myCoupons.useQuery(undefined, { enabled: isAuthenticated });
  const { data: promoHistory } = trpc.promoCode.myUsageHistory.useQuery(undefined, { enabled: isAuthenticated });
  const [couponCode, setCouponCode] = useState("");

  const downloadByCode = trpc.coupon.downloadByCode.useMutation({
    onSuccess: (data) => {
      toast.success(`"${data.couponName}" 쿠폰이 등록되었습니다`);
      setCouponCode("");
      utils.coupon.myCoupons.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const now = new Date();
  const usableCoupons = myCoupons?.filter(c => !c.isUsed && new Date(c.coupon.endDate) >= now) ?? [];
  const usedOrExpired = myCoupons?.filter(c => c.isUsed || new Date(c.coupon.endDate) < now) ?? [];

  const formatDiscount = (coupon: { discountType: string; discountValue: number; maxDiscountAmount: number | null }) => {
    if (coupon.discountType === "percent") {
      const max = coupon.maxDiscountAmount ? ` (최대 ${formatPrice(coupon.maxDiscountAmount)})` : "";
      return `${coupon.discountValue}%${max}`;
    }
    return formatPrice(coupon.discountValue);
  };

  return (
    <MyPageLayout title="쿠폰함">

      {/* 쿠폰 코드 등록 */}
      <div className="bg-card border rounded-xl p-4 mb-6">
        <p className="text-sm font-medium mb-2">쿠폰 코드 등록</p>
        <div className="flex gap-2">
          <Input
            placeholder="쿠폰 코드를 입력하세요"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), couponCode.trim() && downloadByCode.mutate({ code: couponCode.trim() }))}
            className="flex-1"
          />
          <Button
            onClick={() => couponCode.trim() && downloadByCode.mutate({ code: couponCode.trim() })}
            disabled={!couponCode.trim() || downloadByCode.isPending}
          >
            등록
          </Button>
        </div>
      </div>

      {/* 사용 가능한 쿠폰 */}
      <div className="space-y-3">
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground text-sm">불러오는 중...</div>
        )}
        {!isLoading && usableCoupons.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>사용 가능한 쿠폰이 없습니다</p>
            <p className="text-xs mt-1 opacity-60">쿠폰 코드가 있다면 위에 입력해주세요</p>
          </div>
        )}
        {usableCoupons.map(uc => (
          <div key={uc.id} className="border rounded-xl overflow-hidden flex">
            <div className="bg-primary/5 border-r border-dashed p-4 flex flex-col items-center justify-center min-w-[100px]">
              <Ticket className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold text-primary">{formatDiscount(uc.coupon)}</span>
              <span className="text-[10px] text-muted-foreground">할인</span>
            </div>
            <div className="p-4 flex-1">
              <p className="font-medium text-sm">{uc.coupon.name}</p>
              {uc.coupon.description && <p className="text-xs text-muted-foreground mt-0.5">{uc.coupon.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{new Date(uc.coupon.endDate).toLocaleDateString()}</span>
                {uc.coupon.minOrderAmount > 0 && <span>{formatPrice(uc.coupon.minOrderAmount)} 이상 구매 시</span>}
              </div>
            </div>
          </div>
        ))}

        {/* 사용완료 / 만료 */}
        {usedOrExpired.length > 0 && (
          <>
            <p className="text-sm font-medium text-muted-foreground pt-4">사용완료 / 만료</p>
            {usedOrExpired.map(uc => (
              <div key={uc.id} className="border rounded-xl overflow-hidden flex opacity-50">
                <div className="bg-secondary/30 border-r border-dashed p-4 flex flex-col items-center justify-center min-w-[100px]">
                  {uc.isUsed
                    ? <CheckCircle2 className="w-5 h-5 text-muted-foreground mb-1" />
                    : <Clock className="w-5 h-5 text-muted-foreground mb-1" />}
                  <span className="text-lg font-bold text-muted-foreground">{formatDiscount(uc.coupon)}</span>
                  <span className="text-[10px] text-muted-foreground">{uc.isUsed ? "사용완료" : "만료"}</span>
                </div>
                <div className="p-4 flex-1">
                  <p className="font-medium text-sm">{uc.coupon.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {uc.isUsed
                      ? `사용일: ${uc.usedAt ? new Date(uc.usedAt).toLocaleDateString() : "-"}`
                      : `만료일: ${new Date(uc.coupon.endDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 프로모코드 사용 내역 */}
      {promoHistory && promoHistory.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium text-muted-foreground mb-3">프로모코드 사용 내역</p>
          <div className="space-y-2">
            {promoHistory.map((h: any) => (
              <div key={h.id} className="border rounded-xl p-3 flex items-center gap-3">
                <div className="bg-primary/5 rounded-lg p-2">
                  <Tag className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{h.promoCode?.name}</p>
                  <p className="text-xs text-muted-foreground">{h.promoCode?.code} · {new Date(h.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className="text-xs">{h.promoCode?.discountType === "percent" ? `${h.promoCode?.discountValue}%` : formatPrice(h.promoCode?.discountValue)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </MyPageLayout>
  );
}
