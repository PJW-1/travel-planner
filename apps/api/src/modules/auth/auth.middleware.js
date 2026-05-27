import { env } from "../../config/env.js";
import { findUserById } from "./auth.repository.js";
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

    const user = await findUserById(session.userId);

    if (!user || user.status !== "active") {
      const error = new Error("다시 로그인해 주세요.");
      error.status = 401;
      throw error;
    }

    req.auth = session;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAdmin(req, _res, next) {
  try {
    const sessionId = req.cookies?.[env.session.cookieName];
    const session = await getUserSession(sessionId);

    if (!session) {
      const error = new Error("로그인이 필요합니다.");
      error.status = 401;
      throw error;
    }

    const user = await findUserById(session.userId);

    if (!user || user.status !== "active") {
      const error = new Error("다시 로그인해 주세요.");
      error.status = 401;
      throw error;
    }

    if (user.role !== "admin") {
      const error = new Error("관리자 권한이 필요합니다.");
      error.status = 403;
      throw error;
    }

    req.auth = {
      ...session,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}
