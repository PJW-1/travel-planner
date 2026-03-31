import type { MarketRoute, PlannerStop, SavedPlan, TrendSpot, TripConfig } from "@travel/shared";

export const upcomingTrip = {
  month: "May",
  day: "24",
  title: "서울 성수동 당일치기 투어",
  description: "서울역 출발 • 총 4개 장소 • 동선 점수 92",
};

export const tripConfig: TripConfig = {
  destination: "서울",
  days: 3,
  lunchTime: "12:00",
  dinnerTime: "18:30",
  tags: ["감성", "맛집", "도보 여행"],
};

export const plannerStops: PlannerStop[] = [
  {
    id: "stop-seoul-station",
    name: "서울역",
    category: "교통 허브",
    categoryKey: "transport",
    time: "10:00",
    congestion: 40,
    stayMinutes: 20,
    travelMinutes: 15,
    position: { x: 18, y: 52 },
  },
  {
    id: "stop-seongsu-cafe",
    name: "성수 시그니처 카페",
    category: "카페",
    categoryKey: "cafe",
    time: "11:45",
    congestion: 85,
    stayMinutes: 70,
    travelMinutes: 20,
    forked: true,
    position: { x: 56, y: 32 },
  },
  {
    id: "stop-seoul-forest",
    name: "서울숲 산책",
    category: "액티비티",
    categoryKey: "activity",
    time: "14:00",
    congestion: 30,
    stayMinutes: 55,
    travelMinutes: 18,
    position: { x: 50, y: 56 },
  },
  {
    id: "stop-ttukseom",
    name: "뚝섬 한강공원",
    category: "뷰 포인트",
    categoryKey: "view",
    time: "17:30",
    congestion: 65,
    stayMinutes: 90,
    travelMinutes: 0,
    position: { x: 63, y: 76 },
  },
];

export const trendSpots: TrendSpot[] = [
  { title: "제주 비자림로", rank: 1, tag: "자연" },
  { title: "성수 연무장길", rank: 2, tag: "팝업" },
  { title: "강릉 툇마루", rank: 3, tag: "카페" },
  { title: "경주 황리단길", rank: 4, tag: "한옥" },
];

export const marketRoutes: MarketRoute[] = [
  {
    id: "market-seongsu",
    title: "성수동 힙플레이스 완전 정복",
    author: "TravelMaster",
    likes: 120,
    comments: 12,
    theme: "urban",
    tags: ["성수", "데이트"],
  },
  {
    id: "market-jeju-east",
    title: "나만 알고 싶은 제주 동쪽 카페 루트",
    author: "JejuLover",
    likes: 95,
    comments: 7,
    theme: "coast",
    tags: ["제주", "카페"],
  },
  {
    id: "market-gangneung",
    title: "강릉 1박 2일 뚜벅이 코스",
    author: "WalkHolic",
    likes: 340,
    comments: 34,
    theme: "walking",
    tags: ["강릉", "뚜벅이"],
  },
  {
    id: "market-busan",
    title: "부산 전포동 맛집 탐방",
    author: "TastyRoad",
    likes: 88,
    comments: 5,
    theme: "cafe",
    tags: ["부산", "맛집"],
  },
];

export const savedPlans: SavedPlan[] = [
  {
    id: "save-jeju-east",
    title: "제주도 동쪽 투어",
    date: "2026.06.15",
    placeCount: 5,
    emoji: "🏝️",
  },
  {
    id: "save-tokyo-food",
    title: "도쿄 3박 4일 먹방 여행",
    date: "2026.07.20",
    placeCount: 12,
    emoji: "🍣",
  },
  {
    id: "save-seongsu",
    title: "성수동 힙플레이스",
    date: "2026.05.01",
    placeCount: 4,
    emoji: "☕",
  },
];
