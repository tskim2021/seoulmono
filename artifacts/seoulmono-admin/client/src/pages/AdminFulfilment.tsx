import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils';

type TabKey = 'new' | 'prep' | 'ship' | 'done' | 'cancel' | 'unpaid' | 'all';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'new', label: '신규 (결제완료)' },
  { key: 'prep', label: "準備中" },
  { key: 'ship', label: "配送中" },
  { key: 'done', label: "配送完了" },
  { key: 'cancel', label: '취소·반품' },
  { key: 'unpaid', label: '미결제(옛 주문)' },
  { key: 'all', label: "すべて" },
];
const NORM: Record<string, string> = { 배송준비: '상품준비중', 처리중: '상품준비중', 입금확인: '결제완료', 주문완료: '결제완료', 취소: '주문취소' };
const STATUS_COLOR: Record<string, string> = {
  결제완료: 'bg-blue-100 text-blue-800',
  상품준비중: 'bg-indigo-100 text-indigo-800',
  배송중: 'bg-purple-100 text-purple-800',
  배송완료: 'bg-green-100 text-green-800',
  주문취소: 'bg-red-100 text-red-800',
  반품: 'bg-orange-100 text-orange-800',
};
const NOTIFY_LABEL: Record<string, string> = { sent: '메일 발송됨', sending: '발송 중', failed: '메일 실패', skipped: '메일 주소 없음', none: '메일 대기' };

type DialogState = { type: 'ship' | 'add' | 'edit' | 'cancel' | 'refund' | 'note'; order: any; shipment?: any } | null;

function mailNote(r: any): string {
  const s = r?.mail?.state;
  if (s === 'sent') return ' (고객에게 메일을 보냈습니다)';
  if (s === 'skipped') return ' (고객 메일 주소가 없어 메일을 못 보냈습니다. 별도 안내 필요)';
  if (s === 'failed') return ' (메일 발송 실패: 주문 카드에서 메일 재발송을 눌러주세요)';
  return '';
}

function fmtKst(s: string): string {
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
}
function fmtUtcToKst(s: string): string {
  return fmtKst(String(s).replace(' ', 'T') + 'Z');
}

function EventLog({ odId }: { odId: string }) {
  const { data } = trpc.fulfilment.events.useQuery({ odId });
  if (!data) return <p className='text-xs text-muted-foreground'>読み込み中...</p>;
  if (!data.length) return <p className='text-xs text-muted-foreground'>이력이 없습니다.</p>;
  return (
    <ul className='text-xs space-y-1'>
      {data.map((e: any) => (
        <li key={e.id} className='flex flex-wrap gap-x-2 text-muted-foreground'>
          <span className='font-mono'>{fmtUtcToKst(e.atUtc)}</span>
          <span className='font-semibold text-foreground'>{e.event}</span>
          <span>{e.from && e.to && e.from !== e.to ? `${e.from} → ${e.to}` : e.to || e.from}</span>
          {e.refundAmount > 0 && <span>환불 {formatPrice(e.refundAmount)}</span>}
          <span>{e.actor}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminFulfilment() {
  const [tab, setTab] = useState<TabKey>('new');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [openLog, setOpenLog] = useState<string | null>(null);
  const [carrier, setCarrier] = useState('kpost');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [force, setForce] = useState(false);
  const [notify, setNotify] = useState(true);
  const [markReturned, setMarkReturned] = useState(false);
  const [message, setMessage] = useState('');
  const [ctIds, setCtIds] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const { data: meta } = trpc.fulfilment.meta.useQuery();
  const { data: counts } = trpc.fulfilment.counts.useQuery(undefined, { refetchInterval: 60000 });
  const { data, isLoading } = trpc.fulfilment.list.useQuery({ tab, search: search || undefined, page, limit: 20 }, { refetchInterval: 60000 });
  const act = trpc.fulfilment.act.useMutation();
  const reconcile = trpc.fulfilment.reconcile.useMutation();

  useEffect(() => {
    const od = new URLSearchParams(window.location.search).get('od');
    if (od) { setTab('all'); setSearch(od); setSearchInput(od); }
  }, []);

  const run = async (order: any, action: string, params: Record<string, any>, okMsg: string): Promise<void> => {
    try {
      const r: any = await act.mutateAsync({ odId: order.odId, action: action as any, params });
      if (r && r.ok === false) {
        const next = r.code === 'FORCE_REQUIRED' ? { ...params, force: true } : { ...params, confirm: true };
        if (window.confirm(`${r.message} 그래도 진행할까요?`)) return run(order, action, next, okMsg);
        return;
      }
      toast.success(okMsg + mailNote(r) + (r?.manual_refund_required ? ' (자동 환불 불가: 수동 환불 필요)' : ''));
      utils.fulfilment.list.invalidate();
      utils.fulfilment.counts.invalidate();
      setDialog(null);
    } catch (e: any) {
      toast.error(e?.message || '처리에 실패했습니다.');
    }
  };

  const ask = (msg: string, fn: () => void) => { if (window.confirm(msg)) fn(); };

  const openDialog = (d: DialogState) => {
    setCarrier(d?.shipment?.carrier || 'kpost');
    setCarrierName(d?.shipment?.carrier === 'other' ? d?.shipment?.carrierLabel || '' : '');
    setTrackingNo(d?.shipment?.trackingNo || '');
    setNote(d?.type === 'note' ? d.order.shopMemo || '' : '');
    setReason(''); setAmount(''); setForce(false); setNotify(true); setMarkReturned(false); setMessage(''); setCtIds([]);
    setDialog(d);
  };

  const submit = () => {
    if (!dialog) return;
    const o = dialog.order;
    const carrierParams = { carrier, ...(carrier === 'other' ? { carrier_name: carrierName } : {}) };
    const multi = (o.items?.length ?? 0) > 1;
    if (dialog.type === 'ship') return run(o, 'ship', { ...carrierParams, tracking_no: trackingNo, note, ...(multi && ctIds.length ? { ct_ids: ctIds } : {}) }, '발송 처리되었습니다.');
    if (dialog.type === 'add') {
      if (multi && ctIds.length === 0) { toast.error('이 송장에 포함된 상품을 선택하세요.'); return; }
      return run(o, 'add_shipment', { ...carrierParams, tracking_no: trackingNo, note, ct_ids: ctIds }, '송장이 추가되었습니다.');
    }
    if (dialog.type === 'edit') return run(o, 'update_tracking', { shipment_id: dialog.shipment?.id, ...carrierParams, tracking_no: trackingNo }, '송장이 수정되었습니다.');
    if (dialog.type === 'cancel') return run(o, 'cancel', { reason, force, notify, message_to_customer: message || undefined }, '주문이 취소되었습니다.');
    if (dialog.type === 'refund') return run(o, 'refund', { amount: Number(amount), reason, mark_returned: markReturned, notify, message_to_customer: message || undefined }, '환불 처리되었습니다.');
    return run(o, 'note', { text: note }, '메모가 저장되었습니다.');
  };

  const copyRecipient = async (o: any) => {
    const text = [o.recipient.name || o.name, o.recipient.phone, `〒${o.recipient.zip}`, o.recipient.address].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(text); toast.success('받는 사람 정보를 복사했습니다.'); } catch { toast.error('복사에 실패했습니다.'); }
  };

  const orders: any[] = data?.orders ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 20));
  const carriers: { code: string; label: string }[] = meta?.carriers ?? [];
  const dlgOrder = dialog?.order;
  const isStripe = dlgOrder?.pg === 'stripe';
  const dlgMulti = (dlgOrder?.items?.length ?? 0) > 1;

  return (
    <div>
      <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
        <h1 className='text-2xl font-bold'>주문 처리 (출고)</h1>
        <div className='flex gap-2'>
          <Input className='h-8 w-56 text-sm' placeholder='주문번호·이름·메일 검색' value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput.trim()); setPage(1); } }} />
          <Button size='sm' variant='outline' className='h-8' onClick={() => { setSearch(searchInput.trim()); setPage(1); }}>検索</Button>
          <Button size='sm' variant='outline' className='h-8' disabled={reconcile.isPending} onClick={async () => {
            try {
              const r: any = await reconcile.mutateAsync();
              toast.success(`Stripe 확인 ${r.checked}건 · 주문 생성 ${r.finalized}건 · 실패 ${r.failed}건` + (r.failed > 0 ? ' — 실패한 결제는 Stripe 대시보드에서 직접 확인·환불하세요' : ''));
              utils.fulfilment.list.invalidate(); utils.fulfilment.counts.invalidate();
            } catch (e: any) { toast.error(e?.message || '확인에 실패했습니다.'); }
          }}>{reconcile.isPending ? '확인 중...' : '미확정 결제 확인'}</Button>
        </div>
      </div>
      <p className='text-xs text-muted-foreground mb-3'>
        결제완료 주문이 새로 들어오면 「준비 시작」 → 상품 준비 후 우체국 국제소포 송장 번호를 넣고 「발송 처리」를 누르면 고객에게 일본어 발송 메일(추적 링크 포함)이 자동 발송됩니다.
        「준비 시작」을 누르면 고객이 직접 취소할 수 없고, 이후 취소는 고객의 신청(메일 알림)을 보고 여기서 「주문 취소·환불」로 처리합니다.
        「미확정 결제 확인」은 고객이 결제만 하고 완료 화면으로 돌아오지 못한 건이 있는지 Stripe에서 확인해 주문으로 만듭니다.
      </p>
      <div className='flex flex-wrap gap-1 mb-4'>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded border ${tab === t.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'}`}>
            {t.label}{counts ? ` ${counts[t.key] ?? 0}` : ''}
          </button>
        ))}
      </div>

      {isLoading ? <p className='text-sm text-muted-foreground py-8 text-center'>読み込み中...</p>
        : orders.length === 0 ? <p className='text-sm text-muted-foreground py-8 text-center'>해당하는 주문이 없습니다.</p>
        : <div className='space-y-3'>
          {orders.map((o) => {
            const st = NORM[o.status] || o.status;
            const paid = !['주문접수', '입금대기', '주문'].includes(o.status);
            return (
              <div key={o.odId} className='bg-card border rounded-xl p-4'>
                <div className='flex flex-wrap items-center gap-2 mb-3'>
                  <span className='font-mono font-semibold text-sm'>{o.odId}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[st] || 'bg-gray-100 text-gray-800'}`}>{o.status}</span>
                  {o.isTest && <span className='text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800'>테스트 결제</span>}
                  {o.isGuest && <span className='text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700'>비회원</span>}
                  {!paid && <span className='text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700'>미결제</span>}
                  <span className='text-xs text-muted-foreground'>{fmtKst(o.createdAt)}</span>
                  <span className='ml-auto font-semibold'>{formatPrice(o.amount)}</span>
                </div>
                <div className='grid md:grid-cols-3 gap-4 text-sm'>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1 flex items-center gap-2'>받는 사람 (일본)
                      <button className='text-primary hover:underline' onClick={() => copyRecipient(o)}>コピー</button>
                    </p>
                    <p className='font-medium'>{o.recipient.name || o.name}</p>
                    <p>{o.recipient.phone}</p>
                    <p>〒{o.recipient.zip}</p>
                    <p className='break-words'>{o.recipient.address}</p>
                    {o.customerMemo && <p className='mt-1 text-xs bg-muted/50 rounded px-2 py-1'>배송 요청: {o.customerMemo}</p>}
                    <p className='text-xs text-muted-foreground mt-1'>{o.email || '(메일 주소 없음)'}</p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>商品</p>
                    {o.items.map((it: any) => (
                      <p key={it.ctId} className='text-sm'>{it.name}{it.option ? ` (${it.option})` : ''} × {it.qty}</p>
                    ))}
                    <p className='text-xs text-muted-foreground mt-1'>배송비 {formatPrice(o.sendCost)}</p>
                    {o.shopMemo && <p className='mt-1 text-xs bg-amber-50 rounded px-2 py-1'>메모: {o.shopMemo}</p>}
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>송장</p>
                    {o.shipments.length === 0 && <p className='text-xs text-muted-foreground'>なし</p>}
                    {o.shipments.map((s: any) => (
                      <div key={s.id} className='text-sm mb-1'>
                        <span className='font-mono'>{s.trackingNo}</span> <span className='text-xs text-muted-foreground'>{s.carrierLabel} · {NOTIFY_LABEL[s.notifyState] || s.notifyState}</span>
                        {['배송중', '배송완료'].includes(st) && (
                          <span className='ml-2 space-x-2'>
                            <button className='text-xs text-primary hover:underline' onClick={() => openDialog({ type: 'edit', order: o, shipment: s })}>編集</button>
                            <button className='text-xs text-primary hover:underline' onClick={() => ask('고객에게 발송 안내 메일을 다시 보낼까요?', () => run(o, 'resend_mail', { shipment_id: s.id }, '메일을 다시 보냈습니다.'))}>메일 재발송</button>
                            {st === '배송중' && <button className='text-xs text-red-600 hover:underline' onClick={() => ask(`송장 ${s.trackingNo} 을(를) 삭제할까요? 고객에게 이미 보낸 메일은 취소되지 않습니다.`, () => run(o, 'remove_shipment', { shipment_id: s.id }, '송장을 삭제했습니다.'))}>削除</button>}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className='flex flex-wrap gap-2 mt-3 pt-3 border-t'>
                  {st === '결제완료' && paid && <Button size='sm' variant='outline' onClick={() => run(o, 'prepare', {}, '준비를 시작했습니다.')}>준비 시작</Button>}
                  {st === '상품준비중' && o.shipments.length === 0 && <Button size='sm' variant='outline' onClick={() => run(o, 'unprepare', {}, '결제완료 상태로 되돌렸습니다.')}>준비 취소</Button>}
                  {(st === '결제완료' || st === '상품준비중') && paid && <Button size='sm' onClick={() => openDialog({ type: 'ship', order: o })}>발송 처리 (송장 입력)</Button>}
                  {st === '배송중' && <Button size='sm' variant='outline' onClick={() => openDialog({ type: 'add', order: o })}>송장 추가</Button>}
                  {st === '배송중' && <Button size='sm' onClick={() => ask('배송완료로 처리할까요? 고객의 주문 화면에도 배송완료로 표시됩니다.', () => run(o, 'deliver', {}, '배송완료 처리되었습니다.'))}>배송완료 처리</Button>}
                  {['배송중', '배송완료', '반품'].includes(st) && isStripeOrder(o) && <Button size='sm' variant='outline' onClick={() => openDialog({ type: 'refund', order: o })}>부분 환불</Button>}
                  {['결제완료', '상품준비중', '배송중', '배송완료'].includes(st) || !paid ? (st !== '주문취소' && st !== '반품' && <Button size='sm' variant='outline' className='border-red-300 text-red-600' onClick={() => openDialog({ type: 'cancel', order: o })}>注文キャンセル{paid ? '·환불' : ''}</Button>) : null}
                  <Button size='sm' variant='ghost' onClick={() => openDialog({ type: 'note', order: o })}>メモ</Button>
                  <Button size='sm' variant='ghost' onClick={() => setOpenLog(openLog === o.odId ? null : o.odId)}>이력</Button>
                </div>
                {openLog === o.odId && <div className='mt-3 pt-3 border-t'><EventLog odId={o.odId} /></div>}
              </div>
            );
          })}
        </div>}

      <div className='flex justify-center gap-2 mt-4'>
        <Button size='sm' variant='outline' disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</Button>
        <span className='text-sm self-center'>{page} / {totalPages}</span>
        <Button size='sm' variant='outline' disabled={page >= totalPages} onClick={() => setPage(page + 1)}>다음</Button>
      </div>

      <Dialog open={!!dialog} onOpenChange={(v) => { if (!v) setDialog(null); }}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === 'ship' && '발송 처리'}
              {dialog?.type === 'add' && '송장 추가 (분할 발송)'}
              {dialog?.type === 'edit' && '송장 수정'}
              {dialog?.type === 'cancel' && '주문 취소'}
              {dialog?.type === 'refund' && '부분 환불'}
              {dialog?.type === 'note' && '관리자 메모'}
            </DialogTitle>
            <DialogDescription>주문 {dlgOrder?.odId}</DialogDescription>
          </DialogHeader>
          <div className='space-y-3 text-sm'>
            {['ship', 'add', 'edit'].includes(dialog?.type || '') && (<>
              <div>
                <label className='text-xs text-muted-foreground'>配送方法</label>
                <select className='w-full border rounded px-2 py-1.5 h-9 bg-background' value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                  {carriers.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              {carrier === 'other' && (
                <div>
                  <label className='text-xs text-muted-foreground'>택배사명 (고객 메일에 그대로 표시, 일본어 권장)</label>
                  <Input value={carrierName} onChange={(e) => setCarrierName(e.target.value)} placeholder='例: DHL' />
                </div>
              )}
              <div>
                <label className='text-xs text-muted-foreground'>운송장 번호 (영문 대문자·숫자)</label>
                <Input className='font-mono' value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder='예: CP123456789KR' />
              </div>
              {['ship', 'add'].includes(dialog?.type || '') && dlgMulti && (
                <div>
                  <label className='text-xs text-muted-foreground'>
                    이 송장에 포함된 상품 {dialog?.type === 'add' ? '(필수 선택)' : '(나눠 보낼 때만 선택, 비우면 전체)'}
                  </label>
                  <div className='space-y-1 mt-1'>
                    {dlgOrder.items.map((it: any) => (
                      <label key={it.ctId} className='flex items-center gap-2 text-sm'>
                        <input type='checkbox' checked={ctIds.includes(it.ctId)} onChange={(e) => setCtIds(e.target.checked ? [...ctIds, it.ctId] : ctIds.filter((x) => x !== it.ctId))} />
                        {it.name}{it.option ? ` (${it.option})` : ''} × {it.qty}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {dialog?.type !== 'edit' && <div>
                <label className='text-xs text-muted-foreground'>내부 메모 (선택)</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>}
              <p className='text-xs text-muted-foreground'>
                {dialog?.type === 'edit' ? '번호를 바꾸면 고객에게 「追跡番号を訂正しました」 메일이 다시 발송됩니다.' : '저장하면 고객에게 일본어 발송 메일(추적 링크 포함)이 자동 발송됩니다.'}
              </p>
            </>)}
            {dialog?.type === 'cancel' && (<>
              <p className='text-xs text-muted-foreground'>
                {isStripe ? 'Stripe 로 결제한 금액이 전액 자동 환불되고, 고객에게 취소 메일이 발송됩니다.' : '자동 환불 대상이 아닙니다. (미결제 또는 Stripe 외 결제)'}
              </p>
              <div><label className='text-xs text-muted-foreground'>취소 사유 (내부 기록)</label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
              <div><label className='text-xs text-muted-foreground'>고객에게 보낼 안내 문구 (선택, 일본어)</label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder='例: 在庫切れのため、ご注文をキャンセルいたしました。' /></div>
              <label className='flex items-center gap-2'><input type='checkbox' checked={notify} onChange={(e) => setNotify(e.target.checked)} />고객에게 취소 메일 보내기 (환불 시 항상 발송)</label>
              {['배송중', '배송완료'].includes(NORM[dlgOrder?.status ?? ''] || dlgOrder?.status) && (
                <label className='flex items-center gap-2 text-red-600'><input type='checkbox' checked={force} onChange={(e) => setForce(e.target.checked)} />이미 발송된 주문도 취소 (전액 환불)</label>
              )}
            </>)}
            {dialog?.type === 'refund' && (<>
              <div><label className='text-xs text-muted-foreground'>환불 금액 (엔)</label><Input inputMode='numeric' value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`최대 ${dlgOrder?.amount ?? ''}`} /></div>
              <div><label className='text-xs text-muted-foreground'>사유 (내부 기록)</label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
              <div><label className='text-xs text-muted-foreground'>고객에게 보낼 안내 문구 (선택, 일본어)</label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} /></div>
              <label className='flex items-center gap-2'><input type='checkbox' checked={markReturned} onChange={(e) => setMarkReturned(e.target.checked)} />상태를 「반품」으로 변경</label>
              <label className='flex items-center gap-2'><input type='checkbox' checked={notify} onChange={(e) => setNotify(e.target.checked)} />고객에게 환불 메일 보내기</label>
            </>)}
            {dialog?.type === 'note' && <Textarea value={note} onChange={(e) => setNote(e.target.value)} className='min-h-[100px]' />}
          </div>
          <DialogFooter>
            <Button variant='outline' size='sm' onClick={() => setDialog(null)}>閉じる</Button>
            <Button size='sm' disabled={act.isPending} onClick={submit}>{act.isPending ? "処理中..." : "確認"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function isStripeOrder(o: any): boolean {
  return o.pg === 'stripe';
}
