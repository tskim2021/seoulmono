import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button } from "../components/ui";
import { Image, Plus, Trash2, Pencil, Loader2, Monitor, Smartphone, ExternalLink, Link2, X, ChevronUp, ChevronDown, LayoutGrid, Save, Tag, AlignLeft, MousePointer, Eye, EyeOff, Type, ImageIcon, Palette, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "../hooks/use-toast";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface B2BBanner {
  id: number;
  banner_type: "image" | "text";
  pc_image_url: string;
  mobile_image_url: string;
  bg_color: string;
  text_title: string;
  text_sub: string;
  text_cta: string;
  text_cta_color: string;
  text_cta_bg: string;
  title: string;
  link_url: string;
  is_new_window: number;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
}

interface ShopMainBanner {
  id: number;
  badge_text: string;
  badge_color: string;
  title_line1: string;
  title_line2: string;
  sub_text: string;
  cta_text: string;
  cta_bg: string;
  cta_color: string;
  bg_gradient: string;
  link_url: string;
  sort_order: number;
  is_active: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { authorization: `Bearer ${token}` } : {};
}

// ─── B2B Banner helpers ───────────────────────────────────────────────────────

async function fetchImageBanners(): Promise<B2BBanner[]> {
  const res = await fetch("/api/admin/image-banners", { headers: authHeaders() });
  if (!res.ok) throw new Error("불러오기 실패");
  const data = await res.json();
  return data.banners || [];
}

const emptyB2BForm = () => ({
  banner_type: "image" as "image" | "text",
  title: "", link_url: "", is_new_window: false,
  start_date: "", end_date: "", sort_order: 0, is_active: true,
  pcFile: null as File | null, pcPreview: "",
  mobileFile: null as File | null, mobilePreview: "",
  bg_color: "#1D8A5A",
  text_title: "", text_sub: "", text_cta: "",
  text_cta_color: "#ffffff", text_cta_bg: "#1D8A5A",
});

// ─── Shop Main Banner helpers ─────────────────────────────────────────────────

async function fetchShopMainBanners(): Promise<ShopMainBanner[]> {
  const res = await fetch("/api/admin/shop-main-banners", { headers: authHeaders() });
  if (!res.ok) {
    const r2 = await fetch("/api/shop-main-banners");
    if (!r2.ok) throw new Error("불러오기 실패");
    const d = await r2.json();
    return d.banners || [];
  }
  const data = await res.json();
  return data.banners || [];
}

// ─── ShopMainBannerEditor ─────────────────────────────────────────────────────

function ShopMainBannerEditor() {
  const queryClient = useQueryClient();
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["shop-main-banners"],
    queryFn: fetchShopMainBanners,
  });

  const [editing, setEditing] = useState<ShopMainBanner | null>(null);
  const [draft, setDraft] = useState<Partial<ShopMainBanner>>({});

  const openEdit = (b: ShopMainBanner) => {
    setEditing(b);
    setDraft({ ...b });
  };

  const closEdit = () => { setEditing(null); setDraft({}); };

  const toggleActiveMutation = useMutation({
    mutationFn: async (b: ShopMainBanner) => {
      const res = await fetch(`/api/admin/shop-main-banners/${b.id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "content-type": "application/json" } as any,
        body: JSON.stringify({ ...b, is_active: b.is_active ? 0 : 1 }),
      });
      if (!res.ok) throw new Error("변경 실패");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shop-main-banners"] }),
    onError: () => toast({ title: "노출 설정 변경 실패", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const res = await fetch(`/api/admin/shop-main-banners/${editing.id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "content-type": "application/json" } as any,
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error("저장 실패");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "배너가 수정되었습니다" });
      queryClient.invalidateQueries({ queryKey: ["shop-main-banners"] });
      closEdit();
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const set = (key: keyof ShopMainBanner, val: any) => setDraft(d => ({ ...d, [key]: val }));

  const SLIDE_NAMES = ["1번 슬라이드 (초록)", "2번 슬라이드 (네이비)", "3번 슬라이드 (퍼플)"];
  const SLIDE_ACCENTS = ["#1b6e45", "#1a3a6b", "#7c3aed"];

  if (isLoading) return (
    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        쇼핑몰 메인 페이지 슬라이드 배너의 <strong>텍스트 내용</strong>을 수정합니다. 수정 후 쇼핑몰에 실시간 반영됩니다.
      </p>

      {banners.map((b, idx) => (
        <Card key={b.id} className={`p-0 overflow-hidden ${!b.is_active ? "opacity-60" : ""}`}>
          <div style={{ background: b.bg_gradient, height: 8 }} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-slate-700">{SLIDE_NAMES[idx] ?? `슬라이드 ${idx + 1}`}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: b.badge_color, color: "#000" }}>
                  {b.badge_text || "(뱃지 없음)"}
                </span>
                {b.is_active
                  ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">노출중</span>
                  : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">미노출</span>
                }
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActiveMutation.mutate(b)}
                  disabled={toggleActiveMutation.isPending}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${b.is_active ? "border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500" : "border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100"}`}
                >
                  {b.is_active ? <><EyeOff className="w-3 h-3" /> 미노출</> : <><Eye className="w-3 h-3" /> 노출</>}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> 수정
                </button>
              </div>
            </div>
            <div className="text-slate-800 font-black text-lg leading-tight">{b.title_line1} {b.title_line2}</div>
            <div className="text-slate-500 text-sm mt-1 whitespace-pre-line">{b.sub_text}</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ borderColor: SLIDE_ACCENTS[idx], color: SLIDE_ACCENTS[idx] }}>
                {b.cta_text}
              </span>
              {b.link_url && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />{b.link_url}
                </span>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closEdit}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">슬라이드 텍스트 수정</h2>
                <p className="text-sm text-slate-400 mt-0.5">수정 사항은 쇼핑몰에 즉시 반영됩니다</p>
              </div>
              <button onClick={closEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mx-6 mt-5 rounded-xl overflow-hidden" style={{ background: draft.bg_gradient || editing.bg_gradient }}>
              <div className="p-5 text-white">
                <div className="inline-flex px-3 py-1 rounded-full text-xs font-black mb-2" style={{ background: draft.badge_color || editing.badge_color, color: "#000" }}>
                  {draft.badge_text || editing.badge_text || "뱃지"}
                </div>
                <div className="text-2xl font-black leading-tight">
                  {draft.title_line1 || editing.title_line1}<br />
                  {draft.title_line2 || editing.title_line2}
                </div>
                <div className="text-white/70 text-xs mt-2 whitespace-pre-line">{draft.sub_text || editing.sub_text}</div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: draft.cta_bg || editing.cta_bg, color: draft.cta_color || editing.cta_color }}>
                  {draft.cta_text || editing.cta_text} →
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> 뱃지 텍스트
                </label>
                <input type="text" value={draft.badge_text ?? ""} onChange={e => set("badge_text", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all"
                  placeholder="예: ソウルモノ 단독" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-slate-400" /> 제목 1줄
                </label>
                <input type="text" value={draft.title_line1 ?? ""} onChange={e => set("title_line1", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all"
                  placeholder="예: ソウルモノ만의" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-slate-400" /> 제목 2줄
                </label>
                <input type="text" value={draft.title_line2 ?? ""} onChange={e => set("title_line2", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all"
                  placeholder="예: 특별한 브랜드" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-slate-400" /> 설명 텍스트
                  <span className="text-slate-400 font-normal text-xs">(\n으로 줄바꿈)</span>
                </label>
                <textarea value={draft.sub_text ?? ""} onChange={e => set("sub_text", e.target.value)} rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all resize-none"
                  placeholder="예: 엄선된 프리미엄 식품을 합리적인 가격으로" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-slate-400" /> 버튼 텍스트
                </label>
                <input type="text" value={draft.cta_text ?? ""} onChange={e => set("cta_text", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all"
                  placeholder="예: 브랜드 상품 보기" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" /> 클릭 시 이동 URL
                </label>
                <input type="text" value={draft.link_url ?? ""} onChange={e => set("link_url", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all"
                  placeholder="예: /list?type=3" />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <Button variant="ghost" onClick={closEdit}>취소</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : <><Save className="w-4 h-4 mr-1" />저장</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Image Upload Button ───────────────────────────────────────────────────────

function ImageUploadField({
  label, preview, onFile, onClear, icon: Icon,
}: {
  label: string;
  preview: string;
  onFile: (f: File) => void;
  onClear: () => void;
  icon: any;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
        <Icon className="w-3.5 h-3.5 text-slate-400" /> {label}
      </label>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) { onFile(f); if (ref.current) ref.current.value = ""; } }} />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-slate-200">
          <img src={preview} alt="" className="w-full h-32 object-cover" />
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <button onClick={() => ref.current?.click()}
              className="bg-white/90 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 shadow hover:bg-white">변경</button>
            <button onClick={onClear}
              className="bg-white/90 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 shadow hover:bg-white"><X className="w-3 h-3" /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()}
          className="w-full h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary transition-all">
          <Image className="w-6 h-6" />
          <span className="text-xs font-medium">클릭하여 업로드</span>
        </button>
      )}
    </div>
  );
}

// ─── B2B Banner section (통합: PC+모바일 이미지) ──────────────────────────────

function B2BBannerSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<B2BBanner | null>(null);
  const [form, setForm] = useState(emptyB2BForm());

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["image-banners"],
    queryFn: fetchImageBanners,
  });

  useEffect(() => {
    if (!showForm) { setForm(emptyB2BForm()); setEditing(null); }
  }, [showForm]);

  const openEdit = (banner: B2BBanner) => {
    setEditing(banner);
    setForm({
      banner_type: banner.banner_type || "image",
      title: banner.title, link_url: banner.link_url,
      is_new_window: !!banner.is_new_window,
      start_date: banner.start_date ? banner.start_date.slice(0, 10) : "",
      end_date: banner.end_date ? banner.end_date.slice(0, 10) : "",
      sort_order: banner.sort_order, is_active: !!banner.is_active,
      pcFile: null, pcPreview: banner.pc_image_url || "",
      mobileFile: null, mobilePreview: banner.mobile_image_url || "",
      bg_color: banner.bg_color || "#1D8A5A",
      text_title: banner.text_title || "", text_sub: banner.text_sub || "",
      text_cta: banner.text_cta || "",
      text_cta_color: banner.text_cta_color || "#ffffff",
      text_cta_bg: banner.text_cta_bg || "#1D8A5A",
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("banner_type", form.banner_type);
      fd.append("title", form.title);
      fd.append("link_url", form.link_url);
      fd.append("is_new_window", form.is_new_window ? "1" : "0");
      fd.append("start_date", form.start_date);
      fd.append("end_date", form.end_date);
      fd.append("sort_order", String(form.sort_order));
      fd.append("is_active", form.is_active ? "1" : "0");
      fd.append("bg_color", form.bg_color);
      fd.append("text_title", form.text_title);
      fd.append("text_sub", form.text_sub);
      fd.append("text_cta", form.text_cta);
      fd.append("text_cta_color", form.text_cta_color);
      fd.append("text_cta_bg", form.text_cta_bg);
      if (form.pcFile) fd.append("img_pc", form.pcFile);
      else if (editing?.pc_image_url && form.pcPreview) fd.append("pc_image_url", editing.pc_image_url);
      if (form.mobileFile) fd.append("img_mobile", form.mobileFile);
      else if (editing?.mobile_image_url && form.mobilePreview) fd.append("mobile_image_url", editing.mobile_image_url);

      const url = editing ? `/api/admin/image-banners/${editing.id}` : "/api/admin/image-banners";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: authHeaders() as any, body: fd });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "저장 실패"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: editing ? "수정되었습니다" : "등록되었습니다" });
      queryClient.invalidateQueries({ queryKey: ["image-banners"] });
      setShowForm(false);
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/image-banners/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("삭제 실패");
    },
    onSuccess: () => { toast({ title: "삭제되었습니다" }); queryClient.invalidateQueries({ queryKey: ["image-banners"] }); },
    onError: () => toast({ title: "삭제 실패", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (b: B2BBanner) => {
      const fd = new FormData();
      fd.append("banner_type", b.banner_type || "image");
      fd.append("title", b.title); fd.append("link_url", b.link_url);
      fd.append("is_new_window", String(b.is_new_window));
      fd.append("start_date", b.start_date || ""); fd.append("end_date", b.end_date || "");
      fd.append("sort_order", String(b.sort_order));
      fd.append("is_active", b.is_active ? "0" : "1");
      fd.append("bg_color", b.bg_color || "#1D8A5A");
      fd.append("text_title", b.text_title || ""); fd.append("text_sub", b.text_sub || "");
      fd.append("text_cta", b.text_cta || "");
      fd.append("text_cta_color", b.text_cta_color || "#ffffff");
      fd.append("text_cta_bg", b.text_cta_bg || "#1D8A5A");
      if (b.pc_image_url) fd.append("pc_image_url", b.pc_image_url);
      if (b.mobile_image_url) fd.append("mobile_image_url", b.mobile_image_url);
      await fetch(`/api/admin/image-banners/${b.id}`, { method: "PUT", headers: authHeaders() as any, body: fd });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["image-banners"] }),
  });

  const isExpired = (b: B2BBanner) => !!b.end_date && new Date(b.end_date) < new Date(new Date().toDateString());
  const isScheduled = (b: B2BBanner) => !!b.start_date && new Date(b.start_date) > new Date();

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex-1 mr-4">
          배너 하나에 <strong>PC 이미지</strong>와 <strong>모바일 이미지</strong>를 각각 등록합니다. 화면 크기에 따라 자동으로 전환됩니다.
        </p>
        <Button onClick={() => { setShowForm(true); setEditing(null); }}>
          <Plus className="w-4 h-4 mr-1" /> 배너 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : banners.length === 0 ? (
        <Card className="py-16 text-center">
          <Image className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">등록된 배너가 없습니다.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map(banner => {
            const expired = isExpired(banner);
            const scheduled = isScheduled(banner);
            return (
              <Card key={banner.id} className={`p-4 ${!banner.is_active ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-4">
                  {/* 썸네일: 이미지형 vs 문구형 */}
                  {(banner.banner_type || "image") === "image" ? (
                    <div className="flex gap-2 shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100" style={{ height: 56 }}>
                          {banner.pc_image_url ? (
                            <img src={banner.pc_image_url} alt="PC" className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Monitor className="w-5 h-5" /></div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">PC</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100" style={{ height: 56 }}>
                          {banner.mobile_image_url ? (
                            <img src={banner.mobile_image_url} alt="모바일" className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Smartphone className="w-4 h-4" /></div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">모바일</span>
                      </div>
                    </div>
                  ) : (
                    <div className="shrink-0">
                      <div className="w-36 rounded-xl overflow-hidden border border-slate-200" style={{ height: 56, background: banner.bg_color || "#1D8A5A" }}>
                        <div className="p-2 h-full flex flex-col justify-between">
                          <p className="text-white font-black text-xs leading-tight line-clamp-2">{banner.text_title || "(문구 없음)"}</p>
                          {banner.text_cta && (
                            <span className="self-start text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: banner.text_cta_bg || "#fff", color: banner.text_cta_color || "#1D8A5A" }}>
                              {banner.text_cta}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium mt-1 block text-center">문구형</span>
                    </div>
                  )}

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-slate-900 truncate">{banner.title || "(제목 없음)"}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(banner.banner_type || "image") === "text" ? "bg-violet-50 text-violet-600" : "bg-sky-50 text-sky-600"}`}>
                        {(banner.banner_type || "image") === "text" ? "문구형" : "이미지형"}
                      </span>
                      {!banner.is_active && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">미노출</span>}
                      {banner.is_active && expired && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-500">기간만료</span>}
                      {banner.is_active && scheduled && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-500">예정</span>}
                      {banner.is_active && !expired && !scheduled && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">노출중</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {banner.link_url && <span className="flex items-center gap-1"><Link2 className="w-3 h-3" />{banner.link_url}</span>}
                      {(banner.start_date || banner.end_date) && (
                        <span>{banner.start_date ? format(new Date(banner.start_date), "yyyy.MM.dd") : "∞"} ~ {banner.end_date ? format(new Date(banner.end_date), "yyyy.MM.dd") : "∞"}</span>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleMutation.mutate(banner)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${banner.is_active ? "border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500" : "border-emerald-200 text-emerald-600 bg-emerald-50"}`}>
                      {banner.is_active ? "비활성화" : "활성화"}
                    </button>
                    <button onClick={() => openEdit(banner)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate(banner.id); }} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">{editing ? "배너 수정" : "배너 추가"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* 배너 타입 선택 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">배너 형태</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "image", icon: ImageIcon, label: "이미지형", desc: "PC/모바일 이미지 업로드" },
                    { val: "text",  icon: Type,      label: "문구형",   desc: "텍스트·배경색 설정" },
                  ].map(({ val, icon: Icon, label, desc }) => (
                    <button key={val} type="button"
                      onClick={() => setForm(p => ({ ...p, banner_type: val as "image" | "text" }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${form.banner_type === val ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}>
                      <div className={`p-2 rounded-lg ${form.banner_type === val ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${form.banner_type === val ? "text-primary" : "text-slate-700"}`}>{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 이미지형 필드 */}
              {form.banner_type === "image" && (
                <div className="grid grid-cols-2 gap-4">
                  <ImageUploadField
                    label="PC 이미지"
                    preview={form.pcPreview}
                    icon={Monitor}
                    onFile={f => setForm(p => ({ ...p, pcFile: f, pcPreview: URL.createObjectURL(f) }))}
                    onClear={() => setForm(p => ({ ...p, pcFile: null, pcPreview: "" }))}
                  />
                  <ImageUploadField
                    label="모바일 이미지"
                    preview={form.mobilePreview}
                    icon={Smartphone}
                    onFile={f => setForm(p => ({ ...p, mobileFile: f, mobilePreview: URL.createObjectURL(f) }))}
                    onClear={() => setForm(p => ({ ...p, mobileFile: null, mobilePreview: "" }))}
                  />
                </div>
              )}

              {/* 문구형 필드 */}
              {form.banner_type === "text" && (
                <div className="space-y-4">
                  {/* 미리보기 */}
                  <div className="rounded-xl overflow-hidden border border-slate-200" style={{ background: form.bg_color, minHeight: 80 }}>
                    <div className="p-4 flex flex-col gap-2">
                      <p className="text-white font-black text-lg leading-tight">{form.text_title || "제목을 입력하세요"}</p>
                      <p className="text-white/70 text-sm whitespace-pre-line">{form.text_sub}</p>
                      {form.text_cta && (
                        <span className="self-start text-xs font-bold px-3 py-1.5 rounded-full mt-1"
                          style={{ background: form.text_cta_bg, color: form.text_cta_color }}>
                          {form.text_cta} →
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">배경 색상</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={form.bg_color} onChange={e => setForm(p => ({ ...p, bg_color: e.target.value }))}
                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                      <input type="text" value={form.bg_color} onChange={e => setForm(p => ({ ...p, bg_color: e.target.value }))}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none" placeholder="#1D8A5A" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">제목 문구</label>
                    <input type="text" value={form.text_title} onChange={e => setForm(p => ({ ...p, text_title: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none" placeholder="예: ソウルモノ만의 특별한 브랜드" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">부제 문구 <span className="text-slate-400 font-normal text-xs">(\n으로 줄바꿈)</span></label>
                    <textarea value={form.text_sub} onChange={e => setForm(p => ({ ...p, text_sub: e.target.value }))} rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none resize-none" placeholder="예: 엄선된 프리미엄 식품을&#10;합리적인 가격으로" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">버튼 문구</label>
                    <input type="text" value={form.text_cta} onChange={e => setForm(p => ({ ...p, text_cta: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none" placeholder="예: 브랜드 상품 보기" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">버튼 배경색</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.text_cta_bg} onChange={e => setForm(p => ({ ...p, text_cta_bg: e.target.value }))}
                          className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 shrink-0" />
                        <input type="text" value={form.text_cta_bg} onChange={e => setForm(p => ({ ...p, text_cta_bg: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:border-primary outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">버튼 글자색</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.text_cta_color} onChange={e => setForm(p => ({ ...p, text_cta_color: e.target.value }))}
                          className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 shrink-0" />
                        <input type="text" value={form.text_cta_color} onChange={e => setForm(p => ({ ...p, text_cta_color: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:border-primary outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">제목 (관리용)</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">링크 URL</label>
                <input type="text" value={form.link_url} onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all" placeholder="https://..." />
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_new_window} onChange={e => setForm(p => ({ ...p, is_new_window: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm text-slate-600 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> 새 창으로 열기</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">시작일</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">종료일</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">순서</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} min={0}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all" />
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => setForm(p => ({ ...p, sort_order: p.sort_order + 1 }))} className="p-0.5 hover:bg-slate-100 rounded"><ChevronUp className="w-3 h-3" /></button>
                      <button onClick={() => setForm(p => ({ ...p, sort_order: Math.max(0, p.sort_order - 1) }))} className="p-0.5 hover:bg-slate-100 rounded"><ChevronDown className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-1">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm font-semibold text-slate-700">노출 활성화</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <Button variant="ghost" onClick={() => setShowForm(false)}>취소</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : editing ? "수정 완료" : "등록"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shop Promo Banners (쇼핑몰 서브배너) ──────────────────────────────────────

interface PromoBanner {
  id: number;
  slot: string;
  slot_name: string;
  image_url: string;
  link_url: string;
  is_active: number;
}

function ShopPromoBannerSection() {
  const queryClient = useQueryClient();
  const uploadRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: banners = [], isLoading } = useQuery<PromoBanner[]>({
    queryKey: ["shop-promo-banners"],
    queryFn: async () => {
      const res = await fetch("/api/shop-admin/promo-banners", { headers: authHeaders() });
      if (!res.ok) throw new Error("불러오기 실패");
      const d = await res.json();
      return d.banners || [];
    },
  });

  const [forms, setForms] = useState<Record<string, { image_url: string; link_url: string; is_active: boolean; preview: string }>>({});

  useEffect(() => {
    if (banners.length > 0) {
      const init: typeof forms = {};
      for (const b of banners) {
        init[b.slot] = {
          image_url: b.image_url || "",
          link_url: b.link_url || "",
          is_active: !!b.is_active,
          preview: b.image_url || "",
        };
      }
      setForms(init);
    }
  }, [banners]);

  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleImageFile = async (slot: string, file: File) => {
    setUploading(u => ({ ...u, [slot]: true }));
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/shop-admin/promo-banners/upload", {
        method: "POST",
        headers: authHeaders() as any,
        body: fd,
      });
      if (!res.ok) throw new Error("업로드 실패");
      const { image_url } = await res.json();
      setForms(f => ({
        ...f,
        [slot]: { ...f[slot], image_url, preview: image_url },
      }));
      toast({ title: "이미지가 업로드되었습니다" });
    } catch {
      toast({ title: "이미지 업로드 실패", variant: "destructive" });
    }
    setUploading(u => ({ ...u, [slot]: false }));
  };

  const handleSave = async (slot: string) => {
    const form = forms[slot];
    if (!form) return;
    setSaving(s => ({ ...s, [slot]: true }));
    try {
      const res = await fetch(`/api/shop-admin/promo-banners/${slot}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" } as any,
        body: JSON.stringify({ image_url: form.image_url, link_url: form.link_url, is_active: form.is_active ? 1 : 0 }),
      });
      if (!res.ok) throw new Error("저장 실패");
      queryClient.invalidateQueries({ queryKey: ["shop-promo-banners"] });
      toast({ title: "저장되었습니다" });
    } catch {
      toast({ title: "저장 실패", variant: "destructive" });
    }
    setSaving(s => ({ ...s, [slot]: false }));
  };

  const SLOT_COLORS: Record<string, string> = {
    bnr01: "bg-yellow-50 border-yellow-200",
    bnr02: "bg-blue-50 border-blue-200",
    bnr03: "bg-emerald-50 border-emerald-200",
  };

  if (isLoading) return <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div>
      <p className="text-sm text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
        쇼핑몰 홈 화면의 <strong>서브 배너 3개</strong>를 이미지로 교체합니다. 이미지를 올리고 저장하면 쇼핑몰에 즉시 반영됩니다.
      </p>
      <div className="space-y-4">
        {banners.map(b => {
          const f = forms[b.slot];
          if (!f) return null;
          const isUp = uploading[b.slot];
          const isSav = saving[b.slot];
          return (
            <Card key={b.slot} className={`p-0 overflow-hidden border-2 ${SLOT_COLORS[b.slot] || ""}`}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-slate-800">{b.slot_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">슬롯: {b.slot}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForms(prev => ({ ...prev, [b.slot]: { ...prev[b.slot], is_active: !prev[b.slot]?.is_active } }))}
                    className="flex items-center gap-1.5 text-sm font-semibold"
                  >
                    {f.is_active
                      ? <><ToggleRight className="w-7 h-7 text-emerald-500" /><span className="text-emerald-600">노출</span></>
                      : <><ToggleLeft className="w-7 h-7 text-slate-300" /><span className="text-slate-400">미노출</span></>}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 이미지 업로드 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">배너 이미지</label>
                    <input
                      ref={el => { uploadRefs.current[b.slot] = el; }}
                      type="file" accept="image/*" className="hidden"
                      onChange={e => { const file = e.target.files?.[0]; if (file) handleImageFile(b.slot, file); if (e.target) e.target.value = ""; }}
                    />
                    {f.preview ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-slate-200">
                        <img src={f.preview} alt="" className="w-full h-36 object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <button
                            onClick={() => uploadRefs.current[b.slot]?.click()}
                            disabled={isUp}
                            className="bg-white/90 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-white"
                          >
                            {isUp ? <Loader2 className="w-3 h-3 animate-spin" /> : "변경"}
                          </button>
                          <button
                            onClick={() => setForms(prev => ({ ...prev, [b.slot]: { ...prev[b.slot], image_url: "", preview: "" } }))}
                            className="bg-white/90 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 shadow hover:bg-white"
                          ><X className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => uploadRefs.current[b.slot]?.click()}
                        disabled={isUp}
                        className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary transition-all"
                      >
                        {isUp ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Image className="w-6 h-6" /><span className="text-xs font-medium">클릭하여 이미지 업로드</span></>}
                      </button>
                    )}
                    <p className="text-xs text-slate-400 mt-1">권장: JPG/PNG, 최대 15MB</p>
                  </div>

                  {/* 링크 URL */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">클릭 시 이동 URL</label>
                      <input
                        type="text"
                        value={f.link_url}
                        onChange={e => setForms(prev => ({ ...prev, [b.slot]: { ...prev[b.slot], link_url: e.target.value } }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all"
                        placeholder="예: /list?type=4"
                      />
                      <p className="text-xs text-slate-400 mt-1">비워두면 링크 없이 이미지만 표시됩니다.</p>
                    </div>
                    <div className="mt-4">
                      <Button
                        onClick={() => handleSave(b.slot)}
                        disabled={isSav}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        {isSav ? <><Loader2 className="w-4 h-4 animate-spin" />저장 중...</> : <><Save className="w-4 h-4" />저장하기</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

// ─── App Banner Section (PC/Mobile/App 이미지 배너) ──────────────────────────

interface AppBanner {
  id: number;
  title: string;
  pc_img: string;
  mo_img: string;
  app_img: string;
  link_url: string;
  sort_order: number;
  is_active: number;
}

const emptyAppForm = () => ({
  title: "",
  link_url: "",
  sort_order: 0,
  is_active: true,
  pcFile: null as File | null,
  pcPreview: "",
  moFile: null as File | null,
  moPreview: "",
  appFile: null as File | null,
  appPreview: "",
});

async function uploadBannerImage(file: File): Promise<string> {
  const token = localStorage.getItem("token");
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("/api/shop-admin/banners/upload", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) throw new Error("이미지 업로드 실패");
  const data = await res.json();
  return data.image_url as string;
}

function AppBannerSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AppBanner | null>(null);
  const [form, setForm] = useState(emptyAppForm());
  const [imgTab, setImgTab] = useState<"pc" | "mo" | "app">("app");

  const { data: banners = [], isLoading } = useQuery<AppBanner[]>({
    queryKey: ["app-banners"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/shop-admin/banners", {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("불러오기 실패");
      const d = await res.json();
      return d.banners || [];
    },
  });

  useEffect(() => {
    if (!showForm) { setForm(emptyAppForm()); setEditing(null); setImgTab("app"); }
  }, [showForm]);

  const openEdit = (b: AppBanner) => {
    setEditing(b);
    setForm({
      title: b.title, link_url: b.link_url,
      sort_order: b.sort_order, is_active: !!b.is_active,
      pcFile: null, pcPreview: b.pc_img || "",
      moFile: null, moPreview: b.mo_img || "",
      appFile: null, appPreview: b.app_img || "",
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const headers: any = token ? { authorization: `Bearer ${token}`, "content-type": "application/json" } : { "content-type": "application/json" };

      let pc_img = form.pcPreview && !form.pcFile ? (editing?.pc_img || form.pcPreview) : "";
      let mo_img = form.moPreview && !form.moFile ? (editing?.mo_img || form.moPreview) : "";
      let app_img = form.appPreview && !form.appFile ? (editing?.app_img || form.appPreview) : "";

      if (form.pcFile) pc_img = await uploadBannerImage(form.pcFile);
      if (form.moFile) mo_img = await uploadBannerImage(form.moFile);
      if (form.appFile) app_img = await uploadBannerImage(form.appFile);

      const body = {
        title: form.title, link_url: form.link_url,
        sort_order: form.sort_order, is_active: form.is_active ? 1 : 0,
        pc_img, mo_img, app_img,
        image_url: app_img || pc_img || mo_img,
      };

      const url = editing ? `/api/shop-admin/banners/${editing.id}` : "/api/shop-admin/banners";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "저장 실패"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: editing ? "수정되었습니다" : "등록되었습니다" });
      queryClient.invalidateQueries({ queryKey: ["app-banners"] });
      setShowForm(false);
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/shop-admin/banners/${id}`, {
        method: "DELETE",
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("삭제 실패");
    },
    onSuccess: () => { toast({ title: "삭제되었습니다" }); queryClient.invalidateQueries({ queryKey: ["app-banners"] }); },
    onError: () => toast({ title: "삭제 실패", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (b: AppBanner) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/shop-admin/banners/${b.id}`, {
        method: "PUT",
        headers: token ? { authorization: `Bearer ${token}`, "content-type": "application/json" } : { "content-type": "application/json" } as any,
        body: JSON.stringify({ ...b, is_active: b.is_active ? 0 : 1, image_url: b.app_img || b.pc_img || "" }),
      });
      if (!res.ok) throw new Error("변경 실패");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["app-banners"] }),
    onError: () => toast({ title: "변경 실패", variant: "destructive" }),
  });

  const IMG_TABS = [
    { key: "pc" as const, label: "PC", icon: Monitor },
    { key: "mo" as const, label: "모바일", icon: Smartphone },
    { key: "app" as const, label: "앱", icon: LayoutGrid },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex-1 mr-4">
          배너마다 <strong>PC / 모바일 / 앱</strong> 이미지를 각각 등록합니다. 앱 배너는 앱 홈 화면 상단 슬라이드에 표시됩니다.
        </p>
        <Button onClick={() => { setShowForm(true); setEditing(null); }}>
          <Plus className="w-4 h-4 mr-1" /> 배너 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : banners.length === 0 ? (
        <Card className="py-16 text-center">
          <Image className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">등록된 배너가 없습니다.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm text-primary font-semibold hover:underline">첫 배너 추가하기</button>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <Card key={b.id} className={`p-4 ${!b.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-4">
                {/* 미리보기 썸네일 - 3개 */}
                <div className="flex gap-2 shrink-0">
                  {[
                    { label: "PC", src: b.pc_img, icon: Monitor },
                    { label: "모바일", src: b.mo_img, icon: Smartphone },
                    { label: "앱", src: b.app_img, icon: LayoutGrid },
                  ].map(({ label, src, icon: Icon }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                        {src ? (
                          <img src={src} alt={label} className="w-full h-full object-cover" />
                        ) : (
                          <Icon className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm">{b.title || "(제목 없음)"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                      {b.is_active ? "노출중" : "미노출"}
                    </span>
                  </div>
                  {b.link_url && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-1">
                      <ExternalLink className="w-3 h-3 shrink-0" />{b.link_url}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">순서: {b.sort_order}</p>
                </div>

                {/* 액션 */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleMutation.mutate(b)} disabled={toggleMutation.isPending}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${b.is_active ? "border-slate-200 text-slate-500 hover:text-red-500" : "border-emerald-200 text-emerald-600 bg-emerald-50"}`}>
                    {b.is_active ? <><EyeOff className="w-3 h-3 inline mr-1" />미노출</> : <><Eye className="w-3 h-3 inline mr-1" />노출</>}
                  </button>
                  <button onClick={() => openEdit(b)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 font-semibold transition-colors">
                    <Pencil className="w-3 h-3 inline mr-1" />수정
                  </button>
                  <button onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate(b.id); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-500 font-semibold transition-colors">
                    <Trash2 className="w-3 h-3 inline" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">{editing ? "배너 수정" : "배너 추가"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* 이미지 탭 (PC / 모바일 / 앱) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">이미지 업로드</label>
                <div className="flex gap-1 mb-3 bg-slate-100 rounded-xl p-1 w-fit">
                  {IMG_TABS.map(t => {
                    const Icon = t.icon;
                    const hasImg = t.key === "pc" ? !!form.pcPreview : t.key === "mo" ? !!form.moPreview : !!form.appPreview;
                    return (
                      <button key={t.key} type="button" onClick={() => setImgTab(t.key)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${imgTab === t.key ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                        {hasImg && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
                {imgTab === "pc" && (
                  <ImageUploadField label="PC 이미지 (권장: 1920×500)" preview={form.pcPreview} icon={Monitor}
                    onFile={f => setForm(p => ({ ...p, pcFile: f, pcPreview: URL.createObjectURL(f) }))}
                    onClear={() => setForm(p => ({ ...p, pcFile: null, pcPreview: "" }))} />
                )}
                {imgTab === "mo" && (
                  <ImageUploadField label="모바일 이미지 (권장: 768×300)" preview={form.moPreview} icon={Smartphone}
                    onFile={f => setForm(p => ({ ...p, moFile: f, moPreview: URL.createObjectURL(f) }))}
                    onClear={() => setForm(p => ({ ...p, moFile: null, moPreview: "" }))} />
                )}
                {imgTab === "app" && (
                  <ImageUploadField label="앱 이미지 (권장: 750×400)" preview={form.appPreview} icon={LayoutGrid}
                    onFile={f => setForm(p => ({ ...p, appFile: f, appPreview: URL.createObjectURL(f) }))}
                    onClear={() => setForm(p => ({ ...p, appFile: null, appPreview: "" }))} />
                )}
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">배너 제목 (관리용)</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all"
                  placeholder="예: 5월 프로모션 배너" />
              </div>

              {/* 링크 URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">클릭 시 이동 URL <span className="text-slate-400 font-normal">(선택)</span></label>
                <input type="text" value={form.link_url} onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none transition-all"
                  placeholder="예: /list?type=3" />
              </div>

              {/* 순서 + 노출 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">노출 순서</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-primary outline-none" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">노출 여부</label>
                  <button type="button" onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all w-full ${form.is_active ? "border-emerald-300 text-emerald-600 bg-emerald-50" : "border-slate-200 text-slate-500"}`}>
                    {form.is_active ? <><ToggleRight className="w-4 h-4" />노출중</> : <><ToggleLeft className="w-4 h-4" />미노출</>}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <Button variant="ghost" onClick={() => setShowForm(false)}>취소</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : <><Save className="w-4 h-4 mr-1" />저장</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type MainTab = "main" | "promo" | "banners" | "app";

export default function AdminBanners() {
  const [mainTab, setMainTab] = useState<MainTab>("app");

  const TABS: { key: MainTab; label: string; icon: any }[] = [
    { key: "app",     label: "앱 배너",      icon: LayoutGrid },
    { key: "main",    label: "쇼핑몰 메인",  icon: LayoutGrid },
    { key: "promo",   label: "쇼핑몰 배너",  icon: ImageIcon },
    { key: "banners", label: "B2B 배너",     icon: Image },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">배너관리</h1>
        <p className="text-slate-500 mt-2 font-medium">앱·쇼핑몰 배너를 관리합니다.</p>
      </div>

      {/* Top tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setMainTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mainTab === t.key ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {mainTab === "app"     && <AppBannerSection />}
      {mainTab === "main"    && <ShopMainBannerEditor />}
      {mainTab === "promo"   && <ShopPromoBannerSection />}
      {mainTab === "banners" && <B2BBannerSection />}
    </div>
  );
}
