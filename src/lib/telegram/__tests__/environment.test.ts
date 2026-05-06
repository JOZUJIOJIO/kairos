import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasTelegramMiniAppInitData,
  isTelegramMiniAppPreviewRuntime,
  isTelegramMiniAppRuntime,
} from "@/lib/telegram/environment";

function stubBrowser(url: string, initData = "") {
  const parsed = new URL(url);
  vi.stubGlobal("window", {
    location: {
      hostname: parsed.hostname,
      port: parsed.port,
      search: parsed.search,
    },
    Telegram: {
      WebApp: { initData },
    },
  });
}

describe("Telegram Mini App runtime detection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not treat localhost ports as Telegram by default", () => {
    stubBrowser("http://localhost:3002/login");

    expect(isTelegramMiniAppPreviewRuntime()).toBe(false);
    expect(hasTelegramMiniAppInitData()).toBe(false);
    expect(isTelegramMiniAppRuntime()).toBe(false);
  });

  it("allows explicit local previews with tg_preview", () => {
    stubBrowser("http://localhost:3002/login?tg_preview=1");

    expect(isTelegramMiniAppPreviewRuntime()).toBe(true);
    expect(isTelegramMiniAppRuntime()).toBe(true);
  });

  it("detects real Mini Apps by signed Telegram initData", () => {
    stubBrowser("https://x-kairos.com/login", "query_id=test&user=%7B%7D&auth_date=1&hash=test");

    expect(hasTelegramMiniAppInitData()).toBe(true);
    expect(isTelegramMiniAppRuntime()).toBe(true);
  });
});
