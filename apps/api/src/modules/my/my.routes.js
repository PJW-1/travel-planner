import { Router } from "express";
import { getMySummary } from "../content/content.repository.js";

export const myRouter = Router();

myRouter.get("/summary", async (_req, res, next) => {
  try {
    const data = await getMySummary();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});
