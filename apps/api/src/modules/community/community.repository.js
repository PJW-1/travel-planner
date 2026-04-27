import { getDbPool } from "../../database/mysql.js";

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

function createId() {
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return Number(`${Date.now()}${suffix}`);
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formattedStart = `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, "0")}.${String(
    start.getDate(),
  ).padStart(2, "0")}`;
  const formattedEnd = `${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;

  return `${formattedStart} - ${formattedEnd}`;
}

function mapCommunityTheme(value) {
  if (value === "urban" || value === "cafe" || value === "walking" || value === "coast") {
    return value;
  }

  return "urban";
}

function mapStopCategoryKey(value) {
  if (value === "transport" || value === "cafe" || value === "activity" || value === "view") {
    return value;
  }

  return "activity";
}

export async function listCommunityRoutes(userId = null) {
  const db = getDbPool();
  const [routeRows] = await db.execute(
    `
      SELECT
        cr.id,
        cr.trip_id,
        cr.title,
        cr.description,
        cr.theme,
        cr.like_count,
        cr.comment_count,
        cr.fork_count,
        cr.published_at,
        u.nickname AS author,
        t.destination,
        t.start_date,
        t.end_date,
        t.days,
        t.theme_json
      FROM community_routes cr
      INNER JOIN users u ON u.id = cr.author_user_id
      INNER JOIN trips t ON t.id = cr.trip_id
      ORDER BY cr.published_at DESC, cr.id DESC
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

  const likedRouteIds = new Set();

  if (userId) {
    const routeIds = routeRows.map((row) => Number(row.id));

    if (routeIds.length > 0) {
      const placeholders = routeIds.map(() => "?").join(", ");
      const [likedRows] = await db.execute(
        `
          SELECT community_route_id
          FROM community_route_likes
          WHERE user_id = ? AND community_route_id IN (${placeholders})
        `,
        [userId, ...routeIds],
      );

      likedRows.forEach((row) => likedRouteIds.add(String(row.community_route_id)));
    }
  }

  return routeRows.map((row) => {
    const theme = parseJsonValue(row.theme_json, {});

    return {
      id: String(row.id),
      tripId: String(row.trip_id),
      title: row.title,
      description: row.description ?? "",
      author: row.author,
      likes: Number(row.like_count ?? 0),
      comments: Number(row.comment_count ?? 0),
      forkCount: Number(row.fork_count ?? 0),
      theme: mapCommunityTheme(row.theme),
      tags: tagsByRouteId.get(row.id) ?? [],
      destination: row.destination,
      days: Number(row.days ?? 1),
      dateRange: formatDateRange(row.start_date, row.end_date),
      publishedAt: row.published_at,
      likedByMe: likedRouteIds.has(String(row.id)),
      travelRegion: theme.travelRegion ?? "korea",
    };
  });
}

export async function getCommunityRouteDetail(routeId, userId = null) {
  const db = getDbPool();
  const [routeRows] = await db.execute(
    `
      SELECT
        cr.id,
        cr.trip_id,
        cr.title,
        cr.description,
        cr.theme,
        cr.like_count,
        cr.comment_count,
        cr.fork_count,
        cr.published_at,
        u.nickname AS author,
        t.destination,
        t.start_date,
        t.end_date,
        t.days,
        t.theme_json
      FROM community_routes cr
      INNER JOIN users u ON u.id = cr.author_user_id
      INNER JOIN trips t ON t.id = cr.trip_id
      WHERE cr.id = ?
      LIMIT 1
    `,
    [Number(routeId)],
  );

  const route = routeRows[0];

  if (!route) {
    return null;
  }

  const [tagRows] = await db.execute(
    `
      SELECT tag_name
      FROM route_tags
      WHERE community_route_id = ?
      ORDER BY id ASC
    `,
    [Number(routeId)],
  );

  const [dayRows] = await db.execute(
    `
      SELECT id, day_number, date
      FROM trip_days
      WHERE trip_id = ?
      ORDER BY day_number ASC
    `,
    [route.trip_id],
  );

  const [stopRows] = await db.execute(
    `
      SELECT
        ts.id,
        ts.place_id,
        td.day_number,
        ts.stop_order,
        ts.arrival_time,
        ts.transport_type,
        ts.travel_minutes_from_prev,
        ts.distance_km_from_prev,
        ts.memo,
        ts.category_key,
        ts.category_label,
        p.name,
        p.address,
        p.region,
        p.lat,
        p.lng
      FROM trip_stops ts
      INNER JOIN trip_days td ON td.id = ts.trip_day_id
      INNER JOIN places p ON p.id = ts.place_id
      WHERE td.trip_id = ?
      ORDER BY td.day_number ASC, ts.stop_order ASC
    `,
    [route.trip_id],
  );

  const likedRouteIds = new Set();
  const savedPlaceIds = new Set();

  if (userId) {
    const [likedRows] = await db.execute(
      `
        SELECT community_route_id
        FROM community_route_likes
        WHERE user_id = ? AND community_route_id = ?
      `,
      [userId, Number(routeId)],
    );

    likedRows.forEach((row) => likedRouteIds.add(String(row.community_route_id)));

    const uniquePlaceIds = [...new Set(stopRows.map((stop) => Number(stop.place_id)))];

    if (uniquePlaceIds.length > 0) {
      const placeholders = uniquePlaceIds.map(() => "?").join(", ");
      const [favoriteRows] = await db.execute(
        `
          SELECT place_id
          FROM favorites
          WHERE user_id = ? AND place_id IN (${placeholders})
        `,
        [userId, ...uniquePlaceIds],
      );

      favoriteRows.forEach((row) => savedPlaceIds.add(String(row.place_id)));
    }
  }

  const days = dayRows.map((day) => ({
    id: String(day.id),
    dayNumber: Number(day.day_number),
    date: day.date,
    title: `${day.day_number}일차 (${route.destination})`,
    stops: stopRows
      .filter((stop) => Number(stop.day_number) === Number(day.day_number))
      .map((stop) => ({
        id: String(stop.id),
        placeId: String(stop.place_id),
        name: stop.name,
        address: stop.address ?? "",
        region: stop.region ?? "",
        category: stop.category_label,
        categoryKey: mapStopCategoryKey(stop.category_key),
        lat: Number(stop.lat ?? 0),
        lng: Number(stop.lng ?? 0),
        arrivalTime: String(stop.arrival_time).slice(0, 5),
        transportType: stop.transport_type,
        travelMinutes: Number(stop.travel_minutes_from_prev ?? 0),
        distanceKm: Number(stop.distance_km_from_prev ?? 0),
        memo: stop.memo ?? "",
        order: Number(stop.stop_order),
        isSaved: savedPlaceIds.has(String(stop.place_id)),
      })),
  }));

  const theme = parseJsonValue(route.theme_json, {});

  return {
    id: String(route.id),
    tripId: String(route.trip_id),
    title: route.title,
    description: route.description ?? "",
    author: route.author,
    theme: mapCommunityTheme(route.theme),
    destination: route.destination,
    dateRange: formatDateRange(route.start_date, route.end_date),
    daysCount: Number(route.days ?? 1),
    likes: Number(route.like_count ?? 0),
    comments: Number(route.comment_count ?? 0),
    forkCount: Number(route.fork_count ?? 0),
    tags: tagRows.map((row) => row.tag_name),
    publishedAt: route.published_at,
    likedByMe: likedRouteIds.has(String(route.id)),
    days,
    travelRegion: theme.travelRegion ?? "korea",
  };
}

export async function importCommunityRoute(userId, routeId) {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    const [routeRows] = await connection.execute(
      `
        SELECT cr.id, cr.trip_id, cr.title, t.destination, t.start_date, t.end_date, t.days, t.theme_json
        FROM community_routes cr
        INNER JOIN trips t ON t.id = cr.trip_id
        WHERE cr.id = ?
        LIMIT 1
      `,
      [Number(routeId)],
    );

    const route = routeRows[0];

    if (!route) {
      return null;
    }

    const [dayRows] = await connection.execute(
      `
        SELECT id, day_number, date
        FROM trip_days
        WHERE trip_id = ?
        ORDER BY day_number ASC
      `,
      [route.trip_id],
    );

    const [stopRows] = await connection.execute(
      `
        SELECT
          ts.trip_day_id,
          ts.place_id,
          ts.stop_order,
          ts.arrival_time,
          ts.leave_time,
          ts.transport_type,
          ts.travel_minutes_from_prev,
          ts.distance_km_from_prev,
          ts.congestion_score,
          ts.memo,
          ts.category_label,
          ts.category_key,
          ts.stay_minutes,
          ts.map_x,
          ts.map_y,
          ts.is_forked
        FROM trip_stops ts
        INNER JOIN trip_days td ON td.id = ts.trip_day_id
        WHERE td.trip_id = ?
        ORDER BY td.day_number ASC, ts.stop_order ASC
      `,
      [route.trip_id],
    );

    const [analysisRows] = await connection.execute(
      `
        SELECT total_distance_km, total_travel_minutes, optimization_score, warning_json
        FROM trip_analyses
        WHERE trip_id = ?
        ORDER BY analyzed_at DESC
        LIMIT 1
      `,
      [route.trip_id],
    );

    const dayIdMap = new Map();
    const newTripId = createId();

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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', FALSE, NULL, FALSE, FALSE, TRUE)
      `,
      [
        newTripId,
        userId,
        `${route.title} 가져온 일정`,
        route.destination,
        route.start_date,
        route.end_date,
        route.days,
        route.theme_json,
      ],
    );

    for (const day of dayRows) {
      const newDayId = createId();
      dayIdMap.set(day.id, newDayId);

      await connection.execute(
        `
          INSERT INTO trip_days (id, trip_id, day_number, date, title, notes)
          VALUES (?, ?, ?, ?, ?, NULL)
        `,
        [newDayId, newTripId, day.day_number, day.date, `${day.day_number}일차 일정`],
      );
    }

    for (const stop of stopRows) {
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          createId(),
          dayIdMap.get(stop.trip_day_id),
          stop.place_id,
          stop.stop_order,
          stop.arrival_time,
          stop.leave_time,
          stop.transport_type,
          stop.travel_minutes_from_prev,
          stop.distance_km_from_prev,
          stop.congestion_score,
          stop.memo,
          stop.category_label,
          stop.category_key,
          stop.stay_minutes,
          stop.map_x,
          stop.map_y,
          stop.is_forked,
        ],
      );
    }

    if (analysisRows[0]) {
      await connection.execute(
        `
          INSERT INTO trip_analyses (
            id,
            trip_id,
            total_distance_km,
            total_travel_minutes,
            optimization_score,
            warning_json,
            analyzed_at
          )
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          createId(),
          newTripId,
          analysisRows[0].total_distance_km,
          analysisRows[0].total_travel_minutes,
          analysisRows[0].optimization_score,
          analysisRows[0].warning_json,
        ],
      );
    }

    await connection.execute(
      `
        INSERT INTO route_forks (
          id,
          community_route_id,
          user_id,
          forked_trip_id,
          fork_scope,
          created_at
        )
        VALUES (?, ?, ?, ?, 'full', NOW())
      `,
      [createId(), Number(routeId), userId, newTripId],
    );

    await connection.execute(
      `
        UPDATE community_routes
        SET fork_count = fork_count + 1
        WHERE id = ?
      `,
      [Number(routeId)],
    );

    await connection.commit();

    return {
      routeId: String(routeId),
      tripId: String(newTripId),
      title: `${route.title} 가져온 일정`,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function toggleCommunityRouteLike(userId, routeId) {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `
        SELECT id
        FROM community_route_likes
        WHERE community_route_id = ? AND user_id = ?
        LIMIT 1
      `,
      [Number(routeId), userId],
    );

    const existing = existingRows[0];
    const liked = !existing;

    if (existing) {
      await connection.execute(`DELETE FROM community_route_likes WHERE id = ?`, [existing.id]);
      await connection.execute(
        `
          UPDATE community_routes
          SET like_count = GREATEST(like_count - 1, 0)
          WHERE id = ?
        `,
        [Number(routeId)],
      );
    } else {
      await connection.execute(
        `
          INSERT INTO community_route_likes (id, community_route_id, user_id, created_at)
          VALUES (?, ?, ?, NOW())
        `,
        [createId(), Number(routeId), userId],
      );
      await connection.execute(
        `
          UPDATE community_routes
          SET like_count = like_count + 1
          WHERE id = ?
        `,
        [Number(routeId)],
      );
    }

    const [routeRows] = await connection.execute(
      `SELECT like_count FROM community_routes WHERE id = ? LIMIT 1`,
      [Number(routeId)],
    );

    await connection.commit();

    return {
      liked,
      likeCount: Number(routeRows[0]?.like_count ?? 0),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function saveCommunityPlace(userId, placeId) {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    const [existingRows] = await connection.execute(
      `
        SELECT id
        FROM favorites
        WHERE user_id = ? AND place_id = ?
        LIMIT 1
      `,
      [userId, Number(placeId)],
    );

    if (!existingRows[0]) {
      await connection.execute(
        `
          INSERT INTO favorites (id, user_id, place_id, created_at)
          VALUES (?, ?, ?, NOW())
        `,
        [createId(), userId, Number(placeId)],
      );
    }

    return true;
  } finally {
    connection.release();
  }
}
