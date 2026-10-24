import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";

export default function Terms() {
  useSEO({
    title: "利用規約 - ソウルモノ",
    description: "ソウルモノの利用規約です。",
  });

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">利用規約</h1>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第1条 (目的)</h2>
          <p className="text-muted-foreground leading-relaxed">
            本規約は、ソウルモノが運営するウェブサイトで提供するインターネット関連サービス（以下「本サービス」といいます）の利用に関して、
            利用者とサービス提供者との間の権利、義務および責任事項等を定めることを目的とします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第2条 (規約の効力および変更)</h2>
          <p className="text-muted-foreground leading-relaxed">
            本サービスは、必要に応じて規約を変更することができ、変更した場合は修正内容をサイト上で告知します。
            変更後の規約は、告知日から7日を経過した後に効力を生じます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第3条 (サービス利用契約の締結)</h2>
          <p className="text-muted-foreground leading-relaxed">
            本サービスを利用するには、会員登録を行い、利用規約に同意する必要があります。
            会員登録をもって、利用者は規約の内容を理解し同意したものとみなします。
            本サービスは、関連法令に従い、会員登録を拒否または制限することができます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第4条 (サービスの提供および変更)</h2>
          <p className="text-muted-foreground leading-relaxed">
            本サービスは、業務上、技術上または運営上の理由により、提供するサービスの内容を
            変更することができ、変更の際は事前に告知します。
            また、システム点検・変更等の理由により、サービスの提供を一時的に中断することができ、
            この場合は事前に告知しますが、緊急の場合は事後に告知することがあります。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第5条 (契約の解除)</h2>
          <p className="text-muted-foreground leading-relaxed">
            利用者が規約に違反し、本サービスの正常な運営を妨げるおそれがある場合、
            本サービスは適切な期間を定めて是正を求めることができ、期間内に是正されないときは
            利用者のサービス利用を制限または解除することができます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第6条 (紛争解決)</h2>
          <p className="text-muted-foreground leading-relaxed">
            本規約に関する紛争は、ソウル中央地方裁判所を第一審の専属管轄裁判所とし、
            大韓民国の法律を準拠法とします。
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-12">
          最終更新: 2025年3月15日
        </p>
      </div>
    </Layout>
  );
}
