USE travel;

CREATE TABLE IF NOT EXISTS community_route_comments (
  id BIGINT UNSIGNED NOT NULL,
  community_route_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_community_route_comments_route_id (community_route_id),
  KEY idx_community_route_comments_user_id (user_id),
  CONSTRAINT fk_community_route_comments_route_id
    FOREIGN KEY (community_route_id) REFERENCES community_routes (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_community_route_comments_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);
