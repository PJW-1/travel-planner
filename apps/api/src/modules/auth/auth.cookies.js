import { env } from "../../config/env.js";

export function setSessionCookie(res, sessionId, ttlSeconds) {
  res.cookie(env.session.cookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: (ttlSeconds ?? env.session.defaultTtlSeconds) * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(env.session.cookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
}
