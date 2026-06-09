import { useEffect, useMemo, useRef, useState } from "react";
import type { PlannerStop, TravelRegion } from "@travel/shared";
import type { PlannerRouteSegment, TripLocationPoint } from "@/lib/tripsApi";
import { getDayAccent } from "@/lib/dayAccent";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { loadKakaoMaps } from "@/lib/kakaoMaps";
import { getMapProvider } from "@/lib/travelRegion";

type PlannerCanvasProps = {
  stops: PlannerStop[];
  startPoint?: TripLocationPoint | null;
  routeSegments?: PlannerRouteSegment[];
  summary: {
    totalDistanceKm: number;
    totalTravelMinutes: number;
  };
  travelRegion?: TravelRegion;
  showSummary?: boolean;
};

const fallbackCenter = { lat: 37.5665, lng: 126.978 };
const overlapClusterDistanceKm = 0.2;
const overlapOffsetBaseMeters = 28;
const overlapOffsetStepMeters = 10;

type MarkerDisplayItem = {
  key: string;
  lat: number;
  lng: number;
  displayLat: number;
  displayLng: number;
};

function createTooltipHtml(label: string) {
  return `<div style="padding:6px 8px;border-radius:12px;background:#fff;border:1px solid rgba(15,23,42,.08);box-shadow:0 10px 24px rgba(15,23,42,.12);font-size:12px;font-weight:700;color:#0f172a;white-space:nowrap;">${label}</div>`;
}

function hasPoint(
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

function createMarkerSvg(color: string, order: number | string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="44" height="56" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="22" cy="50" rx="12" ry="4" fill="rgba(15,23,42,0.18)"/>
      <path d="M22 2C12.6112 2 5 9.61116 5 19C5 31.75 22 54 22 54C22 54 39 31.75 39 19C39 9.61116 31.3888 2 22 2Z" fill="${color}" stroke="white" stroke-width="3"/>
      <circle cx="22" cy="19" r="10" fill="white"/>
      <text x="22" y="23" text-anchor="middle" font-family="Pretendard, Arial, sans-serif" font-size="12" font-weight="800" fill="${color}">${order}</text>
    </svg>
  `)}`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
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

function offsetLatLng(lat: number, lng: number, distanceMeters: number, angleRadians: number) {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = Math.max(111320 * Math.cos(toRadians(lat)), 1);
  const latOffset = (Math.sin(angleRadians) * distanceMeters) / metersPerDegreeLat;
  const lngOffset = (Math.cos(angleRadians) * distanceMeters) / metersPerDegreeLng;

  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
}

function spreadOverlappingMarkers(items: MarkerDisplayItem[]) {
  const groups: MarkerDisplayItem[][] = [];

  items.forEach((item) => {
    const existingGroup = groups.find((group) =>
      group.some((candidate) => haversineDistanceKm(candidate, item) <= overlapClusterDistanceKm),
    );

    if (existingGroup) {
      existingGroup.push(item);
      return;
    }

    groups.push([item]);
  });

  return groups.flatMap((group) => {
    if (group.length === 1) {
      return group;
    }

    const center = {
      lat: group.reduce((sum, item) => sum + item.lat, 0) / group.length,
      lng: group.reduce((sum, item) => sum + item.lng, 0) / group.length,
    };

    return group.map((item, index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / group.length;
      const radiusMeters =
        overlapOffsetBaseMeters + Math.max(0, group.length - 2) * overlapOffsetStepMeters;
      const nextPosition = offsetLatLng(center.lat, center.lng, radiusMeters, angle);

      return {
        ...item,
        displayLat: nextPosition.lat,
        displayLng: nextPosition.lng,
      };
    });
  });
}

function getStopAccentColor(stop: PlannerStop) {
  return getDayAccent(stop.dayNumber ?? 1).solid;
}

function getAnchorAccentColor(stops: PlannerStop[]) {
  if (stops.length === 0) {
    return "#1d4ed8";
  }

  return getDayAccent(stops[0].dayNumber ?? 1).solid;
}

function getSegmentStrokeColor(mode: string, dayNumber: number | undefined) {
  const accent = getDayAccent(dayNumber ?? 1);
  return mode === "walk" ? accent.deep : accent.solid;
}

export function PlannerCanvas({
  stops,
  startPoint = null,
  routeSegments = [],
  summary,
  travelRegion = "korea",
  showSummary = true,
}: PlannerCanvasProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const overlaysRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState("");
  const provider = getMapProvider(travelRegion);

  const geoStops = useMemo(
    () =>
      stops.filter(
        (stop) =>
          typeof stop.lat === "number" &&
          typeof stop.lng === "number" &&
          !Number.isNaN(stop.lat) &&
          !Number.isNaN(stop.lng),
      ),
    [stops],
  );

  const anchorPoints = useMemo(() => [startPoint].filter(hasPoint), [startPoint]);

  const displayMarkerPositions = useMemo(() => {
    const stopItems = geoStops.map((stop, index) => ({
      key: `stop-${stop.id}-${index}`,
      lat: stop.lat!,
      lng: stop.lng!,
      displayLat: stop.lat!,
      displayLng: stop.lng!,
    }));
    const anchorItems = anchorPoints.map((point, index) => ({
      key: `anchor-${index}-${point.name}`,
      lat: point.lat,
      lng: point.lng,
      displayLat: point.lat,
      displayLng: point.lng,
    }));

    return new Map(
      spreadOverlappingMarkers([...stopItems, ...anchorItems]).map((item) => [item.key, item]),
    );
  }, [anchorPoints, geoStops]);

  useEffect(() => {
    let isMounted = true;

    async function renderKakaoMap() {
      const kakao = await loadKakaoMaps();
      if (!isMounted || !mapRef.current) return;

      const map = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(
          geoStops[0]?.lat ?? anchorPoints[0]?.lat ?? fallbackCenter.lat,
          geoStops[0]?.lng ?? anchorPoints[0]?.lng ?? fallbackCenter.lng,
        ),
        level: geoStops.length > 0 || anchorPoints.length > 0 ? 5 : 7,
      });

      const bounds = new kakao.maps.LatLngBounds();

      const openHover = (position: any, label: string) => {
        const overlay = new kakao.maps.CustomOverlay({
          position,
          content: createTooltipHtml(label),
          yAnchor: 1.9,
          zIndex: 3000,
        });
        overlay.setMap(map);
        return overlay;
      };

      geoStops.forEach((stop, index) => {
        const markerPosition = displayMarkerPositions.get(`stop-${stop.id}-${index}`) ?? null;
        const position = new kakao.maps.LatLng(
          markerPosition?.displayLat ?? stop.lat!,
          markerPosition?.displayLng ?? stop.lng!,
        );
        const marker = new kakao.maps.Marker({
          map,
          position,
          title: stop.name,
          image: new kakao.maps.MarkerImage(
            createMarkerSvg(getStopAccentColor(stop), index + 1),
            new kakao.maps.Size(44, 56),
            { offset: new kakao.maps.Point(22, 54) },
          ),
        });

        const detailOverlay = new kakao.maps.CustomOverlay({
          position,
          yAnchor: 1.2,
          content: `<div style="min-width:190px;padding:12px 14px;border-radius:18px;background:#fff;border:1px solid rgba(15,23,42,.08);box-shadow:0 16px 30px rgba(15,23,42,.12);"><strong style="display:block;font-size:14px;margin-bottom:6px;">${stop.name}</strong><div style="font-size:12px;color:#475569;">${stop.time}</div>${stop.address ? `<div style="font-size:12px;color:#64748b;margin-top:8px;">${stop.address}</div>` : ""}</div>`,
        });

        let hoverOverlay: any = null;
        kakao.maps.event.addListener(marker, "mouseover", () => {
          hoverOverlay = openHover(position, stop.name);
        });
        kakao.maps.event.addListener(marker, "mouseout", () => {
          hoverOverlay?.setMap(null);
          hoverOverlay = null;
        });
        kakao.maps.event.addListener(marker, "click", () => detailOverlay.setMap(map));

        overlaysRef.current.push(marker, detailOverlay);
        bounds.extend(position);
      });

      anchorPoints.forEach((point, index) => {
        const markerPosition = displayMarkerPositions.get(`anchor-${index}-${point.name}`) ?? null;
        const position = new kakao.maps.LatLng(
          markerPosition?.displayLat ?? point.lat,
          markerPosition?.displayLng ?? point.lng,
        );
        const marker = new kakao.maps.Marker({
          map,
          position,
          title: point.name,
          image: new kakao.maps.MarkerImage(
            createMarkerSvg(getAnchorAccentColor(geoStops), "S"),
            new kakao.maps.Size(44, 56),
            { offset: new kakao.maps.Point(22, 54) },
          ),
        });

        let hoverOverlay: any = null;
        kakao.maps.event.addListener(marker, "mouseover", () => {
          hoverOverlay = openHover(position, `출발지 · ${point.name}`);
        });
        kakao.maps.event.addListener(marker, "mouseout", () => {
          hoverOverlay?.setMap(null);
          hoverOverlay = null;
        });

        overlaysRef.current.push(marker);
        bounds.extend(position);
      });

      routeSegments.forEach((segment) => {
        if (!Array.isArray(segment.path) || segment.path.length < 2) return;

        const path = segment.path.map((point) => new kakao.maps.LatLng(point.lat, point.lng));
        const polyline = new kakao.maps.Polyline({
          map,
          path,
          strokeWeight: segment.mode === "walk" ? 4 : 5,
          strokeColor: getSegmentStrokeColor(segment.mode, segment.dayNumber),
          strokeOpacity: 0.9,
          strokeStyle: segment.mode === "walk" ? "shortdash" : "solid",
        });

        let hoverOverlay: any = null;
        kakao.maps.event.addListener(polyline, "mouseover", (mouseEvent: any) => {
          hoverOverlay = new kakao.maps.CustomOverlay({
            position: mouseEvent.latLng,
            content: createTooltipHtml(
              `${segment.label} · ${segment.travelMinutes}분 · ${segment.distanceKm.toFixed(1)}km`,
            ),
            yAnchor: 1.5,
            zIndex: 2500,
          });
          hoverOverlay.setMap(map);
        });
        kakao.maps.event.addListener(polyline, "mouseout", () => {
          hoverOverlay?.setMap(null);
          hoverOverlay = null;
        });

        overlaysRef.current.push(polyline);
        path.forEach((point) => bounds.extend(point));
      });

      if (!bounds.isEmpty()) {
        map.setBounds(bounds);
      }
    }

    async function renderGoogleMap() {
      const google = await loadGoogleMaps();
      if (!isMounted || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: {
          lat: geoStops[0]?.lat ?? anchorPoints[0]?.lat ?? fallbackCenter.lat,
          lng: geoStops[0]?.lng ?? anchorPoints[0]?.lng ?? fallbackCenter.lng,
        },
        zoom: geoStops.length > 0 || anchorPoints.length > 0 ? 12 : 8,
        mapTypeControl: false,
        streetViewControl: false,
      });

      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      geoStops.forEach((stop, index) => {
        const markerPosition = displayMarkerPositions.get(`stop-${stop.id}-${index}`) ?? null;
        const marker = new google.maps.Marker({
          map,
          position: {
            lat: markerPosition?.displayLat ?? stop.lat!,
            lng: markerPosition?.displayLng ?? stop.lng!,
          },
          title: stop.name,
          icon: {
            url: createMarkerSvg(getStopAccentColor(stop), index + 1),
            scaledSize: new google.maps.Size(44, 56),
          },
        });

        marker.addListener("mouseover", () => {
          infoWindow.setContent(createTooltipHtml(stop.name));
          infoWindow.open({ map, anchor: marker });
        });
        marker.addListener("mouseout", () => infoWindow.close());
        marker.addListener("click", () => {
          infoWindow.setContent(
            `<div style="min-width:190px;padding:4px 2px;"><strong style="display:block;font-size:14px;margin-bottom:6px;">${stop.name}</strong><div style="font-size:12px;color:#475569;">${stop.time}</div>${stop.address ? `<div style="font-size:12px;color:#64748b;margin-top:8px;">${stop.address}</div>` : ""}</div>`,
          );
          infoWindow.open({ map, anchor: marker });
        });

        overlaysRef.current.push(marker);
        bounds.extend(marker.getPosition()!);
      });

      anchorPoints.forEach((point, index) => {
        const markerPosition = displayMarkerPositions.get(`anchor-${index}-${point.name}`) ?? null;
        const marker = new google.maps.Marker({
          map,
          position: {
            lat: markerPosition?.displayLat ?? point.lat,
            lng: markerPosition?.displayLng ?? point.lng,
          },
          title: point.name,
          icon: {
            url: createMarkerSvg(getAnchorAccentColor(geoStops), "S"),
            scaledSize: new google.maps.Size(44, 56),
          },
        });

        marker.addListener("mouseover", () => {
          infoWindow.setContent(createTooltipHtml(`출발지 · ${point.name}`));
          infoWindow.open({ map, anchor: marker });
        });
        marker.addListener("mouseout", () => infoWindow.close());

        overlaysRef.current.push(marker);
        bounds.extend(marker.getPosition()!);
      });

      routeSegments.forEach((segment) => {
        if (!Array.isArray(segment.path) || segment.path.length < 2) return;

        const polyline = new google.maps.Polyline({
          map,
          path: segment.path,
          strokeColor: getSegmentStrokeColor(segment.mode, segment.dayNumber),
          strokeOpacity: 0.9,
          strokeWeight: segment.mode === "walk" ? 4 : 5,
        });

        polyline.addListener("mouseover", (event: any) => {
          infoWindow.setContent(
            createTooltipHtml(
              `${segment.label} · ${segment.travelMinutes}분 · ${segment.distanceKm.toFixed(1)}km`,
            ),
          );
          infoWindow.setPosition(event.latLng);
          infoWindow.open({ map });
        });
        polyline.addListener("mouseout", () => infoWindow.close());

        overlaysRef.current.push(polyline);
        segment.path.forEach((point) => bounds.extend(point));
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    }

    async function renderMap() {
      if (!mapRef.current) return;

      try {
        overlaysRef.current.forEach((overlay) => overlay?.setMap?.(null));
        overlaysRef.current = [];

        if (provider === "kakao") {
          await renderKakaoMap();
        } else {
          await renderGoogleMap();
        }

        setMapError("");
      } catch (error) {
        if (isMounted) {
          setMapError(error instanceof Error ? error.message : "지도를 불러오지 못했습니다.");
        }
      }
    }

    void renderMap();

    return () => {
      isMounted = false;
      overlaysRef.current.forEach((overlay) => overlay?.setMap?.(null));
      overlaysRef.current = [];
    };
  }, [anchorPoints, displayMarkerPositions, geoStops, provider, routeSegments]);

  return (
    <section className="planner-canvas">
      {showSummary ? (
        <div className="planner-summary">
          <div>
            <span>총 이동 거리</span>
            <strong>{summary.totalDistanceKm.toFixed(1)}km</strong>
          </div>
          <div>
            <span>예상 이동 시간</span>
            <strong>{summary.totalTravelMinutes}분</strong>
          </div>
        </div>
      ) : null}

      <div ref={mapRef} className="planner-map" />

      {stops.length === 0 && !startPoint ? (
        <div className="planner-canvas__empty">
          <strong>아직 배치된 장소가 없습니다.</strong>
          <p>Setup에서 장소를 추가하면 지도 위에 동선이 바로 표시됩니다.</p>
        </div>
      ) : null}

      {stops.length > 0 && geoStops.length === 0 ? (
        <div className="planner-canvas__empty">
          <strong>좌표가 있는 장소가 아직 없습니다.</strong>
          <p>검색 추천 카드에서 장소를 선택하면 지도에 바로 반영됩니다.</p>
        </div>
      ) : null}

      {mapError ? <p className="planner-map__error">{mapError}</p> : null}
    </section>
  );
}
