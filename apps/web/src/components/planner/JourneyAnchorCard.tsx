import type { CSSProperties } from "react";
import { MapPin, Navigation } from "lucide-react";
import type { DayAccent } from "@/lib/dayAccent";

type JourneyAnchorCardProps = {
  title: string;
  address?: string;
  index?: number | string;
  showConnector?: boolean;
  moveModeLabel?: string | null;
  moveMinutes?: number;
  accent?: DayAccent | null;
  label?: string;
  statusLabel?: string;
  chipLabel?: string;
};

export function JourneyAnchorCard({
  title,
  address = "",
  index = "S",
  showConnector = false,
  moveModeLabel = null,
  moveMinutes = 0,
  accent = null,
  label = "출발지",
  statusLabel = "고정",
  chipLabel = "최적화 시작점",
}: JourneyAnchorCardProps) {
  const style = {
    "--timeline-accent": accent?.solid ?? "#1d4ed8",
    "--timeline-accent-deep": accent?.deep ?? "#0f766e",
    "--timeline-soft": accent?.soft ?? "rgba(219, 234, 254, 0.22)",
    "--timeline-border": accent?.border ?? "rgba(27, 31, 35, 0.06)",
    "--timeline-glow": accent?.glow ?? "rgba(37, 99, 235, 0.16)",
  } as CSSProperties;

  return (
    <div className="timeline-stop" style={style}>
      <div className="timeline-stop__index timeline-stop__index--anchor">{index}</div>
      {showConnector ? <div className="timeline-stop__line" /> : null}

      <article className="timeline-stop__card timeline-stop__card--anchor">
        <div className="timeline-stop__header">
          <div>
            <h3>{title}</h3>
            <p>{label}</p>
          </div>
          <span>{statusLabel}</span>
        </div>

        <div className="timeline-stop__details">
          {address ? <span>{address}</span> : null}
          <span className="status-chip status-chip--anchor">
            <MapPin size={12} />
            {chipLabel}
          </span>
        </div>
      </article>

      {showConnector ? (
        <div className="timeline-stop__move">
          <Navigation size={12} />
          {moveModeLabel ? `${moveModeLabel} · ` : ""}
          이동 {moveMinutes}분
        </div>
      ) : null}
    </div>
  );
}
