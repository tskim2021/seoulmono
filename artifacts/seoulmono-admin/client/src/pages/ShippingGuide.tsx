import Layout from "@/components/Layout";
import { useSEO } from "@/hooks/useSEO";
import {
  Truck, Clock, Globe, Package, CheckCircle, Shield, AlertTriangle,
  Search, ArrowRight, RefreshCw, Info, Wallet, Receipt,
  Plane, FileText, ChevronRight, Boxes, Star
} from "lucide-react";

export default function ShippingGuide() {
  useSEO({
    title: "配送のご案内 - ソウルモノ",
    description: "ソウルモノの海外直送に関する配送のご案内です。EMS送料無料、通関、配送追跡などをご確認ください。",
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
          <h1 className="text-3xl font-bold mb-2">配送のご案内</h1>
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
            <h2 className="text-xl font-bold">海外直送のご案内</h2>
          </div>
          <div className="bg-muted/30 rounded-xl p-6 space-y-3 text-muted-foreground">
            <div className="flex items-start gap-3">
              <Plane className="w-4 h-4 text-primary mt-1 shrink-0" />
              <p><span className="font-semibold text-foreground">EMS国際スピード郵便で配送</span> — 모든 상품은 EMS(국제특급우편)를 통해 인도에서 직접 발송됩니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
              <p><span className="font-semibold text-foreground">正規品保証</span> — 인도 공식 판매처와 직접 계약하여 정품만을 취급합니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="w-4 h-4 text-primary mt-1 shrink-0" />
              <p><span className="font-semibold text-foreground">通関費用込み</span> — 상품 가격에 관세 및 부가세가 포함되어 있어, 통관 시 추가 비용이 없습니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <Receipt className="w-4 h-4 text-primary mt-1 shrink-0" />
              <p><span className="font-semibold text-foreground">送料無料</span> — 모든 주문에 대해 배송비가 발생하지 않습니다.</p>
            </div>
          </div>
        </section>

        {/* 배송 기간 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">配送期間</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 border-b border-border/40 pb-3">
              <div className="w-32 shrink-0 font-semibold text-foreground">国際配送</div>
              <p>営業日基準で <span className="font-bold text-foreground">10〜14日</span> 소요</p>
            </div>
            <div className="flex items-center gap-3 border-b border-border/40 pb-3">
              <div className="w-32 shrink-0 font-semibold text-foreground">通関検査</div>
              <p>税関による追加検査がある場合、<span className="font-bold text-foreground">1〜3日</span> 추가 소요될 수 있습니다.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 shrink-0 font-semibold text-foreground">休業日</div>
              <p>発送国・到着国の祝日、税関の通関事情により遅延する場合があります。</p>
            </div>
          </div>
          <InfoCard icon={Info} title="配送遅延のご案内" variant="warning">
            <p>航空輸送の状況、現地の祝日、税関の通関事情などにより、配送が遅れる場合があります。「通関検査待ち」の状態は通常の通関手続きです。</p>
          </InfoCard>
        </section>

        {/* 배송 비용 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">配送費用</h2>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-900/30 text-center">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">送料無料</p>
            <p className="text-sm text-muted-foreground">すべてのご注文で配送費用はかかりません。</p>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p>配送費用: 無料</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p>通関費用: 無料 (関税および消費税込み)</p>
            </div>
            <div className="flex items-start gap-2">
              <Boxes className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p>ご購入金額が大きい場合は<span className="font-semibold text-foreground">分割配送</span>となることがあります。</p>
            </div>
          </div>
        </section>

        {/* 통관 안내 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">通関のご案内</h2>
          </div>
          <div className="space-y-4">
            <InfoCard icon={FileText} title="通関検査" variant="warning">
              <p>税関による追加検査がある場合、1〜3日追加でかかることがあります。</p>
              <p>通関検査の際に医師の処方箋を添付するとスムーズに通関できます。処方箋を再提出できない場合は、当社までご連絡ください。</p>
            </InfoCard>

            <InfoCard icon={RefreshCw} title="通関失敗および再発送" variant="default">
              <p>通関検査待ちの状態が長期間続く場合は、通関失敗と判断し<span className="font-semibold text-foreground">ただちに再発送</span>しています。</p>
              <p>処方箋を再提出できない場合は、当社へご連絡いただければ、ただちに再発送の手続きをいたします。</p>
            </InfoCard>

            <InfoCard icon={AlertTriangle} title="通関検査待ちの状態について" variant="warning">
              <p>通関検査待ちは、税関による通常の検査手続きです。カスタマーセンターへお問い合わせいただければ、進捗状況をご確認いたします。</p>
            </InfoCard>
          </div>
        </section>

        {/* 배송 추적 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">配送追跡</h2>
          </div>
          <div className="bg-muted/30 rounded-xl p-6 space-y-2 text-muted-foreground">
            <div className="flex items-start gap-2">
              <Search className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>ご注文の商品は、マイページでリアルタイムの配送追跡ができます。</p>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>国際配送は、EMS追跡システムと連携して提供しています。</p>
            </div>
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>配送状況が変更されると、メールで通知を受け取れます。</p>
            </div>
          </div>
        </section>

        {/* 주문 및 배송 절차 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">ご注文から配送までの流れ</h2>
          </div>
          <div className="pl-1">
            <Step num={1} title="商品の注文・決済完了" desc="원하시는 상품을 선택하고 결제를 완료합니다." icon={Package} />
            <Step num={2} title="注文確認・海外発送の準備" desc="인도 공식 판매처에서 상품을 준비하고 발송합니다." icon={Globe} />
            <Step num={3} title="EMS国際配送の開始" desc="EMS 국제특급으로 상품이 발송됩니다." icon={Plane} />
            <Step num={4} title="通関・国内配送" desc="세관 통관 후 국내 배송이 시작됩니다." icon={Shield} />
            <Step num={5} title="配送完了・購入確定" desc="상품 수령 후 구매 확정 및 리뷰 작성이 가능합니다." icon={CheckCircle} />
          </div>
        </section>

        {/* 자주 묻는 질문 */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">よくあるご質問</h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 배송이 지연되는 이유는 무엇인가요?
              </p>
              <p className="text-sm">海外直送の商品は、通関検査、航空輸送の状況、現地の祝日、税関の通関事情などにより遅れる場合があります。「通関検査待ち」の状態は通常の通関手続きです。</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 배송 추적은 어디서 하나요?
              </p>
              <p className="text-sm">マイページ &gt; 注文履歴で、リアルタイムの配送状況をご確認いただけます。EMS国際スピード郵便の追跡システムと連携して提供しています。</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 통관 시 추가 비용이 발생하나요?
              </p>
              <p className="text-sm">いいえ。ソウルモノの商品価格には関税および消費税が含まれているため、通関時の追加費用は発生しません。</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 통관 실패 시 어떻게 하나요?
              </p>
              <p className="text-sm">通関検査待ちの状態が長期間続く場合は、通関失敗と判断し、ただちに再発送します。処方箋を再提出できない場合は、カスタマーセンターへご連絡ください。</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-5">
              <p className="font-medium text-foreground mb-1 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary" />Q. 분할 배송은 어떤 경우에 되나요?
              </p>
              <p className="text-sm">ご購入金額が大きい場合や、商品の重量・容積が大きい場合、安全な配送のため分割配送となることがあります。追加費用はかかりません。</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
