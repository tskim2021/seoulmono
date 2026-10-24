import { useState, useMemo } from "react";
import { useGetOrders, type Order } from "@workspace/api-client-react";
import { Card, Badge, Button, Input } from "../components/ui";
import { formatCurrency, getStatusColor, cn } from "../lib/utils";
import { format, subDays, subMonths } from "date-fns";
import { Link } from "wouter";
import { ChevronRight, Package, Loader2, Search, Download, Calendar, X, Truck } from "lucide-react";
import * as XLSX from "xlsx";
import TrackingModal from "../components/TrackingModal";

type DatePreset = "today" | "week" | "month" | "3month" | "custom" | "";

export default function OrderHistory() {
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [trackingOrder, setTrackingOrder] = useState<{ invoiceNo: string; carrier: string } | null>(null);

  const computedFrom = useMemo(() => {
    if (datePreset === "custom") return dateFrom;
    const today = new Date();
    switch (datePreset) {
      case "today": return format(today, "yyyy-MM-dd");
      case "week": return format(subDays(today, 7), "yyyy-MM-dd");
      case "month": return format(subMonths(today, 1), "yyyy-MM-dd");
      case "3month": return format(subMonths(today, 3), "yyyy-MM-dd");
      default: return "";
    }
  }, [datePreset, dateFrom]);

  const computedTo = useMemo(() => {
    if (datePreset === "custom") return dateTo;
    if (datePreset) return format(new Date(), "yyyy-MM-dd");
    return "";
  }, [datePreset, dateTo]);

  const { data, isLoading } = useGetOrders({
    page: 1,
    limit: 200,
    search: search || undefined,
    status: statusFilter || undefined,
    date_from: computedFrom || undefined,
    date_to: computedTo || undefined,
  });

  const handlePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      setDateFrom("");
      setDateTo("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDatePreset("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("");
  };

  const hasFilters = search || datePreset || statusFilter;

  const handleExcelDownload = () => {
    if (!data?.orders?.length) return;

    const rows: Record<string, any>[] = [];
    data.orders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, idx) => {
          rows.push({
            "주문번호": idx === 0 ? order.od_id : "",
            "주문일시": idx === 0 && order.od_time ? format(new Date(order.od_time), "yyyy-MM-dd HH:mm") : "",
            "상태": idx === 0 ? order.od_status : "",
            "상품명": item.it_name,
            "수량(박스)": item.ct_qty,
            "단가": item.ct_price,
            "제조사": item.it_maker || "",
            "결제금액": idx === 0 ? order.od_receipt_price : "",
            "배송사": idx === 0 ? (order.od_delivery_company || "") : "",
            "운송장번호": idx === 0 ? (order.od_invoice_no || "") : "",
          });
        });
      } else {
        rows.push({
          "주문번호": order.od_id,
          "주문일시": order.od_time ? format(new Date(order.od_time), "yyyy-MM-dd HH:mm") : "",
          "상태": order.od_status,
          "상품명": "",
          "수량(박스)": "",
          "단가": "",
          "제조사": "",
          "결제금액": order.od_receipt_price,
          "배송사": order.od_delivery_company || "",
          "운송장번호": order.od_invoice_no || "",
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 30 },
      { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "주문내역");
    XLSX.writeFile(wb, `주문내역_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
  };

  const presets: { key: DatePreset; label: string }[] = [
    { key: "today", label: "오늘" },
    { key: "week", label: "1주일" },
    { key: "month", label: "1개월" },
    { key: "3month", label: "3개월" },
  ];

  const statuses = ["주문접수", "처리중", "배송준비", "배송중", "배송완료"];

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">주문내역</h1>
          <p className="text-slate-500 mt-2 font-medium">신청하신 발주 내역과 배송 상태를 확인하실 수 있습니다.</p>
        </div>
        <Button
          variant="outline"
          onClick={handleExcelDownload}
          disabled={!data?.orders?.length}
          className="shrink-0"
        >
          <Download className="w-4 h-4 mr-1.5" />
          엑셀 다운로드
        </Button>
      </div>

      <Card className="p-5 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10 bg-slate-50/50"
              placeholder="주문번호, 이름, 업체명 검색..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">전체 상태</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
                datePreset === p.key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => handlePreset("custom")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all",
              datePreset === "custom"
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            직접입력
          </button>

          {datePreset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="text-slate-400 text-sm">~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors font-medium"
            >
              <X className="w-3.5 h-3.5" />
              초기화
            </button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : data?.orders.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-3xl border border-slate-100">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">
            {hasFilters ? "검색 결과가 없습니다" : "주문 내역이 없습니다"}
          </h3>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 text-primary font-medium hover:underline">
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="text-sm text-slate-500 font-medium mb-4 px-1">
            총 <span className="font-bold text-primary">{data?.total ?? 0}</span>건
          </div>
          <div className="space-y-4">
            {data?.orders.map((order) => (
              <OrderCard key={order.od_id} order={order} onTrackingClick={setTrackingOrder} />
            ))}
          </div>
        </>
      )}
      {trackingOrder && (
        <TrackingModal
          invoiceNo={trackingOrder.invoiceNo}
          carrier={trackingOrder.carrier}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  );
}

function OrderCard({ order, onTrackingClick }: { order: Order; onTrackingClick: (t: { invoiceNo: string; carrier: string }) => void }) {
  const hasTracking = order.od_invoice_no && order.od_delivery_company;
  const isDeliveryStatus = ["배송중", "배송완료"].includes(order.od_status);

  return (
    <Link href={`/orders/${order.od_id}`}>
      <Card className="hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-400">
                {order.od_time ? format(new Date(order.od_time), "yyyy.MM.dd HH:mm") : ""}
              </span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-xs font-mono text-slate-400">#{order.od_id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("px-3 py-1", getStatusColor(order.od_status))}>{order.od_status}</Badge>
              <div className="text-slate-400 group-hover:text-primary transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="bg-slate-50/80 rounded-xl p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs font-semibold border-b border-slate-200">
                    <th className="text-left pb-2 pr-2">상품명</th>
                    <th className="text-left pb-2 pr-2 hidden sm:table-cell">제조사</th>
                    <th className="text-center pb-2 pr-2 w-20">수량</th>
                    <th className="text-right pb-2 w-24">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-2">
                        <span className="font-medium text-slate-800 line-clamp-1">{item.it_name}</span>
                      </td>
                      <td className="py-2 pr-2 text-slate-500 hidden sm:table-cell">
                        {item.it_maker || "-"}
                      </td>
                      <td className="py-2 pr-2 text-center text-slate-700 font-medium">
                        {item.ct_qty}박스
                      </td>
                      <td className="py-2 text-right font-bold text-slate-800">
                        {formatCurrency(item.ct_price * item.ct_qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-900 font-bold text-lg">
                합계 {formatCurrency(order.od_receipt_price)}
              </span>
              {order.item_count ? (
                <span className="text-slate-400 font-medium">{order.item_count}종</span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {(isDeliveryStatus || hasTracking) && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-slate-400" />
                  {order.od_delivery_company && (
                    <span className="text-slate-500 font-medium">{order.od_delivery_company}</span>
                  )}
                  {hasTracking && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTrackingClick({ invoiceNo: order.od_invoice_no!, carrier: order.od_delivery_company || "CJ대한통운" }); }}
                      className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                    >
                      배송조회
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
