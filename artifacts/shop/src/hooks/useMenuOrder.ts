import { useState, useEffect } from "react";
import { getMenuOrder, type MenuItem } from "@/lib/api";

const DEFAULT_ORDER: MenuItem[] = [
  { id: "new",  label: "新商品",    type: "list", href: "/products?sort=new" },
  { id: "best", label: "ベスト",    type: "list", href: "/products?sort=popular" },
  { id: "rec",  label: "おすすめ商品",  type: "list", href: "/products?sort=recommended" },
  { id: "evt",  label: "イベント",    type: "page", href: "/events" },
  { id: "cs",   label: "お客様センター",  type: "page", href: "/cs" },
  { id: "notice", label: "お知らせ", type: "page", href: "/notice" },
];

export function useMenuOrder() {
  const [items, setItems] = useState<MenuItem[]>(DEFAULT_ORDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMenuOrder()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data.filter((m: MenuItem) => m.id !== "all"));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { items, loading };
}