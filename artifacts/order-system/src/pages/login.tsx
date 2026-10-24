import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { Button, Input, Label } from "../components/ui";
import { ArrowRight } from "lucide-react";

export default function Login() {
  const [mb_id, setId] = useState("");
  const [mb_password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    login({ data: { mb_id, mb_password } }, {
      onSuccess: (res) => {
        if (!res.user?.is_admin) {
          setErrorMsg("관리자 계정만 접근할 수 있습니다.");
          return;
        }
        localStorage.setItem("token", res.token);
        window.location.href = import.meta.env.BASE_URL;
      },
      onError: (err: any) => {
        setErrorMsg(err?.data?.error || err?.message || "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-8 py-12 bg-white rounded-2xl shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="ソウルモノ 로고" style={{ height: 64, marginBottom: 16, objectFit: "contain" }} />
          <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">관리자 로그인</h2>
          <p className="text-slate-500">관리자 계정으로 로그인해 주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <Label>아이디</Label>
            <Input
              type="text"
              placeholder="아이디를 입력하세요"
              value={mb_id}
              onChange={(e: any) => setId(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>비밀번호</Label>
            <Input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={mb_password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full text-lg h-14 mt-2"
            style={{ background: "#1D8A5A", borderColor: "#1D8A5A" }}
            disabled={isPending}
          >
            {isPending ? "로그인 중..." : "로그인"}
            {!isPending && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
