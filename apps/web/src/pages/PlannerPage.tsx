import { useEffect, useState } from "react";
import { CalendarRange, Sparkles } from "lucide-react";
import type { PlannerStop, TripConfig } from "@travel/shared";
import { PageHeader } from "@/components/PageHeader";
import { InsightPanel } from "@/components/planner/InsightPanel";
import { PlannerCanvas } from "@/components/planner/PlannerCanvas";
import { TimelineStopCard } from "@/components/planner/TimelineStopCard";
import { fetchPlannerOverview } from "@/lib/contentApi";

type PlannerInsight = {
  iconKey: "footprints" | "clock";
  title: string;
  description: string;
};

type PlannerSummary = {
  totalDistanceKm: number;
  totalTravelMinutes: number;
  optimizationScore: number;
};

export function PlannerPage() {
  const [tripConfig, setTripConfig] = useState<TripConfig>({
    destination: "서울",
    days: 3,
    lunchTime: "12:00",
    dinnerTime: "18:30",
    tags: ["감성", "맛집", "도보 여행"],
  });
  const [stops, setStops] = useState<PlannerStop[]>([]);
  const [summary, setSummary] = useState<PlannerSummary>({
    totalDistanceKm: 14.8,
    totalTravelMinutes: 85,
    optimizationScore: 92,
  });
  const [insights, setInsights] = useState<PlannerInsight[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadPlannerOverview() {
      try {
        const data = await fetchPlannerOverview();

        if (!isMounted) {
          return;
        }

        setTripConfig(data.tripConfig);
        setStops(data.stops);
        setSummary(data.summary);
        setInsights(data.insights);
      } catch {
        if (!isMounted) {
          return;
        }

        setStops([]);
        setInsights([]);
      }
    }

    void loadPlannerOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="planner-page">
      <PageHeader
        eyebrow="동선 최적화"
        title={`${tripConfig.destination} 여행 1일차`}
        description="장소 순서를 조정하고, 포크한 루트를 합치고, 이동 피로도와 일정 여유까지 한 화면에서 확인하는 메인 작업 공간입니다."
        actions={
          <>
            <button className="button button--secondary">
              <CalendarRange size={16} />
              날짜 전환
            </button>
            <button className="button button--primary">
              <Sparkles size={16} />
              AI 일정표
            </button>
          </>
        }
      />

      <div className="planner-layout">
        <section className="planner-sidebar">
          <div className="planner-sidebar__top">
            <span className="status-chip">최적화 모드</span>
            <div className="day-switcher">
              {Array.from({ length: tripConfig.days }, (_, index) => index + 1).map((day) => (
                <button key={day} className={day === 1 ? "is-active" : ""}>
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="planner-sidebar__list">
            {stops.map((stop, index) => (
              <TimelineStopCard
                key={stop.id}
                stop={stop}
                index={index}
                last={index === stops.length - 1}
              />
            ))}
          </div>

          <InsightPanel insights={insights} />
        </section>

        <PlannerCanvas stops={stops} summary={summary} />
      </div>
    </div>
  );
}
