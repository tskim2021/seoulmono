import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { CartItem, ShopItem } from "@/lib/api";
import { normalizeCatalog, sellingPrice, availableQuantity } from '@/lib/catalog';

const CART_KEY = "jigu_cart";

export function lineKey(c: { it_id: string | number; option?: string }) {
  return `${c.it_id}|${c.option ?? ""}`;
}

export function unitPrice(c: CartItem) {
  return sellingPrice(c);
}

type ItemOptionChoice = { option: string; option_price: number };

type CartContextType = {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  buyNowItem: CartItem | null;
  addItem: (item: ShopItem, qty?: number, opt?: ItemOptionChoice) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clearCart: () => void;
  setBuyNowItem: (item: CartItem | null) => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  totalCount: 0,
  totalPrice: 0,
  buyNowItem: null,
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
  setBuyNowItem: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((raw) => {
      if (raw) { try { setItems(normalizeCatalog(JSON.parse(raw))); } catch { setItems([]); } }
    });
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
  }, []);

  const addItem = useCallback(
    (item: ShopItem, qty = 1, opt?: ItemOptionChoice) => {
      setItems((prev) => {
        const incoming: CartItem = {
          ...item,
          quantity: qty,
          option: opt?.option,
          option_price: opt?.option_price,
        };
        const key = lineKey(incoming);
        const idx = prev.findIndex((c) => lineKey(c) === key);
        const next =
          idx >= 0
            ? prev.map((c, i) =>
                i === idx ? { ...c, ...incoming, quantity: Math.min(c.quantity + qty, availableQuantity(item)) } : c
              )
            : [...prev, incoming];
        AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeItem = useCallback(
    (key: string) => {
      persist(items.filter((c) => lineKey(c) !== key));
    },
    [items, persist]
  );

  const updateQty = useCallback(
    (key: string, qty: number) => {
      if (qty <= 0) {
        persist(items.filter((c) => lineKey(c) !== key));
      } else {
        persist(items.map((c) => (lineKey(c) === key ? { ...c, quantity: Math.min(qty, availableQuantity(c)) } : c)));
      }
    },
    [items, persist]
  );

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const totalCount = items.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = items.reduce((s, c) => s + unitPrice(c) * c.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        totalPrice,
        buyNowItem,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        setBuyNowItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
