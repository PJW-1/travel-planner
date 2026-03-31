import { CalendarRange, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InsightPanel } from "@/components/planner/InsightPanel";
import { PlannerCanvas } from "@/components/planner/PlannerCanvas";
import { TimelineStopCard } from "@/components/planner/TimelineStopCard";
import { plannerStops, tripConfig } from "@/data/mockData";

export function PlannerPage() {
  return (
    <div className="planner-page">
      <PageHeader
        eyebrow="동선 최적화"
        title={`${tripConfig.destination} 여행 1일차`}
        description="장소 순서를 조정하고, 포크한 루트를 합치고, 이동 피로도와 혼잡도까지 한 화면에서 확인하는 메인 작업 공간입니다."
        actions={
          <>
            <button className="button button--secondary">
              <CalendarRange size={16} />
              날짜 전환
            </button>
            <button className="button button--primary">
              <Sparkles size={16} />
              AI 재정렬
            </button>
          </>
        }
      />

      <div className="planner-layout">
        <section className="planner-sidebar">
          <div className="planner-sidebar__top">
            <span className="status-chip">최적화 모드</span>
            <div className="day-switcher">
              {[1, 2, 3].map((day) => (
                <button key={day} className={day === 1 ? "is-active" : ""}>
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="planner-sidebar__list">
            {plannerStops.map((stop, index) => (
              <TimelineStopCard
                key={stop.id}
                stop={stop}
                index={index}
                last={index === plannerStops.length - 1}
              />
            ))}
          </div>

          <InsightPanel />
        </section>

        <PlannerCanvas stops={plannerStops} />
      </div>
    </div>
  );
}
