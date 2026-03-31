import { useEffect, useState } from "react";
import { Filter, Share2 } from "lucide-react";
import type { MarketRoute } from "@travel/shared";
import { PageHeader } from "@/components/PageHeader";
import { RouteMarketCard } from "@/components/cards/RouteMarketCard";
import { fetchCommunityRoutes } from "@/lib/contentApi";

export function CommunityPage() {
  const [routes, setRoutes] = useState<MarketRoute[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadCommunityRoutes() {
      try {
        const data = await fetchCommunityRoutes();

        if (isMounted) {
          setRoutes(data.routes);
        }
      } catch {
        if (isMounted) {
          setRoutes([]);
        }
      }
    }

    void loadCommunityRoutes();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow="루트 마켓"
        title="다른 여행자의 동선을 발견하고 내 일정으로 포크해보세요"
        description="검증된 경로를 가져와 편집하고, 나만의 여행 계획에 맞게 다시 조합할 수 있는 커뮤니티형 루트 마켓입니다."
        actions={
          <>
            <button className="button button--secondary">
              <Filter size={16} />
              정렬 기준
            </button>
            <button className="button button--primary">
              <Share2 size={16} />내 일정 공유
            </button>
          </>
        }
      />

      <section className="route-grid">
        {routes.map((route) => (
          <RouteMarketCard key={route.id} route={route} />
        ))}
      </section>
    </div>
  );
}
