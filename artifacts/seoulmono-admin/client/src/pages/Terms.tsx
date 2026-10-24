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
            이 약관은 탈모학교가 운영하는 웹사이트에서 제공하는 인터넷 관련 서비스(이하 "서비스"라 한다)의 이용과 관련하여
            이용자와 서비스 제공자 간의 권리, 의무 및 책임사항 등을 규정하는 것을 목적으로 합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第2条 (規約の効力および変更)</h2>
          <p className="text-muted-foreground leading-relaxed">
            서비스는 필요에 따라 약관을 변경할 수 있으며, 약관이 변경될 경우 수정 사항을 사이트에 공지합니다.
            수정된 약관은 공지일로부터 7일이 경과한 후에 효력을 발생합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第3条 (サービス利用契約の締結)</h2>
          <p className="text-muted-foreground leading-relaxed">
            서비스를 이용하기 위해서는 회원가입을 통해 이용약관에 동의해야 합니다.
            회원가입은 이용자가 약관의 내용을 이해하고 동의한 것으로 간주합니다.
            서비스는 관련 법령에 따라 회원가입을 거부하거나 제한할 수 있습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第4条 (サービスの提供および変更)</h2>
          <p className="text-muted-foreground leading-relaxed">
            서비스는 업무상, 기술적 또는 운영상의 이유로 제공하는 서비스의 내용을
            변경할 수 있으며, 변경 시 사전에 공지합니다.
            또한 시스템 점검, 변경 등의 이유로 서비스 제공을 일시적으로 중단할 수 있으며,
            이 경우 사전에 공지하되 긴급한 경우 사후 공지할 수 있습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第5条 (契約の解除)</h2>
          <p className="text-muted-foreground leading-relaxed">
            이용자가 약관을 위반하여 서비스의 정상적인 운영을 방해할 우려가 있는 경우,
            서비스는 적절한 기간을 정하여 시정을 요구할 수 있으며, 기간 내에 시정이 이루어지지 않으면
            이용자의 서비스 이용을 제한하거나 해지할 수 있습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">第6条 (紛争解決)</h2>
          <p className="text-muted-foreground leading-relaxed">
            이 약관에 대한 분쟁은 서울중앙지방법원을 제1심 관할법원으로 하며,
            대한민국 법률을 준거법으로 합니다.
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-12">
          최종 업데이트: 2025년 3월 15일
        </p>
      </div>
    </Layout>
  );
}
