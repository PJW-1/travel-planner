import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { getAiLabOverview, saveAiExtractedPlace } from "./aiLab.repository.js";
import { analyzeYoutubeVideo } from "./aiLab.service.js";

export const aiLabRouter = Router();

aiLabRouter.use(requireAuth);

aiLabRouter.get("/overview", async (req, res, next) => {
  try {
    const data = await getAiLabOverview(req.auth.userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

aiLabRouter.post("/extract", async (req, res, next) => {
  try {
    const { youtubeUrl, travelRegion } = req.body ?? {};

    const result = await analyzeYoutubeVideo({
      userId: req.auth.userId,
      youtubeUrl,
      travelRegion,
    });

    const overview = await getAiLabOverview(req.auth.userId);

    res.status(201).json({
      ...result,
      overview,
    });
  } catch (error) {
    next(error);
  }
});

aiLabRouter.post("/places/:placeId/save", async (req, res, next) => {
  try {
    const saved = await saveAiExtractedPlace(req.auth.userId, Number(req.params.placeId));

    if (!saved) {
      res.status(404).json({
        message: "저장할 AI 장소를 찾지 못했습니다.",
      });
      return;
    }

    const overview = await getAiLabOverview(req.auth.userId);

    res.status(200).json({
      message: "선택한 장소를 마이페이지에 저장했습니다.",
      overview,
    });
  } catch (error) {
    next(error);
  }
});
