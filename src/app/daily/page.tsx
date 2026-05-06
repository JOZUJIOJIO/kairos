"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/LocaleContext";
import { useTheme } from "@/lib/ThemeContext";
import { themeTokens } from "@/lib/theme-tokens";
import { useAuth } from "@/lib/supabase/auth-context";
import { isTelegramMiniAppRuntime } from "@/lib/telegram/environment";
import { calculateBazi, STEM_ELEMENTS, getTenGod, type BaziChart } from "@/lib/bazi";
import { ELEMENT_RECOMMENDATIONS } from "@/lib/bazi-glossary";
import { formatStarsPrice, formatUsdPrice } from "@/lib/pricing";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import { PageArtworkBand } from "@/components/PageArtwork";
import { useToast } from "@/components/Toast";

// @ts-expect-error lunar-javascript has no type declarations
import { Solar } from "lunar-javascript";

type ThemeTokenSet = (typeof themeTokens)[keyof typeof themeTokens];

function getValidDateParam(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function getStoredBirthDate() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("kairos_birth_date") ?? "";
}

function calculateDefaultDailyChart(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return calculateBazi(y, m, d, "午", "male");
}

// Daily fortune score based on day master vs today's stem/branch
function calcDailyScores(chart: BaziChart) {
  const today = new Date();
  const solar = Solar.fromYmd(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const todayStem = ec.getDayGan();
  const todayBranch = ec.getDayZhi();

  const tenGod = getTenGod(chart.dayMaster, todayStem);
  const todayStemEl = STEM_ELEMENTS[todayStem];

  // Score calculation based on Ten God relationship
  const godScores: Record<string, { career: number; wealth: number; love: number; health: number }> = {
    比肩: { career: 65, wealth: 50, love: 60, health: 75 },
    劫财: { career: 55, wealth: 40, love: 55, health: 70 },
    食神: { career: 70, wealth: 65, love: 80, health: 80 },
    伤官: { career: 75, wealth: 60, love: 65, health: 60 },
    偏财: { career: 70, wealth: 85, love: 75, health: 65 },
    正财: { career: 75, wealth: 90, love: 70, health: 70 },
    七杀: { career: 80, wealth: 55, love: 50, health: 55 },
    正官: { career: 85, wealth: 70, love: 75, health: 65 },
    偏印: { career: 60, wealth: 55, love: 55, health: 70 },
    正印: { career: 65, wealth: 60, love: 70, health: 80 },
  };

  const base = godScores[tenGod] || { career: 60, wealth: 60, love: 60, health: 60 };

  // Add some deterministic daily variance based on date
  const dateHash = (today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()) % 20 - 10;
  const luckyBonus = todayStemEl === chart.luckyElement ? 8 : 0;

  return {
    career: Math.min(99, Math.max(20, base.career + dateHash + luckyBonus)),
    wealth: Math.min(99, Math.max(20, base.wealth - dateHash + luckyBonus)),
    love: Math.min(99, Math.max(20, base.love + Math.abs(dateHash) + luckyBonus)),
    health: Math.min(99, Math.max(20, base.health - Math.abs(dateHash) + luckyBonus)),
    overall: 0,
    tenGod,
    todayStem,
    todayBranch,
    todayStemEl,
  };
}

// Today's auspicious/inauspicious activities based on day master + today
function getDailyGuidance(chart: BaziChart, tenGod: string) {
  const auspicious: Record<string, string[]> = {
    比肩: ["团队合作", "健身运动", "拜访朋友", "学习新技能"],
    劫财: ["竞标投标", "体育竞技", "社交聚会", "突破舒适区"],
    食神: ["创意写作", "美食聚餐", "演讲表达", "艺术创作"],
    伤官: ["技术研发", "革新方案", "独立思考", "打破常规"],
    偏财: ["资源复盘", "商务谈判", "社交拓展", "把握机会"],
    正财: ["签约合同", "预算整理", "稳定积累", "务实工作"],
    七杀: ["重大决策", "领导统筹", "面试竞聘", "挑战自我"],
    正官: ["拜见上级", "递交申请", "法律事务", "遵守规则"],
    偏印: ["冥想静修", "研究学术", "阅读思考", "独处充电"],
    正印: ["拜师学习", "考试备考", "求助贵人", "修身养性"],
  };

  const inauspicious: Record<string, string[]> = {
    比肩: ["借钱给人", "独断专行", "争强好胜"],
    劫财: ["大额消费", "高风险尝试", "轻信他人"],
    食神: ["节食减肥", "压抑情绪", "过度劳累"],
    伤官: ["顶撞上级", "口舌争执", "冲动消费"],
    偏财: ["机会判断过急", "借贷担保", "夜间外出"],
    正财: ["冒进决策", "铺张浪费", "借钱给人"],
    七杀: ["逃避责任", "优柔寡断", "过度劳累"],
    正官: ["违规操作", "迟到早退", "说谎隐瞒"],
    偏印: ["社交应酬", "做重大决定", "暴饮暴食"],
    正印: ["冒险行为", "忽略健康", "急于求成"],
  };

  return {
    auspicious: auspicious[tenGod] || ["保持平常心", "稳步前进"],
    inauspicious: inauspicious[tenGod] || ["避免冲动", "谨慎行事"],
  };
}

function ScoreBar({ label, score, icon, color, tk }: { label: string; score: number; icon: string; color: string; tk: ThemeTokenSet }) {
  const level = score >= 80 ? "极佳" : score >= 65 ? "良好" : score >= 50 ? "平稳" : "注意";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-sm ${tk.accent} flex items-center gap-1.5`}>
          <span>{icon}</span> {label}
        </span>
        <span className={`text-xs ${tk.label}`}>{score}/100 · {level}</span>
      </div>
      <div className={`h-2.5 ${tk.selectBg} rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function getPersonalizedInsight(chart: BaziChart, scores: ReturnType<typeof calcDailyScores>, isChinese: boolean): string {
  const dm = chart.dayMaster;
  const dmEl = chart.dayMasterElement;
  const todayEl = scores.todayStemEl;
  const strength = chart.dayMasterStrength;

  // Element relationship between today and day master
  const GEN_CYCLE: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const CTRL_CYCLE: Record<string, string> = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };

  const todayGeneratesDM = GEN_CYCLE[todayEl] === dmEl; // today生我
  const todayControlsDM = CTRL_CYCLE[todayEl] === dmEl; // today克我
  const dmGeneratesToday = GEN_CYCLE[dmEl] === todayEl; // 我生today
  const dmControlsToday = CTRL_CYCLE[dmEl] === todayEl; // 我克today

  if (isChinese) {
    if (todayGeneratesDM) {
      return `今日${scores.todayStem}${todayEl}生扶你的${dm}${dmEl}，如同贵人相助。${strength === "strong" ? "身强得助，能量充沛，适合主动出击、推进重要项目。" : "身弱得生，正是补充能量的好时机。多亲近长辈、师友，借力使力。"}`;
    }
    if (todayControlsDM) {
      return `今日${scores.todayStem}${todayEl}克制你的${dm}${dmEl}，压力感较强。${strength === "strong" ? "身强逢克反成磨砺，适合迎接挑战、面试竞聘、做重大决策。" : "身弱逢克需谨慎，避免硬碰硬。今天适合退一步，观察局势，养精蓄锐。"}`;
    }
    if (dmControlsToday) {
      return `今日你的${dm}${dmEl}克制${scores.todayStem}${todayEl}，资源议题被点亮。${strength === "strong" ? "基础较稳，把控力强。适合谈判、签约、梳理预算，主动争取。" : "能量偏弱时需量力而行，不宜大额支出或冒险决策。先稳住基本盘。"}`;
    }
    if (dmGeneratesToday) {
      return `今日你的${dm}${dmEl}生助${scores.todayStem}${todayEl}，食伤泄秀。创意和表达力旺盛，${strength === "strong" ? "身强泄秀为美，适合创作、演讲、社交、展示才华。" : "身弱逢泄需控制输出节奏，表达想法但不要过度消耗自己。"}`;
    }
    // Same element
    return `今日${scores.todayStem}${todayEl}与你的${dm}${dmEl}同气相求，比劫助身。${strength === "strong" ? "能量叠加，行动力极强。但注意不要过于刚硬，适当圆融处事。" : "同气扶持，今天自信心回升。适合团队合作、拓展人脉、争取机会。"}`;
  } else {
    if (todayGeneratesDM) {
      return `Today's ${todayEl} energy nurtures your ${dm} ${dmEl} — like receiving support from a mentor. ${strength === "strong" ? "With strong foundations boosted further, take bold action on important projects." : "Your energy gets a welcome boost. Lean on mentors and allies today."}`;
    }
    if (todayControlsDM) {
      return `Today's ${todayEl} energy challenges your ${dm} ${dmEl} — expect some pressure. ${strength === "strong" ? "Strong enough to turn pressure into growth. Good day for tough decisions." : "Tread carefully. Avoid confrontation and focus on observation."}`;
    }
    if (dmControlsToday) {
      return `Your ${dm} ${dmEl} dominates today's ${todayEl} — wealth energy is active. ${strength === "strong" ? "Strong position to negotiate, close deals, and handle finances." : "Don't overextend. Secure what you have before reaching for more."}`;
    }
    if (dmGeneratesToday) {
      return `Your ${dm} ${dmEl} feeds today's ${todayEl} — creativity flows freely. ${strength === "strong" ? "Channel your abundant energy into creative work, presentations, or social events." : "Express yourself, but pace your energy. Quality over quantity today."}`;
    }
    return `Today's ${todayEl} mirrors your ${dm} ${dmEl} — kindred energy. ${strength === "strong" ? "Double energy means double momentum. Stay flexible to avoid rigidity." : "A confidence boost today. Good for teamwork and expanding connections."}`;
  }
}

function DailyContent() {
  const { isChinese } = useLocale();
  const { theme } = useTheme();
  const tk = themeTokens[theme];
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const dateParam = getValidDateParam(searchParams.get("date"));
  const [birthDate, setBirthDate] = useState(() => dateParam || getStoredBirthDate());
  const [chart, setChart] = useState<BaziChart | null>(() => (dateParam ? calculateDefaultDailyChart(dateParam) : null));
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false);
  const [dailyUnlocked, setDailyUnlocked] = useState(false);
  const [dailyCheckoutLoading, setDailyCheckoutLoading] = useState(false);
  const [dailyCheckoutError, setDailyCheckoutError] = useState("");
  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];

  useEffect(() => {
    setIsTelegramMiniApp(isTelegramMiniAppRuntime());
    setDailyUnlocked(localStorage.getItem("kairos_daily_paid") === todayKey);
  }, [todayKey]);

  const handleDailyShare = async () => {
    const shareUrl = new URL("/daily", window.location.origin);
    if (birthDate) shareUrl.searchParams.set("date", birthDate);
    const text = chart
      ? (isChinese
        ? `我今天的 Kairos 节奏：${chart.dayMaster}${chart.dayMasterElement}图谱 · ${todayKey}`
        : `My Kairos daily rhythm: ${chart.dayMaster} ${chart.dayMasterElement} map · ${todayKey}`)
      : (isChinese ? "打开 Kairos，查看今天的节奏。" : "Open Kairos and check today's rhythm.");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Kairós Daily",
          text,
          url: shareUrl.toString(),
        });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${shareUrl.toString()}`);
      toast(isChinese ? "今日卡链接已复制" : "Daily card link copied", "success");
    } catch {
      toast(isChinese ? "分享暂时不可用，请稍后重试" : "Sharing is unavailable. Please try again.", "error");
    }
  };

  const handleDailyStarsUnlock = async () => {
    const telegramWebApp = window.Telegram?.WebApp;
    const telegramInitData = telegramWebApp?.initData || "";
    if (!telegramInitData || !telegramWebApp?.openInvoice) {
      toast(isChinese ? "请在 Telegram Mini App 内使用 Stars 解锁" : "Use Stars inside the Telegram Mini App", "error");
      return;
    }
    setDailyCheckoutLoading(true);
    setDailyCheckoutError("");
    try {
      const res = await fetch("/api/telegram/stars/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: telegramInitData,
          chartId: birthDate || todayKey,
          userName: "Kairos",
          tier: "health",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.invoiceLink) {
        throw new Error(data.error || "Failed to create Telegram Stars invoice");
      }
      telegramWebApp.openInvoice(data.invoiceLink, (status) => {
        if (status === "paid") {
          telegramWebApp.HapticFeedback?.notificationOccurred?.("success");
          localStorage.setItem("kairos_daily_paid", todayKey);
          setDailyUnlocked(true);
          toast(isChinese ? "今日进阶已解锁" : "Daily depth unlocked", "success");
        } else if (status === "failed") {
          telegramWebApp.HapticFeedback?.notificationOccurred?.("error");
          setDailyCheckoutError(isChinese ? "Stars 支付失败，请重试" : "Stars payment failed. Please try again.");
        }
        setDailyCheckoutLoading(false);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : (isChinese ? "无法创建 Stars 支付" : "Unable to create Stars payment");
      setDailyCheckoutError(message);
      toast(message, "error");
      setDailyCheckoutLoading(false);
    }
  };

  // Check subscription
  useEffect(() => {
    if (!user) return;
    fetch("/api/subscription/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.subscribed) setIsSubscriber(true); })
      .catch(() => {});
  }, [user]);

  const handleGenerate = () => {
    if (!birthDate) return;
    localStorage.setItem("kairos_birth_date", birthDate);
    setChart(calculateDefaultDailyChart(birthDate));
  };

  const dateStr = isChinese
    ? `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
    : today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Calculate scores if chart exists
  const scores = chart ? calcDailyScores(chart) : null;
  if (scores) scores.overall = Math.round((scores.career + scores.wealth + scores.love + scores.health) / 4);
  const guidance = chart && scores ? getDailyGuidance(chart, scores.tenGod) : null;
  const rec = chart ? ELEMENT_RECOMMENDATIONS[chart.luckyElement] : null;
  const hasDailyDepth = isSubscriber || dailyUnlocked;

  return (
    <div className={`min-h-screen ${tk.bg} relative`}>
      {/* Theme-conditional background */}
      {theme === "cosmic" ? (
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[#060410]" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(45,20,80,0.4) 0%, transparent 60%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 100%, rgba(30,15,60,0.3) 0%, transparent 50%)" }} />
        </div>
      ) : (
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #E8E6F0 0%, #F2F0EB 40%, #F8F5EE 100%)" }} />
        </div>
      )}
      <div className="relative z-10">
      <PageHeader title={isChinese ? "每日趋势" : "Daily Insights"} />
      <PageArtworkBand art="daily" className="h-40 lg:h-80 border-b border-amber-400/10" />

      <main className="max-w-lg lg:max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Date header */}
        <div className="text-center mb-8">
          <div className={`flex items-center justify-center gap-2 ${tk.accentMuted} text-xs mb-3`}>
            <span>☸</span><span>Daily Signal · 每日趋势</span><span>☸</span>
          </div>
          <h1 className={`font-display text-2xl font-bold ${tk.text1}`}>{dateStr}</h1>
        </div>

        {!chart ? (
          /* Input state */
          <div className="space-y-5">
            <section className={`${tk.sectionBg} border ${tk.accentBorder} rounded-[28px] p-5 text-center`}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] text-2xl text-amber-100">
                鉴
              </div>
              <h2 className={`font-display text-2xl font-bold ${tk.text1}`}>
                {isChinese ? "先看今天，再决定下一步" : "See today first, then choose your next move"}
              </h2>
              <p className={`${tk.text2} mx-auto mt-3 max-w-sm text-sm leading-7`}>
                {isChinese
                  ? "输入出生日期，Kairos 会生成一张今日节奏卡：关键词、行动方向、适合与不适合的事。"
                  : "Enter your birth date and Kairos creates a daily rhythm card with keywords, action direction, and do/don't signals."}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  isChinese ? "今日关键词" : "Keyword",
                  isChinese ? "行动建议" : "Action",
                  isChinese ? "分享卡片" : "Share card",
                ].map((item) => (
                  <div key={item} className={`rounded-2xl border ${tk.border} bg-white/[0.035] px-2 py-3 text-xs font-semibold ${tk.text2}`}>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className={`${tk.sectionBg} border ${tk.accentBorder} rounded-2xl p-5 space-y-4`}>
              <label className={`block text-xs font-semibold tracking-[0.18em] ${tk.accentMuted}`}>
                {isChinese ? "出生日期" : "BIRTH DATE"}
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min="1940-01-01"
                className={`w-full px-4 py-3.5 rounded-xl ${tk.selectBg} border ${tk.accentBorder} ${tk.text1} text-center ${tk.label} focus:outline-none ${tk.inputFocus} focus:bg-white/[0.08] transition-all`}
                style={{ colorScheme: tk.colorScheme }}
              />
              <button
                onClick={handleGenerate}
                disabled={!birthDate}
                className={`w-full py-3.5 rounded-xl font-semibold cursor-pointer ${tk.ctaPrimary} disabled:opacity-30 transition-all`}
              >
                {isChinese ? "生成今日节奏卡" : "Create Daily Rhythm Card"}
              </button>
              <Link
                href="/fortune"
                className={`block w-full rounded-xl border ${tk.border} py-3 text-center text-sm font-semibold ${tk.text2} transition active:scale-[0.99]`}
              >
                {isChinese ? "直接生成完整图谱" : "Generate complete map instead"}
              </Link>
            </section>
          </div>
        ) : scores && guidance && rec ? (
          /* Results */
          <div className="space-y-5">
            {/* Overall score circle */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke={theme === "cosmic" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={scores.overall >= 70 ? "#22c55e" : scores.overall >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${scores.overall * 3.27} 327`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-3xl font-bold ${tk.accent}`}>{scores.overall}</div>
                  <div className={`text-[10px] ${tk.label}`}>{isChinese ? "综合趋势" : "Overall"}</div>
                </div>
              </div>
            </div>

            {/* User info tag */}
            <div className={`text-center text-xs ${tk.label}`}>
              <span>{chart.dayMaster}{chart.dayMasterElement}图谱</span>
              <span className="mx-2">·</span>
              <span>今日{scores.tenGod}当令</span>
              <span className="mx-2">·</span>
              <span>{scores.todayStem}{scores.todayBranch}日</span>
            </div>

            {/* Desktop 2-column grid */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">

            {/* Four dimension scores */}
            <div className={`${tk.sectionBg} border ${tk.accentBorder} rounded-2xl p-5 space-y-4`}>
              <h3 className={`text-center text-xs ${tk.accentMuted} tracking-widest mb-1`}>{isChinese ? "四 维 趋 势" : "FOUR DIMENSIONS"}</h3>
              <ScoreBar label={isChinese ? "事业" : "Career"} score={scores.career} icon="💼" color="#3b82f6" tk={tk} />
              <ScoreBar label={isChinese ? "资源" : "Resources"} score={scores.wealth} icon="💰" color="#f59e0b" tk={tk} />
              <ScoreBar label={isChinese ? "感情" : "Love"} score={scores.love} icon="❤️" color="#ef4444" tk={tk} />
              <ScoreBar label={isChinese ? "健康" : "Health"} score={scores.health} icon="🏥" color="#22c55e" tk={tk} />
            </div>

            {/* Today's Auspicious / Inauspicious */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`${tk.sectionBg} border ${theme === "cosmic" ? "border-green-500/10" : "border-green-600/15"} rounded-2xl p-4`}>
                <h4 className={`text-xs ${theme === "cosmic" ? "text-green-400/60" : "text-green-600/70"} font-semibold mb-3 text-center`}>✅ {isChinese ? "今日宜" : "Do"}</h4>
                <div className="space-y-2">
                  {guidance.auspicious.map((item, i) => (
                    <div key={i} className={`text-xs ${tk.text2} flex items-center gap-1.5`}>
                      <span className={`${theme === "cosmic" ? "text-green-400/40" : "text-green-600/50"} text-[10px]`}>●</span> {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className={`${tk.sectionBg} border ${theme === "cosmic" ? "border-red-500/10" : "border-red-500/15"} rounded-2xl p-4`}>
                <h4 className={`text-xs ${theme === "cosmic" ? "text-red-400/60" : "text-red-600/70"} font-semibold mb-3 text-center`}>❌ {isChinese ? "今日忌" : "Don't"}</h4>
                <div className="space-y-2">
                  {guidance.inauspicious.map((item, i) => (
                    <div key={i} className={`text-xs ${tk.text2} flex items-center gap-1.5`}>
                      <span className={`${theme === "cosmic" ? "text-red-400/40" : "text-red-600/50"} text-[10px]`}>●</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lucky guidance */}
            <div className={`${tk.sectionBg} border ${tk.accentBorder} rounded-2xl p-5`}>
              <h3 className={`text-center text-xs ${tk.accentMuted} tracking-widest mb-4`}>{isChinese ? "今 日 参 考 指 引" : "DAILY GUIDANCE"}</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className={`text-[10px] ${tk.label} mb-1`}>🎨 {isChinese ? "参考色" : "Color"}</div>
                  <div className={`text-xs ${tk.text2}`}>{rec.colors.split("、")[0]}</div>
                </div>
                <div>
                  <div className={`text-[10px] ${tk.label} mb-1`}>🧭 {isChinese ? "方位" : "Direction"}</div>
                  <div className={`text-xs ${tk.text2}`}>{rec.directions.split("、")[0]}</div>
                </div>
                <div>
                  <div className={`text-[10px] ${tk.label} mb-1`}>🔢 {isChinese ? "数字" : "Number"}</div>
                  <div className={`text-xs ${tk.text2}`}>{rec.numbers}</div>
                </div>
              </div>
            </div>

            {/* Personalized Daily Insight */}
            <div className={`${tk.sectionBg} border ${tk.accentBorder} rounded-2xl p-5`}>
              <h3 className={`text-center text-xs ${tk.accentMuted} tracking-widest mb-3`}>{isChinese ? "今 日 专 属 洞 察" : "YOUR DAILY INSIGHT"}</h3>
              <p className={`${tk.text2} text-sm leading-relaxed text-center`}>
                {getPersonalizedInsight(chart, scores, isChinese)}
              </p>
            </div>

            </div>{/* End desktop 2-column grid */}

            {/* Daily Deep Insights — subscriber or Stars unlock */}
            {hasDailyDepth ? (
              <div className={`${tk.sectionBg} border ${theme === "cosmic" ? "border-emerald-400/15" : "border-emerald-600/20"} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs ${theme === "cosmic" ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"} px-2 py-0.5 rounded-full font-semibold`}>{isTelegramMiniApp ? "STARS" : "PRO"}</span>
                  <h3 className={`text-xs ${theme === "cosmic" ? "text-emerald-400/60" : "text-emerald-600/70"} tracking-widest`}>{isChinese ? "深 度 每 日 节 奏" : "DEEP DAILY RHYTHM"}</h3>
                </div>
                <div className="space-y-3">
                  <div className={`${tk.sectionBg} rounded-xl p-3.5 border ${tk.border}`}>
                    <div className={`text-xs font-semibold ${tk.accent} mb-1`}>🎯 {isChinese ? "今日关键时段" : "Key Time Windows"}</div>
                    <p className={`text-[11px] ${tk.text2} leading-relaxed`}>
                      {scores.career >= 70
                        ? (isChinese ? "上午 9-11 点（巳时）专注度更高，适合重要会议和决策。下午 3-5 点（申时）资源议题更活跃，宜处理预算与协作。" : "9-11am best for career decisions. 3-5pm favorable for financial matters.")
                        : (isChinese ? "上午宜静不宜动，下午 1-3 点（未时）节奏回升，适合推进重要事项。晚间宜休养。" : "Morning: stay calm. 1-3pm energy rises, good for important tasks. Evening: rest.")}
                    </p>
                  </div>
                  <div className={`${tk.sectionBg} rounded-xl p-3.5 border ${tk.border}`}>
                    <div className={`text-xs font-semibold ${tk.accent} mb-1`}>💡 {isChinese ? "个性化行动建议" : "Personalized Actions"}</div>
                    <p className={`text-[11px] ${tk.text2} leading-relaxed`}>
                      {chart.dayMasterStrength === "strong"
                        ? (isChinese ? `今日${scores.tenGod}当令，结构偏强者宜主动推进。适合谈判、签约、社交拓展。穿${rec.colors.split("、")[0]}系衣物增强仪式感。` : `Today favors proactive moves. Good for negotiations and networking. Wear ${rec.colors.split("、")[0]} for focus.`)
                        : (isChinese ? `今日${scores.tenGod}当令，结构偏柔者宜借力使力。寻求团队支持，避免单打独斗。可用${chart.luckyElement}属性配饰提醒自己保持节奏。` : `Today favors teamwork over solo efforts. Seek support. Use ${chart.luckyElement} element accessories as a focus cue.`)}
                    </p>
                  </div>
                  <div className={`${tk.sectionBg} rounded-xl p-3.5 border ${tk.border}`}>
                    <div className={`text-xs font-semibold ${tk.accent} mb-1`}>🍽️ {isChinese ? "今日饮食调养" : "Diet & Wellness"}</div>
                    <p className={`text-[11px] ${tk.text2} leading-relaxed`}>
                      {chart.luckyElement === "木" ? (isChinese ? "今日宜多食绿色蔬菜、酸味食物。推荐：菠菜沙拉、柠檬水、绿茶。" : "Eat green vegetables and sour foods. Try: spinach salad, lemon water, green tea.")
                       : chart.luckyElement === "火" ? (isChinese ? "今日宜食红色食物、苦味适量。推荐：番茄、红枣、苦瓜。" : "Eat red foods and moderate bitter flavors. Try: tomatoes, dates, bitter melon.")
                       : chart.luckyElement === "土" ? (isChinese ? "今日宜食甘味、黄色食物。推荐：南瓜、玉米、蜂蜜水。" : "Eat sweet and yellow foods. Try: pumpkin, corn, honey water.")
                       : chart.luckyElement === "金" ? (isChinese ? "今日宜食辛味、白色食物。推荐：白萝卜、梨、薏仁。" : "Eat pungent and white foods. Try: radish, pear, barley.")
                       : (isChinese ? "今日宜食咸味、黑色食物。推荐：海带、黑豆、黑芝麻糊。" : "Eat salty and dark foods. Try: seaweed, black beans, sesame paste.")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${tk.sectionBg} border ${theme === "cosmic" ? "border-emerald-400/10" : "border-emerald-600/15"} rounded-2xl p-5 text-center relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-t ${theme === "cosmic" ? "from-[#12101c]" : "from-[#F5F3EE]"} via-transparent to-transparent pointer-events-none`} />
                <div className="relative">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className={`text-xs ${theme === "cosmic" ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"} px-2 py-0.5 rounded-full font-semibold`}>{isTelegramMiniApp ? "STARS" : "PRO"}</span>
                    <span className={`text-xs ${theme === "cosmic" ? "text-emerald-400/60" : "text-emerald-600/70"}`}>{isChinese ? "今日进阶洞察" : "Daily Depth"}</span>
                  </div>
                  <p className={`${tk.label} text-xs mb-3`}>
                    {isChinese ? "关键时段 · 行动建议 · 饮食调养 · 今日解锁" : "Key time windows · Action items · Diet tips · Today unlock"}
                  </p>
                  {isTelegramMiniApp ? (
                    <button
                      onClick={handleDailyStarsUnlock}
                      disabled={dailyCheckoutLoading}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 px-5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {dailyCheckoutLoading
                        ? "..."
                        : (isChinese ? `Stars 解锁 · ${formatStarsPrice("health_report")}` : `Unlock · ${formatStarsPrice("health_report")}`)}
                    </button>
                  ) : (
                    <Link
                      href="/fortune"
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 px-5 text-xs font-semibold text-white"
                    >
                      {isChinese ? `网页端解锁 · ${formatUsdPrice("fortune_pro")}` : `Unlock on web · ${formatUsdPrice("fortune_pro")}`}
                    </Link>
                  )}
                  {dailyCheckoutError && (
                    <p className="mt-3 text-xs text-red-300/80">{dailyCheckoutError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link href="/fortune" className={`flex-1 py-3 rounded-xl text-sm font-medium text-center cursor-pointer ${tk.ctaPrimary} transition-all`}>
                {isChinese ? "完整图谱分析" : "Full Map Analysis"}
              </Link>
              <button
                onClick={handleDailyShare}
                className={`flex-1 py-3 rounded-xl text-sm font-medium cursor-pointer ${tk.selectBg} ${tk.text2} hover:opacity-80 transition-colors border ${tk.border}`}
              >
                {isChinese ? "分享今日卡" : "Share Card"}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setChart(null)}
                className={`w-full py-3 rounded-xl text-sm font-medium cursor-pointer ${tk.selectBg} ${tk.text2} hover:opacity-80 transition-colors border ${tk.border}`}
              >
                {isChinese ? "换人查看" : "Try Another"}
              </button>
            </div>
          </div>
        ) : null}
      </main>
      <BottomNav />
      </div>
    </div>
  );
}

export default function DailyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DailyContent />
    </Suspense>
  );
}
