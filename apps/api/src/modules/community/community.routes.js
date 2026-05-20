import { Router } from "express";
import { env } from "../../config/env.js";
import { getUserSession } from "../auth/session.store.js";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  createCommunityRouteComment,
  deleteCommunityRouteComment,
  getCommunityRouteDetail,
  importCommunityRoute,
  listCommunityRoutes,
  publishCommunityRoute,
  saveCommunityPlace,
  toggleCommunityRouteBookmark,
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

communityRouter.post("/routes", requireAuth, async (req, res, next) => {
  try {
    const published = await publishCommunityRoute(req.auth.userId, req.body ?? {});

    if (!published) {
      res.status(404).json({
        message: "공유할 내 일정을 찾을 수 없습니다.",
      });
      return;
    }

    res.status(201).json({
      message: published.updated
        ? "커뮤니티 게시글을 업데이트했습니다."
        : "커뮤니티에 내 루트를 공유했습니다.",
      route: published,
    });
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

communityRouter.post("/routes/:routeId/bookmark", requireAuth, async (req, res, next) => {
  try {
    const result = await toggleCommunityRouteBookmark(req.auth.userId, req.params.routeId);

    if (!result) {
      res.status(404).json({
        message: "저장할 커뮤니티 루트를 찾을 수 없습니다.",
      });
      return;
    }

    res.status(200).json({
      message: result.bookmarked
        ? "루트를 보관함에 저장했습니다."
        : "루트 보관을 해제했습니다.",
      bookmarked: result.bookmarked,
    });
  } catch (error) {
    next(error);
  }
});

communityRouter.post("/routes/:routeId/comments", requireAuth, async (req, res, next) => {
  try {
    const result = await createCommunityRouteComment(
      req.auth.userId,
      req.params.routeId,
      req.body?.content,
    );

    if (!result) {
      res.status(404).json({
        message: "댓글을 남길 커뮤니티 루트를 찾을 수 없습니다.",
      });
      return;
    }

    res.status(201).json({
      message: "댓글을 등록했습니다.",
      comment: result.comment,
      commentCount: result.commentCount,
    });
  } catch (error) {
    next(error);
  }
});

communityRouter.delete(
  "/routes/:routeId/comments/:commentId",
  requireAuth,
  async (req, res, next) => {
    try {
      const result = await deleteCommunityRouteComment(
        req.auth.userId,
        req.params.routeId,
        req.params.commentId,
      );

      if (!result) {
        res.status(404).json({
          message: "삭제할 댓글을 찾을 수 없습니다.",
        });
        return;
      }

      res.status(200).json({
        message: "댓글을 삭제했습니다.",
        commentId: result.commentId,
        commentCount: result.commentCount,
      });
    } catch (error) {
      next(error);
    }
  },
);

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
