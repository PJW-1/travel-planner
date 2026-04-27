export type TravelRegion =
  | "korea"
  | "japan"
  | "southeast_asia"
  | "europe"
  | "america"
  | "greater_china"
  | "oceania";

export type PlaceProvider = "kakao" | "google" | "internal";

export type TripConfig = {
  destination: string;
  days: number;
  lunchTime: string;
  dinnerTime: string;
  tags: string[];
  travelRegion?: TravelRegion;
  startPoint?: {
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
  } | null;
  endPoint?: {
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
  } | null;
};

export type PlannerStop = {
  id: string;
  placeId?: string;
  name: string;
  category: string;
  categoryKey: "transport" | "cafe" | "activity" | "view";
  address?: string;
  lat?: number;
  lng?: number;
  provider?: PlaceProvider;
  providerPlaceId?: string;
  phone?: string;
  websiteUrl?: string;
  providerUrl?: string;
  openingHours?: string[];
  time: string;
  congestion: number;
  stayMinutes: number;
  travelMinutes: number;
  transportType?: string;
  stopOrder?: number;
  dayNumber?: number;
  distanceKm?: number;
  forked?: boolean;
  position: {
    x: number;
    y: number;
  };
};

export type TrendSpot = {
  title: string;
  rank: number;
  tag: string;
};

export type MarketRoute = {
  id: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  theme: "urban" | "cafe" | "walking" | "coast";
  tags: string[];
};

export type SavedPlan = {
  id: string;
  title: string;
  date: string;
  placeCount: number;
  emoji: string;
};
