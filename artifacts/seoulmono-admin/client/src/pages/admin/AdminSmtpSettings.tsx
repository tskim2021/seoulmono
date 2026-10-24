import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Mail, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const PRESETS: Record<string, { host: string; port: number; secure: boolean; label: string }> = {
  bluehost: { host: "mail.talmoschool.com", port: 465, secure: true, label: "Bluehost" },
  gmail: { host: "smtp.gmail.com", port: 587, secure: false, label: "Gmail" },
  naver: { host: "smtp.naver.com", port: 465, secure: true, label: "네이버" },
  daum: { host: "smtp.daum.net", port: 465, secure: true, label: "Daum/카카오" },
  outlook: { host: "smtp.office365.com", port: 587, secure: false, label: "Outlook" },
};

export default function AdminSmtpSettings() {
  const { data, isLoading } = trpc.admin.getSmtpSettings.useQuery();
  const updateMut = trpc.admin.updateSmtpSettings.useMutation({
    onSuccess: () => toast.success("SMTP 설정이 저장되었습니다."),
    onError: (e) => toast.error(e.message),
  });
  const testMut = trpc.admin.testSmtpEmail.useMutation({
    onSuccess: (d) => {
      if (d.success) toast.success("테스트 메일이 발송되었습니다!");
      else toast.error(`발송 실패: ${d.error}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    host: "",
    port: 587,
    user: "",
    pass: "",
    from: "",
    fromName: "탈모학교",
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
    toast.info(`${p.label} SMTP 설정이 적용됐습니다. 이메일과 비밀번호를 입력 후 저장하세요.`);
  };

  const isConfigured = form.host && form.user && form.pass;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">SMTP 메일 설정</h1>

      {!isConfigured && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <p className="font-medium mb-0.5">이메일 발송 설정이 필요합니다</p>
            <p>아래에서 사용하는 메일 서비스를 선택하고 계정 정보를 입력한 후 저장하세요.</p>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">SMTP 서버 설정</h2>
        </div>

        {/* 프리셋 버튼 */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">빠른 설정 선택 (클릭하면 호스트/포트가 자동 입력됩니다)</p>
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
            <label className="text-sm font-medium block mb-1">호스트</label>
            <Input
              placeholder="mail.talmoschool.com"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">포트</label>
            <Input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">이메일 계정 (로그인 ID)</label>
            <Input
              placeholder="help@talmoschool.com"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">비밀번호</label>
            <Input
              type="password"
              placeholder="비밀번호 입력"
              value={form.pass}
              onChange={(e) => setForm({ ...form, pass: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">Gmail은 앱 비밀번호(16자리)를 사용하세요.</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">발신 이메일</label>
            <Input
              placeholder={form.user || "이메일 계정과 동일하게 사용"}
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">비워두면 위의 이메일 계정이 발신 주소로 사용됩니다.</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">발신자 이름</label>
            <Input
              placeholder="탈모학교"
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">숨은 참조 (BCC)</label>
            <Input
              placeholder="hlschool.cs@gmail.com"
              value={form.bcc}
              onChange={(e) => setForm({ ...form, bcc: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">모든 발신 메일에 숨은 참조로 추가됩니다.</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.secure}
            onChange={(e) => setForm({ ...form, secure: e.target.checked })}
          />
          SSL/TLS 사용 (포트 465일 때 체크)
        </label>

        <Button size="sm" onClick={() => updateMut.mutate(form)} disabled={updateMut.isPending}>
          {updateMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          설정 저장
        </Button>
      </div>

      <div className="bg-card border rounded-xl p-5 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Send className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">테스트 메일 발송</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          설정 저장 후 아래에서 테스트 메일을 보내 정상 동작을 확인하세요.
        </p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="수신할 이메일 주소"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!testEmail) { toast.error("이메일 주소를 입력해주세요."); return; }
              testMut.mutate({ to: testEmail });
            }}
            disabled={testMut.isPending}
          >
            {testMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            테스트 발송
          </Button>
        </div>
        {testMut.isSuccess && testMut.data?.success && (
          <div className="flex items-center gap-2 mt-3 text-emerald-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            테스트 메일이 성공적으로 발송되었습니다.
          </div>
        )}
      </div>
    </div>
  );
}
