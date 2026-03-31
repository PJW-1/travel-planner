CREATE DATABASE IF NOT EXISTS travel_verify
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE travel_verify;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  provider ENUM('local', 'google', 'kakao') NOT NULL DEFAULT 'local',
  status ENUM('active', 'blocked', 'deleted') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

USE travel_verify;

CREATE TABLE IF NOT EXISTS places (
  id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  category_key VARCHAR(30) NOT NULL,
  address VARCHAR(255) NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  region VARCHAR(100) NOT NULL,
  source_type VARCHAR(40) NOT NULL DEFAULT 'seed',
  thumbnail_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS trips (
  id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  title VARCHAR(120) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT NOT NULL,
  theme_json JSON NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  cover_image_url VARCHAR(255) NULL,
  featured_home BOOLEAN NOT NULL DEFAULT FALSE,
  featured_planner BOOLEAN NOT NULL DEFAULT FALSE,
  featured_saved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trips_user_id (user_id),
  KEY idx_trips_featured_home (featured_home),
  KEY idx_trips_featured_planner (featured_planner),
  KEY idx_trips_featured_saved (featured_saved),
  CONSTRAINT fk_trips_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS trip_days (
  id BIGINT UNSIGNED NOT NULL,
  trip_id BIGINT UNSIGNED NOT NULL,
  day_number INT NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(120) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trip_days_trip_id (trip_id),
  CONSTRAINT fk_trip_days_trip_id
    FOREIGN KEY (trip_id) REFERENCES trips (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trip_stops (
  id BIGINT UNSIGNED NOT NULL,
  trip_day_id BIGINT UNSIGNED NOT NULL,
  place_id BIGINT UNSIGNED NOT NULL,
  stop_order INT NOT NULL,
  arrival_time TIME NOT NULL,
  leave_time TIME NOT NULL,
  transport_type VARCHAR(40) NOT NULL,
  travel_minutes_from_prev INT NOT NULL DEFAULT 0,
  distance_km_from_prev DECIMAL(6, 2) NOT NULL DEFAULT 0,
  congestion_score INT NOT NULL DEFAULT 0,
  memo TEXT NULL,
  category_label VARCHAR(60) NOT NULL,
  category_key VARCHAR(30) NOT NULL,
  stay_minutes INT NOT NULL DEFAULT 0,
  map_x DECIMAL(5, 2) NOT NULL DEFAULT 0,
  map_y DECIMAL(5, 2) NOT NULL DEFAULT 0,
  is_forked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trip_stops_trip_day_id (trip_day_id),
  KEY idx_trip_stops_place_id (place_id),
  CONSTRAINT fk_trip_stops_trip_day_id
    FOREIGN KEY (trip_day_id) REFERENCES trip_days (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_trip_stops_place_id
    FOREIGN KEY (place_id) REFERENCES places (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trip_analyses (
  id BIGINT UNSIGNED NOT NULL,
  trip_id BIGINT UNSIGNED NOT NULL,
  total_distance_km DECIMAL(6, 2) NOT NULL DEFAULT 0,
  total_travel_minutes INT NOT NULL DEFAULT 0,
  optimization_score INT NOT NULL DEFAULT 0,
  fatigue_score INT NOT NULL DEFAULT 0,
  warning_json JSON NULL,
  analyzed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trip_analyses_trip_id (trip_id),
  CONSTRAINT fk_trip_analyses_trip_id
    FOREIGN KEY (trip_id) REFERENCES trips (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  place_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_favorites_user_id (user_id),
  KEY idx_favorites_place_id (place_id),
  CONSTRAINT fk_favorites_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_favorites_place_id
    FOREIGN KEY (place_id) REFERENCES places (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_routes (
  id BIGINT UNSIGNED NOT NULL,
  trip_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NULL,
  thumbnail_url VARCHAR(255) NULL,
  theme VARCHAR(30) NOT NULL,
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  fork_count INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'published',
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_community_routes_trip_id (trip_id),
  KEY idx_community_routes_author_user_id (author_user_id),
  CONSTRAINT fk_community_routes_trip_id
    FOREIGN KEY (trip_id) REFERENCES trips (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_community_routes_author_user_id
    FOREIGN KEY (author_user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS route_tags (
  id BIGINT UNSIGNED NOT NULL,
  community_route_id BIGINT UNSIGNED NOT NULL,
  tag_name VARCHAR(60) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_route_tags_community_route_id (community_route_id),
  CONSTRAINT fk_route_tags_community_route_id
    FOREIGN KEY (community_route_id) REFERENCES community_routes (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS route_forks (
  id BIGINT UNSIGNED NOT NULL,
  community_route_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  forked_trip_id BIGINT UNSIGNED NOT NULL,
  fork_scope VARCHAR(40) NOT NULL DEFAULT 'full',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_route_forks_community_route_id (community_route_id),
  KEY idx_route_forks_user_id (user_id),
  KEY idx_route_forks_forked_trip_id (forked_trip_id),
  CONSTRAINT fk_route_forks_community_route_id
    FOREIGN KEY (community_route_id) REFERENCES community_routes (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_route_forks_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_route_forks_forked_trip_id
    FOREIGN KEY (forked_trip_id) REFERENCES trips (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS video_extractions (
  id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  youtube_url VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL,
  video_title VARCHAR(255) NOT NULL,
  requested_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_video_extractions_user_id (user_id),
  CONSTRAINT fk_video_extractions_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS video_extracted_places (
  id BIGINT UNSIGNED NOT NULL,
  video_extraction_id BIGINT UNSIGNED NOT NULL,
  place_id BIGINT UNSIGNED NOT NULL,
  raw_place_name VARCHAR(120) NOT NULL,
  confidence_score DECIMAL(4, 2) NOT NULL DEFAULT 0,
  matched_lat DECIMAL(10, 7) NOT NULL,
  matched_lng DECIMAL(10, 7) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_video_extracted_places_video_extraction_id (video_extraction_id),
  KEY idx_video_extracted_places_place_id (place_id),
  CONSTRAINT fk_video_extracted_places_video_extraction_id
    FOREIGN KEY (video_extraction_id) REFERENCES video_extractions (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_video_extracted_places_place_id
    FOREIGN KEY (place_id) REFERENCES places (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trend_snapshots (
  id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  rank_no INT NOT NULL,
  tag_name VARCHAR(60) NOT NULL,
  region VARCHAR(80) NOT NULL,
  snapshot_date DATE NOT NULL,
  PRIMARY KEY (id)
);

USE travel_verify;
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
  (1001, 'seed-owner@travel-master.local', '$2b$12$ihB6dV7E4Kf1m5L6nqvPUut9y1QqJg8Q9Y2j7P5D8oXrP9sN2x4kS', '?뺣룞??, 'local', 'active', NOW()),
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
  (2001, '?쒖슱??, '援먰넻 ?덈툕', 'transport', '?쒖슱 以묎뎄 ?쒓컯?濡?405', 37.5546480, 126.9706110, '?쒖슱', 'seed', NULL),
  (2002, '?깆닔 ?쒓렇?덉쿂 移댄럹', '移댄럹', 'cafe', '?쒖슱 ?깅룞援??깆닔??, 37.5443050, 127.0553370, '?쒖슱', 'seed', NULL),
  (2003, '?쒖슱??, '?≫떚鍮꾪떚', 'activity', '?쒖슱 ?깅룞援??앹꽟濡?273', 37.5443880, 127.0374420, '?쒖슱', 'seed', NULL),
  (2004, '?앹꽟 ?쒓컯怨듭썝', '酉??ъ씤??, 'view', '?쒖슱 愿묒쭊援??먯뼇??, 37.5310270, 127.0671500, '?쒖슱', 'seed', NULL),
  (2005, '?깆닔???앹뾽?ㅽ넗??, '?앹뾽', 'activity', '?쒖슱 ?깅룞援??곕Т?κ만', 37.5441120, 127.0549210, '?쒖슱', 'video', NULL),
  (2006, '?쒓컯 ?쇰㈃ ?ㅽ뙚', '?쇱떇', 'view', '?쒖슱 ?깅룞援??깆닔??媛', 37.5349910, 127.0640180, '?쒖슱', 'video', NULL),
  (2007, '?곕Т?κ만 媛먯꽦 移댄럹', '移댄럹', 'cafe', '?쒖슱 ?깅룞援??곕Т?κ만', 37.5438800, 127.0543370, '?쒖슱', 'video', NULL)
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
    '?쒖슱 ?깆닔???뱀씪移섍린 ?ъ뼱',
    '?쒖슱',
    '2026-05-24',
    '2026-05-24',
    3,
    JSON_OBJECT('tags', JSON_ARRAY('媛먯꽦', '留쏆쭛', '?꾨낫 ?ы뻾'), 'lunchTime', '12:00', 'dinnerTime', '18:30', 'placeCount', 4),
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
    '?쒖＜???숈そ ?ъ뼱',
    '?쒖＜',
    '2026-06-15',
    '2026-06-16',
    2,
    JSON_OBJECT('placeCount', 5),
    'draft',
    FALSE,
    '?룤截?,
    FALSE,
    FALSE,
    TRUE
  ),
  (
    3003,
    1001,
    '?꾩퓙 3諛?4??癒밸갑',
    '?꾩퓙',
    '2026-07-20',
    '2026-07-23',
    4,
    JSON_OBJECT('placeCount', 12),
    'draft',
    FALSE,
    '?뜠',
    FALSE,
    FALSE,
    TRUE
  ),
  (
    3004,
    1001,
    '?깆닔???숉뵆?덉씠??,
    '?쒖슱',
    '2026-05-01',
    '2026-05-01',
    1,
    JSON_OBJECT('placeCount', 4),
    'draft',
    FALSE,
    '??,
    FALSE,
    FALSE,
    TRUE
  ),
  (
    3101,
    1002,
    '?깆닔???숉뵆?덉씠???꾨꼍 ?뺣났',
    '?쒖슱',
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
    '?섎쭔 ?뚭퀬 ?띠? ?쒖＜ ?숈そ 移댄럹',
    '?쒖＜',
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
    '媛뺣쫱 1諛?2???쒕쾮??肄붿뒪',
    '媛뺣쫱',
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
    '遺???꾪룷??留쏆쭛 ?먮갑',
    '遺??,
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
  (4001, 3001, 1, '2026-05-24', '?깆닔???뱀씪 肄붿뒪', '?쒖슱??????깆닔, ?쒖슱?? ?쒓컯源뚯? ?댁뼱吏???뱀씪 ?숈꽑')
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
  (5001, 4001, 2001, 1, '10:00:00', '10:20:00', 'subway', 15, 2.30, 40, NULL, '援먰넻 ?덈툕', 'transport', 20, 18.00, 52.00, FALSE),
  (5002, 4001, 2002, 2, '11:45:00', '12:55:00', 'walk', 20, 1.20, 85, NULL, '移댄럹', 'cafe', 70, 56.00, 32.00, TRUE),
  (5003, 4001, 2003, 3, '14:00:00', '14:55:00', 'walk', 18, 1.00, 30, NULL, '?≫떚鍮꾪떚', 'activity', 55, 50.00, 56.00, FALSE),
  (5004, 4001, 2004, 4, '17:30:00', '19:00:00', 'walk', 0, 0.00, 65, NULL, '酉??ъ씤??, 'view', 90, 63.00, 76.00, FALSE)
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
        'title', '?꾨낫 ?대룞?됱씠 留롮? ?몄엯?덈떎',
        'description', '移댄럹?먯꽌 ?쒖슱?뀁쑝濡??댁뼱吏??援ш컙??湲몄뼱 泥대젰 ?뚮え媛 ?쎈땲?? ?명븳 ?좊컻?대굹 以묎컙 ?댁떇??怨좊젮?대낫?몄슂.'
      ),
      JSON_OBJECT(
        'iconKey', 'clock',
        'title', '?ㅽ썑 ?쇱젙???ъ쑀 ?쒓컙???먯꽭??,
        'description', '?앹뾽 ?ㅽ넗?댁? 移댄럹 ?湲??쒓컙??湲몄뼱吏????덉뼱 ?ㅽ썑 ?쇱젙? 20遺??뺣룄 ?ъ쑀瑜??먮뒗 ?몄씠 ?덉젙?곸엯?덈떎.'
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
  (7001, 3101, 1002, '?깆닔???숉뵆?덉씠???꾨꼍 ?뺣났', '?깆닔???앹뾽怨?移댄럹瑜??섎（???뺣━?섎뒗 ?꾩떖 猷⑦듃', NULL, 'urban', 1200, 120, 12, 34, 'published', '2026-03-20 10:00:00'),
  (7002, 3102, 1003, '?섎쭔 ?뚭퀬 ?띠? ?쒖＜ ?숈そ 移댄럹', '?쒖＜ ?숈そ 媛먯꽦 移댄럹 以묒떖 猷⑦듃', NULL, 'coast', 840, 95, 7, 18, 'published', '2026-03-18 09:00:00'),
  (7003, 3103, 1004, '媛뺣쫱 1諛?2???쒕쾮??肄붿뒪', '李??놁씠???吏곸씠湲?醫뗭? 媛뺣쫱 猷⑦듃', NULL, 'walking', 2500, 340, 34, 60, 'published', '2026-03-15 08:00:00'),
  (7004, 3104, 1005, '遺???꾪룷??留쏆쭛 ?먮갑', '移댄럹? 留쏆쭛????? 遺??猷⑦듃', NULL, 'cafe', 1100, 88, 5, 22, 'published', '2026-03-10 08:00:00')
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
  (8001, 7001, '?깆닔'),
  (8002, 7001, '?곗씠??),
  (8003, 7002, '?쒖＜'),
  (8004, 7002, '移댄럹'),
  (8005, 7003, '媛뺣쫱'),
  (8006, 7003, '?쒕쾮??),
  (8007, 7004, '遺??),
  (8008, 7004, '留쏆쭛')
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
    '?깆닔??釉뚯씠濡쒓렇 ?섎（ 肄붿뒪',
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
  (11001, 10001, 2005, '?깆닔???앹뾽?ㅽ넗??, 0.94, 37.5441120, 127.0549210, '2026-03-30 13:02:00'),
  (11002, 10001, 2006, '?쒓컯 ?쇰㈃ ?ㅽ뙚', 0.89, 37.5349910, 127.0640180, '2026-03-30 13:03:00'),
  (11003, 10001, 2007, '?곕Т?κ만 媛먯꽦 移댄럹', 0.91, 37.5438800, 127.0543370, '2026-03-30 13:04:00')
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
  (12001, '?쒖＜ 鍮꾩옄由쇰줈', 1, '?먯뿰', '?쒖＜', '2026-03-31'),
  (12002, '?깆닔 ?곕Т?κ만', 2, '?앹뾽', '?쒖슱', '2026-03-31'),
  (12003, '媛뺣쫱 ?뉖쭏猷?, 3, '移댄럹', '媛뺤썝', '2026-03-31'),
  (12004, '寃쎌＜ ?⑸━?④만', 4, '?쒖삦', '寃쎌＜', '2026-03-31')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  rank_no = VALUES(rank_no),
  tag_name = VALUES(tag_name),
  region = VALUES(region),
  snapshot_date = VALUES(snapshot_date);

