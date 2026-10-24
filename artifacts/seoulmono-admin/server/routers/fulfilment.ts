import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, router } from '../_core/trpc';
import { g5q } from '../g5';

// 주문 처리(출고) 라우터.
// 읽기: kapp_s001 의 g5_shop_order / g5_shop_cart / allddaom_order_* 를 직접 조회한다.
// 쓰기: 상태 전이·송장·메일·Stripe 환불은 전부 쇼핑몰 API 의 loopback 전용 엔드포인트가 처리한다
//       (한 곳에서만 규칙을 관리하기 위함). 호출에는 INTERNAL_API_KEY(쇼핑몰 env.json 과 admin2 .env 에 같은 값)가 필수다.
const SHOP_API = (process.env.SHOP_INTERNAL_URL || 'http://127.0.0.1:8080/api').replace(/[/]+$/, '');

// 배송은 우체국 국제소포로 한다. 예외적으로 다른 업체를 쓰면 '기타'를 고르고 업체명을 직접 입력한다.
export const FULFIL_CARRIERS = [
  { code: 'kpost', label: '우체국 국제소포 (韓国郵便 国際小包)' },
  { code: 'other', label: '기타 (택배사명 직접 입력)' },
];

const TAB_STATUSES: Record<string, string[]> = {
  new: ['결제완료', '입금확인', '주문완료'],
  prep: ['상품준비중', '배송준비', '처리중'],
  ship: ['배송중'],
  done: ['배송완료', '구매완료'],
  cancel: ['주문취소', '취소', '반품', '교환'],
  unpaid: ['주문접수', '입금대기', '주문'],
};

const odIdSchema = z.string().regex(/^[0-9]{8,20}$/);

function requireKey(): string {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'INTERNAL_API_KEY 가 admin2 .env 에 설정되어 있지 않습니다.' });
  return key;
}

async function callShop(odId: string, action: string, params: Record<string, unknown>, actor: string) {
  const key = requireKey();
  let res: Response;
  try {
    res = await fetch(`${SHOP_API}/internal/orders/${odId}/act`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': key },
      body: JSON.stringify({ action, params, actor }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (e: any) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '쇼핑몰 서버에 연결하지 못했습니다: ' + (e?.message || e) });
  }
  const data: any = await res.json().catch(() => ({}));
  if (res.ok) return data;
  // 확인이 필요한 경고는 에러가 아니라 결과로 돌려줘서 화면이 확인창을 띄우게 한다.
  if (res.status === 409 && (data?.code === 'CONFIRM_REQUIRED' || data?.code === 'FORCE_REQUIRED')) {
    return { ok: false, code: data.code, message: data.error, warnings: data?.extra?.warnings ?? [] };
  }
  throw new TRPCError({
    code: res.status === 404 ? 'NOT_FOUND' : res.status === 409 ? 'CONFLICT' : 'BAD_REQUEST',
    message: data?.error || '처리에 실패했습니다.',
  });
}

export const fulfilmentRouter = router({
  meta: adminProcedure.query(() => ({ carriers: FULFIL_CARRIERS })),

  counts: adminProcedure.query(async () => {
    const rows = await g5q<{ od_status: string; c: number }>('SELECT od_status, COUNT(*) AS c FROM g5_shop_order GROUP BY od_status');
    const out: Record<string, number> = { new: 0, prep: 0, ship: 0, done: 0, cancel: 0, unpaid: 0, all: 0 };
    for (const r of rows) {
      const n = Number(r.c) || 0;
      out.all += n;
      for (const [tab, list] of Object.entries(TAB_STATUSES)) if (list.includes(r.od_status)) out[tab] += n;
    }
    return out;
  }),

  list: adminProcedure
    .input(z.object({
      tab: z.enum(['new', 'prep', 'ship', 'done', 'cancel', 'unpaid', 'all']).default('new'),
      search: z.string().max(40).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const where: string[] = [];
      const params: any[] = [];
      if (input.tab !== 'all') {
        const st = TAB_STATUSES[input.tab];
        where.push(`od_status IN (${st.map(() => '?').join(',')})`);
        params.push(...st);
      }
      if (input.search) {
        const s = `%${input.search}%`;
        where.push('(od_id LIKE ? OR od_name LIKE ? OR od_b_name LIKE ? OR od_email LIKE ?)');
        params.push(s, s, s, s);
      }
      const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
      const rows = await g5q<any>(
        `SELECT CAST(od_id AS CHAR) AS od_id, mb_id, od_name, od_email, od_status, od_pg, od_test, od_receipt_price, od_cart_price, od_send_cost,
                od_memo, od_shop_memo, od_time, od_b_name, od_b_hp, od_b_zip1, od_b_zip2, od_b_addr1, od_b_addr2, od_b_addr3,
                od_delivery_company, od_invoice
           FROM g5_shop_order ${w} ORDER BY od_time DESC, od_id DESC LIMIT ? OFFSET ?`,
        [...params, input.limit, (input.page - 1) * input.limit],
      );
      const total = Number((await g5q<any>(`SELECT COUNT(*) AS c FROM g5_shop_order ${w}`, params))[0]?.c) || 0;
      const ids: string[] = rows.map((r: any) => String(r.od_id));
      let items: any[] = [];
      let ships: any[] = [];
      if (ids.length) {
        items = await g5q<any>(
          `SELECT ct_id, CAST(od_id AS CHAR) AS od_id, it_id, it_name, ct_qty, ct_price, ct_option, ct_status
             FROM g5_shop_cart WHERE od_id IN (${ids.map(() => 'CAST(? AS SIGNED)').join(',')}) ORDER BY ct_id`,
          ids,
        );
        ships = await g5q<any>(
          `SELECT id, od_id, carrier_code, carrier_label, tracking_no, ct_ids, note, notify_state, notify_to,
                  DATE_FORMAT(shipped_at_utc, '%Y-%m-%d %H:%i:%s') AS shipped_at_utc
             FROM allddaom_order_shipments WHERE od_id IN (?) ORDER BY id`,
          [ids],
        ).catch(() => []);
      }
      const orders = rows.map((r: any) => {
        const id = String(r.od_id);
        return {
          odId: id,
          status: String(r.od_status || ''),
          createdAt: r.od_time instanceof Date ? (isNaN(r.od_time.getTime()) ? '' : r.od_time.toISOString()) : String(r.od_time || ''),
          name: r.od_name || r.od_b_name || '',
          email: r.od_email || '',
          isGuest: String(r.mb_id || '').startsWith('guest_'),
          pg: r.od_pg || '',
          isTest: String(r.od_test) === '1',
          amount: Number(r.od_receipt_price) || 0,
          sendCost: Number(r.od_send_cost) || 0,
          customerMemo: r.od_memo || '',
          shopMemo: r.od_shop_memo || '',
          recipient: {
            name: r.od_b_name || '',
            phone: r.od_b_hp || '',
            zip: `${r.od_b_zip1 || ''}${r.od_b_zip2 || ''}`,
            address: [r.od_b_addr1, r.od_b_addr2, r.od_b_addr3].filter(Boolean).join(' '),
          },
          items: items.filter((x) => String(x.od_id) === id).map((x) => ({
            ctId: Number(x.ct_id), itId: x.it_id, name: x.it_name, qty: Number(x.ct_qty) || 1, price: Number(x.ct_price) || 0, option: x.ct_option || '', status: x.ct_status || '',
          })),
          shipments: ships.filter((x) => String(x.od_id) === id).map((x) => ({
            id: Number(x.id), carrier: x.carrier_code, carrierLabel: x.carrier_label, trackingNo: x.tracking_no, ctIds: x.ct_ids || '', note: x.note || '', notifyState: x.notify_state, notifyTo: x.notify_to || '', shippedAtUtc: x.shipped_at_utc,
          })),
        };
      });
      return { orders, total };
    }),

  events: adminProcedure.input(z.object({ odId: odIdSchema })).query(async ({ input }) => {
    const rows = await g5q<any>(
      `SELECT id, event, from_status, to_status, actor, refund_amount, detail, DATE_FORMAT(created_at_utc, '%Y-%m-%d %H:%i:%s') AS at_utc
         FROM allddaom_order_events WHERE od_id = ? ORDER BY id DESC LIMIT 50`,
      [input.odId],
    ).catch(() => []);
    return rows.map((r: any) => ({ id: Number(r.id), event: r.event, from: r.from_status, to: r.to_status, actor: r.actor, refundAmount: Number(r.refund_amount) || 0, detail: r.detail || '', atUtc: r.at_utc }));
  }),

  // 결제는 끝났는데 고객이 성공 페이지로 돌아오지 못해 주문이 만들어지지 않은 건을 Stripe 에서 확인해 주문으로 확정한다.
  reconcile: adminProcedure.mutation(async () => {
    const key = requireKey();
    let res: Response;
    try {
      res = await fetch(`${SHOP_API}/internal/stripe/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': key },
        body: '{}',
        signal: AbortSignal.timeout(120000),
      });
    } catch (e: any) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '쇼핑몰 서버에 연결하지 못했습니다: ' + (e?.message || e) });
    }
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new TRPCError({ code: 'BAD_REQUEST', message: data?.error || '확인에 실패했습니다.' });
    return data;
  }),

  act: adminProcedure
    .input(z.object({
      odId: odIdSchema,
      action: z.enum(['prepare', 'unprepare', 'ship', 'add_shipment', 'update_tracking', 'remove_shipment', 'resend_mail', 'deliver', 'cancel', 'refund', 'note']),
      params: z.record(z.string(), z.any()).default({}),
    }))
    .mutation(async ({ input, ctx }) => {
      const actor = `admin:${ctx.user.name || ctx.user.email || ctx.user.id}`;
      return callShop(input.odId, input.action, input.params, actor);
    }),
});
