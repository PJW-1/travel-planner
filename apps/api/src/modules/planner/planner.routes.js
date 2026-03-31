import { Router } from "express";
import { getPlannerOverview } from "../content/content.repository.js";

export const plannerRouter = Router();

plannerRouter.get("/overview", async (_req, res, next) => {
  try {
    const data = await getPlannerOverview();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});
