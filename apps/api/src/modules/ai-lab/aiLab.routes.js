import { Router } from "express";
import { getAiLabOverview } from "../content/content.repository.js";

export const aiLabRouter = Router();

aiLabRouter.get("/overview", async (_req, res, next) => {
  try {
    const data = await getAiLabOverview();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});
