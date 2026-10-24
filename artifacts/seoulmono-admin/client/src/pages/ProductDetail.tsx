import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatPrice, getDiscountPercent, formatDate, proxyImage, productHref } from "@/lib/utils";
import { Heart, ShoppingCart, Minus, Plus, Star, Truck, Shield, RotateCcw, ShoppingBag, ChevronLeft, ChevronRight, CheckCircle, HelpCircle, MessageCircle, User, Bell, BookOpen, Pill, AlertTriangle, FileText, ChevronDown, Info, BadgeCheck, Share2, Link2, Check } from "lucide-react";
import Paginator from "@/components/Paginator";
import { ReviewImageGallery, ImageLightbox } from "@/components/ImageLightbox";
import { useParams, useSearch, Link, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";

function useScrollToTop() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
}
import { toast } from "sonner";
import { useRecentProducts } from "@/hooks/useRecentProducts";
import { getLoginUrl } from "@/const";
import { useSEO } from "@/hooks/useSEO";
// ─── Q&A Section Component ───
function ProductQnASection({ productId }: { productId: number }) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.community.productQnA.useQuery({ productId, page, limit: 10 });
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createQnA = trpc.community.createProductQnA.useMutation({
    onSuccess: () => {
      toast.success("질문이 등록되었습니다");
      setTitle("");
      setContent("");
      setShowForm(false);
      utils.community.productQnA.invalidate({ productId });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }
    createQnA.mutate({ productId, title: title.trim(), content: content.trim() });
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <HelpCircle className="w-5 h-5" /> 상품 Q&A
          <span className="text-sm font-normal text-muted-foreground">({data?.total ?? 0})</span>
        </h3>
        {isAuthenticated ? (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "취소" : "질문 작성"}
          </Button>
        ) : (
          <Button size="sm" asChild>
            <a href={getLoginUrl()}>로그인 후 질문</a>
          </Button>
        )}
      </div>

      {/* Write Form */}
      {showForm && (
        <div className="bg-card border rounded-xl p-5 mb-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">제목</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="질문 제목을 입력하세요"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">내용</label>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="궁금한 점을 자세히 작성해주세요"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>취소</Button>
              <Button size="sm" onClick={handleSubmit} disabled={createQnA.isPending}>
                {createQnA.isPending ? "등록 중..." : "질문 등록"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Q&A List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : data?.posts && data.posts.length > 0 ? (
        <div className="space-y-3">
          {data.posts.map(post => (
            <QnAItem key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">등록된 Q&A가 없습니다</p>
          <p className="text-xs mt-1">상품에 대해 궁금한 점을 질문해보세요</p>
        </div>
      )}

      {/* Pagination */}
      <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
    </div>
  );
}

// ─── Q&A Item with comments ───
function QnAItem({ post }: { post: any }) {
  const [showComments, setShowComments] = useState(false);
  const { data: comments } = trpc.community.comments.useQuery(
    { postId: post.id },
    { enabled: showComments }
  );

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full text-left p-4 hover:bg-secondary/30 transition-colors"
        onClick={() => setShowComments(!showComments)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">Q</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{post.title}</h4>
              {post.isAnswered === 1 && (
                <Badge variant="outline" className="text-[10px] text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 px-1.5 py-0">
                  <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> 답변완료
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.displayName || (post.userName ?? "익명")}</span>
              <span>{formatDate(post.createdAt)}</span>
              {post.commentCount > 0 && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.commentCount}</span>}
            </div>
          </div>
        </div>
      </button>

      {/* Comments (answers) */}
      {showComments && comments && comments.length > 0 && (
        <div className="border-t bg-secondary/10 p-4 space-y-3">
          {comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0 mt-0.5">A</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">{comment.isAdmin ? "관리자" : (comment.userName ?? "익명")}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {showComments && (!comments || comments.length === 0) && (
        <div className="border-t bg-secondary/10 p-4 text-center text-sm text-muted-foreground">
          아직 답변이 없습니다
        </div>
      )}
    </div>
  );
}

function ShareButtons({ productName }: { productName: string }) {
  const [copied, setCopied] = useState(false);
  const pageUrl = window.location.href;
  const url = encodeURIComponent(pageUrl);
  const text = encodeURIComponent(`[탈모학교] ${productName}`);

  const handleCopy = async (toastMsg?: string) => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast.success(toastMsg ?? "링크가 복사되었습니다");
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleKakao = async () => {
    const shareText = encodeURIComponent(`[탈모학교] ${productName}\n${pageUrl}`);
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) {
      window.location.href = `kakaotalk://send?text=${shareText}`;
    } else if (isAndroid) {
      window.location.href = `intent://send?text=${shareText}#Intent;scheme=kakaotalk;package=com.kakao.talk;end`;
    } else {
      await navigator.clipboard.writeText(pageUrl);
      toast.info("PC에서는 카카오톡 앱을 통해 공유해주세요. 링크가 복사되었습니다 📋", { duration: 4000 });
    }
  };

  const handleInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `[탈모학교] ${productName}`, url: pageUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(pageUrl);
      toast.success("링크 복사 완료! 인스타그램 앱에서 붙여넣어 공유하세요 📋");
    }
  };

  const sns = [
    {
      label: "카카오톡",
      onClick: handleKakao,
      bg: "bg-[#FEE500]",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="#3C1E1E">
          <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.611 1.517 4.908 3.823 6.27l-.97 3.62c-.085.316.267.574.543.393L9.93 18.3A11.39 11.39 0 0 0 12 18.5c5.523 0 10-3.701 10-8.5S17.523 3 12 3z"/>
        </svg>
      ),
    },
    {
      label: "인스타그램",
      onClick: handleInstagram,
      bg: "bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
      ),
    },
    {
      label: "LINE",
      href: `https://social-plugins.line.me/lineit/share?url=${url}`,
      bg: "bg-[#06C755]",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      ),
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      bg: "bg-black",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      bg: "bg-[#1877F2]",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="pt-4 mt-2 border-t border-border/60">
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-auto">
          <Share2 className="w-4 h-4" />
          <span>공유</span>
        </div>
        {sns.map(s => (
          s.href ? (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.label}
              className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center hover:opacity-85 transition-opacity`}
            >
              {s.icon}
            </a>
          ) : (
            <button
              key={s.label}
              onClick={s.onClick}
              title={s.label}
              className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center hover:opacity-85 transition-opacity`}
            >
              {s.icon}
            </button>
          )
        ))}
        <button
          onClick={() => handleCopy()}
          title="링크 복사"
          className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  useScrollToTop();
  const { slug } = useParams<{ slug: string }>();
  const searchStr = useSearch();
  const itIdFromQuery = new URLSearchParams(searchStr).get("it_id") ?? undefined;
  const { isAuthenticated } = useAuth();
  const bySlug = trpc.product.getBySlug.useQuery({ slug: slug! }, { retry: false, enabled: !!slug });
  const byItId = trpc.product.getByItId.useQuery({ itId: itIdFromQuery! }, { retry: false, enabled: !!itIdFromQuery });
  const { data: product, isLoading, error } = itIdFromQuery ? byItId : bySlug;
  const utils = trpc.useUtils();
  const { data: myRestockAlerts } = trpc.restockAlert.myAlerts.useQuery(undefined, { enabled: isAuthenticated });

  useSEO({
    title: product?.name,
    description: product?.description ? product.description.slice(0, 160) : `${product?.name ?? '상품'} - 탈모학교에서 확인하세요`,
    ogImage: product?.thumbnail ?? undefined,
    ogType: "product",
    keywords: product ? `${product.name}, 온라인쇼핑` : undefined,
  });

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // 탭 제거 - 스크롤 형식으로 변경
  const { addProduct: addRecentProduct } = useRecentProducts();

  // Record recently viewed product
  useEffect(() => {
    if (product) {
      addRecentProduct({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        salePrice: product.salePrice,
        thumbnail: product.thumbnail,
      });
    }
  }, [product?.id]);

  const [, navigate] = useLocation();

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => { toast.success("장바구니에 추가되었습니다"); utils.cart.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const addToCartAndBuy = trpc.cart.add.useMutation({
    onSuccess: () => { utils.cart.list.invalidate(); navigate("/checkout"); },
    onError: (err) => toast.error(err.message),
  });
  const { data: isWishlisted, refetch: refetchWishlist } = trpc.wishlist.check.useQuery(
    { productId: product?.id ?? 0 },
    { enabled: isAuthenticated && !!product }
  );
  const toggleWishlist = trpc.wishlist.toggle.useMutation({
    onSuccess: (data) => { toast.success(data.isAdded ? "위시리스트에 추가" : "위시리스트에서 제거"); refetchWishlist(); },
  });

  // Calculate option-based price (MUST be before any conditional returns to follow Rules of Hooks)
  const optionPrice = useMemo(() => {
    if (!product?.options || product.options.length === 0) return null;
    const allSelected = product.options.every(o => selectedOptions[o.name]);
    if (!allSelected) return null;
    let maxPrice = 0;
    for (const opt of product.options) {
      const selectedVal = selectedOptions[opt.name];
      const optionValues = opt.values as { value: string; price: number }[];
      const found = optionValues.find(v => v.value === selectedVal);
      if (found && found.price > maxPrice) maxPrice = found.price;
    }
    return maxPrice > 0 ? maxPrice : null;
  }, [product?.options, selectedOptions]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-40" /></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold mb-2">상품을 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">요청하신 상품이 존재하지 않거나 삭제되었습니다.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}><ChevronLeft className="w-4 h-4 mr-1" />이전 페이지</Button>
            <Button asChild><Link href="/products">상품 목록으로</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  const images = (product.images ?? (product.thumbnail ? [product.thumbnail] : [])).map((img: string) => proxyImage(img));
  const discount = getDiscountPercent(product.price, product.salePrice);
  const basePrice = product.salePrice ?? product.price;
  const rating = product.avgRating ? parseFloat(product.avgRating) : 0;

  const displayPrice = optionPrice ?? basePrice;
  const totalPrice = displayPrice * quantity;

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast.error("로그인이 필요합니다"); return; }
    if (product.options && product.options.length > 0) {
      const missing = product.options.filter(o => !selectedOptions[o.name]);
      if (missing.length > 0) { toast.error(`${missing[0].name}을(를) 선택해주세요`); return; }
    }
    addToCart.mutate({ productId: product.id, quantity, options: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) { toast.error("로그인이 필요합니다"); return; }
    if (product.options && product.options.length > 0) {
      const missing = product.options.filter(o => !selectedOptions[o.name]);
      if (missing.length > 0) { toast.error(`${missing[0].name}을(를) 선택해주세요`); return; }
    }
    addToCartAndBuy.mutate({ productId: product.id, quantity, options: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined });
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">홈</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">상품</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="relative aspect-square bg-secondary/30 rounded-xl overflow-hidden mb-3 cursor-pointer" onClick={() => images.length > 0 && setLightboxOpen(true)}>
              {images.length > 0 ? (
                <img src={images[currentImage]} alt={product.name} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.opacity = "0"; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-20 h-20 opacity-20" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setCurrentImage(i => (i - 1 + images.length) % images.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white shadow-md"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setCurrentImage(i => (i + 1) % images.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white shadow-md"><ChevronRight className="w-5 h-5" /></button>
                </>
              )}
              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                  {currentImage + 1} / {images.length}
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                {product.isNew === 1 && <Badge className="bg-emerald-500 text-white">NEW</Badge>}
                {product.isBest === 1 && <Badge className="bg-amber-500 text-white">BEST</Badge>}
                {discount && <Badge className="bg-destructive text-destructive-foreground">-{discount}%</Badge>}
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)} className={`w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === currentImage ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/50"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Lightbox */}
            {lightboxOpen && images.length > 0 && (
              <ImageLightbox images={images} initialIndex={currentImage} onClose={() => setLightboxOpen(false)} />
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
            {product.description && <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{product.description}</p>}
            {product.hashtags && product.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.hashtags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={`product-rating-${i}`} className={`w-4 h-4 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                ))}
              </div>
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({product.reviewTotal}개 리뷰)</span>
            </div>

            {/* Price */}
            <div className="bg-secondary/50 rounded-xl p-5 mb-6">
              <div className="flex items-end gap-3">
                {discount && !optionPrice && <span className="text-2xl font-bold text-destructive">{discount}%</span>}
                <span className="text-2xl font-bold price-text">{formatPrice(displayPrice)}</span>
              </div>
              {product.salePrice && !optionPrice && <p className="text-sm text-muted-foreground line-through mt-1 price-text">{formatPrice(product.price)}</p>}
              {optionPrice && optionPrice !== basePrice && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="line-through price-text">{formatPrice(basePrice)}</span>
                  <span className="ml-2 text-primary font-medium">옵션 선택 가격</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">적립 포인트: {product.pointRateType === "fixed" ? `${(product.pointRate ?? 0).toLocaleString()}P` : `${Math.floor(displayPrice * ((product.pointRate ?? 0) / 100))}P (${product.pointRate ?? 0}%)`}</p>
            </div>

            {/* Options */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-5 mb-6">
                {product.options.map(opt => {
                  const optValues = opt.values as { value: string; price: number; stock?: number }[];
                  return (
                    <div key={opt.id}>
                      <label className="text-sm font-semibold mb-3 block">{opt.name}</label>
                      <div className="space-y-2">
                        {optValues.map(v => {
                          const isSelected = selectedOptions[opt.name] === v.value;
                          const isSoldOut = v.stock !== undefined && v.stock <= 0;
                          return (
                            <label
                              key={v.value}
                              className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                                isSoldOut
                                  ? "opacity-50 cursor-not-allowed bg-secondary/30"
                                  : isSelected
                                  ? "border-primary bg-primary/5 cursor-pointer hover:border-primary/50"
                                  : "border-border cursor-pointer hover:border-primary/50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={`option-${opt.id}`}
                                  value={v.value}
                                  checked={isSelected}
                                  disabled={isSoldOut}
                                  onChange={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: v.value }))}
                                  className="w-4 h-4 text-primary focus:ring-primary disabled:cursor-not-allowed"
                                />
                                <span className={`text-sm ${isSelected ? "font-semibold" : ""} ${isSoldOut ? "line-through" : ""}`}>{v.value}</span>
                                {isSoldOut && (() => {
                                  const alreadyRequested = (myRestockAlerts ?? []).some(
                                    (a: any) => a.productId === product.id && a.optionName === opt.name && a.optionValue === v.value && a.isNotified === 0
                                  );
                                  return (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">품절</Badge>
                                      {isAuthenticated && (
                                        alreadyRequested ? (
                                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" disabled>
                                            <Bell className="w-3 h-3 mr-1" />
                                            신청 완료
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              trpc.restockAlert.create.useMutation({
                                                onSuccess: () => {
                                                  toast.success("재입고 알림이 신청되었습니다");
                                                  utils.restockAlert.myAlerts.invalidate();
                                                },
                                                onError: (err) => toast.error(err.message),
                                              }).mutate({ productId: product.id, optionName: opt.name, optionValue: v.value });
                                            }}
                                          >
                                            <Bell className="w-3 h-3 mr-1" />
                                            알림신청
                                          </Button>
                                        )
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <span className={`text-sm price-text ${isSelected ? "font-bold text-primary" : "text-muted-foreground"} ${isSoldOut ? "line-through" : ""}`}>
                                {formatPrice(v.price)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium">수량</span>
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <span className="text-sm text-muted-foreground">재고: {product.stock}개</span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-4 border-t border-b mb-6">
              <span className="font-medium">총 상품금액</span>
              <span className="text-xl font-bold text-primary price-text">{formatPrice(totalPrice)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className={`flex-1 ${isWishlisted ? "border-rose-400 text-rose-500 hover:bg-rose-50" : ""}`} onClick={() => { if (!isAuthenticated) { toast.error("로그인이 필요합니다"); return; } toggleWishlist.mutate({ productId: product.id }); }}>
                <Heart className={`w-5 h-5 mr-2 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />위시리스트
              </Button>
              <Button variant="outline" size="lg" className="flex-1" onClick={handleAddToCart} disabled={product.status === "soldout" || product.stock === 0 || (product as any).canPurchase === false}>
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.status === "soldout" || product.stock === 0 ? "품절" : (product as any).canPurchase === false ? "등급 제한" : "장바구니"}
              </Button>
              <Button size="lg" className="flex-1" onClick={handleBuyNow} disabled={product.status === "soldout" || product.stock === 0 || (product as any).canPurchase === false || addToCartAndBuy.isPending}>
                {addToCartAndBuy.isPending ? "처리 중..." : "바로 구매"}
              </Button>
            </div>
            {(product as any).canPurchase === false && (
              <p className="text-xs text-destructive mt-1">이 상품은 {product.minGrade === "silver" ? "실버" : product.minGrade === "gold" ? "골드" : product.minGrade === "vip" ? "VIP" : product.minGrade === "vvip" ? "VVIP" : "브론즈"} 등급 이상부터 구매 가능합니다.</p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Heart className="w-3 h-3 text-rose-400 fill-rose-300" />
              위시리스트에 추가하면 이 상품의 가격이 변동될 때 알림을 받을 수 있습니다
            </p>

            {/* Info badges */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <Truck className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">무료배송</p>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <Shield className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">안전결제</p>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <RotateCcw className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">교환/반품</p>
              </div>
            </div>

            {/* SNS 공유 */}
            <ShareButtons productName={product.name} />
          </div>
        </div>

        {/* ─── 스크롤 형식: 상품개요 → 상품정보 → FAQ → 리뷰 → Q&A ─── */}
        <div className="mt-16 space-y-12">

          {/* 상품 개요 박스 카드 */}
          <ProductContentBoxSection content={product.content} />

          {/* 상품 정보 (사용방법, 용량/용법, 부작용, 주의사항) - FAQ 제외 */}
          <ProductInfoInlineSection productId={product.id} excludeFaq />

          {/* 자주 묻는 질문 */}
          <ProductFaqSection productId={product.id} />

          {/* 리뷰 섹션 */}
          <div>
            <ReviewsSection productId={product.id} />
          </div>

          {/* Q&A 섹션 */}
          <ProductQnASection productId={product.id} />
        </div>
      </div>

      {/* ─── 추천 상품 섹션 ─── */}
      <div className="container py-12">
        {/* 함께 구매한 상품 */}
        <BoughtTogetherSection productId={product.id} />
        {/* 유사 상품 */}
        <SimilarProductsSection productId={product.id} />
      </div>
    </Layout>
  );
}

// ─── 함께 구매한 상품 섹션 ───
function BoughtTogetherSection({ productId }: { productId: number }) {
  const { data: items } = trpc.recommendation.boughtTogether.useQuery({ productId, limit: 6 });
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-10">
      <h3 className="text-lg font-bold mb-4">이 상품을 구매한 분들이 함께 구매한 상품</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {items.map((p: any) => (
          <Link key={p.id} href={productHref(p.slug)} className="group">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
              <img src={proxyImage(p.thumbnail) || '/placeholder.png'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{p.name}</p>
            <p className="text-sm font-bold text-primary mt-1">{formatPrice(p.salePrice ?? p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── 리뷰 목록 섹션 (전면 개편) ───
function ReviewsSection({ productId }: { productId: number }) {
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"latest" | "rating_high" | "rating_low" | "helpful">("latest");
  const [page, setPage] = useState(1);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: reviewData } = trpc.reviews.getProductReviews.useQuery({
    productId,
    rating: ratingFilter,
    sortBy,
    page,
    limit: 10,
  });

  const { data: stats } = trpc.reviews.getProductReviewStats.useQuery({ productId });
  const { data: photoGallery } = trpc.reviews.getProductPhotoGallery.useQuery({
    productId,
    limit: showAllPhotos ? 50 : 8,
  });

  const total = reviewData?.total ?? 0;
  const avgRating = stats?.avgRating ?? 0;
  const totalCount = stats?.totalCount ?? 0;
  const dist = stats?.ratingDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const photoCount = stats?.photoReviewCount ?? 0;

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold mb-1">상품리뷰</h3>
      <p className="text-sm text-muted-foreground mb-6">상품을 구매하신 분들이 작성하신 리뷰입니다.</p>

      {/* ═══ 리뷰 요약 섹션 ═══ */}
      {totalCount > 0 && (
        <div className="border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* 사용자 총 평점 */}
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">사용자 총 평점</p>
              <div className="flex justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(avgRating)
                        ? "fill-red-500 text-red-500"
                        : star - 0.5 <= avgRating
                        ? "fill-red-500/50 text-red-500"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold">{avgRating.toFixed(2)}</span>
                <span className="text-lg text-muted-foreground">/5</span>
              </div>
            </div>

            {/* 전체 리뷰수 */}
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">전체 리뷰수</p>
              <div className="flex justify-center mb-1">
                <MessageCircle className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <span className="text-3xl font-bold">{totalCount}</span>
            </div>

            {/* 평점 비율 */}
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-3">평점 비율</p>
              <div className="space-y-1.5 max-w-[200px] mx-auto">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = dist[rating] || 0;
                  const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  const isMax = count === Math.max(...Object.values(dist));
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs w-6 text-right text-muted-foreground">{rating}점</span>
                      <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isMax && count > 0 ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs w-8 ${isMax && count > 0 ? "font-bold text-red-500" : "text-muted-foreground"}`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 포토 & 동영상 갤러리 ═══ */}
      {photoGallery && photoGallery.images.length > 0 && (
        <div className="mb-6">
          <h4 className="text-base font-bold mb-3">포토 & 동영상 {photoCount}건</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photoGallery.images.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => openLightbox(photoGallery.images.map(p => p.imageUrl), idx)}
                className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border bg-secondary/30 hover:opacity-80 transition-opacity group"
              >
                <img src={photo.imageUrl} alt="리뷰 사진" className="w-full h-full object-cover" />
                {idx === photoGallery.images.length - 1 && !showAllPhotos && photoCount > 8 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">더보기</span>
                  </div>
                )}
              </button>
            ))}
            {!showAllPhotos && photoCount > 8 && (
              <button
                onClick={() => setShowAllPhotos(true)}
                className="shrink-0 w-24 h-24 rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground hover:bg-secondary/30 transition-colors"
              >
                +{photoCount - 8}건 더
              </button>
            )}
          </div>
        </div>
      )}

      <Separator className="mb-6" />

      {/* ═══ 리뷰 목록 ═══ */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-bold">리뷰 {total}건</h4>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 text-sm border rounded-md bg-background"
        >
          <option value="latest">최신순</option>
          <option value="rating_high">별점 높은순</option>
          <option value="rating_low">별점 낮은순</option>
          <option value="helpful">추천순</option>
        </select>
      </div>

      {total === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-2">아직 작성된 리뷰가 없습니다.</p>
          <p className="text-sm text-muted-foreground">이 상품을 구매하신 후 첫 리뷰를 남겨보세요!</p>
        </div>
      ) : (
        <>
          {/* 2열 그리드 레이아웃 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reviewData?.reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                {/* 상품 썸네일 + 상품명 */}
                {review.productName && (
                  <Link
                    href={review.productSlug ? productHref(review.productSlug) : '#'}
                    className="flex items-center gap-2.5 mb-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    {review.productThumbnail && (
                      <img
                        src={typeof review.productThumbnail === 'string' ? review.productThumbnail.replace(/^"|"$/g, '') : ''}
                        alt={review.productName}
                        className="w-10 h-10 rounded-md object-cover shrink-0 border"
                      />
                    )}
                    <span className="text-xs text-muted-foreground line-clamp-2">{review.productName}</span>
                  </Link>
                )}

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (review.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.displayName || review.userName || "익명"}</span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                          <BadgeCheck className="w-3 h-3" />
                          구매인증
                        </span>
                      )}
                    </div>
                    <Link href={`/shop/itemuseview.php?is_id=${review.id}`} className="hover:text-primary transition-colors">
                      <h4 className="font-semibold text-sm">{review.title}</h4>
                    </Link>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Link href={`/shop/itemuseview.php?is_id=${review.id}`} className="block hover:opacity-80 transition-opacity">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{review.content}</p>
                </Link>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.slice(0, 4).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => openLightbox(review.images as string[], idx)}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border bg-secondary/30 hover:opacity-80 transition-opacity"
                      >
                        <img src={img} alt="리뷰 사진" className="w-full h-full object-cover" />
                        {idx === 3 && review.images!.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">+{review.images!.length - 4}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          <Paginator page={page} totalPages={reviewData?.totalPages ?? 0} onPageChange={setPage} className="mt-6" />

          {/* 고객리뷰 게시판 링크 */}
          <div className="mt-4 text-center">
            <Link
              href="/shop/itemuselist.php"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              고객 리뷰 게시판 전체보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}

      {/* 라이트박스 */}
      {lightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

// ─── 유사 상품 섹션 ───
function SimilarProductsSection({ productId }: { productId: number}) {
  const { data: items } = trpc.recommendation.similar.useQuery({ productId, limit: 6 });
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-10">
      <h3 className="text-lg font-bold mb-4">비슷한 상품 추천</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {items.map((p: any) => (
          <Link key={p.id} href={productHref(p.slug)} className="group">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
              <img src={proxyImage(p.thumbnail) || '/placeholder.png'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{p.name}</p>
            <p className="text-sm font-bold text-primary mt-1">{formatPrice(p.salePrice ?? p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}


// ─── 상품 정보 섹션 설정 ───
const SECTION_CONFIG = [
  { type: "faq", label: "자주 묻는 질문", icon: HelpCircle, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/30", borderColor: "border-blue-200 dark:border-blue-800" },
  { type: "usage", label: "사용방법", icon: BookOpen, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", borderColor: "border-emerald-200 dark:border-emerald-800" },
  { type: "dosage", label: "용량/용법", icon: Pill, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-950/30", borderColor: "border-purple-200 dark:border-purple-800" },
  { type: "sideEffects", label: "부작용", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800" },
  { type: "precautions", label: "주의사항", icon: FileText, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950/30", borderColor: "border-red-200 dark:border-red-800" },
] as const;

function markdownToHtml(md: string): string {
  let cleaned = md
    .replace(/^-\s*\[(필수\/배송|다음상품|이전상품|상품상세설명)[^\n]*/gm, '')
    .replace(/\| 상품상세설명페이지 참고 \|/g, '')
    .replace(/^0\d\.\s*$/gm, '')
    .replace(/^상품요약정보\s*:.*$/gm, '')
    .replace(/^\| 제품소재 \|.*$/gm, '')
    .replace(/^\| 색상 \|.*$/gm, '')
    .replace(/^\|[^|]*상세설명페이지[^|]*\|/gm, '')
    .replace(/^\| 제조자와 전화번호.*$/gm, '')
    .replace(/^\| 제조연월 \|.*$/gm, '')
    .replace(/^\| 품질보증기준.*$/gm, '')
    .replace(/^\| A\/S 책임자와.*$/gm, '')
    .replace(/^상품정보고시.*$/gm, '')
    .replace(/^\|\s*치수\s*\|.*$/gm, '')
    .replace(/^\|\s*제조자\s*\|.*$/gm, '')
    .replace(/^\|\s*세탁방법.*\|.*$/gm, '')
    .replace(/^\|\s*취급시\s*주의사항.*$/gm, '')
    .replace(/^\|\s*제조연월\s*\|.*$/gm, '')
    .replace(/^\|\s*품질보증기준.*$/gm, '')
    .replace(/^\|\s*A\/S\s*책임자.*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  let html = cleaned
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match: string, text: string, url: string) => {
      const safeUrl = /^https?:\/\//i.test(url) ? url : '#';
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    })
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p>\s*(<h[1-4]>)/g, '$1').replace(/(<\/h[1-4]>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*<\/p>/g, '');
  return html;
}

function isHtmlContent(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

function ProductContentBoxSection({ content }: { content?: string | null }) {
  const htmlContent = useMemo(() => {
    if (!content) return "";
    // TipTap 에디터로 저장된 HTML은 바로 렌더링, 아니면 Markdown 변환
    return isHtmlContent(content) ? content : markdownToHtml(content);
  }, [content]);

  if (!content) return null;

  return (
    <div className="border rounded-xl overflow-hidden border-stone-200 dark:border-stone-700">
      <div className="flex items-center gap-3 px-5 py-3.5 bg-stone-50 dark:bg-stone-900/30">
        <Info className="w-5 h-5 text-stone-600 dark:text-stone-400" />
        <h4 className="font-semibold text-sm text-stone-600 dark:text-stone-400">상품 개요</h4>
      </div>
      <div className="p-5">
        <div className="text-sm text-muted-foreground leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-amber-800 [&_h4]:dark:text-amber-400 [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:border-b [&_h4]:border-stone-200 [&_h4]:dark:border-stone-700 [&_h4]:pb-1 [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:text-foreground [&_strong]:font-medium [&_a]:text-amber-700 [&_a]:dark:text-amber-400 [&_a]:underline first:[&_h4]:mt-0" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </div>
  );
}

// ─── 상품 정보 인라인 섹션 (박스 카드 형태로 표시) ───
function ProductInfoInlineSection({ productId, excludeFaq = false }: { productId: number; excludeFaq?: boolean }) {
  const { data: sections, isLoading } = trpc.productInfo.getByProduct.useQuery({ productId });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={`info-inline-skeleton-${i}`} className="border rounded-xl p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const filteredConfig = excludeFaq
    ? SECTION_CONFIG.filter(c => c.type !== "faq")
    : SECTION_CONFIG;

  const grouped = filteredConfig.map(config => ({
    ...config,
    items: (sections as any[] ?? []).filter((s: any) => s.sectionType === config.type),
  })).filter(g => g.items.length > 0);

  if (grouped.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grouped.map(group => {
          const Icon = group.icon;
          return (
            <div key={group.type} className={`border rounded-xl overflow-hidden ${group.borderColor}`}>
              {/* 박스 헤더 */}
              <div className={`flex items-center gap-3 px-5 py-3.5 ${group.bgColor}`}>
                <Icon className={`w-5 h-5 ${group.color}`} />
                <h4 className={`font-semibold text-sm ${group.color}`}>{group.label}</h4>
              </div>
              {/* 박스 내용 */}
              <div className="p-5">
                <div className="space-y-3">
                  {group.items.map((item: any, idx: number) => (
                    <div key={item.id}>
                      <h5 className="font-medium text-sm mb-1">{item.title}</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      {idx < group.items.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

// ─── FAQ 섹션 (맨 아래에 항상 표시) ───
function ProductFaqSection({ productId }: { productId: number }) {
  const { data: sections, isLoading } = trpc.productInfo.getByProduct.useQuery({ productId, sectionType: "faq" });
  const [expandedFaqItems, setExpandedFaqItems] = useState<Record<number, boolean>>({});

  const toggleFaqItem = (id: number) => {
    setExpandedFaqItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={`faq-skeleton-${i}`} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  const faqItems = (sections as any[] ?? []).filter((s: any) => s.sectionType === "faq");
  if (faqItems.length === 0) return null;

  return (
    <div className="border rounded-xl overflow-hidden border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3 p-5 bg-blue-50 dark:bg-blue-950/30">
        <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-base text-blue-600 dark:text-blue-400">자주 묻는 질문</h3>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{faqItems.length}건</Badge>
      </div>
      <div className="p-5 space-y-2">
        {faqItems.map((item: any) => (
          <div key={item.id} className="border rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              onClick={() => toggleFaqItem(item.id)}
            >
              <span className="font-medium text-sm flex items-center gap-2">
                <span className="text-primary font-bold">Q.</span>
                {item.title}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expandedFaqItems[item.id] ? "rotate-180" : ""}`} />
            </button>
            {expandedFaqItems[item.id] && (
              <div className="px-4 pb-4 pt-0">
                <div className="pl-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">A.</span> {item.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
