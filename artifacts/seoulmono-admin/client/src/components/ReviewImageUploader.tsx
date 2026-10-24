import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ReviewImageUploader({ images, onChange, maxImages = 5 }: ReviewImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = trpc.community.uploadImage.useMutation();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`이미지는 최대 ${maxImages}장까지 업로드할 수 있습니다`);
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remaining);
    // Validate file types and sizes
    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}은(는) 이미지 파일이 아닙니다`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 파일 크기가 5MB를 초과합니다`);
        return;
      }
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const base64 = await fileToBase64(file);
        const result = await uploadImage.mutateAsync({
          base64,
          fileName: file.name,
          contentType: file.type,
        });
        uploadedUrls.push(result.url);
      }
      onChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length}장의 이미지가 업로드되었습니다`);
    } catch {
      toast.error("画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [images, maxImages, onChange, uploadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">画像を添付</span>
        <span className="text-xs text-muted-foreground">{images.length}/{maxImages}장</span>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border bg-secondary/30">
              <img src={url} alt={`리뷰 이미지 ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">アップロード中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">クリックまたはドラッグして画像を追加</p>
              <p className="text-xs text-muted-foreground/60">JPG, PNG, GIF (최대 5MB, {maxImages}장)</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
