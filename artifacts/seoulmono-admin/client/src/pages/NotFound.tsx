import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";

export default function NotFound() {
  const [, setLocation] = useLocation();

  useSEO({
    title: "404 - 페이지를 찾을 수 없음",
    description: "요청하신 페이지가 존재하지 않거나 이동되었습니다.",
    noindex: true,
  });

  return (
    <Layout>
      <div className="container py-20 text-center max-w-lg mx-auto">
        {/* 404 Number */}
        <div className="text-8xl font-bold text-primary/10 mb-2 select-none">404</div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-3">페이지를 찾을 수 없음</h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8 leading-relaxed">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.<br />
          주소를 다시 확인하시거나 아래 버튼을 이용해주세요.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            이전 페이지
          </Button>
          <Button
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            홈으로 가기
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/products")}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            상품 둘러보기
          </Button>
        </div>
      </div>
    </Layout>
  );
}
