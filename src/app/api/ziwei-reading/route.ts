import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAuthUser } from "@/lib/supabase/auth-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getZiweiChartHash, type ZiweiChart, type ZiweiKeyPalace } from "@/lib/ziwei";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

const roleLabel: Record<ZiweiKeyPalace["role"], string> = {
  self: "命宫/自我底色",
  career: "官禄/事业节奏",
  wealth: "财帛/资源模式",
  relationship: "夫妻/关系沟通",
};

export async function POST(request: Request) {
  try {
    const { user, telegramUser } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { allowed } = checkRateLimit(`ziwei:${user.id}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const { chart } = await request.json() as { chart?: ZiweiChart };
    if (!chart?.palaces?.length) {
      return NextResponse.json({ error: "Missing Ziwei chart data" }, { status: 400 });
    }

    const chartHash = getZiweiChartHash(chart);
    const supabase = getSupabaseAdmin();

    if (supabase) {
      const { data: cached } = await supabase
        .from("readings_cache")
        .select("reading")
        .eq("chart_hash", chartHash)
        .single();

      if (cached?.reading) {
        return NextResponse.json(cached.reading);
      }

      const orderQuery = telegramUser
        ? supabase.from("orders").select("id").eq("telegram_user_id", telegramUser.telegramUserId).eq("status", "paid").limit(1)
        : supabase.from("orders").select("id").eq("user_id", user.id).eq("status", "paid").limit(1);
      const subscriptionQuery = telegramUser
        ? Promise.resolve({ data: [] })
        : supabase.from("subscriptions").select("id").eq("user_id", user.id).eq("status", "active").limit(1);
      const [orderResult, subResult] = await Promise.all([orderQuery, subscriptionQuery]);
      const hasPaidOrder = (orderResult.data?.length ?? 0) > 0;
      const hasActiveSub = (subResult.data?.length ?? 0) > 0;

      const { data: profile } = telegramUser
        ? { data: null }
        : await supabase
          .from("profiles")
          .select("free_readings")
          .eq("id", user.id)
          .single();
      const hasFreeReading = (profile?.free_readings ?? 0) > 0;

      if (!hasPaidOrder && !hasActiveSub && !hasFreeReading) {
        return NextResponse.json({ error: "Payment required" }, { status: 402 });
      }

      if (!hasPaidOrder && !hasActiveSub && hasFreeReading) {
        await supabase
          .from("profiles")
          .update({ free_readings: (profile?.free_readings ?? 1) - 1 })
          .eq("id", user.id);
      }
    }

    const prompt = buildZiweiPrompt(chart);
    const completion = await client.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content: "你是精通紫微斗数、东方哲学与现代心理沟通的 AI 洞察顾问。你只基于用户给出的命盘事实输出自我观察和行动建议，不承诺命运、财富、桃花、医疗或投资结果。严格返回 JSON。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.72,
      max_tokens: 3600,
    });

    const content = completion.choices[0]?.message?.content || "";
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = { error: "AI 返回格式异常，请重试" };
    }

    if (supabase && !parsed.error) {
      supabase
        .from("readings_cache")
        .upsert(
          {
            chart_hash: chartHash,
            chart_summary: {
              system: "ziwei",
              solarDate: chart.solarDate,
              gender: chart.gender,
              lifePalace: chart.lifePalace,
              bodyPalace: chart.bodyPalace,
              soulStar: chart.soulStar,
            },
            reading: parsed,
            tier: "pro",
          },
          { onConflict: "chart_hash" }
        )
        .then(({ error }: { error: unknown }) => {
          if (error) console.error("Failed to cache Ziwei reading:", error);
        });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Ziwei reading error:", error);
    return NextResponse.json({ error: "服务暂时不可用，请稍后重试" }, { status: 500 });
  }
}

function buildZiweiPrompt(chart: ZiweiChart): string {
  const keyPalaces = chart.keyPalaces
    .map((palace) => {
      const major = palace.majorStars.map((star) => `${star.name}${star.brightness ? `(${star.brightness})` : ""}${star.mutagen ? `化${star.mutagen}` : ""}`).join("、") || "无主星";
      const minor = palace.minorStars.slice(0, 8).map((star) => `${star.name}${star.mutagen ? `化${star.mutagen}` : ""}`).join("、") || "无";
      return `${roleLabel[palace.role]}：${palace.name}，主星：${major}，辅星：${minor}，大限：${palace.decadalRange} ${palace.decadalStem}${palace.decadalBranch}`;
    })
    .join("\n");

  const allPalaces = chart.palaces
    .map((palace) => {
      const major = palace.majorStars.map((star) => star.name).join("、") || "无主星";
      return `${palace.name}(${palace.heavenlyStem}${palace.earthlyBranch})：${major}`;
    })
    .join("\n");

  const cycles = chart.decadalCycles
    .slice(0, 10)
    .map((cycle) => `${cycle.range}岁：${cycle.palaceName} ${cycle.heavenlyStem}${cycle.earthlyBranch}`)
    .join("\n");

  return `请基于以下紫微斗数命盘事实，生成一份现代化 AI 紫微洞察报告。

## 基本信息
公历：${chart.solarDate}
农历：${chart.lunarDate}
四柱：${chart.fourPillars}
时辰：${chart.time}（${chart.timeRange}）
性别：${chart.gender === "male" ? "男" : "女"}
生肖/星座：${chart.zodiac} / ${chart.westernZodiac}
五行局：${chart.fiveElementsClass}
命宫：${chart.lifePalace}
身宫：${chart.bodyPalace}
命主：${chart.soulStar}
身主：${chart.bodyStar}

## 关键宫位
${keyPalaces}

## 十二宫
${allPalaces}

## 大限周期
${cycles}

## 输出要求
1. 每个判断必须引用具体命盘事实，例如某宫、某星、某个大限周期。
2. 把传统术语翻译成现代人能用的自我观察、关系沟通、事业节奏和行动建议。
3. 不要承诺命运、财富、感情结果、医疗结论或投资收益。
4. 只返回 JSON，不要任何 JSON 外文字。

JSON 格式：
{
  "overview": "全盘总览，说明命宫/身宫/命主身主形成的核心气质，250-350字",
  "career": "事业节奏，围绕官禄宫、命宫和相关大限给建议，220-320字",
  "wealth": "资源策略，围绕财帛宫和福德/田宅等资源主题给生活建议，220-320字",
  "relationship": "关系沟通，围绕夫妻宫及沟通边界给建议，220-320字",
  "cycles": "大限周期提醒，说明当前或近期可观察的人生主题，220-320字",
  "actionItems": "5条本月行动清单，每条格式为「领域：具体行动」"
}`;
}
