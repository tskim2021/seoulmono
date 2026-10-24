import { useState, useRef, type ReactNode, type CSSProperties } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, Badge, Button, Input, Label, Modal } from "../components/ui";
import {
  Loader2, Plus, FolderTree, ChevronDown, ChevronRight, GripVertical,
  ImagePlus, X,
} from "lucide-react";
import { toast } from "../hooks/use-toast";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => customFetch<any>("/api/admin/categories"),
  });
}

function sortedByOrder(arr: any[]) {
  return [...arr].sort(
    (a, b) => Number(a.ca_order) - Number(b.ca_order) || a.ca_id.localeCompare(b.ca_id)
  );
}

function buildTree(categories: any[]) {
  const level1: any[] = [];
  const level2Map: Record<string, any[]> = {};
  const level3Map: Record<string, any[]> = {};

  for (const c of categories) {
    const len = c.ca_id.length;
    if (len === 2) level1.push({ ...c, children: [] });
    else if (len === 4) {
      const p = c.ca_id.substring(0, 2);
      if (!level2Map[p]) level2Map[p] = [];
      level2Map[p].push({ ...c, children: [] });
    } else if (len === 6) {
      const p = c.ca_id.substring(0, 4);
      if (!level3Map[p]) level3Map[p] = [];
      level3Map[p].push(c);
    }
  }

  for (const pid of Object.keys(level2Map)) {
    for (const child of level2Map[pid]) {
      child.children = sortedByOrder(level3Map[child.ca_id] || []);
    }
  }
  for (const cat of level1) {
    cat.children = sortedByOrder(level2Map[cat.ca_id] || []);
  }
  return sortedByOrder(level1);
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (dragHandle: ReactNode, isDragging: boolean) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: "relative",
  };
  const handle = (
    <button
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0 touch-none p-1"
      tabIndex={-1}
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );
  return (
    <div ref={setNodeRef} style={style}>
      {children(handle, isDragging)}
    </div>
  );
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminCategories();
  const categories = data?.categories || [];
  const tree = buildTree(categories);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editModal, setEditModal] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createParentId, setCreateParentId] = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const imgFileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveMutation = useMutation({
    mutationFn: (cat: any) => {
      if (isCreating) {
        return customFetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cat),
        });
      }
      return customFetch(`/api/admin/categories/${cat.ca_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
    },
    onSuccess: () => {
      toast({ title: isCreating ? "카테고리 등록 완료" : "카테고리 수정 완료" });
      setEditModal(null);
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (err: any) => {
      toast({ title: "오류", description: err?.message || "처리 실패", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customFetch(`/api/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "카테고리 삭제 완료" });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (err: any) => {
      toast({ title: "삭제 실패", description: err?.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { ca_id: string; ca_order: number }[]) =>
      customFetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (err: any) => {
      toast({ title: "순서 변경 실패", description: err?.message, variant: "destructive" });
    },
  });

  const handleDragEnd = (event: DragEndEvent, siblings: any[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sorted = sortedByOrder(siblings);
    const oldIdx = sorted.findIndex((s) => s.ca_id === active.id);
    const newIdx = sorted.findIndex((s) => s.ca_id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(sorted, oldIdx, newIdx);
    const items = reordered.map((s, i) => ({ ca_id: s.ca_id, ca_order: i * 10 }));
    reorderMutation.mutate(items);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = (cat: any) => {
    if (!confirm(`"${cat.ca_name}" 카테고리를 삭제하시겠습니까?`)) return;
    deleteMutation.mutate(cat.ca_id);
  };

  const getNextCategoryId = (parentId: string, allCategories: any[]) => {
    const prefix = String(parentId || "").toLowerCase();
    const childLen = prefix.length + 2;
    const siblings = allCategories
      .map((c: any) => String(c.ca_id || "").toLowerCase())
      .filter((id: string) => id.length === childLen && id.startsWith(prefix));
    const suffixes = siblings
      .map((id: string) => parseInt(id.slice(-2), 16))
      .filter((n: number) => !isNaN(n));
    const maxVal = suffixes.length > 0 ? Math.max(...suffixes) : 0;
    const nextVal = suffixes.length > 0 ? maxVal + 0x10 : 0x10;
    return `${prefix}${nextVal.toString(16).padStart(2, "0")}`;
  };

  const openCreate = (parentId: string = "") => {
    setIsCreating(true);
    setCreateParentId(parentId);
    setEditModal({ ca_id: getNextCategoryId(parentId, categories), ca_name: "", ca_use: "1", ca_order: 0 });
  };

  const openEdit = (cat: any) => {
    setIsCreating(false);
    setEditModal({ ...cat });
  };

  const handleSave = () => {
    const finalId = String(editModal?.ca_id || "").trim().toLowerCase();
    if (!finalId) {
      toast({ title: "오류", description: "카테고리 코드가 없습니다", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ ...editModal, ca_id: finalId });
  };

  const handleImgUpload = async (file: File) => {
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/admin/categories/upload-image", { method: "POST", body: form });
      if (!res.ok) throw new Error("업로드 실패");
      const { url } = await res.json();
      setEditModal((m: any) => ({ ...m, ca_img: url }));
    } catch {
      toast({ title: "이미지 업로드 실패", variant: "destructive" });
    } finally {
      setImgUploading(false);
    }
  };

  if (isLoading)
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">카테고리 관리</h1>
          <p className="text-slate-500 mt-1 font-medium">
            상품 카테고리를 관리합니다. 총 {categories.length}개
          </p>
        </div>
        <Button onClick={() => openCreate("")} className="h-10">
          <Plus className="w-4 h-4 mr-1.5" /> 1차 카테고리 추가
        </Button>
      </div>

      {tree.length === 0 ? (
        <Card className="py-20 text-center">
          <FolderTree className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">카테고리가 없습니다</h3>
        </Card>
      ) : (
        <div className="space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, tree)}
          >
            <SortableContext items={tree.map((c) => c.ca_id)} strategy={verticalListSortingStrategy}>
              {tree.map((cat1: any) => (
                <SortableRow key={cat1.ca_id} id={cat1.ca_id}>
                  {(handle) => (
                    <Card className="p-0 overflow-hidden">
                      <div className="flex items-center gap-1 px-3 py-4 hover:bg-slate-50/50 transition-colors">
                        {handle}
                        <button onClick={() => toggleExpand(cat1.ca_id)} className="text-slate-400 shrink-0">
                          {cat1.children.length > 0 ? (
                            expanded.has(cat1.ca_id) ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )
                          ) : (
                            <div className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex items-center gap-2 flex-1 min-w-0 ml-1">
                          <Badge className="bg-blue-100 text-blue-700 text-[10px] shrink-0">1차</Badge>
                          <span className="font-bold text-slate-900">{cat1.ca_name}</span>
                          <span className="text-xs text-slate-400 font-mono">{cat1.ca_id}</span>
                          {cat1.ca_use !== "1" && (
                            <Badge className="bg-slate-100 text-slate-500 text-[10px]">숨김</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openCreate(cat1.ca_id)}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold px-2 py-1"
                          >
                            +하위
                          </button>
                          <button
                            onClick={() => openEdit(cat1)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(cat1)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {expanded.has(cat1.ca_id) && cat1.children.length > 0 && (
                        <div className="border-t border-slate-100">
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleDragEnd(e, cat1.children)}
                          >
                            <SortableContext
                              items={cat1.children.map((c: any) => c.ca_id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {cat1.children.map((cat2: any) => (
                                <SortableRow key={cat2.ca_id} id={cat2.ca_id}>
                                  {(handle2) => (
                                    <div>
                                      <div className="flex items-center gap-1 px-3 py-3 pl-9 hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                        {handle2}
                                        <button
                                          onClick={() => toggleExpand(cat2.ca_id)}
                                          className="text-slate-400 shrink-0"
                                        >
                                          {cat2.children.length > 0 ? (
                                            expanded.has(cat2.ca_id) ? (
                                              <ChevronDown className="w-4 h-4" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4" />
                                            )
                                          ) : (
                                            <div className="w-4 h-4" />
                                          )}
                                        </button>
                                        <div className="flex items-center gap-2 flex-1 min-w-0 ml-1">
                                          <Badge className="bg-green-100 text-green-700 text-[10px] shrink-0">
                                            2차
                                          </Badge>
                                          <span className="font-bold text-slate-800 text-sm">
                                            {cat2.ca_name}
                                          </span>
                                          <span className="text-xs text-slate-400 font-mono">
                                            {cat2.ca_id}
                                          </span>
                                          {cat2.ca_use !== "1" && (
                                            <Badge className="bg-slate-100 text-slate-500 text-[10px]">
                                              숨김
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => openCreate(cat2.ca_id)}
                                            className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold px-2 py-1"
                                          >
                                            +하위
                                          </button>
                                          <button
                                            onClick={() => openEdit(cat2)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1"
                                          >
                                            수정
                                          </button>
                                          <button
                                            onClick={() => handleDelete(cat2)}
                                            className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1"
                                          >
                                            삭제
                                          </button>
                                        </div>
                                      </div>

                                      {expanded.has(cat2.ca_id) && cat2.children.length > 0 && (
                                        <DndContext
                                          sensors={sensors}
                                          collisionDetection={closestCenter}
                                          onDragEnd={(e) => handleDragEnd(e, cat2.children)}
                                        >
                                          <SortableContext
                                            items={cat2.children.map((c: any) => c.ca_id)}
                                            strategy={verticalListSortingStrategy}
                                          >
                                            {cat2.children.map((cat3: any) => (
                                              <SortableRow key={cat3.ca_id} id={cat3.ca_id}>
                                                {(handle3) => (
                                                  <div className="flex items-center gap-1 px-3 py-2.5 pl-16 hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                                    {handle3}
                                                    <div className="w-4 h-4 shrink-0" />
                                                    <div className="flex items-center gap-2 flex-1 min-w-0 ml-1">
                                                      <Badge className="bg-amber-100 text-amber-700 text-[10px] shrink-0">
                                                        3차
                                                      </Badge>
                                                      <span className="text-sm text-slate-700">
                                                        {cat3.ca_name}
                                                      </span>
                                                      <span className="text-xs text-slate-400 font-mono">
                                                        {cat3.ca_id}
                                                      </span>
                                                      {cat3.ca_use !== "1" && (
                                                        <Badge className="bg-slate-100 text-slate-500 text-[10px]">
                                                          숨김
                                                        </Badge>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                      <button
                                                        onClick={() => openEdit(cat3)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1"
                                                      >
                                                        수정
                                                      </button>
                                                      <button
                                                        onClick={() => handleDelete(cat3)}
                                                        className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1"
                                                      >
                                                        삭제
                                                      </button>
                                                    </div>
                                                  </div>
                                                )}
                                              </SortableRow>
                                            ))}
                                          </SortableContext>
                                        </DndContext>
                                      )}
                                    </div>
                                  )}
                                </SortableRow>
                              ))}
                            </SortableContext>
                          </DndContext>
                        </div>
                      )}
                    </Card>
                  )}
                </SortableRow>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      <Modal
        isOpen={!!editModal}
        onClose={() => {
          setEditModal(null);
          setIsCreating(false);
        }}
        title={isCreating ? "카테고리 등록" : "카테고리 수정"}
      >
        {editModal && (
          <div className="space-y-4">
            {isCreating && createParentId && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-sm">
                <span className="text-blue-600 font-bold">상위 카테고리: </span>
                <span className="text-blue-800">
                  {categories.find((c: any) => c.ca_id === createParentId)?.ca_name || createParentId}
                </span>
              </div>
            )}
            <div>
              <Label>카테고리 코드</Label>
              <Input value={editModal.ca_id} disabled className="bg-slate-50" />
              <p className="text-xs text-slate-400 mt-1">자동 생성됩니다.</p>
            </div>
            <div>
              <Label>카테고리명 *</Label>
              <Input
                value={editModal.ca_name}
                onChange={(e: any) => setEditModal((m: any) => ({ ...m, ca_name: e.target.value }))}
                placeholder="카테고리 이름"
              />
            </div>

            {/* 대표 이미지 */}
            <div>
              <Label>대표 이미지</Label>
              <input
                type="file"
                accept="image/*"
                ref={imgFileRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImgUpload(file);
                  e.target.value = "";
                }}
              />
              {editModal.ca_img ? (
                <div className="relative mt-2 inline-block">
                  <img
                    src={editModal.ca_img}
                    alt="대표 이미지"
                    className="w-28 h-28 object-cover rounded-xl border-2 border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setEditModal((m: any) => ({ ...m, ca_img: "" }))}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => imgFileRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                    title="이미지 교체"
                  >
                    <ImagePlus size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imgFileRef.current?.click()}
                  disabled={imgUploading}
                  className="mt-2 w-full h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary disabled:opacity-50"
                >
                  {imgUploading ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <ImagePlus size={22} />
                  )}
                  <span className="text-xs font-medium">
                    {imgUploading ? "업로드 중..." : "이미지 클릭하여 업로드"}
                  </span>
                </button>
              )}
              <p className="text-xs text-slate-400 mt-1">카테고리 목록 등에 표시되는 대표 이미지입니다.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>정렬순서</Label>
                <Input
                  type="number"
                  value={editModal.ca_order}
                  onChange={(e: any) =>
                    setEditModal((m: any) => ({ ...m, ca_order: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <Label>사용여부</Label>
                <select
                  className="w-full h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
                  value={editModal.ca_use}
                  onChange={(e) => setEditModal((m: any) => ({ ...m, ca_use: e.target.value }))}
                >
                  <option value="1">사용</option>
                  <option value="0">숨김</option>
                </select>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditModal(null);
                  setIsCreating(false);
                }}
              >
                취소
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "저장 중..." : isCreating ? "등록" : "수정 완료"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
