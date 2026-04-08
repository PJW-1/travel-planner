USE travel;

INSERT INTO users (
  id,
  email,
  password_hash,
  nickname,
  provider,
  status,
  last_login_at,
  created_at,
  updated_at
)
VALUES
  (2001, 'demo1@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', 'Mina', 'local', 'active', NOW(), NOW(), NOW()),
  (2002, 'demo2@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', 'Joon', 'local', 'active', NOW(), NOW(), NOW()),
  (2003, 'demo3@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', 'Sora', 'local', 'active', NOW(), NOW(), NOW()),
  (2004, 'demo4@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', 'Leo', 'local', 'active', NOW(), NOW(), NOW()),
  (2005, 'demo5@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', 'Yuna', 'local', 'active', NOW(), NOW(), NOW()),
  (2006, 'demo6@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', 'Theo', 'local', 'active', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  password_hash = VALUES(password_hash),
  updated_at = NOW();

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
VALUES
  (3201, 2001, 'Seoul Cafe Day', 'Seoul', '2026-05-11', '2026-05-11', 1, JSON_OBJECT('lunchTime','12:00','dinnerTime','18:30','tags', JSON_ARRAY('seoul','cafe','city')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3202, 2002, 'Osaka First Day Eats', 'Osaka', '2026-05-14', '2026-05-14', 1, JSON_OBJECT('lunchTime','12:30','dinnerTime','19:00','tags', JSON_ARRAY('osaka','food','walk')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3203, 2003, 'Tokyo Photo Walk', 'Tokyo', '2026-05-19', '2026-05-19', 1, JSON_OBJECT('lunchTime','12:00','dinnerTime','18:00','tags', JSON_ARRAY('tokyo','photo','cafe')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3204, 2004, 'Paris Landmark Day', 'Paris', '2026-05-22', '2026-05-22', 1, JSON_OBJECT('lunchTime','12:00','dinnerTime','18:30','tags', JSON_ARRAY('paris','landmark','photo')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3205, 2005, 'New York Highlight Run', 'New York', '2026-05-27', '2026-05-27', 1, JSON_OBJECT('lunchTime','12:00','dinnerTime','18:30','tags', JSON_ARRAY('newyork','highlight','city')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3206, 2006, 'Sapporo Winter Mood', 'Sapporo', '2026-06-01', '2026-06-01', 1, JSON_OBJECT('lunchTime','12:30','dinnerTime','18:30','tags', JSON_ARRAY('sapporo','winter','walk')), 'published', TRUE, NULL, FALSE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  destination = VALUES(destination),
  theme_json = VALUES(theme_json),
  updated_at = NOW();

INSERT INTO trip_days (id, trip_id, day_number, date, title, notes)
VALUES
  (4201, 3201, 1, '2026-05-11', 'Day 1', NULL),
  (4202, 3202, 1, '2026-05-14', 'Day 1', NULL),
  (4203, 3203, 1, '2026-05-19', 'Day 1', NULL),
  (4204, 3204, 1, '2026-05-22', 'Day 1', NULL),
  (4205, 3205, 1, '2026-05-27', 'Day 1', NULL),
  (4206, 3206, 1, '2026-06-01', 'Day 1', NULL)
ON DUPLICATE KEY UPDATE
  date = VALUES(date),
  title = VALUES(title);

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
VALUES
  (5201, 4201, 2001, 1, '10:00:00', '10:40:00', 'subway', 0, 0.0, 35, 'Start at a transport hub for an easy city move.', 'Transit Hub', 'transport', 40, 18, 52, FALSE),
  (5202, 4201, 2002, 2, '12:10:00', '13:20:00', 'walk', 22, 1.7, 70, 'Good cafe stop before lunch and photo time.', 'Cafe', 'cafe', 70, 56, 32, FALSE),
  (5203, 4201, 2004, 3, '17:40:00', '19:00:00', 'subway', 28, 5.4, 58, 'Finish the day at a scenic photo point.', 'View Point', 'view', 80, 63, 76, FALSE),
  (5211, 4202, 2001, 1, '10:20:00', '10:50:00', 'subway', 0, 0.0, 28, 'Easy first stop after arriving in town.', 'Transit Hub', 'transport', 30, 18, 52, FALSE),
  (5212, 4202, 2005, 2, '11:40:00', '13:00:00', 'walk', 16, 1.2, 74, 'Best kept as a lunch and walk combo.', 'Activity', 'activity', 80, 50, 56, FALSE),
  (5213, 4202, 2007, 3, '15:20:00', '16:40:00', 'walk', 12, 0.9, 61, 'Nice late-afternoon cafe with relaxed mood.', 'Cafe', 'cafe', 80, 42, 72, FALSE),
  (5221, 4203, 2003, 1, '09:50:00', '11:10:00', 'walk', 0, 0.0, 22, 'Start with an easy photo-friendly walk spot.', 'Activity', 'activity', 80, 30, 28, FALSE),
  (5222, 4203, 2007, 2, '12:20:00', '13:30:00', 'walk', 18, 1.4, 63, 'Cafe and side street pairing works well here.', 'Cafe', 'cafe', 70, 42, 72, FALSE),
  (5223, 4203, 2004, 3, '17:10:00', '18:30:00', 'bus', 24, 4.8, 49, 'Golden hour view point to close the route.', 'View Point', 'view', 80, 63, 76, FALSE),
  (5231, 4204, 2001, 1, '10:00:00', '10:35:00', 'walk', 0, 0.0, 30, 'Start at a central access point before landmarks.', 'Transit Hub', 'transport', 35, 18, 52, FALSE),
  (5232, 4204, 2003, 2, '12:00:00', '13:20:00', 'walk', 26, 2.1, 43, 'A strong mid-route landmark and photo stop.', 'Activity', 'activity', 80, 30, 28, FALSE),
  (5233, 4204, 2004, 3, '17:30:00', '18:50:00', 'walk', 21, 1.8, 55, 'Best late in the day for wide city views.', 'View Point', 'view', 80, 63, 76, FALSE),
  (5241, 4205, 2001, 1, '10:10:00', '10:40:00', 'subway', 0, 0.0, 36, 'Transit start keeps the route compact.', 'Transit Hub', 'transport', 30, 18, 52, FALSE),
  (5242, 4205, 2005, 2, '12:30:00', '13:40:00', 'taxi', 19, 3.1, 66, 'Strong midday photo stop with good pacing.', 'Activity', 'activity', 70, 50, 56, FALSE),
  (5243, 4205, 2004, 3, '18:10:00', '19:30:00', 'taxi', 23, 5.6, 62, 'Good final skyline point for the route.', 'View Point', 'view', 80, 63, 76, FALSE),
  (5251, 4206, 2003, 1, '10:00:00', '11:10:00', 'walk', 0, 0.0, 24, 'Start slow with a calm winter-friendly stop.', 'Activity', 'activity', 70, 30, 28, FALSE),
  (5252, 4206, 2007, 2, '12:00:00', '13:10:00', 'walk', 17, 1.3, 52, 'Warm cafe break works well in the middle.', 'Cafe', 'cafe', 70, 42, 72, FALSE),
  (5253, 4206, 2004, 3, '17:20:00', '18:40:00', 'walk', 20, 1.7, 48, 'Wrap up with a scenic winter photo point.', 'View Point', 'view', 80, 63, 76, FALSE)
ON DUPLICATE KEY UPDATE
  arrival_time = VALUES(arrival_time),
  leave_time = VALUES(leave_time),
  transport_type = VALUES(transport_type),
  travel_minutes_from_prev = VALUES(travel_minutes_from_prev),
  distance_km_from_prev = VALUES(distance_km_from_prev),
  congestion_score = VALUES(congestion_score),
  memo = VALUES(memo);

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
VALUES
  (6201, 3201, 7.1, 50, 92, 28, JSON_ARRAY(), NOW()),
  (6202, 3202, 5.8, 42, 90, 24, JSON_ARRAY(), NOW()),
  (6203, 3203, 6.2, 45, 91, 26, JSON_ARRAY(), NOW()),
  (6204, 3204, 6.7, 47, 89, 29, JSON_ARRAY(), NOW()),
  (6205, 3205, 8.7, 54, 87, 33, JSON_ARRAY(), NOW()),
  (6206, 3206, 5.4, 37, 93, 21, JSON_ARRAY(), NOW())
ON DUPLICATE KEY UPDATE
  total_distance_km = VALUES(total_distance_km),
  total_travel_minutes = VALUES(total_travel_minutes),
  optimization_score = VALUES(optimization_score),
  fatigue_score = VALUES(fatigue_score),
  warning_json = VALUES(warning_json),
  analyzed_at = NOW();

INSERT INTO community_routes (
  id,
  trip_id,
  author_user_id,
  title,
  description,
  thumbnail_url,
  theme,
  view_count,
  like_count,
  comment_count,
  fork_count,
  status,
  published_at,
  created_at
)
VALUES
  (7101, 3201, 2001, 'Seoul Cafe and View Day', 'A balanced city route with a smooth transit start, one cafe stop, and a strong sunset finish.', NULL, 'urban', 152, 11, 4, 3, 'published', NOW(), NOW()),
  (7102, 3202, 2002, 'Osaka First Day Food Route', 'Built for an easy arrival day with food, walking, and one relaxed cafe break.', NULL, 'cafe', 133, 9, 3, 2, 'published', NOW(), NOW()),
  (7103, 3203, 2003, 'Tokyo Photo Walk Picks', 'A short Tokyo route focused on photo spots, side streets, and one cafe reset.', NULL, 'walking', 121, 8, 2, 2, 'published', NOW(), NOW()),
  (7104, 3204, 2004, 'Paris Landmark Starter Day', 'A first-day Paris route that keeps pace comfortable and views strong.', NULL, 'urban', 144, 10, 4, 1, 'published', NOW(), NOW()),
  (7105, 3205, 2005, 'New York Highlight Sprint', 'Compact city route for travelers who want key skyline and downtown moments in one day.', NULL, 'coast', 119, 7, 3, 2, 'published', NOW(), NOW()),
  (7106, 3206, 2006, 'Sapporo Winter Mood Route', 'A calm winter route with a slow start, warm cafe stop, and scenic ending.', NULL, 'walking', 126, 9, 2, 3, 'published', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  theme = VALUES(theme),
  view_count = VALUES(view_count),
  like_count = VALUES(like_count),
  comment_count = VALUES(comment_count),
  fork_count = VALUES(fork_count),
  published_at = VALUES(published_at);

INSERT INTO route_tags (id, community_route_id, tag_name)
VALUES
  (8201, 7101, 'seoul'),
  (8202, 7101, 'cafe'),
  (8203, 7102, 'osaka'),
  (8204, 7102, 'food'),
  (8205, 7103, 'tokyo'),
  (8206, 7103, 'photo'),
  (8207, 7104, 'paris'),
  (8208, 7104, 'landmark'),
  (8209, 7105, 'newyork'),
  (8210, 7105, 'city'),
  (8211, 7106, 'sapporo'),
  (8212, 7106, 'winter')
ON DUPLICATE KEY UPDATE
  tag_name = VALUES(tag_name);

INSERT IGNORE INTO community_route_likes (id, community_route_id, user_id, created_at)
VALUES
  (9101, 7101, 3, NOW()),
  (9102, 7101, 2002, NOW()),
  (9103, 7102, 3, NOW()),
  (9104, 7102, 2001, NOW()),
  (9105, 7103, 2004, NOW()),
  (9106, 7103, 2005, NOW()),
  (9107, 7104, 3, NOW()),
  (9108, 7104, 2006, NOW()),
  (9109, 7105, 2001, NOW()),
  (9110, 7105, 2003, NOW()),
  (9111, 7106, 3, NOW()),
  (9112, 7106, 2005, NOW()),
  (9113, 7001, 3, NOW()),
  (9114, 7002, 2001, NOW()),
  (9115, 7003, 2002, NOW()),
  (9116, 7004, 2006, NOW());
