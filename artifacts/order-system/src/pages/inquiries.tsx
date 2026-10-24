import { useState, useRef, useMemo, useEffect } from "react";
import { useGetQnaList, useDeleteQna, useGetMe, getGetQnaListQueryKey } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Card, Button, Input, Label, Modal, Badge } from "../components/ui";
import { format } from "date-fns";
import { Loader2, Plus, ArrowLeft, MessageSquare, Send, Trash2, Paperclip, FileText, ImageIcon, Download, X, ZoomIn, Pencil, Check } from "lucide-react";
import { toast } from "../hooks/use-toast";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
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

function useQnaDetail(id: number | null) {
  return useQuery({
    queryKey: ["qna-detail", id],
    queryFn: () => customFetch<any>(`/api/boards/qna/${id}`),
    enabled: !!id,
  });
}

export default function Inquiries() {
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const { data, isLoading } = useGetQnaList({ page: 1, limit: 50 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  const [showEditQna, setShowEditQna] = useState(false);
  const [editQnaSubject, setEditQnaSubject] = useState("");
  const [editQnaContent, setEditQnaContent] = useState("");
  const [editQnaDeleteFiles, setEditQnaDeleteFiles] = useState<string[]>([]);
  const [editQnaNewFiles, setEditQnaNewFiles] = useState<File[]>([]);
  const [editQnaExistingFiles, setEditQnaExistingFiles] = useState<any[]>([]);
  const editQnaFileInputRef = useRef<HTMLInputElement>(null);

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  const filePreviews = useMemo(() => {
    return files.map((f) => {
      const ext = f.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
      const isImg = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(ext);
      return { file: f, isImg, url: isImg ? URL.createObjectURL(f) : null };
    });
  }, [files]);

  const editQnaNewFilePreviews = useMemo(() => {
    return editQnaNewFiles.map((f) => {
      const ext = f.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
      const isImg = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(ext);
      return { file: f, isImg, url: isImg ? URL.createObjectURL(f) : null };
    });
  }, [editQnaNewFiles]);

  useEffect(() => {
    return () => { filePreviews.forEach((p) => { if (p.url) URL.revokeObjectURL(p.url); }); };
  }, [filePreviews]);

  useEffect(() => {
    return () => { editQnaNewFilePreviews.forEach((p) => { if (p.url) URL.revokeObjectURL(p.url); }); };
  }, [editQnaNewFilePreviews]);

  const { data: detail, isLoading: detailLoading } = useQnaDetail(selectedId);

  const createQnaMutation = useMutation({
    mutationFn: async (params: { subject: string; content: string; files: File[] }) => {
      const formData = new FormData();
      formData.append("subject", params.subject);
      formData.append("content", params.content);
      params.files.forEach((f) => formData.append("files", f));
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/boards/qna", { method: "POST", body: formData, headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "등록 실패");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "문의가 등록되었습니다" });
      queryClient.invalidateQueries({ queryKey: getGetQnaListQueryKey() });
      setShowCreate(false);
      setSubject("");
      setContent("");
      setFiles([]);
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const updateQnaMutation = useMutation({
    mutationFn: async (params: { id: number; subject: string; content: string; deleteFiles: string[]; newFiles: File[] }) => {
      const formData = new FormData();
      formData.append("subject", params.subject);
      formData.append("content", params.content);
      formData.append("deleteFiles", JSON.stringify(params.deleteFiles));
      params.newFiles.forEach((f) => formData.append("files", f));
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/boards/qna/${params.id}`, { method: "PUT", body: formData, headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "수정 실패");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "문의글이 수정되었습니다" });
      queryClient.invalidateQueries({ queryKey: getGetQnaListQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["qna-detail", selectedId] });
      setShowEditQna(false);
      setEditQnaNewFiles([]);
      setEditQnaDeleteFiles([]);
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const isPending = createQnaMutation.isPending;

  const { mutate: addComment, isPending: isReplying } = useMutation({
    mutationFn: async (params: { id: number; content: string }) => {
      return customFetch<any>(`/api/boards/qna/${params.id}/comment`, {
        method: "POST",
        body: JSON.stringify({ content: params.content }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "답변이 등록되었습니다" });
      if (selectedId) {
        queryClient.invalidateQueries({ queryKey: ["qna-detail", selectedId] });
        queryClient.invalidateQueries({ queryKey: getGetQnaListQueryKey() });
      }
      setReplyContent("");
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async (params: { id: number; commentId: number; content: string }) => {
      return customFetch<any>(`/api/boards/qna/${params.id}/comment/${params.commentId}`, {
        method: "PUT",
        body: JSON.stringify({ content: params.content }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "답변이 수정되었습니다" });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["qna-detail", selectedId] });
      setEditingCommentId(null);
      setEditCommentContent("");
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (params: { id: number; commentId: number }) => {
      return customFetch<any>(`/api/boards/qna/${params.id}/comment/${params.commentId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "답변이 삭제되었습니다" });
      if (selectedId) {
        queryClient.invalidateQueries({ queryKey: ["qna-detail", selectedId] });
        queryClient.invalidateQueries({ queryKey: getGetQnaListQueryKey() });
      }
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const { mutate: removeQna, isPending: isQnaDeleting } = useDeleteQna({
    mutation: {
      onSuccess: () => {
        toast({ title: "문의글이 삭제되었습니다" });
        queryClient.invalidateQueries({ queryKey: getGetQnaListQueryKey() });
        setSelectedId(null);
      },
    },
  });

  const openEditQna = () => {
    if (!detail) return;
    setEditQnaSubject(detail.wr_subject || "");
    setEditQnaContent(detail.wr_content || "");
    setEditQnaExistingFiles(detail.files || []);
    setEditQnaDeleteFiles([]);
    setEditQnaNewFiles([]);
    setShowEditQna(true);
  };

  const toggleDeleteQnaFile = (filename: string) => {
    setEditQnaDeleteFiles((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    );
  };

  if (isLoading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (selectedId) {
    if (detailLoading) {
      return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }
    if (!detail) {
      return (
        <div className="py-24 text-center">
          <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-slate-900 font-medium">
            <ArrowLeft className="w-4 h-4 mr-1 inline" /> 목록으로
          </button>
          <p className="mt-4 text-slate-500">문의를 찾을 수 없습니다.</p>
        </div>
      );
    }

    const imageFiles = (detail.files || []).filter((f: any) => isImageFile(f));
    const otherFiles = (detail.files || []).filter((f: any) => !isImageFile(f));

    return (
      <div className="animate-in fade-in duration-300 max-w-3xl mx-auto">
        <button onClick={() => setSelectedId(null)} className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> 목록으로
        </button>

        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl font-black text-slate-900">{detail.wr_subject}</h2>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={detail.comments && detail.comments.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                {detail.comments && detail.comments.length > 0 ? "답변완료" : "답변대기"}
              </Badge>
              {user?.is_admin && (
                <>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={openEditQna}>
                    <Pencil className="w-4 h-4 mr-1" /> 수정
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" disabled={isQnaDeleting}
                    onClick={() => { if (window.confirm("이 문의글을 삭제하시겠습니까? 관련 답변도 함께 삭제됩니다.")) removeQna({ id: selectedId! }); }}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    {isQnaDeleting ? "삭제 중..." : "삭제"}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
            <span className="font-bold">{detail.wr_name}</span>
            <span>{detail.wr_datetime ? format(new Date(detail.wr_datetime), 'yyyy.MM.dd HH:mm') : ''}</span>
          </div>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{detail.wr_content}</div>

          {(imageFiles.length > 0 || otherFiles.length > 0) && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              {imageFiles.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> 이미지 ({imageFiles.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {imageFiles.map((file: any, idx: number) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer" onClick={() => setLightboxImage({ src: getAuthFileUrl(file.url), alt: file.originalname })}>
                        <img src={getAuthFileUrl(file.url)} alt={file.originalname} className="w-full h-auto max-h-[400px] object-contain" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg"><ZoomIn className="w-5 h-5 text-slate-700" /></div>
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
                  <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-1.5"><Paperclip className="w-4 h-4" /> 첨부파일 ({otherFiles.length})</h3>
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
          )}
        </Card>

        {detail.comments && detail.comments.length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> 관리자 답변
            </h3>
            {detail.comments.map((c: any) => (
              <Card key={c.wr_id} className="p-6 bg-blue-50/50 border-blue-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-blue-700">{c.wr_name}</span>
                    <span className="text-slate-500">{c.wr_datetime ? format(new Date(c.wr_datetime), 'yyyy.MM.dd HH:mm') : ''}</span>
                  </div>
                  {user?.is_admin && (
                    <div className="flex items-center gap-1 shrink-0">
                      {editingCommentId === c.wr_id ? (
                        <>
                          <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 h-7 px-2"
                            disabled={updateCommentMutation.isPending}
                            onClick={() => updateCommentMutation.mutate({ id: selectedId!, commentId: c.wr_id, content: editCommentContent })}>
                            <Check className="w-3.5 h-3.5 mr-1" /> 저장
                          </Button>
                          <Button size="sm" variant="ghost" className="text-slate-500 hover:text-slate-700 h-7 px-2"
                            onClick={() => { setEditingCommentId(null); setEditCommentContent(""); }}>
                            취소
                          </Button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingCommentId(c.wr_id); setEditCommentContent(c.wr_content); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-colors" title="수정">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (window.confirm("이 답변을 삭제하시겠습니까?")) deleteCommentMutation.mutate({ id: selectedId!, commentId: c.wr_id }); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="삭제"
                            disabled={deleteCommentMutation.isPending}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {editingCommentId === c.wr_id ? (
                  <textarea
                    className="w-full p-3 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all resize-none min-h-[100px] text-sm"
                    value={editCommentContent}
                    onChange={(e) => setEditCommentContent(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <p className="text-slate-700 whitespace-pre-wrap">{c.wr_content}</p>
                )}
              </Card>
            ))}
          </div>
        )}

        {user?.is_admin && (
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 mb-4">답변 작성</h3>
            <textarea
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none min-h-[120px]"
              placeholder="답변을 입력하세요..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={() => addComment({ id: selectedId, content: replyContent })} disabled={isReplying || !replyContent.trim()}>
                <Send className="w-4 h-4 mr-1" />
                {isReplying ? "등록 중..." : "답변 등록"}
              </Button>
            </div>
          </Card>
        )}

        <Modal isOpen={showEditQna} onClose={() => setShowEditQna(false)} title="문의글 수정">
          <div className="space-y-4">
            <div>
              <Label>제목</Label>
              <Input placeholder="문의 제목" value={editQnaSubject} onChange={(e: any) => setEditQnaSubject(e.target.value)} />
            </div>
            <div>
              <Label>내용</Label>
              <textarea
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none min-h-[160px]"
                placeholder="문의 내용을 입력하세요"
                value={editQnaContent}
                onChange={(e) => setEditQnaContent(e.target.value)}
              />
            </div>

            {editQnaExistingFiles.length > 0 && (
              <div>
                <Label>기존 첨부파일</Label>
                <div className="mt-1 space-y-1.5">
                  {editQnaExistingFiles.map((file: any) => {
                    const isImg = isImageFile(file);
                    const willDelete = editQnaDeleteFiles.includes(file.filename);
                    return (
                      <div key={file.filename} className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border transition-all ${willDelete ? "bg-red-50 border-red-200 opacity-60" : "bg-slate-50 border-slate-200"}`}>
                        {isImg ? (
                          <img src={getAuthFileUrl(file.url)} alt={file.originalname} className="w-10 h-10 rounded object-cover shrink-0 border border-slate-200" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={`flex-1 truncate ${willDelete ? "line-through text-slate-400" : "text-slate-700"}`}>{file.originalname}</span>
                        {file.size && <span className="text-xs text-slate-400 shrink-0">{formatFileSize(file.size)}</span>}
                        <button
                          type="button"
                          onClick={() => toggleDeleteQnaFile(file.filename)}
                          className={`shrink-0 p-1 rounded transition-colors ${willDelete ? "text-slate-400 hover:text-slate-600" : "text-red-400 hover:text-red-600"}`}
                          title={willDelete ? "삭제 취소" : "삭제"}
                        >
                          {willDelete ? <Plus className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {editQnaDeleteFiles.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">{editQnaDeleteFiles.length}개 파일이 저장 시 삭제됩니다.</p>
                )}
              </div>
            )}

            <div>
              <Label>새 파일 추가 (최대 5개, 각 20MB)</Label>
              <input
                ref={editQnaFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  setEditQnaNewFiles((prev) => [...prev, ...selected].slice(0, 5));
                  e.target.value = "";
                }}
              />
              <button type="button" onClick={() => editQnaFileInputRef.current?.click()}
                className="mt-1 w-full p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm text-slate-500 flex items-center justify-center gap-2">
                <Paperclip className="w-4 h-4" /> 파일 선택
              </button>
              {editQnaNewFilePreviews.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {editQnaNewFilePreviews.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                      {p.isImg && p.url ? (
                        <img src={p.url} alt={p.file.name} className="w-10 h-10 rounded object-cover shrink-0 border border-blue-200" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                      <span className="flex-1 truncate text-slate-700">{p.file.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">{formatFileSize(p.file.size)}</span>
                      <button type="button" onClick={() => setEditQnaNewFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => { setShowEditQna(false); setEditQnaNewFiles([]); setEditQnaDeleteFiles([]); }}>취소</Button>
              <Button
                onClick={() => updateQnaMutation.mutate({ id: selectedId!, subject: editQnaSubject, content: editQnaContent, deleteFiles: editQnaDeleteFiles, newFiles: editQnaNewFiles })}
                disabled={updateQnaMutation.isPending || !editQnaSubject || !editQnaContent}
              >
                {updateQnaMutation.isPending ? "수정 중..." : "저장하기"}
              </Button>
            </div>
          </div>
        </Modal>

        {lightboxImage && (
          <ImageLightbox src={lightboxImage.src} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">문의하기</h1>
          <p className="text-slate-500 mt-2 font-medium">
            {user?.is_admin ? "파트너사의 문의 내역을 확인하고 답변하세요." : "궁금하신 사항을 문의해주세요."}
          </p>
        </div>
        {!user?.is_admin && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> 문의 작성
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        {!data?.posts?.length ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">등록된 문의가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.posts.map((post: any) => (
              <div key={post.wr_id} className="flex items-start justify-between gap-4 p-5 hover:bg-slate-50 transition-colors">
                <button onClick={() => setSelectedId(post.wr_id)} className="min-w-0 flex-1 text-left flex gap-4">
                  {post.images && post.images.length > 0 && (
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={getAuthFileUrl(post.images[0].url)} alt="" className="w-full h-full object-cover" loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 truncate">
                      {post.wr_subject}
                      {post.wr_file > 0 && <Paperclip className="w-3.5 h-3.5 inline-block ml-1.5 text-slate-400" />}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>{post.wr_name}</span>
                      <span>{post.wr_datetime ? format(new Date(post.wr_datetime), 'yyyy.MM.dd') : ''}</span>
                      {post.images && post.images.length > 1 && (
                        <span className="flex items-center gap-1 text-blue-500"><ImageIcon className="w-3 h-3" /> {post.images.length}</span>
                      )}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-3 shrink-0 pt-1">
                  <Badge className={post.wr_comment > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                    {post.wr_comment > 0 ? "답변완료" : "답변대기"}
                  </Badge>
                  {user?.is_admin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (window.confirm("이 문의글을 삭제하시겠습니까? 관련 답변도 함께 삭제됩니다.")) removeQna({ id: post.wr_id }); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="문의 작성">
        <div className="space-y-4">
          <div>
            <Label>제목</Label>
            <Input placeholder="문의 제목" value={subject} onChange={(e: any) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label>내용</Label>
            <textarea
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none min-h-[200px]"
              placeholder="문의 내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div>
            <Label>첨부파일 (최대 5개, 각 20MB)</Label>
            <input ref={fileInputRef} type="file" multiple className="hidden"
              onChange={(e) => { const selected = Array.from(e.target.files || []); setFiles((prev) => [...prev, ...selected].slice(0, 5)); e.target.value = ""; }} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="mt-1 w-full p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm text-slate-500 flex items-center justify-center gap-2">
              <Paperclip className="w-4 h-4" /> 파일 선택
            </button>
            {filePreviews.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {filePreviews.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                    {p.isImg && p.url ? <img src={p.url} alt={p.file.name} className="w-10 h-10 rounded object-cover shrink-0 border border-slate-200" /> : <FileText className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="flex-1 truncate text-slate-700">{p.file.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">{formatFileSize(p.file.size)}</span>
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => { setShowCreate(false); setFiles([]); }}>취소</Button>
            <Button onClick={() => createQnaMutation.mutate({ subject, content, files })} disabled={isPending || !subject || !content}>
              {isPending ? "등록 중..." : "문의 등록"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
