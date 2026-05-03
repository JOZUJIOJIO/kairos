import { describe, expect, it } from "vitest";
import {
  buildTelegramStarsInvoicePayload,
  getTelegramStarsProduct,
} from "@/lib/telegram/stars";

describe("Telegram Stars invoices", () => {
  it("uses XTR, an empty provider token, and a compact payload", () => {
    const product = getTelegramStarsProduct("fortune_pro");
    const invoice = buildTelegramStarsInvoicePayload({
      product,
      payload: "stars_abc123",
      userName: "Kai",
    });

    expect(invoice.currency).toBe("XTR");
    expect(invoice.provider_token).toBe("");
    expect(invoice.payload).toBe("stars_abc123");
    expect(invoice.prices).toEqual([{ label: "Kairós Pro Insight", amount: 500 }]);
    expect(invoice.title).toContain("Kairós");
    expect(invoice.payload.length).toBeLessThanOrEqual(128);
  });
});
