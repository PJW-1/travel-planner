import { Bookmark, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { savedPlans } from "@/data/mockData";

export function MyPage() {
  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow="내 여행 보관함"
        title="저장한 일정과 찜한 장소, 추출 기록을 한곳에서 관리하세요."
        description="이 개인 허브는 앞으로 활동 기록, 재사용 가능한 템플릿, 좋아요, 임시 초안 관리까지 확장될 수 있습니다."
      />

      <div className="two-column-layout">
        <section className="panel">
          <div className="panel__header">
            <div className="section-title__label">
              <Bookmark size={16} />
              <span>저장한 일정</span>
            </div>
          </div>
          <div className="saved-plan-list">
            {savedPlans.map((plan) => (
              <article key={plan.id} className="saved-plan">
                <div className="saved-plan__emoji">{plan.emoji}</div>
                <div>
                  <h3>{plan.title}</h3>
                  <p>
                    {plan.date} | {plan.placeCount}개 장소
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel--muted">
          <div className="panel__header">
            <div className="section-title__label">
              <Heart size={16} />
              <span>찜한 장소</span>
            </div>
          </div>
          <div className="empty-state">
            <p>
              아직 찜한 장소가 없습니다. AI 추출이나 루트 마켓에서 마음에 드는 장소를 담아보세요.
            </p>
            <Link to="/ai-lab" className="button button--secondary">
              장소 둘러보기
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
