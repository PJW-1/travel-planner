import { Router } from "express";
import { getHomeContent } from "../content/content.repository.js";

export const homeRouter = Router();

homeRouter.get("/", async (_req, res, next) => {
  try {
    const data = await getHomeContent();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});
