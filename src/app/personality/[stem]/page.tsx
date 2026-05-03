"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";
import { STEM_ELEMENTS } from "@/lib/bazi";
import { DAY_MASTER_DESC, ELEMENT_RECOMMENDATIONS, GLOSSARY } from "@/lib/bazi-glossary";
import RadarChart from "@/components/RadarChart";
import BottomNav from "@/components/BottomNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BrandMark from "@/components/BrandMark";

const STEM_DATA: Record<string, {
  stem: string; element: string; emoji: string; yinYang: string; yinYangEn: string;
  careers: string; careersEn: string;
  love: string; loveEn: string;
  celebrities: string; celebritiesEn: string;
  elementStrengths: { 木: number; 火: number; 土: number; 金: number; 水: number };
}> = {
  甲: { stem: "甲", element: "木", emoji: "🌳", yinYang: "阳", yinYangEn: "Yang", careers: "CEO、创业者、项目经理、建筑师、教育家", careersEn: "CEO, Entrepreneur, Project Manager, Architect, Educator", love: "忠诚专一，重视承诺，喜欢在关系中担当领导者角色。适合与乙木、癸水的人搭配。", loveEn: "Loyal and committed, prefers leading in relationships. Best matched with Yi Wood or Gui Water.", celebrities: "马云、乔布斯（甲木日主代表）", celebritiesEn: "Jack Ma, Steve Jobs (representative Jia Wood Day Masters)", elementStrengths: { 木: 4, 火: 2, 土: 1, 金: 1, 水: 2 } },
  乙: { stem: "乙", element: "木", emoji: "🌿", yinYang: "阴", yinYangEn: "Yin", careers: "设计师、艺术家、心理咨询师、花艺师、外交官", careersEn: "Designer, Artist, Counselor, Florist, Diplomat", love: "温柔体贴，善于倾听，适应力强。适合与庚金、壬水的人搭配。", loveEn: "Gentle and empathetic, great listener. Best matched with Geng Metal or Ren Water.", celebrities: "周杰伦、Lady Gaga（乙木日主代表）", celebritiesEn: "Jay Chou, Lady Gaga (representative Yi Wood Day Masters)", elementStrengths: { 木: 3, 火: 2, 土: 1, 金: 2, 水: 2 } },
  丙: { stem: "丙", element: "火", emoji: "☀️", yinYang: "阳", yinYangEn: "Yang", careers: "演说家、销售总监、导演、主持人、教练", careersEn: "Speaker, Sales Director, Director, Host, Coach", love: "热情浪漫，主动大方，但需要学习在平淡中维护关系。适合与辛金、壬水的人搭配。", loveEn: "Passionate and generous, but needs to maintain relationships through calm periods. Best matched with Xin Metal or Ren Water.", celebrities: "马斯克、奥普拉（丙火日主代表）", celebritiesEn: "Elon Musk, Oprah Winfrey (representative Bing Fire Day Masters)", elementStrengths: { 木: 2, 火: 4, 土: 2, 金: 1, 水: 1 } },
  丁: { stem: "丁", element: "火", emoji: "🕯️", yinYang: "阴", yinYangEn: "Yin", careers: "作家、研究员、策略师、灯光设计师、珠宝师", careersEn: "Writer, Researcher, Strategist, Lighting Designer, Jeweler", love: "内敛深情，善于洞察对方内心。感情细腻但可能多虑。适合与壬水、甲木的人搭配。", loveEn: "Reserved but deeply emotional, perceptive of partner's needs. Best matched with Ren Water or Jia Wood.", celebrities: "村上春树、J.K.罗琳（丁火日主代表）", celebritiesEn: "Haruki Murakami, J.K. Rowling (representative Ding Fire Day Masters)", elementStrengths: { 木: 2, 火: 3, 土: 2, 金: 1, 水: 2 } },
  戊: { stem: "戊", element: "土", emoji: "⛰️", yinYang: "阳", yinYangEn: "Yang", careers: "房地产、银行家、行政主管、工程师、农业专家", careersEn: "Real Estate, Banker, Admin Director, Engineer, Agriculture", love: "稳重可靠，给人安全感，但可能缺少浪漫。适合与癸水、丙火的人搭配。", loveEn: "Reliable and grounding, provides security but may lack romance. Best matched with Gui Water or Bing Fire.", celebrities: "巴菲特、默克尔（戊土日主代表）", celebritiesEn: "Warren Buffett, Angela Merkel (representative Wu Earth Day Masters)", elementStrengths: { 木: 1, 火: 2, 土: 4, 金: 2, 水: 1 } },
  己: { stem: "己", element: "土", emoji: "🌾", yinYang: "阴", yinYangEn: "Yin", careers: "人力资源、营养师、社工、陶艺家、园艺师", careersEn: "HR, Nutritionist, Social Worker, Potter, Gardener", love: "温润如玉，善于照顾人，但容易委屈自己。适合与甲木、丙火的人搭配。", loveEn: "Nurturing and caring, but may sacrifice own needs. Best matched with Jia Wood or Bing Fire.", celebrities: "特蕾莎修女、宫崎骏（己土日主代表）", celebritiesEn: "Mother Teresa, Hayao Miyazaki (representative Ji Earth Day Masters)", elementStrengths: { 木: 1, 火: 2, 土: 3, 金: 2, 水: 2 } },
  庚: { stem: "庚", element: "金", emoji: "⚔️", yinYang: "阳", yinYangEn: "Yang", careers: "律师、军人、外科医生、机械工程师、运动员", careersEn: "Lawyer, Military, Surgeon, Mechanical Engineer, Athlete", love: "果断直接，讲究原则，一旦认定非常专一。适合与乙木、丁火的人搭配。", loveEn: "Decisive and principled, extremely loyal once committed. Best matched with Yi Wood or Ding Fire.", celebrities: "拿破仑、李小龙（庚金日主代表）", celebritiesEn: "Napoleon, Bruce Lee (representative Geng Metal Day Masters)", elementStrengths: { 木: 1, 火: 1, 土: 2, 金: 4, 水: 2 } },
  辛: { stem: "辛", element: "金", emoji: "💎", yinYang: "阴", yinYangEn: "Yin", careers: "珠宝设计、品酒师、审计师、编辑、品牌顾问", careersEn: "Jewelry Design, Sommelier, Auditor, Editor, Brand Consultant", love: "精致优雅，追求完美的爱情。品味高但可能过于挑剔。适合与丙火、壬水的人搭配。", loveEn: "Refined and elegant, seeks perfect love. Has high taste but may be too picky. Best matched with Bing Fire or Ren Water.", celebrities: "奥黛丽·赫本、安娜·温图尔（辛金日主代表）", celebritiesEn: "Audrey Hepburn, Anna Wintour (representative Xin Metal Day Masters)", elementStrengths: { 木: 1, 火: 1, 土: 2, 金: 3, 水: 3 } },
  壬: { stem: "壬", element: "水", emoji: "🌊", yinYang: "阳", yinYangEn: "Yang", careers: "资源配置、贸易商、航海家、IT工程师、哲学家", careersEn: "Resource Strategist, Trader, Navigator, IT Engineer, Philosopher", love: "智慧包容，视野开阔，但可能不够脚踏实地。适合与丁火、甲木的人搭配。", loveEn: "Wise and broad-minded, but may lack grounding. Best matched with Ding Fire or Jia Wood.", celebrities: "比尔·盖茨、爱因斯坦（壬水日主代表）", celebritiesEn: "Bill Gates, Einstein (representative Ren Water Day Masters)", elementStrengths: { 木: 2, 火: 1, 土: 1, 金: 2, 水: 4 } },
  癸: { stem: "癸", element: "水", emoji: "💧", yinYang: "阴", yinYangEn: "Yin", careers: "心理学家、占星师、瑜伽导师、诗人、灵性导师", careersEn: "Psychologist, Astrologer, Yoga Teacher, Poet, Spiritual Guide", love: "温柔滋润，直觉敏锐，善解人意。但可能过于多愁善感。适合与戊土、庚金的人搭配。", loveEn: "Gentle and intuitive, deeply empathetic. But may be too sentimental. Best matched with Wu Earth or Geng Metal.", celebrities: "达芬奇、泰勒·斯威夫特（癸水日主代表）", celebritiesEn: "Leonardo da Vinci, Taylor Swift (representative Gui Water Day Masters)", elementStrengths: { 木: 2, 火: 1, 土: 1, 金: 2, 水: 4 } },
};

const VALID_STEMS = Object.keys(STEM_DATA);

export default function PersonalityPage({ params }: { params: Promise<{ stem: string }> }) {
  const { stem } = use(params);
  const { locale } = useLocale();
  const isChinese = locale === "zh" || locale === "th";

  const decodedStem = decodeURIComponent(stem);
  const data = STEM_DATA[decodedStem];

  if (!data) {
    return (
      <div className="min-h-screen bg-[#12101c] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center"><BrandMark size="md" /></div>
          <p className="text-amber-200/50">Page not found</p>
          <Link href="/fortune" className="text-amber-400/50 text-sm mt-2 block underline">Go to Analysis</Link>
        </div>
      </div>
    );
  }

  const dmDesc = DAY_MASTER_DESC[decodedStem];
  const elRec = ELEMENT_RECOMMENDATIONS[data.element];
  const elGlossary = GLOSSARY[data.element];

  return (
    <div className="min-h-screen bg-[#12101c]">
      <header className="flex items-center justify-between px-4 lg:px-12 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link href="/fortune" className="text-amber-200/60 hover:text-amber-200 text-lg">←</Link>
          <span className="text-sm text-amber-200/60">{decodedStem}{data.element} {isChinese ? "性格详解" : "Personality"}</span>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 pb-24">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">{data.emoji}</div>
          <h1 className="text-3xl font-bold text-gradient-gold">{decodedStem}{data.element}</h1>
          <p className="text-amber-200/40 text-sm mt-2">{data.yinYang}{data.element} · {data.yinYangEn} {STEM_ELEMENTS[decodedStem]}</p>
        </div>

        <div className="space-y-5">
          {/* Personality */}
          <div className="bg-white/[0.03] border border-amber-400/10 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-amber-200 mb-3">{isChinese ? "🧠 核心性格" : "🧠 Core Personality"}</h2>
            <p className="text-sm text-amber-100/60 leading-relaxed">{isChinese ? dmDesc?.trait : dmDesc?.traitEn}</p>
          </div>

          {/* Five Elements radar */}
          <div className="bg-white/[0.03] border border-amber-400/10 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-amber-200 mb-3 text-center">{isChinese ? "典型五行分布" : "Typical Five Elements"}</h2>
            <RadarChart
              size={200}
              maxValue={5}
              data={[
                { label: "木", value: data.elementStrengths.木, color: "#22c55e", emoji: "🌳" },
                { label: "火", value: data.elementStrengths.火, color: "#ef4444", emoji: "🔥" },
                { label: "土", value: data.elementStrengths.土, color: "#a3712a", emoji: "⛰️" },
                { label: "金", value: data.elementStrengths.金, color: "#f59e0b", emoji: "⚙️" },
                { label: "水", value: data.elementStrengths.水, color: "#3b82f6", emoji: "💧" },
              ]}
            />
          </div>

          {/* Element info */}
          {elGlossary && (
            <div className="bg-white/[0.03] border border-amber-400/10 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-amber-200 mb-3">{data.emoji} {isChinese ? `${data.element}的特质` : `${STEM_ELEMENTS[decodedStem]} Element Traits`}</h2>
              <p className="text-sm text-amber-100/60 leading-relaxed">{isChinese ? elGlossary.desc : elGlossary.descEn}</p>
            </div>
          )}

          {/* Career */}
          <div className="bg-white/[0.03] border border-amber-400/10 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-amber-200 mb-3">{isChinese ? "💼 适合职业" : "💼 Ideal Careers"}</h2>
            <p className="text-sm text-amber-100/60 leading-relaxed">{isChinese ? data.careers : data.careersEn}</p>
          </div>

          {/* Love */}
          <div className="bg-white/[0.03] border border-amber-400/10 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-amber-200 mb-3">{isChinese ? "❤️ 恋爱风格" : "❤️ Love Style"}</h2>
            <p className="text-sm text-amber-100/60 leading-relaxed">{isChinese ? data.love : data.loveEn}</p>
          </div>

          {/* Lucky guidance */}
          {elRec && (
            <div className="bg-white/[0.03] border border-amber-400/10 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-amber-200 mb-3">{isChinese ? "🍀 行动建议" : "🍀 Action Guidance"}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                  <div className="text-[10px] text-amber-400/60 mb-1">🎨 {isChinese ? "参考色" : "Colors"}</div>
                  <div className="text-xs text-amber-100/60">{isChinese ? elRec.colors : elRec.colorsEn}</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                  <div className="text-[10px] text-amber-400/40 mb-1">🧭 {isChinese ? "方位" : "Direction"}</div>
                  <div className="text-xs text-amber-100/60">{isChinese ? elRec.directions : elRec.directionsEn}</div>
                </div>
              </div>
            </div>
          )}

          {/* Celebrities */}
          <div className="bg-white/[0.03] border border-amber-400/10 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-amber-200 mb-3">{isChinese ? "⭐ 代表人物" : "⭐ Famous Personalities"}</h2>
            <p className="text-sm text-amber-100/60 leading-relaxed">{isChinese ? data.celebrities : data.celebritiesEn}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center space-y-3">
          <Link href="/fortune" className="block w-full py-3.5 rounded-2xl font-semibold bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white hover:shadow-[0_0_30px_rgba(217,119,6,0.2)] transition-all text-sm">
            {isChinese ? "分析我的完整图谱 →" : "Get My Full Analysis →"}
          </Link>
          <div className="flex flex-wrap justify-center gap-2">
            {VALID_STEMS.filter(s => s !== decodedStem).map(s => (
              <Link key={s} href={`/personality/${s}`} className="text-[10px] text-amber-200/25 hover:text-amber-200/50 transition-colors px-2 py-1 rounded bg-white/[0.02] border border-white/5">
                {s}{STEM_ELEMENTS[s]}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
