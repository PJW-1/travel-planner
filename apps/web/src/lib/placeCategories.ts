import type { PlaceCategoryKey } from "@travel/shared";

export const placeCategoryLabels: Record<PlaceCategoryKey, string> = {
  restaurant: "식당",
  cafe: "카페",
  attraction: "관광지",
  shopping: "쇼핑",
  transport: "교통",
  lodging: "숙소",
  activity: "액티비티",
  view: "뷰 포인트",
};

export const editablePlaceCategories: PlaceCategoryKey[] = [
  "restaurant",
  "cafe",
  "attraction",
  "shopping",
  "transport",
  "lodging",
  "activity",
  "view",
];

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function inferPlaceCategory(input: {
  provider?: string;
  categoryName?: string;
  categoryGroupCode?: string;
  types?: string[];
  title?: string;
  description?: string;
}): PlaceCategoryKey {
  const categoryGroupCode = String(input.categoryGroupCode ?? "").toUpperCase();
  const types = (input.types ?? []).map((type) => type.toLowerCase());
  const text = [
    input.categoryName,
    input.title,
    input.description,
    ...(input.types ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    categoryGroupCode === "FD6" ||
    types.some((type) =>
      [
        "restaurant",
        "meal_takeaway",
        "meal_delivery",
        "food",
        "bar",
      ].includes(type),
    ) ||
    includesAny(text, ["음식", "맛집", "식당", "한식", "일식", "중식", "양식", "분식", "고기", "레스토랑", "restaurant", "food"])
  ) {
    return "restaurant";
  }

  if (
    categoryGroupCode === "CE7" ||
    types.some((type) => ["cafe", "bakery"].includes(type)) ||
    includesAny(text, ["카페", "커피", "디저트", "베이커리", "cafe", "coffee", "bakery", "dessert"])
  ) {
    return "cafe";
  }

  if (
    categoryGroupCode === "SW8" ||
    types.some((type) => ["subway_station", "train_station", "bus_station", "airport", "transit_station"].includes(type)) ||
    includesAny(text, ["지하철", "역", "터미널", "공항", "정류장", "교통", "station", "airport", "terminal"])
  ) {
    return "transport";
  }

  if (
    categoryGroupCode === "AD5" ||
    types.some((type) => ["lodging", "hotel"].includes(type)) ||
    includesAny(text, ["숙소", "호텔", "펜션", "리조트", "게스트하우스", "lodging", "hotel", "resort"])
  ) {
    return "lodging";
  }

  if (
    categoryGroupCode === "MT1" ||
    types.some((type) => ["shopping_mall", "department_store", "store", "clothing_store"].includes(type)) ||
    includesAny(text, ["쇼핑", "백화점", "마트", "시장", "상점", "몰", "shopping", "market", "store"])
  ) {
    return "shopping";
  }

  if (
    types.some((type) =>
      ["tourist_attraction", "museum", "park", "aquarium", "zoo", "art_gallery"].includes(type),
    ) ||
    includesAny(text, ["관광", "명소", "박물관", "공원", "전시", "미술관", "tourist", "museum", "park", "gallery"])
  ) {
    return "attraction";
  }

  if (includesAny(text, ["전망", "뷰", "해변", "바다", "산책", "view", "beach", "observatory"])) {
    return "view";
  }

  return "activity";
}

export function normalizePlaceCategoryKey(value: string | undefined | null): PlaceCategoryKey {
  return editablePlaceCategories.includes(value as PlaceCategoryKey)
    ? (value as PlaceCategoryKey)
    : "activity";
}
