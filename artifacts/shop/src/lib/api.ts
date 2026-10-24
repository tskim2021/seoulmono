const BASE_URL = import.meta.env.BASE_URL || "/";
const API_BASE = "/api";

export function getImageUrl(src: string | undefined | null, w?: number): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return w ? `${src}?w=${w}` : src;
  return w ? `/api/product-image/${src}?w=${w}` : `/api/product-image/${src}`;
}

export interface ShopItem {
  it_id: string;
  it_name: string;
  it_price: number;
  it_cust_price: number;
  it_img1: string;
  ca_id: string;
  ca_name: string;
  it_soldout: string;
  it_hit: number;
  it_use_cnt: number;
  it_use_avg: number;
}

export interface ShopItemDetail extends ShopItem {
  it_stock_qty: number;
  images: string[];
  it_explan: string;
  it_origin: string;
  it_maker: string;
  it_shelf_life: string;
  box_qty: number;
  filter1: string;
  options: { io_id: string; io_price: number; io_stock_qty: number }[];
}

export interface Category {
  ca_id: string;
  ca_name: string;
}

export interface HomeData {
  best: ShopItem[];
  newItems: ShopItem[];
  brand: ShopItem[];
  food: ShopItem[];
  categories: Category[];
}

export interface ItemsResponse {
  items: ShopItem[];
  total: number;
  page: number;
  limit: number;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getHomeData(): Promise<HomeData> {
  return fetchApi<HomeData>("/shop/home");
}

export async function getShopItems(params: {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  search?: string;
  sort?: string;
}): Promise<ItemsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.category) qs.set("category", params.category);
  if (params.type) qs.set("type", params.type);
  if (params.search) qs.set("search", params.search);
  if (params.sort) qs.set("sort", params.sort);
  return fetchApi<ItemsResponse>(`/shop/items?${qs}`);
}

export async function getShopItem(id: string): Promise<ShopItemDetail> {
  const res = await fetchApi<{ item: ShopItemDetail }>(`/shop/items/${id}`);
  return res.item;
}

export async function getCategories(): Promise<{ categories: Category[]; tree: any[] }> {
  return fetchApi<{ categories: Category[]; tree: any[] }>("/categories");
}

export interface SpecialTab {
  key: string;
  label: string;
  count: number;
}

export interface SpecialsData {
  tabs: SpecialTab[];
  items: Record<string, ShopItem[]>;
}

export async function getSpecials(): Promise<SpecialsData> {
  return fetchApi<SpecialsData>("/shop/specials");
}

export interface GiftItem extends ShopItem {
  is_gift: boolean;
}

export interface GiftSetsResponse {
  items: GiftItem[];
  total: number;
  page: number;
  limit: number;
}

export interface GiftMainCategory {
  ca_id: string;
  ca_name: string;
  main_thumb: string;
  sub_categories: { ca_id: string; ca_name: string; slot_count: number; price: number; thumb_img: string }[];
}

export async function getGiftCategories(): Promise<GiftMainCategory[]> {
  return fetchApi<GiftMainCategory[]>("/shop/gift/categories");
}

export async function getGiftSets(params?: { page?: number; limit?: number }): Promise<GiftSetsResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  return fetchApi<GiftSetsResponse>(`/shop/giftsets?${qs}`);
}

export async function getLowestPrice(limit = 8): Promise<ShopItem[]> {
  const data = await fetchApi<{ items: ShopItem[] }>(`/shop/lowest?limit=${limit}`);
  return data.items;
}

export async function getGroupBuy(limit = 10): Promise<ShopItem[]> {
  const data = await fetchApi<{ items: ShopItem[] }>(`/shop/groupbuy?limit=${limit}`);
  return data.items;
}

export async function getTodayDeal(limit = 10): Promise<ShopItem[]> {
  const data = await fetchApi<{ items: ShopItem[] }>(`/shop/todaydeal?limit=${limit}`);
  return data.items;
}

export interface SectionConfig {
  best: string;
  recommended: string;
  newest: string;
  popular: string;
  sale: string;
  review_subtitle: string;
}

export async function getSectionConfig(): Promise<SectionConfig> {
  return fetchApi<SectionConfig>("/shop/section-config");
}

export interface Review {
  is_id: number;
  it_id: string;
  it_name: string;
  it_img1: string;
  mb_id_masked: string;
  is_score: number;
  is_subject: string;
  is_content: string;
  is_img: string | null;
  is_time: string;
}

export async function getReviews(limit = 8): Promise<Review[]> {
  return fetchApi<Review[]>(`/shop/reviews?limit=${limit}`);
}

export interface Notice {
  wr_id: number;
  wr_subject: string;
  wr_datetime: string;
  wr_link1: string | null;
}

export async function getNotices(limit = 10): Promise<Notice[]> {
  return fetchApi<Notice[]>(`/shop/notices?limit=${limit}`);
}

export interface FooterConfig {
  company: string;
  ceo: string;
  address: string;
  business_num: string;
  tel: string;
  online_num: string;
  privacy: string;
  cs_tel: string;
  cs_hours: string;
  cs_lunch: string;
  bank_name: string;
  bank_num: string;
  bank_holder: string;
}

export async function getFooterConfig(): Promise<FooterConfig> {
  return fetchApi<FooterConfig>("/shop/footer-config");
}

export interface ShopEvent {
  id: number;
  title: string;
  thumbnail: string;
  created_at: string;
}

export async function getEvents(limit = 5): Promise<ShopEvent[]> {
  const data = await fetchApi<{ events: ShopEvent[] }>("/shop-events/public");
  return (data.events || []).slice(0, limit);
}

// filter1 value mapping for specials
export const SPECIAL_FILTER_MAP: Record<string, string> = {
  expire: "8",
  time: "9",
  limited: "10",
  brand: "11",
};

export function getShopPath(path: string): string {
  const base = BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

export function formatPrice(price: number): string {
  return price.toLocaleString("ja-JP") + "円";
}

export function discountRate(original: number, sale: number): number {
  if (!original || !sale || original <= sale) return 0;
  return Math.round(((original - sale) / original) * 100);
}

export interface MenuItem {
  id: string;
  label: string;
  type: "list" | "page";
  href: string;
  highlight?: boolean;
  gift?: boolean;
}

export async function getMenuOrder(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/settings/menu-order`);
  if (!res.ok) return [];
  return res.json();
}
