import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CopyPlus,
  Heart,
  LoaderCircle,
  MapPin,
  Share2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RouteMarketCard } from "@/components/cards/RouteMarketCard";
import {
  fetchCommunityRouteDetail,
  fetchCommunityRoutes,
  importCommunityRoute,
  saveCommunityPlace,
  toggleCommunityRouteLike,
  type CommunityRouteDetail,
  type CommunityRouteSummary,
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

export function CommunityPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [routes, setRoutes] = useState<CommunityRouteSummary[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState(searchParams.get("routeId") ?? "");
  const [selectedRoute, setSelectedRoute] = useState<CommunityRouteDetail | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [importing, setImporting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCommunityRoutes() {
      setLoadingFeed(true);

      try {
        const data = await fetchCommunityRoutes();

        if (!isMounted) {
          return;
        }

        setRoutes(data.routes);
        setSelectedRouteId((currentId) => currentId || searchParams.get("routeId") || data.routes[0]?.id || "");
      } catch (feedError) {
        if (isMounted) {
          setError(
            feedError instanceof Error
              ? feedError.message
              : "커뮤니티 루트를 불러오는 중 오류가 발생했습니다.",
          );
          setRoutes([]);
        }
      } finally {
        if (isMounted) {
          setLoadingFeed(false);
        }
      }
    }

    void loadCommunityRoutes();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!selectedRouteId) {
      return;
    }

    setSearchParams({ routeId: selectedRouteId });
  }, [selectedRouteId, setSearchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadRouteDetail() {
      if (!selectedRouteId) {
        setSelectedRoute(null);
        return;
      }

      setLoadingDetail(true);
      setError("");

      try {
        const data = await fetchCommunityRouteDetail(selectedRouteId);

        if (isMounted) {
          setSelectedRoute(data.route);
        }
      } catch (detailError) {
        if (isMounted) {
          setSelectedRoute(null);
          setError(
            detailError instanceof Error
              ? detailError.message
              : "루트 상세 정보를 불러오는 중 오류가 발생했습니다.",
          );
        }
      } finally {
        if (isMounted) {
          setLoadingDetail(false);
        }
      }
    }

    void loadRouteDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedRouteId]);

  const selectedSummary = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  async function handleImportRoute() {
    if (!selectedRoute) {
      return;
    }

    setImporting(true);
    setFeedback("");
    setError("");

    try {
      const result = await importCommunityRoute(selectedRoute.id);
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
    if (!selectedRoute) {
      return;
    }

    setLiking(true);
    setFeedback("");
    setError("");

    try {
      const result = await toggleCommunityRouteLike(selectedRoute.id);

      setSelectedRoute((current) =>
        current
          ? {
              ...current,
              likedByMe: result.liked,
              likes: result.likeCount,
            }
          : current,
      );
      setRoutes((current) =>
        current.map((route) =>
          route.id === selectedRoute.id
            ? { ...route, likes: result.likeCount, likedByMe: result.liked }
            : route,
        ),
      );
      setFeedback(result.message);
    } catch (likeError) {
      setError(
        likeError instanceof Error
          ? likeError.message
          : "좋아요 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setLiking(false);
    }
  }

  async function handleShareRoute() {
    if (!selectedRoute) {
      return;
    }

    setSharing(true);
    setFeedback("");
    setError("");

    try {
      const shareUrl = `${window.location.origin}/community?routeId=${selectedRoute.id}`;
      await navigator.clipboard.writeText(shareUrl);
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
      setSelectedRoute((current) =>
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
      navigate(
        `/setup?communityPlaceId=${encodeURIComponent(stop.placeId)}&communityPlaceName=${encodeURIComponent(
          stop.name,
        )}&communityPlaceAddress=${encodeURIComponent(
          stop.address,
        )}&communityPlaceCategoryKey=${encodeURIComponent(
          stop.categoryKey,
        )}&communityPlaceLat=${encodeURIComponent(String(stop.lat))}&communityPlaceLng=${encodeURIComponent(
          String(stop.lng),
        )}`,
      );
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

  return (
    <div className="single-column-page">
      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
      {feedback ? <p className="form-feedback form-feedback--success">{feedback}</p> : null}

      <section className="community-feed">
        {loadingFeed ? (
          <div className="community-feed__empty">
            <LoaderCircle size={18} className="spin" />
            <p>루트 피드를 불러오는 중입니다.</p>
          </div>
        ) : routes.length > 0 ? (
          routes.map((route) => (
            <RouteMarketCard
              key={route.id}
              route={route}
              selected={route.id === selectedRouteId}
              onSelect={setSelectedRouteId}
            />
          ))
        ) : (
          <div className="community-feed__empty">
            <p>아직 공개된 루트가 없습니다.</p>
          </div>
        )}
      </section>

      {loadingDetail ? (
        <section className="community-detail community-detail--loading">
          <LoaderCircle size={18} className="spin" />
          <p>선택한 루트의 상세 일정을 불러오는 중입니다.</p>
        </section>
      ) : selectedRoute ? (
        <section className="community-detail">
          <div className="community-detail__main">
            <article className="community-story">
              <div className="community-story__tags">
                {selectedRoute.tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    #{tag}
                  </span>
                ))}
              </div>

              <h2>{selectedRoute.title}</h2>

              <div className="community-story__author">
                <div className="community-story__avatar">
                  {selectedRoute.author.slice(0, 1).toUpperCase()}
                </div>

                <div className="community-story__author-copy">
                  <strong>{selectedRoute.author}</strong>
                  <p>{selectedRoute.destination} 루트를 공유한 여행자</p>
                </div>

                <div className="community-story__stats">
                  <span>좋아요 {selectedRoute.likes}</span>
                  <span>{selectedRoute.forkCount}명이 가져감</span>
                </div>
              </div>

              <p className="community-story__description">{selectedRoute.description}</p>

              <div className="community-story__period">
                <CalendarDays size={16} />
                <span>여행 기간: {selectedRoute.dateRange}</span>
              </div>
            </article>

            <div className="community-day-list">
              {selectedRoute.days.map((day) => (
                <article key={day.id} className="community-day-card">
                  <div className="community-day-card__header">
                    <span className="community-day-card__badge">Day {day.dayNumber}</span>
                    <div>
                      <h3>{day.title}</h3>
                      <p>{day.date}</p>
                    </div>
                  </div>

                  <div className="community-stop-list">
                    {day.stops.map((stop) => (
                      <div key={stop.id} className="community-stop-card">
                        <div className="community-stop-card__rail">
                          <span>{stop.order}</span>
                        </div>

                        <div
                          className={`community-stop-card__media community-stop-card__media--${stop.categoryKey}`}
                        >
                          <span>{stop.category}</span>
                        </div>

                        <div className="community-stop-card__content">
                          <div className="community-stop-card__top">
                            <span className="community-stop-card__time">{stop.arrivalTime}</span>
                            {stop.isSaved ? (
                              <button
                                type="button"
                                className="button button--secondary button--compact"
                                onClick={() => {
                                  navigate(
                                    `/setup?communityPlaceId=${encodeURIComponent(
                                      stop.placeId,
                                    )}&communityPlaceName=${encodeURIComponent(
                                      stop.name,
                                    )}&communityPlaceAddress=${encodeURIComponent(
                                      stop.address,
                                    )}&communityPlaceCategoryKey=${encodeURIComponent(
                                      stop.categoryKey,
                                    )}&communityPlaceLat=${encodeURIComponent(
                                      String(stop.lat),
                                    )}&communityPlaceLng=${encodeURIComponent(String(stop.lng))}`,
                                  );
                                }}
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

                          <h4>{stop.name}</h4>
                          <p className="community-stop-card__address">
                            <MapPin size={14} />
                            {stop.address || stop.region}
                          </p>

                          <div className="community-stop-card__travel">
                            <span>{getTransportLabel(stop.transportType)}</span>
                            <span>이동 {stop.travelMinutes}분</span>
                            <span>{stop.distanceKm.toFixed(1)}km</span>
                          </div>

                          <div className="community-stop-card__memo">
                            <strong>작성자 팁</strong>
                            <p>
                              {stop.memo ||
                                "이 장소의 분위기와 이동 흐름을 고려해 배치한 포인트입니다."}
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

          <aside className="community-detail__aside">
            <div className="community-import-card">
              <h3>이 여행 일정이 마음에 드나요?</h3>
              <p>
                작성자의 플랜과 동선이 포함된 이 일정을 내 워크스페이스로 복사한
                뒤, 취향에 맞게 수정할 수 있습니다.
              </p>

              <button
                type="button"
                className="button button--primary community-import-card__button"
                onClick={() => void handleImportRoute()}
                disabled={importing}
              >
                <CopyPlus size={16} />
                {importing ? "가져오는 중..." : "여행 전체 가져오기"}
              </button>

              <div className="community-import-card__meta">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => void handleToggleLike()}
                  disabled={liking}
                >
                  {liking ? <LoaderCircle size={16} className="spin" /> : <Heart size={16} />}
                  {selectedRoute.likedByMe ? "좋아요 취소" : "좋아요"}
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
            </div>

            {selectedSummary ? (
              <div className="community-side-note">
                <strong>{selectedSummary.destination}</strong>
                <p>{selectedSummary.days}일 일정</p>
                <p>{selectedSummary.dateRange}</p>
              </div>
            ) : null}
          </aside>
        </section>
      ) : null}
    </div>
  );
}
