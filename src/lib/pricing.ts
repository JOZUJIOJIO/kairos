export type KairosProductId = "fortune_pro" | "fortune_master" | "health_report";

export type KairosProductPrice = {
  usdCents: number;
  stars: number;
};

export const kairosPrices: Record<KairosProductId, KairosProductPrice> = {
  health_report: { usdCents: 490, stars: 250 },
  fortune_pro: { usdCents: 990, stars: 500 },
  fortune_master: { usdCents: 2990, stars: 1500 },
};

export function formatUsdPrice(productId: KairosProductId) {
  return `$${(kairosPrices[productId].usdCents / 100).toFixed(2)}`;
}

export function formatStarsPrice(productId: KairosProductId) {
  return `${kairosPrices[productId].stars} ★`;
}
