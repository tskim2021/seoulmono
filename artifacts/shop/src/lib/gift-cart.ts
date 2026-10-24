export interface GiftCartItem {
  it_id: string;
  it_name: string;
  it_price: number;
  it_img1: string;
  quantity: number;
  ca_id?: string;
}

const KEY = "seoulmono_gift_cart";
const EVENT = "gift-cart-updated";

export function getGiftCart(): GiftCartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveGiftCart(items: GiftCartItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function addToGiftCart(item: GiftCartItem): void {
  const cart = getGiftCart();
  const idx = cart.findIndex(c => c.it_id === item.it_id);
  if (idx >= 0) cart[idx].quantity += item.quantity;
  else cart.push({ ...item });
  saveGiftCart(cart);
}

export function removeFromGiftCart(it_id: string): void {
  saveGiftCart(getGiftCart().filter(c => c.it_id !== it_id));
}

export function updateGiftCartQty(it_id: string, qty: number): void {
  const cart = getGiftCart();
  const idx = cart.findIndex(c => c.it_id === it_id);
  if (idx < 0) return;
  if (qty <= 0) cart.splice(idx, 1);
  else cart[idx].quantity = qty;
  saveGiftCart(cart);
}

export function clearGiftCart(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function getGiftCartCount(): number {
  return getGiftCart().reduce((s, c) => s + c.quantity, 0);
}

export function getGiftCartTotal(): number {
  return getGiftCart().reduce((s, c) => s + c.it_price * c.quantity, 0);
}

export const GIFT_CART_EVENT = EVENT;
