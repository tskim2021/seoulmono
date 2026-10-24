import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Bell, ShoppingCart, Star, MessageCircle, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function MyProfile() {
  useAuth({ redirectOnUnauthenticated: true });
  const { data: profile } = trpc.user.profile.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({ 
    name: "", 
    phone: "", 
    email: "", 
    emailNotifications: true,
    emailNotifyOrder: true,
    emailNotifyPoint: true,
    emailNotifyReview: true,
    emailNotifyComment: true,
    emailNotifySystem: true,
  });

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (profile) setForm({ 
      name: profile.name ?? "", 
      phone: profile.phone ?? "", 
      email: profile.email ?? "", 
      emailNotifications: profile.emailNotifications === 1,
      emailNotifyOrder: profile.emailNotifyOrder === 1,
      emailNotifyPoint: profile.emailNotifyPoint === 1,
      emailNotifyReview: profile.emailNotifyReview === 1,
      emailNotifyComment: profile.emailNotifyComment === 1,
      emailNotifySystem: profile.emailNotifySystem === 1,
    });
  }, [profile]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => { toast.success("프로필이 수정되었습니다"); utils.user.profile.invalidate(); },
  });

  const changePassword = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success("비밀번호가 변경되었습니다");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (e) => { toast.error(e.message); },
  });

  const handleChangePassword = () => {
    if (!pwForm.currentPassword) return toast.error("현재 비밀번호를 입력해주세요");
    if (pwForm.newPassword.length < 8) return toast.error("새 비밀번호는 8자 이상이어야 합니다");
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error("새 비밀번호가 일치하지 않습니다");
    changePassword.mutate(pwForm);
  };

  return (
    <MyPageLayout title="회원정보 수정">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* 기본 정보 */}
        <div className="bg-card border rounded-xl p-6 flex flex-col">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b h-20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{profile?.name ?? "회원"}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div><Label className="text-sm mb-1.5 block">이름</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-sm mb-1.5 block">연락처</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="010-0000-0000" /></div>
            <div><Label className="text-sm mb-1.5 block">아이디 (이메일)</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" /></div>
            <Button className="w-full mt-2" onClick={() => updateProfile.mutate({ 
              ...form, 
              emailNotifications: form.emailNotifications ? 1 : 0,
              emailNotifyOrder: form.emailNotifyOrder ? 1 : 0,
              emailNotifyPoint: form.emailNotifyPoint ? 1 : 0,
              emailNotifyReview: form.emailNotifyReview ? 1 : 0,
              emailNotifyComment: form.emailNotifyComment ? 1 : 0,
              emailNotifySystem: form.emailNotifySystem ? 1 : 0,
            })} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="bg-card border rounded-xl p-6 flex flex-col">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b h-20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold">비밀번호 변경</p>
              <p className="text-sm text-muted-foreground">보안을 위해 주기적으로 변경해주세요</p>
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); handleChangePassword(); }} className="space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <Label className="text-sm mb-1.5 block">현재 비밀번호</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="현재 비밀번호 입력"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">새 비밀번호</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="8자 이상 입력"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwForm.newPassword && pwForm.newPassword.length < 8 && (
                <p className="text-xs text-destructive mt-1">8자 이상이어야 합니다</p>
              )}
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">새 비밀번호 확인</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="새 비밀번호 재입력"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-xs text-destructive mt-1">비밀번호가 일치하지 않습니다</p>
              )}
              {pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && pwForm.newPassword.length >= 8 && (
                <p className="text-xs text-green-600 mt-1">비밀번호가 일치합니다</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </form>
        </div>

        {/* 이메일 알림 수신 */}
        <div className="bg-card border rounded-xl p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-5 pb-5 border-b">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">이메일 알림 수신</p>
              <p className="text-xs text-muted-foreground">주문, 포인트, 리뷰 등의 알림을 이메일로 받습니다</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">전체 이메일 알림</Label>
              <Switch checked={form.emailNotifications} onCheckedChange={checked => setForm(f => ({ ...f, emailNotifications: checked }))} />
            </div>
            {form.emailNotifications && (
              <div className="space-y-3 pl-2 border-l-2 border-muted ml-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-muted-foreground" /><Label className="text-sm">주문 알림</Label></div>
                  <Switch checked={form.emailNotifyOrder} onCheckedChange={checked => setForm(f => ({ ...f, emailNotifyOrder: checked }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Star className="w-4 h-4 text-muted-foreground" /><Label className="text-sm">포인트 알림</Label></div>
                  <Switch checked={form.emailNotifyPoint} onCheckedChange={checked => setForm(f => ({ ...f, emailNotifyPoint: checked }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-muted-foreground" /><Label className="text-sm">리뷰 알림</Label></div>
                  <Switch checked={form.emailNotifyReview} onCheckedChange={checked => setForm(f => ({ ...f, emailNotifyReview: checked }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-muted-foreground" /><Label className="text-sm">댓글 알림</Label></div>
                  <Switch checked={form.emailNotifyComment} onCheckedChange={checked => setForm(f => ({ ...f, emailNotifyComment: checked }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /><Label className="text-sm">시스템 알림</Label></div>
                  <Switch checked={form.emailNotifySystem} onCheckedChange={checked => setForm(f => ({ ...f, emailNotifySystem: checked }))} />
                </div>
              </div>
            )}
            <Button className="w-full mt-2" onClick={() => updateProfile.mutate({
              ...form,
              emailNotifications: form.emailNotifications ? 1 : 0,
              emailNotifyOrder: form.emailNotifyOrder ? 1 : 0,
              emailNotifyPoint: form.emailNotifyPoint ? 1 : 0,
              emailNotifyReview: form.emailNotifyReview ? 1 : 0,
              emailNotifyComment: form.emailNotifyComment ? 1 : 0,
              emailNotifySystem: form.emailNotifySystem ? 1 : 0,
            })} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "저장 중..." : "알림 설정 저장"}
            </Button>
          </div>
        </div>
      </div>
    </MyPageLayout>
  );
}
