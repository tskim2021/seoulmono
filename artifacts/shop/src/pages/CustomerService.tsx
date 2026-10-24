import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const TOKEN_KEY = "seoulmono_token";
const PAGE_SIZE = 20;

interface CsPost {
  id: number;
  title: string;
  content: string;
  is_notice: number;
  sort_order: number;
  created_by: string;
  created_at: string;
}

function fmtDate(dt: string) { return dt ? dt.slice(0, 10) : ""; }

export default function CustomerServicePage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<CsPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CsPost | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<CsPost | null>(null);
  const [form, setForm] = useState({ title: "", content: "", is_notice: false, sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const isAdmin = user?.is_admin || (user?.mb_level ?? 0) >= 9;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ""}` });

  function loadList(p = 1) {
    setLoading(true);
    fetch(`/api/boards/cs?page=${p}&limit=${PAGE_SIZE}`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setTotal(d.total || 0); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadList(1); }, []);

  function openDetail(post: CsPost) {
    setDetail(prev => prev?.id === post.id ? null : post);
  }

  function openNewForm() {
    setEditTarget(null);
    setForm({ title: "", content: "", is_notice: false, sort_order: 0 });
    setShowForm(true);
    setFormErr("");
  }

  function openEditForm(p: CsPost) {
    setEditTarget(p);
    setForm({ title: p.title, content: p.content, is_notice: p.is_notice === 1, sort_order: p.sort_order });
    setShowForm(true);
    setFormErr("");
    setDetail(null);
  }

  async function handleWrite(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { setFormErr("タイトルと内容を入力してください。"); return; }
    setSaving(true); setFormErr("");

    const url = editTarget ? `/api/boards/cs/${editTarget.id}` : "/api/boards/cs";
    const method = editTarget ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ title: form.title, content: form.content, is_notice: form.is_notice, sort_order: form.sort_order }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormErr(data.error || "エラーが発生しました。"); return; }
    setShowForm(false); setEditTarget(null);
    loadList(1);
  }

  async function handleDelete(id: number) {
    if (!confirm("この投稿を削除してもよろしいですか?")) return;
    await fetch(`/api/boards/cs/${id}`, { method: "DELETE", headers: authHeader() });
    if (detail?.id === id) setDetail(null);
    loadList(page);
  }

  return (
    <div style={{ background: "#fff", minHeight: "60vh" }}>
      {/* 헤더 */}
      <div style={{ background: "#f8faf9", borderBottom: "1px solid #e8f0eb", padding: "44px 0 36px" }}>
        <div className="page-wrap">
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#8B5E3C", letterSpacing: "0.15em", textTransform: "uppercase" }}>Customer Service</p>
          <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.5px" }}>お客様センター</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#888" }}>ソウルモノお客様センターのご案内・お知らせです。</p>
        </div>
      </div>

      {/* 전화 안내 바 */}
      <div style={{ background: "#FDF6EE", borderBottom: "1px solid #e0f0e8", padding: "16px 0" }}>
        <div className="page-wrap" style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.63 19.79 19.79 0 01.01 1.02 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
            </svg>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "#888" }}>お電話でのお問い合わせ</p>
              <a href="tel:010-2051-5692" style={{ fontSize: 18, fontWeight: 900, color: "#8B5E3C", textDecoration: "none" }}>010-2051-5692</a>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>
            <span>平日 10:00~18:00</span>
            <span style={{ margin: "0 8px", color: "#ccc" }}>|</span>
            <span>昼休み 12:00~13:00</span>
            <span style={{ margin: "0 8px", color: "#ccc" }}>|</span>
            <span>土・日・祝日休業</span>
          </div>
        </div>
      </div>

      <div className="page-wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#888" }}>全 <strong style={{ color: "#1a1a1a" }}>{total}</strong>件</p>
          {isAdmin && !showForm && (
            <button
              onClick={openNewForm}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#8B5E3C", color: "#fff", border: "none",
                borderRadius: 8, padding: "9px 18px", fontWeight: 700,
                fontSize: 13, cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              新規作成
            </button>
          )}
        </div>

        {/* 작성/수정 폼 */}
        {showForm && isAdmin && (
          <form onSubmit={handleWrite} style={{
            background: "#f8faf9", border: "1.5px solid #DEC4A8", borderRadius: 12,
            padding: "24px", marginBottom: 24,
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>
              {editTarget ? "投稿を編集" : "新規投稿を作成"}
            </h3>
            {formErr && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#e53935", background: "#fff5f5", borderRadius: 6, padding: "8px 12px" }}>{formErr}</p>}
            <input
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="タイトル"
              style={{ width: "100%", border: "1.5px solid #d0e8d8", borderRadius: 8, padding: "11px 14px", fontSize: 14, marginBottom: 10, boxSizing: "border-box", outline: "none" }}
            />
            <textarea
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="内容"
              rows={6}
              style={{ width: "100%", border: "1.5px solid #d0e8d8", borderRadius: 8, padding: "11px 14px", fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#8B5E3C" }}>
                <input
                  type="checkbox"
                  checked={form.is_notice}
                  onChange={e => setForm(f => ({ ...f, is_notice: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#8B5E3C" }}
                />
                お知らせとして登録 (上部に固定)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555" }}>
                表示順:
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  style={{ width: 60, border: "1px solid #d0e8d8", borderRadius: 6, padding: "4px 8px", fontSize: 13, textAlign: "center" }}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setShowForm(false); setEditTarget(null); }} style={{ padding: "9px 20px", border: "1px solid #ccc", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>キャンセル</button>
              <button type="submit" disabled={saving} style={{ padding: "9px 20px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                {saving ? "保存中..." : (editTarget ? "更新" : "登録")}
              </button>
            </div>
          </form>
        )}

        {/* 상세 뷰 */}
        {detail && (
          <div style={{ marginBottom: 24, border: "1.5px solid #DEC4A8", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "#FDF6EE", padding: "20px 24px", borderBottom: "1px solid #DEC4A8" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {detail.is_notice === 1 && (
                      <span style={{ background: "#8B5E3C", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>お知らせ</span>
                    )}
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>{detail.title}</h2>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#888" }}>
                    <span>ソウルモノお客様センター</span>
                    <span>{fmtDate(detail.created_at)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {isAdmin && (
                    <>
                      <button onClick={() => openEditForm(detail)} style={{ background: "#fff", border: "1px solid #DEC4A8", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#8B5E3C", cursor: "pointer", fontWeight: 600 }}>編集</button>
                      <button onClick={() => handleDelete(detail.id)} style={{ background: "#fff", border: "1px solid #fcc", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#e53935", cursor: "pointer", fontWeight: 600 }}>削除</button>
                    </>
                  )}
                  <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", padding: 4 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div style={{ padding: "24px", fontSize: 14, color: "#333", lineHeight: 1.85 }}>
              {detail.content.startsWith("<") ? (
                <div dangerouslySetInnerHTML={{ __html: detail.content }} />
              ) : (
                detail.content.split("\n").map((l, i) => <p key={i} style={{ margin: i === 0 ? 0 : "6px 0 0" }}>{l}</p>)
              )}
            </div>
          </div>
        )}

        {/* 목록 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>読み込み中...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" style={{ marginBottom: 12 }}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>登録されたご案内はありません</p>
            <p style={{ fontSize: 13, color: "#ccc", margin: 0 }}>お電話(010-2051-5692)でお問い合わせください</p>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px", gap: 0, background: "#f5f5f5", borderTop: "2px solid #1a1a1a", borderBottom: "1px solid #e0e0e0", padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#555" }}>
              <span style={{ textAlign: "center" }}>番号</span>
              <span>タイトル</span>
              <span style={{ textAlign: "center" }}>日付</span>
            </div>
            {posts.map((p, i) => (
              <div
                key={p.id}
                onClick={() => openDetail(p)}
                style={{
                  display: "grid", gridTemplateColumns: "60px 1fr 100px",
                  gap: 0, padding: "13px 12px", cursor: "pointer",
                  borderBottom: "1px solid #efefef",
                  background: p.is_notice === 1
                    ? (detail?.id === p.id ? "#e6f7f0" : "#f5fcf8")
                    : (detail?.id === p.id ? "#FDF6EE" : "transparent"),
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => { if (detail?.id !== p.id) (e.currentTarget as HTMLElement).style.background = p.is_notice === 1 ? "#ecf9f3" : "#fafafa"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = p.is_notice === 1 ? (detail?.id === p.id ? "#e6f7f0" : "#f5fcf8") : (detail?.id === p.id ? "#FDF6EE" : "transparent"); }}
              >
                <span style={{ textAlign: "center", fontSize: 13 }}>
                  {p.is_notice === 1
                    ? <span style={{ background: "#8B5E3C", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>お知らせ</span>
                    : <span style={{ color: "#999" }}>{total - (page - 1) * PAGE_SIZE - i + posts.filter((x, j) => j < i && x.is_notice === 1).length}</span>
                  }
                </span>
                <span style={{ fontSize: 14, color: p.is_notice === 1 ? "#8B5E3C" : "#222", fontWeight: p.is_notice === 1 ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.title}
                </span>
                <span style={{ textAlign: "center", fontSize: 12, color: "#999" }}>{fmtDate(p.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 28 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => { loadList(p); setDetail(null); }}
                style={{
                  width: 34, height: 34, border: "1px solid", borderRadius: 6,
                  borderColor: p === page ? "#8B5E3C" : "#e0e0e0",
                  background: p === page ? "#8B5E3C" : "#fff",
                  color: p === page ? "#fff" : "#555",
                  fontWeight: p === page ? 700 : 400,
                  cursor: "pointer", fontSize: 13,
                }}
              >{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
