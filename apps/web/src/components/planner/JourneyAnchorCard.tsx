import { MapPin } from "lucide-react";

type JourneyAnchorCardProps = {
  title: string;
  address?: string;
  index?: number;
  showConnector?: boolean;
};

export function JourneyAnchorCard({
  title,
  address = "",
  index = 0,
  showConnector = false,
}: JourneyAnchorCardProps) {
  return (
    <div className="timeline-stop">
      <div className="timeline-stop__index timeline-stop__index--anchor">{index + 1}</div>
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
    </div>
  );
}
