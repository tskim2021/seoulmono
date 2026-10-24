import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { Search, X, Clock, ArrowLeft } from "lucide-react";

const HISTORY_KEY = "seoulmono_search_history";
const MAX_HISTORY = 10;

const RECOMMENDED = [
  "사조 참치", "비비고 만두", "먹꾸먹꾸", "햇반", "신라면",
  "마일드참치", "오뚜기 진라면", "종합전병세트", "고추참치", "1kg",
];

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}
function saveHistory(h: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}

export default function SearchPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const initialQ = new URLSearchParams(search).get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [history, setHistory] = useState<string[]>(getHistory());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // URL에 q 파라미터가 있으면 즉시 검색 실행
  useEffect(() => {
    if (initialQ.trim()) {
      doSearch(initialQ);
    }
  }, []);

  const doSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const h = [trimmed, ...getHistory().filter(x => x !== trimmed)];
    saveHistory(h);
    setHistory(h);
    navigate(`/list?q=${encodeURIComponent(trimmed)}`);
  };

  const removeHistory = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const h = history.filter(x => x !== item);
    saveHistory(h);
    setHistory(h);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", width: "100%" }}>

      {/* 검색 헤더 */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#fff", borderBottom: "1px solid #eee",
        padding: "10px 14px",
        width: "100%", boxSizing: "border-box",
      }}>
        <form
          onSubmit={e => { e.preventDefault(); doSearch(query); }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <button
            type="button"
            onClick={() => navigate(-1 as any)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
          >
            <ArrowLeft size={22} color="#333" />
          </button>

          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            background: "#f4f4f4", borderRadius: 24, padding: "9px 14px", gap: 8,
            minWidth: 0,
          }}>
            <Search size={16} color="#8B5E3C" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="검색어를 입력하세요"
              style={{
                flex: 1, border: "none", background: "transparent",
                outline: "none", fontSize: 15, color: "#333", minWidth: 0,
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
              >
                <X size={15} color="#aaa" />
              </button>
            )}
          </div>

          <button
            type="submit"
            style={{
              background: "#8B5E3C", color: "#fff", border: "none",
              borderRadius: 20, padding: "9px 18px",
              fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}
          >
            검색
          </button>
        </form>
      </div>

      <div style={{ padding: "0 16px 80px", width: "100%", boxSizing: "border-box" }}>

        {/* 최근 검색어 */}
        <div style={{ padding: "20px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#222" }}>
              <Clock size={14} color="#888" /> 최근 검색어
            </span>
            {history.length > 0 && (
              <button
                onClick={() => { saveHistory([]); setHistory([]); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#aaa", padding: 0 }}
              >
                전체삭제
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: "#bbb", margin: "16px 0", textAlign: "center" }}>
              최근 검색어가 없습니다
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {history.map(item => (
                <div
                  key={item}
                  onClick={() => doSearch(item)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "#f4f4f4", borderRadius: 20,
                    padding: "7px 12px", cursor: "pointer",
                    fontSize: 13, color: "#444",
                  }}
                >
                  <span>{item}</span>
                  <button
                    onClick={e => removeHistory(item, e)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", lineHeight: 1 }}
                  >
                    <X size={12} color="#bbb" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div style={{ borderBottom: "1px solid #f0f0f0", margin: "20px 0" }} />

        {/* 추천 검색어 */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#222", margin: "0 0 12px" }}>추천 검색어</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {RECOMMENDED.map(kw => (
              <button
                key={kw}
                onClick={() => doSearch(kw)}
                style={{
                  background: "#fff", border: "1.5px solid #e0e0e0",
                  borderRadius: 20, padding: "7px 16px",
                  fontSize: 13, color: "#444", cursor: "pointer", fontWeight: 500,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#8B5E3C"; e.currentTarget.style.color = "#8B5E3C"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#444"; }}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
