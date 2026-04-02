import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { getMySummary } from "../content/content.repository.js";

export const myRouter = Router();

myRouter.use(requireAuth);

myRouter.get("/summary", async (req, res, next) => {
  try {
    const data = await getMySummary(req.auth.userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});
