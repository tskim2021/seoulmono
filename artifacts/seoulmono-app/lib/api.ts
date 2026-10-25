import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { normalizeCatalog } from './catalog';

const DOMAIN: string =
  (process.env.EXPO_PUBLIC_DOMAIN as string) ||
  (Constants.expoConfig?.extra?.domain as string) ||
  "seoulmono.com";

export const BASE_URL = `https://${DOMAIN}/api`;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function errorMessage(message: string, status: number) {
  if (!/[가-힣]/.test(message)) return message;
  if (status === 401) return 'ログインIDまたはパスワードをご確認ください。';
  if (status === 403) return 'この操作を行う権限がありません。';
  if (status === 404) return '情報が見つかりませんでした。';
  if (/이메일 인증/.test(message)) return 'メール認証を完了してください。';
  if (/이미.*아이디/.test(message)) return 'このIDはすでに使用されています。';
  if (/이미.*이메일/.test(message)) return 'このメールアドレスはすでに登録されています。';
  return '処理に失敗しました。入力内容をご確認のうえ、もう一度お試しください。';
}

export function getImageUrl(src: string | undefined | null, w?: number): string | null {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  const path = src.startsWith("/") ? src : `/api/product-image/${src}`;
  const url = `https://${DOMAIN}${path}`;
  return w ? `${url}?w=${w}` : url;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await AsyncStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(errorMessage(err.message || err.error || '通信に失敗しました。', res.status), res.status);
  }

  const text = await res.text();
  if (!text) return {} as T;
  return normalizeCatalog(JSON.parse(text)) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export type ShopItem = {
  it_id: string | number;
  it_name: string;
  it_name_ja?: string;
  it_price: number;
  it_cust_price?: number;
  it_sale_price?: number;
  it_img1?: string;
  it_img2?: string;
  it_unit?: string;
  it_stock_qty?: number;
  it_soldout?: string;
  it_use_cnt?: number;
  it_use_avg?: number;
  it_hit?: number;
  ca_id?: string;
  ca_name?: string;
  discountRate?: number;
  it_sale?: string;
  it_point?: number;
};

export function discountRate(custPrice?: number, salePrice?: number): number {
  if (!custPrice || !salePrice || custPrice <= salePrice) return 0;
  return Math.round(((custPrice - salePrice) / custPrice) * 100);
}

export type CartItem = ShopItem & {
  quantity: number;
  selectedOptions?: Record<string, string>;
  option?: string;
  option_price?: number;
};

export type ItemOption = {
  io_id: string;
  io_price: number;
  io_stock_qty?: number;
};

export type User = {
  mb_id: string;
  mb_name: string;
  mb_nick?: string;
  mb_email?: string;
  mb_hp?: string;
  mb_point?: number;
  mb_level?: number;
};

export type Order = {
  od_id: string;
  od_name: string;
  od_price: number;
  od_status?: string;
  od_time?: string;
  items?: OrderItem[];
};

export type OrderItem = {
  it_id: string;
  it_name: string;
  ct_qty: number;
  ct_price: number;
  it_img1?: string;
};

export type Address = {
  id: number;
  addr_name?: string;
  recipient_name: string;
  phone: string;
  postcode: string;
  address: string;
  address_detail?: string;
  is_default?: boolean;
};
