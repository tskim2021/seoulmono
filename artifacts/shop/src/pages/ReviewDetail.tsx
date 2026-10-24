import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";

const BASE_URL = import.meta.env.BASE_URL;

interface ReviewDetail {
  is_id: number;
  it_id: string;
  it_name: string;
  it_img1: string;
  mb_id_masked: string;
  is_score: number;
  is_subject: string;
  is_content: string;
  is_imgs: string[];
  is_time: string;
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/shop/reviews/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setReview(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const stars = review ? Array.from({ length: 5 }, (_, i) => i < review.is_score) : [];
  const dateStr = review?.is_time
    ? new Date(review.is_time).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
        .replace(/\. /g, "-").replace(".", "")
    : "";

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "44px 0 36px" }}>
        <div className="page-wrap">
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#8B5E3C", letterSpacing: "0.15em", textTransform: "uppercase" }}>Review</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#1a1a1a" }}>お客様レビュー</h1>
        </div>
      </div>

      <div className="page-wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
        <button
          onClick={() => navigate("/reviews")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "#555", marginBottom: 20 }}
        >
          ← 一覧へ
        </button>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#aaa" }}>読み込み中...</div>
        )}

        {notFound && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
            <p style={{ fontSize: 18, fontWeight: 700 }}>レビューが見つかりません</p>
          </div>
        )}

        {review && (
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }}>
            {/* 헤더 */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
                {stars.map((filled, i) => (
                  <span key={i} style={{ fontSize: 20, color: filled ? "#F9A11B" : "#e0e0e0" }}>★</span>
                ))}
              </div>
              <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "#111", lineHeight: 1.4 }}>
                {review.is_subject}
              </h2>
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#999" }}>
                <span>{review.mb_id_masked}</span>
                <span>{dateStr}</span>
              </div>
            </div>

            {/* 상품 정보 */}
            {review.it_name && (
              <div
                onClick={() => navigate(`/item/${review.it_id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "16px 28px",
                  borderBottom: "1px solid #f0f0f0", cursor: "pointer", background: "#fff",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8faf9")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                {review.it_img1 && (
                  <div style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", border: "1px solid #eee", flexShrink: 0 }}>
                    <img src={review.it_img1} alt={review.it_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} loading="lazy" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 11, color: "#8B5E3C", fontWeight: 700 }}>購入商品</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#222", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {review.it_name}
                  </p>
                </div>
                <span style={{ fontSize: 12, color: "#8B5E3C", fontWeight: 700, flexShrink: 0 }}>商品を見る →</span>
              </div>
            )}

            {/* 리뷰 본문 */}
            <div style={{ padding: "28px 28px 24px" }}>
              <p style={{ margin: 0, fontSize: 15, color: "#333", lineHeight: 2, whiteSpace: "pre-wrap" }}>
                {review.is_content}
              </p>

              {/* 리뷰 이미지들 */}
              {review.is_imgs && review.is_imgs.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
                  {review.is_imgs.map((src, i) => (
                    <div key={i} style={{ width: 120, height: 120, borderRadius: 10, overflow: "hidden", border: "1px solid #eee" }}>
                      <img src={src} alt={`レビュー画像 ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div style={{ padding: "16px 28px 24px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => navigate("/reviews")}
                style={{ padding: "12px 32px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >
                一覧に戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
