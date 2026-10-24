import { useGetMembers, useApproveMember, useRejectMember, getGetMembersQueryKey, getGetPendingMembersQueryKey, useGetPendingMembers } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, Badge, Button } from "../components/ui";
import { format } from "date-fns";
import { Check, X, Users, Loader2, FileText, Eye, Building2, Phone, Trash2, CheckSquare, Square } from "lucide-react";
import { toast } from "../hooks/use-toast";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function MemberDetailModal({ member, onClose }: { member: any; onClose: () => void }) {
  const token = localStorage.getItem("token");
  const licenseUrl = member.business_license_file
    ? `${API_BASE}/admin/business-license/${member.business_license_file}`
    : null;
  const isImage = member.business_license_file?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">取引先の詳細情報</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 事業者情報
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">会社名</p>
                <p className="font-bold text-slate-900">{member.company_name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">事業者登録番号</p>
                <p className="font-bold text-slate-900">{member.business_number || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">代表者</p>
                <p className="font-bold text-slate-900">{member.representative || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">業態 / 業種</p>
                <p className="font-bold text-slate-900">
                  {member.business_type || "-"} / {member.business_category || "-"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400">事業所の住所</p>
                <p className="font-bold text-slate-900">{member.company_address || "-"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" /> 担当者情報
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">担当者名</p>
                <p className="font-bold text-slate-900">{member.mb_name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">ID</p>
                <p className="font-bold text-slate-900">{member.mb_id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">連絡先</p>
                <p className="font-bold text-slate-900">{member.mb_hp || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">メールアドレス</p>
                <p className="font-bold text-slate-900">{member.mb_email || "-"}</p>
              </div>
            </div>
          </div>

          {licenseUrl && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> 事業者登録証
              </h3>
              {isImage ? (
                <div className="border rounded-xl overflow-hidden bg-slate-50">
                  <img
                    src={licenseUrl}
                    alt="事業者登録証"
                    className="w-full max-h-[500px] object-contain"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="p-8 text-center text-slate-500">画像を読み込めません</div>';
                      }
                    }}
                  />
                </div>
              ) : (
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-semibold"
                >
                  <FileText className="w-5 h-5" />
                  事業者登録証ファイルを開く (PDF)
                </a>
              )}
            </div>
          )}

          {!licenseUrl && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> 事業者登録証
              </h3>
              <p className="text-sm text-slate-400">添付された事業者登録証がありません。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminMembers() {
  const queryClient = useQueryClient();
  const [pageSize, setPageSize] = useState(20);
  const { data: allMembers, isLoading: isLoadingAll } = useGetMembers({ page: 1, limit: pageSize });
  const { data: pendingMembers } = useGetPendingMembers();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const pageSizeOptions = [10, 20, 50];
  
  const { mutate: approve, isPending: isApproving } = useApproveMember({
    mutation: {
      onSuccess: () => {
        toast({ title: "承認完了", description: "取引先の登録を承認しました。" });
        queryClient.invalidateQueries({ queryKey: getGetMembersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPendingMembersQueryKey() });
      }
    }
  });

  const { mutate: reject, isPending: isRejecting } = useRejectMember({
    mutation: {
      onSuccess: () => {
        toast({ title: "却下完了", description: "取引先の登録を却下しました。" });
        queryClient.invalidateQueries({ queryKey: getGetMembersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPendingMembersQueryKey() });
      }
    }
  });

  const deleteMember = useMutation({
    mutationFn: (memberId: string) =>
      customFetch(`/api/admin/members/${memberId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "削除完了", description: "会員を削除しました。" });
      queryClient.invalidateQueries({ queryKey: getGetMembersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPendingMembersQueryKey() });
    },
    onError: (err: any) => {
      toast({ title: "削除に失敗しました", description: err?.message || "エラーが発生しました。", variant: "destructive" });
    },
  });

  const batchDelete = useMutation({
    mutationFn: (memberIds: string[]) =>
      customFetch("/api/admin/members/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_ids: memberIds }),
      }),
    onSuccess: () => {
      toast({ title: "一括削除完了", description: `${selectedIds.size}件の会員を削除しました。` });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: getGetMembersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPendingMembersQueryKey() });
    },
    onError: (err: any) => {
      toast({ title: "削除に失敗しました", description: err?.message || "エラーが発生しました。", variant: "destructive" });
    },
  });

  const members = allMembers?.members || [];
  const nonAdminMembers = members.filter((m: any) => !m.is_admin);

  const toggleSelect = (mbId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mbId)) next.delete(mbId);
      else next.add(mbId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === nonAdminMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(nonAdminMembers.map((m: any) => m.mb_id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`選択した${selectedIds.size}名の会員を削除してもよろしいですか？\nこの操作は元に戻せません。`)) return;
    batchDelete.mutate(Array.from(selectedIds));
  };

  const handleSingleDelete = (member: any) => {
    if (!confirm(`"${member.company_name || member.mb_name}" 様を削除してもよろしいですか？\nこの操作は元に戻せません。`)) return;
    deleteMember.mutate(member.mb_id);
  };

  if (isLoadingAll) return <div className="p-10 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">取引先会員管理</h1>
          <p className="text-slate-500 mt-2 font-medium">登録申請を確認し、事業者登録証を審査のうえ承認します。</p>
        </div>
        <select
          className="h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}件ずつ表示</option>
          ))}
        </select>
      </div>

      {pendingMembers?.members && pendingMembers.members.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            承認待ち ({pendingMembers.members.length})
          </h2>
          <div className="grid gap-4">
            {pendingMembers.members.map((member: any) => (
              <Card key={member.mb_id} className="p-6 border-amber-200 bg-amber-50/30">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-slate-900">{member.company_name}</h3>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">待機中</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-sm">
                      <p><span className="text-slate-500 mr-1">事業者番号:</span> <span className="font-bold text-slate-700">{member.business_number}</span></p>
                      <p><span className="text-slate-500 mr-1">代表者:</span> <span className="font-bold text-slate-700">{member.representative}</span></p>
                      <p><span className="text-slate-500 mr-1">担当者:</span> <span className="font-bold text-slate-700">{member.mb_name}</span></p>
                      <p><span className="text-slate-500 mr-1">連絡先:</span> <span className="font-bold text-slate-700">{member.mb_hp}</span></p>
                      <p><span className="text-slate-500 mr-1">メール:</span> <span className="font-bold text-slate-700">{member.mb_email}</span></p>
                      {member.company_address && (
                        <p><span className="text-slate-500 mr-1">住所:</span> <span className="font-bold text-slate-700">{member.company_address}</span></p>
                      )}
                    </div>
                    {member.business_license_file && (
                      <div className="mt-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-600 font-semibold">事業者登録証 添付済み</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => setSelectedMember(member)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> 詳細を見る
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => approve({ id: member.mb_id })}
                      disabled={isRejecting || isApproving}
                    >
                      <Check className="w-4 h-4 mr-1" /> 承認
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`${member.company_name}の登録を却下してもよろしいですか？`)) {
                          reject({ id: member.mb_id });
                        }
                      }}
                      disabled={isRejecting || isApproving}
                    >
                      <X className="w-4 h-4 mr-1" /> 却下
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            全取引先 ({allMembers?.total || 0})
          </h3>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <Badge className="bg-red-100 text-red-700 text-sm font-bold">{selectedIds.size}件選択中</Badge>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                onClick={handleBatchDelete}
                disabled={batchDelete.isPending}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {batchDelete.isPending ? "削除中..." : "選択を削除"}
              </Button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600 transition-colors">
                    {selectedIds.size === nonAdminMembers.length && nonAdminMembers.length > 0
                      ? <CheckSquare className="w-5 h-5 text-blue-600" />
                      : <Square className="w-5 h-5" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">会社名 / ID</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">代表者 / 事業者番号</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">担当者情報</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">事業者登録証</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">登録日</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">ステータス</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member: any) => {
                const isSelected = selectedIds.has(member.mb_id);
                return (
                  <tr key={member.mb_id} className={`hover:bg-slate-50/50 ${isSelected ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-4">
                      {member.is_admin ? (
                        <span className="w-5 h-5 block"></span>
                      ) : (
                        <button onClick={() => toggleSelect(member.mb_id)} className="text-slate-400 hover:text-blue-600 transition-colors">
                          {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-900">{member.company_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{member.mb_id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{member.representative}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{member.business_number}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{member.mb_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{member.mb_hp}</p>
                    </td>
                    <td className="px-4 py-4">
                      {member.business_license_file ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                          <FileText className="w-3.5 h-3.5" /> 添付済み
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">なし</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                      {member.mb_datetime ? format(new Date(member.mb_datetime), 'yyyy.MM.dd') : '-'}
                    </td>
                    <td className="px-4 py-4">
                      {member.is_admin ? (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">管理者</Badge>
                      ) : member.is_approved ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">正常</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">待機</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          詳細
                        </button>
                        {!member.is_admin && (
                          <button
                            onClick={() => handleSingleDelete(member)}
                            disabled={deleteMember.isPending}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedMember && (
        <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  );
}
