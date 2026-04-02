import type { PlannerStop } from "@travel/shared";
import type {
  PlannerRouteSegment,
  PlannerTripDetail,
  TripLocationPoint,
} from "./tripsApi";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roundTo(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 10 * 60;
  }

  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number) {
  const normalized = Math.max(0, Math.round(totalMinutes));
  const hours = String(Math.floor(normalized / 60) % 24).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function estimateTravelMinutes(
  distanceKm: number,
  transportType: string,
  isLastSegment = false,
) {
  if (isLastSegment) {
    return 0;
  }

  if (transportType === "walk") {
    return Math.max(3, Math.round(distanceKm * 14 + (distanceKm > 1 ? distanceKm * 1.5 : 0)));
  }

  if (transportType === "taxi") {
    return Math.max(4, Math.round(3 + distanceKm * 2.8));
  }

  if (transportType === "car") {
    return Math.max(4, Math.round(4 + distanceKm * 2.4 + 10));
  }

  const fixedPenalty = transportType === "subway" ? 6 : 8;
  const speedFactor = transportType === "subway" ? 3.2 : 4.3;
  const transitMinutes = Math.max(5, Math.round(fixedPenalty + distanceKm * speedFactor));
  const walkMinutes = Math.max(3, Math.round(distanceKm * 14));

  return distanceKm <= 0.8 && walkMinutes <= transitMinutes + 2 ? walkMinutes : transitMinutes;
}

function buildStraightSegment(
  id: string,
  label: string,
  mode: string,
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): PlannerRouteSegment {
  const distanceKm = roundTo(haversineDistanceKm(from, to), 2);
  return {
    id,
    label,
    mode,
    distanceKm,
    travelMinutes: estimateTravelMinutes(distanceKm, mode),
    path: [
      { lat: Number(from.lat), lng: Number(from.lng) },
      { lat: Number(to.lat), lng: Number(to.lng) },
    ],
  };
}

function isValidPoint(
  point: TripLocationPoint | null | undefined,
): point is TripLocationPoint & { lat: number; lng: number } {
  return Boolean(
    point &&
      typeof point.lat === "number" &&
      typeof point.lng === "number" &&
      !Number.isNaN(point.lat) &&
      !Number.isNaN(point.lng),
  );
}

function isValidStopPoint(stop: PlannerStop): stop is PlannerStop & { lat: number; lng: number } {
  return (
    typeof stop.lat === "number" &&
    typeof stop.lng === "number" &&
    !Number.isNaN(stop.lat) &&
    !Number.isNaN(stop.lng)
  );
}

export function reorderStops(stops: PlannerStop[], draggedId: string, targetId: string) {
  const current = [...stops];
  const draggedIndex = current.findIndex((stop) => stop.id === draggedId);
  const targetIndex = current.findIndex((stop) => stop.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return stops;
  }

  const [draggedStop] = current.splice(draggedIndex, 1);
  current.splice(targetIndex, 0, draggedStop);
  return current;
}

export function buildPreviewTripDetail(
  tripDetail: PlannerTripDetail,
  orderedStops: PlannerStop[],
) {
  const stops = orderedStops.map((stop) => ({ ...stop }));
  const routeSegments: PlannerRouteSegment[] = [];
  const startPoint = tripDetail.tripConfig.startPoint;
  const endPoint = tripDetail.tripConfig.endPoint;
  let totalDistanceKm = 0;
  let totalTravelMinutes = 0;
  let currentMinutes = stops.length > 0 ? parseTimeToMinutes(stops[0].time) : 10 * 60;
  const firstStop = stops[0];

  if (isValidPoint(startPoint) && firstStop && isValidStopPoint(firstStop)) {
    const segment = buildStraightSegment(
      `start-${firstStop.id}`,
      `${startPoint.name} -> ${firstStop.name}`,
      firstStop.transportType ?? "walk",
      startPoint,
      firstStop,
    );
    routeSegments.push(segment);
    totalDistanceKm += segment.distanceKm;
    totalTravelMinutes += segment.travelMinutes;
  }

  const remappedStops = stops.map((stop, index) => {
    const nextStop = stops[index + 1];

    if (!nextStop || !isValidStopPoint(stop) || !isValidStopPoint(nextStop)) {
      return {
        ...stop,
        stopOrder: index + 1,
        distanceKm: 0,
        travelMinutes: 0,
        time: formatMinutesToTime(currentMinutes),
      };
    }

    const distanceKm = roundTo(haversineDistanceKm(stop, nextStop), 2);
    const travelMinutes = estimateTravelMinutes(distanceKm, stop.transportType ?? "walk");
    const updatedStop = {
      ...stop,
      stopOrder: index + 1,
      distanceKm,
      travelMinutes,
      time: formatMinutesToTime(currentMinutes),
    };

    routeSegments.push(
      buildStraightSegment(
        `${stop.id}-${nextStop.id}`,
        `${stop.name} -> ${nextStop.name}`,
        stop.transportType ?? "walk",
        stop,
        nextStop,
      ),
    );

    totalDistanceKm += distanceKm;
    totalTravelMinutes += travelMinutes;
    currentMinutes += stop.stayMinutes + travelMinutes;

    return updatedStop;
  });

  const lastStop = remappedStops[remappedStops.length - 1];

  if (lastStop && isValidStopPoint(lastStop) && isValidPoint(endPoint)) {
    const segment = buildStraightSegment(
      `${lastStop.id}-end`,
      `${lastStop.name} -> ${endPoint.name}`,
      lastStop.transportType ?? "walk",
      lastStop,
      endPoint,
    );
    routeSegments.push(segment);
    totalDistanceKm += segment.distanceKm;
    totalTravelMinutes += segment.travelMinutes;
  }

  return {
    ...tripDetail,
    stops: remappedStops,
    routeSegments,
    summary: {
      ...tripDetail.summary,
      totalDistanceKm: roundTo(totalDistanceKm, 1),
      totalTravelMinutes,
    },
  };
}
