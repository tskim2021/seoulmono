import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { formatPrice, proxyImage } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Search, ShoppingCart, Heart, Bell, User, Menu, X, ChevronDown, LogOut, Package, MapPin, Star, Settings, LayoutDashboard, TrendingUp,
  Truck, CreditCard, HelpCircle, MessageSquare, Eye, ShoppingBag, Clock, Ticket, FileText, TrendingDown, Megaphone, ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { ChatbotWidgetV2 } from "./ChatbotWidgetV2";
import CompareWidget from "./CompareWidget";
import { useState, useRef, useEffect, useCallback, type ReactNode, useMemo } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const NAV_LINKS = [
  { href: "/products", label: "ショップ" },
  { href: "/products?filter=new", label: "新商品" },
  { href: "/products?filter=best", label: "ベスト" },
  { href: "/products?filter=featured", label: "おすすめ商品" },
  { href: "/products?filter=sale", label: "特価" },
  { href: "/shop/itemuselist.php", label: "お客様レビュー" },
  {
    href: "/news",
    label: "健康ニュース"
  },
  { href: "/bbs/board.php?bo_table=info", label: "情報共有" },
  {
    href: "/customer-service",
    label: "お問い合わせ",
    subMenu: [
      { href: "/bbs/board.php?bo_table=notice", label: "お知らせ" },
      { href: "/customer-service/faq", label: "FAQ" },
      { href: "/community/qna", label: "商品Q&A" },
      { href: "/customer-service/inquiry", label: "個別お問い合わせ" },
    ]
  },
];

type NavLink = {
  href: string;
  label: string;
  external?: boolean;
  subMenu?: { href: string; label: string; external?: boolean }[];
};

function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.user.notifications.useQuery(undefined, { enabled: isAuthenticated });
  const unread = data?.unreadCount ?? 0;
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => { if (timerRef.current) clearTimeout(timerRef.current); setOpen(true); };
  const handleMouseLeave = () => { timerRef.current = setTimeout(() => setOpen(false), 150); };

  const recent = (data?.notifications ?? []).slice(0, 5);

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link href="/mypage/notifications" className="relative p-2 hover:bg-accent rounded-full transition-colors flex">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">通知</span>
            <Link href="/mypage/notifications" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              すべて見る <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">通知はありません</div>
          ) : (
            <ul>
              {recent.map((n: any) => (
                <li key={n.id}>
                  <Link href="/mypage/notifications" className={`flex items-start gap-2.5 px-4 py-3 hover:bg-accent transition-colors ${!n.isRead ? "bg-primary/5" : ""}`}>
                    <Bell className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${!n.isRead ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm line-clamp-1 ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.message}</p>
                    </div>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NoticePopover() {
  const [open, setOpen] = useState(false);
  const { data: notices } = trpc.community.recentBySlug.useQuery({ slug: "notice", limit: 5 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button className="p-2 hover:bg-accent rounded-full transition-colors relative">
        <Megaphone className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">お知らせ</span>
            <Link href="/bbs/board.php?bo_table=notice" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              すべて見る <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {!notices || notices.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">お知らせはありません</div>
          ) : (
            <ul>
              {notices.map((n: any) => (
                <li key={n.id}>
                  <Link href={`/community/post/${n.id}`} className="flex items-start gap-2 px-4 py-2.5 hover:bg-accent transition-colors">
                    <Megaphone className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm line-clamp-1 flex-1">{n.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CartBadge() {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const count = data?.length ?? 0;
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => { if (timerRef.current) clearTimeout(timerRef.current); setOpen(true); };
  const handleMouseLeave = () => { timerRef.current = setTimeout(() => setOpen(false), 150); };

  const total = (data ?? []).reduce((sum: number, item: any) => {
    const price = item.optionPrice ?? item.product?.salePrice ?? item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link href="/cart" className="relative p-2 hover:bg-accent rounded-full transition-colors flex">
        <ShoppingCart className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/40">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">カート {count > 0 ? `(${count})` : ""}</span>
            <Link href="/cart" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              すべて見る <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {count === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">カートは空です</div>
          ) : (
            <>
              <ul className="max-h-64 overflow-y-auto divide-y">
                {(data ?? []).slice(0, 5).map((item: any) => {
                  const price = item.optionPrice ?? item.product?.salePrice ?? item.product?.price ?? 0;
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {item.product?.thumbnail
                          ? <img src={proxyImage(item.product.thumbnail)} alt={item.product?.name} className="w-full h-full object-cover" />
                          : <ShoppingBag className="w-5 h-5 m-auto mt-2.5 text-muted-foreground/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-1">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.quantity}個 · {formatPrice(price * item.quantity)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between">
                <span className="text-sm font-medium">合計</span>
                <span className="text-sm font-bold text-primary">{formatPrice(total)}</span>
              </div>
              <div className="px-4 pb-3">
                <Link href="/checkout">
                  <button className="w-full bg-primary text-primary-foreground text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-opacity">
                    今すぐ決済
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => { if (timerRef.current) clearTimeout(timerRef.current); setOpen(true); };
  const handleMouseLeave = () => { timerRef.current = setTimeout(() => setOpen(false), 150); };
  const toggleMenu = () => setOpen(prev => !prev);

  if (!isAuthenticated) {
    return (
      <a href={getLoginUrl()} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
        <User className="w-5 h-5" />
        <span className="hidden sm:inline">ログイン</span>
      </a>
    );
  }

  const menuLink = "flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors w-full";

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors p-2 rounded-full hover:bg-accent" onClick={toggleMenu}>
        <User className="w-5 h-5" />
        <span className="hidden sm:inline max-w-[80px] truncate">{user?.name ?? "会員"}</span>
        <ChevronDown className="w-3 h-3 hidden sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-popover border rounded-xl shadow-lg z-50 overflow-hidden py-1">
          <Link href="/mypage" className={menuLink}><LayoutDashboard className="w-4 h-4" />マイページ</Link>
          <div className="h-px bg-border my-1" />
          <div className="px-4 py-1"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ショッピング情報</p></div>
          <Link href="/mypage/orders" className={menuLink}><Package className="w-4 h-4" />注文履歴</Link>
          <Link href="/mypage/points" className={menuLink}><Star className="w-4 h-4" />ポイント</Link>
          <Link href="/mypage/coupons" className={menuLink}><Ticket className="w-4 h-4" />クーポン</Link>
          <Link href="/mypage/reviews" className={menuLink}><FileText className="w-4 h-4" />マイレビュー</Link>
          <div className="h-px bg-border my-1" />
          <div className="px-4 py-1"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">通知・お気に入り</p></div>
          <Link href="/mypage/notifications" className={menuLink}><Bell className="w-4 h-4" />通知</Link>
          <Link href="/mypage/restock-alerts" className={menuLink}><Bell className="w-4 h-4" />再入荷通知</Link>
          <Link href="/wishlist" className={menuLink}><Heart className="w-4 h-4" />お気に入り</Link>
          <div className="h-px bg-border my-1" />
          <div className="px-4 py-1"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">サポート</p></div>
          <Link href="/mypage/inquiries" className={menuLink}><MessageSquare className="w-4 h-4" />個別お問い合わせ</Link>
          <Link href="/mypage/addresses" className={menuLink}><MapPin className="w-4 h-4" />配送先管理</Link>
          <Link href="/mypage/profile" className={menuLink}><User className="w-4 h-4" />会員情報の変更</Link>
          {user?.role === "admin" && (
            <>
              <div className="h-px bg-border my-1" />
              <Link href="/admin" className={menuLink} onClick={() => window.scrollTo(0, 0)}><Settings className="w-4 h-4" />管理画面</Link>
            </>
          )}
          <div className="h-px bg-border my-1" />
          <button onClick={() => logout()} className={`${menuLink} text-destructive`}><LogOut className="w-4 h-4" />ログアウト</button>
        </div>
      )}
    </div>
  );
}

function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [, navigate] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autocomplete query - only fetch when input has 1+ chars
  const trimmed = query.trim();
  const { data: suggestions } = trpc.product.autocomplete.useQuery(
    { query: trimmed },
    { enabled: trimmed.length >= 1, staleTime: 30_000 }
  );

  // Popular keywords fallback when input is empty
  const { data: popularKw } = trpc.product.popularKeywords.useQuery(undefined, {
    staleTime: 60_000,
  });

  const items = trimmed.length >= 1 ? (suggestions ?? []) : (popularKw ?? []).slice(0, 8);
  const showDropdown = open && items.length > 0;

  const doSearch = useCallback((term: string) => {
    const t = term.trim();
    if (t) {
      navigate(`/products?search=${encodeURIComponent(t)}`);
      setQuery(t);
      setOpen(false);
      inputRef.current?.blur();
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && activeIdx < items.length) {
      doSearch(items[activeIdx].keyword);
    } else {
      doSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(prev => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(prev => (prev <= 0 ? items.length - 1 : prev - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset active index when items change
  useEffect(() => { setActiveIdx(-1); }, [items.length, trimmed]);

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="商品を検索"
          autoComplete="off"
          className="w-full h-10 pl-4 pr-10 rounded-full border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border/80 rounded-xl shadow-lg overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-150">
          {trimmed.length < 1 && (
            <div className="px-3 pt-2.5 pb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>人気検索ワード</span>
            </div>
          )}
          <ul role="listbox">
            {items.map((item, idx) => (
              <li
                key={item.keyword}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={(e) => { e.preventDefault(); doSearch(item.keyword); }}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                  idx === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                }`}
              >
                {trimmed.length < 1 ? (
                  <span className="w-5 text-center text-xs font-semibold text-primary/70">{idx + 1}</span>
                ) : (
                  <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 truncate">
                  {trimmed.length >= 1 ? highlightMatch(item.keyword, trimmed) : item.keyword}
                </span>
                {item.searchCount > 5 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{item.searchCount}回</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Highlight matching prefix in keyword */
function highlightMatch(keyword: string, prefix: string) {
  const lower = keyword.toLowerCase();
  const pLower = prefix.toLowerCase();
  if (!lower.startsWith(pLower)) return keyword;
  return (
    <>
      <span className="font-semibold text-primary">{keyword.slice(0, prefix.length)}</span>
      {keyword.slice(prefix.length)}
    </>
  );
}

function Header() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/60">
      {/* Top bar */}
      <div className="container">
        <div className="flex items-center justify-between h-[112px] gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-10 h-10 rounded-[30%] bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-black text-2xl leading-none">A</span>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xl font-black tracking-tight">
                AME <span className="text-primary">PLUS</span>
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">アメプラス</span>
            </span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isAuthenticated && <NotificationBell />}
            <Link href="/wishlist" className="p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex">
              <Heart className="w-5 h-5" />
            </Link>
            <NoticePopover />
            <CartBadge />
            <UserMenu />
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-accent rounded-full transition-colors md:hidden">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetTitle className="sr-only">メニュー</SheetTitle>
                <div className="p-6">
                  <div className="mb-6">
                    <SearchBar />
                  </div>
                  <nav className="space-y-1">
                    {NAV_LINKS.map(link => (
                      link.external ? (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileOpen(false)}
                          className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                        >
                          {link.label}
                        </Link>
                      )
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:block border-t border-border/40">
        <div className="container">
          <div className="flex items-center h-11">
            <div className="shrink-0 flex items-center">
              <CategoryDropdown />
            </div>
            <div className="h-4 w-px bg-border/60 shrink-0 mx-4" />
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide whitespace-nowrap flex-1">
              {NAV_LINKS.map(link => {
                if (link.subMenu) {
                  return (
                    <DropdownMenu key={link.href}>
                      <DropdownMenuTrigger asChild>
                        <button className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 shrink-0 ${
                          location.startsWith(link.href.split("?")[0]) ? "text-primary" : "text-muted-foreground"
                        }`}>
                          {link.label}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {link.subMenu.map(sub => (
                          <DropdownMenuItem key={sub.href} asChild>
                            {sub.external ? (
                              <a href={sub.href} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                {sub.label}
                              </a>
                            ) : (
                              <Link href={sub.href} className="cursor-pointer">
                                {sub.label}
                              </Link>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                return link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium transition-colors hover:text-primary shrink-0 text-muted-foreground"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-primary shrink-0 ${
                      location.startsWith(link.href.split("?")[0]) ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <AdminNavLink />
          </div>
        </div>
      </nav>
    </header>
  );
}

function AdminNavLink() {
  const { user } = useAuth();
  if (!user || user.role !== "admin") return null;
  return (
    <Link
      href="/admin"
      className="shrink-0 ml-4 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
    >
      <Settings className="w-4 h-4" />
      管理画面
    </Link>
  );
}

const CATEGORY_NAV = [
  { label: "全商品", href: "/products" },
  { label: "薄毛・ヘアケア", href: "/products?category=hair-loss" },
  { label: "性機能",   href: "/products?category=sexual-health" },
  { label: "スキンケア・美容", href: "/products?category=skin-beauty" },
  { label: "ダイエット", href: "/products?category=diet" },
  { label: "その他",   href: "/products?category=etc" },
];

function CategoryDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors shrink-0 whitespace-nowrap">
          <Menu className="w-4 h-4 shrink-0" />
          カテゴリ
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {CATEGORY_NAV.map(cat => (
          <DropdownMenuItem key={cat.label} asChild>
            <Link href={cat.href}>{cat.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QuickMenu() {
  const menuItems = [
    { icon: Truck, label: "注文・配送", href: "/mypage/orders" },
    { icon: CreditCard, label: "個別決済", href: "/checkout" },
    { icon: HelpCircle, label: "FAQ", href: "/customer-service/faq" },
    { icon: MessageSquare, label: "個別お問い合わせ", href: "/customer-service/inquiry" },
    { icon: ShoppingCart, label: "カート", href: "/cart" },
    { icon: Eye, label: "最近見た商品", href: "/products" },
    { icon: Search, label: "商品を探す", href: "/products" },
    { icon: Heart, label: "お気に入り", href: "/wishlist" },
  ];
  return (
    <div>
      <h3 className="text-sm font-bold mb-4">Quick Menu</h3>
      <div className="grid grid-cols-4 gap-2">
        {menuItems.map(item => (
          <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-accent transition-colors group">
            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
              <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CSCenter() {
  return (
    <div>
      <h3 className="text-sm font-bold mb-4">CS Center</h3>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">お客様相談</p>
            <a href="mailto:hlschool.cs@gmail.com" className="text-lg sm:text-xl font-bold text-foreground hover:text-primary transition-colors break-all">
              hlschool.cs@gmail.com
            </a>
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">お支払い案内</p>
            <p className="text-sm font-medium">クレジット/デビットカードでお支払いいただけます。</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-border/60">
          <div className="flex-1">
            <p className="text-xs font-semibold mb-1.5">· ご相談案内</p>
            <p className="text-xs text-muted-foreground leading-relaxed">· ご相談はリアルタイムで対応しています。</p>
            <p className="text-xs text-muted-foreground leading-relaxed">· お問い合わせはフォームまたはメールでお願いいたします。</p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold mb-1.5">· 注文締切時間</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xl font-bold">10:00</span>
                <span className="text-xs text-muted-foreground">AM</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p>平日午前10時まで</p>
                <p>のご注文は当日出荷いたします。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const LEFT_LINKS = [
    { label: "会社概要", href: "/about" },
    { label: "利用規約", href: "/terms" },
    { label: "プライバシーポリシー", href: "/privacy" },
    { label: "配送のご案内", href: "/shipping-guide" },
  ];
  const RIGHT_LINKS = [
    { label: "お知らせ", href: "/bbs/board.php?bo_table=notice" },
    { label: "FAQ", href: "/customer-service/faq" },
    { label: "商品Q&A", href: "/community/qna" },
    { label: "個別お問い合わせ", href: "/customer-service/inquiry" },
  ];

  const NoticePreview = () => {
    const { data, isLoading } = trpc.community.recentBySlug.useQuery({ slug: "notice", limit: 3 });
    const fmtDate = (date: string | Date) => {
      const d = new Date(date);
      const yy = String(d.getFullYear()).slice(2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yy}.${mm}.${dd}`;
    };
    return (
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">お知らせ</h3>
          <Link href="/bbs/board.php?bo_table=notice" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
            もっと見る <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {(data ?? []).map((post: any) => (
              <li key={post.id}>
                <Link href={`/bbs/board.php?bo_table=notice&wr_id=${post.id}`} className="flex items-center justify-between gap-4 py-4 group">
                  <span className="text-sm text-foreground/90 truncate flex-1 group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </span>
                  <span className="text-sm text-muted-foreground shrink-0 tabular-nums">{fmtDate(post.createdAt)}</span>
                </Link>
              </li>
            ))}
            {(!data || data.length === 0) && (
              <li className="text-sm text-muted-foreground py-6 text-center">投稿はありません</li>
            )}
          </ul>
        )}
      </div>
    );
  };

  const CustomerCenter = () => (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground font-medium">お問い合わせ</p>
      <p className="text-base font-semibold leading-snug">ご不明な点はありませんか？<br /><span className="text-primary">お問い合わせ</span>で迅速にご回答いたします。</p>
      <Link href="/customer-service/inquiry">
        <span className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
          お問い合わせはこちら
        </span>
      </Link>
    </div>
  );

  const AppDownload = () => (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground font-medium">アプリダウンロード</p>
      <div className="flex gap-3">
        <button onClick={() => toast.info("アプリは準備中です。もう少しお待ちください！😊")} className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
            <path d="M3.18 1.05C2.76 1.29 2.5 1.73 2.5 2.26v19.48c0 .53.26.97.68 1.21l.1.06 10.91-10.91v-.26L3.28.99l-.1.06z" fill="#EA4335"/>
            <path d="M17.47 15.43l-3.63-3.64v-.27l3.63-3.63.08.05 4.3 2.44c1.23.7 1.23 1.84 0 2.54l-4.3 2.44-.08.07z" fill="#FBBC04"/>
            <path d="M17.55 15.36L13.88 11.7 3.18 22.4c.41.43 1.07.49 1.82.05l12.55-7.09" fill="#34A853"/>
            <path d="M17.55 8.04L5 .95C4.25.51 3.59.57 3.18 1l10.7 10.71 3.67-3.67z" fill="#EA4335"/>
          </svg>
          <span className="text-xs text-muted-foreground">Google Play</span>
        </button>
        <button onClick={() => toast.info("アプリは準備中です。もう少しお待ちください！😊")} className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span className="text-xs text-muted-foreground">App Store</span>
        </button>
      </div>
    </div>
  );
  const SOCIALS = [
    {
      label: "Instagram",
      href: "https://instagram.com",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      ),
    },
    {
      label: "KakaoTalk",
      href: "https://pf.kakao.com",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 3C6.477 3 2 6.582 2 11c0 2.868 1.745 5.388 4.38 6.895l-.93 3.47a.5.5 0 00.735.556L10.2 19.72c.589.072 1.19.11 1.8.11 5.523 0 10-3.582 10-8S17.523 3 12 3z"/>
        </svg>
      ),
    },
    {
      label: "YouTube",
      href: "https://youtube.com",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
    {
      label: "Naver Blog",
      href: "https://blog.naver.com",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-background border-t border-border/60 mt-auto">
      {/* お知らせ / お問い合わせ / アプリ */}
      <div className="container py-8 border-b border-border/60">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-start divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* 1. お知らせ */}
          <div className="md:col-span-5 py-6 md:py-2 md:pr-10">
            <NoticePreview />
          </div>
          {/* 2. お問い合わせ */}
          <div className="md:col-span-4 py-6 md:py-2 md:px-10">
            <CustomerCenter />
          </div>
          {/* 3. アプリ */}
          <div className="md:col-span-3 py-6 md:py-2 md:pl-10">
            <AppDownload />
          </div>
        </div>
      </div>
      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Left: brand + company info */}
          <div className="flex flex-col gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-[30%] bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-black text-base leading-none">A</span>
              </span>
              <span className="text-lg font-black tracking-tight">
                AME <span className="text-primary">PLUS</span>
              </span>
            </div>

            {/* Company details */}
            <div className="text-sm text-muted-foreground space-y-1 leading-relaxed">
              <p>ソウルモノ - 韓国コスメ・ヘルスケア専門ショップ</p>
              <p>
                <span className="text-foreground/60">代表</span> ソウルモノ&nbsp;&nbsp;
                <span className="text-foreground/60">メール</span>{" "}
                <a href="mailto:hlschool.cs@gmail.com" className="hover:text-primary transition-colors">hlschool.cs@gmail.com</a>
              </p>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground/50 leading-relaxed max-w-xl">
              <p className="mb-1">
                当ショップは取引の仲介のみを行い、商品の直接販売・製造は行っておりません。
              </p>
              <p className="mb-1">
                すべての商品はお客様ご自身の判断と責任でご購入いただくものです。ご使用前に必ず医師または薬剤師にご相談ください。
              </p>
              <p>
                副作用やアレルギーなど個人差による反応について、当サイトは法的責任を負いません。
              </p>
            </div>

            <p className="text-xs text-foreground font-medium">&copy; 2025 ソウルモノ. All Rights Reserved.</p>
          </div>

          {/* Right: links + socials */}
          <div className="flex flex-col gap-6 lg:items-end">
            <div className="grid grid-cols-3 gap-x-12 gap-y-1.5">
              {/* カテゴリ */}
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "薄毛・ヘアケア", href: "/products?category=hair" },
                  { label: "性機能", href: "/products?category=sexual" },
                  { label: "スキンケア・美容", href: "/products?category=skin" },
                  { label: "ダイエット", href: "/products?category=diet" },
                  { label: "その他", href: "/products?category=etc" },
                ].map(l => (
                  <Link key={l.label} href={l.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                {LEFT_LINKS.map(l => (
                  <Link key={l.label} href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                {RIGHT_LINKS.map(l => (
                  l.external ? (
                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {l.label}
                    </a>
                  ) : (
                    <Link key={l.label} href={l.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {l.label}
                    </Link>
                  )
                ))}
              </div>
            </div>

            {/* 決済情報 */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center gap-2">
                {/* Visa */}
                <div className="w-8 h-5 bg-white rounded border flex items-center justify-center overflow-hidden shadow-sm">
                  <img src="/visa-logo.png" alt="Visa" className="w-7 h-4 object-contain" />
                </div>
                {/* Mastercard */}
                <div className="w-8 h-5 bg-white rounded border flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 48 30" className="w-7 h-4" fill="none">
                    <rect width="48" height="30" rx="2" fill="#F5F5F5"/>
                    <circle cx="18" cy="15" r="8" fill="#EB001B"/>
                    <circle cx="30" cy="15" r="8" fill="#F79E1B"/>
                    <path d="M24 8.5c2 2 3 4.5 3 6.5s-1 4.5-3 6.5c-2-2-3-4.5-3-6.5s1-4.5 3-6.5z" fill="#FF5F00"/>
                  </svg>
                </div>
                {/* 銀行振込 */}
                <div className="h-5 px-2 bg-white rounded border flex items-center gap-1 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <path d="M2 10h20"/>
                  </svg>
                  <span className="text-[10px] font-bold text-foreground">銀行振込</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                ※ 海外決済対応カードまたは銀行振込をご利用いただけます
              </p>
            </div>

          </div>

        </div>
      </div>
    </footer>
  );
}

function TopBanner() {
  const { data } = trpc.product.topBannerText.useQuery();
  const text = data?.text ?? "🌿 ソウルモノ - 韓国コスメ・ヘルスケア専門ショップ";
  return (
    <div className="w-full bg-accent text-primary text-center text-[13px] py-2 px-4 tracking-wide font-semibold">
      {text}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatbotWidgetV2 />
      <CompareWidget />
    </div>
  );
}
