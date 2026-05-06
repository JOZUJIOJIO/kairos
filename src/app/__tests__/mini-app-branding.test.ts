import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readSource = (path: string) => readFileSync(join(root, path), "utf8");

describe("Mini App brand and entry experience", () => {
  it("uses the bronze mask brand mark instead of the crystal ball logo", () => {
    const header = readSource("src/components/PageHeader.tsx");
    const icon = readSource("src/app/icon.svg");

    expect(header).toContain("BrandMark");
    expect(header).not.toContain("🔮");
    expect(icon).toContain("bronze-mask-icon");
  });

  it("routes the legacy Telegram entry to the light Mini App SPA", () => {
    const page = readSource("src/app/tg/page.tsx");

    expect(page).toContain('redirect("/kairos-telegram-miniapp-spa.html")');
    expect(page).not.toContain("打开今天的节奏");
    expect(page).not.toContain("BottomNav");
    expect(page).not.toContain("Growth Preview");
    expect(page).not.toContain("Affiliate Program");
    expect(page).not.toContain("Managed Bots");
    expect(page).not.toContain("已适配 Telegram");
    expect(page).not.toContain("命理");
  });

  it("uses Mini App navigation and avoids the health detour in Telegram", () => {
    const nav = readSource("src/components/BottomNav.tsx");

    expect(nav).toContain("telegramNavItems");
    expect(nav).toContain('href: "/tg"');
    expect(nav).toContain('href: "/daily"');
  });

  it("lets a Mini App user generate an insight with birth date only", () => {
    const fortune = readSource("src/app/fortune/page.tsx");

    expect(fortune).toContain('const resolvedHourBranch = hourBranch || "午";');
    expect(fortune).toContain('const resolvedGender = (gender || "male") as "male" | "female";');
    expect(fortune).toContain("disabled={!birthDate}");
  });

  it("uses safer AI insight positioning in global metadata", () => {
    const layout = readSource("src/app/layout.tsx");

    expect(layout).toContain("AI-powered Eastern personal insight");
    expect(layout).not.toContain("BaZi & Eastern Personality Analysis");
    expect(layout).not.toContain("命理");
  });

  it("keeps the Mini App on the high-contrast bronze theme", () => {
    const home = readSource("src/app/page.tsx");
    const themeContext = readSource("src/lib/ThemeContext.tsx");
    const tokens = readSource("src/lib/theme-tokens.ts");

    expect(home).not.toContain("ThemeToggle");
    expect(themeContext).toContain('value={{ theme: "cosmic", toggle }}');
    expect(tokens).toContain('text2: "text-[#F2F0EB]/78"');
    expect(tokens).toContain('text3: "text-[#F2F0EB]/60"');
  });

  it("shows Stars pricing on the Daily page inside Telegram", () => {
    const daily = readSource("src/app/daily/page.tsx");

    expect(daily).toContain("isTelegramMiniApp");
    expect(daily).toContain("isTelegramMiniAppRuntime");
    expect(daily).toContain("formatStarsPrice");
    expect(daily).toContain("Stars 解锁");
    expect(daily).toContain("handleDailyStarsUnlock");
    expect(daily).toContain("handleDailyShare");
    expect(daily).toContain('"health"');
    expect(daily).toContain("kairos_daily_paid");
  });

  it("surfaces the Mini App Stars unlock path on the Fortune page", () => {
    const fortune = readSource("src/app/fortune/page.tsx");
    const paywall = readSource("src/components/fortune/PaywallSection.tsx");

    expect(fortune).toContain("Mini App 解锁");
    expect(fortune).toContain("formatStarsPrice");
    expect(fortune).toContain("fortune_pro");
    expect(fortune).toContain("本地仅预览 Stars 支付界面");
    expect(fortune).toContain("PaywallSection");
    expect(paywall).toContain("Stars 解锁完整图谱");
  });

  it("documents the final Mini App PRD", () => {
    const prd = readSource("docs/superpowers/specs/2026-05-03-telegram-mini-app-final-experience-prd.md");

    expect(prd).toContain("Kairos Telegram Mini App Final Experience PRD");
    expect(prd).toContain("/tg");
    expect(prd).toContain("/daily");
    expect(prd).toContain("/fortune");
    expect(prd).toContain("/profile");
    expect(prd).toContain("29 Stars");
  });

  it("keeps Mini App preview explicit so web login still works locally", () => {
    const env = readSource("src/lib/telegram/environment.ts");
    const nav = readSource("src/components/BottomNav.tsx");

    expect(env).toContain("isTelegramMiniAppRuntime");
    expect(env).toContain("isTelegramMiniAppPreviewRuntime");
    expect(env).toContain("tg_preview");
    expect(env).not.toContain('window.location.hostname === "localhost"');
    expect(nav).toContain("isTelegramMiniAppRuntime");
  });
});
