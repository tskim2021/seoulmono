import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function getDiscountPercent(price: number, salePrice: number | null): number | null {
  if (!salePrice || salePrice >= price) return null;
  return Math.round(((price - salePrice) / price) * 100);
}

export function getGradeLabel(grade: string): string {
  const map: Record<string, string> = { bronze: "브론즈", silver: "실버", gold: "골드", vip: "VIP", vvip: "VVIP" };
  return map[grade] ?? grade;
}

export function getGradeColor(grade: string): string {
  const map: Record<string, string> = { bronze: "text-amber-700", silver: "text-gray-500", gold: "text-yellow-600", vip: "text-purple-600", vvip: "text-rose-600" };
  return map[grade] ?? "text-gray-500";
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: "주문접수", paid: "결제완료", preparing: "상품준비중", shipping: "배송중", delivered: "배송완료", cancelled: "주문취소", refunded: "환불완료", customs_hold: "통관검사", partial_cancel: "일부취소" };
  return map[status] ?? status;
}

export function formatOrderNumber(orderNumber: string | null | undefined): string {
  if (!orderNumber) return "-";
  return orderNumber.replace(/^GNU-/i, "");
}

export function extractItId(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  return /^\d+$/.test(last) ? last : null;
}

export function productHref(slug: string | null | undefined, itId?: string | null): string {
  if (itId) return `/shop/item.php?it_id=${itId}`;
  const extractedId = extractItId(slug);
  if (extractedId) return `/shop/item.php?it_id=${extractedId}`;
  return slug ? `/product/${slug}` : "#";
}

export function proxyImage(url: string | null | undefined): string {
  if (!url) return "";
  // nginx가 /data/ 경로를 정적 파일로 직접 서빙하므로 URL 그대로 반환
  return url;
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", paid: "bg-blue-100 text-blue-800", preparing: "bg-indigo-100 text-indigo-800", shipping: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", refunded: "bg-gray-100 text-gray-800", customs_hold: "bg-red-100 text-red-600 font-semibold", partial_cancel: "bg-orange-100 text-orange-700" };
  return map[status] ?? "bg-gray-100 text-gray-800";
}
