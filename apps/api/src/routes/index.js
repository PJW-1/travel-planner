import { Router } from "express";
import { plannerRouter } from "../modules/planner/planner.routes.js";
import { tripsRouter } from "../modules/trips/trips.routes.js";

export const apiRouter = Router();

apiRouter.use("/planner", plannerRouter);
apiRouter.use("/trips", tripsRouter);

