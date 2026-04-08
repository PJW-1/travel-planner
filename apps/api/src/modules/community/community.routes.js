import { Router } from "express";
import { env } from "../../config/env.js";
import { getUserSession } from "../auth/session.store.js";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  getCommunityRouteDetail,
  importCommunityRoute,
  listCommunityRoutes,
  saveCommunityPlace,
  toggleCommunityRouteLike,
} from "./community.repository.js";

export const communityRouter = Router();

communityRouter.get("/routes", async (_req, res, next) => {
  try {
    const sessionId = _req.cookies?.[env.session.cookieName];
    const session = await getUserSession(sessionId);
    const routes = await listCommunityRoutes(session?.userId ?? null);
    res.status(200).json({ routes });
  } catch (error) {
    next(error);
  }
});

communityRouter.get("/routes/:routeId", async (req, res, next) => {
  try {
    const sessionId = req.cookies?.[env.session.cookieName];
    const session = await getUserSession(sessionId);
    const route = await getCommunityRouteDetail(req.params.routeId, session?.userId ?? null);

    if (!route) {
      res.status(404).json({
        message: "커뮤니티 루트를 찾을 수 없습니다.",
      });
      return;
    }

    res.status(200).json({ route });
  } catch (error) {
    next(error);
  }
});

communityRouter.post("/routes/:routeId/import", requireAuth, async (req, res, next) => {
  try {
    const imported = await importCommunityRoute(req.auth.userId, req.params.routeId);

    if (!imported) {
      res.status(404).json({
        message: "가져올 커뮤니티 루트를 찾을 수 없습니다.",
      });
      return;
    }

    res.status(201).json({
      message: "루트를 내 일정으로 가져왔습니다.",
      imported,
    });
  } catch (error) {
    next(error);
  }
});

communityRouter.post("/routes/:routeId/like", requireAuth, async (req, res, next) => {
  try {
    const result = await toggleCommunityRouteLike(req.auth.userId, req.params.routeId);

    res.status(200).json({
      message: result.liked ? "좋아요에 추가했습니다." : "좋아요를 취소했습니다.",
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (error) {
    next(error);
  }
});

communityRouter.post("/places/:placeId/save", requireAuth, async (req, res, next) => {
  try {
    await saveCommunityPlace(req.auth.userId, req.params.placeId);

    res.status(201).json({
      message: "장소를 저장 목록에 담았습니다.",
    });
  } catch (error) {
    next(error);
  }
});
