import { GitFork, Heart, MessageSquare } from "lucide-react";
import type { MarketRoute } from "@travel/shared";

type RouteMarketCardProps = {
  route: MarketRoute;
};

const emojiMap: Record<MarketRoute["theme"], string> = {
  urban: "🏙️",
  cafe: "☕",
  walking: "🚶",
  coast: "🌊",
};

export function RouteMarketCard({ route }: RouteMarketCardProps) {
  return (
    <article className={`route-card route-card--${route.theme}`}>
      <div className="route-card__hero">
        <span>{emojiMap[route.theme]}</span>
      </div>
      <div className="route-card__content">
        <div className="route-card__tags">
          {route.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>
        <h3>{route.title}</h3>
        <p className="route-card__author">{route.author} 님의 루트</p>
        <div className="route-card__meta">
          <span>
            <Heart size={14} />
            {route.likes}
          </span>
          <span>
            <MessageSquare size={14} />
            {route.comments}
          </span>
          <button>
            루트 가져오기
            <GitFork size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
