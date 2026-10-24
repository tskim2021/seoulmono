import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { ShoppingSidebarContent } from "@/components/ShoppingSidebar";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, ShoppingBag, X } from "lucide-react";
import Paginator from "@/components/Paginator";
import { useLocation, useSearch } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";

export default function Products() {
  const searchParams = new URLSearchParams(useSearch());
  const categorySlug = searchParams.get("category") ?? undefined;
  const filter = searchParams.get("filter") ?? undefined;
  const initialSearch = searchParams.get("search") ?? "";

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [, navigate] = useLocation();

  useEffect(() => { setPage(1); }, [categorySlug, filter, sort, searchQuery]);
  useEffect(() => { setSearchQuery(initialSearch); }, [initialSearch]);

  const { data: cats } = trpc.category.list.useQuery();
  const selectedCat = useMemo(() => cats?.find(c => c.slug === categorySlug), [cats, categorySlug]);

  const queryOpts = useMemo(() => ({
    categoryId: selectedCat?.id,
    search: searchQuery || undefined,
    sort,
    page,
    limit: 20,
    isFeatured: filter === "featured" ? true : undefined,
    isNew: filter === "new" ? true : undefined,
    isBest: filter === "best" ? true : undefined,
    onSale: filter === "sale" ? true : undefined,
  }), [selectedCat, searchQuery, sort, page, filter]);

  const { data, isLoading } = trpc.product.list.useQuery(queryOpts);
  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  const CATEGORY_NAV = [
    { label: "전체상품", slug: undefined,        href: "/products" },
    { label: "탈모헤어", slug: "hair-loss",      href: "/products?category=hair-loss" },
    { label: "성기능",   slug: "sexual-health",  href: "/products?category=sexual-health" },
    { label: "피부미용", slug: "skin-beauty",    href: "/products?category=skin-beauty" },
    { label: "다이어트", slug: "diet",           href: "/products?category=diet" },
    { label: "기타",     slug: "etc",            href: "/products?category=etc" },
  ];

  const titleMap: Record<string, string> = { featured: "추천 상품", new: "신상품", best: "베스트셀러", sale: "특가 상품" };
  const pageTitle = filter ? titleMap[filter] ?? "전체상품" : selectedCat ? selectedCat.name : "전체상품";

  useSEO({
    title: pageTitle,
    description: `${pageTitle} - 탈모학교의 다양한 상품을 둘러보세요.`,
    keywords: `${pageTitle}, 상품, 쇼핑, 온라인쇼핑`,
  });

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <a href="/" className="hover:text-foreground transition-colors">홈</a>
          <span>/</span>
          <span className="text-foreground font-medium">{pageTitle}</span>
        </div>

        <div className="flex gap-8">
          {/* Sidebar - Categories + Shopping Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0 space-y-6">
            <div className="bg-card rounded-xl border p-4 elegant-shadow">
              <h3 className="font-semibold text-sm mb-3 pb-2.5 border-b border-border/60">카테고리</h3>
              <nav className="space-y-0.5">
                {CATEGORY_NAV.map(cat => {
                  const isActive = cat.slug
                    ? categorySlug === cat.slug
                    : !categorySlug && !filter;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => navigate(cat.href)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-muted-foreground"}`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <ShoppingSidebarContent />
          </aside>

          {/* Main */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-bold">{pageTitle}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">총 {data?.total ?? 0}개의 상품</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="검색..."
                    className="w-48 h-9 pl-8 text-sm rounded-full"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-32 h-9 text-sm rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">최신순</SelectItem>
                    <SelectItem value="price_asc">낮은가격순</SelectItem>
                    <SelectItem value="price_desc">높은가격순</SelectItem>
                    <SelectItem value="popular">인기순</SelectItem>
                    <SelectItem value="rating">평점순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (data?.products ?? []).length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-medium">상품이 없습니다</p>
                <p className="text-sm mt-1">다른 조건으로 검색해보세요</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {data!.products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-10" />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
