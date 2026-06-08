USE travel;

SET @admin_nickname = '관리자';

SET @admin_role_sql = IF(
  NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role'
  ),
  'ALTER TABLE users ADD COLUMN role ENUM(''user'', ''admin'') NOT NULL DEFAULT ''user'' AFTER status',
  'SELECT 1'
);

PREPARE admin_role_stmt FROM @admin_role_sql;
EXECUTE admin_role_stmt;
DEALLOCATE PREPARE admin_role_stmt;

INSERT INTO users (
  email,
  password_hash,
  nickname,
  provider,
  status,
  role,
  created_at,
  updated_at
)
VALUES (
  'admin@travel-master.local',
  '$2b$12$sPy./OrLbpnn/2QJp8bHH.aER7mWEefH9wpAwlyNnQoldHl1d3sRO',
  @admin_nickname,
  'local',
  'active',
  'admin',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  password_hash = VALUES(password_hash),
  status = 'active',
  role = 'admin',
  updated_at = NOW();
