import crypto from "crypto";
import { kairosPrices, type KairosProductId } from "@/lib/pricing";

export type TelegramStarsProductId = KairosProductId;

export type TelegramStarsProduct = {
  id: TelegramStarsProductId;
  tier: string;
  title: string;
  description: string;
  amount: number;
  orderProduct: string;
};

const PRODUCTS: Record<TelegramStarsProductId, TelegramStarsProduct> = {
  fortune_pro: {
    id: "fortune_pro",
    tier: "pro",
    title: "Kairós Pro Insight",
    description: "Unlock a focused AI personal insight report inside Telegram.",
    amount: kairosPrices.fortune_pro.stars,
    orderProduct: "telegram_stars_fortune_pro",
  },
  fortune_master: {
    id: "fortune_master",
    tier: "master",
    title: "Kairós Master Insight",
    description: "Unlock the full AI personal insight report with deeper planning layers.",
    amount: kairosPrices.fortune_master.stars,
    orderProduct: "telegram_stars_fortune_master",
  },
  health_report: {
    id: "health_report",
    tier: "health",
    title: "Kairós Wellness Report",
    description: "Unlock a personalized wellness reflection report inside Telegram.",
    amount: kairosPrices.health_report.stars,
    orderProduct: "telegram_stars_health_report",
  },
};

export function getTelegramStarsProduct(id: TelegramStarsProductId) {
  return PRODUCTS[id] || PRODUCTS.fortune_pro;
}

export function createTelegramStarsPayload() {
  return `stars_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

export function productIdFromTier(tier: string): TelegramStarsProductId {
  if (tier === "master") return "fortune_master";
  if (tier === "health") return "health_report";
  return "fortune_pro";
}

export function buildTelegramStarsInvoicePayload({
  product,
  payload,
  userName,
}: {
  product: TelegramStarsProduct;
  payload: string;
  userName?: string;
}) {
  const nameSuffix = userName ? ` for ${userName.slice(0, 24)}` : "";
  return {
    title: product.title,
    description: `${product.description}${nameSuffix}`,
    payload,
    provider_token: "",
    currency: "XTR",
    prices: [{ label: product.title, amount: product.amount }],
  };
}

export type TelegramCreateInvoiceLinkResult =
  | { ok: true; result: string }
  | { ok: false; description?: string; error_code?: number };

export async function createTelegramStarsInvoiceLink(botToken: string, invoice: ReturnType<typeof buildTelegramStarsInvoicePayload>) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoice),
  });
  return (await res.json()) as TelegramCreateInvoiceLinkResult;
}

export type TelegramSetWebhookResult =
  | { ok: true; result: true; description?: string }
  | { ok: false; description?: string; error_code?: number };

export async function setTelegramStarsWebhook({
  botToken,
  webhookUrl,
  secretToken,
}: {
  botToken: string;
  webhookUrl: string;
  secretToken?: string;
}) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "pre_checkout_query"],
      secret_token: secretToken || undefined,
    }),
  });
  return (await res.json()) as TelegramSetWebhookResult;
}

export async function answerPreCheckoutQuery({
  botToken,
  preCheckoutQueryId,
  ok,
  errorMessage,
}: {
  botToken: string;
  preCheckoutQueryId: string;
  ok: boolean;
  errorMessage?: string;
}) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pre_checkout_query_id: preCheckoutQueryId,
      ok,
      error_message: errorMessage,
    }),
  });
}
