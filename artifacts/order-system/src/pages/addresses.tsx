import { useState } from "react";
import { useGetAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, getGetAddressesQueryKey } from "@workspace/api-client-react";
import type { DeliveryAddress } from "@workspace/api-client-react";
import { Card, Button } from "../components/ui";
import { Plus, Trash2, Edit2, MapPin, Star, X, Check } from "lucide-react";
import { toast } from "../hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    daum: any;
  }
}

function AddressFormModal({ initial, onClose }: {
  initial?: DeliveryAddress | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const createAddr = useCreateAddress();
  const updateAddr = useUpdateAddress();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    ad_subject: initial?.ad_subject || "",
    ad_name: initial?.ad_name || "",
    ad_hp: initial?.ad_hp || "",
    ad_addr1: initial?.ad_addr1 || "",
    ad_addr2: initial?.ad_addr2 || "",
    ad_addr3: initial?.ad_addr3 || "",
    ad_zip1: initial?.ad_zip ? initial.ad_zip.substring(0, 3) : "",
    ad_zip2: initial?.ad_zip ? initial.ad_zip.substring(3) : "",
    ad_default: initial?.ad_default === 1,
  });

  const searchAddress = () => {
    if (!window.daum?.Postcode) {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => openPostcode();
      document.head.appendChild(script);
    } else {
      openPostcode();
    }
  };

  const openPostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const zip = data.zonecode || "";
        setForm(f => ({
          ...f,
          ad_addr1: data.roadAddress || data.jibunAddress || "",
          ad_addr3: data.buildingName ? ` (${data.buildingName})` : "",
          ad_zip1: zip.substring(0, 3),
          ad_zip2: zip.substring(3),
        }));
      }
    }).open();
  };

  const handleSave = async () => {
    if (!form.ad_name.trim()) { toast({ title: "수령인을 입력해주세요", variant: "destructive" }); return; }
    if (!form.ad_addr1.trim()) { toast({ title: "주소를 입력해주세요", variant: "destructive" }); return; }

    try {
      if (isEdit && initial) {
        await updateAddr.mutateAsync({ id: initial.ad_id, data: form });
      } else {
        await createAddr.mutateAsync({ data: form });
      }
      queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() });
      toast({ title: isEdit ? "배송지가 수정되었습니다" : "배송지가 추가되었습니다" });
      onClose();
    } catch {
      toast({ title: "저장 실패", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "배송지 수정" : "새 배송지 추가"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">배송지명</label>
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="예: 회사, 물류센터"
              value={form.ad_subject} onChange={e => setForm(f => ({ ...f, ad_subject: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">수령인 <span className="text-red-500">*</span></label>
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="수령인 이름"
              value={form.ad_name} onChange={e => setForm(f => ({ ...f, ad_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">연락처</label>
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="010-0000-0000"
              value={form.ad_hp} onChange={e => setForm(f => ({ ...f, ad_hp: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">주소 <span className="text-red-500">*</span></label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 px-3 py-2.5 border rounded-lg text-sm bg-slate-50" placeholder="우편번호"
                value={form.ad_zip1 ? `${form.ad_zip1}${form.ad_zip2}` : ""} readOnly />
              <button type="button" onClick={searchAddress}
                className="px-4 py-2.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 whitespace-nowrap font-medium">
                주소 검색
              </button>
            </div>
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm bg-slate-50 mb-2" placeholder="기본주소"
              value={form.ad_addr1} readOnly />
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="상세주소 입력"
              value={form.ad_addr2} onChange={e => setForm(f => ({ ...f, ad_addr2: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ad_default}
              onChange={e => setForm(f => ({ ...f, ad_default: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300" />
            <span className="text-sm text-slate-600">기본 배송지로 설정</span>
          </label>
        </div>
        <div className="p-5 border-t flex gap-3">
          <Button className="flex-1" onClick={handleSave} disabled={createAddr.isPending || updateAddr.isPending}>
            {(createAddr.isPending || updateAddr.isPending) ? "저장 중..." : "저장"}
          </Button>
          <Button variant="outline" onClick={onClose}>취소</Button>
        </div>
      </div>
    </div>
  );
}

export default function Addresses() {
  const { data: addresses = [], isLoading } = useGetAddresses();
  const deleteAddr = useDeleteAddress();
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<DeliveryAddress | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleDelete = async (id: number) => {
    if (!confirm("이 배송지를 삭제하시겠습니까?")) return;
    try {
      await deleteAddr.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() });
      toast({ title: "배송지가 삭제되었습니다" });
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">배송지 관리</h1>
          <p className="text-slate-500 mt-2 font-medium">발주 시 사용할 배송지를 관리하세요.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> 새 배송지
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">로딩 중...</div>
      ) : addresses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">등록된 배송지가 없습니다</h3>
          <p className="text-slate-500 mb-6">새 배송지를 추가하면 발주 시 빠르게 선택할 수 있습니다.</p>
          <Button onClick={() => setShowAdd(true)}>배송지 추가하기</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr: DeliveryAddress) => (
            <Card key={addr.ad_id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-bold text-slate-900">{addr.ad_name}</span>
                  {addr.ad_subject && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{addr.ad_subject}</span>
                  )}
                  {addr.ad_default === 1 && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold flex items-center gap-0.5">
                      <Star className="w-3 h-3" /> 기본
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditTarget(addr)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(addr.ad_id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{addr.ad_addr1} {addr.ad_addr2} {addr.ad_addr3}</p>
              {addr.ad_zip && <p className="text-xs text-slate-400 mt-1">우편번호: {addr.ad_zip}</p>}
              {addr.ad_hp && <p className="text-sm text-slate-500 mt-2">{addr.ad_hp}</p>}
            </Card>
          ))}
        </div>
      )}

      {(showAdd || editTarget) && (
        <AddressFormModal
          initial={editTarget}
          onClose={() => { setShowAdd(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
