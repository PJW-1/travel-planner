import { useEffect, useState } from "react";
import {
  Clock3,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { fetchPlaceDetail, type PlaceDetail } from "@/lib/placesApi";

type PlaceDetailSheetProps = {
  placeId: string | null;
  open: boolean;
  providedPlace?: PlaceDetail | null;
  onClose: () => void;
};

function getProviderLabel(provider: PlaceDetail["provider"]) {
  switch (provider) {
    case "kakao":
      return "Kakao 장소";
    case "google":
      return "Google 장소";
    default:
      return "저장된 장소";
  }
}

function isInvalidPlaceId(placeId: string | null) {
  const normalizedPlaceId = String(placeId ?? "").trim();

  return (
    !normalizedPlaceId ||
    normalizedPlaceId === "undefined" ||
    normalizedPlaceId === "null"
  );
}

export function PlaceDetailSheet({
  placeId,
  open,
  providedPlace = null,
  onClose,
}: PlaceDetailSheetProps) {
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPlace() {
      const normalizedPlaceId = String(placeId ?? "").trim();

      if (!open) {
        setPlace(null);
        setError("");
        return;
      }

      if (providedPlace) {
        setPlace(providedPlace);
        setError("");
        setLoading(false);
        return;
      }

      if (isInvalidPlaceId(placeId)) {
        setPlace(null);
        setError("장소 ID가 없어 상세 정보를 불러올 수 없습니다.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchPlaceDetail(normalizedPlaceId);

        if (!isMounted) {
          return;
        }

        setPlace(data.place);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setPlace(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "장소 상세 정보를 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPlace();

    return () => {
      isMounted = false;
    };
  }, [open, placeId, providedPlace]);

  return (
    <>
      <div
        className={`place-detail-sheet__backdrop${open ? " is-open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside className={`place-detail-sheet${open ? " is-open" : ""}`} aria-hidden={!open}>
        <div className="place-detail-sheet__header">
          <div>
            <span className="place-detail-sheet__eyebrow">장소 상세</span>
            <h2>{place?.name ?? "장소 정보"}</h2>
          </div>
          <button
            type="button"
            className="place-detail-sheet__close"
            onClick={onClose}
            aria-label="장소 상세 닫기"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="place-detail-sheet__state">장소 정보를 불러오는 중입니다.</div>
        ) : error ? (
          <div className="place-detail-sheet__state place-detail-sheet__state--error">{error}</div>
        ) : place ? (
          <div className="place-detail-sheet__body">
            <div className="place-detail-sheet__hero">
              <span className="status-chip">{getProviderLabel(place.provider)}</span>
              <strong>{place.category}</strong>
            </div>

            <div className="place-detail-sheet__section">
              <div className="place-detail-sheet__row">
                <MapPin size={16} />
                <div>
                  <strong>주소</strong>
                  <p>{place.address || "등록된 주소 정보가 없습니다."}</p>
                </div>
              </div>

              <div className="place-detail-sheet__row">
                <Phone size={16} />
                <div>
                  <strong>전화번호</strong>
                  <p>{place.phone || "등록된 전화번호가 없습니다."}</p>
                </div>
              </div>

              <div className="place-detail-sheet__row">
                <Clock3 size={16} />
                <div>
                  <strong>운영시간</strong>
                  {place.openingHours.length > 0 ? (
                    <ul className="place-detail-sheet__hours">
                      {place.openingHours.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>아직 운영시간 정보가 저장되지 않았습니다.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="place-detail-sheet__section">
              <strong>원본 장소 페이지</strong>
              <p className="place-detail-sheet__hint">
                실제 리뷰와 최신 정보는 원본 지도 장소 페이지에서 확인하는 흐름으로 이어집니다.
              </p>

              <div className="place-detail-sheet__actions">
                {place.providerUrl ? (
                  <a
                    className="button button--primary"
                    href={place.providerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={16} />
                    장소 페이지 열기
                  </a>
                ) : null}

                {place.websiteUrl ? (
                  <a
                    className="button button--secondary"
                    href={place.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe size={16} />
                    공식 웹사이트
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="place-detail-sheet__state">장소를 선택하면 상세 정보가 표시됩니다.</div>
        )}
      </aside>
    </>
  );
}
