import { useState } from "react";
import { useGetProduct } from "@workspace/api-client-react";
import { useCart } from "../store/cart";
import { Card, Button, Badge } from "../components/ui";
import { formatCurrency, cn } from "../lib/utils";
import { ArrowLeft, Loader2, Image as ImageIcon, Minus, Plus, Check, Package, ShoppingCart, Phone, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "../hooks/use-toast";
import DOMPurify from "dompurify";

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "div", "span", "img", "strong", "b", "em", "i", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "thead", "tbody", "tr", "td", "th", "a", "hr", "blockquote"],
    ALLOWED_ATTR: ["src", "alt", "width", "height", "style", "class", "href", "target", "rel"],
  });
}

export default function ProductDetail({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { data: product, isLoading } = useGetProduct(params.id);
  const addItem = useCart((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!product) {
    return (
      <div className="py-24 text-center">
        <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700">상품을 찾을 수 없습니다</h3>
        <Link href="/" className="text-primary font-medium mt-4 inline-block">상품목록으로 돌아가기</Link>
      </div>
    );
  }

  const boxOpt = (product as any).box_option;
  const boxQty = Number(boxOpt?.box_qty || product.it_2 || 0) || null;
  const boxPrice = boxOpt?.box_price ? Number(boxOpt.box_price) : Number(product.it_price) || 0;
  const unitPrice = boxOpt?.unit_price ? Number(boxOpt.unit_price) : (boxQty ? Math.round(boxPrice / boxQty) : null);
  const displayPrice = boxPrice;
  const unitLabel = boxQty ? `1박스(${boxQty}입)` : "1개";
  const isSoldOut = product.it_stock_qty !== undefined && product.it_stock_qty <= 0;
  const isSuspended = (product as any).it_use !== "1";
  const isDisabled = isSoldOut || isSuspended;

  const handleAddToCart = () => {
    if (isDisabled) return;
    const effectivePrice = boxPrice;
    const optionLabel = boxOpt ? unitLabel : "1개";
    addItem({ ...product, it_price: effectivePrice, it_name: `${product.it_name} (${optionLabel})` }, qty);
    toast({
      title: "장바구니에 담겼습니다",
      description: `${product.it_name} ${optionLabel} × ${qty}`,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        상품목록으로
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-0 overflow-hidden">
          <div className="aspect-square bg-slate-100 relative flex items-center justify-center">
            {product.it_img1 ? (
              <img
                src={product.it_img1}
                alt={product.it_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.querySelector(".fallback-icon")?.classList.remove("hidden");
                }}
              />
            ) : null}
            <ImageIcon className={cn("w-20 h-20 text-slate-300 fallback-icon", product.it_img1 ? "hidden" : "")} />
            {isSuspended && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <span className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-xl text-lg">입금예정</span>
              </div>
            )}
            {!isSuspended && isSoldOut && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <span className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-xl text-lg">품절</span>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col">
          {product.ca_name && (
            <span className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">{product.ca_name}</span>
          )}

          <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">{product.it_name}</h1>

          {product.it_maker && (
            <p className="text-slate-500 mb-4">{product.it_maker}</p>
          )}

          {boxOpt && (
            <Badge className="self-start bg-blue-50 text-blue-700 border-blue-200 mb-4 text-sm px-3 py-1">
              {unitLabel}
            </Badge>
          )}

          <div className="mt-2 mb-6">
            {product.it_cust_price && product.it_cust_price > displayPrice && (
              <p className="text-lg text-slate-400 line-through mb-1">{formatCurrency(product.it_cust_price)}</p>
            )}
            <p className="text-4xl font-black text-slate-900">{formatCurrency(displayPrice)}</p>
            {boxOpt ? (
              <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                <p>박스입수 1박스 {boxQty || "?"}입</p>
                <p>낱개가격 <span className="font-bold text-slate-700">{formatCurrency(unitPrice || 0)}</span></p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-1">낱개 단가</p>
            )}
          </div>

          <div className="space-y-3 text-sm mb-8 bg-slate-50 rounded-xl p-4">
            {boxOpt && (
              <>
                <div className="flex">
                  <span className="text-slate-500 font-bold w-24">박스단위</span>
                  <span className="text-slate-900 font-bold">{unitLabel}</span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 font-bold w-24">박스금액</span>
                  <span className="text-primary font-black">{formatCurrency(boxOpt.box_price)}</span>
                </div>
                {boxQty && (
                  <div className="flex">
                    <span className="text-slate-500 font-bold w-24">낱개금액</span>
                    <span className="text-slate-900">{formatCurrency(unitPrice || 0)}</span>
                  </div>
                )}
              </>
            )}
            {!boxOpt && (
              <div className="flex">
                <span className="text-slate-500 font-bold w-24">판매단위</span>
                <span className="text-slate-900 font-bold">낱개</span>
              </div>
            )}
            {product.it_origin && (
              <div className="flex">
                <span className="text-slate-500 font-bold w-24">원산지</span>
                <span className="text-slate-900">{product.it_origin}</span>
              </div>
            )}
            {product.it_shelf_life && (
              <div className="flex">
                <span className="text-slate-500 font-bold w-24">유통기한</span>
                <span className="text-orange-600 font-bold">{product.it_shelf_life}</span>
              </div>
            )}
            {product.it_stock_qty !== undefined && (
              <div className="flex">
                <span className="text-slate-500 font-bold w-24">재고</span>
                <span className={cn("font-bold", product.it_stock_qty > 0 ? "text-emerald-600" : "text-red-500")}>
                  {product.it_stock_qty > 0 ? `${product.it_stock_qty}개` : "품절"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-4">
            {isSuspended && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span className="font-bold text-amber-700">입금예정 상품</span>
                </div>
                <p className="text-sm text-amber-600">현재 입금예정 상태로 구매가 불가합니다.</p>
                <p className="text-sm text-amber-600">구매를 원하시면 고객센터로 연락해 주세요.</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200">
                  <Phone className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-700">고객센터 문의</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-500">수량</span>
              <div className={cn("flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden", isDisabled && "opacity-50")}>
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-3 hover:bg-slate-200 text-slate-600 transition-colors"
                  disabled={isDisabled}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1 px-3">
                  <span className="text-sm text-blue-600 font-bold">박스</span>
                  <input
                    type="number"
                    className="w-12 text-center font-bold bg-transparent border-none focus:ring-0 p-0 text-lg"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    disabled={isDisabled}
                  />
                </div>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="p-3 hover:bg-slate-200 text-slate-600 transition-colors"
                  disabled={isDisabled}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-slate-500">합계</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(displayPrice * qty)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className={cn(
                  "flex-1 h-14 text-lg font-bold transition-all duration-300",
                  added ? "bg-emerald-500 hover:bg-emerald-600" : "",
                  isSuspended ? "bg-amber-400 hover:bg-amber-400 cursor-not-allowed" : ""
                )}
                onClick={handleAddToCart}
                disabled={isDisabled}
              >
                {isSuspended ? (
                  <><AlertTriangle className="w-5 h-5 mr-2" /> 입금예정 (구매불가)</>
                ) : added ? (
                  <><Check className="w-5 h-5 mr-2" /> 담겼습니다</>
                ) : (
                  <><ShoppingCart className="w-5 h-5 mr-2" /> 장바구니 담기</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {product.it_explan && (
        <Card className="mt-8 p-8">
          <h2 className="text-xl font-black text-slate-900 mb-6 pb-4 border-b border-slate-100">상품 상세 정보</h2>
          <div
            className="prose prose-slate max-w-none text-slate-700 leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:mx-auto [&_img]:block"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.it_explan) }}
          />
        </Card>
      )}
    </div>
  );
}
