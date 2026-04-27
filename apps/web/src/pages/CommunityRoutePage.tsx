import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  CopyPlus,
  Heart,
  LoaderCircle,
  MapPin,
  Share2,
} from "lucide-react";
import type { PlannerStop, TravelRegion } from "@travel/shared";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PlannerCanvas } from "@/components/planner/PlannerCanvas";
import { PlaceDetailSheet } from "@/components/places/PlaceDetailSheet";
import {
  fetchCommunityRouteDetail,
  importCommunityRoute,
  saveCommunityPlace,
  toggleCommunityRouteLike,
  type CommunityRouteDetail,
} from "@/lib/contentApi";

function getTransportLabel(value: string) {
  switch (value) {
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
      return "이동";
  }
}

function mapRouteStopsToPlannerStops(route: CommunityRouteDetail): PlannerStop[] {
  return route.days.flatMap((day) =>
    day.stops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      category: stop.category,
      categoryKey: stop.categoryKey,
      address: stop.address,
      lat: stop.lat,
      lng: stop.lng,
      time: stop.arrivalTime,
      congestion: 0,
      stayMinutes: 60,
      travelMinutes: stop.travelMinutes,
      transportType: stop.transportType,
      stopOrder: stop.order,
      dayNumber: day.dayNumber,
      distanceKm: stop.distanceKm,
      forked: false,
      position: {
        x: 24 + ((stop.order + day.dayNumber) % 4) * 14,
        y: 24 + ((stop.order + day.dayNumber * 2) % 5) * 12,
      },
    })),
  );
}

function buildSetupQuery(stop: CommunityRouteDetail["days"][number]["stops"][number]) {
  const params = new URLSearchParams({
    communityPlaceId: stop.placeId,
    communityPlaceName: stop.name,
    communityPlaceAddress: stop.address,
    communityPlaceCategoryKey: stop.categoryKey,
    communityPlaceLat: String(stop.lat),
    communityPlaceLng: String(stop.lng),
  });

  return `/setup?${params.toString()}`;
}

export function CommunityRoutePage() {
  const navigate = useNavigate();
  const { routeId = "" } = useParams();
  const [route, setRoute] = useState<CommunityRouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [importing, setImporting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRoute() {
      if (!routeId) {
        return;
      }

      setLoading(true);
      setError("");
      setFeedback("");

      try {
        const data = await fetchCommunityRouteDetail(routeId);

        if (!isMounted) {
          return;
        }

        setRoute(data.route);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "루트 상세 정보를 불러오는 중 오류가 발생했습니다.",
        );
        setRoute(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadRoute();

    return () => {
      isMounted = false;
    };
  }, [routeId]);

  const plannerStops = useMemo(() => (route ? mapRouteStopsToPlannerStops(route) : []), [route]);
  const travelRegion = useMemo<TravelRegion>(
    () => (route?.travelRegion as TravelRegion | undefined) ?? "korea",
    [route],
  );
  const summary = useMemo(() => {
    const allStops = route ? route.days.flatMap((day) => day.stops) : [];

    return {
      totalDistanceKm: allStops.reduce((sum, stop) => sum + stop.distanceKm, 0),
      totalTravelMinutes: allStops.reduce((sum, stop) => sum + stop.travelMinutes, 0),
      optimizationScore: 92,
    };
  }, [route]);

  async function handleImportRoute() {
    if (!route) {
      return;
    }

    setImporting(true);
    setFeedback("");
    setError("");

    try {
      const result = await importCommunityRoute(route.id);
      setFeedback(result.message);
      navigate(`/setup?tripId=${result.imported.tripId}`);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "루트를 가져오는 중 오류가 발생했습니다.",
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleToggleLike() {
    if (!route) {
      return;
    }

    setLiking(true);
    setFeedback("");
    setError("");

    try {
      const result = await toggleCommunityRouteLike(route.id);
      setRoute((current) =>
        current
          ? {
              ...current,
              likes: result.likeCount,
              likedByMe: result.liked,
            }
          : current,
      );
      setFeedback(result.message);
    } catch (likeError) {
      setError(
        likeError instanceof Error
          ? likeError.message
          : "좋아요를 처리하는 중 오류가 발생했습니다.",
      );
    } finally {
      setLiking(false);
    }
  }

  async function handleShareRoute() {
    if (!route) {
      return;
    }

    setSharing(true);
    setFeedback("");
    setError("");

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community/${route.id}`);
      setFeedback("공유 링크를 복사했습니다.");
    } catch {
      setError("공유 링크를 복사하지 못했습니다.");
    } finally {
      setSharing(false);
    }
  }

  async function handleSavePlace(stop: CommunityRouteDetail["days"][number]["stops"][number]) {
    setSavingPlaceId(stop.placeId);
    setFeedback("");
    setError("");

    try {
      const result = await saveCommunityPlace(stop.placeId);
      setFeedback(result.message);
      setRoute((current) =>
        current
          ? {
              ...current,
              days: current.days.map((day) => ({
                ...day,
                stops: day.stops.map((dayStop) =>
                  dayStop.placeId === stop.placeId ? { ...dayStop, isSaved: true } : dayStop,
                ),
              })),
            }
          : current,
      );
      navigate(buildSetupQuery(stop));
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "장소를 저장하는 중 오류가 발생했습니다.",
      );
    } finally {
      setSavingPlaceId(null);
    }
  }

  if (loading) {
    return (
      <div className="single-column-page">
        <section className="community-feed-empty">
          <LoaderCircle size={18} className="spin" />
          <p>루트 상세 정보를 불러오는 중입니다.</p>
        </section>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="single-column-page">
        {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
        <section className="community-feed-empty">
          <p>해당 루트를 찾을 수 없습니다.</p>
          <Link to="/community" className="button button--secondary">
            커뮤니티로 돌아가기
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="single-column-page">
      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
      {feedback ? <p className="form-feedback form-feedback--success">{feedback}</p> : null}

      <div className="community-route-shell">
        <div className="community-route-topbar">
          <Link to="/community" className="community-route-back">
            <ChevronLeft size={16} />
            커뮤니티로 돌아가기
          </Link>
        </div>

        <section className="community-route-layout">
          <div className="community-route-main">
            <article className="community-route-hero">
              <div className="community-route-hero__meta">
                <span>{route.tags.map((tag) => `#${tag}`).join(" ")}</span>
              </div>

              <h1>{route.title}</h1>

              <div className="community-route-hero__author-row">
                <div className="community-route-hero__avatar">{route.author.slice(0, 1)}</div>
                <div className="community-route-hero__author-copy">
                  <strong>{route.author}</strong>
                  <p>{route.destination} · {route.daysCount}박 {route.daysCount + 1}일</p>
                </div>
                <div className="community-route-hero__stats">
                  <span>
                    <Heart size={14} />
                    {route.likes}
                  </span>
                  <span>
                    <CopyPlus size={14} />
                    {route.forkCount}명이 가져감
                  </span>
                </div>
              </div>

              <p>{route.description}</p>

              <div className="community-route-hero__period">
                <CalendarDays size={16} />
                여행 기간: {route.dateRange}
              </div>
            </article>

            <article className="community-route-map-card">
              <PlannerCanvas
                stops={plannerStops}
                summary={summary}
                travelRegion={travelRegion}
                showSummary={false}
              />
            </article>

            <div className="community-route-days">
              {route.days.map((day) => (
                <article key={day.id} className="community-route-day-card">
                  <div className="community-route-day-card__header">
                    <span className="community-route-day-card__badge">Day {day.dayNumber}</span>
                    <div>
                      <h2>{day.title}</h2>
                      <p>{day.date}</p>
                    </div>
                  </div>

                  <div className="community-route-stop-list">
                    {day.stops.map((stop) => (
                      <div key={stop.id} className="community-route-stop-card">
                        <div className="community-route-stop-card__rail">
                          <span>{stop.order}</span>
                        </div>

                        <div
                          className={`community-route-stop-card__media community-route-stop-card__media--${stop.categoryKey}`}
                        >
                          <span>{stop.category}</span>
                        </div>

                        <div className="community-route-stop-card__body">
                          <div className="community-route-stop-card__top">
                            <span className="community-route-stop-card__time">{stop.arrivalTime}</span>
                            <div className="community-route-stop-card__top-actions">
                              <button
                                type="button"
                                className="button button--ghost button--compact"
                                onClick={() => {
                                  if (stop.placeId) {
                                    setSelectedPlaceId(stop.placeId);
                                  }
                                }}
                              >
                                상세 보기
                              </button>

                              {stop.isSaved ? (
                                <button
                                  type="button"
                                  className="button button--secondary button--compact"
                                  onClick={() => navigate(buildSetupQuery(stop))}
                                >
                                  <Check size={14} />
                                  Setup에 담기
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="button button--secondary button--compact"
                                  onClick={() => void handleSavePlace(stop)}
                                  disabled={savingPlaceId === stop.placeId}
                                >
                                  {savingPlaceId === stop.placeId ? (
                                    <LoaderCircle size={14} className="spin" />
                                  ) : (
                                    <CopyPlus size={14} />
                                  )}
                                  이 장소만 담기
                                </button>
                              )}
                            </div>
                          </div>

                          <h3>{stop.name}</h3>
                          <p className="community-route-stop-card__address">
                            <MapPin size={14} />
                            {stop.address || stop.region}
                          </p>

                          <div className="community-route-stop-card__travel">
                            <span>{getTransportLabel(stop.transportType)}</span>
                            <span>이동 {stop.travelMinutes}분</span>
                            <span>{stop.distanceKm.toFixed(1)}km</span>
                          </div>

                          <div className="community-route-stop-card__memo">
                            <strong>작성자 팁</strong>
                            <p>
                              {stop.memo || "이 장소는 이동 흐름과 체류 시간을 고려해 배치된 추천 포인트입니다."}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="community-route-side">
            <div className="community-route-action-card">
              <h2>이 여행 일정이 마음에 드나요?</h2>
              <p>
                작성자의 동선과 장소 구성을 그대로 복사한 뒤, Setup에서 내 스타일에 맞게 수정할 수
                있습니다.
              </p>

              <button
                type="button"
                className="button button--primary community-route-action-card__button"
                onClick={() => void handleImportRoute()}
                disabled={importing}
              >
                {importing ? <LoaderCircle size={16} className="spin" /> : <CopyPlus size={16} />}
                {importing ? "가져오는 중..." : "여행 전체 가져오기"}
              </button>

              <div className="community-route-action-card__buttons">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => void handleToggleLike()}
                  disabled={liking}
                >
                  {liking ? <LoaderCircle size={16} className="spin" /> : <Heart size={16} />}
                  {route.likedByMe ? "좋아요 취소" : "좋아요"}
                </button>

                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => void handleShareRoute()}
                  disabled={sharing}
                >
                  {sharing ? <LoaderCircle size={16} className="spin" /> : <Share2 size={16} />}
                  공유
                </button>
              </div>

              <div className="community-route-action-card__stats">
                <span>
                  <Heart size={14} />
                  좋아요 {route.likes}
                </span>
                <span>
                  <CalendarDays size={14} />
                  {route.dateRange}
                </span>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <PlaceDetailSheet
        placeId={selectedPlaceId}
        open={Boolean(selectedPlaceId)}
        onClose={() => setSelectedPlaceId(null)}
      />
    </div>
  );
}
