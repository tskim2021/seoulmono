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
            ソウルモノは2025年より、薄毛にお悩みの方に正規品の育毛・ヘアケア製品をお手頃な価格でお届けする海外直送サービスです。
            インド、シンガポールなど海外の正規品を直接輸入し、最安値で提供しています。
            購入金額の3%をポイント還元し、レビュー投稿で最大1,500ポイントを進呈しています。
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
          ソウルモノで健やかな頭皮ケアを始めましょう。
        </p>
      </div>
    </Layout>
  );
}
