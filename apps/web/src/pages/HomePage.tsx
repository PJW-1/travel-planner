import { ArrowRight, CalendarDays, Compass, GitFork, TrendingUp, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/cards/MetricCard";
import { QuickActionCard } from "@/components/cards/QuickActionCard";
import { TrendCard } from "@/components/cards/TrendCard";
import { SectionTitle } from "@/components/SectionTitle";
import { trendSpots, tripConfig, upcomingTrip } from "@/data/mockData";

export function HomePage() {
  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div className="hero-panel__content">
          <p className="eyebrow">스마트 여행 설계</p>
          <h1>AI와 커뮤니티 데이터를 바탕으로 더 현실적이고 똑똑한 여행 동선을 설계하세요.</h1>
          <p className="hero-panel__description">
            Travel Master는 여행 일정을 단순히 기록하는 도구가 아니라, 영상에서 영감을 얻고 AI로
            장소를 모으고 동선을 분석하며 커뮤니티의 루트를 조합해 완성도를 높이는 여행 설계
            플랫폼입니다.
          </p>

          <div className="hero-panel__actions">
            <Link to="/setup" className="button button--primary">
              새 일정 만들기
              <ArrowRight size={16} />
            </Link>
            <Link to="/planner" className="button button--secondary">
              플래너 바로 보기
            </Link>
          </div>

          <div className="hero-panel__metrics">
            <MetricCard label="다가오는 일정" value="5월 24일" hint={upcomingTrip.title} />
            <MetricCard
              label="여행 태그"
              value={`${tripConfig.tags.length}개`}
              hint={tripConfig.tags.join(" / ")}
            />
            <MetricCard
              label="여행 기간"
              value={`${tripConfig.days}일`}
              hint="식사 시간과 선호 태그를 반영해 설계"
            />
          </div>
        </div>

        <aside className="upcoming-card">
          <div className="upcoming-card__date">
            <span>{upcomingTrip.month}</span>
            <strong>{upcomingTrip.day}</strong>
          </div>
          <div className="upcoming-card__body">
            <p className="eyebrow">다가오는 일정</p>
            <h2>{upcomingTrip.title}</h2>
            <p>{upcomingTrip.description}</p>
          </div>
          <Link to="/planner" className="upcoming-card__link">
            일정 편집
            <ArrowRight size={16} />
          </Link>
        </aside>
      </section>

      <section className="content-grid">
        <div className="content-grid__main">
          <SectionTitle
            title="빠른 시작"
            subtitle="여행 설계, AI 추출, 루트 포크라는 세 가지 핵심 흐름으로 바로 진입할 수 있습니다."
            icon={<Compass size={16} />}
          />
          <div className="quick-action-grid">
            <QuickActionCard
              to="/setup"
              title="여행 기본 설계"
              subtitle="여행지와 선호 조건을 먼저 설정합니다"
              icon={<CalendarDays size={24} />}
              accentClass="quick-action--blue"
            />
            <QuickActionCard
              to="/ai-lab"
              title="AI 장소 추출"
              subtitle="유튜브 영상에서 장소 후보를 뽑아옵니다"
              icon={<Youtube size={24} />}
              accentClass="quick-action--red"
            />
            <QuickActionCard
              to="/community"
              title="루트 마켓"
              subtitle="다른 여행자의 동선을 포크해 시작합니다"
              icon={<GitFork size={24} />}
              accentClass="quick-action--gold"
            />
          </div>
        </div>

        <aside className="content-grid__side">
          <SectionTitle
            title="이번 여행 포인트"
            subtitle="일정을 만들기 전에 핵심 조건을 먼저 확인해보세요"
            icon={<TrendingUp size={16} />}
          />
          <div className="stack-card">
            <div>
              <span>점심 추천 시간</span>
              <strong>{tripConfig.lunchTime}</strong>
            </div>
            <div>
              <span>저녁 추천 시간</span>
              <strong>{tripConfig.dinnerTime}</strong>
            </div>
            <div>
              <span>추천 분위기</span>
              <strong>{tripConfig.tags.join(" / ")}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="trend-section">
        <SectionTitle
          title="지금 뜨는 장소"
          subtitle="앞으로는 저장 수, 조회 수, 지역 급상승 데이터까지 반영해 고도화할 수 있습니다."
          icon={<TrendingUp size={16} />}
          action={
            <Link to="/community" className="text-link">
              전체 보기
            </Link>
          }
        />
        <div className="trend-grid">
          {trendSpots.map((spot) => (
            <TrendCard key={spot.rank} title={spot.title} rank={spot.rank} tag={spot.tag} />
          ))}
        </div>
      </section>
    </div>
  );
}
