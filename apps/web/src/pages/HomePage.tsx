import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Compass, GitFork, TrendingUp, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import type { TrendSpot, TripConfig } from "@travel/shared";
import { MetricCard } from "@/components/cards/MetricCard";
import { QuickActionCard } from "@/components/cards/QuickActionCard";
import { TrendCard } from "@/components/cards/TrendCard";
import { SectionTitle } from "@/components/SectionTitle";
import { fetchHomeContent } from "@/lib/contentApi";

type UpcomingTrip = {
  month: string;
  day: string;
  title: string;
  description: string;
};

export function HomePage() {
  const [upcomingTrip, setUpcomingTrip] = useState<UpcomingTrip | null>(null);
  const [tripConfig, setTripConfig] = useState<TripConfig | null>(null);
  const [trendSpots, setTrendSpots] = useState<TrendSpot[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeContent() {
      try {
        const data = await fetchHomeContent();

        if (!isMounted) {
          return;
        }

        setUpcomingTrip(data.upcomingTrip);
        setTripConfig(data.tripConfig);
        setTrendSpots(data.trendSpots);
      } catch {
        if (!isMounted) {
          return;
        }

        setUpcomingTrip(null);
        setTripConfig(null);
        setTrendSpots([]);
      }
    }

    void loadHomeContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentTripConfig = tripConfig ?? {
    destination: "서울",
    days: 3,
    lunchTime: "12:00",
    dinnerTime: "18:30",
    tags: ["감성", "맛집", "도보 여행"],
  };

  const currentUpcomingTrip = upcomingTrip ?? {
    month: "May",
    day: "24",
    title: "서울 성수동 당일치기 투어",
    description: "서울역 출발 · 총 4개 장소 · 동선 점수 92",
  };

  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div className="hero-panel__content">
          <p className="eyebrow">여행 설계 플랫폼</p>
          <h1>AI와 커뮤니티 데이터를 바탕으로 더 현실적이고 효율적인 여행 동선을 설계해보세요</h1>
          <p className="hero-panel__description">
            Travel Master는 여행 일정을 단순히 기록하는 도구가 아니라, 영상에서 영감을 얻고 AI로
            장소를 모은 뒤 동선을 분석하고 커뮤니티 루트를 조합해 완성도를 높이는 여행 설계
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
            <MetricCard
              label="다가오는 일정"
              value={`${currentUpcomingTrip.month} ${currentUpcomingTrip.day}`}
              hint={currentUpcomingTrip.title}
            />
            <MetricCard
              label="여행 태그"
              value={`${currentTripConfig.tags.length}개`}
              hint={currentTripConfig.tags.join(" / ")}
            />
            <MetricCard
              label="여행 기간"
              value={`${currentTripConfig.days}일`}
              hint="식사 시간과 선호 태그를 반영한 기본 설정"
            />
          </div>
        </div>

        <aside className="upcoming-card">
          <div className="upcoming-card__date">
            <span>{currentUpcomingTrip.month}</span>
            <strong>{currentUpcomingTrip.day}</strong>
          </div>
          <div className="upcoming-card__body">
            <p className="eyebrow">다가오는 일정</p>
            <h2>{currentUpcomingTrip.title}</h2>
            <p>{currentUpcomingTrip.description}</p>
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
            subtitle="여행 설계, AI 추출, 루트 포크라는 세 가지 흐름으로 바로 진입할 수 있습니다."
            icon={<Compass size={16} />}
          />
          <div className="quick-action-grid">
            <QuickActionCard
              to="/setup"
              title="여행 기본 설계"
              subtitle="여행지와 취향 조건을 먼저 정리합니다"
              icon={<CalendarDays size={24} />}
              accentClass="quick-action--blue"
            />
            <QuickActionCard
              to="/ai-lab"
              title="AI 장소 추출"
              subtitle="유튜브 영상에서 장소 후보를 찾습니다"
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
            title="이번 여행 가이드"
            subtitle="일정을 만들기 전에 기본 조건을 먼저 확인해보세요"
            icon={<TrendingUp size={16} />}
          />
          <div className="stack-card">
            <div>
              <span>점심 추천 시간</span>
              <strong>{currentTripConfig.lunchTime}</strong>
            </div>
            <div>
              <span>저녁 추천 시간</span>
              <strong>{currentTripConfig.dinnerTime}</strong>
            </div>
            <div>
              <span>추천 분위기</span>
              <strong>{currentTripConfig.tags.join(" / ")}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="trend-section">
        <SectionTitle
          title="지금 뜨는 장소"
          subtitle="앞으로는 지역별 조회 수, 저장 수, 검색량 기반 데이터까지 반영할 수 있습니다."
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
