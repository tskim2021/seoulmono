import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";
import {
  Truck, Clock, Globe, Package, CheckCircle, Shield, AlertTriangle,
  Search, ArrowRight, RefreshCw, Info, Wallet, Receipt,
  Plane, FileText, ChevronRight, Boxes, Star
} from "lucide-react";

export default function ShippingGuide() {
  useSEO({
    title: "배송안내 - 탈모학교",
    description: "탈모학교 해외직구 배송안내입니다. EMS 무료배송, 통관, 배송추적 등을 확인하세요.",
  });

  const Step = ({ num, title, desc, icon: Icon }: { num: number; title: string; desc: string; icon: any }) => (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {num < 5 && <div className="w-px h-6 bg-primary/20" />}
      </div>
      <div className="pb-6">
        <p className="font-bold text-foreground">{num}. {title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );

  const InfoCard = ({ icon: Icon, title, children, variant = "default" }: { icon: any; title: string; children: React.ReactNode; variant?: "default" | "warning" | "success" }) => {
    const bgClass = variant === "warning" ? "bg-amber-50/50 dark:bg-amber-950/10" : variant === "success" ? "bg-emerald-50/50 dark:bg-emerald-950/10" : "bg-muted/30";
    const borderClass = variant === "warning" ? "border-amber-200/50 dark:border-amber-900/30" : variant === "success" ? "border-emerald-200/50 dark:border-emerald-900/30" : "border-border/40";
    return (
      <div className={`rounded-xl p-5 space-y-2 text-muted-foreground border ${bgClass} ${borderClass}`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-4 h-4 ${variant === "warning" ? "text-amber-600" : variant === "success" ? "text-emerald-600" : "text-primary"}`} />
          <span className="font-semibold text-foreground text-sm">{title}</span>
        </div>
        {children}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">배송안내</h1>
          <p className="text-muted-foreground">
            탈모학교는 인도에서 직접 수입한 상품을 EMS 국제특급으로 안전하게 배송합니다.
          </p>
        </div>

        {/* 해외직구 개요 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">해외직구 안내</h2>
          </div>
          <div className="bg-muted/30 rounded-xl p-6 space-y-3 text-muted-foreground">
            <div className="flex items-start gap-3">
              <Plane className="w-4 h-4 text-primary mt-1 shrink-0" />
              <p><span className="font-semibold text-foreground">EMS 국제특급 배송</span> — 모든 상품은 EMS(국제특급우편)를 통해 인도에서 직접 발송됩니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
              <p><span className="font-semibold text-foreground">정품 보장</span> — 인도 공식 판매처와 직접 계약하여 정품만을 취급합니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="w-4 h-4 text-primary mt-1 shrink-0" />
              <p><span className="font-semibold text-foreground">통관 비용 포함</span> — 상품 가격에 관세 및 부가세가 포함되어 있어, 통관 시 추가 비용이 없습니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <Receipt className="w-4 h-4 text-primary mt-1 shrink-0" />
              <p><span className="font-semibold text-foreground">무료 배송</span> — 모든 주문에 대해 배송비가 발생하지 않습니다.</p>
            </div>
          </div>
        </section>

        {/* 배송 기간 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">배송 기간</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 border-b border-border/40 pb-3">
              <div className="w-32 shrink-0 font-semibold text-foreground">국제배송</div>
              <p>영업일 기준 <span className="font-bold text-foreground">10~14일</span> 소요</p>
            </div>
            <div className="flex items-center gap-3 border-b border-border/40 pb-3">
              <div className="w-32 shrink-0 font-semibold text-foreground">통관 검사</div>
              <p>세관 추가 검사가 있을 경우 <span className="font-bold text-foreground">1~3일</span> 추가 소요될 수 있습니다.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 shrink-0 font-semibold text-foreground">휴무일</div>
              <p>출발국과 도착국의 공휴일, 세관 통관 사정에 따라 지연될 수 있습니다.</p>
            </div>
          </div>
          <InfoCard icon={Info} title="배송 지연 안내" variant="warning">
            <p>항공 운송 상황, 현지 공휴일, 세관 통관 사정 등으로 인해 배송이 지연될 수 있습니다. 통관검사대기 상태는 정상적인 통관 절차입니다.</p>
          </InfoCard>
        </section>

        {/* 배송 비용 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">배송 비용</h2>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-900/30 text-center">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">무료 배송</p>
            <p className="text-sm text-muted-foreground">모든 주문에 대해 배송비용이 발생하지 않습니다.</p>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p>배송비용: 무료</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p>통관 비용: 무료 (관세 및 부가세 포함)</p>
            </div>
            <div className="flex items-start gap-2">
              <Boxes className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p>구매금액이 많은 경우 <span className="font-semibold text-foreground">분할 배송</span>될 수 있습니다.</p>
            </div>
          </div>
        </section>

        {/* 통관 안내 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">통관 안내</h2>
          </div>
          <div className="space-y-4">
            <InfoCard icon={FileText} title="통관 검사" variant="warning">
              <p>세관 추가 검사가 있을 경우 1~3일 추가 소요될 수 있습니다.</p>
              <p>통관검사시 의사 처방전을 첨부하면 통관이 용이되며, 처방전 재출이 불가능한 경우 당사로 연락해 주세요.</p>
            </InfoCard>

            <InfoCard icon={RefreshCw} title="통관 실패 및 재발송" variant="default">
              <p>통관검사 대기 상태가 장기간 지속되는 경우, 통관 실패로 판단하여 <span className="font-semibold text-foreground">즉시 재발송</span>하고 있습니다.</p>
              <p>처방전을 재출할 수 없을 경우 당사로 연락하시면 즉시 재발송 처리해 드립니다.</p>
            </InfoCard>

            <InfoCard icon={AlertTriangle} title="통관검사대기 상태 안내" variant="warning">
              <p>통관검사대기 상태는 세관의 정상적인 검사 절차입니다. 고객센터로 문의하시면 진행 상황을 확인해 드립니다.</p>
            </InfoCard>
          </div>
        </section>

        {/* 배송 추적 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">배송 추적</h2>
          </div>
          <div className="bg-muted/30 rounded-xl p-6 space-y-2 text-muted-foreground">
            <div className="flex items-start gap-2">
              <Search className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>주문하신 상품은 마이페이지에서 실시간 배송 추적이 가능합니다.</p>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>국제 배송은 EMS 추적 시스템을 연동하여 제공합니다.</p>
            </div>
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>배송 상태 변경 시 이메일로 알림을 받아보실 수 있습니다.</p>
            </div>
          </div>
        </section>

        {/* 주문 및 배송 절차 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">주문 및 배송 절차</h2>
          </div>
          <div className="pl-1">
            <Step num={1} title="상품 주문 및 결제 완료" desc="원하시는 상품을 선택하고 결제를 완료합니다." icon={Package} />
            <Step num={2} title="주문 확인 및 해외 발송 준비" desc="인도 공식 판매처에서 상품을 준비하고 발송합니다." icon={Globe} />
            <Step num={3} title="EMS 국제 배송 시작" desc="EMS 국제특급으로 상품이 발송됩니다." icon={Plane} />
            <Step num={4} title="통관 및 국내 배송" desc="세관 통관 후 국내 배송이 시작됩니다." icon={Shield} />
            <Step num={5} title="배송 완료 및 구매 확정" desc="상품 수령 후 구매 확정 및 리뷰 작성이 가능합니다." icon={CheckCircle} />
          </div>
        </section>

        {/* 자주 묻는 질문 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">자주 묻는 질문</h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 배송이 지연되는 이유는 무엇인가요?
              </p>
              <p className="text-sm">해외직구 상품은 통관 검사, 항공 운송 상황, 현지 공휴일, 세관 통관 사정 등으로 인해 지연될 수 있습니다. 통관검사대기 상태는 정상적인 통관 절차입니다.</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 배송 추적은 어디서 하나요?
              </p>
              <p className="text-sm">마이페이지 &gt; 주문내역에서 실시간 배송 상태를 확인하실 수 있습니다. EMS 국제특급 추적 시스템을 연동하여 제공합니다.</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 통관 시 추가 비용이 발생하나요?
              </p>
              <p className="text-sm">아닙니다. 탈모학교의 상품 가격에는 관세 및 부가세가 포함되어 있어, 통관 시 추가 비용은 발생하지 않습니다.</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 통관 실패 시 어떻게 하나요?
              </p>
              <p className="text-sm">통관검사 대기 상태가 장기간 지속되는 경우, 통관 실패로 판단하여 즉시 재발송합니다. 처방전 재출이 불가능한 경우 고객센터로 연락해 주세요.</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 분할 배송은 어떤 경우에 되나요?
              </p>
              <p className="text-sm">구매금액이 많거나 상품의 무게/부피가 큰 경우, 안전한 배송을 위해 분할 배송될 수 있습니다. 추가 비용은 없습니다.</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
