import { getDbPool } from "../../database/mysql.js";

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    provider: row.provider,
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    passwordHash: row.password_hash,
  };
}

export async function findUserByEmail(email) {
  const db = getDbPool();
  const [rows] = await db.execute(
    `
      SELECT
        id,
        email,
        nickname,
        provider,
        status,
        last_login_at,
        created_at,
        updated_at,
        password_hash
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  return mapUser(rows[0]);
}

export async function createLocalUser({ email, nickname, passwordHash }) {
  const db = getDbPool();
  const [result] = await db.execute(
    `
      INSERT INTO users (email, nickname, password_hash, provider, status)
      VALUES (?, ?, ?, 'local', 'active')
    `,
    [email, nickname, passwordHash],
  );

  return {
    id: result.insertId,
    email,
    nickname,
    provider: "local",
    status: "active",
  };
}

export async function touchLastLoginAt(userId) {
  const db = getDbPool();
  await db.execute(
    `
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = ?
    `,
    [userId],
  );
}
