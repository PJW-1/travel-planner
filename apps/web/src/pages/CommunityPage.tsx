import { Filter, Share2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { RouteMarketCard } from "@/components/cards/RouteMarketCard";
import { marketRoutes } from "@/data/mockData";

export function CommunityPage() {
  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow="루트 마켓"
        title="다른 여행자의 동선을 발견하고 내 일정으로 포크해보세요"
        description="이 영역은 앞으로 재사용률, 저장 수, 검증 배지, 지역 큐레이션 기준까지 붙는 여행 경로 마켓으로 확장될 수 있습니다."
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
        {marketRoutes.map((route) => (
          <RouteMarketCard key={route.id} route={route} />
        ))}
      </section>
    </div>
  );
}
