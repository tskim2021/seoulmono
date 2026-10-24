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
  useSEO({ title: "아이디/비밀번호 찾기", noindex: true });
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
                <span className="font-sans font-extrabold text-lg text-white tracking-wide">탈모학교</span>
              </div>
            </div>
            <CardTitle className="text-xl">아이디/비밀번호 찾기</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 탭 */}
            <div className="flex rounded-lg overflow-hidden border mb-6">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${tab === "id" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
                onClick={() => { setTab("id"); setFoundEmail(null); }}
              >
                <User className="w-4 h-4" />아이디 찾기
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${tab === "pw" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
                onClick={() => { setTab("pw"); setResetSent(false); }}
              >
                <Lock className="w-4 h-4" />비밀번호 찾기
              </button>
            </div>

            {/* 아이디 찾기 */}
            {tab === "id" && (
              foundEmail ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">가입하신 아이디는</p>
                  <p className="text-lg font-bold text-primary mb-6">{foundEmail}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setFoundEmail(null); setFindName(""); setFindPhone(""); }}>
                      다시 찾기
                    </Button>
                    <Button asChild className="flex-1"><Link href="/login">로그인</Link></Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); findAccountMut.mutate({ name: findName, phone: findPhone }); }} className="space-y-4">
                  <p className="text-sm text-muted-foreground">가입 시 등록한 이름과 연락처를 입력해주세요.</p>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">이름</label>
                    <Input
                      placeholder="이름을 입력하세요"
                      value={findName}
                      onChange={e => setFindName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">연락처</label>
                    <Input
                      placeholder="010-0000-0000"
                      value={findPhone}
                      onChange={e => setFindPhone(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={findAccountMut.isPending}>
                    {findAccountMut.isPending ? "검색 중..." : "아이디 찾기"}
                  </Button>
                </form>
              )
            )}

            {/* 비밀번호 찾기 */}
            {tab === "pw" && (
              resetSent ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold mb-1">임시 비밀번호가 발송되었습니다</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    <strong>{resetEmail}</strong>으로 임시 비밀번호를 보내드렸습니다.<br />
                    로그인 후 비밀번호를 변경해주세요.
                  </p>
                  <Button asChild className="w-full"><Link href="/login">로그인하러 가기</Link></Button>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); resetPasswordMut.mutate({ email: resetEmail }); }} className="space-y-4">
                  <p className="text-sm text-muted-foreground">가입하신 이메일을 입력하시면 임시 비밀번호를 보내드립니다.</p>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">아이디 (이메일)</label>
                    <Input
                      type="email"
                      placeholder="가입한 이메일을 입력하세요"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={resetPasswordMut.isPending}>
                    {resetPasswordMut.isPending ? "발송 중..." : "임시 비밀번호 받기"}
                  </Button>
                </form>
              )
            )}

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                로그인으로 돌아가기
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
