import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { productHref } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, Package } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function MyRestockAlerts() {
  const { data: alerts, isLoading, refetch } = trpc.restockAlert.list.useQuery();
  const deleteMutation = trpc.restockAlert.delete.useMutation({
    onSuccess: () => {
      toast.success("재입고 알림이 삭제되었습니다");
      refetch();
    },
  });

  if (isLoading) {
    return <MyPageLayout title="재입고 알림"><p className="text-center text-muted-foreground py-12">로딩 중...</p></MyPageLayout>;
  }

  return (
    <MyPageLayout title="재입고 알림">
        <p className="text-muted-foreground mb-6">품절된 상품이 재입고되면 알림을 받을 수 있습니다</p>

      {!alerts || alerts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground mb-2">신청한 재입고 알림이 없습니다</p>
          <p className="text-sm text-muted-foreground">품절된 상품 상세 페이지에서 재입고 알림을 신청할 수 있습니다</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="flex gap-4">
                {alert.productThumbnail && (
                  <Link href={productHref(alert.productSlug)}>
                    <img
                      src={alert.productThumbnail}
                      alt={alert.productName || ""}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </Link>
                )}
                <div className="flex-1">
                  <Link href={productHref(alert.productSlug)}>
                    <h3 className="font-semibold text-lg hover:underline">{alert.productName}</h3>
                  </Link>
                  {alert.optionName && alert.optionValue && (
                    <p className="text-sm text-muted-foreground mt-1">
                      옵션: {alert.optionName} - {alert.optionValue}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {alert.isNotified ? (
                      <Badge variant="default" className="gap-1">
                        <Bell className="w-3 h-3" />
                        알림 발송됨
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Bell className="w-3 h-3" />
                        대기 중
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      신청일: {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                    {alert.notifiedAt && (
                      <span className="text-xs text-muted-foreground">
                        알림일: {new Date(alert.notifiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate({ id: alert.id })}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </MyPageLayout>
  );
}
