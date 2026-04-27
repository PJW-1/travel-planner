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
  (2001, 'demo1@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', '민아', 'local', 'active', NOW(), NOW(), NOW()),
  (2002, 'demo2@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', '준호', 'local', 'active', NOW(), NOW(), NOW()),
  (2003, 'demo3@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', '소라', 'local', 'active', NOW(), NOW(), NOW()),
  (2004, 'demo4@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', '태오', 'local', 'active', NOW(), NOW(), NOW()),
  (2005, 'demo5@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', '유나', 'local', 'active', NOW(), NOW(), NOW()),
  (2006, 'demo6@tripflow.local', '$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC', '도윤', 'local', 'active', NOW(), NOW(), NOW())
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
  (3201, 2001, '서울 감성 카페 당일치기', '서울', '2026-05-11', '2026-05-11', 1, JSON_OBJECT('lunchTime','12:00','dinnerTime','18:30','tags', JSON_ARRAY('서울','카페','도심')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3202, 2002, '오사카 첫날 먹방 루트', '오사카', '2026-05-14', '2026-05-14', 1, JSON_OBJECT('lunchTime','12:30','dinnerTime','19:00','tags', JSON_ARRAY('오사카','먹방','도보')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3203, 2003, '도쿄 사진 스팟 산책', '도쿄', '2026-05-19', '2026-05-19', 1, JSON_OBJECT('lunchTime','12:00','dinnerTime','18:00','tags', JSON_ARRAY('도쿄','사진','카페')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3204, 2004, '파리 랜드마크 하루 코스', '파리', '2026-05-22', '2026-05-22', 1, JSON_OBJECT('lunchTime','12:00','dinnerTime','18:30','tags', JSON_ARRAY('파리','랜드마크','포토')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3205, 2005, '뉴욕 핵심 스팟 빠르게 보기', '뉴욕', '2026-05-27', '2026-05-27', 1, JSON_OBJECT('lunchTime','12:00','dinnerTime','18:30','tags', JSON_ARRAY('뉴욕','핵심','도심')), 'published', TRUE, NULL, FALSE, FALSE, FALSE),
  (3206, 2006, '삿포로 겨울 감성 하루', '삿포로', '2026-06-01', '2026-06-01', 1, JSON_OBJECT('lunchTime','12:30','dinnerTime','18:30','tags', JSON_ARRAY('삿포로','겨울','산책')), 'published', TRUE, NULL, FALSE, FALSE, FALSE)
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
  (5201, 4201, 2001, 1, '10:00:00', '10:40:00', 'subway', 0, 0.0, 35, '서울 안에서 움직이기 편한 출발점으로 잡았습니다.', '교통 허브', 'transport', 40, 18, 52, FALSE),
  (5202, 4201, 2002, 2, '12:10:00', '13:20:00', 'walk', 22, 1.7, 70, '점심 전에 들르기 좋은 카페라서 동선 중간에 넣었습니다.', '카페', 'cafe', 70, 56, 32, FALSE),
  (5203, 4201, 2004, 3, '17:40:00', '19:00:00', 'subway', 28, 5.4, 58, '노을 시간대에 맞춰 마지막 뷰 포인트로 마무리했습니다.', '뷰 포인트', 'view', 80, 63, 76, FALSE),
  (5211, 4202, 2001, 1, '10:20:00', '10:50:00', 'subway', 0, 0.0, 28, '도착 직후 이동 부담이 적도록 첫 장소를 배치했습니다.', '교통 허브', 'transport', 30, 18, 52, FALSE),
  (5212, 4202, 2005, 2, '11:40:00', '13:00:00', 'walk', 16, 1.2, 74, '점심과 산책을 같이 즐기기 좋아서 가운데에 넣었습니다.', '액티비티', 'activity', 80, 50, 56, FALSE),
  (5213, 4202, 2007, 3, '15:20:00', '16:40:00', 'walk', 12, 0.9, 61, '오후 분위기가 좋은 카페라 후반부에 두었습니다.', '카페', 'cafe', 80, 42, 72, FALSE),
  (5221, 4203, 2003, 1, '09:50:00', '11:10:00', 'walk', 0, 0.0, 22, '가볍게 사진 찍기 좋은 장소로 하루를 시작합니다.', '액티비티', 'activity', 80, 30, 28, FALSE),
  (5222, 4203, 2007, 2, '12:20:00', '13:30:00', 'walk', 18, 1.4, 63, '골목 산책과 카페를 같이 묶기 좋은 구간입니다.', '카페', 'cafe', 70, 42, 72, FALSE),
  (5223, 4203, 2004, 3, '17:10:00', '18:30:00', 'bus', 24, 4.8, 49, '해질 무렵 풍경을 보기 좋은 장소라 마지막으로 잡았습니다.', '뷰 포인트', 'view', 80, 63, 76, FALSE),
  (5231, 4204, 2001, 1, '10:00:00', '10:35:00', 'walk', 0, 0.0, 30, '랜드마크 이동 전에 중심축 역할을 하는 장소입니다.', '교통 허브', 'transport', 35, 18, 52, FALSE),
  (5232, 4204, 2003, 2, '12:00:00', '13:20:00', 'walk', 26, 2.1, 43, '중간에 가장 상징적인 장소를 넣어 사진 동선을 살렸습니다.', '액티비티', 'activity', 80, 30, 28, FALSE),
  (5233, 4204, 2004, 3, '17:30:00', '18:50:00', 'walk', 21, 1.8, 55, '넓게 시야가 열리는 시간대에 맞춘 마지막 코스입니다.', '뷰 포인트', 'view', 80, 63, 76, FALSE),
  (5241, 4205, 2001, 1, '10:10:00', '10:40:00', 'subway', 0, 0.0, 36, '이동을 압축하기 좋은 출발 포인트입니다.', '교통 허브', 'transport', 30, 18, 52, FALSE),
  (5242, 4205, 2005, 2, '12:30:00', '13:40:00', 'taxi', 19, 3.1, 66, '한낮 사진이 잘 나오는 지점이라 가운데에 배치했습니다.', '액티비티', 'activity', 70, 50, 56, FALSE),
  (5243, 4205, 2004, 3, '18:10:00', '19:30:00', 'taxi', 23, 5.6, 62, '도심 야경을 보기 좋게 마지막 스팟으로 정리했습니다.', '뷰 포인트', 'view', 80, 63, 76, FALSE),
  (5251, 4206, 2003, 1, '10:00:00', '11:10:00', 'walk', 0, 0.0, 24, '겨울 분위기를 천천히 느끼기 좋은 시작 지점입니다.', '액티비티', 'activity', 70, 30, 28, FALSE),
  (5252, 4206, 2007, 2, '12:00:00', '13:10:00', 'walk', 17, 1.3, 52, '중간에 몸을 녹일 수 있는 카페를 넣었습니다.', '카페', 'cafe', 70, 42, 72, FALSE),
  (5253, 4206, 2004, 3, '17:20:00', '18:40:00', 'walk', 20, 1.7, 48, '겨울 사진을 남기기 좋은 마지막 뷰 포인트입니다.', '뷰 포인트', 'view', 80, 63, 76, FALSE)
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
  (7101, 3201, 2001, '서울 카페와 야경을 한 번에 담는 당일치기 코스', '지하철 이동으로 시작해서 감성 카페와 야경 포인트까지 무리 없이 이어지는 서울 하루 코스입니다.', NULL, 'urban', 152, 11, 4, 3, 'published', NOW(), NOW()),
  (7102, 3202, 2002, '오사카 도착 첫날 가볍게 즐기는 먹방 루트', '무거운 일정 없이 걷기 좋은 구간과 쉬어가기 좋은 카페를 묶은 첫날용 코스입니다.', NULL, 'cafe', 133, 9, 3, 2, 'published', NOW(), NOW()),
  (7103, 3203, 2003, '도쿄 사진 스팟만 골라 걷는 감성 산책', '사진이 잘 나오는 장소와 골목 분위기를 중심으로 짧고 밀도 있게 구성한 도쿄 루트입니다.', NULL, 'walking', 121, 8, 2, 2, 'published', NOW(), NOW()),
  (7104, 3204, 2004, '파리 처음 가는 사람에게 추천하는 랜드마크 코스', '이동 부담은 줄이고 상징적인 장소를 알차게 담아낸 파리 하루 루트입니다.', NULL, 'urban', 144, 10, 4, 1, 'published', NOW(), NOW()),
  (7105, 3205, 2005, '뉴욕 핵심 명소만 빠르게 훑는 시티 하이라이트', '짧은 일정으로도 뉴욕 분위기를 가장 진하게 느낄 수 있는 포인트 위주로 정리했습니다.', NULL, 'coast', 119, 7, 3, 2, 'published', NOW(), NOW()),
  (7106, 3206, 2006, '삿포로 겨울 무드를 천천히 즐기는 하루 코스', '산책과 카페, 뷰 포인트를 묶어 겨울 감성을 편하게 즐기기 좋은 루트입니다.', NULL, 'walking', 126, 9, 2, 3, 'published', NOW(), NOW())
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
  (8201, 7101, '서울'),
  (8202, 7101, '카페'),
  (8203, 7102, '오사카'),
  (8204, 7102, '먹방'),
  (8205, 7103, '도쿄'),
  (8206, 7103, '사진'),
  (8207, 7104, '파리'),
  (8208, 7104, '랜드마크'),
  (8209, 7105, '뉴욕'),
  (8210, 7105, '도심'),
  (8211, 7106, '삿포로'),
  (8212, 7106, '겨울')
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
