import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetOrders } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";
import { Card, Badge, Button } from "../components/ui";
import { formatCurrency, getStatusColor, cn } from "../lib/utils";
import { format } from "date-fns";
import { Link } from "wouter";
import {
  Loader2, Download, Filter, X,
  ChevronDown, ChevronRight, FileSpreadsheet, Receipt,
  Package, ExternalLink, Tag
} from "lucide-react";

function useRecentProducts() {
  return useQuery({
    queryKey: ["admin-recent-products"],
    queryFn: () => customFetch<{ products: any[]; total: number }>("/api/admin/products?page=1&limit=8"),
    staleTime: 60000,
  });
}

function useGetPartners() {
  return useQuery({
    queryKey: ["order-partners"],
    queryFn: () => customFetch<{ partners: { mb_id: string; mb_name: string; company_name: string }[] }>("/api/orders/partners"),
  });
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const START_YEAR = 2026;
const years = Array.from({ length: currentYear - START_YEAR + 1 }, (_, i) => START_YEAR + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

function getDateRange(year: number, month: number | null) {
  if (month) {
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from, to };
  }
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

function getPeriodLabel(year: number, month: number | null) {
  if (month) return `${year}년 ${month}월`;
  return `${year}년 전체`;
}

function RecentProductsSection() {
  const { data, isLoading } = useRecentProducts();
  const products = data?.products || [];

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          최근 등록 상품
        </h3>
        <Link href="/admin/products">
          <span className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
            전체보기 <ExternalLink className="w-3 h-3" />
          </span>
        </Link>
      </div>
      {isLoading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">등록된 상품이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-0 divide-x divide-slate-100">
          {products.map((p: any) => (
            <Link key={p.it_id} href={`/admin/products/${p.it_id}`}>
              <div className="flex flex-col hover:bg-slate-50 transition-colors cursor-pointer p-3 group">
                <div className="relative mb-2.5 rounded-lg overflow-hidden bg-slate-100 aspect-square">
                  {p.it_img1 ? (
                    <img
                      src={p.it_img1}
                      alt={p.it_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  <span className={cn(
                    "absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                    p.it_use === "1" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  )}>
                    {p.it_use === "1" ? "판매중" : "숨김"}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 truncate leading-tight mb-1" title={p.it_name}>
                  {p.it_name}
                </p>
                {p.ca_name && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mb-1 truncate">
                    <Tag className="w-2.5 h-2.5 shrink-0" />{p.ca_name}
                  </p>
                )}
                <p className="text-xs font-black text-primary mt-auto">
                  {formatCurrency(p.it_price)}
                </p>
                {p.it_time && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {format(new Date(p.it_time), "MM.dd")} 등록
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AdminSettlement() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentMonth);
  const [pageSize, setPageSize] = useState(20);
  const [partnerFilter, setPartnerFilter] = useState("");
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());

  const { from: dateFrom, to: dateTo } = getDateRange(selectedYear, selectedMonth);
  const periodLabel = getPeriodLabel(selectedYear, selectedMonth);

  const { data: partnersData } = useGetPartners();
  const { data, isLoading } = useGetOrders({
    page: 1,
    limit: pageSize,
    date_from: dateFrom,
    date_to: dateTo,
    partner: partnerFilter || undefined,
  } as any);
  const pageSizeOptions = [10, 20, 50];

  const orders = data?.orders || [];

  const partnerSummaries = useMemo(() => {
    const map: Record<string, {
      mb_id: string;
      company_name: string;
      mb_name: string;
      total_orders: number;
      total_amount: number;
      total_shipping: number;
      taxable_amount: number;
      tax_free_amount: number;
      vat_amount: number;
      orders: any[];
      status_counts: Record<string, number>;
    }> = {};

    for (const o of orders) {
      const key = o.mb_id;
      if (!map[key]) {
        map[key] = {
          mb_id: o.mb_id,
          company_name: (o as any).company_name || "",
          mb_name: (o as any).mb_name || "",
          total_orders: 0,
          total_amount: 0,
          total_shipping: 0,
          taxable_amount: 0,
          tax_free_amount: 0,
          vat_amount: 0,
          orders: [],
          status_counts: {},
        };
      }
      map[key].total_orders++;
      map[key].total_amount += o.od_receipt_price;
      map[key].total_shipping += (o as any).od_send_cost || 0;
      const items = (o as any).items || [];
      for (const item of items) {
        const itemTotal = (Number(item.ct_price) || 0) * (Number(item.ct_qty) || 0);
        if (String(item.it_notax) === "1") {
          map[key].tax_free_amount += itemTotal;
        } else {
          map[key].taxable_amount += itemTotal;
        }
      }
      map[key].orders.push(o);
      const st = o.od_status;
      map[key].status_counts[st] = (map[key].status_counts[st] || 0) + 1;
    }

    for (const p of Object.values(map)) {
      p.vat_amount = Math.round(p.taxable_amount / 11);
    }

    return Object.values(map).sort((a, b) => b.total_amount - a.total_amount);
  }, [orders]);

  const grandTotal = partnerSummaries.reduce((s, p) => s + p.total_amount, 0);
  const grandOrders = partnerSummaries.reduce((s, p) => s + p.total_orders, 0);
  const grandTaxable = partnerSummaries.reduce((s, p) => s + p.taxable_amount, 0);
  const grandTaxFree = partnerSummaries.reduce((s, p) => s + p.tax_free_amount, 0);
  const grandVat = partnerSummaries.reduce((s, p) => s + p.vat_amount, 0);

  const togglePartner = (mbId: string) => {
    setExpandedPartners((prev) => {
      const next = new Set(prev);
      if (next.has(mbId)) next.delete(mbId);
      else next.add(mbId);
      return next;
    });
  };

  const downloadExcel = (partnerData?: typeof partnerSummaries[0]) => {
    const targets = partnerData ? [partnerData] : partnerSummaries;
    const BOM = "\uFEFF";

    let csv = BOM;
    csv += `정산기간: ${periodLabel}\n\n`;
    csv += "파트너사,담당자,주문번호,주문일시,상태,과세금액,면세금액,배송비,총결제금액,상품내역\n";

    for (const partner of targets) {
      for (const order of partner.orders) {
        const items = (order.items || []).map((i: any) =>
          `${i.it_name} x${i.ct_qty}`
        ).join(" / ");
        const orderTime = order.od_time ? format(new Date(order.od_time), "yyyy-MM-dd HH:mm") : "";
        let oTaxable = 0, oTaxFree = 0;
        for (const item of (order.items || [])) {
          const t = (Number(item.ct_price) || 0) * (Number(item.ct_qty) || 0);
          if (String(item.it_notax) === "1") oTaxFree += t; else oTaxable += t;
        }
        csv += `"${partner.company_name || partner.mb_name}","${partner.mb_name}","${order.od_id}","${orderTime}","${order.od_status}",${oTaxable},${oTaxFree},${(order as any).od_send_cost || 0},${order.od_receipt_price},"${items}"\n`;
      }
    }

    if (!partnerData) {
      csv += "\n";
      csv += "=== 업체별 합계 ===\n";
      csv += "파트너사,주문건수,과세금액,면세금액,부가세,총금액\n";
      for (const p of targets) {
        csv += `"${p.company_name || p.mb_name}",${p.total_orders},${p.taxable_amount},${p.tax_free_amount},${p.vat_amount},${p.total_amount}\n`;
      }
      csv += `"전체 합계",${grandOrders},${grandTaxable},${grandTaxFree},${grandVat},${grandTotal}\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const monthStr = selectedMonth ? String(selectedMonth).padStart(2, "0") : "전체";
    const partnerName = partnerData ? (partnerData.company_name || partnerData.mb_name) : "전체";
    const fileName = `정산내역_${partnerName}_${selectedYear}년${monthStr !== "전체" ? monthStr + "월" : monthStr}.csv`;
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setPartnerFilter("");
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">정산 관리</h1>
          <p className="text-slate-500 mt-1 font-medium">업체별 주문 내역을 조회하고 정산 데이터를 다운로드합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}개씩 보기</option>
            ))}
          </select>
          <Button onClick={() => downloadExcel()} disabled={partnerSummaries.length === 0} className="h-10">
            <Download className="w-4 h-4 mr-1.5" />
            전체 엑셀 다운로드
          </Button>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">조회 조건</span>
          <button onClick={clearFilters} className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
            <X className="w-3 h-3" /> 초기화
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <select
            className="h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all flex-1"
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
          >
            <option value="">전체 파트너사</option>
            {partnersData?.partners?.map((p: any) => (
              <option key={p.mb_id} value={p.mb_id}>
                {p.company_name || p.mb_name} ({p.mb_id})
              </option>
            ))}
          </select>

          <select
            className="h-10 px-3 rounded-xl bg-white border-2 border-border text-sm font-bold focus:outline-none focus:border-primary transition-all w-28"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            className={cn(
              "h-9 px-4 rounded-lg border-2 text-sm font-bold transition-all",
              selectedMonth === null
                ? "bg-primary text-white border-primary"
                : "bg-white border-border text-slate-600 hover:border-primary/50"
            )}
            onClick={() => setSelectedMonth(null)}
          >
            전체
          </button>
          {months.map((m) => (
            <button
              key={m}
              className={cn(
                "h-9 w-12 rounded-lg text-sm font-bold transition-all",
                selectedMonth === m
                  ? "bg-primary text-white"
                  : "bg-white border border-border text-slate-600 hover:border-primary/50 hover:text-primary"
              )}
              onClick={() => setSelectedMonth(m)}
            >
              {m}월
            </button>
          ))}
        </div>
      </Card>

      <RecentProductsSection />

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-bold text-primary text-base">{periodLabel}</span>
        <span>조회 결과</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-5 text-center">
          <p className="text-xs text-slate-500 font-medium">파트너사</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{partnerSummaries.length}</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-xs text-slate-500 font-medium">주문건수</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{grandOrders}건</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-xs text-slate-500 font-medium">총 정산금액</p>
          <p className="text-2xl font-black text-primary mt-1 font-mono">{formatCurrency(grandTotal)}</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-xs text-slate-500 font-medium">과세 금액</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{formatCurrency(grandTaxable)}</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-xs text-slate-500 font-medium">면세 금액</p>
          <p className="text-2xl font-black text-green-600 mt-1 font-mono">{formatCurrency(grandTaxFree)}</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-xs text-slate-500 font-medium">부가세 (VAT)</p>
          <p className="text-2xl font-black text-orange-600 mt-1 font-mono">{formatCurrency(grandVat)}</p>
        </Card>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : partnerSummaries.length === 0 ? (
        <Card className="py-20 text-center">
          <Receipt className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">정산 내역이 없습니다</h3>
          <p className="text-slate-500 mt-2">조회 기간이나 파트너를 변경해보세요.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {partnerSummaries.map((partner) => {
            const isExpanded = expandedPartners.has(partner.mb_id);
            return (
              <Card key={partner.mb_id} className="p-0 overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => togglePartner(partner.mb_id)}
                >
                  <button className="text-slate-400 shrink-0">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {(partner.company_name || partner.mb_name || "?").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{partner.company_name || partner.mb_name || partner.mb_id}</p>
                      <p className="text-xs text-slate-500">{partner.mb_name} ({partner.mb_id})</p>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <div className="text-right hidden sm:block w-16">
                      <p className="text-xs text-slate-500">주문</p>
                      <p className="font-bold text-slate-900 text-sm">{partner.total_orders}건</p>
                    </div>
                    <div className="text-right hidden md:block w-24">
                      <p className="text-xs text-slate-500">과세</p>
                      <p className="font-bold text-slate-900 text-sm font-mono">{formatCurrency(partner.taxable_amount)}</p>
                    </div>
                    <div className="text-right hidden md:block w-24">
                      <p className="text-xs text-green-600">면세</p>
                      <p className="font-bold text-green-600 text-sm font-mono">{formatCurrency(partner.tax_free_amount)}</p>
                    </div>
                    <div className="text-right hidden lg:block w-24">
                      <p className="text-xs text-orange-500">부가세</p>
                      <p className="font-bold text-orange-600 text-sm font-mono">{formatCurrency(partner.vat_amount)}</p>
                    </div>
                    <div className="text-right w-28">
                      <p className="text-xs text-slate-500">정산금액</p>
                      <p className="font-black text-primary text-lg font-mono">{formatCurrency(partner.total_amount)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs shrink-0"
                      onClick={(e: any) => { e.stopPropagation(); downloadExcel(partner); }}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> 엑셀
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200">
                    <div className="px-5 py-3 bg-slate-50/80 flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span>상태별:</span>
                      {Object.entries(partner.status_counts).map(([st, cnt]) => (
                        <Badge key={st} className={cn("text-[10px]", getStatusColor(st))}>{st} {cnt}</Badge>
                      ))}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-2.5 text-xs font-bold text-slate-500">주문번호</th>
                            <th className="px-4 py-2.5 text-xs font-bold text-slate-500">주문일시</th>
                            <th className="px-4 py-2.5 text-xs font-bold text-slate-500">상품내역</th>
                            <th className="px-4 py-2.5 text-xs font-bold text-slate-500 text-center">과세구분</th>
                            <th className="px-4 py-2.5 text-xs font-bold text-slate-500 text-right">과세</th>
                            <th className="px-4 py-2.5 text-xs font-bold text-slate-500 text-right">면세</th>
                            <th className="px-4 py-2.5 text-xs font-bold text-slate-500 text-right">배송비</th>
                            <th className="px-4 py-2.5 text-xs font-bold text-slate-500 text-right">총액</th>
                            <th className="px-4 py-2.5 text-xs font-bold text-slate-500 text-center">상태</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {partner.orders.map((order: any) => {
                            const items = order.items || [];
                            let orderTaxable = 0;
                            let orderTaxFree = 0;
                            for (const item of items) {
                              const itemTotal = (Number(item.ct_price) || 0) * (Number(item.ct_qty) || 0);
                              if (String(item.it_notax) === "1") orderTaxFree += itemTotal;
                              else orderTaxable += itemTotal;
                            }
                            const hasBoth = orderTaxable > 0 && orderTaxFree > 0;
                            const taxLabel = orderTaxFree > 0 && orderTaxable === 0 ? "면세" : orderTaxable > 0 && orderTaxFree === 0 ? "과세" : hasBoth ? "혼합" : "-";
                            return (
                              <tr key={order.od_id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3">
                                  <p className="text-xs font-mono text-blue-600">#{order.od_id}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                                  {order.od_time ? format(new Date(order.od_time), "yy.MM.dd HH:mm") : "-"}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-slate-700 truncate max-w-[200px]">
                                    {items.length > 0
                                      ? `${items[0].it_name}${items.length > 1 ? ` 외 ${items.length - 1}건` : ""}`
                                      : "-"}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge className={cn("text-[10px]", taxLabel === "과세" ? "bg-slate-100 text-slate-600" : taxLabel === "면세" ? "bg-green-100 text-green-700" : taxLabel === "혼합" ? "bg-yellow-100 text-yellow-700" : "bg-slate-50 text-slate-400")}>{taxLabel}</Badge>
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 whitespace-nowrap">
                                  {orderTaxable > 0 ? formatCurrency(orderTaxable) : "-"}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-green-600 whitespace-nowrap">
                                  {orderTaxFree > 0 ? formatCurrency(orderTaxFree) : "-"}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-slate-500 whitespace-nowrap">
                                  {order.od_send_cost ? formatCurrency(order.od_send_cost) : "-"}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-black text-slate-900 whitespace-nowrap">
                                  {formatCurrency(order.od_receipt_price)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge className={cn("text-[10px]", getStatusColor(order.od_status))}>{order.od_status}</Badge>
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-50 border-t-2 border-slate-200">
                            <td colSpan={3} className="px-4 py-3 font-bold text-slate-600 text-sm">
                              소계 ({partner.total_orders}건)
                            </td>
                            <td></td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm whitespace-nowrap">
                              {formatCurrency(partner.taxable_amount)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-green-600 text-sm whitespace-nowrap">
                              {formatCurrency(partner.tax_free_amount)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-700 text-sm whitespace-nowrap">
                              {formatCurrency(partner.total_shipping)}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-primary text-sm whitespace-nowrap">
                              {formatCurrency(partner.total_amount)}
                            </td>
                            <td></td>
                          </tr>
                          <tr className="bg-orange-50/50">
                            <td colSpan={4} className="px-4 py-2 text-right text-xs font-bold text-orange-600">
                              부가세 (과세금액의 1/11)
                            </td>
                            <td className="px-4 py-2 text-right text-xs font-bold text-orange-600 whitespace-nowrap">
                              {formatCurrency(partner.vat_amount)}
                            </td>
                            <td colSpan={4}></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
