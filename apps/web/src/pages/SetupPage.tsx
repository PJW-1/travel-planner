import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, Plus, Search } from "lucide-react";
import type { PlaceProvider, PlannerStop, TravelRegion } from "@travel/shared";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { PlaceDetailSheet } from "@/components/places/PlaceDetailSheet";
import { JourneyAnchorCard } from "@/components/planner/JourneyAnchorCard";
import { TimelineStopCard } from "@/components/planner/TimelineStopCard";
import type { PlaceDetail } from "@/lib/placesApi";
import {
  fetchPlaceDetailsByRegion,
  fetchPlaceSuggestionsByRegion,
  type PlaceSuggestion,
} from "@/lib/mapProvider";
import { getMapProvider, getTravelRegionLabel, travelRegionOptions } from "@/lib/travelRegion";
import {
  createTrip,
  createTripStop,
  deleteTripStop,
  fetchTripDetail,
  optimizeTrip,
  type TripLocationPoint,
  updateTrip,
} from "@/lib/tripsApi";

type TripFormState = {
  title: string;
  days: number;
  lunchTime: string;
  dinnerTime: string;
  transportType: string;
  travelRegion: TravelRegion;
  startPoint: TripLocationPoint | null;
  useCustomEndPoint: boolean;
  endPoint: TripLocationPoint | null;
};

type StopFormState = {
  placeId: string;
  name: string;
  categoryKey: "transport" | "cafe" | "activity" | "view";
  visitTimeMode: "auto" | "manual";
  time: string;
  stayMinutes: number;
  forked: boolean;
  dayNumber: number;
  address: string;
  lat: number | null;
  lng: number | null;
  provider: PlaceProvider | null;
  providerPlaceId: string;
  phone: string;
  websiteUrl: string;
  providerUrl: string;
  openingHours: string[];
};

type SetupPlannerStop = PlannerStop & {
  visitTimeMode?: "auto" | "manual";
};

type JourneyPointField = "start" | "end";

const MAP_POSITIONS = [
  { x: 18, y: 52 },
  { x: 56, y: 32 },
  { x: 50, y: 56 },
  { x: 63, y: 76 },
  { x: 30, y: 28 },
  { x: 72, y: 46 },
  { x: 42, y: 72 },
];

const CATEGORY_LABELS = {
  transport: "교통 허브",
  cafe: "카페",
  activity: "액티비티",
  view: "뷰 포인트",
} satisfies Record<StopFormState["categoryKey"], string>;

function isBroadRegionQuery(value: string) {
  const query = value.trim();
  if (query.length < 2) return false;
  return new Set([
    "서울",
    "부산",
    "대구",
    "인천",
    "광주",
    "대전",
    "울산",
    "세종",
    "경기",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
    "강남",
    "홍대",
    "성수동",
  ]).has(query);
}

function shouldShowBroadRegionHint(region: TravelRegion, query: string) {
  return getMapProvider(region) === "kakao" && isBroadRegionQuery(query);
}

function createDefaultTripForm(): TripFormState {
  return {
    title: "새 여행 일정",
    days: 1,
    lunchTime: "12:00",
    dinnerTime: "18:30",
    transportType: "walk",
    travelRegion: "korea",
    startPoint: null,
    useCustomEndPoint: false,
    endPoint: null,
  };
}

function createDefaultStopForm(dayNumber = 1): StopFormState {
  return {
    placeId: "",
    name: "",
    categoryKey: "activity",
    visitTimeMode: "auto",
    time: "10:00",
    stayMinutes: 60,
    forked: false,
    dayNumber,
    address: "",
    lat: null,
    lng: null,
    provider: null,
    providerPlaceId: "",
    phone: "",
    websiteUrl: "",
    providerUrl: "",
    openingHours: [],
  };
}

function normalizeCategoryKeyForCommunity(
  value: string,
): "transport" | "cafe" | "activity" | "view" {
  if (value === "transport" || value === "cafe" || value === "activity" || value === "view") {
    return value;
  }

  return "activity";
}

function createTempId() {
  return `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function deriveTripDestination(
  tripForm: Pick<TripFormState, "startPoint" | "endPoint" | "travelRegion">,
  stops: SetupPlannerStop[],
) {
  return (
    tripForm.startPoint?.name?.trim() ||
    tripForm.endPoint?.name?.trim() ||
    stops[0]?.name?.trim() ||
    getTravelRegionLabel(tripForm.travelRegion)
  );
}

function createLocalPlaceDetailFromForm(form: StopFormState): PlaceDetail {
  return {
    id: form.placeId || form.providerPlaceId,
    name: form.name,
    category: CATEGORY_LABELS[form.categoryKey],
    categoryKey: form.categoryKey,
    address: form.address,
    lat: form.lat ?? 0,
    lng: form.lng ?? 0,
    region: "",
    provider: form.provider ?? "internal",
    providerPlaceId: form.providerPlaceId,
    phone: form.phone,
    websiteUrl: form.websiteUrl,
    providerUrl: form.providerUrl,
    openingHours: form.openingHours,
    sourceType: "search",
    lastSyncedAt: null,
  };
}

function createLocalPlaceDetailFromStop(stop: SetupPlannerStop): PlaceDetail {
  return {
    id: stop.placeId ?? stop.providerPlaceId ?? stop.id,
    name: stop.name,
    category: stop.category,
    categoryKey: stop.categoryKey,
    address: stop.address ?? "",
    lat: stop.lat ?? 0,
    lng: stop.lng ?? 0,
    region: "",
    provider: stop.provider ?? "internal",
    providerPlaceId: stop.providerPlaceId ?? "",
    phone: stop.phone ?? "",
    websiteUrl: stop.websiteUrl ?? "",
    providerUrl: stop.providerUrl ?? "",
    openingHours: stop.openingHours ?? [],
    sourceType: "search",
    lastSyncedAt: null,
  };
}

function mapStopPreview(
  form: StopFormState,
  transportType: string,
  index: number,
  id = createTempId(),
): SetupPlannerStop {
  const position = MAP_POSITIONS[index] ?? {
    x: 24 + (index % 4) * 14,
    y: 28 + Math.floor(index / 4) * 18,
  };

  return {
    id,
    placeId: form.placeId || form.providerPlaceId || undefined,
    name: form.name.trim(),
    category: CATEGORY_LABELS[form.categoryKey],
    categoryKey: form.categoryKey,
    address: form.address,
    lat: form.lat ?? undefined,
    lng: form.lng ?? undefined,
    provider: form.provider ?? undefined,
    providerPlaceId: form.providerPlaceId || undefined,
    phone: form.phone || undefined,
    websiteUrl: form.websiteUrl || undefined,
    providerUrl: form.providerUrl || undefined,
    openingHours: form.openingHours,
    time: form.visitTimeMode === "manual" ? form.time : "자동 배정",
    congestion: 0,
    stayMinutes: form.stayMinutes,
    travelMinutes: 0,
    transportType,
    stopOrder: index + 1,
    dayNumber: form.dayNumber,
    distanceKm: 0,
    forked: form.forked,
    visitTimeMode: form.visitTimeMode,
    position,
  };
}

function mapFormFromStop(stop: SetupPlannerStop): StopFormState {
  return {
    placeId: stop.placeId ?? "",
    name: stop.name,
    categoryKey: stop.categoryKey,
    visitTimeMode: stop.visitTimeMode ?? "auto",
    time: stop.time && stop.time !== "자동 배정" ? stop.time : "10:00",
    stayMinutes: stop.stayMinutes,
    forked: Boolean(stop.forked),
    dayNumber: stop.dayNumber ?? 1,
    address: stop.address ?? "",
    lat: stop.lat ?? null,
    lng: stop.lng ?? null,
    provider: stop.provider ?? null,
    providerPlaceId: stop.providerPlaceId ?? "",
    phone: stop.phone ?? "",
    websiteUrl: stop.websiteUrl ?? "",
    providerUrl: stop.providerUrl ?? "",
    openingHours: stop.openingHours ?? [],
  };
}

function getPlaceSearchPlaceholder(region: TravelRegion) {
  if (region === "korea") return "장소를 검색해보세요";
  if (region === "japan") return "예: 시부야 스카이, 도쿄역";
  if (region === "europe") return "예: Eiffel Tower, Louvre Museum";
  if (region === "america") return "예: Times Square, LAX";
  return "장소를 검색해보세요";
}

export function SetupPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editingTripId = searchParams.get("tripId");
  const communityPlaceId = searchParams.get("communityPlaceId");
  const communityPlaceName = searchParams.get("communityPlaceName") ?? "";
  const communityPlaceAddress = searchParams.get("communityPlaceAddress") ?? "";
  const communityPlaceCategoryKey =
    (searchParams.get("communityPlaceCategoryKey") as StopFormState["categoryKey"] | null) ??
    "activity";
  const communityPlaceLat = searchParams.get("communityPlaceLat");
  const communityPlaceLng = searchParams.get("communityPlaceLng");
  const [tripForm, setTripForm] = useState<TripFormState>(createDefaultTripForm());
  const [stopForm, setStopForm] = useState<StopFormState>(createDefaultStopForm());
  const [plannedStops, setPlannedStops] = useState<SetupPlannerStop[]>([]);
  const [originalStopIds, setOriginalStopIds] = useState<string[]>([]);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [journeyPointField, setJourneyPointField] = useState<JourneyPointField | null>(null);
  const [journeyPointQuery, setJourneyPointQuery] = useState({ start: "", end: "" });
  const [journeyPointSuggestions, setJourneyPointSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searchingJourneyPoints, setSearchingJourneyPoints] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<PlaceDetail | null>(null);
  const [error, setError] = useState("");
  const [injectedCommunityPlaceId, setInjectedCommunityPlaceId] = useState<string | null>(null);
  const isEditMode = Boolean(editingTripId);

  const sortedStops = useMemo(
    () =>
      [...plannedStops].sort((a, b) => {
        const dayDiff = (a.dayNumber ?? 1) - (b.dayNumber ?? 1);
        if (dayDiff !== 0) return dayDiff;
        return (a.stopOrder ?? 1) - (b.stopOrder ?? 1);
      }),
    [plannedStops],
  );
  const previewStopCount = sortedStops.length + (tripForm.startPoint ? 1 : 0);
  const activeProvider = getMapProvider(tripForm.travelRegion);

  useEffect(() => {
    let isMounted = true;

    async function loadTripForEdit() {
      if (!editingTripId) {
        setTripForm(createDefaultTripForm());
        setStopForm(createDefaultStopForm());
        setPlannedStops([]);
        setOriginalStopIds([]);
        setJourneyPointQuery({ start: "", end: "" });
        return;
      }

      setLoadingTrip(true);
      setError("");

      try {
        const firstDay = await fetchTripDetail(editingTripId, 1);
        const remainingDays = firstDay.days
          .filter((day) => day.dayNumber !== 1)
          .map((day) => fetchTripDetail(editingTripId, day.dayNumber));
        const remainingDetails = await Promise.all(remainingDays);
        const allDetails = [firstDay, ...remainingDetails];
        const allStops = allDetails.flatMap((detail) => detail.stops);

        if (!isMounted) return;

        setTripForm({
          title: firstDay.tripConfig.title,
          days: firstDay.tripConfig.days,
          lunchTime: firstDay.tripConfig.lunchTime,
          dinnerTime: firstDay.tripConfig.dinnerTime,
          transportType: allStops[0]?.transportType ?? "walk",
          travelRegion: firstDay.tripConfig.travelRegion ?? "korea",
          startPoint: firstDay.tripConfig.startPoint,
          useCustomEndPoint: Boolean(firstDay.tripConfig.endPoint),
          endPoint: firstDay.tripConfig.endPoint,
        });
        setPlannedStops(allStops.map((stop) => ({ ...stop, visitTimeMode: "auto" })));
        setOriginalStopIds(allStops.map((stop) => stop.id));
        setStopForm(createDefaultStopForm());
        setJourneyPointQuery({
          start: firstDay.tripConfig.startPoint?.name ?? "",
          end: firstDay.tripConfig.endPoint?.name ?? "",
        });
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "일정을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) setLoadingTrip(false);
      }
    }

    void loadTripForEdit();
    return () => {
      isMounted = false;
    };
  }, [editingTripId]);

  useEffect(() => {
    if (
      editingTripId ||
      !communityPlaceId ||
      !communityPlaceName.trim() ||
      injectedCommunityPlaceId === communityPlaceId
    ) {
      return;
    }

    setPlannedStops((current) => {
      const injectedId = `community-${communityPlaceId}`;

      if (current.some((stop) => stop.id === injectedId)) {
        return current;
      }

      return [
        ...current,
        mapStopPreview(
          {
            ...createDefaultStopForm(),
            placeId: communityPlaceId,
            name: communityPlaceName.trim(),
            address: communityPlaceAddress,
            categoryKey: normalizeCategoryKeyForCommunity(communityPlaceCategoryKey),
            lat: communityPlaceLat ? Number(communityPlaceLat) : null,
            lng: communityPlaceLng ? Number(communityPlaceLng) : null,
          },
          tripForm.transportType,
          current.length,
          injectedId,
        ),
      ];
    });

    setInjectedCommunityPlaceId(communityPlaceId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("communityPlaceId");
      next.delete("communityPlaceName");
      next.delete("communityPlaceAddress");
      next.delete("communityPlaceCategoryKey");
      next.delete("communityPlaceLat");
      next.delete("communityPlaceLng");
      return next;
    });
  }, [
    communityPlaceAddress,
    communityPlaceCategoryKey,
    communityPlaceId,
    communityPlaceLat,
    communityPlaceLng,
    communityPlaceName,
    editingTripId,
    injectedCommunityPlaceId,
    setSearchParams,
    tripForm.transportType,
  ]);

  useEffect(() => {
    let isMounted = true;
    const query = stopForm.name.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setSearchingPlaces(false);
      return;
    }

    if (shouldShowBroadRegionHint(tripForm.travelRegion, query)) {
      setSuggestions([]);
      setSearchingPlaces(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setSearchingPlaces(true);

      try {
        const nextSuggestions = await fetchPlaceSuggestionsByRegion(
          tripForm.travelRegion,
          query,
          { center: tripForm.startPoint },
        );

        if (isMounted) {
          setSuggestions(nextSuggestions.slice(0, 8));
          setError("");
        }
      } catch (searchError) {
        if (isMounted) {
          setSuggestions([]);
          setError(searchError instanceof Error ? searchError.message : "장소 검색에 실패했습니다.");
        }
      } finally {
        if (isMounted) {
          setSearchingPlaces(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [stopForm.name, tripForm.startPoint, tripForm.travelRegion]);

  useEffect(() => {
    let isMounted = true;

    if (!journeyPointField) {
      setJourneyPointSuggestions([]);
      setSearchingJourneyPoints(false);
      return;
    }

    const query = journeyPointQuery[journeyPointField].trim();

    if (query.length < 2) {
      setJourneyPointSuggestions([]);
      setSearchingJourneyPoints(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setSearchingJourneyPoints(true);

      try {
        const nextSuggestions = await fetchPlaceSuggestionsByRegion(tripForm.travelRegion, query);

        if (isMounted) {
          setJourneyPointSuggestions(nextSuggestions.slice(0, 6));
          setError("");
        }
      } catch (searchError) {
        if (isMounted) {
          setJourneyPointSuggestions([]);
          setError(
            searchError instanceof Error ? searchError.message : "출발지 검색에 실패했습니다.",
          );
        }
      } finally {
        if (isMounted) {
          setSearchingJourneyPoints(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [journeyPointField, journeyPointQuery, tripForm.travelRegion]);

  function handleAddOrUpdateStop() {
    if (!stopForm.name.trim()) {
      setError("장소 이름을 입력해주세요.");
      return;
    }

    setError("");

    if (editingStopId) {
      setPlannedStops((current) =>
        current.map((stop, index) =>
          stop.id === editingStopId
            ? mapStopPreview(stopForm, tripForm.transportType, index, editingStopId)
            : stop,
        ),
      );
      setEditingStopId(null);
    } else {
      setPlannedStops((current) => [
        ...current,
        mapStopPreview(stopForm, tripForm.transportType, current.length),
      ]);
    }

    setStopForm(createDefaultStopForm(stopForm.dayNumber));
    setSuggestions([]);
  }

  async function handleSelectSuggestion(suggestion: PlaceSuggestion) {
    try {
      const details = await fetchPlaceDetailsByRegion(tripForm.travelRegion, suggestion.placeId);

      setStopForm((current) => ({
        ...current,
        placeId: details.placeId,
        name: details.name || suggestion.title,
        address: details.address,
        lat: details.lat,
        lng: details.lng,
        provider: details.provider,
        providerPlaceId: details.providerPlaceId,
        phone: details.phone ?? "",
        websiteUrl: details.websiteUrl ?? "",
        providerUrl: details.providerUrl ?? "",
        openingHours: details.openingHours ?? [],
      }));
      setSuggestions([]);
      setError("");
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "장소를 불러오지 못했습니다.");
    }
  }

  function handleJourneyPointInput(field: JourneyPointField, value: string) {
    setError("");
    setJourneyPointField(field);
    setJourneyPointQuery((current) => ({ ...current, [field]: value }));
    setTripForm((current) =>
      field === "start" ? { ...current, startPoint: null } : { ...current, endPoint: null },
    );
  }

  async function handleSelectJourneyPoint(field: JourneyPointField, suggestion: PlaceSuggestion) {
    try {
      const details = await fetchPlaceDetailsByRegion(tripForm.travelRegion, suggestion.placeId);
      const nextPoint = {
        name: details.name || suggestion.title,
        address: details.address,
        lat: details.lat,
        lng: details.lng,
      };

      setTripForm((current) =>
        field === "start"
          ? { ...current, startPoint: nextPoint }
          : { ...current, endPoint: nextPoint },
      );
      setJourneyPointQuery((current) => ({ ...current, [field]: nextPoint.name }));
      setJourneyPointField(null);
      setJourneyPointSuggestions([]);
      setError("");
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : "출발지/종료지를 불러오지 못했습니다.");
    }
  }

  function handleEditStop(stop: SetupPlannerStop) {
    setEditingStopId(stop.id);
    setStopForm(mapFormFromStop(stop));
    setSuggestions([]);
    setError("");
  }

  function handleDeleteStop(stop: SetupPlannerStop) {
    setPlannedStops((current) => current.filter((item) => item.id !== stop.id));

    if (editingStopId === stop.id) {
      setEditingStopId(null);
      setStopForm(createDefaultStopForm(stop.dayNumber ?? 1));
    }
  }

  function handleResetStopForm() {
    setEditingStopId(null);
    setStopForm(createDefaultStopForm(stopForm.dayNumber));
    setSuggestions([]);
  }

  async function handleOptimize() {
    if (plannedStops.length === 0) {
      setError("최적화 전에 최소 한 개 이상의 장소를 추가해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let tripId = editingTripId;
      const destination = deriveTripDestination(tripForm, sortedStops);

      if (tripId) {
        await updateTrip(tripId, {
          title: tripForm.title.trim(),
          destination,
          startDate: new Date().toISOString().slice(0, 10),
          days: tripForm.days,
          lunchTime: tripForm.lunchTime,
          dinnerTime: tripForm.dinnerTime,
          tags: [],
          travelRegion: tripForm.travelRegion,
          startPoint: tripForm.startPoint,
          endPoint: tripForm.useCustomEndPoint ? tripForm.endPoint : null,
        });

        for (const stopId of originalStopIds) {
          await deleteTripStop(tripId, stopId, 1);
        }
      } else {
        const created = await createTrip({
          title: tripForm.title.trim(),
          destination,
          startDate: new Date().toISOString().slice(0, 10),
          days: tripForm.days,
          lunchTime: tripForm.lunchTime,
          dinnerTime: tripForm.dinnerTime,
          tags: [],
          travelRegion: tripForm.travelRegion,
          startPoint: tripForm.startPoint,
          endPoint: tripForm.useCustomEndPoint ? tripForm.endPoint : null,
        });

        tripId = created.trip.trip.id;
      }

      for (const [index, stop] of sortedStops.entries()) {
        await createTripStop(tripId, {
          dayNumber: stop.dayNumber ?? 1,
          name: stop.name,
          categoryKey: stop.categoryKey,
          time: stop.visitTimeMode === "manual" ? stop.time : "10:00",
          stayMinutes: stop.stayMinutes,
          travelMinutes: 0,
          distanceKm: 0,
          congestion: 0,
          transportType: tripForm.transportType,
          stopOrder: index + 1,
          forked: Boolean(stop.forked),
          address: stop.address ?? "",
          lat: stop.lat ?? null,
          lng: stop.lng ?? null,
          provider: stop.provider,
          providerPlaceId: stop.providerPlaceId,
          phone: stop.phone,
          websiteUrl: stop.websiteUrl,
          providerUrl: stop.providerUrl,
          openingHours: stop.openingHours,
        });
      }

      await optimizeTrip(tripId, 1);
      navigate(`/planner?tripId=${tripId}&day=1`);
    } catch (optimizeError) {
      setError(optimizeError instanceof Error ? optimizeError.message : "일정을 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow={isEditMode ? "일정 수정" : "일정 설정"}
        title={isEditMode ? "저장한 일정 수정하기" : "새 일정 만들기"}
        description={
          isEditMode
            ? "불러온 일정의 장소와 조건을 조정한 뒤 다시 최적화를 진행합니다."
            : "권역과 이동 조건을 먼저 정하고, 가고 싶은 장소를 순서 없이 담아보세요."
        }
      />

      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}

      <div className="setup-builder">
        <section className="planner-editor-card">
          <div className="planner-section-title">
            <h2>기본 설정</h2>
          </div>

          <div className="planner-field">
            <span>여행 권역</span>
            <div className="travel-region-grid">
              {travelRegionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    tripForm.travelRegion === option.value
                      ? "travel-region-card is-active"
                      : "travel-region-card"
                  }
                    onClick={() => {
                      setTripForm((current) => ({ ...current, travelRegion: option.value }));
                      setSuggestions([]);
                      setJourneyPointSuggestions([]);
                      setError("");
                    }}
                >
                  <strong>{option.label}</strong>
                  <p>{option.description}</p>
                </button>
              ))}
            </div>
            <p className="planner-field__hint">
              현재 {getTravelRegionLabel(tripForm.travelRegion)} 권역으로 검색과 지도를 연결합니다.
              {activeProvider === "kakao"
                ? " 국내에서는 카카오 지도를 사용합니다."
                : " 해외 권역에서는 Google 지도를 사용합니다."}
            </p>
          </div>

          <div className="planner-form planner-form--two-column">
            <label className="planner-field">
              <span>일정 제목</span>
              <input
                value={tripForm.title}
                onChange={(event) =>
                  setTripForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>

            <label className="planner-field">
              <span>여행 일수</span>
              <input
                type="number"
                min={1}
                max={14}
                value={tripForm.days}
                onChange={(event) =>
                  setTripForm((current) => ({
                    ...current,
                    days: Math.max(1, Math.min(14, Number(event.target.value) || 1)),
                  }))
                }
              />
            </label>

            <label className="planner-field">
              <span>점심 시간</span>
              <input
                type="time"
                value={tripForm.lunchTime}
                onChange={(event) =>
                  setTripForm((current) => ({ ...current, lunchTime: event.target.value }))
                }
              />
            </label>

            <label className="planner-field">
              <span>저녁 시간</span>
              <input
                type="time"
                value={tripForm.dinnerTime}
                onChange={(event) =>
                  setTripForm((current) => ({ ...current, dinnerTime: event.target.value }))
                }
              />
            </label>

            <label className="planner-field">
              <span>기본 이동 수단</span>
              <select
                value={tripForm.transportType}
                onChange={(event) =>
                  setTripForm((current) => ({ ...current, transportType: event.target.value }))
                }
              >
                <option value="walk">도보</option>
                <option value="subway">지하철</option>
                <option value="bus">버스</option>
                <option value="car">차량</option>
                <option value="taxi">택시</option>
              </select>
            </label>
          </div>

          <div className="journey-point-card">
            <div className="journey-point-card__header">
              <div>
                <strong>출발지 설정</strong>
                <p>최적화가 어디에서 시작되는지 먼저 정합니다.</p>
              </div>
            </div>

            <label className="planner-field">
              <span>출발지</span>
              <div className="place-search-card__input">
                <Search size={18} />
                <input
                  value={journeyPointQuery.start}
                  placeholder={`${getTravelRegionLabel(tripForm.travelRegion)}에서 출발지를 검색해보세요`}
                  onFocus={() => setJourneyPointField("start")}
                  onChange={(event) => handleJourneyPointInput("start", event.target.value)}
                />
              </div>
            </label>

            {journeyPointField === "start" ? (
              <div className="journey-point-card__suggestions">
                {searchingJourneyPoints ? (
                  <div className="place-suggestion-row__empty">출발지를 찾는 중입니다...</div>
                ) : journeyPointSuggestions.length > 0 ? (
                  <div className="place-suggestion-row">
                    {journeyPointSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        type="button"
                        className="place-suggestion-card place-suggestion-card--compact"
                        onClick={() => handleSelectJourneyPoint("start", suggestion)}
                      >
                        <span className="place-suggestion-card__label">출발지 추천</span>
                        <strong>{suggestion.title}</strong>
                        <p>{suggestion.subtitle || suggestion.description}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="place-suggestion-row__empty">
                    두 글자 이상 입력하면 출발지 후보가 나타납니다.
                  </div>
                )}
              </div>
            ) : null}

            {tripForm.startPoint ? (
              <div className="place-selected-card place-selected-card--compact">
                <MapPin size={16} />
                <div>
                  <strong>{tripForm.startPoint.name}</strong>
                  <p>{tripForm.startPoint.address}</p>
                </div>
              </div>
            ) : null}

            <label className="planner-checkbox">
              <input
                type="checkbox"
                checked={tripForm.useCustomEndPoint}
                onChange={(event) => {
                  const checked = event.target.checked;

                  setTripForm((current) => ({
                    ...current,
                    useCustomEndPoint: checked,
                    endPoint: checked ? current.endPoint : null,
                  }));

                  if (!checked) {
                    setJourneyPointQuery((current) => ({ ...current, end: "" }));
                    setJourneyPointSuggestions([]);
                    setJourneyPointField((current) => (current === "end" ? null : current));
                  }
                }}
              />
              <span>종료지는 따로 설정할게요</span>
            </label>

            {tripForm.useCustomEndPoint ? (
              <div className="journey-point-card__optional">
                <label className="planner-field">
                  <span>종료지</span>
                  <div className="place-search-card__input">
                    <Search size={18} />
                    <input
                      value={journeyPointQuery.end}
                      placeholder={`${getTravelRegionLabel(tripForm.travelRegion)}에서 종료지를 검색해보세요`}
                      onFocus={() => setJourneyPointField("end")}
                      onChange={(event) => handleJourneyPointInput("end", event.target.value)}
                    />
                  </div>
                </label>

                {journeyPointField === "end" ? (
                  <div className="journey-point-card__suggestions">
                    {searchingJourneyPoints ? (
                      <div className="place-suggestion-row__empty">종료지를 찾는 중입니다...</div>
                    ) : journeyPointSuggestions.length > 0 ? (
                      <div className="place-suggestion-row">
                        {journeyPointSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.placeId}
                            type="button"
                            className="place-suggestion-card place-suggestion-card--compact"
                            onClick={() => handleSelectJourneyPoint("end", suggestion)}
                          >
                            <span className="place-suggestion-card__label">종료지 추천</span>
                            <strong>{suggestion.title}</strong>
                            <p>{suggestion.subtitle || suggestion.description}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="place-suggestion-row__empty">종료지를 따로 두고 싶다면 장소를 검색해보세요.</div>
                    )}
                  </div>
                ) : null}

                {tripForm.endPoint ? (
                  <div className="place-selected-card place-selected-card--compact">
                    <MapPin size={16} />
                    <div>
                      <strong>{tripForm.endPoint.name}</strong>
                      <p>{tripForm.endPoint.address}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <div className="setup-builder__grid">
          <section className="planner-editor-card planner-editor-card--sticky">
            <div className="planner-section-title">
              <h2>{editingStopId ? "장소 수정" : "장소 추가"}</h2>
              <div className="planner-inline-actions">
                {editingStopId ? (
                  <button type="button" className="button button--secondary" onClick={handleResetStopForm}>
                    취소
                  </button>
                ) : null}
                <button type="button" className="button button--primary" onClick={handleAddOrUpdateStop}>
                  <Plus size={16} />
                  {editingStopId ? "수정 반영" : "장소 담기"}
                </button>
              </div>
            </div>

            <div className="place-search-card">
              <label className="planner-field place-search-card__field">
                <span>장소 검색</span>
                <div className="place-search-card__input">
                  <Search size={18} />
                  <input
                    value={stopForm.name}
                    placeholder={getPlaceSearchPlaceholder(tripForm.travelRegion)}
                    onChange={(event) =>
                      {
                        setError("");
                        setStopForm((current) => ({
                          ...current,
                          name: event.target.value,
                          address: "",
                          lat: null,
                          lng: null,
                        }));
                      }
                    }
                  />
                </div>
              </label>

              <div className="place-suggestion-row">
                {searchingPlaces ? (
                  <div className="place-suggestion-row__empty">장소를 찾는 중입니다...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.placeId}
                      type="button"
                      className="place-suggestion-card"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <span className="place-suggestion-card__label">추천 장소</span>
                      <strong>{suggestion.title}</strong>
                      <p>{suggestion.subtitle || suggestion.description}</p>
                    </button>
                  ))
                ) : shouldShowBroadRegionHint(tripForm.travelRegion, stopForm.name) ? (
                  <div className="place-suggestion-row__empty">
                    지역명만으로는 결과가 너무 넓어요. `서울숲`, `성수 카페`, `강남 맛집`처럼 더 구체적으로 입력해보세요.
                  </div>
                ) : (
                  <div className="place-suggestion-row__empty">두 글자 이상 입력하면 연관 장소가 카드로 나타납니다.</div>
                )}
              </div>

              {stopForm.address ? (
                <div className="place-selected-card">
                  <MapPin size={16} />
                  <div>
                    <strong>{stopForm.name}</strong>
                    <p>{stopForm.address}</p>
                  </div>
                  {stopForm.placeId ? (
                    <button
                      type="button"
                      className="button button--ghost button--compact"
                      onClick={() => {
                        setSelectedPlaceId(stopForm.placeId);
                        setSelectedPlaceDetail(createLocalPlaceDetailFromForm(stopForm));
                      }}
                    >
                      상세 보기
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="planner-form planner-form--two-column">
              <label className="planner-field">
                <span>카테고리</span>
                <select
                  value={stopForm.categoryKey}
                  onChange={(event) =>
                    setStopForm((current) => ({
                      ...current,
                      categoryKey: event.target.value as StopFormState["categoryKey"],
                    }))
                  }
                >
                  <option value="transport">교통</option>
                  <option value="cafe">카페</option>
                  <option value="activity">액티비티</option>
                  <option value="view">뷰 포인트</option>
                </select>
              </label>

              <label className="planner-field">
                <span>일차</span>
                <select
                  value={stopForm.dayNumber}
                  onChange={(event) =>
                    setStopForm((current) => ({ ...current, dayNumber: Number(event.target.value) }))
                  }
                >
                  {Array.from({ length: tripForm.days }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}일차
                    </option>
                  ))}
                </select>
              </label>

              <label className="planner-field">
                <span>방문 시간</span>
                <div className="visit-time-mode">
                  <button
                    type="button"
                    className={
                      stopForm.visitTimeMode === "auto"
                        ? "visit-time-mode__button is-active"
                        : "visit-time-mode__button"
                    }
                    onClick={() => setStopForm((current) => ({ ...current, visitTimeMode: "auto" }))}
                  >
                    자동
                  </button>
                  <button
                    type="button"
                    className={
                      stopForm.visitTimeMode === "manual"
                        ? "visit-time-mode__button is-active"
                        : "visit-time-mode__button"
                    }
                    onClick={() => setStopForm((current) => ({ ...current, visitTimeMode: "manual" }))}
                  >
                    직접 설정
                  </button>
                </div>
                {stopForm.visitTimeMode === "manual" ? (
                  <input
                    type="time"
                    value={stopForm.time}
                    onChange={(event) => setStopForm((current) => ({ ...current, time: event.target.value }))}
                  />
                ) : (
                  <p className="planner-field__hint">방문 시간은 최적화 결과에서 자동으로 배치됩니다.</p>
                )}
              </label>

              <label className="planner-field">
                <span>체류 시간(분)</span>
                <input
                  type="number"
                  min={0}
                  value={stopForm.stayMinutes}
                  onChange={(event) =>
                    setStopForm((current) => ({
                      ...current,
                      stayMinutes: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </label>
            </div>

            <label className="planner-checkbox">
              <input
                type="checkbox"
                checked={stopForm.forked}
                onChange={(event) => setStopForm((current) => ({ ...current, forked: event.target.checked }))}
              />
              <span>포크한 장소로 표시</span>
            </label>
          </section>

          <section className="planner-editor-card">
            <div className="planner-section-title">
              <h2>이번 일정에 담긴 장소</h2>
              <span className="planner-muted">{loadingTrip ? "불러오는 중" : `${previewStopCount}개 등록`}</span>
            </div>

            {previewStopCount === 0 ? (
              <div className="planner-empty">
                <strong>아직 추가한 장소가 없습니다.</strong>
                <p>장소와 체류 시간만 먼저 정한 뒤 최적화를 시작해보세요.</p>
              </div>
            ) : (
              <>
                {tripForm.startPoint ? (
                  <JourneyAnchorCard
                    title={tripForm.startPoint.name}
                    address={tripForm.startPoint.address}
                    showConnector={sortedStops.length > 0}
                  />
                ) : null}
                {sortedStops.map((stop, index) => (
                  <TimelineStopCard
                    key={stop.id}
                    stop={stop}
                    index={index + (tripForm.startPoint ? 1 : 0)}
                    last={index === sortedStops.length - 1}
                    editing={editingStopId === stop.id}
                    onEdit={handleEditStop}
                    onDelete={handleDeleteStop}
                    onOpenDetail={
                      stop.placeId
                        ? (selectedStop) => {
                            setSelectedPlaceId(selectedStop.placeId ?? null);
                            setSelectedPlaceDetail(createLocalPlaceDetailFromStop(selectedStop));
                          }
                        : undefined
                    }
                  />
                ))}
              </>
            )}

            <div className="setup-builder__footer">
              <button className="button button--primary" onClick={handleOptimize} disabled={submitting || loadingTrip}>
                최적화 시작
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </div>
      <PlaceDetailSheet
        placeId={selectedPlaceId}
        open={Boolean(selectedPlaceId)}
        providedPlace={selectedPlaceDetail}
        onClose={() => {
          setSelectedPlaceId(null);
          setSelectedPlaceDetail(null);
        }}
      />
    </div>
  );
}
