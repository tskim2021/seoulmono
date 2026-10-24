import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice, proxyImage, productHref } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useSEO } from "@/hooks/useSEO";

export default function Cart() {
  useSEO({ title: "カートに入れる", description: "カートに入れた商品をご確認ください。", noindex: true });
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: items, isLoading } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: summary } = trpc.cart.summary.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const updateItem = trpc.cart.update.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });
  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => { toast.success("削除しました"); utils.cart.list.invalidate(); },
  });
  const clearCart = trpc.cart.clear.useMutation({
    onSuccess: () => { toast.success("カートを空にしました"); utils.cart.list.invalidate(); },
  });

  if (!loading && !isAuthenticated) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold mb-2">ログインが必要です</h2>
          <p className="text-muted-foreground text-sm mb-6">カートをご利用になるにはログインしてください</p>
          <Button asChild><a href={getLoginUrl()}>ログイン</a></Button>
        </div>
      </Layout>
    );
  }

  const cartItems = items ?? [];
  const subtotal = summary?.subtotal ?? 0;
  const gradeDiscount = summary?.gradeDiscount ?? 0;
  const shippingFee = summary?.shippingFee ?? 0;
  const total = summary?.total ?? 0;
  const benefit = summary?.benefit;

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-8">カートに入れる</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h2 className="text-lg font-semibold mb-2">カートが空です</h2>
            <p className="text-muted-foreground text-sm mb-6">お気に入りの商品を入れてみましょう</p>
            <Button asChild variant="outline"><Link href="/products">買い物を続ける</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">총 {cartItems.length}개 상품</span>
                <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => clearCart.mutate()}>すべて削除</Button>
              </div>
              {cartItems.map(item => {
                const product = item.product;
                if (!product) return null;
                const price = (item as any).optionPrice ?? product.salePrice ?? product.price;
                return (
                  <div key={item.id} className="bg-card border rounded-xl p-4 flex gap-4" translate="no">
                    <Link href={productHref(product.slug, product.itId)}>
                      <div className="w-24 h-24 rounded-lg bg-secondary/30 overflow-hidden shrink-0">
                        {product.thumbnail ? (
                          <img src={proxyImage(product.thumbnail)} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-8 h-8 opacity-20" /></div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link href={productHref(product.slug, product.itId)}>
                        <h3 className="font-medium text-sm hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                      </Link>
                      {item.options && Object.keys(item.options).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">{Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(", ")}</p>
                      )}
                      <p className="font-bold text-sm mt-2 price-text">{formatPrice(price)}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border rounded-lg">
                          <button onClick={() => updateItem.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })} className="w-8 h-8 flex items-center justify-center hover:bg-accent"><Minus className="w-3 h-3" /></button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })} className="w-8 h-8 flex items-center justify-center hover:bg-accent"><Plus className="w-3 h-3" /></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm price-text">{formatPrice(price * item.quantity)}</span>
                          <button onClick={() => removeItem.mutate({ id: item.id })} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border rounded-xl p-6 sticky top-24">
                <h3 className="font-semibold mb-4">注文サマリー</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">商品金額</span><span className="price-text">{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">送料</span><span className="price-text">{shippingFee === 0 ? "無料" : formatPrice(shippingFee)}</span></div>
                  {benefit && benefit.freeShippingThreshold > 0 && subtotal < benefit.freeShippingThreshold && (
                    <p className="text-xs text-muted-foreground">{formatPrice(benefit.freeShippingThreshold - subtotal)} 더 구매시 무료배송</p>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base"><span>累計決済金額</span><span className="text-primary price-text">{formatPrice(total)}</span></div>
                  {benefit && (
                    <p className="text-xs text-muted-foreground mt-2">적립 예정 포인트: {benefit.pointRate}%</p>
                  )}
                </div>
                <Button className="w-full mt-6" size="lg" onClick={() => navigate("/checkout")}>
                  주문하기 <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
