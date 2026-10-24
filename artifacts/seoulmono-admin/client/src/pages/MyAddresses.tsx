import MyPageLayout from "@/components/MyPageLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Plus, Trash2, Globe } from "lucide-react";
import { Link } from "wouter";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import KoreanAddressSearch, { type AddressData } from "@/components/KoreanAddressSearch";

interface AddressForm {
  name: string;
  recipient: string;
  recipientNameEn: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
  addressEn1: string;
  addressEn2: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  name: "", recipient: "", recipientNameEn: "", phone: "", zipCode: "", address1: "", address2: "",
  addressEn1: "", addressEn2: "", isDefault: false,
};

export default function MyAddresses() {
  useAuth({ redirectOnUnauthenticated: true });
  const { data: addresses } = trpc.user.addresses.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>({ ...emptyForm });
  const [addressData, setAddressData] = useState<Partial<AddressData>>({});

  const createAddr = trpc.user.createAddress.useMutation({
    onSuccess: () => { toast.success("배송지가 추가되었습니다"); utils.user.addresses.invalidate(); closeDialog(); },
  });
  const updateAddr = trpc.user.updateAddress.useMutation({
    onSuccess: () => { toast.success("배송지가 수정되었습니다"); utils.user.addresses.invalidate(); closeDialog(); },
  });
  const deleteAddr = trpc.user.deleteAddress.useMutation({
    onSuccess: () => { toast.success("배송지가 삭제되었습니다"); utils.user.addresses.invalidate(); },
  });

  const closeDialog = () => {
    setOpen(false);
    setEditId(null);
    setForm({ ...emptyForm });
    setAddressData({});
  };

  const openEdit = (addr: any) => {
    setEditId(addr.id);
    setForm({
      name: addr.name,
      recipient: addr.recipient,
      recipientNameEn: addr.recipientNameEn ?? "",
      phone: addr.phone,
      zipCode: addr.zipCode,
      address1: addr.address1,
      address2: addr.address2 ?? "",
      addressEn1: addr.addressEn1 ?? "",
      addressEn2: addr.addressEn2 ?? "",
      isDefault: addr.isDefault === 1,
    });
    setAddressData({
      zipCode: addr.zipCode,
      address1: addr.address1,
      address2: addr.address2 ?? "",
      addressEn1: addr.addressEn1 ?? "",
      addressEn2: addr.addressEn2 ?? "",
    });
    setOpen(true);
  };

  const handleAddressChange = useCallback((data: AddressData) => {
    setAddressData(data);
    setForm(f => ({
      ...f,
      zipCode: data.zipCode,
      address1: data.address1,
      address2: data.address2,
      addressEn1: data.addressEn1,
      addressEn2: data.addressEn2,
    }));
  }, []);

  const handleSubmit = () => {
    if (!form.name || !form.recipient || !form.phone || !form.zipCode || !form.address1) {
      toast.error("필수 정보를 모두 입력해주세요");
      return;
    }
    if (editId) {
      updateAddr.mutate({
        id: editId,
        ...form,
        recipientNameEn: form.recipientNameEn || undefined,
        address2: form.address2 || undefined,
        addressEn1: form.addressEn1 || undefined,
        addressEn2: form.addressEn2 || undefined,
        isDefault: form.isDefault ? 1 : 0,
      });
    } else {
      createAddr.mutate({
        ...form,
        recipientNameEn: form.recipientNameEn || undefined,
        address2: form.address2 || undefined,
        addressEn1: form.addressEn1 || undefined,
        addressEn2: form.addressEn2 || undefined,
        isDefault: form.isDefault ? 1 : 0,
      });
    }
  };

  return (
    <MyPageLayout title="배송지 관리">
        <div className="flex items-center justify-between mb-6">
          <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button size="sm" onClick={() => { setEditId(null); setForm({ ...emptyForm }); setAddressData({}); }}><Plus className="w-4 h-4 mr-1" />배송지 추가</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "배송지 수정" : "새 배송지 추가"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label className="text-sm mb-1.5 block">배송지명</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 집, 회사" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-sm mb-1.5 block">수령인</Label><Input value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))} /></div>
                  <div><Label className="text-sm mb-1.5 block">연락처</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">수령인 영문명 <span className="text-muted-foreground font-normal">(국제배송용)</span></Label>
                  <Input value={form.recipientNameEn} onChange={e => setForm(f => ({ ...f, recipientNameEn: e.target.value }))} placeholder="예: Hong Gildong" />
                </div>

                {/* 한국 주소 검색 */}
                <div>
                  <Label className="text-sm mb-1.5 block">주소</Label>
                  <KoreanAddressSearch
                    value={addressData}
                    onChange={handleAddressChange}
                    showEnglishPreview={true}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox checked={form.isDefault} onCheckedChange={c => setForm(f => ({ ...f, isDefault: !!c }))} id="default" />
                  <label htmlFor="default" className="text-sm">기본 배송지로 설정</label>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={!form.name || !form.recipient || !form.phone || !form.zipCode || !form.address1 || createAddr.isPending || updateAddr.isPending}>
                  {(createAddr.isPending || updateAddr.isPending) ? "처리중..." : editId ? "수정하기" : "추가하기"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(addresses ?? []).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">등록된 배송지가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses!.map(addr => (
              <div key={addr.id} className="bg-card border rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{addr.name}</span>
                    {addr.isDefault === 1 && <Badge variant="secondary" className="text-[10px]">기본</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    {addr.isDefault !== 1 && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => updateAddr.mutate({ id: addr.id, isDefault: 1 })}>기본으로 설정</Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(addr)}>수정</Button>
                    <button onClick={() => { if (confirm("삭제하시겠습니까?")) deleteAddr.mutate({ id: addr.id }); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-sm">{addr.recipient} / {addr.phone}</p>
                <p className="text-sm text-muted-foreground">[{addr.zipCode}] {addr.address1} {addr.address2}</p>
                {(addr as any).addressEn1 && (
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {(addr as any).addressEn1}{(addr as any).addressEn2 ? `, ${(addr as any).addressEn2}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
    </MyPageLayout>
  );
}
