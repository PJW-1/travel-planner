import { Navigation } from "lucide-react";
import type { PlannerStop } from "@travel/shared";

type TimelineStopCardProps = {
  stop: PlannerStop;
  index: number;
  last: boolean;
};

export function TimelineStopCard({ stop, index, last }: TimelineStopCardProps) {
  return (
    <div className="timeline-stop">
      <div className="timeline-stop__index">{index + 1}</div>
      {!last ? <div className="timeline-stop__line" /> : null}
      <article className="timeline-stop__card">
        <div className="timeline-stop__header">
          <div>
            <h3>{stop.name}</h3>
            <p>{stop.category}</p>
          </div>
          <span>{stop.time}</span>
        </div>
        <div className="timeline-stop__details">
          <span>혼잡도 {stop.congestion}%</span>
          <span>체류 {stop.stayMinutes}분</span>
          {stop.forked ? <span className="status-chip">포크됨</span> : null}
        </div>
      </article>
      {!last ? (
        <div className="timeline-stop__move">
          <Navigation size={12} />
          이동 {stop.travelMinutes}분
        </div>
      ) : null}
    </div>
  );
}
