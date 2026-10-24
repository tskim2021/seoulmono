import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronRight, Calendar, Tag } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface ShopEvent {
  id: number;
  title: string;
  thumbnail: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  content?: string;
}

function fmtDate(d: string | null) {
  if (!d) return "";
  return d.slice(0, 10).replace(/-/g, ".");
}

function eventStatus(ev: ShopEvent): { label: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = ev.start_date ? new Date(ev.start_date) : null;
  const end = ev.end_date ? new Date(ev.end_date) : null;
  if (start && today < start) return { label: "開催予定", color: "#f59e0b" };
  if (end && today > end) return { label: "終了", color: "#9ca3af" };
  return { label: "開催中", color: "#10b981" };
}

export default function EventsPage() {
  const [, navigate] = useLocation();
  const [events, setEvents] = useState<ShopEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop/events")
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px 60px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 28, fontSize: 13, color: "#aaa" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: 0, fontSize: 13 }}>ホーム</button>
        <ChevronRight size={13} />
        <span style={{ color: "#555", fontWeight: 600 }}>イベント</span>
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", marginBottom: 8 }}>イベント</h1>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 36 }}>ソウルモノのさまざまなイベントをチェックしてください</p>

      {loading && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>読み込み中…</div>
      )}

      {!loading && events.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Tag size={48} style={{ color: "#ddd", marginBottom: 16, display: "block", margin: "0 auto 16px" }} />
          <p style={{ color: "#bbb", fontSize: 16 }}>開催中のイベントはありません</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {events.map(ev => {
          const status = eventStatus(ev);
          return (
            <div
              key={ev.id}
              onClick={() => navigate(`/events/${ev.id}`)}
              style={{
                cursor: "pointer", borderRadius: 14, overflow: "hidden",
                border: "1px solid #e8e8e8", background: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: "relative", background: "#f3f4f6", aspectRatio: "2/1", overflow: "hidden" }}>
                {ev.thumbnail ? (
                  <img
                    src={ev.thumbnail}
                    alt={ev.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #8B5E3C, #13532f)" }}>
                    <Tag size={40} style={{ color: "rgba(255,255,255,0.4)" }} />
                  </div>
                )}
                <span style={{
                  position: "absolute", top: 12, left: 12,
                  background: status.color, color: "#fff",
                  fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                }}>
                  {status.label}
                </span>
              </div>

              {/* Info */}
              <div style={{ padding: "16px 18px 18px" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 8, lineHeight: 1.4 }}>{ev.title}</p>
                {(ev.start_date || ev.end_date) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#888" }}>
                    <Calendar size={12} />
                    <span>
                      {ev.start_date ? fmtDate(ev.start_date) : ""}
                      {ev.start_date && ev.end_date ? " ~ " : ""}
                      {ev.end_date ? fmtDate(ev.end_date) : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [ev, setEv] = useState<ShopEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/shop/events/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setEv(d))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>読み込み中…</div>
  );

  if (notFound || !ev) return (
    <div style={{ maxWidth: 800, margin: "60px auto", textAlign: "center", padding: "0 16px" }}>
      <p style={{ fontSize: 18, color: "#666", marginBottom: 24 }}>イベントが見つかりません</p>
      <button onClick={() => navigate("/events")} style={{ background: "#8B5E3C", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 14 }}>
        イベント一覧へ
      </button>
    </div>
  );

  const status = eventStatus(ev);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px 60px" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 28, fontSize: 13, color: "#aaa" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: 0, fontSize: 13 }}>ホーム</button>
        <ChevronRight size={13} />
        <button onClick={() => navigate("/events")} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: 0, fontSize: 13 }}>イベント</button>
        <ChevronRight size={13} />
        <span style={{ color: "#555", fontWeight: 600 }}>詳細</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ background: status.color, color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
            {status.label}
          </span>
          {(ev.start_date || ev.end_date) && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#888" }}>
              <Calendar size={13} />
              {ev.start_date ? fmtDate(ev.start_date) : ""}
              {ev.start_date && ev.end_date ? " ~ " : ""}
              {ev.end_date ? fmtDate(ev.end_date) : ""}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", lineHeight: 1.4 }}>{ev.title}</h1>
      </div>

      {/* Thumbnail */}
      {ev.thumbnail && (
        <div style={{ marginBottom: 32, borderRadius: 12, overflow: "hidden" }}>
          <img src={ev.thumbnail} alt={ev.title} style={{ width: "100%", display: "block" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}

      {/* Content */}
      {ev.content ? (
        <div
          className="event-content"
          dangerouslySetInnerHTML={{ __html: ev.content }}
          style={{ fontSize: 15, lineHeight: 1.8, color: "#333" }}
        />
      ) : (
        <p style={{ color: "#aaa", textAlign: "center", padding: "40px 0" }}>内容がありません</p>
      )}

      <div style={{ marginTop: 48, textAlign: "center" }}>
        <button
          onClick={() => navigate("/events")}
          style={{ background: "#f5f5f5", color: "#444", border: "none", borderRadius: 8, padding: "11px 28px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
        >
          一覧へ
        </button>
      </div>
    </div>
  );
}
