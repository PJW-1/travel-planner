import { MapPin, Navigation } from "lucide-react";

type JourneyAnchorCardProps = {
  title: string;
  address?: string;
  index?: number | string;
  showConnector?: boolean;
  moveModeLabel?: string | null;
  moveMinutes?: number;
};

export function JourneyAnchorCard({
  title,
  address = "",
  index = "S",
  showConnector = false,
  moveModeLabel = null,
  moveMinutes = 0,
}: JourneyAnchorCardProps) {
  return (
    <div className="timeline-stop">
      <div className="timeline-stop__index timeline-stop__index--anchor">{index}</div>
      {showConnector ? <div className="timeline-stop__line" /> : null}

      <article className="timeline-stop__card timeline-stop__card--anchor">
        <div className="timeline-stop__header">
          <div>
            <h3>{title}</h3>
            <p>출발지</p>
          </div>
          <span>고정</span>
        </div>

        <div className="timeline-stop__details">
          {address ? <span>{address}</span> : null}
          <span className="status-chip status-chip--anchor">
            <MapPin size={12} />
            최적화 시작점
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
