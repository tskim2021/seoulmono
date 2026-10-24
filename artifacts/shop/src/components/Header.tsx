import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Search, ShoppingCart, User, Menu, ChevronDown, LogOut,
  Package, MapPin, Star, Settings, LayoutDashboard
} from "lucide-react";
import { getCartCount } from "@/lib/cart";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuOrder } from "@/hooks/useMenuOrder";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const BASE = import.meta.env.BASE_URL;

const ALL_CATEGORIES = [
  { ca_id: "190", name: "비타민" },
  { ca_id: "200", name: "영양제" },
  { ca_id: "210", name: "유산균" },
  { ca_id: "220", name: "슬리밍/이너뷰티" },
];

function CartBadge({ count }: { count: number }) {
  return (
    <a href={`${BASE}cart`} className="relative p-2 hover:bg-accent rounded-full transition-colors flex items-center justify-center">
      <ShoppingCart className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </a>
  );
}

function UserMenu() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <a
        href={`${BASE}login`}
        className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors p-2"
      >
        <User className="w-5 h-5" />
        <span className="hidden sm:inline">로그인</span>
      </a>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors p-2 rounded-full hover:bg-accent">
          <User className="w-5 h-5" />
          <span className="hidden sm:inline max-w-[80px] truncate">{user.mb_name ?? "회원"}</span>
          <ChevronDown className="w-3 h-3 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a href={`${BASE}mypage`} className="flex items-center gap-2 cursor-pointer">
            <LayoutDashboard className="w-4 h-4" />마이페이지
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${BASE}mypage`} className="flex items-center gap-2 cursor-pointer">
            <Package className="w-4 h-4" />주문내역
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${BASE}cs`} className="flex items-center gap-2 cursor-pointer">
            <MapPin className="w-4 h-4" />고객센터
          </a>
        </DropdownMenuItem>
        {user.is_admin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`${BASE}admin`} className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" />관리자
              </a>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 text-destructive cursor-pointer"
        >
          <LogOut className="w-4 h-4" />로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchBar() {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/list?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/search");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    setQuery(q);
  }, []);

  return (
    <div className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="상품을 검색해보세요"
          autoComplete="off"
          className="w-full h-10 pl-4 pr-10 rounded-full border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function CategoryDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors shrink-0 whitespace-nowrap">
          <Menu className="w-4 h-4 shrink-0" />
          카테고리
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {ALL_CATEGORIES.map(cat => (
          <DropdownMenuItem key={cat.ca_id} asChild>
            <a href={`${BASE}list?ca_id=${cat.ca_id}`} className="cursor-pointer">
              {cat.name}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { items: menuItems } = useMenuOrder();
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCartCount(getCartCount());
    const onCartUpdated = () => setCartCount(getCartCount());
    window.addEventListener("cart-updated", onCartUpdated);
    return () => window.removeEventListener("cart-updated", onCartUpdated);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/60">
      {/* Main bar */}
      <div style={{ maxWidth: 1280, margin: "0 auto", paddingLeft: "1rem", paddingRight: "1rem" }}>
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <a href={`${BASE}`} className="flex items-center shrink-0">
            <div
              className="px-4 py-2 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#5C3D2E' }}
            >
              <span className="font-extrabold text-base text-white tracking-wide">seoulmono</span>
            </div>
          </a>

          {/* Search (PC) */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <CartBadge count={cartCount} />
            <UserMenu />
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-accent rounded-full transition-colors md:hidden">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetTitle className="sr-only">메뉴</SheetTitle>
                <div className="p-6">
                  <div className="mb-6">
                    <SearchBar />
                  </div>
                  <nav className="space-y-1">
                    {menuItems.map(menu => (
                      <button
                        key={menu.id}
                        onClick={() => { navigate(menu.href); setMobileOpen(false); }}
                        className={`w-full text-left block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors ${menu.highlight ? "text-destructive font-bold" : ""}`}
                      >
                        {menu.label}
                      </button>
                    ))}
                    <div className="pt-2 border-t border-border">
                      <a href={`${BASE}cs`} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors">고객센터</a>
                      <a href={`${BASE}notice`} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors">공지사항</a>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Navigation bar (PC) */}
      <nav className="hidden md:block border-t border-border/40">
        <div style={{ maxWidth: 1280, margin: "0 auto", paddingLeft: "1rem", paddingRight: "1rem" }}>
          <div className="flex items-center h-11">
            <div className="shrink-0 flex items-center">
              <CategoryDropdown />
            </div>
            <div className="h-4 w-px bg-border/60 shrink-0 mx-4" />
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide whitespace-nowrap flex-1">
              {menuItems.map(menu => (
                <button
                  key={menu.id}
                  onClick={() => navigate(menu.href)}
                  className={`text-sm font-medium transition-colors hover:text-primary px-3 py-1 rounded shrink-0 ${
                    menu.highlight
                      ? "text-destructive font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {menu.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
