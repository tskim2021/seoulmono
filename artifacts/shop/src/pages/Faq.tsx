import { useState, useEffect, useRef } from "react";
const API = "/api";

const CATEGORIES = [
  { key: "전체", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )},
  { key: "회원/정보", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
  { key: "주문/결제", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )},
  { key: "배송", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  )},
  { key: "취소/교환/반품", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
    </svg>
  )},
  { key: "서비스/기타", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )},
];

interface Faq { id: number; category: string; question: string; answer: string; }

const CAT_LABEL: Record<string, string> = {
  "전체": "すべて", "회원/정보": "会員/情報", "주문/결제": "注文/お支払い", "배송": "配送",
  "취소/교환/반품": "キャンセル/交換/返品", "서비스/기타": "サービス/その他",
};
const catLabel = (k: string) => CAT_LABEL[k] ?? k;

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "전체") params.set("category", category);
    if (query) params.set("q", query);
    fetch(`${API}/shop/faqs?${params}`)
      .then(r => r.json())
      .then(d => { setFaqs(Array.isArray(d) ? d : []); setOpenId(null); })
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, [category, query]);

  const handleSearch = () => { setQuery(search); setCategory("전체"); };

  return (
    <div style={{ background: "#fff", minHeight: "60vh" }}>

      {/* 페이지 헤더 */}
      <div style={{
        background: "linear-gradient(135deg, #8B5E3C 0%, #168249 50%, #0e6b3c 100%)",
        padding: "52px 0 48px", textAlign: "center",
      }}>
        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Help Center</p>
        <h1 style={{ margin: "0 0 20px", fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>よくあるご質問</h1>

        {/* 검색바 */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "#fff", borderRadius: 50,
            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
            width: "100%", maxWidth: 500, overflow: "hidden",
          }}>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="知りたい内容を検索してみましょう"
              style={{
                flex: 1, border: "none", outline: "none",
                padding: "14px 20px", fontSize: 14, color: "#333",
                background: "transparent",
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                background: "#8B5E3C", color: "#fff",
                border: "none", cursor: "pointer",
                padding: "14px 24px", fontSize: 14, fontWeight: 700,
                flexShrink: 0,
              }}
            >
              検索
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div style={{ borderBottom: "2px solid #e8f0eb", background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="page-wrap" style={{ padding: 0, overflowX: "auto" }}>
          <div style={{ display: "flex", minWidth: "max-content" }}>
            {CATEGORIES.map(cat => {
              const active = category === cat.key;
              return (
                <button
                  key={catLabel(cat.key)}
                  onClick={() => { setCategory(cat.key); setSearch(""); setQuery(""); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "16px 24px",
                    border: "none", borderBottom: `2.5px solid ${active ? "#8B5E3C" : "transparent"}`,
                    background: "none", cursor: "pointer",
                    color: active ? "#8B5E3C" : "#888",
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    marginBottom: -2,
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.55 }}>{cat.icon}</span>
                  {catLabel(cat.key)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ 목록 */}
      <div className="page-wrap" style={{ paddingTop: 32, paddingBottom: 72 }}>

        {/* 결과 수 */}
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>
          {query
            ? <><strong style={{ color: "#8B5E3C" }}>'{query}'</strong> の検索結果 全<strong>{faqs.length}件</strong></>
            : <>全<strong>{faqs.length}件</strong></>
          }
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: 14 }}>
            <div style={{ width: 32, height: 32, border: "3px solid #e8f0eb", borderTopColor: "#8B5E3C", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
            読み込み中...
          </div>
        ) : faqs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#bbb" }}>検索結果がありません</p>
            <p style={{ margin: 0, fontSize: 13, color: "#ccc" }}>別のキーワードやカテゴリーをお試しください</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {faqs.map((faq, i) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    borderTop: i === 0 ? "2px solid #1a1a1a" : "1px solid #e8e8e8",
                    borderBottom: i === faqs.length - 1 ? "1px solid #e8e8e8" : "none",
                  }}
                >
                  {/* 질문 행 */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 16,
                      padding: "20px 16px 20px 0",
                      background: "none", border: "none", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    {/* Q 뱃지 */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: isOpen ? "#8B5E3C" : "#FDF6EE",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.15s",
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: isOpen ? "#fff" : "#8B5E3C" }}>Q</span>
                    </div>
                    <span style={{
                      flex: 1, fontSize: 15, fontWeight: isOpen ? 700 : 500,
                      color: isOpen ? "#8B5E3C" : "#1a1a1a",
                      lineHeight: 1.5,
                    }}>
                      {faq.question}
                    </span>
                    {/* 카테고리 뱃지 */}
                    <span style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 600, color: "#8B5E3C",
                      background: "#F2E4D0", borderRadius: 99, padding: "3px 10px",
                      display: "none",
                    }} className="faq-cat-badge">{catLabel(faq.category)}</span>
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    >
                      <path d="M3 6l5 5 5-5" stroke={isOpen ? "#8B5E3C" : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* 답변 */}
                  {isOpen && (
                    <div style={{
                      display: "flex", gap: 16,
                      padding: "0 0 24px 0",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: "#fff5e6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: "#e88b2a" }}>A</span>
                      </div>
                      <div style={{
                        flex: 1, background: "#f8faf9", borderRadius: 12,
                        padding: "16px 20px",
                        fontSize: 14, color: "#444", lineHeight: 1.85,
                        borderLeft: "3px solid #8B5E3C",
                      }}>
                        {faq.answer.split("\n").map((line, li) => (
                          <p key={li} style={{ margin: li === 0 ? 0 : "8px 0 0" }}>{line}</p>
                        ))}
                        {/* 카테고리 뱃지 (답변 하단) */}
                        <div style={{ marginTop: 12 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: "#8B5E3C",
                            background: "#F2E4D0", borderRadius: 99, padding: "3px 10px",
                          }}>{catLabel(faq.category)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 고객센터 배너 */}
        <div style={{
          marginTop: 56, padding: "28px 32px",
          background: "linear-gradient(135deg, #8B5E3C 0%, #0e6b3c 100%)",
          borderRadius: 16, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 20, flexWrap: "wrap",
        }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>お探しの回答が見つかりませんか?</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>お客様センター 010-2051-5692</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>平日 10:00 ~ 18:00 (昼休み 12:00~13:00 / 土・日・祝日休業)</p>
          </div>
          <a
            href="tel:010-2051-5692"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff", color: "#8B5E3C",
              fontWeight: 800, fontSize: 14,
              padding: "12px 24px", borderRadius: 99,
              textDecoration: "none", whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 10.5 19.79 19.79 0 011.61 2c-.12-1.2.8-2 2-2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            お電話でのお問い合わせ
          </a>
        </div>

      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
