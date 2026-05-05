"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import BottomNav from "@/components/BottomNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/lib/LocaleContext";
import { useTheme } from "@/lib/ThemeContext";
import { themeTokens } from "@/lib/theme-tokens";
import { calculateZiwei, type ZiweiChart, type ZiweiGender, type ZiweiKeyPalace } from "@/lib/ziwei";
import { useAuth } from "@/lib/supabase/auth-context";

const roleCopy: Record<ZiweiKeyPalace["role"], { zh: string; en: string }> = {
  self: { zh: "自我底色", en: "Self Pattern" },
  career: { zh: "事业节奏", en: "Career Rhythm" },
  wealth: { zh: "资源模式", en: "Resource Pattern" },
  relationship: { zh: "关系沟通", en: "Relationship Lens" },
};

const palaceTone: Record<ZiweiKeyPalace["role"], string> = {
  self: "border-amber-400/20 bg-amber-500/[0.04]",
  career: "border-cyan-300/20 bg-cyan-400/[0.04]",
  wealth: "border-emerald-300/20 bg-emerald-400/[0.04]",
  relationship: "border-rose-300/20 bg-rose-400/[0.04]",
};

export default function ZiweiPage() {
  const { isChinese, locale } = useLocale();
  const { theme } = useTheme();
  const { user } = useAuth();
  const tk = themeTokens[theme];
  const [birthDate, setBirthDate] = useState("1990-01-15");
  const [birthTime, setBirthTime] = useState("12:00");
  const [gender, setGender] = useState<ZiweiGender>("male");
  const [chart, setChart] = useState<ZiweiChart | null>(null);
  const [aiReading, setAiReading] = useState<Record<string, string> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  const generatedSummary = useMemo(() => {
    if (!chart) return null;
    const self = chart.keyPalaces.find((item) => item.role === "self");
    const career = chart.keyPalaces.find((item) => item.role === "career");
    const wealth = chart.keyPalaces.find((item) => item.role === "wealth");
    return {
      headline: isChinese
        ? `${chart.soulStar}坐命，${chart.fiveElementsClass}，以${self?.name || "命宫"}为核心观察点`
        : `${chart.soulStar} anchors the life palace, ${chart.fiveElementsClass}, with ${self?.name || "the life palace"} as the core signal`,
      focus: isChinese
        ? `事业看${career?.name || "官禄"}，资源看${wealth?.name || "财帛"}。紫微盘适合补充八字没有展开的宫位关系。`
        : `Career reads through ${career?.name || "career palace"}; resources through ${wealth?.name || "wealth palace"}. Ziwei adds palace relationships beyond Four Pillars.`,
    };
  }, [chart, isChinese]);

  function handleGenerate() {
    setError("");
    const [year, month, day] = birthDate.split("-").map(Number);
    try {
      setChart(calculateZiwei({
        year,
        month,
        day,
        time: birthTime || "12:00",
        gender,
        locale,
      }));
      setAiReading(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate Ziwei chart");
    }
  }

  async function handleAiReading() {
    if (!chart) return;
    setAiLoading(true);
    setError("");
    setAiReading(null);
    try {
      const response = await fetch("/api/ziwei-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chart }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setError(data.error || "Unable to generate AI Ziwei Insight");
      } else {
        setAiReading(data);
      }
    } catch {
      setError(isChinese ? "网络错误，请稍后重试" : "Network error. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className={`min-h-screen ${tk.bg} pb-24`}>
      <header className={`flex items-center justify-between px-4 lg:px-12 py-4 border-b ${tk.divider}`}>
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <BrandMark size="sm" />
            <span className={`text-lg font-bold ${tk.text2}`}>Kairós</span>
          </Link>
          <span className={`${tk.text3}`}>/</span>
          <span className={`text-sm ${tk.text3} truncate`}>Purple Star Map</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <section className="mb-8 lg:mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-amber-200/50" />
            <span className={`${tk.accentMuted} text-[10px] tracking-[0.28em] uppercase`}>Zi Wei Dou Shu</span>
          </div>
          <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-end">
            <div>
              <h1 className="font-display text-3xl lg:text-5xl font-bold text-gradient-gold">
                {isChinese ? "紫微斗数命盘" : "Purple Star Map"}
              </h1>
              <p className={`${tk.text3} mt-3 max-w-2xl text-sm lg:text-base leading-relaxed`}>
                {isChinese
                  ? "在八字五行之外，用十二宫、命宫身宫、四化与大限周期补全你的东方个人图谱。"
                  : "Add twelve palaces, life/body palace signals, transformations, and decadal cycles to your Eastern personal map."}
              </p>
            </div>

            <div className={`${tk.card} border rounded-2xl p-4`}>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 col-span-2">
                  <span className={`text-xs ${tk.label}`}>{isChinese ? "出生日期" : "Birth Date"}</span>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    className={`w-full rounded-xl px-3 py-3 ${theme === "cosmic" ? "bg-white/5 text-amber-50 border-white/10" : "bg-white/80 text-stone-900 border-amber-700/15"} border outline-none`}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={`text-xs ${tk.label}`}>{isChinese ? "出生时间" : "Birth Time"}</span>
                  <input
                    type="time"
                    value={birthTime}
                    onChange={(event) => setBirthTime(event.target.value)}
                    className={`w-full rounded-xl px-3 py-3 ${theme === "cosmic" ? "bg-white/5 text-amber-50 border-white/10" : "bg-white/80 text-stone-900 border-amber-700/15"} border outline-none`}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={`text-xs ${tk.label}`}>{isChinese ? "性别" : "Gender"}</span>
                  <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value as ZiweiGender)}
                    className={`w-full rounded-xl px-3 py-3 ${theme === "cosmic" ? "bg-white/5 text-amber-50 border-white/10" : "bg-white/80 text-stone-900 border-amber-700/15"} border outline-none`}
                  >
                    <option value="male">{isChinese ? "男" : "Male"}</option>
                    <option value="female">{isChinese ? "女" : "Female"}</option>
                  </select>
                </label>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!birthDate}
                className="mt-4 w-full py-3.5 rounded-xl font-semibold text-sm cursor-pointer bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white disabled:opacity-50 hover:shadow-[0_0_30px_rgba(217,119,6,0.22)] transition-all"
              >
                {isChinese ? "生成紫微命盘" : "Generate Purple Star Map"}
              </button>
              {error && <p className="text-red-400/80 text-xs mt-3">{error}</p>}
            </div>
          </div>
        </section>

        {!chart ? (
          <section className="grid lg:grid-cols-3 gap-4">
            {[
              { title: isChinese ? "十二宫结构" : "Twelve Palaces", body: isChinese ? "命宫、财帛、官禄、夫妻等宫位把人生议题拆得更细。" : "Life, wealth, career, and relationship palaces add more granularity." },
              { title: isChinese ? "命宫身宫" : "Life & Body Palace", body: isChinese ? "一个看内在倾向，一个看行动落点，适合与八字互证。" : "One shows inner pattern, the other shows where action lands." },
              { title: "AI Ziwei Insight", body: isChinese ? "下一步可基于命盘事实生成深度 AI 报告。" : "The next layer can generate an AI report from chart facts." },
            ].map((item) => (
              <div key={item.title} className={`${tk.card} rounded-2xl p-5 border`}>
                <h2 className={`font-semibold ${tk.text1}`}>{item.title}</h2>
                <p className={`${tk.text3} text-sm mt-2 leading-relaxed`}>{item.body}</p>
              </div>
            ))}
          </section>
        ) : (
          <div className="space-y-6">
            <section className={`${tk.card} border rounded-2xl p-5 lg:p-6`}>
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${theme === "cosmic" ? "bg-amber-400/10 text-amber-200" : "bg-amber-100 text-amber-800"}`}>{chart.solarDate}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs ${theme === "cosmic" ? "bg-white/5 text-amber-100/70" : "bg-white/70 text-stone-700"}`}>{chart.time}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs ${theme === "cosmic" ? "bg-white/5 text-amber-100/70" : "bg-white/70 text-stone-700"}`}>{chart.zodiac} · {chart.westernZodiac}</span>
                  </div>
                  <h2 className={`text-2xl font-bold ${tk.text1}`}>{generatedSummary?.headline}</h2>
                  <p className={`${tk.text3} text-sm mt-3 leading-relaxed`}>{generatedSummary?.focus}</p>
                </div>
                <div className={`rounded-2xl p-4 border ${tk.border} ${theme === "cosmic" ? "bg-black/15" : "bg-white/55"}`}>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <Meta label={isChinese ? "农历" : "Lunar"} value={chart.lunarDate} muted={tk.text3} text={tk.text2} />
                    <Meta label={isChinese ? "四柱" : "Four Pillars"} value={chart.fourPillars} muted={tk.text3} text={tk.text2} />
                    <Meta label={isChinese ? "命宫" : "Life Palace"} value={chart.lifePalace} muted={tk.text3} text={tk.text2} />
                    <Meta label={isChinese ? "身宫" : "Body Palace"} value={chart.bodyPalace} muted={tk.text3} text={tk.text2} />
                    <Meta label={isChinese ? "命主" : "Soul Star"} value={chart.soulStar} muted={tk.text3} text={tk.text2} />
                    <Meta label={isChinese ? "身主" : "Body Star"} value={chart.bodyStar} muted={tk.text3} text={tk.text2} />
                  </dl>
                </div>
              </div>
            </section>

            <section className="grid lg:grid-cols-4 gap-4">
              {chart.keyPalaces.map((palace) => (
                <div key={palace.role} className={`rounded-2xl p-4 border ${palaceTone[palace.role]}`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className={`font-semibold ${tk.text1}`}>{isChinese ? roleCopy[palace.role].zh : roleCopy[palace.role].en}</h3>
                    <span className={`text-xs ${tk.accentMuted}`}>{palace.name}</span>
                  </div>
                  <StarLine label={isChinese ? "主星" : "Major"} stars={palace.majorStars} empty={isChinese ? "无主星" : "Empty"} text={tk.text2} muted={tk.text3} />
                  <StarLine label={isChinese ? "辅星" : "Minor"} stars={palace.minorStars.slice(0, 4)} empty="-" text={tk.text2} muted={tk.text3} />
                  <p className={`${tk.text3} text-xs mt-3`}>
                    {isChinese ? "大限" : "Cycle"} {palace.decadalRange} · {palace.decadalStem}{palace.decadalBranch}
                  </p>
                </div>
              ))}
            </section>

            <section className={`${tk.card} border rounded-2xl p-5`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                <div>
                  <h2 className={`text-lg font-bold ${tk.text1}`}>{isChinese ? "大限周期" : "Decadal Cycles"}</h2>
                  <p className={`${tk.text3} text-sm mt-1`}>{isChinese ? "每十年观察一个主要宫位主题。" : "Each decade highlights a palace theme."}</p>
                </div>
                <span className={`${tk.accentMuted} text-xs`}>AI Ziwei Insight</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {chart.decadalCycles.slice(0, 8).map((cycle) => (
                  <div key={`${cycle.range}-${cycle.palaceName}`} className={`rounded-xl p-3 border ${tk.border} ${theme === "cosmic" ? "bg-white/[0.025]" : "bg-white/55"}`}>
                    <div className={`text-xs ${tk.accentMuted}`}>{cycle.range}</div>
                    <div className={`font-semibold ${tk.text2} mt-1`}>{cycle.palaceName}</div>
                    <div className={`${tk.text3} text-xs mt-1`}>{cycle.heavenlyStem}{cycle.earthlyBranch}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className={`${theme === "cosmic" ? "bg-gradient-to-br from-purple-900/18 via-white/[0.02] to-amber-900/12 border-purple-300/15" : "bg-gradient-to-br from-purple-100/55 via-white/60 to-amber-100/45 border-purple-400/20"} border rounded-2xl p-5 lg:p-6`}>
              <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center">
                <div>
                  <p className={`${tk.accentMuted} text-xs tracking-[0.24em] uppercase`}>AI Ziwei Insight</p>
                  <h2 className={`text-xl font-bold ${tk.text1} mt-2`}>
                    {isChinese ? "下一层：紫微 AI 深度报告" : "Next Layer: AI Ziwei Insight"}
                  </h2>
                  <p className={`${tk.text3} text-sm mt-2 leading-relaxed`}>
                    {isChinese
                      ? "把十二宫、四化与大限周期送入服务端 AI，生成事业、关系、资源与行动建议。"
                      : "Send palaces, transformations, and cycles to the server AI layer for career, relationship, resource, and action guidance."}
                  </p>
                  {!user && (
                    <p className="text-amber-300/70 text-xs mt-3">
                      {isChinese ? "登录并解锁后可生成完整 AI 紫微洞察。" : "Sign in and unlock to generate the full AI Ziwei insight."}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleAiReading}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white hover:shadow-[0_0_30px_rgba(217,119,6,0.22)] transition-all disabled:opacity-50"
                  >
                    {aiLoading ? (isChinese ? "生成中..." : "Generating...") : (isChinese ? "生成 AI 紫微洞察" : "Generate AI Ziwei Insight")}
                  </button>
                  <Link
                    href="/fortune"
                    className={`inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-sm border ${tk.border} ${tk.text2} hover:bg-white/10 transition-all`}
                  >
                    {isChinese ? "返回个人图谱" : "Back to Personal Map"}
                  </Link>
                </div>
              </div>
              {aiReading && (
                <div className="grid lg:grid-cols-2 gap-4 mt-5">
                  {[
                    ["overview", isChinese ? "全盘总览" : "Overview"],
                    ["career", isChinese ? "事业节奏" : "Career"],
                    ["wealth", isChinese ? "资源策略" : "Resources"],
                    ["relationship", isChinese ? "关系沟通" : "Relationship"],
                    ["cycles", isChinese ? "周期提醒" : "Cycles"],
                    ["actionItems", isChinese ? "行动清单" : "Action Items"],
                  ].map(([key, title]) => aiReading[key] ? (
                    <div key={key} className={`rounded-xl p-4 border ${tk.border} ${theme === "cosmic" ? "bg-black/15" : "bg-white/55"}`}>
                      <h3 className={`font-semibold ${tk.text1}`}>{title}</h3>
                      <p className={`${tk.text3} text-sm mt-2 leading-relaxed whitespace-pre-line`}>{aiReading[key]}</p>
                    </div>
                  ) : null)}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function Meta({ label, value, muted, text }: { label: string; value: string; muted: string; text: string }) {
  return (
    <div>
      <dt className={`${muted} text-xs`}>{label}</dt>
      <dd className={`${text} text-sm mt-1 break-words`}>{value}</dd>
    </div>
  );
}

function StarLine({
  label,
  stars,
  empty,
  text,
  muted,
}: {
  label: string;
  stars: { name: string; brightness?: string; mutagen?: string }[];
  empty: string;
  text: string;
  muted: string;
}) {
  return (
    <div className="mt-2">
      <div className={`${muted} text-xs mb-1`}>{label}</div>
      <div className={`${text} text-sm leading-relaxed`}>
        {stars.length === 0
          ? empty
          : stars.map((star) => `${star.name}${star.brightness ? `(${star.brightness})` : ""}${star.mutagen ? `化${star.mutagen}` : ""}`).join("、")}
      </div>
    </div>
  );
}
