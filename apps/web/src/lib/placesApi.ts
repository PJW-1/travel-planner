import type { PlaceProvider } from "@travel/shared";
import { API_BASE_URL } from "./authApi";

export type PlaceDetail = {
  id: string;
  name: string;
  category: string;
  categoryKey: string;
  address: string;
  lat: number;
  lng: number;
  region: string;
  provider: PlaceProvider;
  providerPlaceId: string;
  phone: string;
  websiteUrl: string;
  providerUrl: string;
  openingHours: string[];
  sourceType: string;
  lastSyncedAt: string | null;
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "장소 정보를 불러오는 중 오류가 발생했습니다.";

    throw new Error(message);
  }

  return data as T;
}

export async function fetchPlaceDetail(placeId: string) {
  const normalizedPlaceId = String(placeId ?? "").trim();

  if (
    !normalizedPlaceId ||
    normalizedPlaceId === "undefined" ||
    normalizedPlaceId === "null"
  ) {
    throw new Error("장소 ID가 없어 상세 정보를 불러올 수 없습니다.");
  }

  const response = await fetch(`${API_BASE_URL}/places/${encodeURIComponent(normalizedPlaceId)}`, {
    method: "GET",
    credentials: "include",
  });

  return parseJson<{ place: PlaceDetail }>(response);
}
