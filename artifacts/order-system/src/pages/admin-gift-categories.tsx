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
  { ca_id: "10", label: "お菓子類", emoji: "🍪", desc: "お菓子・スナック・パイのギフトセット" },
  { ca_id: "20", label: "食用油類", emoji: "🫙", desc: "食用油・ごま油・えごま油のギフトセット" },
  { ca_id: "30", label: "缶詰・缶類", emoji: "🥫", desc: "ツナ・ハム・缶詰のギフトセット" },
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
      toast({ title: "カテゴリを追加しました" });
      queryClient.invalidateQueries({ queryKey: ["admin-gift-categories"] });
      onSaved();
    },
    onError: (e: any) => toast({ title: "追加に失敗しました: " + (e.message ?? ""), variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-black text-slate-900">サブカテゴリの追加</p>
            <p className="text-xs text-slate-500">{parentLabel} の下に追加されます</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">カテゴリ名 *</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && addMutation.mutate()}
            placeholder="例: 스낵류 12개입, 파이류 6개입 (「○○ N개입」形式)"
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-slate-400 mt-1">形式: [種類] [数量]개입 (例: 스낵류 6개입) ※「개입」(〜個入り)の表記は固定です</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            キャンセル
          </button>
          <button
            onClick={() => addMutation.mutate()}
            disabled={!name.trim() || addMutation.isPending}
            className="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            追加
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
      toast({ title: "カテゴリを更新しました" });
      queryClient.invalidateQueries({ queryKey: ["admin-gift-categories"] });
      onSaved();
    },
    onError: (e: any) => toast({ title: "更新に失敗しました: " + (e.message ?? ""), variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Pencil className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-black text-slate-900">カテゴリの編集</p>
            <p className="text-xs text-slate-500">ca_id: {sub.ca_id}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">カテゴリ名 *</label>
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
            キャンセル
          </button>
          <button
            onClick={() => editMutation.mutate()}
            disabled={!name.trim() || editMutation.isPending}
            className="flex-1 h-9 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
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
      toast({ title: "カテゴリを削除しました" });
      queryClient.invalidateQueries({ queryKey: ["admin-gift-categories"] });
      onDeleted();
    },
    onError: (e: any) => toast({ title: "削除に失敗しました: " + (e.message ?? ""), variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-black text-slate-900">カテゴリの削除</p>
            <p className="text-xs text-slate-500">関連するセット商品も一緒に削除されます</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
          <strong className="text-slate-900">{sub.ca_name}</strong>
          <span className="text-slate-400 ml-2 text-xs">(ca_id: {sub.ca_id})</span>
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            キャンセル
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex-1 h-9 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 flex items-center justify-center gap-1.5"
          >
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            削除
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ギフトカテゴリ</h1>
          <p className="text-slate-500 mt-1 font-medium">ギフトセットの大分類・小分類カテゴリを管理します。</p>
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
                {catList.find(c => c.ca_id === m.ca_id)?.sub_categories?.length ?? 0}件の小分類
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
                {mainInfo.emoji} {mainInfo.label} の小分類
              </p>
              <p className="text-xs text-slate-400">
                大分類 ca_id: {activeMain} → 小分類 ca_id: {activeMain}10, {activeMain}20, ...
              </p>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 h-9 px-4 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> 小分類を追加
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : subList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
            <Tag className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-400 font-medium">登録された小分類がありません</p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-3 text-sm text-primary font-bold hover:underline"
            >
              小分類を追加する →
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
                    <span className="text-xs text-slate-400">構成数: <strong className="text-primary">{sub.slot_count}件</strong></span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      sub.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                    )}>
                      {sub.is_active ? "有効" : "無効"}
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
        <p className="font-bold">📌 カテゴリ構成のご案内</p>
        <p>• 大分類(お菓子類/食用油類/缶詰類)は固定で、削除・追加はできません。</p>
        <p>• 小分類を追加すると ca_id が自動生成されます (例: お菓子類 → 1010, 1020, 1030...)</p>
        <p>• 小分類を削除すると、該当するセット構成情報も一緒に削除されます。</p>
        <p>• 小分類の構成数・価格などは <strong>ギフト管理 → セット構成</strong> タブで設定します。</p>
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
