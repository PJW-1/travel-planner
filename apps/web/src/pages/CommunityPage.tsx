import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Megaphone, Plus, Send } from "lucide-react";
import type { MarketRoute } from "@travel/shared";
import { RouteMarketCard } from "@/components/cards/RouteMarketCard";
import {
  fetchCommunityRoutes,
  publishCommunityRoute,
  type CommunityRouteSummary,
} from "@/lib/contentApi";
import { fetchTrips, type TripListItem } from "@/lib/tripsApi";

const themeOptions: Array<{
  value: MarketRoute["theme"];
  label: string;
}> = [
  { value: "urban", label: "도시 코스" },
  { value: "cafe", label: "카페/맛집" },
  { value: "walking", label: "뚜벅이" },
  { value: "coast", label: "휴양/바다" },
];

export function CommunityPage() {
  const [routes, setRoutes] = useState<CommunityRouteSummary[]>([]);
  const [myTrips, setMyTrips] = useState<TripListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishTags, setPublishTags] = useState("");
  const [publishTheme, setPublishTheme] = useState<MarketRoute["theme"]>("urban");

  useEffect(() => {
    let isMounted = true;

    async function loadRoutes() {
      setLoading(true);
      setError("");

      try {
        const [communityResult, tripsResult] = await Promise.allSettled([
          fetchCommunityRoutes(),
          fetchTrips(),
        ]);

        if (!isMounted) {
          return;
        }

        if (communityResult.status === "fulfilled") {
          setRoutes(communityResult.value.routes);
        } else {
          throw communityResult.reason;
        }

        if (tripsResult.status === "fulfilled") {
          setMyTrips(tripsResult.value.items);
          const firstSavedTrip = tripsResult.value.items.find((trip) => trip.isSaved);
          const firstTrip = firstSavedTrip ?? tripsResult.value.items[0];

          if (firstTrip) {
            setSelectedTripId((current) => current || firstTrip.id);
            setPublishTitle((current) => current || firstTrip.title);
          }
        } else {
          setMyTrips([]);
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "커뮤니티 피드를 불러오는 중 오류가 발생했습니다.",
        );
        setRoutes([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadRoutes();

    return () => {
      isMounted = false;
    };
  }, []);

  const publishableTrips = useMemo(
    () => myTrips.filter((trip) => trip.isSaved || trip.status === "optimized"),
    [myTrips],
  );
  const selectedTrip = useMemo(
    () => myTrips.find((trip) => trip.id === selectedTripId) ?? null,
    [myTrips, selectedTripId],
  );

  async function handlePublishRoute() {
    if (!selectedTripId) {
      setError("공유할 일정을 선택해 주세요.");
      return;
    }

    setIsPublishing(true);
    setError("");
    setFeedback("");

    try {
      const result = await publishCommunityRoute({
        tripId: selectedTripId,
        title: publishTitle.trim() || selectedTrip?.title || "새 커뮤니티 루트",
        description:
          publishDescription.trim() ||
          `${selectedTrip?.destination ?? "여행지"} 일정 동선을 공유합니다.`,
        theme: publishTheme,
        tags: publishTags
          .split(",")
          .map((tag) => tag.replace(/^#/, "").trim())
          .filter(Boolean),
      });
      const nextRoutes = await fetchCommunityRoutes();

      setRoutes(nextRoutes.routes);
      setFeedback(result.message);
      setIsComposerOpen(false);
      setPublishDescription("");
      setPublishTags("");
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "커뮤니티에 루트를 공유하는 중 오류가 발생했습니다.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="single-column-page">
      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
      {feedback ? <p className="form-feedback form-feedback--success">{feedback}</p> : null}

      <section className="community-publish-bar">
        <div>
          <span>
            <Megaphone size={15} />
            내 루트 공유
          </span>
          <strong>저장한 여행 일정을 커뮤니티 게시글로 올려보세요.</strong>
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={() => setIsComposerOpen((current) => !current)}
        >
          <Plus size={16} />
          {isComposerOpen ? "작성 닫기" : "루트 공유하기"}
        </button>
      </section>

      {isComposerOpen ? (
        <section className="community-publish-card">
          {publishableTrips.length > 0 ? (
            <>
              <div className="community-publish-card__grid">
                <label className="profile-field">
                  <span>공유할 일정</span>
                  <select
                    value={selectedTripId}
                    onChange={(event) => {
                      const nextTrip = myTrips.find((trip) => trip.id === event.target.value);
                      setSelectedTripId(event.target.value);
                      setPublishTitle(nextTrip?.title ?? "");
                    }}
                  >
                    {publishableTrips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title} · {trip.destination}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="profile-field">
                  <span>분위기</span>
                  <select
                    value={publishTheme}
                    onChange={(event) =>
                      setPublishTheme(event.target.value as MarketRoute["theme"])
                    }
                  >
                    {themeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="profile-field">
                <span>게시글 제목</span>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(event) => setPublishTitle(event.target.value)}
                  placeholder="예: 성수동 하루 코스 완전 정복"
                />
              </label>

              <label className="profile-field">
                <span>설명</span>
                <textarea
                  value={publishDescription}
                  onChange={(event) => setPublishDescription(event.target.value)}
                  placeholder="이 루트의 분위기, 추천 포인트, 이동 팁을 적어주세요."
                />
              </label>

              <label className="profile-field">
                <span>태그</span>
                <input
                  type="text"
                  value={publishTags}
                  onChange={(event) => setPublishTags(event.target.value)}
                  placeholder="성수, 데이트, 카페"
                />
              </label>

              <div className="community-publish-card__actions">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => void handlePublishRoute()}
                  disabled={isPublishing}
                >
                  {isPublishing ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}
                  {isPublishing ? "공유 중..." : "커뮤니티에 공유"}
                </button>
              </div>
            </>
          ) : (
            <div className="community-feed-empty community-feed-empty--compact">
              <p>공유할 저장 일정이 없습니다. 플래너에서 일정을 저장한 뒤 다시 시도해 주세요.</p>
            </div>
          )}
        </section>
      ) : null}

      {loading ? (
        <section className="community-feed-empty">
          <LoaderCircle size={18} className="spin" />
          <p>커뮤니티 피드를 불러오는 중입니다.</p>
        </section>
      ) : routes.length > 0 ? (
        <section className="community-post-feed">
          {routes.map((route) => (
            <RouteMarketCard key={route.id} route={route} />
          ))}
        </section>
      ) : (
        <section className="community-feed-empty">
          <p>아직 공개된 루트가 없습니다.</p>
        </section>
      )}
    </div>
  );
}
