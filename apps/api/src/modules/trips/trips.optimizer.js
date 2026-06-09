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

function buildClusterMap(clusters) {
  const clusterByStopId = new Map();

  for (const cluster of clusters) {
    for (const node of cluster.nodes) {
      clusterByStopId.set(node.id, cluster.id);
    }
  }

  return clusterByStopId;
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
  const clusterByStopId = buildClusterMap(clusters);
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

  for (const clusterPoint of clusterRoute) {
    const cluster = clusterPoint.cluster;
    const internalRoute = nearestNeighborRoute(
      cluster.nodes,
      null,
      null,
      (from, to) => getTravelLeg(from, to, "car", { internalWalk: true }),
    );

    for (const node of internalRoute) {
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
  const clusters = transportType === "car" ? buildWalkClusters(nodes) : [];
  const clusterByStopId = transportType === "car" ? buildClusterMap(clusters) : null;
  const legs = orderedNodes.map((node, index) => {
    const nextNode = orderedNodes[index + 1];

    if (!nextNode) {
      return { distanceKm: 0, minutes: 0, kind: transportType };
    }

    const sameCluster =
      transportType === "car" &&
      clusterByStopId &&
      clusterByStopId.get(node.id) === clusterByStopId.get(nextNode.id);

    return getTravelLeg(node, nextNode, transportType, { internalWalk: sameCluster });
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
    clusterCount: clusters.filter((cluster) => cluster.nodes.length > 1).length,
    clusterByStopId,
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

function buildWarnings({ totalTravelMinutes, totalWalkMinutes, stopCount }) {
  if (totalTravelMinutes >= 100 || stopCount >= 7) {
    return [
      {
        iconKey: "clock",
        title: "일정이 빡빡한 편입니다",
        description: "이동 시간이 길어질 수 있어 한두 곳은 여유 장소로 두는 편이 좋습니다.",
      },
    ];
  }

  if (totalWalkMinutes >= 45) {
    return [
      {
        iconKey: "footprints",
        title: "도보 이동이 긴 편입니다",
        description: "중간에 쉬어갈 장소를 하나 정도 확보해두면 일정이 더 안정적입니다.",
      },
    ];
  }

  return [];
}

function buildOptimizationScore(totalTravelMinutes, fatigueScore) {
  const raw = 100 - totalTravelMinutes * 0.22 - fatigueScore * 0.16;
  return clamp(Math.round(raw), 48, 98);
}

function isMealStop(stop) {
  return stop.category_key === "restaurant";
}

function isRestStop(stop) {
  return stop.category_key === "cafe";
}

function getDayTimeWindow(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return {
      startMinutes: 10 * 60,
      endMinutes: 20 * 60,
    };
  }

  const startMinutes = Math.min(
    ...nodes.map((node) => parseTimeToMinutes(node.arrival_time)),
  );
  const endMinutes = Math.max(
    ...nodes.map((node) => {
      if (node.leave_time) {
        const leaveMinutes = parseTimeToMinutes(node.leave_time);
        return leaveMinutes;
      }

      return parseTimeToMinutes(node.arrival_time) + Number(node.stay_minutes ?? 0);
    }),
  );

  return {
    startMinutes,
    endMinutes: Math.max(endMinutes, startMinutes + 180),
  };
}

function clampToDayWindow(minutes, { startMinutes, endMinutes }, paddingMinutes = 45) {
  const lowerBound = startMinutes + paddingMinutes;
  const upperBound = endMinutes - paddingMinutes;

  if (upperBound <= lowerBound) {
    return Math.round((startMinutes + endMinutes) / 2);
  }

  return clamp(minutes, lowerBound, upperBound);
}

function getMealAndRestTargets(nodes, tripTheme) {
  const dayWindow = getDayTimeWindow(nodes);
  const lunchMinutes = clampToDayWindow(
    parseTimeToMinutes(tripTheme.lunchTime ?? "12:00"),
    dayWindow,
  );
  const dinnerMinutes = clampToDayWindow(
    parseTimeToMinutes(tripTheme.dinnerTime ?? "18:30"),
    dayWindow,
  );
  const hasDinnerSlot = dinnerMinutes - lunchMinutes >= 120;
  const cafeBaseMinutes = hasDinnerSlot
    ? Math.round((lunchMinutes + dinnerMinutes) / 2)
    : lunchMinutes + 120;
  const cafeMinutes = clampToDayWindow(cafeBaseMinutes, dayWindow, 30);

  return {
    lunchMinutes,
    dinnerMinutes,
    cafeMinutes,
    hasDinnerSlot,
  };
}

function getOrderedLeg(from, to, transportType, clusterByStopId) {
  if (!from || !to) {
    return { distanceKm: 0, minutes: 0, kind: transportType };
  }

  const sameCluster =
    transportType === "car" &&
    clusterByStopId &&
    clusterByStopId.get(from.id) === clusterByStopId.get(to.id);

  return getTravelLeg(from, to, transportType, { internalWalk: sameCluster });
}

function scoreTimedOrder(nodes, {
  targetStopId,
  targetMinutes,
  transportType,
  startAnchor,
  clusterByStopId,
}) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const originalStartMinutes = Math.min(
    ...nodes.map((node) => parseTimeToMinutes(node.arrival_time)),
  );
  let currentMinutes = originalStartMinutes;
  let totalTravelMinutes = 0;

  if (startAnchor && nodes[0]) {
    const startLeg = getOrderedLeg(startAnchor, nodes[0], transportType, clusterByStopId);
    currentMinutes += startLeg.minutes;
    totalTravelMinutes += startLeg.minutes;
  }

  let targetArrivalMinutes = null;

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];

    if (String(node.id) === String(targetStopId)) {
      targetArrivalMinutes = currentMinutes;
    }

    currentMinutes += Number(node.stay_minutes ?? 0);

    const nextNode = nodes[index + 1];
    if (nextNode) {
      const leg = getOrderedLeg(node, nextNode, transportType, clusterByStopId);
      currentMinutes += leg.minutes;
      totalTravelMinutes += leg.minutes;
    }
  }

  if (targetArrivalMinutes === null) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(targetArrivalMinutes - targetMinutes) + totalTravelMinutes * 0.18;
}

function moveBestStopToTimeSlot(nodes, {
  predicate,
  targetMinutes,
  transportType,
  startAnchor,
  clusterByStopId,
  lockedIds,
}) {
  const candidates = nodes.filter(
    (node) => predicate(node) && !lockedIds.has(String(node.id)),
  );

  if (candidates.length === 0) {
    return nodes;
  }

  let bestOrder = nodes;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestStopId = null;

  for (const candidate of candidates) {
    const baseOrder = nodes.filter((node) => String(node.id) !== String(candidate.id));

    for (let index = 0; index <= baseOrder.length; index += 1) {
      const nextOrder = [
        ...baseOrder.slice(0, index),
        candidate,
        ...baseOrder.slice(index),
      ];
      const score = scoreTimedOrder(nextOrder, {
        targetStopId: candidate.id,
        targetMinutes,
        transportType,
        startAnchor,
        clusterByStopId,
      });

      if (score < bestScore) {
        bestOrder = nextOrder;
        bestScore = score;
        bestStopId = candidate.id;
      }
    }
  }

  if (bestStopId !== null) {
    lockedIds.add(String(bestStopId));
  }

  return bestOrder;
}

function applyMealAndRestSlots(routeResult, {
  transportType,
  startAnchor,
  tripTheme,
}) {
  let orderedNodes = [...routeResult.orderedNodes];
  const lockedIds = new Set();
  const {
    lunchMinutes,
    dinnerMinutes,
    cafeMinutes,
    hasDinnerSlot,
  } = getMealAndRestTargets(orderedNodes, tripTheme);

  orderedNodes = moveBestStopToTimeSlot(orderedNodes, {
    predicate: isMealStop,
    targetMinutes: lunchMinutes,
    transportType,
    startAnchor,
    clusterByStopId: routeResult.clusterByStopId,
    lockedIds,
  });

  if (hasDinnerSlot) {
    orderedNodes = moveBestStopToTimeSlot(orderedNodes, {
      predicate: isMealStop,
      targetMinutes: dinnerMinutes,
      transportType,
      startAnchor,
      clusterByStopId: routeResult.clusterByStopId,
      lockedIds,
    });
  }

  orderedNodes = moveBestStopToTimeSlot(orderedNodes, {
    predicate: isRestStop,
    targetMinutes: cafeMinutes,
    transportType,
    startAnchor,
    clusterByStopId: routeResult.clusterByStopId,
    lockedIds,
  });

  return {
    ...routeResult,
    orderedNodes,
  };
}

function getDayTargets(totalStops, dayCount) {
  if (dayCount <= 1) {
    return [totalStops];
  }

  const weights = Array.from({ length: dayCount }, (_, index) => {
    if (dayCount === 2) {
      return 1;
    }

    if (index === 0 || index === dayCount - 1) {
      return 0.85;
    }

    return 1.15;
  });
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const targets = weights.map((weight) =>
    Math.max(1, Math.floor((totalStops * weight) / weightSum)),
  );

  while (targets.reduce((sum, target) => sum + target, 0) < totalStops) {
    let bestIndex = 0;
    let bestRatio = Number.POSITIVE_INFINITY;

    for (let index = 0; index < targets.length; index += 1) {
      const ratio = targets[index] / weights[index];
      if (ratio < bestRatio) {
        bestIndex = index;
        bestRatio = ratio;
      }
    }

    targets[bestIndex] += 1;
  }

  while (targets.reduce((sum, target) => sum + target, 0) > totalStops) {
    let bestIndex = targets.findIndex((target) => target > 1);

    if (bestIndex < 0) {
      break;
    }

    for (let index = 0; index < targets.length; index += 1) {
      if (targets[index] > targets[bestIndex] && targets[index] > 1) {
        bestIndex = index;
      }
    }

    targets[bestIndex] -= 1;
  }

  return targets;
}

function getClusterCenter(stops) {
  if (!Array.isArray(stops) || stops.length === 0) {
    return null;
  }

  return {
    lat: stops.reduce((sum, stop) => sum + Number(stop.lat), 0) / stops.length,
    lng: stops.reduce((sum, stop) => sum + Number(stop.lng), 0) / stops.length,
  };
}

function distanceToBucket(stop, bucket) {
  const center = getClusterCenter(bucket.stops);

  if (!center) {
    return Number.POSITIVE_INFINITY;
  }

  return haversineDistanceKm(stop, center);
}

function chooseFarthestStop(stops, seeds) {
  return stops.reduce((best, stop) => {
    const nearestSeedDistance =
      seeds.length === 0
        ? 0
        : Math.min(...seeds.map((seed) => haversineDistanceKm(stop, seed)));

    if (!best || nearestSeedDistance > best.distance) {
      return { stop, distance: nearestSeedDistance };
    }

    return best;
  }, null)?.stop ?? stops[0];
}

function buildDayBuckets(stops, dayRows, startPoint) {
  const targets = getDayTargets(stops.length, dayRows.length);
  const buckets = dayRows.map((dayRow, index) => ({
    dayRow,
    target: targets[index] ?? Math.ceil(stops.length / Math.max(1, dayRows.length)),
    stops: [],
  }));
  const coreStops = stops.filter((stop) => !isMealStop(stop) && !isRestStop(stop));
  const mealStops = stops.filter(isMealStop);
  const restStops = stops.filter(isRestStop);
  const seedSource = coreStops.length > 0 ? coreStops : stops;
  const seeds = [];

  if (seedSource.length > 0) {
    const firstSeed =
      startPoint && Number.isFinite(Number(startPoint.lat)) && Number.isFinite(Number(startPoint.lng))
        ? seedSource.reduce((best, stop) =>
            !best || haversineDistanceKm(startPoint, stop) < haversineDistanceKm(startPoint, best)
              ? stop
              : best,
          null)
        : seedSource[0];

    if (firstSeed) {
      seeds.push(firstSeed);
    }

    while (seeds.length < buckets.length && seeds.length < seedSource.length) {
      const nextSeed = chooseFarthestStop(
        seedSource.filter((stop) => !seeds.some((seed) => seed.id === stop.id)),
        seeds,
      );

      if (!nextSeed) {
        break;
      }

      seeds.push(nextSeed);
    }
  }

  seeds.forEach((seed, index) => {
    buckets[index]?.stops.push(seed);
  });

  function assignStop(stop, options = {}) {
    const { preferMealBalance = false, preferRestBalance = false } = options;
    const candidates = buckets
      .map((bucket, index) => {
        const currentMealCount = bucket.stops.filter(isMealStop).length;
        const currentRestCount = bucket.stops.filter(isRestStop).length;
        const capacityPenalty = bucket.stops.length >= bucket.target ? 3 : 0;
        const mealPenalty = preferMealBalance && currentMealCount >= 2 ? 2.5 : 0;
        const restPenalty = preferRestBalance && currentRestCount >= 1 ? 1.5 : 0;
        const emptyPenalty = bucket.stops.length === 0 ? 0.4 : 0;
        const distance = Number.isFinite(distanceToBucket(stop, bucket))
          ? distanceToBucket(stop, bucket)
          : index;

        return {
          bucket,
          score: distance + capacityPenalty + mealPenalty + restPenalty + emptyPenalty,
        };
      })
      .sort((left, right) => left.score - right.score);

    candidates[0]?.bucket.stops.push(stop);
  }

  const seededIds = new Set(seeds.map((seed) => seed.id));
  coreStops
    .filter((stop) => !seededIds.has(stop.id))
    .forEach((stop) => assignStop(stop));
  mealStops.forEach((stop) => assignStop(stop, { preferMealBalance: true }));
  restStops.forEach((stop) => assignStop(stop, { preferRestBalance: true }));

  return buckets;
}

async function redistributeStopsByDay(connection, dayRows, stopRows, startPoint) {
  if (dayRows.length <= 1 || stopRows.length <= 1) {
    return stopRows;
  }

  const validStops = stopRows.filter(
    (stop) => Number.isFinite(Number(stop.lat)) && Number.isFinite(Number(stop.lng)),
  );

  if (validStops.length <= 1) {
    return stopRows;
  }

  const buckets = buildDayBuckets(validStops, dayRows, startPoint);
  const dayIdByStopId = new Map();

  for (const bucket of buckets) {
    bucket.stops.forEach((stop) => {
      dayIdByStopId.set(Number(stop.id), bucket.dayRow.id);
    });
  }

  for (const stop of stopRows) {
    const nextDayId = dayIdByStopId.get(Number(stop.id));

    if (nextDayId && Number(nextDayId) !== Number(stop.trip_day_id)) {
      await connection.execute(
        `
          UPDATE trip_stops
          SET trip_day_id = ?
          WHERE id = ?
        `,
        [nextDayId, stop.id],
      );

      stop.trip_day_id = nextDayId;
      stop.day_number =
        dayRows.find((dayRow) => Number(dayRow.id) === Number(nextDayId))?.day_number ??
        stop.day_number;
    }
  }

  return stopRows;
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

function toRouteAnchor(point) {
  if (!point) {
    return null;
  }

  const lat = Number(point.lat);
  const lng = Number(point.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    name: String(point.name ?? "").trim() || String(point.address ?? "").trim() || "이전 장소",
    address: String(point.address ?? "").trim(),
    lat,
    lng,
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

  for (const [index, stop] of routeResult.orderedNodes.entries()) {
    const nextSegment = betweenSegments[index] ?? {
      distanceKm: 0,
      travelMinutes: 0,
      mode: stop.transport_type,
    };
    const arrivalTime = formatMinutesToTime(currentMinutes);
    const leaveTime = formatMinutesToTime(currentMinutes + Number(stop.stay_minutes ?? 0));
    const position = mapPositionForIndex(index);

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
        0,
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
          ts.leave_time,
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
    const endPoint = null;
    const shouldAutoDistribute = Object.keys(manualOrderByDay).length === 0;
    const stopsByDay = new Map();

    await connection.beginTransaction();

    const distributedStopRows = shouldAutoDistribute
      ? await redistributeStopsByDay(connection, dayRows, stopRows, startPoint)
      : stopRows;

    for (const stop of distributedStopRows) {
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
    let totalStopCount = 0;
    let carClusterCount = 0;
    let dominantTransportType = "walk";
    const routeSegmentsByDay = {};
    let carryOverStartAnchor = toRouteAnchor(startPoint);

    for (const dayRow of dayRows) {
      const dayStops = stopsByDay.get(dayRow.day_number) ?? [];

      if (dayStops.length === 0) {
        continue;
      }

      const transportType = dayStops[0].transport_type ?? "walk";
      dominantTransportType = transportType;
      const requestedOrderIds = manualOrderByDay[String(dayRow.day_number)] ?? null;
      const dayStartAnchor = dayRow.day_number === 1 ? toRouteAnchor(startPoint) : carryOverStartAnchor;
      let routeResult = Array.isArray(requestedOrderIds)
        ? optimizeManualDay(
            dayStops,
            transportType,
            dayStartAnchor,
            dayRow.day_number === dayRows.length ? endPoint : null,
            requestedOrderIds,
          )
        : transportType === "car"
          ? optimizeCarDay(
              dayStops,
              dayStartAnchor,
              dayRow.day_number === dayRows.length ? endPoint : null,
            )
          : optimizePublicDay(
              dayStops,
              transportType,
              dayStartAnchor,
              dayRow.day_number === dayRows.length ? endPoint : null,
            );

      if (!Array.isArray(requestedOrderIds)) {
        routeResult = applyMealAndRestSlots(routeResult, {
          transportType,
          startAnchor: dayStartAnchor,
          tripTheme: theme,
        });
      }

      const routeSegments = await buildRouteSegments({
        orderedNodes: routeResult.orderedNodes,
        startAnchor: dayStartAnchor,
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
      totalStopCount += routeResult.orderedNodes.length;
      carClusterCount += routeResult.clusterCount;

      const lastNode = routeResult.orderedNodes[routeResult.orderedNodes.length - 1];
      carryOverStartAnchor = toRouteAnchor(lastNode) ?? carryOverStartAnchor;
    }

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
    const optimizationScore = buildOptimizationScore(totalTravelMinutes, fatigueScore);

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
