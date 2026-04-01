import { useEffect, useState } from "react";
import { ArrowLeft, CalendarRange, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import type { PlannerStop } from "@travel/shared";
import { PageHeader } from "@/components/PageHeader";
import { InsightPanel } from "@/components/planner/InsightPanel";
import { PlannerCanvas } from "@/components/planner/PlannerCanvas";
import { TimelineStopCard } from "@/components/planner/TimelineStopCard";
import { fetchTripDetail, type PlannerTripDetail } from "@/lib/tripsApi";

const emptySummary = {
  totalDistanceKm: 0,
  totalTravelMinutes: 0,
  optimizationScore: 100,
};

export function PlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tripDetail, setTripDetail] = useState<PlannerTripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tripId = searchParams.get("tripId");
  const dayNumber = Number(searchParams.get("day") ?? "1");

  useEffect(() => {
    async function loadPlanner() {
      if (!tripId) {
        setTripDetail(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const detail = await fetchTripDetail(tripId, dayNumber);
        setTripDetail(detail);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "플래너 결과를 불러오지 못했습니다.");
        setTripDetail(null);
      } finally {
        setLoading(false);
      }
    }

    void loadPlanner();
  }, [dayNumber, tripId]);

  function handleDayChange(nextDayNumber: number) {
    if (!tripId) {
      return;
    }

    setSearchParams({
      tripId,
      day: String(nextDayNumber),
    });
  }

  const currentStops: PlannerStop[] = tripDetail?.stops ?? [];
  const currentSummary = tripDetail?.summary ?? emptySummary;
  const currentInsights = tripDetail?.insights ?? [];

  return (
    <div className="planner-page">
      <PageHeader
        eyebrow="최적화 결과"
        title={tripDetail ? `${tripDetail.trip.title}` : "최적화 결과 보기"}
        description={
          tripDetail
            ? `${tripDetail.trip.destination} 기준으로 입력한 장소를 정리하고, 일차별 이동 순서와 요약 지표를 한 번에 보여주는 결과 페이지입니다.`
            : "Setup에서 장소와 조건을 입력하고 최적화를 시작하면 이 페이지에서 정리된 동선을 확인할 수 있습니다."
        }
        actions={
          <>
            <Link to="/setup" className="button button--secondary">
              <ArrowLeft size={16} />
              설정으로 돌아가기
            </Link>
            <button type="button" className="button button--primary" disabled>
              <Sparkles size={16} />
              알고리즘 결과 반영 예정
            </button>
          </>
        }
      />

      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}

      {!tripId && !loading ? (
        <section className="planner-editor-card">
          <div className="planner-empty">
            <strong>아직 최적화된 일정이 없습니다.</strong>
            <p>홈에서 새 일정 만들기를 눌러 Setup 화면에서 장소와 조건을 먼저 입력해주세요.</p>
            <Link to="/setup" className="button button--primary">
              일정 설계하러 가기
            </Link>
          </div>
        </section>
      ) : null}

      <div className="planner-layout">
        <section className="planner-sidebar">
          <div className="planner-sidebar__top planner-sidebar__top--stack">
            <span className="status-chip">결과 확인 모드</span>
            <div className="planner-trip-picker">
              <label>현재 일정</label>
              <strong>{tripDetail ? tripDetail.trip.title : loading ? "불러오는 중" : "-"}</strong>
            </div>
          </div>

          <article className="planner-editor-card">
            <div className="planner-section-title">
              <h2>일차 보기</h2>
              <span className="planner-muted">
                {tripDetail ? `${tripDetail.days.length}일 구성` : "일정 대기 중"}
              </span>
            </div>

            <div className="day-switcher">
              {(tripDetail?.days ?? []).map((day) => (
                <button
                  key={day.id}
                  className={day.dayNumber === tripDetail?.selectedDayNumber ? "is-active" : ""}
                  onClick={() => handleDayChange(day.dayNumber)}
                >
                  {day.dayNumber}
                </button>
              ))}
            </div>
          </article>

          <article className="planner-editor-card">
            <div className="planner-section-title">
              <h2>최적화된 방문 순서</h2>
              <span className="planner-muted">
                {loading ? "계산 중" : `${currentStops.length}개 장소`}
              </span>
            </div>

            {currentStops.length === 0 && !loading ? (
              <div className="planner-empty">
                <strong>표시할 장소가 없습니다.</strong>
                <p>Setup에서 장소를 추가한 뒤 최적화를 다시 실행해주세요.</p>
              </div>
            ) : (
              currentStops.map((stop, index) => (
                <TimelineStopCard
                  key={stop.id}
                  stop={stop}
                  index={index}
                  last={index === currentStops.length - 1}
                />
              ))
            )}
          </article>

          <InsightPanel insights={currentInsights} />
        </section>

        <div className="planner-main">
          <article className="planner-editor-card">
            <div className="planner-section-title">
              <h2>결과 요약</h2>
              <span className="planner-muted">
                {tripDetail ? `${tripDetail.trip.destination} · ${tripDetail.trip.days}일` : "대기 중"}
              </span>
            </div>

            <div className="planner-form planner-form--two-column">
              <div className="setup-item">
                <CalendarRange size={18} />
                <div>
                  <span>점심 / 저녁 기준</span>
                  <strong>
                    {tripDetail?.tripConfig.lunchTime ?? "12:00"} / {tripDetail?.tripConfig.dinnerTime ?? "18:30"}
                  </strong>
                </div>
              </div>
              <div className="setup-item">
                <Sparkles size={18} />
                <div>
                  <span>설정 태그</span>
                  <strong>{tripDetail?.tripConfig.tags.join(" / ") || "감성 / 맛집"}</strong>
                </div>
              </div>
            </div>
          </article>

          <PlannerCanvas stops={currentStops} summary={currentSummary} />
        </div>
      </div>
    </div>
  );
}
