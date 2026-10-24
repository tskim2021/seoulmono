import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";

interface NoticeDetail {
  wr_id: number;
  wr_subject: string;
  wr_content: string;
  wr_name: string;
  mb_id: string;
  wr_datetime: string;
  wr_hit: number;
  wr_comment: number;
  files: { filename: string; originalname: string; size: number; url: string; isImage: boolean }[];
}

function fmtDate(dt: string) {
  return dt ? dt.slice(0, 10) : "";
}

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/boards/notice/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setNotice(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      <div style={{ background: "#f8faf9", borderBottom: "1px solid #e8f0eb", padding: "44px 0 36px" }}>
        <div className="page-wrap">
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#8B5E3C", letterSpacing: "0.15em", textTransform: "uppercase" }}>Notice</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#1a1a1a" }}>공지사항</h1>
        </div>
      </div>

      <div className="page-wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
        <button
          onClick={() => navigate("/notices")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "#555", marginBottom: 20 }}
        >
          ← 목록으로
        </button>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#aaa" }}>불러오는 중...</div>
        )}

        {notFound && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
            <p style={{ fontSize: 18, fontWeight: 700 }}>공지사항을 찾을 수 없습니다</p>
          </div>
        )}

        {notice && (
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }}>
            {/* 헤더 */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #f0f0f0", background: "#FDF6EE" }}>
              <span style={{ display: "inline-block", background: "#8B5E3C", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>공지</span>
              <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: "#111", lineHeight: 1.4 }}>
                {notice.wr_subject}
              </h2>
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#999" }}>
                <span>작성자: <strong style={{ color: "#555" }}>{notice.wr_name}</strong></span>
                <span>{fmtDate(notice.wr_datetime)}</span>
                <span>조회 {notice.wr_hit}</span>
              </div>
            </div>

            {/* 본문 */}
            <div style={{ padding: "28px 28px 24px", fontSize: 15, color: "#333", lineHeight: 1.9 }}>
              {notice.wr_content.startsWith("<") ? (
                <div dangerouslySetInnerHTML={{ __html: notice.wr_content }} />
              ) : (
                notice.wr_content.split("\n").map((l, i) => (
                  <p key={i} style={{ margin: i === 0 ? 0 : "8px 0 0" }}>{l}</p>
                ))
              )}
              {/* 첨부 이미지 */}
              {notice.files?.filter(f => f.isImage).map(f => (
                <img key={f.filename} src={f.url} alt={f.originalname} style={{ maxWidth: "100%", marginTop: 16, borderRadius: 8 }} />
              ))}
            </div>

            {/* 하단 버튼 */}
            <div style={{ padding: "16px 28px 24px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => navigate("/notices")}
                style={{ padding: "12px 32px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
