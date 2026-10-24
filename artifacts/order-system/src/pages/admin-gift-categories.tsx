import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card } from "../components/ui";
import { cn } from "../lib/utils";
import { toast } from "../hooks/use-toast";
import {
  Gift, Plus, X, Loader2, Pencil, Trash2, Tag, Save, AlertTriangle, FolderTree,
} from "lucide-react";

const MAIN_CATS = [
  { ca_id: "10", label: "과자류", emoji: "🍪", desc: "과자/스낵/파이 선물세트" },
  { ca_id: "20", label: "유지류", emoji: "🫙", desc: "식용유/참기름/들기름 선물세트" },
  { ca_id: "30", label: "통조림/캔", emoji: "🥫", desc: "참치/햄/캔 선물세트" },
];

function useGiftCategories() {
  return useQuery({
    queryKey: ["admin-gift-categories"],
    queryFn: () => customFetch<any[]>("/api/shop-admin/gift/categories"),
  });
}

function AddModal({
  parentCaId,
  parentLabel,
  onClose,
  onSaved,
}: {
  parentCaId: string;
  parentLabel: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: () =>
      customFetch("/api/shop-admin/gift/categories", {
        method: "POST",
        body: JSON.stringify({ parent_ca_id: parentCaId, ca_name: name.trim() }),
      }),
    onSuccess: () => {
      toast({ title: "카테고리 추가 완료" });
      queryClient.invalidateQueries({ queryKey: ["admin-gift-categories"] });
      onSaved();
    },
    onError: (e: any) => toast({ title: "추가 실패: " + (e.message ?? ""), variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-black text-slate-900">서브카테고리 추가</p>
            <p className="text-xs text-slate-500">{parentLabel} 하위에 추가됩니다</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">카테고리명 *</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && addMutation.mutate()}
            placeholder="예: 스낵류 12개입, 파이류 6개입"
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-slate-400 mt-1">형식: [종류] [수량]개입 (예: 스낵류 6개입)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            취소
          </button>
          <button
            onClick={() => addMutation.mutate()}
            disabled={!name.trim() || addMutation.isPending}
            className="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  sub,
  onClose,
  onSaved,
}: {
  sub: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(sub.ca_name);
  const queryClient = useQueryClient();

  const editMutation = useMutation({
    mutationFn: () =>
      customFetch(`/api/shop-admin/gift/categories/${sub.ca_id}`, {
        method: "PUT",
        body: JSON.stringify({ ca_name: name.trim() }),
      }),
    onSuccess: () => {
      toast({ title: "카테고리 수정 완료" });
      queryClient.invalidateQueries({ queryKey: ["admin-gift-categories"] });
      onSaved();
    },
    onError: (e: any) => toast({ title: "수정 실패: " + (e.message ?? ""), variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Pencil className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-black text-slate-900">카테고리 수정</p>
            <p className="text-xs text-slate-500">ca_id: {sub.ca_id}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">카테고리명 *</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && editMutation.mutate()}
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            취소
          </button>
          <button
            onClick={() => editMutation.mutate()}
            disabled={!name.trim() || editMutation.isPending}
            className="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  sub,
  onClose,
  onDeleted,
}: {
  sub: any;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () =>
      customFetch(`/api/shop-admin/gift/categories/${sub.ca_id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "카테고리 삭제 완료" });
      queryClient.invalidateQueries({ queryKey: ["admin-gift-categories"] });
      onDeleted();
    },
    onError: (e: any) => toast({ title: "삭제 실패: " + (e.message ?? ""), variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-black text-slate-900">카테고리 삭제</p>
            <p className="text-xs text-slate-500">연결된 세트 상품도 함께 삭제됩니다</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
          <strong className="text-slate-900">{sub.ca_name}</strong>
          <span className="text-slate-400 ml-2 text-xs">(ca_id: {sub.ca_id})</span>
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            취소
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex-1 h-9 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 flex items-center justify-center gap-1.5"
          >
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminGiftCategories() {
  const [activeMain, setActiveMain] = useState("10");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: categories = [], isLoading } = useGiftCategories();
  const catList = categories as any[];
  const currentMain = catList.find((c: any) => c.ca_id === activeMain);
  const subList: any[] = currentMain?.sub_categories ?? [];
  const mainInfo = MAIN_CATS.find(m => m.ca_id === activeMain)!;

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">선물하기 카테고리</h1>
          <p className="text-slate-500 mt-1 font-medium">선물세트의 대분류·소분류 카테고리를 관리합니다.</p>
        </div>
      </div>

      {/* 대분류 안내 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {MAIN_CATS.map(m => (
          <button
            key={m.ca_id}
            onClick={() => setActiveMain(m.ca_id)}
            className={cn(
              "p-4 rounded-2xl border-2 text-left transition-all",
              activeMain === m.ca_id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div className="text-2xl mb-2">{m.emoji}</div>
            <p className={cn("font-black text-base", activeMain === m.ca_id ? "text-primary" : "text-slate-800")}>
              {m.label}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              ca_id: {m.ca_id} <span className="text-slate-300 mx-1">|</span>
              <span className="text-primary font-bold">
                {catList.find(c => c.ca_id === m.ca_id)?.sub_categories?.length ?? 0}개 소분류
              </span>
            </p>
          </button>
        ))}
      </div>

      {/* 소분류 관리 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderTree className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-black text-slate-900">
                {mainInfo.emoji} {mainInfo.label} 소분류
              </p>
              <p className="text-xs text-slate-400">
                대분류 ca_id: {activeMain} → 소분류 ca_id: {activeMain}10, {activeMain}20, ...
              </p>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 h-9 px-4 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> 소분류 추가
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : subList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
            <Tag className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-400 font-medium">등록된 소분류가 없습니다</p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-3 text-sm text-primary font-bold hover:underline"
            >
              소분류 추가하기 →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {subList.map((sub: any) => (
              <div
                key={sub.ca_id}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{sub.ca_name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">ca_id: <strong className="text-slate-600">{sub.ca_id}</strong></span>
                    <span className="text-xs text-slate-400">구성 수: <strong className="text-primary">{sub.slot_count}개</strong></span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      sub.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                    )}>
                      {sub.is_active ? "활성" : "비활성"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditTarget(sub)}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-500 hover:border-blue-300 flex items-center justify-center transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(sub)}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-500 hover:border-red-300 flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 안내 박스 */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-1">
        <p className="font-bold">📌 카테고리 구조 안내</p>
        <p>• 대분류(과자류/유지류/통조림캔류)는 고정이며 삭제·추가 불가합니다.</p>
        <p>• 소분류 추가 시 ca_id가 자동 생성됩니다 (예: 과자류 → 1010, 1020, 1030...)</p>
        <p>• 소분류 삭제 시 해당 세트 구성 정보도 함께 삭제됩니다.</p>
        <p>• 소분류의 구성 수 · 가격 등은 <strong>선물하기 관리 → 세트 구성</strong> 탭에서 설정합니다.</p>
      </div>

      {addOpen && (
        <AddModal
          parentCaId={activeMain}
          parentLabel={mainInfo.label}
          onClose={() => setAddOpen(false)}
          onSaved={() => setAddOpen(false)}
        />
      )}
      {editTarget && (
        <EditModal
          sub={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          sub={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
