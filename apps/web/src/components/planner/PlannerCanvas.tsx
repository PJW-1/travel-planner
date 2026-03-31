import type { PlannerStop } from "@travel/shared";

type PlannerCanvasProps = {
  stops: PlannerStop[];
  summary: {
    totalDistanceKm: number;
    totalTravelMinutes: number;
    optimizationScore: number;
  };
};

function formatTravelTime(totalTravelMinutes: number) {
  const hours = Math.floor(totalTravelMinutes / 60);
  const minutes = totalTravelMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function PlannerCanvas({ stops, summary }: PlannerCanvasProps) {
  return (
    <section className="planner-canvas">
      <div className="planner-canvas__pattern" />
      <div className="planner-summary">
        <div>
          <span>총 이동 거리</span>
          <strong>{summary.totalDistanceKm.toFixed(1)}km</strong>
        </div>
        <div>
          <span>예상 이동 시간</span>
          <strong>{formatTravelTime(summary.totalTravelMinutes)}</strong>
        </div>
        <div>
          <span>동선 점수</span>
          <strong>{summary.optimizationScore}/100</strong>
        </div>
      </div>

      {stops.map((stop) => (
        <article
          key={stop.id}
          className={`map-node map-node--${stop.categoryKey}`}
          style={{ left: `${stop.position.x}%`, top: `${stop.position.y}%` }}
        >
          <strong>{stop.name}</strong>
          <span>{stop.time}</span>
        </article>
      ))}
    </section>
  );
}
