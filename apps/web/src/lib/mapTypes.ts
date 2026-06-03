import type { PlaceCategoryKey, PlaceProvider } from "@travel/shared";

export type PlaceSuggestion = {
  placeId: string;
  title: string;
  subtitle: string;
  description: string;
  distanceMeters?: number;
  categoryGroupCode?: string;
  categoryKey?: PlaceCategoryKey;
};

export type PlaceDetails = {
  placeId: string;
  provider: PlaceProvider;
  providerPlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  websiteUrl?: string;
  providerUrl?: string;
  openingHours?: string[];
  categoryKey?: PlaceCategoryKey;
  rawPayload?: Record<string, unknown> | null;
};

export type SuggestionSearchOptions = {
  center?: {
    lat: number | null;
    lng: number | null;
  } | null;
  radius?: number;
};
