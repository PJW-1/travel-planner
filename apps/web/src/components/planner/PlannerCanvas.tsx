import { useEffect, useMemo, useRef, useState } from "react";
import type { PlannerStop, TravelRegion } from "@travel/shared";
import type { PlannerRouteSegment, TripLocationPoint } from "@/lib/tripsApi";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { loadKakaoMaps } from "@/lib/kakaoMaps";
import { getMapProvider } from "@/lib/travelRegion";

type PlannerCanvasProps = {
  stops: PlannerStop[];
  startPoint?: TripLocationPoint | null;
  endPoint?: TripLocationPoint | null;
  routeSegments?: PlannerRouteSegment[];
  summary: {
    totalDistanceKm: number;
    totalTravelMinutes: number;
    optimizationScore: number;
  };
  travelRegion?: TravelRegion;
  showSummary?: boolean;
};

const categoryColors = {
  transport: "#2563eb",
  cafe: "#c2410c",
  activity: "#0f766e",
  view: "#7c3aed",
} satisfies Record<PlannerStop["categoryKey"], string>;

const segmentColors: Record<string, string> = {
  walk: "#0f766e",
  subway: "#7c3aed",
  bus: "#ea580c",
  car: "#2563eb",
  taxi: "#0f172a",
};

const fallbackCenter = { lat: 37.5665, lng: 126.978 };

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

export function PlannerCanvas({
  stops,
  startPoint = null,
  endPoint = null,
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

  const anchorPoints = useMemo(
    () => [startPoint, endPoint].filter(hasPoint),
    [startPoint, endPoint],
  );

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
        const position = new kakao.maps.LatLng(stop.lat!, stop.lng!);
        const marker = new kakao.maps.Marker({
          map,
          position,
          title: stop.name,
          image: new kakao.maps.MarkerImage(
            createMarkerSvg(categoryColors[stop.categoryKey], index + 1),
            new kakao.maps.Size(44, 56),
            { offset: new kakao.maps.Point(22, 54) },
          ),
        });

        const detailOverlay = new kakao.maps.CustomOverlay({
          position,
          yAnchor: 1.2,
          content: `<div style="min-width:190px;padding:12px 14px;border-radius:18px;background:#fff;border:1px solid rgba(15,23,42,.08);box-shadow:0 16px 30px rgba(15,23,42,.12);"><strong style="display:block;font-size:14px;margin-bottom:6px;">${stop.name}</strong><div style="font-size:12px;color:#475569;">${stop.time} · ${stop.category}</div>${stop.address ? `<div style="font-size:12px;color:#64748b;margin-top:8px;">${stop.address}</div>` : ""}</div>`,
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
        const position = new kakao.maps.LatLng(point.lat, point.lng);
        const marker = new kakao.maps.Marker({
          map,
          position,
          title: point.name,
          image: new kakao.maps.MarkerImage(
            createMarkerSvg(index === 0 ? "#0f766e" : "#7c3aed", index === 0 ? "S" : "E"),
            new kakao.maps.Size(44, 56),
            { offset: new kakao.maps.Point(22, 54) },
          ),
        });

        let hoverOverlay: any = null;
        kakao.maps.event.addListener(marker, "mouseover", () => {
          hoverOverlay = openHover(position, `${index === 0 ? "출발지" : "종료지"} · ${point.name}`);
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
          strokeColor: segmentColors[segment.mode] ?? "#2563eb",
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
        const marker = new google.maps.Marker({
          map,
          position: { lat: stop.lat!, lng: stop.lng! },
          title: stop.name,
          icon: {
            url: createMarkerSvg(categoryColors[stop.categoryKey], index + 1),
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
            `<div style="min-width:190px;padding:4px 2px;"><strong style="display:block;font-size:14px;margin-bottom:6px;">${stop.name}</strong><div style="font-size:12px;color:#475569;">${stop.time} · ${stop.category}</div>${stop.address ? `<div style="font-size:12px;color:#64748b;margin-top:8px;">${stop.address}</div>` : ""}</div>`,
          );
          infoWindow.open({ map, anchor: marker });
        });

        overlaysRef.current.push(marker);
        bounds.extend(marker.getPosition()!);
      });

      anchorPoints.forEach((point, index) => {
        const marker = new google.maps.Marker({
          map,
          position: { lat: point.lat, lng: point.lng },
          title: point.name,
          icon: {
            url: createMarkerSvg(index === 0 ? "#0f766e" : "#7c3aed", index === 0 ? "S" : "E"),
            scaledSize: new google.maps.Size(44, 56),
          },
        });

        overlaysRef.current.push(marker);
        bounds.extend(marker.getPosition()!);
      });

      routeSegments.forEach((segment) => {
        if (!Array.isArray(segment.path) || segment.path.length < 2) return;

        const polyline = new google.maps.Polyline({
          map,
          path: segment.path,
          strokeColor: segmentColors[segment.mode] ?? "#2563eb",
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
          setMapError(
            error instanceof Error ? error.message : "지도를 불러오는 중 오류가 발생했습니다.",
          );
        }
      }
    }

    void renderMap();

    return () => {
      isMounted = false;
      overlaysRef.current.forEach((overlay) => overlay?.setMap?.(null));
      overlaysRef.current = [];
    };
  }, [anchorPoints, geoStops, provider, routeSegments]);

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
          <div>
            <span>동선 점수</span>
            <strong>{summary.optimizationScore}/100</strong>
          </div>
        </div>
      ) : null}

      <div ref={mapRef} className="planner-map" />

      {stops.length === 0 && !startPoint ? (
        <div className="planner-canvas__empty">
          <strong>아직 배치된 장소가 없습니다.</strong>
          <p>Setup에서 장소를 추가하면 실제 지도 위에 경로가 함께 표시됩니다.</p>
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
