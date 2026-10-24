import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat('ja-JP').format(amount)}円`;
}

export function getStatusColor(status: string) {
  switch (status) {
    case '주문접수': return 'bg-slate-100 text-slate-700 border-slate-200';
    case '처리중': return 'bg-blue-100 text-blue-700 border-blue-200';
    case '배송준비': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case '배송중': return 'bg-purple-100 text-purple-700 border-purple-200';
    case '배송완료': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case '취소': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
