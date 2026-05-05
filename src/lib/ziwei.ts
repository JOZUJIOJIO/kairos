import { astro } from "iztro";
import type { Language } from "iztro/lib/data/types";
import type { IFunctionalPalace } from "iztro/lib/astro/FunctionalPalace";
import type { IFunctionalStar } from "iztro/lib/star/FunctionalStar";
import type FunctionalAstrolabe from "iztro/lib/astro/FunctionalAstrolabe";
import type { Locale } from "./i18n";

export type ZiweiGender = "male" | "female";
export type ZiweiKeyRole = "self" | "career" | "wealth" | "relationship";

export interface ZiweiBirthInput {
  year: number;
  month: number;
  day: number;
  time: string;
  gender: ZiweiGender;
  locale?: Locale;
}

export interface ZiweiStar {
  name: string;
  brightness?: string;
  mutagen?: string;
}

export interface ZiweiPalace {
  index: number;
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  majorStars: ZiweiStar[];
  minorStars: ZiweiStar[];
  adjectiveStars: ZiweiStar[];
  decadalRange: string;
  decadalStem: string;
  decadalBranch: string;
}

export interface ZiweiKeyPalace extends ZiweiPalace {
  role: ZiweiKeyRole;
}

export interface ZiweiDecadalCycle {
  range: string;
  palaceName: string;
  heavenlyStem: string;
  earthlyBranch: string;
}

export interface ZiweiChart {
  solarDate: string;
  lunarDate: string;
  chineseDate: string;
  fourPillars: string;
  time: string;
  timeRange: string;
  gender: ZiweiGender;
  zodiac: string;
  westernZodiac: string;
  fiveElementsClass: string;
  lifePalace: string;
  bodyPalace: string;
  soulStar: string;
  bodyStar: string;
  palaces: ZiweiPalace[];
  keyPalaces: ZiweiKeyPalace[];
  decadalCycles: ZiweiDecadalCycle[];
}

export function getZiweiChartHash(chart: ZiweiChart): string {
  return [
    "ziwei",
    chart.solarDate,
    chart.time,
    chart.gender,
    chart.lifePalace,
    chart.bodyPalace,
    chart.soulStar,
    chart.bodyStar,
  ].join("-");
}

const IZTRO_LOCALE: Partial<Record<Locale, Language>> = {
  zh: "zh-CN",
  en: "en-US",
  vi: "vi-VN",
};

let configured = false;

function ensureConfigured() {
  if (configured) return;

  astro.config({
    yearDivide: "normal",
    horoscopeDivide: "normal",
    ageDivide: "normal",
    dayDivide: "forward",
    algorithm: "zhongzhou",
  });
  configured = true;
}

export function getZiweiHourIndex(time: string): number {
  const [hourPart, minutePart = "0"] = time.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isFinite(hour) || hour < 0 || hour > 23 || !Number.isFinite(minute) || minute < 0 || minute > 59) {
    throw new Error("Birth time must be in HH:mm format");
  }

  if (hour === 23) return 12;
  if (hour === 0) return 0;
  return Math.floor((hour + 1) / 2);
}

export function calculateZiwei(input: ZiweiBirthInput): ZiweiChart {
  ensureConfigured();

  const solarDate = formatSolarDate(input.year, input.month, input.day);
  const timeIndex = getZiweiHourIndex(input.time);
  const language = IZTRO_LOCALE[input.locale ?? "zh"] ?? "en-US";
  const genderName = input.gender === "male" ? "男" : "女";
  const astrolabe = astro.bySolar<FunctionalAstrolabe>(
    `${input.year}-${input.month}-${input.day}`,
    timeIndex,
    genderName,
    true,
    language
  );

  const palaces = astrolabe.palaces.map(toPalaceSummary);
  const lifePalace = findPalaceByBranch(astrolabe.palaces, astrolabe.earthlyBranchOfSoulPalace);
  const bodyPalace = astrolabe.palaces.find((palace) => palace.isBodyPalace)
    ?? findPalaceByBranch(astrolabe.palaces, astrolabe.earthlyBranchOfBodyPalace);

  return {
    solarDate,
    lunarDate: astrolabe.lunarDate,
    chineseDate: astrolabe.chineseDate,
    fourPillars: astrolabe.chineseDate,
    time: astrolabe.time,
    timeRange: astrolabe.timeRange,
    gender: input.gender,
    zodiac: astrolabe.zodiac,
    westernZodiac: astrolabe.sign,
    fiveElementsClass: astrolabe.fiveElementsClass,
    lifePalace: lifePalace?.name ?? "",
    bodyPalace: bodyPalace?.name ?? "",
    soulStar: astrolabe.soul,
    bodyStar: astrolabe.body,
    palaces,
    keyPalaces: buildKeyPalaces(palaces),
    decadalCycles: palaces
      .filter((palace) => palace.decadalRange)
      .map((palace) => ({
        range: palace.decadalRange,
        palaceName: palace.name,
        heavenlyStem: palace.decadalStem,
        earthlyBranch: palace.decadalBranch,
      })),
  };
}

function toPalaceSummary(palace: IFunctionalPalace): ZiweiPalace {
  const [startAge, endAge] = palace.decadal?.range ?? [];

  return {
    index: palace.index,
    name: palace.name,
    heavenlyStem: palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
    isBodyPalace: palace.isBodyPalace,
    isOriginalPalace: palace.isOriginalPalace,
    majorStars: palace.majorStars.map(toStarSummary),
    minorStars: palace.minorStars.map(toStarSummary),
    adjectiveStars: palace.adjectiveStars.map(toStarSummary),
    decadalRange: startAge && endAge ? `${startAge}-${endAge}` : "",
    decadalStem: palace.decadal?.heavenlyStem ?? "",
    decadalBranch: palace.decadal?.earthlyBranch ?? "",
  };
}

function toStarSummary(star: IFunctionalStar): ZiweiStar {
  return {
    name: star.name,
    brightness: star.brightness || undefined,
    mutagen: star.mutagen || undefined,
  };
}

function buildKeyPalaces(palaces: ZiweiPalace[]): ZiweiKeyPalace[] {
  const roles: { role: ZiweiKeyRole; name: string }[] = [
    { role: "self", name: "命宫" },
    { role: "career", name: "官禄" },
    { role: "wealth", name: "财帛" },
    { role: "relationship", name: "夫妻" },
  ];

  return roles
    .map(({ role, name }) => {
      const palace = palaces.find((item) => item.name === name);
      return palace ? { ...palace, role } : null;
    })
    .filter((palace): palace is ZiweiKeyPalace => palace !== null);
}

function findPalaceByBranch(palaces: IFunctionalPalace[], branch: string): IFunctionalPalace | undefined {
  return palaces.find((palace) => palace.earthlyBranch === branch);
}

function formatSolarDate(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}
