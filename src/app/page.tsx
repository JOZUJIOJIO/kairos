"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/LocaleContext";
import { useTheme } from "@/lib/ThemeContext";
import BottomNav from "@/components/BottomNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import StarfieldCanvas from "@/components/StarfieldCanvas";
import CloudCanvas from "@/components/CloudCanvas";
import TaijiSvg from "@/components/TaijiSvg";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/lib/supabase/auth-context";
import { calculateBazi, ELEMENT_EMOJI, ELEMENT_COLORS, type BaziChart } from "@/lib/bazi";
import { themeTokens } from "@/lib/theme-tokens";

export default function Home() {
  const [quickDate, setQuickDate] = useState("");
  const [taijiSpin, setTaijiSpin] = useState(false);
  const [dateFlash, setDateFlash] = useState(false);
  const [fading, setFading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const tk = themeTokens[theme];
  const heroSignals = [
    { value: "4", label: locale === "zh" ? "核心模块" : "Core modules" },
    { value: "10", label: locale === "zh" ? "维度解读" : "Insight layers" },
    { value: "3min", label: locale === "zh" ? "生成报告" : "To report" },
  ];
  const productPaths = [
    { href: "/fortune", title: locale === "zh" ? "个人图谱" : "Personal Map", desc: locale === "zh" ? "四柱、五行、性格结构、行动建议" : "Pillars, elements, traits, actions", icon: "☯" },
    { href: "/health", title: locale === "zh" ? "体质测评" : "Health Map", desc: locale === "zh" ? "五行体质、脏腑地图、食疗建议" : "Constitution, organs, diet", icon: "⬠" },
    { href: "/daily", title: locale === "zh" ? "每日趋势" : "Daily Signal", desc: locale === "zh" ? "每天一张趋势卡，方便分享" : "Daily card, share-ready", icon: "◐" },
  ];

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const quickPreview = useMemo<BaziChart | null>(() => {
    if (!quickDate) return null;
    try {
      const [y, m, d] = quickDate.split("-").map(Number);
      if (!y || !m || !d) return null;
      return calculateBazi(y, m, d, "午", "male");
    } catch { return null; }
  }, [quickDate]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuickDate(val);
    if (val) {
      setDateFlash(true);
      setTimeout(() => setDateFlash(false), 600);
      setTaijiSpin(true);
      setTimeout(() => setTaijiSpin(false), 800);
    }
  }, []);

  const handleNavigate = useCallback((href: string) => {
    setFading(true);
    setTimeout(() => router.push(href), 200);
  }, [router]);

  return (
    <div className={`relative overflow-hidden transition-colors duration-700 ${tk.bg} ${fading ? "opacity-0 scale-[0.99]" : "opacity-100"}`}
         style={{ transition: "background-color 0.7s, opacity 0.2s" }}>

      {/* === Backgrounds === */}
      {theme === "cosmic" ? (
        <div className="fixed inset-0 z-0 animate-breatheSway">
          <div className="absolute inset-0 bg-[#060410]" />
          <div className="absolute inset-0 animate-drift" style={{ background: "linear-gradient(180deg, rgba(9,8,14,0.35) 0%, rgba(14,12,10,0.74) 48%, rgba(5,4,8,0.98) 100%)", animationDuration: "40s" }} />
          <div className="absolute inset-0 animate-drift" style={{ background: "radial-gradient(ellipse 75% 58% at 50% 34%, rgba(53,132,113,0.18) 0%, transparent 62%)", animationDuration: "55s", animationDirection: "reverse" }} />
          <div className="absolute inset-0 animate-drift" style={{ background: "radial-gradient(ellipse 58% 42% at 55% 58%, rgba(164,101,42,0.16) 0%, transparent 58%)", animationDuration: "70s" }} />
          {/* Wikimedia Commons CC0 sources: Sanxingdui bronze mask and sacred tree by Gary Todd. */}
          <div className="absolute inset-0 sanxingdui-bronze-field sanxingdui-bronze-field-cosmic" aria-hidden="true">
            <img src="/images/sanxingdui-bronze-tree.jpg" alt="" className="sanxingdui-sacred-tree sanxingdui-sacred-tree-cosmic" />
            <img src="/images/sanxingdui-bronze-mask.jpg" alt="" className="sanxingdui-artifact-mask sanxingdui-artifact-mask-cosmic" />
            <div className="sanxingdui-ritual-lines" />
            <div className="sanxingdui-ritual-grain" />
          </div>
          <StarfieldCanvas />
          {/* Helmet vignette — dark */}
          <div className="absolute inset-0 z-[2] helmet-vignette" />
        </div>
      ) : (
        <div className="fixed inset-0 z-0 animate-breatheSway">
          {/* Stone-bronze sky for the Sanxingdui artifact treatment. */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #D6D1C0 0%, #E5DED0 28%, #F2EDE3 58%, #FFFDF8 100%)" }} />
          <div className="absolute inset-0 animate-drift" style={{ background: "radial-gradient(ellipse 64% 48% at 50% 20%, rgba(159,113,63,0.18) 0%, transparent 58%)", animationDuration: "25s" }} />
          <div className="absolute inset-0 animate-drift" style={{ background: "radial-gradient(ellipse 48% 36% at 24% 18%, rgba(50,126,111,0.12) 0%, transparent 54%)", animationDuration: "40s", animationDirection: "reverse" }} />
          {/* Wikimedia Commons CC0 sources: Sanxingdui bronze mask and sacred tree by Gary Todd. */}
          <div className="absolute inset-0 sanxingdui-bronze-field sanxingdui-bronze-field-cloud" aria-hidden="true">
            <img src="/images/sanxingdui-bronze-tree.jpg" alt="" className="sanxingdui-sacred-tree sanxingdui-sacred-tree-cloud" />
            <img src="/images/sanxingdui-bronze-mask.jpg" alt="" className="sanxingdui-artifact-mask sanxingdui-artifact-mask-cloud" />
            <div className="sanxingdui-ritual-lines" />
            <div className="sanxingdui-ritual-grain" />
          </div>
          {/* Cloud layer below */}
          <div className="absolute inset-x-0 bottom-0 h-[55%]" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0.7) 85%, rgba(255,255,255,0.85) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-[30%]" style={{ background: "linear-gradient(180deg, transparent, rgba(242,240,235,0.5))" }} />
          <CloudCanvas />
          {/* Helmet vignette — light */}
          <div className="absolute inset-0 z-[2] helmet-vignette-light" />
        </div>
      )}

      {/* ===== Hero ===== */}
      <div className="relative z-10 min-h-screen flex flex-col pb-20">
        <nav className="flex items-center justify-between px-6 lg:px-12 py-4 animate-riseIn" style={{ animationDelay: "0.1s" }}>
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className={`text-lg font-light tracking-[0.15em] ${theme === "cosmic" ? "text-[#F2F0EB]/86" : "text-[#1a1520]/72"}`}>
              Kairós
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <Link href="/profile" className={`text-sm btn-haptic transition-colors ${tk.text3} hover:text-amber-100`}>
                {locale === "zh" ? "我的" : "Profile"}
              </Link>
            )}
            <LanguageSwitcher />
          </div>
        </nav>

        <div className="flex-1 px-5 lg:px-12 pt-4 lg:pt-10">
          <div className="mx-auto grid max-w-6xl items-center gap-7 lg:min-h-[calc(100vh-150px)] lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="text-center lg:text-left">
              {/* Taiji */}
              <div
                className={`mb-4 sm:mb-8 lg:mb-9 flex justify-center lg:justify-start animate-materialize ${taijiSpin ? "animate-compassSpin" : ""}`}
                style={{ animationDelay: taijiSpin ? "0s" : "0.15s", transform: `translateY(${scrollY * 0.1}px)` }}
              >
                <div className="sm:hidden"><TaijiSvg size={72} /></div>
                <div className="hidden sm:block"><TaijiSvg size={132} /></div>
              </div>

              {/* Title */}
              <div>
                <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-[0.18em] ${theme === "cosmic" ? "border-amber-300/15 bg-amber-300/5 text-amber-200/55" : "border-amber-700/15 bg-white/50 text-amber-800/55"}`}>
                  <span>{locale === "zh" ? "青铜神树 · AI 东方洞察" : "Bronze Tree · AI Insight Engine"}</span>
                </div>
                <h1
                  className={`font-display text-3xl sm:text-5xl lg:text-7xl font-bold tracking-[0.06em] max-w-4xl leading-[1.12] animate-riseIn ${tk.text1}`}
                  style={{ animationDelay: "0.2s", animationDuration: "0.8s" }}
                >
                  {t("hero.title")}
                </h1>
                <p
                  className={`mt-3 text-sm sm:text-base lg:text-lg tracking-wider leading-relaxed animate-riseIn ${tk.text2}`}
                  style={{ animationDelay: "0.32s", animationDuration: "0.6s" }}
                >
                  {t("hero.subtitle")}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2.5 animate-riseIn" style={{ animationDelay: "0.42s" }}>
                {heroSignals.map((item) => (
                  <div key={item.label} className={`rounded-xl border px-2.5 py-3 ${theme === "cosmic" ? "border-white/10 bg-white/[0.035]" : "border-black/10 bg-white/55"} backdrop-blur-sm`}>
                    <div className={`font-data text-lg font-semibold ${theme === "cosmic" ? "text-amber-200" : "text-amber-800"}`}>{item.value}</div>
                    <div className={`mt-0.5 text-[10px] ${tk.text3}`}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Date input */}
              <div className="mt-5 w-full max-w-md mx-auto lg:mx-0 animate-riseIn" style={{ animationDelay: "0.52s" }}>
                <p className={`text-[10px] mb-3 tracking-[0.2em] uppercase ${tk.text3}`}>
                  {locale === "zh" ? "输入出生日期，先看你的个人图谱" : "Enter birth date for a first map signal"}
                </p>
                <div className={`flex flex-col gap-2 rounded-2xl border p-2 sm:flex-row ${theme === "cosmic" ? "border-amber-300/15 bg-[#090712]/80" : "border-amber-700/15 bg-white/70"} backdrop-blur-md`}>
                  <input
                    type="date"
                    value={quickDate}
                    onChange={handleDateChange}
                    max={new Date().toISOString().split("T")[0]}
                    min="1940-01-01"
                    className={`min-h-[48px] flex-1 rounded-xl border px-4 text-center focus:outline-none transition-all duration-300 ${
                      dateFlash ? "animate-goldenFlash" : `${tk.input} focus:border-amber-400/30`
                    }`}
                    style={{ colorScheme: theme === "cosmic" ? "dark" : "light" }}
                  />
                  <button
                    onClick={() => handleNavigate(quickDate ? `/fortune?date=${quickDate}` : "/fortune")}
                    className={`min-h-[48px] rounded-xl px-5 text-sm font-semibold transition-all ${tk.ctaPrimary}`}
                  >
                    {quickDate ? (locale === "zh" ? "继续解读" : "Continue") : (locale === "zh" ? "立即体验" : "Start")}
                  </button>
                </div>
              </div>

              {!quickPreview && (
                <p className={`text-[10px] mt-3 tracking-[0.12em] animate-riseIn ${tk.text3}`} style={{ animationDelay: "0.62s" }}>
                  {locale === "zh" ? "免费基础图谱 · 支付解锁 AI 深度报告 · 移动端可分享" : "Free map · Paid AI report · Shareable on mobile"}
                </p>
              )}
            </section>

            <aside className="animate-riseIn" style={{ animationDelay: "0.58s" }}>
              <div className={`rounded-3xl border p-4 sm:p-5 ${theme === "cosmic" ? "border-amber-300/15 bg-[#090712]/72 shadow-[0_30px_120px_rgba(0,0,0,0.38)]" : "border-amber-800/15 bg-white/70 shadow-[0_30px_90px_rgba(86,62,32,0.12)]"} backdrop-blur-xl`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.24em] ${tk.accentMuted}`}>{locale === "zh" ? "可视化报告" : "Visual report"}</p>
                    <h2 className={`mt-1 text-base font-semibold ${tk.text1}`}>{locale === "zh" ? "你会得到什么" : "What you get"}</h2>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-[10px] ${theme === "cosmic" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200/80" : "border-emerald-700/20 bg-emerald-50 text-emerald-800/80"}`}>AI</div>
                </div>

                <div className="mt-4 space-y-3">
                  {productPaths.map((item) => (
                    <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-2xl border p-3 transition-all ${theme === "cosmic" ? "border-white/8 bg-white/[0.035] hover:border-amber-300/20 hover:bg-amber-300/[0.06]" : "border-black/8 bg-white/65 hover:border-amber-700/20 hover:bg-amber-50"}`}>
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg ${theme === "cosmic" ? "border-amber-300/15 bg-black/20 text-amber-200" : "border-amber-700/15 bg-white text-amber-800"}`}>{item.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${tk.text1}`}>{item.title}</span>
                        <span className={`mt-0.5 block truncate text-[11px] ${tk.text3}`}>{item.desc}</span>
                      </span>
                      <span className={`${tk.accentMuted} transition-transform group-hover:translate-x-1`}>→</span>
                    </Link>
                  ))}
                </div>

                <div className={`mt-4 rounded-2xl border p-4 ${theme === "cosmic" ? "border-white/8 bg-black/20" : "border-black/8 bg-white/55"}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`text-[11px] ${tk.text3}`}>{locale === "zh" ? "样例信息密度" : "Sample insight density"}</span>
                    <span className={`font-data text-[11px] ${tk.accent}`}>87%</span>
                  </div>
                  {["五行平衡", "事业趋势", "健康提示"].map((label, i) => (
                    <div key={label} className="mb-2 last:mb-0">
                      <div className="mb-1 flex justify-between text-[10px]">
                        <span className={tk.text3}>{locale === "zh" ? label : ["Element balance", "Career trend", "Health cues"][i]}</span>
                        <span className={tk.text3}>{[72, 88, 64][i]}</span>
                      </div>
                      <div className={`h-1.5 overflow-hidden rounded-full ${theme === "cosmic" ? "bg-white/8" : "bg-black/8"}`}>
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400" style={{ width: `${[72, 88, 64][i]}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* Preview card */}
          {quickPreview && (
            <div className="mx-auto mt-6 w-full max-w-md animate-cardExpand lg:-mt-8 lg:mr-auto lg:ml-[max(3rem,calc((100vw-72rem)/2))]">
              <div className={`border rounded-2xl p-5 backdrop-blur-sm stagger-card ${tk.card}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className={`text-[9px] mb-1 uppercase tracking-[0.15em] ${tk.text3}`}>{locale === "zh" ? "日主" : "Day Master"}</div>
                    <div className={`text-3xl font-bold ${tk.text1}`}>
                      {quickPreview.dayMaster}
                      <span className="text-lg ml-1.5 opacity-70">{ELEMENT_EMOJI[quickPreview.dayMasterElement]}</span>
                    </div>
                    <div className={`text-[11px] mt-0.5 ${tk.text2}`}>
                      {quickPreview.dayMasterElement}{locale === "zh" ? "图谱" : ""} · {quickPreview.dayMasterStrength === "strong" ? (locale === "zh" ? "结构偏强" : "Strong") : (locale === "zh" ? "结构偏柔" : "Gentle")}
                    </div>
                  </div>
                  <div className="text-4xl opacity-80">{quickPreview.zodiacEmoji}</div>
                </div>

                <p className={`text-[13px] leading-relaxed mb-4 ${tk.text2}`}>
                  {locale === "zh" ? quickPreview.dayMasterDesc : quickPreview.dayMasterDescEn}
                </p>

                <div>
                  <div className="flex gap-0.5 h-1 rounded-full overflow-hidden mb-1.5">
                    {(["木", "火", "土", "金", "水"] as const).map((el, i) => {
                      const count = quickPreview.fiveElements[el];
                      const total = Object.values(quickPreview.fiveElements).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? (count / total) * 100 : 20;
                      return (
                        <div key={el} style={{ width: `${pct}%`, backgroundColor: ELEMENT_COLORS[el], animationDelay: `${400 + i * 100}ms` }}
                             className={`animate-barFill ${theme === "cosmic" ? "opacity-50" : "opacity-65"}`} />
                      );
                    })}
                  </div>
                  <div className={`flex justify-between text-[8px] ${tk.text3}`}>
                    {(["木", "火", "土", "金", "水"] as const).map((el) => (
                      <span key={el}>{el} {quickPreview.fiveElements[el]}</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleNavigate(`/fortune?date=${quickDate}`)}
                  className={`mt-4 block w-full py-3 rounded-xl text-sm text-center font-medium btn-haptic transition-all duration-300 cursor-pointer border ${tk.ctaGold}`}
                >
                  {locale === "zh" ? "查看完整解读 →" : "Full Reading →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={`relative z-10 border-t py-6 px-6 ${tk.border}`}>
        <div className="max-w-sm mx-auto text-center">
          <div className={`flex items-center justify-center gap-4 text-[10px] ${tk.footerText}`}>
            <Link href="/about" className="hover:opacity-60 transition-opacity btn-haptic">{locale === "zh" ? "关于" : "About"}</Link>
            <span className={tk.footerDot}>·</span>
            <Link href="/learn" className="hover:opacity-60 transition-opacity btn-haptic">{locale === "zh" ? "了解体系" : "Learn"}</Link>
            <span className={tk.footerDot}>·</span>
            <Link href="/terms" className="hover:opacity-60 transition-opacity btn-haptic">{t("footer.terms")}</Link>
            <span className={tk.footerDot}>·</span>
            <Link href="/privacy" className="hover:opacity-60 transition-opacity btn-haptic">{t("footer.privacy")}</Link>
          </div>
          <p className={`text-[9px] mt-2 opacity-50 ${tk.footerText}`}>© 2026 Kairós</p>
        </div>
      </footer>

      <div className="pb-20 lg:pb-0 relative z-10">
        <BottomNav />
      </div>
    </div>
  );
}
