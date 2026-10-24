import Layout from "@/components/Layout";
import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Send, ImagePlus, X, Loader2, Zap, MessageSquareText } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function WaitingScreen({ postId, onNavigate }: { postId: number; onNavigate: (id: number) => void }) {
  const [dots, setDots] = useState(".");
  const [elapsed, setElapsed] = useState(0);

  const { data: replies } = trpc.community.getMyInquiryReplies.useQuery(
    { postId },
    { refetchInterval: 2000 }
  );

  useEffect(() => {
    if (replies && replies.length > 0) {
      onNavigate(postId);
    }
  }, [replies, postId, onNavigate]);

  useEffect(() => {
    const dotsTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 500);
    const elapsedTimer = setInterval(() => {
      setElapsed(e => {
        if (e >= 28) { onNavigate(postId); return e; }
        return e + 1;
      });
    }, 1000);
    return () => { clearInterval(dotsTimer); clearInterval(elapsedTimer); };
  }, [postId, onNavigate]);

  return (
    <Layout>
      <div className="container py-24 max-w-lg mx-auto">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="relative mx-auto w-20 h-20 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
            </div>

            <h2 className="text-xl font-bold mb-2">AI 상담사 답변 생성 중{dots}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              문의 내용을 분석하여 답변을 준비하고 있습니다.<br />잠시만 기다려 주세요.
            </p>

            <div className="flex justify-center gap-1.5 mb-8">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-400"
                  style={{ animation: `bounce-dot 1.2s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              답변이 완료되면 자동으로 화면이 전환됩니다.
              {elapsed >= 10 && (
                <button
                  className="block mx-auto mt-3 text-primary underline underline-offset-2"
                  onClick={() => onNavigate(postId)}
                >
                  기다리지 않고 바로 이동하기
                </button>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
      <style>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </Layout>
  );
}

export default function Inquiry() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [waitingPostId, setWaitingPostId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useSEO({
    title: "お問い合わせ",
    description: "ソウルモノ お問い合わせ - ご不明な点はお気軽にお問い合わせください",
    noindex: true,
  });

  const uploadImage = trpc.upload.uploadInquiryImage.useMutation();
  const createInquiry = trpc.community.createPost.useMutation({
    onSuccess: (data) => {
      setWaitingPostId(data.postId);
    },
    onError: (error) => {
      toast.error(error.message || "문의 등록에 실패했습니다.");
    }
  });

  const handleNavigateToDetail = useCallback((postId: number) => {
    navigate(`/mypage/inquiries/${postId}`);
  }, [navigate]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) { toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`); return; }
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    for (const file of filesToUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) { toast.error(`${file.name}: 이미지 파일만 업로드할 수 있습니다.`); return; }
      if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name}: 파일 크기는 10MB를 초과할 수 없습니다.`); return; }
    }
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const base64 = await fileToBase64(file);
        const result = await uploadImage.mutateAsync({ filename: file.name, contentType: file.type, base64Data: base64 });
        uploadedUrls.push(result.url);
      }
      setImages(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length}개의 이미지가 첨부되었습니다.`);
    } catch { toast.error("画像のアップロードに失敗しました。"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error("ログインが必要です。"); return; }
    if (!category || !title.trim() || !content.trim()) { toast.error("すべての項目を入力してください。"); return; }
    createInquiry.mutate({
      boardId: 7,
      title: `[${getCategoryLabel(category)}] ${title}`,
      content,
      images: images.length > 0 ? images : undefined,
    });
  };

  const getCategoryLabel = (value: string) => {
    const labels: Record<string, string> = {
      order: "주문/결제", shipping: "배송", return: "반품/교환",
      product: "상품", member: "회원", etc: "기타"
    };
    return labels[value] || value;
  };

  if (waitingPostId) {
    return <WaitingScreen postId={waitingPostId} onNavigate={handleNavigateToDetail} />;
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-4">ログインが必要です</h2>
              <p className="text-muted-foreground mb-6">お問い合わせはログイン後にご利用いただけます。</p>
              <Button onClick={() => navigate("/")}>ホームへ戻る</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/customer-service")} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" />
            고객센터로 돌아가기
          </Button>
          <h1 className="text-3xl font-bold mb-2">お問い合わせ</h1>
          <p className="text-muted-foreground">お問い合わせを登録すると自動応答がすぐに届き、解決しない場合は担当者におつなぎできます。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>お問い合わせ作成</CardTitle>
                <CardDescription>お問い合わせ内容を詳しくご記入いただくと、より正確な自動応答を受け取れます。</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="category" style={{ paddingBottom: "10px" }}>お問い合わせ種別 *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="お問い合わせ種別を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">注文・お支払い</SelectItem>
                        <SelectItem value="shipping">配送</SelectItem>
                        <SelectItem value="return">返品・交換</SelectItem>
                        <SelectItem value="product">商品</SelectItem>
                        <SelectItem value="member">会員</SelectItem>
                        <SelectItem value="etc">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title" style={{ paddingBottom: "10px" }}>タイトル *</Label>
                    <Input id="title" placeholder="お問い合わせのタイトルを入力してください" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="content" style={{ paddingBottom: "10px" }}>お問い合わせ内容 *</Label>
                    <Textarea id="content" placeholder="お問い合わせ内容を詳しく入力してください" value={content} onChange={e => setContent(e.target.value)} rows={10} maxLength={2000} />
                    <p className="text-sm text-muted-foreground mt-1">{content.length} / 2000</p>
                  </div>
                  <div>
                    <Label style={{ paddingBottom: "10px" }}>添付ファイル</Label>
                    <p className="text-sm text-muted-foreground mb-3">상품 불량, 배송 파손 등의 경우 사진을 첨부해주시면 빠른 처리가 가능합니다. (최대 {MAX_IMAGES}장, 각 10MB 이하)</p>
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        {images.map((url, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
                            <img src={url} alt={`첨부 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {images.length < MAX_IMAGES && (
                      <div>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={handleFileSelect} className="hidden" id="inquiry-images" />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />アップロード中...</> : <><ImagePlus className="w-4 h-4 mr-2" />이미지 첨부 ({images.length}/{MAX_IMAGES})</>}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createInquiry.isPending || uploading} className="flex-1">
                      {createInquiry.isPending
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />登録中...</>
                        : <><Send className="w-4 h-4 mr-2" />お問い合わせを送信</>}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate("/customer-service")}>キャンセル</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">お問い合わせのご案内</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-yellow-500" />即時自動応答</h4>
                  <p className="text-muted-foreground">お問い合わせの登録後すぐに、FAQに基づく自動応答が届きます。</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-1"><MessageSquareText className="w-3.5 h-3.5 text-primary" />担当者の回答</h4>
                  <p className="text-muted-foreground">自動応答で解決しない場合は、担当者の回答をご依頼いただけます。<br />営業日1日以内（平日 09:00–18:00）に回答</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">注文に関するお問い合わせ</h4>
                  <p className="text-muted-foreground">注文番号をあわせてご記入いただくと、より迅速に対応できます。</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">マイお問い合わせ履歴</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">ご投稿のお問い合わせ履歴はマイページでご確認いただけます。</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/mypage/inquiries")} className="w-full">お問い合わせ履歴を見る</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
