import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Package, Gift, Users, ShoppingBag, Star,
  Image, Tag, Award, Zap, Sparkles, TrendingDown, Lock,
  ChevronDown, ChevronRight, Menu, X, Plus, Trash2, Edit2,
  Check, Eye, EyeOff, Settings, BadgePercent, BadgeDollarSign,
  ExternalLink, Share2, FileText,
} from "lucide-react";
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_MAP, type NoticeData, parseNotice } from "@/lib/itemNotice";

const IMG_BASE = "https://thegaongill17.mycafe24.com/data/item/";
const fmtPrice = (n: number) => (n || 0).toLocaleString("ko-KR") + "원";
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString("ko-KR") : "-";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShopItem {
  it_id: string; it_name: string; it_price: number;
  it_cust_price: number; it_img1: string; ca_id?: string;
}

interface Banner {
  id: number; image_url: string; pc_img: string; mo_img: string; link_url: string;
  title: string; subtitle: string; sort_order: number; is_active: number;
}

interface Member {
  mb_id: string; mb_name: string; mb_email: string; mb_hp: string;
  mb_level: number; mb_datetime: string; company_name: string;
  business_number: string; representative: string;
}

interface Order {
  od_id: string; mb_id: string; mb_name: string; company_name: string;
  od_name: string; od_hp: string; od_status: string; od_receipt_price: number; od_time: string;
}

interface Review {
  id: number; it_id: string; it_name: string; mb_id: string;
  author: string; rating: number; content: string; is_visible: number; created_at: string;
}

// ─── Menu config ─────────────────────────────────────────────────────────────

type Page =
  | "shop-main-slider" | "shop-banners" | "shop-categories" | "shop-best" | "shop-sale"
  | "shop-diygift" | "shop-new" | "shop-lowest" | "shop-exclusive"
  | "shop-first-purchase" | "shop-groupbuy" | "shop-todaydeal"
  | "events"
  | "products" | "gift-packages" | "gift-categories" | "gift-products"
  | "pending" | "members" | "orders" | "reviews"
  | "settings" | "footer";

interface MenuItem { id: Page; label: string; icon: React.ReactNode }
interface MenuGroup { label: string; icon: React.ReactNode; items: MenuItem[] }

const MENU: MenuGroup[] = [
  {
    label: "메인SHOP관리", icon: <LayoutDashboard size={15} />,
    items: [
      { id: "shop-main-slider", label: "상단배너관리", icon: <Image size={13} /> },
      { id: "shop-banners", label: "메인배너관리", icon: <Image size={13} /> },
      { id: "shop-categories", label: "상품카테고리", icon: <Tag size={13} /> },
      { id: "shop-best", label: "베스트 상품", icon: <Award size={13} /> },
      { id: "shop-sale", label: "오늘의특가/타임세일", icon: <Zap size={13} /> },
      { id: "shop-first-purchase", label: "첫구매100원 상품", icon: <BadgePercent size={13} /> },
      { id: "shop-diygift", label: "내가만드는 선물", icon: <Gift size={13} /> },
      { id: "shop-new", label: "신상품", icon: <Sparkles size={13} /> },
      { id: "shop-lowest", label: "최저가도전", icon: <TrendingDown size={13} /> },
      { id: "shop-exclusive", label: "오직상회에만", icon: <Lock size={13} /> },
      { id: "shop-groupbuy", label: "공동구매 상품", icon: <Users size={13} /> },
      { id: "shop-todaydeal", label: "SNS 구매 상품", icon: <Share2 size={13} /> },
    ],
  },
  {
    label: "게시판관리", icon: <Tag size={15} />,
    items: [
      { id: "events", label: "이벤트 목록", icon: <Tag size={13} /> },
      { id: "cs-board", label: "고객센터 안내", icon: <Tag size={13} /> },
    ],
  },
  {
    label: "상품관리", icon: <Package size={15} />,
    items: [{ id: "products", label: "상품 목록", icon: <Package size={13} /> }],
  },
  {
    label: "선물하기관리", icon: <Gift size={15} />,
    items: [
      { id: "gift-packages", label: "선물패키지관리", icon: <Package size={13} /> },
      { id: "gift-categories", label: "선물분류관리", icon: <Tag size={13} /> },
      { id: "gift-products", label: "선물상품관리", icon: <Gift size={13} /> },
    ],
  },
  {
    label: "회원관리", icon: <Users size={15} />,
    items: [
      { id: "pending", label: "승인 대기", icon: <Users size={13} /> },
      { id: "members", label: "전체 회원", icon: <Users size={13} /> },
    ],
  },
  {
    label: "주문관리", icon: <ShoppingBag size={15} />,
    items: [{ id: "orders", label: "주문 목록", icon: <ShoppingBag size={13} /> }],
  },
  {
    label: "리뷰관리", icon: <Star size={15} />,
    items: [{ id: "reviews", label: "리뷰 목록", icon: <Star size={13} /> }],
  },
  {
    label: "기본설정", icon: <Settings size={15} />,
    items: [
      { id: "settings", label: "쇼핑몰 기본설정", icon: <Settings size={13} /> },
      { id: "footer", label: "사업자/푸터 정보", icon: <Settings size={13} /> },
    ],
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "주문접수": { label: "주문접수", color: "#f59e0b" },
  "입금확인": { label: "입금확인", color: "#3b82f6" },
  "처리중": { label: "처리중", color: "#8b5cf6" },
  "배송준비": { label: "배송준비", color: "#6366f1" },
  "배송중": { label: "배송중", color: "#10b981" },
  "배송완료": { label: "배송완료", color: "#8B5E3C" },
  "취소": { label: "취소", color: "#ef4444" },
};

// ─── Reusable: Section Product Manager ───────────────────────────────────────

function SectionManager({
  sectionType, title, authHeaders, toast, shopPath,
}: {
  sectionType: string;
  title: string;
  authHeaders: () => Record<string, string>;
  toast: (msg: string, type?: "ok" | "err") => void;
  shopPath?: string;
}) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<ShopItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shop-admin/sections/${sectionType}`, { headers: authHeaders() });
      const data = await res.json();
      setItems(data.items || []);
    } catch { toast("불러오기 실패", "err"); }
    finally { setLoading(false); }
  }, [sectionType]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (q: string) => {
    setSearchQ(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/shop-admin/sections/${sectionType}/search`, {
          method: "POST", headers: authHeaders(), body: JSON.stringify({ q }),
        });
        const data = await res.json();
        setSearchResults(data.items || []);
      } finally { setSearching(false); }
    }, 350);
  };

  const addItem = async (item: ShopItem) => {
    setActionId("add_" + item.it_id);
    try {
      const res = await fetch(`/api/shop-admin/sections/${sectionType}/${item.it_id}`, {
        method: "POST", headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setItems(prev => [...prev, item]);
      setSearchResults(prev => prev.filter(i => i.it_id !== item.it_id));
      toast(`"${item.it_name}" 추가 완료`);
    } catch { toast("추가 실패", "err"); }
    finally { setActionId(null); }
  };

  const removeItem = async (it_id: string) => {
    setActionId("rm_" + it_id);
    try {
      const res = await fetch(`/api/shop-admin/sections/${sectionType}/${it_id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.it_id !== it_id));
      toast("제거 완료");
    } catch { toast("제거 실패", "err"); }
    finally { setActionId(null); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#222" }}>{title}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#888" }}>메인 페이지에 노출되는 {title} 상품을 관리합니다</p>
        </div>
        {shopPath && (
          <a
            href={shopPath}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: "#8B5E3C", color: "#fff", textDecoration: "none",
              boxShadow: "0 2px 8px rgba(29,138,90,0.2)", flexShrink: 0,
            }}
          >
            <ExternalLink size={14} />
            쇼핑몰에서 확인
          </a>
        )}
      </div>

      {/* Search & Add */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#333", margin: "0 0 12px" }}>상품 검색 및 추가</h3>
        <input
          value={searchQ}
          onChange={e => handleSearch(e.target.value)}
          placeholder="상품명 검색..."
          style={inputStyle}
        />
        {searching && <p style={{ fontSize: 13, color: "#aaa", margin: "8px 0 0" }}>검색 중...</p>}
        {searchResults.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {searchResults.map(item => (
              <ItemRow key={item.it_id} item={item}
                action={<Btn onClick={() => addItem(item)} disabled={actionId === "add_" + item.it_id} color="#8B5E3C">추가</Btn>}
              />
            ))}
          </div>
        )}
        {searchQ && !searching && searchResults.length === 0 && (
          <p style={{ fontSize: 13, color: "#aaa", margin: "8px 0 0" }}>검색 결과가 없거나 이미 추가된 상품입니다.</p>
        )}
      </Card>

      {/* Current Items */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#333", margin: "0 0 12px" }}>
          현재 {title} 상품 <span style={{ color: "#8B5E3C" }}>({items.length}개)</span>
        </h3>
        {loading && <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>불러오는 중...</p>}
        {!loading && items.length === 0 && (
          <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>등록된 상품이 없습니다</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map(item => (
            <ItemRow key={item.it_id} item={item}
              action={
                <Btn onClick={() => removeItem(item.it_id)} disabled={actionId === "rm_" + item.it_id} color="#ef4444">
                  <Trash2 size={13} />
                </Btn>
              }
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Banner Manager ───────────────────────────────────────────────────────────

function BannerManager({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/shop-admin/banners", { headers: authHeaders() });
      setBanners((await r.json()).banners || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.pc_img) { toast("PC 이미지를 업로드해주세요", "err"); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const url = isNew ? "/api/shop-admin/banners" : `/api/shop-admin/banners/${editing.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: authHeaders(),
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error();
      toast(isNew ? "배너 추가 완료" : "배너 수정 완료");
      setEditing(null);
      await load();
    } catch { toast("저장 실패", "err"); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("배너를 삭제하시겠습니까?")) return;
    await fetch(`/api/shop-admin/banners/${id}`, { method: "DELETE", headers: authHeaders() });
    setBanners(prev => prev.filter(b => b.id !== id));
    toast("삭제 완료");
  };

  const toggleActive = async (banner: Banner) => {
    await fetch(`/api/shop-admin/banners/${banner.id}`, {
      method: "PUT", headers: authHeaders(),
      body: JSON.stringify({ ...banner, is_active: banner.is_active ? 0 : 1 }),
    });
    setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: b.is_active ? 0 : 1 } : b));
  };

  return (
    <div>
      <PageHeader title="메인배너관리" sub="메인 페이지 상단에 표시되는 슬라이드 배너를 관리합니다" />

      {/* Form */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#333", margin: 0 }}>
            {editing ? (editing.id ? "배너 수정" : "새 배너 추가") : "배너 목록"}
          </h3>
          {!editing && (
            <Btn onClick={() => setEditing({ image_url: "", pc_img: "", mo_img: "", link_url: "", title: "", subtitle: "", sort_order: 0, is_active: 1 })} color="#8B5E3C">
              <Plus size={13} /> 배너 추가
            </Btn>
          )}
        </div>

        {editing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ImageBannerUpload label="PC 이미지" value={editing.pc_img || ""} onChange={url => setEditing(e => ({ ...e, pc_img: url }))} authHeaders={authHeaders} />
            <ImageBannerUpload label="Mobile 이미지" value={editing.mo_img || ""} onChange={url => setEditing(e => ({ ...e, mo_img: url }))} authHeaders={authHeaders} />
            <FormField label="링크 URL" value={editing.link_url || ""} onChange={v => setEditing(e => ({ ...e, link_url: v }))} placeholder="/list?ca_id=..." />
            <FormField label="제목" value={editing.title || ""} onChange={v => setEditing(e => ({ ...e, title: v }))} placeholder="배너 제목" />
            <FormField label="부제목" value={editing.subtitle || ""} onChange={v => setEditing(e => ({ ...e, subtitle: v }))} placeholder="배너 설명" />
            <FormField label="정렬 순서" value={String(editing.sort_order ?? 0)} onChange={v => setEditing(e => ({ ...e, sort_order: Number(v) }))} type="number" />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={save} disabled={saving} color="#8B5E3C">{saving ? "저장 중..." : "저장"}</Btn>
              <Btn onClick={() => setEditing(null)} color="#888">취소</Btn>
            </div>
          </div>
        )}
      </Card>

      {/* Banner List */}
      {loading ? <p style={{ textAlign: "center", color: "#aaa" }}>불러오는 중...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {banners.length === 0 && <p style={{ textAlign: "center", color: "#aaa" }}>등록된 배너가 없습니다</p>}
          {banners.map(b => (
            <Card key={b.id}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {b.image_url && (
                  <img src={b.image_url} alt={b.title} style={{ width: 120, height: 60, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#222", margin: "0 0 2px" }}>{b.title || "(제목 없음)"}</p>
                  {b.subtitle && <p style={{ fontSize: 12, color: "#888", margin: "0 0 4px" }}>{b.subtitle}</p>}
                  {b.link_url && <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>{b.link_url}</p>}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                  <button
                    onClick={() => toggleActive(b)}
                    title={b.is_active ? "비활성화" : "활성화"}
                    style={{ background: b.is_active ? "#e8f9f0" : "#f5f5f5", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: b.is_active ? "#8B5E3C" : "#aaa" }}
                  >
                    {b.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <Btn onClick={() => setEditing(b)} color="#6366f1"><Edit2 size={13} /></Btn>
                  <Btn onClick={() => remove(b.id)} color="#ef4444"><Trash2 size={13} /></Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Image Banner Manager (상단배너관리) ──────────────────────────────────────

interface ImageBanner {
  id: number;
  title: string;
  pc_image_url: string;
  mobile_image_url: string;
  link_url: string;
  start_date: string;
  end_date: string;
  sort_order: number;
  is_active: number;
}

const EMPTY_BANNER: Omit<ImageBanner, "id"> = {
  title: "", pc_image_url: "", mobile_image_url: "",
  link_url: "", start_date: "", end_date: "",
  sort_order: 0, is_active: 1,
};

function ImageBannerUpload({ label, value, onChange, authHeaders }: {
  label: string; value: string; onChange: (url: string) => void;
  authHeaders: () => Record<string, string>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch("/api/editor-upload", { method: "POST", headers: authHeaders(), body: fd });
      const d = await r.json();
      if (d.url) onChange(d.url);
    } finally { setUploading(false); }
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {value && (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src={value} alt="" style={{ width: 100, height: 60, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb" }} />
            <button
              onClick={() => onChange("")}
              style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "#ef4444", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
            >×</button>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            type="file" accept="image/*" style={{ display: "none" }} ref={fileRef}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 12, cursor: "pointer", color: "#333" }}
          >
            {uploading ? "업로드 중..." : value ? "이미지 변경" : "이미지 선택"}
          </button>
          {value && (
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, wordBreak: "break-all" }}>{value}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MainSliderBannerManager({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [banners, setBanners] = useState<ImageBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | "new" | null>(null);
  const [editMap, setEditMap] = useState<Record<number, ImageBanner>>({});
  const [newBanner, setNewBanner] = useState<Omit<ImageBanner, "id">>({ ...EMPTY_BANNER });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/image-banners", { headers: authHeaders() });
      const data = await r.json();
      const list: ImageBanner[] = data.banners || [];
      setBanners(list);
      const map: Record<number, ImageBanner> = {};
      list.forEach(b => { map[b.id] = { ...b }; });
      setEditMap(map);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setField = (id: number, field: keyof ImageBanner, value: any) =>
    setEditMap(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async (banner: ImageBanner) => {
    setSaving(true);
    try {
      const edit = editMap[banner.id];
      const res = await fetch(`/api/admin/image-banners/${banner.id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(edit),
      });
      if (!res.ok) throw new Error();
      toast("저장 완료");
      await load();
      setExpandedId(null);
    } catch { toast("저장 실패", "err"); }
    finally { setSaving(false); }
  };

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/image-banners", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(newBanner),
      });
      if (!res.ok) throw new Error();
      toast("배너 추가 완료");
      setNewBanner({ ...EMPTY_BANNER });
      setExpandedId(null);
      await load();
    } catch { toast("추가 실패", "err"); }
    finally { setSaving(false); }
  };

  const deleteBanner = async (id: number) => {
    if (!confirm("배너를 삭제하시겠습니까?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/image-banners/${id}`, { method: "DELETE", headers: authHeaders() });
      toast("삭제 완료");
      await load();
    } catch { toast("삭제 실패", "err"); }
    finally { setDeleting(null); }
  };

  const SectionLabel = ({ children }: { children: string }) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 10, borderBottom: "1px solid #f0f0f0", paddingBottom: 6 }}>{children}</div>
  );

  const BannerForm = ({ data, onChange }: { data: Omit<ImageBanner, "id">; onChange: (f: keyof Omit<ImageBanner, "id">, v: any) => void }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "20px 18px" }}>
      <div>
        <SectionLabel>제목 (관리용)</SectionLabel>
        <input
          value={data.title} onChange={e => onChange("title", e.target.value)} placeholder="배너 제목 (관리용)"
          style={{ width: "100%", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 7, padding: "8px 11px", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <SectionLabel>이미지</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <ImageBannerUpload label="PC 이미지 (가로형 권장)" value={data.pc_image_url} onChange={v => onChange("pc_image_url", v)} authHeaders={authHeaders} />
          <ImageBannerUpload label="모바일 이미지 (세로형 권장)" value={data.mobile_image_url} onChange={v => onChange("mobile_image_url", v)} authHeaders={authHeaders} />
        </div>
      </div>
      <div>
        <SectionLabel>링크 & 기간</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>클릭 시 이동 URL</div>
            <input value={data.link_url} onChange={e => onChange("link_url", e.target.value)} placeholder="/list?type=3"
              style={{ width: "100%", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 6, padding: "7px 10px", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>노출 시작일 (비워두면 즉시 노출)</div>
              <input type="date" value={data.start_date || ""} onChange={e => onChange("start_date", e.target.value)}
                style={{ width: "100%", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 6, padding: "7px 10px", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>노출 종료일 (비워두면 무기한)</div>
              <input type="date" value={data.end_date || ""} onChange={e => onChange("end_date", e.target.value)}
                style={{ width: "100%", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 6, padding: "7px 10px", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>정렬 순서 (낮을수록 먼저)</div>
          <input type="number" value={data.sort_order} onChange={e => onChange("sort_order", Number(e.target.value))}
            style={{ width: "100%", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 6, padding: "7px 10px", boxSizing: "border-box" }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>노출 여부</div>
          <button onClick={() => onChange("is_active", data.is_active ? 0 : 1)}
            style={{
              width: "100%", padding: "8px 0", borderRadius: 6, border: "1px solid #ddd",
              cursor: "pointer", fontWeight: 700, fontSize: 12,
              background: data.is_active ? "#e8f9f0" : "#f5f5f5",
              color: data.is_active ? "#8B5E3C" : "#999",
            }}>
            {data.is_active ? "✓ 노출 중" : "✗ 비활성"}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <p style={{ textAlign: "center", color: "#aaa", padding: 40 }}>불러오는 중...</p>;

  return (
    <div>
      <PageHeader title="배너 이미지 관리" sub="메인 홈 슬라이드 배너를 이미지로 관리합니다. PC/모바일 이미지를 각각 등록하고 노출 기간을 설정하세요." />

      {/* 배너 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {banners.map(banner => {
          const edit = editMap[banner.id];
          const isOpen = expandedId === banner.id;
          if (!edit) return null;
          return (
            <Card key={banner.id} style={{ padding: 0, overflow: "hidden" }}>
              <div
                onClick={() => setExpandedId(isOpen ? null : banner.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                  cursor: "pointer", background: isOpen ? "#f8fffe" : "#fff",
                  borderBottom: isOpen ? "1px solid #e5e7eb" : "none",
                }}
              >
                {/* PC 이미지 썸네일 */}
                <div style={{
                  width: 80, height: 46, borderRadius: 6, overflow: "hidden",
                  border: "1px solid #e5e7eb", flexShrink: 0, background: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {banner.pc_image_url
                    ? <img src={banner.pc_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 10, color: "#ccc" }}>PC없음</span>
                  }
                </div>
                {/* 모바일 이미지 썸네일 */}
                <div style={{
                  width: 36, height: 46, borderRadius: 6, overflow: "hidden",
                  border: "1px solid #e5e7eb", flexShrink: 0, background: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {banner.mobile_image_url
                    ? <img src={banner.mobile_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 9, color: "#ccc" }}>M</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{banner.title || `배너 #${banner.id}`}</span>
                    {!banner.is_active && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "#fee2e2", color: "#ef4444" }}>비활성</span>}
                    {(banner.start_date || banner.end_date) && (
                      <span style={{ fontSize: 10, color: "#888" }}>
                        {banner.start_date || "∞"} ~ {banner.end_date || "∞"}
                      </span>
                    )}
                  </div>
                  {banner.link_url && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{banner.link_url}</div>}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteBanner(banner.id); }}
                  disabled={deleting === banner.id}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fff5f5", color: "#ef4444", fontSize: 11, cursor: "pointer" }}
                >삭제</button>
                <div style={{ color: "#aaa", fontSize: 12 }}>{isOpen ? "▲ 접기" : "▼ 편집"}</div>
              </div>

              {isOpen && (
                <>
                  <BannerForm
                    data={edit}
                    onChange={(f, v) => setField(banner.id, f as keyof ImageBanner, v)}
                  />
                  <div style={{ display: "flex", gap: 8, padding: "0 18px 16px" }}>
                    <Btn onClick={() => save(banner)} disabled={saving} color="#8B5E3C">
                      <Check size={13} /> {saving ? "저장 중..." : "저장"}
                    </Btn>
                    <Btn onClick={() => { setExpandedId(null); setEditMap(prev => ({ ...prev, [banner.id]: { ...banners.find(b => b.id === banner.id)! } })); }} color="#888">취소</Btn>
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* 새 배너 추가 */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          onClick={() => setExpandedId(expandedId === "new" ? null : "new")}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            cursor: "pointer", background: expandedId === "new" ? "#f0fdf4" : "#fff",
            borderBottom: expandedId === "new" ? "1px solid #e5e7eb" : "none",
          }}
        >
          <Plus size={15} color="#8B5E3C" />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#8B5E3C" }}>새 배너 추가</span>
        </div>
        {expandedId === "new" && (
          <>
            <BannerForm
              data={newBanner}
              onChange={(f, v) => setNewBanner(prev => ({ ...prev, [f]: v }))}
            />
            <div style={{ display: "flex", gap: 8, padding: "0 18px 16px" }}>
              <Btn onClick={create} disabled={saving} color="#8B5E3C">
                <Plus size={13} /> {saving ? "추가 중..." : "배너 추가"}
              </Btn>
              <Btn onClick={() => { setExpandedId(null); setNewBanner({ ...EMPTY_BANNER }); }} color="#888">취소</Btn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Gift Package Manager (선물패키지관리) ────────────────────────────────────

interface GiftPkg {
  id: number; name: string; description: string; price: number;
  thumb_img: string; ca_id: string; item_count: number;
  sort_order: number; is_active: number;
  items?: { id: number; it_id: string; it_name: string; it_img1: string; quantity: number }[];
}

const CAT_LABELS: Record<string, string> = { "10": "🍪 과자류", "20": "🫙 유지류", "30": "🥫 통조림캔류" };

function GiftPackageManager({ authHeaders, toast }: {
  authHeaders: () => Record<string, string>;
  toast: (m: string, t?: "ok" | "err") => void;
}) {
  const [pkgs, setPkgs] = useState<GiftPkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GiftPkg | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<ShopItem[]>([]);
  const [searching, setSearching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emptyForm = (): GiftPkg => ({
    id: 0, name: "", description: "", price: 0,
    thumb_img: "", ca_id: "10", item_count: 3, sort_order: 0, is_active: 1,
  });

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/shop-admin/gift/packages", { headers: authHeaders() });
      setPkgs(await r.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (pkg: GiftPkg) => { setEditing({ ...pkg }); setIsNew(false); setExpandedId(null); };
  const startNew = () => { setEditing(emptyForm()); setIsNew(true); setExpandedId(null); };
  const cancelEdit = () => { setEditing(null); setSearchQ(""); setSearchResults([]); };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing || !e.target.files?.[0]) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", e.target.files[0]);
      const r = await fetch("/api/shop-admin/gift/packages/upload-image", { method: "POST", headers: authHeaders(), body: fd });
      const d = await r.json();
      if (d.url) setEditing(prev => prev ? { ...prev, thumb_img: d.url } : prev);
      toast("이미지 업로드 완료", "ok");
    } catch { toast("이미지 업로드 실패", "err"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast("패키지명을 입력하세요", "err"); return; }
    setSaving(true);
    try {
      const body = JSON.stringify({
        name: editing.name, description: editing.description,
        price: editing.price, thumb_img: editing.thumb_img,
        ca_id: editing.ca_id, item_count: editing.item_count,
        sort_order: editing.sort_order, is_active: editing.is_active,
      });
      const headers = { ...authHeaders(), "Content-Type": "application/json" };
      if (isNew) {
        await fetch("/api/shop-admin/gift/packages", { method: "POST", headers, body });
        toast("패키지 등록 완료", "ok");
      } else {
        await fetch(`/api/shop-admin/gift/packages/${editing.id}`, { method: "PUT", headers, body });
        toast("패키지 수정 완료", "ok");
      }
      cancelEdit();
      await load();
    } catch { toast("저장 실패", "err"); }
    finally { setSaving(false); }
  };

  const deletePkg = async (pkg: GiftPkg) => {
    if (!confirm(`"${pkg.name}" 패키지를 삭제하시겠습니까?`)) return;
    try {
      await fetch(`/api/shop-admin/gift/packages/${pkg.id}`, { method: "DELETE", headers: authHeaders() });
      toast("삭제 완료", "ok");
      await load();
    } catch { toast("삭제 실패", "err"); }
  };

  const toggleExpand = (id: number) => setExpandedId(prev => prev === id ? null : id);

  const handleItemSearch = (q: string) => {
    setSearchQ(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim() || !editing) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/shop-admin/gift/packages/search-items?q=${encodeURIComponent(q)}&ca_id=${editing.ca_id}`, { headers: authHeaders() });
        setSearchResults(await r.json());
      } finally { setSearching(false); }
    }, 350);
  };

  const addItem = async (item: ShopItem) => {
    if (!editing || isNew) return;
    try {
      await fetch(`/api/shop-admin/gift/packages/${editing.id}/items`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ it_id: item.it_id, it_name: item.it_name, it_img1: item.it_img1 }),
      });
      const r = await fetch("/api/shop-admin/gift/packages", { headers: authHeaders() });
      const updated = (await r.json()).find((p: GiftPkg) => p.id === editing.id);
      if (updated) setEditing(updated);
      setPkgs(await (await fetch("/api/shop-admin/gift/packages", { headers: authHeaders() })).json());
      setSearchResults(prev => prev.filter(i => i.it_id !== item.it_id));
      toast("상품 추가 완료", "ok");
    } catch { toast("추가 실패", "err"); }
  };

  const removeItem = async (pkgId: number, itemId: number) => {
    try {
      await fetch(`/api/shop-admin/gift/packages/${pkgId}/items/${itemId}`, { method: "DELETE", headers: authHeaders() });
      setEditing(prev => prev ? { ...prev, items: prev.items?.filter(i => i.id !== itemId) } : prev);
      setPkgs(prev => prev.map(p => p.id === pkgId ? { ...p, items: p.items?.filter(i => i.id !== itemId) } : p));
      toast("상품 제거 완료", "ok");
    } catch { toast("제거 실패", "err"); }
  };

  const inp = (style?: React.CSSProperties): React.CSSProperties => ({
    width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8,
    fontSize: 13, outline: "none", boxSizing: "border-box", ...style,
  });

  if (editing) return (
    <div>
      <PageHeader title={isNew ? "선물패키지 등록" : "선물패키지 수정"} sub="선물하기 화면에 표시되는 패키지를 관리합니다" />
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: 24, maxWidth: 640 }}>
        <div style={{ display: "grid", gap: 16 }}>
          {/* 썸네일 이미지 */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>썸네일 이미지</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {editing.thumb_img ? (
                <img src={editing.thumb_img} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1px solid #eee", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 80, background: "#f5f5f5", borderRadius: 10, border: "1.5px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🖼️</div>
              )}
              <div style={{ flex: 1 }}>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ padding: "7px 16px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {uploading ? "업로드 중..." : "이미지 선택"}
                </button>
                {editing.thumb_img && (
                  <button onClick={() => setEditing(p => p ? { ...p, thumb_img: "" } : p)}
                    style={{ marginLeft: 8, padding: "7px 12px", background: "#fff", border: "1px solid #ddd", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#e53e3e" }}>
                    삭제
                  </button>
                )}
                <p style={{ fontSize: 11, color: "#999", marginTop: 6 }}>권장: 600×400px, JPG/PNG</p>
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>패키지명 *</label>
            <input style={inp()} value={editing.name} onChange={e => setEditing(p => p ? { ...p, name: e.target.value } : p)} placeholder="예: seoulmono 과자폭탄 선물세트" />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>설명</label>
            <input style={inp()} value={editing.description} onChange={e => setEditing(p => p ? { ...p, description: e.target.value } : p)} placeholder="간단한 패키지 소개" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>카테고리 *</label>
              <select style={{ ...inp(), background: "#fff" }} value={editing.ca_id} onChange={e => setEditing(p => p ? { ...p, ca_id: e.target.value } : p)}>
                {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>개입수</label>
              <input type="number" min={1} style={inp()} value={editing.item_count} onChange={e => setEditing(p => p ? { ...p, item_count: +e.target.value } : p)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>가격 (원)</label>
              <input type="number" min={0} style={inp()} value={editing.price} onChange={e => setEditing(p => p ? { ...p, price: +e.target.value } : p)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>정렬순서</label>
              <input type="number" style={inp()} value={editing.sort_order} onChange={e => setEditing(p => p ? { ...p, sort_order: +e.target.value } : p)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>상태</label>
              <select style={{ ...inp(), background: "#fff" }} value={editing.is_active} onChange={e => setEditing(p => p ? { ...p, is_active: +e.target.value } : p)}>
                <option value={1}>활성</option>
                <option value={0}>비활성</option>
              </select>
            </div>
          </div>

          {/* 구성 상품 (수정 모드에서만) */}
          {!isNew && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>구성 상품</label>
              {editing.items && editing.items.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  {editing.items.map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "#f9f9f9", borderRadius: 8, border: "1px solid #eee" }}>
                      {item.it_img1 && <img src={item.it_img1} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid #eee", flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                      <span style={{ flex: 1, fontSize: 12, color: "#333", fontWeight: 600 }}>{item.it_name}</span>
                      <button onClick={() => removeItem(editing.id, item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", padding: "2px 4px" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ position: "relative" }}>
                <input style={inp()} value={searchQ} onChange={e => handleItemSearch(e.target.value)} placeholder="상품명으로 검색하여 추가..." />
                {(searching || searchResults.length > 0) && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "#fff", border: "1px solid #eee", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 220, overflowY: "auto" }}>
                    {searching && <div style={{ padding: 12, fontSize: 12, color: "#999", textAlign: "center" }}>검색 중...</div>}
                    {searchResults.map(item => (
                      <div key={item.it_id} onClick={() => { addItem(item); setSearchQ(""); setSearchResults([]); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#FDF6EE"}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ""}>
                        {item.it_img1 && <img src={item.it_img1} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.it_name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{fmtPrice(item.it_price)}</p>
                        </div>
                        <Plus size={14} color="#8B5E3C" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
            <button onClick={cancelEdit} style={{ padding: "9px 20px", background: "#f5f5f5", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>취소</button>
            <button onClick={save} disabled={saving} style={{ padding: "9px 20px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {saving ? "저장 중..." : isNew ? "등록" : "수정 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="선물패키지관리" sub="홈·선물하기 화면에 노출되는 선물 패키지를 등록·수정합니다" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={startNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={15} /> 새 패키지 등록
        </button>
      </div>
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#999" }}>불러오는 중...</div>
      ) : pkgs.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", background: "#fff", borderRadius: 12, border: "2px dashed #eee" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎁</div>
          <p style={{ color: "#999", fontSize: 14 }}>등록된 선물 패키지가 없습니다</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pkgs.map(pkg => (
            <div key={pkg.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                {pkg.thumb_img ? (
                  <img src={pkg.thumb_img} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "1px solid #eee", flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div style={{ width: 64, height: 64, background: "#f5f5f5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🎁</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#111" }}>{pkg.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, background: pkg.is_active ? "#e8f9f0" : "#f5f5f5", color: pkg.is_active ? "#8B5E3C" : "#999", borderRadius: 20, padding: "2px 8px" }}>
                      {pkg.is_active ? "활성" : "비활성"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#666" }}>
                    <span>{CAT_LABELS[pkg.ca_id] || pkg.ca_id}</span>
                    <span>·</span>
                    <span>{pkg.item_count}개입</span>
                    <span>·</span>
                    <span style={{ fontWeight: 700, color: "#8B5E3C" }}>{fmtPrice(pkg.price)}</span>
                  </div>
                  {pkg.description && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#999" }}>{pkg.description}</p>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => toggleExpand(pkg.id)}
                    style={{ padding: "6px 12px", background: "#f5f5f5", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#555" }}>
                    구성상품 {expandedId === pkg.id ? "▲" : "▼"}
                  </button>
                  <button onClick={() => startEdit(pkg)}
                    style={{ padding: "6px 12px", background: "#e8f9f0", color: "#8B5E3C", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => deletePkg(pkg)}
                    style={{ padding: "6px 12px", background: "#fff0f0", color: "#e53e3e", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {expandedId === pkg.id && (
                <div style={{ borderTop: "1px solid #f5f5f5", padding: "12px 16px", background: "#fafafa" }}>
                  {!pkg.items || pkg.items.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>구성 상품이 없습니다 (수정에서 추가 가능)</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {pkg.items.map(item => (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#fff", borderRadius: 8, border: "1px solid #eee", fontSize: 12 }}>
                          {item.it_img1 && <img src={item.it_img1} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 5 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                          <span style={{ color: "#333", fontWeight: 600 }}>{item.it_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Gift Set Category Manager (선물분류관리) ────────────────────────────────

interface GiftSetSub {
  ca_id: string; ca_name: string; slot_count: number;
  price: number; description: string; is_active: number;
}
interface GiftSetMain { ca_id: string; ca_name: string; sub_categories: GiftSetSub[] }

function GiftSetCategoryManager({ authHeaders, toast }: {
  authHeaders: () => Record<string, string>;
  toast: (m: string, t?: "ok" | "err") => void;
}) {
  const [cats, setCats] = useState<GiftSetMain[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSub, setEditingSub] = useState<(GiftSetSub & { mainCaId?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/shop-admin/gift/categories", { headers: authHeaders() });
      setCats(await r.json());
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveSub = async () => {
    if (!editingSub) return;
    setSaving(true);
    try {
      await fetch(`/api/shop-admin/gift/set-config/${editingSub.ca_id}`, {
        method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_count: editingSub.slot_count, price: editingSub.price,
          description: editingSub.description, is_active: editingSub.is_active,
        }),
      });
      toast("저장 완료");
      setEditingSub(null);
      await load();
    } catch { toast("저장 실패", "err"); }
    finally { setSaving(false); }
  };

  const ICONS: Record<string, string> = { "10": "🍪", "20": "🫙", "30": "🥫" };

  return (
    <div>
      <PageHeader title="선물분류관리" sub="g5_shop_category2 기반의 선물 세트 유형을 설정합니다" />

      {editingSub && (
        <Card style={{ marginBottom: 16, border: "1.5px solid #8B5E3C" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px", color: "#8B5E3C" }}>
            [{editingSub.ca_id}] {editingSub.ca_name} 설정
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FormField label="슬롯 수 (담을 상품 개수)" value={String(editingSub.slot_count)}
              onChange={v => setEditingSub(e => e && ({ ...e, slot_count: Number(v) }))} type="number" />
            <FormField label="세트 가격 (0이면 숨김)" value={String(editingSub.price)}
              onChange={v => setEditingSub(e => e && ({ ...e, price: Number(v) }))} type="number" />
            <FormField label="설명 (선택)" value={editingSub.description}
              onChange={v => setEditingSub(e => e && ({ ...e, description: v }))} placeholder="예) 인기 스낵 6종 선택" />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>활성화</label>
              <input type="checkbox" checked={editingSub.is_active === 1}
                onChange={e => setEditingSub(prev => prev && ({ ...prev, is_active: e.target.checked ? 1 : 0 }))} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={saveSub} disabled={saving} color="#8B5E3C">{saving ? "저장 중..." : "저장"}</Btn>
              <Btn onClick={() => setEditingSub(null)} color="#888">취소</Btn>
            </div>
          </div>
        </Card>
      )}

      {loading ? <p style={{ textAlign: "center", color: "#aaa" }}>불러오는 중...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {cats.map(cat => (
            <Card key={cat.ca_id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{ICONS[cat.ca_id] || "🎁"}</span>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: 0 }}>{cat.ca_name}</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cat.sub_categories.map(sub => (
                  <div key={sub.ca_id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    background: sub.is_active ? "#f0fdf4" : "#f9f9f9",
                    borderRadius: 8, border: `1px solid ${sub.is_active ? "#bbf7d0" : "#e5e5e5"}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{sub.ca_name}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: sub.is_active ? "#8B5E3C" : "#ccc", color: "#fff" }}>
                          {sub.is_active ? "활성" : "비활성"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        {sub.slot_count}개 담기 {sub.price > 0 ? `· ${sub.price.toLocaleString()}원` : ""} {sub.description ? `· ${sub.description}` : ""}
                      </div>
                    </div>
                    <Btn onClick={() => setEditingSub({ ...sub, mainCaId: cat.ca_id })} color="#6366f1">
                      <Edit2 size={13} /> 설정
                    </Btn>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Gift Set Product Manager (선물상품관리) ──────────────────────────────────

interface GiftSetProduct {
  id: number; it_id: string; it_name: string; it_img1: string; it_price: number; sort_order: number;
}

function GiftSetProductManager({ authHeaders, toast }: {
  authHeaders: () => Record<string, string>;
  toast: (m: string, t?: "ok" | "err") => void;
}) {
  const [cats, setCats] = useState<GiftSetMain[]>([]);
  const [selectedSub, setSelectedSub] = useState<{ ca_id: string; ca_name: string } | null>(null);
  const [products, setProducts] = useState<GiftSetProduct[]>([]);
  const [loadingProd, setLoadingProd] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<ShopItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ICONS: Record<string, string> = { "10": "🍪", "20": "🫙", "30": "🥫" };

  useEffect(() => {
    fetch("/api/shop-admin/gift/categories", { headers: authHeaders() })
      .then(r => r.json()).then(d => setCats(d));
  }, []);

  const loadProducts = async (caid: string) => {
    setLoadingProd(true);
    try {
      const r = await fetch(`/api/shop-admin/gift/set-products/${caid}`, { headers: authHeaders() });
      setProducts(await r.json());
    } finally { setLoadingProd(false); }
  };

  const selectSub = (sub: { ca_id: string; ca_name: string }) => {
    setSelectedSub(sub); setSearchQ(""); setSearchResults([]); loadProducts(sub.ca_id);
  };

  const handleSearch = (q: string) => {
    if (!selectedSub) return;
    setSearchQ(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    const parentCaId = selectedSub.ca_id.substring(0, 2);
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/shop-admin/gift/search-products?q=${encodeURIComponent(q)}&ca_id=${parentCaId}`, { headers: authHeaders() });
        setSearchResults(await r.json());
      } finally { setSearching(false); }
    }, 350);
  };

  const addProduct = async (item: ShopItem) => {
    if (!selectedSub) return;
    setActionId("add_" + item.it_id);
    try {
      await fetch(`/api/shop-admin/gift/set-products/${selectedSub.ca_id}`, {
        method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ it_id: item.it_id }),
      });
      await loadProducts(selectedSub.ca_id);
      setSearchResults(prev => prev.filter(i => i.it_id !== item.it_id));
      toast(`"${item.it_name}" 추가 완료`);
    } catch { toast("추가 실패", "err"); }
    finally { setActionId(null); }
  };

  const removeProduct = async (id: number, name: string) => {
    setActionId("rm_" + id);
    try {
      await fetch(`/api/shop-admin/gift/set-products/${id}`, { method: "DELETE", headers: authHeaders() });
      setProducts(prev => prev.filter(p => p.id !== id));
      toast(`"${name}" 제거 완료`);
    } catch { toast("제거 실패", "err"); }
    finally { setActionId(null); }
  };

  return (
    <div>
      <PageHeader title="선물상품관리" sub="세트 유형별로 선택 가능한 상품을 등록합니다" />
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Set type selector */}
        <div style={{ width: 210, flexShrink: 0 }}>
          <Card>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#888", margin: "0 0 10px" }}>세트 유형 선택</p>
            {cats.map(cat => (
              <div key={cat.ca_id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#555", padding: "4px 6px" }}>
                  {ICONS[cat.ca_id] || "🎁"} {cat.ca_name}
                </div>
                {cat.sub_categories.map(sub => (
                  <button key={sub.ca_id} onClick={() => selectSub(sub)} style={{
                    display: "block", width: "100%", padding: "7px 10px 7px 22px",
                    border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left",
                    fontSize: 12, fontWeight: selectedSub?.ca_id === sub.ca_id ? 700 : 400,
                    background: selectedSub?.ca_id === sub.ca_id ? "#e8f9f0" : "none",
                    color: selectedSub?.ca_id === sub.ca_id ? "#8B5E3C" : "#444",
                  }}>
                    {sub.ca_name}
                  </button>
                ))}
              </div>
            ))}
          </Card>
        </div>

        {/* Product management */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedSub ? (
            <Card><p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>좌측에서 세트 유형을 선택하세요</p></Card>
          ) : (
            <>
              <Card style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>{selectedSub.ca_name} — 상품 검색</h3>
                <input value={searchQ} onChange={e => handleSearch(e.target.value)}
                  placeholder="상품명으로 검색 (상위 카테고리 상품 기준)..." style={inputStyle} />
                {searching && <p style={{ fontSize: 13, color: "#aaa", margin: "8px 0 0" }}>검색 중...</p>}
                {searchResults.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {searchResults.map(item => (
                      <ItemRow key={item.it_id} item={item}
                        action={<Btn onClick={() => addProduct(item)} disabled={actionId === "add_" + item.it_id} color="#8B5E3C">추가</Btn>}
                      />
                    ))}
                  </div>
                )}
              </Card>
              <Card>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>
                  등록된 상품 <span style={{ color: "#8B5E3C" }}>({products.length}개)</span>
                </h3>
                {loadingProd && <p style={{ textAlign: "center", color: "#aaa" }}>불러오는 중...</p>}
                {!loadingProd && products.length === 0 && <p style={{ textAlign: "center", color: "#aaa" }}>등록된 상품이 없습니다. 위에서 검색하여 추가하세요.</p>}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {products.map(p => (
                    <ItemRow key={p.id} item={{ it_id: p.it_id, it_name: p.it_name, it_price: p.it_price, it_cust_price: 0, it_img1: p.it_img1 }}
                      action={<Btn onClick={() => removeProduct(p.id, p.it_name)} disabled={actionId === "rm_" + p.id} color="#ef4444"><Trash2 size={13} /></Btn>}
                    />
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shop Categories Manager ──────────────────────────────────────────────────

function ShopCategoriesManager({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgMap, setImgMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = () => {
    setLoading(true);
    fetch("/api/admin/categories", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const list = d.categories || [];
        setCats(list);
        const m: Record<string, string> = {};
        list.forEach((c: any) => { m[c.ca_id] = c.ca_img || ""; });
        setImgMap(m);
      })
      .catch(() => toast("불러오기 실패", "err"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = async (caId: string, file: File) => {
    setUploading(caId);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch("/api/admin/categories/upload-image", {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      const d = await r.json();
      if (d.url) {
        setImgMap(prev => ({ ...prev, [caId]: d.url }));
        toast("이미지 업로드 완료. 저장 버튼을 눌러 적용하세요.", "ok");
      } else {
        toast(d.error || "업로드 실패", "err");
      }
    } catch {
      toast("업로드 중 오류가 발생했습니다", "err");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (cat: any) => {
    setSaving(cat.ca_id);
    try {
      const r = await fetch(`/api/admin/categories/${encodeURIComponent(cat.ca_id)}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ca_name: cat.ca_name,
          ca_use: cat.ca_use,
          ca_order: cat.ca_order,
          ca_img: imgMap[cat.ca_id] || "",
        }),
      });
      if (r.ok) toast("저장 완료", "ok");
      else toast("저장 실패", "err");
    } catch {
      toast("저장 중 오류가 발생했습니다", "err");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <PageHeader title="상품카테고리 이미지 관리" sub="카테고리별 대표 이미지를 등록·수정합니다. 이미지는 카테고리 탭 및 상품 목록에서 사용됩니다." />
      <Card>
        {loading && <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>불러오는 중...</p>}
        {!loading && cats.length === 0 && (
          <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>등록된 카테고리가 없습니다</p>
        )}
        {!loading && cats.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cats.map((cat) => {
              const imgUrl = imgMap[cat.ca_id] || "";
              const isUploading = uploading === cat.ca_id;
              const isSaving = saving === cat.ca_id;
              return (
                <div key={cat.ca_id} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "14px 16px", borderRadius: 10,
                  border: "1px solid #eee", background: "#fafafa",
                }}>
                  {/* 썸네일 */}
                  <div style={{
                    width: 72, height: 72, borderRadius: 8, overflow: "hidden",
                    border: "1px solid #e0e0e0", flexShrink: 0,
                    background: imgUrl ? "#fff" : "#f0f0f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {imgUrl
                      ? <img src={imgUrl} alt={cat.ca_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 11, color: "#bbb", textAlign: "center", lineHeight: 1.3 }}>이미지<br />없음</span>
                    }
                  </div>

                  {/* 카테고리 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 2 }}>{cat.ca_name}</div>
                    <div style={{ fontSize: 12, color: "#999" }}>ID: {cat.ca_id} · 순서: {cat.ca_order}</div>
                    {imgUrl && (
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, wordBreak: "break-all", maxWidth: 360 }}>
                        {imgUrl}
                      </div>
                    )}
                  </div>

                  {/* 버튼 영역 */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                    {/* 숨겨진 파일 입력 */}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      ref={el => { fileRefs.current[cat.ca_id] = el; }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(cat.ca_id, file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      onClick={() => fileRefs.current[cat.ca_id]?.click()}
                      disabled={isUploading}
                      style={{
                        padding: "6px 14px", borderRadius: 7, border: "1px solid #ddd",
                        background: "#fff", color: "#333", fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      {isUploading ? "업로드 중..." : imgUrl ? "이미지 변경" : "이미지 등록"}
                    </button>
                    {imgUrl && (
                      <button
                        onClick={() => setImgMap(prev => ({ ...prev, [cat.ca_id]: "" }))}
                        style={{
                          padding: "6px 10px", borderRadius: 7, border: "1px solid #fca5a5",
                          background: "#fff5f5", color: "#ef4444", fontSize: 12, cursor: "pointer",
                        }}
                        title="이미지 삭제"
                      >
                        삭제
                      </button>
                    )}
                    <button
                      onClick={() => handleSave(cat)}
                      disabled={isSaving}
                      style={{
                        padding: "6px 16px", borderRadius: 7, border: "none",
                        background: isSaving ? "#ccc" : "#2d6a4f", color: "#fff",
                        fontSize: 12, cursor: isSaving ? "not-allowed" : "pointer", fontWeight: 600,
                      }}
                    >
                      {isSaving ? "저장 중..." : "저장"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p style={{ fontSize: 12, color: "#bbb", margin: "16px 0 0" }}>
          * 이미지를 선택한 후 반드시 [저장] 버튼을 눌러야 적용됩니다.
        </p>
      </Card>
    </div>
  );
}

// ─── Product List ─────────────────────────────────────────────────────────────

interface AdminProduct {
  it_id: string; it_name: string; it_price: number; it_cust_price: number;
  it_img1: string; ca_id: string; ca_name: string; it_use: string; it_soldout: string;
}

const USE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  "1": { label: "노출", color: "#8B5E3C", bg: "#e8f9f0" },
  "0": { label: "미노출", color: "#888", bg: "#f0f0f0" },
};
const SOLDOUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  "0": { label: "판매중", color: "#2563eb", bg: "#eff6ff" },
  "2": { label: "판매준비중", color: "#d97706", bg: "#fffbeb" },
  "1": { label: "품절", color: "#ef4444", bg: "#fff3f3" },
};

interface CatNode { ca_id: string; ca_name: string; children?: CatNode[]; }

interface CatStatItem {
  ca_2: string; ca_name: string | null; ca_use: number | null;
  total: number; use_on: number; use_off: number; soldout: number;
}
interface CatStatSummary { total: number; use_on: number; use_off: number; soldout: number; unassigned: number; }

function ProductList({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [perPage, setPerPage] = useState(20);
  const [curPage, setCurPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 카테고리 통계 ──────────────────────────────────────────
  const [catStats, setCatStats] = useState<CatStatItem[]>([]);
  const [catSummary, setCatSummary] = useState<CatStatSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await fetch("/api/admin/products/category-stats", { headers: authHeaders() });
      const d = await r.json();
      setCatSummary(d.summary);
      setCatStats(d.categories || []);
    } catch {}
    finally { setStatsLoading(false); }
  }, [authHeaders]);

  // ── 검색 필터 상태 ─────────────────────────────────────────
  const [q, setQ] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [catTree, setCatTree] = useState<CatNode[]>([]);
  const [catL1, setCatL1] = useState("");
  const [catL2, setCatL2] = useState("");
  const [catL3, setCatL3] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterUse, setFilterUse] = useState("");
  const [filterSoldout, setFilterSoldout] = useState("");
  const [filterUnassigned, setFilterUnassigned] = useState(false);

  useEffect(() => {
    fetch("/api/categories", { headers: authHeaders() })
      .then(r => r.json()).then(d => setCatTree(d.tree || [])).catch(() => {});
    loadStats();
  }, []);

  const getCatParam = () => {
    if (filterUnassigned) return "__unassigned";
    return catL3 || catL2 || catL1;
  };

  const catL1Node = catTree.find(c => c.ca_id === catL1);
  const catL2Children = catL1Node?.children || [];
  const catL2Node = catL2Children.find(c => c.ca_id === catL2);
  const catL3Children = catL2Node?.children || [];

  // ── 상품 편집 드로어 ──────────────────────────────────────
  interface EditOption {
    io_no?: number; io_id: string; qty: number;
    discount: number; io_price: number; io_stock_qty: number; io_use: string;
  }
  interface EditForm {
    it_price: number; it_cust_price: number;
    it_shelf_life: string;   // 유통기한 (it_1)
    box_qty: number;         // 1박스 입수량 (it_2)
    box_discount: number;    // 박스당 할인율 %
    it_stock_qty: number;
    ca_id: string;
    options: EditOption[];
  }

  const [editItem, setEditItem] = useState<AdminProduct | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editCatL1, setEditCatL1] = useState("");
  const [editCatL2, setEditCatL2] = useState("");
  const [editCatL3, setEditCatL3] = useState("");
  const [catSearchQ, setCatSearchQ] = useState("");
  const [catSearchOpen, setCatSearchOpen] = useState(false);

  // 카테고리 트리를 flat 리스트로 변환 (경로 포함)
  const flatCats = useMemo(() => {
    const result: { ca_id: string; ca_name: string; path: string }[] = [];
    for (const l1 of catTree) {
      result.push({ ca_id: l1.ca_id, ca_name: l1.ca_name, path: l1.ca_name });
      for (const l2 of (l1.children || [])) {
        result.push({ ca_id: l2.ca_id, ca_name: l2.ca_name, path: `${l1.ca_name} > ${l2.ca_name}` });
        for (const l3 of (l2.children || [])) {
          result.push({ ca_id: l3.ca_id, ca_name: l3.ca_name, path: `${l1.ca_name} > ${l2.ca_name} > ${l3.ca_name}` });
        }
      }
    }
    return result;
  }, [catTree]);

  const filteredCats = catSearchQ.trim()
    ? flatCats.filter(c => c.path.toLowerCase().includes(catSearchQ.toLowerCase()) || c.ca_name.toLowerCase().includes(catSearchQ.toLowerCase()))
    : [];

  const initEditCatLevels = (caId: string) => {
    const len = caId.length;
    if (len >= 6) { setEditCatL1(caId.slice(0, 2)); setEditCatL2(caId.slice(0, 4)); setEditCatL3(caId); }
    else if (len === 4) { setEditCatL1(caId.slice(0, 2)); setEditCatL2(caId); setEditCatL3(""); }
    else if (len === 2) { setEditCatL1(caId); setEditCatL2(""); setEditCatL3(""); }
    else { setEditCatL1(""); setEditCatL2(""); setEditCatL3(""); }
  };

  function parseOptionQty(io_id: string, defaultQty: number): number {
    const m = io_id.match(/[(\[（](\d+)입[)\]）]/);
    if (m) return parseInt(m[1]);
    const m2 = io_id.match(/^(\d+)개/);
    if (m2) return parseInt(m2[1]);
    return defaultQty;
  }

  const openEditDrawer = async (item: AdminProduct) => {
    setEditItem(item);
    setEditForm(null);
    setEditLoading(true);
    try {
      const r = await fetch(`/api/admin/products/${item.it_id}`, { headers: authHeaders() });
      const d = await r.json();
      const boxQty = Number(d.box_qty) || 0;
      const caId = d.ca_id || item.ca_id || "";
      initEditCatLevels(caId);
      setCatSearchQ("");
      setCatSearchOpen(false);
      setEditForm({
        it_price: d.it_price || 0,
        it_cust_price: d.it_cust_price || 0,
        it_shelf_life: d.it_shelf_life || "",
        box_qty: boxQty,
        box_discount: d.box_discount || 0,
        it_stock_qty: d.it_stock_qty || 0,
        ca_id: caId,
        options: (d.options || []).map((o: any) => {
          const qty = parseOptionQty(o.io_id, boxQty || 1);
          const salePrice = (d.it_price || 0) + (o.io_price || 0);
          const expected = (d.it_price || 0) * qty;
          const disc = expected > 0 ? Math.round((1 - salePrice / expected) * 100) : 0;
          return {
            io_no: o.io_no, io_id: o.io_id, qty,
            discount: disc >= 0 ? disc : 0,
            io_price: o.io_price || 0,
            io_stock_qty: o.io_stock_qty || 0,
            io_use: o.io_use || "1",
          };
        }),
      });
    } catch { toast("상품 정보 로드 실패", "err"); }
    finally { setEditLoading(false); }
  };

  const recalcOption = (opts: EditOption[], idx: number, itPrice: number): EditOption[] => {
    return opts.map((o, i) => {
      if (i !== idx) return o;
      const salePrice = Math.round(itPrice * o.qty * (1 - o.discount / 100));
      return { ...o, io_price: salePrice - itPrice };
    });
  };

  const saveEdit = async () => {
    if (!editItem || !editForm) return;
    setEditSaving(true);
    try {
      const r1 = await fetch(`/api/admin/products/${editItem.it_id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          it_name: editItem.it_name,
          it_price: editForm.it_price,
          it_cust_price: editForm.it_cust_price,
          it_stock_qty: editForm.it_stock_qty,
          it_shelf_life: editForm.it_shelf_life,
          box_qty: editForm.box_qty,
          box_discount: editForm.box_discount,
          it_use: editItem.it_use,
          ca_id: editForm.ca_id,
        }),
      });
      if (!r1.ok) throw new Error();

      const r2 = await fetch(`/api/admin/products/${editItem.it_id}/options`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          options: editForm.options.map(o => ({
            io_id: o.io_id,
            io_price: o.io_price,
            io_stock_qty: o.io_stock_qty,
            io_use: o.io_use,
          })),
        }),
      });
      if (!r2.ok) throw new Error();

      const newCaName = flatCats.find(c => c.ca_id === editForm.ca_id)?.ca_name || editItem.ca_name;
      setItems(prev => prev.map(p =>
        p.it_id === editItem.it_id
          ? { ...p, it_price: editForm.it_price, it_cust_price: editForm.it_cust_price, ca_id: editForm.ca_id, ca_name: newCaName }
          : p
      ));
      toast("저장 완료");
      setEditItem(null);
    } catch { toast("저장 실패", "err"); }
    finally { setEditSaving(false); }
  };

  // ── 상품정보고시 드로어 ─────────────────────────────────────
  const [noticeItem, setNoticeItem] = useState<AdminProduct | null>(null);
  const [noticeData, setNoticeData] = useState<NoticeData>({ category: "", fields: {} });
  const [noticeSaving, setNoticeSaving] = useState(false);

  const load = useCallback(async (opts: {
    search?: string; searchField?: string; category?: string;
    dateFrom?: string; dateTo?: string;
    it_use?: string; it_soldout?: string;
    page?: number; limit?: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(opts.page ?? 1),
        limit: String(opts.limit ?? 20),
      });
      if (opts.search?.trim()) { params.set("search", opts.search.trim()); params.set("search_field", opts.searchField || "all"); }
      if (opts.category) params.set("category", opts.category);
      if (opts.it_use !== undefined && opts.it_use !== "") params.set("it_use", opts.it_use);
      if (opts.it_soldout !== undefined && opts.it_soldout !== "") params.set("it_soldout", opts.it_soldout);
      if (opts.dateFrom) params.set("date_from", opts.dateFrom);
      if (opts.dateTo) params.set("date_to", opts.dateTo);
      const r = await fetch(`/api/admin/products?${params}`, { headers: authHeaders() });
      const data = await r.json();
      setItems(data.products || []);
      setTotal(data.total || 0);
    } catch { toast("불러오기 실패", "err"); }
    finally { setLoading(false); }
  }, [authHeaders]);

  const getFilters = () => ({
    search: q, searchField,
    category: getCatParam(),
    dateFrom, dateTo,
    it_use: filterUse,
    it_soldout: filterSoldout,
    page: curPage, limit: perPage,
  });

  useEffect(() => { load(getFilters()); }, [curPage, perPage]);

  const doSearch = () => { setCurPage(1); load({ ...getFilters(), page: 1 }); };

  const setDateRange = (from: string, to: string) => {
    setDateFrom(from); setDateTo(to);
  };

  const quickDate = (days: number | null) => {
    if (days === null) { setDateRange("", ""); return; }
    const to = new Date(); const from = new Date();
    from.setDate(to.getDate() - days);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setDateRange(fmt(from), fmt(to));
  };

  const updateStatus = async (it_id: string, field: "it_use" | "it_soldout", value: string) => {
    setUpdating(it_id + "_" + field);
    try {
      const res = await fetch(`/api/admin/products/${it_id}/status`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      setItems(prev => prev.map(p => p.it_id === it_id ? { ...p, [field]: value } : p));
      toast(field === "it_use"
        ? (value === "1" ? "노출로 변경" : "미노출로 변경")
        : (value === "0" ? "판매중으로 변경" : value === "2" ? "판매준비중으로 변경" : "품절로 변경")
      );
    } catch { toast("변경 실패", "err"); }
    finally { setUpdating(null); }
  };

  const openNoticeEditor = (item: AdminProduct) => {
    setNoticeItem(item);
    const existing = parseNotice((item as any).it_info || "");
    setNoticeData(existing || { category: "", fields: {} });
  };

  const saveNotice = async () => {
    if (!noticeItem) return;
    setNoticeSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${noticeItem.it_id}/notice`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ it_info: JSON.stringify(noticeData) }),
      });
      if (!res.ok) throw new Error();
      setItems(prev => prev.map(p => p.it_id === noticeItem.it_id ? { ...p, it_info: JSON.stringify(noticeData) } : p));
      toast("상품정보고시 저장 완료");
      setNoticeItem(null);
    } catch { toast("저장 실패", "err"); }
    finally { setNoticeSaving(false); }
  };

  const noticeCategory = noticeData.category ? NOTICE_CATEGORY_MAP[noticeData.category] : null;

  const fillAll = (checked: boolean) => {
    if (!noticeCategory) return;
    if (checked) {
      const filled: Record<string, string> = {};
      noticeCategory.fields.forEach(f => { filled[f.key] = "상품상세참조"; });
      setNoticeData(prev => ({ ...prev, fields: filled }));
    } else {
      setNoticeData(prev => ({ ...prev, fields: {} }));
    }
  };

  const allFilled = noticeCategory
    ? noticeCategory.fields.every(f => noticeData.fields[f.key] === "상품상세참조")
    : false;

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const selStyle = (active: boolean, color: string, bg: string): React.CSSProperties => ({
    fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
    border: active ? `1.5px solid ${color}` : "1.5px solid #e0e0e0",
    background: active ? bg : "#fafafa",
    color: active ? color : "#bbb",
    cursor: "pointer", whiteSpace: "nowrap" as const,
  });

  const filterSel = {
    fontSize: 13, padding: "6px 8px", borderRadius: 6,
    border: "1.5px solid #e0e0e0", background: "#fff",
    color: "#333", outline: "none", cursor: "pointer",
  };
  const radioLabel = { display: "flex" as const, alignItems: "center" as const, gap: 5, fontSize: 13, color: "#333", cursor: "pointer" as const, marginRight: 16 };
  const qBtn = (label: string, days: number | null) => (
    <button onClick={() => quickDate(days)} style={{
      fontSize: 12, padding: "4px 10px", borderRadius: 5,
      border: "1.5px solid #d0d0d0", background: "#fafafa", color: "#555",
      cursor: "pointer", fontWeight: 600,
    }}>{label}</button>
  );

  return (
    <div>
      <PageHeader title="상품 목록" sub="상품별 노출 여부와 판매상태를 관리합니다" />

      {/* ── 카테고리별 통계 패널 ── */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#222" }}>카테고리별 상품 현황</span>
          <button onClick={loadStats} disabled={statsLoading}
            style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#555", cursor: "pointer" }}>
            {statsLoading ? "갱신 중..." : "새로고침"}
          </button>
        </div>

        {/* 요약 카드 */}
        {catSummary && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "전체 상품", value: catSummary.total, color: "#8B5E3C", bg: "#e8f8f0", onClick: null },
              { label: "노출(판매중)", value: catSummary.use_on, color: "#8B5E3C", bg: "#e8f8f0",
                onClick: () => { setFilterUse("1"); setFilterUnassigned(false); setFilterSoldout(""); setCatL1(""); setCatL2(""); setCatL3(""); setCurPage(1); load({ page: 1, limit: perPage, it_use: "1" }); } },
              { label: "미노출", value: catSummary.use_off, color: "#f5a623", bg: "#fff8ec",
                onClick: () => { setFilterUse("0"); setFilterUnassigned(false); setFilterSoldout(""); setCatL1(""); setCatL2(""); setCatL3(""); setCurPage(1); load({ page: 1, limit: perPage, it_use: "0" }); } },
              { label: "품절", value: catSummary.soldout, color: "#e53935", bg: "#fff0f0",
                onClick: () => { setFilterSoldout("1"); setFilterUse(""); setFilterUnassigned(false); setCatL1(""); setCatL2(""); setCatL3(""); setCurPage(1); load({ page: 1, limit: perPage, it_soldout: "1" }); } },
              {
                label: "카테고리 미지정 ⚠️", value: catSummary.unassigned, color: "#7b1fa2", bg: "#f8f0ff",
                onClick: () => { setFilterUnassigned(true); setFilterUse(""); setFilterSoldout(""); setCatL1(""); setCatL2(""); setCatL3(""); setCurPage(1); load({ page: 1, limit: perPage, category: "__unassigned" }); }
              },
            ].map(card => (
              <div key={card.label}
                onClick={card.onClick ?? undefined}
                style={{
                  flex: "1 1 140px", minWidth: 120, padding: "12px 16px", borderRadius: 10,
                  background: card.bg, border: `1.5px solid ${card.color}22`,
                  cursor: card.onClick ? "pointer" : "default",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={e => { if (card.onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 8px ${card.color}33`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <div style={{ fontSize: 11, color: card.color, fontWeight: 700, marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: card.color }}>{Number(card.value).toLocaleString()}</div>
                {card.onClick && <div style={{ fontSize: 10, color: card.color, marginTop: 3, opacity: 0.7 }}>클릭하여 필터</div>}
              </div>
            ))}
          </div>
        )}

        {/* 카테고리별 상품 테이블 */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f5f7f5" }}>
                {["카테고리", "카테고리명", "노출여부", "전체", "노출", "미노출", "품절", "바로가기"].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "center", fontWeight: 700, color: "#555", borderBottom: "1.5px solid #e0e0e0", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catStats.map((row, i) => {
                const isHidden = row.ca_use === 0;
                const isUnassigned = row.ca_2 === "";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: isUnassigned ? "#fff8f0" : isHidden ? "#f8f8f8" : "#fff" }}>
                    <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: 700, color: isUnassigned ? "#7b1fa2" : "#333", fontFamily: "monospace" }}>
                      {isUnassigned ? "—" : row.ca_2}
                    </td>
                    <td style={{ padding: "6px 10px", color: isUnassigned ? "#7b1fa2" : isHidden ? "#aaa" : "#333", fontWeight: isUnassigned ? 700 : 400 }}>
                      {isUnassigned ? "카테고리 미지정" : (row.ca_name || "(이름없음)")}
                    </td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>
                      {isUnassigned ? <span style={{ fontSize: 10, color: "#aaa" }}>—</span>
                        : isHidden
                          ? <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#f5f5f5", color: "#999", fontWeight: 700 }}>비노출카테고리</span>
                          : <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#e8f8f0", color: "#8B5E3C", fontWeight: 700 }}>노출</span>}
                    </td>
                    <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: 700 }}>{Number(row.total).toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center", color: "#8B5E3C", fontWeight: 700 }}>{Number(row.use_on).toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center", color: Number(row.use_off) > 0 ? "#f5a623" : "#aaa", fontWeight: 700 }}>{Number(row.use_off).toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center", color: Number(row.soldout) > 0 ? "#e53935" : "#aaa", fontWeight: 700 }}>{Number(row.soldout).toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          if (isUnassigned) {
                            setFilterUnassigned(true); setCatL1(""); setCatL2(""); setCatL3(""); setCurPage(1);
                            load({ ...getFilters(), category: "__unassigned", page: 1 });
                          } else {
                            setFilterUnassigned(false); setCatL1(row.ca_2); setCatL2(""); setCatL3(""); setCurPage(1);
                            load({ ...getFilters(), category: row.ca_2, page: 1 });
                          }
                        }}
                        style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, border: "1px solid #8B5E3C", background: "#fff", color: "#8B5E3C", cursor: "pointer", fontWeight: 700 }}>
                        보기
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 종합 검색 패널 ── */}
      <Card style={{ marginBottom: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
          <tbody>
            {/* 검색어 */}
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ width: 90, padding: "10px 12px", background: "#f7f8f7", fontWeight: 700, color: "#444", fontSize: 13, whiteSpace: "nowrap" as const }}>검색어</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
                  <select value={searchField} onChange={e => setSearchField(e.target.value)} style={filterSel}>
                    <option value="all">전체</option>
                    <option value="name">상품명</option>
                    <option value="id">상품코드</option>
                  </select>
                  <input value={q} onChange={e => setQ(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && doSearch()}
                    placeholder="검색어를 입력하세요"
                    style={{ ...filterSel, flex: 1, minWidth: 200, maxWidth: 400 }} />
                </div>
              </td>
            </tr>

            {/* 카테고리 */}
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "10px 12px", background: "#f7f8f7", fontWeight: 700, color: "#444", whiteSpace: "nowrap" as const }}>카테고리</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
                  <select value={catL1} onChange={e => { setCatL1(e.target.value); setCatL2(""); setCatL3(""); setFilterUnassigned(false); }} style={filterSel} disabled={filterUnassigned}>
                    <option value="">1차분류</option>
                    {catTree.map(c => <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>)}
                  </select>
                  <select value={catL2} onChange={e => { setCatL2(e.target.value); setCatL3(""); }} style={filterSel} disabled={!catL2Children.length || filterUnassigned}>
                    <option value="">2차분류</option>
                    {catL2Children.map(c => <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>)}
                  </select>
                  <select value={catL3} onChange={e => setCatL3(e.target.value)} style={filterSel} disabled={!catL3Children.length || filterUnassigned}>
                    <option value="">3차분류</option>
                    {catL3Children.map(c => <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>)}
                  </select>
                  <button
                    onClick={() => { setFilterUnassigned(!filterUnassigned); setCatL1(""); setCatL2(""); setCatL3(""); }}
                    style={{
                      fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 700,
                      border: filterUnassigned ? "1.5px solid #7b1fa2" : "1.5px solid #ddd",
                      background: filterUnassigned ? "#f8f0ff" : "#fafafa",
                      color: filterUnassigned ? "#7b1fa2" : "#888",
                    }}>
                    ⚠ 카테고리 미지정만 보기
                  </button>
                </div>
              </td>
            </tr>

            {/* 날짜 */}
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "10px 12px", background: "#f7f8f7", fontWeight: 700, color: "#444", whiteSpace: "nowrap" as const }}>날짜</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={filterSel} />
                  <span style={{ color: "#aaa" }}>~</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={filterSel} />
                  <div style={{ display: "flex", gap: 4 }}>
                    {qBtn("오늘", 0)}
                    {qBtn("7일", 7)}
                    {qBtn("14일", 14)}
                    {qBtn("1개월", 30)}
                    {qBtn("3개월", 90)}
                    {qBtn("전체", null)}
                  </div>
                </div>
              </td>
            </tr>

            {/* 판매 여부 */}
            <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "10px 12px", background: "#f7f8f7", fontWeight: 700, color: "#444", whiteSpace: "nowrap" as const }}>판매 여부</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", flexWrap: "wrap" as const }}>
                  {[["", "전체"], ["0", "판매중"], ["2", "판매준비중"], ["1", "품절"]].map(([v, label]) => (
                    <label key={v} style={radioLabel}>
                      <input type="radio" name="soldout" value={v} checked={filterSoldout === v} onChange={() => setFilterSoldout(v)} />
                      {label}
                    </label>
                  ))}
                </div>
              </td>
            </tr>

            {/* 노출 여부 */}
            <tr>
              <td style={{ padding: "10px 12px", background: "#f7f8f7", fontWeight: 700, color: "#444", whiteSpace: "nowrap" as const }}>노출 여부</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", flexWrap: "wrap" as const }}>
                  {[["", "전체"], ["1", "노출"], ["0", "미노출"]].map(([v, label]) => (
                    <label key={v} style={radioLabel}>
                      <input type="radio" name="use" value={v} checked={filterUse === v} onChange={() => setFilterUse(v)} />
                      {label}
                    </label>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 검색 버튼 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, paddingTop: 14, borderTop: "1px solid #f0f0f0", marginTop: 4 }}>
          <button onClick={() => {
            setQ(""); setSearchField("all"); setCatL1(""); setCatL2(""); setCatL3("");
            setDateFrom(""); setDateTo(""); setFilterUse(""); setFilterSoldout(""); setFilterUnassigned(false);
            setCurPage(1);
            load({ page: 1, limit: perPage });
          }} style={{ padding: "8px 24px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            초기화
          </button>
          <button onClick={doSearch} style={{ padding: "8px 32px", borderRadius: 8, border: "none", background: "#8B5E3C", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            검색
          </button>
        </div>
      </Card>

      <Card>
        {/* 상단: 총 개수 + 페이지수 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "#666" }}>
            총 <strong style={{ color: "#222" }}>{total}</strong>개
            {loading && <span style={{ color: "#aaa", marginLeft: 8 }}>불러오는 중...</span>}
          </span>
          <PerPageSelect value={perPage} onChange={n => { setPerPage(n); setCurPage(1); }} total={total} />
        </div>

        {/* 범례 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: 12, color: "#888", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700 }}>노출 여부:</span>
          {Object.entries(USE_LABELS).map(([k, v]) => (
            <span key={k} style={{ padding: "2px 8px", borderRadius: 4, background: v.bg, color: v.color, fontWeight: 700 }}>{v.label}</span>
          ))}
          <span style={{ margin: "0 6px" }}>|</span>
          <span style={{ fontWeight: 700 }}>판매상태:</span>
          {Object.entries(SOLDOUT_LABELS).map(([k, v]) => (
            <span key={k} style={{ padding: "2px 8px", borderRadius: 4, background: v.bg, color: v.color, fontWeight: 700 }}>{v.label}</span>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#f5f7f5" }}>
                <Th>이미지</Th>
                <Th>상품명</Th>
                <Th>카테고리</Th>
                <Th>판매가</Th>
                <Th>1박스 입수</Th>
                <Th>노출 여부</Th>
                <Th>판매상태</Th>
                <Th>상품고시</Th>
                <Th>편집</Th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>상품이 없습니다</td></tr>
              )}
              {loading && items.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>불러오는 중...</td></tr>
              )}
              {items.map((item, i) => {
                const useInfo = USE_LABELS[item.it_use] || USE_LABELS["0"];
                const soldInfo = SOLDOUT_LABELS[item.it_soldout] || SOLDOUT_LABELS["0"];
                const isUpdating = updating?.startsWith(item.it_id);
                const hasNotice = !!(item as any).it_info && parseNotice((item as any).it_info);
                return (
                  <tr key={item.it_id} style={{ borderTop: i > 0 ? "1px solid #f0f0f0" : "none", opacity: item.it_use === "0" ? 0.6 : 1 }}>
                    <Td>
                      {item.it_img1
                        ? <img src={item.it_img1} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <div style={{ width: 44, height: 44, background: "#f0f0f0", borderRadius: 6 }} />}
                    </Td>
                    <Td>
                      <a href={`/item/${item.it_id}`} target="_blank" rel="noreferrer"
                        style={{ color: "#222", textDecoration: "none", fontWeight: 500, fontSize: 13 }}>
                        {item.it_name}
                      </a>
                    </Td>
                    <Td style={{ color: "#888", fontSize: 12 }}>{item.ca_name || "-"}</Td>
                    <Td style={{ fontWeight: 700, color: "#8B5E3C", fontSize: 13 }}>{fmtPrice(item.it_price)}</Td>

                    {/* 1박스 입수 */}
                    <Td style={{ color: "#555", fontSize: 12, textAlign: "center" as const }}>
                      {(item as any).it_2 ? `${(item as any).it_2}개` : "-"}
                    </Td>

                    {/* 노출 여부 */}
                    <Td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(["1", "0"] as const).map(v => {
                          const info = USE_LABELS[v];
                          return (
                            <button key={v} disabled={isUpdating}
                              onClick={() => item.it_use !== v && updateStatus(item.it_id, "it_use", v)}
                              style={selStyle(item.it_use === v, info.color, info.bg)}>
                              {info.label}
                            </button>
                          );
                        })}
                      </div>
                    </Td>

                    {/* 판매상태 */}
                    <Td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", opacity: item.it_use === "0" ? 0.4 : 1 }}>
                        {(["0", "2", "1"] as const).map(v => {
                          const info = SOLDOUT_LABELS[v];
                          return (
                            <button key={v} disabled={isUpdating || item.it_use === "0"}
                              onClick={() => item.it_soldout !== v && updateStatus(item.it_id, "it_soldout", v)}
                              style={selStyle(item.it_soldout === v, info.color, info.bg)}
                              title={item.it_use === "0" ? "미노출 상태에서는 변경 불가" : ""}>
                              {info.label}
                            </button>
                          );
                        })}
                      </div>
                    </Td>

                    {/* 상품고시 */}
                    <Td>
                      <button onClick={() => openNoticeEditor(item)}
                        title="상품정보고시 편집"
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700,
                          background: hasNotice ? "#e8f9f0" : "#f5f5f5",
                          color: hasNotice ? "#8B5E3C" : "#aaa",
                        }}>
                        <FileText size={12} />
                        {hasNotice ? "등록됨" : "미등록"}
                      </button>
                    </Td>

                    {/* 편집 버튼 */}
                    <Td>
                      <button onClick={() => openEditDrawer(item)}
                        title="입수 · 할인율 · 옵션 편집"
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "4px 10px", borderRadius: 6,
                          border: "1.5px solid #d0e8dc", cursor: "pointer", fontSize: 11, fontWeight: 700,
                          background: "#FDF6EE", color: "#8B5E3C",
                        }}>
                        <Settings size={12} />
                        판매정보
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Paginator page={curPage} totalPages={totalPages} onPage={p => { setCurPage(p); load({ ...getFilters(), page: p }); }} />
      </Card>

      {/* ── 판매정보 편집 드로어 ── */}
      {editItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.35)" }} onClick={() => !editSaving && setEditItem(null)} />
          <div style={{
            width: "min(680px, 97vw)", background: "#fff", height: "100%",
            overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            display: "flex", flexDirection: "column",
          }}>
            {/* 헤더 */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #eee", background: "#fafafa", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#222" }}>판매정보 편집</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{editItem.it_name}</p>
                </div>
                <button onClick={() => !editSaving && setEditItem(null)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
                  <X size={20} color="#888" />
                </button>
              </div>
            </div>

            <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
              {editLoading && <p style={{ color: "#aaa", textAlign: "center", padding: 40 }}>불러오는 중...</p>}
              {!editLoading && editForm && (() => {
                const itPrice = editForm.it_price;

                const InfoRow = ({ label, children, red }: { label: string; children: React.ReactNode; red?: boolean }) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ minWidth: 110, fontSize: 13, fontWeight: 700, color: red ? "#c0392b" : "#555" }}>{label}</span>
                    <div style={{ flex: 1 }}>{children}</div>
                  </div>
                );

                const numInput = (val: number, onChange: (n: number) => void, suffix?: string) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="number" value={val}
                      onChange={e => onChange(Number(e.target.value))}
                      style={{ ...inputStyle, width: 110, textAlign: "right" as const }} />
                    {suffix && <span style={{ fontSize: 12, color: "#888" }}>{suffix}</span>}
                  </div>
                );

                // 카테고리 셀렉트용 derived state
                const editCatL1Node = catTree.find(c => c.ca_id === editCatL1);
                const editCatL2Children = editCatL1Node?.children || [];
                const editCatL2Node = editCatL2Children.find(c => c.ca_id === editCatL2);
                const editCatL3Children = editCatL2Node?.children || [];
                const currentCatPath = flatCats.find(c => c.ca_id === editForm.ca_id)?.path || editForm.ca_id || "(미지정)";

                const selectCatFromSearch = (cat: { ca_id: string; ca_name: string; path: string }) => {
                  initEditCatLevels(cat.ca_id);
                  setEditForm(f => f && ({ ...f, ca_id: cat.ca_id }));
                  setCatSearchQ("");
                  setCatSearchOpen(false);
                };

                return (
                  <div>
                    {/* ── 카테고리 섹션 ── */}
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#8B5E3C", marginBottom: 12, borderBottom: "2px solid #F2E4D0", paddingBottom: 6 }}>
                      카테고리
                    </p>

                    {/* 현재 카테고리 표시 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: "#888", minWidth: 56 }}>현재</span>
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: 20,
                        background: editForm.ca_id ? "#e8f9f0" : "#f5f5f5",
                        color: editForm.ca_id ? "#8B5E3C" : "#aaa",
                        fontSize: 12, fontWeight: 700,
                      }}>{currentCatPath}</span>
                    </div>

                    {/* 검색 */}
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#888", minWidth: 56 }}>이름 검색</span>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input
                            type="text"
                            value={catSearchQ}
                            onChange={e => { setCatSearchQ(e.target.value); setCatSearchOpen(true); }}
                            onFocus={() => setCatSearchOpen(true)}
                            placeholder="카테고리명 입력..."
                            style={{ ...inputStyle, width: "100%", paddingRight: catSearchQ ? 28 : 10 }}
                          />
                          {catSearchQ && (
                            <button
                              onClick={() => { setCatSearchQ(""); setCatSearchOpen(false); }}
                              style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: 14, lineHeight: 1 }}>
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      {catSearchOpen && filteredCats.length > 0 && (
                        <div style={{
                          position: "absolute", left: 62, right: 0, top: "calc(100% + 4px)",
                          background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 8,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.10)", zIndex: 100,
                          maxHeight: 200, overflowY: "auto",
                        }}>
                          {filteredCats.slice(0, 20).map(cat => (
                            <button key={cat.ca_id} onClick={() => selectCatFromSearch(cat)}
                              style={{
                                display: "block", width: "100%", textAlign: "left",
                                padding: "8px 14px", background: "none", border: "none",
                                borderBottom: "1px solid #f5f5f5", cursor: "pointer",
                                fontSize: 12, color: "#333",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#FDF6EE")}
                              onMouseLeave={e => (e.currentTarget.style.background = "none")}
                            >
                              <span style={{ color: "#8B5E3C", fontWeight: 700, marginRight: 6 }}>[{cat.ca_id}]</span>
                              {cat.path}
                            </button>
                          ))}
                          {filteredCats.length > 20 && (
                            <div style={{ padding: "6px 14px", fontSize: 11, color: "#aaa" }}>
                              {filteredCats.length - 20}개 더 있음 — 더 구체적으로 입력하세요
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 계층 셀렉트 */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                      <select value={editCatL1}
                        onChange={e => {
                          const v = e.target.value;
                          setEditCatL1(v); setEditCatL2(""); setEditCatL3("");
                          setEditForm(f => f && ({ ...f, ca_id: v }));
                        }}
                        style={{ flex: 1, fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1.5px solid #e0e0e0", background: "#fafafa" }}>
                        <option value="">대분류</option>
                        {catTree.map(c => <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>)}
                      </select>
                      <select value={editCatL2} disabled={!editCatL2Children.length}
                        onChange={e => {
                          const v = e.target.value;
                          setEditCatL2(v); setEditCatL3("");
                          setEditForm(f => f && ({ ...f, ca_id: v }));
                        }}
                        style={{ flex: 1, fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1.5px solid #e0e0e0", background: "#fafafa", opacity: editCatL2Children.length ? 1 : 0.5 }}>
                        <option value="">중분류</option>
                        {editCatL2Children.map(c => <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>)}
                      </select>
                      <select value={editCatL3} disabled={!editCatL3Children.length}
                        onChange={e => {
                          const v = e.target.value;
                          setEditCatL3(v);
                          setEditForm(f => f && ({ ...f, ca_id: v }));
                        }}
                        style={{ flex: 1, fontSize: 12, padding: "7px 8px", borderRadius: 6, border: "1.5px solid #e0e0e0", background: "#fafafa", opacity: editCatL3Children.length ? 1 : 0.5 }}>
                        <option value="">소분류</option>
                        {editCatL3Children.map(c => <option key={c.ca_id} value={c.ca_id}>{c.ca_name}</option>)}
                      </select>
                    </div>

                    {/* ── 판매정보 섹션 ── */}
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#8B5E3C", marginBottom: 14, borderBottom: "2px solid #F2E4D0", paddingBottom: 6 }}>
                      판매정보
                    </p>

                    <InfoRow label="정상가">
                      {numInput(editForm.it_cust_price, v => setEditForm(f => f && ({ ...f, it_cust_price: v })), "원")}
                    </InfoRow>
                    <InfoRow label="판매가">
                      {numInput(editForm.it_price, v => setEditForm(f => {
                        if (!f) return f;
                        const newOpts = f.options.map((o, i) => {
                          const sale = Math.round(v * o.qty * (1 - o.discount / 100));
                          return { ...o, io_price: sale - v };
                        });
                        return { ...f, it_price: v, options: newOpts };
                      }), "원")}
                    </InfoRow>
                    <InfoRow label="재고수량">
                      {numInput(editForm.it_stock_qty, v => setEditForm(f => f && ({ ...f, it_stock_qty: v })), "개")}
                    </InfoRow>
                    <InfoRow label="유통기한">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="text" value={editForm.it_shelf_life}
                          onChange={e => setEditForm(f => f && ({ ...f, it_shelf_life: e.target.value }))}
                          placeholder="예: 18개월, 2026-12-31"
                          style={{ ...inputStyle, width: 160 }} />
                        <span style={{ fontSize: 12, color: "#888" }}>값이 있으면 상품 상세에 표시됩니다</span>
                      </div>
                    </InfoRow>
                    <InfoRow label="1박스 입수" red>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="number" value={editForm.box_qty ?? 0}
                          onChange={e => setEditForm(f => f && ({ ...f, box_qty: Number(e.target.value) }))}
                          style={{ ...inputStyle, width: 80, textAlign: "right" as const }} />
                        <span style={{ fontSize: 12, color: "#888" }}>개 (박스당 상품 수)</span>
                      </div>
                    </InfoRow>
                    <InfoRow label="박스당 할인율" red>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="number" value={editForm.box_discount} min={0} max={100}
                          onChange={e => setEditForm(f => f && ({ ...f, box_discount: Number(e.target.value) }))}
                          style={{ ...inputStyle, width: 80, textAlign: "right" as const }} />
                        <span style={{ fontSize: 12, color: "#888" }}>%</span>
                      </div>
                    </InfoRow>

                    {/* ── 옵션 테이블 ── */}
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#8B5E3C", marginTop: 24, marginBottom: 12, borderBottom: "2px solid #F2E4D0", paddingBottom: 6 }}>
                      상품선택옵션
                    </p>

                    {editForm.options.length === 0 && (
                      <p style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: 20 }}>등록된 옵션이 없습니다</p>
                    )}
                    {editForm.options.length > 0 && (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ ...tableStyle, fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: "#f5f7f5" }}>
                              <Th>옵션명</Th>
                              <Th>수량(입)</Th>
                              <Th>할인율</Th>
                              <Th>추가금액</Th>
                              <Th>판매금액</Th>
                              <Th>재고수량</Th>
                              <Th>사용여부</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {editForm.options.map((opt, idx) => {
                              const salePrice = itPrice + opt.io_price;
                              return (
                                <tr key={idx} style={{ borderTop: "1px solid #f0f0f0" }}>
                                  <Td>
                                    <input value={opt.io_id}
                                      onChange={e => setEditForm(f => {
                                        if (!f) return f;
                                        const opts = f.options.map((o, i) => i === idx ? { ...o, io_id: e.target.value } : o);
                                        return { ...f, options: opts };
                                      })}
                                      style={{ ...inputStyle, width: 100, fontSize: 12 }} />
                                  </Td>
                                  <Td>
                                    <input type="number" value={opt.qty} min={1}
                                      onChange={e => setEditForm(f => {
                                        if (!f) return f;
                                        const opts = f.options.map((o, i) => {
                                          if (i !== idx) return o;
                                          const newQty = Number(e.target.value) || 1;
                                          const sale = Math.round(itPrice * newQty * (1 - o.discount / 100));
                                          return { ...o, qty: newQty, io_price: sale - itPrice };
                                        });
                                        return { ...f, options: opts };
                                      })}
                                      style={{ ...inputStyle, width: 56, textAlign: "right" as const, fontSize: 12 }} />
                                  </Td>
                                  <Td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                      <input type="number" value={opt.discount} min={0} max={100}
                                        onChange={e => setEditForm(f => {
                                          if (!f) return f;
                                          const opts = f.options.map((o, i) => {
                                            if (i !== idx) return o;
                                            const disc = Number(e.target.value);
                                            const sale = Math.round(itPrice * o.qty * (1 - disc / 100));
                                            return { ...o, discount: disc, io_price: sale - itPrice };
                                          });
                                          return { ...f, options: opts };
                                        })}
                                        style={{ ...inputStyle, width: 52, textAlign: "right" as const, fontSize: 12 }} />
                                      <span style={{ color: "#888" }}>%</span>
                                    </div>
                                  </Td>
                                  <Td style={{ color: opt.io_price >= 0 ? "#333" : "#c0392b", fontWeight: 600 }}>
                                    {opt.io_price.toLocaleString()}원
                                  </Td>
                                  <Td style={{ color: "#8B5E3C", fontWeight: 700 }}>
                                    {salePrice.toLocaleString()}원
                                  </Td>
                                  <Td>
                                    <input type="number" value={opt.io_stock_qty} min={0}
                                      onChange={e => setEditForm(f => {
                                        if (!f) return f;
                                        const opts = f.options.map((o, i) => i === idx ? { ...o, io_stock_qty: Number(e.target.value) } : o);
                                        return { ...f, options: opts };
                                      })}
                                      style={{ ...inputStyle, width: 64, textAlign: "right" as const, fontSize: 12 }} />
                                  </Td>
                                  <Td>
                                    <select value={opt.io_use}
                                      onChange={e => setEditForm(f => {
                                        if (!f) return f;
                                        const opts = f.options.map((o, i) => i === idx ? { ...o, io_use: e.target.value } : o);
                                        return { ...f, options: opts };
                                      })}
                                      style={{ fontSize: 11, padding: "3px 6px", borderRadius: 4, border: "1px solid #e0e0e0" }}>
                                      <option value="1">사용</option>
                                      <option value="0">미사용</option>
                                    </select>
                                  </Td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 옵션 추가 버튼 */}
                    <button
                      onClick={() => setEditForm(f => {
                        if (!f) return f;
                        const boxIn = parseInt(f.it_shelf_life || "1") || 1;
                        const newOpt: EditOption = {
                          io_id: "", qty: 1, discount: 0,
                          io_price: 0, io_stock_qty: 9999, io_use: "1",
                        };
                        return { ...f, options: [...f.options, newOpt] };
                      })}
                      style={{ marginTop: 10, fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "1.5px dashed #8B5E3C", background: "#FDF6EE", color: "#8B5E3C", cursor: "pointer", fontWeight: 700 }}>
                      + 옵션 추가
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* 푸터 저장 버튼 */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #eee", background: "#fafafa", flexShrink: 0, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => !editSaving && setEditItem(null)}
                style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                취소
              </button>
              <button onClick={saveEdit} disabled={editSaving || !editForm}
                style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: "#8B5E3C", color: "#fff", fontSize: 13, fontWeight: 800, cursor: editSaving ? "not-allowed" : "pointer", opacity: editSaving ? 0.7 : 1 }}>
                {editSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 상품정보고시 편집 드로어 ── */}
      {noticeItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.35)" }} onClick={() => setNoticeItem(null)} />
          <div style={{
            width: "min(600px, 95vw)", background: "#fff", height: "100%",
            overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            display: "flex", flexDirection: "column",
          }}>
            {/* 드로어 헤더 */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #eee", background: "#fafafa", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#222" }}>상품정보고시</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{noticeItem.it_name}</p>
                </div>
                <button onClick={() => setNoticeItem(null)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
                  <X size={20} color="#888" />
                </button>
              </div>
            </div>

            <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
              {/* 상품군 선택 */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>
                  상품군 선택
                  <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400, marginLeft: 6 }}>상품군을 선택하면 항목이 자동으로 변경됩니다</span>
                </label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select
                    value={noticeData.category}
                    onChange={e => {
                      const cat = e.target.value;
                      setNoticeData({ category: cat, fields: {} });
                    }}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 13, color: "#333", outline: "none" }}
                  >
                    <option value="">상품군을 선택하세요</option>
                    {NOTICE_CATEGORIES.map(c => (
                      <option key={c.key} value={c.key}>{c.title}</option>
                    ))}
                  </select>
                  {noticeCategory && (
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={allFilled}
                        onChange={e => fillAll(e.target.checked)}
                        style={{ width: 15, height: 15, cursor: "pointer" }}
                      />
                      상품상세 참조로 전체 입력
                    </label>
                  )}
                </div>
              </div>

              {/* 고시 항목들 */}
              {noticeCategory ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid #e0e0e0", borderRadius: 10, overflow: "hidden" }}>
                  {noticeCategory.fields.map((field, idx) => (
                    <div key={field.key}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 0,
                        borderTop: idx > 0 ? "1px solid #f0f0f0" : "none",
                      }}>
                      <div style={{
                        width: 180, flexShrink: 0, padding: "10px 14px",
                        background: "#f8f8f8", fontSize: 12, fontWeight: 600, color: "#555",
                        lineHeight: 1.4, borderRight: "1px solid #eee", minHeight: 42,
                        display: "flex", alignItems: "center",
                      }}>
                        <div>
                          <div>{field.label}</div>
                          {field.hint && <div style={{ fontSize: 10, color: "#aaa", fontWeight: 400, marginTop: 2 }}>{field.hint}</div>}
                        </div>
                      </div>
                      <input
                        value={noticeData.fields[field.key] || ""}
                        onChange={e => setNoticeData(prev => ({
                          ...prev,
                          fields: { ...prev.fields, [field.key]: e.target.value },
                        }))}
                        placeholder="내용 입력"
                        style={{
                          flex: 1, padding: "10px 12px", border: "none", outline: "none",
                          fontSize: 13, color: "#333", background: "#fff", minHeight: 42,
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#aaa", fontSize: 13 }}>
                  상품군을 먼저 선택해주세요
                </div>
              )}
            </div>

            {/* 드로어 푸터 */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #eee", background: "#fafafa", flexShrink: 0, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setNoticeItem(null)}
                style={{ padding: "10px 20px", border: "1px solid #e0e0e0", borderRadius: 8, background: "#fff", color: "#666", fontSize: 13, cursor: "pointer" }}>
                취소
              </button>
              <button onClick={saveNotice} disabled={noticeSaving || !noticeData.category}
                style={{ padding: "10px 24px", border: "none", borderRadius: 8, background: noticeSaving || !noticeData.category ? "#ccc" : "#8B5E3C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: noticeSaving || !noticeData.category ? "default" : "pointer" }}>
                {noticeSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pending Members ──────────────────────────────────────────────────────────

function PendingMembers({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pending-members", { headers: authHeaders() })
      .then(r => r.json()).then(d => setMembers(d.members || []))
      .finally(() => setLoading(false));
  }, []);

  const approve = async (mb_id: string) => {
    setActionId(mb_id);
    try {
      const res = await fetch(`/api/admin/members/${mb_id}/approve`, { method: "POST", headers: authHeaders() });
      if (!res.ok) throw new Error();
      setMembers(prev => prev.filter(m => m.mb_id !== mb_id));
      setSelected(prev => { const s = new Set(prev); s.delete(mb_id); return s; });
      toast(`${mb_id} 승인 완료`);
    } catch { toast("승인 실패", "err"); }
    finally { setActionId(null); }
  };

  const reject = async (mb_id: string) => {
    if (!confirm(`${mb_id} 회원을 거절하시겠습니까?`)) return;
    setActionId(mb_id + "_r");
    try {
      await fetch(`/api/admin/members/${mb_id}/reject`, { method: "POST", headers: authHeaders() });
      setMembers(prev => prev.filter(m => m.mb_id !== mb_id));
      setSelected(prev => { const s = new Set(prev); s.delete(mb_id); return s; });
      toast(`${mb_id} 거절 완료`);
    } catch { toast("처리 실패", "err"); }
    finally { setActionId(null); }
  };

  const toggleOne = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selectAll = () => setSelected(new Set(members.map(m => m.mb_id)));
  const deselectAll = () => setSelected(new Set());

  const bulkApprove = async () => {
    if (!confirm(`선택한 ${selected.size}명을 일괄 승인하시겠습니까?`)) return;
    setBulkAction(true);
    const ids = [...selected];
    let ok = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/members/${id}/approve`, { method: "POST", headers: authHeaders() });
        if (res.ok) { setMembers(prev => prev.filter(m => m.mb_id !== id)); ok++; }
      } catch { /* continue */ }
    }
    setSelected(new Set());
    setBulkAction(false);
    toast(`${ok}명 일괄 승인 완료`);
  };

  const bulkReject = async () => {
    if (!confirm(`선택한 ${selected.size}명을 일괄 거절하시겠습니까?`)) return;
    setBulkAction(true);
    const ids = [...selected];
    let ok = 0;
    for (const id of ids) {
      try {
        await fetch(`/api/admin/members/${id}/reject`, { method: "POST", headers: authHeaders() });
        setMembers(prev => prev.filter(m => m.mb_id !== id)); ok++;
      } catch { /* continue */ }
    }
    setSelected(new Set());
    setBulkAction(false);
    toast(`${ok}명 일괄 거절 완료`);
  };

  const allSelected = members.length > 0 && members.every(m => selected.has(m.mb_id));

  return (
    <div>
      <PageHeader title={`승인 대기 (${members.length}명)`} sub="회원가입 후 승인 대기 중인 B2B 회원입니다" />
      {loading && <p style={{ textAlign: "center", color: "#aaa" }}>불러오는 중...</p>}
      {!loading && members.length === 0 && <Card><p style={{ textAlign: "center", color: "#aaa" }}>승인 대기 중인 회원이 없습니다</p></Card>}
      {!loading && members.length > 0 && (
        <>
          {selected.size > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
              background: "#fff8f0", border: "1px solid #f59e0b", borderRadius: 8, marginBottom: 12, flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>{selected.size}명 선택됨</span>
              <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
                {selected.size < members.length && (
                  <button onClick={selectAll} style={{ fontSize: 12, padding: "5px 12px", border: "1px solid #d97706", borderRadius: 6, background: "#fff", color: "#92400e", cursor: "pointer" }}>전체 선택</button>
                )}
                <button onClick={deselectAll} style={{ fontSize: 12, padding: "5px 12px", border: "1px solid #ccc", borderRadius: 6, background: "#fff", color: "#555", cursor: "pointer" }}>선택해제</button>
                <button onClick={bulkApprove} disabled={bulkAction}
                  style={{ fontSize: 12, padding: "5px 14px", border: "none", borderRadius: 6, background: "#8B5E3C", color: "#fff", fontWeight: 700, cursor: bulkAction ? "not-allowed" : "pointer", opacity: bulkAction ? 0.7 : 1 }}>
                  {bulkAction ? "처리 중..." : `일괄승인 (${selected.size})`}
                </button>
                <button onClick={bulkReject} disabled={bulkAction}
                  style={{ fontSize: 12, padding: "5px 14px", border: "none", borderRadius: 6, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: bulkAction ? "not-allowed" : "pointer", opacity: bulkAction ? 0.7 : 1 }}>
                  일괄거절 ({selected.size})
                </button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <label style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={allSelected} onChange={() => allSelected ? deselectAll() : selectAll()} style={{ width: 15, height: 15 }} />
              전체 선택 ({members.length}명)
            </label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {members.map(m => {
              const isSel = selected.has(m.mb_id);
              return (
                <Card key={m.mb_id} style={{ border: "1px solid " + (isSel ? "#f59e0b" : "#e8e8e8"), background: isSel ? "#fff8f0" : "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1 }}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleOne(m.mb_id)}
                        style={{ width: 15, height: 15, flexShrink: 0, marginTop: 4, cursor: "pointer" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{m.mb_name}</span>
                          <span style={{ fontSize: 12, color: "#888", background: "#f5f5f5", padding: "2px 8px", borderRadius: 4 }}>{m.mb_id}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "5px 20px", fontSize: 13, color: "#555" }}>
                          <div><strong>상호명:</strong> {m.company_name || "-"}</div>
                          <div><strong>사업자번호:</strong> {m.business_number || "-"}</div>
                          <div><strong>대표자:</strong> {m.representative || "-"}</div>
                          <div><strong>이메일:</strong> {m.mb_email || "-"}</div>
                          <div><strong>연락처:</strong> {m.mb_hp || "-"}</div>
                          <div><strong>가입일:</strong> {fmtDate(m.mb_datetime)}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <Btn onClick={() => approve(m.mb_id)} disabled={actionId === m.mb_id || bulkAction} color="#8B5E3C">
                        {actionId === m.mb_id ? "처리중..." : "승인"}
                      </Btn>
                      <Btn onClick={() => reject(m.mb_id)} disabled={actionId === m.mb_id + "_r" || bulkAction} color="#ef4444">거절</Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── All Members ──────────────────────────────────────────────────────────────

function AllMembers({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [perPage, setPerPage] = useState(20);
  const [curPage, setCurPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/members?limit=1000", { headers: authHeaders() })
      .then(r => r.json()).then(d => setMembers(d.members || []))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(members.length / perPage));
  const paged = members.slice((curPage - 1) * perPage, curPage * perPage);
  const pagedIds = paged.filter(m => m.mb_level < 10).map(m => m.mb_id);
  const allPageSelected = pagedIds.length > 0 && pagedIds.every(id => selected.has(id));

  const toggleOne = (id: string, level: number) => {
    if (level >= 10) return;
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const togglePageAll = () => {
    if (allPageSelected) setSelected(prev => { const s = new Set(prev); pagedIds.forEach(id => s.delete(id)); return s; });
    else setSelected(prev => { const s = new Set(prev); pagedIds.forEach(id => s.add(id)); return s; });
  };
  const selectAll = () => setSelected(new Set(members.filter(m => m.mb_level < 10).map(m => m.mb_id)));
  const deselectAll = () => setSelected(new Set());

  const deleteSelected = async () => {
    if (!confirm(`선택한 ${selected.size}명의 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/members/batch-delete", {
        method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ member_ids: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers(prev => prev.filter(m => !selected.has(m.mb_id)));
      setSelected(new Set());
      toast(`${data.deleted}명 삭제 완료`);
    } catch (e: any) { toast(e.message || "삭제 실패", "err"); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <PageHeader title="전체 회원" sub="가입된 모든 회원 목록입니다" />
      <Card>
        {loading && <p style={{ textAlign: "center", color: "#aaa" }}>불러오는 중...</p>}
        {!loading && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <PerPageSelect value={perPage} onChange={n => { setPerPage(n); setCurPage(1); }} total={members.length} />
            </div>
            <SelectDeleteBar
              selected={selected.size} total={members.filter(m => m.mb_level < 10).length}
              onSelectAll={selectAll} onDeselectAll={deselectAll}
              onDelete={deleteSelected} deleting={deleting}
            />
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr style={{ background: "#f5f7f5" }}>
                  <th style={{ padding: "11px 12px", width: 36 }}>
                    <input type="checkbox" checked={allPageSelected} onChange={togglePageAll}
                      style={{ cursor: "pointer", width: 15, height: 15 }} />
                  </th>
                  {["아이디", "이름", "상호명", "이메일", "연락처", "등급", "가입일"].map(h => <Th key={h}>{h}</Th>)}
                </tr></thead>
                <tbody>
                  {paged.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>회원이 없습니다</td></tr>
                  )}
                  {paged.map((m, i) => {
                    const isAdmin = m.mb_level >= 10;
                    const isSel = selected.has(m.mb_id);
                    return (
                      <tr key={m.mb_id} onClick={() => toggleOne(m.mb_id, m.mb_level)}
                        style={{ borderTop: i > 0 ? "1px solid #f0f0f0" : "none", background: isSel ? "#fff8f0" : i % 2 === 0 ? "#fff" : "#fafafa", cursor: isAdmin ? "default" : "pointer" }}>
                        <td style={{ padding: "11px 12px" }}>
                          <input type="checkbox" checked={isSel} disabled={isAdmin} readOnly
                            style={{ cursor: isAdmin ? "not-allowed" : "pointer", width: 15, height: 15 }} />
                        </td>
                        <Td style={{ fontWeight: 600 }}>{m.mb_id}</Td>
                        <Td>{m.mb_name}</Td>
                        <Td style={{ color: "#555" }}>{m.company_name || "-"}</Td>
                        <Td style={{ color: "#555" }}>{m.mb_email || "-"}</Td>
                        <Td style={{ color: "#555" }}>{m.mb_hp || "-"}</Td>
                        <Td>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                            background: isAdmin ? "#defaec" : m.mb_level >= 2 ? "#e8f4ff" : "#fff3e0",
                            color: isAdmin ? "#8B5E3C" : m.mb_level >= 2 ? "#1a73e8" : "#f59e0b",
                          }}>
                            {isAdmin ? "관리자" : m.mb_level >= 2 ? "승인됨" : "대기중"}
                          </span>
                        </Td>
                        <Td style={{ color: "#888", fontSize: 12 }}>{fmtDate(m.mb_datetime)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Paginator page={curPage} totalPages={totalPages} onPage={setCurPage} />
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function OrderList({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [perPage, setPerPage] = useState(20);
  const [curPage, setCurPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/orders?limit=1000", { headers: authHeaders() })
      .then(r => r.json()).then(d => {
        const os = d.orders || [];
        setOrders(os);
        const m: Record<string, string> = {};
        os.forEach((o: Order) => { m[o.od_id] = o.od_status; });
        setStatuses(m);
      }).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (od_id: string, status: string) => {
    setActionId(od_id);
    try {
      const res = await fetch(`/api/orders/${od_id}/status`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ od_status: status }),
      });
      if (!res.ok) throw new Error();
      setStatuses(prev => ({ ...prev, [od_id]: status }));
      toast("주문 상태 변경 완료");
    } catch { toast("변경 실패", "err"); }
    finally { setActionId(null); }
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / perPage));
  const paged = orders.slice((curPage - 1) * perPage, curPage * perPage);
  const pagedIds = paged.map(o => o.od_id);
  const allPageSelected = pagedIds.length > 0 && pagedIds.every(id => selected.has(id));

  const toggleOne = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const togglePageAll = () => {
    if (allPageSelected) setSelected(prev => { const s = new Set(prev); pagedIds.forEach(id => s.delete(id)); return s; });
    else setSelected(prev => { const s = new Set(prev); pagedIds.forEach(id => s.add(id)); return s; });
  };
  const selectAll = () => setSelected(new Set(orders.map(o => o.od_id)));
  const deselectAll = () => setSelected(new Set());

  const deleteSelected = async () => {
    if (!confirm(`선택한 ${selected.size}건의 주문을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/orders/batch-delete", {
        method: "DELETE", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(prev => prev.filter(o => !selected.has(o.od_id)));
      setSelected(new Set());
      toast(`${data.deleted}건 삭제 완료`);
    } catch (e: any) { toast(e.message || "삭제 실패", "err"); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <PageHeader title="주문 관리" sub="고객 주문 목록 및 상태를 관리합니다" />
      <Card>
        {loading && <p style={{ textAlign: "center", color: "#aaa" }}>불러오는 중...</p>}
        {!loading && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <PerPageSelect value={perPage} onChange={n => { setPerPage(n); setCurPage(1); }} total={orders.length} />
            </div>
            <SelectDeleteBar
              selected={selected.size} total={orders.length}
              onSelectAll={selectAll} onDeselectAll={deselectAll}
              onDelete={deleteSelected} deleting={deleting}
            />
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr style={{ background: "#f5f7f5" }}>
                  <th style={{ padding: "11px 12px", width: 36 }}>
                    <input type="checkbox" checked={allPageSelected} onChange={togglePageAll}
                      style={{ cursor: "pointer", width: 15, height: 15 }} />
                  </th>
                  {["주문번호", "상호명", "주문자", "연락처", "금액", "상태", "주문일"].map(h => <Th key={h}>{h}</Th>)}
                </tr></thead>
                <tbody>
                  {paged.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>주문이 없습니다</td></tr>}
                  {paged.map((o, i) => {
                    const st = statuses[o.od_id] || o.od_status;
                    const info = STATUS_LABELS[st] || { label: st, color: "#888" };
                    const isSel = selected.has(o.od_id);
                    return (
                      <tr key={o.od_id} style={{ borderTop: i > 0 ? "1px solid #f0f0f0" : "none", background: isSel ? "#fff8f0" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "11px 12px" }} onClick={() => toggleOne(o.od_id)}>
                          <input type="checkbox" checked={isSel} readOnly style={{ cursor: "pointer", width: 15, height: 15 }} />
                        </td>
                        <Td style={{ fontWeight: 600, fontSize: 11 }}>{o.od_id}</Td>
                        <Td>{o.company_name || o.mb_id || "비회원"}</Td>
                        <Td>{o.mb_name || o.od_name}</Td>
                        <Td style={{ color: "#555" }}>{o.od_hp}</Td>
                        <Td style={{ fontWeight: 700 }}>{fmtPrice(o.od_receipt_price)}</Td>
                        <Td>
                          <select value={st} onChange={e => { e.stopPropagation(); updateStatus(o.od_id, e.target.value); }}
                            onClick={e => e.stopPropagation()}
                            disabled={actionId === o.od_id}
                            style={{ border: "none", background: info.color + "22", color: info.color, borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            {Object.entries(STATUS_LABELS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                          </select>
                        </Td>
                        <Td style={{ color: "#888", fontSize: 12 }}>{fmtDate(o.od_time)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Paginator page={curPage} totalPages={totalPages} onPage={setCurPage} />
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Review List ──────────────────────────────────────────────────────────────

function ReviewList({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [perPage, setPerPage] = useState(20);
  const [curPage, setCurPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/shop-admin/reviews", { headers: authHeaders() })
      .then(r => r.json()).then(d => setReviews(d.reviews || []))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: number) => {
    setActionId(id);
    try {
      await fetch(`/api/shop-admin/reviews/${id}/toggle`, { method: "PATCH", headers: authHeaders() });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_visible: r.is_visible ? 0 : 1 } : r));
    } catch { toast("처리 실패", "err"); }
    finally { setActionId(null); }
  };

  const remove = async (id: number) => {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;
    setActionId(id);
    try {
      await fetch(`/api/shop-admin/reviews/${id}`, { method: "DELETE", headers: authHeaders() });
      setReviews(prev => prev.filter(r => r.id !== id));
      toast("삭제 완료");
    } catch { toast("삭제 실패", "err"); }
    finally { setActionId(null); }
  };

  const totalPages = Math.max(1, Math.ceil(reviews.length / perPage));
  const paged = reviews.slice((curPage - 1) * perPage, curPage * perPage);
  const pagedIds = paged.map(r => r.id);
  const allPageSelected = pagedIds.length > 0 && pagedIds.every(id => selected.has(id));

  const toggleOne = (id: number) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const togglePageAll = () => {
    if (allPageSelected) setSelected(prev => { const s = new Set(prev); pagedIds.forEach(id => s.delete(id)); return s; });
    else setSelected(prev => { const s = new Set(prev); pagedIds.forEach(id => s.add(id)); return s; });
  };
  const selectAll = () => setSelected(new Set(reviews.map(r => r.id)));
  const deselectAll = () => setSelected(new Set());

  const deleteSelected = async () => {
    if (!confirm(`선택한 ${selected.size}건의 리뷰를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/shop-admin/reviews/batch-delete", {
        method: "DELETE", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ review_ids: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviews(prev => prev.filter(r => !selected.has(r.id)));
      setSelected(new Set());
      toast(`${data.deleted}건 삭제 완료`);
    } catch (e: any) { toast(e.message || "삭제 실패", "err"); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <PageHeader title="리뷰 관리" sub="고객 상품 리뷰를 관리합니다" />
      <Card>
        {loading && <p style={{ textAlign: "center", color: "#aaa" }}>불러오는 중...</p>}
        {!loading && reviews.length === 0 && (
          <p style={{ textAlign: "center", color: "#aaa", padding: "24px 0" }}>
            등록된 리뷰가 없습니다. 마이페이지에서 고객이 리뷰를 작성하면 여기에 표시됩니다.
          </p>
        )}
        {!loading && reviews.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <PerPageSelect value={perPage} onChange={n => { setPerPage(n); setCurPage(1); }} total={reviews.length} />
            </div>
            <SelectDeleteBar
              selected={selected.size} total={reviews.length}
              onSelectAll={selectAll} onDeselectAll={deselectAll}
              onDelete={deleteSelected} deleting={deleting}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {paged.map(r => {
                const isSel = selected.has(r.id);
                return (
                  <div key={r.id}
                    onClick={() => toggleOne(r.id)}
                    style={{ padding: "14px", border: "1px solid " + (isSel ? "#f59e0b" : "#f0f0f0"), borderRadius: 8, opacity: r.is_visible ? 1 : 0.5, background: isSel ? "#fff8f0" : "#fff", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1 }}>
                        <input type="checkbox" checked={isSel} readOnly
                          style={{ cursor: "pointer", width: 15, height: 15, flexShrink: 0, marginTop: 3 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{r.author || r.mb_id}</span>
                            <span style={{ fontSize: 12, color: "#888" }}>{r.it_name}</span>
                            <span style={{ fontSize: 12, color: "#f59e0b" }}>{"★".repeat(r.rating)}</span>
                            {!r.is_visible && <span style={{ fontSize: 11, color: "#ef4444", background: "#fff3f3", padding: "1px 6px", borderRadius: 4 }}>숨김</span>}
                          </div>
                          <p style={{ fontSize: 13, color: "#444", margin: 0 }}>{r.content}</p>
                          <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>{fmtDate(r.created_at)}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggle(r.id)} disabled={actionId === r.id}
                          style={{ border: "none", background: r.is_visible ? "#f5f5f5" : "#e8f9f0", borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: r.is_visible ? "#888" : "#8B5E3C" }}>
                          {r.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <Btn onClick={() => remove(r.id)} disabled={actionId === r.id} color="#ef4444"><Trash2 size={13} /></Btn>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <label style={{ fontSize: 13, color: "#888", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={allPageSelected} onChange={togglePageAll} style={{ width: 15, height: 15 }} />
                현재 페이지 전체 선택
              </label>
            </div>
            <Paginator page={curPage} totalPages={totalPages} onPage={setCurPage} />
          </>
        )}
      </Card>
    </div>
  );
}

// ─── 기본설정 관리 컴포넌트 ───────────────────────────────────────────────────

// ─── 사업자/푸터 정보 관리 ─────────────────────────────────────────────────────

interface FooterCfg {
  company: string; ceo: string; address: string; business_num: string;
  tel: string; online_num: string; privacy: string;
  cs_tel: string; cs_hours: string; cs_lunch: string;
  bank_name: string; bank_num: string; bank_holder: string;
}

const FOOTER_DEFAULTS: FooterCfg = {
  company: "주식회사 와이앤에이치에스", ceo: "윤석민",
  address: "서울특별시 중랑구 용마산로 536(망우동)", business_num: "429-81-03401",
  tel: "", online_num: "", privacy: "윤석민",
  cs_tel: "", cs_hours: "평일 : 10:00~ 18:00",
  cs_lunch: "점심시간 : 12:00 ~ 13:00 일요일 / 공휴일 휴무",
  bank_name: "", bank_num: "", bank_holder: "",
};

// ─── 이벤트 관리 ─────────────────────────────────────────────────────────────

interface ShopEvent {
  id: number;
  title: string;
  thumbnail: string;
  content: string;
  start_date: string;
  end_date: string;
  is_active: number;
  sort_order: number;
  created_at: string;
}

const EMPTY_EVENT: Partial<ShopEvent> = {
  title: "", thumbnail: "", content: "", start_date: "", end_date: "", is_active: 1, sort_order: 0,
};

// ─── 고객센터 안내 게시판 관리 ───────────────────────────────────────────────
interface CsPost {
  id: number;
  title: string;
  content: string;
  is_notice: number;
  is_active: number;
  sort_order: number;
  created_by: string;
  created_at: string;
}

function CsBoardManager({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [posts, setPosts] = useState<CsPost[]>([]);
  const [editing, setEditing] = useState<Partial<CsPost> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/cs", { headers: authHeaders() });
    const d = await r.json();
    setPosts(Array.isArray(d) ? d : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!editing) return;
    if (!editing.title?.trim() || !editing.content?.trim()) { toast("제목과 내용을 입력하세요", "err"); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const url = isNew ? "/api/boards/cs" : `/api/boards/cs/${editing.id}`;
      const method = isNew ? "POST" : "PUT";
      const r = await fetch(url, {
        method, headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!r.ok) throw new Error();
      toast(isNew ? "등록 완료" : "수정 완료");
      setEditing(null);
      load();
    } catch {
      toast("저장에 실패했습니다", "err");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/boards/cs/${id}`, { method: "DELETE", headers: authHeaders() });
    toast("삭제되었습니다");
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>고객센터 안내 게시판</h2>
        <button
          onClick={() => setEditing({ title: "", content: "", is_notice: 0, is_active: 1, sort_order: 0 })}
          style={{ background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >+ 새 게시글</button>
      </div>

      {editing && (
        <div style={{ background: "#f8faf9", border: "1.5px solid #DEC4A8", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>{editing.id ? "게시글 수정" : "새 게시글"}</h3>
          <input
            value={editing.title || ""}
            onChange={e => setEditing(p => ({ ...p!, title: e.target.value }))}
            placeholder="제목"
            style={{ width: "100%", border: "1.5px solid #d0e8d8", borderRadius: 8, padding: "10px 14px", fontSize: 14, marginBottom: 10, boxSizing: "border-box" }}
          />
          <textarea
            value={editing.content || ""}
            onChange={e => setEditing(p => ({ ...p!, content: e.target.value }))}
            placeholder="내용"
            rows={6}
            style={{ width: "100%", border: "1.5px solid #d0e8d8", borderRadius: 8, padding: "10px 14px", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#8B5E3C", cursor: "pointer" }}>
              <input type="checkbox" checked={editing.is_notice === 1} onChange={e => setEditing(p => ({ ...p!, is_notice: e.target.checked ? 1 : 0 }))} style={{ width: 15, height: 15, accentColor: "#8B5E3C" }} />
              공지 (상단 고정)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555", cursor: "pointer" }}>
              <input type="checkbox" checked={editing.is_active !== 0} onChange={e => setEditing(p => ({ ...p!, is_active: e.target.checked ? 1 : 0 }))} style={{ width: 15, height: 15 }} />
              공개
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555" }}>
              정렬:
              <input type="number" value={editing.sort_order ?? 0} onChange={e => setEditing(p => ({ ...p!, sort_order: Number(e.target.value) }))} style={{ width: 60, border: "1px solid #d0e8d8", borderRadius: 6, padding: "4px 8px", fontSize: 13, textAlign: "center" }} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(null)} style={{ padding: "9px 20px", border: "1px solid #ccc", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>취소</button>
            <button onClick={save} disabled={saving} style={{ padding: "9px 20px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#bbb", fontSize: 14 }}>등록된 게시글이 없습니다</div>
      ) : (
        <div style={{ borderTop: "2px solid #1a1a1a" }}>
          {posts.map(p => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 12px",
              borderBottom: "1px solid #efefef", background: p.is_active === 0 ? "#fafafa" : "#fff",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {p.is_notice === 1 && <span style={{ background: "#8B5E3C", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>공지</span>}
                  {p.is_active === 0 && <span style={{ background: "#e0e0e0", color: "#888", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>비공개</span>}
                  <span style={{ fontSize: 14, fontWeight: 600, color: p.is_active === 0 ? "#aaa" : "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                </div>
                <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>{p.created_at?.slice(0, 10)} · 정렬 {p.sort_order}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => setEditing({ ...p })} style={{ padding: "5px 12px", border: "1px solid #DEC4A8", borderRadius: 6, background: "#fff", color: "#8B5E3C", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>수정</button>
                <button onClick={() => remove(p.id)} style={{ padding: "5px 12px", border: "1px solid #fcc", borderRadius: 6, background: "#fff", color: "#e53935", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventManager({ authHeaders, toast }: { authHeaders: () => Record<string, string>; toast: (m: string, t?: "ok" | "err") => void }) {
  const [events, setEvents] = useState<ShopEvent[]>([]);
  const [editing, setEditing] = useState<Partial<ShopEvent> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/shop-events", { headers: authHeaders() });
    const d = await r.json();
    setEvents(d.events || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) { toast("제목을 입력하세요", "err"); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const url = isNew ? "/api/shop-events" : `/api/shop-events/${editing.id}`;
      const method = isNew ? "POST" : "PUT";
      const r = await fetch(url, {
        method, headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!r.ok) throw new Error();
      toast(isNew ? "이벤트 등록 완료" : "이벤트 수정 완료");
      setEditing(null);
      load();
    } catch { toast("저장 실패", "err"); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("이벤트를 삭제하시겠습니까?")) return;
    await fetch(`/api/shop-events/${id}`, { method: "DELETE", headers: authHeaders() });
    toast("삭제 완료");
    load();
  };

  const toggleActive = async (ev: ShopEvent) => {
    await fetch(`/api/shop-events/${ev.id}`, {
      method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ...ev, is_active: ev.is_active ? 0 : 1 }),
    });
    load();
  };

  if (editing) {
    return (
      <div>
        <PageHeader
          title={editing.id ? "이벤트 수정" : "이벤트 등록"}
          sub="이벤트 정보를 입력하세요"
          action={<button onClick={() => setEditing(null)} style={{ background: "#f5f5f5", border: "none", borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>← 목록</button>}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 700 }}>
          <FormField label="제목 *" value={editing.title || ""} onChange={v => setEditing(e => ({ ...e, title: v }))} placeholder="이벤트 제목" />
          <FormField label="썸네일 URL" value={editing.thumbnail || ""} onChange={v => setEditing(e => ({ ...e, thumbnail: v }))} placeholder="https://..." />
          {editing.thumbnail && (
            <div style={{ marginTop: -8 }}>
              <img src={editing.thumbnail} alt="미리보기" style={{ maxWidth: 320, maxHeight: 160, borderRadius: 8, border: "1px solid #eee", objectFit: "cover" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="시작일" value={editing.start_date || ""} onChange={v => setEditing(e => ({ ...e, start_date: v }))} type="date" placeholder="" />
            <FormField label="종료일" value={editing.end_date || ""} onChange={v => setEditing(e => ({ ...e, end_date: v }))} type="date" placeholder="" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>활성화</label>
              <select value={editing.is_active ?? 1} onChange={e => setEditing(ev => ({ ...ev, is_active: Number(e.target.value) }))} style={inputStyle}>
                <option value={1}>활성</option>
                <option value={0}>비활성</option>
              </select>
            </div>
            <FormField label="정렬순서" value={String(editing.sort_order ?? 0)} onChange={v => setEditing(e => ({ ...e, sort_order: Number(v) || 0 }))} type="number" placeholder="0" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>내용 (HTML 직접 입력 가능)</label>
            <textarea
              value={editing.content || ""}
              onChange={e => setEditing(ev => ({ ...ev, content: e.target.value }))}
              placeholder="이벤트 내용을 입력하세요. HTML 태그 사용 가능합니다."
              rows={14}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 13, lineHeight: 1.5 }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
            <button onClick={() => setEditing(null)} style={{ background: "#f5f5f5", border: "none", borderRadius: 7, padding: "10px 20px", cursor: "pointer", fontSize: 13 }}>취소</button>
            <button onClick={save} disabled={saving} style={{ background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 7, padding: "10px 24px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="이벤트관리"
        sub="쇼핑몰 이벤트 페이지에 표시되는 이벤트를 관리합니다"
        action={<button onClick={() => setEditing({ ...EMPTY_EVENT })} style={{ background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}><Plus size={13} /> 이벤트 추가</button>}
      />
      {events.length === 0 && <p style={{ textAlign: "center", color: "#aaa", padding: "40px 0" }}>등록된 이벤트가 없습니다</p>}
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee", background: "#fafafa" }}>
              <Th>썸네일</Th>
              <Th>제목</Th>
              <Th>기간</Th>
              <Th>정렬</Th>
              <Th>상태</Th>
              <Th>관리</Th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <Td>
                  {ev.thumbnail
                    ? <img src={ev.thumbnail} alt="" style={{ width: 72, height: 40, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <div style={{ width: 72, height: 40, background: "#f3f4f6", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#bbb" }}>없음</div>
                  }
                </Td>
                <Td style={{ fontWeight: 600, maxWidth: 280 }}>{ev.title}</Td>
                <Td style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>
                  {ev.start_date ? ev.start_date.slice(0, 10) : ""}
                  {ev.start_date && ev.end_date ? " ~ " : ""}
                  {ev.end_date ? ev.end_date.slice(0, 10) : ""}
                  {!ev.start_date && !ev.end_date ? "-" : ""}
                </Td>
                <Td>{ev.sort_order}</Td>
                <Td>
                  <button
                    onClick={() => toggleActive(ev)}
                    style={{ background: ev.is_active ? "#dcfce7" : "#f3f4f6", color: ev.is_active ? "#8B5E3C" : "#888", border: "none", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    {ev.is_active ? "활성" : "비활성"}
                  </button>
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setEditing(ev)} style={{ background: "#f0f4ff", color: "#3b5bdb", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                      <Edit2 size={11} /> 수정
                    </button>
                    <button onClick={() => del(ev.id)} style={{ background: "#fff0f0", color: "#e53e3e", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                      <Trash2 size={11} /> 삭제
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FooterConfigManager({ authHeaders, toast }: {
  authHeaders: () => Record<string, string>;
  toast: (msg: string, type?: "ok" | "err") => void;
}) {
  const [cfg, setCfg] = useState<FooterCfg>(FOOTER_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/shop-admin/footer-config", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setCfg(prev => ({ ...prev, ...d })); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const set = (key: keyof FooterCfg, value: string) =>
    setCfg(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/shop-admin/footer-config", {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error();
      toast("저장되었습니다!");
    } catch { toast("저장 실패", "err"); }
    setSaving(false);
  };

  if (!loaded) return <div style={{ padding: 40, color: "#aaa", textAlign: "center" }}>불러오는 중…</div>;

  const field = (label: string, key: keyof FooterCfg, placeholder = "") => (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>{label}</label>
      <input
        type="text"
        value={cfg[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );

  return (
    <div>
      <PageHeader title="사업자/푸터 정보" sub="쇼핑몰 하단 푸터에 표시되는 사업자 정보를 관리합니다" />

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#333", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>사업자 기본 정보</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {field("법인명", "company", "주식회사 와이앤에이치에스")}
          {field("대표자", "ceo", "윤석민")}
          {field("사업자등록번호", "business_num", "429-81-03401")}
          {field("전화번호", "tel", "02-0000-0000")}
          <div style={{ gridColumn: "1 / -1" }}>
            {field("주소", "address", "서울특별시 중랑구 용마산로 536(망우동)")}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            {field("통신판매업신고번호", "online_num", "제 0000-서울중랑-0000호")}
          </div>
          {field("개인정보책임자", "privacy", "윤석민")}
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#333", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>고객센터 정보</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {field("고객센터 전화", "cs_tel", "02-0000-0000")}
          {field("운영시간", "cs_hours", "평일 : 10:00~ 18:00")}
          <div style={{ gridColumn: "1 / -1" }}>
            {field("점심/휴무 안내", "cs_lunch", "점심시간 : 12:00 ~ 13:00 일요일 / 공휴일 휴무")}
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#333", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>계좌 정보</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {field("은행명", "bank_name", "국민은행")}
          {field("계좌번호", "bank_num", "000000-00-000000")}
          {field("예금주", "bank_holder", "주식회사 와이앤에이치에스")}
        </div>
      </Card>

      <div style={{ textAlign: "right" }}>
        <Btn onClick={save} disabled={saving} color="#8B5E3C">
          {saving ? "저장 중…" : "저장"}
        </Btn>
      </div>
    </div>
  );
}

function SettingsManager({ authHeaders, toast }: {
  authHeaders: () => Record<string, string>;
  toast: (msg: string, type?: "ok" | "err") => void;
}) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/shop-admin/settings", { headers: authHeaders() })
      .then(r => r.json()).then(d => { setSettings(d); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/shop-admin/settings", {
        method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast("설정이 저장되었습니다!");
    } catch { toast("저장 실패", "err"); }
    setSaving(false);
  };

  if (!loaded) return <div style={{ padding: 40, color: "#aaa", textAlign: "center" }}>불러오는 중…</div>;

  return (
    <div>
      <PageHeader title="쇼핑몰 기본설정" sub="쇼핑몰 운영에 필요한 기본 값을 설정합니다" />
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#333", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
          카카오채널 설정
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 6 }}>
              채널 추가 시 적립 포인트 (원)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                min={0}
                value={settings.kakao_channel_point || "1000"}
                onChange={e => set("kakao_channel_point", e.target.value)}
                style={{ ...inputStyle, width: 180 }}
              />
              <span style={{ fontSize: 13, color: "#888" }}>P — 카카오채널 배너 클릭 시 1회 지급</span>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 6 }}>
              카카오채널 URL
            </label>
            <input
              type="text"
              value={settings.kakao_channel_url || "http://pf.kakao.com/_BRqxkn/chat"}
              onChange={e => set("kakao_channel_url", e.target.value)}
              style={{ ...inputStyle, width: "100%" }}
              placeholder="http://pf.kakao.com/_BRqxkn/chat"
            />
          </div>
        </div>
      </Card>
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#333", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
          첫구매 기획전 설정
        </h3>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.first_purchase_enabled === "1"}
              onChange={e => set("first_purchase_enabled", e.target.checked ? "1" : "0")}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13, color: "#444" }}>
              첫구매 기획전 활성화 (비활성화 시 메뉴에서 숨김)
            </span>
          </label>
        </div>
      </Card>
      <div style={{ textAlign: "right" }}>
        <Btn onClick={save} disabled={saving} color="#8B5E3C">
          {saving ? "저장 중…" : "설정 저장"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────

export default function Admin() {
  const [, navigate] = useLocation();
  const { user, token } = useAuth();
  const [page, setPage] = useState<Page>("shop-banners");
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5]));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!user.is_admin) { navigate("/"); return; }
  }, [user]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  const toggleGroup = (idx: number) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectPage = (p: Page) => { setPage(p); setSidebarOpen(false); };

  if (!user?.is_admin) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f8", display: "flex" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          background: toast.type === "ok" ? "#8B5E3C" : "#ef4444",
          color: "#fff", borderRadius: 8, padding: "12px 20px",
          fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 220, background: "#fff", borderRight: "1px solid #e8e8e8",
        flexShrink: 0, overflowY: "auto", zIndex: 50,
        position: "fixed", top: 0, left: 0, height: "100vh",
        transform: sidebarOpen ? "translateX(0)" : undefined,
        transition: "transform 0.2s",
        display: "flex", flexDirection: "column",
      }} className="admin-sidebar">
        {/* Logo */}
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#8B5E3C", margin: 0 }}>seoulmono 관리자</p>
              <p style={{ fontSize: 11, color: "#aaa", margin: "2px 0 0" }}>{user.mb_name}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "none" }} className="sidebar-close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {MENU.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleGroup(gIdx)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {group.icon} {group.label}
                </span>
                {openGroups.has(gIdx) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {openGroups.has(gIdx) && (
                <div style={{ paddingLeft: 4 }}>
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => selectPage(item.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", border: "none", cursor: "pointer", borderRadius: 8,
                        fontSize: 13, fontWeight: page === item.id ? 700 : 400, textAlign: "left",
                        background: page === item.id ? "#e8f9f0" : "none",
                        color: page === item.id ? "#8B5E3C" : "#555",
                        transition: "all 0.1s",
                      }}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f0" }}>
          <button onClick={() => navigate("/")}
            style={{ width: "100%", padding: "8px", border: "1px solid #e0e0e0", borderRadius: 8, background: "#fff", fontSize: 12, color: "#888", cursor: "pointer" }}>
            쇼핑몰 홈으로
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ marginLeft: 220, flex: 1, minWidth: 0, padding: "0 0 60px" }} className="admin-main">
        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", display: "none" }} className="sidebar-toggle">
            <Menu size={20} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
            {MENU.flatMap(g => g.items).find(i => i.id === page)?.label || "관리자"}
          </span>
        </div>

        <div style={{ padding: "24px" }}>
          {page === "shop-main-slider" && <MainSliderBannerManager authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-banners" && <BannerManager authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-categories" && <ShopCategoriesManager authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-best" && <SectionManager sectionType="best" title="베스트 상품" authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-sale" && <SectionManager sectionType="sale" title="오늘의특가/타임세일" authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-first-purchase" && <SectionManager sectionType="first_purchase" title="첫구매100원 기획전 상품" authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-diygift" && <SectionManager sectionType="diygift" title="내가만드는 선물" authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-new" && <SectionManager sectionType="new" title="신상품" authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-lowest" && <SectionManager sectionType="lowest" title="최저가도전" authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-exclusive" && <SectionManager sectionType="exclusive" title="오직상회에만" authHeaders={authHeaders} toast={showToast} />}
          {page === "shop-groupbuy" && <SectionManager sectionType="groupbuy" title="공동구매 상품" authHeaders={authHeaders} toast={showToast} shopPath="/groupbuy" />}
          {page === "shop-todaydeal" && <SectionManager sectionType="todaydeal" title="SNS 구매 상품" authHeaders={authHeaders} toast={showToast} shopPath="/todaydeal" />}
          {page === "events" && <EventManager authHeaders={authHeaders} toast={showToast} />}
          {page === "cs-board" && <CsBoardManager authHeaders={authHeaders} toast={showToast} />}
          {page === "products" && <ProductList authHeaders={authHeaders} toast={showToast} />}
          {page === "gift-packages" && <GiftPackageManager authHeaders={authHeaders} toast={showToast} />}
          {page === "gift-categories" && <GiftSetCategoryManager authHeaders={authHeaders} toast={showToast} />}
          {page === "gift-products" && <GiftSetProductManager authHeaders={authHeaders} toast={showToast} />}
          {page === "pending" && <PendingMembers authHeaders={authHeaders} toast={showToast} />}
          {page === "members" && <AllMembers authHeaders={authHeaders} toast={showToast} />}
          {page === "orders" && <OrderList authHeaders={authHeaders} toast={showToast} />}
          {page === "reviews" && <ReviewList authHeaders={authHeaders} toast={showToast} />}
          {page === "settings" && <SettingsManager authHeaders={authHeaders} toast={showToast} />}
          {page === "footer" && <FooterConfigManager authHeaders={authHeaders} toast={showToast} />}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
          }
          .admin-main {
            margin-left: 0 !important;
          }
          .sidebar-toggle {
            display: flex !important;
          }
          .sidebar-close {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Select Delete Bar ────────────────────────────────────────────────────────

function SelectDeleteBar({ selected, total, onSelectAll, onDeselectAll, onDelete, deleting, label = "선택삭제", extraActions }: {
  selected: number; total: number; onSelectAll: () => void; onDeselectAll: () => void;
  onDelete: () => void; deleting?: boolean; label?: string; extraActions?: React.ReactNode;
}) {
  if (selected === 0) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
      background: "#fff8f0", border: "1px solid #f59e0b", borderRadius: 8,
      marginBottom: 12, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
        {selected}개 선택됨 / 전체 {total}개
      </span>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
        {selected < total && (
          <button onClick={onSelectAll} style={{ fontSize: 12, padding: "5px 12px", border: "1px solid #d97706", borderRadius: 6, background: "#fff", color: "#92400e", cursor: "pointer" }}>
            전체 선택
          </button>
        )}
        <button onClick={onDeselectAll} style={{ fontSize: 12, padding: "5px 12px", border: "1px solid #ccc", borderRadius: 6, background: "#fff", color: "#555", cursor: "pointer" }}>
          선택해제
        </button>
        {extraActions}
        <button onClick={onDelete} disabled={deleting}
          style={{ fontSize: 12, padding: "5px 14px", border: "none", borderRadius: 6, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
          {deleting ? "삭제 중..." : `${label} (${selected})`}
        </button>
      </div>
    </div>
  );
}

// ─── Pagination Helpers ───────────────────────────────────────────────────────

function PerPageSelect({ value, onChange, total }: { value: number; onChange: (n: number) => void; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555", flexWrap: "wrap" }}>
      <span style={{ fontWeight: 600 }}>전체 {total.toLocaleString()}개</span>
      <span style={{ color: "#ddd", margin: "0 2px" }}>|</span>
      <span>개수</span>
      {[10, 20, 50, 100].map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{
            padding: "4px 10px", border: "1px solid " + (value === n ? "#8B5E3C" : "#e0e0e0"),
            borderRadius: 5, background: value === n ? "#e8f7ef" : "#fff",
            color: value === n ? "#8B5E3C" : "#555",
            fontSize: 12, fontWeight: value === n ? 700 : 400, cursor: "pointer",
          }}>
          {n}
        </button>
      ))}
    </div>
  );
}

function Paginator({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, page + 2);
  if (end - start < 4) {
    if (start === 1) end = Math.min(totalPages, start + 4);
    else start = Math.max(1, end - 4);
  }
  const pageNums: (number | "...")[] = [];
  if (start > 1) { pageNums.push(1); if (start > 2) pageNums.push("..."); }
  for (let i = start; i <= end; i++) pageNums.push(i);
  if (end < totalPages) { if (end < totalPages - 1) pageNums.push("..."); pageNums.push(totalPages); }
  const pgBtn = (active?: boolean, disabled?: boolean): React.CSSProperties => ({
    padding: "6px 10px", border: "1px solid " + (active ? "#8B5E3C" : "#e0e0e0"),
    borderRadius: 6, background: active ? "#8B5E3C" : disabled ? "#fafafa" : "#fff",
    color: active ? "#fff" : disabled ? "#ccc" : "#555",
    fontSize: 13, cursor: disabled ? "default" : "pointer", fontWeight: active ? 700 : 400,
    minWidth: 34, textAlign: "center" as const,
  });
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "center", marginTop: 20, flexWrap: "wrap" }}>
      <button style={pgBtn(false, page === 1)} onClick={() => page > 1 && onPage(1)} disabled={page === 1}>맨앞</button>
      <button style={pgBtn(false, page === 1)} onClick={() => page > 1 && onPage(page - 1)} disabled={page === 1}>이전</button>
      {pageNums.map((p, i) =>
        p === "..." ? <span key={"el" + i} style={{ padding: "6px 4px", color: "#aaa", fontSize: 13 }}>...</span>
          : <button key={p} style={pgBtn(p === page)} onClick={() => onPage(p as number)}>{p}</button>
      )}
      <button style={pgBtn(false, page === totalPages)} onClick={() => page < totalPages && onPage(page + 1)} disabled={page === totalPages}>이후</button>
      <button style={pgBtn(false, page === totalPages)} onClick={() => page < totalPages && onPage(totalPages)} disabled={page === totalPages}>맨마지막</button>
    </div>
  );
}

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: "#888", margin: 0 }}>{sub}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e8e8", padding: "20px", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, disabled, color }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; color?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "7px 14px", border: "none", borderRadius: 7,
        background: color || "#8B5E3C", color: "#fff",
        fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1, flexShrink: 0, whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function ItemRow({ item, action }: { item: ShopItem; action: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #eee" }}>
      {item.it_img1
        ? <img src={item.it_img1} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        : <div style={{ width: 46, height: 46, background: "#f0f0f0", borderRadius: 6, flexShrink: 0 }} />
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.it_name}</p>
        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{fmtPrice(item.it_price)}</p>
      </div>
      {action}
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5, fontWeight: 600 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "11px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#666", whiteSpace: "nowrap" }}>{children}</th>;
}

function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "11px 12px", fontSize: 13, color: "#333", ...style }}>{children}</td>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1.5px solid #e0e0e0",
  borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box",
  background: "#fff",
};

const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 13,
};
