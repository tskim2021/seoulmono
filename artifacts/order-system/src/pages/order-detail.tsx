import { useState } from "react";
import { useGetOrder, useGetBankSettings } from "@workspace/api-client-react";
import { Card, Badge, Button } from "../components/ui";
import { formatCurrency, getStatusColor, cn } from "../lib/utils";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Truck, Receipt, Loader2, PackageOpen, Mail, Phone, User, Building2 } from "lucide-react";
import { Link } from "wouter";
import TrackingModal from "../components/TrackingModal";

export default function OrderDetail({ params }: { params: { id: string } }) {
  const { data: order, isLoading } = useGetOrder(params.id);
  const { data: bankSettings } = useGetBankSettings();
  const [showTracking, setShowTracking] = useState(false);

  if (isLoading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!order) {
    return <div className="py-24 text-center text-slate-500 font-bold">주문 정보를 찾을 수 없습니다.</div>;
  }

  const hasInvoice = !!order.od_invoice_no;

  return (
    <div className="animate-in fade-in duration-300">
      <Link href="/orders" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        목록으로 돌아가기
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">주문상세정보</h1>
            <Badge className={cn("text-sm px-3 py-1", getStatusColor(order.od_status))}>{order.od_status}</Badge>
          </div>
          <p className="text-slate-500 font-medium text-lg">주문번호: #{order.od_id} <span className="mx-2 text-slate-300">|</span> {format(new Date(order.od_time), 'yyyy년 MM월 dd일 HH:mm')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-primary" />
                주문 상품 ({order.items.length}건)
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-1">{item.it_name}</h4>
                    <p className="text-slate-500">{formatCurrency(item.ct_price)} x {item.ct_qty}개</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">{formatCurrency(item.ct_price * item.ct_qty)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">상품금액</span>
                <span className="font-bold text-slate-700">{formatCurrency(order.od_receipt_price - (order.od_send_cost || 0))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">배송비</span>
                <span className="font-bold text-slate-700">{order.od_send_cost ? formatCurrency(order.od_send_cost) : "착불"}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-600">총 결제금액</span>
                <span className="text-2xl font-black text-primary">{formatCurrency(order.od_receipt_price)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Truck className="w-5 h-5 text-blue-500" />
              배송 정보
            </h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-bold">상태</span>
                <span className="col-span-2 font-bold text-slate-900">{order.od_status}</span>
              </div>
              {order.od_delivery_company && (
                <div className="grid grid-cols-3">
                  <span className="text-slate-500 font-bold">택배사</span>
                  <span className="col-span-2 font-bold text-slate-900">{order.od_delivery_company}</span>
                </div>
              )}
              {order.od_invoice_no && (
                <div className="grid grid-cols-3">
                  <span className="text-slate-500 font-bold">송장번호</span>
                  <span className="col-span-2 font-bold text-blue-600 tracking-wider">{order.od_invoice_no}</span>
                </div>
              )}
              {order.shipping && (
                <>
                  <div className="pt-3 mt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">배송지 정보</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 font-bold">수령인</span>
                    <span className="col-span-2 font-bold text-slate-900">{order.shipping.name}</span>
                  </div>
                  {order.shipping.hp && (
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500 font-bold">연락처</span>
                      <span className="col-span-2 text-slate-900">{order.shipping.hp}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 font-bold">주소</span>
                    <span className="col-span-2 text-slate-900">{order.shipping.addr1} {order.shipping.addr2} {order.shipping.addr3}</span>
                  </div>
                  {order.shipping.zip && (
                    <div className="grid grid-cols-3">
                      <span className="text-slate-500 font-bold">우편번호</span>
                      <span className="col-span-2 text-slate-900">{order.shipping.zip}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {hasInvoice && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setShowTracking(true)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm"
                >
                  <Truck className="w-4 h-4" />
                  배송 현황 조회
                </button>
              </div>
            )}
          </Card>

          {bankSettings && (bankSettings.bank_name || bankSettings.account_number) && (
            <Card className="p-6 border-blue-200 bg-blue-50/30">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">무통장입금 안내</h3>
              </div>
              <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-2 text-sm">
                {bankSettings.bank_name && (
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 font-bold">은행</span>
                    <span className="col-span-2 font-bold text-slate-900">{bankSettings.bank_name}</span>
                  </div>
                )}
                {bankSettings.account_number && (
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 font-bold">계좌번호</span>
                    <span className="col-span-2 font-bold text-blue-700 tracking-wide">{bankSettings.account_number}</span>
                  </div>
                )}
                {bankSettings.account_holder && (
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 font-bold">예금주</span>
                    <span className="col-span-2 font-bold text-slate-900">{bankSettings.account_holder}</span>
                  </div>
                )}
              </div>
              {bankSettings.memo && (
                <div className="mt-3 text-xs text-blue-600 leading-relaxed [&_p]:mb-0.5 [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: bankSettings.memo }} />
              )}
            </Card>
          )}

          {(order.od_name || order.od_hp || order.od_email) && (
            <Card className="p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-green-500" />
                세금계산서 정보
              </h3>
              <div className="space-y-3 text-sm">
                {order.od_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{order.od_name}</span>
                  </div>
                )}
                {order.od_hp && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{order.od_hp}</span>
                  </div>
                )}
                {order.od_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{order.od_email}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {order.od_memo && (
            <Card className="p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-amber-500" />
                요청사항
              </h3>
              <p className="text-slate-700 bg-amber-50 p-4 rounded-xl text-sm leading-relaxed border border-amber-100">
                {order.od_memo}
              </p>
            </Card>
          )}
        </div>
      </div>

      {showTracking && order.od_invoice_no && (
        <TrackingModal
          invoiceNo={order.od_invoice_no}
          carrier={order.od_delivery_company || "CJ대한통운"}
          onClose={() => setShowTracking(false)}
        />
      )}
    </div>
  );
}
