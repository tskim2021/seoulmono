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
        
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">承認待ち</h2>
        
        <div className="bg-slate-100 rounded-xl p-6 mb-8 text-left">
          <p className="text-slate-600 leading-relaxed font-medium">
            現在、<strong>{user?.company_name || user?.mb_name}</strong>様のアカウントは管理者の承認待ちです。
          </p>
          <p className="text-slate-500 mt-2 text-sm">
            事業者情報の確認後、承認が完了すると発注システムをご利用いただけます。登録の承認まで、営業日で1〜2日ほどかかる場合があります。
          </p>
        </div>

        <Button variant="outline" size="lg" onClick={handleLogout} className="w-full group">
          <LogOut className="w-4 h-4 mr-2 text-slate-400 group-hover:text-slate-600" />
          ログアウト
        </Button>
      </Card>
    </div>
  );
}
