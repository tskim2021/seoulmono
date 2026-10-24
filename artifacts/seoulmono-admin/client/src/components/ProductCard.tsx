import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, GitCompare } from "lucide-react";
import { formatPrice, getDiscountPercent, proxyImage, productHref } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useCompareStore } from "@/stores/compareStore";

type ProductCardProps = {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    thumbnail: string | null;
    isFeatured: number;
    isNew: number;
    isBest: number;
    status: string;
    avgRating: string | null;
    reviewCount: number;
    description?: string | null;
    hashtags?: string[] | null;
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => { toast.success("カートに追加しました"); utils.cart.list.invalidate(); },
    onError: () => toast.error("ログインが必要です"),
  });
  const { data: wishlistItems } = trpc.wishlist.list.useQuery(undefined, { enabled: isAuthenticated });
  const isWishlisted = wishlistItems?.some(item => item.productId === product.id) ?? false;
  const toggleWishlist = trpc.wishlist.toggle.useMutation({
    onSuccess: (data) => { toast.success(data.isAdded ? "お気に入りに追加しました" : "お気に入りから削除しました"); utils.wishlist.list.invalidate(); },
  });

  const discount = getDiscountPercent(product.price, product.salePrice);
  const displayPrice = product.salePrice ?? product.price;
  const rating = product.avgRating ? parseFloat(product.avgRating) : 0;

  return (
    <div className="group relative">
      {/* Image tile — ramumall: square, gray-50 bg, 1px line border, 12px radius */}
      <Link href={productHref(product.slug, product.itId)}>
        <div className="relative aspect-square bg-secondary/50 border border-border rounded-xl overflow-hidden">
          {product.thumbnail ? (
            <>
              <img src={proxyImage(product.thumbnail)} alt={product.name} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-contain p-3" onError={(e) => { e.currentTarget.style.display = "none"; const ph = e.currentTarget.nextElementSibling as HTMLElement; if (ph) ph.style.display = "flex"; }} />
              <div className="w-full h-full items-center justify-center text-muted-foreground absolute inset-0 bg-secondary/50" style={{ display: "none" }}>
                <ShoppingCart className="w-12 h-12 opacity-20" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12 opacity-20" />
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {product.isNew === 1 && <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5">NEW</Badge>}
            {product.isBest === 1 && <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5">BEST</Badge>}
            {product.status === "soldout" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">売り切れ</Badge>}
          </div>
          {/* Quick actions */}
          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); useCompareStore.getState().addProduct(product.id); toast.success("比較リストに追加しました"); }}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-sm transition-colors"
            >
              <GitCompare className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isAuthenticated) { toast.error("ログインが必要です"); return; } toggleWishlist.mutate({ productId: product.id }); }}
              className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-sm transition-colors ${isWishlisted ? "text-rose-500" : ""}`}
            >
              <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
            {product.status !== "soldout" && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isAuthenticated) { toast.error("ログインが必要です"); return; } addToCart.mutate({ productId: product.id, quantity: 1 }); }}
                className="w-8 h-8 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center hover:bg-primary text-primary-foreground shadow-sm transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Link>

      {/* Info — ramumall order: review → name → sale price → discount%+price */}
      <div className="mt-2.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {rating > 0 && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
          <span>レビュー({product.reviewCount})</span>
        </div>

        <Link href={productHref(product.slug, product.itId)}>
          <h3 className="mt-0.5 text-[15px] font-bold line-clamp-2 leading-snug hover:text-primary transition-colors">{product.name}</h3>
        </Link>

        <div className="mt-1.5">
          {product.salePrice && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">割引価格</span>
              <span className="text-xs text-muted-foreground line-through price-text">{formatPrice(product.price)}</span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5 mt-0.5">
            {discount ? <span className="text-base font-extrabold text-[var(--sale,#ff334b)]">{discount}%</span> : null}
            <span className="text-lg font-extrabold price-text">{formatPrice(displayPrice)}</span>
          </div>
        </div>

        {product.hashtags && product.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.hashtags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5">#{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
