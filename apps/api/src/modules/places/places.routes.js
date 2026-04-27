import { Router } from "express";
import { getPlaceDetail } from "./places.repository.js";

export const placesRouter = Router();

placesRouter.get("/:placeId", async (req, res, next) => {
  try {
    const place = await getPlaceDetail(req.params.placeId);

    if (!place) {
      res.status(404).json({
        message: "장소 정보를 찾을 수 없습니다.",
      });
      return;
    }

    res.status(200).json({ place });
  } catch (error) {
    next(error);
  }
});
