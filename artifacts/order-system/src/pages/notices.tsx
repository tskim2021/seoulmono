import { useState } from "react";
import { useLocation } from "wouter";
import { useGetNotices, useDeleteNotice, useGetMe, getGetNoticesQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, Button } from "../components/ui";
import { format } from "date-fns";
import { Loader2, Plus, ArrowLeft, Bell, Eye, Trash2, Paperclip, Download, FileText, ImageIcon, X, ZoomIn, Pencil } from "lucide-react";
import { toast } from "../hooks/use-toast";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function useNoticeDetail(id: number | null) {
  return useQuery({
    queryKey: ["notice-detail", id],
    queryFn: () => customFetch<any>(`/api/boards/notice/${id}`),
    enabled: !!id,
  });
}

function getAuthFileUrl(url: string) {
  const token = localStorage.getItem("token");
  if (!token) return url;
  return `${url}?token=${encodeURIComponent(token)}`;
}

function isImageFile(file: any) {
  if (file.isImage !== undefined) return file.isImage;
  const ext = (file.filename || file.originalname || "").toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
  return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(ext);
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2">
        <X className="w-6 h-6" />
      </button>
      <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

export default function Notices() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const { data, isLoading } = useGetNotices({ page: 1, limit: 50 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  const allIds: number[] = (data?.posts || []).map((p: any) => p.wr_id);
  const isAllChecked = allIds.length > 0 && allIds.every((id) => checkedIds.has(id));

  const toggleCheck = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (isAllChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(allIds));
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/boards/notice", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "삭제 실패");
      }
      return res.json();
    },
    onSuccess: (_, ids) => {
      toast({ title: `${ids.length}개 공지사항이 삭제되었습니다` });
      queryClient.invalidateQueries({ queryKey: getGetNoticesQueryKey() });
      setCheckedIds(new Set());
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const handleBulkDelete = (ids: number[], label: string) => {
    if (ids.length === 0) { toast({ title: "선택된 항목이 없습니다", variant: "destructive" }); return; }
    if (!window.confirm(`${label} (${ids.length}개)를 삭제하시겠습니까?`)) return;
    bulkDeleteMutation.mutate(ids);
  };

  const { data: detail, isLoading: detailLoading } = useNoticeDetail(selectedId);

  const { mutate: removeNotice, isPending: isDeleting } = useDeleteNotice({
    mutation: {
      onSuccess: () => {
        toast({ title: "공지사항이 삭제되었습니다" });
        queryClient.invalidateQueries({ queryKey: getGetNoticesQueryKey() });
        setSelectedId(null);
      },
    },
  });

  if (isLoading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  // ── 상세 보기 ───────────────────────────────────────────────────────────────
  if (selectedId && (detail || detailLoading)) {
    if (detailLoading) {
      return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }
    return (
      <div className="animate-in fade-in duration-300 max-w-3xl mx-auto">
        <button onClick={() => setSelectedId(null)} className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          목록으로
        </button>
        <Card className="p-8">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl font-black text-slate-900">{detail.wr_subject}</h2>
            {user?.is_admin && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost" size="sm"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  onClick={() => navigate(`/admin/notices/${selectedId}/edit`)}
                >
                  <Pencil className="w-4 h-4 mr-1" /> 수정
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={isDeleting}
                  onClick={() => { if (window.confirm("이 공지사항을 삭제하시겠습니까?")) removeNotice({ id: selectedId! }); }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {isDeleting ? "삭제 중..." : "삭제"}
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
            <span className="font-bold">{detail.wr_name}</span>
            <span>{detail.wr_datetime ? format(new Date(detail.wr_datetime), 'yyyy.MM.dd HH:mm') : ''}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {detail.wr_hit}</span>
          </div>
          <div
            className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: detail.wr_content }}
          />

          {detail.files && detail.files.length > 0 && (() => {
            const imageFiles = detail.files.filter((f: any) => isImageFile(f));
            const otherFiles = detail.files.filter((f: any) => !isImageFile(f));
            return (
              <div className="mt-6 pt-6 border-t border-slate-100">
                {imageFiles.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" /> 이미지 ({imageFiles.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {imageFiles.map((file: any, idx: number) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer" onClick={() => setLightboxImage({ src: getAuthFileUrl(file.url), alt: file.originalname })}>
                          <img src={getAuthFileUrl(file.url)} alt={file.originalname} className="w-full h-auto max-h-[400px] object-contain" loading="lazy" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
                              <ZoomIn className="w-5 h-5 text-slate-700" />
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
                            <p className="text-xs text-white truncate">{file.originalname}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {otherFiles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4" /> 첨부파일 ({otherFiles.length})
                    </h3>
                    <div className="space-y-2">
                      {otherFiles.map((file: any, idx: number) => (
                        <a key={idx} href={getAuthFileUrl(file.url)} download={file.originalname} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors group">
                          <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600 truncate">{file.originalname}</p>
                            <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                          </div>
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </Card>

        {lightboxImage && (
          <ImageLightbox src={lightboxImage.src} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} />
        )}
      </div>
    );
  }

  // ── 목록 ────────────────────────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">공지사항</h1>
          <p className="text-slate-500 mt-2 font-medium">ソウルモノ의 주요 소식과 공지를 확인하세요.</p>
        </div>
        {user?.is_admin && (
          <Button onClick={() => navigate("/admin/notices/new")}>
            <Plus className="w-4 h-4 mr-1" /> 공지 작성
          </Button>
        )}
      </div>

      {user?.is_admin && data?.posts?.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllChecked}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-slate-300 accent-red-500 cursor-pointer"
            />
            전체 선택 ({checkedIds.size}/{allIds.length})
          </label>
          <div className="flex-1" />
          <button
            onClick={() => handleBulkDelete(Array.from(checkedIds), "선택한 공지사항")}
            disabled={checkedIds.size === 0 || bulkDeleteMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-orange-300 text-orange-600 bg-orange-50 hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            선택 삭제 {checkedIds.size > 0 && `(${checkedIds.size})`}
          </button>
          <button
            onClick={() => handleBulkDelete(allIds, "전체 공지사항")}
            disabled={bulkDeleteMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            일괄 삭제
          </button>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        {!data?.posts?.length ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.posts.map((post: any) => (
              <div key={post.wr_id} className={`flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${checkedIds.has(post.wr_id) ? "bg-red-50/40" : ""}`}>
                {user?.is_admin && (
                  <input
                    type="checkbox"
                    checked={checkedIds.has(post.wr_id)}
                    onChange={() => toggleCheck(post.wr_id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 accent-red-500 cursor-pointer shrink-0"
                  />
                )}
                {/* 클릭 영역 → 상세 */}
                <button onClick={() => setSelectedId(post.wr_id)} className="min-w-0 flex-1 text-left flex gap-4 items-center">
                  {post.images && post.images.length > 0 && (
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={getAuthFileUrl(post.images[0].url)} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 truncate">
                      {post.wr_subject}
                      {post.wr_file > 0 && <Paperclip className="w-3.5 h-3.5 inline-block ml-1.5 text-slate-400" />}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 text-sm text-slate-500">
                      <span>{post.wr_name}</span>
                      <span>{post.wr_datetime ? format(new Date(post.wr_datetime), 'yyyy.MM.dd') : ''}</span>
                      {post.images && post.images.length > 1 && (
                        <span className="flex items-center gap-1 text-blue-500"><ImageIcon className="w-3 h-3" /> {post.images.length}</span>
                      )}
                    </div>
                  </div>
                </button>

                {/* 우측 액션 버튼들 */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-slate-400 mr-2"><Eye className="w-3 h-3" /> {post.wr_hit}</span>
                  {user?.is_admin && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/notices/${post.wr_id}/edit`); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="수정"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (window.confirm("이 공지사항을 삭제하시겠습니까?")) removeNotice({ id: post.wr_id }); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
