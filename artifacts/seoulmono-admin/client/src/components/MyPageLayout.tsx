import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  Package, Star, MapPin, Bell, Heart, User, Ticket,
  MessageSquare, FileText, ChevronRight, LogOut
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const menuSections = [
  {
    title: "ショッピング情報",
    items: [
      { href: "/mypage/orders", icon: Package, label: "注文履歴" },
      { href: "/mypage/points", icon: Star, label: "ポイント" },
      { href: "/mypage/coupons", icon: Ticket, label: "クーポン" },
      { href: "/mypage/reviews", icon: FileText, label: "マイレビュー" },
    ],
  },
  {
    title: "通知・お気に入り",
    items: [
      { href: "/mypage/notifications", icon: Bell, label: "通知" },
      { href: "/mypage/restock-alerts", icon: Bell, label: "再入荷通知" },
      { href: "/wishlist", icon: Heart, label: "お気に入り" },
    ],
  },
  {
    title: "サポート",
    items: [
      { href: "/mypage/qna", icon: MessageSquare, label: "商品Q&A" },
      { href: "/mypage/inquiries", icon: MessageSquare, label: "お問い合わせ" },
      { href: "/mypage/addresses", icon: MapPin, label: "配送先管理" },
      { href: "/mypage/profile", icon: User, label: "会員情報編集" },
    ],
  },
];

interface MyPageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function MyPageLayout({ children, title }: MyPageLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { data: profile } = trpc.user.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: notifData } = trpc.user.notifications.useQuery(undefined, { enabled: isAuthenticated });
  const [location] = useLocation();

  if (!loading && !isAuthenticated) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold mb-2">ログインが必要です</h2>
          <Button asChild className="mt-4"><a href={getLoginUrl()}>ログイン</a></Button>
        </div>
      </Layout>
    );
  }

  const unreadCount = notifData?.unreadCount ?? 0;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex gap-8">
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-5">
              <Link href="/mypage">
                <div className="bg-card border rounded-xl p-5 hover:elegant-shadow transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm truncate">{profile?.name ?? user?.name ?? "회원"}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{profile?.email ?? user?.email}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span>ポイント <strong className="text-primary">{(profile?.points ?? 0).toLocaleString()}P</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <nav className="bg-card border rounded-xl overflow-hidden">
                {menuSections.map((section, sIdx) => (
                  <div key={section.title}>
                    {sIdx > 0 && <div className="border-t mx-4" />}
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</p>
                    </div>
                    {section.items.map(item => {
                      const isActive = location === item.href || (item.href !== "/mypage" && location.startsWith(item.href));
                      const showBadge = item.href === "/mypage/notifications" && unreadCount > 0;
                      return (
                        <Link key={item.href} href={item.href}>
                          <div className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-accent/50 text-foreground"}`}>
                            <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="flex-1">{item.label}</span>
                            {showBadge && (
                              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}

                <div className="border-t mx-4" />
                <button
                  onClick={() => logout?.()}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ログアウト</span>
                </button>
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {title && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link href="/mypage" className="hover:text-foreground">マイページ</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-foreground font-medium">{title}</span>
                </div>
                <h1 className="text-2xl font-bold">{title}</h1>
              </div>
            )}

            <div className="md:hidden mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {menuSections.flatMap(s => s.items).map(item => {
                  const isActive = location === item.href || (item.href !== "/mypage" && location.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
                        <item.icon className="w-3 h-3" />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </Layout>
  );
}
