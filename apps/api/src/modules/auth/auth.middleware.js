import { env } from "../../config/env.js";
import { getUserSession } from "./session.store.js";

export async function requireAuth(req, _res, next) {
  try {
    const sessionId = req.cookies?.[env.session.cookieName];
    const session = await getUserSession(sessionId);

    if (!session) {
      const error = new Error("로그인이 필요합니다.");
      error.status = 401;
      throw error;
    }

    req.auth = session;
    next();
  } catch (error) {
    next(error);
  }
}
