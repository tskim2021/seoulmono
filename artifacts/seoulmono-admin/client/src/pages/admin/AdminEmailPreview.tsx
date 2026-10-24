import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, Loader2, Mail, Monitor, Smartphone } from "lucide-react";

type Device = "pc" | "mobile";
type View = "html" | "text";

const GROUPS = [
  { id: "customer", title: "고객에게 가는 메일" },
  { id: "admin", title: "운영자(나)에게 오는 알림" },
] as const;

export default function AdminEmailPreview() {
  const { data, isLoading, error, refetch } = trpc.emailPreview.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [variantKey, setVariantKey] = useState<string | null>(null);
  const [view, setView] = useState<View>("html");
  const [device, setDevice] = useState<Device>("pc");
  const [frameHeight, setFrameHeight] = useState(640);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const templates = data?.templates ?? [];
  const selected = templates.find((t) => t.key === selectedKey) ?? templates[0];
  const variant = selected ? (selected.variants.find((v) => v.key === variantKey) ?? selected.variants[0]) : undefined;

  const measure = () => {
    try {
      const body = iframeRef.current?.contentDocument?.body;
      if (body) setFrameHeight(Math.max(360, Math.ceil(body.offsetHeight) + 8));
    } catch {
      /* 높이를 못 읽으면 기본 높이 유지 */
    }
  };

  // 화면 폭(PC/모바일)이나 메일이 바뀌면 줄바꿈이 달라지므로 높이를 다시 잰다.
  useEffect(() => {
    if (view !== "html") return;
    const id = window.setTimeout(measure, 80);
    return () => window.clearTimeout(id);
  }, [variant?.html, device, view]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6" />
          이메일 미리보기
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          쇼핑몰이 고객·운영자에게 실제로 보내는 메일을 샘플 데이터로 보여줍니다.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/40 p-3 text-sm flex gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <div>
            화면의 이름·주소·금액은 모두 <strong>가짜 샘플</strong>이며, 이 화면에서는 <strong>어떤 메일도 발송되지 않습니다.</strong>
          </div>
          <div className="text-muted-foreground">
            실제 발송과 같은 코드로 만들기 때문에, 메일의 디자인이나 문구가 바뀌면 이 화면에도 그대로 반영됩니다.
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중...
        </div>
      )}

      {error && (
        <Card className="p-6 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <div className="text-sm">{error.message}</div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            다시 시도
          </Button>
        </Card>
      )}

      {data && selected && variant && (
        <>
          <div className="text-xs text-muted-foreground">
            보내는 사람: <span className="text-foreground">{`${data.sender.fromName} <${data.sender.fromAddress}>`}</span>
            <span className="mx-2">·</span>
            고객이 '답장'하면: <span className="text-foreground">{data.sender.replyTo}</span>
            <span className="mx-2">·</span>
            운영자 알림 수신: <span className="text-foreground">{data.sender.adminTo}</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* 왼쪽: 메일 목록 */}
            <div className="space-y-5">
              {GROUPS.map((g) => {
                const items = templates.filter((t) => t.group === g.id);
                return (
                  <div key={g.id} className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">
                      {g.title} ({items.length})
                    </div>
                    {items.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setSelectedKey(t.key);
                          setVariantKey(null);
                        }}
                        className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                          t.key === selected.key ? "border-primary bg-primary/5" : "hover:bg-muted/60"
                        }`}
                      >
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.when}</div>
                      </button>
                    ))}
                  </div>
                );
              })}

              {data.planned.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">아직 없는 메일 ({data.planned.length})</div>
                  {data.planned.map((p) => (
                    <div key={p.name} className="rounded-lg border border-dashed px-3 py-2.5">
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 오른쪽: 선택한 메일 */}
            <Card className="p-5 space-y-4 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{selected.name}</h3>
                <span className="text-xs rounded-full border px-2 py-0.5 text-muted-foreground">
                  {selected.group === "customer" ? "고객용" : "운영자용"}
                </span>
              </div>

              <dl className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">언제 가나요</dt>
                <dd>{selected.when}</dd>
                <dt className="text-muted-foreground">받는 사람</dt>
                <dd>{selected.to}</dd>
                <dt className="text-muted-foreground">메일 제목</dt>
                <dd className="font-semibold break-words">{variant.subject}</dd>
                <dt className="text-muted-foreground">참고</dt>
                <dd className="text-muted-foreground">{selected.note}</dd>
              </dl>

              <div className="flex flex-wrap items-center gap-2">
                {selected.variants.length > 1 &&
                  selected.variants.map((v) => (
                    <Button
                      key={v.key}
                      size="sm"
                      variant={v.key === variant.key ? "default" : "outline"}
                      onClick={() => setVariantKey(v.key)}
                    >
                      {v.label}
                    </Button>
                  ))}
                <div className="ml-auto flex flex-wrap gap-1">
                  <Button size="sm" variant={view === "html" ? "default" : "outline"} onClick={() => setView("html")}>
                    화면
                  </Button>
                  <Button size="sm" variant={view === "text" ? "default" : "outline"} onClick={() => setView("text")}>
                    텍스트 버전
                  </Button>
                  {view === "html" && (
                    <>
                      <Button
                        size="sm"
                        variant={device === "pc" ? "default" : "outline"}
                        onClick={() => setDevice("pc")}
                        className="gap-1"
                      >
                        <Monitor className="w-3.5 h-3.5" /> PC
                      </Button>
                      <Button
                        size="sm"
                        variant={device === "mobile" ? "default" : "outline"}
                        onClick={() => setDevice("mobile")}
                        className="gap-1"
                      >
                        <Smartphone className="w-3.5 h-3.5" /> 모바일
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {view === "html" ? (
                <div className="rounded-lg border bg-[#e9ebee] p-3 sm:p-4 overflow-x-auto">
                  <iframe
                    ref={iframeRef}
                    key={`${selected.key}-${variant.key}`}
                    title={`${selected.name} 미리보기`}
                    srcDoc={variant.html}
                    sandbox="allow-same-origin"
                    onLoad={measure}
                    style={{
                      display: "block",
                      margin: "0 auto",
                      width: device === "mobile" ? 375 : "100%",
                      maxWidth: "100%",
                      height: frameHeight,
                      border: 0,
                      background: "#fff",
                      borderRadius: device === "mobile" ? 18 : 8,
                      boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    HTML을 표시하지 못하는 메일 프로그램에서는 이 글만 보입니다. 모든 메일에 함께 들어 있습니다.
                  </div>
                  <pre className="rounded-lg border bg-muted/40 p-4 text-[13px] leading-relaxed whitespace-pre-wrap break-words font-mono max-h-[640px] overflow-auto">
                    {variant.text}
                  </pre>
                </div>
              )}
            </Card>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-4">
            위 메일은 서버에 설정된 {data.sender.adminTo} 계정으로 발송됩니다.
          </div>
        </>
      )}
    </div>
  );
}
