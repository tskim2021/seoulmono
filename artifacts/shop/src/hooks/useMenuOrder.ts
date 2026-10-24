import { useState, useEffect } from "react";
import { getMenuOrder, type MenuItem } from "@/lib/api";

const DEFAULT_ORDER: MenuItem[] = [
  { id: "new",  label: "신상품",    type: "list", href: "/products?sort=new" },
  { id: "best", label: "베스트",    type: "list", href: "/products?sort=popular" },
  { id: "rec",  label: "추천상품",  type: "list", href: "/products?sort=recommended" },
  { id: "evt",  label: "이벤트",    type: "page", href: "/events" },
  { id: "cs",   label: "고객센터",  type: "page", href: "/cs" },
  { id: "notice", label: "공지사항", type: "page", href: "/notice" },
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