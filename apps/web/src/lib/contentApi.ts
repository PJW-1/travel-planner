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
    routes: MarketRoute[];
  }>(response);
}

export async function fetchAiLabOverview() {
  const response = await fetch(`${API_BASE_URL}/ai-lab/overview`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{
    extractedPlaces: string[];
  }>(response);
}

export async function fetchMySummary() {
  const response = await fetch(`${API_BASE_URL}/my/summary`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{
    savedPlans: SavedPlan[];
  }>(response);
}
