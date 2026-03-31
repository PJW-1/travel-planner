USE travel;
SET NAMES utf8mb4;

INSERT INTO users (
  id,
  email,
  password_hash,
  nickname,
  provider,
  status,
  last_login_at
) VALUES
  (1001, 'seed-owner@travel-master.local', '$2b$12$ihB6dV7E4Kf1m5L6nqvPUut9y1QqJg8Q9Y2j7P5D8oXrP9sN2x4kS', '정동훈', 'local', 'active', NOW()),
  (1002, 'travelmaster@travel-master.local', '$2b$12$ihB6dV7E4Kf1m5L6nqvPUut9y1QqJg8Q9Y2j7P5D8oXrP9sN2x4kS', 'TravelMaster', 'local', 'active', NOW()),
  (1003, 'jejulover@travel-master.local', '$2b$12$ihB6dV7E4Kf1m5L6nqvPUut9y1QqJg8Q9Y2j7P5D8oXrP9sN2x4kS', 'JejuLover', 'local', 'active', NOW()),
  (1004, 'walkholic@travel-master.local', '$2b$12$ihB6dV7E4Kf1m5L6nqvPUut9y1QqJg8Q9Y2j7P5D8oXrP9sN2x4kS', 'WalkHolic', 'local', 'active', NOW()),
  (1005, 'tastyroad@travel-master.local', '$2b$12$ihB6dV7E4Kf1m5L6nqvPUut9y1QqJg8Q9Y2j7P5D8oXrP9sN2x4kS', 'TastyRoad', 'local', 'active', NOW())
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  status = VALUES(status),
  last_login_at = VALUES(last_login_at);

INSERT INTO places (
  id,
  name,
  category,
  category_key,
  address,
  lat,
  lng,
  region,
  source_type,
  thumbnail_url
) VALUES
  (2001, '서울역', '교통 허브', 'transport', '서울 중구 한강대로 405', 37.5546480, 126.9706110, '서울', 'seed', NULL),
  (2002, '성수 시그니처 카페', '카페', 'cafe', '서울 성동구 성수동', 37.5443050, 127.0553370, '서울', 'seed', NULL),
  (2003, '서울숲', '액티비티', 'activity', '서울 성동구 뚝섬로 273', 37.5443880, 127.0374420, '서울', 'seed', NULL),
  (2004, '뚝섬 한강공원', '뷰 포인트', 'view', '서울 광진구 자양동', 37.5310270, 127.0671500, '서울', 'seed', NULL),
  (2005, '성수동 팝업스토어', '팝업', 'activity', '서울 성동구 연무장길', 37.5441120, 127.0549210, '서울', 'video', NULL),
  (2006, '한강 라면 스팟', '야식', 'view', '서울 성동구 성수동1가', 37.5349910, 127.0640180, '서울', 'video', NULL),
  (2007, '연무장길 감성 카페', '카페', 'cafe', '서울 성동구 연무장길', 37.5438800, 127.0543370, '서울', 'video', NULL)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  category_key = VALUES(category_key),
  address = VALUES(address),
  lat = VALUES(lat),
  lng = VALUES(lng),
  region = VALUES(region),
  source_type = VALUES(source_type);

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
) VALUES
  (
    3001,
    1001,
    '서울 성수동 당일치기 투어',
    '서울',
    '2026-05-24',
    '2026-05-24',
    3,
    JSON_OBJECT('tags', JSON_ARRAY('감성', '맛집', '도보 여행'), 'lunchTime', '12:00', 'dinnerTime', '18:30', 'placeCount', 4),
    'draft',
    FALSE,
    NULL,
    TRUE,
    TRUE,
    FALSE
  ),
  (
    3002,
    1001,
    '제주도 동쪽 투어',
    '제주',
    '2026-06-15',
    '2026-06-16',
    2,
    JSON_OBJECT('placeCount', 5),
    'draft',
    FALSE,
    '🏝️',
    FALSE,
    FALSE,
    TRUE
  ),
  (
    3003,
    1001,
    '도쿄 3박 4일 먹방',
    '도쿄',
    '2026-07-20',
    '2026-07-23',
    4,
    JSON_OBJECT('placeCount', 12),
    'draft',
    FALSE,
    '🍣',
    FALSE,
    FALSE,
    TRUE
  ),
  (
    3004,
    1001,
    '성수동 힙플레이스',
    '서울',
    '2026-05-01',
    '2026-05-01',
    1,
    JSON_OBJECT('placeCount', 4),
    'draft',
    FALSE,
    '☕',
    FALSE,
    FALSE,
    TRUE
  ),
  (
    3101,
    1002,
    '성수동 힙플레이스 완벽 정복',
    '서울',
    '2026-05-24',
    '2026-05-24',
    1,
    JSON_OBJECT('placeCount', 4),
    'published',
    TRUE,
    NULL,
    FALSE,
    FALSE,
    FALSE
  ),
  (
    3102,
    1003,
    '나만 알고 싶은 제주 동쪽 카페',
    '제주',
    '2026-06-20',
    '2026-06-21',
    2,
    JSON_OBJECT('placeCount', 6),
    'published',
    TRUE,
    NULL,
    FALSE,
    FALSE,
    FALSE
  ),
  (
    3103,
    1004,
    '강릉 1박 2일 뚜벅이 코스',
    '강릉',
    '2026-07-01',
    '2026-07-02',
    2,
    JSON_OBJECT('placeCount', 7),
    'published',
    TRUE,
    NULL,
    FALSE,
    FALSE,
    FALSE
  ),
  (
    3104,
    1005,
    '부산 전포동 맛집 탐방',
    '부산',
    '2026-07-12',
    '2026-07-13',
    2,
    JSON_OBJECT('placeCount', 5),
    'published',
    TRUE,
    NULL,
    FALSE,
    FALSE,
    FALSE
  )
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  title = VALUES(title),
  destination = VALUES(destination),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  days = VALUES(days),
  theme_json = VALUES(theme_json),
  status = VALUES(status),
  is_public = VALUES(is_public),
  cover_image_url = VALUES(cover_image_url),
  featured_home = VALUES(featured_home),
  featured_planner = VALUES(featured_planner),
  featured_saved = VALUES(featured_saved);

INSERT INTO trip_days (
  id,
  trip_id,
  day_number,
  date,
  title,
  notes
) VALUES
  (4001, 3001, 1, '2026-05-24', '성수동 당일 코스', '서울역부터 성수, 서울숲, 한강까지 이어지는 당일 동선')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  notes = VALUES(notes);

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
) VALUES
  (5001, 4001, 2001, 1, '10:00:00', '10:20:00', 'subway', 15, 2.30, 40, NULL, '교통 허브', 'transport', 20, 18.00, 52.00, FALSE),
  (5002, 4001, 2002, 2, '11:45:00', '12:55:00', 'walk', 20, 1.20, 85, NULL, '카페', 'cafe', 70, 56.00, 32.00, TRUE),
  (5003, 4001, 2003, 3, '14:00:00', '14:55:00', 'walk', 18, 1.00, 30, NULL, '액티비티', 'activity', 55, 50.00, 56.00, FALSE),
  (5004, 4001, 2004, 4, '17:30:00', '19:00:00', 'walk', 0, 0.00, 65, NULL, '뷰 포인트', 'view', 90, 63.00, 76.00, FALSE)
ON DUPLICATE KEY UPDATE
  arrival_time = VALUES(arrival_time),
  leave_time = VALUES(leave_time),
  transport_type = VALUES(transport_type),
  travel_minutes_from_prev = VALUES(travel_minutes_from_prev),
  distance_km_from_prev = VALUES(distance_km_from_prev),
  congestion_score = VALUES(congestion_score),
  category_label = VALUES(category_label),
  category_key = VALUES(category_key),
  stay_minutes = VALUES(stay_minutes),
  map_x = VALUES(map_x),
  map_y = VALUES(map_y),
  is_forked = VALUES(is_forked);

INSERT INTO trip_analyses (
  id,
  trip_id,
  total_distance_km,
  total_travel_minutes,
  optimization_score,
  fatigue_score,
  warning_json,
  analyzed_at
) VALUES
  (
    6001,
    3001,
    14.80,
    85,
    92,
    67,
    JSON_ARRAY(
      JSON_OBJECT(
        'iconKey', 'footprints',
        'title', '도보 이동량이 많은 편입니다',
        'description', '카페에서 서울숲으로 이어지는 구간이 길어 체력 소모가 큽니다. 편한 신발이나 중간 휴식을 고려해보세요.'
      ),
      JSON_OBJECT(
        'iconKey', 'clock',
        'title', '오후 일정에 여유 시간을 두세요',
        'description', '팝업 스토어와 카페 대기 시간이 길어질 수 있어 오후 일정은 20분 정도 여유를 두는 편이 안정적입니다.'
      )
    ),
    '2026-03-31 12:00:00'
  )
ON DUPLICATE KEY UPDATE
  total_distance_km = VALUES(total_distance_km),
  total_travel_minutes = VALUES(total_travel_minutes),
  optimization_score = VALUES(optimization_score),
  fatigue_score = VALUES(fatigue_score),
  warning_json = VALUES(warning_json),
  analyzed_at = VALUES(analyzed_at);

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
  published_at
) VALUES
  (7001, 3101, 1002, '성수동 힙플레이스 완벽 정복', '성수동 팝업과 카페를 하루에 정리하는 도심 루트', NULL, 'urban', 1200, 120, 12, 34, 'published', '2026-03-20 10:00:00'),
  (7002, 3102, 1003, '나만 알고 싶은 제주 동쪽 카페', '제주 동쪽 감성 카페 중심 루트', NULL, 'coast', 840, 95, 7, 18, 'published', '2026-03-18 09:00:00'),
  (7003, 3103, 1004, '강릉 1박 2일 뚜벅이 코스', '차 없이도 움직이기 좋은 강릉 루트', NULL, 'walking', 2500, 340, 34, 60, 'published', '2026-03-15 08:00:00'),
  (7004, 3104, 1005, '부산 전포동 맛집 탐방', '카페와 맛집을 엮은 부산 루트', NULL, 'cafe', 1100, 88, 5, 22, 'published', '2026-03-10 08:00:00')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  theme = VALUES(theme),
  view_count = VALUES(view_count),
  like_count = VALUES(like_count),
  comment_count = VALUES(comment_count),
  fork_count = VALUES(fork_count),
  status = VALUES(status),
  published_at = VALUES(published_at);

INSERT INTO route_tags (id, community_route_id, tag_name) VALUES
  (8001, 7001, '성수'),
  (8002, 7001, '데이트'),
  (8003, 7002, '제주'),
  (8004, 7002, '카페'),
  (8005, 7003, '강릉'),
  (8006, 7003, '뚜벅이'),
  (8007, 7004, '부산'),
  (8008, 7004, '맛집')
ON DUPLICATE KEY UPDATE
  tag_name = VALUES(tag_name);

INSERT INTO route_forks (
  id,
  community_route_id,
  user_id,
  forked_trip_id,
  fork_scope,
  created_at
) VALUES
  (9001, 7001, 1001, 3004, 'full', '2026-03-29 09:00:00'),
  (9002, 7002, 1001, 3002, 'partial', '2026-03-29 10:00:00'),
  (9003, 7003, 1001, 3003, 'full', '2026-03-29 11:00:00')
ON DUPLICATE KEY UPDATE
  fork_scope = VALUES(fork_scope),
  created_at = VALUES(created_at);

INSERT INTO video_extractions (
  id,
  user_id,
  youtube_url,
  status,
  video_title,
  requested_at,
  completed_at
) VALUES
  (
    10001,
    1001,
    'https://www.youtube.com/watch?v=travel-master-demo',
    'completed',
    '성수동 브이로그 하루 코스',
    '2026-03-30 13:00:00',
    '2026-03-30 13:05:00'
  )
ON DUPLICATE KEY UPDATE
  youtube_url = VALUES(youtube_url),
  status = VALUES(status),
  video_title = VALUES(video_title),
  requested_at = VALUES(requested_at),
  completed_at = VALUES(completed_at);

INSERT INTO video_extracted_places (
  id,
  video_extraction_id,
  place_id,
  raw_place_name,
  confidence_score,
  matched_lat,
  matched_lng,
  created_at
) VALUES
  (11001, 10001, 2005, '성수동 팝업스토어', 0.94, 37.5441120, 127.0549210, '2026-03-30 13:02:00'),
  (11002, 10001, 2006, '한강 라면 스팟', 0.89, 37.5349910, 127.0640180, '2026-03-30 13:03:00'),
  (11003, 10001, 2007, '연무장길 감성 카페', 0.91, 37.5438800, 127.0543370, '2026-03-30 13:04:00')
ON DUPLICATE KEY UPDATE
  raw_place_name = VALUES(raw_place_name),
  confidence_score = VALUES(confidence_score),
  matched_lat = VALUES(matched_lat),
  matched_lng = VALUES(matched_lng),
  created_at = VALUES(created_at);

INSERT INTO trend_snapshots (
  id,
  title,
  rank_no,
  tag_name,
  region,
  snapshot_date
) VALUES
  (12001, '제주 비자림로', 1, '자연', '제주', '2026-03-31'),
  (12002, '성수 연무장길', 2, '팝업', '서울', '2026-03-31'),
  (12003, '강릉 툇마루', 3, '카페', '강원', '2026-03-31'),
  (12004, '경주 황리단길', 4, '한옥', '경주', '2026-03-31')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  rank_no = VALUES(rank_no),
  tag_name = VALUES(tag_name),
  region = VALUES(region),
  snapshot_date = VALUES(snapshot_date);
