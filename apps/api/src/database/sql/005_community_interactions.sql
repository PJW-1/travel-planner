USE travel;

CREATE TABLE IF NOT EXISTS community_route_likes (
  id BIGINT UNSIGNED NOT NULL,
  community_route_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_community_route_likes_route_user (community_route_id, user_id),
  KEY idx_community_route_likes_user_id (user_id),
  CONSTRAINT fk_community_route_likes_route_id
    FOREIGN KEY (community_route_id) REFERENCES community_routes (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_community_route_likes_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);
