import type { TravelRegion } from "@travel/shared";
import type {
  PlaceDetails,
  PlaceSuggestion,
  SuggestionSearchOptions,
} from "./mapTypes";

declare global {
  interface Window {
    google: any;
  }
}

let googleMapsPromise: Promise<any> | null = null;
let autocompleteSessionToken: any | null = null;
const placeDetailsCache = new Map<string, PlaceDetails>();

function getApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
}

function getGoogleRegionHints(region: TravelRegion | undefined) {
  switch (region) {
    case "japan":
      return {
        language: "ja-JP",
        region: "jp",
        includedRegionCodes: ["jp"],
      };
    case "southeast_asia":
      return {
        language: "en",
        region: "sg",
        includedRegionCodes: ["th", "vn", "sg", "my", "id", "ph"],
      };
    case "europe":
      return {
        language: "en-GB",
        region: "gb",
        includedRegionCodes: ["gb", "fr", "it", "es", "de", "nl", "pt"],
      };
    case "america":
      return {
        language: "en-US",
        region: "us",
        includedRegionCodes: ["us", "ca", "mx"],
      };
    case "greater_china":
      return {
        language: "zh-CN",
        region: "cn",
        includedRegionCodes: ["cn", "hk", "mo", "tw"],
      };
    case "oceania":
      return {
        language: "en-AU",
        region: "au",
        includedRegionCodes: ["au", "nz"],
      };
    default:
      return {
        language: "en",
        region: "us",
        includedRegionCodes: undefined,
      };
  }
}

function scoreSuggestion(suggestion: PlaceSuggestion, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedTitle = suggestion.title.trim().toLowerCase();
  const normalizedSubtitle = suggestion.subtitle.trim().toLowerCase();
  const normalizedDescription = suggestion.description.trim().toLowerCase();
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const compactTitle = normalizedTitle.replace(/\s+/g, "");

  let score = 0;

  if (normalizedTitle === normalizedQuery || compactTitle === compactQuery) {
    score += 320;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 150;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 90;
  } else if (normalizedSubtitle.includes(normalizedQuery)) {
    score += 48;
  } else if (normalizedDescription.includes(normalizedQuery)) {
    score += 30;
  }

  if (typeof suggestion.distanceMeters === "number") {
    if (suggestion.distanceMeters <= 1000) {
      score += 16;
    } else if (suggestion.distanceMeters <= 5000) {
      score += 10;
    } else if (suggestion.distanceMeters <= 15000) {
      score += 4;
    }
  }

  return score;
}

async function ensurePlacesLibrary(google: any) {
  if (google?.maps?.places) {
    return google.maps.places;
  }

  if (typeof google?.maps?.importLibrary === "function") {
    const importedLibrary = await google.maps.importLibrary("places");
    return importedLibrary ?? google?.maps?.places ?? null;
  }

  return null;
}

async function createPlacesService(google: any) {
  const placesLibrary = await ensurePlacesLibrary(google);

  if (!placesLibrary?.PlacesService) {
    throw new Error("Google Places 라이브러리를 불러오지 못했습니다.");
  }

  return new placesLibrary.PlacesService(document.createElement("div"));
}

async function fetchLegacyAutocompleteSuggestions(
  google: any,
  region: TravelRegion | undefined,
  input: string,
  options: SuggestionSearchOptions,
) {
  const placesLibrary = await ensurePlacesLibrary(google);

  if (!placesLibrary?.AutocompleteService) {
    return [] as PlaceSuggestion[];
  }

  const service = new placesLibrary.AutocompleteService();
  const { includedRegionCodes } = getGoogleRegionHints(region);
  const request: Record<string, unknown> = {
    input,
    types: ["establishment", "geocode"],
  };

  if (includedRegionCodes?.length === 1) {
    request.componentRestrictions = {
      country: includedRegionCodes[0],
    };
  }

  if (
    options.center &&
    typeof options.center.lat === "number" &&
    typeof options.center.lng === "number" &&
    !Number.isNaN(options.center.lat) &&
    !Number.isNaN(options.center.lng)
  ) {
    request.location = new google.maps.LatLng(options.center.lat, options.center.lng);
    request.radius = Math.min(Math.max(options.radius ?? 15000, 0), 50000);
  }

  const predictions = await new Promise<any[]>((resolve, reject) => {
    service.getPlacePredictions(request, (data: any[], status: string) => {
      if (status === "OK") {
        resolve(data ?? []);
        return;
      }

      if (status === "ZERO_RESULTS") {
        resolve([]);
        return;
      }

      reject(new Error(`Google 자동완성 검색에 실패했습니다. (${status})`));
    });
  });

  return predictions.map((prediction: any) => ({
    placeId: String(prediction?.place_id ?? ""),
    title:
      prediction?.structured_formatting?.main_text ??
      prediction?.description ??
      "",
    subtitle:
      prediction?.structured_formatting?.secondary_text ??
      "",
    description: prediction?.description ?? "",
    distanceMeters:
      typeof prediction?.distance_meters === "number"
        ? prediction.distance_meters
        : undefined,
  })) as PlaceSuggestion[];
}

function normalizePlaceResult(place: any) {
  const geometryLocation = place?.geometry?.location;
  const lat =
    typeof geometryLocation?.lat === "function"
      ? Number(geometryLocation.lat())
      : Number(geometryLocation?.lat);
  const lng =
    typeof geometryLocation?.lng === "function"
      ? Number(geometryLocation.lng())
      : Number(geometryLocation?.lng);
  const placeId = String(place?.place_id ?? `${place?.name}:${lat}:${lng}`);
  const address = place?.formatted_address ?? place?.vicinity ?? "";

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    placeDetailsCache.set(placeId, {
      placeId,
      name: place?.name ?? "",
      address,
      lat,
      lng,
    });
  }

  return {
    placeId,
    title: place?.name ?? "",
    subtitle: address,
    description: [place?.types?.join(", "), address].filter(Boolean).join(" 쨌 "),
  } as PlaceSuggestion;
}

export function loadGoogleMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("브라우저 환경에서만 Google 지도를 불러올 수 있습니다."),
    );
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps JavaScript 키가 설정되지 않았습니다."));
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-loader="true"]',
    );

    const onReady = () => resolve(window.google);

    if (existingScript) {
      existingScript.addEventListener("load", onReady, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google 지도 스크립트를 불러오지 못했습니다.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}` +
      `&libraries=places&loading=async&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onload = onReady;
    script.onerror = () => reject(new Error("Google 지도 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

async function fetchAutocompleteSuggestions(
  region: TravelRegion | undefined,
  input: string,
  options: SuggestionSearchOptions,
) {
  const google = await loadGoogleMaps();
  if (typeof google.maps.importLibrary !== "function") {
    const legacySuggestions = await fetchLegacyAutocompleteSuggestions(
      google,
      region,
      input,
      options,
    );

    if (legacySuggestions.length > 0) {
      return legacySuggestions;
    }

    return fetchTextSearchFallback(region, input, options);
  }
  const { AutocompleteSuggestion, AutocompleteSessionToken } =
    await google.maps.importLibrary("places");
  const { language, region: regionCode, includedRegionCodes } =
    getGoogleRegionHints(region);

  if (!autocompleteSessionToken) {
    autocompleteSessionToken = new AutocompleteSessionToken();
  }

  const request: Record<string, unknown> = {
    input,
    inputOffset: Math.max(0, input.length - 1),
    language,
    region: regionCode,
    sessionToken: autocompleteSessionToken,
  };

  if (includedRegionCodes?.length) {
    request.includedRegionCodes = includedRegionCodes;
  }

  if (
    options.center &&
    typeof options.center.lat === "number" &&
    typeof options.center.lng === "number" &&
    !Number.isNaN(options.center.lat) &&
    !Number.isNaN(options.center.lng)
  ) {
    request.origin = {
      lat: options.center.lat,
      lng: options.center.lng,
    };
    request.locationBias = {
      center: {
        lat: options.center.lat,
        lng: options.center.lng,
      },
      radius: Math.min(Math.max(options.radius ?? 15000, 1000), 50000),
    };
  }

  const { suggestions } =
    await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

  return (Array.isArray(suggestions) ? suggestions : [])
    .map((suggestion: any) => {
      const prediction = suggestion?.placePrediction;
      return {
        placeId: String(prediction?.placeId ?? ""),
        title: prediction?.mainText?.text ?? prediction?.text?.text ?? "",
        subtitle: prediction?.secondaryText?.text ?? "",
        description: prediction?.text?.text ?? "",
        distanceMeters:
          typeof prediction?.distanceMeters === "number"
            ? prediction.distanceMeters
            : undefined,
      } satisfies PlaceSuggestion;
    })
    .filter((suggestion: PlaceSuggestion) => suggestion.placeId && suggestion.title);
}

async function fetchTextSearchFallback(
  region: TravelRegion | undefined,
  input: string,
  options: SuggestionSearchOptions,
) {
  const google = await loadGoogleMaps();
  const service = await createPlacesService(google);
  const { language, region: regionCode } = getGoogleRegionHints(region);
  const request: Record<string, unknown> = {
    query: input,
    language,
    region: regionCode,
  };

  if (
    options.center &&
    typeof options.center.lat === "number" &&
    typeof options.center.lng === "number" &&
    !Number.isNaN(options.center.lat) &&
    !Number.isNaN(options.center.lng)
  ) {
    request.location = new google.maps.LatLng(options.center.lat, options.center.lng);
    request.radius = Math.min(Math.max(options.radius ?? 15000, 0), 50000);
  }

  const results = await new Promise<any[]>((resolve, reject) => {
    service.textSearch(request, (data: any[], status: string) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        resolve(data);
        return;
      }

      if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
        return;
      }

      reject(new Error(`Google 장소 검색에 실패했습니다. (${status})`));
    });
  });

  return results.map(normalizePlaceResult);
}

export async function fetchPlaceSuggestions(
  region: TravelRegion | undefined,
  input: string,
  options: SuggestionSearchOptions = {},
) {
  const query = input.trim();

  if (query.length < 2) {
    return [] as PlaceSuggestion[];
  }

  let suggestions: PlaceSuggestion[] = await fetchAutocompleteSuggestions(region, query, options);

  if (suggestions.length === 0) {
    suggestions = await fetchTextSearchFallback(region, query, options);
  }

  return suggestions
    .sort((left, right) => scoreSuggestion(right, query) - scoreSuggestion(left, query))
    .slice(0, 8);
}

export async function fetchPlaceDetails(placeId: string) {
  const cached = placeDetailsCache.get(placeId);

  if (cached) {
    autocompleteSessionToken = null;
    return cached;
  }

  const google = await loadGoogleMaps();
  const service = await createPlacesService(google);

  const result = await new Promise<PlaceDetails>((resolve, reject) => {
    service.getDetails(
      {
        placeId,
        fields: ["place_id", "name", "formatted_address", "geometry"],
      },
      (place: any, status: string) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          reject(new Error(`Google 장소 상세 조회에 실패했습니다. (${status})`));
          return;
        }

        const normalized = normalizePlaceResult(place);
        const details = placeDetailsCache.get(normalized.placeId);

        if (!details) {
          reject(new Error("선택한 장소의 좌표를 불러오지 못했습니다."));
          return;
        }

        resolve(details);
      },
    );
  });

  autocompleteSessionToken = null;
  return result;
}

export type { PlaceDetails, PlaceSuggestion, SuggestionSearchOptions };
