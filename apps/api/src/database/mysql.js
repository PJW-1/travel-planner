import mysql from "mysql2/promise";
import { env } from "../config/env.js";

let pool;

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.mysql.host,
      port: env.mysql.port,
      user: env.mysql.user,
      password: env.mysql.password,
      database: env.mysql.database,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      charset: "utf8mb4",
    });
  }

  return pool;
}

export async function verifyDatabaseConnection() {
  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
