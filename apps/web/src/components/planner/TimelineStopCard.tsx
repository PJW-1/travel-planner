import type { CSSProperties } from "react";
import { Navigation, PencilLine, Trash2 } from "lucide-react";
import type { PlannerStop } from "@travel/shared";
import type { DayAccent } from "@/lib/dayAccent";

type TimelineStopCardProps = {
  stop: PlannerStop;
  index: number | string;
  last: boolean;
  moveModeLabel?: string | null;
  parkingHint?: string | null;
  accent?: DayAccent | null;
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
  parkingHint = null,
  accent = null,
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
  const style = {
    "--timeline-accent": accent?.solid ?? "#0f172a",
    "--timeline-accent-deep": accent?.deep ?? "#1d4ed8",
    "--timeline-soft": accent?.soft ?? "rgba(219, 234, 254, 0.22)",
    "--timeline-border": accent?.border ?? "rgba(27, 31, 35, 0.06)",
    "--timeline-glow": accent?.glow ?? "rgba(15, 23, 42, 0.08)",
  } as CSSProperties;

  return (
    <div className="timeline-stop" style={style}>
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
          <span>체류 {stop.stayMinutes}분</span>
          {stop.distanceKm ? <span>이동 {stop.distanceKm.toFixed(1)}km</span> : null}
          {stop.forked ? <span className="status-chip">포크</span> : null}
          {parkingHint ? <span className="status-chip">{parkingHint}</span> : null}
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
