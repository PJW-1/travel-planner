import type { MarketRoute, PlannerStop, SavedPlan, TrendSpot, TripConfig } from "@travel/shared";
import { API_BASE_URL } from "./authApi";

type UpcomingTrip = {
  month: string;
  day: string;
  title: string;
  description: string;
};

type PlannerInsight = {
  iconKey: "footprints" | "clock";
  title: string;
  description: string;
};

type PlannerSummary = {
  totalDistanceKm: number;
  totalTravelMinutes: number;
  optimizationScore: number;
};

export type AiLabPlace = {
  id: string;
  placeId: string;
  name: string;
  rawPlaceName?: string;
  address: string;
  lat: number;
  lng: number;
  confidenceScore: number;
  isSaved?: boolean;
  region?: string;
};

export type AiLabExtraction = {
  id: string;
  youtubeUrl: string;
  videoTitle: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  places: AiLabPlace[];
};

export type SavedAiPlace = {
  id: string;
  placeId: string;
  title: string;
  categoryKey?: PlannerStop["categoryKey"];
  address: string;
  lat: number;
  lng: number;
  region: string;
  sourceTitle: string;
  youtubeUrl: string;
  date: string;
};

export type CommunityRouteSummary = MarketRoute & {
  tripId: string;
  description: string;
  forkCount: number;
  destination: string;
  days: number;
  dateRange: string;
  publishedAt: string;
  likedByMe?: boolean;
};

export type CommunityRouteDetail = {
  id: string;
  tripId: string;
  title: string;
  description: string;
  author: string;
  theme: MarketRoute["theme"];
  destination: string;
  dateRange: string;
  daysCount: number;
  likes: number;
  comments: number;
  forkCount: number;
  tags: string[];
  publishedAt: string;
  likedByMe?: boolean;
  days: Array<{
    id: string;
    dayNumber: number;
    date: string;
    title: string;
    stops: Array<{
      id: string;
      placeId: string;
      name: string;
      address: string;
      region: string;
      category: string;
      categoryKey: PlannerStop["categoryKey"];
      lat: number;
      lng: number;
      arrivalTime: string;
      transportType: string;
      travelMinutes: number;
      distanceKm: number;
      memo: string;
      order: number;
      isSaved?: boolean;
    }>;
  }>;
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "데이터를 불러오는 중 오류가 발생했습니다.";

    throw new Error(message);
  }

  return data as T;
}

export async function fetchHomeContent() {
  const response = await fetch(`${API_BASE_URL}/home`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{
    upcomingTrip: UpcomingTrip;
    tripConfig: TripConfig;
    trendSpots: TrendSpot[];
  }>(response);
}

export async function fetchPlannerOverview() {
  const response = await fetch(`${API_BASE_URL}/planner/overview`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{
    tripConfig: TripConfig;
    stops: PlannerStop[];
    summary: PlannerSummary;
    insights: PlannerInsight[];
  }>(response);
}

export async function fetchCommunityRoutes() {
  const response = await fetch(`${API_BASE_URL}/community/routes`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{
    routes: CommunityRouteSummary[];
  }>(response);
}

export async function fetchCommunityRouteDetail(routeId: string) {
  const response = await fetch(`${API_BASE_URL}/community/routes/${routeId}`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{
    route: CommunityRouteDetail;
  }>(response);
}

export async function importCommunityRoute(routeId: string) {
  const response = await fetch(`${API_BASE_URL}/community/routes/${routeId}/import`, {
    method: "POST",
    credentials: "include",
  });

  return parseJson<{
    message: string;
    imported: {
      routeId: string;
      tripId: string;
      title: string;
    };
  }>(response);
}

export async function toggleCommunityRouteLike(routeId: string) {
  const response = await fetch(`${API_BASE_URL}/community/routes/${routeId}/like`, {
    method: "POST",
    credentials: "include",
  });

  return parseJson<{
    message: string;
    liked: boolean;
    likeCount: number;
  }>(response);
}

export async function saveCommunityPlace(placeId: string) {
  const response = await fetch(`${API_BASE_URL}/community/places/${placeId}/save`, {
    method: "POST",
    credentials: "include",
  });

  return parseJson<{ message: string }>(response);
}

export async function fetchAiLabOverview() {
  const response = await fetch(`${API_BASE_URL}/ai-lab/overview`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{
    extractedPlaces: string[];
    extractions: AiLabExtraction[];
  }>(response);
}

export async function runAiExtraction(payload: {
  youtubeUrl: string;
  travelRegion: string;
}) {
  const response = await fetch(`${API_BASE_URL}/ai-lab/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJson<{
    message: string;
    extraction: AiLabExtraction | null;
    overview: {
      extractedPlaces: string[];
      extractions: AiLabExtraction[];
    };
  }>(response);
}

export async function saveAiPlace(placeId: string) {
  const response = await fetch(`${API_BASE_URL}/ai-lab/places/${placeId}/save`, {
    method: "POST",
    credentials: "include",
  });

  return parseJson<{
    message: string;
    overview: {
      extractedPlaces: string[];
      extractions: AiLabExtraction[];
    };
  }>(response);
}

export async function fetchMySummary() {
  const response = await fetch(`${API_BASE_URL}/my/summary`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{
    savedPlans: SavedPlan[];
    savedAiPlaces: SavedAiPlace[];
  }>(response);
}
