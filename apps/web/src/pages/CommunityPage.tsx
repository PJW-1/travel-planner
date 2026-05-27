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
  { value: "walking", label: "산책" },
  { value: "coast", label: "해변/바다" },
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
  const [publishDestination, setPublishDestination] = useState("");
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
    if (!publishTitle.trim()) {
      setError("게시글 제목을 입력해 주세요.");
      return;
    }

    setIsPublishing(true);
    setError("");
    setFeedback("");

    try {
      const result = await publishCommunityRoute({
        tripId: selectedTripId || undefined,
        title: publishTitle.trim(),
        description:
          publishDescription.trim() ||
          `${selectedTrip?.destination ?? (publishDestination.trim() || "여행지")} 이야기를 공유합니다.`,
        theme: publishTheme,
        tags: publishTags
          .split(",")
          .map((tag) => tag.replace(/^#/, "").trim())
          .filter(Boolean),
        destination: selectedTrip?.destination ?? publishDestination.trim(),
      });
      const nextRoutes = await fetchCommunityRoutes();

      setRoutes(nextRoutes.routes);
      setFeedback(result.message);
      setIsComposerOpen(false);
      setSelectedTripId("");
      setPublishDestination("");
      setPublishTitle("");
      setPublishDescription("");
      setPublishTags("");
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "커뮤니티 게시글을 등록하는 중 오류가 발생했습니다.",
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
            커뮤니티 글쓰기
          </span>
          <strong>여행 루트나 장소 이야기를 커뮤니티 게시글로 올려보세요.</strong>
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={() => setIsComposerOpen((current) => !current)}
        >
          <Plus size={16} />
          {isComposerOpen ? "작성 닫기" : "글쓰기"}
        </button>
      </section>

      {isComposerOpen ? (
        <section className="community-publish-card">
          <div className="community-publish-card__grid">
            <label className="profile-field">
              <span>연결할 일정</span>
              <select
                value={selectedTripId}
                onChange={(event) => {
                  const nextTrip = myTrips.find((trip) => trip.id === event.target.value);
                  setSelectedTripId(event.target.value);
                  setPublishTitle((current) => current || nextTrip?.title || "");
                  setPublishDestination((current) => current || nextTrip?.destination || "");
                }}
              >
                <option value="">일정 없이 게시글 작성</option>
                {publishableTrips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title} | {trip.destination}
                  </option>
                ))}
              </select>
            </label>

            <label className="profile-field">
              <span>분위기</span>
              <select
                value={publishTheme}
                onChange={(event) => setPublishTheme(event.target.value as MarketRoute["theme"])}
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!selectedTripId ? (
            <label className="profile-field">
              <span>여행지</span>
              <input
                type="text"
                value={publishDestination}
                onChange={(event) => setPublishDestination(event.target.value)}
                placeholder="예: 성수동, 제주 동쪽, 도쿄"
              />
            </label>
          ) : null}

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
            <span>내용</span>
            <textarea
              value={publishDescription}
              onChange={(event) => setPublishDescription(event.target.value)}
              placeholder="이 코스의 분위기, 추천 포인트, 이동 팁을 적어주세요."
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
              {isPublishing ? "등록 중..." : "커뮤니티에 등록"}
            </button>
          </div>
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
          <p>아직 공개된 게시글이 없습니다.</p>
        </section>
      )}
    </div>
  );
}
