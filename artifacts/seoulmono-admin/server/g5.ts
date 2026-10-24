/**
 * seoulmono 운영 DB(그누보드5 스키마) 어댑터.
 *
 * 이 파일이 탈모2 관리자와 seoulmono 실데이터 사이의 유일한 접점이다.
 * 화면·tRPC 라우터는 건드리지 않고, server/db.ts 의 함수 본문을 여기 헬퍼로
 * 한 화면씩 갈아끼우는 방식으로 연결한다.
 *
 * 규칙:
 *  - 기존 g5_* / allddaom_* / va_* 테이블은 스키마를 변경하지 않는다.
 *  - 탈모2 고유 기능용 신규 테이블은 drizzle 쪽 a2_* 접두사로만 만든다.
 */
import crypto from "crypto";
import mysql from "mysql2/promise";

let _pool: mysql.Pool | null = null;

export function getG5Pool(): mysql.Pool {
  if (!_pool) {
    const url = process.env.SHOP_DATABASE_URL || process.env.DATABASE_URL;
    if (!url) throw new Error("SHOP_DATABASE_URL(또는 DATABASE_URL)이 설정되지 않았습니다.");
    _pool = mysql.createPool({
      uri: url,
      connectionLimit: 5,
      charset: "utf8mb4",
      dateStrings: false,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });
  }
  return _pool;
}

/** SELECT 헬퍼. */
export async function g5q<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await getG5Pool().query(sql, params);
  return rows as T[];
}

/** 단일 행 SELECT 헬퍼. */
export async function g5one<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await g5q<T>(sql, params);
  return rows.length ? rows[0] : null;
}

/**
 * 그누보드5 비밀번호 검증.
 * seoulmono 은 `sha256:<iterations>:<salt>:<derived>` (PBKDF2-SHA256, 24byte)
 * 형식을 쓰고, 구형 계정은 md5 로 남아 있다.
 * 기존 api-server 의 verifyGnuboardPassword 와 동일한 알고리즘이다.
 */
/**
 * 그누보드5 비밀번호 해시 생성 (관리자 비밀번호 초기화용).
 * 실 서비스 api-server 의 gnuboardPasswordHash 와 동일한 알고리즘/파라미터.
 */
export function gnuboardPasswordHash(password: string): string {
  const iterations = 12000;
  const salt = crypto.randomBytes(24).toString("base64");
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 24, "sha256").toString("base64");
  return `sha256:${iterations}:${salt}:${derived}`;
}

export function verifyGnuboardPassword(password: string, hash: string): boolean {
  if (!hash) return false;
  if (hash.startsWith("sha256:")) {
    const parts = hash.split(":");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const storedDerived = parts[3];
    const derived = crypto.pbkdf2Sync(password, salt, iterations, 24, "sha256").toString("base64");
    return derived === storedDerived;
  }
  const md5Hash = crypto.createHash("md5").update(password).digest("hex");
  return md5Hash === hash;
}

/** g5_member 한 행을 탈모2의 User 형태로 변환한다. */
export function mapMemberToUser(m: any): any {
  if (!m) return null;
  return {
    id: Number(m.mb_no),
    openId: `g5:${m.mb_id}`,
    name: m.mb_name || m.mb_nick || m.mb_id,
    email: m.mb_email || null,
    password: m.mb_password || null,
    loginMethod: "g5",
    role: Number(m.mb_level) >= 10 ? "admin" : "user",
    phone: m.mb_hp || null,
    grade: "bronze",
    points: Number(m.mb_point || 0),
    totalSpent: 0,
    createdAt: m.mb_datetime ?? new Date(0),
    updatedAt: m.mb_datetime ?? new Date(0),
    lastSignedIn: m.mb_today_login ?? new Date(0),
    emailNotifications: 1,
    emailNotifyOrder: 1,
    emailNotifyPoint: 1,
    emailNotifyReview: 1,
    emailNotifyComment: 1,
    emailNotifySystem: 1,
    // g5 전용 부가 정보 (화면에서 필요하면 사용)
    mbId: m.mb_id,
    mbLevel: Number(m.mb_level || 0),
  };
}

const MEMBER_COLS =
  "mb_no, mb_id, mb_name, mb_nick, mb_email, mb_hp, mb_level, mb_point, mb_datetime, mb_today_login, mb_password";

export async function g5GetMemberById(mbId: string) {
  return g5one(`SELECT ${MEMBER_COLS} FROM g5_member WHERE mb_id = ? LIMIT 1`, [mbId]);
}

export async function g5GetMemberByNo(mbNo: number) {
  return g5one(`SELECT ${MEMBER_COLS} FROM g5_member WHERE mb_no = ? LIMIT 1`, [mbNo]);
}

/** 로그인 식별자는 이메일 또는 그누보드 아이디 둘 다 허용한다. */
export async function g5GetMemberByEmailOrId(idOrEmail: string) {
  return g5one(
    `SELECT ${MEMBER_COLS} FROM g5_member WHERE mb_email = ? OR mb_id = ? ORDER BY mb_level DESC LIMIT 1`,
    [idOrEmail, idOrEmail]
  );
}

/* ------------------------------------------------------------------ *
 * 주문 (g5_shop_order)
 * ------------------------------------------------------------------ */

/** 그누보드 od_status(한글) → 탈모2 order.status */
export const G5_ORDER_STATUS_MAP: Record<string, string> = {
  "주문": "pending",
  "입금": "paid",
  "주문접수": "pending",
  "결제완료": "paid",
  "입금확인": "paid",
  "상품준비중": "preparing",
  "배송준비중": "preparing",
  "배송준비": "preparing",
  "배송중": "shipping",
  "배송완료": "delivered",
  "구매확정": "delivered",
  "주문취소": "cancelled",
  "준비": "preparing",
  "배송": "shipping",
  "완료": "delivered",
  "구매완료": "delivered",
  "취소": "cancelled",
  "반품": "returned",
  "품절": "cancelled",
};

export function g5MapOrderStatus(odStatus: string): string {
  return G5_ORDER_STATUS_MAP[String(odStatus || "").trim()] ?? "pending";
}

/** g5_shop_order 한 행을 탈모2의 order 형태로 변환한다. */
export function mapOrderToTalmo(o: any): any {
  if (!o) return null;
  // 실 수납액이 있으면 그것을, 아직 없으면 장바구니 금액+배송비를 쓴다.
  const receipt = Number(o.od_receipt_price || 0);
  const cart = Number(o.od_cart_price || 0);
  const send = Number(o.od_send_cost || 0) + Number(o.od_send_cost2 || 0);
  const odId = String(o.od_id);
  return {
    id: odId,
    orderNumber: odId,
    userId: null,
    mbId: o.mb_id || null,
    source: "sorosoro",
    status: g5MapOrderStatus(o.od_status),
    rawStatus: o.od_status,
    totalAmount: receipt > 0 ? receipt : cart + send,
    discountAmount: Number(o.od_cart_coupon || 0) + Number(o.od_coupon || 0),
    shippingFee: send,
    pointsUsed: Number(o.od_receipt_point || 0),
    recipientName: o.od_b_name || o.od_name || "",
    recipientPhone: o.od_b_hp || o.od_hp || "",
    zipCode: o.od_b_zip1 ? `${o.od_b_zip1}${o.od_b_zip2 || ""}` : "",
    address1: o.od_b_addr1 || "",
    address2: o.od_b_addr2 || "",
    memo: o.od_memo || "",
    adminNotes: o.od_shop_memo || "",
    paidAt: o.od_receipt_time && String(o.od_receipt_time) !== "0000-00-00 00:00:00" ? o.od_receipt_time : null,
    createdAt: o.od_time,
    updatedAt: o.od_time,
  };
}

/**
 * 주의: g5_shop_order.od_id 는 bigint(20) 이고 실제 값이
 * 26050410063387756 처럼 JS 안전정수(2^53-1)를 넘는다.
 * 숫자로 받으면 정밀도가 깨지므로 반드시 CHAR 로 캐스팅해서 읽는다.
 */
export const G5_ORDER_COLS =
  "CAST(od_id AS CHAR) AS od_id, mb_id, od_name, od_b_name, od_hp, od_b_hp, od_b_zip1, od_b_zip2, od_b_addr1, od_b_addr2, " +
  "od_cart_price, od_cart_coupon, od_send_cost, od_send_cost2, od_coupon, od_receipt_price, od_receipt_point, " +
  "od_memo, od_shop_memo, od_status, od_receipt_time, od_time";
