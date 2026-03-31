USE travel_verify4;
SET NAMES utf8mb4;

SET @nickname_seed_owner = CONVERT(0xECA095EB8F99ED9B88 USING utf8mb4);

SET @region_seoul = CONVERT(0xEC849CEC9AB8 USING utf8mb4);
SET @region_jeju = CONVERT(0xECA09CECA3BC USING utf8mb4);
SET @region_tokyo = CONVERT(0xEB8F84ECBF84 USING utf8mb4);
SET @region_gangneung = CONVERT(0xEAB095EBA689 USING utf8mb4);
SET @region_busan = CONVERT(0xEBB680EC82B0 USING utf8mb4);
SET @region_gangwon = CONVERT(0xEAB095EC9B90 USING utf8mb4);
SET @region_gyeongju = CONVERT(0xEAB2BDECA3BC USING utf8mb4);

SET @place_seoul_station = CONVERT(0xEC849CEC9AB8EC97AD USING utf8mb4);
SET @place_seongsu_cafe = CONVERT(0xEC84B1EC889820EAB090EC84B120ECB9B4ED8E98 USING utf8mb4);
SET @place_seoul_forest = CONVERT(0xEC849CEC9AB8EC88B220EC82B0ECB185 USING utf8mb4);
SET @place_ttukseom_hangang = CONVERT(0xEB9A9DEC84AC20ED959CEAB095EAB3B5EC9B90 USING utf8mb4);
SET @place_popup_store = CONVERT(0xEC84B1EC8898EB8F9920ED8C9DEC9785EC8AA4ED86A0EC96B4 USING utf8mb4);
SET @place_ramyun_spot = CONVERT(0xED959CEAB09520EB9DBCEBA9B420EC8AA4ED8C9F USING utf8mb4);
SET @place_yeonmujang_cafe = CONVERT(0xEC97B0EBACB4EC9EA5EAB8B820EAB090EC84B120ECB9B4ED8E98 USING utf8mb4);

SET @category_transport = CONVERT(0xEAB590ED86B520ED9788EBB88C USING utf8mb4);
SET @category_cafe = CONVERT(0xECB9B4ED8E98 USING utf8mb4);
SET @category_activity = CONVERT(0xEC95A1ED8BB0EBB984ED8BB0 USING utf8mb4);
SET @category_view = CONVERT(0xEBB7B020ED8FACEC9DB8ED8AB8 USING utf8mb4);
SET @category_popup = CONVERT(0xED8C9DEC9785 USING utf8mb4);
SET @category_bunsik = CONVERT(0xEBB684EC8B9D USING utf8mb4);

SET @trip_featured = CONVERT(0xEC849CEC9AB820EC84B1EC8898EB8F9920EB8BB9EC9DBCECB998EAB8B020ED88ACEC96B4 USING utf8mb4);
SET @trip_jeju = CONVERT(0xECA09CECA3BCEB8F8420EB8F99ECAABD20ED88ACEC96B4 USING utf8mb4);
SET @trip_tokyo = CONVERT(0xEB8F84ECBF842033EBB0952034EC9DBC20EBA8B9EBB0A9 USING utf8mb4);
SET @trip_seongsu = CONVERT(0xEC84B1EC8898EB8F9920ED9E99ED948CEBA088EC9DB4EC8AA4 USING utf8mb4);
SET @trip_market_seongsu = CONVERT(0xEC84B1EC8898EB8F9920ED9E99ED948CEBA088EC9DB4EC8AA420EC9984EBB2BD20ECA095EBB3B5 USING utf8mb4);
SET @trip_market_jeju = CONVERT(0xEB8298EBA78C20EC958CEAB3A020EC8BB6EC9D8020ECA09CECA3BC20EB8F99ECAABD20ECB9B4ED8E98 USING utf8mb4);
SET @trip_market_gangneung = CONVERT(0xEAB095EBA6892031EBB0952032EC9DBC20EB9A9CEBB285EC9DB420ECBD94EC8AA4 USING utf8mb4);
SET @trip_market_busan = CONVERT(0xEBB680EC82B020ECA084ED8FACEB8F9920EBA79BECA79120ED8390EBB0A9 USING utf8mb4);

SET @tag_emotion = CONVERT(0xEAB090EC84B1 USING utf8mb4);
SET @tag_food = CONVERT(0xEBA79BECA791 USING utf8mb4);
SET @tag_walk = CONVERT(0xEB8F84EBB3B420EC97ACED9689 USING utf8mb4);
SET @tag_seongsu = CONVERT(0xEC84B1EC8898 USING utf8mb4);
SET @tag_date = CONVERT(0xEB8DB0EC9DB4ED8AB8 USING utf8mb4);
SET @tag_gangneung = CONVERT(0xEAB095EBA689 USING utf8mb4);
SET @tag_walker = CONVERT(0xEB9A9CEBB285EC9DB4 USING utf8mb4);
SET @tag_nature = CONVERT(0xEC9E90EC97B0 USING utf8mb4);
SET @tag_hanok = CONVERT(0xED959CEC98A5 USING utf8mb4);

SET @day_title = CONVERT(0xEC84B1EC8898EB8F9920EB8BB9EC9DBC20ECBD94EC8AA4 USING utf8mb4);
SET @day_notes = CONVERT(0xEC849CEC9AB8EC97ADEC9790EC849C20ECB69CEBB09CED95B420EC84B1EC88982C20EC849CEC9AB8EC88B22C20ED959CEAB095EAB98CECA78020EC9DB4EC96B4ECA780EB8A9420EB8BB9EC9DBC20EB8F99EC84A0 USING utf8mb4);

SET @warning_walk_title = CONVERT(0xEB8F84EBB3B420EC9DB4EB8F99EB9F89EC9DB420EBA78EEC8AB5EB8B88EB8BA4 USING utf8mb4);
SET @warning_walk_desc = CONVERT(0xECB9B4ED8E98EC9790EC849C20EC849CEC9AB8EC88B2EC9CBCEBA19C20EC9DB4EC96B4ECA780EB8A9420EAB5ACEAB084EC9DB420EAB8B8EC96B420ECB2B4EBA0A520EC868CEBAAA8EAB08020ED81BDEB8B88EB8BA42E20ED8EB8ED959C20EC8BA0EBB09CEC9DB4EB829820ECA491EAB08420ED9CB4EC8B9DEC9D8420EAB3A0EBA0A4ED95B4EBB3B4EC84B8EC9A942E USING utf8mb4);
SET @warning_time_title = CONVERT(0xEC98A4ED9B8420EC9DBCECA095EC979020EC97ACEC9CA020EC8B9CEAB084EC9DB420ED9584EC9A94ED95A9EB8B88EB8BA4 USING utf8mb4);
SET @warning_time_desc = CONVERT(0xED8C9DEC978520EC8AA4ED86A0EC96B4EC998020ECB9B4ED8E9820EB8C80EAB8B020EC8B9CEAB084EC9DB420EAB8B8EC96B4ECA78820EC889820EC9E88EC96B420EC98A4ED9B8420EC9DBCECA095EC9D80203230EBB68420ECA095EB8F8420EC97ACEC9CA0EBA5BC20EB9190EB8A9420ED8EB8EC9DB420EC9588ECA095ECA081EC9E85EB8B88EB8BA42E USING utf8mb4);

SET @community_desc_seongsu = CONVERT(0xEC84B1EC8898EB8F99EC9D9820ED8C9DEC9785EAB3BC20ECB9B4ED8E98EBA5BC20ED9598EBA3A8EC979020ECA095EBA6ACED9598EB8A9420EAB280ECA69DEB909C20EBA3A8ED8AB8 USING utf8mb4);
SET @community_desc_jeju = CONVERT(0xECA09CECA3BC20EB8F99ECAABD20EAB090EC84B120ECB9B4ED8E9820ECA491EC8BACEC9CBCEBA19C20EC97AEEC9D8020EBA3A8ED8AB8 USING utf8mb4);
SET @community_desc_gangneung = CONVERT(0xECB0A820EC9786EC9DB420EC9DB4EB8F99ED9598EAB8B020ECA28BEC9D8020EAB095EBA68920EBA3A8ED8AB8 USING utf8mb4);
SET @community_desc_busan = CONVERT(0xECB9B4ED8E98EC998020EBA79BECA791EBA78C20EAB3A8EB9DBC20EB8BB4EC9D8020EBB680EC82B020EBA3A8ED8AB8 USING utf8mb4);

SET @video_title = CONVERT(0xEC84B1EC8898EB8F9920EBB88CEC9DB4EBA19CEAB7B820ED9598EBA3A820ECBD94EC8AA4 USING utf8mb4);

SET @trend_jeju = CONVERT(0xECA09CECA3BC20EBB984EC9E90EBA6BCEBA19C USING utf8mb4);
SET @trend_seongsu = CONVERT(0xEC84B1EC889820EC97B0EBACB4EC9EA5EAB8B8 USING utf8mb4);
SET @trend_gangneung = CONVERT(0xEAB095EBA68920ED8887EBA788EBA3A8 USING utf8mb4);
SET @trend_gyeongju = CONVERT(0xEAB2BDECA3BC20ED99A9EBA6ACEB8BA8EAB8B8 USING utf8mb4);

SET @emoji_jeju = CONVERT(0xF09F8F9DEFB88F USING utf8mb4);
SET @emoji_tokyo = CONVERT(0xF09F8DA3 USING utf8mb4);
SET @emoji_coffee = CONVERT(0xE29895 USING utf8mb4);

INSERT INTO users (
  id,
  email,
  password_hash,
  nickname,
  provider,
  status,
  last_login_at
) VALUES
  (1001, 'seed-owner@travel-master.local', '$2b$12$ihB6dV7E4Kf1m5L6nqvPUut9y1QqJg8Q9Y2j7P5D8oXrP9sN2x4kS', @nickname_seed_owner, 'local', 'active', NOW()),
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
  (2001, @place_seoul_station, @category_transport, 'transport', 'Seoul Station, 405 Hangang-daero, Jung-gu', 37.5546480, 126.9706110, @region_seoul, 'seed', NULL),
  (2002, @place_seongsu_cafe, @category_cafe, 'cafe', 'Seongsu-dong, Seongdong-gu, Seoul', 37.5443050, 127.0553370, @region_seoul, 'seed', NULL),
  (2003, @place_seoul_forest, @category_activity, 'activity', '273 Ttukseom-ro, Seongdong-gu, Seoul', 37.5443880, 127.0374420, @region_seoul, 'seed', NULL),
  (2004, @place_ttukseom_hangang, @category_view, 'view', 'Jayang-dong, Gwangjin-gu, Seoul', 37.5310270, 127.0671500, @region_seoul, 'seed', NULL),
  (2005, @place_popup_store, @category_popup, 'activity', 'Yeonmujang-gil, Seongdong-gu, Seoul', 37.5441120, 127.0549210, @region_seoul, 'video', NULL),
  (2006, @place_ramyun_spot, @category_bunsik, 'view', 'Seongsu-dong riverside, Seoul', 37.5349910, 127.0640180, @region_seoul, 'video', NULL),
  (2007, @place_yeonmujang_cafe, @category_cafe, 'cafe', 'Yeonmujang-gil, Seongdong-gu, Seoul', 37.5438800, 127.0543370, @region_seoul, 'video', NULL)
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
    @trip_featured,
    @region_seoul,
    '2026-05-24',
    '2026-05-24',
    3,
    JSON_OBJECT('tags', JSON_ARRAY(@tag_emotion, @tag_food, @tag_walk), 'lunchTime', '12:00', 'dinnerTime', '18:30', 'placeCount', 4),
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
    @trip_jeju,
    @region_jeju,
    '2026-06-15',
    '2026-06-16',
    2,
    JSON_OBJECT('placeCount', 5),
    'draft',
    FALSE,
    @emoji_jeju,
    FALSE,
    FALSE,
    TRUE
  ),
  (
    3003,
    1001,
    @trip_tokyo,
    @region_tokyo,
    '2026-07-20',
    '2026-07-23',
    4,
    JSON_OBJECT('placeCount', 12),
    'draft',
    FALSE,
    @emoji_tokyo,
    FALSE,
    FALSE,
    TRUE
  ),
  (
    3004,
    1001,
    @trip_seongsu,
    @region_seoul,
    '2026-05-01',
    '2026-05-01',
    1,
    JSON_OBJECT('placeCount', 4),
    'draft',
    FALSE,
    @emoji_coffee,
    FALSE,
    FALSE,
    TRUE
  ),
  (
    3101,
    1002,
    @trip_market_seongsu,
    @region_seoul,
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
    @trip_market_jeju,
    @region_jeju,
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
    @trip_market_gangneung,
    @region_gangneung,
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
    @trip_market_busan,
    @region_busan,
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
  (4001, 3001, 1, '2026-05-24', @day_title, @day_notes)
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
  (5001, 4001, 2001, 1, '10:00:00', '10:20:00', 'subway', 15, 2.30, 40, NULL, @category_transport, 'transport', 20, 18.00, 52.00, FALSE),
  (5002, 4001, 2002, 2, '11:45:00', '12:55:00', 'walk', 20, 1.20, 85, NULL, @category_cafe, 'cafe', 70, 56.00, 32.00, TRUE),
  (5003, 4001, 2003, 3, '14:00:00', '14:55:00', 'walk', 18, 1.00, 30, NULL, @category_activity, 'activity', 55, 50.00, 56.00, FALSE),
  (5004, 4001, 2004, 4, '17:30:00', '19:00:00', 'walk', 0, 0.00, 65, NULL, @category_view, 'view', 90, 63.00, 76.00, FALSE)
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
        'title', @warning_walk_title,
        'description', @warning_walk_desc
      ),
      JSON_OBJECT(
        'iconKey', 'clock',
        'title', @warning_time_title,
        'description', @warning_time_desc
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
  (7001, 3101, 1002, @trip_market_seongsu, @community_desc_seongsu, NULL, 'urban', 1200, 120, 12, 34, 'published', '2026-03-20 10:00:00'),
  (7002, 3102, 1003, @trip_market_jeju, @community_desc_jeju, NULL, 'coast', 840, 95, 7, 18, 'published', '2026-03-18 09:00:00'),
  (7003, 3103, 1004, @trip_market_gangneung, @community_desc_gangneung, NULL, 'walking', 2500, 340, 34, 60, 'published', '2026-03-15 08:00:00'),
  (7004, 3104, 1005, @trip_market_busan, @community_desc_busan, NULL, 'cafe', 1100, 88, 5, 22, 'published', '2026-03-10 08:00:00')
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
  (8001, 7001, @tag_seongsu),
  (8002, 7001, @tag_date),
  (8003, 7002, @region_jeju),
  (8004, 7002, @category_cafe),
  (8005, 7003, @tag_gangneung),
  (8006, 7003, @tag_walker),
  (8007, 7004, @region_busan),
  (8008, 7004, @tag_food)
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
    @video_title,
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
  (11001, 10001, 2005, @place_popup_store, 0.94, 37.5441120, 127.0549210, '2026-03-30 13:02:00'),
  (11002, 10001, 2006, @place_ramyun_spot, 0.89, 37.5349910, 127.0640180, '2026-03-30 13:03:00'),
  (11003, 10001, 2007, @place_yeonmujang_cafe, 0.91, 37.5438800, 127.0543370, '2026-03-30 13:04:00')
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
  (12001, @trend_jeju, 1, @tag_nature, @region_jeju, '2026-03-31'),
  (12002, @trend_seongsu, 2, @category_popup, @region_seoul, '2026-03-31'),
  (12003, @trend_gangneung, 3, @category_cafe, @region_gangwon, '2026-03-31'),
  (12004, @trend_gyeongju, 4, @tag_hanok, @region_gyeongju, '2026-03-31')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  rank_no = VALUES(rank_no),
  tag_name = VALUES(tag_name),
  region = VALUES(region),
  snapshot_date = VALUES(snapshot_date);

