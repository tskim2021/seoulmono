import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  RefreshCw, Save, CheckCircle2, AlertCircle, Loader2,
  Package, Users, ShoppingBag, Clock, Link2, ExternalLink,
  Download, Upload, Settings2
} from "lucide-react";

function TimeAgo({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-muted-foreground text-xs">없음</span>;
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  let label = "";
  if (diff < 60) label = `${diff}초 전`;
  else if (diff < 3600) label = `${Math.floor(diff / 60)}분 전`;
  else if (diff < 86400) label = `${Math.floor(diff / 3600)}시간 전`;
  else label = `${Math.floor(diff / 86400)}일 전`;
  return <span className="text-xs text-muted-foreground" title={d.toLocaleString("ko-KR")}>{label} ({d.toLocaleString("ko-KR")})</span>;
}

export default function AdminGnuApiSync() {
  const { data: cfg, isLoading: cfgLoading, refetch: refetchCfg } = trpc.admin.getGnuApiConfig.useQuery();
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = trpc.admin.getGnuApiSyncStatus.useQuery();

  const saveMut = trpc.admin.saveGnuApiConfig.useMutation({
    onSuccess: () => { toast.success("설정이 저장되었습니다."); refetchCfg(); refetchStatus(); },
    onError: (e) => toast.error(e.message),
  });
  const syncOrdersMut = trpc.admin.syncGnuApiOrders.useMutation({
    onSuccess: (d) => { toast.success(`주문 동기화 완료 — 신규 ${d.synced}건, 업데이트 ${d.updated}건`); refetchStatus(); },
    onError: (e) => toast.error(`주문 동기화 실패: ${e.message}`),
  });
  const syncProductsMut = trpc.admin.syncGnuApiProducts.useMutation({
    onSuccess: (d) => { toast.success(`상품 동기화 완료 — 카테고리 ${d.categories}개, 상품 ${d.products}개`); refetchStatus(); },
    onError: (e) => toast.error(`상품 동기화 실패: ${e.message}`),
  });
  const syncMembersMut = trpc.admin.syncGnuApiMembers.useMutation({
    onSuccess: (d) => { toast.success(`회원 동기화 완료 — 신규 ${d.synced}명`); refetchStatus(); },
    onError: (e) => toast.error(`회원 동기화 실패: ${e.message}`),
  });

  const [form, setForm] = useState({ baseUrl: "", token: "", enabled: false });

  useEffect(() => {
    if (cfg) setForm({ baseUrl: cfg.baseUrl, token: cfg.token, enabled: cfg.enabled });
  }, [cfg]);

  const isConfigured = !!form.baseUrl && !!form.token;
  const anyLoading = syncOrdersMut.isPending || syncProductsMut.isPending || syncMembersMut.isPending;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">탈모1 API 연동 설정</h1>

      {/* 안내 배너 */}
      <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">탈모1(그누보드) ↔ 탈모2 API 연동 방식</p>
            <p className="text-blue-700 dark:text-blue-400 mb-2">
              MySQL 직접 연결 없이 PHP API 파일을 통해 주문·상품·회원을 동기화합니다.
              배송 처리 시 탈모1 그누보드에도 자동으로 역반영됩니다.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>아래에서 PHP 파일 4개를 다운로드</li>
              <li>탈모1 서버의 <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/page/</code> 디렉토리에 업로드</li>
              <li>탈모1 PHP 환경변수에 <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">TALMO2_API_TOKEN</code> 설정</li>
              <li>아래 API URL과 동일 토큰을 입력 후 저장</li>
            </ol>
          </div>
        </div>
      </div>

      {/* PHP 파일 다운로드 안내 */}
      <div className="bg-card border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">탈모1에 올릴 PHP 파일</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          아래 4개 파일을 탈모1 서버 <strong>/page/</strong> 디렉토리에 업로드하세요.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { name: "talmo2_orders.php", desc: "주문 목록 제공 API" },
            { name: "talmo2_products.php", desc: "상품·카테고리 제공 API" },
            { name: "talmo2_members.php", desc: "회원 정보 제공 API" },
            { name: "talmo2_update_shipment.php", desc: "배송 역반영 수신 API" },
          ].map(f => (
            <div key={f.name} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">PHP</div>
              <div>
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          ※ 파일 위치: 프로젝트 내 <code className="bg-muted px-1 rounded">artifacts/shop/gnuboard-api-files/</code>
        </p>
      </div>

      {/* API 설정 */}
      <div className="bg-card border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">API 연동 설정</h2>
        </div>

        {!isConfigured && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">API URL과 토큰을 설정해야 동기화를 사용할 수 있습니다.</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">탈모1 API 기본 URL</label>
            <Input
              placeholder="https://talmoschool.com/page"
              value={form.baseUrl}
              onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">PHP 파일들이 있는 디렉토리 URL (끝 / 제외)</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">API 토큰 (비밀 키)</label>
            <Input
              type="password"
              placeholder="PHP 파일의 TALMO2_API_TOKEN과 동일한 값"
              value={form.token}
              onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">영문·숫자 32자 이상의 무작위 문자열 권장</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
            />
            자동 폴링 동기화 활성화 (배송 처리 시 탈모1에 자동 역반영)
          </label>
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            설정 저장
          </Button>
          {isConfigured && (
            <Button size="sm" variant="outline" asChild>
              <a href={`${form.baseUrl}/talmo2_orders.php?token=${form.token}&limit=1`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                연결 테스트
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* 동기화 현황 */}
      <div className="bg-card border rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold">동기화 현황</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetchStatus()} disabled={statusLoading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${statusLoading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { icon: Package, label: "주문 마지막 동기화", val: status?.lastOrderSync ?? null },
            { icon: ShoppingBag, label: "상품 마지막 동기화", val: status?.lastProductSync ?? null },
            { icon: Users, label: "회원 마지막 동기화", val: status?.lastMemberSync ?? null },
          ].map(item => (
            <div key={item.label} className="p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <TimeAgo iso={item.val} />
            </div>
          ))}
        </div>

        {status?.enabled && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            자동 동기화 활성화됨 — 배송 처리 시 탈모1에 자동 반영
          </div>
        )}
      </div>

      {/* 수동 동기화 */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">수동 동기화</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          설정 저장 후 수동으로 즉시 동기화할 수 있습니다. 주문은 마지막 동기화 이후 변경분만 가져옵니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncOrdersMut.mutate()}
            disabled={!isConfigured || anyLoading}
          >
            {syncOrdersMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Package className="w-4 h-4 mr-1" />}
            주문 동기화
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncProductsMut.mutate()}
            disabled={!isConfigured || anyLoading}
          >
            {syncProductsMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShoppingBag className="w-4 h-4 mr-1" />}
            상품 동기화
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncMembersMut.mutate()}
            disabled={!isConfigured || anyLoading}
          >
            {syncMembersMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Users className="w-4 h-4 mr-1" />}
            회원 동기화
          </Button>
        </div>

        {anyLoading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            동기화 진행 중... (데이터 양에 따라 수 분 소요될 수 있습니다)
          </div>
        )}
      </div>
    </div>
  );
}
