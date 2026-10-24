import { Link, useLocation } from "wouter";
import { useGetMe, useLogout, type UserInfo } from "@workspace/api-client-react";
import { Package, ShoppingCart, Clock, Users, LayoutDashboard, LogOut, Menu, X, ChevronRight, CheckCircle2, UserCircle, Bell, MessageSquare, MapPin, Building2, Receipt, FolderTree, Boxes, ChevronDown, Truck, CreditCard, PackageCheck, ClipboardList, Settings, Ticket, Coins, LayoutGrid, Sparkles, Tag, AlarmClock, Timer, Flame, Star, TrendingDown, ImageIcon, Gift, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../store/cart";
import { cn } from "../lib/utils";
import seoulmonoLogo from "@assets/seoulmono_logo.svg";

type NavLink = {
  href: string;
  label: string;
  icon: any;
  badge?: number;
  children?: { href: string; label: string; icon: any }[];
};

export function Layout({ children, user }: { children: React.ReactNode, user: UserInfo }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const initial = new Set<string>(["注文・配送管理"]);
    if (path.includes("/admin/main-shop")) initial.add("メインショップ管理");
    if (path.includes("/admin/banners") || path.includes("/admin/coupons") || path.includes("/admin/points")) initial.add("基本設定");
    if (path.includes("/admin/products") || path.includes("/admin/categories")) initial.add("商品管理");
    if (path.includes("/admin/gifts") || path.includes("/admin/gift-categories")) initial.add("ギフト管理");
    return initial;
  });
  const cartItems = useCart(s => s.items);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  
  const partnerLinks: NavLink[] = [
    { href: "/", label: "商品一覧", icon: Package },
    { href: "/cart", label: "カート", icon: ShoppingCart, badge: cartItems.length },
    { href: "/orders", label: "注文履歴", icon: Clock },
    { href: "/addresses", label: "配送先管理", icon: MapPin },
    { href: "/notices", label: "お知らせ", icon: Bell },
    { href: "/inquiries", label: "お問い合わせ", icon: MessageSquare },
  ];
  
  const adminLinks: NavLink[] = [
    {
      href: "/admin/settings", label: "基本設定", icon: Settings,
      children: [
        { href: "/admin/banners", label: "バナー管理", icon: ImageIcon },
        { href: "/admin/coupons", label: "クーポン管理", icon: Ticket },
        { href: "/admin/points", label: "ポイント管理", icon: Coins },
        { href: "/admin/menu-order", label: "メニュー順序", icon: Settings },
      ],
    },
    { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
    {
      href: "/admin/main-shop", label: "メインショップ管理", icon: LayoutGrid,
      children: [
        { href: "/admin/main-shop/new",            label: "新商品",           icon: Sparkles },
        { href: "/admin/main-shop/brand",         label: "ソウルモノ ブランド",     icon: Tag },
        { href: "/admin/main-shop/first_purchase", label: "初回購入100円",     icon: Coins },
        { href: "/admin/main-shop/expire",        label: "賞味期限間近特価", icon: AlarmClock },
        { href: "/admin/main-shop/time",          label: "タイムセール",          icon: Timer },
        { href: "/admin/main-shop/limited",       label: "限定特価",          icon: Flame },
        { href: "/admin/main-shop/brand_special", label: "ブランド特価",        icon: Star },
        { href: "/admin/main-shop/lowest",        label: "最安値チャレンジ",       icon: TrendingDown },
      ],
    },
    { href: "/admin/members", label: "会員管理", icon: Users },
    {
      href: "/admin/products", label: "商品管理", icon: Boxes,
      children: [
        { href: "/admin/products", label: "商品一覧", icon: Package },
        { href: "/admin/categories", label: "商品カテゴリ", icon: FolderTree },
      ],
    },
    {
      href: "/admin/gifts", label: "ギフト管理", icon: Gift,
      children: [
        { href: "/admin/gifts", label: "ギフト商品管理", icon: Boxes },
        { href: "/admin/gift-categories", label: "ギフトカテゴリ", icon: FolderTree },
      ],
    },
    {
      href: "/admin/orders", label: "注文・配送管理", icon: Package,
      children: [
        { href: "/admin/orders", label: "すべて", icon: ClipboardList },
        { href: "/admin/orders?status=주문접수", label: "注文", icon: ShoppingCart },
        { href: "/admin/orders?status=처리중", label: "入金", icon: CreditCard },
        { href: "/admin/orders?status=배송준비", label: "配送前(準備)", icon: PackageCheck },
        { href: "/admin/orders?status=배송중", label: "配送中", icon: Truck },
        { href: "/admin/orders?status=배송완료", label: "配送完了", icon: CheckCircle2 },
      ],
    },
    { href: "/admin/settlement", label: "精算管理", icon: Receipt },
    { href: "/admin/bank", label: "システム設定", icon: Settings },
    { href: "/notices", label: "お知らせ", icon: Bell },
    { href: "/inquiries", label: "お問い合わせ管理", icon: MessageSquare },
  ];

  const links = user.is_admin ? adminLinks : partnerLinks;
  
  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => {
        localStorage.removeItem("token");
        window.location.href = `${import.meta.env.BASE_URL}login`;
      }
    });
  };

  const [searchStr, setSearchStr] = useState(typeof window !== "undefined" ? window.location.search : "");
  
  useEffect(() => {
    const syncSearch = () => setSearchStr(window.location.search);
    window.addEventListener("popstate", syncSearch);
    window.addEventListener("order-status-change", syncSearch);
    return () => {
      window.removeEventListener("popstate", syncSearch);
      window.removeEventListener("order-status-change", syncSearch);
    };
  }, []);

  const fullPath = location + searchStr;

  const NavLinks = () => (
    <div className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        
        if (link.children) {
          const isExpanded = expandedMenus.has(link.label);
          const isParentActive = location.startsWith(link.href);
          return (
            <div key={link.label}>
              <div
                onClick={() => toggleMenu(link.label)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-medium",
                  isParentActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", isParentActive ? "text-primary" : "text-slate-400")} />
                  {link.label}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
              </div>
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-200 pl-3">
                  {link.children.map((child) => {
                    const ChildIcon = child.icon;
                    const hasQuery = child.href.includes("?");
                    let active: boolean;
                    if (hasQuery) {
                      const childUrl = new URL(child.href, "http://x");
                      const childStatus = childUrl.searchParams.get("status");
                      const currentStatus = new URLSearchParams(searchStr).get("status");
                      const isOnOrdersPage = location === "/admin/orders";
                      active = isOnOrdersPage && (childStatus ? childStatus === currentStatus : !currentStatus);
                    } else {
                      active = location === child.href;
                    }
                    const handleChildClick = () => {
                      setMobileMenuOpen(false);
                      if (hasQuery) setTimeout(() => window.dispatchEvent(new Event("order-status-change")), 50);
                    };
                    return (
                      <Link key={child.href} href={child.href} onClick={handleChildClick}>
                        <div className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer text-sm",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}>
                          <ChildIcon className={cn("w-4 h-4", active ? "text-primary-foreground" : "text-slate-400")} />
                          {child.label}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const isActive = location === link.href;
        return (
          <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
            <div className={cn(
              "flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer font-medium",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}>
              <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-slate-400")} />
                {link.label}
              </div>
              {link.badge !== undefined && link.badge > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-bold",
                  isActive ? "bg-white text-primary" : "bg-accent text-white"
                )}>
                  {link.badge}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200 z-20">
        <div className="p-6 border-b border-slate-100">
          {user.is_admin ? (
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">ソウルモノ</h1>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">管理者</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <img src={seoulmonoLogo} alt="ソウルモノ" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">ソウルモノ</h1>
                <p className="text-xs font-medium text-slate-500 tracking-wider">B2B発注システム</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="mb-6 px-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">メニュー</p>
            <NavLinks />
          </div>
        </div>

        {!user.is_admin && (
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  {user.mb_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.company_name || user.mb_name}</p>
                  <div className="flex items-center text-xs text-slate-500 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1" />
                    承認済みの取引先
                  </div>
                </div>
              </div>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-2 px-4 py-2.5 mb-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors font-medium text-sm cursor-pointer">
                  <UserCircle className="w-4 h-4" />
                  マイ情報を見る
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-red-600 transition-colors font-medium text-sm disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop top bar – admin only */}
        {user.is_admin && (
          <div className="hidden md:flex items-center justify-end gap-3 h-11 px-6 bg-white border-b border-slate-100">
            <button
              onClick={() => window.open('https://seoulmono.com', '_blank')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="font-medium">ユーザーページ</span>
            </button>
            <span className="text-slate-200">|</span>
            <span className="text-xs text-slate-400">管理者</span>
            <span className="text-sm font-semibold text-slate-700">{user.mb_name}</span>
            <span className="text-slate-200">|</span>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-3 h-3" />
              {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        )}

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 z-20">
          <div className="flex items-center gap-2">
            <img src={seoulmonoLogo} alt="ソウルモノ" className="w-8 h-8 object-contain" />
            <h1 className="text-lg font-black text-slate-900">ソウルモノ</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-10 bg-white pt-16 flex flex-col animate-in slide-in-from-top-2">
            <div className="flex-1 overflow-y-auto p-4">
              <NavLinks />
            </div>
            <div className="p-6 border-t border-slate-100 pb-safe">
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-full gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold"
              >
                <LogOut className="w-5 h-5" />
                ログアウト
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="p-2 md:p-3 lg:p-4 pb-24">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
