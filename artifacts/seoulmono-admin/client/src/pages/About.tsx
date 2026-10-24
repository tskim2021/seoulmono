import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";
import { Building2, Users, Globe, Heart, Award, MapPin } from "lucide-react";

export default function About() {
  useSEO({
    title: "회사소개 - 탈모학교",
    description: "탈모학교는 탈모 고민을 가진 분들을 위해 정품 탈모 제품을 합리적인 가격에 제공하는 국내외 해외직구 기반 서비스입니다.",
  });

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">회사소개</h1>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">탈모학교를 소개합니다</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            탈모학교는 2025년부터 탈모 고민을 가진 분들을 위해 정품 탈모 제품을 합리적인 가격에 제공하는 국내외 해외직구 기반 서비스입니다.
            인도, 싱가포르 등 해외 정품을 직접 수입해 최저가로 제공하며,
            구매금액 3% 포인트 적립, 리뷰 작성 시 최대 1,500포인트 적립을 운영하고 있습니다.
          </p>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">운영 철학</h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p>정품 보장 — 모든 상품은 공식 수입 경로를 통해 검증된 정품만을 취급합니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p>고객 중심 — 1:1 문의와 상세한 상품 정보로 안심 구매를 돕습니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p>해외 직구 — 인도, 싱가포르 등 현지 공식 판매처와 직접 계약하여 안전하게 공급합니다.</p>
            </div>
          </div>
        </section>

        <p className="text-sm text-muted-foreground mt-8">
          탈모학교와 함께 건강한 두피 관리를 시작해 보세요.
        </p>
      </div>
    </Layout>
  );
}
