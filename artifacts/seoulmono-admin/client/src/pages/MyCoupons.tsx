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
      toast.success(`「${data.couponName}」クーポンを登録しました`);
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
      const max = coupon.maxDiscountAmount ? ` (最大 ${formatPrice(coupon.maxDiscountAmount)})` : "";
      return `${coupon.discountValue}%${max}`;
    }
    return formatPrice(coupon.discountValue);
  };

  return (
    <MyPageLayout title="クーポン">

      {/* 쿠폰 코드 등록 */}
      <div className="bg-card border rounded-xl p-4 mb-6">
        <p className="text-sm font-medium mb-2">クーポンコード登録</p>
        <div className="flex gap-2">
          <Input
            placeholder="クーポンコードを入力してください"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), couponCode.trim() && downloadByCode.mutate({ code: couponCode.trim() }))}
            className="flex-1"
          />
          <Button
            onClick={() => couponCode.trim() && downloadByCode.mutate({ code: couponCode.trim() })}
            disabled={!couponCode.trim() || downloadByCode.isPending}
          >
            登録
          </Button>
        </div>
      </div>

      {/* 사용 가능한 쿠폰 */}
      <div className="space-y-3">
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground text-sm">読み込み中...</div>
        )}
        {!isLoading && usableCoupons.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ご利用可能なクーポンはありません</p>
            <p className="text-xs mt-1 opacity-60">クーポンコードをお持ちの場合は上に入力してください</p>
          </div>
        )}
        {usableCoupons.map(uc => (
          <div key={uc.id} className="border rounded-xl overflow-hidden flex">
            <div className="bg-primary/5 border-r border-dashed p-4 flex flex-col items-center justify-center min-w-[100px]">
              <Ticket className="w-5 h-5 text-primary mb-1" />
              <span className="text-lg font-bold text-primary">{formatDiscount(uc.coupon)}</span>
              <span className="text-[10px] text-muted-foreground">割引</span>
            </div>
            <div className="p-4 flex-1">
              <p className="font-medium text-sm">{uc.coupon.name}</p>
              {uc.coupon.description && <p className="text-xs text-muted-foreground mt-0.5">{uc.coupon.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{new Date(uc.coupon.endDate).toLocaleDateString()}</span>
                {uc.coupon.minOrderAmount > 0 && <span>{formatPrice(uc.coupon.minOrderAmount)} 以上のご購入で</span>}
              </div>
            </div>
          </div>
        ))}

        {/* 사용완료 / 만료 */}
        {usedOrExpired.length > 0 && (
          <>
            <p className="text-sm font-medium text-muted-foreground pt-4">使用済み / 期限切れ</p>
            {usedOrExpired.map(uc => (
              <div key={uc.id} className="border rounded-xl overflow-hidden flex opacity-50">
                <div className="bg-secondary/30 border-r border-dashed p-4 flex flex-col items-center justify-center min-w-[100px]">
                  {uc.isUsed
                    ? <CheckCircle2 className="w-5 h-5 text-muted-foreground mb-1" />
                    : <Clock className="w-5 h-5 text-muted-foreground mb-1" />}
                  <span className="text-lg font-bold text-muted-foreground">{formatDiscount(uc.coupon)}</span>
                  <span className="text-[10px] text-muted-foreground">{uc.isUsed ? "使用済み" : "期限切れ"}</span>
                </div>
                <div className="p-4 flex-1">
                  <p className="font-medium text-sm">{uc.coupon.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {uc.isUsed
                      ? `使用日: ${uc.usedAt ? new Date(uc.usedAt).toLocaleDateString() : "-"}`
                      : `有効期限: ${new Date(uc.coupon.endDate).toLocaleDateString()}`}
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
          <p className="text-sm font-medium text-muted-foreground mb-3">プロモコード使用履歴</p>
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
