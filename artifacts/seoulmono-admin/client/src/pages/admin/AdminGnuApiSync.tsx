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
  if (!iso) return <span className="text-muted-foreground text-xs">なし</span>;
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  let label = "";
  if (diff < 60) label = `${diff}秒前`;
  else if (diff < 3600) label = `${Math.floor(diff / 60)}分前`;
  else if (diff < 86400) label = `${Math.floor(diff / 3600)}時間前`;
  else label = `${Math.floor(diff / 86400)}日前`;
  return <span className="text-xs text-muted-foreground" title={d.toLocaleString("ko-KR")}>{label} ({d.toLocaleString("ko-KR")})</span>;
}

export default function AdminGnuApiSync() {
  const { data: cfg, isLoading: cfgLoading, refetch: refetchCfg } = trpc.admin.getGnuApiConfig.useQuery();
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = trpc.admin.getGnuApiSyncStatus.useQuery();

  const saveMut = trpc.admin.saveGnuApiConfig.useMutation({
    onSuccess: () => { toast.success("設定を保存しました。"); refetchCfg(); refetchStatus(); },
    onError: (e) => toast.error(e.message),
  });
  const syncOrdersMut = trpc.admin.syncGnuApiOrders.useMutation({
    onSuccess: (d) => { toast.success(`注文の同期が完了しました — 新規 ${d.synced}件、更新 ${d.updated}件`); refetchStatus(); },
    onError: (e) => toast.error(`注文の同期に失敗しました: ${e.message}`),
  });
  const syncProductsMut = trpc.admin.syncGnuApiProducts.useMutation({
    onSuccess: (d) => { toast.success(`商品の同期が完了しました — カテゴリー ${d.categories}件、商品 ${d.products}件`); refetchStatus(); },
    onError: (e) => toast.error(`商品の同期に失敗しました: ${e.message}`),
  });
  const syncMembersMut = trpc.admin.syncGnuApiMembers.useMutation({
    onSuccess: (d) => { toast.success(`会員の同期が完了しました — 新規 ${d.synced}名`); refetchStatus(); },
    onError: (e) => toast.error(`会員の同期に失敗しました: ${e.message}`),
  });

  const [form, setForm] = useState({ baseUrl: "", token: "", enabled: false });

  useEffect(() => {
    if (cfg) setForm({ baseUrl: cfg.baseUrl, token: cfg.token, enabled: cfg.enabled });
  }, [cfg]);

  const isConfigured = !!form.baseUrl && !!form.token;
  const anyLoading = syncOrdersMut.isPending || syncProductsMut.isPending || syncMembersMut.isPending;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ショップ(グヌボード) API連携設定</h1>

      {/* 안내 배너 */}
      <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">ショップ(グヌボード) ↔ 管理画面 API連携方式</p>
            <p className="text-blue-700 dark:text-blue-400 mb-2">
              MySQLへ直接接続せず、PHP APIファイルを通じて注文・商品・会員を同期します。
              配送処理時には、ショップ(グヌボード)にも自動で逆反映されます。
            </p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>下からPHPファイル4つをダウンロード</li>
              <li>ショップサーバーの <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/page/</code> ディレクトリにアップロード</li>
              <li>ショップのPHP環境変数に <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">TALMO2_API_TOKEN</code> を設定</li>
              <li>下のAPI URLと同じトークンを入力して保存</li>
            </ol>
          </div>
        </div>
      </div>

      {/* PHP 파일 다운로드 안내 */}
      <div className="bg-card border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">ショップにアップロードするPHPファイル</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          下記4つのファイルをショップサーバーの <strong>/page/</strong> ディレクトリにアップロードしてください。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { name: "talmo2_orders.php", desc: "注文一覧提供API" },
            { name: "talmo2_products.php", desc: "商品・カテゴリー提供API" },
            { name: "talmo2_members.php", desc: "会員情報提供API" },
            { name: "talmo2_update_shipment.php", desc: "配送逆反映受信API" },
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
          ※ ファイルの場所: プロジェクト内 <code className="bg-muted px-1 rounded">artifacts/shop/gnuboard-api-files/</code>
        </p>
      </div>

      {/* API 설정 */}
      <div className="bg-card border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">API連携設定</h2>
        </div>

        {!isConfigured && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">API URLとトークンを設定しないと、同期を利用できません。</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">ショップ API基本URL</label>
            <Input
              placeholder="https://talmoschool.com/page"
              value={form.baseUrl}
              onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">PHPファイルがあるディレクトリのURL (末尾の / は除く)</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">APIトークン (シークレットキー)</label>
            <Input
              type="password"
              placeholder="PHPファイルのTALMO2_API_TOKENと同じ値"
              value={form.token}
              onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">英数字32文字以上のランダムな文字列を推奨</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
            />
            自動ポーリング同期を有効化 (配送処理時にショップへ自動で逆反映)
          </label>
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            設定を保存
          </Button>
          {isConfigured && (
            <Button size="sm" variant="outline" asChild>
              <a href={`${form.baseUrl}/talmo2_orders.php?token=${form.token}&limit=1`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                接続テスト
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
            <h2 className="text-base font-semibold">同期状況</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetchStatus()} disabled={statusLoading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${statusLoading ? "animate-spin" : ""}`} />
            再読み込み
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { icon: Package, label: "注文 最終同期", val: status?.lastOrderSync ?? null },
            { icon: ShoppingBag, label: "商品 最終同期", val: status?.lastProductSync ?? null },
            { icon: Users, label: "会員 最終同期", val: status?.lastMemberSync ?? null },
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
            自動同期が有効です — 配送処理時にショップへ自動反映されます
          </div>
        )}
      </div>

      {/* 수동 동기화 */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">手動同期</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          設定の保存後、手動ですぐに同期できます。注文は最終同期以降の変更分のみ取得します。
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncOrdersMut.mutate()}
            disabled={!isConfigured || anyLoading}
          >
            {syncOrdersMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Package className="w-4 h-4 mr-1" />}
            注文を同期
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncProductsMut.mutate()}
            disabled={!isConfigured || anyLoading}
          >
            {syncProductsMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShoppingBag className="w-4 h-4 mr-1" />}
            商品を同期
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncMembersMut.mutate()}
            disabled={!isConfigured || anyLoading}
          >
            {syncMembersMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Users className="w-4 h-4 mr-1" />}
            会員を同期
          </Button>
        </div>

        {anyLoading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            同期中... (データ量によっては数分かかる場合があります)
          </div>
        )}
      </div>
    </div>
  );
}
