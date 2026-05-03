"use client";

import { useState } from "react";
import type { BaziChart } from "@/lib/bazi";
import { STEM_ELEMENTS } from "@/lib/bazi";

/**
 * Five structure groups + personality tendency labels.
 */

const GOD_GROUPS = [
  { name: "自我协作", gods: ["比肩", "劫财"], color: "#8b5cf6", emoji: "🤝", desc: "独立/协作力量", archetype: "独立自主型" },
  { name: "表达创造", gods: ["食神", "伤官"], color: "#ec4899", emoji: "✨", desc: "表达/创造力量", archetype: "创意才华型" },
  { name: "资源管理", gods: ["正财", "偏财"], color: "#f59e0b", emoji: "◆", desc: "资源/务实力量", archetype: "资源管理型" },
  { name: "规则挑战", gods: ["正官", "七杀"], color: "#ef4444", emoji: "◇", desc: "责任/规则力量", archetype: "责任管理型" },
  { name: "学习洞察", gods: ["正印", "偏印"], color: "#3b82f6", emoji: "✦", desc: "学习/洞察力量", archetype: "智慧学习型" },
];

const GOD_DISPLAY: Record<string, string> = {
  比肩: "自我",
  劫财: "协作",
  食神: "表达",
  伤官: "创造",
  正财: "稳定资源",
  偏财: "机会资源",
  正官: "规则",
  七杀: "挑战",
  正印: "学习",
  偏印: "洞察",
};

const GOD_DETAILS: Record<string, { meaning: string; positive: string; negative: string }> = {
  比肩: { meaning: "与日主同类同性", positive: "独立自强、团队合作", negative: "固执己见、竞争意识过强" },
  劫财: { meaning: "与日主同类异性", positive: "行动力强、社交广泛", negative: "冲动消费、容易争执" },
  食神: { meaning: "日主所生同性", positive: "表达稳定、性情温和、生活感受力强", negative: "安逸怠惰、缺乏进取心" },
  伤官: { meaning: "日主所生异性", positive: "创新能力强、口才出众、思维敏捷", negative: "叛逆不羁、目中无人" },
  正财: { meaning: "日主所克异性", positive: "勤劳务实、资源管理能力强、关系稳定", negative: "过于保守、边界紧绷" },
  偏财: { meaning: "日主所克同性", positive: "人缘好、机会感敏锐、大方豪爽", negative: "节奏冒进、资源分散" },
  正官: { meaning: "克日主的异性", positive: "正直守序、组织能力强、节奏稳定", negative: "刻板保守、压力过大" },
  七杀: { meaning: "克日主的同性", positive: "魄力十足、敢于挑战、威严霸气", negative: "霸道专横、疑心重" },
  正印: { meaning: "生日主的异性", positive: "善良仁慈、支持资源多、学习能力强", negative: "依赖心强、优柔寡断" },
  偏印: { meaning: "生日主的同性", positive: "悟性高、技术能力强、独特思维", negative: "多疑孤僻、不切实际" },
};

function countTenGods(chart: BaziChart): Record<string, number> {
  const counts: Record<string, number> = {};
  const dm = chart.dayMaster;

  // Count from stems of year, month, hour pillars
  [chart.yearPillar, chart.monthPillar, chart.hourPillar].forEach((p) => {
    const godFromStem = getTenGodLocal(dm, p.stem);
    counts[godFromStem] = (counts[godFromStem] || 0) + 1;
  });

  // Count from hidden stems of ALL branches (including day)
  [chart.yearPillar, chart.monthPillar, chart.dayPillar, chart.hourPillar].forEach((p) => {
    p.hiddenStems.forEach((hs) => {
      if (hs !== dm) {
        const god = getTenGodLocal(dm, hs);
        counts[god] = (counts[god] || 0) + 0.5; // Hidden stems count as 0.5
      }
    });
  });

  return counts;
}

function getTenGodLocal(dayMaster: string, stem: string): string {
  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const dmIdx = stems.indexOf(dayMaster);
  const sIdx = stems.indexOf(stem);
  if (dmIdx < 0 || sIdx < 0) return "比肩";

  const dmEl = STEM_ELEMENTS[dayMaster];
  const sEl = STEM_ELEMENTS[stem];
  const samePolarity = (dmIdx % 2) === (sIdx % 2);

  if (dmEl === sEl) return samePolarity ? "比肩" : "劫财";

  const cycle = ["木", "火", "土", "金", "水"];
  const dmI = cycle.indexOf(dmEl);
  const sI = cycle.indexOf(sEl);

  // What DM produces
  if (cycle[(dmI + 1) % 5] === sEl) return samePolarity ? "食神" : "伤官";
  // What DM controls
  if (cycle[(dmI + 2) % 5] === sEl) return samePolarity ? "偏财" : "正财";
  // What controls DM
  if (cycle[(dmI + 3) % 5] === sEl) return samePolarity ? "七杀" : "正官";
  // What produces DM
  if (cycle[(dmI + 4) % 5] === sEl) return samePolarity ? "偏印" : "正印";

  return "比肩";
}

export default function TenGodChart({ chart }: { chart: BaziChart }) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const godCounts = countTenGods(chart);

  // Calculate group strengths
  const groupStrengths = GOD_GROUPS.map((g) => {
    const total = g.gods.reduce((sum, god) => sum + (godCounts[god] || 0), 0);
    return { ...g, total };
  });

  const maxStrength = Math.max(...groupStrengths.map((g) => g.total), 1);
  const dominantGroup = [...groupStrengths].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="space-y-4">
      {/* Archetype Label */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-amber-400/15 rounded-full px-4 py-2">
          <span className="text-lg">{dominantGroup.emoji}</span>
          <span className="text-sm font-bold text-amber-200">{dominantGroup.archetype}</span>
        </div>
        <p className="text-[10px] text-amber-200/25 mt-2">
          基于结构分布 · {dominantGroup.name}最强
        </p>
      </div>

      {/* Bar chart */}
      <div className="space-y-3">
        {groupStrengths.map((g) => {
          const pct = maxStrength > 0 ? (g.total / maxStrength) * 100 : 0;
          const isActive = activeGroup === g.name;
          return (
            <div key={g.name}>
              <button
                className="w-full cursor-pointer group"
                onClick={() => setActiveGroup(isActive ? null : g.name)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base w-6">{g.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-amber-200/60 group-hover:text-amber-200/80 transition-colors">
                        {g.name}
                        <span className="text-amber-200/25 ml-1.5">({g.gods.map((god) => GOD_DISPLAY[god] || god).join("·")})</span>
                      </span>
                      <span className="text-xs font-mono" style={{ color: `${g.color}99` }}>
                        {g.total.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${g.color}66, ${g.color})`,
                          boxShadow: isActive ? `0 0 10px ${g.color}33` : "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isActive && (
                <div className="mt-2 ml-9 space-y-2 animate-slideUp" style={{ animationDuration: "0.3s" }}>
                  {g.gods.map((god) => {
                    const detail = GOD_DETAILS[god];
                    const count = godCounts[god] || 0;
                    return (
                      <div key={god} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold" style={{ color: g.color }}>{GOD_DISPLAY[god] || god}</span>
                          <span className="text-[10px] text-amber-200/30">×{count.toFixed(1)}</span>
                        </div>
                        <p className="text-[10px] text-amber-200/25 mb-1">{detail?.meaning}</p>
                        <div className="flex gap-2 text-[10px]">
                          <span className="text-green-400/50">✓ {detail?.positive}</span>
                        </div>
                        {count >= 2 && (
                          <div className="text-[10px] text-red-400/40 mt-0.5">
                            ⚠ 过旺注意：{detail?.negative}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
