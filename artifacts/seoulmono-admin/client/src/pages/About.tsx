import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";
import { Building2, Users, Globe, Heart, Award, MapPin } from "lucide-react";

export default function About() {
  useSEO({
    title: "会社概要 - ソウルモノ",
    description: "ソウルモノは、薄毛にお悩みの方に正規品の育毛・ヘアケア製品をお手頃な価格でお届けする海外直送サービスです。",
  });

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">会社概要</h1>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">ソウルモノのご紹介</h2>
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
            <h2 className="text-xl font-bold">運営理念</h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p>正規品保証 — すべての商品は公式輸入ルートで検証された正規品のみを取り扱います。</p>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p>お客様第一 — 1対1のお問い合わせと詳細な商品情報で、安心してお買い物いただけます。</p>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p>海外直送 — インド、シンガポールなど現地の公式販売元と直接契約し、安全にお届けします。</p>
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
