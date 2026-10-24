import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Mail, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const PRESETS: Record<string, { host: string; port: number; secure: boolean; label: string }> = {
  bluehost: { host: "mail.talmoschool.com", port: 465, secure: true, label: "Bluehost" },
  gmail: { host: "smtp.gmail.com", port: 587, secure: false, label: "Gmail" },
  naver: { host: "smtp.naver.com", port: 465, secure: true, label: "NAVER" },
  daum: { host: "smtp.daum.net", port: 465, secure: true, label: "Daum/Kakao" },
  outlook: { host: "smtp.office365.com", port: 587, secure: false, label: "Outlook" },
};

export default function AdminSmtpSettings() {
  const { data, isLoading } = trpc.admin.getSmtpSettings.useQuery();
  const updateMut = trpc.admin.updateSmtpSettings.useMutation({
    onSuccess: () => toast.success("SMTP設定を保存しました。"),
    onError: (e) => toast.error(e.message),
  });
  const testMut = trpc.admin.testSmtpEmail.useMutation({
    onSuccess: (d) => {
      if (d.success) toast.success("テストメールを送信しました！");
      else toast.error(`送信に失敗しました: ${d.error}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    host: "",
    port: 587,
    user: "",
    pass: "",
    from: "",
    fromName: "ソウルモノ",
    secure: false,
    bcc: "",
  });
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (data) {
      setForm({
        host: data.host,
        port: data.port,
        user: data.user,
        pass: data.pass,
        from: data.from,
        fromName: data.fromName,
        secure: data.secure,
        bcc: data.bcc ?? "",
      });
    }
  }, [data]);

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setForm(f => ({ ...f, host: p.host, port: p.port, secure: p.secure }));
    toast.info(`${p.label} のSMTP設定を適用しました。メールアドレスとパスワードを入力して保存してください。`);
  };

  const isConfigured = form.host && form.user && form.pass;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">SMTPメール設定</h1>

      {!isConfigured && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <p className="font-medium mb-0.5">メール送信の設定が必要です</p>
            <p>下で利用するメールサービスを選択し、アカウント情報を入力して保存してください。</p>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">SMTPサーバー設定</h2>
        </div>

        {/* 프리셋 버튼 */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">クイック設定を選択 (クリックするとホスト/ポートが自動入力されます)</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  form.host === p.host
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-accent"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">ホスト</label>
            <Input
              placeholder="mail.talmoschool.com"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">ポート</label>
            <Input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">メールアカウント (ログインID)</label>
            <Input
              placeholder="help@talmoschool.com"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">パスワード</label>
            <Input
              type="password"
              placeholder="パスワードを入力"
              value={form.pass}
              onChange={(e) => setForm({ ...form, pass: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">Gmailはアプリパスワード(16桁)をご使用ください。</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">送信元メールアドレス</label>
            <Input
              placeholder={form.user || "メールアカウントと同じものを使用"}
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">空欄の場合、上記のメールアカウントが送信元アドレスとして使用されます。</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">送信者名</label>
            <Input
              placeholder="ソウルモノ"
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">ブラインドカーボンコピー (BCC)</label>
            <Input
              placeholder="hlschool.cs@gmail.com"
              value={form.bcc}
              onChange={(e) => setForm({ ...form, bcc: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">すべての送信メールにBCCとして追加されます。</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.secure}
            onChange={(e) => setForm({ ...form, secure: e.target.checked })}
          />
          SSL/TLSを使用 (ポート465の場合はチェック)
        </label>

        <Button size="sm" onClick={() => updateMut.mutate(form)} disabled={updateMut.isPending}>
          {updateMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          設定を保存
        </Button>
      </div>

      <div className="bg-card border rounded-xl p-5 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">テストメール送信</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          設定保存後、下からテストメールを送信して正常に動作することを確認してください。
        </p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="送信先のメールアドレス"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!testEmail) { toast.error("メールアドレスを入力してください。"); return; }
              testMut.mutate({ to: testEmail });
            }}
            disabled={testMut.isPending}
          >
            {testMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            テスト送信
          </Button>
        </div>
        {testMut.isSuccess && testMut.data?.success && (
          <div className="flex items-center gap-2 mt-3 text-emerald-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            テストメールを正常に送信しました。
          </div>
        )}
      </div>
    </div>
  );
}
