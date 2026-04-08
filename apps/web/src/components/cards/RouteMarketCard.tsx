import { CalendarDays, GitFork, Heart, MapPin, MessageSquare } from "lucide-react";
import type { CommunityRouteSummary } from "@/lib/contentApi";

type RouteMarketCardProps = {
  route: CommunityRouteSummary;
  selected?: boolean;
  onSelect?: (routeId: string) => void;
};

const emojiMap: Record<CommunityRouteSummary["theme"], string> = {
  urban: "City",
  cafe: "Cafe",
  walking: "Walk",
  coast: "Coast",
};

export function RouteMarketCard({
  route,
  selected = false,
  onSelect,
}: RouteMarketCardProps) {
  return (
    <button
      type="button"
      className={`community-feed-card community-feed-card--${route.theme} ${
        selected ? "community-feed-card--selected" : ""
      }`}
      onClick={() => onSelect?.(route.id)}
    >
      <div className="community-feed-card__hero">
        <span>{emojiMap[route.theme]}</span>
      </div>

      <div className="community-feed-card__content">
        <div className="community-feed-card__tags">
          {route.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>

        <h3>{route.title}</h3>
        <p className="community-feed-card__description">{route.description}</p>

        <div className="community-feed-card__meta">
          <span>
            <MapPin size={14} />
            {route.destination}
          </span>
          <span>
            <CalendarDays size={14} />
            {route.dateRange}
          </span>
        </div>

        <div className="community-feed-card__footer">
          <strong>{route.author}</strong>
          <div className="community-feed-card__stats">
            <span className={route.likedByMe ? "is-active" : ""}>
              <Heart size={14} />
              {route.likes}
            </span>
            <span>
              <MessageSquare size={14} />
              {route.comments}
            </span>
            <span>
              <GitFork size={14} />
              {route.forkCount}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
