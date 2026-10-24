import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { User, Lock, CheckCircle } from "lucide-react";

type Tab = "id" | "pw";

export default function ForgotAccount() {
  useSEO({ title: "ID・パスワードの確認", noindex: true });
  const [tab, setTab] = useState<Tab>("id");

  // 아이디 찾기
  const [findName, setFindName] = useState("");
  const [findPhone, setFindPhone] = useState("");
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  // 비밀번호 찾기
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const findAccountMut = trpc.localAuth.findAccount.useMutation({
    onSuccess: (data) => setFoundEmail(data.maskedEmail),
    onError: (e) => toast.error(e.message),
  });

  const resetPasswordMut = trpc.localAuth.requestPasswordReset.useMutation({
    onSuccess: () => setResetSent(true),
    onError: (e) => toast.error(e.message),
  });

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: '#5C3D2E' }}>
                <span className="font-sans font-extrabold text-lg text-white tracking-wide">ソウルモノ</span>
              </div>
            </div>
            <CardTitle className="text-xl">ID・パスワードの確認</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 탭 */}
            <div className="flex rounded-lg overflow-hidden border mb-6">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${tab === "id" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
                onClick={() => { setTab("id"); setFoundEmail(null); }}
              >
                <User className="w-4 h-4" />IDを確認
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${tab === "pw" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
                onClick={() => { setTab("pw"); setResetSent(false); }}
              >
                <Lock className="w-4 h-4" />パスワードを再設定
              </button>
            </div>

            {/* 아이디 찾기 */}
            {tab === "id" && (
              foundEmail ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">ご登録のIDは</p>
                  <p className="text-lg font-bold text-primary mb-6">{foundEmail}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setFoundEmail(null); setFindName(""); setFindPhone(""); }}>
                      もう一度検索
                    </Button>
                    <Button asChild className="flex-1"><Link href="/login">ログイン</Link></Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); findAccountMut.mutate({ name: findName, phone: findPhone }); }} className="space-y-4">
                  <p className="text-sm text-muted-foreground">登録時のお名前と連絡先を入力してください。</p>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">お名前</label>
                    <Input
                      placeholder="お名前を入力してください"
                      value={findName}
                      onChange={e => setFindName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">連絡先</label>
                    <Input
                      placeholder="010-0000-0000"
                      value={findPhone}
                      onChange={e => setFindPhone(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={findAccountMut.isPending}>
                    {findAccountMut.isPending ? "検索中..." : "IDを確認"}
                  </Button>
                </form>
              )
            )}

            {/* 비밀번호 찾기 */}
            {tab === "pw" && (
              resetSent ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold mb-1">仮パスワードを送信しました</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    <strong>{resetEmail}</strong> 宛に仮パスワードをお送りしました。<br />
                    ログイン後にパスワードを変更してください。
                  </p>
                  <Button asChild className="w-full"><Link href="/login">ログインへ</Link></Button>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); resetPasswordMut.mutate({ email: resetEmail }); }} className="space-y-4">
                  <p className="text-sm text-muted-foreground">ご登録のメールアドレスを入力すると、仮パスワードをお送りします。</p>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">ID (メールアドレス)</label>
                    <Input
                      type="email"
                      placeholder="ご登録のメールアドレスを入力してください"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={resetPasswordMut.isPending}>
                    {resetPasswordMut.isPending ? "送信中..." : "仮パスワードを受け取る"}
                  </Button>
                </form>
              )
            )}

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                ログインに戻る
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
