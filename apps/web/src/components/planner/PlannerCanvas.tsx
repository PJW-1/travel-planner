import type { PlannerStop } from "@travel/shared";

type PlannerCanvasProps = {
  stops: PlannerStop[];
};

export function PlannerCanvas({ stops }: PlannerCanvasProps) {
  return (
    <section className="planner-canvas">
      <div className="planner-canvas__pattern" />
      <div className="planner-summary">
        <div>
          <span>총 이동 거리</span>
          <strong>14.8km</strong>
        </div>
        <div>
          <span>예상 이동 시간</span>
          <strong>1h 25m</strong>
        </div>
        <div>
          <span>동선 점수</span>
          <strong>92/100</strong>
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
