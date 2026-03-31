import { ArrowRight, Clock3, MapPinned, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { tripConfig } from "@/data/mockData";

export function SetupPage() {
  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow="여행 기본 설정"
        title="새로운 여행을 시작하기 위한 기본 조건을 정해보세요"
        description="이 화면은 이후 선호도 저장, 추천 로직, AI 일정 초안 생성으로 이어질 출발점 역할을 합니다."
      />

      <section className="setup-card">
        <div className="setup-grid">
          <article className="setup-item">
            <MapPinned size={18} />
            <div>
              <span>여행지</span>
              <strong>{tripConfig.destination}</strong>
            </div>
          </article>
          <article className="setup-item">
            <Clock3 size={18} />
            <div>
              <span>식사 시간</span>
              <strong>
                점심 {tripConfig.lunchTime} / 저녁 {tripConfig.dinnerTime}
              </strong>
            </div>
          </article>
          <article className="setup-item">
            <Tags size={18} />
            <div>
              <span>선호 태그</span>
              <strong>{tripConfig.tags.join(" / ")}</strong>
            </div>
          </article>
        </div>

        <Link to="/planner" className="button button--primary">
          플래너 열기
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
