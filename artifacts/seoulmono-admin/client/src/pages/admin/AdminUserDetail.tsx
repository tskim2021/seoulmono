import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDate, formatDateTime, getGradeLabel, getOrderStatusLabel, getOrderStatusColor, formatOrderNumber } from "@/lib/utils";
import { ArrowLeft, User, MapPin, ShoppingBag, Coins, Pencil, Trash2, Save, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.userDetailFull.useQuery({ id: userId }, { enabled: !!userId });

  // ─── 기본정보 수정 상태 ───
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", email: "", phone: "", grade: "bronze", role: "user" });

  const updateInfo = trpc.admin.updateUserInfo.useMutation({
    onSuccess: () => {
      utils.admin.userDetailFull.invalidate({ id: userId });
      setEditingInfo(false);
      toast.success("会員情報を更新しました。");
    },
    onError: () => toast.error("更新に失敗しました。"),
  });

  // ─── 포인트 지급 ───
  const [pointAmount, setPointAmount] = useState(0);
  const [pointDesc, setPointDesc] = useState("");
  const addPoints = trpc.admin.addUserPoints.useMutation({
    onSuccess: () => {
      utils.admin.userDetailFull.invalidate({ id: userId });
      setPointAmount(0);
      setPointDesc("");
      toast.success("ポイントを付与しました。");
    },
  });

  // ─── 주소 수정 ───
  const [editingAddrId, setEditingAddrId] = useState<number | null>(null);
  const [addrForm, setAddrForm] = useState<any>({});

  const updateAddr = trpc.admin.updateUserAddress.useMutation({
    onSuccess: () => {
      utils.admin.userDetailFull.invalidate({ id: userId });
      setEditingAddrId(null);
      toast.success("住所を更新しました。");
    },
  });
  const deleteAddr = trpc.admin.deleteUserAddress.useMutation({
    onSuccess: () => {
      utils.admin.userDetailFull.invalidate({ id: userId });
      toast.success("住所を削除しました。");
    },
  });

  // ─── 주문 페이지네이션 ───
  const [orderPage, setOrderPage] = useState(1);
  const ordersQuery = trpc.admin.userOrders.useQuery({ userId, page: orderPage, limit: 10 }, { enabled: !!userId });

  // ─── 포인트 내역 페이지네이션 ───
  const [pointPage, setPointPage] = useState(1);
  const pointQuery = trpc.admin.userPointHistory.useQuery({ userId, page: pointPage, limit: 10 }, { enabled: !!userId });

  const startEditInfo = () => {
    if (!data?.user) return;
    setInfoForm({
      name: data.user.name ?? "",
      email: data.user.email ?? "",
      phone: data.user.phone ?? "",
      grade: data.user.grade ?? "bronze",
      role: data.user.role ?? "user",
    });
    setEditingInfo(true);
  };

  const startEditAddr = (addr: any) => {
    setEditingAddrId(addr.id);
    setAddrForm({
      name: addr.name,
      recipient: addr.recipient,
      phone: addr.phone,
      zipCode: addr.zipCode,
      address1: addr.address1,
      address2: addr.address2 ?? "",
      addressEn1: addr.addressEn1 ?? "",
      addressEn2: addr.addressEn2 ?? "",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">会員が見つかりません。</p>
          <Link href="/admin/users">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> 会員一覧へ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { user, addresses } = data;
  const liveOrderCount = data.liveOrderCount ?? 0;
  const liveTotalPaid = data.liveTotalPaid ?? 0;
  const orders = ordersQuery.data?.orders ?? [];
  const ordersTotal = ordersQuery.data?.total ?? 0;
  const orderTotalPages = Math.ceil(ordersTotal / 10);
  const pointHistory = pointQuery.data?.history ?? [];
  const pointTotal = pointQuery.data?.total ?? 0;
  const pointTotalPages = Math.ceil(pointTotal / 10);

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> 一覧</Button>
        </Link>
        <h1 className="text-2xl font-bold">会員詳細管理</h1>
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
          {user.role === "admin" ? "管理者" : "会員"}
        </Badge>
      </div>

      {/* ═══ 기본정보 섹션 ═══ */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5" /> 基本情報
          </h2>
          {!editingInfo ? (
            <Button variant="outline" size="sm" onClick={startEditInfo}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> 編集
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => updateInfo.mutate({ id: userId, ...infoForm })} disabled={updateInfo.isPending}>
                <Save className="w-3.5 h-3.5 mr-1" /> 保存
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingInfo(false)}>
                <X className="w-3.5 h-3.5 mr-1" /> キャンセル
              </Button>
            </div>
          )}
        </div>

        {!editingInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoItem label="ID" value={String(user.id)} />
            <InfoItem label="氏名" value={user.name ?? "-"} />
            <InfoItem label="ID" value={user.email ?? "-"} />
            <InfoItem label="電話番号" value={user.phone ?? "-"} />
            <InfoItem label="会員ランク" value={getGradeLabel(user.grade)} />
            <InfoItem label="役割" value={user.role === "admin" ? "管理者" : "会員"} />
            <InfoItem label="ポイント" value={`${user.points.toLocaleString()}P`} />
            <InfoItem label="注文件数" value={`${liveOrderCount.toLocaleString()}件`} />
            <InfoItem label="累計決済金額" value={formatPrice(liveTotalPaid)} />
            <InfoItem label="登録日" value={formatDateTime(user.createdAt)} />
            <InfoItem label="最終ログイン" value={formatDateTime(user.lastSignedIn)} />
            <InfoItem label="ログイン方法" value={user.loginMethod ?? "-"} />
            <InfoItem label="Open ID" value={user.openId} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">氏名 (カタカナ)</label>
              <Input value={infoForm.name} onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} placeholder="ヤマダ タロウ" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID (メールアドレス)</label>
              <Input value={infoForm.email} onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">電話番号</label>
              <Input value={infoForm.phone} onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">会員ランク</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={infoForm.grade} onChange={e => setInfoForm(f => ({ ...f, grade: e.target.value }))}>
                {["bronze", "silver", "gold", "vip", "vvip"].map(g => <option key={g} value={g}>{getGradeLabel(g)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">役割</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={infoForm.role} onChange={e => setInfoForm(f => ({ ...f, role: e.target.value }))}>
                <option value="user">会員</option>
                <option value="admin">管理者</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 비밀번호 초기화 섹션 ═══ */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5" /> パスワード管理
          </h2>
        </div>
        <AdminPasswordReset userId={userId} />
      </div>

      {/* ═══ 포인트 관리 섹션 ═══ */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5" /> ポイント管理
        </h2>
        <div className="flex items-center gap-3 mb-4 p-3 bg-secondary/30 rounded-lg">
          <span className="text-sm text-muted-foreground">現在のポイント:</span>
          <span className="text-lg font-bold">{user.points.toLocaleString()}P</span>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            placeholder="付与金額 (マイナス可)"
            className="max-w-[160px]"
            value={pointAmount || ""}
            onChange={e => setPointAmount(Number(e.target.value))}
          />
          <Input
            placeholder="理由"
            className="max-w-[300px]"
            value={pointDesc}
            onChange={e => setPointDesc(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              if (!pointAmount || !pointDesc) { toast.error("金額と理由を入力してください。"); return; }
              addPoints.mutate({ userId, amount: pointAmount, description: pointDesc });
            }}
            disabled={addPoints.isPending}
          >
            ポイント付与
          </Button>
        </div>

        {/* 포인트 내역 */}
        {pointHistory.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">ポイント履歴</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-xs text-muted-foreground">
                    <th className="text-left py-2 px-3">日時</th>
                    <th className="text-left py-2 px-3">種類</th>
                    <th className="text-right py-2 px-3">金額</th>
                    <th className="text-left py-2 px-3">理由</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pointHistory.map((p: any) => (
                    <tr key={p.id} className="hover:bg-accent/10">
                      <td className="py-2 px-3 text-muted-foreground">{formatDateTime(p.createdAt)}</td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary" className="text-[10px]">{p.type}</Badge>
                      </td>
                      <td className={`py-2 px-3 text-right font-medium ${p.amount >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {p.amount >= 0 ? "+" : ""}{p.amount.toLocaleString()}P
                      </td>
                      <td className="py-2 px-3">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pointTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Button variant="outline" size="sm" disabled={pointPage <= 1} onClick={() => setPointPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{pointPage} / {pointTotalPages}</span>
                <Button variant="outline" size="sm" disabled={pointPage >= pointTotalPages} onClick={() => setPointPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ 주소 목록 섹션 ═══ */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5" /> 配送先一覧
        </h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">登録された配送先はありません。</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr: any) => (
              <div key={addr.id} className="border rounded-lg p-4">
                {editingAddrId === addr.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">配送先名</label>
                        <Input value={addrForm.name} onChange={e => setAddrForm((f: any) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">受取人</label>
                        <Input value={addrForm.recipient} onChange={e => setAddrForm((f: any) => ({ ...f, recipient: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">電話番号</label>
                        <Input value={addrForm.phone} onChange={e => setAddrForm((f: any) => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">郵便番号</label>
                        <Input value={addrForm.zipCode} onChange={e => setAddrForm((f: any) => ({ ...f, zipCode: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground">住所</label>
                        <Input value={addrForm.address1} onChange={e => setAddrForm((f: any) => ({ ...f, address1: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground">建物名・部屋番号</label>
                        <Input value={addrForm.address2} onChange={e => setAddrForm((f: any) => ({ ...f, address2: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">英語住所</label>
                        <Input value={addrForm.addressEn1} onChange={e => setAddrForm((f: any) => ({ ...f, addressEn1: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">英語建物名・部屋番号</label>
                        <Input value={addrForm.addressEn2} onChange={e => setAddrForm((f: any) => ({ ...f, addressEn2: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateAddr.mutate({ id: addr.id, ...addrForm })} disabled={updateAddr.isPending}>
                        <Save className="w-3.5 h-3.5 mr-1" /> 保存
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingAddrId(null)}>
                        <X className="w-3.5 h-3.5 mr-1" /> キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{addr.name}</span>
                        {addr.isDefault === 1 && <Badge variant="default" className="text-[10px]">既定</Badge>}
                      </div>
                      <p className="text-sm">{addr.recipient} / {addr.phone}</p>
                      <p className="text-sm text-muted-foreground">[{addr.zipCode}] {addr.address1} {addr.address2 ?? ""}</p>
                      {addr.addressEn1 && (
                        <p className="text-xs text-muted-foreground">{addr.addressEn1} {addr.addressEn2 ?? ""}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEditAddr(addr)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => {
                        if (confirm("この住所を削除しますか？")) deleteAddr.mutate({ id: addr.id });
                      }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ 구매 내역 섹션 ═══ */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5" /> 購入履歴 <span className="text-sm font-normal text-muted-foreground">({ordersTotal}件)</span>
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">購入履歴がありません。</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-xs text-muted-foreground">
                    <th className="text-left py-2 px-3">注文番号</th>
                    <th className="text-center py-2 px-3">ステータス</th>
                    <th className="text-right py-2 px-3">決済金額</th>
                    <th className="text-left py-2 px-3">受取人</th>
                    <th className="text-left py-2 px-3">注文日</th>
                    <th className="text-center py-2 px-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-accent/10">
                      <td className="py-2 px-3 font-mono text-xs">{formatOrderNumber(o.orderNumber)}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="secondary" className={`text-[10px] ${getOrderStatusColor(o.status)}`}>
                          {getOrderStatusLabel(o.status)}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-right font-medium">{formatPrice(o.totalAmount - (o.discountAmount ?? 0) - (o.pointsUsed ?? 0))}</td>
                      <td className="py-2 px-3">{o.recipientName}</td>
                      <td className="py-2 px-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                      <td className="py-2 px-3 text-center">
                        <Link href={`/admin/orders/${o.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">詳細</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orderTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Button variant="outline" size="sm" disabled={orderPage <= 1} onClick={() => setOrderPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{orderPage} / {orderTotalPages}</span>
                <Button variant="outline" size="sm" disabled={orderPage >= orderTotalPages} onClick={() => setOrderPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AdminPasswordReset({ userId }: { userId: number }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const resetMut = trpc.admin.resetUserPassword.useMutation({
    onSuccess: () => {
      toast.success("パスワードを変更しました。");
      setPassword("");
      setConfirm("");
    },
    onError: (e) => toast.error(e.message),
  });

  const canSubmit = password.length >= 6 && password === confirm;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">新しいパスワード</label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6文字以上で入力" />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">パスワード（確認）</label>
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="もう一度入力" />
        </div>
        <div className="flex items-end">
          <Button size="sm" disabled={!canSubmit || resetMut.isPending} onClick={() => resetMut.mutate({ id: userId, password })}>
            {resetMut.isPending ? "処理中..." : "パスワードを変更"}
          </Button>
        </div>
      </div>
      {password && confirm && password !== confirm && (
        <p className="text-xs text-rose-500">パスワードが一致しません。</p>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  );
}
