import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { formatPrice, formatDate, formatDateTime, getOrderStatusLabel, getOrderStatusColor, getGradeLabel, proxyImage, formatOrderNumber, productHref } from "@/lib/utils";
import { formatShippingDescription as formatShippingDesc } from "@/lib/shippingDescriptionFormatter";

function renderShippingDesc(raw: string): React.ReactNode {
  const text = formatShippingDesc(raw);
  const pattern = /(통관검사대기|통관번호:\d+)/g;
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? <span key={i} className="text-red-600 font-semibold">{part}</span> : part
  );
}
import { downloadOrdersExcel } from "@/utils/orderExcelExport";
import { detectCarrierByTracking } from "@/lib/carrierDetector";
import Paginator from "@/components/Paginator";
import {
  LayoutDashboard, Package, ShoppingBag, Users, FileText, Image, Search,
  DollarSign, TrendingUp, ArrowLeft, Plus, Pencil, Trash2, Eye, ChevronLeft,
  ChevronRight, ChevronDown, ChevronUp, Menu, X, FolderTree, MessageSquare, BarChart3, Tag, Upload, Loader2, Star, Gift, Ticket, MessageCircle, HelpCircle,
  Truck, RotateCcw, MapPin, Clock, CheckCircle2, AlertCircle, Settings2, ExternalLink, CalendarDays, Calendar, Award, Bot, MessageSquareText, History, Mail,
  Globe, Shield, Plane, CreditCard, Check, Newspaper, FlaskConical, Zap, Sparkles, GripVertical, ImagePlus, Save, Play, Bell, Key, Copy, XCircle, ClipboardList, ShoppingCart
} from "lucide-react";
import { Link, Route, Switch, useLocation } from "wouter";
import { type ReactNode, useState, useMemo, useRef, useCallback, useEffect, Fragment } from "react";
import { toast } from "sonner";
import AdminProductExcelUpload from "./AdminProductExcelUpload";
import AdminTrackingExcelUpload from "./AdminTrackingExcelUpload";
import AdminShippingDashboard from "./AdminShippingDashboard";
import AdminChatbotSettings from "./AdminChatbotSettings";
import AdminChatbotCategories from "./AdminChatbotCategories";
import AdminChatbotQna from "./AdminChatbotQna";
import AdminChatbotConversations from "./AdminChatbotConversations";
import AdminPointHistory from "./admin/AdminPointHistory";
import AdminPointExpiration from "./admin/AdminPointExpiration";
import AdminEmailTemplate from "./admin/AdminEmailTemplate";
import AdminEmailLogs from "./admin/AdminEmailLogs";
import AdminFAQ from "./admin/AdminFAQ";
import AdminPaymentSettings from "./AdminPaymentSettings";
import AdminPaymentManagement from "./AdminPaymentManagement";
import AdminPricingSettings from "./AdminPricingSettings";
import AdminNewsManagement from "./AdminNewsManagement";
import AdminNewsAutoSettings from "./AdminNewsAutoSettings";
import AdminProductInfo from "./AdminProductInfo";
import AdminUserDetail from "./admin/AdminUserDetail";
import AdminOrdersSpreadsheet from "./AdminOrdersSpreadsheet";
import AdminInfoBoardAuto from "./admin/AdminInfoBoardAuto";
import AdminDiscussionAuto from "./admin/AdminDiscussionAuto";
import AdminInquiries from "./admin/AdminInquiries";
import AdminPointSettings from "./admin/AdminPointSettings";
import AdminSmtpSettings from "./admin/AdminSmtpSettings";
import AdminGnuApiSync from "./admin/AdminGnuApiSync";
import AdminApiSettings from "./admin/AdminApiSettings";
import AdminActionLogs from "./admin/AdminActionLogs";
import AdminVisitorStats from "./admin/AdminVisitorStats";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";

// ─── Image Uploader Component ───
function ImageUploader({ currentUrl, onUploaded }: { currentUrl: string; onUploaded: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const uploadMut = trpc.admin.uploadImage.useMutation();

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 업로드 가능합니다."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("파일 크기는 5MB 이하여야 합니다."); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { url } = await uploadMut.mutateAsync({ base64, fileName: file.name, contentType: file.type });
      onUploaded(url);
      toast.success("이미지가 업로드되었습니다.");
    } catch (e) {
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }, [uploadMut, onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">업로드 중...</span>
          </div>
        ) : currentUrl ? (
          <div className="flex items-center gap-3">
            <img src={currentUrl} alt="미리보기" className="w-16 h-16 object-cover rounded-lg border" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium truncate max-w-[300px]">{currentUrl.split("/").pop()}</p>
              <p className="text-xs text-muted-foreground">클릭하여 변경</p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">클릭 또는 드래그하여 이미지 업로드</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (5MB 이하)</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
      <Input
        value={currentUrl}
        onChange={(e) => onUploaded(e.target.value)}
        placeholder="또는 이미지 URL을 직접 입력하세요"
        className="text-xs"
      />
    </div>
  );
}

// ─── Multi Image Uploader Component ───
function MultiImageUploader({ images, onImagesChange }: { images: string[]; onImagesChange: (urls: string[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const uploadMut = trpc.admin.uploadImage.useMutation();

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name}: 이미지 파일만 업로드 가능합니다.`); return false; }
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name}: 파일 크기는 5MB 이하여야 합니다.`); return false; }
      return true;
    });
    if (validFiles.length === 0) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of validFiles) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const { url } = await uploadMut.mutateAsync({ base64, fileName: file.name, contentType: file.type });
        newUrls.push(url);
      }
      onImagesChange([...images, ...newUrls]);
      toast.success(`${newUrls.length}개 이미지가 업로드되었습니다.`);
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }, [uploadMut, images, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = (idx: number) => {
    onImagesChange(images.filter((_, i) => i !== idx));
  };

  const moveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(fromIdx, 1);
    newImages.splice(toIdx, 0, moved);
    onImagesChange(newImages);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      moveImage(dragIdx, idx);
      setDragIdx(idx);
    }
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">상품 이미지 ({images.length}개)</label>
        <span className="text-xs text-muted-foreground">드래그하여 순서 변경 | 첫 번째 이미지가 대표 이미지</span>
      </div>
      {/* 기존 이미지 그리드 */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
                idx === 0 ? "border-primary ring-2 ring-primary/20" : "border-border"
              } ${dragIdx === idx ? "opacity-50 scale-95" : ""}`}
            >
              <img src={url} alt={`상품 이미지 ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">대표</div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {idx > 0 && (
                  <button onClick={() => moveImage(idx, idx - 1)} className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center hover:bg-white" title="앞으로">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => removeImage(idx)} className="w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80" title="삭제">
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx < images.length - 1 && (
                  <button onClick={() => moveImage(idx, idx + 1)} className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center hover:bg-white" title="뒤로">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">업로드 중...</span>
          </div>
        ) : (
          <div className="py-1">
            <ImagePlus className="w-7 h-7 mx-auto text-muted-foreground mb-1.5" />
            <p className="text-sm text-muted-foreground">클릭 또는 드래그하여 이미지 추가 (여러 장 선택 가능)</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP (5MB 이하)</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
      </div>
    </div>
  );
}

// ─── AI 상품 상세 설명 생성 버튼 ───
function ContentAIGenerateButton({ productId, productName, productDescription, onGenerated, disabled }: {
  productId?: number;
  productName: string;
  productDescription?: string;
  onGenerated: (html: string) => void;
  disabled?: boolean;
}) {
  const generateMut = trpc.productInfo.generateDescription.useMutation({
    onSuccess: (result) => {
      if (result.success && result.content) {
        onGenerated(result.content);
        toast.success("AI가 상품 상세 설명을 생성했습니다.");
      } else {
        toast.error(result.error || "AI 생성에 실패했습니다.");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 text-xs"
      disabled={disabled || generateMut.isPending}
      onClick={() => {
        if (!productName.trim()) { toast.error("상품명을 먼저 입력해주세요."); return; }
        generateMut.mutate({
          productId: productId ?? 0,
          productName,
          productDescription: productDescription || undefined,
        });
      }}
    >
      {generateMut.isPending ? (
        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> AI 생성 중...</>
      ) : (
        <><Sparkles className="w-3 h-3 mr-1" /> AI 상세 설명 생성</>
      )}
    </Button>
  );
}

// ─── Admin Sidebar Layout ───
export function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 미로그인이면 막다른 화면 대신 로그인 페이지로 보낸다.
  // setLocation 은 wouter base(/admin2)를 반영하므로 접두사를 직접 붙이지 않는다.
  useEffect(() => {
    if (loading) return;
    if (!user) setLocation("/login");
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground mb-4">로그인 페이지로 이동합니다.</p>
          <Button variant="outline" onClick={() => setLocation("/login")}>로그인하러 가기</Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">접근 권한이 없습니다</h2>
          <p className="text-muted-foreground mb-4">
            관리자만 접근할 수 있습니다. (현재 계정: {user.name ?? "-"})
          </p>
          <Button variant="outline" onClick={() => setLocation("/login")}>다른 계정으로 로그인</Button>
        </div>
      </div>
    );
  }

  const navGroups = [
    {
      label: "메인",
      items: [
        { href: "/admin", icon: LayoutDashboard, label: "대시보드" },
      ]
    },
    {
      label: "쇼핑몰 관리",
      items: [
        { href: "/admin/categories", icon: FolderTree, label: "카테고리 관리" },
        { href: "/admin/products", icon: ShoppingBag, label: "상품 관리" },
        { href: "/admin/orders", icon: Package, label: "주문 관리" },
        { href: "/admin/orders/spreadsheet", icon: Package, label: "주문 관리 (스프레드시트)" },
        { href: "/admin/refunds", icon: RotateCcw, label: "환불 관리" },
        { href: "/admin/carts", icon: ShoppingCart, label: "장바구니 현황" },
        { href: "/admin/banners", icon: Image, label: "배너 관리" },
        { href: "/admin/coupons", icon: Ticket, label: "쿠폰 관리" },
        { href: "/admin/promo-codes", icon: Tag, label: "프로모코드 관리" },
      ]
    },
    {
      label: "배송 관리",
      items: [
        { href: "/admin/shipping-dashboard", icon: BarChart3, label: "배송 현황 대시보드" },
        { href: "/admin/shipping-policy", icon: Settings2, label: "배송비 정책" },
      ]
    },
    {
      label: "회원 관리",
      items: [
        { href: "/admin/users", icon: Users, label: "회원 관리" },
        { href: "/admin/point-history", icon: History, label: "포인트 내역" },
        { href: "/admin/point-settings", icon: Settings2, label: "포인트 설정" },
      ]
    },
    {
      label: "고객 문의",
      items: [
        { href: "/admin/inquiries", icon: MessageSquareText, label: "1:1 문의 관리" },
      ]
    },
    {
      label: "커뮤니티 관리",
      items: [
        { href: "/admin/boards", icon: FileText, label: "게시판 관리" },
        { href: "/admin/product-qna", icon: HelpCircle, label: "상품 Q&A 관리" },
        { href: "/admin/reviews", icon: MessageCircle, label: "리뷰 관리" },
        { href: "/admin/news", icon: Newspaper, label: "뉴스 관리" },
        { href: "/admin/news-settings", icon: Zap, label: "뉴스 자동생성 설정" },
        { href: "/admin/info-board-auto", icon: Bot, label: "정보나눔 AI 자동글" },
        { href: "/admin/discussion-auto", icon: Bot, label: "토론광장 AI 자동글" },
      ]
    },
    {
      label: "AI 상담사",
      items: [
        { href: "/admin/chatbot/settings", icon: Settings2, label: "기본 설정" },
        { href: "/admin/chatbot/categories", icon: FolderTree, label: "카테고리 관리" },
        { href: "/admin/chatbot/qna", icon: MessageSquareText, label: "문답 관리" },
        { href: "/admin/chatbot/conversations", icon: History, label: "대화 이력" },
      ]
    },
    {
      label: "결제 관리",
      items: [
        { href: "/admin/payment-management", icon: DollarSign, label: "무통장 입금 관리" },
        { href: "/admin/payment-settings", icon: CreditCard, label: "결제 수단 설정" },
        { href: "/admin/pricing-settings", icon: DollarSign, label: "엔화 가격 변환" },
      ]
    },
    {
      label: "설정",
      items: [
        { href: "/admin/review-settings", icon: Star, label: "리뷰 포인트 설정" },
        { href: "/admin/email-template", icon: Mail, label: "이메일 템플릿" },
        { href: "/admin/smtp-settings", icon: Mail, label: "SMTP 메일 설정" },
        { href: "/admin/email-logs", icon: History, label: "이메일 발송 이력" },
        { href: "/admin/faq", icon: HelpCircle, label: "FAQ 관리" },
        { href: "/admin/gnu-api-sync", icon: Globe, label: "외부 API 연동" },
        { href: "/admin/api-settings", icon: Key, label: "API 키 설정" },
      ]
    },
    {
      label: "통계",
      items: [
        { href: "/admin/visitor-stats", icon: Eye, label: "접속자 통계" },
        { href: "/admin/keywords", icon: BarChart3, label: "검색어 통계" },
        { href: "/admin/action-logs", icon: ClipboardList, label: "관리자 처리 이력" },
      ]
    },
    {
      label: "대량 업로드",
      items: [
        { href: "/admin/excel-upload/products", icon: Upload, label: "상품 엑셀 업로드" },
        { href: "/admin/excel-upload/tracking", icon: Truck, label: "운송장 엑셀 업로드" },
      ]
    },
  ];

  const allNavHrefs = navGroups.flatMap(g => g.items.map(i => i.href));

  const isActive = (href: string) => {
    if (href === "/admin") return location === "/admin";
    if (allNavHrefs.includes(location) && location !== href) return false;
    return location === href || location.startsWith(href + "/");
  };

  return (
    <div className="fixed inset-0 overflow-x-auto">
    <div className="min-w-[1280px] h-full bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-52 bg-card border-r flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-10 flex items-center justify-between px-3 border-b shrink-0">
          <Link href="/admin" className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[9px]">YC</span>
            </div>
            <span className="font-serif font-semibold text-xs">관리자 패널</span>
          </Link>
          <button className="lg:hidden p-0.5 hover:bg-accent rounded" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {navGroups.map(group => (
            <div key={group.label} className="mb-2">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">{group.label}</p>
              {group.items.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors mb-0.5 ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}>
                    <item.icon className="w-3 h-3 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </nav>

      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b px-4 lg:px-5" style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="lg:hidden p-1 hover:bg-accent rounded" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <a href="/" target="_blank" rel="noopener noreferrer" className="shrink-0 gap-1.5 px-2.5 py-1 rounded text-xs text-foreground bg-background border border-input hover:bg-accent transition-colors" style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'center' }}>
            <ExternalLink className="w-3 h-3" />
            <span style={{ marginLeft: '6px' }}>쇼핑몰 바로가기</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="text-xs text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-[10px] font-bold">{user?.name?.[0] ?? "A"}</span>
            </div>
            <span className="hidden sm:inline">{user?.name ?? "관리자"}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-5 w-full">{children}</main>
      </div>
    </div>
    </div>
  );
}

// ─── Dashboard Home ───
function DashboardHome() {
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: lowStockOptions } = trpc.admin.lowStockOptions.useQuery();
  const { data: recentOrders } = trpc.admin.orders.useQuery({ page: 1, limit: 5 });
  const { data: recentPosts } = trpc.admin.posts.useQuery({ page: 1, limit: 5, boardId: 7 });
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [showReport, setShowReport] = useState(false);
  const generateReport = trpc.salesReport.generate.useMutation();

  const handleGenerateReport = async () => {
    const endDate = new Date().toISOString().split("T")[0];
    let startDate = new Date();
    if (reportPeriod === "daily") startDate.setDate(startDate.getDate() - 1);
    else if (reportPeriod === "weekly") startDate.setDate(startDate.getDate() - 7);
    else startDate.setMonth(startDate.getMonth() - 1);
    const start = startDate.toISOString().split("T")[0];
    await generateReport.mutateAsync({ startDate: start, endDate, reportType: reportPeriod });
    setShowReport(true);
  };
  const statCards = [
    { label: "총 회원", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "총 주문", value: stats?.totalOrders ?? 0, icon: Package, color: "text-purple-600 bg-purple-50" },
    { label: "총 상품", value: stats?.totalProducts ?? 0, icon: ShoppingBag, color: "text-emerald-600 bg-emerald-50" },
    { label: "총 매출", value: formatPrice(stats?.totalRevenue ?? 0), icon: DollarSign, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-card border rounded-xl p-5 elegant-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${s.color}`}><s.icon className="w-4 h-4" /></div>
            </div>
            <p className="text-2xl font-bold">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
          </div>
        ))}
      </div>

      {/* 실시간 알림 */}
      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        {/* 통관검사 대기 알림 */}
        <div className="bg-card border border-rose-200 dark:border-rose-800 rounded-xl p-5 elegant-shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-rose-600">
            <AlertCircle className="w-4 h-4" /> 통관검사 ({stats?.customsHoldCount ?? 0})
          </h3>
          {(stats?.customsHoldCount ?? 0) > 0 ? (
            <div>
              <p className="text-sm text-rose-600 font-medium mb-2">통관 검사 대기 중인 주문이 있습니다</p>
              <Link href="/admin/orders?status=customs_hold">
                <Button variant="outline" size="sm" className="text-rose-600 border-rose-300 hover:bg-rose-50">통관검사 주문 보기</Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">통관 검사 대기 건이 없습니다</p>
          )}
        </div>

        {/* 재고 부족 알림 */}
        <div className="bg-card border rounded-xl p-5 elegant-shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" /> 재고 부족 ({lowStockOptions?.length ?? 0})
          </h3>
          {lowStockOptions && lowStockOptions.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {lowStockOptions.slice(0, 3).map((opt, idx) => (
                <div key={idx} className="p-2 bg-secondary/30 rounded-lg text-sm">
                  <div className="font-medium truncate">{opt.optionName}: {opt.optionValue}</div>
                  <div className="text-xs text-muted-foreground">재고 {opt.stock}개</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">재고 부족 상품이 없습니다</p>
          )}
        </div>

        {/* 신규 주문 알림 */}
        <div className="bg-card border rounded-xl p-5 elegant-shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
            <Package className="w-4 h-4" /> 신규 주문 ({recentOrders?.total ?? 0})
          </h3>
          {recentOrders && recentOrders.orders.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentOrders.orders.slice(0, 3).map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.orderNumber}`}>
                  <div className="p-2 bg-secondary/30 rounded-lg text-sm hover:bg-secondary/50 transition-colors">
                    <div className="font-medium truncate">{formatOrderNumber(order.orderNumber)}</div>
                    <div className="text-xs text-muted-foreground">{formatPrice(order.totalAmount)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">신규 주문이 없습니다</p>
          )}
        </div>

        {/* 고객 문의 알림 */}
        <div className="bg-card border rounded-xl p-5 elegant-shadow">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-600">
            <HelpCircle className="w-4 h-4" /> 고객 문의 ({recentPosts?.total ?? 0})
          </h3>
          {recentPosts && recentPosts.posts.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentPosts.posts.slice(0, 3).map((post) => (
                <Link key={post.id} href={`/community/post/${post.id}`}>
                  <div className="p-2 bg-secondary/30 rounded-lg text-sm hover:bg-secondary/50 transition-colors">
                    <div className="font-medium truncate">{post.title}</div>
                    <div className="text-xs text-muted-foreground">{post.userName}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">신규 문의가 없습니다</p>
          )}
        </div>
      </div>

      {/* Low Stock Alert (old) - remove */}
      {false && lowStockOptions && (lowStockOptions?.length ?? 0) > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive"><AlertCircle className="w-4 h-4" /> 재고 부족 알림 ({lowStockOptions?.length ?? 0}건)</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
              {lowStockOptions?.map((opt, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-background rounded-lg text-sm">
                <div>
                  <span className="font-medium">{opt.optionName}: {opt.optionValue}</span>
                  <span className="text-xs text-muted-foreground ml-2">(Product ID: {opt.productId})</span>
                </div>
                <Badge variant="destructive" className="text-xs">재고 {opt.stock}개</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Report Section */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            AI 매출 리포트
          </h3>
          <div className="flex items-center gap-2">
            <Select value={reportPeriod} onValueChange={(v: any) => setReportPeriod(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">일간</SelectItem>
                <SelectItem value="weekly">주간</SelectItem>
                <SelectItem value="monthly">월간</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateReport} disabled={generateReport.isPending}>
              {generateReport.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
              리포트 생성
            </Button>
          </div>
        </div>
        {generateReport.data && showReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">총 매출</div>
                <div className="text-xl font-bold price-text">{formatPrice(generateReport.data.totalRevenue)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">총 주문</div>
                <div className="text-xl font-bold">{generateReport.data.totalOrders}건</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">평균 주문액</div>
                <div className="text-xl font-bold price-text">{formatPrice(generateReport.data.avgOrderValue)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">완료율</div>
                <div className="text-xl font-bold">{generateReport.data.totalOrders > 0 ? Math.round((generateReport.data.completedOrders / generateReport.data.totalOrders) * 100) : 0}%</div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> AI 분석 인사이트</h4>
              <div className="text-sm whitespace-pre-wrap">{typeof generateReport.data.aiInsights === 'string' ? generateReport.data.aiInsights : JSON.stringify(generateReport.data.aiInsights)}</div>
            </div>
            {generateReport.data.topProducts.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">상위 판매 상품</h4>
                <div className="space-y-2">
                  {generateReport.data.topProducts.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{idx + 1}</Badge>
                        <span className="font-medium">{p.productName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold price-text">{formatPrice(p.revenue)}</div>
                        <div className="text-xs text-muted-foreground">{p.count}개 판매</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Charts Section */}
      <DashboardCharts />

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-card border rounded-xl p-6 elegant-shadow">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Package className="w-4 h-4" /> 최근 주문</h3>
          {(stats?.recentOrders ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">주문이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {stats!.recentOrders.map((order: any) => (
                <Link key={order.id} href={`/admin/orders/${order.orderNumber}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/40 transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium font-mono">{formatOrderNumber(order.orderNumber)}</p>
                        {order.source === "seoulmono" ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">쇼핑몰</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">{order.source ?? "기타"}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusColor(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                      <span className="text-sm font-bold price-text">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-6 elegant-shadow">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> 빠른 링크</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "상품 등록", href: "/admin/products?action=create", icon: Plus },
              { label: "주문 관리", href: "/admin/orders", icon: Package },
              { label: "회원 관리", href: "/admin/users", icon: Users },
              { label: "게시판 관리", href: "/admin/boards", icon: FileText },
            ].map(link => (
              <Link key={link.href} href={link.href}>
                <div className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/40 transition-colors text-sm">
                  <link.icon className="w-4 h-4 text-muted-foreground" />
                  {link.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Charts ───
const PIE_COLORS = ["#8b5e3c", "#a67c5b", "#c9a882", "#e2cdb0", "#6b4226", "#d4a574", "#b8860b"];
const STATUS_LABELS: Record<string, string> = {
  pending: "대기", paid: "결제완료", preparing: "준비중", shipping: "배송중",
  delivered: "배송완료", cancelled: "취소", refunded: "환불",
};

function DashboardCharts() {
  const { data: dailySales } = trpc.admin.dailySales.useQuery({ days: 30 });
  const { data: orderDist } = trpc.admin.orderStatusDistribution.useQuery();
  const { data: catSales } = trpc.admin.categorySales.useQuery();
  
  // 새로운 통계 데이터
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const { data: salesTrend } = trpc.admin.salesTrend.useQuery({ period, days: 30 });
  const { data: topProducts } = trpc.admin.topProducts.useQuery({ limit: 10 });
  const { data: newUsersTrend } = trpc.admin.newUsersTrend.useQuery({ days: 30 });

  const pieData = useMemo(() => {
    if (!orderDist || orderDist.length === 0) return [];
    return orderDist.map((d: any) => ({
      name: STATUS_LABELS[d.status] || d.status,
      value: d.count,
    }));
  }, [orderDist]);

  const chartTooltipFormatter = (value: number) => formatPrice(value);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Daily Sales Line Chart */}
      <div className="bg-card border rounded-xl p-6 elegant-shadow">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> 일별 매출 추이 (30일)
        </h3>
        {(!dailySales || dailySales.length === 0) ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
            아직 주문 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth()+1}/${d.getDate()}`;
              }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(0)}만` : v.toLocaleString()} />
              <Tooltip formatter={chartTooltipFormatter} labelFormatter={(v) => {
                const d = new Date(v);
                return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
              }} />
              <Line type="monotone" dataKey="revenue" stroke="#8b5e3c" strokeWidth={2} dot={{ r: 3 }} name="매출액" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Order Status Pie Chart */}
      <div className="bg-card border rounded-xl p-6 elegant-shadow">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> 주문 상태 분포
        </h3>
        {pieData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
            아직 주문 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Sales Bar Chart */}
      {catSales && catSales.length > 0 && (
        <div className="bg-card border rounded-xl p-6 elegant-shadow lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4" /> 카테고리별 매출
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={catSales} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(0)}만` : v.toLocaleString()} />
              <YAxis type="category" dataKey="categoryName" width={100} tick={{ fontSize: 12 }} />
              <Tooltip formatter={chartTooltipFormatter} />
              <Bar dataKey="revenue" fill="#8b5e3c" radius={[0, 4, 4, 0]} name="매출액" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 매출 추이 (period 선택 가능) */}
      <div className="bg-card border rounded-xl p-6 elegant-shadow lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> 매출 추이 (30일)
          </h3>
          <div className="flex gap-2">
            <Button size="sm" variant={period === "daily" ? "default" : "outline"} onClick={() => setPeriod("daily")}>일별</Button>
            <Button size="sm" variant={period === "weekly" ? "default" : "outline"} onClick={() => setPeriod("weekly")}>주별</Button>
            <Button size="sm" variant={period === "monthly" ? "default" : "outline"} onClick={() => setPeriod("monthly")}>월별</Button>
          </div>
        </div>
        {(!salesTrend || salesTrend.length === 0) ? (
          <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
            아직 매출 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(0)}만` : v.toLocaleString()} />
              <Tooltip formatter={chartTooltipFormatter} />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="매출액" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 인기 상품 TOP 10 */}
      <div className="bg-card border rounded-xl p-6 elegant-shadow">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="w-4 h-4" /> 인기 상품 TOP 10
        </h3>
        {(!topProducts || topProducts.length === 0) ? (
          <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
            아직 판매 데이터가 없습니다
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {topProducts.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant={idx < 3 ? "default" : "secondary"} className="text-xs">{idx + 1}</Badge>
                  <div>
                    <div className="font-medium text-sm">{p.productName}</div>
                    <div className="text-xs text-muted-foreground">판매 {p.totalQuantity}개 · 주문 {p.orderCount}건</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold price-text">{formatPrice(p.totalRevenue)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 신규 회원 추이 */}
      <div className="bg-card border rounded-xl p-6 elegant-shadow">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> 신규 회원 추이 (30일)
        </h3>
        {(!newUsersTrend || newUsersTrend.length === 0) ? (
          <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
            아직 회원 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={newUsersTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth()+1}/${d.getDate()}`;
              }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(v) => {
                const d = new Date(v);
                return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
              }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="신규 회원" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─── Category Management ───
function AdminCategories() {
  const { data: cats, isLoading } = trpc.admin.categories.useQuery();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", parentId: null as number | null, isActive: 1, sortOrder: 0 });

  const createMut = trpc.admin.createCategory.useMutation({ onSuccess: () => { utils.admin.categories.invalidate(); setDialogOpen(false); toast.success("카테고리가 생성되었습니다."); } });
  const updateMut = trpc.admin.updateCategory.useMutation({ onSuccess: () => { utils.admin.categories.invalidate(); setDialogOpen(false); toast.success("카테고리가 수정되었습니다."); } });
  const deleteMut = trpc.admin.deleteCategory.useMutation({ onSuccess: () => { utils.admin.categories.invalidate(); toast.success("카테고리가 삭제되었습니다."); } });

  const openCreate = () => { setEditItem(null); setForm({ name: "", slug: "", description: "", parentId: null, isActive: 1, sortOrder: 0 }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditItem(c); setForm({ name: c.name, slug: c.slug, description: c.description ?? "", parentId: c.parentId, isActive: c.isActive, sortOrder: c.sortOrder }); setDialogOpen(true); };
  const handleSave = () => {
    if (!form.name || !form.slug) { toast.error("이름과 슬러그를 입력해주세요."); return; }
    if (editItem) { updateMut.mutate({ id: editItem.id, ...form }); }
    else { createMut.mutate(form); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" /> 카테고리 추가</Button>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden elegant-shadow">
        <table className="w-full">
          <thead><tr className="bg-secondary/50 text-xs text-muted-foreground">
            <th className="text-left py-3 px-4">ID</th><th className="text-left py-3 px-4">이름</th><th className="text-left py-3 px-4">슬러그</th><th className="text-center py-3 px-4">상위</th><th className="text-center py-3 px-4">순서</th><th className="text-center py-3 px-4">상태</th><th className="text-center py-3 px-4">관리</th>
          </tr></thead>
          <tbody className="divide-y">
            {(cats ?? []).map((c: any) => (
              <tr key={c.id} className="hover:bg-accent/20">
                <td className="py-3 px-4 text-sm">{c.id}</td>
                <td className="py-3 px-4 text-sm font-medium">{c.name}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{c.slug}</td>
                <td className="py-3 px-4 text-sm text-center">{c.parentId ? cats?.find((p: any) => p.id === c.parentId)?.name ?? c.parentId : "-"}</td>
                <td className="py-3 px-4 text-sm text-center">{c.sortOrder}</td>
                <td className="py-3 px-4 text-center"><Badge variant={c.isActive ? "default" : "secondary"} className="text-[10px]">{c.isActive ? "활성" : "비활성"}</Badge></td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMut.mutate({ id: c.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(cats ?? []).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">카테고리가 없습니다</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "카테고리 수정" : "카테고리 추가"}</DialogTitle><DialogDescription>카테고리 정보를 입력하세요.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">이름 *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="카테고리 이름" /></div>
            <div><label className="text-sm font-medium">슬러그 *</label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="category-slug" /></div>
            <div><label className="text-sm font-medium">설명</label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="설명 (선택)" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">상위 카테고리</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.parentId ?? ""} onChange={e => setForm(f => ({ ...f, parentId: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">없음 (최상위)</option>
                  {(cats ?? []).filter((c: any) => c.id !== editItem?.id).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium">정렬 순서</label><Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive === 1} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked ? 1 : 0 }))} />
              <label className="text-sm">활성화</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editItem ? "수정" : "생성"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Product Management ───
function AdminProducts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [sort, setSort] = useState<string>("newest");
  const [filterParentCategoryId, setFilterParentCategoryId] = useState<number | undefined>(undefined);
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined);
  const { data, isLoading } = trpc.admin.products.useQuery({ page, limit, search: search || undefined, categoryId: filterCategoryId, parentCategoryId: filterCategoryId ? undefined : filterParentCategoryId, sort });
  const { data: cats } = trpc.admin.categories.useQuery();
  const parentCats = (cats ?? []).filter((c: any) => !c.parentId);
  const subCatsOf = (parentId?: number) => (cats ?? []).filter((c: any) => c.parentId === parentId);
  const findCat = (id?: number | null) => (cats ?? []).find((c: any) => c.id === id);
  const utils = trpc.useUtils();
  const [pageMode, setPageMode] = useState<"list" | "form">("list");
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", slug: "", categoryId: 0, price: 0, salePrice: null as number | null,
    description: "", content: "", thumbnail: "", images: [] as string[], stock: 100,
    status: "active", isFeatured: 0, isNew: 0, isBest: 0, noDiscount: 0,
    minGrade: "bronze" as "bronze" | "silver" | "gold" | "vip" | "vvip",
    hashtags: [] as string[],
    pointRate: 0,
    pointRateType: "percent" as "percent" | "fixed",
    sortOrder: 0,
  });
  const [optionGroups, setOptionGroups] = useState<{ name: string; values: { value: string; englishValue?: string; price: number; stock?: number }[]; isRequired: number }[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkSalePrice, setBulkSalePrice] = useState<string>("");

  // 인라인 특가 편집
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineSalePrice, setInlineSalePrice] = useState<string>("");
  const inlineUpdateMut = trpc.product.update.useMutation({ onSuccess: () => { utils.admin.products.invalidate(); setInlineEditingId(null); toast.success("특가가 수정되었습니다."); } });

  const bulkDeleteMut = trpc.bulkActions.deleteProducts.useMutation({ onSuccess: () => { utils.admin.products.invalidate(); setSelectedIds([]); toast.success("선택된 상품이 삭제되었습니다."); } });
  const bulkUpdateStatusMut = trpc.bulkActions.updateProductsStatus.useMutation({ onSuccess: () => { utils.admin.products.invalidate(); setSelectedIds([]); toast.success("상태가 변경되었습니다."); } });
  const bulkUpdateCategoryMut = trpc.bulkActions.updateProductsCategory.useMutation({ onSuccess: () => { utils.admin.products.invalidate(); setSelectedIds([]); toast.success("카테고리가 변경되었습니다."); } });
  const bulkUpdatePointRateMut = trpc.bulkActions.updateProductsPointRate.useMutation({ onSuccess: (d) => { utils.admin.products.invalidate(); setSelectedIds([]); toast.success(`${d.count}개 상품의 포인트 적립률이 변경되었습니다.`); } });
  const bulkUpdateFlagsMut = trpc.bulkActions.updateProductsFlags.useMutation({ onSuccess: (d) => { utils.admin.products.invalidate(); setSelectedIds([]); toast.success(`${d.count}개 상품의 플래그가 변경되었습니다.`); } });
  const bulkUpdateSalePriceMut = trpc.bulkActions.updateProductsSalePrice.useMutation({ onSuccess: (d) => { utils.admin.products.invalidate(); setSelectedIds([]); setBulkSalePrice(""); toast.success(`${d.count}개 상품의 특가가 설정되었습니다.`); } });
  const batchSortMut = trpc.product.adminBatchUpdateSortOrder.useMutation({ onSuccess: () => utils.admin.products.invalidate() });

  // 드래그 상태
  const [dragRowIdx, setDragRowIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const isSortOrderMode = sort === "sortOrder_asc" || sort === "sortOrder_desc";

  // 데이터가 변경되면 localProducts 동기화
  const prevDataRef = useRef<any>(null);
  if (data?.products && data.products !== prevDataRef.current) {
    prevDataRef.current = data.products;
    setLocalProducts(data.products);
  }

  const handleRowDragStart = (e: React.DragEvent, idx: number) => {
    setDragRowIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleRowDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };
  const handleRowDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragRowIdx === null || dragRowIdx === dropIdx) {
      setDragRowIdx(null); setDragOverIdx(null); return;
    }
    const reordered = [...localProducts];
    const [moved] = reordered.splice(dragRowIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    // sortOrder 값 재할당 (0, 10, 20, ...)
    const updates = reordered.map((p, i) => ({ id: p.id, sortOrder: i * 10 }));
    setLocalProducts(reordered.map((p, i) => ({ ...p, sortOrder: i * 10 })));
    setDragRowIdx(null); setDragOverIdx(null);
    batchSortMut.mutate(updates);
    toast.success("노출순위가 저장되었습니다");
  };
  const handleRowDragEnd = () => { setDragRowIdx(null); setDragOverIdx(null); };

  const toggleSelectAll = () => {
    if (selectedIds.length === (data?.products ?? []).length) setSelectedIds([]);
    else setSelectedIds((data?.products ?? []).map((p: any) => p.id));
  };
  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };
  const handleBulkAction = () => {
    if (selectedIds.length === 0) { toast.error("상품을 선택해주세요."); return; }
    if (bulkAction === "delete") bulkDeleteMut.mutate({ productIds: selectedIds });
    else if (bulkAction.startsWith("status:")) bulkUpdateStatusMut.mutate({ productIds: selectedIds, status: bulkAction.split(":")[1] as any });
    else if (bulkAction.startsWith("category:")) bulkUpdateCategoryMut.mutate({ productIds: selectedIds, categoryId: parseInt(bulkAction.split(":")[1]) });
    else if (bulkAction.startsWith("pointRate:")) {
      const parts = bulkAction.split(":");
      bulkUpdatePointRateMut.mutate({ productIds: selectedIds, pointRate: parseInt(parts[2]), pointRateType: parts[1] as "percent" | "fixed" });
    } else if (bulkAction.startsWith("flag:")) {
      const parts = bulkAction.split(":");
      bulkUpdateFlagsMut.mutate({ productIds: selectedIds, flag: parts[1] as "isFeatured" | "isNew" | "isBest", value: parseInt(parts[2]) as 0 | 1 });
    } else if (bulkAction === "salePrice") {
      const price = bulkSalePrice ? Number(bulkSalePrice) : null;
      if (price !== null && price < 0) { toast.error("특가는 0원 이상이어야 합니다."); return; }
      bulkUpdateSalePriceMut.mutate({ productIds: selectedIds, salePrice: price });
    }
    setBulkAction("");
  };

  const createMut = trpc.product.create.useMutation({ onSuccess: () => { utils.admin.products.invalidate(); setPageMode("list"); toast.success("상품이 등록되었습니다."); } });
  const updateMut = trpc.product.update.useMutation({ onSuccess: () => { utils.admin.products.invalidate(); setPageMode("list"); toast.success("상품이 수정되었습니다."); } });
  const deleteMut = trpc.admin.deleteProduct.useMutation({ onSuccess: () => { utils.admin.products.invalidate(); toast.success("상품이 삭제되었습니다."); } });

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", slug: "", categoryId: cats?.[0]?.id ?? 0, price: 0, salePrice: null, description: "", content: "", thumbnail: "", images: [], stock: 100, status: "active", isFeatured: 0, isNew: 0, isBest: 0, noDiscount: 0, minGrade: "bronze", hashtags: [], pointRate: 0, pointRateType: "percent", sortOrder: 0 });
    setOptionGroups([]);
    setPageMode("form");
  };
  const openEdit = async (p: any) => {
    setEditItem(p);
    setForm({ name: p.name, slug: p.slug, categoryId: p.categoryId, price: p.price, salePrice: p.salePrice, description: p.description ?? "", content: p.content ?? "", thumbnail: p.thumbnail ?? "", images: p.images ?? [], stock: p.stock, status: p.status, isFeatured: p.isFeatured, isNew: p.isNew, isBest: p.isBest, noDiscount: (p as any).noDiscount ?? 0, minGrade: p.minGrade ?? "bronze", hashtags: p.hashtags ?? [], pointRate: p.pointRate ?? 0, pointRateType: p.pointRateType ?? "percent", sortOrder: p.sortOrder ?? 0 });
    // Load existing options
    try {
      const opts = await utils.product.getOptions.fetch({ productId: p.id });
      setOptionGroups((opts ?? []).map((o: any) => ({
        name: o.name,
        values: (o.values as { value: string; price: number; stock?: number }[]) ?? [],
        isRequired: o.isRequired ?? 1,
      })));
    } catch { setOptionGroups([]); }
    setPageMode("form");
  };
  const handleSave = () => {
    if (!form.name || !form.slug || !form.categoryId) { toast.error("필수 항목을 입력해주세요."); return; }
    // Validate options
    for (const og of optionGroups) {
      if (!og.name.trim()) { toast.error("옵션 그룹명을 입력해주세요."); return; }
      if (og.values.length === 0) { toast.error(`"${og.name}" 옵션에 값을 추가해주세요.`); return; }
      for (const v of og.values) {
        if (!v.value.trim()) { toast.error("옵션값을 입력해주세요."); return; }
        if (v.price < 0) { toast.error("옵션 판매금액은 0 이상이어야 합니다."); return; }
      }
    }
    const options = optionGroups.length > 0 ? optionGroups.map((og, i) => ({ name: og.name, values: og.values, isRequired: og.isRequired, sortOrder: i })) : undefined;
    const status = form.status as "active" | "inactive" | "soldout";
    // images[0]을 thumbnail로 자동 동기화
    const thumbnail = form.images.length > 0 ? form.images[0] : form.thumbnail;
    const saveData = { ...form, thumbnail, status };
    if (editItem) { updateMut.mutate({ id: editItem.id, ...saveData, options }); }
    else { createMut.mutate({ ...saveData, options }); }
  };

  // Option group helpers
  const addOptionGroup = () => setOptionGroups(prev => [...prev, { name: "", values: [{ value: "", price: form.salePrice ?? form.price, stock: 100 }], isRequired: 1 }]);
  const removeOptionGroup = (idx: number) => setOptionGroups(prev => prev.filter((_, i) => i !== idx));
  const updateOptionGroupName = (idx: number, name: string) => setOptionGroups(prev => prev.map((g, i) => i === idx ? { ...g, name } : g));
  const addOptionValue = (groupIdx: number) => setOptionGroups(prev => prev.map((g, i) => i === groupIdx ? { ...g, values: [...g.values, { value: "", price: form.salePrice ?? form.price, stock: 100 }] } : g));
  const removeOptionValue = (groupIdx: number, valIdx: number) => setOptionGroups(prev => prev.map((g, i) => i === groupIdx ? { ...g, values: g.values.filter((_, j) => j !== valIdx) } : g));
  const updateOptionValue = (groupIdx: number, valIdx: number, field: "value" | "englishValue" | "price" | "stock", val: string | number) => setOptionGroups(prev => prev.map((g, i) => i === groupIdx ? { ...g, values: g.values.map((v, j) => j === valIdx ? { ...v, [field]: val } : v) } : g));

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  if (pageMode === "form") {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setPageMode("list")}><ArrowLeft className="w-4 h-4 mr-1" /> 목록으로</Button>
          <h1 className="text-2xl font-bold">{editItem ? "상품 수정" : "상품 등록"}</h1>
        </div>
        <div className="space-y-4 max-w-5xl">

          {/* ── 카테고리 ── */}
          <div className="border rounded-xl p-5 bg-card">
            <label className="text-sm font-semibold block mb-3">카테고리</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}>
              <option value={0}>선택</option>
              {(cats ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* ── 두 칼럼: 상품 정보 + 이미지 ── */}
          <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">

            {/* 왼쪽: 상품명·가격·재고 */}
            <div className="border rounded-xl p-5 bg-card space-y-4">
              <p className="text-sm font-semibold text-muted-foreground border-b pb-2">상품명 · 가격 · 재고</p>

              <div>
                <label className="text-sm font-medium">상품명 *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="상품 이름" />
              </div>
              <div>
                <label className="text-sm font-medium">슬러그 (영문·관리용) *</label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="product-slug" />
              </div>
              <div>
                <label className="text-sm font-medium">간단설명 (상품명 아래 표시)</label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="상품 간단 설명" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">정가 (₩ · 판매가격) *</label>
                  <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">할인가 (₩ · 판매가)</label>
                  <Input type="number" value={form.salePrice ?? ""} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value ? Number(e.target.value) : null }))} placeholder="없으면 비워두세요" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">재고</label>
                  <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">포인트 적립</label>
                  <div className="flex items-center gap-1">
                    <select className="border rounded-lg px-2 py-2 text-sm bg-background w-16 shrink-0" value={form.pointRateType} onChange={e => setForm(f => ({ ...f, pointRateType: e.target.value as "percent" | "fixed" }))}>
                      <option value="percent">%</option>
                      <option value="fixed">원</option>
                    </select>
                    <Input type="number" min={0} max={form.pointRateType === "percent" ? 100 : 999999} value={form.pointRate} onChange={e => setForm(f => ({ ...f, pointRate: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">상태</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">판매중</option><option value="inactive">비활성</option><option value="soldout">품절</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">최소 구매 등급</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.minGrade} onChange={e => setForm(f => ({ ...f, minGrade: e.target.value as any }))}>
                    <option value="bronze">브론즈 (모든 회원)</option>
                    <option value="silver">실버 이상</option>
                    <option value="gold">골드 이상</option>
                    <option value="vip">VIP 이상</option>
                    <option value="vvip">VVIP 전용</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">상품 뱃지</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured === 1} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked ? 1 : 0 }))} /> 추천</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isNew === 1} onChange={e => setForm(f => ({ ...f, isNew: e.target.checked ? 1 : 0 }))} /> 신상품</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isBest === 1} onChange={e => setForm(f => ({ ...f, isBest: e.target.checked ? 1 : 0 }))} /> 베스트</label>
                  <label className="flex items-center gap-2 text-sm text-rose-600">
                    <input type="checkbox" className="accent-rose-600" checked={(form as any).noDiscount === 1} onChange={e => setForm(f => ({ ...f, noDiscount: e.target.checked ? 1 : 0 } as any))} />
                    할인 제외
                    <span className="text-xs text-muted-foreground font-normal">(쿠폰·특가 적용 안 됨)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">노출 순위 <span className="font-normal text-muted-foreground text-xs">0이 기본, 양수(10, 100...)일수록 하위 노출</span></label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} placeholder="0" />
              </div>

              <div>
                <label className="text-sm font-medium">해시태그 (엔터로 추가)</label>
                <div className="space-y-2 mt-1">
                  <div className="flex flex-wrap gap-2">
                    {form.hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-sm px-2 py-1 cursor-pointer hover:bg-destructive/20" onClick={() => setForm(f => ({ ...f, hashtags: f.hashtags.filter((_, idx) => idx !== i) }))}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="해시태그를 입력하고 엔터를 누르세요"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !form.hashtags.includes(value)) {
                          setForm(f => ({ ...f, hashtags: [...f.hashtags, value] }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 오른쪽: 상품 이미지 */}
            <div className="border rounded-xl p-5 bg-card">
              <MultiImageUploader
                images={form.images}
                onImagesChange={(urls) => setForm(f => ({ ...f, images: urls, thumbnail: urls[0] ?? f.thumbnail }))}
              />
            </div>
          </div>

          {/* ── 상품 옵션 ── */}
          <div className="border rounded-xl p-5 bg-card">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">상품 옵션</label>
              <Button type="button" variant="outline" size="sm" onClick={addOptionGroup}><Plus className="w-3.5 h-3.5 mr-1" /> 옵션 그룹 추가</Button>
            </div>
            {optionGroups.length === 0 && <p className="text-xs text-muted-foreground">옵션이 없습니다. 사이즈, 색상 등의 옵션을 추가하면 옵션별 판매금액을 설정할 수 있습니다.</p>}
            <div className="space-y-4">
              {optionGroups.map((group, gi) => (
                <div key={gi} className="border rounded-lg p-3 bg-secondary/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Input className="flex-1 h-8 text-sm font-medium" placeholder="옵션명 (예: 사이즈, 색상)" value={group.name} onChange={e => updateOptionGroupName(gi, e.target.value)} />
                    <Button type="button" variant="ghost" size="sm" className="text-destructive h-8 px-2" onClick={() => removeOptionGroup(gi)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_100px_80px_32px] gap-2 text-[11px] text-muted-foreground font-medium px-1">
                      <span>옵션값</span><span>영문값</span><span className="text-right">판매금액</span><span className="text-right">재고</span><span></span>
                    </div>
                    {group.values.map((v, vi) => (
                      <div key={vi} className="grid grid-cols-[1fr_1fr_100px_80px_32px] gap-2 items-center">
                        <Input className="h-8 text-sm" placeholder="옵션값 (예: S, M, L)" value={v.value} onChange={e => updateOptionValue(gi, vi, "value", e.target.value)} />
                        <Input className="h-8 text-sm" placeholder="English (e.g. S, M, L)" value={v.englishValue ?? ""} onChange={e => updateOptionValue(gi, vi, "englishValue", e.target.value)} />
                        <Input className="h-8 text-sm text-right" type="number" min={0} value={v.price} onChange={e => updateOptionValue(gi, vi, "price", Number(e.target.value))} />
                        <Input className="h-8 text-sm text-right" type="number" min={0} value={v.stock ?? 100} onChange={e => updateOptionValue(gi, vi, "stock", Number(e.target.value))} />
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeOptionValue(gi, vi)} disabled={group.values.length <= 1}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={() => addOptionValue(gi)}><Plus className="w-3 h-3 mr-1" /> 옵션값 추가</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 상세 설명 ── */}
          <div className="border rounded-xl p-5 bg-card">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">상세 설명</label>
              <ContentAIGenerateButton
                productId={editItem?.id}
                productName={form.name}
                productDescription={form.description}
                onGenerated={(html) => setForm(f => ({ ...f, content: html }))}
                disabled={!form.name.trim()}
              />
            </div>
            <RichTextEditor value={form.content} onChange={val => setForm(f => ({ ...f, content: val }))} minHeight={400} />
          </div>

          {editItem && (
            <>
              <Separator />
              <AdminProductInfo productId={editItem.id} productName={editItem.name} productDescription={editItem.description} />
            </>
          )}
        </div>
        <div className="flex gap-2 mt-6 justify-end max-w-5xl">
          <Button variant="outline" onClick={() => setPageMode("list")}>취소</Button>
          <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editItem ? "수정 저장" : "상품 등록"}</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">상품 관리 <span className="text-base font-normal text-muted-foreground">({data?.total ?? 0})</span></h1>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" /> 상품 등록</Button>
      </div>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="상품명 검색..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={filterParentCategoryId ?? ""} onChange={e => { const v = e.target.value ? Number(e.target.value) : undefined; setFilterParentCategoryId(v); setFilterCategoryId(undefined); setPage(1); }}>
          <option value="">1차 카테고리 (전체)</option>
          {parentCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={filterCategoryId ?? ""} onChange={e => { setFilterCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }} disabled={!filterParentCategoryId}>
          <option value="">2차 카테고리 (전체)</option>
          {subCatsOf(filterParentCategoryId).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
          <option value="newest">등록순 (최신)</option>
          <option value="sortOrder_asc">노출순위 (낮은순, -100이 최상위)</option>
          <option value="sortOrder_desc">노출순위 (높은순)</option>
          <option value="name_asc">이름순 ↑</option>
          <option value="name_desc">이름순 ↓</option>
          <option value="price_asc">가격 낮은순</option>
          <option value="price_desc">가격 높은순</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
          <option value={10}>10개</option>
          <option value={20}>20개</option>
          <option value={50}>50개</option>
          <option value={100}>100개</option>
        </select>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.length}개 선택됨</span>
            <select className="border rounded px-3 py-2 text-sm" value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
              <option value="">일괄 작업 선택</option>
              <option value="delete">삭제</option>
              <option value="status:active">판매중으로 변경</option>
              <option value="status:inactive">비활성으로 변경</option>
              <option value="status:soldout">품절로 변경</option>
              <optgroup label="포인트 적립률 (%)">
                <option value="pointRate:percent:0">적립 0%</option>
                <option value="pointRate:percent:1">적립 1%</option>
                <option value="pointRate:percent:2">적립 2%</option>
                <option value="pointRate:percent:3">적립 3%</option>
                <option value="pointRate:percent:5">적립 5%</option>
                <option value="pointRate:percent:10">적립 10%</option>
              </optgroup>
              <optgroup label="포인트 적립 (고정금액)">
                <option value="pointRate:fixed:500">적립 500원</option>
                <option value="pointRate:fixed:1000">적립 1,000원</option>
                <option value="pointRate:fixed:2000">적립 2,000원</option>
                <option value="pointRate:fixed:5000">적립 5,000원</option>
              </optgroup>
              <optgroup label="상품 플래그">
                <option value="flag:isFeatured:1">추천상품 ON</option>
                <option value="flag:isFeatured:0">추천상품 OFF</option>
                <option value="flag:isNew:1">신상품 ON</option>
                <option value="flag:isNew:0">신상품 OFF</option>
                <option value="flag:isBest:1">베스트 ON</option>
                <option value="flag:isBest:0">베스트 OFF</option>
              </optgroup>
              <optgroup label="특가(할인가) 설정">
                <option value="salePrice">특가가 일괄 설정</option>
              </optgroup>
              {cats?.map((c: any) => <option key={c.id} value={`category:${c.id}`}>{c.name}으로 이동</option>)}
            </select>
            {bulkAction === "salePrice" && (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  placeholder="특가세팅"
                  value={bulkSalePrice}
                  onChange={e => setBulkSalePrice(e.target.value)}
                  className="w-28 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">원</span>
              </div>
            )}
            <Button size="sm" onClick={handleBulkAction} disabled={!bulkAction || (bulkAction === "salePrice" && !bulkSalePrice)}>실행</Button>
          </div>
        )}
      </div>

      {isSortOrderMode && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <GripVertical className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>행을 드래그해서 노출순위를 조절하세요. 저장은 드롭 즉시 자동으로 됩니다.</span>
        </div>
      )}
      <div className="bg-card border rounded-xl overflow-hidden elegant-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-secondary/50 text-xs text-muted-foreground">
              {isSortOrderMode && <th className="py-3 px-2 w-8"></th>}
              <th className="text-center py-3 px-4 w-12"><input type="checkbox" checked={selectedIds.length === (data?.products ?? []).length && (data?.products ?? []).length > 0} onChange={toggleSelectAll} /></th>
              <th className="text-left py-3 px-4">ID</th><th className="text-left py-3 px-4">상품번호</th><th className="text-center py-3 px-4 w-20">이미지</th><th className="text-left py-3 px-4">상품명</th><th className="text-left py-3 px-4">1차 카테고리</th><th className="text-left py-3 px-4">2차 카테고리</th><th className="text-right py-3 px-4">가격</th><th className="text-right py-3 px-4">할인가</th><th className="text-center py-3 px-4">적립</th><th className="text-center py-3 px-4">재고</th><th className="text-center py-3 px-4">상태</th><th className="text-center py-3 px-4">노출순위</th><th className="text-center py-3 px-4">플래그</th><th className="text-center py-3 px-4">관리</th>
            </tr></thead>
            <tbody className="divide-y">
              {(isSortOrderMode ? localProducts : (data?.products ?? [])).map((p: any, idx: number) => {
                const cat = findCat(p.categoryId);
                const parentCat = cat?.parentId ? findCat(cat.parentId) : null;
                const primary = parentCat ?? cat;
                const secondary = parentCat ? cat : null;
                const isDragging = dragRowIdx === idx;
                const isDragOver = dragOverIdx === idx;
                return (
                <tr
                  key={p.id}
                  draggable={isSortOrderMode}
                  onDragStart={isSortOrderMode ? (e) => handleRowDragStart(e, idx) : undefined}
                  onDragOver={isSortOrderMode ? (e) => handleRowDragOver(e, idx) : undefined}
                  onDrop={isSortOrderMode ? (e) => handleRowDrop(e, idx) : undefined}
                  onDragEnd={isSortOrderMode ? handleRowDragEnd : undefined}
                  className={`hover:bg-accent/20 transition-colors ${isDragging ? "opacity-40" : ""} ${isDragOver ? "border-t-2 border-primary" : ""}`}
                >
                  {isSortOrderMode && (
                    <td className="py-3 px-2 text-center cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
                    </td>
                  )}
                  <td className="py-3 px-4 text-center"><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                  <td className="py-3 px-4 text-sm">{p.id}</td>
                  <td className="py-3 px-4 text-sm font-mono text-muted-foreground">{p.itId ?? "-"}</td>
                  <td className="py-2 px-4 text-center">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} className="w-12 h-12 object-cover rounded border mx-auto" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded border mx-auto flex items-center justify-center text-[10px] text-muted-foreground">없음</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium max-w-[200px] truncate">{p.name}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{primary?.name ?? "-"}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{secondary?.name ?? "-"}</td>
                  <td className="py-3 px-4 text-sm text-right price-text">{formatPrice(p.price)}</td>
                  <td className="py-3 px-4 text-sm text-right price-text text-rose-600">
                    {inlineEditingId === p.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <Input
                          type="number"
                          min={0}
                          value={inlineSalePrice}
                          onChange={e => setInlineSalePrice(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const price = inlineSalePrice ? Number(inlineSalePrice) : null;
                              if (price !== null && price < 0) { toast.error("\ud2b9\uac00\ub294 0\uc6d0 \uc774\uc0c1\uc774\uc5b4\uc57c \ud569\ub2c8\ub2e4."); return; }
                              inlineUpdateMut.mutate({ id: p.id, salePrice: price });
                            } else if (e.key === 'Escape') {
                              setInlineEditingId(null);
                            }
                          }}
                          className="w-24 h-7 text-sm text-right"
                          autoFocus
                        />
                        <span className="text-xs text-muted-foreground">\uc6d0</span>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => { setInlineEditingId(p.id); setInlineSalePrice(p.salePrice ? String(p.salePrice) : ""); }}
                        title="\ud074\ub9ad\ud558\uc5ec \ud2b9\uac00 \uc218\uc815"
                      >
                        {p.salePrice ? formatPrice(p.salePrice) : "-"}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-center">{p.pointRateType === "fixed" ? `${(p.pointRate ?? 0).toLocaleString()}원` : `${p.pointRate ?? 0}%`}</td>
                  <td className="py-3 px-4 text-sm text-center">{p.stock}</td>
                  <td className="py-3 px-4 text-center"><Badge variant={p.status === "active" ? "default" : "secondary"} className="text-[10px]">{p.status === "active" ? "판매중" : p.status === "soldout" ? "품절" : "비활성"}</Badge></td>
                  <td className="py-3 px-4 text-center text-xs text-muted-foreground font-mono">{p.sortOrder ?? 0}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {p.isFeatured ? <Badge variant="outline" className="text-[9px] px-1">추천</Badge> : null}
                      {p.isNew ? <Badge variant="outline" className="text-[9px] px-1">신상</Badge> : null}
                      {p.isBest ? <Badge variant="outline" className="text-[9px] px-1">베스트</Badge> : null}
                      {(p as any).noDiscount ? <Badge variant="outline" className="text-[9px] px-1 border-rose-400 text-rose-600">할인제외</Badge> : null}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMut.mutate({ id: p.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(data?.products ?? []).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">{isLoading ? "로딩 중..." : "상품이 없습니다"}</p>}
      </div>

      <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />
    </div>
  );
}

// ─── Order Management ───
function AdminOrders() {
  const [, setLocation] = useLocation();
  // 적용된 필터 (쿼리에 사용)
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [noTrackingFilter, setNoTrackingFilter] = useState(false);
  const [refundFilter, setRefundFilter] = useState(false);
  const _fmtDate = (d: Date) => d.toISOString().split("T")[0];
  const _threeMoAgo = () => { const d = new Date(); d.setMonth(d.getMonth() - 3); return _fmtDate(d); };
  const _today = () => _fmtDate(new Date());
  const [dateFrom, setDateFrom] = useState(_threeMoAgo);
  const [dateTo, setDateTo] = useState(_today);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [sourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // 입력 중인 필터 (검색 버튼 클릭 시 적용)
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingDateFrom, setPendingDateFrom] = useState(_threeMoAgo);
  const [pendingDateTo, setPendingDateTo] = useState(_today);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState("");
  const [pendingSortBy, setPendingSortBy] = useState("createdAt");
  const [pendingSortAsc, setPendingSortAsc] = useState(false);
  // 활성 날짜 프리셋 추적 (UI 하이라이트용)
  const [activeDatePreset, setActiveDatePreset] = useState("3개월");

  const { data } = trpc.admin.orders.useQuery({
    page, limit: pageSize,
    status: statusFilter || undefined,
    noTrackingNumber: noTrackingFilter || undefined,
    hasRefund: refundFilter || undefined,
    source: sourceFilter || undefined,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    paymentMethod: paymentMethod || undefined,
    sortBy: sortBy !== "createdAt" ? sortBy : undefined,
    sortAsc: sortAsc || undefined,
  });
  const { data: tabCounts } = trpc.admin.orderTabCounts.useQuery({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
  const utils = trpc.useUtils();

  const applyFilters = () => {
    setSearch(pendingSearch);
    setDateFrom(pendingDateFrom);
    setDateTo(pendingDateTo);
    setPaymentMethod(pendingPaymentMethod);
    setSortBy(pendingSortBy);
    setSortAsc(pendingSortAsc);
    setPage(1);
  };
  const resetFilters = () => {
    setPendingSearch(""); setSearch("");
    setPendingDateFrom(_threeMoAgo()); setDateFrom(_threeMoAgo());
    setPendingDateTo(_today()); setDateTo(_today());
    setPendingPaymentMethod(""); setPaymentMethod("");
    setPendingSortBy("createdAt"); setSortBy("createdAt");
    setPendingSortAsc(false); setSortAsc(false);
    setStatusFilter(""); setNoTrackingFilter(false);
    setActiveDatePreset("3개월");
    setPage(1);
  };
  const applyDatePreset = (preset: string) => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    setActiveDatePreset(preset);
    if (preset === "오늘") {
      setPendingDateFrom(fmt(today)); setPendingDateTo(fmt(today));
    } else if (preset === "7일") {
      const d = new Date(today); d.setDate(d.getDate() - 7);
      setPendingDateFrom(fmt(d)); setPendingDateTo(fmt(today));
    } else if (preset === "14일") {
      const d = new Date(today); d.setDate(d.getDate() - 14);
      setPendingDateFrom(fmt(d)); setPendingDateTo(fmt(today));
    } else if (preset === "1개월") {
      const d = new Date(today); d.setMonth(d.getMonth() - 1);
      setPendingDateFrom(fmt(d)); setPendingDateTo(fmt(today));
    } else if (preset === "3개월") {
      const d = new Date(today); d.setMonth(d.getMonth() - 3);
      setPendingDateFrom(fmt(d)); setPendingDateTo(fmt(today));
    } else {
      setPendingDateFrom(""); setPendingDateTo("");
    }
  };
  const updateStatus = trpc.admin.updateOrderStatus.useMutation({ onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.orderTabCounts.invalidate(); toast.success("상태가 변경되었습니다."); } });
  const statuses = ["pending", "paid", "preparing", "shipping", "delivered", "customs_hold", "cancelled"];
  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  // 인라인 운송장 입력/수정 (아이템별, key = "orderId-itemId")
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [inlineTrackingNumber, setInlineTrackingNumber] = useState("");
  const [inlineCarrierId, setInlineCarrierId] = useState<number | undefined>(undefined);
  const { data: carriersData } = trpc.shipping.carriers.useQuery();
  const registerShipment = trpc.shipping.adminCreateShipment.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.orderTabCounts.invalidate(); setEditingKey(null); setInlineTrackingNumber(""); setInlineCarrierId(undefined); toast.success("운송장이 등록되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const updateShipmentInfo = trpc.shipping.adminUpdateShipmentInfo.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.orderTabCounts.invalidate(); setEditingKey(null); setInlineTrackingNumber(""); setInlineCarrierId(undefined); toast.success("운송장이 수정되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const confirmCustoms = trpc.shipping.adminConfirmCustoms.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.orderTabCounts.invalidate(); toast.success("통관검사를 확인 처리했습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const confirmPaymentInList = trpc.payment.adminConfirmPayment.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.orderTabCounts.invalidate(); toast.success("입금이 확인되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const markOrderRefunded = trpc.order.adminMarkOrderRefunded.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.orderTabCounts.invalidate(); utils.order.adminRefundList.invalidate(); toast.success("환불 완료 처리되었습니다."); },
    onError: (e) => toast.error(e.message),
  });
  const startEditTracking = (key: string, currentTracking?: string) => {
    setEditingKey(key);
    setInlineTrackingNumber(currentTracking || "");
    setInlineCarrierId(undefined);
  };
  const saveItemTracking = (order: any, item: any) => {
    if (!inlineTrackingNumber.trim()) { toast.error("운송장 번호를 입력해주세요."); return; }
    if (item.shipment?.id) {
      updateShipmentInfo.mutate({ shipmentId: item.shipment.id, trackingNumber: inlineTrackingNumber.trim() });
    } else {
      registerShipment.mutate({ orderId: order.id, orderItemId: item.id, trackingNumber: inlineTrackingNumber.trim(), carrierId: inlineCarrierId });
    }
  };
  // 접힌 주문 그룹 (collapsed order IDs)
  const [collapsedOrders, setCollapsedOrders] = useState<Set<number>>(new Set());
  const toggleCollapse = (orderId: number) => {
    setCollapsedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
      return next;
    });
  };
  const expandAllOrders = () => setCollapsedOrders(new Set());
  const collapseAllOrders = () => setCollapsedOrders(new Set((data?.orders ?? []).map((o: any) => o.id)));

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const bulkUpdateStatusMut = trpc.bulkActions.updateOrdersStatus.useMutation({ onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.orderTabCounts.invalidate(); setSelectedIds([]); toast.success("상태가 변경되었습니다."); }, onError: (err) => { toast.error("상태 변경 오류: " + err.message); } });
  const bulkDeleteMut = trpc.bulkActions.deleteOrders.useMutation({ onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.orderTabCounts.invalidate(); setSelectedIds([]); toast.success("선택된 주문이 삭제되었습니다."); }, onError: (err) => { toast.error("삭제 오류: " + err.message); } });

  const toggleSelectAll = () => {
    if (selectedIds.length === (data?.orders ?? []).length) setSelectedIds([]);
    else setSelectedIds((data?.orders ?? []).map((o: any) => o.id));
  };
  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };
  const handleBulkAction = () => {
    if (selectedIds.length === 0) { toast.error("주문을 선택해주세요."); return; }
    if (!bulkAction) { toast.error("작업을 선택해주세요."); return; }
    if (bulkAction === "delete") {
      if (confirm(`선택된 ${selectedIds.length}개 주문을 삭제하시겠습니까?`)) {
        bulkDeleteMut.mutate({ ids: selectedIds });
      }
    } else {
      bulkUpdateStatusMut.mutate({ orderIds: selectedIds, status: bulkAction as "pending" | "paid" | "preparing" | "shipping" | "delivered" | "cancelled" });
    }
    setBulkAction("");
  };

  // 상태별 통계 계산
  const statusStats = {
    pending: (data?.orders ?? []).filter((o: any) => o.status === "pending").length,
    paid: (data?.orders ?? []).filter((o: any) => o.status === "paid").length,
    preparing: (data?.orders ?? []).filter((o: any) => o.status === "preparing").length,
    shipping: (data?.orders ?? []).filter((o: any) => o.status === "shipping").length,
    delivered: (data?.orders ?? []).filter((o: any) => o.status === "delivered").length,
    customs_hold: (data?.orders ?? []).filter((o: any) => o.status === "customs_hold").length,
    cancelled: (data?.orders ?? []).filter((o: any) => o.status === "cancelled").length,
  };

  // 배송 타임라인 모달 (목록에서 직접 열기)
  const [listTrackingItem, setListTrackingItem] = useState<any | null>(null);
  const { data: listModalData, refetch: refetchListModal } = trpc.shipping.adminGetShipmentTracking.useQuery(
    { shipmentId: listTrackingItem?.shipment?.id ?? 0 },
    { enabled: !!listTrackingItem?.shipment?.id }
  );
  const refreshListTracking = trpc.shipping.adminRefreshTracking.useMutation({
    onSuccess: (res: any) => {
      if (!res.success) { toast.info(res.message || "배송 정보를 아직 조회할 수 없습니다."); return; }
      if (res.eventsCount > 0) toast.success(`${res.eventsCount}개 이벤트 업데이트`);
      else toast.info("최신 상태입니다.");
      setTimeout(() => refetchListModal(), 1500);
    },
    onError: (e: any) => toast.error(e.message),
  });
  const listShipmentStatusLabels: Record<string, string> = {
    ready: "배송 준비", picked_up: "상품 수거", accepted: "접수",
    export_customs: "출발국 통관", in_transit: "배송 중", in_transit_intl: "국제운송",
    in_transit_domestic: "국내배송", arrived_destination: "도착국 도착",
    import_customs: "도착국 통관", customs_cleared: "통관 완료",
    out_for_delivery: "배달 출발", delivered: "배달 완료",
    failed: "배송 실패", returned: "반송",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">주문 관리 <span className="text-base font-normal text-muted-foreground">({data?.total ?? 0})</span></h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={expandAllOrders}>
            <ChevronDown className="w-3.5 h-3.5" />펼치기
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={collapseAllOrders}>
            <ChevronRight className="w-3.5 h-3.5" />접기
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setLocation("/admin/excel-upload/tracking")}>
            <Upload className="w-3.5 h-3.5" />엑셀 업로드
          </Button>
        </div>
      </div>

      {/* 필터 박스 */}
      <div className="bg-card border rounded-xl mb-4 elegant-shadow overflow-hidden">
        {/* 검색 */}
        <div className="flex gap-2 p-3 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-8 text-sm"
              placeholder="주문번호, 수취인명, 전화번호 검색..."
              value={pendingSearch}
              onChange={e => setPendingSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyFilters()}
            />
          </div>
          <Button size="sm" className="h-8 px-4 bg-rose-600 hover:bg-rose-700 text-white gap-1.5" onClick={applyFilters}>
            <Search className="w-3.5 h-3.5" />검색
          </Button>
        </div>

        {/* 주문일자 */}
        <div className="flex items-center gap-0 border-b">
          <div className="w-24 px-3 py-2.5 text-xs font-semibold text-muted-foreground bg-secondary/40 self-stretch flex items-center flex-shrink-0">주문일자</div>
          <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
            <input type="date" className="border rounded px-2 py-1 text-xs h-7 bg-background" value={pendingDateFrom} onChange={e => { setPendingDateFrom(e.target.value); setActiveDatePreset(""); }} />
            <span className="text-xs text-muted-foreground">~</span>
            <input type="date" className="border rounded px-2 py-1 text-xs h-7 bg-background" value={pendingDateTo} onChange={e => { setPendingDateTo(e.target.value); setActiveDatePreset(""); }} />
            {(["오늘", "7일", "14일", "1개월", "3개월", "전체"] as const).map(p => (
              <button key={p} onClick={() => applyDatePreset(p)} className={`text-xs px-2.5 py-1 rounded border h-7 transition-colors ${activeDatePreset === p ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-accent"}`}>{p}</button>
            ))}
          </div>
        </div>

        {/* 입금/주문상태 */}
        <div className="flex items-center gap-0 border-b">
          <div className="w-24 px-3 py-2.5 text-xs font-semibold text-muted-foreground bg-secondary/40 self-stretch flex items-center flex-shrink-0">입금/주문상태</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2">
            {([
              { label: "전체", value: "", noTracking: false, count: tabCounts?.total },
              { label: "입금전", value: "pending", noTracking: false, count: tabCounts?.pending },
              { label: "결제완료", value: "paid", noTracking: false, count: tabCounts?.paid },
              { label: "상품준비중", value: "preparing", noTracking: false, count: tabCounts?.preparing },
              { label: "배송중", value: "shipping", noTracking: false, count: tabCounts?.shipping },
              { label: "배송완료", value: "delivered", noTracking: false, count: tabCounts?.delivered },
              { label: "통관검사", value: "customs_hold", noTracking: false, count: tabCounts?.customs_hold },
              { label: "취소", value: "cancelled", noTracking: false, count: tabCounts?.cancelled },
              { label: "일부취소", value: "partial_cancel", noTracking: false, count: tabCounts?.partialCancelled },
              { label: "배송지연", value: "", noTracking: true, count: undefined },
            ] as const).map(opt => {
              const isActive = opt.noTracking ? (noTrackingFilter && !refundFilter) : (statusFilter === opt.value && !noTrackingFilter && !refundFilter);
              return (
                <label key={`${opt.value}-${opt.noTracking}`} className="flex items-center gap-1.5 cursor-pointer text-xs py-0.5">
                  <input type="radio" name="orderStatusFilter" className="accent-rose-600" checked={isActive}
                    onChange={() => { if (opt.noTracking) { setNoTrackingFilter(true); setStatusFilter(""); setRefundFilter(false); } else { setStatusFilter(opt.value); setNoTrackingFilter(false); setRefundFilter(false); } setPage(1); }} />
                  <span className={`${isActive ? "font-semibold text-rose-600" : "text-foreground"} ${opt.value === "customs_hold" ? "text-red-600" : ""}`}>
                    {opt.label}{opt.count !== undefined ? <span className="text-muted-foreground ml-0.5 font-normal">{opt.count}</span> : null}
                  </span>
                </label>
              );
            })}
            {/* 환불 필터 - 별도 탭 */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs py-0.5">
              <input type="radio" name="orderStatusFilter" className="accent-rose-600" checked={refundFilter}
                onChange={() => { setRefundFilter(true); setStatusFilter(""); setNoTrackingFilter(false); setPage(1); }} />
              <span className={refundFilter ? "font-semibold text-rose-600" : "text-foreground"}>
                환불{tabCounts?.refunded !== undefined ? <span className="text-muted-foreground ml-0.5 font-normal">{tabCounts.refunded}</span> : null}
              </span>
            </label>
          </div>
        </div>

        {/* 결제수단 */}
        <div className="flex items-center gap-0 border-b">
          <div className="w-24 px-3 py-2.5 text-xs font-semibold text-muted-foreground bg-secondary/40 self-stretch flex items-center flex-shrink-0">결제수단</div>
          <div className="flex flex-wrap gap-x-4 px-3 py-2">
            {([{ label: "전체", value: "" }, { label: "카드결제", value: "card" }, { label: "무통장입금", value: "bank_transfer" }] as const).map(opt => (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-xs py-0.5">
                <input type="radio" name="paymentMethodFilter" className="accent-rose-600" checked={pendingPaymentMethod === opt.value}
                  onChange={() => setPendingPaymentMethod(opt.value)} />
                <span className={pendingPaymentMethod === opt.value ? "font-semibold text-rose-600" : "text-foreground"}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 표시 건수 */}
        <div className="flex items-center gap-0 border-b">
          <div className="w-24 px-3 py-2.5 text-xs font-semibold text-muted-foreground bg-secondary/40 self-stretch flex items-center flex-shrink-0">표시 건수</div>
          <div className="flex flex-wrap gap-x-4 px-3 py-2">
            {([20, 50, 100] as const).map(n => (
              <label key={n} className="flex items-center gap-1.5 cursor-pointer text-xs py-0.5">
                <input type="radio" name="pageSizeFilter" className="accent-rose-600" checked={pageSize === n}
                  onChange={() => { setPageSize(n); setPage(1); }} />
                <span className={pageSize === n ? "font-semibold text-rose-600" : "text-foreground"}>{n}개</span>
              </label>
            ))}
          </div>
        </div>

        {/* 정렬 + 하단 버튼 */}
        <div className="flex items-center gap-0">
          <div className="w-24 px-3 py-2.5 text-xs font-semibold text-muted-foreground bg-secondary/40 self-stretch flex items-center flex-shrink-0">정렬</div>
          <div className="flex flex-1 items-center justify-between flex-wrap gap-2 px-3 py-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {([{ label: "주문일", value: "createdAt" }, { label: "금액", value: "totalAmount" }, { label: "상태", value: "status" }] as const).map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-xs py-0.5">
                  <input type="radio" name="sortByFilter" className="accent-rose-600" checked={pendingSortBy === opt.value}
                    onChange={() => setPendingSortBy(opt.value)} />
                  <span className={pendingSortBy === opt.value ? "font-semibold text-rose-600" : "text-foreground"}>{opt.label}</span>
                </label>
              ))}
              <label className="flex items-center gap-1.5 cursor-pointer text-xs py-0.5">
                <input type="checkbox" className="accent-rose-600" checked={pendingSortAsc} onChange={e => setPendingSortAsc(e.target.checked)} />
                <span className={pendingSortAsc ? "font-semibold text-rose-600" : "text-foreground"}>오름차순</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-7 text-xs px-3 bg-rose-600 hover:bg-rose-700 text-white gap-1" onClick={applyFilters}>
                <Search className="w-3 h-3" />검색
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs px-3 gap-1" onClick={resetFilters}>
                <X className="w-3 h-3" />초기화
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => { downloadOrdersExcel(data?.orders ?? []); toast.success("엑셀 다운로드 중..."); }}>
                <Upload className="w-3.5 h-3.5" />엑셀
              </Button>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{selectedIds.length}개 선택</span>
                  <select className="border rounded px-2 py-1 text-xs h-7" value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
                    <option value="">일괄작업</option>
                    <option value="delete">삭제</option>
                    {statuses.map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}로 변경</option>)}
                  </select>
                  <Button size="sm" className="h-7 text-xs" onClick={handleBulkAction} disabled={!bulkAction}>실행</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden elegant-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50 text-xs text-muted-foreground border-b">
                <th className="text-center py-3 px-3 w-10"><input type="checkbox" checked={selectedIds.length === (data?.orders ?? []).length && (data?.orders ?? []).length > 0} onChange={toggleSelectAll} /></th>
                <th className="text-left py-3 px-3">주문번호</th>
                <th className="text-left py-3 px-3">주문 상품</th>
                <th className="text-right py-3 px-3">금액</th>
                <th className="text-center py-3 px-3">상태</th>
                <th className="text-left py-3 px-3 min-w-[180px]">운송장</th>
                <th className="text-center py-3 px-3">작업</th>
              </tr>
            </thead>
            <tbody>
              {(data?.orders ?? []).map((o: any) => {
                const isCollapsed = collapsedOrders.has(o.id);
                const items: any[] = o.items ?? [];
                return (
                  <Fragment key={o.id}>
                    {/* 주문 그룹 헤더 */}
                    <tr className="bg-secondary/60 border-t border-b border-secondary hover:bg-secondary/80 transition-colors">
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)} />
                      </td>
                      <td colSpan={6} className="py-2 px-3">
                        <div className="flex items-start flex-wrap gap-y-0.5">
                          {/* 왼쪽: 주문 핵심 정보 */}
                          <div className="flex-shrink-0 flex items-center gap-2 flex-nowrap pr-4">
                            <button
                              className="flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                              onClick={() => toggleCollapse(o.id)}
                            >
                              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              <span className="font-mono text-primary">{formatOrderNumber(o.orderNumber)}</span>
                              <span className="text-[11px] font-normal text-muted-foreground">
                                {(() => { const d = new Date(o.createdAt); return d.toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12: false }); })()}
                              </span>
                            </button>
                            <span className="text-xs text-muted-foreground">{items.length}개 상품</span>
                            <span className="flex items-center gap-1">
                              {o.paymentMethod === "card" && (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-300 flex-shrink-0">카</span>
                              )}
                              {(o.paymentMethod === "bank_transfer" || o.paymentMethod === "virtual_account") && (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex-shrink-0">무</span>
                              )}
                              <span className="text-xs font-semibold price-text">실결제: {formatPrice(o.totalAmount - (o.discountAmount ?? 0) - (o.pointsUsed ?? 0))}</span>
                              {(o.pointsUsed ?? 0) > 0 && (
                                <span className="text-[10px] text-rose-500 font-medium">포인트: {(o.pointsUsed ?? 0).toLocaleString()}</span>
                              )}
                            </span>
                            {o.paymentMethod === "bank_transfer" && o.paymentStatus === "pending" && o.paymentId && (
                              <button
                                className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 hover:bg-amber-200 transition-colors disabled:opacity-50"
                                disabled={confirmPaymentInList.isPending}
                                onClick={(e) => { e.stopPropagation(); confirmPaymentInList.mutate({ paymentId: o.paymentId }); }}
                              >입금확인</button>
                            )}
                          </div>
                          {/* 오른쪽: 수취인 연락처 정보 — 공간 부족 시 다음 줄 */}
                          <div className="ml-auto flex items-center flex-wrap justify-end gap-x-2 gap-y-0.5">
                            {o.userEmail && (
                              <span
                                className="text-[11px] font-bold whitespace-nowrap cursor-pointer hover:underline hover:text-primary"
                                onClick={() => o.userId && (window.location.href = `/admin/users/${o.userId}`)}
                              >{o.userEmail}</span>
                            )}
                            {o.recipientName && (
                              <span
                                className="text-[11px] font-bold whitespace-nowrap cursor-pointer hover:underline hover:text-primary"
                                onClick={() => o.userId && (window.location.href = `/admin/users/${o.userId}`)}
                              >{o.recipientName}</span>
                            )}
                            {o.recipientPhone && <span className="text-[11px] text-muted-foreground whitespace-nowrap">{o.recipientPhone.replace(/^0/, '+82-').replace(/(\+82-)(\d{1,2})(\d{3,4})(\d{4})$/, '+82-$2-$3-$4')}</span>}
                            {o.zipCode && <span className="text-[11px] text-muted-foreground whitespace-nowrap">〒{o.zipCode}</span>}
                            {o.address1 && <span className="text-[11px] text-muted-foreground whitespace-nowrap">{o.address1}{o.address2 ? ` ${o.address2}` : ""}</span>}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* 환불 탭: 환불 금액 + 계좌 + 완료 버튼 행 */}
                    {refundFilter && (() => {
                      const cancelledItems = items.filter((i: any) => i.cancelledAt && (i.refundAmount ?? 0) > 0);
                      if (cancelledItems.length === 0) return null;
                      const isItemRefunded = (i: any) => i.refundedAt && !(typeof i.refundedAt === 'string' && i.refundedAt.startsWith('0000'));
                      const pendingItems = cancelledItems.filter((i: any) => !isItemRefunded(i));
                      const completedItems = cancelledItems.filter((i: any) => isItemRefunded(i));
                      const allRefunded = pendingItems.length === 0 && completedItems.length > 0;
                      const totalRefund = pendingItems.reduce((s: number, i: any) => s + (i.refundAmount ?? 0), 0);
                      const bankInfoRaw = cancelledItems.map((i: any) => i.cancelReason ?? "").join(" ");
                      const bankMatch = bankInfoRaw.match(/\[환불계좌\]\s*(.+)/);
                      const bankInfo = bankMatch ? bankMatch[1].trim() : null;
                      return (
                        <tr className={`border-b ${allRefunded ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20" : "bg-rose-50/30 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/20"}`}>
                          <td className="py-2 px-3" />
                          <td colSpan={6} className="py-2 px-3">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">환불 금액</span>
                                <span className={`text-sm font-bold ${allRefunded ? "text-emerald-600" : "text-rose-600"}`}>{(totalRefund).toLocaleString()}원</span>
                              </div>
                              {bankInfo && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">환불 계좌</span>
                                  <span className="text-xs font-medium font-mono">{bankInfo}</span>
                                </div>
                              )}
                              {pendingItems.length > 0 && (
                                <button
                                  className="ml-auto px-3 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-700 transition-colors disabled:opacity-50"
                                  disabled={markOrderRefunded.isPending}
                                  onClick={() => markOrderRefunded.mutate({ orderId: o.id })}
                                >환불 완료</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })()}
                    {/* 아이템별 행 */}
                    {!isCollapsed && (() => {
                      // 쿠폰 할인은 noDiscount 상품 제외한 금액 기준으로 비례 배분
                      const couponEligibleSubtotal = items
                        .filter((i: any) => !i.cancelledAt && i.product?.noDiscount !== 1)
                        .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
                      return items.map((item: any) => {
                      const itemKey = `${o.id}-${item.id}`;
                      const isEditing = editingKey === itemKey;
                      const itemShipment = item.shipment;
                      const itemStatus = itemShipment?.status ?? o.status;
                      const itemCancelled = !!item.cancelledAt;
                      return (
                        <tr key={item.id} className={`border-t hover:bg-accent/10 transition-colors align-middle ${itemCancelled ? "bg-rose-50/20 dark:bg-rose-950/10 opacity-60" : ""}`}>
                          <td className="py-3 px-3" />
                          {/* 주문번호 / #아이템ID */}
                          <td className="py-3 px-3">
                            <div className="text-xs font-mono font-medium text-muted-foreground">{formatOrderNumber(o.orderNumber)}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">#{String(item.id).padStart(6, '0')}</div>
                          </td>
                          {/* 상품 */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {(item.productThumbnail || item.product?.thumbnail) && (
                                <img
                                  src={proxyImage(item.productThumbnail || item.product?.thumbnail)}
                                  alt={item.productName}
                                  className="w-10 h-10 rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => item.product?.slug && (window.location.href = productHref(item.product.slug))}
                                />
                              )}
                              <div className="min-w-0">
                                <div
                                  className={`text-xs font-medium cursor-pointer hover:underline hover:text-primary ${itemCancelled ? "line-through text-muted-foreground" : ""}`}
                                  onClick={() => item.product?.slug && (window.location.href = productHref(item.product.slug))}
                                >{item.productName}</div>
                                {item.options && Object.keys(item.options).length > 0 && (
                                  <div className="text-[11px] text-muted-foreground">{Object.values(item.options).join(", ")}</div>
                                )}
                                <div className="text-[11px] text-muted-foreground">{item.quantity}개 × {formatPrice(item.price)}</div>
                                {item.product?.noDiscount === 1 && (
                                  <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-300 font-medium">할인 제외 상품</span>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* 금액 */}
                          <td className="py-3 px-3 text-right">
                            {(() => {
                              const rawTotal = item.price * item.quantity;
                              const isNoDiscount = item.product?.noDiscount === 1;
                              const itemCoupon = (!isNoDiscount && (o.couponDiscount ?? 0) > 0 && couponEligibleSubtotal > 0 && !itemCancelled)
                                ? Math.round((o.couponDiscount ?? 0) * rawTotal / couponEligibleSubtotal)
                                : 0;
                              const finalAmount = rawTotal - itemCoupon;
                              return (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className={`text-xs font-bold ${itemCancelled ? "line-through text-muted-foreground" : "price-text"}`}>{formatPrice(finalAmount)}</span>
                                  {itemCoupon > 0 && !itemCancelled && (
                                    <span className="text-[10px] text-muted-foreground line-through">{formatPrice(rawTotal)}</span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          {/* 상태 */}
                          <td className="py-3 px-3 text-center">
                            {itemCancelled ? (
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-400 dark:bg-rose-950/40 dark:text-rose-400">취소됨</span>
                            ) : (
                              <>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getOrderStatusColor(item.itemStatus ?? o.status)}`}>{getOrderStatusLabel(item.itemStatus ?? o.status)}</span>
                                {o.status === "customs_hold" && item.shipment?.customsConfirmed === 1 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-200 ml-1">확인</span>
                                )}
                              </>
                            )}
                          </td>
                          {/* 운송장 */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Input
                                className="h-7 !text-[11px] w-[110px] font-mono tracking-wide"
                                placeholder="운송장 번호"
                                defaultValue={itemShipment?.trackingNumber ?? ""}
                                key={`${itemKey}-${itemShipment?.trackingNumber ?? ""}`}
                                disabled={["pending", "paid"].includes(o.status) || itemCancelled}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (!val) return;
                                    const detected = detectCarrierByTracking(val, carriersData ?? []);
                                    if (itemShipment?.id) {
                                      updateShipmentInfo.mutate({ shipmentId: itemShipment.id, trackingNumber: val, ...(detected ? { carrierId: detected.id } : {}) });
                                    } else {
                                      registerShipment.mutate({ orderId: o.id, orderItemId: item.id, trackingNumber: val, ...(detected ? { carrierId: detected.id } : {}) });
                                    }
                                  }
                                }}
                                onBlur={e => {
                                  const val = e.target.value.trim();
                                  if (!val || val === (itemShipment?.trackingNumber ?? "")) return;
                                  const detected = detectCarrierByTracking(val, carriersData ?? []);
                                  if (itemShipment?.id) {
                                    updateShipmentInfo.mutate({ shipmentId: itemShipment.id, trackingNumber: val, ...(detected ? { carrierId: detected.id } : {}) });
                                  } else {
                                    registerShipment.mutate({ orderId: o.id, orderItemId: item.id, trackingNumber: val, ...(detected ? { carrierId: detected.id } : {}) });
                                  }
                                }}
                              />
                              {itemShipment?.trackingNumber && (
                                <button
                                  className="text-muted-foreground hover:text-primary p-1 flex-shrink-0"
                                  onClick={() => setListTrackingItem({ ...item, _orderId: o.id })}
                                  title="배송 타임라인"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {(() => {
                              const st = item.itemStatus ?? o.status;
                              if (st === "shipping_ready") return (
                                <div className="mt-1 h-[3px] w-[140px] rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "15%" }} />
                                </div>
                              );
                              if (st === "shipping" || st === "shipped" || st === "in_transit") return (
                                <div className="mt-1 h-[3px] w-[140px] rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "55%" }} />
                                </div>
                              );
                              if (st === "customs_hold") return (
                                <div className="mt-1 h-[3px] w-[140px] rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full" style={{ width: "75%" }} />
                                </div>
                              );
                              if (st === "delivered") return (
                                <div className="mt-1 h-[3px] w-[140px] rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
                                </div>
                              );
                              return null;
                            })()}
                          </td>
                          {/* 작업 */}
                          <td className="py-3 px-3 w-20">
                            <div className="flex items-center justify-end gap-0.5">
                              {o.status === "customs_hold" && item.shipment && (
                                <button
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap transition-colors ${item.shipment.customsConfirmed === 1 ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"}`}
                                  onClick={() => confirmCustoms.mutate({ shipmentId: item.shipment.id, confirm: item.shipment.customsConfirmed !== 1 })}
                                  title={item.shipment.customsConfirmed === 1 ? "통관검사 확인 해제" : "통관검사 확인"}
                                  disabled={confirmCustoms.isPending}
                                >
                                  {item.shipment.customsConfirmed === 1 ? "확인완료" : "미확인"}
                                </button>
                              )}
                              <button className="text-muted-foreground hover:text-primary p-1" onClick={() => setLocation(`/admin/orders/${o.orderNumber}`)} title="주문 상세">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {(data?.orders ?? []).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">주문이 없습니다</p>}
      </div>

      <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />

      {/* 배송 타임라인 모달 (목록에서 직접 열기) */}
      {listTrackingItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setListTrackingItem(null)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between p-5 border-b flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-bold text-base">배송 타임라인</span>
                  {listModalData?.history && (
                    <span className="text-sm text-muted-foreground">{listModalData.history.length}건</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{listTrackingItem.productName}</p>
              </div>
              <button
                onClick={() => setListTrackingItem(null)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors ml-4 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 새로고침 */}
            <div className="flex items-center justify-end px-5 py-3 border-b flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={() => { refreshListTracking.mutate({ orderId: listTrackingItem._orderId ?? listTrackingItem.orderId }); setTimeout(() => refetchListModal(), 2000); }}
                disabled={refreshListTracking.isPending}
              >
                <RotateCcw className={`w-3 h-3 ${refreshListTracking.isPending ? "animate-spin" : ""}`} />
                새로고침
              </Button>
            </div>

            {/* 추적번호 */}
            <div className="mx-4 mt-4 border rounded-xl p-4 flex-shrink-0">
              <p className="text-[11px] text-muted-foreground mb-0.5">
                추적번호 · {listModalData?.carrier?.name ?? listTrackingItem.shipment?.carrier?.name ?? "택배사"}
              </p>
              <p className="font-bold text-base">{listTrackingItem.shipment?.trackingNumber}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                  onClick={() => { navigator.clipboard.writeText(listTrackingItem.shipment?.trackingNumber ?? ""); toast.success("복사됨"); }}>
                  <Copy className="w-3 h-3" />복사
                </Button>
                <Button size="sm" className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <a href={`https://t.17track.net/en#nums=${listTrackingItem.shipment?.trackingNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />17track
                  </a>
                </Button>
                {/^\d{10,13}$/.test(listTrackingItem.shipment?.trackingNumber ?? "") && (
                  <Button size="sm" className="h-7 text-xs gap-1 bg-orange-600 hover:bg-orange-700 text-white" asChild>
                    <a href={`https://track.shiptrack.co.kr/cjkorex/${listTrackingItem.shipment?.trackingNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />CJ조회
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* 타임라인 */}
            <div className="overflow-y-auto flex-1 px-4 py-4">
              {!listModalData ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-40" />
                  <p className="text-sm">불러오는 중...</p>
                </div>
              ) : !listModalData.history || listModalData.history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">아직 배송 이력이 없습니다</p>
                  <p className="text-xs mt-1">새로고침 버튼으로 최신 정보를 불러오세요</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {listModalData.history.map((entry: any, idx: number) => {
                    const isFirst = idx === 0;
                    const isDelivered = entry.status === "delivered" || (entry.description ?? "").includes("배달 완료");
                    const iconBg = isDelivered ? "bg-blue-500 text-white" : (isFirst ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground");
                    return (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          {idx < listModalData.history.length - 1 && <div className="w-px flex-1 bg-border min-h-4" />}
                        </div>
                        <div className={`flex-1 min-w-0 ${idx < listModalData.history.length - 1 ? "pb-4" : "pb-1"}`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${isDelivered ? "text-blue-600 font-semibold" : (isFirst ? "text-foreground" : "text-muted-foreground")}`}>
                              {renderShippingDesc(entry.description || listShipmentStatusLabels[entry.status] || entry.status)}
                            </span>
                            {isFirst && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${isDelivered ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-primary/10 text-primary border-primary/20"}`}>현재</span>
                            )}
                          </div>
                          {entry.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 flex-shrink-0" />{entry.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(entry.occurredAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between px-5 py-3 border-t flex-shrink-0">
              <span className="text-xs text-muted-foreground">
                {listModalData?.updatedAt ? `최종동기: ${formatDateTime(listModalData.updatedAt)}` : "자동 업데이트"}
              </span>
              <Button size="sm" variant="outline" onClick={() => setListTrackingItem(null)} className="h-7 text-xs">닫기</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Order Detail ───
function AdminOrderDetail({ id }: { id: string }) {
  const { data: order } = trpc.order.adminGetById.useQuery({ id });
  const { data: shipmentData } = trpc.shipping.adminTrackOrder.useQuery({ orderId: Number(id) }, { enabled: !!order && ["shipping", "delivered", "customs_hold"].includes(order.status) });
  const { data: carriers } = trpc.shipping.adminCarriers.useQuery();
  const { data: paymentData, refetch: refetchPayment } = trpc.payment.adminGetPaymentByOrderId.useQuery({ orderId: Number(id) }, { enabled: !!order });
  const utils = trpc.useUtils();
  const updateStatus = trpc.admin.updateOrderStatus.useMutation({ onSuccess: () => { utils.order.adminGetById.invalidate({ id }); utils.admin.orderTabCounts.invalidate(); toast.success("상태가 변경되었습니다."); } });
  const confirmPayment = trpc.payment.adminConfirmPayment.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.admin.orderTabCounts.invalidate();
      refetchPayment();
      toast.success("입금이 확인되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });
  const cancelPaymentConfirmation = trpc.payment.adminCancelPaymentConfirmation.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.admin.orderTabCounts.invalidate();
      refetchPayment();
      toast.success("입금확인이 취소되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });
  const statuses = ["pending", "paid", "preparing", "shipping", "delivered", "customs_hold", "cancelled"];
  
  // 운송장 등록 상태
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const registerShipment = trpc.shipping.adminCreateShipment.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.shipping.adminTrackOrder.invalidate({ orderId: Number(id) });
      utils.admin.orderTabCounts.invalidate();
      toast.success("운송장이 등록되었습니다.");
      setShowShipmentForm(false);
      setTrackingNumber("");
    },
    onError: (e) => toast.error(e.message),
  });

  // 아이템별 인라인 운송장 수정
  const updateShipmentInfoInline = trpc.shipping.adminUpdateShipmentInfo.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.shipping.adminTrackOrder.invalidate({ orderId: Number(id) });
    },
    onError: (e) => toast.error(e.message),
  });
  const registerShipmentItem = trpc.shipping.adminCreateShipment.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.shipping.adminTrackOrder.invalidate({ orderId: Number(id) });
    },
    onError: (e) => toast.error(e.message),
  });
  const [itemInputs, setItemInputs] = useState<Record<number, { tracking: string; carrierId?: number }>>({});
  const [editingItems, setEditingItems] = useState<Set<number>>(new Set());
  const [itemStatusInputs, setItemStatusInputs] = useState<Record<number, string>>({});
  const [trackingModalItem, setTrackingModalItem] = useState<any | null>(null);
  const { data: modalTrackingData, refetch: refetchModalTracking } = trpc.shipping.adminGetShipmentTracking.useQuery(
    { shipmentId: trackingModalItem?.shipment?.id ?? 0 },
    { enabled: !!trackingModalItem?.shipment?.id }
  );
  const getItemTracking = (item: any) => itemInputs[item.id]?.tracking ?? (item.shipment?.trackingNumber ?? "");
  const getItemCarrierId = (item: any) => itemInputs[item.id]?.carrierId ?? (item.shipment?.carrierId ?? undefined);
  const startEditItem = (item: any) => {
    setItemInputs(prev => ({ ...prev, [item.id]: { tracking: item.shipment?.trackingNumber ?? "", carrierId: item.shipment?.carrierId ?? undefined } }));
    setEditingItems(prev => new Set([...prev, item.id]));
  };
  const cancelEditItem = (itemId: number) => {
    setEditingItems(prev => { const n = new Set(prev); n.delete(itemId); return n; });
  };
  const saveItemTrackingDetail = (item: any, val: string, carrierId?: number) => {
    if (!val.trim()) return;
    if (item.shipment?.id) {
      updateShipmentInfoInline.mutate({ shipmentId: item.shipment.id, trackingNumber: val.trim() });
    } else {
      registerShipmentItem.mutate({ orderId: Number(id), orderItemId: item.id, trackingNumber: val.trim(), carrierId });
    }
  };

  // 부분 취소 상태
  const [showPartialCancelDialog, setShowPartialCancelDialog] = useState(false);
  const [cancelItemIds, setCancelItemIds] = useState<number[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const partialCancel = trpc.order.adminPartialCancel.useMutation({
    onSuccess: (result) => {
      utils.order.adminGetById.invalidate({ id });
      utils.admin.orders.invalidate();
      utils.admin.orderTabCounts.invalidate();
      utils.order.adminRefundList.invalidate();
      setShowPartialCancelDialog(false);
      setCancelItemIds([]);
      setCancelReason("");
      if (result.allCancelled) {
        toast.success(`전체 상품이 취소되었습니다. 환불 금액: ${formatPrice(result.refundAmount ?? 0)}`);
      } else {
        const parts = [`${result.cancelledCount}개 상품이 취소되었습니다.`, `환불 금액: ${formatPrice(result.refundAmount ?? 0)}`];
        if ((result.couponReduction ?? 0) > 0) parts.push(`(쿠폰 차감 -${formatPrice(result.couponReduction ?? 0)} 포함)`);
        toast.success(parts.join(" "));
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const uncancelItem = trpc.order.adminUncancelItem.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.admin.orders.invalidate();
      utils.admin.orderTabCounts.invalidate();
      utils.order.adminRefundList.invalidate();
      toast.success("상품 취소가 복원되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });
  const markItemRefunded = trpc.order.adminMarkRefunded.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.admin.orders.invalidate();
      utils.admin.orderTabCounts.invalidate();
      utils.order.adminRefundList.invalidate();
      toast.success("환불 완료 처리되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });
  const markItemRefundPending = trpc.order.adminMarkRefundPending.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.admin.orders.invalidate();
      utils.admin.orderTabCounts.invalidate();
      utils.order.adminRefundList.invalidate();
      toast.success("환불 대기 상태로 변경되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateItemStatus = trpc.order.adminUpdateItemStatus.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.admin.orderTabCounts.invalidate();
      toast.success("상품 상태가 변경되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  // 배송 정보 수정 상태 (Dialog)
  const [showEditShipmentDialog, setShowEditShipmentDialog] = useState(false);
  const [editShipmentId, setEditShipmentId] = useState<number>(0);
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const updateShipmentInfo = trpc.shipping.adminUpdateShipmentInfo.useMutation({
    onSuccess: () => {
      utils.order.adminGetById.invalidate({ id });
      utils.shipping.adminTrackOrder.invalidate({ orderId: Number(id) });
      toast.success("배송 정보가 수정되었습니다.");
      setShowEditShipmentDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const refreshTracking = trpc.shipping.adminRefreshTracking.useMutation({
    onSuccess: (data: { success: boolean; eventsCount: number; delivered?: boolean; message?: string }) => {
      if (!data.success) {
        toast.info(data.message || "배송 정보를 아직 조회할 수 없습니다.");
        return;
      }
      if (data.delivered) {
        toast.success("배송이 완료되었습니다!");
      } else if (data.eventsCount > 0) {
        toast.success(`배송 정보가 업데이트되었습니다. (${data.eventsCount}개 새 이벤트)`);
      } else {
        toast.info("배송 정보가 최신 상태입니다.");
      }
      utils.order.adminGetById.invalidate({ id });
      utils.shipping.adminTrackOrder.invalidate({ orderId: Number(id) });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // 17track 추적 링크
  const trackingUrl = shipmentData?.trackingNumber
    ? `https://t.17track.net/en#nums=${shipmentData.trackingNumber}`
    : null;

  const shipmentStatusLabels: Record<string, string> = {
    ready: "배송 준비",
    picked_up: "상품 수거",
    accepted: "접수",
    export_customs: "출발국 통관",
    in_transit: "배송 중",
    in_transit_intl: "국제운송",
    in_transit_domestic: "국내배송",
    arrived_destination: "도착국 도착",
    import_customs: "도착국 통관",
    customs_cleared: "통관 완료",
    customs_departure: "통관 출발",
    customs_arrival: "통관 도착",
    out_for_delivery: "배달 출발",
    delivered: "배달 완료",
    failed: "배송 실패",
    returned: "반송",
    alert: "주의",
  };

  // 국제배송 단계 정의
  const intlShipmentSteps = [
    { key: "accepted", label: "접수", icon: Package },
    { key: "export_customs", label: "출발국 통관", icon: Shield },
    { key: "in_transit_intl", label: "국제운송", icon: Plane },
    { key: "import_customs", label: "도착국 통관", icon: Globe },
    { key: "out_for_delivery", label: "현지배송", icon: Truck },
    { key: "delivered", label: "배달완료", icon: CheckCircle2 },
  ];

  function mapToIntlStep(status: string): number {
    const mapping: Record<string, number> = {
      pending: 0, ready: 0, accepted: 0, picked_up: 0,
      export_customs: 1, departed_origin: 2,
      in_transit: 2, in_transit_intl: 2,
      arrived_destination: 3, import_customs: 3, customs_cleared: 3,
      customs_departure: 1, customs_arrival: 3,
      in_transit_domestic: 4, out_for_delivery: 4,
      delivered: 5, failed: -1, returned: -1, alert: -1,
    };
    return mapping[status] ?? 0;
  }

  if (!order) return <div className="text-center py-12 text-muted-foreground">로딩 중...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}><ChevronLeft className="w-4 h-4 mr-1" /> 목록</Button>
        <h1 className="text-2xl font-bold">주문 상세</h1>
        <div className="ml-auto">
          {order.status !== "cancelled" && (order.items ?? []).some((i: any) => !i.cancelledAt) && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-rose-300 text-rose-600 hover:bg-rose-50 gap-1.5"
              onClick={() => { setCancelItemIds([]); setCancelReason(""); setShowPartialCancelDialog(true); }}
            >
              <X className="w-3.5 h-3.5" />부분 취소
            </Button>
          )}
        </div>
      </div>

      {/* 부분 취소 다이얼로그 */}
      <Dialog open={showPartialCancelDialog} onOpenChange={setShowPartialCancelDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>부분 취소</DialogTitle>
            <DialogDescription>취소할 상품을 선택하세요. 선택한 상품의 재고가 복구되고 주문 금액이 재계산됩니다.</DialogDescription>
          </DialogHeader>
          {(() => {
            const activeItems = (order.items ?? []).filter((i: any) => !i.cancelledAt);
            const activeTotal = activeItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
            const coupon = order.couponDiscount ?? 0;
            const gradeDiscount = Math.max(0, (order.discountAmount ?? 0) - coupon);
            // 쿠폰 할인 기준: noDiscount 상품 제외
            const couponEligibleTotal = activeItems
              .filter((i: any) => i.product?.noDiscount !== 1)
              .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

            const selectedItems = activeItems.filter((i: any) => cancelItemIds.includes(i.id));
            const selectedTotal = selectedItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
            const selectedEligibleTotal = selectedItems
              .filter((i: any) => i.product?.noDiscount !== 1)
              .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
            const couponReduction = couponEligibleTotal > 0 ? Math.round(coupon * selectedEligibleTotal / couponEligibleTotal) : 0;
            const discountReduction = activeTotal > 0 ? Math.round(gradeDiscount * selectedTotal / activeTotal) : 0;
            const refundAmount = selectedTotal - couponReduction - discountReduction;

            return (
              <>
                <div className="space-y-3 my-2 max-h-72 overflow-y-auto">
                  {activeItems.map((item: any) => {
                    const itemTotal = item.price * item.quantity;
                    const isNoDiscount = item.product?.noDiscount === 1;
                    const itemCoupon = (!isNoDiscount && couponEligibleTotal > 0) ? Math.round(coupon * itemTotal / couponEligibleTotal) : 0;
                    const itemDiscount = activeTotal > 0 ? Math.round(gradeDiscount * itemTotal / activeTotal) : 0;
                    const itemRefund = itemTotal - itemCoupon - itemDiscount;
                    const isSelected = cancelItemIds.includes(item.id);
                    return (
                      <label key={item.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? "border-rose-300 bg-rose-50 dark:bg-rose-950/20" : "hover:bg-accent"}`}>
                        <input
                          type="checkbox"
                          className="accent-rose-600 w-4 h-4 flex-shrink-0"
                          checked={isSelected}
                          onChange={e => setCancelItemIds(prev =>
                            e.target.checked ? [...prev, item.id] : prev.filter((x: number) => x !== item.id)
                          )}
                        />
                        {(item.productThumbnail || item.product?.thumbnail) && (
                          <img src={proxyImage(item.productThumbnail || item.product?.thumbnail)} alt={item.productName} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">수량 {item.quantity}개 · {formatPrice(itemTotal)}</span>
                            {isNoDiscount && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-300 font-medium">할인 제외 상품</span>
                            )}
                            {itemCoupon > 0 && (
                              <span className="text-xs text-rose-600 bg-rose-100 dark:bg-rose-950/30 px-1.5 py-0.5 rounded font-medium">쿠폰 -{formatPrice(itemCoupon)}</span>
                            )}
                            {itemDiscount > 0 && (
                              <span className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded font-medium">할인 -{formatPrice(itemDiscount)}</span>
                            )}
                          </div>
                          {(itemCoupon > 0 || itemDiscount > 0) && (
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">환불 예상: {formatPrice(itemRefund)}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {cancelItemIds.length > 0 && (
                  <div className="rounded-lg bg-muted/50 border p-3 text-sm space-y-1.5">
                    <p className="font-semibold text-sm mb-1">환불 예상 내역</p>
                    <div className="flex justify-between text-muted-foreground">
                      <span>취소 상품 합계 ({cancelItemIds.length}개)</span>
                      <span>{formatPrice(selectedTotal)}</span>
                    </div>
                    {couponReduction > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span className="flex items-center gap-1">
                          <span className="text-xs px-1 py-0.5 bg-rose-100 text-rose-600 rounded font-semibold">쿠폰</span>
                          차감
                        </span>
                        <span>-{formatPrice(couponReduction)}</span>
                      </div>
                    )}
                    {discountReduction > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>상품 할인 차감</span>
                        <span>-{formatPrice(discountReduction)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t pt-1.5">
                      <span>환불 금액</span>
                      <span className="text-emerald-700 dark:text-emerald-400">{formatPrice(refundAmount)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">취소 사유 (선택)</label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="고객 요청, 재고 부족 등..."
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                  />
                </div>
                <DialogFooter className="gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowPartialCancelDialog(false)}>닫기</Button>
                  <Button
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                    disabled={cancelItemIds.length === 0 || partialCancel.isPending}
                    onClick={() => partialCancel.mutate({ orderId: order.id, itemIds: cancelItemIds, reason: cancelReason || undefined })}
                  >
                    {partialCancel.isPending ? "처리 중..." : `${cancelItemIds.length}개 취소 (환불 ${formatPrice(refundAmount)})`}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 elegant-shadow">
            <h3 className="font-semibold mb-4">주문 정보</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">주문번호:</span> <span className="font-mono font-medium">{formatOrderNumber(order.orderNumber)}</span></div>
              <div><span className="text-muted-foreground">주문일:</span> {formatDateTime(order.createdAt)}</div>
            </div>
          </div>

          {/* 구매 상품 목록 */}
          {(() => {
            const allItems: any[] = order.items ?? [];
            const filledCount = allItems.filter((i: any) => i.shipment?.trackingNumber).length;
            const missingCount = allItems.length - filledCount;
            return (
              <div className="bg-card border rounded-xl p-6 elegant-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">구매 상품 목록 ({allItems.length}개)</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>송장입력</span>
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${allItems.length ? filledCount / allItems.length * 100 : 0}%` }} />
                      </div>
                      <span>{filledCount}/{allItems.length}</span>
                    </div>
                    {missingCount > 0 ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400 font-semibold">{missingCount}개 미입력</span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold">모두 입력됨</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {allItems.map((item: any) => {
                    const isCancelled = !!item.cancelledAt;
                    const hasTracking = !!item.shipment?.trackingNumber && !isCancelled;
                    const isEditing = editingItems.has(item.id);
                    const inputTracking = getItemTracking(item);
                    const inputCarrierId = getItemCarrierId(item);
                    const carrierName = (carriers ?? []).find((c: any) => c.id === item.shipment?.carrierId)?.name;
                    const itemStatus = itemStatusInputs[item.id] ?? item.itemStatus ?? order.status;

                    return (
                      <div key={item.id} className={`border rounded-xl overflow-hidden transition-colors ${isCancelled ? "border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 opacity-60" : hasTracking ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/10" : ""}`}>
                        {/* 헤더 */}
                        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${isCancelled ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30" : hasTracking ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/30" : "bg-secondary/50"}`}>
                          <span className="text-xs font-mono font-semibold text-muted-foreground">
                            주문번호 {formatOrderNumber(order.orderNumber)}
                            <span className="ml-2 opacity-50">#{String(item.id).padStart(6, '0')}</span>
                          </span>
                          {isCancelled ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <X className="w-3 h-3" />취소됨
                              </span>
                              {item.refundedAt ? (
                                <>
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />환불 완료 {formatDateTime(item.refundedAt)}
                                  </span>
                                  <button
                                    className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border hover:bg-accent flex items-center gap-1 disabled:opacity-50"
                                    disabled={markItemRefundPending.isPending}
                                    onClick={() => markItemRefundPending.mutate({ itemId: item.id })}
                                  ><RotateCcw className="w-3 h-3" />환불취소</button>
                                </>
                              ) : (item.refundAmount ?? 0) > 0 ? (
                                <button
                                  className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-1 disabled:opacity-50"
                                  disabled={markItemRefunded.isPending}
                                  onClick={() => markItemRefunded.mutate({ itemId: item.id })}
                                ><Check className="w-3 h-3" />환불 완료 ({formatPrice(item.refundAmount)})</button>
                              ) : null}
                            </div>
                          ) : hasTracking ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />{getOrderStatusLabel(itemStatus)}
                            </span>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getOrderStatusColor(itemStatus)}`}>{getOrderStatusLabel(itemStatus)}</span>
                          )}
                        </div>

                        {/* 상품 정보 */}
                        <div className="flex items-center gap-4 px-4 py-4">
                          {(item.productThumbnail || item.product?.thumbnail) && (
                            <img src={proxyImage(item.productThumbnail || item.product?.thumbnail)} alt={item.productName} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-snug">{item.productName}</p>
                            {item.options && <p className="text-xs text-muted-foreground mt-0.5">{Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(", ")}</p>}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">수량 {item.quantity}개</span>
                              <span className="text-xs text-muted-foreground">단가 {formatPrice(item.price)}</span>
                              <span className="text-xs font-bold">소계 {formatPrice(item.price * item.quantity)}</span>
                              {(() => {
                                const itemTotal = item.price * item.quantity;
                                const isNoDiscount = item.product?.noDiscount === 1;
                                const allActiveItems = (order.items ?? []).filter((i: any) => !i.cancelledAt);
                                const couponEligSubtotal = allActiveItems
                                  .filter((i: any) => i.product?.noDiscount !== 1)
                                  .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
                                const itemCoupon = (!isNoDiscount && (order.couponDiscount ?? 0) > 0 && couponEligSubtotal > 0)
                                  ? Math.round((order.couponDiscount ?? 0) * itemTotal / couponEligSubtotal)
                                  : 0;
                                return (
                                  <>
                                    {isNoDiscount && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-300 font-medium">할인 제외 상품</span>
                                    )}
                                    {itemCoupon > 0 && (
                                      <span className="text-xs text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">쿠폰 -{formatPrice(itemCoupon)}</span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* 송장 영역 - 취소된 항목은 숨김 */}
                        {!isCancelled && (hasTracking && !isEditing ? (
                          <div className="flex items-center gap-2 px-4 py-3 border-b flex-wrap">
                            <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            {carrierName && <span className="text-sm text-muted-foreground">{carrierName}</span>}
                            <span className="text-sm font-bold text-primary">{item.shipment.trackingNumber}</span>
                            <button
                              className="text-xs border rounded px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center gap-1"
                              onClick={() => startEditItem(item)}
                            >
                              <Pencil className="w-3 h-3" />수정
                            </button>
                            <button
                              className="text-xs border rounded px-2 py-1 text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center gap-1"
                              onClick={() => setTrackingModalItem(item)}
                            >
                              <Search className="w-3 h-3" />추적
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 border-b flex-wrap">
                            <select
                              className="h-9 text-sm border rounded-lg px-2 bg-background text-foreground min-w-[130px] flex-shrink-0"
                              value={inputCarrierId ?? ""}
                              onChange={e => setItemInputs(prev => ({ ...prev, [item.id]: { tracking: inputTracking, carrierId: e.target.value ? Number(e.target.value) : undefined } }))}
                            >
                              <option value="">택배사 선택</option>
                              {(carriers ?? []).map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <Input
                              className="h-9 text-sm font-mono flex-1 min-w-[160px]"
                              placeholder="송장번호 입력"
                              value={inputTracking}
                              onChange={e => setItemInputs(prev => ({ ...prev, [item.id]: { tracking: e.target.value, carrierId: inputCarrierId } }))}
                              onKeyDown={e => {
                                if (e.key === "Enter" && inputTracking.trim()) {
                                  saveItemTrackingDetail(item, inputTracking, inputCarrierId);
                                  cancelEditItem(item.id);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-9 px-4 bg-pink-500 hover:bg-pink-600 text-white gap-1.5 flex-shrink-0"
                              disabled={!inputTracking.trim() || registerShipmentItem.isPending || updateShipmentInfoInline.isPending}
                              onClick={() => { saveItemTrackingDetail(item, inputTracking, inputCarrierId); cancelEditItem(item.id); }}
                            >
                              <Save className="w-3.5 h-3.5" />저장
                            </Button>
                            {isEditing && (
                              <Button size="sm" variant="ghost" className="h-9 text-xs" onClick={() => cancelEditItem(item.id)}>닫기</Button>
                            )}
                          </div>
                        ))}

                        {/* 상태 변경 - 항상 표시 */}
                        <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
                          {isCancelled && (
                            <span className="text-xs text-rose-400 flex items-center gap-1 mr-1">
                              <X className="w-3 h-3" />취소됨 — 다른 상태로 변경 시 복원됩니다
                            </span>
                          )}
                          <div className="flex items-center gap-2 ml-auto">
                            <select
                              className="h-8 text-xs border rounded-lg px-2 bg-background text-foreground"
                              value={itemStatus}
                              onChange={e => setItemStatusInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                            >
                              {statuses.map(s => <option key={s} value={s}>{getOrderStatusLabel(s)}</option>)}
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-8 text-xs px-3 ${!isCancelled && itemStatus === "cancelled" ? "border-rose-300 text-rose-600 hover:bg-rose-50" : isCancelled && itemStatus !== "cancelled" ? "border-blue-300 text-blue-600 hover:bg-blue-50" : ""}`}
                              onClick={() => {
                                if (isCancelled) {
                                  uncancelItem.mutate({ orderId: order.id, itemId: item.id, status: itemStatus });
                                } else if (itemStatus === "cancelled") {
                                  partialCancel.mutate({ orderId: order.id, itemIds: [item.id] });
                                } else {
                                  updateItemStatus.mutate({ itemId: item.id, status: itemStatus });
                                }
                              }}
                              disabled={updateStatus.isPending || partialCancel.isPending || uncancelItem.isPending || updateItemStatus.isPending}
                            >
                              {isCancelled && itemStatus !== "cancelled" ? "복원" : "변경"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 elegant-shadow">
            <h3 className="font-semibold mb-4">배송 정보</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">수령인:</span> {order.recipientName}{(order as any).recipientNameEn ? ` (${(order as any).recipientNameEn})` : ""}</div>
              <div><span className="text-muted-foreground">연락처:</span> {order.recipientPhone ? order.recipientPhone.replace(/^0/, '+82-').replace(/(\+82-)(\d{1,2})(\d{3,4})(\d{4})$/, '+82-$2-$3-$4') : "-"}</div>
              <div><span className="text-muted-foreground">우편번호:</span> {order.zipCode}</div>
              <div><span className="text-muted-foreground">주소:</span> {order.address1} {order.address2}</div>
              {(order as any).addressEn1 && (
                <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs text-blue-600 dark:text-blue-400">
                  <span className="font-medium">영문주소:</span> {(order as any).addressEn2 ? `${(order as any).addressEn2}, ${(order as any).addressEn1}` : (order as any).addressEn1}
                </div>
              )}
              {order.memo && <div><span className="text-muted-foreground">메모:</span> {order.memo}</div>}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 elegant-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">결제 정보</h3>
              {paymentData && paymentData.status === "pending" && (
                <Button
                  size="sm"
                  className="gap-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={confirmPayment.isPending}
                  onClick={() => confirmPayment.mutate({ paymentId: paymentData.id })}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {confirmPayment.isPending ? "처리 중..." : "입금 확인"}
                </Button>
              )}
              {paymentData && paymentData.status === "confirmed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-7 text-xs border-rose-400 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20"
                  disabled={cancelPaymentConfirmation.isPending}
                  onClick={() => { if (window.confirm("입금확인을 취소하시겠습니까? 주문 상태가 입금 대기로 돌아갑니다.")) cancelPaymentConfirmation.mutate({ paymentId: paymentData.id }); }}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {cancelPaymentConfirmation.isPending ? "처리 중..." : "입금확인 취소"}
                </Button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">상품 금액</span><span className="price-text">{formatPrice(order.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">배송비 (국제배송)</span><span className="text-emerald-600 font-medium">무료</span></div>
              {(order.couponDiscount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 bg-rose-100 text-rose-600 dark:bg-rose-950/30 rounded font-semibold">쿠폰</span>
                    할인
                    {(order as any).couponName && (
                      <span className="text-xs px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded font-medium">{(order as any).couponName}</span>
                    )}
                  </span>
                  <span className="text-rose-600 font-medium">-{formatPrice(order.couponDiscount ?? 0)}</span>
                </div>
              )}
              {((order.discountAmount ?? 0) - (order.couponDiscount ?? 0)) > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">등급 할인</span><span className="text-rose-600">-{formatPrice((order.discountAmount ?? 0) - (order.couponDiscount ?? 0))}</span></div>
              )}
              {order.pointsUsed > 0 && <div className="flex justify-between"><span className="text-muted-foreground">포인트 사용</span><span className="text-rose-600">-{formatPrice(order.pointsUsed)}</span></div>}
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>총 결제금액</span>
                <span className="price-text">{formatPrice(order.totalAmount + order.shippingFee - (order.pointsUsed ?? 0) - (order.discountAmount ?? 0))}</span>
              </div>
            </div>
            {paymentData && paymentData.paymentMethod === "bank_transfer" && (
              <div className={`mt-4 rounded-lg p-3 text-sm space-y-1.5 ${paymentData.status === "confirmed" ? "bg-emerald-50 dark:bg-emerald-950/20" : paymentData.status === "pending" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/50"}`}>
                <div className="flex items-center gap-2 font-medium mb-2">
                  {paymentData.status === "confirmed"
                    ? <Fragment><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-emerald-700 dark:text-emerald-400">입금 확인 완료</span></Fragment>
                    : paymentData.status === "pending"
                    ? <Fragment><Clock className="w-4 h-4 text-amber-600" /><span className="text-amber-700 dark:text-amber-400">입금 대기 중</span></Fragment>
                    : <Fragment><AlertCircle className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">취소됨</span></Fragment>
                  }
                </div>
                {paymentData.bankAccount && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">입금 계좌</span>
                    <span className="font-medium">{paymentData.bankAccount.bankName} {paymentData.bankAccount.accountNumber}</span>
                  </div>
                )}
                {paymentData.depositorName && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">입금자명</span>
                    <span className="font-medium">{paymentData.depositorName}</span>
                  </div>
                )}
                {paymentData.depositAmount && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">입금 금액</span>
                    <span className="font-bold price-text">{formatPrice(paymentData.depositAmount)}</span>
                  </div>
                )}
                {paymentData.status === "pending" && paymentData.expiresAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">입금 기한</span>
                    <span className="font-medium text-rose-600">{formatDateTime(paymentData.expiresAt)}</span>
                  </div>
                )}
                {paymentData.status === "confirmed" && paymentData.confirmedAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">확인 시각</span>
                    <span className="font-medium text-emerald-600">{formatDateTime(paymentData.confirmedAt)}</span>
                  </div>
                )}
              </div>
            )}
            {(() => {
              const cancelledItems = (order.items ?? []).filter((i: any) => !!i.cancelledAt);
              if (cancelledItems.length === 0) return null;
              if (paymentData?.status === "pending") return null; // 미입금 상태: 환불 정보 미표기
              const cancelledTotal = cancelledItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
              const refundBankLines: { itemName: string; bankInfo: string }[] = cancelledItems
                .map((i: any) => {
                  if (!i.cancelReason) return null;
                  const m = i.cancelReason.match(/\[환불계좌\]\s*(.+)/);
                  return m ? { itemName: i.productName, bankInfo: m[1].trim() } : null;
                })
                .filter(Boolean);
              const currentCoupon = order.couponDiscount ?? 0;
              // 쿠폰 차감: 잔여 쿠폰 × 취소 쿠폰적용금액 / 잔여 쿠폰적용금액
              const activeItems2 = (order.items ?? []).filter((i: any) => !i.cancelledAt);
              const couponEligibleActive = activeItems2.filter((i: any) => i.product?.noDiscount !== 1).reduce((s: number, i: any) => s + i.price * i.quantity, 0);
              const couponEligibleCancelled = cancelledItems.filter((i: any) => i.product?.noDiscount !== 1).reduce((s: number, i: any) => s + i.price * i.quantity, 0);
              const couponReduction = (currentCoupon > 0 && couponEligibleActive > 0)
                ? Math.round(currentCoupon * couponEligibleCancelled / couponEligibleActive)
                : (currentCoupon > 0 && couponEligibleActive === 0 ? currentCoupon : 0);
              const gradeDiscount = (order.discountAmount ?? 0) - currentCoupon;
              const gradeReduction = gradeDiscount > 0
                ? Math.round(gradeDiscount * cancelledTotal / (order.totalAmount || 1))
                : 0;
              const refundAmount = cancelledTotal - couponReduction - gradeReduction;
              return (
                <div className="mt-4 rounded-lg p-3 text-sm space-y-1.5 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/40">
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-rose-700 dark:text-rose-400">취소 / 환불 정보</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">취소 상품 ({cancelledItems.length}개)</span>
                    <span className="font-medium">{formatPrice(cancelledTotal)}</span>
                  </div>
                  {couponReduction > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">쿠폰 할인 차감</span>
                      <span className="text-rose-500">-{formatPrice(couponReduction)}</span>
                    </div>
                  )}
                  {gradeReduction > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">등급 할인 차감</span>
                      <span className="text-rose-500">-{formatPrice(gradeReduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs border-t border-pink-200 dark:border-pink-800/40 pt-1.5 font-bold">
                    <span className="text-rose-700 dark:text-rose-400">환불 금액</span>
                    <span className="text-rose-600">{formatPrice(refundAmount)}</span>
                  </div>
                  {cancelledItems.some((i: any) => i.refundedAt) && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-medium">환불 완료:</span>
                      <span>{formatDateTime(cancelledItems.find((i: any) => i.refundedAt)?.refundedAt)}</span>
                    </div>
                  )}
                  {refundBankLines.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-t border-pink-200 dark:border-pink-800/40 pt-2">
                      {refundBankLines.map((r, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded px-2 py-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-amber-800 dark:text-amber-300">환불 계좌</span>
                            <span className="text-amber-900 dark:text-amber-200 ml-1">{r.bankInfo}</span>
                          </div>
                          <button
                            className="text-amber-600 hover:text-amber-800 flex-shrink-0"
                            onClick={() => { navigator.clipboard.writeText(r.bankInfo); toast.success("계좌번호 복사됨"); }}
                            title="복사"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {order.user && (
            <div className="bg-card border rounded-xl p-6 elegant-shadow">
              <h3 className="font-semibold mb-4">주문자 정보</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">이름:</span> {order.user.name ?? "-"}</div>
                <div><span className="text-muted-foreground">아이디:</span> {order.user.email ?? "-"}</div>
                <div><span className="text-muted-foreground">등급:</span> {getGradeLabel(order.user.grade)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 배송 정보 수정 Dialog */}
      <Dialog open={showEditShipmentDialog} onOpenChange={setShowEditShipmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배송 정보 수정</DialogTitle>
            <DialogDescription>
              운송장 번호를 수정할 수 있습니다. 운송장 번호가 변경되면 17track에 자동으로 재등록됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">운송장 번호</label>
              <Input
                value={editTrackingNumber}
                onChange={(e) => setEditTrackingNumber(e.target.value)}
                placeholder="운송장 번호 입력 (예: EE123456789KR)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditShipmentDialog(false)}>
              취소
            </Button>
            <Button
              disabled={!editTrackingNumber || updateShipmentInfo.isPending}
              onClick={() => {
                updateShipmentInfo.mutate({
                  shipmentId: editShipmentId,
                  trackingNumber: editTrackingNumber,
                });
              }}
            >
              {updateShipmentInfo.isPending ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 배송 타임라인 모달 */}
      {trackingModalItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setTrackingModalItem(null)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between p-5 border-b flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-bold text-base">배송 타임라인</span>
                  {modalTrackingData?.history && (
                    <span className="text-sm text-muted-foreground">{modalTrackingData.history.length}건</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{trackingModalItem.productName}</p>
              </div>
              <button
                onClick={() => setTrackingModalItem(null)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors ml-4 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 갱신 */}
            <div className="flex items-center justify-end px-5 py-3 border-b flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={() => { refreshTracking.mutate({ orderId: order.id }); setTimeout(() => refetchModalTracking(), 2000); }}
                disabled={refreshTracking.isPending}
              >
                <RotateCcw className={`w-3 h-3 ${refreshTracking.isPending ? "animate-spin" : ""}`} />
                새로고침
              </Button>
            </div>

            {/* 추적 정보 박스 */}
            <div className="mx-4 mt-4 border rounded-xl p-4 flex-shrink-0">
              <div className="mb-3">
                <p className="text-[11px] text-muted-foreground mb-0.5">
                  추적번호 · {modalTrackingData?.carrier?.name ?? trackingModalItem.shipment?.carrier?.name ?? "택배사"}
                </p>
                <p className="font-bold text-base text-foreground">
                  {trackingModalItem.shipment?.trackingNumber}
                </p>
                {order.recipientName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    수령인: {order.recipientName}{(order as any).recipientNameEn ? ` ${(order as any).recipientNameEn}` : ""}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => { navigator.clipboard.writeText(trackingModalItem.shipment?.trackingNumber ?? ""); toast.success("복사됨"); }}
                >
                  <Copy className="w-3 h-3" />복사
                </Button>
                <Button size="sm" className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <a
                    href={`https://t.17track.net/en#nums=${trackingModalItem.shipment?.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />17track
                  </a>
                </Button>
                {(/^\d{10,13}$/.test(trackingModalItem.shipment?.trackingNumber ?? "") ||
                  (trackingModalItem.shipment?.carrier?.code ?? "").toLowerCase().includes("cj")) && (
                  <>
                    <Button size="sm" className="h-7 text-xs gap-1 bg-orange-600 hover:bg-orange-700 text-white" asChild>
                      <a
                        href={`https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${trackingModalItem.shipment?.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />CJ대한통운
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                      <a
                        href={`https://track.shiptrack.co.kr/cjkorex/${trackingModalItem.shipment?.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />Shiptrack
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* 타임라인 */}
            <div className="overflow-y-auto flex-1 px-4 py-4">
              {!modalTrackingData ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-40" />
                  <p className="text-sm">불러오는 중...</p>
                </div>
              ) : !modalTrackingData.history || modalTrackingData.history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">아직 배송 이력이 없습니다</p>
                  <p className="text-xs mt-1">갱신 버튼으로 최신 정보를 불러오세요</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {modalTrackingData.history.map((entry: any, idx: number) => {
                    const isFirst = idx === 0;
                    const isDelivered = entry.status === "delivered" || (entry.description ?? "").includes("배달 완료");
                    const iconBg = isDelivered ? "bg-blue-500 text-white" : (isFirst ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground");
                    return (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          {idx < modalTrackingData.history.length - 1 && (
                            <div className="w-px flex-1 bg-border min-h-4" />
                          )}
                        </div>
                        <div className={`pb-4 flex-1 min-w-0 ${idx < modalTrackingData.history.length - 1 ? "pb-4" : "pb-1"}`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${isDelivered ? "text-blue-600 font-semibold" : (isFirst ? "text-foreground" : "text-muted-foreground")}`}>
                              {renderShippingDesc(entry.description || shipmentStatusLabels[entry.status] || entry.status)}
                            </span>
                            {isFirst && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${isDelivered ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-primary/10 text-primary border-primary/20"}`}>현재</span>
                            )}
                          </div>
                          {entry.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 flex-shrink-0" />{entry.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(entry.occurredAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between px-5 py-3 border-t flex-shrink-0">
              <span className="text-xs text-muted-foreground">
                {modalTrackingData?.updatedAt
                  ? `최종동기: ${formatDateTime(modalTrackingData.updatedAt)} · 매일 자동업데이트`
                  : "자동 업데이트"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTrackingModalItem(null)}
                className="h-7 text-xs"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cart Convert Modal ───
function CartConvertModal({ userId, userName, userEmail, items, onClose, onSuccess }: {
  userId: number;
  userName: string | null;
  userEmail: string;
  items: { id: number; productId: number; quantity: number; product: { name: string; salePrice: number | null; thumbnail: string | null } | null }[];
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}) {
  const [form, setForm] = useState({
    recipientName: userName ?? "",
    recipientNameEn: "",
    recipientPhone: "",
    zipCode: "",
    address1: "",
    address2: "",
    addressEn1: "",
    addressEn2: "",
    memo: "",
    paymentStatus: "pending" as "pending" | "paid",
    clearCart: true,
  });
  const [translatingName, setTranslatingName] = useState(false);
  const [translatingAddr, setTranslatingAddr] = useState(false);

  const convertMut = trpc.cart.adminConvertCartToOrder.useMutation({
    onSuccess: (res) => onSuccess(res.orderNumber),
    onError: (e) => toast.error(e.message),
  });
  const translateMut = trpc.address.translateToEnglish.useMutation();

  const translateName = async () => {
    if (!form.recipientName.trim()) return;
    setTranslatingName(true);
    try {
      const r = await translateMut.mutateAsync({ koreanText: form.recipientName });
      setForm(f => ({ ...f, recipientNameEn: r.englishText }));
    } catch { /* ignore */ } finally { setTranslatingName(false); }
  };

  const translateAddress = async () => {
    if (!form.address1.trim()) return;
    setTranslatingAddr(true);
    try {
      const combined = form.address2 ? `${form.address1} ${form.address2}` : form.address1;
      const r = await translateMut.mutateAsync({ koreanText: combined });
      const parts = r.englishText.split(",");
      setForm(f => ({ ...f, addressEn1: parts[0]?.trim() ?? r.englishText, addressEn2: parts.slice(1).join(",").trim() || f.addressEn2 }));
    } catch { /* ignore */ } finally { setTranslatingAddr(false); }
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.product?.salePrice ?? 0) * i.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientName.trim() || !form.recipientPhone.trim() || !form.zipCode.trim() || !form.address1.trim()) {
      toast.error("수령인, 전화번호, 우편번호, 주소는 필수입니다.");
      return;
    }
    convertMut.mutate({ userId, ...form });
  };

  const inp = "h-7 text-xs px-2";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-full p-5 overflow-hidden">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base">장바구니 → 주문 전환</DialogTitle>
          <DialogDescription className="text-xs">{userName ?? userEmail} ({userEmail})</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* 상품 목록 */}
          <div className="border rounded divide-y">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2 px-2 py-1">
                <div className="w-8 h-8 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {item.product?.thumbnail
                    ? <img src={item.product.thumbnail} alt="" className="w-full h-full object-cover" />
                    : <ShoppingBag className="w-3 h-3 text-muted-foreground/40" />}
                </div>
                <div className="flex-1 min-w-0 text-xs truncate">{item.product?.name ?? `상품 #${item.productId}`}</div>
                <div className="text-xs text-muted-foreground shrink-0">×{item.quantity}</div>
                <div className="text-xs font-semibold shrink-0 text-right">{((item.product?.salePrice ?? 0) * item.quantity).toLocaleString()}원</div>
              </div>
            ))}
            <div className="flex justify-between px-2 py-1 bg-muted/30">
              <span className="text-xs font-semibold">합계</span>
              <span className="text-xs font-bold text-primary">{totalAmount.toLocaleString()}원</span>
            </div>
          </div>

          {/* 수령인 / 영문이름 */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">수령인 *</label>
              <div className="flex gap-1">
                <Input className={inp + " min-w-0 flex-1"} value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} placeholder="홍길동" />
                <Button type="button" size="sm" variant="outline" className="h-7 w-8 px-0 text-[10px] shrink-0" onClick={translateName} disabled={translatingName}>
                  {translatingName ? <Loader2 className="w-3 h-3 animate-spin" /> : "EN"}
                </Button>
              </div>
            </div>
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">영문 이름</label>
              <Input className={inp + " w-full"} value={form.recipientNameEn} onChange={e => setForm(f => ({ ...f, recipientNameEn: e.target.value }))} placeholder="Hong Gildong" />
            </div>

            {/* 전화번호 / 우편번호 */}
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">전화번호 *</label>
              <Input className={inp + " w-full"} value={form.recipientPhone} onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))} placeholder="010-0000-0000" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">우편번호 *</label>
              <Input className={inp + " w-full"} value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} placeholder="12345" />
            </div>

            {/* 주소 / 영문주소 */}
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">주소 *</label>
              <div className="flex gap-1">
                <Input className={inp + " min-w-0 flex-1"} value={form.address1} onChange={e => setForm(f => ({ ...f, address1: e.target.value }))} placeholder="기본 주소" />
                <Button type="button" size="sm" variant="outline" className="h-7 w-8 px-0 text-[10px] shrink-0" onClick={translateAddress} disabled={translatingAddr}>
                  {translatingAddr ? <Loader2 className="w-3 h-3 animate-spin" /> : "EN"}
                </Button>
              </div>
            </div>
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">영문 주소</label>
              <Input className={inp + " w-full"} value={form.addressEn1} onChange={e => setForm(f => ({ ...f, addressEn1: e.target.value }))} placeholder="123 Main St" />
            </div>

            {/* 상세주소 / 영문상세 */}
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">상세 주소</label>
              <Input className={inp + " w-full"} value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="상세 주소 (선택)" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">영문 상세 주소</label>
              <Input className={inp + " w-full"} value={form.addressEn2} onChange={e => setForm(f => ({ ...f, addressEn2: e.target.value }))} placeholder="Apt 101 (선택)" />
            </div>

            {/* 메모 / 결제상태 */}
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">메모</label>
              <Input className={inp + " w-full"} value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} placeholder="배송 메모 (선택)" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <label className="text-[11px] font-medium text-muted-foreground">결제 상태</label>
              <div className="flex gap-1">
                <button type="button" className={`flex-1 h-7 rounded border text-[11px] font-medium transition-colors ${form.paymentStatus === "pending" ? "bg-yellow-50 border-yellow-400 text-yellow-700" : "border-muted text-muted-foreground"}`}
                  onClick={() => setForm(f => ({ ...f, paymentStatus: "pending" }))}>입금 대기</button>
                <button type="button" className={`flex-1 h-7 rounded border text-[11px] font-medium transition-colors ${form.paymentStatus === "paid" ? "bg-green-50 border-green-400 text-green-700" : "border-muted text-muted-foreground"}`}
                  onClick={() => setForm(f => ({ ...f, paymentStatus: "paid" }))}>결제 완료</button>
              </div>
            </div>
          </div>

          {/* 하단 */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={form.clearCart} onChange={e => setForm(f => ({ ...f, clearCart: e.target.checked }))} className="rounded" />
              주문 후 장바구니 비우기
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>취소</Button>
              <Button type="submit" size="sm" disabled={convertMut.isPending}>
                {convertMut.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                주문 생성
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cart Management ───
function AdminCartManagement() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [convertTarget, setConvertTarget] = useState<{ userId: number; userName: string | null; userEmail: string; items: any[] } | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.cart.adminCarts.useQuery({ search: search || undefined, page, pageSize: PAGE_SIZE });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">장바구니 현황</h1>
          <p className="text-muted-foreground text-sm mt-1">고객별 장바구니에 담긴 상품을 조회합니다.</p>
        </div>
        {data && <Badge variant="secondary" className="text-sm">{data.total}명</Badge>}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <Input
          placeholder="이름 또는 이메일 검색"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="text-sm"
        />
        <Button type="submit" size="sm" variant="outline"><Search className="w-4 h-4" /></Button>
      </form>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-4">
          오류: {error.message}
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !data || data.rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <ShoppingCart className="w-10 h-10" />
          <p>장바구니에 상품을 담은 고객이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.rows.map(({ user, items, totalAmount, lastUpdated }) => (
            <div key={user.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{user.name ?? "(이름 없음)"}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{items.length}개 상품</span>
                  <span className="font-semibold text-primary">{totalAmount.toLocaleString()}원</span>
                  <span className="text-xs text-muted-foreground">{new Date(lastUpdated).toLocaleDateString("ko-KR")}</span>
                  <Link href={`/admin/users/${user.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">회원 보기</Button>
                  </Link>
                  <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground"
                    onClick={() => setConvertTarget({ userId: user.id, userName: user.name, userEmail: user.email, items })}>
                    주문으로 전환
                  </Button>
                </div>
              </div>
              <div className="divide-y">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {item.product?.thumbnail ? (
                        <img src={item.product.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.product?.name ?? `상품 #${item.productId}`}</div>
                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {Object.entries(item.options as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(" / ")}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">수량 {item.quantity}</div>
                    <div className="text-sm font-semibold shrink-0 w-28 text-right">
                      {item.product ? ((item.product.salePrice ?? 0) * item.quantity).toLocaleString() + "원" : "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm flex items-center px-3">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {convertTarget && (
        <CartConvertModal
          userId={convertTarget.userId}
          userName={convertTarget.userName}
          userEmail={convertTarget.userEmail}
          items={convertTarget.items}
          onClose={() => setConvertTarget(null)}
          onSuccess={(orderNumber) => {
            toast.success(`주문이 생성됐습니다. 주문번호: ${orderNumber}`);
            setConvertTarget(null);
            utils.cart.adminCarts.invalidate();
          }}
        />
      )}
    </div>
  );
}

// ─── User Management ───
function AdminUsers() {
  const [searchField, setSearchField] = useState("id");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateField, setDateField] = useState("createdAt");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [page, setPage] = useState(1);

  const { data } = trpc.admin.users.useQuery({
    page, limit: 20,
    search: search || undefined,
    searchField,
    sortBy: sortBy || undefined,
    dateField,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    statusFilter: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: statusCounts } = trpc.admin.userStatusCounts.useQuery();
  const utils = trpc.useUtils();

  const updateUser = trpc.admin.updateUser.useMutation({ onSuccess: () => { utils.admin.users.invalidate(); toast.success("권한이 변경되었습니다."); } });
  const updateMailReceive = trpc.admin.updateUserMailReceive.useMutation({ onSuccess: () => { utils.admin.users.invalidate(); } });
  const updateBlocked = trpc.admin.updateUserBlocked.useMutation({ onSuccess: () => { utils.admin.users.invalidate(); utils.admin.userStatusCounts.invalidate(); toast.success("접근차단 상태가 변경되었습니다."); } });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const toggleSelectAll = () => {
    if (selectedIds.length === (data?.users ?? []).length) setSelectedIds([]);
    else setSelectedIds((data?.users ?? []).map((u: any) => u.id));
  };
  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const applyQuickRange = (days: number | null) => {
    if (days === null) { setDateFrom(""); setDateTo(""); setPage(1); return; }
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setDateFrom(fmt(from));
    setDateTo(fmt(to));
    setPage(1);
  };

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  const statusBadge = (status: string) => {
    if (status === "withdrawn") return <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">탈퇴</Badge>;
    if (status === "blocked") return <Badge variant="destructive" className="text-[10px]">차단</Badge>;
    return <Badge variant="default" className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">정상</Badge>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">회원 관리</h1>

      {/* 회원 현황 */}
      <div className="bg-card border rounded-xl p-5 mb-4">
        <h2 className="text-base font-semibold mb-1">회원 현황</h2>
        <p className="text-sm text-muted-foreground mb-4">회원 검색, 상태 확인 및 관리를 할 수 있습니다.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground mb-1">검색된 회원</p>
            <p className="text-xl font-bold text-primary">{(data?.total ?? 0).toLocaleString()}<span className="text-sm font-normal ml-0.5">명</span></p>
          </div>
          <button
            type="button"
            className={`text-left rounded-lg border p-4 transition-colors ${statusFilter === "blocked" ? "bg-rose-100 border-rose-300" : "bg-rose-50 hover:bg-rose-100"}`}
            onClick={() => { setStatusFilter(statusFilter === "blocked" ? "all" : "blocked"); setPage(1); }}
          >
            <p className="text-xs text-muted-foreground mb-1">차단 회원</p>
            <p className="text-xl font-bold text-rose-600">{(statusCounts?.blocked ?? 0).toLocaleString()}<span className="text-sm font-normal ml-0.5">명</span></p>
          </button>
          <button
            type="button"
            className={`text-left rounded-lg border p-4 transition-colors ${statusFilter === "withdrawn" ? "bg-secondary border-foreground/20" : "bg-secondary/40 hover:bg-secondary"}`}
            onClick={() => { setStatusFilter(statusFilter === "withdrawn" ? "all" : "withdrawn"); setPage(1); }}
          >
            <p className="text-xs text-muted-foreground mb-1">탈퇴 회원</p>
            <p className="text-xl font-bold">{(statusCounts?.withdrawn ?? 0).toLocaleString()}<span className="text-sm font-normal ml-0.5">명</span></p>
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="bg-card border rounded-xl p-5 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">검색어</span>
          <select className="border rounded-md px-2 py-2 text-sm bg-background" value={searchField} onChange={e => setSearchField(e.target.value)}>
            <option value="id">회원아이디</option>
            <option value="name">이름</option>
            <option value="nick">닉네임</option>
            <option value="phone">휴대폰</option>
          </select>
          <Input className="max-w-xs" placeholder="검색어 입력" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">날짜</span>
          <select className="border rounded-md px-2 py-2 text-sm bg-background" value={dateField} onChange={e => setDateField(e.target.value)}>
            <option value="createdAt">가입일</option>
            <option value="lastLogin">최종접속일</option>
          </select>
          <Input type="date" className="w-[150px]" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          <span className="text-muted-foreground text-sm">~</span>
          <Input type="date" className="w-[150px]" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(1)}>오늘</Button>
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(7)}>7일</Button>
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(14)}>14일</Button>
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(30)}>1개월</Button>
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(90)}>3개월</Button>
          <Button size="sm" variant="outline" onClick={() => applyQuickRange(null)}>전체</Button>
          <select className="border rounded-md px-2 py-2 text-sm bg-background ml-auto" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
            <option value="createdAt">가입일 최신순</option>
            <option value="createdAt_asc">가입일 오래된순</option>
            <option value="lastSignedIn">최종접속 최신순</option>
            <option value="name">이름순</option>
            <option value="orderCount">주문건수순</option>
            <option value="totalPaid">결제금액순</option>
            <option value="points">포인트순</option>
          </select>
          <Button size="sm" onClick={handleSearch}><Search className="w-4 h-4 mr-1" />검색</Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">회원자료 삭제 시 다른 회원이 기존 회원아이디를 사용하지 못하도록, 회원아이디·이름·닉네임은 삭제하지 않고 영구 보관합니다.</p>

      <div className="bg-card border rounded-xl overflow-hidden elegant-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-secondary/50 text-xs text-muted-foreground">
              <th className="text-center py-3 px-3 w-10"><input type="checkbox" checked={selectedIds.length === (data?.users ?? []).length && (data?.users ?? []).length > 0} onChange={toggleSelectAll} /></th>
              <th className="text-left py-3 px-3">아이디</th>
              <th className="text-left py-3 px-3">이름</th>
              <th className="text-left py-3 px-3">휴대폰</th>
              <th className="text-center py-3 px-3">권한</th>
              <th className="text-right py-3 px-3">잔여포인트</th>
              <th className="text-center py-3 px-3">주문건수</th>
              <th className="text-right py-3 px-3">누적주문금액</th>
              <th className="text-center py-3 px-3">상태</th>
              <th className="text-left py-3 px-3">최종접속</th>
              <th className="text-center py-3 px-3">메일인증</th>
              <th className="text-center py-3 px-3">메일수신</th>
              <th className="text-center py-3 px-3">접근차단</th>
              <th className="text-left py-3 px-3">가입일</th>
              <th className="text-center py-3 px-3">관리</th>
            </tr></thead>
            <tbody className="divide-y">
              {(data?.users ?? []).map((u: any) => (
                <tr key={u.id} className="hover:bg-accent/20">
                  <td className="py-2.5 px-3 text-center"><input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                  <td className="py-2.5 px-3 text-muted-foreground">{u.loginId}</td>
                  <td className="py-2.5 px-3 font-medium">{u.name ?? "-"}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{u.phone ?? "-"}</td>
                  <td className="py-2.5 px-3 text-center">
                    <select
                      className="border rounded-md px-1.5 py-1 text-xs bg-background"
                      value={u.role}
                      onChange={e => updateUser.mutate({ id: u.id, role: e.target.value })}
                    >
                      <option value="user">회원</option>
                      <option value="admin">관리자</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-right price-text">{(u.points ?? 0).toLocaleString()}P</td>
                  <td className="py-2.5 px-3 text-center">{(u.orderCount ?? 0).toLocaleString()}건</td>
                  <td className="py-2.5 px-3 text-right price-text">{formatPrice(u.totalPaid ?? 0)}</td>
                  <td className="py-2.5 px-3 text-center">{statusBadge(u.status)}</td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{u.lastSignedIn ? formatDate(u.lastSignedIn) : "-"}</td>
                  <td className="py-2.5 px-3 text-center">
                    {u.emailCertified ? <span className="text-emerald-600 font-medium text-xs">Yes</span> : <span className="text-muted-foreground text-xs">No</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input type="checkbox" checked={!!u.mailReceive} onChange={e => updateMailReceive.mutate({ id: u.id, value: e.target.checked })} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input type="checkbox" checked={u.status === "blocked"} disabled={u.status === "withdrawn"} onChange={e => updateBlocked.mutate({ id: u.id, blocked: e.target.checked })} />
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{formatDate(u.createdAt)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <Link href={`/admin/users/${u.id}`}><Button variant="outline" size="sm" className="h-7 px-2 text-xs">수정</Button></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data?.users ?? []).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">회원이 없습니다</p>}
      </div>

      <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />
    </div>
  );
}

// ─── Board Management ───
function AdminBoards() {
  const { data: boardsList } = trpc.admin.boards.useQuery();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ slug: "", name: "", description: "", boardType: "free" as "free" | "review" | "qna" | "notice", isActive: 1, sortOrder: 0 });

  const createMut = trpc.admin.createBoard.useMutation({ onSuccess: () => { utils.admin.boards.invalidate(); setDialogOpen(false); toast.success("게시판이 생성되었습니다."); } });
  const updateMut = trpc.admin.updateBoard.useMutation({ onSuccess: () => { utils.admin.boards.invalidate(); setDialogOpen(false); toast.success("게시판이 수정되었습니다."); } });
  const deleteMut = trpc.admin.deleteBoard.useMutation({ onSuccess: () => { utils.admin.boards.invalidate(); toast.success("게시판이 삭제되었습니다."); } });

  const openCreate = () => { setEditItem(null); setForm({ slug: "", name: "", description: "", boardType: "free", isActive: 1, sortOrder: 0 }); setDialogOpen(true); };
  const openEdit = (b: any) => { setEditItem(b); setForm({ slug: b.slug, name: b.name, description: b.description ?? "", boardType: b.boardType, isActive: b.isActive, sortOrder: b.sortOrder }); setDialogOpen(true); };
  const handleSave = () => {
    if (!form.slug || !form.name) { toast.error("슬러그와 이름을 입력해주세요."); return; }
    if (editItem) { updateMut.mutate({ id: editItem.id, ...form }); }
    else { createMut.mutate(form); }
  };

  const boardTypeLabel: Record<string, string> = { free: "자유게시판", review: "고객 리뷰", qna: "Q&A", notice: "공지사항" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">게시판 관리</h1>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" /> 게시판 추가</Button>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden elegant-shadow">
        <table className="w-full">
          <thead><tr className="bg-secondary/50 text-xs text-muted-foreground">
            <th className="text-left py-3 px-4">ID</th><th className="text-left py-3 px-4">이름</th><th className="text-left py-3 px-4">슬러그</th><th className="text-center py-3 px-4">유형</th><th className="text-center py-3 px-4">순서</th><th className="text-center py-3 px-4">상태</th><th className="text-center py-3 px-4">관리</th>
          </tr></thead>
          <tbody className="divide-y">
            {(boardsList ?? []).map((b: any) => (
              <tr key={b.id} className="hover:bg-accent/20">
                <td className="py-3 px-4 text-sm">{b.id}</td>
                <td className="py-3 px-4 text-sm font-medium">{b.name}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{b.slug}</td>
                <td className="py-3 px-4 text-center"><Badge variant="secondary" className="text-[10px]">{boardTypeLabel[b.boardType] ?? b.boardType}</Badge></td>
                <td className="py-3 px-4 text-sm text-center">{b.sortOrder}</td>
                <td className="py-3 px-4 text-center"><Badge variant={b.isActive ? "default" : "secondary"} className="text-[10px]">{b.isActive ? "활성" : "비활성"}</Badge></td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("삭제하시겠습니까? 관련 게시글도 함께 삭제됩니다.")) deleteMut.mutate({ id: b.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(boardsList ?? []).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">게시판이 없습니다</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "게시판 수정" : "게시판 추가"}</DialogTitle><DialogDescription>게시판 정보를 입력하세요.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">이름 *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="게시판 이름" /></div>
            <div><label className="text-sm font-medium">슬러그 *</label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="board-slug" /></div>
            <div><label className="text-sm font-medium">설명</label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="게시판 설명" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">유형</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background" value={form.boardType} onChange={e => setForm(f => ({ ...f, boardType: e.target.value as any }))}>
                  <option value="free">자유게시판</option><option value="review">고객 리뷰</option><option value="qna">Q&A</option><option value="notice">공지사항</option>
                </select>
              </div>
              <div><label className="text-sm font-medium">정렬 순서</label><Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive === 1} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked ? 1 : 0 }))} />
              <label className="text-sm">활성화</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editItem ? "수정" : "생성"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Banner Management ───
function AdminBanners() {
  const { data: bannersList } = trpc.admin.banners.useQuery();
  const { data: topBannerData } = trpc.admin.getTopBannerText.useQuery();
  const [topBannerText, setTopBannerText] = useState("");
  const setTopBannerMut = trpc.admin.setTopBannerText.useMutation({ onSuccess: () => toast.success("상단 배너 텍스트가 저장되었습니다.") });

  useEffect(() => {
    if (topBannerData?.text !== undefined) setTopBannerText(topBannerData.text);
  }, [topBannerData?.text]);

  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", isActive: 1, sortOrder: 0 });

  const createMut = trpc.admin.createBanner.useMutation({ onSuccess: () => { utils.admin.banners.invalidate(); setDialogOpen(false); toast.success("배너가 생성되었습니다."); } });
  const updateMut = trpc.admin.updateBanner.useMutation({ onSuccess: () => { utils.admin.banners.invalidate(); setDialogOpen(false); toast.success("배너가 수정되었습니다."); } });
  const deleteMut = trpc.admin.deleteBanner.useMutation({ onSuccess: () => { utils.admin.banners.invalidate(); toast.success("배너가 삭제되었습니다."); } });
  const toggleActive = trpc.admin.updateBanner.useMutation({ onSuccess: () => { utils.admin.banners.invalidate(); } });

  const openCreate = () => { setEditItem(null); setForm({ title: "", imageUrl: "", linkUrl: "", isActive: 1, sortOrder: 0 }); setDialogOpen(true); };
  const openEdit = (b: any) => { setEditItem(b); setForm({ title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl ?? "", isActive: b.isActive, sortOrder: b.sortOrder }); setDialogOpen(true); };
  const handleSave = () => {
    if (!form.title || !form.imageUrl) { toast.error("제목과 이미지 URL을 입력해주세요."); return; }
    if (editItem) { updateMut.mutate({ id: editItem.id, ...form }); }
    else { createMut.mutate(form); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">배너 관리</h1>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" /> 배너 추가</Button>
      </div>

      {/* 상단 공지 배너 텍스트 */}
      <div className="bg-card border rounded-xl p-5 mb-6 elegant-shadow">
        <h2 className="text-base font-semibold mb-3">상단 공지 배너 텍스트</h2>
        <p className="text-xs text-muted-foreground mb-3">사이트 최상단에 표시되는 공지 문구입니다. 이모지 포함 가능.</p>
        <div className="flex gap-2">
          <Input
            value={topBannerText}
            onChange={e => setTopBannerText(e.target.value)}
            placeholder="🌿 인도 직배송 해외직구 전문 쇼핑몰 · 탈모학교"
            className="flex-1"
          />
          <Button onClick={() => setTopBannerMut.mutate({ text: topBannerText })} disabled={setTopBannerMut.isPending}>저장</Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">미리보기: <span className="bg-[#3b2a1a] text-[#e8d5b0] px-3 py-1 rounded text-xs">{topBannerText || "🌿 인도 직배송 해외직구 전문 쇼핑몰 · 탈모학교"}</span></div>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden elegant-shadow">
        <table className="w-full">
          <thead><tr className="bg-secondary/50 text-xs text-muted-foreground">
            <th className="text-left py-3 px-4">ID</th><th className="text-left py-3 px-4">제목</th><th className="text-left py-3 px-4">이미지</th><th className="text-center py-3 px-4">순서</th><th className="text-center py-3 px-4">상태</th><th className="text-center py-3 px-4">관리</th>
          </tr></thead>
          <tbody className="divide-y">
            {(bannersList ?? []).map((b: any) => (
              <tr key={b.id} className="hover:bg-accent/20">
                <td className="py-3 px-4 text-sm">{b.id}</td>
                <td className="py-3 px-4 text-sm font-medium">{b.title}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">{b.imageUrl}</td>
                <td className="py-3 px-4 text-sm text-center">{b.sortOrder}</td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => toggleActive.mutate({ id: b.id, isActive: b.isActive ? 0 : 1 })}>
                    <Badge variant={b.isActive ? "default" : "secondary"} className="text-[10px] cursor-pointer">{b.isActive ? "활성" : "비활성"}</Badge>
                  </button>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMut.mutate({ id: b.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(bannersList ?? []).length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">배너가 없습니다</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "배너 수정" : "배너 추가"}</DialogTitle><DialogDescription>배너 정보를 입력하세요.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">제목 *</label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="배너 제목" /></div>
            <div><label className="text-sm font-medium">이미지 URL *</label><Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." /></div>
            {form.imageUrl && <img src={form.imageUrl} alt="미리보기" className="w-full h-32 object-cover rounded-lg border" onError={(e) => (e.currentTarget.style.display = "none")} />}
            <div><label className="text-sm font-medium">링크 URL</label><Input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="클릭 시 이동할 URL" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">정렬 순서</label><Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={form.isActive === 1} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked ? 1 : 0 }))} />
                <label className="text-sm">활성화</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>{editItem ? "수정" : "생성"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Keyword Stats ───
function AdminKeywords() {
  const { data: keywords } = trpc.admin.keywords.useQuery();
  const utils = trpc.useUtils();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCount, setEditCount] = useState(0);
  const [editSort, setEditSort] = useState(0);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCount, setNewCount] = useState(0);
  const [newSort, setNewSort] = useState(0);

  const updateMut = trpc.admin.updateKeyword.useMutation({ onSuccess: () => { utils.admin.keywords.invalidate(); setEditingId(null); toast.success("수정되었습니다."); } });
  const addMut = trpc.admin.addKeyword.useMutation({ onSuccess: () => { utils.admin.keywords.invalidate(); setNewKeyword(""); setNewCount(0); setNewSort(0); toast.success("키워드가 추가되었습니다."); } });
  const deleteMut = trpc.admin.deleteKeyword.useMutation({ onSuccess: () => { utils.admin.keywords.invalidate(); toast.success("삭제되었습니다."); } });
  const batchSortMut = trpc.admin.batchUpdateKeywordsSortOrder.useMutation({ onSuccess: () => utils.admin.keywords.invalidate() });

  const startEdit = (k: any) => { setEditingId(k.id); setEditCount(k.searchCount); setEditSort(k.sortOrder ?? 0); };

  // 드래그 상태
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [localKeywords, setLocalKeywords] = useState<any[]>([]);

  const prevRef = useRef<any>(null);
  if (keywords && keywords !== prevRef.current) {
    prevRef.current = keywords;
    setLocalKeywords(keywords);
  }

  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };
  const onDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const reordered = [...localKeywords];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    // 목록 상단이 가장 높은 sortOrder (desc 정렬이므로)
    const n = reordered.length;
    const updates = reordered.map((k, i) => ({ id: k.id, sortOrder: (n - i) * 10 }));
    setLocalKeywords(reordered.map((k, i) => ({ ...k, sortOrder: (n - i) * 10 })));
    setDragIdx(null); setDragOverIdx(null);
    batchSortMut.mutate(updates);
    toast.success("검색어 순서가 저장되었습니다");
  };
  const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const displayList = localKeywords.length > 0 ? localKeywords : (keywords ?? []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">검색어 통계</h1>
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <Input className="max-w-[200px]" placeholder="새 키워드" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} />
        <Input className="w-20" type="number" placeholder="횟수" value={newCount} onChange={e => setNewCount(Number(e.target.value))} />
        <Input className="w-20" type="number" placeholder="순위" value={newSort} onChange={e => setNewSort(Number(e.target.value))} />
        <Button size="sm" onClick={() => { if (!newKeyword.trim()) return; addMut.mutate({ keyword: newKeyword, searchCount: newCount, sortOrder: newSort }); }}><Plus className="w-4 h-4 mr-1" />추가</Button>
      </div>
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
        <GripVertical className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span>행을 드래그해서 검색어 노출 순서를 조절하세요. 드롭 즉시 자동 저장됩니다.</span>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden elegant-shadow">
        <table className="w-full">
          <thead><tr className="bg-secondary/50 text-xs text-muted-foreground">
            <th className="py-3 px-2 w-8"></th>
            <th className="text-center py-3 px-4">순위</th><th className="text-left py-3 px-4">검색어</th><th className="text-right py-3 px-4">검색 횟수</th><th className="text-right py-3 px-4">수동순위</th><th className="text-center py-3 px-4">관리</th>
          </tr></thead>
          <tbody className="divide-y">
            {displayList.map((k: any, i: number) => (
              <tr
                key={k.id}
                draggable
                onDragStart={(e) => onDragStart(e, i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={(e) => onDrop(e, i)}
                onDragEnd={onDragEnd}
                className={`hover:bg-accent/20 transition-colors ${dragIdx === i ? "opacity-40" : ""} ${dragOverIdx === i ? "border-t-2 border-primary" : ""}`}
              >
                <td className="py-3 px-2 text-center cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i < 3 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{i + 1}</span>
                </td>
                <td className="py-3 px-4 text-sm font-medium">{k.keyword}</td>
                {editingId === k.id ? (
                  <>
                    <td className="py-3 px-4 text-right"><Input className="w-20 ml-auto text-right" type="number" value={editCount} onChange={e => setEditCount(Number(e.target.value))} /></td>
                    <td className="py-3 px-4 text-right"><Input className="w-20 ml-auto text-right" type="number" value={editSort} onChange={e => setEditSort(Number(e.target.value))} /></td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => updateMut.mutate({ id: k.id, searchCount: editCount, sortOrder: editSort })}>저장</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>취소</Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-4 text-sm text-right">{k.searchCount.toLocaleString()}회</td>
                    <td className="py-3 px-4 text-sm text-right font-mono">{k.sortOrder ?? 0}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(k)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMut.mutate({ id: k.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {displayList.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">검색어 데이터가 없습니다</p>}
      </div>
    </div>
  );
}

// ─── Review Point Settings ───
function AdminReviewSettings() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.admin.getReviewPointSettings.useQuery();
  const updateMut = trpc.admin.updateReviewPointSettings.useMutation({
    onSuccess: () => {
      utils.admin.getReviewPointSettings.invalidate();
      toast.success("리뷰 포인트 설정이 저장되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });


  const [pointsPerReview, setPointsPerReview] = useState(100);
  const [pointsPerPhotoReview, setPointsPerPhotoReview] = useState(200);
  const [minRatingForPoints, setMinRatingForPoints] = useState(1);

  // Load settings when data arrives
  useMemo(() => {
    if (settings) {
      setPointsPerReview(settings.pointsPerReview);
      setPointsPerPhotoReview(settings.pointsPerPhotoReview);
      setMinRatingForPoints(settings.minRatingForPoints);
    }
  }, [settings]);

  const handleSave = () => {
    updateMut.mutate({
      pointsPerReview,
      pointsPerPhotoReview,
      minRatingForPoints,
      likePointsThreshold: 10,
      pointsPerLikeThreshold: 50,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">리뷰 포인트 설정</h1>

      <div className="bg-card border rounded-xl p-6 elegant-shadow max-w-xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold">리뷰 작성 포인트</h2>
            <p className="text-sm text-muted-foreground">고객이 리뷰 작성 시 자동으로 적립되는 포인트를 설정합니다</p>
          </div>
        </div>

        <div className="space-y-5">

              {/* Text review points */}
              <div>
                <label className="block text-sm font-medium mb-1.5">텍스트 리뷰 포인트</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={pointsPerReview}
                    onChange={(e) => setPointsPerReview(Math.max(0, Number(e.target.value)))}
                    className="w-32"
                    min={0}
                  />
                  <span className="text-sm text-muted-foreground">P</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">글만 작성한 리뷰에 지급되는 기본 포인트</p>
              </div>

              {/* Photo review points */}
              <div>
                <label className="block text-sm font-medium mb-1.5">포토 리뷰 추가 포인트</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={pointsPerPhotoReview}
                    onChange={(e) => setPointsPerPhotoReview(Math.max(0, Number(e.target.value)))}
                    className="w-32"
                    min={0}
                  />
                  <span className="text-sm text-muted-foreground">P</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">사진을 첨부한 리뷰에 추가로 지급되는 포인트</p>
              </div>

              {/* Minimum rating */}
              <div>
                <label className="block text-sm font-medium mb-1.5">최소 별점</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={minRatingForPoints}
                    onChange={(e) => setMinRatingForPoints(Math.max(1, Math.min(5, Number(e.target.value))))}
                    className="w-32"
                    min={1}
                    max={5}
                  />
                  <span className="text-sm text-muted-foreground">점</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">포인트 적립을 위한 최소 별점 (1~5점)</p>
              </div>

              {/* Preview */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">적립 예시</p>
                <div className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                  <p>• 텍스트 리뷰 (별점 {minRatingForPoints}점 이상): <strong>{pointsPerReview}P</strong></p>
                  <p>• 포토 리뷰 (별점 {minRatingForPoints}점 이상 + 사진): <strong>{pointsPerReview + pointsPerPhotoReview}P</strong></p>
                </div>
              </div>

        </div>

        <div className="mt-6 pt-4 border-t flex justify-end">
          <Button onClick={handleSave} disabled={updateMut.isPending}>
            {updateMut.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 저장 중...</>
            ) : (
              "설정 저장"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Coupons ───
function AdminCoupons() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.coupon.adminList.useQuery();
  const categories = trpc.admin.categories.useQuery();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const productsQuery = trpc.admin.products.useQuery({ page: 1, limit: 50, search: productSearch || undefined }, { enabled: showDialog });
  const usersQuery = trpc.admin.users.useQuery({ page: 1, limit: 50, search: userSearch || undefined }, { enabled: showDialog });
  const defaultForm = {
    code: "", name: "", description: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: 10, minOrderAmount: 0,
    maxDiscountAmount: "", totalQuantity: -1,
    perUserLimit: null as number | null,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: (() => { const d = new Date(Date.now() + 30 * 86400000); d.setHours(23, 59, 0, 0); return d.toISOString().slice(0, 16); })(),
    isActive: 1,
    targetType: "all" as "all" | "product" | "category",
    targetProductIds: [] as number[],
    targetCategoryIds: [] as number[],
    assignType: "all" as "all" | "specific",
    assignUserIds: [] as number[],
  };
  const [form, setForm] = useState(defaultForm);
  const createMut = trpc.coupon.adminCreate.useMutation({ onSuccess: () => { utils.coupon.adminList.invalidate(); setShowDialog(false); toast.success("쿠폰이 생성되었습니다"); } });
  const updateMut = trpc.coupon.adminUpdate.useMutation({ onSuccess: () => { utils.coupon.adminList.invalidate(); setShowDialog(false); toast.success("쿠폰이 수정되었습니다"); } });
  const deleteMut = trpc.coupon.adminDelete.useMutation({ onSuccess: () => { utils.coupon.adminList.invalidate(); toast.success("쿠폰이 삭제되었습니다"); } });
  const issueMut = trpc.coupon.adminIssueCoupon.useMutation({ onSuccess: (d) => { toast.success(`${d.issued}명에게 쿠폰이 발급되었습니다`); } });
  const issueToAllMut = trpc.coupon.adminIssueToAll.useMutation({ onSuccess: (d) => { toast.success(`전체 회원 ${d.total}명 중 ${d.issued}명에게 발급 완료 (기발급 제외)`); } });

  const parseIds = (s: string | null | undefined): number[] => s ? s.split(",").map(Number).filter(Boolean) : [];

  const openCreate = () => {
    setEditId(null);
    setForm({ ...defaultForm });
    setProductSearch("");
    setUserSearch("");
    setShowDialog(true);
  };
  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      code: c.code, name: c.name, description: c.description ?? "",
      discountType: c.discountType, discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount,
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
      totalQuantity: c.totalQuantity,
      perUserLimit: c.perUserLimit ?? null,
      startDate: new Date(c.startDate).toISOString().slice(0, 16),
      endDate: new Date(c.endDate).toISOString().slice(0, 16),
      isActive: c.isActive,
      targetType: c.targetType ?? "all",
      targetProductIds: parseIds(c.targetProductIds),
      targetCategoryIds: parseIds(c.targetCategoryIds),
      assignType: c.assignType ?? "all",
      assignUserIds: parseIds(c.assignUserIds),
    });
    setProductSearch("");
    setUserSearch("");
    setShowDialog(true);
  };
  const handleSave = () => {
    if (!form.code || !form.name) { toast.error("쿠폰 코드와 이름을 입력해주세요"); return; }
    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      totalQuantity: Number(form.totalQuantity),
      perUserLimit: form.perUserLimit != null && form.perUserLimit > 0 ? Number(form.perUserLimit) : null,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      targetProductIds: form.targetType === "product" ? form.targetProductIds.join(",") || null : null,
      targetCategoryIds: form.targetType === "category" ? form.targetCategoryIds.join(",") || null : null,
      assignUserIds: form.assignType === "specific" ? form.assignUserIds.join(",") || null : null,
    };
    if (editId) updateMut.mutate({ id: editId, ...payload });
    else createMut.mutate(payload);
  };

  const targetLabel = (c: any) => {
    if (c.targetType === "product") return `상품 ${parseIds(c.targetProductIds).length}개`;
    if (c.targetType === "category") return `카테고리 ${parseIds(c.targetCategoryIds).length}개`;
    return "전체 상품";
  };
  const assignLabel = (c: any) => {
    if (c.assignType === "specific") return `회원 ${parseIds(c.assignUserIds).length}명`;
    return "전체 회원";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">쿠폰 관리</h2>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" /> 쿠폰 생성</Button>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30"><tr>
            <th className="p-3 text-left">코드</th><th className="p-3 text-left">이름</th>
            <th className="p-3 text-left">할인</th><th className="p-3 text-left">적용대상</th>
            <th className="p-3 text-left">발급대상</th><th className="p-3 text-left">기간</th>
            <th className="p-3 text-center">사용/전체</th>
            <th className="p-3 text-center">1인당 한도</th>
            <th className="p-3 text-center">상태</th>
            <th className="p-3 text-center">관리</th>
          </tr></thead>
          <tbody className="divide-y">
            {data?.coupons.map(c => (
              <tr key={c.id} className="hover:bg-secondary/20">
                <td className="p-3 font-mono text-xs">{c.code}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.discountType === "percent" ? `${c.discountValue}%` : formatPrice(c.discountValue)}</td>
                <td className="p-3 text-xs"><Badge variant="outline">{targetLabel(c)}</Badge></td>
                <td className="p-3 text-xs"><Badge variant="outline">{assignLabel(c)}</Badge></td>
                <td className="p-3 text-xs">{new Date(c.startDate).toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false })} ~ {new Date(c.endDate).toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false })}</td>
                <td className="p-3 text-center">{c.usedCount}/{c.totalQuantity === -1 ? "∞" : c.totalQuantity}</td>
                <td className="p-3 text-center text-sm">{c.perUserLimit != null ? `${c.perUserLimit}회` : "∞"}</td>
                <td className="p-3 text-center"><Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "활성" : "비활성"}</Badge></td>
                <td className="p-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-primary border-primary/40 hover:bg-primary/10"
                      disabled={issueToAllMut.isPending}
                      onClick={() => { if (confirm(`"${c.name}" 쿠폰을 전체 회원에게 발급하시겠습니까?\n이미 발급받은 회원은 제외됩니다.`)) issueToAllMut.mutate({ couponId: c.id }); }}>
                      <Users className="w-3 h-3 mr-1" />전체 발급
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMut.mutate({ id: c.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!data?.coupons || data.coupons.length === 0) && !isLoading && (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">등록된 쿠폰이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "쿠폰 수정" : "쿠폰 생성"}</DialogTitle><DialogDescription>쿠폰 정보를 입력하세요</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">쿠폰 코드 *</label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="WELCOME10" /></div>
              <div><label className="text-sm font-medium">쿠폰명 *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="신규회원 10% 할인" /></div>
            </div>
            <div><label className="text-sm font-medium">설명</label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="쿠폰 설명" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">할인 유형</label>
                <select className="w-full border rounded-md p-2 text-sm" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}>
                  <option value="percent">비율 (%)</option><option value="fixed">정액 (원)</option>
                </select>
              </div>
              <div><label className="text-sm font-medium">할인값</label><Input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">최소 주문금액</label><Input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: Number(e.target.value) }))} /></div>
              <div><label className="text-sm font-medium">최대 할인액</label><Input type="number" value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} placeholder="무제한" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">시작일시</label><Input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div><label className="text-sm font-medium">종료일시</label><Input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">발급 수량</label>
                <Input type="number" value={form.totalQuantity} onChange={e => setForm(f => ({ ...f, totalQuantity: Number(e.target.value) }))} />
                <p className="text-xs text-muted-foreground mt-1">-1 = 무제한</p>
              </div>
              <div>
                <label className="text-sm font-medium">1인당 사용 횟수</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="perUserLimitCheck"
                    checked={form.perUserLimit != null}
                    onChange={e => setForm(f => ({ ...f, perUserLimit: e.target.checked ? 1 : null }))}
                    className="rounded"
                  />
                  <label htmlFor="perUserLimitCheck" className="text-sm text-muted-foreground">제한 설정</label>
                </div>
                {form.perUserLimit != null && (
                  <Input
                    type="number"
                    min={1}
                    value={form.perUserLimit}
                    onChange={e => setForm(f => ({ ...f, perUserLimit: Math.max(1, Number(e.target.value)) }))}
                    className="mt-1"
                    placeholder="예: 1"
                  />
                )}
                {form.perUserLimit == null && <p className="text-xs text-muted-foreground mt-1">무제한</p>}
              </div>
              <div className="flex items-end gap-2 pb-5">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive === 1} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked ? 1 : 0 }))} /> 활성화</label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">적용 대상 (상품)</h3>
              <div className="flex gap-2 mb-3">
                {(["all", "category", "product"] as const).map(t => (
                  <button key={t} type="button" className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${form.targetType === t ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border hover:bg-secondary"}`}
                    onClick={() => setForm(f => ({ ...f, targetType: t }))}>
                    {t === "all" ? "전체 상품" : t === "category" ? "특정 카테고리" : "특정 상품"}
                  </button>
                ))}
              </div>
              {form.targetType === "category" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(categories.data ?? []).map((cat: any) => (
                      <label key={cat.id} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs cursor-pointer transition-colors ${form.targetCategoryIds.includes(cat.id) ? "bg-primary/10 border-primary text-primary" : "bg-background hover:bg-secondary/50"}`}>
                        <input type="checkbox" className="sr-only" checked={form.targetCategoryIds.includes(cat.id)}
                          onChange={e => setForm(f => ({ ...f, targetCategoryIds: e.target.checked ? [...f.targetCategoryIds, cat.id] : f.targetCategoryIds.filter(id => id !== cat.id) }))} />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                  {form.targetCategoryIds.length > 0 && <p className="text-xs text-muted-foreground">{form.targetCategoryIds.length}개 카테고리 선택됨</p>}
                </div>
              )}
              {form.targetType === "product" && (
                <div className="space-y-2">
                  <Input placeholder="상품 검색..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="text-sm" />
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {(productsQuery.data?.products ?? []).map((p: any) => (
                      <label key={p.id} className={`flex items-center gap-2 px-3 py-2 text-xs border-b last:border-0 cursor-pointer hover:bg-secondary/30 ${form.targetProductIds.includes(p.id) ? "bg-primary/5" : ""}`}>
                        <input type="checkbox" checked={form.targetProductIds.includes(p.id)}
                          onChange={e => setForm(f => ({ ...f, targetProductIds: e.target.checked ? [...f.targetProductIds, p.id] : f.targetProductIds.filter(id => id !== p.id) }))} />
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="text-muted-foreground">{formatPrice(p.salePrice ?? p.price)}</span>
                      </label>
                    ))}
                  </div>
                  {form.targetProductIds.length > 0 && <p className="text-xs text-muted-foreground">{form.targetProductIds.length}개 상품 선택됨</p>}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">발급 대상 (회원)</h3>
              <div className="flex gap-2 mb-3">
                {(["all", "specific"] as const).map(t => (
                  <button key={t} type="button" className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${form.assignType === t ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border hover:bg-secondary"}`}
                    onClick={() => setForm(f => ({ ...f, assignType: t }))}>
                    {t === "all" ? "전체 회원" : "특정 회원"}
                  </button>
                ))}
              </div>
              {form.assignType === "specific" && (
                <div className="space-y-2">
                  <Input placeholder="회원 검색 (이름/아이디)..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="text-sm" />
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {(usersQuery.data?.users ?? []).map((u: any) => (
                      <label key={u.id} className={`flex items-center gap-2 px-3 py-2 text-xs border-b last:border-0 cursor-pointer hover:bg-secondary/30 ${form.assignUserIds.includes(u.id) ? "bg-primary/5" : ""}`}>
                        <input type="checkbox" checked={form.assignUserIds.includes(u.id)}
                          onChange={e => setForm(f => ({ ...f, assignUserIds: e.target.checked ? [...f.assignUserIds, u.id] : f.assignUserIds.filter(id => id !== u.id) }))} />
                        <span className="truncate flex-1">{u.name}</span>
                        <span className="text-muted-foreground">{u.email}</span>
                      </label>
                    ))}
                  </div>
                  {form.assignUserIds.length > 0 && <p className="text-xs text-muted-foreground">{form.assignUserIds.length}명 선택됨</p>}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>취소</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Admin Promo Codes ───
function AdminPromoCodes() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.promoCode.adminList.useQuery();
  const categories = trpc.admin.categories.useQuery();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const productsQuery = trpc.admin.products.useQuery({ page: 1, limit: 50, search: productSearch || undefined }, { enabled: showDialog });
  const defaultForm = {
    code: "", name: "", description: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: 10, minOrderAmount: 0,
    maxDiscountAmount: "", totalUsageLimit: -1,
    perUserLimit: 1,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: (() => { const d = new Date(Date.now() + 30 * 86400000); d.setHours(23, 59, 0, 0); return d.toISOString().slice(0, 16); })(),
    isActive: 1,
    targetMode: "all" as "all" | "category" | "product",
    targetProductIds: [] as number[],
    targetCategoryIds: [] as number[],
  };
  const [form, setForm] = useState(defaultForm);
  const createMut = trpc.promoCode.adminCreate.useMutation({ onSuccess: () => { utils.promoCode.adminList.invalidate(); setShowDialog(false); toast.success("프로모코드가 생성되었습니다"); } });
  const updateMut = trpc.promoCode.adminUpdate.useMutation({ onSuccess: () => { utils.promoCode.adminList.invalidate(); setShowDialog(false); toast.success("프로모코드가 수정되었습니다"); } });
  const deleteMut = trpc.promoCode.adminDelete.useMutation({ onSuccess: () => { utils.promoCode.adminList.invalidate(); toast.success("프로모코드가 삭제되었습니다"); } });

  const parseIds = (s: string | null | undefined): number[] => s ? s.split(",").map(Number).filter(Boolean) : [];

  const openCreate = () => {
    setEditId(null);
    setForm({ ...defaultForm });
    setProductSearch("");
    setShowDialog(true);
  };
  const openEdit = (c: any) => {
    setEditId(c.id);
    const tpIds = parseIds(c.targetProductIds);
    const tcIds = parseIds(c.targetCategoryIds);
    const mode = tpIds.length > 0 ? "product" : tcIds.length > 0 ? "category" : "all";
    setForm({
      code: c.code, name: c.name, description: c.description ?? "",
      discountType: c.discountType, discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount,
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
      totalUsageLimit: c.totalUsageLimit,
      perUserLimit: c.perUserLimit,
      startDate: new Date(c.startDate).toISOString().slice(0, 16),
      endDate: new Date(c.endDate).toISOString().slice(0, 16),
      isActive: c.isActive,
      targetMode: mode,
      targetProductIds: tpIds,
      targetCategoryIds: tcIds,
    });
    setProductSearch("");
    setShowDialog(true);
  };
  const handleSave = () => {
    if (!form.code || !form.name) { toast.error("코드와 이름을 입력해주세요"); return; }
    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      totalUsageLimit: Number(form.totalUsageLimit),
      perUserLimit: Number(form.perUserLimit),
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      targetProductIds: form.targetMode === "product" && form.targetProductIds.length > 0 ? form.targetProductIds.join(",") || null : null,
      targetCategoryIds: form.targetMode === "category" && form.targetCategoryIds.length > 0 ? form.targetCategoryIds.join(",") || null : null,
    };
    if (editId) updateMut.mutate({ id: editId, ...payload });
    else createMut.mutate(payload);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">프로모코드 관리</h2>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" /> 프로모코드 생성</Button>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30"><tr>
            <th className="p-3 text-left">코드</th><th className="p-3 text-left">이름</th>
            <th className="p-3 text-left">할인</th><th className="p-3 text-left">적용대상</th>
            <th className="p-3 text-left">기간</th>
            <th className="p-3 text-center">사용/전체</th>
            <th className="p-3 text-center">1인당 한도</th>
            <th className="p-3 text-center">상태</th>
            <th className="p-3 text-center">관리</th>
          </tr></thead>
          <tbody className="divide-y">
            {data?.map((c: any) => (
              <tr key={c.id} className="hover:bg-secondary/20">
                <td className="p-3 font-mono text-xs">{c.code}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.discountType === "percent" ? `${c.discountValue}%` : formatPrice(c.discountValue)}</td>
                <td className="p-3 text-xs"><Badge variant="outline">{c.targetProductIds ? `상품 ${parseIds(c.targetProductIds).length}개` : c.targetCategoryIds ? `카테고리 ${parseIds(c.targetCategoryIds).length}개` : "전체 상품"}</Badge></td>
                <td className="p-3 text-xs">{new Date(c.startDate).toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false })} ~ {new Date(c.endDate).toLocaleString("ko-KR", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false })}</td>
                <td className="p-3 text-center">{c.usedCount}/{c.totalUsageLimit === -1 ? "∞" : c.totalUsageLimit}</td>
                <td className="p-3 text-center text-sm">{c.perUserLimit}회</td>
                <td className="p-3 text-center"><Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "활성" : "비활성"}</Badge></td>
                <td className="p-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMut.mutate({ id: c.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && !isLoading && (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">등록된 프로모코드가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "프로모코드 수정" : "프로모코드 생성"}</DialogTitle><DialogDescription>프로모코드 정보를 입력하세요</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">코드 *</label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="SUMMER20" /></div>
              <div><label className="text-sm font-medium">이름 *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="여름 할인 20%" /></div>
            </div>
            <div><label className="text-sm font-medium">설명</label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="프로모코드 설명" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">할인 유형</label>
                <select className="w-full border rounded-md p-2 text-sm" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as any }))}>
                  <option value="percent">비율 (%)</option><option value="fixed">정액 (원)</option>
                </select>
              </div>
              <div><label className="text-sm font-medium">할인값</label><Input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">최소 주문금액</label><Input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: Number(e.target.value) }))} /></div>
              <div><label className="text-sm font-medium">최대 할인액</label><Input type="number" value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} placeholder="무제한" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">시작일시</label><Input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div><label className="text-sm font-medium">종료일시</label><Input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">최대 사용 횟수</label>
                <Input type="number" value={form.totalUsageLimit} onChange={e => setForm(f => ({ ...f, totalUsageLimit: Number(e.target.value) }))} />
                <p className="text-xs text-muted-foreground mt-1">-1 = 무제한</p>
              </div>
              <div>
                <label className="text-sm font-medium">1인당 사용 횟수</label>
                <Input type="number" min={1} value={form.perUserLimit} onChange={e => setForm(f => ({ ...f, perUserLimit: Math.max(1, Number(e.target.value)) }))} />
              </div>
              <div className="flex items-end gap-2 pb-5">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive === 1} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked ? 1 : 0 }))} /> 활성화</label>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">적용 대상 (상품)</h3>
              <div className="flex gap-2 mb-3">
                {(["all", "category", "product"] as const).map(t => (
                  <button key={t} type="button"
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${form.targetMode === t ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border hover:bg-secondary"}`}
                    onClick={() => setForm(f => ({ ...f, targetMode: t, targetCategoryIds: t === "category" ? f.targetCategoryIds : [], targetProductIds: t === "product" ? f.targetProductIds : [] }))}>
                    {t === "all" ? "전체 상품" : t === "category" ? "특정 카테고리" : "특정 상품"}
                  </button>
                ))}
              </div>
              {form.targetMode === "category" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(categories.data ?? []).map((cat: any) => (
                      <label key={cat.id} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs cursor-pointer transition-colors ${form.targetCategoryIds.includes(cat.id) ? "bg-primary/10 border-primary text-primary" : "bg-background hover:bg-secondary/50"}`}>
                        <input type="checkbox" className="sr-only" checked={form.targetCategoryIds.includes(cat.id)}
                          onChange={e => setForm(f => ({ ...f, targetCategoryIds: e.target.checked ? [...f.targetCategoryIds, cat.id] : f.targetCategoryIds.filter(id => id !== cat.id) }))} />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                  {form.targetCategoryIds.length > 0 && <p className="text-xs text-muted-foreground">{form.targetCategoryIds.length}개 카테고리 선택됨</p>}
                </div>
              )}
              {form.targetMode === "product" && (
                <div className="space-y-2">
                  <Input placeholder="상품 검색..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="text-sm" />
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {(productsQuery.data?.products ?? []).map((p: any) => (
                      <label key={p.id} className={`flex items-center gap-2 px-3 py-2 text-xs border-b last:border-0 cursor-pointer hover:bg-secondary/30 ${form.targetProductIds.includes(p.id) ? "bg-primary/5" : ""}`}>
                        <input type="checkbox" checked={form.targetProductIds.includes(p.id)}
                          onChange={e => setForm(f => ({ ...f, targetProductIds: e.target.checked ? [...f.targetProductIds, p.id] : f.targetProductIds.filter(id => id !== p.id) }))} />
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="text-muted-foreground">{formatPrice(p.salePrice ?? p.price)}</span>
                      </label>
                    ))}
                  </div>
                  {form.targetProductIds.length > 0 && <p className="text-xs text-muted-foreground">{form.targetProductIds.length}개 상품 선택됨</p>}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>취소</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Admin Product Q&A Management ───
type QnAPost = {
  id: number;
  title: string | null;
  content: string | null;
  isAnswered: number | null;
  createdAt: Date | string | null;
  userName?: string | null;
  productName?: string | null;
  productThumbnail?: string | null;
  [key: string]: unknown;
};

function AdminQnAItem({ post, onInvalidate }: { post: QnAPost; onInvalidate: () => void }) {
  const utils = trpc.useUtils();
  const [isExpanded, setIsExpanded] = useState(false);
  const [answerContent, setAnswerContent] = useState("");

  const { data: comments } = trpc.community.comments.useQuery(
    { postId: post.id },
    { enabled: isExpanded }
  );

  const answerQnA = trpc.community.answerQnA.useMutation({
    onSuccess: () => {
      toast.success("답변이 등록되었습니다");
      setAnswerContent("");
      onInvalidate();
      utils.community.comments.invalidate({ postId: post.id });
    },
    onError: (e) => toast.error(e.message),
  });

  const isAnswered = post.isAnswered === 1;

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => { setIsExpanded(v => !v); setAnswerContent(""); }}
      >
        <div className="shrink-0">
          {post.productThumbnail ? (
            <img src={proxyImage(post.productThumbnail)} alt={post.productName ?? "상품"} className="w-12 h-12 object-cover rounded-lg border" />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-lg border flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {post.productName && (
            <p className="text-xs text-muted-foreground mb-0.5 truncate">{post.productName}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">Q</span>
            <p className="font-medium text-sm">{post.title}</p>
            <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${isAnswered ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-600 border-rose-200"}`}>
              {isAnswered ? "답변완료" : "미답변"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.content}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {post.userName ?? "익명"} · {formatDate(post.createdAt)}
          </p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
          <div className="bg-card rounded-lg p-3 border">
            <p className="text-xs font-semibold text-muted-foreground mb-1">질문 내용</p>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          </div>

          {comments && comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((c: any) => (
                <div key={c.id} className={`flex gap-2 p-3 rounded-lg border ${c.isAdmin ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-card"}`}>
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 mt-0.5 ${c.isAdmin ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                    {c.isAdmin ? "A" : "U"}
                  </span>
                  <div className="flex-1 min-w-0">
                    {c.isAdmin && <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">관리자 답변</p>}
                    <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(c.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">관리자 답변 작성</p>
            <textarea
              className="w-full border rounded-lg p-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={4}
              placeholder="답변 내용을 입력하세요"
              value={answerContent}
              onChange={e => setAnswerContent(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={!answerContent.trim() || answerQnA.isPending}
                onClick={() => answerQnA.mutate({ postId: post.id, content: answerContent.trim() })}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                답변 등록
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminProductQnA() {
  const utils = trpc.useUtils();
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => { setPage(1); }, [search]);

  const { data, isLoading } = trpc.community.adminProductQnA.useQuery({ page, limit: 30, onlyUnanswered });

  const filteredPosts = useMemo(() => {
    if (!data?.posts) return [];
    if (!search.trim()) return data.posts;
    const s = search.trim().toLowerCase();
    return data.posts.filter(p =>
      (p.title?.toLowerCase().includes(s) || false) ||
      (p.content?.toLowerCase().includes(s) || false) ||
      (p.productName?.toLowerCase().includes(s) || false) ||
      (p.userName?.toLowerCase().includes(s) || false)
    );
  }, [data?.posts, search]);

  const totalPages = Math.ceil((data?.total ?? 0) / 30);

  const handleInvalidate = () => utils.community.adminProductQnA.invalidate();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <HelpCircle className="w-6 h-6 text-primary" />
        상품 Q&A 관리
      </h2>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex gap-2">
          <Button size="sm" variant={!onlyUnanswered ? "default" : "outline"} onClick={() => { setOnlyUnanswered(false); setPage(1); }}>
            전체 {!onlyUnanswered && data && <span className="ml-1 bg-white/20 text-white px-1.5 py-0.5 rounded text-xs">{data.total}</span>}
          </Button>
          <Button size="sm" variant={onlyUnanswered ? "default" : "outline"} onClick={() => { setOnlyUnanswered(true); setPage(1); }}>
            미답변
            {onlyUnanswered && data && <span className="ml-1 bg-white/20 text-white px-1.5 py-0.5 rounded text-xs">{data.total}</span>}
          </Button>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="상품명, 제목, 작성자 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <HelpCircle className="w-12 h-12 opacity-20" />
          <p className="text-lg font-medium">{search.trim() ? "검색 결과가 없습니다" : onlyUnanswered ? "미답변 Q&A가 없습니다" : "Q&A가 없습니다"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <AdminQnAItem key={post.id} post={post} onInvalidate={handleInvalidate} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

// ─── Admin Reviews (with reply) ───
function AdminReviews() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => { setPage(1); }, [search]);

  const { data, isLoading } = trpc.community.adminReviews.useQuery({ page, limit: 30 });
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");
  const { data: replies } = trpc.community.reviewReplies.useQuery(
    { postId: selectedReview?.id ?? 0 },
    { enabled: !!selectedReview }
  );
  const createReply = trpc.community.createReviewReply.useMutation({
    onSuccess: () => {
      toast.success("답변이 등록되었습니다");
      setReplyContent("");
      utils.community.reviewReplies.invalidate();
      utils.community.adminReviews.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteReply = trpc.community.deleteReviewReply.useMutation({
    onSuccess: () => {
      toast.success("답변이 삭제되었습니다");
      utils.community.reviewReplies.invalidate();
      utils.community.adminReviews.invalidate();
    },
  });

  const filteredReviews = useMemo(() => {
    if (!data?.reviews) return [];
    if (!search.trim()) return data.reviews;
    const s = search.trim().toLowerCase();
    return data.reviews.filter(r =>
      (r.title?.toLowerCase().includes(s) || false) ||
      (r.content?.toLowerCase().includes(s) || false) ||
      (r.productName?.toLowerCase().includes(s) || false) ||
      (r.userName?.toLowerCase().includes(s) || false) ||
      (r.userEmail?.toLowerCase().includes(s) || false)
    );
  }, [data?.reviews, search]);

  const totalPages = Math.ceil((data?.total ?? 0) / 30);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">리뷰 관리</h2>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="상품명, 제목, 작성자 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30"><tr>
            <th className="p-3 text-left">ID</th><th className="p-3 text-left">상품</th><th className="p-3 text-left">제목</th>
            <th className="p-3 text-left">작성자</th><th className="p-3 text-center">별점</th>
            <th className="p-3 text-center">답변</th><th className="p-3 text-left">작성일</th>
            <th className="p-3 text-center">관리</th>
          </tr></thead>
          <tbody className="divide-y">
            {filteredReviews.map(r => (
              <tr key={r.id} className="hover:bg-secondary/20 cursor-pointer" onClick={() => setSelectedReview(r)}>
                <td className="p-3">{r.id}</td>
                <td className="p-3">
                  {r.productThumbnail ? (
                    <img src={proxyImage(r.productThumbnail)} alt={r.productName ?? "상품"} className="w-12 h-12 object-cover rounded border" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-muted-foreground/40" /></div>
                  )}
                </td>
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3">
                  <div className="font-medium">{r.userName ?? "익명"}</div>
                  {r.userEmail && <div className="text-xs text-muted-foreground">{r.userEmail}</div>}
                </td>
                <td className="p-3 text-center">{r.rating ? `${"★".repeat(r.rating)}` : "-"}</td>
                <td className="p-3 text-center"><Badge variant={r.replyCount > 0 ? "default" : "outline"}>{r.replyCount > 0 ? `${r.replyCount}건` : "미답변"}</Badge></td>
                <td className="p-3 text-xs">{formatDate(r.createdAt)}</td>
                <td className="p-3 text-center"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedReview(r); }}><Eye className="w-4 h-4" /></Button></td>
              </tr>
            ))}
            {filteredReviews.length === 0 && !isLoading && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{search.trim() ? "검색 결과가 없습니다" : "리뷰가 없습니다"}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedReview} onOpenChange={(open) => { if (!open) setSelectedReview(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>리뷰 상세 / 답변</DialogTitle><DialogDescription>리뷰에 관리자 답변을 달 수 있습니다</DialogDescription></DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              {/* 상품 정보 */}
              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                {selectedReview.productThumbnail ? (
                  <img src={proxyImage(selectedReview.productThumbnail)} alt={selectedReview.productName ?? "상품"} className="w-14 h-14 object-cover rounded-lg border shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-muted rounded-lg border flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedReview.productName ?? "상품명 없음"}</p>
                  <p className="text-xs text-muted-foreground">상품 리뷰</p>
                </div>
              </div>

              <div className="bg-secondary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{selectedReview.userName ?? "익명"}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(selectedReview.createdAt)}</span>
                </div>
                <h3 className="font-semibold mb-1">{selectedReview.title}</h3>
                {selectedReview.rating && <div className="text-amber-500 text-sm mb-2">{"\u2605".repeat(selectedReview.rating)}{"\u2606".repeat(5 - selectedReview.rating)}</div>}
                <p className="text-sm whitespace-pre-wrap">{selectedReview.content}</p>
              </div>

              {/* Existing replies */}
              {replies && replies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">답변 ({replies.length})</p>
                  {replies.map(reply => (
                    <div key={reply.id} className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-primary">관리자 답변</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteReply.mutate({ id: reply.id })}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Write reply */}
              <div>
                <label className="text-sm font-medium block mb-1.5">답변 작성</label>
                <Textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="리뷰에 대한 답변을 작성하세요..." rows={3} />
                <div className="flex justify-end mt-2">
                  <Button size="sm" disabled={!replyContent.trim() || createReply.isPending} onClick={() => createReply.mutate({ postId: selectedReview.id, content: replyContent.trim() })}>
                    {createReply.isPending ? "등록 중..." : "답변 등록"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

// ─── Admin Shipping ───
function AdminShipping() {
  const { data: stats } = trpc.shipping.adminShippingStats.useQuery();
  const { data: carriers } = trpc.shipping.carriers.useQuery();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const { data: shipmentsData } = trpc.shipping.adminShipments.useQuery({ page, limit: 20, status: statusFilter === "all" ? undefined : statusFilter });
  const { data: pendingData } = trpc.shipping.adminPendingOrders.useQuery({ page: 1, limit: 50 });
  const utils = trpc.useUtils();

  // Bulk tracking number input
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [singleDialogOpen, setSingleDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryMemo, setDeliveryMemo] = useState("");
  const [bulkEntries, setBulkEntries] = useState<{ orderId: number; trackingNumber: string }[]>([]);

  const registerShipment = trpc.shipping.adminCreateShipment.useMutation({
    onSuccess: () => {
      toast.success("운송장이 등록되었습니다.");
      setSingleDialogOpen(false);
      setTrackingNumber("");
      setDeliveryMemo("");
      utils.shipping.adminShipments.invalidate();
      utils.shipping.adminPendingOrders.invalidate();
      utils.shipping.adminShippingStats.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkRegister = trpc.shipping.adminBulkCreateShipment.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.successCount}건의 운송장이 등록되었습니다.`);
      setBulkDialogOpen(false);
      setBulkEntries([]);
      utils.shipping.adminShipments.invalidate();
      utils.shipping.adminPendingOrders.invalidate();
      utils.shipping.adminShippingStats.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = trpc.shipping.adminUpdateShipmentStatus.useMutation({
    onSuccess: () => {
      toast.success("배송 상태가 변경되었습니다.");
      utils.shipping.adminShipments.invalidate();
      utils.shipping.adminShippingStats.invalidate();
    },
  });

  // 일괄 새로고침 기능
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<number[]>([]);
  const [bulkRefreshProgress, setBulkRefreshProgress] = useState<{ total: number; done: number; running: boolean }>({ total: 0, done: 0, running: false });

  const bulkRefresh = trpc.shipping.adminBulkRefreshTracking.useMutation({
    onSuccess: (data: any) => {
      setBulkRefreshProgress({ total: data.total, done: data.total, running: false });
      if (data.failCount > 0) {
        toast.warning(`${data.successCount}건 성공, ${data.failCount}건 실패`);
      } else {
        toast.success(`${data.successCount}건의 배송 정보가 업데이트되었습니다.`);
      }
      setSelectedShipmentIds([]);
      utils.shipping.adminShipments.invalidate();
      utils.shipping.adminShippingStats.invalidate();
    },
    onError: (e: any) => {
      setBulkRefreshProgress(p => ({ ...p, running: false }));
      toast.error(e.message);
    },
  });

  const toggleShipmentSelect = (id: number) => {
    setSelectedShipmentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAllShipments = () => {
    const allIds = (shipmentsData?.shipments ?? []).map((s: any) => s.id);
    if (selectedShipmentIds.length === allIds.length && allIds.length > 0) {
      setSelectedShipmentIds([]);
    } else {
      setSelectedShipmentIds(allIds);
    }
  };

  const handleBulkRefresh = () => {
    if (selectedShipmentIds.length === 0) {
      toast.error("새로고침할 배송건을 선택해주세요.");
      return;
    }
    setBulkRefreshProgress({ total: selectedShipmentIds.length, done: 0, running: true });
    bulkRefresh.mutate({ shipmentIds: selectedShipmentIds });
  };

  const shipmentStatusLabels: Record<string, string> = {
    ready: "배송 준비", picked_up: "상품 수거", in_transit: "배송 중",
    out_for_delivery: "배달 출발", delivered: "배달 완료", failed: "배송 실패",
    import_customs: "통관검사", customs_departure: "통관 출발", customs_arrival: "통관 도착",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">배송 관리</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)} className="gap-2"><Upload className="w-4 h-4" />일괄 등록</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Clock className="w-4 h-4" />발송 대기</div>
          <p className="text-2xl font-bold">{stats?.pending ?? 0}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1"><Truck className="w-4 h-4" />배송 중</div>
          <p className="text-2xl font-bold text-blue-600">{stats?.shipping ?? 0}</p>
        </div>
        <div className="bg-card border border-rose-200 dark:border-rose-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-rose-600 text-sm mb-1"><AlertCircle className="w-4 h-4" />통관검사</div>
          <p className="text-2xl font-bold text-rose-600">{stats?.customsHold ?? 0}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-600 text-sm mb-1"><CheckCircle2 className="w-4 h-4" />배달 완료</div>
          <p className="text-2xl font-bold text-emerald-600">{stats?.delivered ?? 0}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-destructive text-sm mb-1"><AlertCircle className="w-4 h-4" />배송 실패</div>
          <p className="text-2xl font-bold text-destructive">{stats?.failed ?? 0}</p>
        </div>
      </div>

      {/* Pending Orders */}
      {(pendingData?.orders ?? []).length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />발송 대기 주문 ({pendingData?.orders.length}건)</h3>
          <div className="space-y-2">
            {pendingData!.orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between bg-background rounded-lg p-3">
                <div>
                  <span className="text-sm font-medium font-mono">{(order as any).orderNumber || `#${order.id}`}</span>
                  <span className="text-xs text-muted-foreground ml-2">{formatDate(order.createdAt)}</span>
                </div>
                <Button size="sm" onClick={() => { setSelectedOrderId(order.id); setSingleDialogOpen(true); }} className="gap-1">
                  <Truck className="w-3 h-3" />운송장 등록
                </Button>
              </div>
            ))}
            {(pendingData?.orders.length ?? 0) > 5 && <p className="text-xs text-muted-foreground text-center">외 {(pendingData?.orders.length ?? 0) - 5}건</p>}
          </div>
        </div>
      )}

      {/* Shipments List */}
      <div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <h3 className="font-semibold">배송 목록</h3>
          {selectedShipmentIds.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkRefresh}
              disabled={bulkRefreshProgress.running}
              className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${bulkRefreshProgress.running ? 'animate-spin' : ''}`} />
              {bulkRefreshProgress.running
                ? `새로고침 중... (${selectedShipmentIds.length}건)`
                : `선택한 ${selectedShipmentIds.length}건 새로고침`}
            </Button>
          )}
          <div className="flex gap-1 ml-auto">
            {["all", "ready", "in_transit", "import_customs", "out_for_delivery", "delivered", "failed"].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); setSelectedShipmentIds([]); }} className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                {s === "all" ? "전체" : shipmentStatusLabels[s] || s}
              </button>
            ))}
          </div>
        </div>

        {/* 일괄 새로고침 진행 상태 바 */}
        {bulkRefreshProgress.running && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">배송 정보 일괄 새로고침 중...</span>
              <span className="text-xs text-blue-500 ml-auto">{bulkRefreshProgress.total}건 처리 중</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
          </div>
        )}

        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={selectedShipmentIds.length === (shipmentsData?.shipments ?? []).length && (shipmentsData?.shipments ?? []).length > 0}
                    onChange={toggleSelectAllShipments}
                    className="rounded"
                  />
                </th>
                <th className="p-3 text-left">주문번호</th><th className="p-3 text-left">택배사</th><th className="p-3 text-left">운송장번호</th><th className="p-3 text-center">상태</th><th className="p-3 text-center">등록일</th><th className="p-3 text-center">작업</th>
              </tr>
            </thead>
            <tbody>
              {(shipmentsData?.shipments ?? []).map(s => (
                <tr key={s.id} className={`border-t hover:bg-secondary/20 ${selectedShipmentIds.includes(s.id) ? 'bg-blue-50 dark:bg-blue-950/10' : ''}`}>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedShipmentIds.includes(s.id)}
                      onChange={() => toggleShipmentSelect(s.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3 font-mono text-xs">#{s.orderId}</td>
                  <td className="p-3">국제배송</td>
                  <td className="p-3 text-xs">{s.trackingNumber}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "delivered" ? "bg-emerald-100 text-emerald-700" : s.status === "failed" ? "bg-red-100 text-red-700" : s.status === "import_customs" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                      {shipmentStatusLabels[s.status] || s.status}
                    </span>
                  </td>
                  <td className="p-3 text-center text-xs text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="p-3 text-center">
                    <Select onValueChange={(v) => updateStatus.mutate({ shipmentId: s.id, status: v as any })} value={s.status}>
                      <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(shipmentStatusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {(shipmentsData?.shipments ?? []).length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">배송 데이터가 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Register Dialog */}
      <Dialog open={singleDialogOpen} onOpenChange={setSingleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>운송장 등록</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              국제배송으로 자동 등록됩니다.
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">운송장 번호</label>
              <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="운송장 번호 입력 (예: EE123456789KR)" />
            </div>
            <Button className="w-full" disabled={!trackingNumber || registerShipment.isPending}
              onClick={() => selectedOrderId && registerShipment.mutate({ orderId: selectedOrderId, trackingNumber })}>
              {registerShipment.isPending ? "등록 중..." : "운송장 등록"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Register Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>일괄 운송장 등록</DialogTitle><DialogDescription>발송 대기 중인 주문에 운송장을 일괄 등록합니다.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              모든 주문이 국제배송으로 자동 등록됩니다.
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {(pendingData?.orders ?? []).map(order => {
                const entry = bulkEntries.find(e => e.orderId === order.id);
                return (
                  <div key={order.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
                    <span className="text-xs font-mono w-20 shrink-0">#{String(order.id).padStart(6, '0')}</span>
                    <Input placeholder="운송장 번호" className="h-8 text-xs" value={entry?.trackingNumber ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBulkEntries(prev => {
                          const existing = prev.find(x => x.orderId === order.id);
                          if (existing) return prev.map(x => x.orderId === order.id ? { ...x, trackingNumber: val } : x);
                          return [...prev, { orderId: order.id, trackingNumber: val }];
                        });
                      }} />
                  </div>
                );
              })}
              {(pendingData?.orders ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">발송 대기 주문이 없습니다</p>}
            </div>
            <Button className="w-full" disabled={bulkEntries.filter(e => e.trackingNumber).length === 0 || bulkRegister.isPending}
              onClick={() => {
                const entries = bulkEntries.filter(e => e.trackingNumber);
                bulkRegister.mutate({ shipments: entries });
              }}>
              {bulkRegister.isPending ? "등록 중..." : `${bulkEntries.filter(e => e.trackingNumber).length}건 일괄 등록`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Admin Returns ───
function AdminReturns() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const { data } = trpc.shipping.adminReturnRequests.useQuery({ page, limit: 20, status: statusFilter === "all" ? undefined : statusFilter });
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [adminMemo, setAdminMemo] = useState("");
  const utils = trpc.useUtils();

  const updateReturn = trpc.shipping.adminUpdateReturnRequest.useMutation({
    onSuccess: () => {
      toast.success("상태가 변경되었습니다.");
      setSelectedReturn(null);
      utils.shipping.adminReturnRequests.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const returnStatusLabels: Record<string, string> = {
    requested: "접수됨", approved: "승인", collecting: "수거 중",
    collected: "수거 완료", completed: "처리 완료", rejected: "거부",
  };
  const returnTypeLabels: Record<string, string> = { return: "반품", exchange: "교환" };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">반품/교환 관리</h2>

      <div className="flex gap-1 mb-4">
        {["all", "requested", "approved", "collecting", "collected", "completed", "rejected"].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
            {s === "all" ? "전체" : returnStatusLabels[s] || s}
          </button>
        ))}
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="p-3 text-left">ID</th><th className="p-3 text-left">유형</th><th className="p-3 text-left">주문번호</th><th className="p-3 text-left">사유</th><th className="p-3 text-center">상태</th><th className="p-3 text-center">신청일</th><th className="p-3 text-center">작업</th></tr>
          </thead>
          <tbody>
            {(data?.requests ?? []).map(r => (
              <tr key={r.id} className="border-t hover:bg-secondary/20">
                <td className="p-3">#{r.id}</td>
                <td className="p-3"><Badge variant={r.type === "return" ? "destructive" : "secondary"}>{returnTypeLabels[r.type] || r.type}</Badge></td>
                <td className="p-3 font-mono text-xs">#{r.orderId}</td>
                <td className="p-3 text-xs max-w-48 truncate">{r.reason}</td>
                <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "completed" ? "bg-emerald-100 text-emerald-700" : r.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{returnStatusLabels[r.status] || r.status}</span></td>
                <td className="p-3 text-center text-xs text-muted-foreground">{formatDate(r.createdAt)}</td>
                <td className="p-3 text-center"><Button variant="ghost" size="sm" onClick={() => { setSelectedReturn(r); setAdminMemo((r as any).adminMemo || ""); }}><Eye className="w-4 h-4" /></Button></td>
              </tr>
            ))}
            {(data?.requests ?? []).length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">반품/교환 요청이 없습니다</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Return Detail Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>반품/교환 상세</DialogTitle></DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">유형</span><p className="font-medium">{returnTypeLabels[selectedReturn.type]}</p></div>
                <div><span className="text-muted-foreground">주문번호</span><p className="font-medium">#{selectedReturn.orderId}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">사유</span><p className="font-medium">{selectedReturn.reason}</p></div>
                {selectedReturn.detailReason && <div className="col-span-2"><span className="text-muted-foreground">상세 사유</span><p className="text-sm">{selectedReturn.detailReason}</p></div>}
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium mb-1.5 block">관리자 메모</label>
                <Textarea value={adminMemo} onChange={(e) => setAdminMemo(e.target.value)} rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">상태 변경</label>
                <div className="flex gap-2 flex-wrap">
                  {["approved", "collecting", "collected", "completed", "rejected"].map(s => (
                    <Button key={s} size="sm" variant={selectedReturn.status === s ? "default" : "outline"}
                      disabled={updateReturn.isPending}
                      onClick={() => updateReturn.mutate({ id: selectedReturn.id, status: s as any, adminMemo })}>
                      {returnStatusLabels[s]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Admin Shipping Policy ───
function AdminShippingPolicy() {
  const { data: settingsData, isLoading } = trpc.admin.getSettings.useQuery();
  const updateSetting = trpc.admin.upsertSetting.useMutation({ onSuccess: () => toast.success("배송비 정책이 저장되었습니다."), onError: (e) => toast.error(e.message) });

  const getVal = (key: string, fallback: string) =>
    settingsData?.find((s: any) => s.key === key)?.value ?? fallback;

  const [method, setMethod] = useState("");
  const [fee, setFee] = useState("");
  const [additionalFee, setAdditionalFee] = useState("");
  const [days, setDays] = useState("");
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (settingsData && !loaded) {
      setMethod(getVal("shippingMethod", "국제배송"));
      setFee(getVal("shippingFee", "0"));
      setAdditionalFee(getVal("shippingAdditionalFee", "590"));
      setDays(getVal("shippingDays", "10~14일 (영업일기준)"));
      setNote(getVal("shippingNote", "모든 주문은 국제배송으로 발송되며, 배송비는 전액 무료입니다. 배송 추적은 17track을 통해 제공됩니다."));
      setLoaded(true);
    }
  }, [settingsData, loaded]);

  const handleSave = async () => {
    await Promise.all([
      updateSetting.mutateAsync({ key: "shippingMethod", value: method, label: "배송 방법" }),
      updateSetting.mutateAsync({ key: "shippingFee", value: fee, label: "배송비" }),
      updateSetting.mutateAsync({ key: "shippingAdditionalFee", value: additionalFee, label: "추가 수량당 배송비" }),
      updateSetting.mutateAsync({ key: "shippingDays", value: days, label: "예상 배송일" }),
      updateSetting.mutateAsync({ key: "shippingNote", value: note, label: "배송 안내" }),
    ]);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold mb-6">배송비 정책</h1>

      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          배송 정책 설정
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">배송 방법</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="예: 국제배송"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">배송비</label>
            <div className="flex items-center gap-2">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="예: 0 또는 무료"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">0 또는 '무료' 입력 시 무료배송으로 표시됩니다.</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">추가 수량당 배송비 (2번째 상품부터)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              value={additionalFee}
              onChange={(e) => setAdditionalFee(e.target.value)}
              placeholder="예: 590"
            />
            <p className="text-xs text-muted-foreground mt-1">주문 상품 수량이 2개 이상일 때, 2번째 상품부터 1개당 추가되는 배송비입니다.</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">예상 배송일</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="예: 10~14일 (영업일기준)"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">배송 안내 문구</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="배송 안내 메시지를 입력하세요."
          />
        </div>

        <Button size="sm" onClick={handleSave} disabled={updateSetting.isPending}>
          {updateSetting.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          설정 저장
        </Button>
      </div>

      {/* 미리보기 */}
      <div className="bg-card border rounded-xl p-5">
        <h2 className="text-base font-semibold mb-3">미리보기</h2>
        <div className="bg-card border rounded-xl p-4 ring-2 ring-primary">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold">{fee === "0" || fee.toLowerCase() === "무료" ? "전 상품 무료배송" : `배송비 ${fee}원`}</h3>
              <p className="text-xs text-muted-foreground">{method}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
            <div className="bg-muted/50 rounded-lg p-2.5">
              <span className="text-xs text-muted-foreground">배송 방법</span>
              <p className="font-semibold mt-0.5 text-sm">{method}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5">
              <span className="text-xs text-muted-foreground">배송비 (1개 / 추가 1개당)</span>
              <p className={`font-semibold mt-0.5 text-sm ${fee === "0" || fee.toLowerCase() === "무료" ? "text-emerald-600" : ""}`}>
                {fee === "0" || fee.toLowerCase() === "무료" ? "무료" : `${Number(fee).toLocaleString()}원 / +${Number(additionalFee || 0).toLocaleString()}원`}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5">
              <span className="text-xs text-muted-foreground">예상 배송일</span>
              <p className="font-semibold mt-0.5 text-sm">{days}</p>
            </div>
          </div>
          {note && <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">{note}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Router ───
function OrderDetailWrapper() {
  const [, params] = useLocation();
  const match = window.location.pathname.match(/\/admin\/orders\/(\d+)/);
  const id = match ? Number(match[1]) : 0;
  if (!id) return <AdminOrders />;
  return <AdminOrderDetail id={id} />;
}

function AdminRefundManagement() {
  const CLAIM_STATUSES = ["접수", "처리중", "승인", "반려", "완료"];
  const CLAIM_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    접수: { color: "#f59e0b", bg: "#fffbeb" },
    처리중: { color: "#3b82f6", bg: "#eff6ff" },
    승인: { color: "#C24FA0", bg: "#fdf2fa" },
    반려: { color: "#ef4444", bg: "#fef2f2" },
    완료: { color: "#6b7280", bg: "#f9fafb" },
  };
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.order.adminClaimList.useQuery({ page, limit: 30, status: statusFilter === "전체" ? undefined : statusFilter });
  const utils = trpc.useUtils();
  const updateClaim = trpc.order.adminUpdateClaim.useMutation({
    onSuccess: () => {
      utils.order.adminClaimList.invalidate();
      toast.success("저장되었습니다");
    },
    onError: (e) => toast.error(e.message),
  });
  const [memoDrafts, setMemoDrafts] = useState<Record<number, string>>({});

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-rose-500" />
          환불 관리
        </h1>
        <div className="flex gap-2 flex-wrap">
          {["전체", ...CLAIM_STATUSES].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          <p className="text-lg font-medium">{statusFilter === "전체" ? "요청 내역이 없습니다" : `'${statusFilter}' 상태인 요청이 없습니다`}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((c: any) => {
            const sc = CLAIM_STATUS_COLORS[c.status] || { color: "#888", bg: "#f5f5f5" };
            const memoDraft = memoDrafts[c.id] ?? c.adminMemo ?? "";
            const memoDirty = memoDraft !== (c.adminMemo ?? "");
            return (
              <div key={c.id} className={`bg-card border rounded-xl p-4 flex flex-col sm:flex-row gap-4 ${c.status === "완료" || c.status === "반려" ? "opacity-70" : ""}`}>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/orders/${c.odId}`} className="font-mono font-semibold text-sm text-primary hover:underline">
                      {formatOrderNumber(c.odId)}
                    </Link>
                    <Badge variant="outline" className="text-xs">{c.claimType}</Badge>
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.color}30` }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{c.itemName}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.userName}{c.userPhone ? ` · ${c.userPhone}` : ""}{c.userEmail ? ` (${c.userEmail})` : ""}
                  </p>
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 mt-1">
                    <span className="font-medium">요청사유: </span>{c.reason}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    접수일: {formatDateTime(c.createdAt)}
                    {c.updatedAt && new Date(c.updatedAt).getTime() !== new Date(c.createdAt).getTime() ? ` · 수정일: ${formatDateTime(c.updatedAt)}` : ""}
                  </p>
                  <div className="mt-2">
                    <textarea
                      className="w-full text-xs border rounded px-2 py-1.5 min-h-[52px] resize-y bg-background"
                      placeholder="관리자 메모 (고객에게는 보이지 않음)"
                      value={memoDraft}
                      onChange={(e) => setMemoDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    />
                    {memoDirty && (
                      <div className="flex justify-end mt-1">
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs"
                          disabled={updateClaim.isPending}
                          onClick={() => updateClaim.mutate({ id: c.id, adminMemo: memoDraft })}
                        >
                          메모 저장
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">주문금액</p>
                    <p className="text-lg font-bold text-rose-600">{formatPrice(c.totalAmount)}</p>
                  </div>
                  <select
                    className="text-xs border rounded px-2 py-1.5 h-8 bg-background"
                    value={c.status}
                    disabled={updateClaim.isPending}
                    onChange={(e) => updateClaim.mutate({ id: c.id, status: e.target.value })}
                  >
                    {CLAIM_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {data && data.total > 30 && (
        <div className="mt-6 flex justify-center">
          <Paginator page={page} totalPages={Math.ceil(data.total / 30)} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={DashboardHome} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/orders/spreadsheet" component={AdminOrdersSpreadsheet} />
        <Route path="/admin/orders/:id">{(params) => <AdminOrderDetail id={params.id} />}</Route>
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/users/:id">{(params) => <AdminUserDetail />}</Route>
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/carts" component={AdminCartManagement} />
        <Route path="/admin/point-history" component={AdminPointHistory} />
        <Route path="/admin/point-settings" component={AdminPointSettings} />
        <Route path="/admin/point-expiration" component={AdminPointExpiration} />
        <Route path="/admin/email-template" component={AdminEmailTemplate} />
        <Route path="/admin/smtp-settings" component={AdminSmtpSettings} />
        <Route path="/admin/email-logs" component={AdminEmailLogs} />
        <Route path="/admin/faq" component={AdminFAQ} />
        <Route path="/admin/boards" component={AdminBoards} />
        <Route path="/admin/banners" component={AdminBanners} />
        <Route path="/admin/keywords" component={AdminKeywords} />
        <Route path="/admin/review-settings" component={AdminReviewSettings} />
        <Route path="/admin/coupons" component={AdminCoupons} />
        <Route path="/admin/promo-codes" component={AdminPromoCodes} />
        <Route path="/admin/product-qna" component={AdminProductQnA} />
        <Route path="/admin/reviews" component={AdminReviews} />
        <Route path="/admin/shipping-policy" component={AdminShippingPolicy} />
        <Route path="/admin/excel-upload/products">{() => <AdminProductExcelUpload />}</Route>
        <Route path="/admin/excel-upload/tracking">{() => <AdminTrackingExcelUpload />}</Route>
        <Route path="/admin/shipping-dashboard" component={AdminShippingDashboard} />
        <Route path="/admin/point-expiration" component={AdminPointSettings} />
        <Route path="/admin/chatbot/settings" component={AdminChatbotSettings} />
        <Route path="/admin/chatbot/categories" component={AdminChatbotCategories} />
        <Route path="/admin/chatbot/qna" component={AdminChatbotQna} />
        <Route path="/admin/chatbot/conversations" component={AdminChatbotConversations} />
        <Route path="/admin/payment-settings" component={AdminPaymentSettings} />
        <Route path="/admin/payment-management" component={AdminPaymentManagement} />
        <Route path="/admin/pricing-settings" component={AdminPricingSettings} />
        <Route path="/admin/refunds" component={AdminRefundManagement} />
        <Route path="/admin/news" component={AdminNewsManagement} />
        <Route path="/admin/news-settings" component={AdminNewsAutoSettings} />
        <Route path="/admin/inquiries" component={AdminInquiries} />
        <Route path="/admin/info-board-auto" component={AdminInfoBoardAuto} />
        <Route path="/admin/discussion-auto" component={AdminDiscussionAuto} />
        <Route path="/admin/gnu-api-sync" component={AdminGnuApiSync} />
        <Route path="/admin/api-settings" component={AdminApiSettings} />
        <Route path="/admin/action-logs" component={AdminActionLogs} />
        <Route path="/admin/visitor-stats" component={AdminVisitorStats} />
        <Route>{() => <div className="flex flex-col items-center justify-center py-20 gap-4"><AlertCircle className="w-12 h-12 text-muted-foreground" /><h2 className="text-xl font-bold">페이지를 찾을 수 없습니다</h2><p className="text-muted-foreground">요청하신 관리자 페이지가 존재하지 않습니다.</p><Link href="/admin"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />대시보드로</Button></Link></div>}</Route>
      </Switch>
    </AdminLayout>
  );
}
