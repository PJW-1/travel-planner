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

  if (hours === 0) {
    return `${minutes}분`;
  }

  return `${hours}시간 ${minutes}분`;
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

      {stops.length === 0 ? (
        <div className="planner-canvas__empty">
          <strong>아직 배치된 장소가 없습니다.</strong>
          <p>오른쪽 편집 카드에서 장소를 추가하면 지도 위 노드와 동선 요약이 바로 반영됩니다.</p>
        </div>
      ) : null}

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
