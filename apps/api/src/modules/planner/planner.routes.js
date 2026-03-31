import { Router } from "express";

export const plannerRouter = Router();

plannerRouter.get("/overview", (_req, res) => {
  res.json({
    days: 3,
    totalDistanceKm: 14.8,
    optimizationScore: 92,
    insights: [
      "도보 이동량이 많은 구간이 있습니다.",
      "혼잡 시간대 전후로 20분 버퍼를 권장합니다."
    ]
  });
});

