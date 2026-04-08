import { getDbPool } from "../../database/mysql.js";
import { getSavedAiPlaces } from "../ai-lab/aiLab.repository.js";

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

function formatMonth(dateValue) {
  const date = new Date(dateValue);
  return date.toLocaleString("en-US", { month: "short" });
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

function formatTime(dateValue) {
  return String(dateValue).slice(0, 5);
}

function mapCommunityTheme(value) {
  if (value === "urban" || value === "cafe" || value === "walking" || value === "coast") {
    return value;
  }

  return "urban";
}

function mapCategoryKey(value) {
  if (value === "transport" || value === "cafe" || value === "activity" || value === "view") {
    return value;
  }

  return "activity";
}

export async function getHomeContent() {
  const db = getDbPool();
  const [tripRows] = await db.execute(
    `
      SELECT
        t.id,
        t.title,
        t.destination,
        t.start_date,
        t.days,
        t.theme_json,
        a.optimization_score,
        COUNT(ts.id) AS stop_count
      FROM trips t
      LEFT JOIN trip_days td ON td.trip_id = t.id
      LEFT JOIN trip_stops ts ON ts.trip_day_id = td.id
      LEFT JOIN trip_analyses a ON a.trip_id = t.id
      WHERE t.featured_home = TRUE
      GROUP BY t.id, t.title, t.destination, t.start_date, t.days, t.theme_json, a.optimization_score
      ORDER BY t.id ASC
      LIMIT 1
    `,
  );

  const trip = tripRows[0];
  const theme = parseJsonValue(trip?.theme_json, {});

  const [trendRows] = await db.execute(
    `
      SELECT title, rank_no, tag_name
      FROM trend_snapshots
      ORDER BY rank_no ASC
    `,
  );

  return {
    upcomingTrip: {
      month: trip ? formatMonth(trip.start_date) : "",
      day: trip ? String(new Date(trip.start_date).getDate()) : "",
      title: trip?.title ?? "",
      description: trip
        ? `${trip.destination}역 출발 · 총 ${trip.stop_count}개 장소 · 동선 점수 ${trip.optimization_score}`
        : "",
    },
    tripConfig: {
      destination: trip?.destination ?? "",
      days: trip?.days ?? 1,
      lunchTime: theme.lunchTime ?? "12:00",
      dinnerTime: theme.dinnerTime ?? "18:30",
      tags: Array.isArray(theme.tags) ? theme.tags : [],
    },
    trendSpots: trendRows.map((row) => ({
      title: row.title,
      rank: row.rank_no,
      tag: row.tag_name,
    })),
  };
}

export async function getPlannerOverview() {
  const db = getDbPool();
  const [tripRows] = await db.execute(
    `
      SELECT id, destination, days, theme_json
      FROM trips
      WHERE featured_planner = TRUE
      ORDER BY id ASC
      LIMIT 1
    `,
  );

  const trip = tripRows[0];
  const theme = parseJsonValue(trip?.theme_json, {});

  const [stopRows] = await db.execute(
    `
      SELECT
        ts.id,
        p.name,
        ts.category_label,
        ts.category_key,
        ts.arrival_time,
        ts.congestion_score,
        ts.stay_minutes,
        ts.travel_minutes_from_prev,
        ts.map_x,
        ts.map_y,
        ts.is_forked
      FROM trip_stops ts
      INNER JOIN trip_days td ON td.id = ts.trip_day_id
      INNER JOIN places p ON p.id = ts.place_id
      WHERE td.trip_id = ?
      ORDER BY ts.stop_order ASC
    `,
    [trip?.id ?? 0],
  );

  const [analysisRows] = await db.execute(
    `
      SELECT
        total_distance_km,
        total_travel_minutes,
        optimization_score,
        warning_json
      FROM trip_analyses
      WHERE trip_id = ?
      ORDER BY analyzed_at DESC
      LIMIT 1
    `,
    [trip?.id ?? 0],
  );

  const analysis = analysisRows[0];
  const warnings = parseJsonValue(analysis?.warning_json, []);

  return {
    tripConfig: {
      destination: trip?.destination ?? "",
      days: trip?.days ?? 1,
      lunchTime: theme.lunchTime ?? "12:00",
      dinnerTime: theme.dinnerTime ?? "18:30",
      tags: Array.isArray(theme.tags) ? theme.tags : [],
    },
    stops: stopRows.map((row) => ({
      id: String(row.id),
      name: row.name,
      category: row.category_label,
      categoryKey: mapCategoryKey(row.category_key),
      time: formatTime(row.arrival_time),
      congestion: row.congestion_score,
      stayMinutes: row.stay_minutes,
      travelMinutes: row.travel_minutes_from_prev,
      forked: Boolean(row.is_forked),
      position: {
        x: Number(row.map_x),
        y: Number(row.map_y),
      },
    })),
    summary: {
      totalDistanceKm: Number(analysis?.total_distance_km ?? 0),
      totalTravelMinutes: Number(analysis?.total_travel_minutes ?? 0),
      optimizationScore: Number(analysis?.optimization_score ?? 0),
    },
    insights: Array.isArray(warnings) ? warnings : [],
  };
}

export async function getCommunityRoutes() {
  const db = getDbPool();
  const [routeRows] = await db.execute(
    `
      SELECT
        cr.id,
        cr.title,
        cr.like_count,
        cr.comment_count,
        cr.theme,
        u.nickname AS author
      FROM community_routes cr
      INNER JOIN users u ON u.id = cr.author_user_id
      ORDER BY cr.id ASC
    `,
  );

  const [tagRows] = await db.execute(
    `
      SELECT community_route_id, tag_name
      FROM route_tags
      ORDER BY id ASC
    `,
  );

  const tagsByRouteId = new Map();

  tagRows.forEach((row) => {
    const current = tagsByRouteId.get(row.community_route_id) ?? [];
    current.push(row.tag_name);
    tagsByRouteId.set(row.community_route_id, current);
  });

  return routeRows.map((row) => ({
    id: String(row.id),
    title: row.title,
    author: row.author,
    likes: row.like_count,
    comments: row.comment_count,
    theme: mapCommunityTheme(row.theme),
    tags: tagsByRouteId.get(row.id) ?? [],
  }));
}

export async function getAiLabOverview() {
  const db = getDbPool();
  const [rows] = await db.execute(
    `
      SELECT vep.raw_place_name
      FROM video_extracted_places vep
      INNER JOIN video_extractions ve ON ve.id = vep.video_extraction_id
      ORDER BY ve.requested_at DESC, vep.id ASC
      LIMIT 3
    `,
  );

  return {
    extractedPlaces: rows.map((row) => row.raw_place_name),
  };
}

export async function getMySummary(userId) {
  const db = getDbPool();
  const [rows] = await db.execute(
    `
      SELECT
        id,
        title,
        start_date,
        theme_json,
        cover_image_url
      FROM trips
      WHERE user_id = ? AND featured_saved = TRUE
      ORDER BY updated_at DESC, id DESC
    `,
    [userId],
  );
  const savedAiPlaces = await getSavedAiPlaces(userId);
  const [favoriteRows] = await db.execute(
    `
      SELECT
        f.id,
        p.id AS place_id,
        p.name,
        p.category_key,
        p.address,
        p.lat,
        p.lng,
        p.region,
        f.created_at
      FROM favorites f
      INNER JOIN places p ON p.id = f.place_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC, f.id DESC
      LIMIT 12
    `,
    [userId],
  );

  const savedPlaces = [
    ...savedAiPlaces,
    ...favoriteRows.map((row) => ({
      id: `favorite-${row.id}`,
      placeId: String(row.place_id),
      title: row.name,
      categoryKey: mapCategoryKey(row.category_key),
      address: row.address ?? "",
      lat: Number(row.lat),
      lng: Number(row.lng),
      region: row.region ?? "",
      sourceTitle: "커뮤니티 저장 장소",
      youtubeUrl: "",
      date: row.created_at,
    })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return {
    savedPlans: rows.map((row) => {
      const theme = parseJsonValue(row.theme_json, {});

      return {
        id: String(row.id),
        title: row.title,
        date: formatDate(row.start_date),
        placeCount: Number(theme.placeCount ?? 0),
        emoji: row.cover_image_url ?? "🧳",
      };
    }),
    savedAiPlaces: savedPlaces,
  };
}
