import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card } from "../components/ui";
import { Loader2, Search, Coins, TrendingUp, TrendingDown, X } from "lucide-react";
import { toast } from "../hooks/use-toast";

type MemberPoint = {
  mb_id: string;
  mb_name: string;
  company_name: string;
  mb_point: number;
};

type PointHistory = {
  po_id: number;
  po_datetime: string;
  po_content: string;
  po_point: number;
  po_use_point: number;
  po_mb_point: number;
  po_expired: number;
};

function PointHistoryModal({ mb_id, onClose }: { mb_id: string; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [pointInput, setPointInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [isGain, setIsGain] = useState(true);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-member-points", mb_id, page],
    queryFn: () => customFetch<{ member: any; history: PointHistory[]; total: number; limit: number }>(
      `/api/admin/members/${encodeURIComponent(mb_id)}/points?page=${page}`
    ),
  });

  const grantMutation = useMutation({
    mutationFn: (body: { point: number; content: string }) =>
      customFetch(`/api/admin/members/${encodeURIComponent(mb_id)}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (res: any) => {
      toast({ title: `포인트 ${isGain ? "지급" : "차감"} 완료 — 현재 잔액: ${Number(res.new_point).toLocaleString()}P` });
      setPointInput("");
      setContentInput("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-points"] });
    },
    onError: (err: any) => toast({ title: err?.message || "처리 실패", variant: "destructive" }),
  });

  const handleGrant = () => {
    const pointNum = Number(pointInput);
    if (!pointNum || pointNum <= 0) {
      toast({ title: "포인트 금액을 입력해주세요", variant: "destructive" });
      return;
    }
    if (!contentInput.trim()) {
      toast({ title: "내용을 입력해주세요", variant: "destructive" });
      return;
    }
    const finalPoint = isGain ? pointNum : -pointNum;
    grantMutation.mutate({ point: finalPoint, content: contentInput.trim() });
  };

  const member = data?.member;
  const history = data?.history || [];
  const total = data?.total || 0;
  const limit = data?.limit || 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {member?.company_name || mb_id} 포인트 내역
            </h2>
            {member && (
              <p className="text-sm text-slate-500 mt-0.5">
                {mb_id} ({member.mb_name})
                <span className="ml-3 text-amber-600 font-bold">현재 {member.mb_point.toLocaleString()}P 보유</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 border-b bg-slate-50">
          <p className="text-sm font-bold text-slate-700 mb-3">포인트 지급/차감</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex rounded-lg border overflow-hidden">
              <button onClick={() => setIsGain(true)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${isGain ? "bg-emerald-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                지급
              </button>
              <button onClick={() => setIsGain(false)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${!isGain ? "bg-red-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                차감
              </button>
            </div>
            <input
              type="number" min="1" placeholder="포인트 금액"
              value={pointInput}
              onChange={e => setPointInput(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm w-32"
            />
            <input
              type="text" placeholder="내용 (예: 이벤트 지급)"
              value={contentInput}
              onChange={e => setContentInput(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-40"
            />
            <button onClick={handleGrant} disabled={grantMutation.isPending}
              className={`px-4 py-2 text-sm font-bold rounded-lg text-white transition-colors disabled:opacity-60 ${isGain ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
              {grantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isGain ? "지급" : "차감")}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400">포인트 내역이 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {history.map(h => {
                const isGainRow = h.po_point > 0;
                const amount = isGainRow ? h.po_point : h.po_use_point;
                return (
                  <div key={h.po_id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isGainRow ? "bg-emerald-100" : "bg-red-100"}`}>
                        {isGainRow ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{h.po_content || "-"}</p>
                        <p className="text-xs text-slate-400">{h.po_datetime?.slice(0, 16) || ""}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold ${isGainRow ? "text-emerald-600" : "text-red-500"}`}>
                        {isGainRow ? "+" : "-"}{amount.toLocaleString()}P
                      </p>
                      <p className="text-xs text-slate-400">{h.po_mb_point.toLocaleString()}P</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-40 hover:bg-slate-50">이전</button>
              <span className="px-3 py-1.5 text-sm font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-40 hover:bg-slate-50">다음</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPoints() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMbId, setSelectedMbId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-points", search, page],
    queryFn: () => customFetch<{ members: MemberPoint[]; total: number; limit: number }>(
      `/api/admin/points?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    ),
  });

  const members = data?.members || [];
  const total = data?.total || 0;
  const limit = data?.limit || 30;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">포인트 관리</h1>
        <p className="text-slate-500 mt-2 font-medium">회원별 포인트 현황을 확인하고 지급/차감할 수 있습니다.</p>
      </div>

      <Card className="p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm"
              placeholder="아이디, 이름, 업체명으로 검색"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit"
            className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">
            검색
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-4 py-2.5 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              초기화
            </button>
          )}
        </form>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center">
            <Coins className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">업체명</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">아이디 / 이름</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">보유 포인트</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map(m => (
                    <tr key={m.mb_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{m.company_name || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="font-mono text-slate-700">{m.mb_id}</span>
                        {m.mb_name && <span className="ml-2 text-slate-500">/ {m.mb_name}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold text-base ${m.mb_point > 0 ? "text-amber-600" : "text-slate-400"}`}>
                          {m.mb_point.toLocaleString()}P
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedMbId(m.mb_id)}
                          className="px-3 py-1.5 text-sm font-medium border rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
                        >
                          내역/지급
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t bg-slate-50 flex items-center justify-between">
              <span className="text-sm text-slate-500">총 {total}명</span>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-40 hover:bg-white">이전</button>
                  <span className="px-3 py-1.5 text-sm font-medium">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-40 hover:bg-white">다음</button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {selectedMbId && (
        <PointHistoryModal mb_id={selectedMbId} onClose={() => setSelectedMbId(null)} />
      )}
    </div>
  );
}
