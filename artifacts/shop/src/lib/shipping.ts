export type ShippingRegion = "normal" | "special" | "jeju" | "island";

const SPECIAL_CITIES = ["동두천", "포천", "양주", "의정부"];
const ISLAND_KEYWORDS = ["옹진군", "강화군", "신안군", "진도군", "완도군", "울릉군"];

export function detectRegion(postcode: string, addr: string): ShippingRegion {
  const pc = parseInt((postcode || "").replace(/\D/g, ""), 10);
  if (!isNaN(pc) && pc >= 63000 && pc <= 63999) return "jeju";

  const a = (addr || "").toLowerCase();
  if (ISLAND_KEYWORDS.some(kw => a.includes(kw))) return "island";
  if (SPECIAL_CITIES.some(city => a.includes(city))) return "special";
  return "normal";
}

export function calcShipping(subtotal: number, postcode: string, addr: string): number {
  const region = detectRegion(postcode, addr);
  switch (region) {
    case "special": {
      const base = subtotal >= 15000 ? 0 : 3000;
      return base;
    }
    case "jeju": {
      const base = subtotal >= 40000 ? 0 : 3000;
      return base + 3000;
    }
    case "island": {
      const base = subtotal >= 40000 ? 0 : 3000;
      return base + 5000;
    }
    default: {
      return subtotal >= 40000 ? 0 : 3000;
    }
  }
}

export function getRegionLabel(region: ShippingRegion): string {
  switch (region) {
    case "jeju": return "済州島";
    case "island": return "離島・山間部";
    case "special": return "特別地域";
    default: return "";
  }
}

export function getRegionColor(region: ShippingRegion): string {
  switch (region) {
    case "jeju": return "#1565c0";
    case "island": return "#e65100";
    default: return "#8B5E3C";
  }
}

export function getFreeThreshold(region: ShippingRegion): number {
  return region === "special" ? 15000 : 40000;
}
