import { Navigation, PencilLine, Trash2 } from "lucide-react";
import type { PlannerStop } from "@travel/shared";

type TimelineStopCardProps = {
  stop: PlannerStop;
  index: number | string;
  last: boolean;
  moveModeLabel?: string | null;
  onEdit?: (stop: PlannerStop) => void;
  onDelete?: (stop: PlannerStop) => void;
  onOpenDetail?: (stop: PlannerStop) => void;
  editing?: boolean;
  draggable?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
  onDragStart?: (stop: PlannerStop) => void;
  onDragOver?: (stop: PlannerStop) => void;
  onDrop?: (stop: PlannerStop) => void;
  onDragEnd?: () => void;
};

export function TimelineStopCard({
  stop,
  index,
  last,
  moveModeLabel = null,
  onEdit,
  onDelete,
  onOpenDetail,
  editing = false,
  draggable = false,
  dragging = false,
  dropTarget = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TimelineStopCardProps) {
  return (
    <div className="timeline-stop">
      <div className="timeline-stop__index">{index}</div>
      {!last ? <div className="timeline-stop__line" /> : null}
      <article
        className={[
          "timeline-stop__card",
          editing ? "is-editing" : "",
          draggable ? "is-draggable" : "",
          dragging ? "is-dragging" : "",
          dropTarget ? "is-drop-target" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        draggable={draggable}
        onDragStart={() => onDragStart?.(stop)}
        onDragOver={(event) => {
          if (!draggable) {
            return;
          }
          event.preventDefault();
          onDragOver?.(stop);
        }}
        onDrop={(event) => {
          if (!draggable) {
            return;
          }
          event.preventDefault();
          onDrop?.(stop);
        }}
        onDragEnd={onDragEnd}
      >
        <div className="timeline-stop__header">
          <div>
            <h3>{stop.name}</h3>
            <p>{stop.category}</p>
          </div>
          <div className="timeline-stop__header-actions">
            {onOpenDetail ? (
              <button
                type="button"
                className="timeline-stop__ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDetail(stop);
                }}
              >
                상세 보기
              </button>
            ) : null}
            <span>{stop.time}</span>
          </div>
        </div>

        <div className="timeline-stop__details">
          {stop.address ? <span>{stop.address}</span> : null}
          <span>혼잡도 {stop.congestion}%</span>
          <span>체류 {stop.stayMinutes}분</span>
          {stop.distanceKm ? <span>이동 {stop.distanceKm.toFixed(1)}km</span> : null}
          {stop.forked ? <span className="status-chip">포크</span> : null}
        </div>

        {onEdit || onDelete ? (
          <div className="timeline-stop__actions">
            {onEdit ? (
              <button type="button" onClick={() => onEdit(stop)}>
                <PencilLine size={14} />
                수정
              </button>
            ) : null}
            {onDelete ? (
              <button type="button" className="is-danger" onClick={() => onDelete(stop)}>
                <Trash2 size={14} />
                삭제
              </button>
            ) : null}
          </div>
        ) : null}
      </article>

      {!last ? (
        <div className="timeline-stop__move">
          <Navigation size={12} />
          {moveModeLabel ? `${moveModeLabel} · ` : ""}
          이동 {stop.travelMinutes}분
        </div>
      ) : null}
    </div>
  );
}
