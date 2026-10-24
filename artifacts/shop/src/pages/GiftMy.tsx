import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Package, ChevronRight, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "주소 대기중", color: "bg-amber-100 text-amber-700" },
  address_filled: { label: "배송지 입력완료", color: "bg-green-100 text-green-700" },
};

interface GiftOrder {
  id: number; token: string; set_name: string; slot_count: number;
  recipient_name?: string; recipient_phone?: string; status: string;
  created_at: string; sender_message?: string;
  items: { it_id: string; it_name: string; it_img1: string }[];
}

export default function GiftMyPage() {
  const { user, token } = useAuth();
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<GiftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { navigate(`${BASE}/login`); return; }
    fetch("/api/shop/gift/orders/my", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const copyLink = (t: string) => {
    const link = `${window.location.origin}${BASE}/gift/recipient/${t}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(t);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const giftLink = (t: string) => `${window.location.origin}${BASE}/gift/recipient/${t}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-rose-400 via-pink-400 to-orange-300 text-white px-4 py-10">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-3 backdrop-blur-sm">
            <Gift size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold">보낸 선물</h1>
          <p className="text-white/70 text-sm mt-1">내가 보낸 선물 목록입니다</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pb-20 mt-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-pink-400" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Gift size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">보낸 선물이 없습니다</p>
            <button onClick={() => navigate(`${BASE}/gift`)}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full text-sm font-semibold shadow-md">
              선물 보내기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const status = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600" };
              const isExpanded = expanded === order.id;
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button onClick={() => navigate(`${BASE}/gift/order/${order.id}`)}
                    className="w-full p-4 text-left flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 text-sm truncate">{order.set_name}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(order.created_at)}</p>
                      {order.recipient_name && (
                        <p className="text-xs text-gray-500">받는 분: {order.recipient_name}</p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
