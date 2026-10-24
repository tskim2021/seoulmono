import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";

export default function Privacy() {
  useSEO({
    title: "개인정보처리방침 - 탈모학교",
    description: "탈모학교 개인정보처리방침입니다.",
  });

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">제1조 (수집하는 개인정보의 항목 및 수집방법)</h2>
          <p className="text-muted-foreground leading-relaxed">
            서비스는 회원가입 및 거래 등을 위해 아래와 같은 개인정보를 수집합니다.
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>필수수집: 성명, 아이디, 비밀번호, 연락처, 주소</li>
            <li>선택수집: 생년월일, 관심상품, 최근방문일</li>
            <li>자동수집: 접속기록, IP주소, 쿠키</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">제2조 (개인정보 수집 목적)</h2>
          <p className="text-muted-foreground leading-relaxed">
            수집된 개인정보는 다음의 목적을 위해 사용됩니다.
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>회원 등록 및 서비스 제공</li>
            <li>상품 주문 및 배송 처리</li>
            <li>포인트 적립 및 사용 관리</li>
            <li>이벤트 정보 안내</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">제3조 (개인정보의 제3자 제공)</h2>
          <p className="text-muted-foreground leading-relaxed">
            서비스는 원칙적으로 사용자의 동의 없이 제3자에게 개인정보를 제공하지 않습니다.
            다만, 배송업체 등 서비스 제공을 위해 필요한 경우에 한해 최소한의 범위에서
            제공할 수 있으며, 이 경우 사전에 고지합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">제4조 (개인정보의 수정 및 파기)</h2>
          <p className="text-muted-foreground leading-relaxed">
            사용자는 언제든지 자신의 개인정보에 대해 조회, 수정, 삭제를 요구할 수 있으며,
            서비스는 이에 대해 지체 없이 조치합니다.
            또한 회원 탈퇴 시 수집된 개인정보는 관련 법령에 따라 안전하게 파기합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">제5조 (정보보호책임자 및 연락처)</h2>
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
