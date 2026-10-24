import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";

export default function Login() {
  useSEO({ title: "ログイン" });

  const [, setLocation] = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 중복 체크 상태
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const utils = trpc.useUtils();

  const checkEmailMut = trpc.localAuth.checkAvailability.useQuery(
    { email: email || undefined },
    { enabled: false }
  );
  const checkPhoneMut = trpc.localAuth.checkAvailability.useQuery(
    { phone: phone || undefined },
    { enabled: false }
  );

  const emailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setEmailError("");
    if (!isRegister) return;
    if (emailTimer.current) clearTimeout(emailTimer.current);
    emailTimer.current = setTimeout(async () => {
      if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return;
      try {
        const res = await utils.localAuth.checkAvailability.fetch({ email: val });
        if (res.emailTaken) setEmailError("すでに登録されているメールアドレスです。");
      } catch {}
    }, 500);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setPhoneError("");
    if (!isRegister) return;
    if (phoneTimer.current) clearTimeout(phoneTimer.current);
    phoneTimer.current = setTimeout(async () => {
      if (!val || val.length < 9) return;
      try {
        const res = await utils.localAuth.checkAvailability.fetch({ phone: val });
        if (res.phoneTaken) setPhoneError("すでに登録されている連絡先です。");
      } catch {}
    }, 500);
  };

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: async () => {
      toast.success("ログインしました。");
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      setLocation("/");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: async () => {
      toast.success("会員登録が完了しました。");
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      setLocation("/");
    },
    onError: (err) => {
      if (err.message.includes("이메일") || err.message.includes("メール")) setEmailError(err.message);
      else if (err.message.includes("연락처") || err.message.includes("連絡先")) setPhoneError(err.message);
      else toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      if (password !== confirmPassword) { toast.error("パスワードが一致しません。"); return; }
      if (password.length < 6) { toast.error("パスワードは6文字以上で入力してください。"); return; }
      if (!phone.trim()) { toast.error("連絡先を入力してください。"); return; }
      if (emailError || phoneError) return;
      registerMutation.mutate({ email, password, name, phone });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    // seoulmono-admin: 관리자 전용 배포라 쇼핑몰 Layout(헤더/카테고리바)을 쓰지 않는다.
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#5C3D2E' }}>
                <span className="font-sans font-extrabold text-lg text-white tracking-wide">ソウルモノ</span>
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isRegister ? "会員登録" : "ログイン"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isRegister ? "新しいアカウントを作成しましょう" : "管理者アカウントでログインしてください"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">お名前</label>
                    <Input
                      type="text"
                      placeholder="お名前を入力してください"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      連絡先 <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={phoneError ? "border-destructive focus-visible:ring-destructive" : ""}
                      required
                    />
                    {phoneError && (
                      <p className="text-xs text-destructive mt-1">{phoneError}</p>
                    )}
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">ID (またはメールアドレス)</label>
                {/* seoulmono-admin: 그누보드 아이디(admin)로도 로그인하므로
                    로그인 시에는 type="email" 을 쓰면 브라우저 검증에 막힌다. */}
                <Input
                  type={isRegister ? "email" : "text"}
                  autoComplete="username"
                  placeholder={isRegister ? "IDとして使用するメールアドレスを入力してください" : "IDまたはメールアドレスを入力してください"}
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
                  required
                />
                {isRegister && emailError && (
                  <p className="text-xs text-destructive mt-1">{emailError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">パスワード</label>
                <Input
                  type="password"
                  placeholder="パスワードを入力してください"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isRegister ? 6 : 1}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
              </div>
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">パスワード（確認）</label>
                  <Input
                    type="password"
                    placeholder="パスワードをもう一度入力してください"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">パスワードが一致しません。</p>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || !!(emailError || phoneError)}>
                {isLoading ? "処理中..." : isRegister ? "会員登録" : "ログイン"}
              </Button>
            </form>

            {/* seoulmono-admin: 관리자 전용 배포라 회원가입/계정찾기 진입은 두지 않는다.
                계정은 쇼핑몰의 g5_member 를 그대로 쓴다. */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                ショップの管理者アカウントでログインします。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
