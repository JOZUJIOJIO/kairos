import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readSource = (path: string) => readFileSync(join(root, path), "utf8");

describe("Ziwei experience integration", () => {
  it("adds a dedicated Zi Wei Dou Shu page", () => {
    expect(existsSync(join(root, "src/app/fortune/ziwei/page.tsx"))).toBe(true);

    const page = readSource("src/app/fortune/ziwei/page.tsx");
    expect(page).toContain("calculateZiwei");
    expect(page).toContain("Purple Star Map");
    expect(page).toContain("AI Ziwei Insight");
    expect(page).toContain('fetch("/api/ziwei-reading"');
  });

  it("adds a server-side Ziwei AI reading route", () => {
    expect(existsSync(join(root, "src/app/api/ziwei-reading/route.ts"))).toBe(true);

    const route = readSource("src/app/api/ziwei-reading/route.ts");
    expect(route).toContain("getAuthUser");
    expect(route).toContain("checkRateLimit");
    expect(route).toContain("getZiweiChartHash");
    expect(route).toContain("Payment required");
  });

  it("surfaces Ziwei from the existing Fortune selection screen", () => {
    const fortune = readSource("src/app/fortune/page.tsx");
    expect(fortune).toContain('href="/fortune/ziwei"');
    expect(fortune).toContain("Purple Star Map");
  });

  it("pins the Next workspace root so local dev resolves project dependencies", () => {
    const config = readSource("next.config.ts");
    expect(config).toContain("turbopack");
    expect(config).toContain("root: process.cwd()");
  });
});
