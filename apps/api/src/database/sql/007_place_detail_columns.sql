USE travel;

ALTER TABLE places
  ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'internal' AFTER region,
  ADD COLUMN provider_place_id VARCHAR(160) NULL AFTER provider,
  ADD COLUMN phone VARCHAR(60) NULL AFTER provider_place_id,
  ADD COLUMN website_url VARCHAR(255) NULL AFTER phone,
  ADD COLUMN provider_url VARCHAR(255) NULL AFTER website_url,
  ADD COLUMN opening_hours_json JSON NULL AFTER provider_url,
  ADD COLUMN raw_payload_json JSON NULL AFTER opening_hours_json,
  ADD COLUMN last_synced_at DATETIME NULL AFTER raw_payload_json;
