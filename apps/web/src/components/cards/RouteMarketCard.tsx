import { CalendarDays, GitFork, Heart, MapPin, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import type { CommunityRouteSummary } from "@/lib/contentApi";

type RouteMarketCardProps = {
  route: CommunityRouteSummary;
};

const imageSets: Record<CommunityRouteSummary["theme"], string[]> = {
  urban: [
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=900&q=80",
  ],
  cafe: [
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80",
  ],
  walking: [
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
  ],
  coast: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  ],
};

export function RouteMarketCard({ route }: RouteMarketCardProps) {
  const images = imageSets[route.theme];

  return (
    <article className="community-post-card">
      <div className="community-post-card__header">
        <div className="community-post-card__avatar">{route.author.slice(0, 1)}</div>
        <div className="community-post-card__author">
          <h3>{route.title}</h3>
          <p>
            {route.author}의 일정 · {route.days}박 {route.days + 1}일
          </p>
        </div>
      </div>

      <Link to={`/community/${route.id}`} className="community-post-card__gallery">
        <div className="community-post-card__gallery-main">
          <img src={images[0]} alt={route.title} loading="lazy" />
        </div>
        <div className="community-post-card__gallery-side">
          {images.slice(1).map((image, index) => (
            <div key={`${route.id}-${index}`} className="community-post-card__gallery-tile">
              <img src={image} alt={route.title} loading="lazy" />
            </div>
          ))}
        </div>
      </Link>

      <div className="community-post-card__body">
        <div className="community-post-card__meta">
          <span>
            <MapPin size={14} />
            {route.destination}
          </span>
          <span>
            <CalendarDays size={14} />
            {route.dateRange}
          </span>
        </div>

        <p>{route.description}</p>

        <div className="community-post-card__footer">
          <div className="community-post-card__tags">
            {route.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>

          <div className="community-post-card__stats">
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
    </article>
  );
}
