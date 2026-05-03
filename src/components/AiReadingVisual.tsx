"use client";

import type { BaziChart } from "@/lib/bazi";
import { getTenGod, STEM_ELEMENTS } from "@/lib/bazi";
import { ELEMENT_RECOMMENDATIONS } from "@/lib/bazi-glossary";

const TEN_GOD_LABELS: Record<string, string> = {
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

const displayTenGod = (god: string) => TEN_GOD_LABELS[god] || god;

// ===== Common: Animated Score Ring =====
function ScoreRing({ score, size = 56, color, label }: { score: number; size?: number; color: string; label: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.5s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-amber-200/40 mt-1">{label}</span>
    </div>
  );
}

// ===== 1. Personality Quadrant =====
function PersonalityQuadrant({ chart }: { chart: BaziChart }) {
  // Position based on element + strength
  // X: introvert(-1) ↔ extrovert(1)  based on element
  // Y: rational(-1) ↔ emotional(1)   based on strength + ten gods
  const elScores: Record<string, [number, number]> = {
    木: [0.3, 0.5],   // slightly extrovert, emotional (growth/idealistic)
    火: [0.8, 0.7],   // very extrovert, emotional (passionate)
    土: [-0.2, -0.3],  // slightly introvert, rational (stable/practical)
    金: [0.1, -0.8],   // neutral, very rational (decisive/logical)
    水: [-0.5, 0.3],   // introvert, slightly emotional (deep/intuitive)
  };
  const [baseX, baseY] = elScores[chart.dayMasterElement] || [0, 0];
  // Strength modifies: strong pushes more toward extrovert/rational, weak toward introvert/emotional
  const strengthMod = chart.dayMasterStrength === "strong" ? 0.2 : -0.2;
  const x = Math.max(-1, Math.min(1, baseX + strengthMod));
  const y = Math.max(-1, Math.min(1, baseY - strengthMod));

  // Map to SVG coordinates (center = 75,75, range ±50)
  const dotX = 75 + x * 45;
  const dotY = 75 - y * 45; // flip Y

  const traits = [
    { condition: x > 0.3, text: "外向开放" },
    { condition: x < -0.3, text: "内敛深沉" },
    { condition: y > 0.3, text: "感性直觉" },
    { condition: y < -0.3, text: "理性务实" },
    { condition: Math.abs(x) <= 0.3 && Math.abs(y) <= 0.3, text: "平衡中庸" },
  ].filter(t => t.condition).map(t => t.text);

  return (
    <div className="flex items-center gap-4">
      <svg width="150" height="150" viewBox="0 0 150 150" className="flex-shrink-0">
        {/* Grid */}
        <rect x="10" y="10" width="130" height="130" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
        <line x1="75" y1="10" x2="75" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
        <line x1="10" y1="75" x2="140" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
        {/* Labels */}
        <text x="75" y="7" textAnchor="middle" fill="rgba(217,169,106,0.3)" fontSize="7">感性</text>
        <text x="75" y="149" textAnchor="middle" fill="rgba(217,169,106,0.3)" fontSize="7">理性</text>
        <text x="5" y="78" textAnchor="middle" fill="rgba(217,169,106,0.3)" fontSize="7" transform="rotate(-90,5,78)">内向</text>
        <text x="147" y="78" textAnchor="middle" fill="rgba(217,169,106,0.3)" fontSize="7" transform="rotate(90,147,78)">外向</text>
        {/* Quadrant labels */}
        <text x="42" y="42" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="7">理想主义者</text>
        <text x="108" y="42" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="7">领袖开拓者</text>
        <text x="42" y="112" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="7">智慧分析师</text>
        <text x="108" y="112" textAnchor="middle" fill="rgba(255,255,255,0.06)" fontSize="7">务实执行者</text>
        {/* Dot */}
        <circle cx={dotX} cy={dotY} r="8" fill={`${chart.elementColors[chart.dayMasterElement]}33`} stroke={chart.elementColors[chart.dayMasterElement]} strokeWidth="2">
          <animate attributeName="r" values="7;9;7" dur="3s" repeatCount="indefinite" />
        </circle>
        <text x={dotX} y={dotY + 3} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
          {chart.dayMaster}
        </text>
      </svg>
      <div className="flex-1">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {traits.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-200/60">{t}</span>
          ))}
        </div>
        <p className="text-[10px] text-amber-200/25 leading-relaxed">
          基于{chart.dayMasterElement}行属性{chart.dayMasterStrength === "strong" ? "（身强）" : "（身弱）"}计算定位
        </p>
      </div>
    </div>
  );
}

// ===== 2. Career Dashboard =====
function CareerDashboard({ chart }: { chart: BaziChart }) {
  const yearGod = getTenGod(chart.dayMaster, chart.currentYearStem);
  const isStrong = chart.dayMasterStrength === "strong";

  // Career score based on ten god + strength
  const godCareerScores: Record<string, number> = {
    正官: 88, 七杀: 82, 正财: 78, 偏财: 75,
    食神: 72, 伤官: 70, 正印: 68, 偏印: 65,
    比肩: 55, 劫财: 50,
  };
  const baseScore = godCareerScores[yearGod] || 60;
  const careerScore = Math.min(99, baseScore + (isStrong ? 5 : -3));

  // Suitable industries based on lucky element
  const industries: Record<string, string[]> = {
    木: ["教育", "出版", "医药", "设计", "环保", "农业"],
    火: ["科技", "传媒", "餐饮", "能源", "娱乐", "美妆"],
    土: ["地产", "建筑", "矿业", "农牧", "陶瓷", "仓储"],
    金: ["金融", "法律", "汽车", "IT", "军工", "五金"],
    水: ["贸易", "物流", "旅游", "酒业", "渔业", "传播"],
  };
  const goodIndustries = industries[chart.luckyElement] || [];
  const avoidIndustries = industries[chart.unluckyElement] || [];

  const level = careerScore >= 85 ? "大吉" : careerScore >= 70 ? "中吉" : careerScore >= 55 ? "平稳" : "需谨慎";
  const levelColor = careerScore >= 85 ? "#22c55e" : careerScore >= 70 ? "#f59e0b" : careerScore >= 55 ? "#3b82f6" : "#ef4444";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
      <ScoreRing score={careerScore} color={levelColor} label="事业节奏" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold" style={{ color: levelColor }}>{level}</span>
            <span className="text-[10px] text-amber-200/30">今年主题{displayTenGod(yearGod)}</span>
          </div>
          <p className="text-[10px] text-amber-200/40 leading-relaxed">
            {careerScore >= 80 ? "今年事业节奏强劲，适合积极争取晋升和拓展。" :
             careerScore >= 65 ? "事业节奏稳中有升，把握机遇，稳扎稳打。" :
             "事业节奏需要沉淀，宜守不宜攻，多积累实力。"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2.5">
          <div className="text-[10px] text-green-400/50 mb-1.5">✓ 宜从事（{chart.luckyElement}行）</div>
          <div className="flex flex-wrap gap-1">
            {goodIndustries.slice(0, 4).map(ind => (
              <span key={ind} className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-300/60">{ind}</span>
            ))}
          </div>
        </div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5">
          <div className="text-[10px] text-red-400/40 mb-1.5">✗ 慎从事（{chart.unluckyElement}行）</div>
          <div className="flex flex-wrap gap-1">
            {avoidIndustries.slice(0, 4).map(ind => (
              <span key={ind} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300/40">{ind}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 3. Resource Trend Mini Chart =====
function WealthTrend({ chart }: { chart: BaziChart }) {
  const birthYear = parseInt(chart.solarDate);
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  // Build 5-year wealth trend based on luck cycles
  const years = [-2, -1, 0, 1, 2];
  const wealthData = years.map(offset => {
    const age = currentAge + offset;
    const yr = currentYear + offset;
    // Find which luck cycle this falls in
    const cycle = chart.luckCycles?.find(c => age >= c.startAge && age < c.startAge + 10);
    const tenGod = cycle?.tenGod || "比肩";
    const wealthGods = ["正财", "偏财"];
    const baseWealth = wealthGods.includes(tenGod) ? 80 : tenGod === "食神" ? 70 : tenGod === "伤官" ? 65 : 50;
    // Annual variation
    const yearHash = (yr * 7 + age * 3) % 20 - 10;
    return { year: yr, score: Math.max(20, Math.min(95, baseWealth + yearHash)) };
  });

  const maxScore = Math.max(...wealthData.map(d => d.score));
  const minScore = Math.min(...wealthData.map(d => d.score));
  const range = Math.max(maxScore - minScore, 20);

  // SVG mini chart
  const W = 220, H = 70;
  const padL = 5, padR = 5, padT = 10, padB = 18;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const points = wealthData.map((d, i) => ({
    x: padL + (i / (wealthData.length - 1)) * plotW,
    y: padT + plotH - ((d.score - minScore) / range) * plotH,
  }));

  let pathD = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }
  const areaD = pathD + ` L${points[points.length - 1].x},${padT + plotH} L${points[0].x},${padT + plotH} Z`;

  const trend = wealthData[4].score > wealthData[2].score ? "上升" : wealthData[4].score < wealthData[2].score ? "下降" : "平稳";
  const trendColor = trend === "上升" ? "#22c55e" : trend === "下降" ? "#ef4444" : "#f59e0b";
  const trendIcon = trend === "上升" ? "📈" : trend === "下降" ? "📉" : "➡️";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{trendIcon}</span>
          <span className="text-xs" style={{ color: trendColor }}>未来两年资源趋势{trend}</span>
        </div>
        <span className="text-[10px] text-amber-200/20">基于大运周期推算</span>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
    <defs>
          <linearGradient id="resourceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`${trendColor}33`} />
            <stop offset="100%" stopColor={`${trendColor}00`} />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#resourceGrad)" />
        <path d={pathD} fill="none" stroke={trendColor} strokeWidth="2" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === 2 ? 4 : 2.5}
              fill={i === 2 ? trendColor : `${trendColor}88`}
              stroke={i === 2 ? "rgba(255,255,255,0.3)" : "none"} strokeWidth="1" />
            <text x={p.x} y={padT + plotH + 12} textAnchor="middle"
              fill={i === 2 ? "rgba(217,169,106,0.6)" : "rgba(217,169,106,0.2)"} fontSize="7"
              fontWeight={i === 2 ? "bold" : "normal"}>
              {wealthData[i].year}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ===== 4. Relationship Index =====
function LoveIndex({ chart }: { chart: BaziChart }) {
  // Social charm markers: 子午卯酉 in branches
  const peachBlossomBranches = ["子", "午", "卯", "酉"];
  const branches = [chart.yearPillar.branch, chart.monthPillar.branch, chart.dayPillar.branch, chart.hourPillar.branch];
  const peachCount = branches.filter(b => peachBlossomBranches.includes(b)).length;

  // Relationship score based on social charm + ten symbols
  const hasZhengCai = [chart.tenGods.year, chart.tenGods.month, chart.tenGods.hour].includes("正财");
  const hasZhengGuan = [chart.tenGods.year, chart.tenGods.month, chart.tenGods.hour].includes("正官");
  const loveBase = 40 + peachCount * 15 + (hasZhengCai || hasZhengGuan ? 10 : 0);
  const loveScore = Math.min(95, loveBase + (chart.dayMasterStrength === "strong" ? 5 : -3));

  // Best match elements (相生)
  const matchMap: Record<string, string[]> = {
    木: ["水型", "火型"], 火: ["木型", "土型"], 土: ["火型", "金型"],
    金: ["土型", "水型"], 水: ["金型", "木型"],
  };
  const matches = matchMap[chart.dayMasterElement] || [];

  // Best match zodiac (六合)
  const zodiacMatch: Record<string, string> = {
    鼠: "牛", 牛: "鼠", 虎: "猪", 兔: "狗", 龙: "鸡", 蛇: "猴",
    马: "羊", 羊: "马", 猴: "蛇", 鸡: "龙", 狗: "兔", 猪: "虎",
  };
  const bestZodiac = zodiacMatch[chart.zodiacAnimal] || "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative">
          <ScoreRing score={loveScore} size={56} color="#ec4899" label="关系指数" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < peachCount ? "text-pink-400" : "text-pink-400/15"}`}>❤</span>
            ))}
            <span className="text-[10px] text-amber-200/20 ml-1">社交信号 ×{peachCount}</span>
          </div>
          <p className="text-[10px] text-amber-200/40">
            {peachCount >= 3 ? "社交吸引力强，关系机会较多，需注意稳定边界。" :
             peachCount >= 1 ? "关系信号中等，主动表达更容易建立连接。" :
             "关系信号较少，但更适合深层次沟通。"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-pink-500/5 border border-pink-500/10 rounded-lg p-2.5">
          <div className="text-[10px] text-pink-400/40 mb-1">💕 最佳沟通配对</div>
          <div className="flex gap-1.5">
            {matches.map(m => (
              <span key={m} className="text-xs text-pink-200/60 px-2 py-0.5 rounded-full bg-pink-500/10">{m}</span>
            ))}
          </div>
        </div>
        <div className="bg-pink-500/5 border border-pink-500/10 rounded-lg p-2.5">
          <div className="text-[10px] text-pink-400/40 mb-1">🐾 六合生肖</div>
          <span className="text-xs text-pink-200/60 px-2 py-0.5 rounded-full bg-pink-500/10">{bestZodiac}</span>
        </div>
      </div>
    </div>
  );
}

// ===== 5. Health Organ Map =====
function HealthOrganMap({ chart }: { chart: BaziChart }) {
  // Five elements → Five organs mapping
  const organs = [
    { element: "木", organ: "肝/胆", icon: "🫁", position: "left" },
    { element: "火", organ: "心/小肠", icon: "❤️", position: "top" },
    { element: "土", organ: "脾/胃", icon: "🟤", position: "center" },
    { element: "金", organ: "肺/大肠", icon: "🫁", position: "right" },
    { element: "水", organ: "肾/膀胱", icon: "💧", position: "bottom" },
  ];

  const maxEl = Math.max(...Object.values(chart.fiveElements), 1);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5">
        {organs.map(({ element, organ, icon }) => {
          const count = chart.fiveElements[element as keyof typeof chart.fiveElements];
          const strength = count / maxEl;
          const isWeak = count === 0;
          const isStrong = count >= 3;
          const barColor = isWeak ? "#ef4444" : isStrong ? "#22c55e" : chart.elementColors[element];

          return (
            <div key={element} className="text-center">
              <div className="text-lg mb-1">{icon}</div>
              <div className="text-[10px] font-bold" style={{ color: chart.elementColors[element] }}>{element}</div>
              <div className="text-[9px] text-amber-200/30 mb-1">{organ}</div>
              {/* Vertical strength bar */}
              <div className="mx-auto w-3 h-10 bg-white/5 rounded-full overflow-hidden flex flex-col-reverse">
                <div
                  className="w-full rounded-full transition-all duration-1000"
                  style={{ height: `${Math.max(10, strength * 100)}%`, backgroundColor: barColor }}
                />
              </div>
              <div className="text-[8px] mt-0.5" style={{ color: barColor }}>
                {isWeak ? "⚠弱" : isStrong ? "旺" : "中"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-2.5">
        <div className="text-[10px] text-yellow-400/50 mb-1">⚕️ 健康提醒</div>
        <p className="text-[10px] text-amber-200/40 leading-relaxed">
          {(() => {
            const weak = organs.filter(o => chart.fiveElements[o.element as keyof typeof chart.fiveElements] === 0);
            if (weak.length > 0) {
              return `${weak.map(w => `${w.element}行缺失，${w.organ}系统需重点关注`).join("；")}。建议通过饮食和生活习惯补充相应元素。`;
            }
            const min = organs.reduce((a, b) =>
              chart.fiveElements[a.element as keyof typeof chart.fiveElements] <= chart.fiveElements[b.element as keyof typeof chart.fiveElements] ? a : b
            );
            return `${min.element}行最弱，${min.organ}系统相对薄弱，日常注意调养。五行较为均衡，整体身心节奏较稳定。`;
          })()}
        </p>
      </div>
    </div>
  );
}

// ===== 6. Lucky Compass + Color Palette =====
function LuckyCompass({ chart }: { chart: BaziChart }) {
  const rec = ELEMENT_RECOMMENDATIONS[chart.luckyElement];
  if (!rec) return null;

  // Direction mapping for compass
  const dirMap: Record<string, number> = {
    东: 90, 南: 180, 西: 270, 北: 0,
    东南: 135, 西南: 225, 西北: 315, 东北: 45,
    中: -1,
  };

  // Color palette based on lucky element
  const colorPalettes: Record<string, string[]> = {
    木: ["#22c55e", "#15803d", "#86efac", "#047857", "#a7f3d0"],
    火: ["#ef4444", "#dc2626", "#f87171", "#b91c1c", "#fca5a5"],
    土: ["#a3712a", "#92400e", "#d97706", "#78350f", "#fbbf24"],
    金: ["#f5f5f5", "#d4d4d4", "#fbbf24", "#a3a3a3", "#e5e7eb"],
    水: ["#3b82f6", "#1d4ed8", "#60a5fa", "#1e3a8a", "#93c5fd"],
  };
  const palette = colorPalettes[chart.luckyElement] || [];

  // Lucky numbers based on element
  const luckyNums: Record<string, number[]> = {
    木: [3, 8], 火: [2, 7], 土: [5, 10], 金: [4, 9], 水: [1, 6],
  };
  const nums = luckyNums[chart.luckyElement] || [];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        {/* Mini compass */}
        <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
          <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.02)" stroke="rgba(217,169,106,0.15)" strokeWidth="1" />
          <circle cx="40" cy="40" r="24" fill="none" stroke="rgba(217,169,106,0.08)" strokeWidth="0.5" />
          {/* Compass labels */}
          {[
            { label: "北", angle: 0 }, { label: "东", angle: 90 },
            { label: "南", angle: 180 }, { label: "西", angle: 270 },
          ].map(({ label, angle }) => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const x = 40 + 30 * Math.cos(rad);
            const y = 40 + 30 * Math.sin(rad);
            const isLucky = rec.directions.includes(label);
            return (
              <text key={label} x={x} y={y + 3} textAnchor="middle" fontSize="8"
                fill={isLucky ? chart.elementColors[chart.luckyElement] : "rgba(217,169,106,0.2)"}
                fontWeight={isLucky ? "bold" : "normal"}>
                {label}
              </text>
            );
          })}
          {/* Center dot */}
          <circle cx="40" cy="40" r="3" fill={chart.elementColors[chart.luckyElement]} opacity="0.6">
            <animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>

        <div className="flex-1 space-y-2">
          <div>
            <div className="text-[10px] text-amber-200/30 mb-1">🧭 参考方位</div>
            <div className="text-xs text-amber-100/60">{rec.directions}</div>
          </div>
          <div>
            <div className="text-[10px] text-amber-200/30 mb-1">🔢 参考数字</div>
            <div className="flex gap-2">
              {nums.map(n => (
                <span key={n} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: `${chart.elementColors[chart.luckyElement]}22`, color: chart.elementColors[chart.luckyElement] }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Color palette */}
      <div>
        <div className="text-[10px] text-amber-200/30 mb-1.5">🎨 参考色板</div>
        <div className="flex gap-1.5">
          {palette.map((color, i) => (
            <div key={i} className="flex-1 h-6 rounded-md" style={{ backgroundColor: color, opacity: 0.7 + i * 0.05 }} />
          ))}
        </div>
        <div className="text-[10px] text-amber-200/25 mt-1">{rec.colors}</div>
      </div>

      {/* Industries */}
      <div>
        <div className="text-[10px] text-amber-200/30 mb-1">💼 适配行业</div>
        <div className="text-xs text-amber-100/50">{rec.industries}</div>
      </div>
    </div>
  );
}

// ===== Main Export: Enhanced Reading Card =====
export function EnhancedReadingCard({
  icon, title, content, chart, dimension, delay = 0,
}: {
  icon: string;
  title: string;
  content: string;
  chart: BaziChart;
  dimension: "personality" | "career" | "wealth" | "love" | "health" | "advice";
  delay?: number;
}) {
  return (
    <div
      className="relative bg-white/[0.03] border border-amber-400/10 rounded-2xl overflow-hidden group hover:border-amber-400/20 transition-all duration-500"
      style={{ animation: `slideUp 0.6s ease-out ${delay}ms both` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative p-5">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{icon}</span>
          <h3 className="text-amber-300 font-semibold">{title}</h3>
        </div>

        {/* Visual component */}
        <div className="mb-4">
          {dimension === "personality" && <PersonalityQuadrant chart={chart} />}
          {dimension === "career" && <CareerDashboard chart={chart} />}
          {dimension === "wealth" && <WealthTrend chart={chart} />}
          {dimension === "love" && <LoveIndex chart={chart} />}
          {dimension === "health" && <HealthOrganMap chart={chart} />}
          {dimension === "advice" && <LuckyCompass chart={chart} />}
        </div>

        {/* AI text — collapsible */}
        <details className="group/details">
          <summary className="text-[10px] text-amber-200/25 cursor-pointer hover:text-amber-200/40 transition-colors flex items-center gap-1">
            <svg className="w-3 h-3 transition-transform group-open/details:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            AI 详细解读
          </summary>
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-amber-100/60 text-xs leading-relaxed whitespace-pre-line">{content}</p>
          </div>
        </details>
      </div>
    </div>
  );
}
