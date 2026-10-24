import { useLogout, useGetMe } from "@workspace/api-client-react";
import { Button, Card } from "../components/ui";
import { Clock, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function PendingApproval() {
  const { mutate: logout } = useLogout();
  const { data: user } = useGetMe();
  const [, setLocation] = useLocation();

  if (user?.is_approved || user?.is_admin) {
    setLocation("/");
    return null;
  }

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full p-8 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <Clock className="w-12 h-12 text-amber-600" />
          <span className="absolute top-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="w-4 h-4 bg-amber-500 rounded-full animate-ping opacity-75"></span>
          </span>
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">승인 대기중</h2>
        
        <div className="bg-slate-100 rounded-xl p-6 mb-8 text-left">
          <p className="text-slate-600 leading-relaxed font-medium">
            현재 <strong>{user?.company_name || user?.mb_name}</strong>님의 계정이 관리자 승인 대기 상태입니다.
          </p>
          <p className="text-slate-500 mt-2 text-sm">
            사업자 정보 확인 후 승인이 완료되면 발주 시스템을 정상적으로 이용하실 수 있습니다. 가입 승인까지 영업일 기준 1~2일이 소요될 수 있습니다.
          </p>
        </div>

        <Button variant="outline" size="lg" onClick={handleLogout} className="w-full group">
          <LogOut className="w-4 h-4 mr-2 text-slate-400 group-hover:text-slate-600" />
          로그아웃
        </Button>
      </Card>
    </div>
  );
}
