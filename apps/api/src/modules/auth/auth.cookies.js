import { env } from "../../config/env.js";

export function setSessionCookie(res, sessionId) {
  res.cookie(env.session.cookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
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
