import { createClient } from "@/lib/supabase/client";
import OpenAI from "openai";
import type { Database } from "@/lib/supabase/database.types";
import type { HealthAssessment, HealthReading } from "@/lib/types";

type HealthConversation = Database["public"]["Tables"]["health_conversations"]["Row"];

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.MOONSHOT_BASE_URL ?? "https://api.moonshot.cn/v1",
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Authentication required", { status: 401 });
  }

  const { assessmentId, message } = await request.json();
  if (!assessmentId || !message) {
    return new Response("Missing fields", { status: 400 });
  }

  // Get assessment + reading + conversation
  const [assessmentRes, readingRes, convRes] = await Promise.all([
    supabase
      .from("health_assessments")
      .select("*")
      .eq("id", assessmentId)
      .eq("user_id", user.id)
      .single()
      .overrideTypes<HealthAssessment, { merge: false }>(),
    supabase
      .from("health_readings_cache")
      .select("reading")
      .eq("assessment_id", assessmentId)
      .single()
      .overrideTypes<{ reading: HealthReading }, { merge: false }>(),
    supabase
      .from("health_conversations")
      .select("*")
      .eq("assessment_id", assessmentId)
      .single()
      .overrideTypes<HealthConversation, { merge: false }>(),
  ]);

  if (!assessmentRes.data) {
    return new Response("Assessment not found", { status: 404 });
  }

  // Check message limit (3 free)
  const currentCount = convRes.data?.message_count ?? 0;
  if (currentCount >= 3) {
    return new Response(JSON.stringify({ error: "Chat limit reached" }), {
      status: 402,
      headers: { "Content-Type": "application/json" },
    });
  }

  const assessment = assessmentRes.data;
  const reading = readingRes.data?.reading;
  const history = convRes.data?.messages ?? [];

  const systemPrompt = `You are a TCM health advisor. The user has this constitution:
Type: ${assessment.constitution_type}型 (${assessment.constitution_subtype})
Five Elements: 木=${assessment.five_elements_score["木"]}%, 火=${assessment.five_elements_score["火"]}%, 土=${assessment.five_elements_score["土"]}%, 金=${assessment.five_elements_score["金"]}%, 水=${assessment.five_elements_score["水"]}%
${reading ? `Full reading summary: ${JSON.stringify(reading.summary)}` : ""}

Answer their health questions based on their constitution. Be specific, practical, and reference TCM principles. Reply in the same language the user writes in. Keep answers concise (under 200 words).`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const stream = await client.chat.completions.create({
    model: process.env.MOONSHOT_MODEL ?? "moonshot-v1-8k",
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: true,
  });

  let fullResponse = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        fullResponse += text;
        controller.enqueue(new TextEncoder().encode(text));
      }

      // Save conversation (non-blocking)
      const updatedMessages = [
        ...history,
        { role: "user", content: message, ts: Date.now() },
        { role: "assistant", content: fullResponse, ts: Date.now() },
      ];
      const newCount = updatedMessages.filter((m: { role: string }) => m.role === "user").length;

      if (convRes.data) {
        supabase
          .from("health_conversations")
          .update({ messages: updatedMessages, message_count: newCount, updated_at: new Date().toISOString() })
          .eq("assessment_id", assessmentId);
      } else {
        supabase
          .from("health_conversations")
          .insert({ assessment_id: assessmentId, user_id: user.id, messages: updatedMessages, message_count: newCount });
      }

      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
  });
}
