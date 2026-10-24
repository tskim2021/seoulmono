import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";

export default function Privacy() {
  useSEO({
    title: "プライバシーポリシー - ソウルモノ",
    description: "ソウルモノのプライバシーポリシーです。",
  });

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第1条 (収集する個人情報の項目および収集方法)</h2>
          <p className="text-muted-foreground leading-relaxed">
            当サービスは、会員登録および取引等のため、以下の個人情報を収集します。
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>必須項目: 氏名、ID、パスワード、連絡先、住所</li>
            <li>任意項目: 生年月日、関心商品、最終訪問日</li>
            <li>自動収集: アクセスログ、IPアドレス、Cookie</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第2条 (個人情報の収集目的)</h2>
          <p className="text-muted-foreground leading-relaxed">
            収集した個人情報は、以下の目的のために利用します。
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>会員登録およびサービスの提供</li>
            <li>商品の注文および配送処理</li>
            <li>ポイントの付与・利用の管理</li>
            <li>イベント情報のご案内</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第3条 (個人情報の第三者提供)</h2>
          <p className="text-muted-foreground leading-relaxed">
            当サービスは、原則として利用者の同意なく第三者に個人情報を提供しません。
            ただし、配送業者など、サービスの提供上必要な場合に限り、最小限の範囲で
            提供することがあり、その場合は事前にお知らせします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第4条 (個人情報の訂正および破棄)</h2>
          <p className="text-muted-foreground leading-relaxed">
            利用者はいつでもご自身の個人情報について、照会・訂正・削除を求めることができ、
            当サービスはこれに対して遅滞なく対応します。
            また、会員退会時には、収集した個人情報を関連法令に従い安全に破棄します。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第5条 (個人情報保護責任者および連絡先)</h2>
          <p className="text-muted-foreground leading-relaxed">
            個人情報保護責任者: ソウルモノ運営チーム<br />
            連絡先: hlschool.cs@gmail.com
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-12">
          最終更新: 2025年3月15日
        </p>
      </div>
    </Layout>
  );
}
