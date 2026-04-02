import type { TravelRegion } from "@travel/shared";

export const travelRegionOptions: Array<{
  value: TravelRegion;
  label: string;
  description: string;
}> = [
  {
    value: "korea",
    label: "대한민국",
    description: "국내 도시와 지역 여행",
  },
  {
    value: "japan",
    label: "일본",
    description: "도쿄, 오사카, 후쿠오카 등",
  },
  {
    value: "southeast_asia",
    label: "동남아",
    description: "방콕, 다낭, 싱가포르 등",
  },
  {
    value: "europe",
    label: "유럽",
    description: "파리, 런던, 바르셀로나 등",
  },
  {
    value: "america",
    label: "미국",
    description: "뉴욕, LA, 하와이 등",
  },
  {
    value: "greater_china",
    label: "중화권",
    description: "홍콩, 타이베이, 상하이 등",
  },
  {
    value: "oceania",
    label: "오세아니아",
    description: "시드니, 멜버른, 오클랜드 등",
  },
];

export function getMapProvider(region: TravelRegion | undefined) {
  return region === "korea" || !region ? "kakao" : "google";
}

export function getTravelRegionLabel(region: TravelRegion | undefined) {
  return (
    travelRegionOptions.find((option) => option.value === region)?.label ?? "대한민국"
  );
}
