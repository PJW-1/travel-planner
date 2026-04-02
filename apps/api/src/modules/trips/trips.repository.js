import { getDbPool } from "../../database/mysql.js";

const CATEGORY_LABELS = {
  transport: "교통 허브",
  cafe: "카페",
  activity: "액티비티",
  view: "뷰 포인트",
};

const MAP_POSITIONS = [
  { x: 18, y: 52 },
  { x: 56, y: 32 },
  { x: 50, y: 56 },
  { x: 63, y: 76 },
  { x: 30, y: 28 },
  { x: 72, y: 46 },
  { x: 42, y: 72 },
];

function createId() {
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return Number(`${Date.now()}${suffix}`);
}

function addDays(baseDate, offset) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + offset);

  return date.toISOString().slice(0, 10);
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

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => String(tag).trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  return [];
}

function normalizeDays(days) {
  const numericDays = Number(days ?? 1);

  if (!Number.isFinite(numericDays)) {
    return 1;
  }

  return Math.max(1, Math.min(14, Math.floor(numericDays)));
}

function normalizeDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date().toISOString().slice(0, 10);
  }

  return value;
}

function normalizeTime(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!/^\d{2}:\d{2}$/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

function normalizeCategoryKey(value) {
  if (value === "transport" || value === "cafe" || value === "activity" || value === "view") {
    return value;
  }

  return "activity";
}

function normalizeTransportType(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "walk";
  }

  return value.trim().slice(0, 40);
}

function normalizeTravelRegion(value) {
  const allowed = new Set([
    "korea",
    "japan",
    "southeast_asia",
    "europe",
    "america",
    "greater_china",
    "oceania",
  ]);

  return allowed.has(value) ? value : "korea";
}

function normalizeInteger(value, { min = 0, max = 999 } = {}) {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.floor(numeric)));
}

function normalizeDecimal(value, { min = 0, max = 999, precision = 2 } = {}) {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return min;
  }

  return Math.max(min, Math.min(max, Number(numeric.toFixed(precision))));
}

function normalizeLocationPoint(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim().slice(0, 80) : "";
  const address = typeof value.address === "string" ? value.address.trim().slice(0, 255) : "";
  const hasCoordinates =
    Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng));

  if (!name && !address && !hasCoordinates) {
    return null;
  }

  return {
    name: name || address || "지점",
    address,
    lat:
      value.lat === null || value.lat === undefined
        ? null
        : normalizeDecimal(value.lat, { min: -90, max: 90, precision: 7 }),
    lng:
      value.lng === null || value.lng === undefined
        ? null
        : normalizeDecimal(value.lng, { min: -180, max: 180, precision: 7 }),
  };
}

function buildThemeJson({
  lunchTime,
  dinnerTime,
  tags,
  placeCount,
  travelRegion,
  startPoint,
  endPoint,
}) {
  return JSON.stringify({
    lunchTime: normalizeTime(lunchTime, "12:00"),
    dinnerTime: normalizeTime(dinnerTime, "18:30"),
    tags: normalizeTags(tags),
    placeCount: Math.max(0, Number(placeCount ?? 0)),
    travelRegion: normalizeTravelRegion(travelRegion),
    startPoint: normalizeLocationPoint(startPoint),
    endPoint: normalizeLocationPoint(endPoint),
  });
}

function mapTripListItem(row) {
  return {
    id: String(row.id),
    title: row.title,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    days: row.days,
    status: row.status,
    isSaved: Boolean(row.featured_saved),
  };
}

function mapStop(row) {
  return {
    id: String(row.id),
    name: row.name,
    category: row.category_label,
    categoryKey: row.category_key,
    address: row.address ?? "",
    lat: row.lat === null ? undefined : Number(row.lat),
    lng: row.lng === null ? undefined : Number(row.lng),
    time: String(row.arrival_time).slice(0, 5),
    congestion: row.congestion_score,
    stayMinutes: row.stay_minutes,
    travelMinutes: row.travel_minutes_from_prev,
    transportType: row.transport_type,
    stopOrder: row.stop_order,
    dayNumber: row.day_number,
    distanceKm: Number(row.distance_km_from_prev),
    forked: Boolean(row.is_forked),
    position: {
      x: Number(row.map_x),
      y: Number(row.map_y),
    },
  };
}

function buildSummary(stopRows, analysisRow) {
  if (analysisRow) {
    return {
      totalDistanceKm: Number(analysisRow.total_distance_km ?? 0),
      totalTravelMinutes: Number(analysisRow.total_travel_minutes ?? 0),
      optimizationScore: Number(analysisRow.optimization_score ?? 0),
    };
  }

  const totalDistanceKm = stopRows.reduce(
    (sum, row) => sum + Number(row.distance_km_from_prev ?? 0),
    0,
  );
  const totalTravelMinutes = stopRows.reduce(
    (sum, row) => sum + Number(row.travel_minutes_from_prev ?? 0),
    0,
  );
  const averageCongestion =
    stopRows.length > 0
      ? stopRows.reduce((sum, row) => sum + Number(row.congestion_score ?? 0), 0) / stopRows.length
      : 0;

  const optimizationScore = Math.max(
    45,
    Math.round(100 - totalTravelMinutes * 0.18 - averageCongestion * 0.2),
  );

  return {
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    totalTravelMinutes,
    optimizationScore,
  };
}

function buildInsights(stopRows, summary, analysisRow) {
  const savedPayload = parseJsonValue(analysisRow?.warning_json, []);
  const savedWarnings = Array.isArray(savedPayload)
    ? savedPayload
    : Array.isArray(savedPayload.warnings)
      ? savedPayload.warnings
      : [];

  if (savedWarnings.length > 0) {
    return savedWarnings;
  }

  const insights = [];
  const hasLongWalk = stopRows.some((row) => Number(row.travel_minutes_from_prev) >= 20);
  const hasBusyStop = stopRows.some((row) => Number(row.congestion_score) >= 80);

  if (hasLongWalk) {
    insights.push({
      iconKey: "footprints",
      title: "도보 이동량이 많습니다",
      description:
        "장소 사이 이동 시간이 길어지는 구간이 있어 체력 소모가 큽니다. 중간 휴식이나 교통수단 변경을 고려해보세요.",
    });
  }

  if (summary.totalTravelMinutes >= 60 || hasBusyStop) {
    insights.push({
      iconKey: "clock",
      title: "오후 일정에 여유 시간이 필요합니다",
      description:
        "혼잡한 장소와 이동 시간이 겹쳐 일정이 밀릴 수 있습니다. 20분 정도 여유 시간을 두는 편이 안정적입니다.",
    });
  }

  return insights;
}

function getRouteSegmentsForDay(analysisRow, dayNumber) {
  const payload = parseJsonValue(analysisRow?.warning_json, {});
  const daySegments = payload?.routeSegmentsByDay?.[String(dayNumber)];

  if (!Array.isArray(daySegments)) {
    return [];
  }

  return daySegments.map((segment) => ({
    id: String(segment.id),
    label: String(segment.label ?? ""),
    mode: String(segment.mode ?? "walk"),
    distanceKm: Number(segment.distanceKm ?? 0),
    travelMinutes: Number(segment.travelMinutes ?? 0),
    path: Array.isArray(segment.path)
      ? segment.path
          .map((point) => ({
            lat: Number(point.lat),
            lng: Number(point.lng),
          }))
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      : [],
  }));
}

async function getOwnedTrip(connection, userId, tripId) {
  const [rows] = await connection.execute(
    `
      SELECT
        id,
        user_id,
        title,
        destination,
        start_date,
        end_date,
        days,
        theme_json,
        status,
        featured_saved
      FROM trips
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [tripId, userId],
  );

  return rows[0] ?? null;
}

async function normalizeStopOrders(connection, tripDayId) {
  const [rows] = await connection.execute(
    `
      SELECT id
      FROM trip_stops
      WHERE trip_day_id = ?
      ORDER BY stop_order ASC, arrival_time ASC, id ASC
    `,
    [tripDayId],
  );

  for (const [index, row] of rows.entries()) {
    await connection.execute(
      `
        UPDATE trip_stops
        SET stop_order = ?
        WHERE id = ?
      `,
      [index + 1, row.id],
    );
  }
}

async function syncStopPositions(connection, tripDayId) {
  const [rows] = await connection.execute(
    `
      SELECT id
      FROM trip_stops
      WHERE trip_day_id = ?
      ORDER BY stop_order ASC, arrival_time ASC, id ASC
    `,
    [tripDayId],
  );

  for (const [index, row] of rows.entries()) {
    const position = MAP_POSITIONS[index] ?? {
      x: 24 + (index % 4) * 14,
      y: 28 + Math.floor(index / 4) * 18,
    };

    await connection.execute(
      `
        UPDATE trip_stops
        SET map_x = ?, map_y = ?
        WHERE id = ?
      `,
      [position.x, position.y, row.id],
    );
  }
}

async function cleanupUnusedPlace(connection, placeId) {
  const [rows] = await connection.execute(
    `
      SELECT COUNT(*) AS usage_count
      FROM trip_stops
      WHERE place_id = ?
    `,
    [placeId],
  );

  if (Number(rows[0]?.usage_count ?? 0) === 0) {
    await connection.execute(
      `
        DELETE FROM places
        WHERE id = ? AND source_type = 'user'
      `,
      [placeId],
    );
  }
}

async function syncTripDays(connection, tripId, startDate, days) {
  const [rows] = await connection.execute(
    `
      SELECT id, day_number
      FROM trip_days
      WHERE trip_id = ?
      ORDER BY day_number ASC
    `,
    [tripId],
  );

  const existingByDay = new Map(rows.map((row) => [row.day_number, row]));

  for (let dayNumber = 1; dayNumber <= days; dayNumber += 1) {
    const currentDate = addDays(startDate, dayNumber - 1);
    const existing = existingByDay.get(dayNumber);

    if (existing) {
      await connection.execute(
        `
          UPDATE trip_days
          SET date = ?, title = ?
          WHERE id = ?
        `,
        [currentDate, `${dayNumber}일차 일정`, existing.id],
      );
      continue;
    }

    await connection.execute(
      `
        INSERT INTO trip_days (id, trip_id, day_number, date, title, notes)
        VALUES (?, ?, ?, ?, ?, NULL)
      `,
      [createId(), tripId, dayNumber, currentDate, `${dayNumber}일차 일정`],
    );
  }

  const extraDayIds = rows
    .filter((row) => row.day_number > days)
    .map((row) => row.id);

  if (extraDayIds.length > 0) {
    await connection.execute(
      `
        DELETE FROM trip_days
        WHERE id IN (${extraDayIds.map(() => "?").join(", ")})
      `,
      extraDayIds,
    );
  }
}

export async function listUserTrips(userId) {
  const db = getDbPool();
  const [rows] = await db.execute(
    `
      SELECT id, title, destination, start_date, end_date, days, status, featured_saved
      FROM trips
      WHERE user_id = ?
      ORDER BY updated_at DESC, id DESC
    `,
    [userId],
  );

  return rows.map(mapTripListItem);
}

export async function getTripDetail(userId, tripId, dayNumberInput = 1) {
  const db = getDbPool();
  const tripIdNumber = Number(tripId);
  const trip = await getOwnedTrip(db, userId, tripIdNumber);

  if (!trip) {
    return null;
  }

  const [dayRows] = await db.execute(
    `
      SELECT id, day_number, date
      FROM trip_days
      WHERE trip_id = ?
      ORDER BY day_number ASC
    `,
    [tripIdNumber],
  );

  const selectedDayNumber = Math.max(
    1,
    Math.min(
      normalizeInteger(dayNumberInput, { min: 1, max: 99 }),
      dayRows.length > 0 ? dayRows.length : 1,
    ),
  );

  const [stopRows] = await db.execute(
    `
      SELECT
        ts.id,
        ts.trip_day_id,
        td.day_number,
        p.name,
        ts.stop_order,
        ts.arrival_time,
        ts.transport_type,
        ts.travel_minutes_from_prev,
        ts.distance_km_from_prev,
        ts.congestion_score,
        ts.category_label,
        ts.category_key,
        ts.stay_minutes,
        ts.map_x,
        ts.map_y,
        ts.is_forked,
        p.address,
        p.lat,
        p.lng
      FROM trip_stops ts
      INNER JOIN trip_days td ON td.id = ts.trip_day_id
      INNER JOIN places p ON p.id = ts.place_id
      WHERE td.trip_id = ? AND td.day_number = ?
      ORDER BY ts.stop_order ASC
    `,
    [tripIdNumber, selectedDayNumber],
  );

  const [analysisRows] = await db.execute(
    `
      SELECT total_distance_km, total_travel_minutes, optimization_score, warning_json
      FROM trip_analyses
      WHERE trip_id = ?
      ORDER BY analyzed_at DESC
      LIMIT 1
    `,
    [tripIdNumber],
  );

  const summary = buildSummary(stopRows, analysisRows[0]);
  const insights = buildInsights(stopRows, summary, analysisRows[0]);
  const theme = parseJsonValue(trip.theme_json, {});

  return {
    trip: {
      id: String(trip.id),
      title: trip.title,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      days: trip.days,
      status: trip.status,
      isSaved: Boolean(trip.featured_saved),
    },
    tripConfig: {
      title: trip.title,
      destination: trip.destination,
      days: trip.days,
      startDate: trip.start_date,
      lunchTime: theme.lunchTime ?? "12:00",
      dinnerTime: theme.dinnerTime ?? "18:30",
      tags: normalizeTags(theme.tags),
      travelRegion: normalizeTravelRegion(theme.travelRegion),
      startPoint: normalizeLocationPoint(theme.startPoint),
      endPoint: normalizeLocationPoint(theme.endPoint),
    },
    days: dayRows.map((row) => ({
      id: String(row.id),
      dayNumber: row.day_number,
      date: row.date,
    })),
    selectedDayNumber,
    stops: stopRows.map(mapStop),
    summary,
    insights,
    routeSegments: getRouteSegmentsForDay(analysisRows[0], selectedDayNumber),
  };
}

export async function createTrip(userId, payload) {
  const db = getDbPool();
  const connection = await db.getConnection();

  const title = String(payload.title ?? "").trim() || "새 여행 일정";
  const destination = String(payload.destination ?? "").trim() || "서울";
  const startDate = normalizeDate(payload.startDate);
  const days = normalizeDays(payload.days);
  const lunchTime = normalizeTime(payload.lunchTime, "12:00");
  const dinnerTime = normalizeTime(payload.dinnerTime, "18:30");
  const tags = normalizeTags(payload.tags);
  const travelRegion = normalizeTravelRegion(payload.travelRegion);
  const startPoint = normalizeLocationPoint(payload.startPoint);
  const endPoint = normalizeLocationPoint(payload.endPoint);
  const tripId = createId();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `
        INSERT INTO trips (
          id,
          user_id,
          title,
          destination,
          start_date,
          end_date,
          days,
          theme_json,
          status,
          is_public,
          cover_image_url,
          featured_home,
          featured_planner,
          featured_saved
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', FALSE, NULL, FALSE, FALSE, FALSE)
      `,
      [
        tripId,
        userId,
        title,
        destination,
        startDate,
        addDays(startDate, days - 1),
        days,
        buildThemeJson({
          lunchTime,
          dinnerTime,
          tags,
          placeCount: 0,
          travelRegion,
          startPoint,
          endPoint,
        }),
      ],
    );

    await syncTripDays(connection, tripId, startDate, days);
    await connection.commit();

    return tripId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateTrip(userId, tripId, payload) {
  const db = getDbPool();
  const connection = await db.getConnection();
  const tripIdNumber = Number(tripId);

  try {
    const trip = await getOwnedTrip(connection, userId, tripIdNumber);
    if (!trip) {
      return false;
    }

    const currentTheme = parseJsonValue(trip.theme_json, {});
    const title = String(payload.title ?? trip.title).trim() || trip.title;
    const destination = String(payload.destination ?? trip.destination).trim() || trip.destination;
    const startDate = normalizeDate(payload.startDate ?? trip.start_date);
    const days = normalizeDays(payload.days ?? trip.days);
    const lunchTime = normalizeTime(payload.lunchTime ?? currentTheme.lunchTime, "12:00");
    const dinnerTime = normalizeTime(payload.dinnerTime ?? currentTheme.dinnerTime, "18:30");
    const tags = normalizeTags(payload.tags ?? currentTheme.tags);
    const travelRegion = normalizeTravelRegion(payload.travelRegion ?? currentTheme.travelRegion);
    const startPoint = normalizeLocationPoint(payload.startPoint ?? currentTheme.startPoint);
    const endPoint = normalizeLocationPoint(payload.endPoint ?? currentTheme.endPoint);

    const [stopCountRows] = await connection.execute(
      `
        SELECT COUNT(*) AS stop_count
        FROM trip_stops ts
        INNER JOIN trip_days td ON td.id = ts.trip_day_id
        WHERE td.trip_id = ?
      `,
      [tripIdNumber],
    );

    await connection.beginTransaction();

    await connection.execute(
      `
        UPDATE trips
        SET
          title = ?,
          destination = ?,
          start_date = ?,
          end_date = ?,
          days = ?,
          theme_json = ?
        WHERE id = ? AND user_id = ?
      `,
      [
        title,
        destination,
        startDate,
        addDays(startDate, days - 1),
        days,
        buildThemeJson({
          lunchTime,
          dinnerTime,
          tags,
          placeCount: Number(stopCountRows[0]?.stop_count ?? 0),
          travelRegion,
          startPoint,
          endPoint,
        }),
        tripIdNumber,
        userId,
      ],
    );

    await syncTripDays(connection, tripIdNumber, startDate, days);
    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteTrip(userId, tripId) {
  const db = getDbPool();
  const [result] = await db.execute(
    `
      DELETE FROM trips
      WHERE id = ? AND user_id = ?
    `,
    [Number(tripId), userId],
  );

  return result.affectedRows > 0;
}

export async function setTripSaved(userId, tripId, isSaved = true) {
  const db = getDbPool();
  const [result] = await db.execute(
    `
      UPDATE trips
      SET featured_saved = ?
      WHERE id = ? AND user_id = ?
    `,
    [Boolean(isSaved), Number(tripId), userId],
  );

  return result.affectedRows > 0;
}

export async function createTripStop(userId, tripId, payload) {
  const db = getDbPool();
  const connection = await db.getConnection();
  const tripIdNumber = Number(tripId);

  try {
    const trip = await getOwnedTrip(connection, userId, tripIdNumber);
    if (!trip) {
      return null;
    }

    const dayNumber = normalizeInteger(payload.dayNumber, { min: 1, max: trip.days });
    const [dayRows] = await connection.execute(
      `
        SELECT id
        FROM trip_days
        WHERE trip_id = ? AND day_number = ?
        LIMIT 1
      `,
      [tripIdNumber, dayNumber],
    );

    const tripDay = dayRows[0];
    if (!tripDay) {
      return null;
    }

    const [orderRows] = await connection.execute(
      `
        SELECT COALESCE(MAX(stop_order), 0) AS max_order
        FROM trip_stops
        WHERE trip_day_id = ?
      `,
      [tripDay.id],
    );

    const stopOrder = normalizeInteger(payload.stopOrder, {
      min: 1,
      max: Number(orderRows[0]?.max_order ?? 0) + 1,
    });

    const name = String(payload.name ?? "").trim();
    if (!name) {
      const error = new Error("장소 이름을 입력해주세요.");
      error.status = 400;
      throw error;
    }

    const placeId = createId();
    const stopId = createId();
    const categoryKey = normalizeCategoryKey(payload.categoryKey);
    const categoryLabel = CATEGORY_LABELS[categoryKey];
    const address = typeof payload.address === "string" ? payload.address.trim().slice(0, 255) : null;
    const lat =
      payload.lat === null || payload.lat === undefined
        ? 0
        : normalizeDecimal(payload.lat, { min: -90, max: 90, precision: 7 });
    const lng =
      payload.lng === null || payload.lng === undefined
        ? 0
        : normalizeDecimal(payload.lng, { min: -180, max: 180, precision: 7 });
    const time = normalizeTime(payload.time, "10:00");
    const stayMinutes = normalizeInteger(payload.stayMinutes, { min: 0, max: 1440 });
    const travelMinutes = normalizeInteger(payload.travelMinutes, { min: 0, max: 720 });
    const congestion = normalizeInteger(payload.congestion, { min: 0, max: 100 });
    const distanceKm = normalizeDecimal(payload.distanceKm, { min: 0, max: 999 });
    const transportType = normalizeTransportType(payload.transportType);
    const [countRows] = await connection.execute(
      `
        SELECT COUNT(*) AS stop_count
        FROM trip_stops ts
        INNER JOIN trip_days td ON td.id = ts.trip_day_id
        WHERE td.trip_id = ?
      `,
      [tripIdNumber],
    );

    await connection.beginTransaction();

    await connection.execute(
      `
        INSERT INTO places (
          id, name, category, category_key, address, lat, lng, region, source_type, thumbnail_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user', NULL)
      `,
      [placeId, name, categoryLabel, categoryKey, address, lat, lng, trip.destination],
    );

    await connection.execute(
      `
        INSERT INTO trip_stops (
          id,
          trip_day_id,
          place_id,
          stop_order,
          arrival_time,
          leave_time,
          transport_type,
          travel_minutes_from_prev,
          distance_km_from_prev,
          congestion_score,
          memo,
          category_label,
          category_key,
          stay_minutes,
          map_x,
          map_y,
          is_forked
        )
        VALUES (?, ?, ?, ?, ?, ADDTIME(?, SEC_TO_TIME(? * 60)), ?, ?, ?, ?, NULL, ?, ?, ?, 0, 0, ?)
      `,
      [
        stopId,
        tripDay.id,
        placeId,
        stopOrder,
        `${time}:00`,
        `${time}:00`,
        stayMinutes,
        transportType,
        travelMinutes,
        distanceKm,
        congestion,
        categoryLabel,
        categoryKey,
        stayMinutes,
        Boolean(payload.forked),
      ],
    );

    await normalizeStopOrders(connection, tripDay.id);
    await syncStopPositions(connection, tripDay.id);

    await connection.execute(
      `
        UPDATE trips
        SET theme_json = ?
        WHERE id = ?
      `,
      [
        buildThemeJson({
          ...parseJsonValue(trip.theme_json, {}),
          placeCount: Number(countRows[0]?.stop_count ?? 0) + 1,
        }),
        tripIdNumber,
      ],
    );

    await connection.commit();
    return stopId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateTripStop(userId, tripId, stopId, payload) {
  const db = getDbPool();
  const connection = await db.getConnection();
  const tripIdNumber = Number(tripId);
  const stopIdNumber = Number(stopId);

  try {
    const trip = await getOwnedTrip(connection, userId, tripIdNumber);
    if (!trip) {
      return false;
    }

    const [rows] = await connection.execute(
      `
        SELECT
          ts.id,
          ts.trip_day_id,
          ts.place_id,
          ts.stop_order,
          ts.arrival_time,
          ts.transport_type,
          ts.travel_minutes_from_prev,
          ts.distance_km_from_prev,
          ts.congestion_score,
          ts.category_key,
          ts.stay_minutes,
          ts.is_forked,
          p.name,
          p.address,
          p.lat,
          p.lng
        FROM trip_stops ts
        INNER JOIN trip_days td ON td.id = ts.trip_day_id
        INNER JOIN places p ON p.id = ts.place_id
        WHERE ts.id = ? AND td.trip_id = ?
        LIMIT 1
      `,
      [stopIdNumber, tripIdNumber],
    );

    const stop = rows[0];
    if (!stop) {
      return false;
    }

    const requestedDayNumber = normalizeInteger(payload.dayNumber, { min: 1, max: trip.days });
    const [dayRows] = await connection.execute(
      `
        SELECT id
        FROM trip_days
        WHERE trip_id = ? AND day_number = ?
        LIMIT 1
      `,
      [tripIdNumber, requestedDayNumber],
    );

    const nextTripDayId = dayRows[0]?.id ?? stop.trip_day_id;
    const name = String(payload.name ?? stop.name).trim() || stop.name;
    const categoryKey = normalizeCategoryKey(payload.categoryKey ?? stop.category_key);
    const categoryLabel = CATEGORY_LABELS[categoryKey];
    const address =
      typeof payload.address === "string"
        ? payload.address.trim().slice(0, 255)
        : (stop.address ?? null);
    const lat =
      payload.lat === null || payload.lat === undefined
        ? Number(stop.lat ?? 0)
        : normalizeDecimal(payload.lat, { min: -90, max: 90, precision: 7 });
    const lng =
      payload.lng === null || payload.lng === undefined
        ? Number(stop.lng ?? 0)
        : normalizeDecimal(payload.lng, { min: -180, max: 180, precision: 7 });
    const time = normalizeTime(payload.time ?? String(stop.arrival_time).slice(0, 5), "10:00");
    const stayMinutes = normalizeInteger(payload.stayMinutes ?? stop.stay_minutes, {
      min: 0,
      max: 1440,
    });
    const travelMinutes = normalizeInteger(payload.travelMinutes ?? stop.travel_minutes_from_prev, {
      min: 0,
      max: 720,
    });
    const distanceKm = normalizeDecimal(payload.distanceKm ?? stop.distance_km_from_prev, {
      min: 0,
      max: 999,
    });
    const congestion = normalizeInteger(payload.congestion ?? stop.congestion_score, {
      min: 0,
      max: 100,
    });
    const transportType = normalizeTransportType(payload.transportType ?? stop.transport_type);
    const requestedStopOrder = normalizeInteger(payload.stopOrder ?? stop.stop_order, {
      min: 1,
      max: 999,
    });

    await connection.beginTransaction();

    await connection.execute(
      `
        UPDATE places
        SET name = ?, category = ?, category_key = ?, address = ?, lat = ?, lng = ?, region = ?
        WHERE id = ?
      `,
      [name, categoryLabel, categoryKey, address, lat, lng, trip.destination, stop.place_id],
    );

    await connection.execute(
      `
        UPDATE trip_stops
        SET
          trip_day_id = ?,
          stop_order = ?,
          arrival_time = ?,
          leave_time = ADDTIME(?, SEC_TO_TIME(? * 60)),
          transport_type = ?,
          travel_minutes_from_prev = ?,
          distance_km_from_prev = ?,
          congestion_score = ?,
          category_label = ?,
          category_key = ?,
          stay_minutes = ?,
          is_forked = ?
        WHERE id = ?
      `,
      [
        nextTripDayId,
        requestedStopOrder,
        `${time}:00`,
        `${time}:00`,
        stayMinutes,
        transportType,
        travelMinutes,
        distanceKm,
        congestion,
        categoryLabel,
        categoryKey,
        stayMinutes,
        Boolean(payload.forked ?? stop.is_forked),
        stopIdNumber,
      ],
    );

    await normalizeStopOrders(connection, stop.trip_day_id);
    await syncStopPositions(connection, stop.trip_day_id);

    if (Number(nextTripDayId) !== Number(stop.trip_day_id)) {
      await normalizeStopOrders(connection, nextTripDayId);
      await syncStopPositions(connection, nextTripDayId);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteTripStop(userId, tripId, stopId) {
  const db = getDbPool();
  const connection = await db.getConnection();
  const tripIdNumber = Number(tripId);
  const stopIdNumber = Number(stopId);

  try {
    const [rows] = await connection.execute(
      `
        SELECT ts.trip_day_id, ts.place_id
        FROM trip_stops ts
        INNER JOIN trip_days td ON td.id = ts.trip_day_id
        INNER JOIN trips t ON t.id = td.trip_id
        WHERE ts.id = ? AND td.trip_id = ? AND t.user_id = ?
        LIMIT 1
      `,
      [stopIdNumber, tripIdNumber, userId],
    );

    const stop = rows[0];
    if (!stop) {
      return false;
    }

    const [tripRows] = await connection.execute(
      `
        SELECT theme_json
        FROM trips
        WHERE id = ?
      `,
      [tripIdNumber],
    );

    const theme = parseJsonValue(tripRows[0]?.theme_json, {});

    const [countRows] = await connection.execute(
      `
        SELECT COUNT(*) AS stop_count
        FROM trip_stops ts
        INNER JOIN trip_days td ON td.id = ts.trip_day_id
        WHERE td.trip_id = ?
      `,
      [tripIdNumber],
    );

    await connection.beginTransaction();

    await connection.execute(
      `
        DELETE FROM trip_stops
        WHERE id = ?
      `,
      [stopIdNumber],
    );

    await normalizeStopOrders(connection, stop.trip_day_id);
    await syncStopPositions(connection, stop.trip_day_id);
    await cleanupUnusedPlace(connection, stop.place_id);

    await connection.execute(
      `
        UPDATE trips
        SET theme_json = ?
        WHERE id = ?
      `,
      [
        buildThemeJson({
          ...theme,
          placeCount: Math.max(0, Number(countRows[0]?.stop_count ?? 0) - 1),
        }),
        tripIdNumber,
      ],
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
