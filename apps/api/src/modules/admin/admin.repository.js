import { getDbPool } from "../../database/mysql.js";

function toNumber(value) {
  return Number(value ?? 0);
}

export async function getAdminOverview() {
  const db = getDbPool();
  const [[stats]] = await db.execute(
    `
      SELECT
        (SELECT COUNT(*) FROM users WHERE status = 'active') AS active_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin' AND status = 'active') AS admin_users,
        (SELECT COUNT(*) FROM trips) AS trips,
        (SELECT COUNT(*) FROM community_routes WHERE status = 'published') AS community_routes,
        (SELECT COUNT(*) FROM video_extractions) AS video_extractions,
        (SELECT COUNT(*) FROM favorites) AS saved_places
    `,
  );

  const [users] = await db.execute(
    `
      SELECT id, email, nickname, role, status, last_login_at, created_at
      FROM users
      WHERE status <> 'deleted'
      ORDER BY created_at DESC, id DESC
      LIMIT 20
    `,
  );

  const [trips] = await db.execute(
    `
      SELECT
        t.id,
        t.title,
        t.destination,
        t.status,
        t.is_public,
        t.updated_at,
        u.nickname AS owner
      FROM trips t
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY t.updated_at DESC, t.id DESC
      LIMIT 15
    `,
  );

  const [routes] = await db.execute(
    `
      SELECT
        cr.id,
        cr.title,
        cr.like_count,
        cr.comment_count,
        cr.fork_count,
        cr.status,
        cr.published_at,
        u.nickname AS author
      FROM community_routes cr
      INNER JOIN users u ON u.id = cr.author_user_id
      ORDER BY cr.published_at DESC, cr.id DESC
      LIMIT 15
    `,
  );

  return {
    stats: {
      activeUsers: toNumber(stats.active_users),
      adminUsers: toNumber(stats.admin_users),
      trips: toNumber(stats.trips),
      communityRoutes: toNumber(stats.community_routes),
      videoExtractions: toNumber(stats.video_extractions),
      savedPlaces: toNumber(stats.saved_places),
    },
    users: users.map((user) => ({
      id: String(user.id),
      email: user.email,
      nickname: user.nickname,
      role: user.role ?? "user",
      status: user.status,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
    })),
    trips: trips.map((trip) => ({
      id: String(trip.id),
      title: trip.title,
      destination: trip.destination,
      owner: trip.owner ?? "Unassigned",
      status: trip.status,
      isPublic: Boolean(trip.is_public),
      updatedAt: trip.updated_at,
    })),
    routes: routes.map((route) => ({
      id: String(route.id),
      title: route.title,
      author: route.author,
      likes: toNumber(route.like_count),
      comments: toNumber(route.comment_count),
      forks: toNumber(route.fork_count),
      status: route.status,
      publishedAt: route.published_at,
    })),
  };
}

export async function updateUserStatus(userId, status) {
  if (status !== "active" && status !== "blocked") {
    const error = new Error("지원하지 않는 사용자 상태입니다.");
    error.status = 400;
    throw error;
  }

  const db = getDbPool();
  const [result] = await db.execute(
    `
      UPDATE users
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND role <> 'admin' AND status <> 'deleted'
    `,
    [status, Number(userId)],
  );

  return result.affectedRows > 0;
}

export async function updateCommunityRouteStatus(routeId, status) {
  if (status !== "published" && status !== "hidden") {
    const error = new Error("지원하지 않는 게시글 상태입니다.");
    error.status = 400;
    throw error;
  }

  const db = getDbPool();
  const [result] = await db.execute(
    `
      UPDATE community_routes
      SET status = ?
      WHERE id = ?
    `,
    [status, Number(routeId)],
  );

  return result.affectedRows > 0;
}

export async function deleteTripByAdmin(tripId) {
  const db = getDbPool();
  const [result] = await db.execute(
    `
      DELETE FROM trips
      WHERE id = ?
    `,
    [Number(tripId)],
  );

  return result.affectedRows > 0;
}
