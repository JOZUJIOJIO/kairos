import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("Telegram login experience", () => {
  it("uses Telegram initData instead of OAuth on the login page", () => {
    const page = readFileSync(join(root, "src/app/login/page.tsx"), "utf8");

    expect(page).toContain("window.Telegram?.WebApp");
    expect(page).toContain("/api/telegram/auth");
    expect(page).toContain("authSurface === \"web\"");
  });
});
