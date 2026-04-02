export type PlaceSuggestion = {
  placeId: string;
  title: string;
  subtitle: string;
  description: string;
  distanceMeters?: number;
  categoryGroupCode?: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type SuggestionSearchOptions = {
  center?: {
    lat: number | null;
    lng: number | null;
  } | null;
  radius?: number;
};
