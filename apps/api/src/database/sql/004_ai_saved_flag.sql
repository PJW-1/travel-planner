USE travel;

SET @has_is_saved_column = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'travel'
    AND TABLE_NAME = 'video_extracted_places'
    AND COLUMN_NAME = 'is_saved'
);

SET @migration_sql = IF(
  @has_is_saved_column = 0,
  'ALTER TABLE video_extracted_places ADD COLUMN is_saved BOOLEAN NOT NULL DEFAULT FALSE AFTER matched_lng',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
