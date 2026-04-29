import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import OpenAI from "openai";
import type { HealthAssessment, HealthReading } from "@/lib/types";

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.MOONSHOT_BASE_URL ?? "https://api.moonshot.cn/v1",
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { assessmentId } = await request.json();
  if (!assessmentId) {
    return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });
  }

  // Check cache
  const { data: cached } = await supabase
    .from("health_readings_cache")
    .select("reading")
    .eq("assessment_id", assessmentId)
    .single()
    .overrideTypes<{ reading: HealthReading }, { merge: false }>();

  if (cached?.reading) {
    return NextResponse.json(cached.reading);
  }

  // Check payment: health report purchase OR active subscription
  const [orderResult, subResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .eq("tier", "health")
      .eq("status", "paid")
      .limit(1),
    supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1),
  ]);

  if (!orderResult.data?.length && !subResult.data?.length) {
    return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }

  // Get assessment
  const { data: assessment } = await supabase
    .from("health_assessments")
    .select("*")
    .eq("id", assessmentId)
    .eq("user_id", user.id)
    .single()
    .overrideTypes<HealthAssessment, { merge: false }>();

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const locale = request.headers.get("x-locale") ?? "en";
  const localeName = { zh: "中文", en: "English", th: "ภาษาไทย", vi: "Tiếng Việt", id: "Bahasa Indonesia" }[locale] ?? "English";

  const prompt = `You are a traditional Chinese medicine (TCM) health advisor. Based on the following constitution assessment, generate a personalized health report.

Constitution: ${assessment.constitution_type}型 (${assessment.constitution_subtype})
${assessment.secondary_type ? `Secondary: ${assessment.secondary_type}` : ""}
Five Elements Distribution: 木=${assessment.five_elements_score["木"]}%, 火=${assessment.five_elements_score["火"]}%, 土=${assessment.five_elements_score["土"]}%, 金=${assessment.five_elements_score["金"]}%, 水=${assessment.five_elements_score["水"]}%

Respond in valid JSON with these fields:
- "organHealth": array of 5 objects { "organ": "Chinese organ name / English name", "element": "元素", "status": "strong"|"balanced"|"weak"|"excess", "description": "brief explanation in ${localeName}" }
  Organs: 心/小肠 Heart, 肝/胆 Liver, 脾/胃 Spleen, 肺/大肠 Lungs, 肾/膀胱 Kidneys
- "dietTherapy": { "recommended": [{ "name": "Chinese name", "nameLocal": "name in ${localeName}" }], "avoid": [{ "name": "Chinese name", "nameLocal": "name in ${localeName}" }] } — 6 items each
- "seasonalWellness": array of 4 objects { "season": "Spring|Summer|Autumn|Winter", "advice": "2-3 sentences in ${localeName}" }
- "lifestyle": "2-3 paragraph lifestyle advice in ${localeName}"
- "warnings": ["specific health warning 1", "warning 2"] — in ${localeName}, max 3
- "summary": "one-paragraph overall summary in ${localeName}"

Be specific to this constitution type. Reference classical TCM texts where appropriate. Keep food names in BOTH Chinese and ${localeName}.`;

  const completion = await client.chat.completions.create({
    model: process.env.MOONSHOT_MODEL ?? "moonshot-v1-8k",
    messages: [
      { role: "system", content: "You are a TCM health advisor. Always respond with valid JSON only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let reading;
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    reading = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // Cache (non-blocking)
  supabase.from("health_readings_cache").upsert({ assessment_id: assessmentId, reading });

  return NextResponse.json(reading);
}
