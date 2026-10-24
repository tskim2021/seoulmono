import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";

export default function NotFound() {
  const [, setLocation] = useLocation();

  useSEO({
    title: "404 - ページが見つかりません",
    description: "お探しのページは存在しないか、移動されました。",
    noindex: true,
  });

  return (
    <Layout>
      <div className="container py-20 text-center max-w-lg mx-auto">
        {/* 404 Number */}
        <div className="text-8xl font-bold text-primary/10 mb-2 select-none">404</div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-3">ページが見つかりません</h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          お探しのページは存在しないか、移動されました。<br />
          URLをご確認いただくか、下のボタンをご利用ください。
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            前のページ
          </Button>
          <Button
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            ホームへ
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/products")}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            商品を見る
          </Button>
        </div>
      </div>
    </Layout>
  );
}
