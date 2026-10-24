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
            서비스는 회원가입 및 거래 등을 위해 아래와 같은 개인정보를 수집합니다.
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
            수집된 개인정보는 다음의 목적을 위해 사용됩니다.
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
            서비스는 원칙적으로 사용자의 동의 없이 제3자에게 개인정보를 제공하지 않습니다.
            다만, 배송업체 등 서비스 제공을 위해 필요한 경우에 한해 최소한의 범위에서
            제공할 수 있으며, 이 경우 사전에 고지합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第4条 (個人情報の訂正および破棄)</h2>
          <p className="text-muted-foreground leading-relaxed">
            사용자는 언제든지 자신의 개인정보에 대해 조회, 수정, 삭제를 요구할 수 있으며,
            서비스는 이에 대해 지체 없이 조치합니다.
            또한 회원 탈퇴 시 수집된 개인정보는 관련 법령에 따라 안전하게 파기합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第5条 (個人情報保護責任者および連絡先)</h2>
          <p className="text-muted-foreground leading-relaxed">
            개인정보보호책임자: 탈모학교 운영팀<br />
            연락처: hlschool.cs@gmail.com
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-12">
          최종 수정: 2025년 3월 15일
        </p>
      </div>
    </Layout>
  );
}
