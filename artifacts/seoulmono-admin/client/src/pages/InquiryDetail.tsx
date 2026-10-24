import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import MyPageLayout from "@/components/MyPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MessageSquare, MessageSquareText, User, Calendar, Image as ImageIcon, Bell, CheckCircle2, Clock, ImagePlus, X, Loader2, Pencil, Save, Zap, UserCheck } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";

const MAX_REPLY_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed whitespace-pre-wrap">
      {lines.map((line, i) => {
        if (line.startsWith("###")) return <p key={i} className="font-semibold mt-2">{line.replace(/^###\s*/, "")}</p>;
        if (line.startsWith("##")) return <p key={i} className="font-semibold mt-2">{line.replace(/^##\s*/, "")}</p>;
        if (line.startsWith("#")) return <p key={i} className="font-bold mt-2">{line.replace(/^#\s*/, "")}</p>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

function useImageUploader(initialImages: string[] = []) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = trpc.upload.uploadInquiryImage.useMutation();

  const resetImages = useCallback((newImages: string[]) => setImages(newImages), []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = MAX_REPLY_IMAGES - images.length;
    if (remainingSlots <= 0) { toast.error(`이미지는 최대 ${MAX_REPLY_IMAGES}장까지 첨부할 수 있습니다.`); return; }
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    for (const file of filesToUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) { toast.error(`${file.name}: 이미지 파일만 업로드할 수 있습니다.`); return; }
      if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name}: 10MB를 초과할 수 없습니다.`); return; }
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of filesToUpload) {
        const base64 = await fileToBase64(file);
        const r = await uploadImage.mutateAsync({ filename: file.name, contentType: file.type, base64Data: base64 });
        urls.push(r.url);
      }
      setImages(prev => [...prev, ...urls]);
    } catch { toast.error("이미지 업로드에 실패했습니다."); }
    finally { setUploading(false); if (e.target) e.target.value = ""; }
  }, [images.length, uploadImage]);

  const removeImage = useCallback((index: number) => setImages(prev => prev.filter((_, i) => i !== index)), []);

  return { images, uploading, fileInputRef, handleFileSelect, removeImage, resetImages };
}

function ImageUploadSection({ images, uploading, fileInputRef, handleFileSelect, removeImage, inputId }: {
  images: string[];
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  inputId: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-sm text-muted-foreground mb-2">스크린샷이나 안내 이미지를 첨부할 수 있습니다. (최대 {MAX_REPLY_IMAGES}장, 각 10MB 이하)</p>
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {images.map((url, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
              <img src={url} alt={`첨부 이미지 ${index + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {images.length < MAX_REPLY_IMAGES && (
        <div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={handleFileSelect} className="hidden" id={inputId} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />업로드 중...</> : <><ImagePlus className="w-4 h-4 mr-2" />이미지 첨부 ({images.length}/{MAX_REPLY_IMAGES})</>}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function InquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const isAdmin = user?.role === "admin";

  useSEO({ title: "1:1 문의 상세", description: "탈모학교 1:1 문의 상세 페이지", noindex: true });

  const { data: post, isLoading, refetch } = trpc.community.postById.useQuery({ id: Number(id) });
  const { data: adminReplies, refetch: refetchAdminReplies } = trpc.admin.getInquiryReplies.useQuery(
    { postId: Number(id) },
    { enabled: isAdmin }
  );
  const { data: userReplies, refetch: refetchUserReplies } = trpc.community.getMyInquiryReplies.useQuery(
    { postId: Number(id) },
    { enabled: !isAdmin }
  );
  const replies = isAdmin ? adminReplies : userReplies;
  const refetchReplies = () => { refetchAdminReplies(); refetchUserReplies(); };

  const newReplyUploader = useImageUploader([]);
  const editReplyUploader = useImageUploader([]);

  const createReply = trpc.admin.createInquiryReply.useMutation({
    onSuccess: () => {
      toast.success("답변이 등록되었습니다. 문의자에게 알림이 발송됩니다.");
      setReplyContent("");
      newReplyUploader.resetImages([]);
      refetch();
      refetchReplies();
    },
    onError: (e) => toast.error(e.message || "답변 등록에 실패했습니다."),
  });

  const updateReply = trpc.admin.updateInquiryReply.useMutation({
    onSuccess: () => {
      toast.success("답변이 수정되었습니다.");
      setEditingReplyId(null);
      setEditContent("");
      editReplyUploader.resetImages([]);
      refetchReplies();
    },
    onError: (e) => toast.error(e.message || "답변 수정에 실패했습니다."),
  });

  const requestHuman = trpc.community.requestHumanAgent.useMutation({
    onSuccess: () => {
      toast.success("상담사 답변이 요청되었습니다. 영업일 1일 이내 답변드립니다.");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) { toast.error("답변 내용을 입력해주세요."); return; }
    await createReply.mutateAsync({
      postId: Number(id),
      content: replyContent,
      attachments: newReplyUploader.images.length > 0 ? newReplyUploader.images : undefined,
    });
  };

  const handleStartEdit = (reply: any) => {
    setEditingReplyId(reply.id);
    setEditContent(reply.content);
    editReplyUploader.resetImages((reply.attachments as string[] | null | undefined) ?? []);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editingReplyId === null) return;
    await updateReply.mutateAsync({
      id: editingReplyId,
      content: editContent,
      attachments: editReplyUploader.images.length > 0 ? editReplyUploader.images : null,
    });
  };

  if (isLoading) return <MyPageLayout title="1:1 문의 상세"><div className="py-8 text-center">로딩 중...</div></MyPageLayout>;
  if (!post) return <MyPageLayout title="1:1 문의 상세"><div className="py-8 text-center">문의를 찾을 수 없습니다.</div></MyPageLayout>;

  const isAuthor = user?.id === post.userId;
  const hasReplies = replies && replies.length > 0;
  const hasHumanReply = replies?.some((r: any) => r.isAutoReply === 0);
  const needsHuman = (post as any).needsHuman === 1;
  const isAnswered = (post as any).isAnswered === 1;
  const postImages = (post as any).images as string[] | null | undefined;

  return (
    <MyPageLayout title="1:1 문의 상세">
      <Button variant="ghost" onClick={() => navigate("/mypage/inquiries")} className="mb-4 -ml-3">
        <ChevronLeft className="w-4 h-4 mr-2" />
        목록으로
      </Button>

      {/* 문의 원문 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><User className="w-4 h-4" />{post.userName || "알 수 없음"}</div>
                <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDateTime(post.createdAt)}</div>
              </div>
            </div>
            {needsHuman
              ? <Badge className="bg-orange-500 hover:bg-orange-600"><span className="flex items-center gap-1"><Clock className="w-3 h-3" />상담사 답변 대기중</span></Badge>
              : isAnswered
                ? <Badge className="bg-green-600 hover:bg-green-700"><span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />상담완료</span></Badge>
                : hasHumanReply
                  ? <Badge className="bg-teal-500 hover:bg-teal-600"><span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />상담사 답변 완료</span></Badge>
                  : <Badge variant="secondary"><span className="flex items-center gap-1"><Clock className="w-3 h-3" />답변 대기</span></Badge>
            }
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{post.content}</p>
          {postImages && postImages.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="w-4 h-4" />첨부파일 ({postImages.length}개)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {postImages.map((url, index) => (
                  <button key={index} type="button" onClick={() => setLightboxImage(url)} className="relative rounded-lg overflow-hidden border bg-muted aspect-square hover:opacity-80 transition-opacity cursor-pointer">
                    <img src={url} alt={`첨부 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 답변 목록 */}
      {hasReplies && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />답변 ({replies!.length}개)
          </h3>
          {replies!.map((reply: any, idx: number) => {
            const isAuto = reply.isAutoReply === 1;
            const replyAttachments = reply.attachments as string[] | null | undefined;
            const isEditing = editingReplyId === reply.id;
            const lastAutoIdx = replies!.map((r: any) => r.isAutoReply === 1).lastIndexOf(true);
            const isLastAuto = isAuto && idx === lastAutoIdx;

            return (
              <Card key={reply.id} className={`border-l-4 ${isAuto ? "border-l-blue-400 bg-blue-50/30 dark:bg-blue-950/10" : "border-l-primary bg-muted/30"}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {isAuto ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300">
                          <Zap className="w-3 h-3 mr-1" />자동응답
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-primary/10">
                          <UserCheck className="w-3 h-3 mr-1" />상담사
                        </Badge>
                      )}
                      <span>{formatDateTime(reply.createdAt)}</span>
                    </div>
                    {isAdmin && !isEditing && (
                      <Button variant="ghost" size="sm" onClick={() => handleStartEdit(reply)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5 mr-1" />수정
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} className="mb-4" />
                      <ImageUploadSection images={editReplyUploader.images} uploading={editReplyUploader.uploading} fileInputRef={editReplyUploader.fileInputRef} handleFileSelect={editReplyUploader.handleFileSelect} removeImage={editReplyUploader.removeImage} inputId={`edit-${reply.id}`} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit} disabled={updateReply.isPending}>
                          {updateReply.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : <><Save className="w-4 h-4 mr-1" />저장</>}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setEditingReplyId(null); setEditContent(""); }}>취소</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <MarkdownText text={reply.content} />
                      {isLastAuto && (
                        <div className="mt-4 flex items-start gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md px-3 py-2.5">
                          <span className="mt-0.5 shrink-0 text-red-500">⚠️</span>
                          <span>AI 상담사로 답변이 정확하지 않을 수 있습니다. 좀 더 정확한 상담을 원하시면 아래 <strong>[상담사 답변 요청하기]</strong> 버튼을 눌러주세요.</span>
                        </div>
                      )}
                      {replyAttachments && replyAttachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <h5 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                            <ImageIcon className="w-3.5 h-3.5" />첨부 이미지 ({replyAttachments.length}개)
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {replyAttachments.map((url, index) => (
                              <button key={index} type="button" onClick={() => setLightboxImage(url)} className="relative rounded-lg overflow-hidden border bg-muted aspect-square hover:opacity-80 transition-opacity cursor-pointer">
                                <img src={url} alt={`답변 첨부 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 작성자용 — 자동응답 후 액션 버튼 */}
      {!isAdmin && isAuthor && hasReplies && !hasHumanReply && (
        <Card className="mt-6">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium mb-3 text-center">자동응답이 도움이 되었나요?</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-green-500/50 text-green-700 hover:bg-green-50 hover:border-green-500 dark:text-green-400 dark:hover:bg-green-950"
                onClick={() => navigate("/mypage/inquiries")}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                상담완료
              </Button>
              {needsHuman ? (
                <Button variant="outline" className="flex-1 border-orange-400 text-orange-600 bg-orange-50/50" disabled>
                  <MessageSquareText className="w-4 h-4 mr-2" />
                  상담사 답변 요청됨
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1 border-primary/50 hover:bg-primary/5"
                  onClick={() => requestHuman.mutate({ postId: Number(id) })}
                  disabled={requestHuman.isPending}
                >
                  {requestHuman.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquareText className="w-4 h-4 mr-2" />}
                  상담사 답변 요청하기
                </Button>
              )}
            </div>
            {needsHuman ? (
              <div className="mt-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3 text-center">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">상담사 답변이 요청되었습니다.</p>
                <p className="text-xs text-orange-600/80 dark:text-orange-500 mt-0.5">영업일 기준 1일 이내(평일 09:00–18:00)에 담당 상담사가 직접 답변드립니다.</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center mt-2">
                자동응답이 만족스럽지 않으시면 상담사 답변을 요청해 보세요.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 작성자용 — 답변 대기 중 */}
      {!isAdmin && isAuthor && !hasReplies && (
        <Card className="mt-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm mb-1">자동응답 생성 중입니다</p>
                <p className="text-sm text-muted-foreground">
                  잠시 후 자동응답이 등록됩니다. 자동응답이 만족스럽지 않으시면 [상담사 답변 요청하기] 버튼을 이용해 주세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 작성자용 — 상담사 답변 등록 */}
      {!isAdmin && isAuthor && hasHumanReply && (
        <Card className="mt-6 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm mb-1">상담사 답변이 등록되었습니다</p>
                <p className="text-sm text-muted-foreground">추가 문의사항이 있으시면 새로운 문의를 등록해주세요.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/customer-service/inquiry")}>새 문의 작성</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 관리자용 — 상담사 연결 요청 알림 */}
      {isAdmin && needsHuman && (
        <Card className="mt-6 border-orange-300 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <MessageSquareText className="w-4 h-4" />
              <span className="text-sm font-medium">고객이 상담사 직접 답변을 요청했습니다. 영업일 1일 이내에 답변해 주세요.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 관리자용 — 답변 작성 */}
      {isAdmin && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              상담사 답변 작성
              <span className="text-sm font-normal text-muted-foreground">(등록 시 문의자에게 알림 발송)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="답변 내용을 입력하세요..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={6} className="mb-4" />
            <ImageUploadSection images={newReplyUploader.images} uploading={newReplyUploader.uploading} fileInputRef={newReplyUploader.fileInputRef} handleFileSelect={newReplyUploader.handleFileSelect} removeImage={newReplyUploader.removeImage} inputId="new-reply-images" />
            <Button onClick={handleSubmitReply} disabled={createReply.isPending || newReplyUploader.uploading}>
              {createReply.isPending ? "등록 중..." : "답변 등록"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 이미지 라이트박스 */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxImage} alt="첨부 이미지 확대" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            <button onClick={() => setLightboxImage(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors">✕</button>
          </div>
        </div>
      )}
    </MyPageLayout>
  );
}
