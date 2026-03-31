import { Router } from "express";
import { getCommunityRoutes } from "../content/content.repository.js";

export const communityRouter = Router();

communityRouter.get("/routes", async (_req, res, next) => {
  try {
    const routes = await getCommunityRoutes();
    res.status(200).json({ routes });
  } catch (error) {
    next(error);
  }
});
