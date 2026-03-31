import { Router } from "express";

export const tripsRouter = Router();

tripsRouter.get("/", (_req, res) => {
  res.json({
    items: [],
    message: "Trip list placeholder. Connect MySQL repository here."
  });
});
