import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import ShoppingSidebar from "@/components/ShoppingSidebar";
import PopularKeywords from "@/components/PopularKeywords";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ShoppingBag, Users, Star, Truck, Shield, MessageCircle, Newspaper, Globe, FlaskConical, ThumbsUp, Eye, MessageSquare, BookOpen, Pill, AlertTriangle, FileText, HelpCircle, Clock, ChevronRight, X } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { proxyImage } from "@/lib/utils";

const HERO_BANNERS = [
  {
    tag: "",
    title: "",
    sub: "",
    href: "/products",
    bg: "from-[#f0e8c4] via-[#ecdfa8] to-[#ddd090]",
    accent: "",
    deco: "",
    decoPos: "",
    image: "/banner-talmoschool.png",
  },
  {
    tag: "インド直送 特価",
    title: "薄毛治療薬\n個人輸入 No.1",
    sub: "フィナステリド、ミノキシジル、デュタステリド",
    href: "/products?filter=best",
    bg: "from-[#7B6B5A] to-[#A08060]",
    accent: "#F5E6C8",
    deco: "💊",
    decoPos: "bottom-6 right-8 text-[120px] opacity-20",
  },
  {
    tag: "美肌専門",
    title: "澄んだハリ肌の\n秘密",
    sub: "トレチノイン、アゼライン酸、皮膚科成分の個人輸入",
    href: "/products?category=skin",
    bg: "from-[#5A6B7A] to-[#7A9BB5]",
    accent: "#D6EAF8",
    deco: "✨",
    decoPos: "bottom-4 right-6 text-[110px] opacity-20",
  },
  {
    tag: "健康サプリメント",
    title: "健やかな暮らしの\nための選択",
    sub: "ビタミン、オメガ3、プロバイオティクス 海外直送",
    href: "/products?category=health",
    bg: "from-[#5A7A5A] to-[#7AAB7A]",
    accent: "#D5F5E3",
    deco: "🌿",
    decoPos: "bottom-4 right-6 text-[110px] opacity-20",
  },
  {
    tag: "会員限定特典",
    title: "ランク別割引\n最大15%",
    sub: "ブロンズ・シルバー・ゴールド・VIP会員の特別特典",
    href: "/bbs/board.php?bo_table=info",
    bg: "from-[#7A5A7A] to-[#9B7AAB]",
    accent: "#E8D5F5",
    deco: "🎁",
    decoPos: "bottom-4 right-6 text-[110px] opacity-20",
  },
];

type BannerSlide = {
  href: string;
  image?: string;
  tag?: string;
  title?: string;
  sub?: string;
  bg?: string;
  accent?: string;
  deco?: string;
  decoPos?: string;
};

function HeroBannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = slides.length;

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(p => (p + 1) % total);
    }, 3500);
  };

  useEffect(() => {
    setCurrent(0);
  }, [total]);

  useEffect(() => {
    if (!paused) startTimer();
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, total]);

  const go = (idx: number) => { setCurrent((idx + total) % total); startTimer(); };

  if (total === 0) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden h-full select-none shadow-lg">
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * (100 / total)}%)`, width: `${total * 100}%` }}
      >
        {slides.map((b, i) => (
          <div
            key={i}
            className={`relative flex-shrink-0 h-full ${b.image ? "bg-[#f0e8c4]" : `bg-gradient-to-br ${b.bg ?? ""}`}`}
            style={{ width: `${100 / total}%` }}
          >
            {b.image ? (
              <Link href={b.href}>
                <img src={b.image} alt="バナー" className="w-full h-full object-contain cursor-pointer" draggable={false} />
              </Link>
            ) : (
              <>
                <span className={`absolute ${b.decoPos ?? ""} leading-none pointer-events-none`}>{b.deco}</span>
                <span className="absolute top-4 left-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                  {b.tag}
                </span>
                <div className="relative z-10 p-6 pt-14 flex flex-col justify-end h-full">
                  <h3 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-2 whitespace-pre-line">{b.title}</h3>
                  <p className="text-sm text-white/75 mb-5">{b.sub}</p>
                  <Link href={b.href}>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-sm cursor-pointer">
                      詳しく見る <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Left arrow */}
      <button
        onClick={() => go(current - 1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors backdrop-blur-sm z-20"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
      </button>
      {/* Right arrow */}
      <button
        onClick={() => go(current + 1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors backdrop-blur-sm z-20"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Bottom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
        <button
          onClick={() => setPaused(p => !p)}
          className="w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white text-[10px] transition-colors backdrop-blur-sm"
        >
          {paused ? "▶" : "⏸"}
        </button>
        <span className="text-[11px] font-semibold text-white/90 bg-black/25 rounded-full px-2 py-0.5 backdrop-blur-sm">
          {current + 1}/{total}
        </span>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <button key={i} onClick={() => go(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-accent/30 to-secondary/50 overflow-hidden">
      <div className="container py-12 md:py-16">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">コミュニティ + ショッピング</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
            薄毛・美肌・健康のための<br />
            <span className="text-primary">海外直送専門</span>のショップ
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
            インドからの医薬品直送 - 薄毛、男性機能、美肌、ダイエット専門のショップ、ソウルモノです。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/products">ショッピングを始める <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link href="/bbs/board.php?bo_table=info">情報共有</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesBar() {
  const features = [
    { icon: Truck, label: "海外直送", desc: "インドから直送" },
    { icon: Shield, label: "カード決済", desc: "クレジット/デビットカード対応" },
    { icon: Star, label: "ポイント還元", desc: "購入金額の3%還元" },
    { icon: Clock, label: "注文締切10時", desc: "当日出荷を依頼" },
  ];
  return (
    <section className="border-b border-border/60">
      <div className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map(f => (
            <div key={f.label} className="flex items-center gap-3 py-4 px-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSection({ title, subtitle, queryOpts, viewAllHref }: { title: string; subtitle: string; queryOpts: any; viewAllHref: string }) {
  const { data, isLoading } = trpc.product.list.useQuery(queryOpts);
  return (
    <section className="py-12">
      <div>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <Link href={viewAllHref} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            すべて見る <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(data?.products ?? []).slice(0, 5).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {!isLoading && (data?.products ?? []).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">まだ登録された商品がありません</p>
          </div>
        )}
      </div>
    </section>
  );
}

function CommunityPreview() {
  const { data: boards } = trpc.community.boards.useQuery();
  return (
    <section className="py-12 bg-secondary/30">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">コミュニティ</h2>
            <p className="text-sm text-muted-foreground mt-1">会員の皆さまと自由に交流しましょう</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(boards ?? []).map(board => (
            <Link key={board.id} href={`/community/${board.slug}`}>
              <div className="bg-card rounded-xl p-5 elegant-shadow hover:elegant-shadow-lg transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {board.boardType === "free" && <Users className="w-5 h-5 text-primary" />}
                    {board.boardType === "review" && <Star className="w-5 h-5 text-primary" />}
                    {board.boardType === "qna" && <MessageCircle className="w-5 h-5 text-primary" />}
                    {board.boardType === "notice" && <ShoppingBag className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{board.name}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{board.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const NEWS_SECTION_ICONS: Record<string, any> = {
  domestic: Newspaper,
  international: Globe,
  research: FlaskConical,
};

const NEWS_SECTION_LABELS: Record<string, string> = {
  domestic: "国内",
  international: "海外",
  research: "研究",
};

const NEWS_SECTION_COLORS: Record<string, string> = {
  domestic: "bg-blue-100 text-blue-700",
  international: "bg-emerald-100 text-emerald-700",
  research: "bg-purple-100 text-purple-700",
};

function NewsPreviewSection() {
  const { data, isLoading } = trpc.news.latestForHome.useQuery({ limit: 6 });
  const { data: categoriesData } = trpc.category.list.useQuery();

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "たった今";
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}日前`;
    return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  const stripMarkdown = (text: string) => {
    return text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`[^`]+`/g, "")
      .replace(/\n/g, " ")
      .trim();
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">健康ニュース</h2>
              <p className="text-sm text-muted-foreground mt-1">カテゴリー別の最新健康ニュースと研究情報</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/50">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">健康ニュース</h2>
            <p className="text-sm text-muted-foreground mt-1">カテゴリー別の最新健康ニュースと研究情報</p>
          </div>
          <Link href="/news" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            すべて見る <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((news: any) => {
            const SectionIcon = NEWS_SECTION_ICONS[news.newsSection] || Newspaper;
            const categoryName = categoriesData?.find((c: any) => c.id === news.categoryId)?.name;
            return (
              <Link key={news.id} href={`/news/${news.id}`}>
                <div className="bg-card rounded-xl p-5 elegant-shadow hover:elegant-shadow-lg transition-all duration-300 group h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    {news.newsSection && (
                      <Badge variant="secondary" className={`text-xs ${NEWS_SECTION_COLORS[news.newsSection] || ""}`}>
                        {NEWS_SECTION_LABELS[news.newsSection] || news.newsSection}
                      </Badge>
                    )}
                    {categoryName && (
                      <Badge variant="outline" className="text-xs">{categoryName}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                    {stripMarkdown(news.content).slice(0, 120)}
                  </p>
                  <div className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border/50">
                    {formatDate(news.createdAt)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const SECTION_TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  faq: { icon: HelpCircle, label: "FAQ", color: "bg-blue-100 text-blue-700" },
  usage: { icon: BookOpen, label: "使用方法", color: "bg-green-100 text-green-700" },
  dosage: { icon: Pill, label: "用量・用法", color: "bg-amber-100 text-amber-700" },
  sideEffects: { icon: AlertTriangle, label: "副作用", color: "bg-red-100 text-red-700" },
  precautions: { icon: FileText, label: "注意事項", color: "bg-purple-100 text-purple-700" },
};

function PopularDiscussionsSection() {
  const { data, isLoading } = trpc.discussion.popular.useQuery({ limit: 5 });

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-br from-orange-50/50 via-white to-rose-50/50">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">人気ディスカッション</h2>
              <p className="text-sm text-muted-foreground mt-1">会員の皆さまが最も活発に議論しているテーマ</p>
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-br from-orange-50/50 via-white to-rose-50/50">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">人気ディスカッション Top 5</h2>
            <p className="text-sm text-muted-foreground mt-1">会員の皆さまが最も活発に議論しているテーマ</p>
          </div>
          <Link href="/discussions" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            すべて見る <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-3">
          {data.map((d: any, idx: number) => (
            <Link key={d.id} href={`/discussions/${d.id}`}>
              <div className="bg-card rounded-xl p-4 elegant-shadow hover:elegant-shadow-lg transition-all duration-300 group flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                  idx === 0 ? "bg-yellow-100 text-yellow-700" :
                  idx === 1 ? "bg-gray-100 text-gray-600" :
                  idx === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                    {d.isPinned ? <span className="text-primary mr-1">[固定]</span> : null}
                    {d.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{d.displayName || d.userName || "匿名"}</span>
                    <span className="flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" />{d.likeCount}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{d.commentCount}</span>
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{d.viewCount}</span>
                  </div>
                </div>
                {d.tags && d.tags.length > 0 && (
                  <div className="hidden md:flex gap-1">
                    {(d.tags as string[]).slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductInfoHighlightsSection() {
  const { data, isLoading } = trpc.productInfo.highlights.useQuery({ limit: 6 });

  const stripMarkdown = (text: string) => {
    return text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`[^`]+`/g, "")
      .replace(/\n/g, " ")
      .trim();
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">商品情報ハイライト</h2>
              <p className="text-sm text-muted-foreground mt-1">最近更新された商品情報</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">商品情報ハイライト</h2>
            <p className="text-sm text-muted-foreground mt-1">最近更新されたFAQ、使用方法、副作用の情報</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((item: any, idx: number) => {
            const config = SECTION_TYPE_CONFIG[item.sectionType] || { icon: FileText, label: item.sectionType, color: "bg-muted text-muted-foreground" };
            const SIcon = config.icon;
            return (
              <Link key={idx} href={`/products/${item.productSlug}?tab=info`}>
                <div className="bg-card rounded-xl p-5 elegant-shadow hover:elegant-shadow-lg transition-all duration-300 group h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className={`text-xs ${config.color}`}>
                      <SIcon className="w-3 h-3 mr-1" />{config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">{item.productName}</span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                    {stripMarkdown(item.content || "").slice(0, 120)}
                  </p>
                  {item.productImage && (
                    <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-2">
                      <img src={item.productImage} alt="" className="w-6 h-6 rounded object-cover" />
                      <span className="text-xs text-muted-foreground truncate">{item.productName}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BoardPreviewColumn({ slug, title, href, limit = 5, postLinkFn }: { slug: string; title: string; href: string; limit?: number; postLinkFn?: (post: any) => string }) {
  const { data, isLoading } = trpc.community.recentBySlug.useQuery({ slug, limit });
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
        <h3 className="text-xl font-bold">{title}</h3>
        <Link href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
          もっと見る <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {(data ?? []).slice(0, 5).map((post: any) => (
            <li key={post.id}>
              <Link href={postLinkFn ? postLinkFn(post) : `/community/post/${post.id}`} className="flex items-center justify-between gap-4 py-4 group">
                <span className="text-sm text-foreground/90 truncate flex-1 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </span>
                <span className="text-sm text-muted-foreground shrink-0 tabular-nums">{fmtDate(post.createdAt)}</span>
              </Link>
            </li>
          ))}
          {(!data || data.length === 0) && (
            <li className="text-sm text-muted-foreground py-6 text-center">投稿がありません</li>
          )}
        </ul>
      )}
    </div>
  );
}

function ReviewCard({ post }: { post: any }) {
  const name = post.displayName || (post.userName ?? "匿名");
  const stars = Math.min(5, Math.max(1, post.rating ?? 5));
  const dateStr = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(/\.$/, "")
    : "";

  let images: string[] = [];
  if (Array.isArray(post.images)) { images = post.images; }
  else if (typeof post.images === 'string' && post.images) {
    try { images = JSON.parse(post.images); } catch { images = []; }
  }
  const thumbSrc = images[0] ?? post.productThumbnail ?? null;

  return (
    <Link href={`/shop/itemuseview.php?is_id=${post.id}`} className="border rounded-xl overflow-hidden flex flex-col bg-card hover:shadow-md transition-shadow min-w-0 cursor-pointer p-4 gap-2">
      {/* 별점 */}
      <div className="flex gap-0.5 items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
        ))}
      </div>
      {/* 상품명 */}
      {post.productName && (
        <p className="text-[10px] text-muted-foreground truncate">{post.productName}</p>
      )}
      {/* 제목 */}
      <p className="text-xs font-bold line-clamp-2 leading-snug text-foreground">{post.title}</p>
      {/* 본문 */}
      <p className="text-xs text-foreground/70 line-clamp-3 leading-relaxed flex-1">{post.content}</p>
      {/* 하단: 이미지 + 작성자/날짜 */}
      <div className="flex items-end justify-between gap-2 mt-auto pt-1">
        {thumbSrc ? (
          <img src={proxyImage(thumbSrc)} alt={post.productName ?? "レビュー画像"} className="w-12 h-12 object-cover rounded-md border flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 bg-muted rounded-md border flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-muted-foreground/30" />
          </div>
        )}
        <div className="text-right min-w-0">
          <p className="text-[10px] text-muted-foreground truncate">{name}</p>
          <p className="text-[10px] text-muted-foreground">{dateStr}</p>
        </div>
      </div>
    </Link>
  );
}

const REVIEWS_PER_PAGE = 8;
const MAX_REVIEW_PAGES = 3;

function CustomerReviewSection() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = trpc.community.recentBySlug.useQuery({ slug: "review", limit: REVIEWS_PER_PAGE * MAX_REVIEW_PAGES });
  const reviews = data ?? [];
  const totalPages = Math.min(MAX_REVIEW_PAGES, Math.ceil(reviews.length / REVIEWS_PER_PAGE));

  if (!isLoading && reviews.length === 0) return null;

  const visible = reviews.slice(page * REVIEWS_PER_PAGE, (page + 1) * REVIEWS_PER_PAGE);

  return (
    <section className="py-10">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">お客様レビュー</h2>
          <Link href="/shop/itemuselist.php" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
            もっと見る <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: REVIEWS_PER_PAGE }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visible.map((post: any) => <ReviewCard key={post.id} post={post} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === page ? "bg-primary" : "bg-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function InfoBanner() {
  return (
    <Link href="/bbs/board.php?bo_table=info" className="block py-4 hover:opacity-95 transition-opacity">
      <div className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-8 py-6 flex items-center justify-between shadow-md">
        <div className="text-white space-y-1">
          <p className="text-xs font-semibold tracking-widest opacity-80 uppercase">ソウルモノ コミュニティ</p>
          <p className="text-lg font-bold leading-snug">情報共有広場 — 情報をシェアして<br />ポイントを貯めよう</p>
          <p className="text-xs opacity-75 mt-1">情報を共有するとポイントが貯まります</p>
        </div>
        <div className="flex flex-col items-center gap-1 text-white opacity-90 shrink-0 ml-6">
          <span className="text-4xl">💚</span>
          <span className="text-xs font-bold bg-white/20 rounded-full px-3 py-0.5">今すぐ参加</span>
        </div>
      </div>
    </Link>
  );
}

function PromoCard() {
  return (
    <div className="min-w-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background border border-border rounded-xl p-5 gap-2 h-full">
      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold tracking-wide border border-blue-200 dark:border-blue-800 rounded-full px-3 py-0.5">
        正規品保証 · 安心品質
      </span>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">最安値</span>
        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">PLUS</span>
      </div>
      <p className="text-base font-bold tracking-widest text-foreground mt-1">セール</p>
      <p className="text-3xl font-extrabold text-red-500 leading-none">10<span className="text-xl">%OFF</span></p>
      <Link href="/products" className="mt-2 flex items-center gap-1 bg-amber-400 hover:bg-amber-500 transition-colors text-white text-xs font-bold px-5 py-2 rounded-full shadow">
        <Star className="w-3 h-3 fill-white" /> 全商品対象 <Star className="w-3 h-3 fill-white" />
      </Link>
      <p className="text-[10px] text-muted-foreground mt-1 text-center leading-snug">
        今すぐお客様レビューを投稿しましょう！
      </p>
    </div>
  );
}

function CommunitySectionMenu() {
  const items = [
    {
      icon: <Newspaper className="w-5 h-5 text-primary" />,
      title: "健康ニュース",
      desc: "カテゴリー別の国内外の健康ニュースと研究情報",
      href: "/news",
    },
    {
      icon: <BookOpen className="w-5 h-5 text-primary" />,
      title: "情報共有",
      desc: "商品に関する情報を自由に共有する掲示板です。",
      href: "/info-board",
    },
    {
      icon: <Star className="w-5 h-5 text-primary" />,
      title: "お客様レビュー",
      desc: "ご購入商品の感想をお寄せください。",
      href: "/community/review",
    },
    {
      icon: <FileText className="w-5 h-5 text-primary" />,
      title: "お知らせ",
      desc: "ショップの重要なお知らせをお届けします。",
      href: "/bbs/board.php?bo_table=notice",
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-primary" />,
      title: "FAQ",
      desc: "よくあるご質問と回答をご確認ください。",
      href: "/customer-service/faq",
    },
    {
      icon: <ShoppingBag className="w-5 h-5 text-primary" />,
      title: "カート",
      desc: "カートに入れた商品を確認してご購入ください。",
      href: "/cart",
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: "マイページ",
      desc: "注文履歴、ポイント、ご自身の情報を確認できます。",
      href: "/mypage",
    },
  ];

  return (
    <section className="py-12 bg-secondary/20">
      <div className="container">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">コミュニティ</h2>
          <p className="text-sm text-muted-foreground mt-1">会員の皆さまと自由に交流しましょう</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link key={item.title} href={item.href}>
              <div className="bg-card rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{item.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function BoardPreviewSection() {
  return (
    <section className="py-8 border-t border-border/60">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-start divide-y md:divide-y-0 md:divide-x divide-border/60">

          {/* 1. 공지사항 — col-span-5 */}
          <div className="md:col-span-5 py-6 md:py-2 md:pr-10">
            <BoardPreviewColumn slug="notice" title="お知らせ" href="/bbs/board.php?bo_table=notice" limit={3} postLinkFn={(post) => `/bbs/board.php?bo_table=notice&wr_id=${post.id}`} />
          </div>

          {/* 2. 1:1 문의 — col-span-4 */}
          <div className="md:col-span-4 py-6 md:py-2 md:px-10 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground font-medium">カスタマーセンター</p>
            <p className="text-base font-semibold leading-snug">ご不明な点はありませんか？<br /><span className="text-primary">お問い合わせ</span>で迅速にご回答します。</p>
            <Link href="/customer-service/inquiry">
              <span className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
                お問い合わせ
              </span>
            </Link>
          </div>

          {/* 3. 앱 다운로드 — col-span-3 */}
          <div className="md:col-span-3 py-6 md:py-2 md:pl-10 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground font-medium">アプリのダウンロード</p>
            <div className="flex gap-3">
              <button
                onClick={() => toast.info("アプリは準備中です。もうしばらくお待ちください！😊")}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                  <path d="M3.18 1.05C2.76 1.29 2.5 1.73 2.5 2.26v19.48c0 .53.26.97.68 1.21l.1.06 10.91-10.91v-.26L3.28.99l-.1.06z" fill="#EA4335"/>
                  <path d="M17.47 15.43l-3.63-3.64v-.27l3.63-3.63.08.05 4.3 2.44c1.23.7 1.23 1.84 0 2.54l-4.3 2.44-.08.07z" fill="#FBBC04"/>
                  <path d="M17.55 15.36L13.88 11.7 3.18 22.4c.41.43 1.07.49 1.82.05l12.55-7.09" fill="#34A853"/>
                  <path d="M17.55 8.04L5 .95C4.25.51 3.59.57 3.18 1l10.7 10.71 3.67-3.67z" fill="#EA4335"/>
                </svg>
                <span className="text-xs text-muted-foreground">Google Play</span>
              </button>
              <button
                onClick={() => toast.info("アプリは準備中です。もうしばらくお待ちください！😊")}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-xs text-muted-foreground">App Store</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function PersonalizedSection() {
  const { isAuthenticated, user } = useAuth();
  const { data } = trpc.recommendation.personalized.useQuery(
    { limit: 24 },
    { enabled: isAuthenticated }
  );
  const [page, setPage] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, startPage: 0, moved: false });

  const products = data?.products ?? [];
  const perView = 6;
  const totalPages = Math.max(1, Math.ceil(products.length / perView));

  const goToPage = (p: number) => setPage(Math.max(0, Math.min(totalPages - 1, p)));

  const startAutoPlay = () => {
    if (products.length <= perView) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setPage(prev => (prev + 1) % totalPages);
    }, 2500);
  };

  const stopAutoPlay = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
  }, [products.length, totalPages]);

  // Mouse drag — snap to page on release
  const onMouseDown = (e: React.MouseEvent) => {
    stopAutoPlay();
    dragState.current = { dragging: true, startX: e.clientX, startPage: page, moved: false };
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.dragging || !trackRef.current) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 5) dragState.current.moved = true;
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!dragState.current.dragging || !trackRef.current) return;
    const dx = e.clientX - dragState.current.startX;
    const threshold = trackRef.current.offsetWidth * 0.2;
    if (dx < -threshold) goToPage(dragState.current.startPage + 1);
    else if (dx > threshold) goToPage(dragState.current.startPage - 1);
    dragState.current.dragging = false;
    startAutoPlay();
  };

  const onMouseLeave = () => {
    if (dragState.current.dragging) {
      dragState.current.dragging = false;
      startAutoPlay();
    }
  };

  // Touch — snap to page on release
  const onTouchStart = (e: React.TouchEvent) => {
    stopAutoPlay();
    dragState.current = { dragging: true, startX: e.touches[0].clientX, startPage: page, moved: false };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.touches[0].clientX - dragState.current.startX;
    if (Math.abs(dx) > 5) dragState.current.moved = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragState.current.dragging || !trackRef.current) return;
    const dx = e.changedTouches[0].clientX - dragState.current.startX;
    const threshold = trackRef.current.offsetWidth * 0.2;
    if (dx < -threshold) goToPage(dragState.current.startPage + 1);
    else if (dx > threshold) goToPage(dragState.current.startPage - 1);
    dragState.current.dragging = false;
    startAutoPlay();
  };

  if (!isAuthenticated || products.length === 0) return null;

  const userName = (user as any)?.name ?? "会員";

  return (
    <section className="py-10">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">
              <span className="text-primary">{userName}</span>様専用 AIおすすめ
            </h2>
            <p className="text-sm text-muted-foreground mt-1">購入履歴に基づくおすすめ商品です</p>
          </div>
        </div>
        <div
          ref={trackRef}
          className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {/* Pad products to full pages so last page shows 6 slots */}
            {Array.from({ length: totalPages * perView }).map((_, i) => {
              const p = products[i];
              return (
                <div key={i} className="flex-shrink-0 px-2" style={{ width: `${100 / perView}%` }}>
                  {p ? (
                    <ProductCard product={p} />
                  ) : (
                    <div className="aspect-[3/4]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { goToPage(i); stopAutoPlay(); startAutoPlay(); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RenewalPopup() {
  const STORAGE_KEY = "renewal_popup_hidden_until";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hiddenUntil = localStorage.getItem(STORAGE_KEY);
    if (!hiddenUntil || Date.now() > Number(hiddenUntil)) {
      setVisible(true);
    }
  }, []);

  const closeToday = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setVisible(false);
  };

  const close = () => setVisible(false);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary-foreground" />
            <span className="text-primary-foreground font-bold text-base">サイトリニューアルのお知らせ</span>
          </div>
          <button onClick={close} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-foreground leading-relaxed">
            現在、<span className="font-semibold text-primary">サイトリニューアル作業</span>を実施しております。
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            この作業中、従来のログイン情報および注文履歴が一時的に一致しない場合があります。
            ご不便をおかけし申し訳ございません。できるだけ早く安定するよう努めてまいります。
          </p>
          <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">お問い合わせ・ご不便の受付</p>
              <a href="mailto:hlschool.cs@gmail.com" className="text-sm font-semibold text-primary hover:underline">
                hlschool.cs@gmail.com
              </a>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2">
          <button
            onClick={closeToday}
            className="flex-1 text-sm text-muted-foreground hover:text-foreground border rounded-lg py-2 transition-colors"
          >
            本日は表示しない
          </button>
          <button
            onClick={close}
            className="flex-1 text-sm font-semibold bg-primary text-primary-foreground rounded-lg py-2 hover:bg-primary/90 transition-colors"
          >
            確認
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  useSEO({
    title: undefined,
    description: "コミュニティとショッピングが一つにつながる新しいショッピング体験をお楽しみください。",
    keywords: "ショッピング, コミュニティ, Eコマース, 商品レビュー, オンラインショップ",
  });
  const newOpts = useMemo(() => ({ isNew: true, limit: 8 }), []);
  const bestOpts = useMemo(() => ({ isBest: true, limit: 8 }), []);
  const featuredOpts = useMemo(() => ({ isFeatured: true, limit: 8 }), []);
  const saleOpts = useMemo(() => ({ onSale: true, limit: 8 }), []);

  return (
    <Layout>
      <div className="container pt-4">
        <div className="flex gap-8 items-start">
          {/* Main content — hero starts here, paired with sidebar from the top */}
          <div className="flex-1 min-w-0">
            <div className="h-[320px]">
              <HeroBannerCarousel slides={HERO_BANNERS} />
            </div>
            <div className="mt-8">
              <ProductSection title="ベストセラー" subtitle="会員の皆さまに最も人気のベストセラー" queryOpts={bestOpts} viewAllHref="/products?filter=best" />
            </div>
            <PopularKeywords />
            <ProductSection title="特価商品" subtitle="割引中の商品を今すぐチェック" queryOpts={saleOpts} viewAllHref="/products?filter=sale" />
            <ProductSection title="新着商品" subtitle="新しく入荷した商品をチェック" queryOpts={newOpts} viewAllHref="/products?filter=new" />
            <InfoBanner />
            <ProductSection title="おすすめ商品" subtitle="ソウルモノ厳選のおすすめ商品" queryOpts={featuredOpts} viewAllHref="/products?filter=featured" />
          </div>
          {/* Sidebar - desktop only, aligned with hero from the top */}
          <div className="hidden xl:block w-[300px] shrink-0">
            <div className="sticky top-24">
              <ShoppingSidebar />
            </div>
          </div>
        </div>
      </div>
      <FeaturesBar />
      <PersonalizedSection />
      <CustomerReviewSection />
      <CommunitySectionMenu />
      <PopularDiscussionsSection />
      <NewsPreviewSection />
      <ProductInfoHighlightsSection />
    </Layout>
  );
}
