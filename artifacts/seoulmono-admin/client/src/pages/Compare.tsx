import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, proxyImage, productHref } from "@/lib/utils";
import { GitCompare, X, ShoppingCart, Heart, Star } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { useState, useEffect } from "react";

export default function Compare() {
  useSEO({ title: "商品比較", description: "選択した商品を比較します" });
  const [, navigate] = useLocation();
  const [productIds, setProductIds] = useState<number[]>([]);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get("ids");
    if (ids) {
      setProductIds(ids.split(",").map(Number).filter(id => !isNaN(id)));
    }
  }, []);

  const { data: products } = trpc.compare.getProducts.useQuery(
    { productIds },
    { enabled: productIds.length > 0 }
  );

  const removeProduct = (id: number) => {
    const newIds = productIds.filter(pid => pid !== id);
    setProductIds(newIds);
    if (newIds.length === 0) {
      navigate("/products");
    } else {
      navigate(`/compare?ids=${newIds.join(",")}`);
    }
  };

  if (productIds.length === 0 || !products || products.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <GitCompare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold mb-2">比較する商品がありません</h2>
          <p className="text-muted-foreground mb-6">商品一覧から比較する商品を選択してください</p>
          <Link href="/products">
            <Button>商品一覧を見る</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const compareFields = [
    { label: "商品画像", key: "thumbnail" },
    { label: "商品名", key: "name" },
    { label: "価格", key: "price" },
    { label: "割引価格", key: "salePrice" },
    { label: "カテゴリー", key: "category" },
    { label: "在庫", key: "stock" },
    { label: "評価", key: "rating" },
    { label: "レビュー数", key: "reviewCount" },
    { label: "説明", key: "description" },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <GitCompare className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">商品比較</h1>
          <Badge variant="secondary">{products.length}点</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-card rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-4 text-left font-semibold sticky left-0 bg-muted/50 z-10 min-w-[150px]">比較項目</th>
                {products.map((product: any) => (
                  <th key={product.id} className="p-4 text-center min-w-[250px] relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeProduct(product.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFields.map((field, idx) => (
                <tr key={field.key} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                  <td className="p-4 font-medium sticky left-0 bg-card z-10 border-r">{field.label}</td>
                  {products.map((product: any) => (
                    <td key={product.id} className="p-4 text-center">
                      {field.key === "thumbnail" && (
                        <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-muted">
                          {product.thumbnail ? (
                            <img src={proxyImage(product.thumbnail)} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                      )}
                      {field.key === "name" && (
                        <Link href={productHref(product.slug, product.itId)}>
                          <span className="font-semibold hover:text-primary transition-colors">{product.name}</span>
                        </Link>
                      )}
                      {field.key === "price" && (
                        <span className="text-lg font-bold price-text">{formatPrice(product.price)}</span>
                      )}
                      {field.key === "salePrice" && (
                        product.salePrice ? (
                          <div>
                            <span className="text-lg font-bold text-destructive">{formatPrice(product.salePrice)}</span>
                            <div className="text-xs text-muted-foreground mt-1">
                              {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )
                      )}
                      {field.key === "category" && (
                        <Badge variant="secondary">{product.categoryName || "-"}</Badge>
                      )}
                      {field.key === "stock" && (
                        <span className={product.stock > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}>
                          {product.stock > 0 ? `${product.stock}個` : "在庫切れ"}
                        </span>
                      )}
                      {field.key === "rating" && (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{product.rating?.toFixed(1) || "0.0"}</span>
                        </div>
                      )}
                      {field.key === "reviewCount" && (
                        <span className="text-sm">{product.reviewCount || 0}件</span>
                      )}
                      {field.key === "description" && (
                        <p className="text-sm text-muted-foreground line-clamp-3 text-left px-2">
                          {product.description || "-"}
                        </p>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-4 font-medium sticky left-0 bg-card z-10 border-r">アクション</td>
                {products.map((product: any) => (
                  <td key={product.id} className="p-4">
                    <div className="flex flex-col gap-2">
                      <Link href={productHref(product.slug)}>
                        <Button className="w-full">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          詳細を見る
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full">
                        <Heart className="w-4 h-4 mr-2" />
                        お気に入り
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
