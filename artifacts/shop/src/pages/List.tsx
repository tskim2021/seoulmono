import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, List as ListIcon } from "lucide-react";
import { getShopItems, getCategories, type ShopItem } from "@/lib/api";
import { useMenuOrder } from "@/hooks/useMenuOrder";
import ProductCard from "@/components/ProductCard";

const TYPE_LABELS: Record<string, string> = {
  "3": "MD PICK",
  "4": "初回購入100円",
  "5": "大容量業務用食材",
  "13": "共同購入",
};

const TYPE_BANNERS: Record<string, { sub: string; title: string; bg: string; color: string; badge?: string }> = {
  "4": { sub: "会員登録後、1回だけご購入いただける特別特典", title: "初回購入100円キャンペーン", bg: "linear-gradient(135deg,#d4889a 0%,#eab0bc 100%)", color: "#fff", badge: "お一人様1回" },
  "3": { sub: "seoulmonoが厳選した、お客様満足度の高い人気商品", title: "MD PICK", bg: "linear-gradient(135deg,#1565a8 0%,#2196f3 100%)", color: "#fff", badge: "MDおすすめ" },
  "13": { sub: "みんなで買えばもっとお得な共同購入商品", title: "共同購入", bg: "linear-gradient(135deg,#8e44ad 0%,#c39bd3 100%)", color: "#fff", badge: "🤝 共同購入" },
  "5": { sub: "飲食店・給食向け大容量商品コレクション", title: "大容量業務用食材", bg: "linear-gradient(135deg,#2c6e49 0%,#52b788 100%)", color: "#fff", badge: "🍳 食材" },
};

const SORT_OPTIONS = [
  { value: "hit", label: "売れ筋順" },
  { value: "price_asc", label: "価格が安い順" },
  { value: "price_desc", label: "価格が高い順" },
  { value: "rating", label: "評価が高い順" },
  { value: "review", label: "レビューが多い順" },
  { value: "newest", label: "新着順" },
];

const LIMIT_OPTIONS = [20, 40, 60];

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", background: "#fff", border: "1px solid #f0f0f0" }}>
      <div style={{ aspectRatio: "1/1", background: "#f0f0f0" }} />
      <div style={{ padding: 10 }}>
        <div style={{ height: 12, background: "#eee", borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 12, background: "#eee", borderRadius: 4, width: "70%", marginBottom: 10 }} />
        <div style={{ height: 16, background: "#eee", borderRadius: 4, width: "50%" }} />
      </div>
    </div>
  );
}

export default function List() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const { items: menuItems } = useMenuOrder();
  const params = new URLSearchParams(search);
  const type = params.get("type") || "";
  const caId = params.get("ca_id") || "";
  const searchQ = params.get("q") || "";
  const sortFromUrl = params.get("sort") || "hit";
  const selectedParent = caId.length >= 2 ? caId.substring(0, 2) : "";

  const [items, setItems] = useState<ShopItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(sortFromUrl);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [cartTick, setCartTick] = useState(0);
  const [categories, setCategories] = useState<{ ca_id: string; ca_name: string }[]>([]);
  const [gridView, setGridView] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(selectedParent || null);

  useEffect(() => {
    getCategories().then(r => setCategories(r.categories));
  }, []);

  useEffect(() => {
    setSort(sortFromUrl);
  }, [sortFromUrl]);

  useEffect(() => {
    setPage(1);
    setLoading(true);
    setItems([]);
  }, [type, caId, searchQ, sort, limit]);

  useEffect(() => {
    setLoading(true);
    getShopItems({ page, limit, type, category: caId, search: searchQ, sort })
      .then(r => { setItems(r.items); setTotal(r.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, type, caId, searchQ, sort, limit]);

  const totalPages = Math.ceil(total / limit);
  const pageStart = Math.max(1, Math.min(totalPages - 9, page - 4));
  const pageEnd = Math.min(totalPages, pageStart + 9);

  const topLevelCats = categories.filter(c => c.ca_id.length === 2);
  const subCats = selectedParent ? categories.filter(c => c.ca_id.startsWith(selectedParent) && c.ca_id.length > 2) : [];

  const typeLabel = type ? (TYPE_LABELS[type] || "商品一覧") : "";
  const catName = caId ? categories.find(c => c.ca_id === caId)?.ca_name || "" : "";
  const displayTitle = typeLabel || catName || (searchQ ? `"${searchQ}" の検索結果` : "すべての商品");
  const banner = type ? TYPE_BANNERS[type] : null;

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", width: "100%", maxWidth: "100%", overflowX: "hidden" }}>

      {/* Type banner */}
      {banner && (
        <div style={{ background: banner.bg, padding: "32px 0 28px" }}>
          <div className="page-wrap list-banner-inner" style={{ paddingTop: 0, paddingBottom: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
            {/* 좌측: 타이틀 */}
            <div style={{ flexShrink: 0 }}>
              {banner.badge && (
                <span style={{
                  display: "inline-block", background: "rgba(255,255,255,0.22)",
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  padding: "3px 10px", borderRadius: 20, marginBottom: 8,
                  border: "1px solid rgba(255,255,255,0.4)", letterSpacing: 0.5,
                }}>
                  {banner.badge}
                </span>
              )}
              <p style={{ margin: "0 0 6px", fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 400 }}>{banner.sub}</p>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: banner.color, letterSpacing: -0.5 }}>{banner.title}</h1>
            </div>
            {/* 우측: 첫구매 안내 (type=4만) */}
            {type === "4" && (
              <div style={{
                flex: 1, maxWidth: 560, background: "rgba(255,255,255,0.18)",
                borderRadius: 14, padding: "14px 18px",
                border: "1px solid rgba(255,255,255,0.35)", backdropFilter: "blur(4px)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>🎁</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 600, letterSpacing: 0.3 }}>新規会員限定の特別特典</p>
                    <p style={{ margin: 0, fontSize: 14, color: "#fff", fontWeight: 900 }}>初回購入100円特典とは?</p>
                  </div>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "rgba(255,255,255,0.92)", lineHeight: 1.65 }}>
                  新規にご登録いただいた会員の方は、以下の商品の中から<strong style={{ color: "#fff", textDecoration: "underline" }}>1点をたったの100円</strong>でご購入いただける特別キャンペーンです。
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "会員登録後、初回1回限り",
                    "お一人様1商品のみご購入可能",
                    "既存会員の方は対象外",
                    "他の商品との同時注文は別途決済",
                  ].map((text, i) => (
                    <span key={i} style={{
                      background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.45)",
                      borderRadius: 20, padding: "3px 10px", fontSize: 11.5, color: "#fff", fontWeight: 500,
                    }}>✅ {text}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page-wrap" style={{ paddingTop: 20, paddingBottom: 60 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 16, fontSize: 12, color: "#aaa" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 12, padding: 0 }}>ホーム</button>
          {catName && <><span>›</span><span style={{ color: "#666" }}>{catName}</span></>}
          {typeLabel && <><span>›</span><span style={{ color: "#666" }}>{typeLabel}</span></>}
          {searchQ && <><span>›</span><span style={{ color: "#666" }}>検索</span></>}
        </div>

        <div className="list-layout" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* Left sidebar */}
          <aside className="list-sidebar" style={{ width: 200, flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eee", overflow: "hidden" }}>
              <button
                onClick={() => navigate("/list")}
                style={{
                  boxSizing: "border-box",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "14px 16px 14px 19px",
                  background: (!caId && !type) ? "#FDF6EE" : "#fff",
                  border: "none",
                  borderLeft: (!caId && !type) ? "3px solid #8B5E3C" : "3px solid transparent",
                  borderBottom: "1px solid #f0f0f0", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, color: (!caId && !type) ? "#8B5E3C" : "#222",
                }}
              >
                <span>すべてのカテゴリー</span>
                <ChevronRight size={14} color="#aaa" />
              </button>
              {topLevelCats.map(cat => {
                const isExpanded = expandedCat === cat.ca_id;
                const catSubCats = categories.filter(c => c.ca_id.startsWith(cat.ca_id) && c.ca_id.length > 2);
                return (
                <div key={cat.ca_id}>
                  <button
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedCat(null);
                      } else {
                        setExpandedCat(cat.ca_id);
                        navigate(`/list?ca_id=${cat.ca_id}`);
                      }
                    }}
                    style={{
                      boxSizing: "border-box",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "12px 16px 12px 19px",
                      background: selectedParent === cat.ca_id ? "#FDF6EE" : "#fff",
                      border: "none",
                      borderLeft: selectedParent === cat.ca_id ? "3px solid #8B5E3C" : "3px solid transparent",
                      borderBottom: "1px solid #f8f8f8",
                      cursor: "pointer", fontSize: 13,
                      color: selectedParent === cat.ca_id ? "#8B5E3C" : "#444",
                      fontWeight: selectedParent === cat.ca_id ? 700 : 400,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>{cat.ca_name}</span>
                    {catSubCats.length > 0 && (
                      isExpanded
                        ? <ChevronDown size={13} color="#8B5E3C" style={{ flexShrink: 0 }} />
                        : <ChevronRight size={13} color="#aaa" style={{ flexShrink: 0 }} />
                    )}
                  </button>
                  {/* Sub-categories */}
                  {isExpanded && catSubCats.map(sc => (
                    <button
                      key={sc.ca_id}
                      onClick={() => navigate(`/list?ca_id=${sc.ca_id}`)}
                      style={{
                        boxSizing: "border-box",
                        display: "block", width: "100%", textAlign: "left",
                        padding: "9px 16px 9px 30px",
                        background: caId === sc.ca_id ? "#e8f8f0" : "#fafafa",
                        border: "none", borderBottom: "1px solid #f5f5f5",
                        borderLeft: caId === sc.ca_id ? "3px solid #8B5E3C" : "3px solid transparent",
                        cursor: "pointer", fontSize: 12,
                        color: caId === sc.ca_id ? "#8B5E3C" : "#666",
                        fontWeight: caId === sc.ca_id ? 700 : 400,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {sc.ca_name}
                    </button>
                  ))}
                </div>
              ); })}
            </div>
          </aside>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Title + controls */}
            <div style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", marginBottom: 12, border: "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111" }}>{displayTitle}</h1>
                <span style={{ fontSize: 12, color: "#aaa" }}>全 {total.toLocaleString()}点</span>
              </div>

              {/* Sort tabs */}
              <div className="list-sort-row no-scrollbar" style={{ display: "flex", gap: 0, borderBottom: "1px solid #eee", overflowX: "auto" }}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    style={{
                      padding: "8px 14px",
                      background: "none", border: "none",
                      fontSize: 13, cursor: "pointer",
                      color: sort === opt.value ? "#8B5E3C" : "#888",
                      fontWeight: sort === opt.value ? 700 : 400,
                      borderBottom: sort === opt.value ? "2px solid #8B5E3C" : "2px solid transparent",
                      marginBottom: -1, whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Sub-controls row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                {/* Sub category chips (mobile) */}
                {caId && subCats.length > 0 ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => navigate(`/list?ca_id=${selectedParent}`)}
                      style={{ border: "1px solid #ddd", borderRadius: 20, padding: "4px 12px", fontSize: 12, background: caId.length === 2 ? "#8B5E3C" : "#fff", color: caId.length === 2 ? "#fff" : "#666", cursor: "pointer", borderColor: caId.length === 2 ? "#8B5E3C" : "#ddd" }}
                    >
                      すべて
                    </button>
                    {subCats.map(sc => (
                      <button
                        key={sc.ca_id}
                        onClick={() => navigate(`/list?ca_id=${sc.ca_id}`)}
                        style={{ border: "1px solid #ddd", borderRadius: 20, padding: "4px 12px", fontSize: 12, background: caId === sc.ca_id ? "#8B5E3C" : "#fff", color: caId === sc.ca_id ? "#fff" : "#666", cursor: "pointer", borderColor: caId === sc.ca_id ? "#8B5E3C" : "#ddd" }}
                      >
                        {sc.ca_name}
                      </button>
                    ))}
                  </div>
                ) : <div />}

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {/* Limit selector */}
                  <select
                    value={limit}
                    onChange={e => setLimit(Number(e.target.value))}
                    style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 8px", fontSize: 12, background: "#fff", cursor: "pointer" }}
                  >
                    {LIMIT_OPTIONS.map(l => <option key={l} value={l}>{l}件ずつ表示</option>)}
                  </select>
                  {/* Grid/List toggle */}
                  <button onClick={() => setGridView(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: gridView ? "#8B5E3C" : "#bbb" }}>
                    <LayoutGrid size={17} />
                  </button>
                  <button onClick={() => setGridView(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: !gridView ? "#8B5E3C" : "#bbb" }}>
                    <ListIcon size={17} />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="list-grid">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "70px 0", color: "#aaa", background: "#fff", borderRadius: 10 }}>
                <p style={{ fontSize: 36, margin: "0 0 12px" }}>🔍</p>
                <p style={{ fontSize: 15, margin: "0 0 6px", color: "#777" }}>商品がありません</p>
                <p style={{ fontSize: 13 }}>別のカテゴリーをお選びください</p>
              </div>
            ) : gridView ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="list-grid">
                {items.map(item => (
                  <ProductCard key={item.it_id} item={item} onCartAdd={() => setCartTick(t => t + 1)} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map(item => <ListItemRow key={item.it_id} item={item} onCartAdd={() => setCartTick(t => t + 1)} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="list-pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 28, flexWrap: "wrap" }}>
                <button onClick={() => setPage(1)} disabled={page === 1} style={pgBtnStyle(false, page === 1)}>«</button>
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={pgBtnStyle(false, page === 1)}>
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={pgBtnStyle(p === page, false)}>{p}</button>
                ))}
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={pgBtnStyle(false, page === totalPages)}>
                  <ChevronRight size={13} />
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={pgBtnStyle(false, page === totalPages)}>»</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        /* type 네비 탭 – PC/모바일 모두 표시 */
        .list-type-nav {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          background: #fff;
          border-bottom: 1px solid #eee;
          -webkit-overflow-scrolling: touch;
        }
        .list-type-nav::-webkit-scrollbar { display: none; }
        .list-type-nav-inner {
          display: flex;
          gap: 4px;
          padding: 0 16px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .list-type-nav-item {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          flex-shrink: 0;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 10px 12px 9px;
          font-size: 13px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
        }
        .list-type-nav-item.active {
          color: #8B5E3C;
          border-bottom-color: #8B5E3C;
          font-weight: 800;
        }
        .list-type-nav-item.highlight { color: #e03a5a; }
        .list-type-nav-item.highlight.active {
          color: #e03a5a;
          border-bottom-color: #e03a5a;
        }
        .list-type-nav-item.gift { color: #fb7185; }
        .list-type-nav-item.gift.active {
          color: #e03a5a;
          border-bottom-color: #e03a5a;
        }
        @media (max-width: 767px) {
          .list-type-nav { display: flex; }
        }
        @media (min-width: 768px) {
          .list-type-nav { display: flex !important; }
        }

        @media (max-width: 767px) {
          /* 레이아웃: 세로 스택 */
          .list-layout {
            flex-direction: column !important;
            gap: 12px !important;
          }
          /* 사이드바: 줄바꿈 칩 메뉴 (overflow 없음) */
          .list-sidebar {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .list-sidebar > div {
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            width: 100% !important;
            gap: 6px !important;
            background: transparent !important;
            border: none !important;
          }
          .list-sidebar > div > button,
          .list-sidebar > div > div > button {
            display: inline-flex !important;
            align-items: center !important;
            white-space: nowrap !important;
            padding: 7px 14px !important;
            border-radius: 20px !important;
            border: 1px solid #e0e0e0 !important;
            border-left: 1px solid #e0e0e0 !important;
            border-bottom: 1px solid #e0e0e0 !important;
            background: #fff !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            color: #444 !important;
            width: auto !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .list-sidebar > div > button[style*="f0faf5"],
          .list-sidebar > div > div > button[style*="f0faf5"],
          .list-sidebar > div > button[style*="e8f8f0"],
          .list-sidebar > div > div > button[style*="e8f8f0"] {
            background: #8B5E3C !important;
            color: #fff !important;
            border-color: #8B5E3C !important;
            font-weight: 700 !important;
          }
          /* 하위 카테고리: 가로로 이어서 표시 */
          .list-sidebar > div > div {
            display: contents !important;
          }
          /* 상품 그리드 */
          .list-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
          /* 배너 */
          .list-banner-inner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
          }
          .list-banner-inner > div:last-child {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          /* 모바일 배너 폴드: 패딩 축소 */
          .list-banner-inner { padding: 0 14px !important; }
          /* 모바일 정량 탭: 화면너비 원동 */
          .list-sort-row { overflow-x: auto !important; scrollbar-width: none; }
          .list-sort-row::-webkit-scrollbar { display: none; }
          /* 모바일 페이지네이션: 컴팩트 */
          .list-pagination { gap: 2px !important; }
          .list-pagination > button {
            min-width: 30px !important; height: 30px !important;
            font-size: 12px !important; padding: 0 4px !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .list-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

function pgBtnStyle(active: boolean, disabled: boolean) {
  return {
    minWidth: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid " + (active ? "#8B5E3C" : "#ddd"),
    borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13, fontWeight: active ? 700 : 400,
    background: active ? "#8B5E3C" : "#fff",
    color: active ? "#fff" : disabled ? "#ccc" : "#333",
    opacity: disabled ? 0.5 : 1, padding: "0 6px",
  } as React.CSSProperties;
}

function ListItemRow({ item, onCartAdd }: { item: ShopItem; onCartAdd: () => void }) {
  const [, navigate] = useLocation();
  const disc = item.it_cust_price > item.it_price ? Math.round(((item.it_cust_price - item.it_price) / item.it_cust_price) * 100) : 0;

  return (
    <div
      onClick={() => navigate(`/item/${item.it_id}`)}
      style={{ display: "flex", gap: 14, background: "#fff", borderRadius: 10, padding: 12, border: "1px solid #eee", cursor: "pointer" }}
    >
      <div style={{ width: 90, height: 90, flexShrink: 0, background: "#f8f8f8", borderRadius: 8, overflow: "hidden", border: "1px solid #f0f0f0" }}>
        {item.it_img1
          ? <img src={item.it_img1} alt={item.it_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd", fontSize: 11 }}>画像なし</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 6px", fontSize: 14, color: "#333", lineHeight: 1.4 }} className="line-clamp-2">{item.it_name}</p>
        {disc > 0 && <p style={{ margin: "0 0 3px", fontSize: 12, color: "#b5b5b5", textDecoration: "line-through" }}>{item.it_cust_price.toLocaleString()}円</p>}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {disc > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: "#fa622f" }}>{disc}%</span>}
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{item.it_price.toLocaleString()}円</span>
        </div>
      </div>
    </div>
  );
}
