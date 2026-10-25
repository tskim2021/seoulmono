export type PricedItem = { it_id: string | number; it_price: number; option?: string; option_price?: number };

export function productName(item: { it_name: string; it_name_ja?: string }) {
  return item.it_name_ja?.trim() || item.it_name;
}

export function sellingPrice(item: PricedItem) {
  // The production order API stores each option's full unit price, not a surcharge.
  return item.option && item.option_price !== undefined ? Number(item.option_price) : Number(item.it_price);
}

export type ShippingConfig = { fee: number; additionalFee: number };

export function shippingFee(items: PricedItem[], config: ShippingConfig) {
  const count = new Set(items.map(item => String(item.it_id))).size;
  return count ? config.fee + Math.max(0, count - 1) * config.additionalFee : 0;
}

export function availableQuantity(item: { it_stock_qty?: number; it_soldout?: string }, option?: { io_stock_qty?: number }) {
  if (item.it_soldout === '1' || item.it_soldout === '2') return 0;
  const stock = option?.io_stock_qty ?? item.it_stock_qty;
  return stock === undefined ? 99 : Math.max(0, Math.min(Number(stock), 99));
}

export function normalizeCatalog(value: any): any {
  if (Array.isArray(value)) return value.map(normalizeCatalog);
  if (!value || typeof value !== 'object') return value;
  const result = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeCatalog(entry)]));
  if (typeof result.it_name === 'string') result.it_name = productName({ it_name: result.it_name, it_name_ja: result.it_name_ja });
  return result;
}
