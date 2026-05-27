import { Router } from "express";
import { requireAdmin } from "../auth/auth.middleware.js";
import {
  deleteTripByAdmin,
  getAdminOverview,
  updateCommunityRouteStatus,
  updateUserStatus,
} from "./admin.repository.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/overview", async (_req, res, next) => {
  try {
    const overview = await getAdminOverview();
    res.status(200).json(overview);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/users/:userId/status", async (req, res, next) => {
  try {
    const updated = await updateUserStatus(req.params.userId, req.body?.status);

    if (!updated) {
      res.status(404).json({ message: "변경할 사용자를 찾을 수 없습니다." });
      return;
    }

    res.status(200).json({ message: "사용자 상태가 변경되었습니다." });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/community/routes/:routeId/status", async (req, res, next) => {
  try {
    const updated = await updateCommunityRouteStatus(req.params.routeId, req.body?.status);

    if (!updated) {
      res.status(404).json({ message: "변경할 커뮤니티 게시글을 찾을 수 없습니다." });
      return;
    }

    res.status(200).json({ message: "커뮤니티 게시글 상태가 변경되었습니다." });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/trips/:tripId", async (req, res, next) => {
  try {
    const deleted = await deleteTripByAdmin(req.params.tripId);

    if (!deleted) {
      res.status(404).json({ message: "삭제할 일정을 찾을 수 없습니다." });
      return;
    }

    res.status(200).json({ message: "일정이 삭제되었습니다." });
  } catch (error) {
    next(error);
  }
});
