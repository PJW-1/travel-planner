export type TripConfig = {
  destination: string;
  days: number;
  lunchTime: string;
  dinnerTime: string;
  tags: string[];
};

export type PlannerStop = {
  id: string;
  name: string;
  category: string;
  categoryKey: "transport" | "cafe" | "activity" | "view";
  time: string;
  congestion: number;
  stayMinutes: number;
  travelMinutes: number;
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
