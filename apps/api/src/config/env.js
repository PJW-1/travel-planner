import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://127.0.0.1:5173",
  mysql: {
    host: requireEnv("MYSQL_HOST"),
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: requireEnv("MYSQL_USER"),
    password: requireEnv("MYSQL_PASSWORD"),
    database: requireEnv("MYSQL_DATABASE"),
  },
  session: {
    store: process.env.SESSION_STORE ?? "memory",
    cookieName: process.env.SESSION_COOKIE_NAME ?? "tm_session",
    ttlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 7),
    defaultTtlSeconds: Number(
      process.env.SESSION_DEFAULT_TTL_SECONDS ??
        process.env.SESSION_TTL_SECONDS ??
        60 * 60 * 24 * 7,
    ),
    rememberTtlSeconds: Number(process.env.SESSION_REMEMBER_TTL_SECONDS ?? 60 * 60 * 24 * 30),
  },
  redis: {
    url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  },
  googleMaps: {
    serverApiKey: process.env.GOOGLE_MAPS_SERVER_API_KEY ?? "",
  },
  kakao: {
    restApiKey: process.env.KAKAO_REST_API_KEY ?? "",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  },
};
