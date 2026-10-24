import * as XLSX from "xlsx";
import { formatDateTime, getOrderStatusLabel } from "@/lib/utils";

export async function downloadOrdersExcel(orders: any[]) {
  try {
    const exportData = orders.map((o: any) => ({
      "注文番号": o.orderNumber,
      "注文者名": o.user?.name ?? "-",
      "注文者メール": o.user?.email ?? "-",
      "受取人": o.recipientName,
      "受取人（英語名）": (o as any).recipientNameEn ?? "-",
      "連絡先": o.recipientPhone,
      "郵便番号": o.zipCode,
      "住所": o.address1,
      "詳細住所": o.address2,
      "英語住所": (o as any).addressEn1 ?? "-",
      "英語詳細住所": (o as any).addressEn2 ?? "-",
      "商品金額": o.totalAmount,
      "送料": o.shippingCost ?? 0,
      "割引金額": o.discountAmount ?? 0,
      "決済金額": o.paymentAmount ?? o.totalAmount,
      "注文日": formatDateTime(o.createdAt),
      "ステータス": getOrderStatusLabel(o.status),
      "送り状番号": o.shipment?.trackingNumber ?? "-",
      "メモ": o.memo ?? "-"
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "注文一覧");
    
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
    
    XLSX.writeFile(wb, `注文一覧_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error("Excel export error:", error);
    return false;
  }
}
