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
    if (!form.ad_name.trim()) { toast({ title: "受取人を入力してください", variant: "destructive" }); return; }
    if (!form.ad_addr1.trim()) { toast({ title: "住所を入力してください", variant: "destructive" }); return; }

    try {
      if (isEdit && initial) {
        await updateAddr.mutateAsync({ id: initial.ad_id, data: form });
      } else {
        await createAddr.mutateAsync({ data: form });
      }
      queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() });
      toast({ title: isEdit ? "配送先を更新しました" : "配送先を追加しました" });
      onClose();
    } catch {
      toast({ title: "保存に失敗しました", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "配送先の編集" : "新しい配送先の追加"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">配送先名</label>
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="例: 本社、物流センター"
              value={form.ad_subject} onChange={e => setForm(f => ({ ...f, ad_subject: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">受取人 <span className="text-red-500">*</span></label>
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="受取人名"
              value={form.ad_name} onChange={e => setForm(f => ({ ...f, ad_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">連絡先</label>
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="010-0000-0000"
              value={form.ad_hp} onChange={e => setForm(f => ({ ...f, ad_hp: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">住所 <span className="text-red-500">*</span></label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 px-3 py-2.5 border rounded-lg text-sm bg-slate-50" placeholder="郵便番号"
                value={form.ad_zip1 ? `${form.ad_zip1}${form.ad_zip2}` : ""} readOnly />
              <button type="button" onClick={searchAddress}
                className="px-4 py-2.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 whitespace-nowrap font-medium">
                住所検索
              </button>
            </div>
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm bg-slate-50 mb-2" placeholder="基本住所"
              value={form.ad_addr1} readOnly />
            <input className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="住所の詳細を入力"
              value={form.ad_addr2} onChange={e => setForm(f => ({ ...f, ad_addr2: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ad_default}
              onChange={e => setForm(f => ({ ...f, ad_default: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300" />
            <span className="text-sm text-slate-600">既定の配送先に設定</span>
          </label>
        </div>
        <div className="p-5 border-t flex gap-3">
          <Button className="flex-1" onClick={handleSave} disabled={createAddr.isPending || updateAddr.isPending}>
            {(createAddr.isPending || updateAddr.isPending) ? "保存中..." : "保存"}
          </Button>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
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
    if (!confirm("この配送先を削除してもよろしいですか？")) return;
    try {
      await deleteAddr.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() });
      toast({ title: "配送先を削除しました" });
    } catch {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">配送先管理</h1>
          <p className="text-slate-500 mt-2 font-medium">発注時に使用する配送先を管理します。</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> 新しい配送先
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">読み込み中...</div>
      ) : addresses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">登録された配送先がありません</h3>
          <p className="text-slate-500 mb-6">新しい配送先を追加すると、発注時にすばやく選択できます。</p>
          <Button onClick={() => setShowAdd(true)}>配送先を追加する</Button>
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
                      <Star className="w-3 h-3" /> 既定
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
              {addr.ad_zip && <p className="text-xs text-slate-400 mt-1">郵便番号: {addr.ad_zip}</p>}
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
