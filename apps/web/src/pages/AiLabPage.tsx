import { useEffect, useState, type FormEvent } from "react";
import type { TravelRegion } from "@travel/shared";
import { CheckCircle2, LoaderCircle, Plus, WandSparkles, Youtube } from "lucide-react";
import {
  fetchAiLabOverview,
  runAiExtraction,
  saveAiPlace,
  type AiLabExtraction,
} from "@/lib/contentApi";
import { travelRegionOptions } from "@/lib/travelRegion";

export function AiLabPage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [travelRegion, setTravelRegion] = useState<TravelRegion>("korea");
  const [extractions, setExtractions] = useState<AiLabExtraction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAiLabOverview() {
      try {
        const data = await fetchAiLabOverview();

        if (isMounted) {
          setExtractions(data.extractions);
        }
      } catch {
        if (isMounted) {
          setExtractions([]);
        }
      }
    }

    void loadAiLabOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!youtubeUrl.trim()) {
      setError("유튜브 링크를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFeedback("");

    try {
      const result = await runAiExtraction({
        youtubeUrl: youtubeUrl.trim(),
        travelRegion,
      });

      setFeedback(result.message);
      setExtractions(result.overview.extractions);
      setYoutubeUrl("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "AI 분석 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSavePlace(placeId: string) {
    setSavingPlaceId(placeId);
    setError("");
    setFeedback("");

    try {
      const result = await saveAiPlace(placeId);
      setFeedback(result.message);
      setExtractions(result.overview.extractions);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "장소 저장 중 오류가 발생했습니다.",
      );
    } finally {
      setSavingPlaceId(null);
    }
  }

  const latestExtraction = extractions[0] ?? null;

  return (
    <div className="single-column-page">
      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}
      {feedback ? <p className="form-feedback form-feedback--success">{feedback}</p> : null}

      <section className="lab-hero">
        <form className="lab-hero__input" onSubmit={handleSubmit}>
          <div className="lab-input">
            <Youtube size={18} />
            <input
              type="text"
              value={youtubeUrl}
              onChange={(event) => {
                setYoutubeUrl(event.target.value);
                setError("");
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <select
            className="setup-select setup-select--compact"
            value={travelRegion}
            onChange={(event) => setTravelRegion(event.target.value as TravelRegion)}
          >
            {travelRegionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle size={16} className="spin" /> : <WandSparkles size={16} />}
            {isSubmitting ? "분석 중..." : "분석 시작"}
          </button>
        </form>

        <div className="lab-hero__grid">
          <article className="info-card">
            <div className="info-card__icon">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3>최근 추출한 장소</h3>
              <div className="place-list">
                {(latestExtraction?.places ?? []).length > 0 ? (
                  latestExtraction?.places.map((place) => (
                    <div key={place.id} className="place-list__item">
                      <div>
                        <span>{place.name}</span>
                        <small>{place.address}</small>
                      </div>
                      {place.isSaved ? (
                        <button
                          type="button"
                          disabled
                          className="place-list__button place-list__button--saved"
                        >
                          저장됨
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="place-list__button"
                          onClick={() => void handleSavePlace(place.id)}
                          disabled={savingPlaceId === place.id}
                          aria-label={`${place.name} 저장`}
                        >
                          {savingPlaceId === place.id ? (
                            <LoaderCircle size={14} className="spin" />
                          ) : (
                            <Plus size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="place-list__empty">
                    아직 추출된 장소가 없습니다. 유튜브 링크를 넣고 분석을 시작해 보세요.
                  </p>
                )}
              </div>
            </div>
          </article>

          <article className="info-card">
            <div className="info-card__icon">
              <WandSparkles size={18} />
            </div>
            <div>
              <h3>분석 기록</h3>
              <div className="ai-history">
                {extractions.length > 0 ? (
                  extractions.map((extraction) => (
                    <div key={extraction.id} className="ai-history__item">
                      <strong>{extraction.videoTitle}</strong>
                      <p>{extraction.places.length}개 장소 확인</p>
                      <span>{new Date(extraction.requestedAt).toLocaleString("ko-KR")}</span>
                    </div>
                  ))
                ) : (
                  <p className="place-list__empty">
                    아직 분석 기록이 없습니다. 첫 번째 영상을 넣어 결과를 확인해 보세요.
                  </p>
                )}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
