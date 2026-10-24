import React, { useState, useMemo, useEffect } from "react";
import { ja } from "../lib/ja";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useGetOrders, useUpdateOrderStatus, getGetOrdersQueryKey, type Order } from "@workspace/api-client-react";
import { Card, Badge, Modal, Button, Input, Label } from "../components/ui";
import { formatCurrency, getStatusColor, cn } from "../lib/utils";
import { format } from "date-fns";
import {
  Search, Loader2, Edit, ChevronDown, ChevronRight, Truck,
  Package, MapPin, Phone, Building2, ExternalLink, CheckSquare,
  Square, Filter, X, Calendar, User, Hash, ClipboardList, Download, Upload, Gift,
  RotateCcw, AlertCircle
} from "lucide-react";
import { toast } from "../hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import TrackingModal from "../components/TrackingModal";

// ── Gift orders ─────────────────────────────────────────────────────────────
const GIFT_STATUS_LABEL: Record<string, string> = {
  pending: "待機中",
  address_filled: "住所入力済み",
  shipped: "配送中",
  done: "完了",
};
const GIFT_STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  address_filled: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  done: "bg-emerald-100 text-emerald-700",
};

function useGiftOrders() {
  return useQuery({
    queryKey: ["admin-gift-orders"],
    queryFn: () => customFetch<{ orders: any[]; total: number }>("/api/shop-admin/gift/orders?limit=200"),
  });
}

function GiftOrdersPanel() {
  const { data, isLoading } = useGiftOrders();
  const orders: any[] = data?.orders ?? [];
  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (orders.length === 0)
    return (
      <Card className="py-20 text-center">
        <Gift className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700">ギフト注文がありません</h3>
      </Card>
    );
  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">注文日時 / 番号</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">送り主</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">ギフトセット</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">受取人</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center whitespace-nowrap">構成</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center whitespace-nowrap w-32">ステータス</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center whitespace-nowrap w-24">受信リンク</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o: any) => (
              <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-bold text-sm whitespace-nowrap">{new Date(o.created_at).toLocaleDateString("ko-KR")}</p>
                  <p className="text-xs text-blue-500 font-mono mt-0.5">#{o.id}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-900 text-sm">{o.sender_mb_id || "未ログイン"}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-bold text-slate-700">{o.set_name || "-"}</p>
                  {o.sender_message && <p className="text-xs text-slate-400 italic mt-0.5 truncate max-w-[200px]">"{o.sender_message}"</p>}
                </td>
                <td className="px-4 py-3">
                  {o.recipient_name
                    ? <><p className="text-sm font-bold text-slate-800">{o.recipient_name}</p><p className="text-xs text-slate-500">{o.recipient_phone}</p></>
                    : <span className="text-xs text-slate-300">未入力</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-bold text-slate-700">{o.slot_count}点構成</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-bold", GIFT_STATUS_COLOR[o.status] ?? "bg-slate-100 text-slate-600")}>
                    {GIFT_STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <a
                    href={`/shop/gift/recipient/${o.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    リンクを開く →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function useGetPartners() {
  return useQuery({
    queryKey: ["order-partners"],
    queryFn: () => customFetch<{ partners: { mb_id: string; mb_name: string; company_name: string }[] }>("/api/orders/partners"),
  });
}

function useBatchUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { order_ids: string[]; status: string; delivery_company?: string; invoice_numbers?: Record<string, string> }) =>
      customFetch<{ message: string; updated: number }>("/api/orders/batch-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (data: any) => {
      toast({ title: "一括処理完了", description: data.message });
      qc.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
    },
  });
}

const STATUS_OPTIONS = ["전체", "주문접수", "처리중", "배송준비", "배송중", "배송완료", "취소"] as const;

const CLAIM_STATUS_OPTIONS = ["전체", "접수", "처리중", "승인", "반려", "완료"] as const;
const CLAIM_TYPE_COLORS: Record<string, string> = {
  "교환": "bg-purple-100 text-purple-700",
  "반품": "bg-red-100 text-red-700",
  "환불": "bg-orange-100 text-orange-700",
  "취소": "bg-gray-100 text-gray-700",
};
const CLAIM_STATUS_COLORS: Record<string, string> = {
  "접수": "bg-amber-100 text-amber-700",
  "처리중": "bg-blue-100 text-blue-700",
  "승인": "bg-emerald-100 text-emerald-700",
  "반려": "bg-red-100 text-red-700",
  "완료": "bg-gray-100 text-gray-600",
};

function useAdminClaims(status: string) {
  return useQuery({
    queryKey: ["admin-claims", status],
    queryFn: () => {
      const qs = status && status !== "전체" ? `?status=${encodeURIComponent(status)}` : "";
      return customFetch<{ claims: any[] }>(`/api/shop-admin/claims${qs}`);
    },
  });
}

function ClaimsAdminPanel() {
  const queryClient = useQueryClient();
  const [claimStatusFilter, setClaimStatusFilter] = useState("전체");
  const [editingClaim, setEditingClaim] = useState<any>(null);
  const [editClaimStatus, setEditClaimStatus] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: claimsData, isLoading: claimsLoading } = useAdminClaims(claimStatusFilter);
  const claims = claimsData?.claims || [];

  const openEdit = (claim: any) => {
    setEditingClaim(claim);
    setEditClaimStatus(claim.status);
    setEditMemo(claim.admin_memo || "");
  };

  const handleSave = async () => {
    if (!editingClaim) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const base = import.meta.env.BASE_URL || "/";
      const res = await fetch(`${base}api/shop-admin/claims/${editingClaim.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: editClaimStatus, admin_memo: editMemo }),
      });
      if (!res.ok) throw new Error("保存に失敗しました");
      toast({ title: "保存完了", description: "クレームを処理しました。" });
      queryClient.invalidateQueries({ queryKey: ["admin-claims"] });
      setEditingClaim(null);
    } catch (e: any) {
      toast({ title: "エラー", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {CLAIM_STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => setClaimStatusFilter(s)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-bold border transition-all",
              claimStatusFilter === s ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary"
            )}>
            {ja(s)}
          </button>
        ))}
      </div>

      {claimsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      ) : claims.length === 0 ? (
        <Card className="py-20 text-center">
          <RotateCcw className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-600">クレーム履歴がありません</h3>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">受付日時</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">種別 / ステータス</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">注文番号</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">お客様 / 商品</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">理由</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">管理者メモ</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-16 text-center">管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-slate-700 font-medium">{new Date(c.created_at).toLocaleDateString("ko-KR")}</p>
                      <p className="text-xs text-slate-400">{new Date(c.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-bold block w-fit mb-1.5", CLAIM_TYPE_COLORS[c.claim_type] || "bg-gray-100 text-gray-700")}>{ja(c.claim_type)}</span>
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-bold block w-fit", CLAIM_STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700")}>{ja(c.status)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-mono text-blue-600 font-bold">#{c.od_id}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.od_b_name || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{c.mb_name || c.mb_id}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{c.first_item || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 max-w-[200px] line-clamp-2">{c.reason}</p>
                    </td>
                    <td className="px-4 py-3">
                      {c.admin_memo
                        ? <p className="text-sm text-slate-500 max-w-[160px] line-clamp-2">{c.admin_memo}</p>
                        : <span className="text-xs text-slate-300">なし</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)} className="h-7 text-xs px-2">
                        <Edit className="w-3.5 h-3.5 mr-0.5" /> 処理
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={!!editingClaim} onClose={() => setEditingClaim(null)} title="クレーム処理">
        {editingClaim && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-1.5">
              <p><span className="text-slate-500 font-bold mr-2">注文番号:</span><span className="font-mono text-blue-600 font-bold">#{editingClaim.od_id}</span></p>
              <p><span className="text-slate-500 font-bold mr-2">リクエスト種別:</span><span className={cn("text-xs px-2 py-0.5 rounded-full font-bold", CLAIM_TYPE_COLORS[editingClaim.claim_type])}>{ja(editingClaim.claim_type)}</span></p>
              <p><span className="text-slate-500 font-bold mr-2">お客様:</span><span>{editingClaim.mb_name || editingClaim.mb_id} {editingClaim.mb_hp ? `(${editingClaim.mb_hp})` : ""}</span></p>
              <p><span className="text-slate-500 font-bold mr-2">理由:</span><span className="text-slate-700">{editingClaim.reason}</span></p>
            </div>
            <div>
              <Label>処理ステータス</Label>
              <select className="w-full px-4 py-3 rounded-xl bg-white border-2 border-border font-bold focus:outline-none focus:border-primary transition-all"
                value={editClaimStatus} onChange={e => setEditClaimStatus(e.target.value)}>
                {["접수", "처리중", "승인", "반려", "완료"].map(s => (
                  <option key={s} value={s}>{ja(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>管理者メモ (お客様に表示されます)</Label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-border focus:outline-none focus:border-primary transition-all resize-y min-h-[80px] text-sm font-normal"
                value={editMemo} onChange={e => setEditMemo(e.target.value)}
                placeholder="処理内容、ご案内事項などを入力してください"
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingClaim(null)}>閉じる</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存する"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [loc] = useLocation();
  const [orderType, setOrderType] = useState<"일반" | "선물하기" | "클레임" | "특별지역">("일반");
  const [specialCity, setSpecialCity] = useState<"전체" | "포천" | "양주" | "동두천" | "의정부">("전체");
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("status") || "전체";
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const updateStatusFilter = (value: string) => {
    setStatusFilter(value);
    const url = new URL(window.location.href);
    if (value && value !== "전체") {
      url.searchParams.set("status", value);
    } else {
      url.searchParams.delete("status");
    }
    window.history.replaceState({}, "", url.toString());
    window.dispatchEvent(new Event("order-status-change"));
  };

  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      setStatusFilter(params.get("status") || "전체");
    };
    window.addEventListener("order-status-change", handler);
    window.addEventListener("popstate", handler);
    return () => {
      window.removeEventListener("order-status-change", handler);
      window.removeEventListener("popstate", handler);
    };
  }, []);
  const [partnerFilter, setPartnerFilter] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState("배송중");
  const [batchInvoiceNumbers, setBatchInvoiceNumbers] = useState<Record<string, string>>({});
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("주문접수");
  const [editDeliveryCompany, setEditDeliveryCompany] = useState("CJ대한통운");
  const [editInvoiceNo, setEditInvoiceNo] = useState("");

  const { data: partnersData } = useGetPartners();
  const { data, isLoading } = useGetOrders({
    page: 1,
    limit: pageSize,
    status: statusFilter !== "전체" ? statusFilter : undefined,
    search: search || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    partner: partnerFilter || undefined,
    special_region: orderType === "특별지역" ? "true" : undefined,
    special_city: orderType === "특별지역" && specialCity !== "전체" ? specialCity : undefined,
  } as any);

  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        toast({ title: "更新完了", description: "注文ステータスを変更しました。" });
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        setEditingOrder(null);
      },
    },
  });

  const { mutate: batchUpdate, isPending: isBatchUpdating } = useBatchUpdateStatus();

  const orders = data?.orders || [];

  const partnerGroups = useMemo(() => {
    const groups: Record<string, { company_name: string; mb_id: string; mb_name: string; orders: any[] }> = {};
    for (const o of orders) {
      const key = o.mb_id;
      if (!groups[key]) {
        groups[key] = { company_name: o.company_name || "", mb_id: o.mb_id, mb_name: o.mb_name || "", orders: [] };
      }
      groups[key].orders.push(o);
    }
    return groups;
  }, [orders]);

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.od_id)));
    }
  };

  const selectPartnerOrders = (mbId: string) => {
    const partnerOrderIds = orders.filter((o) => o.mb_id === mbId).map((o) => o.od_id);
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      const allSelected = partnerOrderIds.every((id) => prev.has(id));
      if (allSelected) {
        partnerOrderIds.forEach((id) => next.delete(id));
      } else {
        partnerOrderIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const openBatchModal = () => {
    if (selectedOrders.size === 0) {
      toast({ title: "注文を選択してください", variant: "destructive" });
      return;
    }
    setBatchInvoiceNumbers({});
    setBatchModalOpen(true);
  };

  const handleBatchUpdate = () => {
    batchUpdate({
      order_ids: Array.from(selectedOrders),
      status: batchStatus,
      delivery_company: (batchStatus === "배송중" || batchStatus === "배송완료") ? "CJ대한통운" : undefined,
      invoice_numbers: (batchStatus === "배송중" || batchStatus === "배송완료") ? batchInvoiceNumbers : undefined,
    }, {
      onSuccess: () => {
        setBatchModalOpen(false);
        setSelectedOrders(new Set());
      },
    });
  };

  const openEditModal = (order: any) => {
    setEditingOrder(order);
    setEditStatus(order.od_status);
    setEditDeliveryCompany(order.od_delivery_company || "CJ대한통운");
    setEditInvoiceNo(order.od_invoice_no || "");
  };

  const handleEditUpdate = () => {
    if (!editingOrder) return;
    updateOrder({
      id: editingOrder.od_id,
      data: {
        status: editStatus as any,
        delivery_company: editDeliveryCompany || undefined,
        invoice_no: editInvoiceNo || undefined,
      },
    });
  };

  const trackingUrl = (invoiceNo: string) =>
    `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${invoiceNo}`;

  const clearFilters = () => {
    setSearch("");
    updateStatusFilter("전체");
    setDateFrom("");
    setDateTo("");
    setPartnerFilter("");
  };

  const hasFilters = search || statusFilter !== "전체" || dateFrom || dateTo || partnerFilter;
  const pageSizeOptions = [10, 20, 50];

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportShipping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const token = localStorage.getItem("token");
      const base = import.meta.env.BASE_URL || "/";
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch(`${base}api/orders/import-shipping`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "アップロードに失敗しました");
      toast({
        title: "配送処理完了",
        description: result.message + (result.errors?.length ? `\nエラー: ${result.errors.join(", ")}` : ""),
      });
      queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
    } catch (err: any) {
      toast({ title: "アップロードに失敗しました", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExportShipping = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (partnerFilter) params.set("partner", partnerFilter);
      const token = localStorage.getItem("token");
      const base = import.meta.env.BASE_URL || "/";
      const resp = await fetch(`${base}api/orders/export-shipping?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("ダウンロードに失敗しました");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.download = `配送依頼_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "ダウンロード完了", description: "配送依頼のExcelファイルをダウンロードしました" });
    } catch (e: any) {
      toast({ title: "ダウンロードに失敗しました", description: e.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">発注・注文管理</h1>
          <p className="text-slate-500 mt-1 font-medium">取引先の発注履歴の確認、ステータス変更、配送処理</p>
        </div>
        {(orderType === "일반" || orderType === "특별지역") && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" onClick={handleExportShipping} disabled={isExporting} className="h-10 border-green-300 text-green-700 hover:bg-green-50">
              {isExporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
              配送依頼Excelダウンロード
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportShipping} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="h-10 border-blue-300 text-blue-700 hover:bg-blue-50">
              {isImporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
              配送処理Excelアップロード
            </Button>
            {selectedOrders.size > 0 && (
              <>
                <span className="text-sm font-bold text-blue-600">{selectedOrders.size}件選択中</span>
                <Button onClick={openBatchModal} className="h-10"><Truck className="w-4 h-4 mr-1.5" />一括配送処理</Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedOrders(new Set())}>選択解除</Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 주문 유형 탭 */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {([
          { type: "일반", icon: <Package className="w-4 h-4" />, label: "一般注文" },
          { type: "선물하기", icon: <Gift className="w-4 h-4" />, label: "ギフト注文" },
          { type: "특별지역", icon: <MapPin className="w-4 h-4" />, label: "特別地域" },
          { type: "클레임", icon: <RotateCcw className="w-4 h-4" />, label: "クレーム管理" },
        ] as const).map(({ type, icon, label }) => (
          <button
            key={type}
            onClick={() => setOrderType(type as any)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              orderType === type ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* 특별지역 서브탭 + 안내 배너 */}
      {orderType === "특별지역" && (
        <div className="space-y-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
            {(["전체", "포천", "양주", "동두천", "의정부"] as const).map((city) => (
              <button
                key={city}
                onClick={() => setSpecialCity(city)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  specialCity === city ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <MapPin className="w-3.5 h-3.5" />{city === "전체" ? "全地域" : ja(city)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {specialCity === "전체"
              ? "東豆川・議政府・楊州・抱川の住所の注文のみ表示されます。"
              : `${ja(specialCity)}の住所の注文のみ表示されます。`}
          </div>
        </div>
      )}

      {/* 선물하기 주문 */}
      {orderType === "선물하기" && <GiftOrdersPanel />}

      {/* 클레임 관리 */}
      {orderType === "클레임" && <ClaimsAdminPanel />}

      {/* 일반 / 특별지역 주문 */}
      {(orderType === "일반" || orderType === "특별지역") && (
      <div className="space-y-6">
      <div className="flex justify-end">
        <select
          className="h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}件ずつ表示</option>
          ))}
        </select>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">検索・フィルター</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
              <X className="w-3 h-3" /> リセット
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10 h-10"
              placeholder="注文番号、名前、会社名で検索..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
            value={statusFilter}
            onChange={(e) => updateStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{ja(s)}</option>
            ))}
          </select>

          <select
            className="h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
          >
            <option value="">すべての取引先</option>
            {partnersData?.partners?.map((p: any) => (
              <option key={p.mb_id} value={p.mb_id}>
                {p.company_name || p.mb_name} ({p.mb_id})
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 h-10 px-3 rounded-xl bg-white border-2 border-border text-sm focus:outline-none focus:border-primary transition-all"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="flex items-center text-slate-400 text-sm">~</span>
            <input
              type="date"
              className="flex-1 h-10 px-3 rounded-xl bg-white border-2 border-border text-sm focus:outline-none focus:border-primary transition-all"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-slate-500 font-medium">
          合計 <span className="font-bold text-primary">{data?.total ?? 0}</span>件
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="py-20 text-center">
          <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">注文履歴がありません</h3>
          <p className="text-slate-500 mt-2">検索条件を変更してお試しください。</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-2 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600 transition-colors">
                      {selectedOrders.size === orders.length && orders.length > 0
                        ? <CheckSquare className="w-5 h-5 text-blue-600" />
                        : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="px-1 py-3 w-8"></th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">注文日時 / 番号</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">取引先</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase">商品サマリー</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase text-right whitespace-nowrap">決済金額</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase text-center whitespace-nowrap w-20">ステータス</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase text-center whitespace-nowrap w-28">配送情報</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase text-center whitespace-nowrap w-16">管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order: any) => {
                  const isExpanded = expandedOrders.has(order.od_id);
                  const isSelected = selectedOrders.has(order.od_id);

                  return (
                    <OrderRow
                      key={order.od_id}
                      order={order}
                      isExpanded={isExpanded}
                      isSelected={isSelected}
                      onToggleExpand={() => toggleExpand(order.od_id)}
                      onToggleSelect={() => toggleSelect(order.od_id)}
                      onEdit={() => openEditModal(order)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={!!editingOrder} onClose={() => setEditingOrder(null)} title="注文ステータス / 配送情報の編集">
        {editingOrder && (
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-1">
              <p><span className="text-slate-500 font-bold mr-2">注文番号:</span><span className="font-bold text-slate-900">#{editingOrder.od_id}</span></p>
              <p><span className="text-slate-500 font-bold mr-2">取引先:</span><span className="font-bold text-slate-900">{editingOrder.company_name}</span></p>
              <p><span className="text-slate-500 font-bold mr-2">金額:</span><span className="font-bold text-slate-900">{formatCurrency(editingOrder.od_receipt_price)}</span></p>
            </div>

            <div>
              <Label>処理ステータス</Label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 font-bold"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="주문접수">注文受付</option>
                <option value="처리중">処理中</option>
                <option value="배송준비">配送準備</option>
                <option value="배송중">配送中</option>
                <option value="배송완료">配送完了</option>
                <option value="취소">キャンセル</option>
              </select>
            </div>

            <div>
              <Label>配送業者</Label>
              <Input value={editDeliveryCompany} onChange={(e: any) => setEditDeliveryCompany(e.target.value)} placeholder="CJ대한통운" />
            </div>
            <div>
              <Label>送り状番号</Label>
              <Input value={editInvoiceNo} onChange={(e: any) => setEditInvoiceNo(e.target.value)} placeholder="送り状番号を入力" />
              {editInvoiceNo && (
                <a
                  href={trackingUrl(editInvoiceNo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 font-bold"
                >
                  <Truck className="w-3 h-3" /> CJ大韓通運 配送照会 <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingOrder(null)}>キャンセル</Button>
              <Button onClick={handleEditUpdate} disabled={isUpdating}>
                {isUpdating ? "保存中..." : "保存する"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="一括配送処理">
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <p className="font-bold text-blue-800">{selectedOrders.size}件の注文を一括処理します。</p>
          </div>

          <div>
            <Label>変更するステータス</Label>
            <select
              className="w-full px-4 py-3 rounded-xl bg-white border-2 border-border font-bold focus:outline-none focus:border-primary transition-all"
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value)}
            >
              <option value="처리중">処理中</option>
              <option value="배송준비">配送準備</option>
              <option value="배송중">配送中</option>
              <option value="배송완료">配送完了</option>
            </select>
          </div>

          {(batchStatus === "배송중" || batchStatus === "배송완료") && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1">配送業者: CJ大韓通運 (固定)</p>
                <p className="text-xs text-slate-400">各注文の送り状番号を入力してください。空欄の場合は送り状番号なしで処理されます。</p>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {Array.from(selectedOrders).map((odId) => {
                  const order = orders.find((o: any) => o.od_id === odId);
                  return (
                    <div key={odId} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">#{odId}</p>
                        <p className="text-xs text-slate-500 truncate">{order?.company_name}</p>
                      </div>
                      <Input
                        className="w-48 h-8 text-sm"
                        placeholder="送り状番号"
                        value={batchInvoiceNumbers[odId] || ""}
                        onChange={(e: any) => setBatchInvoiceNumbers((prev) => ({ ...prev, [odId]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBatchModalOpen(false)}>キャンセル</Button>
            <Button onClick={handleBatchUpdate} disabled={isBatchUpdating}>
              {isBatchUpdating ? "処理中..." : `${selectedOrders.size}件を一括処理`}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onEdit,
}: {
  order: any;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onEdit: () => void;
}) {
  const items = order.items || [];
  const shipping = order.shipping;
  const [showTracking, setShowTracking] = useState(false);

  return (
    <>
      <tr className={cn("hover:bg-slate-50/50 group transition-colors", isSelected && "bg-blue-50/50")}>
        <td className="px-2 py-3">
          <button onClick={onToggleSelect} className="text-slate-400 hover:text-blue-600 transition-colors">
            {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
          </button>
        </td>
        <td className="px-1 py-3">
          <button onClick={onToggleExpand} className="text-slate-400 hover:text-slate-700 transition-colors">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </td>
        <td className="px-3 py-3">
          <Link href={`/orders/${order.od_id}`} className="hover:text-blue-600 transition-colors">
            <p className="font-bold text-sm hover:underline whitespace-nowrap">{format(new Date(order.od_time), "yy.MM.dd HH:mm")}</p>
            <p className="text-xs text-blue-500 mt-0.5 font-mono hover:underline">#{order.od_id}</p>
          </Link>
        </td>
        <td className="px-3 py-3">
          <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{order.company_name || "-"}</p>
          <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{order.mb_name} ({order.mb_id})</p>
        </td>
        <td className="px-3 py-3">
          <Link href={`/orders/${order.od_id}`} className="hover:text-blue-600 transition-colors">
            <p className="text-sm font-bold text-slate-700 hover:underline">
              {items.length > 0
                ? `${items[0].it_name}${items.length > 1 ? ` 他${items.length - 1}件` : ""}`
                : `商品 ${order.item_count || 0}種類`}
            </p>
          </Link>
          {order.od_memo && <p className="text-xs text-amber-600 mt-0.5 truncate max-w-[180px]">ご要望: {order.od_memo}</p>}
        </td>
        <td className="px-3 py-3 text-right whitespace-nowrap">
          <span className="font-black text-slate-900">{formatCurrency(order.od_receipt_price)}</span>
        </td>
        <td className="px-3 py-3 text-center whitespace-nowrap w-20">
          <Badge className={cn("text-xs", getStatusColor(order.od_status))}>{ja(order.od_status)}</Badge>
        </td>
        <td className="px-3 py-3 text-center whitespace-nowrap w-28">
          {order.od_invoice_no ? (
            <div className="space-y-0.5">
              <Badge className="bg-blue-100 text-blue-700 text-[10px] font-bold">
                {ja(order.od_delivery_company || "CJ대한통운")}
              </Badge>
              <button
                onClick={() => setShowTracking(true)}
                className="flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold w-full"
              >
                <Truck className="w-3 h-3 shrink-0" />
                <span className="truncate">{order.od_invoice_no}</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-300">未登録</span>
          )}
        </td>
        <td className="px-2 py-3 text-center whitespace-nowrap w-16">
          <Button variant="outline" size="sm" onClick={onEdit} className="h-7 text-xs px-2">
            <Edit className="w-3.5 h-3.5 mr-0.5" /> 編集
          </Button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={9} className="bg-slate-50/80 border-b border-slate-200">
            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> 注文商品 ({items.length}件)
                </h4>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {items.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-slate-900">{item.it_name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.it_maker ? `${item.it_maker} · ` : ""}{formatCurrency(item.ct_price)} x {item.ct_qty}個</p>
                          </div>
                          <span className="font-black text-slate-900 text-sm">{formatCurrency(item.ct_price * item.ct_qty)}</span>
                        </div>
                      ))}
                      <div className="px-4 py-3 bg-slate-50/50 flex justify-between">
                        <span className="text-sm text-slate-600 font-bold">合計 (送料 {order.od_send_cost ? formatCurrency(order.od_send_cost) : "込み"})</span>
                        <span className="font-black text-primary text-lg">{formatCurrency(order.od_receipt_price)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-slate-400">商品情報なし</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> 取引先情報
                  </h4>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">会社名</span>
                      <span className="font-bold text-slate-900">{order.company_name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">担当者</span>
                      <span className="text-slate-900">{order.mb_name || "-"}</span>
                    </div>
                    {order.mb_hp && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">連絡先</span>
                        <span className="text-slate-900">{order.mb_hp}</span>
                      </div>
                    )}
                    {order.business_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">事業者番号</span>
                        <span className="text-slate-900">{order.business_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> 配送先情報
                  </h4>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
                    {shipping?.name && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">受取人</span>
                        <span className="font-bold text-slate-900">{shipping.name}</span>
                      </div>
                    )}
                    {shipping?.hp && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">連絡先</span>
                        <span className="text-slate-900">{shipping.hp}</span>
                      </div>
                    )}
                    {(shipping?.addr1 || shipping?.addr2) && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold shrink-0">住所</span>
                        <span className="text-slate-900 text-right ml-2">{[shipping.addr1, shipping.addr2, shipping.addr3].filter(Boolean).join(" ")}</span>
                      </div>
                    )}
                    {shipping?.zip && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">郵便番号</span>
                        <span className="text-slate-900">{shipping.zip}</span>
                      </div>
                    )}
                    {!shipping?.name && !shipping?.addr1 && (
                      <p className="text-slate-400">配送先情報なし</p>
                    )}
                  </div>
                </div>

                {order.od_invoice_no && (
                  <button
                    onClick={() => setShowTracking(true)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm"
                  >
                    <Truck className="w-4 h-4" />
                    配送状況を照会
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
      {showTracking && order.od_invoice_no && (
        <TrackingModal
          invoiceNo={order.od_invoice_no}
          carrier={order.od_delivery_company || "CJ대한통운"}
          onClose={() => setShowTracking(false)}
        />
      )}
    </>
  );
}
