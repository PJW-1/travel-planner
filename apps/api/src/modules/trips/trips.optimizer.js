import { getDbPool } from "../../database/mysql.js";
import { env } from "../../config/env.js";

const MAP_POSITIONS = [
  { x: 18, y: 52 },
  { x: 56, y: 32 },
  { x: 50, y: 56 },
  { x: 63, y: 76 },
  { x: 30, y: 28 },
  { x: 72, y: 46 },
  { x: 42, y: 72 },
];

const WALK_CLUSTER_MAX_DISTANCE_KM = 0.7;
const WALK_CLUSTER_MAX_STOPS = 4;
const CAR_PARKING_PENALTY_MINUTES = 10;
const KAKAO_DIRECTIONS_API_URL = "https://apis-navi.kakaomobility.com/v1/directions";
const GOOGLE_ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

function createId() {
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return Number(`${Date.now()}${suffix}`);
}

function parseJsonValue(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeLocationPoint(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const lat = Number(value.lat);
  const lng = Number(value.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    name: typeof value.name === "string" ? value.name : "지점",
    address: typeof value.address === "string" ? value.address : "",
    lat,
    lng,
  };
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 10 * 60;
  }

  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes) {
  const normalized = Math.max(0, Math.round(totalMinutes));
  const hours = String(Math.floor(normalized / 60) % 24).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");

  return `${hours}:${minutes}:00`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value, precision = 2) {
  return Number(value.toFixed(precision));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(from, to) {
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

function mergeRoutePaths(paths) {
  const merged = [];

  for (const path of paths) {
    if (!Array.isArray(path) || path.length === 0) {
      continue;
    }

    if (merged.length === 0) {
      merged.push(...path);
      continue;
    }

    const [firstPoint] = path;
    const lastMergedPoint = merged[merged.length - 1];
    const isDuplicate =
      lastMergedPoint &&
      firstPoint &&
      Math.abs(lastMergedPoint.lat - firstPoint.lat) < 0.000001 &&
      Math.abs(lastMergedPoint.lng - firstPoint.lng) < 0.000001;

    if (isDuplicate) {
      merged.push(...path.slice(1));
    } else {
      merged.push(...path);
    }
  }

  return merged;
}

function decodeEncodedPolyline(encoded) {
  if (!encoded) {
    return [];
  }

  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return coordinates;
}

function toKakaoCoordinate(value, name = "") {
  const x = Number(value?.lng);
  const y = Number(value?.lat);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return "";
  }

  if (name) {
    return `${x},${y},name=${encodeURIComponent(name)}`;
  }

  return `${x},${y}`;
}

function extractKakaoRoutePath(route) {
  const roadPaths =
    route?.sections?.flatMap((section) =>
      Array.isArray(section?.roads)
        ? section.roads.map((road) => {
            if (!Array.isArray(road?.vertexes) || road.vertexes.length < 2) {
              return [];
            }

            const points = [];

            for (let index = 0; index < road.vertexes.length - 1; index += 2) {
              const lng = Number(road.vertexes[index]);
              const lat = Number(road.vertexes[index + 1]);

              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                continue;
              }

              points.push({ lat, lng });
            }

            return points;
          })
        : [],
    ) ?? [];

  return mergeRoutePaths(roadPaths);
}

function buildKakaoDirectionsUrl(from, to) {
  const params = new URLSearchParams({
    origin: toKakaoCoordinate(from, from.name),
    destination: toKakaoCoordinate(to, to.name),
    priority: "RECOMMEND",
    alternatives: "false",
    road_details: "false",
    summary: "false",
  });

  return `${KAKAO_DIRECTIONS_API_URL}?${params.toString()}`;
}

function buildGoogleRoutesRequestBody(from, to) {
  return {
    origin: {
      location: {
        latLng: {
          latitude: Number(from.lat),
          longitude: Number(from.lng),
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: Number(to.lat),
          longitude: Number(to.lng),
        },
      },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: false,
    polylineQuality: "HIGH_QUALITY",
    languageCode: "ko-KR",
    units: "METRIC",
  };
}

function parseDurationSeconds(durationValue) {
  if (typeof durationValue !== "string") {
    return 0;
  }

  const seconds = Number(String(durationValue).replace("s", ""));
  return Number.isFinite(seconds) ? seconds : 0;
}

function extractGoogleRoutePath(route) {
  const routePolyline = decodeEncodedPolyline(route?.polyline?.encodedPolyline);

  if (routePolyline.length > 1) {
    return routePolyline;
  }

  const stepPolylines =
    route?.legs?.flatMap((leg) =>
      Array.isArray(leg.steps)
        ? leg.steps.map((step) => decodeEncodedPolyline(step?.polyline?.encodedPolyline))
        : [],
    ) ?? [];

  return mergeRoutePaths(stepPolylines);
}

function getFallbackPath(from, to) {
  return [
    { lat: Number(from.lat), lng: Number(from.lng) },
    { lat: Number(to.lat), lng: Number(to.lng) },
  ];
}

function buildWalkLeg(from, to) {
  const distanceKm = haversineDistanceKm(from, to);
  const minutes = Math.max(3, Math.round(distanceKm * 14 + (distanceKm > 1 ? distanceKm * 1.5 : 0)));

  return {
    distanceKm: roundTo(distanceKm, 2),
    minutes,
    kind: "walk",
  };
}

function buildTransitLeg(from, to, transportType) {
  const distanceKm = haversineDistanceKm(from, to);
  const walkLeg = buildWalkLeg(from, to);

  if (transportType === "walk") {
    return walkLeg;
  }

  if (transportType === "taxi") {
    return {
      distanceKm: roundTo(distanceKm, 2),
      minutes: Math.max(4, Math.round(3 + distanceKm * 2.8)),
      kind: "taxi",
    };
  }

  const fixedPenalty = transportType === "subway" ? 6 : 8;
  const speedFactor = transportType === "subway" ? 3.2 : 4.3;
  const transitMinutes = Math.max(5, Math.round(fixedPenalty + distanceKm * speedFactor));

  if (distanceKm <= 0.8 && walkLeg.minutes <= transitMinutes + 2) {
    return walkLeg;
  }

  return {
    distanceKm: roundTo(distanceKm, 2),
    minutes: transitMinutes,
    kind: transportType,
  };
}

function buildCarLeg(from, to, { internalWalk = false } = {}) {
  if (internalWalk) {
    return buildWalkLeg(from, to);
  }

  const distanceKm = haversineDistanceKm(from, to);
  const driveMinutes = Math.max(4, Math.round(4 + distanceKm * 2.4));

  return {
    distanceKm: roundTo(distanceKm, 2),
    minutes: driveMinutes + CAR_PARKING_PENALTY_MINUTES,
    kind: "car",
  };
}

function getTravelLeg(from, to, transportType, options = {}) {
  if (!from || !to) {
    return { distanceKm: 0, minutes: 0, kind: transportType };
  }

  if (transportType === "car") {
    return buildCarLeg(from, to, options);
  }

  return buildTransitLeg(from, to, transportType);
}

async function fetchRouteSegment(from, to, kind, travelRegion = "korea") {
  const fallbackLeg =
    kind === "car" ? buildCarLeg(from, to) : getTravelLeg(from, to, kind === "transit" ? "subway" : kind);

  if (kind !== "car" && kind !== "taxi") {
    return {
      ...fallbackLeg,
      path: getFallbackPath(from, to),
      mode: kind,
      source: "heuristic",
    };
  }

  const routeProvider = travelRegion === "korea" ? "kakao" : "google";

  if (routeProvider === "kakao" && !env.kakao.restApiKey) {
    return {
      ...fallbackLeg,
      path: getFallbackPath(from, to),
      mode: kind,
      source: "heuristic",
    };
  }

  if (routeProvider === "google" && !env.googleMaps.serverApiKey) {
    return {
      ...fallbackLeg,
      path: getFallbackPath(from, to),
      mode: kind,
      source: "heuristic",
    };
  }

  try {
    if (routeProvider === "google") {
      const response = await fetch(GOOGLE_ROUTES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": env.googleMaps.serverApiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.polyline.encodedPolyline",
        },
        body: JSON.stringify(buildGoogleRoutesRequestBody(from, to)),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error("[routes] request failed", {
          provider: "google-routes",
          kind,
          status: response.status,
          from: { lat: from.lat, lng: from.lng },
          to: { lat: to.lat, lng: to.lng },
          body: errorBody.slice(0, 400),
        });
        throw new Error(`Google routes request failed with status ${response.status}`);
      }

      const data = await response.json();
      const route = data.routes?.[0];

      if (!route) {
        console.error("[routes] no route returned", {
          provider: "google-routes",
          kind,
          from: { lat: from.lat, lng: from.lng },
          to: { lat: to.lat, lng: to.lng },
          data,
        });
        throw new Error("Google routes returned no route");
      }

      const path = extractGoogleRoutePath(route);
      const distanceMeters = Number(route.distanceMeters ?? 0);
      const durationSeconds = parseDurationSeconds(route.duration);

      return {
        distanceKm: roundTo(distanceMeters / 1000, 2),
        minutes: Math.max(1, Math.round(durationSeconds / 60)),
        path: path.length > 1 ? path : getFallbackPath(from, to),
        mode: kind,
        source: "google-routes",
      };
    }

    const response = await fetch(buildKakaoDirectionsUrl(from, to), {
      method: "GET",
      headers: {
        Authorization: `KakaoAK ${env.kakao.restApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[routes] request failed", {
        provider: "kakao-navi",
        kind,
        status: response.status,
        from: { lat: from.lat, lng: from.lng },
        to: { lat: to.lat, lng: to.lng },
        body: errorBody.slice(0, 400),
      });
      throw new Error(`Kakao directions request failed with status ${response.status}`);
    }

    const data = await response.json();
    const route = data.routes?.[0];

    if (!route || Number(route.result_code) !== 0) {
      console.error("[routes] no route returned", {
        provider: "kakao-navi",
        kind,
        from: { lat: from.lat, lng: from.lng },
        to: { lat: to.lat, lng: to.lng },
        data,
      });
      throw new Error(route?.result_msg || "Kakao directions returned no route");
    }

    const path = extractKakaoRoutePath(route);
    const distanceMeters = Number(route.summary?.distance ?? 0);
    const durationSeconds = Number(route.summary?.duration ?? 0);

    if (path.length <= 1) {
      console.warn("[routes] polyline missing, fallback to straight path", {
        provider: "kakao-navi",
        kind,
        from: { lat: from.lat, lng: from.lng },
        to: { lat: to.lat, lng: to.lng },
        distanceMeters,
        durationSeconds,
      });
    } else {
      console.info("[routes] route ok", {
        provider: "kakao-navi",
        kind,
        points: path.length,
        distanceMeters,
        durationSeconds,
      });
    }

    return {
      distanceKm: roundTo(distanceMeters / 1000, 2),
      minutes: Math.max(1, Math.round(durationSeconds / 60)),
      path: path.length > 1 ? path : getFallbackPath(from, to),
      mode: kind,
      source: "kakao-navi",
    };
  } catch (error) {
    console.warn("[routes] fallback leg used", {
      provider: routeProvider === "kakao" ? "kakao-navi" : "google-routes",
      kind,
      from: { lat: from.lat, lng: from.lng },
      to: { lat: to.lat, lng: to.lng },
      message: error instanceof Error ? error.message : "unknown error",
    });
    return {
      ...fallbackLeg,
      path: getFallbackPath(from, to),
      mode: kind,
      source: "heuristic",
    };
  }
}

function getCentroid(nodes) {
  return {
    lat: nodes.reduce((sum, node) => sum + node.lat, 0) / nodes.length,
    lng: nodes.reduce((sum, node) => sum + node.lng, 0) / nodes.length,
  };
}

function chooseInitialNode(nodes, anchor, costGetter) {
  if (anchor) {
    return nodes.reduce((best, node) => {
      if (!best) {
        return node;
      }

      return costGetter(anchor, node).minutes < costGetter(anchor, best).minutes ? node : best;
    }, null);
  }

  return nodes.reduce((best, node) => {
    const totalCost = nodes
      .filter((candidate) => candidate.id !== node.id)
      .reduce((sum, candidate) => sum + costGetter(node, candidate).minutes, 0);

    if (!best || totalCost < best.totalCost) {
      return { node, totalCost };
    }

    return best;
  }, null)?.node ?? nodes[0];
}

function scoreRoute(route, anchorStart, anchorEnd, costGetter) {
  if (route.length === 0) {
    return 0;
  }

  let total = 0;

  if (anchorStart) {
    total += costGetter(anchorStart, route[0]).minutes;
  }

  for (let index = 0; index < route.length - 1; index += 1) {
    total += costGetter(route[index], route[index + 1]).minutes;
  }

  if (anchorEnd) {
    total += costGetter(route[route.length - 1], anchorEnd).minutes;
  }

  return total;
}

function nearestNeighborRoute(nodes, anchorStart, anchorEnd, costGetter) {
  if (nodes.length <= 1) {
    return [...nodes];
  }

  const remaining = [...nodes];
  const route = [];
  const first = chooseInitialNode(remaining, anchorStart, costGetter);

  route.push(first);
  remaining.splice(
    remaining.findIndex((node) => node.id === first.id),
    1,
  );

  while (remaining.length > 0) {
    const current = route[route.length - 1];
    const next = remaining.reduce((best, candidate) => {
      if (!best) {
        return candidate;
      }

      return costGetter(current, candidate).minutes < costGetter(current, best).minutes
        ? candidate
        : best;
    }, null);

    route.push(next);
    remaining.splice(
      remaining.findIndex((node) => node.id === next.id),
      1,
    );
  }

  return twoOptRoute(route, anchorStart, anchorEnd, costGetter);
}

function twoOptRoute(route, anchorStart, anchorEnd, costGetter) {
  if (route.length < 4) {
    return route;
  }

  let bestRoute = [...route];
  let bestScore = scoreRoute(bestRoute, anchorStart, anchorEnd, costGetter);
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 0; i < bestRoute.length - 2; i += 1) {
      for (let j = i + 1; j < bestRoute.length - 1; j += 1) {
        const candidate = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1),
        ];
        const candidateScore = scoreRoute(candidate, anchorStart, anchorEnd, costGetter);

        if (candidateScore + 0.5 < bestScore) {
          bestRoute = candidate;
          bestScore = candidateScore;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

function splitOversizedCluster(cluster) {
  if (cluster.length <= WALK_CLUSTER_MAX_STOPS) {
    return [cluster];
  }

  const centroid = getCentroid(cluster);
  const sorted = [...cluster].sort(
    (left, right) =>
      haversineDistanceKm(left, centroid) - haversineDistanceKm(right, centroid),
  );
  const clusters = [];

  for (let index = 0; index < sorted.length; index += WALK_CLUSTER_MAX_STOPS) {
    clusters.push(sorted.slice(index, index + WALK_CLUSTER_MAX_STOPS));
  }

  return clusters;
}

function buildWalkClusters(nodes) {
  const visited = new Set();
  const clusters = [];

  for (const node of nodes) {
    if (visited.has(node.id)) {
      continue;
    }

    const queue = [node];
    const cluster = [];

    while (queue.length > 0) {
      const current = queue.shift();

      if (!current || visited.has(current.id)) {
        continue;
      }

      visited.add(current.id);
      cluster.push(current);

      for (const candidate of nodes) {
        if (visited.has(candidate.id)) {
          continue;
        }

        const distanceKm = haversineDistanceKm(current, candidate);
        if (distanceKm <= WALK_CLUSTER_MAX_DISTANCE_KM) {
          queue.push(candidate);
        }
      }
    }

    clusters.push(...splitOversizedCluster(cluster));
  }

  return clusters.map((cluster, index) => ({
    id: `cluster-${index + 1}`,
    nodes: cluster,
    center: getCentroid(cluster),
  }));
}

function optimizePublicDay(nodes, transportType, startAnchor, endAnchor) {
  const costGetter = (from, to) => getTravelLeg(from, to, transportType);
  const orderedNodes = nearestNeighborRoute(nodes, startAnchor, endAnchor, costGetter);
  const legs = orderedNodes.map((node, index) =>
    index === orderedNodes.length - 1 ? { distanceKm: 0, minutes: 0, kind: transportType } : costGetter(node, orderedNodes[index + 1]),
  );

  const startLeg =
    startAnchor && orderedNodes.length > 0
      ? costGetter(startAnchor, orderedNodes[0])
      : { distanceKm: 0, minutes: 0, kind: transportType };
  const endLeg =
    endAnchor && orderedNodes.length > 0
      ? costGetter(orderedNodes[orderedNodes.length - 1], endAnchor)
      : { distanceKm: 0, minutes: 0, kind: transportType };

  return {
    orderedNodes,
    legs,
    startLeg,
    endLeg,
    clusterCount: 0,
    clusterByStopId: null,
  };
}

function optimizeCarDay(nodes, startAnchor, endAnchor) {
  const clusters = buildWalkClusters(nodes);
  const clusterRoute = nearestNeighborRoute(
    clusters.map((cluster) => ({
      id: cluster.id,
      ...cluster.center,
      cluster,
    })),
    startAnchor,
    endAnchor,
    (from, to) => getTravelLeg(from, to, "car"),
  );

  const orderedNodes = [];
  const clusterByStopId = new Map();

  for (const clusterPoint of clusterRoute) {
    const cluster = clusterPoint.cluster;
    const internalRoute = nearestNeighborRoute(
      cluster.nodes,
      null,
      null,
      (from, to) => getTravelLeg(from, to, "car", { internalWalk: true }),
    );

    for (const node of internalRoute) {
      clusterByStopId.set(node.id, cluster.id);
      orderedNodes.push(node);
    }
  }

  const legs = orderedNodes.map((node, index) => {
    const nextNode = orderedNodes[index + 1];

    if (!nextNode) {
      return { distanceKm: 0, minutes: 0, kind: "car" };
    }

    const sameCluster = clusterByStopId.get(node.id) === clusterByStopId.get(nextNode.id);
    return getTravelLeg(node, nextNode, "car", { internalWalk: sameCluster });
  });

  const startLeg =
    startAnchor && orderedNodes.length > 0
      ? getTravelLeg(startAnchor, orderedNodes[0], "car")
      : { distanceKm: 0, minutes: 0, kind: "car" };
  const endLeg =
    endAnchor && orderedNodes.length > 0
      ? getTravelLeg(orderedNodes[orderedNodes.length - 1], endAnchor, "car")
      : { distanceKm: 0, minutes: 0, kind: "car" };

  return {
    orderedNodes,
    legs,
    startLeg,
    endLeg,
    clusterCount: clusters.filter((cluster) => cluster.nodes.length > 1).length,
    clusterByStopId,
  };
}

function orderStopsByRequestedIds(nodes, requestedIds = []) {
  if (!Array.isArray(requestedIds) || requestedIds.length === 0) {
    return [...nodes];
  }

  const nodeById = new Map(nodes.map((node) => [String(node.id), node]));
  const ordered = requestedIds
    .map((id) => nodeById.get(String(id)))
    .filter(Boolean);
  const usedIds = new Set(ordered.map((node) => String(node.id)));
  const remaining = nodes.filter((node) => !usedIds.has(String(node.id)));

  return [...ordered, ...remaining];
}

function optimizeManualDay(nodes, transportType, startAnchor, endAnchor, requestedIds = []) {
  const orderedNodes = orderStopsByRequestedIds(nodes, requestedIds);
  const legs = orderedNodes.map((node, index) => {
    const nextNode = orderedNodes[index + 1];

    if (!nextNode) {
      return { distanceKm: 0, minutes: 0, kind: transportType };
    }

    return getTravelLeg(node, nextNode, transportType);
  });

  const startLeg =
    startAnchor && orderedNodes.length > 0
      ? getTravelLeg(startAnchor, orderedNodes[0], transportType)
      : { distanceKm: 0, minutes: 0, kind: transportType };
  const endLeg =
    endAnchor && orderedNodes.length > 0
      ? getTravelLeg(orderedNodes[orderedNodes.length - 1], endAnchor, transportType)
      : { distanceKm: 0, minutes: 0, kind: transportType };

  return {
    orderedNodes,
    legs,
    startLeg,
    endLeg,
    clusterCount: 0,
    clusterByStopId: null,
  };
}

function estimateCongestion(stop, arrivalMinutes, tripTheme) {
  const hour = Math.floor(arrivalMinutes / 60);
  const lunchHour = Math.floor(parseTimeToMinutes(tripTheme.lunchTime ?? "12:00") / 60);
  const dinnerHour = Math.floor(parseTimeToMinutes(tripTheme.dinnerTime ?? "18:30") / 60);

  const baseByCategory = {
    transport: 60,
    cafe: 52,
    activity: 38,
    view: 44,
  };

  let score = baseByCategory[stop.category_key] ?? 45;

  if (hour >= 12 && hour <= 14) {
    score += 10;
  }

  if (hour >= 18 && hour <= 20) {
    score += 8;
  }

  if (stop.category_key === "cafe" && (hour === lunchHour || hour === dinnerHour)) {
    score += 15;
  }

  if (tripTheme.tags?.includes("맛집") && stop.category_key === "cafe") {
    score += 5;
  }

  return clamp(Math.round(score), 20, 95);
}

function buildWarnings({ transportType, totalTravelMinutes, totalWalkMinutes, clusterCount, stopCount }) {
  const warnings = [];

  if (totalWalkMinutes >= 35) {
    warnings.push({
      iconKey: "footprints",
      title: "도보 이동량이 많은 일정입니다",
      description:
        "연속 도보 이동이 길어질 수 있어 편한 신발이나 중간 휴식 구간을 함께 고려하는 편이 좋습니다.",
    });
  }

  if (totalTravelMinutes >= 90 || stopCount >= 6) {
    warnings.push({
      iconKey: "clock",
      title: "하루 일정이 다소 촘촘합니다",
      description:
        "이동 시간과 체류 시간을 합치면 여유 시간이 빠듯할 수 있습니다. 한두 곳은 여유 시간으로 남겨두는 편이 안정적입니다.",
    });
  }

  if (transportType === "car" && clusterCount > 0) {
    warnings.push({
      iconKey: "footprints",
      title: "가까운 장소는 한 번 주차 후 도보로 묶었습니다",
      description:
        "자차 이동에서도 짧은 구간은 주차 후 함께 걷는 편이 더 효율적이라 도보 묶음으로 반영했습니다.",
    });
  }

  return warnings;
}

function buildOptimizationScore(totalTravelMinutes, averageCongestion, fatigueScore) {
  const raw = 100 - totalTravelMinutes * 0.22 - averageCongestion * 0.2 - fatigueScore * 0.16;
  return clamp(Math.round(raw), 48, 98);
}

async function buildRouteSegments({
  orderedNodes,
  startAnchor,
  endAnchor,
  transportType,
  clusterByStopId,
  travelRegion,
}) {
  const segments = [];

  if (startAnchor && orderedNodes.length > 0) {
    const firstStop = orderedNodes[0];
    const firstMode =
      transportType === "car" ? "car" : transportType === "walk" ? "walk" : transportType;
    const segment = await fetchRouteSegment(startAnchor, firstStop, firstMode, travelRegion);
    segments.push({
      id: `start-${firstStop.id}`,
      label: `${startAnchor.name} → ${firstStop.name}`,
      mode: segment.mode,
      distanceKm: segment.distanceKm,
      travelMinutes: segment.minutes,
      path: segment.path,
    });
  }

  for (let index = 0; index < orderedNodes.length - 1; index += 1) {
    const current = orderedNodes[index];
    const next = orderedNodes[index + 1];
    const sameCluster =
      transportType === "car" &&
      clusterByStopId &&
      clusterByStopId.get(current.id) === clusterByStopId.get(next.id);
    const kind =
      transportType === "car"
        ? sameCluster
          ? "walk"
          : "car"
        : transportType === "walk"
          ? "walk"
          : transportType;
    const segment = await fetchRouteSegment(current, next, kind, travelRegion);

    segments.push({
      id: `${current.id}-${next.id}`,
      label: `${current.name} → ${next.name}`,
      mode: segment.mode,
      distanceKm: segment.distanceKm,
      travelMinutes: segment.minutes,
      path: segment.path,
    });
  }

  if (endAnchor && orderedNodes.length > 0) {
    const lastStop = orderedNodes[orderedNodes.length - 1];
    const lastMode =
      transportType === "car" ? "car" : transportType === "walk" ? "walk" : transportType;
    const segment = await fetchRouteSegment(lastStop, endAnchor, lastMode, travelRegion);
    segments.push({
      id: `${lastStop.id}-end`,
      label: `${lastStop.name} → ${endAnchor.name}`,
      mode: segment.mode,
      distanceKm: segment.distanceKm,
      travelMinutes: segment.minutes,
      path: segment.path,
    });
  }

  return segments;
}

function mapPositionForIndex(index) {
  return MAP_POSITIONS[index] ?? {
    x: 24 + (index % 4) * 14,
    y: 28 + Math.floor(index / 4) * 18,
  };
}

async function updateDayRoute(connection, dayId, routeResult, routeSegments, tripTheme) {
  const originalStartMinutes =
    routeResult.orderedNodes.length > 0
      ? Math.min(...routeResult.orderedNodes.map((node) => parseTimeToMinutes(node.arrival_time)))
      : 10 * 60;
  const startSegment = routeSegments.find((segment) => segment.id.startsWith("start-")) ?? null;
  const endSegment = routeSegments.find((segment) => segment.id.endsWith("-end")) ?? null;
  const betweenSegments = routeSegments.filter(
    (segment) => !segment.id.startsWith("start-") && !segment.id.endsWith("-end"),
  );

  let currentMinutes = originalStartMinutes + (startSegment?.travelMinutes ?? 0);
  let walkMinutes = startSegment?.mode === "walk" ? startSegment.travelMinutes : 0;
  let totalCongestion = 0;

  for (const [index, stop] of routeResult.orderedNodes.entries()) {
    const nextSegment = betweenSegments[index] ?? {
      distanceKm: 0,
      travelMinutes: 0,
      mode: stop.transport_type,
    };
    const arrivalTime = formatMinutesToTime(currentMinutes);
    const leaveTime = formatMinutesToTime(currentMinutes + Number(stop.stay_minutes ?? 0));
    const congestionScore = estimateCongestion(stop, currentMinutes, tripTheme);
    const position = mapPositionForIndex(index);

    totalCongestion += congestionScore;
    if (nextSegment.mode === "walk") {
      walkMinutes += nextSegment.travelMinutes;
    }

    await connection.execute(
      `
        UPDATE trip_stops
        SET
          stop_order = ?,
          arrival_time = ?,
          leave_time = ?,
          travel_minutes_from_prev = ?,
          distance_km_from_prev = ?,
          congestion_score = ?,
          transport_type = ?,
          map_x = ?,
          map_y = ?
        WHERE id = ?
      `,
      [
        index + 1,
        arrivalTime,
        leaveTime,
        nextSegment.travelMinutes,
        nextSegment.distanceKm,
        congestionScore,
        stop.transport_type,
        position.x,
        position.y,
        stop.id,
      ],
    );

    currentMinutes += Number(stop.stay_minutes ?? 0) + nextSegment.travelMinutes;
  }

  return {
    totalDistanceKm: roundTo(
      (startSegment?.distanceKm ?? 0) +
        betweenSegments.reduce((sum, segment) => sum + segment.distanceKm, 0) +
        (endSegment?.distanceKm ?? 0),
      2,
    ),
    totalTravelMinutes:
      (startSegment?.travelMinutes ?? 0) +
      betweenSegments.reduce((sum, segment) => sum + segment.travelMinutes, 0) +
      (endSegment?.travelMinutes ?? 0),
    totalWalkMinutes:
      walkMinutes + (endSegment?.mode === "walk" ? endSegment.travelMinutes : 0),
    averageCongestion:
      routeResult.orderedNodes.length > 0 ? totalCongestion / routeResult.orderedNodes.length : 0,
  };
}

export async function optimizeTripRoute(userId, tripId, options = {}) {
  const db = getDbPool();
  const connection = await db.getConnection();
  const tripIdNumber = Number(tripId);
  const manualOrderByDay = options?.manualOrderByDay ?? {};

  try {
    const [tripRows] = await connection.execute(
      `
        SELECT id, days, theme_json
        FROM trips
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [tripIdNumber, userId],
    );

    const trip = tripRows[0];
    if (!trip) {
      return false;
    }

    const [dayRows] = await connection.execute(
      `
        SELECT id, day_number
        FROM trip_days
        WHERE trip_id = ?
        ORDER BY day_number ASC
      `,
      [tripIdNumber],
    );

    const [stopRows] = await connection.execute(
      `
        SELECT
          ts.id,
          ts.trip_day_id,
          td.day_number,
          ts.arrival_time,
          ts.stay_minutes,
          ts.transport_type,
          ts.category_key,
          ts.category_label,
          ts.is_forked,
          p.name,
          p.address,
          p.lat,
          p.lng
        FROM trip_stops ts
        INNER JOIN trip_days td ON td.id = ts.trip_day_id
        INNER JOIN places p ON p.id = ts.place_id
        WHERE td.trip_id = ?
        ORDER BY td.day_number ASC, ts.stop_order ASC, ts.id ASC
      `,
      [tripIdNumber],
    );

    const theme = parseJsonValue(trip.theme_json, {});
    const travelRegion = theme.travelRegion ?? "korea";
    const startPoint = normalizeLocationPoint(theme.startPoint);
    const endPoint = normalizeLocationPoint(theme.endPoint);
    const stopsByDay = new Map();

    for (const stop of stopRows) {
      if (!Number.isFinite(Number(stop.lat)) || !Number.isFinite(Number(stop.lng))) {
        continue;
      }

      const dayStops = stopsByDay.get(stop.day_number) ?? [];
      dayStops.push({
        ...stop,
        lat: Number(stop.lat),
        lng: Number(stop.lng),
      });
      stopsByDay.set(stop.day_number, dayStops);
    }

    let totalDistanceKm = 0;
    let totalTravelMinutes = 0;
    let totalWalkMinutes = 0;
    let totalCongestionScore = 0;
    let totalStopCount = 0;
    let carClusterCount = 0;
    let dominantTransportType = "walk";
    const routeSegmentsByDay = {};

    await connection.beginTransaction();

    for (const dayRow of dayRows) {
      const dayStops = stopsByDay.get(dayRow.day_number) ?? [];

      if (dayStops.length === 0) {
        continue;
      }

      const transportType = dayStops[0].transport_type ?? "walk";
      dominantTransportType = transportType;
      const requestedOrderIds = manualOrderByDay[String(dayRow.day_number)] ?? null;
      const routeResult = Array.isArray(requestedOrderIds)
        ? optimizeManualDay(
            dayStops,
            transportType,
            dayRow.day_number === 1 ? startPoint : null,
            dayRow.day_number === dayRows.length ? endPoint : null,
            requestedOrderIds,
          )
        : transportType === "car"
          ? optimizeCarDay(
              dayStops,
              dayRow.day_number === 1 ? startPoint : null,
              dayRow.day_number === dayRows.length ? endPoint : null,
            )
          : optimizePublicDay(
              dayStops,
              transportType,
              dayRow.day_number === 1 ? startPoint : null,
              dayRow.day_number === dayRows.length ? endPoint : null,
            );

      const routeSegments = await buildRouteSegments({
        orderedNodes: routeResult.orderedNodes,
        startAnchor: dayRow.day_number === 1 ? startPoint : null,
        endAnchor: dayRow.day_number === dayRows.length ? endPoint : null,
        transportType,
        clusterByStopId: routeResult.clusterByStopId,
        travelRegion,
      });
      routeSegmentsByDay[String(dayRow.day_number)] = routeSegments;

      const dayMetrics = await updateDayRoute(
        connection,
        dayRow.id,
        routeResult,
        routeSegments,
        theme,
      );

      totalDistanceKm += dayMetrics.totalDistanceKm;
      totalTravelMinutes += dayMetrics.totalTravelMinutes;
      totalWalkMinutes += dayMetrics.totalWalkMinutes;
      totalCongestionScore += dayMetrics.averageCongestion * routeResult.orderedNodes.length;
      totalStopCount += routeResult.orderedNodes.length;
      carClusterCount += routeResult.clusterCount;
    }

    const averageCongestion = totalStopCount > 0 ? totalCongestionScore / totalStopCount : 0;
    const fatigueScore = clamp(
      Math.round(totalWalkMinutes * 0.9 + totalTravelMinutes * 0.2 + carClusterCount * 6),
      18,
      96,
    );
    const warnings = buildWarnings({
      transportType: dominantTransportType,
      totalTravelMinutes,
      totalWalkMinutes,
      clusterCount: carClusterCount,
      stopCount: totalStopCount,
    });
    const optimizationScore = buildOptimizationScore(
      totalTravelMinutes,
      averageCongestion,
      fatigueScore,
    );

    await connection.execute(
      `
        INSERT INTO trip_analyses (
          id,
          trip_id,
          total_distance_km,
          total_travel_minutes,
          optimization_score,
          fatigue_score,
          warning_json,
          analyzed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        createId(),
        tripIdNumber,
        roundTo(totalDistanceKm, 2),
        Math.round(totalTravelMinutes),
        optimizationScore,
        fatigueScore,
        JSON.stringify({
          warnings,
          routeSegmentsByDay,
        }),
      ],
    );

    await connection.execute(
      `
        UPDATE trips
        SET status = 'optimized'
        WHERE id = ? AND user_id = ?
      `,
      [tripIdNumber, userId],
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
