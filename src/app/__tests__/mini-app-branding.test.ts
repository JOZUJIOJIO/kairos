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

  it("turns the Telegram entry into a product home with Stars pricing", () => {
    const page = readSource("src/app/tg/page.tsx");

    expect(page).toContain("AI 东方个人洞察");
    expect(page).toContain("500 ★");
    expect(page).toContain("1500 ★");
    expect(page).toContain("BottomNav");
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
});
