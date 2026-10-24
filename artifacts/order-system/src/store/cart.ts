import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@workspace/api-client-react';

export interface CartItem extends Product {
  cart_qty: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, qty: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty) => {
        set((state) => {
          const existing = state.items.find((i) => i.it_id === product.it_id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.it_id === product.it_id ? { ...i, cart_qty: i.cart_qty + qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, cart_qty: qty }] };
        });
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.it_id !== id) })),
      updateQty: (id, qty) => set((state) => ({
        items: state.items.map((i) => i.it_id === id ? { ...i, cart_qty: Math.max(1, qty) } : i)
      })),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((total, item) => total + (item.it_price * item.cart_qty), 0),
    }),
    { name: 'b2b-cart-storage' }
  )
);
