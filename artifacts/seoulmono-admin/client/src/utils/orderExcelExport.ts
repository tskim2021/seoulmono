import * as XLSX from "xlsx";
import { formatDateTime, getOrderStatusLabel } from "@/lib/utils";

export async function downloadOrdersExcel(orders: any[]) {
  try {
    const exportData = orders.map((o: any) => ({
      "주문번호": o.orderNumber,
      "주문자명": o.user?.name ?? "-",
      "주문자이메일": o.user?.email ?? "-",
      "수령인": o.recipientName,
      "수령인(영문명)": (o as any).recipientNameEn ?? "-",
      "연락처": o.recipientPhone,
      "우편번호": o.zipCode,
      "주소": o.address1,
      "상세주소": o.address2,
      "영문주소": (o as any).addressEn1 ?? "-",
      "영문상세주소": (o as any).addressEn2 ?? "-",
      "상품금액": o.totalAmount,
      "배송료": o.shippingCost ?? 0,
      "할인금액": o.discountAmount ?? 0,
      "결제금액": o.paymentAmount ?? o.totalAmount,
      "주문날짜": formatDateTime(o.createdAt),
      "상태": getOrderStatusLabel(o.status),
      "운송장": o.shipment?.trackingNumber ?? "-",
      "메모": o.memo ?? "-"
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "주문목록");
    
    const colWidths = [
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 }
    ];
    ws["!cols"] = colWidths;
    
    XLSX.writeFile(wb, `주문목록_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error("Excel export error:", error);
    return false;
  }
}
