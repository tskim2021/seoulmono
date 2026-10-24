import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDateTime, formatOrderNumber } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle, Plus, Pencil, Trash2, Banknote, Settings } from "lucide-react";
import { toast } from "sonner";
export default function AdminPaymentManagement() {
  const [selectedTab, setSelectedTab] = useState<"pending" | "accounts" | "settings">("pending");
  
  return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">무통장 입금 관리</h1>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setSelectedTab("pending")}
            className={`px-4 py-2 font-medium transition-colors ${
              selectedTab === "pending"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            입금 대기 목록
          </button>
          <button
            onClick={() => setSelectedTab("accounts")}
            className={`px-4 py-2 font-medium transition-colors ${
              selectedTab === "accounts"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Banknote className="w-4 h-4 inline mr-2" />
            입금 계좌 관리
          </button>
          <button
            onClick={() => setSelectedTab("settings")}
            className={`px-4 py-2 font-medium transition-colors ${
              selectedTab === "settings"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            자동취소 설정
          </button>
        </div>

        {selectedTab === "pending" && <PendingPaymentsList />}
        {selectedTab === "accounts" && <BankAccountsManagement />}
        {selectedTab === "settings" && <AutoCancelSettings />}
      </div>
  );
}

// 입금 대기 목록
function PendingPaymentsList() {
  const { data: payments, refetch } = trpc.payment.adminGetPendingPayments.useQuery();
  const confirmPayment = trpc.payment.adminConfirmPayment.useMutation({
    onSuccess: () => {
      toast.success("입금이 확인되었습니다");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>입금 대기 중인 주문이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment: any) => {
        const now = new Date();
        const expiresAt = payment.expiresAt ? new Date(payment.expiresAt) : null;
        const remainingHours = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))) : null;
        const isUrgent = remainingHours !== null && remainingHours < 6;

        return (
          <div
            key={payment.id}
            className={`border rounded-lg p-4 ${
              isUrgent ? "bg-rose-50 border-rose-200" : "bg-card"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium">주문번호: {formatOrderNumber(payment.order?.orderNumber)}</p>
                <p className="text-sm text-muted-foreground">주문자: {payment.order?.recipientName ?? "-"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg price-text">{formatPrice(payment.depositAmount ?? 0)}</p>
                {remainingHours !== null && (
                  <p className={`text-xs ${isUrgent ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>
                    {remainingHours > 0 ? `${remainingHours}시간 남음` : "기한 만료"}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div><span className="text-muted-foreground">입금자명:</span> <span className="font-medium">{payment.depositorName ?? "-"}</span></div>
              <div><span className="text-muted-foreground">입금계좌:</span> <span className="font-medium">{payment.bankAccount?.bankName ?? "-"} {payment.bankAccount?.accountNumber ?? ""}</span></div>
              <div><span className="text-muted-foreground">주문일시:</span> <span>{formatDateTime(payment.createdAt)}</span></div>
              <div><span className="text-muted-foreground">입금기한:</span> <span>{formatDateTime(payment.expiresAt)}</span></div>
            </div>

            <Button
              size="sm"
              onClick={() => confirmPayment.mutate({ paymentId: payment.id })}
              disabled={confirmPayment.isPending}
              className="w-full"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {confirmPayment.isPending ? "처리 중..." : "입금 확인"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// 입금 계좌 관리
function BankAccountsManagement() {
  const { data: accounts, refetch } = trpc.payment.getBankAccounts.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const createAccount = trpc.payment.adminCreateBankAccount.useMutation({
    onSuccess: () => {
      toast.success("계좌가 추가되었습니다");
      setDialogOpen(false);
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateAccount = trpc.payment.adminUpdateBankAccount.useMutation({
    onSuccess: () => {
      toast.success("계좌가 수정되었습니다");
      setDialogOpen(false);
      setEditingAccount(null);
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteAccount = trpc.payment.adminDeleteBankAccount.useMutation({
    onSuccess: () => {
      toast.success("계좌가 삭제되었습니다");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">고객이 선택할 수 있는 입금 계좌를 관리합니다</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAccount(null)}>
              <Plus className="w-4 h-4 mr-2" />
              계좌 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? "계좌 수정" : "계좌 추가"}</DialogTitle>
            </DialogHeader>
            <BankAccountForm
              account={editingAccount}
              onSubmit={(data) => {
                if (editingAccount) {
                  updateAccount.mutate({ id: editingAccount.id, ...data });
                } else {
                  createAccount.mutate(data);
                }
              }}
              isPending={createAccount.isPending || updateAccount.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!accounts || accounts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Banknote className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>등록된 입금 계좌가 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account: any) => (
            <div key={account.id} className="border rounded-lg p-4 flex items-start justify-between">
              <div>
                <p className="font-medium">{account.bankName}</p>
                <p className="text-sm text-muted-foreground font-mono">{account.accountNumber}</p>
                <p className="text-sm text-muted-foreground">예금주: {account.accountHolder}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingAccount(account);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("정말 삭제하시겠습니까?")) {
                      deleteAccount.mutate({ id: account.id });
                    }
                  }}
                  disabled={deleteAccount.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BankAccountForm({ account, onSubmit, isPending }: { account: any; onSubmit: (data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    bankName: account?.bankName ?? "",
    accountNumber: account?.accountNumber ?? "",
    accountHolder: account?.accountHolder ?? "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div>
        <Label>은행명</Label>
        <Input
          value={form.bankName}
          onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          placeholder="예: 국민은행"
          required
        />
      </div>
      <div>
        <Label>계좌번호</Label>
        <Input
          value={form.accountNumber}
          onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          placeholder="예: 123-456-789012"
          required
        />
      </div>
      <div>
        <Label>예금주</Label>
        <Input
          value={form.accountHolder}
          onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
          placeholder="예: (주)영카트"
          required
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "처리 중..." : account ? "수정" : "추가"}
      </Button>
    </form>
  );
}

// 자동취소 설정
function AutoCancelSettings() {
  const { data: config } = trpc.payment.adminGetAutoCancelHours.useQuery();
  const updateConfig = trpc.payment.adminUpdateAutoCancelHours.useMutation({
    onSuccess: () => toast.success("설정이 저장되었습니다"),
    onError: (e: any) => toast.error(e.message),
  });

  const [selectedHours, setSelectedHours] = useState(config?.hours ?? 48);

  const hourOptions = [12, 24, 48, 72];

  return (
    <div className="max-w-2xl">
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">자동 취소 시간 설정</h3>
        <p className="text-sm text-muted-foreground mb-6">
          주문 후 설정된 시간 내에 입금하지 않으면 주문이 자동으로 취소됩니다.
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {hourOptions.map((hours) => (
            <button
              key={hours}
              type="button"
              onClick={() => setSelectedHours(hours)}
              className={`p-4 border-2 rounded-lg transition-all ${
                selectedHours === hours
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-2xl font-bold">{hours}</p>
              <p className="text-xs text-muted-foreground">시간</p>
            </button>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-900">
            현재 설정: 주문 후 <strong>{selectedHours}시간</strong> 이내 미입금 시 자동 취소
          </p>
        </div>

        <Button
          onClick={() => updateConfig.mutate({ hours: selectedHours })}
          disabled={updateConfig.isPending || selectedHours === config?.hours}
          className="w-full"
        >
          {updateConfig.isPending ? "저장 중..." : "설정 저장"}
        </Button>
      </div>
    </div>
  );
}
