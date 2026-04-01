import type { PlannerStop } from "@travel/shared";
import { API_BASE_URL } from "./authApi";

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

export type TripListItem = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
};

export type PlannerDay = {
  id: string;
  dayNumber: number;
  date: string;
};

export type PlannerTripConfig = {
  title: string;
  destination: string;
  startDate: string;
  days: number;
  lunchTime: string;
  dinnerTime: string;
  tags: string[];
};

export type PlannerTripDetail = {
  trip: TripListItem;
  tripConfig: PlannerTripConfig;
  days: PlannerDay[];
  selectedDayNumber: number;
  stops: PlannerStop[];
  summary: PlannerSummary;
  insights: PlannerInsight[];
};

export type TripPayload = {
  title: string;
  destination: string;
  startDate: string;
  days: number;
  lunchTime: string;
  dinnerTime: string;
  tags: string[];
  selectedDayNumber?: number;
};

export type TripStopPayload = {
  dayNumber: number;
  name: string;
  categoryKey: "transport" | "cafe" | "activity" | "view";
  time: string;
  stayMinutes: number;
  travelMinutes: number;
  distanceKm: number;
  congestion: number;
  transportType: string;
  stopOrder: number;
  forked: boolean;
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "일정 처리 중 오류가 발생했습니다.";

    throw new Error(message);
  }

  return data as T;
}

export async function fetchTrips() {
  const response = await fetch(`${API_BASE_URL}/trips`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{ items: TripListItem[] }>(response);
}

export async function fetchTripDetail(tripId: string, dayNumber: number) {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}?day=${dayNumber}`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<PlannerTripDetail>(response);
}

export async function createTrip(payload: TripPayload) {
  const response = await fetch(`${API_BASE_URL}/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJson<{
    message: string;
    trip: PlannerTripDetail;
  }>(response);
}

export async function updateTrip(tripId: string, payload: TripPayload) {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJson<{
    message: string;
    trip: PlannerTripDetail;
  }>(response);
}

export async function deleteTrip(tripId: string) {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseJson<{ message: string }>(response);
}

export async function createTripStop(tripId: string, payload: TripStopPayload) {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}/stops`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJson<{
    message: string;
    stopId: string;
    trip: PlannerTripDetail;
  }>(response);
}

export async function updateTripStop(
  tripId: string,
  stopId: string,
  payload: TripStopPayload,
) {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}/stops/${stopId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJson<{
    message: string;
    trip: PlannerTripDetail;
  }>(response);
}

export async function deleteTripStop(tripId: string, stopId: string, dayNumber: number) {
  const response = await fetch(`${API_BASE_URL}/trips/${tripId}/stops/${stopId}?day=${dayNumber}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseJson<{
    message: string;
    trip: PlannerTripDetail | null;
  }>(response);
}
