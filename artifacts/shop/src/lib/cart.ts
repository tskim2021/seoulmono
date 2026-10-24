import type { ShopItem } from "./api";

export interface CartItem {
  it_id: string;
  it_name: string;
  it_price: number;
  it_img1: string;
  quantity: number;
  option?: string;
  option_price?: number;
}

const CART_KEY = "seoulmono_cart";

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: ShopItem, quantity: number = 1, option?: string, optionPrice: number = 0): void {
  const cart = getCart();
  const key = `${item.it_id}${option ? `_${option}` : ""}`;
  const existIdx = cart.findIndex(c => `${c.it_id}${c.option ? `_${c.option}` : ""}` === key);
  if (existIdx >= 0) {
    cart[existIdx].quantity += quantity;
  } else {
    cart.push({
      it_id: item.it_id,
      it_name: item.it_name,
      it_price: item.it_price + optionPrice,
      it_img1: item.it_img1,
      quantity,
      option,
      option_price: optionPrice,
    });
  }
  saveCart(cart);
}

export function removeFromCart(it_id: string, option?: string): void {
  const cart = getCart();
  const key = `${it_id}${option ? `_${option}` : ""}`;
  saveCart(cart.filter(c => `${c.it_id}${c.option ? `_${c.option}` : ""}` !== key));
}

export function updateCartQty(it_id: string, quantity: number, option?: string): void {
  const cart = getCart();
  const key = `${it_id}${option ? `_${option}` : ""}`;
  const idx = cart.findIndex(c => `${c.it_id}${c.option ? `_${c.option}` : ""}` === key);
  if (idx >= 0) {
    if (quantity <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx].quantity = quantity;
    }
    saveCart(cart);
  }
}

export function getCartCount(): number {
  return getCart().length;
}

export function getCartTotal(): number {
  return getCart().reduce((sum, c) => sum + c.it_price * c.quantity, 0);
}
