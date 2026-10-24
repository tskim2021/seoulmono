import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const TOKEN_KEY = "seoulmono_token";
const PAGE_SIZE = 15;

interface Post {
  wr_id: number;
  wr_subject: string;
  wr_content: string;
  wr_name: string;
  mb_id: string;
  wr_datetime: string;
  wr_hit: number;
  wr_comment: number;
  wr_file: number;
  is_notice: number;
  images: { url: string; originalname: string }[];
}

interface PostDetail extends Post {
  files: { filename: string; originalname: string; size: number; url: string; isImage: boolean }[];
}

function fmtDate(dt: string) {
  return dt ? dt.slice(0, 10) : "";
}

export default function NoticePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Post | null>(null);
  const [form, setForm] = useState({ subject: "", content: "", is_notice: false });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const isAdmin = user?.is_admin || (user?.mb_level ?? 0) >= 9;

  function loadList(p = 1) {
    setLoading(true);
    fetch(`/api/boards/notice?page=${p}&limit=${PAGE_SIZE}`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setTotal(d.total || 0); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadList(1); }, []);

  function openDetail(id: number) {
    setDetailLoading(true);
    setDetail(null);
    fetch(`/api/boards/notice/${id}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }

  function openEditForm(p: Post) {
    setEditTarget(p);
    setForm({ subject: p.wr_subject, content: p.wr_content, is_notice: p.is_notice === 1 });
    setShowForm(true);
    setFormErr("");
  }

  function openNewForm() {
    setEditTarget(null);
    setForm({ subject: "", content: "", is_notice: false });
    setShowForm(true);
    setFormErr("");
  }

  async function handleWrite(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.content.trim()) { setFormErr("タイトルと内容を入力してください。"); return; }
    setSaving(true); setFormErr("");
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const url = editTarget ? `/api/boards/notice/${editTarget.wr_id}` : "/api/boards/notice";
    const method = editTarget ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify({ subject: form.subject, content: form.content, is_notice: form.is_notice ? 1 : 0 }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormErr(data.error || "エラーが発生しました。"); return; }
    setShowForm(false); setEditTarget(null); setForm({ subject: "", content: "", is_notice: false });
    loadList(1);
    if (detail && editTarget && detail.wr_id === editTarget.wr_id) setDetail(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("このお知らせを削除してもよろしいですか?")) return;
    const token = localStorage.getItem(TOKEN_KEY) || "";
    await fetch(`/api/boards/notice/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (detail?.wr_id === id) setDetail(null);
    loadList(page);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ background: "#fff", minHeight: "60vh" }}>
      <div style={{ background: "#f8faf9", borderBottom: "1px solid #e8f0eb", padding: "44px 0 36px" }}>
        <div className="page-wrap">
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#8B5E3C", letterSpacing: "0.15em", textTransform: "uppercase" }}>Notice</p>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.5px" }}>お知らせ</h1>
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

        {/* 글쓰기 / 수정 폼 */}
        {showForm && isAdmin && (
          <form onSubmit={handleWrite} style={{
            background: "#f8faf9", border: "1.5px solid #DEC4A8", borderRadius: 12,
            padding: "24px", marginBottom: 24,
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>
              {editTarget ? "お知らせを編集" : "新しいお知らせを作成"}
            </h3>
            {formErr && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#e53935", background: "#fff5f5", borderRadius: 6, padding: "8px 12px" }}>{formErr}</p>}
            <input
              value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="タイトル"
              style={{ width: "100%", border: "1.5px solid #d0e8d8", borderRadius: 8, padding: "11px 14px", fontSize: 14, marginBottom: 10, boxSizing: "border-box", outline: "none" }}
            />
            <textarea
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="内容"
              rows={6}
              style={{ width: "100%", border: "1.5px solid #d0e8d8", borderRadius: 8, padding: "11px 14px", fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none" }}
            />
            {/* 공지 체크박스 */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#8B5E3C" }}>
              <input
                type="checkbox"
                checked={form.is_notice}
                onChange={e => setForm(f => ({ ...f, is_notice: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: "#8B5E3C" }}
              />
              重要なお知らせとして登録 (一覧の最上部に固定)
            </label>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    {detail.is_notice === 1 && (
                      <span style={{ background: "#8B5E3C", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>お知らせ</span>
                    )}
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>{detail.wr_subject}</h2>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#888" }}>
                    <span>投稿者: <strong style={{ color: "#555" }}>{detail.wr_name}</strong></span>
                    <span>{fmtDate(detail.wr_datetime)}</span>
                    <span>閲覧数 {detail.wr_hit}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {isAdmin && (
                    <>
                      <button onClick={() => openEditForm(detail as unknown as Post)} style={{ background: "#fff", border: "1px solid #DEC4A8", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#8B5E3C", cursor: "pointer", fontWeight: 600 }}>編集</button>
                      <button onClick={() => handleDelete(detail.wr_id)} style={{ background: "#fff", border: "1px solid #fcc", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#e53935", cursor: "pointer", fontWeight: 600 }}>削除</button>
                    </>
                  )}
                  <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", padding: 4 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div style={{ padding: "24px", fontSize: 14, color: "#333", lineHeight: 1.85 }}>
              {detail.wr_content.startsWith("<") ? (
                <div dangerouslySetInnerHTML={{ __html: detail.wr_content }} />
              ) : (
                detail.wr_content.split("\n").map((l, i) => <p key={i} style={{ margin: i === 0 ? 0 : "6px 0 0" }}>{l}</p>)
              )}
              {detail.files?.filter(f => f.isImage).map(f => (
                <img key={f.filename} src={f.url} alt={f.originalname} style={{ maxWidth: "100%", marginTop: 16, borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}

        {/* 목록 테이블 */}
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>読み込み中...</div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>読み込み中...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
            <p style={{ fontSize: 16, fontWeight: 700 }}>登録されたお知らせはありません</p>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 60px", gap: 0, background: "#f5f5f5", borderTop: "2px solid #1a1a1a", borderBottom: "1px solid #e0e0e0", padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#555" }}>
              <span style={{ textAlign: "center" }}>番号</span>
              <span>タイトル</span>
              <span style={{ textAlign: "center" }}>投稿者</span>
              <span style={{ textAlign: "center" }}>日付</span>
              <span style={{ textAlign: "center" }}>閲覧</span>
            </div>
            {posts.map((p, i) => (
              <div
                key={p.wr_id}
                onClick={() => openDetail(p.wr_id)}
                style={{
                  display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 60px",
                  gap: 0, padding: "13px 12px", cursor: "pointer",
                  borderBottom: "1px solid #efefef",
                  background: p.is_notice === 1
                    ? (detail?.wr_id === p.wr_id ? "#e6f7f0" : "#f5fcf8")
                    : (detail?.wr_id === p.wr_id ? "#FDF6EE" : "transparent"),
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => { if (detail?.wr_id !== p.wr_id) (e.currentTarget as HTMLElement).style.background = p.is_notice === 1 ? "#ecf9f3" : "#fafafa"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = p.is_notice === 1 ? (detail?.wr_id === p.wr_id ? "#e6f7f0" : "#f5fcf8") : (detail?.wr_id === p.wr_id ? "#FDF6EE" : "transparent"); }}
              >
                <span style={{ textAlign: "center", fontSize: 13 }}>
                  {p.is_notice === 1
                    ? <span style={{ background: "#8B5E3C", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>お知らせ</span>
                    : <span style={{ color: "#999" }}>{total - (page - 1) * PAGE_SIZE - i + posts.filter((x, j) => j < i && x.is_notice === 1).length}</span>
                  }
                </span>
                <span style={{ fontSize: 14, color: p.is_notice === 1 ? "#8B5E3C" : "#222", fontWeight: p.is_notice === 1 ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.wr_subject}
                  {p.wr_file > 0 && <span style={{ marginLeft: 6, fontSize: 11, color: "#8B5E3C" }}>📎</span>}
                  {p.wr_comment > 0 && <span style={{ marginLeft: 4, fontSize: 11, color: "#e88b2a" }}>[{p.wr_comment}]</span>}
                </span>
                <span style={{ textAlign: "center", fontSize: 12, color: "#777" }}>{p.wr_name}</span>
                <span style={{ textAlign: "center", fontSize: 12, color: "#999" }}>{fmtDate(p.wr_datetime)}</span>
                <span style={{ textAlign: "center", fontSize: 12, color: "#999" }}>{p.wr_hit}</span>
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
