USE travel;

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
