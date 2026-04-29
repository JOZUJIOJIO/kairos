"use client";

import { useState, useEffect, use } from "react";
import { useLocale } from "@/lib/LocaleContext";
import { useAuth } from "@/lib/supabase/auth-context";
import { createClient } from "@/lib/supabase/client";
import ConstitutionBadge from "@/components/health/ConstitutionBadge";
import OrganHealthMap from "@/components/health/OrganHealthMap";
import DietCard from "@/components/health/DietCard";
import SeasonalCalendar from "@/components/health/SeasonalCalendar";
import HealthChat from "@/components/health/HealthChat";
import RadarChart from "@/components/RadarChart";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import type { HealthAssessment, HealthReading } from "@/lib/types";

const ELEMENT_COLORS: Record<string, { color: string; emoji: string }> = {
  "木": { color: "#22c55e", emoji: "🌿" },
  "火": { color: "#ef4444", emoji: "🔥" },
  "土": { color: "#eab308", emoji: "🏔️" },
  "金": { color: "#94a3b8", emoji: "⚔️" },
  "水": { color: "#3b82f6", emoji: "💧" },
};

export default function HealthReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<HealthAssessment | null>(null);
  const [reading, setReading] = useState<HealthReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatUsed, setChatUsed] = useState(0);
  const { user } = useAuth();
  const { locale, t } = useLocale();

  useEffect(() => {
    if (!user) return;

    async function loadReport() {
      const supabase = createClient();

      // Load assessment
      const { data: assess } = await supabase
        .from("health_assessments")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single()
        .overrideTypes<HealthAssessment, { merge: false }>();

      if (!assess) {
        setError("Report not found");
        setLoading(false);
        return;
      }
      setAssessment(assess);

      // Load or generate reading
      const res = await fetch("/api/health/reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ assessmentId: id }),
      });

      if (res.status === 402) {
        setError("Payment required");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Failed to load report");
        setLoading(false);
        return;
      }

      const readingData = await res.json();
      setReading(readingData);

      // Load chat usage
      const { data: conv } = await supabase
        .from("health_conversations")
        .select("message_count")
        .eq("assessment_id", id)
        .single();
      setChatUsed(conv?.message_count ?? 0);

      setLoading(false);
    }

    loadReport();
  }, [id, user, locale]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0814] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🌿</div>
          <p className="text-amber-200/50 text-sm">
            {locale === "zh" ? "正在生成你的健康报告..." : "Generating your health report..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !assessment || !reading) {
    return (
      <div className="min-h-screen bg-[#0a0814] flex items-center justify-center">
        <p className="text-red-400 text-sm">{error || "Something went wrong"}</p>
      </div>
    );
  }

  const radarData = (["木", "火", "土", "金", "水"] as const).map((el) => ({
    label: el,
    value: assessment.five_elements_score[el] / 20, // Scale 0-100 → 0-5
    color: ELEMENT_COLORS[el].color,
    emoji: ELEMENT_COLORS[el].emoji,
  }));

  return (
    <div className="min-h-screen bg-[#0a0814]">
      <PageHeader title={t("health.title")} href="/health" />

      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Section 1: Constitution Badge */}
        <div className="py-6 border-b border-amber-400/10">
          <ConstitutionBadge
            elementType={assessment.constitution_type}
            constitutionType={assessment.constitution_subtype}
            secondaryType={assessment.secondary_type}
            isChinese={locale === "zh"}
          />
          <p className="text-xs text-amber-200/40 text-center mt-4 max-w-sm mx-auto leading-relaxed">
            {reading.summary}
          </p>
        </div>

        {/* Section 2: Five Elements Radar */}
        <div className="border-b border-amber-400/10 pb-8">
          <h3 className="text-sm font-semibold text-amber-100 mb-4">
            ⬠ {t("health.report.elements")}
          </h3>
          <div className="flex justify-center">
            <RadarChart data={radarData} size={220} maxValue={5} />
          </div>
        </div>

        {/* Section 3: Organ Health Map */}
        <div className="border-b border-amber-400/10 pb-8">
          <OrganHealthMap organs={reading.organHealth} />
        </div>

        {/* Section 4: Diet Therapy */}
        <div className="border-b border-amber-400/10 pb-8">
          <DietCard diet={reading.dietTherapy} />
        </div>

        {/* Section 5: Seasonal Wellness */}
        <div className="border-b border-amber-400/10 pb-8">
          <SeasonalCalendar seasons={reading.seasonalWellness} />
        </div>

        {/* Section 6: BaZi Enhancement (if available) */}
        {assessment.bazi_chart_hash && (
          <div className="border-b border-amber-400/10 pb-8">
            <h3 className="text-sm font-semibold text-amber-100 mb-2">
              ☯ {t("health.report.enhanced")}
            </h3>
            <p className="text-xs text-amber-200/40 leading-relaxed">
              {reading.lifestyle}
            </p>
          </div>
        )}

        {/* Section 7: AI Chat */}
        <div className="pb-8">
          <HealthChat assessmentId={id} usedCount={chatUsed} maxFree={3} />
        </div>

        {/* Disclaimer */}
        <div className="text-center pb-20">
          <p className="text-[10px] text-amber-200/15 max-w-sm mx-auto">
            {t("health.disclaimer")}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
