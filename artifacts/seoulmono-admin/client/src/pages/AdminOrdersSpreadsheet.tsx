import React, { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { formatOrderNumber } from "@/lib/utils";
import { detectCarrierByTracking } from "@/lib/carrierDetector";
import { toast } from "sonner";
import {
  RefreshCw, Download, Search, X, Truck, Package, Clock,
  XCircle, Columns, CheckCircle, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── 상태 매핑 ───
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:      { label: "入金前",     color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  paid:         { label: "支払い済み",   color: "bg-green-100 text-green-800 border-green-300" },
  preparing:    { label: "商品準備中", color: "bg-blue-100 text-blue-800 border-blue-300" },
  shipping:     { label: "配送中",     color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  delivered:    { label: "配送完了",   color: "bg-gray-100 text-gray-700 border-gray-300" },
  customs_hold: { label: "通関検査",   color: "bg-rose-100 text-rose-800 border-rose-300" },
  cancelled:    { label: "キャンセル",       color: "bg-red-100 text-red-700 border-red-300" },
  out_of_stock: { label: "在庫切れ",       color: "bg-orange-100 text-orange-700 border-orange-300" },
};

// ─── 탭 정의 ───
const TABS = [
  { id: "all",          label: "すべて",       statuses: "pending,paid,preparing,shipping,delivered,customs_hold,cancelled" },
  { id: "pending",      label: "入金前",     statuses: "pending" },
  { id: "paid",         label: "支払い済み",   statuses: "paid" },
  { id: "preparing",    label: "商品準備中", statuses: "preparing" },
  { id: "shipping",     label: "配送中",     statuses: "shipping" },
  { id: "delivered",    label: "配送完了",   statuses: "delivered" },
  { id: "customs_hold", label: "通関検査",   statuses: "customs_hold" },
  { id: "cancelled",       label: "キャンセル",     statuses: "cancelled" },
  { id: "partial_cancel",  label: "一部キャンセル", statuses: "partial_cancel" },
];

// ─── 컬럼 정의 ───
const COLUMNS = [
  { key: "status",       label: "配送状況",     defaultWidth: 90,  sticky: true },
  { key: "orderNumber",  label: "注文番号",     defaultWidth: 150, sticky: true },
  { key: "itemId",       label: "アイテムID",     defaultWidth: 70,  sticky: false },
  { key: "carrier",      label: "配送業者",       defaultWidth: 90,  sticky: false },
  { key: "tracking",     label: "追跡番号",     defaultWidth: 130, sticky: false },
  { key: "productName",  label: "商品名",       defaultWidth: 220, sticky: false },
  { key: "options",      label: "オプション",         defaultWidth: 120, sticky: false },
  { key: "subtotal",     label: "商品金額",     defaultWidth: 85,  sticky: false },
  { key: "qty",          label: "数量",         defaultWidth: 50,  sticky: false },
  { key: "couponDiscount", label: "クーポン割引",   defaultWidth: 80,  sticky: false },
  { key: "pointDiscount",  label: "ポイント割引", defaultWidth: 80,  sticky: false },
  { key: "totalAmount",  label: "決済金額",     defaultWidth: 90,  sticky: false },
  { key: "customer",     label: "受取人",       defaultWidth: 90,  sticky: false },
  { key: "phone",        label: "連絡先",       defaultWidth: 120, sticky: false },
  { key: "zipCode",      label: "郵便番号",     defaultWidth: 70,  sticky: false },
  { key: "address",      label: "配送先住所",     defaultWidth: 230, sticky: false },
  { key: "userEmail",    label: "注文者メール", defaultWidth: 165, sticky: false },
  { key: "memo",         label: "配送メモ",     defaultWidth: 150, sticky: false },
  { key: "adminNotes",   label: "管理者メモ",   defaultWidth: 170, sticky: false },
  { key: "orderDate",    label: "注文日時",     defaultWidth: 130, sticky: false },
  { key: "nameEn",       label: "英語氏名",     defaultWidth: 130, sticky: false },
  { key: "addressEn",    label: "英語住所",     defaultWidth: 480, sticky: false },
];

// ─── 전화번호 국제 형식 변환 ───
function formatPhoneIntl(phone: string | null | undefined): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length >= 9) {
    const rest = digits.slice(1); // 제거된 앞자리 0
    if (rest.length === 10) return `+82-${rest.slice(0,2)}-${rest.slice(2,6)}-${rest.slice(6)}`;
    if (rest.length === 9)  return `+82-${rest.slice(0,2)}-${rest.slice(2,5)}-${rest.slice(5)}`;
  }
  return phone;
}

// ─── 컬럼 리사이즈 훅 ───
function useColumnResize(initialWidths: Record<string, number>) {
  const [widths, setWidths] = useState(initialWidths);
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const onMouseDown = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = { key, startX: e.clientX, startWidth: widths[key] };
    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = ev.clientX - resizingRef.current.startX;
      const newWidth = Math.max(40, resizingRef.current.startWidth + delta);
      setWidths(prev => ({ ...prev, [resizingRef.current!.key]: newWidth }));
    };
    const onMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [widths]);

  return { widths, onMouseDown };
}

// ─── 배송 타임라인 팝오버 ───
const STATUS_STEP: Record<string, number> = {
  preparing: 1, shipping: 2, customs_hold: 3, delivered: 4,
};
const TIMELINE_STEPS = [
  { key: "preparing",    label: "発送準備" },
  { key: "shipping",     label: "配送中" },
  { key: "customs_hold", label: "通関" },
  { key: "delivered",    label: "配送完了" },
];

function TrackingTimelinePopover({ shipmentId, orderId, trackingNumber }: { shipmentId: number; orderId: number; trackingNumber?: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, refetch } = trpc.shipping.adminGetShipmentTracking.useQuery(
    { shipmentId },
    { enabled: open, staleTime: 30_000 }
  );
  const refreshMutation = trpc.shipping.adminRefreshTracking.useMutation({
    onSuccess: () => { refetch(); },
  });
  const history = data?.history ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex-shrink-0 p-0.5 rounded hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
          onClick={e => { e.stopPropagation(); setOpen(true); }}
          title="配送タイムラインを見る"
        >
          <Truck className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-4" side="left" align="start" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-gray-700">配送タイムライン</span>
          <div className="flex items-center gap-2">
            <button
              className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-1"
              onClick={() => refreshMutation.mutate({ orderId })}
              disabled={refreshMutation.isPending}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
              再読み込み
            </button>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setOpen(false)}
              title="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {trackingNumber && (
          <div className="text-[11px] font-mono text-gray-500 tracking-wide mb-3 bg-gray-50 px-2 py-1.5 rounded border">
            {trackingNumber}
          </div>
        )}
        {isLoading ? (
          <div className="text-[12px] text-gray-400 py-4 text-center">照会中...</div>
        ) : history.length === 0 ? (
          <div className="text-[12px] text-gray-400 py-4 text-center">配送履歴がありません</div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {history.slice().map((h: any, i: number) => (
              <div key={h.id ?? i} className="flex gap-2.5 flex-shrink-0 py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex flex-col items-center flex-shrink-0 pt-0.5" style={{ width: 12 }}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? "bg-blue-500" : "bg-gray-300"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-gray-700 leading-snug break-words">{h.description}</div>
                  {h.location && <div className="text-[10px] text-gray-500 mt-0.5 break-words">{h.location}</div>}
                  <div className="text-[9px] text-gray-400 mt-0.5">
                    {h.occurredAt ? new Date(h.occurredAt).toLocaleString("ja-JP", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12: false }) : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function AdminOrdersSpreadsheet() {
  // ─── 상태 ───
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set()); // orderId set
  const [hideCancelled, setHideCancelled] = useState(false);
  const [specialFilter, setSpecialFilter] = useState<"none" | "noTracking" | "refund">("none");
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("adminOrdersHiddenColumns_v2");
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // 컬럼 너비
  const initialWidths = Object.fromEntries(COLUMNS.map(c => [c.key, c.defaultWidth]));
  const { widths, onMouseDown } = useColumnResize(initialWidths);

  const toggleColumn = (key: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem("adminOrdersHiddenColumns_v2", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const visibleColumns = COLUMNS.filter(c => !hiddenColumns.has(c.key));

  // ─── 페이지네이션 ───
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const currentTab = TABS.find(t => t.id === activeTab)!;

  const prevTabRef = useRef(activeTab);
  const prevSearchRef = useRef(search);
  useEffect(() => {
    if (prevTabRef.current !== activeTab || prevSearchRef.current !== search) {
      setCurrentPage(1);
      prevTabRef.current = activeTab;
      prevSearchRef.current = search;
    }
  }, [activeTab, search]);

  // ─── 데이터 쿼리 ───
  const { data, isLoading, refetch } = trpc.admin.orders.useQuery({
    page: currentPage,
    limit: pageSize,
    status: currentTab.statuses,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    noTrackingNumber: specialFilter === "noTracking" ? true : undefined,
    hasRefund: specialFilter === "refund" ? true : undefined,
  });
  const { data: tabCounts } = trpc.admin.orderTabCounts.useQuery({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const utils = trpc.useUtils();

  const orders = data?.orders ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // ─── 관리자 메모 인라인 편집 ───
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null);
  const [editingMemoValue, setEditingMemoValue] = useState("");
  const updateAdminNotesMutation = trpc.admin.updateAdminNotes.useMutation({
    onSuccess: () => {
      toast.success("メモを保存しました。");
      setEditingMemoId(null);
      utils.admin.orders.invalidate();
    },
    onError: () => toast.error("メモの保存に失敗しました"),
  });

  // ─── 택배사 목록 ───
  const { data: carriersData } = trpc.shipping.carriers.useQuery();
  const carriers = carriersData ?? [];

  // ─── 운송장 등록/수정 ───
  const registerShipment = trpc.shipping.adminCreateShipment.useMutation({
    onSuccess: () => { toast.success("追跡番号を登録しました。"); utils.admin.orders.invalidate(); },
    onError: (e) => toast.error(e.message || "追跡番号の登録に失敗しました"),
  });
  const updateShipmentInfo = trpc.shipping.adminUpdateShipmentInfo.useMutation({
    onSuccess: () => { toast.success("追跡番号を更新しました。"); utils.admin.orders.invalidate(); },
    onError: (e) => toast.error(e.message || "追跡番号の更新に失敗しました"),
  });

  // ─── 일괄 상태 변경 ───
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState("preparing");
  const bulkUpdateStatusMutation = trpc.admin.bulkUpdateStatus.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.count}件の注文ステータスを「${STATUS_MAP[bulkTargetStatus]?.label}」に変更しました。`);
      utils.admin.orders.invalidate();
      utils.admin.orderTabCounts.invalidate();
      setBulkStatusOpen(false);
      setSelectedRows(new Set());
    },
    onError: () => toast.error("ステータスの変更に失敗しました"),
  });

  // ─── 선택 처리 ───
  const allOrderIds = orders.map((o: any) => o.id);
  const allSelected = allOrderIds.length > 0 && allOrderIds.every((id: number) => selectedRows.has(id));
  const toggleAll = () => {
    if (allSelected) setSelectedRows(new Set());
    else setSelectedRows(new Set(allOrderIds));
  };
  const toggleRow = (id: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ─── CSV 다운로드 ───
  const downloadCSV = (selectedOnly = false) => {
    const target = selectedOnly
      ? orders.filter((o: any) => selectedRows.has(o.id))
      : orders;
    const headers = [
      "配送状況","注文番号","アイテムID","配送業者","追跡番号","商品名","オプション","商品金額","数量","受取人","連絡先","郵便番号","配送先住所","決済金額","注文者メール","管理者メモ","配送メモ","注文日時","英語氏名","英語住所"
    ];
    const rows: string[][] = [];
    target.forEach((o: any) => {
      const items: any[] = o.items?.length > 0 ? o.items : [null];
      items.forEach((item: any, idx: number) => {
        const subtotal = item ? item.price * item.quantity : 0;
        const opts = item?.options ? Object.values(item.options).join(",") : "";
        rows.push([
          idx === 0 ? (STATUS_MAP[o.status]?.label || o.status) : "",
          idx === 0 ? o.orderNumber : "",
          item?.id ? String(item.id).padStart(6, '0') : "",
          idx === 0 ? (o.shipment?.carrierId || "") : "",
          idx === 0 ? (o.shipment?.trackingNumber || "") : "",
          item ? item.productName : "",
          opts,
          item ? String(subtotal) : "",
          item ? String(item.quantity) : "",
          idx === 0 ? o.recipientName : "",
          idx === 0 ? o.recipientPhone : "",
          o.zipCode || "",
          idx === 0 ? [o.address1, o.address2].filter(Boolean).join(" ") : "",
          idx === 0 ? String(o.totalAmount) : "",
          idx === 0 ? (o.userEmail || "") : "",
          idx === 0 ? (o.adminNotes || "") : "",
          idx === 0 ? (o.memo || "") : "",
          idx === 0 ? new Date(o.createdAt).toLocaleString("ja-JP") : "",
          idx === 0 ? (o.recipientNameEn || "") : "",
          idx === 0 ? [o.addressEn1, o.addressEn2].filter(Boolean).join(" ") : "",
        ]);
      });
    });
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── 셀 컬럼 클릭 (헤더 클릭 시 열 하이라이트) ───
  const handleHeaderClick = (key: string) => {
    if (selectedColumn === key) {
      setSelectedColumn(null);
    } else {
      setSelectedColumn(key);
      // 해당 열 값 클립보드 복사
      const values = orders.flatMap((o: any) => {
        const items: any[] = o.items?.length > 0 ? o.items : [null];
        return items.map((item: any, idx: number) => getCellText(o, item, idx, key));
      });
      navigator.clipboard.writeText(values.filter(Boolean).join("\n")).catch(() => {});
      toast.success(`「${COLUMNS.find(c=>c.key===key)?.label}」列をクリップボードにコピーしました`);
    }
  };

  const getCellText = (order: any, item: any, itemIdx: number, key: string): string => {
    switch (key) {
      case "status": {
        const itemSk = item?.cancelledAt ? "cancelled" : (item?.itemStatus || null);
        return STATUS_MAP[itemSk || order.status]?.label || (itemSk || order.status);
      }
      case "orderNumber":   return order.orderNumber;
      case "itemId":        return item?.id ? String(item.id).padStart(6, '0') : "";
      case "carrier":       return itemIdx === 0 ? (order.shipment?.carrierId || "-") : "";
      case "tracking":      return itemIdx === 0 ? (order.shipment?.trackingNumber || "-") : "";
      case "productName":   return item ? item.productName : (order.items?.map((i:any)=>i.productName).join(", ") || "-");
      case "qty":           return item ? String(item.quantity) : "";
      case "unitPrice":     return item ? item.price.toLocaleString() : "";
      case "subtotal":      return item ? (item.price * item.quantity).toLocaleString() : "";
      case "options":       return item?.options ? Object.values(item.options).join(", ") : "-";
      case "customer":      return itemIdx === 0 ? order.recipientName : "";
      case "phone":         return itemIdx === 0 ? order.recipientPhone : "";
      case "zipCode":       return order.zipCode || "-";
      case "address":       return itemIdx === 0 ? [order.address1, order.address2].filter(Boolean).join(" ") : "";
      case "totalAmount":   return itemIdx === 0 ? order.totalAmount.toLocaleString() : "";
      case "userEmail":     return itemIdx === 0 ? (order.userEmail || "-") : "";
      case "adminNotes":    return itemIdx === 0 ? (order.adminNotes || "") : "";
      case "memo":          return itemIdx === 0 ? (order.memo || "-") : "";
      case "orderDate":     return itemIdx === 0 ? new Date(order.createdAt).toLocaleString("ja-JP", {month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}) : "";
      case "nameEn":        return order.recipientNameEn || "-";
      case "addressEn":     return [order.addressEn1, order.addressEn2].filter(Boolean).join(" ") || "-";
      default: return "";
    }
  };

  // ─── 셀 렌더링 ───
  const renderCell = (order: any, item: any, itemIdx: number, key: string) => {
    switch (key) {
      case "status": {
        const itemStatusKey = item?.cancelledAt ? "cancelled" : (item?.itemStatus || null);
        const statusKey = itemStatusKey || order.status;
        return (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap ${STATUS_MAP[statusKey]?.color || "bg-gray-100 text-gray-700 border-gray-300"}`}>
            {STATUS_MAP[statusKey]?.label || statusKey}
          </span>
        );
      }
      case "orderNumber":
        return (
          <a href={`/admin/orders/${order.id}`} className="text-[11px] text-blue-600 hover:underline font-mono whitespace-nowrap" onClick={e => e.stopPropagation()}>
            {formatOrderNumber(order.orderNumber)}
          </a>
        );
      case "itemId":
        return (
          <span className="text-[11px] text-gray-500 font-mono">{item?.id ? `#${String(item.id).padStart(6, '0')}` : "-"}</span>
        );
      case "carrier": {
        const carrierName = order.shipment?.carrierId
          ? (carriers.find(c => c.id === order.shipment!.carrierId)?.name ?? String(order.shipment.carrierId))
          : "-";
        return <span className="text-[11px]">{carrierName}</span>;
      }
      case "tracking": {
        const editableStatuses = ["preparing", "shipping", "delivered", "customs_hold"];
        const trackingNum = order.shipment?.trackingNumber;
        const progMap: Record<string, { pct: number; color: string }> = {
          preparing:    { pct: 15,  color: "bg-blue-400" },
          shipping:     { pct: 55,  color: "bg-blue-500" },
          customs_hold: { pct: 75,  color: "bg-rose-400" },
          delivered:    { pct: 100, color: "bg-green-500" },
        };
        const prog = progMap[order.status];
        if (!editableStatuses.includes(order.status)) {
          return (
            <div className="flex flex-col gap-0.5 w-full">
              <span className="text-[11px] font-mono tracking-widest text-gray-400">{trackingNum || "-"}</span>
              {prog && <div className="w-full bg-gray-100 rounded-full h-[3px]"><div className={`${prog.color} h-[3px] rounded-full`} style={{ width: `${prog.pct}%` }} /></div>}
            </div>
          );
        }
        const saveTracking = (val: string) => {
          if (!val.trim() || val.trim() === (trackingNum ?? "")) return;
          const detected = detectCarrierByTracking(val.trim(), carriers);
          if (order.shipment?.id) {
            updateShipmentInfo.mutate({
              shipmentId: order.shipment.id,
              trackingNumber: val.trim(),
              ...(detected ? { carrierId: detected.id } : {}),
            });
          } else {
            registerShipment.mutate({
              orderId: order.id,
              trackingNumber: val.trim(),
              ...(detected ? { carrierId: detected.id } : {}),
            });
          }
        };
        return (
          <div className="flex flex-col gap-0.5 w-full">
            <div className="flex items-center gap-1 w-full">
              <input
                className="text-[10px] font-mono tracking-wide flex-1 min-w-0 border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:border-blue-400 focus:outline-none hover:border-gray-400 transition-colors"
                defaultValue={trackingNum ?? ""}
                key={`tracking-${order.id}-${trackingNum ?? ""}`}
                placeholder="追跡番号"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                  if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
                  if (e.key === "Escape") { (e.target as HTMLInputElement).value = trackingNum ?? ""; (e.target as HTMLInputElement).blur(); }
                }}
                onBlur={e => saveTracking(e.target.value)}
              />
              {order.shipment?.id && (
                <TrackingTimelinePopover
                  shipmentId={order.shipment.id}
                  orderId={order.id}
                  trackingNumber={trackingNum}
                />
              )}
            </div>
            {prog && <div className="w-full bg-gray-100 rounded-full h-[3px]"><div className={`${prog.color} h-[3px] rounded-full`} style={{ width: `${prog.pct}%` }} /></div>}
          </div>
        );
      }
      case "productName":
        return (
          <span className="text-[11px] block leading-tight truncate">
            {item ? item.productName : "-"}
          </span>
        );
      case "qty":
        return <span className="text-[11px] text-center block">{item ? item.quantity : ""}</span>;
      case "unitPrice":
        return <span className="text-[11px] text-right block">{item ? item.price.toLocaleString() : ""}</span>;
      case "subtotal":
        return <span className="text-[11px] text-right block font-medium">{item ? (item.price * item.quantity).toLocaleString() : ""}</span>;
      case "options": {
        const opts = item?.options ? Object.values(item.options).join(", ") : "";
        if (opts) return <span className="text-[10px] text-gray-500 truncate block">{opts}</span>;
        return <span className="text-[10px] text-gray-400 truncate block">{item?.productName || "-"}</span>;
      }
      case "customer":
        return <span className="text-[11px]">{order.recipientName || "-"}</span>;
      case "phone":
        return <span className="text-[11px] font-mono">{formatPhoneIntl(order.recipientPhone)}</span>;
      case "zipCode":
        return <span className="text-[11px] font-mono">{order.zipCode || "-"}</span>;
      case "address":
        return (
          <span className="text-[11px] truncate block" title={[order.address1, order.address2].filter(Boolean).join(" ")}>
            {[order.address1, order.address2].filter(Boolean).join(" ") || "-"}
          </span>
        );
      case "couponDiscount": {
        if (!order.couponDiscount) return <span className="text-[11px] text-gray-300">-</span>;
        // 첫 번째 쿠폰 적용 가능 아이템 행에만 전체 금액 표시 (취소·noDiscount 제외)
        const eligibleItems = (order.items || []).filter((i: any) => !i.product?.noDiscount && !i.cancelledAt);
        const firstEligible = eligibleItems[0];
        if (!firstEligible || item?.id !== firstEligible.id) return <span className="text-[11px] text-gray-300">-</span>;
        return <span className="text-[11px] text-red-500 font-medium">-{order.couponDiscount.toLocaleString()}円</span>;
      }
      case "pointDiscount":
        if (itemIdx > 0) return null;
        return order.pointsUsed > 0
          ? <span className="text-[11px] text-purple-600 font-medium">-{order.pointsUsed.toLocaleString()}P</span>
          : <span className="text-[11px] text-gray-300">-</span>;
      case "totalAmount": {
        if (itemIdx > 0) return null;
        const finalAmount = order.totalAmount - (order.couponDiscount ?? 0) - (order.pointsUsed ?? 0);
        return <span className="text-[11px] font-bold text-blue-700">{finalAmount.toLocaleString()}円</span>;
      }
      case "userEmail":
        return (
          <span className="text-[11px] text-gray-500 truncate block" title={order.userEmail || ''}>
            {order.userEmail || "-"}
          </span>
        );
      case "adminNotes":
        if (editingMemoId === order.id) {
          return (
            <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
              <textarea
                autoFocus
                className="text-[11px] border border-amber-400 rounded px-1 py-0.5 w-full resize-none bg-amber-50 focus:outline-none"
                rows={2}
                value={editingMemoValue}
                onChange={e => setEditingMemoValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Escape") setEditingMemoId(null);
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    updateAdminNotesMutation.mutate({ orderId: order.id, notes: editingMemoValue });
                  }
                }}
                placeholder="メモを入力... (Ctrl+Enterで保存)"
              />
              <div className="flex gap-1">
                <button className="text-[10px] bg-amber-500 text-white rounded px-1.5 py-0.5 hover:bg-amber-600" onClick={() => updateAdminNotesMutation.mutate({ orderId: order.id, notes: editingMemoValue })}>保存</button>
                <button className="text-[10px] bg-gray-200 text-gray-600 rounded px-1.5 py-0.5" onClick={() => setEditingMemoId(null)}>キャンセル</button>
              </div>
            </div>
          );
        }
        return (
          <span
            className="text-[11px] text-amber-700 truncate block cursor-pointer hover:bg-amber-50 rounded px-1 py-0.5"
            onClick={e => {
              e.stopPropagation();
              setEditingMemoId(order.id);
              setEditingMemoValue(order.adminNotes || "");
            }}
          >
            {order.adminNotes ? (
              <span className="flex items-center gap-0.5">
                <span className="text-amber-500">📝</span>
                <span className="truncate">{order.adminNotes}</span>
              </span>
            ) : (
              <span className="text-gray-300 italic">メモを追加</span>
            )}
          </span>
        );
      case "memo": {
        const systemPatterns = /메일\s*발송|이메일\s*발송|배송내역|결제내역|결제\/배송|입금\s*확인|자동\s*취소|알림\s*발송/;
        const cleanMemo = order.memo
          ? order.memo.split(/\n|\\n/).filter((line: string) => !systemPatterns.test(line)).join("\n").trim()
          : "";
        return <span className="text-[11px] text-gray-500 truncate block">{cleanMemo || "-"}</span>;
      }
      case "orderDate":
        return <span className="text-[11px]">{new Date(order.createdAt).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}</span>;
      case "nameEn":
        return <span className="text-[11px] font-mono">{order.recipientNameEn || "-"}</span>;
      case "addressEn":
        return (
          <span className="text-[11px] truncate block" title={[order.addressEn1, order.addressEn2].filter(Boolean).join(" ")}>
            {[order.addressEn1, order.addressEn2].filter(Boolean).join(" ") || "-"}
          </span>
        );
      default:
        return null;
    }
  };

  // ─── sticky left 계산 ───
  const getStickyLeft = (colIndex: number) => {
    let left = 40; // checkbox(40)
    for (let i = 0; i < colIndex; i++) {
      if (visibleColumns[i].sticky) left += widths[visibleColumns[i].key];
    }
    return left;
  };

  const stickyCount = visibleColumns.filter(c => c.sticky).length;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* ─── 페이지 제목 ─── */}
      <div className="px-4 pt-5 pb-3 bg-background border-b shrink-0">
        <h1 className="text-2xl font-bold">注文管理 (スプレッドシート)</h1>
      </div>
      {/* ─── 요약 카운트 바 ─── */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-6 flex-shrink-0">
        {[
          { label: "入金前",     count: tabCounts?.pending ?? 0,      color: "text-yellow-700", tab: "pending" },
          { label: "支払い済み",   count: tabCounts?.paid ?? 0,         color: "text-green-700",  tab: "paid" },
          { label: "商品準備中", count: tabCounts?.preparing ?? 0,    color: "text-blue-600",   tab: "preparing" },
          { label: "配送中",     count: tabCounts?.shipping ?? 0,     color: "text-indigo-600", tab: "shipping" },
          { label: "配送完了",   count: tabCounts?.delivered ?? 0,    color: "text-gray-600",   tab: "delivered" },
          { label: "通関検査",   count: tabCounts?.customs_hold ?? 0, color: "text-rose-600",   tab: "customs_hold" },
          { label: "キャンセル",     count: tabCounts?.cancelled ?? 0,        color: "text-red-600",    tab: "cancelled" },
          { label: "一部キャンセル", count: tabCounts?.partialCancelled ?? 0, color: "text-orange-600", tab: "partial_cancel" },
          { label: "配送遅延", count: undefined, color: "text-amber-600", tab: "noTracking", special: true },
          { label: "返金",     count: tabCounts?.refunded ?? 0,          color: "text-purple-600", tab: "refund", special: true },
        ].map(item => (
          <div key={item.tab} className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 whitespace-nowrap">{item.label}</span>
            <button
              className={`min-w-[28px] px-1.5 py-0.5 rounded text-[12px] font-bold border bg-white cursor-pointer border-gray-200 hover:border-gray-400 ${item.color}`}
              onClick={() => {
                if (item.special) {
                  setSpecialFilter(item.tab as "noTracking" | "refund");
                  setActiveTab("all");
                } else {
                  setSpecialFilter("none");
                  setActiveTab(item.tab);
                }
                setCurrentPage(1);
              }}
            >
              {item.count}
            </button>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => refetch()}>
            <RefreshCw className="w-3 h-3" /> 再読み込み
          </Button>
        </div>
      </div>

      {/* ─── 검색 바 ─── */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-2 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 whitespace-nowrap">注文日</span>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-7 !text-[11px] w-32" />
          <span className="text-[10px] text-gray-400">~</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-7 !text-[11px] w-32" />
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
          <Input
            placeholder="注文番号、受取人、連絡先で検索"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
            className="h-7 !text-[11px] max-w-xs"
          />
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { setSearch(searchInput); setCurrentPage(1); }}>
            <Search className="w-3 h-3" /> 検索
          </Button>
          {(search || dateFrom || dateTo) && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
              setSearch(""); setSearchInput(""); setDateFrom(""); setDateTo(""); setCurrentPage(1);
            }}>
              <X className="w-3 h-3" /> リセット
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setHideCancelled(v => !v)}
            className={`h-7 px-2.5 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors ${hideCancelled ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}
          >
            <X className="w-3 h-3" />
            キャンセルを非表示 {hideCancelled ? "ON" : "OFF"}
          </button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => downloadCSV(false)}>
            <Download className="w-3 h-3" /> CSVダウンロード
          </Button>
          {selectedRows.size > 0 && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => downloadCSV(true)}>
              <Download className="w-3 h-3" /> 選択分をダウンロード
            </Button>
          )}
          {selectedRows.size > 0 && (
            <Button size="sm" className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setBulkStatusOpen(true)}>
              <CheckCircle className="w-3 h-3" /> ステータス変更 ({selectedRows.size})
            </Button>
          )}
          {/* 열 표시/숨기기 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Columns className="w-3 h-3" /> 列設定
                {hiddenColumns.size > 0 && (
                  <span className="ml-0.5 bg-blue-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center">{hiddenColumns.size}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <div className="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b">列の表示/非表示</div>
              <div className="space-y-0.5 max-h-72 overflow-y-auto">
                {COLUMNS.map(col => (
                  <label key={col.key} className={`flex items-center gap-2 px-1 py-0.5 rounded hover:bg-gray-50 cursor-pointer ${col.sticky ? "opacity-50" : ""}`}>
                    <Checkbox
                      checked={!hiddenColumns.has(col.key)}
                      onCheckedChange={() => { if (!col.sticky) toggleColumn(col.key); }}
                      disabled={col.sticky}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-xs">{col.label}</span>
                    {col.sticky && <span className="text-[9px] text-gray-400 ml-auto">固定</span>}
                  </label>
                ))}
              </div>
              {hiddenColumns.size > 0 && (
                <button className="mt-2 w-full text-xs text-blue-600 hover:underline" onClick={() => { setHiddenColumns(new Set()); localStorage.removeItem("adminOrdersHiddenColumns_v2"); }}>
                  すべての列を表示
                </button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ─── 탭 ─── */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-5 flex-shrink-0">
        {TABS.map(tab => (
          <label key={tab.id} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="orderTab"
              checked={activeTab === tab.id && specialFilter === "none"}
              onChange={() => { setActiveTab(tab.id); setSpecialFilter("none"); setCurrentPage(1); }}
              className="w-4 h-4 accent-blue-600"
            />
            <span className={`text-[12px] ${activeTab === tab.id && specialFilter === "none" ? "text-gray-900 font-medium" : "text-gray-500"}`}>
              {tab.label}
              {tab.id !== "all" && tabCounts && (
                <span className="ml-1 text-[10px] text-gray-400">
                  ({
                    tab.id === "pending" ? tabCounts.pending :
                    tab.id === "paid" ? tabCounts.paid :
                    tab.id === "preparing" ? tabCounts.preparing :
                    tab.id === "shipping" ? tabCounts.shipping :
                    tab.id === "delivered" ? tabCounts.delivered :
                    tab.id === "customs_hold" ? tabCounts.customs_hold :
                    tab.id === "cancelled" ? tabCounts.cancelled :
                    tab.id === "partial_cancel" ? tabCounts.partialCancelled : 0
                  })
                </span>
              )}
            </span>
          </label>
        ))}
        {/* 배송지연 / 환불 특수 필터 */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="orderTab"
            checked={specialFilter === "noTracking"}
            onChange={() => { setSpecialFilter("noTracking"); setActiveTab("all"); setCurrentPage(1); }}
            className="w-4 h-4 accent-blue-600"
          />
          <span className={`text-[12px] ${specialFilter === "noTracking" ? "text-amber-600 font-medium" : "text-gray-500"}`}>
            配送遅延
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="orderTab"
            checked={specialFilter === "refund"}
            onChange={() => { setSpecialFilter("refund"); setActiveTab("all"); setCurrentPage(1); }}
            className="w-4 h-4 accent-blue-600"
          />
          <span className={`text-[12px] ${specialFilter === "refund" ? "text-purple-600 font-medium" : "text-gray-500"}`}>
            返金
            {tabCounts?.refunded !== undefined && (
              <span className="ml-1 text-[10px] text-gray-400">({tabCounts.refunded})</span>
            )}
          </span>
        </label>
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {isLoading ? "読み込み中..." : `全 ${totalCount.toLocaleString()}件 | ページ ${currentPage}/${totalPages || 1}`}
          </span>
          <span className="flex items-center gap-0.5">
            {[50, 100, 200].map(n => (
              <button
                key={n}
                className={`px-1.5 py-0.5 rounded text-xs border transition-colors ${pageSize === n ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
                onClick={() => { setPageSize(n); setCurrentPage(1); }}
              >{n}件</button>
            ))}
          </span>
        </span>
      </div>

      {/* ─── 테이블 ─── */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">読み込み中...</div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">注文がありません。</div>
        ) : (
          <table className="border-collapse text-sm bg-white" style={{ minWidth: "max-content" }}>
            <thead className="sticky top-0 z-20">
              <tr>
                {/* 체크박스 열 */}
                <th className="sticky left-0 z-30 bg-yellow-100 border border-gray-200 w-10" style={{ minWidth: 40, left: 0 }}>
                  <div className="flex items-center justify-center h-full py-2">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="w-3.5 h-3.5" />
                  </div>
                </th>
                {visibleColumns.map((col, colIdx) => (
                  <th
                    key={col.key}
                    className={`relative border border-gray-200 px-2 py-2 text-left bg-yellow-100 font-semibold text-gray-700 whitespace-nowrap text-xs select-none cursor-pointer
                      ${col.sticky ? "sticky z-30" : ""}
                      ${selectedColumn === col.key ? "bg-blue-100" : "hover:bg-yellow-200"}
                    `}
                    style={{
                      minWidth: widths[col.key],
                      width: widths[col.key],
                      ...(col.sticky ? { left: getStickyLeft(colIdx) } : {}),
                    }}
                    onClick={() => handleHeaderClick(col.key)}
                  >
                    {col.label}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-300 active:bg-blue-500"
                      onClick={e => e.stopPropagation()}
                      onMouseDown={e => onMouseDown(col.key, e)}
                    />
                  </th>
                ))}
                {/* 마지막 열 리사이즈 핸들 접근 공간 확보용 스페이서 */}
                <th className="border-0 bg-yellow-100" style={{ minWidth: 40, width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {(hideCancelled ? orders.filter((o: any) => o.status !== "cancelled") : orders).map((order: any, orderIdx: number) => {
                const isSelected = selectedRows.has(order.id);
                const rawItems: any[] = order.items?.length > 0 ? order.items : [null];
                const items: any[] = hideCancelled
                  ? (rawItems.filter((i: any) => i === null || !i.cancelledAt).length > 0
                    ? rawItems.filter((i: any) => i === null || !i.cancelledAt)
                    : rawItems)
                  : rawItems;

                const stickyBg = isSelected ? "bg-blue-50" : orderIdx % 2 === 0 ? "bg-white" : "bg-gray-50";
                const rowEls = items.map((item: any, itemIdx: number) => {
                  const rowKey = `${order.id}-${itemIdx}`;
                  return (
                    <tr
                      key={rowKey}
                      className={`
                        ${isSelected ? "bg-blue-50" : orderIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        hover:bg-blue-50/70 transition-colors
                      `}
                    >
                      {/* 체크박스 */}
                      <td className={`sticky left-0 z-10 border border-gray-200 w-10 ${stickyBg}`} style={{ left: 0 }}>
                        {itemIdx === 0 && (
                          <div className="flex items-center justify-center py-1.5">
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(order.id)} className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>
                      {visibleColumns.map((col, colIdx) => {
                        const isHighlighted = selectedColumn === col.key;
                        return (
                          <td
                            key={`${rowKey}-${col.key}`}
                            className={`border border-gray-200 px-2 py-1 overflow-hidden
                              ${col.sticky ? `sticky z-10 ${stickyBg}` : ""}
                              ${isHighlighted ? "bg-blue-50" : ""}
                            `}
                            style={{
                              minWidth: widths[col.key],
                              maxWidth: widths[col.key],
                              ...(col.sticky ? { left: getStickyLeft(colIdx) } : {}),
                            }}
                          >
                            {renderCell(order, item, itemIdx, col.key)}
                          </td>
                        );
                      })}
                      <td className="border-0" />
                    </tr>
                  );
                });
                return <React.Fragment key={order.id}>{rowEls}</React.Fragment>;
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── 페이지네이션 ─── */}
      {totalPages > 1 && (
        <div className="bg-white border-t px-4 py-2 flex items-center justify-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>«</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</Button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const page = Math.max(1, Math.min(currentPage - 3, totalPages - 6)) + i;
            if (page < 1 || page > totalPages) return null;
            return (
              <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className="h-7 w-7 text-xs p-0" onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            );
          })}
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>»</Button>
        </div>
      )}

      {/* ─── 일괄 상태 변경 다이얼로그 ─── */}
      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ステータス一括変更</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-4">
            <p className="text-sm text-gray-600">選択した<strong>{selectedRows.size}件</strong>の注文のステータスを変更します。</p>
            <Select value={bulkTargetStatus} onValueChange={setBulkTargetStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusOpen(false)}>キャンセル</Button>
            <Button
              disabled={bulkUpdateStatusMutation.isPending}
              onClick={() => {
                bulkUpdateStatusMutation.mutate({
                  orderIds: Array.from(selectedRows),
                  status: bulkTargetStatus,
                });
              }}
            >
              {bulkUpdateStatusMutation.isPending ? "処理中..." : "変更"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
