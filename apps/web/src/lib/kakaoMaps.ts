import type {
  PlaceDetails,
  PlaceSuggestion,
  SuggestionSearchOptions,
} from "./mapTypes";

declare global {
  interface Window {
    kakao: any;
  }
}

let kakaoMapsPromise: Promise<any> | null = null;
const placeDetailsCache = new Map<string, PlaceDetails>();

function getApiKey() {
  return import.meta.env.VITE_KAKAO_MAP_JS_KEY;
}

function normalizePlaceItem(item: any) {
  const placeId = String(item.id ?? `${item.place_name}:${item.x}:${item.y}`);
  const address = item.road_address_name || item.address_name || "";
  const details = {
    placeId,
    provider: "kakao",
    providerPlaceId: placeId,
    name: item.place_name ?? "",
    address,
    lat: Number(item.y),
    lng: Number(item.x),
    phone: item.phone || undefined,
    providerUrl: item.place_url || undefined,
    rawPayload: item ?? null,
  } satisfies PlaceDetails;

  placeDetailsCache.set(placeId, details);

  return {
    placeId,
    title: item.place_name ?? "",
    subtitle: address,
    description: [item.category_name, address].filter(Boolean).join(" · "),
    distanceMeters:
      typeof item.distance === "string" || typeof item.distance === "number"
        ? Number(item.distance)
        : undefined,
  } satisfies PlaceSuggestion;
}

function scoreSuggestion(suggestion: PlaceSuggestion, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedTitle = suggestion.title.trim().toLowerCase();
  const normalizedDescription = suggestion.description.trim().toLowerCase();
  const childPlaceKeywords = [
    "제1여객터미널",
    "제2여객터미널",
    "제1터미널",
    "제2터미널",
    "터미널",
    "주차장",
    "출구",
    "입구",
    "게이트",
    "정류장",
    "매표소",
    "안내소",
    "라운지",
    "체크인",
  ];
  const isLikelyChildPlace = childPlaceKeywords.some((keyword) =>
    suggestion.title.includes(keyword),
  );

  let score = 0;

  if (normalizedTitle === normalizedQuery) {
    score += 300;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 120;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 80;
  } else if (normalizedDescription.includes(normalizedQuery)) {
    score += 30;
  }

  if (normalizedTitle.replace(/\s+/g, "") === normalizedQuery.replace(/\s+/g, "")) {
    score += 120;
  }

  if (isLikelyChildPlace && normalizedTitle !== normalizedQuery) {
    score -= 35;
  }

  if (typeof suggestion.distanceMeters === "number") {
    if (suggestion.distanceMeters <= 500) {
      score += 24;
    } else if (suggestion.distanceMeters <= 1500) {
      score += 16;
    } else if (suggestion.distanceMeters <= 3000) {
      score += 10;
    } else if (suggestion.distanceMeters <= 5000) {
      score += 4;
    }
  }

  return score;
}

export function loadKakaoMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 카카오 지도를 불러올 수 있습니다."));
  }

  if (window.kakao?.maps?.services) {
    return Promise.resolve(window.kakao);
  }

  if (kakaoMapsPromise) {
    return kakaoMapsPromise;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Kakao Map JavaScript 키가 설정되지 않았습니다."));
  }

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kakao-maps-loader="true"]',
    );

    const onReady = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };

    if (existingScript) {
      existingScript.addEventListener("load", onReady, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("카카오 지도 스크립트를 불러오지 못했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}` +
      `&autoload=false&libraries=services`;
    script.async = true;
    script.defer = true;
    script.dataset.kakaoMapsLoader = "true";
    script.onload = onReady;
    script.onerror = () => reject(new Error("카카오 지도 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return kakaoMapsPromise;
}

export async function fetchPlaceSuggestions(input: string, options: SuggestionSearchOptions = {}) {
  const query = input.trim();
  if (query.length < 2) {
    return [] as PlaceSuggestion[];
  }

  const kakao = await loadKakaoMaps();
  const places = new kakao.maps.services.Places();
  const center =
    options.center &&
    typeof options.center.lat === "number" &&
    typeof options.center.lng === "number" &&
    !Number.isNaN(options.center.lat) &&
    !Number.isNaN(options.center.lng)
      ? options.center
      : null;

  const baseSearchOptions = {
    size: 8,
    ...(center
      ? {
          x: String(center.lng),
          y: String(center.lat),
          radius: Math.min(Math.max(options.radius ?? 5000, 0), 20000),
          sort: "accuracy",
        }
      : {}),
  };

  async function runKeywordSearch(searchOptions: Record<string, unknown>) {
    return new Promise<any[]>((resolve, reject) => {
      places.keywordSearch(
        query,
        (data: any[], status: string) => {
          if (status === kakao.maps.services.Status.OK) {
            resolve(data);
            return;
          }

          if (status === kakao.maps.services.Status.ZERO_RESULT) {
            resolve([]);
            return;
          }

          reject(new Error(`카카오 장소 검색에 실패했습니다. (${status})`));
        },
        searchOptions,
      );
    });
  }

  const groupedResults = await Promise.all([runKeywordSearch(baseSearchOptions)]);

  const merged = new Map<string, PlaceSuggestion>();

  groupedResults.flat().forEach((item) => {
    const suggestion = normalizePlaceItem(item);
    if (!merged.has(suggestion.placeId)) {
      merged.set(suggestion.placeId, suggestion);
    }
  });

  return Array.from(merged.values()).sort((a, b) => {
    const scoreDiff = scoreSuggestion(b, query) - scoreSuggestion(a, query);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const aDistance =
      typeof a.distanceMeters === "number" ? a.distanceMeters : Number.POSITIVE_INFINITY;
    const bDistance =
      typeof b.distanceMeters === "number" ? b.distanceMeters : Number.POSITIVE_INFINITY;

    return aDistance - bDistance;
  });
}

export async function fetchPlaceDetails(placeId: string) {
  const cached = placeDetailsCache.get(placeId);

  if (cached) {
    return cached;
  }

  throw new Error("선택한 장소 정보를 다시 불러오지 못했습니다. 검색 결과에서 다시 선택해 주세요.");
}

export type { PlaceDetails, PlaceSuggestion, SuggestionSearchOptions };
