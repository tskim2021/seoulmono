import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import {
  Mail, Palette, Image, FileText, Eye, Settings, RefreshCw,
  ShoppingBag, Star, AlertTriangle, Bell, ChevronRight,
  CheckCircle, Truck, UserPlus, XCircle, Timer,
} from "lucide-react";

type TemplateType = "generic" | "order_confirm" | "payment_confirm" | "shipping_start" | "review_request" | "customs_hold" | "welcome" | "auto_cancel" | "point_expire";

const TEMPLATE_DEFS: { type: TemplateType; label: string; icon: React.ElementType; desc: string; badge?: string }[] = [
  {
    type: "generic",
    label: "일반 알림",
    icon: Bell,
    desc: "범용 이메일 템플릿 (스타일 기준)",
  },
  {
    type: "order_confirm",
    label: "주문 접수 / 입금 안내",
    icon: ShoppingBag,
    desc: "가상계좌 주문 시 입금 계좌 안내",
    badge: "자동 발송",
  },
  {
    type: "payment_confirm",
    label: "입금 확인 완료",
    icon: CheckCircle,
    desc: "입금 확인 후 배송 시작 안내",
    badge: "자동 발송",
  },
  {
    type: "shipping_start",
    label: "배송 시작",
    icon: Truck,
    desc: "상품 발송 및 송장번호 안내",
    badge: "자동 발송",
  },
  {
    type: "review_request",
    label: "리뷰 요청",
    icon: Star,
    desc: "배송 완료 후 리뷰 작성 유도",
    badge: "자동 발송",
  },
  {
    type: "customs_hold",
    label: "통관검사 안내",
    icon: AlertTriangle,
    desc: "통관검사 대상 선정 시 반송 안내",
    badge: "자동 발송",
  },
  {
    type: "welcome",
    label: "회원가입 환영",
    icon: UserPlus,
    desc: "신규 회원가입 완료 시 환영 메일",
    badge: "자동 발송",
  },
  {
    type: "auto_cancel",
    label: "주문 자동 취소",
    icon: XCircle,
    desc: "입금 기한 만료 시 자동 취소 안내",
    badge: "자동 발송",
  },
  {
    type: "point_expire",
    label: "포인트 소멸 예정",
    icon: Timer,
    desc: "소멸 예정 포인트 안내",
    badge: "자동 발송",
  },
];

function TemplatePreviewPane({ type }: { type: TemplateType }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { data, isLoading, refetch } = trpc.admin.previewEmailTemplate.useQuery({ type });

  useEffect(() => {
    if (data?.html && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(data.html);
        doc.close();
      }
    }
  }, [data?.html]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">실제 발송되는 이메일 디자인을 미리 확인합니다. (샘플 데이터 기준)</p>
          {data?.subject && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">제목:</span>
              <code className="text-xs bg-secondary px-2 py-0.5 rounded">{data.subject}</code>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          새로고침
        </Button>
      </div>

      {isLoading ? (
        <div className="border rounded-xl h-[600px] flex items-center justify-center bg-secondary/20">
          <div className="text-sm text-muted-foreground animate-pulse">템플릿 로딩 중...</div>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-gray-50 shadow-inner">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 border-b">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-gray-500">이메일 미리보기</span>
          </div>
          <iframe
            ref={iframeRef}
            className="w-full"
            style={{ height: "640px", border: "none" }}
            title="이메일 미리보기"
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}

export default function AdminEmailTemplate() {
  const [activeTab, setActiveTab] = useState<"settings" | TemplateType>("settings");
  const { data: template } = trpc.admin.getEmailTemplate.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    logoUrl: "",
    primaryColor: "#3a2a2a",
    footerText: "",
    footerLinks: "[]",
  });

  useEffect(() => {
    if (template) {
      setForm({
        logoUrl: template.logoUrl || "",
        primaryColor: template.primaryColor || "#3a2a2a",
        footerText: template.footerText || "",
        footerLinks: template.footerLinks || "[]",
      });
    }
  }, [template]);

  const updateTemplate = trpc.admin.updateEmailTemplate.useMutation({
    onSuccess: () => {
      toast.success("이메일 템플릿이 저장되었습니다");
      utils.admin.getEmailTemplate.invalidate();
      utils.admin.previewEmailTemplate.invalidate();
    },
    onError: (error) => {
      toast.error(`저장 실패: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    try {
      JSON.parse(form.footerLinks);
    } catch {
      toast.error("푸터 링크 JSON 형식이 올바르지 않습니다");
      return;
    }
    updateTemplate.mutate(form);
  };

  const isTemplateTab = activeTab !== "settings";
  const currentTemplateDef = TEMPLATE_DEFS.find((t) => t.type === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6" />
          이메일 템플릿
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          발송되는 이메일의 디자인과 내용을 설정하고 미리 확인합니다
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b">
        <div className="flex gap-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "settings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="w-4 h-4" />
            템플릿 설정
          </button>

          <div className="flex items-center px-2 text-muted-foreground/30">
            <ChevronRight className="w-4 h-4" />
          </div>

          {TEMPLATE_DEFS.map((def) => {
            const Icon = def.icon;
            return (
              <button
                key={def.type}
                onClick={() => setActiveTab(def.type)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === def.type
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {def.label}
                {def.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {def.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 설정 탭 */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Image className="w-4 h-4" />
                로고 URL
              </Label>
              <Input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://talmoschool.com/shop/logo.png"
              />
              <p className="text-xs text-muted-foreground mt-1">
                이메일 헤더에 표시될 로고 이미지 URL (비워두면 기본 로고 사용)
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4" />
                주요 색상
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  placeholder="#3a2a2a"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                버튼 및 강조 색상 (Hex 코드). 일반 알림, 주문 접수 이메일에 적용됩니다.
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                푸터 텍스트
              </Label>
              <Input
                value={form.footerText}
                onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                placeholder="탈모학교 - 커뮤니티 이커머스 플랫폼"
              />
              <p className="text-xs text-muted-foreground mt-1">
                이메일 하단에 표시될 텍스트
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                푸터 링크 (JSON)
              </Label>
              <Textarea
                value={form.footerLinks}
                onChange={(e) => setForm({ ...form, footerLinks: e.target.value })}
                placeholder='[{"text":"이용약관","url":"/terms"},{"text":"개인정보처리방침","url":"/privacy"}]'
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                푸터에 표시될 링크 목록 (JSON 배열 형식)
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={updateTemplate.isPending}>
                {updateTemplate.isPending ? "저장 중..." : "저장하기"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  template &&
                  setForm({
                    logoUrl: template.logoUrl || "",
                    primaryColor: template.primaryColor || "#3a2a2a",
                    footerText: template.footerText || "",
                    footerLinks: template.footerLinks || "[]",
                  })
                }
              >
                초기화
              </Button>
            </div>
          </Card>

          {/* 템플릿 목록 안내 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              이메일 템플릿 목록
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              위 탭을 클릭하면 각 이메일을 실제 샘플 데이터로 미리 확인할 수 있습니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATE_DEFS.map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.type}
                    onClick={() => setActiveTab(def.type)}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-secondary/40 transition-colors text-left group"
                  >
                    <div className="mt-0.5 w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{def.label}</span>
                        {def.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {def.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{def.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* 미리보기 탭들 */}
      {isTemplateTab && currentTemplateDef && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <currentTemplateDef.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{currentTemplateDef.label}</h3>
              <p className="text-sm text-muted-foreground">{currentTemplateDef.desc}</p>
            </div>
            {currentTemplateDef.badge && (
              <Badge variant="outline" className="ml-auto">
                {currentTemplateDef.badge}
              </Badge>
            )}
          </div>

          <TemplatePreviewPane type={activeTab as TemplateType} />

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              * 템플릿 디자인(로고·색상·푸터)은 <strong>템플릿 설정</strong> 탭에서 변경하세요
            </p>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("settings")} className="gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              설정으로
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
