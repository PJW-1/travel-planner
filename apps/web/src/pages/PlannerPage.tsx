import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import type { PlannerStop } from "@travel/shared";
import { InsightPanel } from "@/components/planner/InsightPanel";
import { JourneyAnchorCard } from "@/components/planner/JourneyAnchorCard";
import { PlannerCanvas } from "@/components/planner/PlannerCanvas";
import { TimelineStopCard } from "@/components/planner/TimelineStopCard";
import { buildPreviewTripDetail, reorderStops } from "@/lib/plannerPreview";
import {
  fetchTripDetail,
  fetchTrips,
  reorderTripStops,
  saveTrip,
  type PlannerRouteSegment,
  type PlannerTripDetail,
  type TripListItem,
} from "@/lib/tripsApi";

const emptySummary = {
  totalDistanceKm: 0,
  totalTravelMinutes: 0,
  optimizationScore: 100,
};

function getSegmentModeLabel(mode?: string) {
  switch (mode) {
    case "walk":
      return "도보";
    case "car":
      return "차량";
    case "taxi":
      return "택시";
    case "subway":
      return "지하철";
    case "bus":
      return "버스";
    default:
      return null;
  }
}

function formatStartDate(dateValue: string) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function PlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tripDetail, setTripDetail] = useState<PlannerTripDetail | null>(null);
  const [myTrips, setMyTrips] = useState<TripListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [draggingStopId, setDraggingStopId] = useState<string | null>(null);
  const [dropTargetStopId, setDropTargetStopId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const tripId = searchParams.get("tripId");
  const dayNumber = Number(searchParams.get("day") ?? "1");

  useEffect(() => {
    let isMounted = true;

    async function loadPlanner() {
      setLoading(true);
      setError("");

      try {
        const tripList = await fetchTrips();

        if (!isMounted) {
          return;
        }

        setMyTrips(tripList.items);

        if (!tripId) {
          setTripDetail(null);
          return;
        }

        const detail = await fetchTripDetail(tripId, dayNumber);

        if (isMounted) {
          setTripDetail(detail);
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "플래너 결과를 불러오는 중 오류가 발생했습니다.",
        );
        setTripDetail(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPlanner();

    return () => {
      isMounted = false;
    };
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

  function handleOpenTrip(nextTripId: string) {
    setSaveMessage("");
    setError("");
    setSearchParams({
      tripId: nextTripId,
      day: "1",
    });
  }

  async function handleSaveTrip() {
    if (!tripId || !tripDetail?.trip) {
      return;
    }

    setIsSaving(true);
    setError("");
    setSaveMessage("");

    try {
      if (tripDetail.trip.isSaved) {
        setSaveMessage("저장된 일정에 현재 변경 사항을 반영했습니다.");
        return;
      }

      const result = await saveTrip(tripId, tripDetail.selectedDayNumber);
      setTripDetail(result.trip);
      setSaveMessage(result.message);
      setMyTrips((currentTrips) =>
        currentTrips.map((item) =>
          item.id === tripId
            ? {
                ...item,
                isSaved: true,
              }
            : item,
        ),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "일정을 저장하는 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDropReorder(targetStop: PlannerStop) {
    if (!tripId || !tripDetail || !draggingStopId || draggingStopId === targetStop.id) {
      setDraggingStopId(null);
      setDropTargetStopId(null);
      return;
    }

    const previousDetail = tripDetail;
    const reorderedStops = reorderStops(previousDetail.stops, draggingStopId, targetStop.id);
    const previewDetail = buildPreviewTripDetail(previousDetail, reorderedStops);

    setTripDetail(previewDetail);
    setDraggingStopId(null);
    setDropTargetStopId(null);
    setIsReordering(true);
    setError("");

    try {
      const result = await reorderTripStops(
        tripId,
        previousDetail.selectedDayNumber,
        reorderedStops.map((stop) => stop.id),
      );
      setTripDetail(result.trip);
    } catch (reorderError) {
      setTripDetail(previousDetail);
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : "방문 순서를 다시 계산하는 중 오류가 발생했습니다.",
      );
    } finally {
      setIsReordering(false);
    }
  }

  const currentStops: PlannerStop[] = tripDetail?.stops ?? [];
  const currentRouteSegments: PlannerRouteSegment[] = tripDetail?.routeSegments ?? [];
  const startPoint = tripDetail?.tripConfig.startPoint ?? null;
  const displayStopsCount = currentStops.length + (startPoint ? 1 : 0);
  const currentSummary = tripDetail?.summary ?? emptySummary;
  const currentInsights = tripDetail?.insights ?? [];

  const savedTrips = useMemo(() => myTrips.filter((item) => item.isSaved), [myTrips]);
  const currentTripItem = useMemo(
    () => savedTrips.find((item) => item.id === tripId) ?? null,
    [savedTrips, tripId],
  );
  const isSaved = Boolean(tripDetail?.trip.isSaved);

  return (
    <div className="planner-page">
      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
      {saveMessage ? <p className="form-feedback form-feedback--success">{saveMessage}</p> : null}

      {!tripId && !loading ? (
        <section className="planner-editor-card">
          <div className="planner-empty">
            <strong>아직 선택된 일정이 없습니다.</strong>
            <p>플랜 목록에서 저장된 일정을 불러오거나 새 일정 만들기로 바로 이동해 보세요.</p>
            <Link to="/setup" className="button button--primary">
              새 일정 만들기
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
            {tripId ? (
              <Link to={`/setup?tripId=${tripId}`} className="button button--secondary">
                <ArrowLeft size={16} />
                설정으로 돌아가기
              </Link>
            ) : null}
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
                {loading
                  ? "계산 중"
                  : isReordering
                    ? "경로 다시 계산 중"
                    : `${displayStopsCount}개 장소`}
              </span>
            </div>

            {displayStopsCount === 0 && !loading ? (
              <div className="planner-empty">
                <strong>표시할 장소가 없습니다.</strong>
                <p>일정을 먼저 불러오거나 Setup에서 장소를 추가한 뒤 다시 확인해 주세요.</p>
              </div>
            ) : (
              <>
                {startPoint ? (
                  <JourneyAnchorCard
                    title={startPoint.name}
                    address={startPoint.address}
                    index="S"
                    showConnector={currentStops.length > 0}
                    moveModeLabel={getSegmentModeLabel(currentRouteSegments[0]?.mode)}
                    moveMinutes={currentRouteSegments[0]?.travelMinutes ?? currentStops[0]?.travelMinutes}
                  />
                ) : null}
                {currentStops.map((stop, index) => {
                  const isLastStop = index === currentStops.length - 1;
                  const nextSegmentIndex = startPoint ? index + 1 : index;
                  const nextSegment = !isLastStop ? currentRouteSegments[nextSegmentIndex] : undefined;

                  return (
                    <TimelineStopCard
                      key={stop.id}
                      stop={stop}
                      index={index + 1}
                      last={isLastStop}
                      moveModeLabel={getSegmentModeLabel(nextSegment?.mode)}
                      draggable={currentStops.length > 1 && !isReordering}
                      dragging={draggingStopId === stop.id}
                      dropTarget={dropTargetStopId === stop.id}
                      onDragStart={(dragStop) => {
                        setDraggingStopId(dragStop.id);
                        setDropTargetStopId(dragStop.id);
                      }}
                      onDragOver={(overStop) => {
                        if (!draggingStopId || draggingStopId === overStop.id) {
                          return;
                        }

                        setDropTargetStopId(overStop.id);
                      }}
                      onDrop={handleDropReorder}
                      onDragEnd={() => {
                        setDraggingStopId(null);
                        setDropTargetStopId(null);
                      }}
                    />
                  );
                })}
              </>
            )}
          </article>

          <InsightPanel insights={currentInsights} />
        </section>

        <div className="planner-main">
          <article className="planner-editor-card planner-vault">
            <div className="planner-section-title">
              <h2>내 일정에서 플랜 가져오기</h2>
              <span className="planner-muted">
                {savedTrips.length > 0 ? `${savedTrips.length}개 저장 일정` : "저장된 일정 없음"}
              </span>
            </div>

            <div className="planner-vault__current">
              <div>
                <span className="planner-vault__caption">현재 보고 있는 일정</span>
                <strong>{currentTripItem?.title ?? tripDetail?.trip.title ?? "선택된 일정 없음"}</strong>
                <p>
                  {currentTripItem
                    ? `${currentTripItem.destination} · ${formatStartDate(currentTripItem.startDate)}`
                    : tripDetail
                      ? `${tripDetail.trip.destination} · ${tripDetail.trip.days}일 일정`
                      : "아직 불러온 일정이 없습니다."}
                </p>
              </div>

              <div className="planner-vault__current-actions">
                {currentTripItem ? (
                  <span className="planner-vault__current-badge">현재 보고 있는 일정</span>
                ) : null}
                {tripId ? (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleSaveTrip}
                    disabled={isSaving}
                  >
                    {isSaved ? <Check size={16} /> : <Sparkles size={16} />}
                    {isSaving ? "저장 중..." : isSaved ? "저장된 일정 업데이트" : "내 일정에 저장"}
                  </button>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              className="planner-vault__toggle"
              onClick={() => setIsVaultOpen((current) => !current)}
              disabled={savedTrips.length === 0}
            >
              <span>플랜 목록 {isVaultOpen ? "닫기" : "열기"}</span>
              {isVaultOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {savedTrips.length === 0 ? (
              <div className="planner-empty">
                <strong>저장된 일정이 없습니다.</strong>
                <p>결과 화면에서 내 일정에 저장하면 다음부터는 여기서 바로 불러올 수 있습니다.</p>
              </div>
            ) : null}

            {savedTrips.length > 0 && isVaultOpen ? (
              <div className="planner-vault__panel">
                <div className="planner-vault__stack">
                  {savedTrips.map((item) => {
                    const isCurrent = item.id === tripId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`planner-vault__row${isCurrent ? " is-current" : ""}`}
                        onClick={() => handleOpenTrip(item.id)}
                      >
                        <div className="planner-vault__row-main">
                          <div className="planner-vault__row-top">
                            <span className="planner-vault__item-badge">
                              <FolderOpen size={14} />
                              저장됨
                            </span>
                            {isCurrent ? (
                              <span className="planner-vault__current-badge">현재 보고 있는 일정</span>
                            ) : null}
                          </div>
                          <strong>{item.title}</strong>
                          <p>
                            {item.destination} · {item.days}일 · {formatStartDate(item.startDate)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </article>

          <PlannerCanvas
            stops={currentStops}
            startPoint={startPoint}
            endPoint={tripDetail?.tripConfig.endPoint ?? null}
            routeSegments={tripDetail?.routeSegments ?? []}
            summary={currentSummary}
            travelRegion={tripDetail?.tripConfig.travelRegion ?? "korea"}
          />
        </div>
      </div>
    </div>
  );
}
