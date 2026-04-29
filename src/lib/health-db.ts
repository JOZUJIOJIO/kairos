import { createClient } from "./supabase/client";
import type { HealthAssessment, HealthReading, ConstitutionResult } from "./types";
import type { QuizAnswer } from "./types";
import type { Database } from "./supabase/database.types";

type HealthConversation = Database["public"]["Tables"]["health_conversations"]["Row"];

const supabase = () => createClient();

export async function saveAssessment(
  userId: string,
  answers: QuizAnswer[],
  result: ConstitutionResult,
  baziChartHash: string | null
): Promise<string | null> {
  const { data, error } = await supabase()
    .from("health_assessments")
    .insert({
      user_id: userId,
      answers,
      constitution_type: result.elementType,
      constitution_subtype: result.constitutionType,
      secondary_type: result.secondaryType,
      five_elements_score: result.fiveElements,
      nine_constitutions_score: result.nineScores,
      bazi_chart_hash: baziChartHash,
    })
    .select("id")
    .single()
    .overrideTypes<{ id: string }, { merge: false }>();

  if (error) {
    console.error("saveAssessment error:", error);
    return null;
  }
  return data.id;
}

export async function getAssessment(id: string): Promise<HealthAssessment | null> {
  const { data, error } = await supabase()
    .from("health_assessments")
    .select("*")
    .eq("id", id)
    .single()
    .overrideTypes<HealthAssessment, { merge: false }>();

  if (error) return null;
  return data;
}

export async function getCachedReading(assessmentId: string): Promise<HealthReading | null> {
  const { data, error } = await supabase()
    .from("health_readings_cache")
    .select("reading")
    .eq("assessment_id", assessmentId)
    .single()
    .overrideTypes<{ reading: HealthReading }, { merge: false }>();

  if (error) return null;
  return data.reading as HealthReading;
}

export async function saveReading(assessmentId: string, reading: HealthReading): Promise<void> {
  await supabase()
    .from("health_readings_cache")
    .upsert({ assessment_id: assessmentId, reading });
}

export async function getConversation(assessmentId: string) {
  const { data, error } = await supabase()
    .from("health_conversations")
    .select("*")
    .eq("assessment_id", assessmentId)
    .single()
    .overrideTypes<HealthConversation, { merge: false }>();

  if (error) return null;
  return data;
}

export async function appendMessage(
  assessmentId: string,
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<number> {
  const conv = await getConversation(assessmentId);
  const messages = conv?.messages ?? [];
  messages.push({ role, content, ts: Date.now() });
  const count = messages.filter((m: { role: string }) => m.role === "user").length;

  if (conv) {
    await supabase()
      .from("health_conversations")
      .update({ messages, message_count: count, updated_at: new Date().toISOString() })
      .eq("assessment_id", assessmentId);
  } else {
    await supabase()
      .from("health_conversations")
      .insert({ assessment_id: assessmentId, user_id: userId, messages, message_count: count });
  }
  return count;
}

export async function getUserAssessments(userId: string): Promise<HealthAssessment[]> {
  const { data, error } = await supabase()
    .from("health_assessments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .overrideTypes<HealthAssessment[], { merge: false }>();

  if (error) return [];
  return data ?? [];
}
