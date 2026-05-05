import { describe, expect, it } from "vitest";
import { calculateZiwei, getZiweiChartHash, getZiweiHourIndex } from "../ziwei";

describe("getZiweiHourIndex", () => {
  it("maps late Zi hour to iztro index 12", () => {
    expect(getZiweiHourIndex("23:30")).toBe(12);
  });

  it("maps noon to Wu hour index 6", () => {
    expect(getZiweiHourIndex("12:00")).toBe(6);
  });
});

describe("calculateZiwei", () => {
  const chart = calculateZiwei({
    year: 1990,
    month: 1,
    day: 15,
    time: "12:00",
    gender: "male",
    locale: "zh",
  });

  it("returns a complete twelve-palace astrolabe summary", () => {
    expect(chart.palaces).toHaveLength(12);
    expect(chart.lifePalace).toBeTruthy();
    expect(chart.bodyPalace).toBeTruthy();
    expect(chart.palaces.map((palace) => palace.name)).toEqual(
      expect.arrayContaining(["命宫", "财帛", "官禄", "夫妻"])
    );
  });

  it("keeps the deterministic birth metadata needed for AI prompts", () => {
    expect(chart.solarDate).toBe("1990-01-15");
    expect(chart.gender).toBe("male");
    expect(chart.zodiac).toBeTruthy();
    expect(chart.westernZodiac).toBeTruthy();
    expect(chart.chineseDate).toBeTruthy();
    expect(chart.fourPillars).toMatch(/[甲乙丙丁戊己庚辛壬癸].*[子丑寅卯辰巳午未申酉戌亥]/);
  });

  it("extracts key palace insight cards for product UI", () => {
    expect(chart.keyPalaces).toHaveLength(4);
    expect(chart.keyPalaces.map((palace) => palace.role)).toEqual([
      "self",
      "career",
      "wealth",
      "relationship",
    ]);
    for (const palace of chart.keyPalaces) {
      expect(palace.name).toBeTruthy();
      expect(palace.majorStars.length + palace.minorStars.length).toBeGreaterThan(0);
    }
  });

  it("includes decadal cycle ranges for timeline experiences", () => {
    expect(chart.decadalCycles.length).toBeGreaterThanOrEqual(8);
    expect(chart.decadalCycles[0].range).toMatch(/^\d+-\d+$/);
    expect(chart.decadalCycles[0].palaceName).toBeTruthy();
  });

  it("creates a namespaced stable cache hash for AI readings", () => {
    expect(getZiweiChartHash(chart)).toContain("ziwei-1990-01-15");
    expect(getZiweiChartHash(chart)).toBe(getZiweiChartHash({ ...chart }));
  });
});
