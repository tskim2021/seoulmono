import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "yc_recent_products";
const MAX_ITEMS = 10;

export type RecentProductItem = {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnail: string | null;
  viewedAt: number; // timestamp
};

function loadFromStorage(): RecentProductItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentProductItem[];
  } catch {
    return [];
  }
}

function saveToStorage(items: RecentProductItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota exceeded or private mode
  }
}

export function useRecentProducts() {
  const [items, setItems] = useState<RecentProductItem[]>(() => loadFromStorage());

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setItems(loadFromStorage());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addProduct = useCallback((product: Omit<RecentProductItem, "viewedAt">) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentProducts: items, addProduct, clearAll };
}
