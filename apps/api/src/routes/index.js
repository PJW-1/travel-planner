import { Router } from "express";
import { aiLabRouter } from "../modules/ai-lab/aiLab.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { communityRouter } from "../modules/community/community.routes.js";
import { homeRouter } from "../modules/home/home.routes.js";
import { myRouter } from "../modules/my/my.routes.js";
import { plannerRouter } from "../modules/planner/planner.routes.js";
import { placesRouter } from "../modules/places/places.routes.js";
import { tripsRouter } from "../modules/trips/trips.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/home", homeRouter);
apiRouter.use("/community", communityRouter);
apiRouter.use("/ai-lab", aiLabRouter);
apiRouter.use("/my", myRouter);
apiRouter.use("/planner", plannerRouter);
apiRouter.use("/places", placesRouter);
apiRouter.use("/trips", tripsRouter);
