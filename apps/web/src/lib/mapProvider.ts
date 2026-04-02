import type { TravelRegion } from "@travel/shared";
import {
  fetchPlaceDetails as fetchGooglePlaceDetails,
  fetchPlaceSuggestions as fetchGooglePlaceSuggestions,
  loadGoogleMaps,
} from "./googleMaps";
import {
  fetchPlaceDetails as fetchKakaoPlaceDetails,
  fetchPlaceSuggestions as fetchKakaoPlaceSuggestions,
  loadKakaoMaps,
} from "./kakaoMaps";
import type { PlaceDetails, PlaceSuggestion, SuggestionSearchOptions } from "./mapTypes";
import { getMapProvider } from "./travelRegion";

export async function loadMapSdkByRegion(region: TravelRegion | undefined) {
  return getMapProvider(region) === "kakao" ? loadKakaoMaps() : loadGoogleMaps();
}

export async function fetchPlaceSuggestionsByRegion(
  region: TravelRegion | undefined,
  input: string,
  options: SuggestionSearchOptions = {},
) {
  return getMapProvider(region) === "kakao"
    ? fetchKakaoPlaceSuggestions(input, options)
    : fetchGooglePlaceSuggestions(region, input, options);
}

export async function fetchPlaceDetailsByRegion(
  region: TravelRegion | undefined,
  placeId: string,
) {
  return getMapProvider(region) === "kakao"
    ? fetchKakaoPlaceDetails(placeId)
    : fetchGooglePlaceDetails(placeId);
}

export type { PlaceDetails, PlaceSuggestion, SuggestionSearchOptions };
