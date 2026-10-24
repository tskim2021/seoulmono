import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { proxyImage } from "@/lib/utils";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItemId: number;
  productName: string;
  productThumbnail?: string;
  onSuccess?: () => void;
}

export function ReviewDialog({ open, onOpenChange, orderItemId, productName, productThumbnail, onSuccess }: ReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const uploadImage = trpc.upload.uploadImage.useMutation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 최대 5장 제한
    if (images.length + files.length > 5) {
      toast.error("사진은 최대 5장까지 업로드할 수 있습니다.");
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}은(는) 5MB를 초과합니다.`);
          continue;
        }

        // 이미지 파일 여부 확인
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}은(는) 이미지 파일이 아닙니다.`);
          continue;
        }

        // 파일을 base64로 변환
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // "data:image/png;base64," 부분 제거
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // tRPC로 업로드
        const { url } = await uploadImage.mutateAsync({
          filename: file.name,
          contentType: file.type,
          base64Data,
        });

        uploadedUrls.push(url);
      }

      setImages([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length}개의 사진이 업로드되었습니다.`);
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("사진 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("리뷰가 작성되었습니다. 포인트가 적립되었습니다!");
      onOpenChange(false);
      setRating(5);
      setTitle("");
      setContent("");
      setImages([]);
      utils.reviews.checkReviewStatus.invalidate({ orderItemId });
      utils.order.pendingReviews.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "리뷰 작성에 실패했습니다.");
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("리뷰 제목을 입력해주세요.");
      return;
    }
    if (content.length < 10) {
      toast.error("리뷰 내용을 10자 이상 입력해주세요.");
      return;
    }

    createReview.mutate({
      orderItemId,
      rating,
      title,
      content,
      images: images.length > 0 ? images : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>리뷰 작성</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2 mt-1">
              {productThumbnail && (
                <img
                  src={proxyImage(productThumbnail)}
                  alt={productName}
                  className="w-10 h-10 rounded-md object-cover border shrink-0"
                />
              )}
              <span className="text-sm">{productName}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 별점 */}
          <div className="space-y-2">
            <Label>별점</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground self-center">
                {rating}점
              </span>
            </div>
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <Label htmlFor="review-title">제목</Label>
            <Input
              id="review-title"
              placeholder="리뷰 제목을 입력해주세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <Label htmlFor="review-content">내용</Label>
            <Textarea
              id="review-content"
              placeholder="상품에 대한 솔직한 리뷰를 작성해주세요 (최소 10자)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {content.length} / 최소 10자
            </p>
          </div>

          {/* 사진 업로드 */}
          <div className="space-y-2">
            <Label>
              사진 업로드 (선택사항, 최대 5장)
              <span className="text-xs text-primary ml-2">
                +200 포인트
              </span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= 5}
              className="w-full"
            >
              {uploading ? "업로드 중..." : "사진 선택"}
            </Button>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img}
                      alt={`리뷰 사진 ${idx + 1}`}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold hover:bg-destructive/90"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createReview.isPending}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={createReview.isPending}>
            {createReview.isPending ? "작성 중..." : "리뷰 작성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
