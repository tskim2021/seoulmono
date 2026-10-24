import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Truck, Shield, Star, Clock, ShoppingBag, Flame } from "lucide-react";
import {
  getHomeData, getReviews, getNotices, getEvents,
  type HomeData, type ShopItem, type Review, type Notice, type ShopEvent,
} from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const API_BASE = "/api";

/* ─────────────────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden elegant-shadow animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Hero Section
───────────────────────────────────────────────────────── */
function HeroSection() {
  const [, navigate] = useLocation();
  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FDF6EE 0%, #F2E4D0 60%, #DEC4A8 100%)" }}>
      <div className="container py-14 md:py-20">
        <div className="max-w-2xl">
          <span className="inline-block mb-4 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(139,94,60,0.12)", color: "#5C3317" }}>
            ソウルモノ公式ストア
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-tight" style={{ color: "#3A1A00" }}>
            良い価格、良い商品<br />
            <span style={{ color: "#8B5E3C" }}>ソウルモノ</span>でたっぷりお買い物
          </h1>
          <p className="text-base md:text-lg mb-8 leading-relaxed max-w-lg" style={{ color: "#7A5C3C" }}>
            ソウルモノならではの特別な商品をご覧ください。<br />
            良い製品だけを厳選しました。
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-colors"
              style={{ background: "#5C3317", color: "#fff" }}
            >
              ショッピングを始める <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/notice")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-colors"
              style={{ border: "1.5px solid #8B5E3C", color: "#5C3317", background: "transparent" }}
            >
              お知らせ
            </button>
          </div>
        </div>
      </div>
      <div className="absolute top-8 right-8 w-56 h-56 rounded-full pointer-events-none" style={{ background: "rgba(139,94,60,0.08)", filter: "blur(40px)" }} />
      <div className="absolute bottom-0 right-1/3 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(222,196,168,0.4)", filter: "blur(30px)" }} />
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Features Bar
───────────────────────────────────────────────────────── */
function FeaturesBar() {
  const features = [
    { icon: Truck,   label: "スピード配送",   desc: "当日・翌日発送" },
    { icon: Shield,  label: "カード決済",     desc: "クレジット・デビットカード対応" },
    { icon: Star,    label: "ポイント特典",  desc: "購入金額に応じて還元" },
    { icon: Clock,   label: "新着商品",    desc: "毎日更新" },
  ];
  return (
    <section className="border-b border-border/60 bg-card/50">
      <div className="container py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map(f => (
            <div key={f.label} className="flex items-center gap-3 p-3 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Product Section
───────────────────────────────────────────────────────── */
function ProductSection({ title, subtitle, items, viewAllHref, isLoading, onCartAdd }: {
  title: string; subtitle: string; items: ShopItem[] | undefined;
  viewAllHref: string; isLoading: boolean; onCartAdd?: () => void;
}) {
  const [, navigate] = useLocation();
  return (
    <section className="py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <button onClick={() => navigate(viewAllHref)} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          すべて見る <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">登録された商品はありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.slice(0, 8).map(item => (
            <ProductCard key={item.it_id} item={item} onCartAdd={onCartAdd} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Promo Banner Section (카카오 채널 + 100원 회원가입)
───────────────────────────────────────────────────────── */
function PromoBannerSection() {
  const BASE = import.meta.env.BASE_URL;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
      {/* 카카오톡 채널 친구추가 */}
      <a
        href="https://pf.kakao.com/_xnxmExj"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center gap-4 rounded-2xl px-6 py-5 no-underline overflow-hidden transition-opacity hover:opacity-90"
        style={{ background: "#FEE500" }}
      >
        <div className="shrink-0 flex flex-col items-center justify-center w-20 h-16 rounded-lg border-2 border-dashed border-yellow-600/40 bg-white/40 text-center px-1">
          <span className="text-xs font-bold text-yellow-900 leading-tight">1000円</span>
          <span className="text-[9px] text-yellow-800 leading-tight">ショッピングポイント進呈</span>
          <span className="text-[8px] text-yellow-700 mt-0.5 leading-tight">ソウルモノ</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-yellow-800 font-medium mb-0.5">ソウルモノのお買い物特典</p>
          <p className="text-base font-extrabold text-yellow-900 leading-tight">KakaoTalkチャンネル<br />友だち追加</p>
        </div>
        <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#FEE500", border: "2px solid #3A2020" }}>
          <span className="text-[10px] font-extrabold text-[#3A1A00]">TALK</span>
        </div>
      </a>

      {/* 회원가입 100원 구매 */}
      <a
        href={`${BASE}register`}
        className="relative flex items-center gap-4 rounded-2xl px-6 py-5 no-underline overflow-hidden transition-opacity hover:opacity-90"
        style={{ background: "#B2EBE0" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-teal-800 font-medium mb-0.5">会員登録するだけで、初回購入がたったの100円!</p>
          <p className="text-base font-extrabold text-teal-900 leading-tight">会員登録して<br />100円商品を購入する</p>
        </div>
        <div className="shrink-0 text-3xl select-none">🎁</div>
      </a>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────
   Right Sidebar — 실시간 인기 검색어 + 최근 본 상품
───────────────────────────────────────────────────────── */
function PopularSearches({ items }: { items: ShopItem[] }) {
  const [, navigate] = useLocation();
  const searches = items.slice(0, 10).map(item => {
    const words = item.it_name.split(" ");
    return words.slice(0, 2).join(" ");
  });
  const HOT_THRESHOLD = 3;

  return (
    <div className="bg-card rounded-xl p-4 elegant-shadow">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
        <Flame className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold">リアルタイム人気キーワード</h3>
      </div>
      <ol className="space-y-1">
        {searches.map((term, i) => (
          <li key={i}>
            <button
              onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
              className="w-full flex items-center gap-2.5 py-1.5 group"
            >
              <span className={`text-xs font-bold w-4 shrink-0 ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                {i + 1}
              </span>
              <span className="text-xs text-foreground group-hover:text-primary transition-colors truncate flex-1 text-left">
                {term}
              </span>
              {i < HOT_THRESHOLD && <Flame className="w-3 h-3 text-orange-400 shrink-0" />}
            </button>
          </li>
        ))}
        {searches.length === 0 && (
          <li className="text-xs text-muted-foreground py-3 text-center">検索データなし</li>
        )}
      </ol>
    </div>
  );
}

function RecentlyViewed() {
  const [recent, setRecent] = useState<{ id: string; name: string; img: string; price: number }[]>([]);
  const [, navigate] = useLocation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jg_recently_viewed");
      if (stored) setRecent(JSON.parse(stored).slice(0, 5));
    } catch {}
  }, []);

  return (
    <div className="bg-card rounded-xl p-4 elegant-shadow">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-bold">最近見た商品</h3>
      </div>
      {recent.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
          最近見た商品はありません
        </div>
      ) : (
        <ul className="space-y-2">
          {recent.map(r => (
            <li key={r.id}>
              <button onClick={() => navigate(`/item/${r.id}`)} className="w-full flex items-center gap-2 group">
                <img src={r.img} alt={r.name} className="w-10 h-10 rounded object-cover bg-muted shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.price.toLocaleString()}円</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Board Preview Section (하단 게시판 영역)
───────────────────────────────────────────────────────── */
function formatBoardDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, "-").replace(/\.$/, "");
}

function BoardColumn({ title, href, rows }: {
  title: string;
  href: string;
  rows: { key: string | number; text: string; date: string; link?: string }[];
}) {
  const [, navigate] = useLocation();
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-foreground/80">
        <h3 className="font-bold text-sm">{title}</h3>
        <button onClick={() => navigate(href)} className="text-xs text-muted-foreground hover:text-primary transition-colors">+ more</button>
      </div>
      <ul className="space-y-0">
        {rows.map(row => (
          <li key={row.key}>
            <button
              onClick={() => row.link ? (window.location.href = row.link) : navigate(href)}
              className="w-full flex items-center gap-2 py-1.5 group"
            >
              <span className="text-xs text-muted-foreground truncate flex-1 text-left group-hover:text-primary transition-colors">{row.text}</span>
              <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">{row.date}</span>
            </button>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-xs text-muted-foreground py-4 text-center">投稿はありません</li>
        )}
      </ul>
    </div>
  );
}

function BoardSection({ reviews, notices, events }: {
  reviews: Review[]; notices: Notice[]; events: ShopEvent[];
}) {
  return (
    <section className="py-8 border-t border-border/60">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <BoardColumn
            title="商品レビュー"
            href="/cs"
            rows={reviews.slice(0, 5).map(r => ({
              key: r.is_id,
              text: r.is_subject,
              date: formatBoardDate(r.is_time),
            }))}
          />
          <BoardColumn
            title="イベント"
            href="/events"
            rows={events.slice(0, 5).map(e => ({
              key: e.id,
              text: e.title,
              date: formatBoardDate(e.created_at),
            }))}
          />
          <BoardColumn
            title="お知らせ"
            href="/notice"
            rows={notices.slice(0, 5).map(n => ({
              key: n.wr_id,
              text: n.wr_subject,
              date: formatBoardDate(n.wr_datetime),
            }))}
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Home Page
───────────────────────────────────────────────────────── */
export default function Home() {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<ShopEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    Promise.all([
      getHomeData().catch(() => null),
      getReviews(5).catch(() => []),
      getNotices(5).catch(() => []),
      getEvents(5).catch(() => []),
    ]).then(([home, rev, not, evt]) => {
      setHomeData(home);
      setReviews(rev as Review[]);
      setNotices(not as Notice[]);
      setEvents(evt as ShopEvent[]);
      setLoading(false);
    });
  }, []);

  const handleCartAdd = () => forceUpdate(n => n + 1);

  return (
    <>
      <HeroSection />
      <FeaturesBar />

      <div className="container">
        <div className="flex gap-6 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <ProductSection
              title="ベスト"
              subtitle="会員の皆様に一番人気のベスト商品"
              items={homeData?.best}
              isLoading={loading}
              viewAllHref="/products?sort=popular"
              onCartAdd={handleCartAdd}
            />
            <div className="border-t border-border/40" />
            <ProductSection
              title="新商品"
              subtitle="新しく入荷した商品をチェック"
              items={homeData?.newItems}
              isLoading={loading}
              viewAllHref="/products?sort=new"
              onCartAdd={handleCartAdd}
            />
            <div className="border-t border-border/40" />
            <ProductSection
              title="ソウルモノブランド"
              subtitle="ソウルモノでしか出会えない特別な商品"
              items={homeData?.brand}
              isLoading={loading}
              viewAllHref="/products?type=brand"
              onCartAdd={handleCartAdd}
            />
            <div className="border-t border-border/40" />
            <PromoBannerSection />
            <ProductSection
              title="本日の特価"
              subtitle="今日だけのこの価格!お見逃しなく、特価商品"
              items={homeData?.food}
              isLoading={loading}
              viewAllHref="/todaydeal"
              onCartAdd={handleCartAdd}
            />
          </div>

          {/* Right sidebar — desktop only */}
          <div className="hidden xl:flex flex-col gap-4 w-[260px] shrink-0 pt-10">
            <PopularSearches items={homeData?.best ?? []} />
            <RecentlyViewed />
          </div>
        </div>
      </div>

      {/* Board section */}
      <BoardSection reviews={reviews} notices={notices} events={events} />
    </>
  );
}
