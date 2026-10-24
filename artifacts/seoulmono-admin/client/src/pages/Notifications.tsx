import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Bell, Package, MessageCircle, Star, Info, CheckCheck, ShieldAlert, HelpCircle, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const iconMap: Record<string, any> = { order: Package, comment: MessageCircle, point: Star, system: Info, review: Star, inquiry: HelpCircle, discussion: MessageCircle };

export default function Notifications() {
  useAuth({ redirectOnUnauthenticated: true });
  const { data } = trpc.user.notifications.useQuery();
  const utils = trpc.useUtils();
  const markRead = trpc.user.markNotificationRead.useMutation({ onSuccess: () => utils.user.notifications.invalidate() });
  const markAllRead = trpc.user.markAllNotificationsRead.useMutation({ onSuccess: () => { utils.user.notifications.invalidate(); toast.success("모두 읽음 처리되었습니다"); } });
  const deleteOne = trpc.user.deleteNotification.useMutation({ onSuccess: () => utils.user.notifications.invalidate() });
  const deleteAll = trpc.user.deleteAllNotifications.useMutation({ onSuccess: () => { utils.user.notifications.invalidate(); toast.success("알림이 모두 삭제되었습니다"); } });

  const notifications = data?.notifications ?? [];

  return (
    <MyPageLayout title={`알림 (${data?.unreadCount ?? 0}건 미읽음)`}>
        <div className="flex justify-end gap-2 mb-6">
          {(data?.unreadCount ?? 0) > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck className="w-4 h-4 mr-1" />모두 읽음
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { if (confirm("알림을 모두 삭제하시겠습니까?")) deleteAll.mutate(); }} disabled={deleteAll.isPending} className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60">
              <Trash2 className="w-4 h-4 mr-1" />모두 삭제
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground"><Bell className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">알림이 없습니다</p></div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const Icon = iconMap[n.type] ?? Info;
              return (
                <div
                  key={n.id}
                  onClick={() => { if (!n.isRead) markRead.mutate({ id: n.id }); }}
                  className={`flex gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                    n.title === "통관검사 안내"
                      ? (n.isRead ? "bg-rose-50/50 border-rose-200" : "bg-rose-50 border-rose-300")
                      : (n.isRead ? "bg-card" : "bg-primary/5 border-primary/20")
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    n.title === "통관검사 안내"
                      ? "bg-rose-100"
                      : (n.isRead ? "bg-secondary" : "bg-primary/10")
                  }`}>
                    {n.title === "통관검사 안내"
                      ? <ShieldAlert className="w-4 h-4 text-rose-600" />
                      : <Icon className={`w-4 h-4 ${n.isRead ? "text-muted-foreground" : "text-primary"}`} />
                    }
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${n.isRead ? "" : "font-semibold"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {n.link && <Link href={n.link} className="text-xs text-primary hover:underline self-center" onClick={e => e.stopPropagation()}>보기</Link>}
                    <button
                      onClick={e => { e.stopPropagation(); deleteOne.mutate({ id: n.id }); }}
                      disabled={deleteOne.isPending}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="알림 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </MyPageLayout>
  );
}
