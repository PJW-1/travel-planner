import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { optimizeTripRoute } from "./trips.optimizer.js";
import {
  createTrip,
  createTripStop,
  deleteTrip,
  deleteTripStop,
  getTripDetail,
  listUserTrips,
  setTripSaved,
  updateTrip,
  updateTripStop,
} from "./trips.repository.js";

export const tripsRouter = Router();

tripsRouter.use(requireAuth);

tripsRouter.get("/", async (req, res, next) => {
  try {
    const items = await listUserTrips(req.auth.userId);
    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
});

tripsRouter.post("/:tripId/optimize", async (req, res, next) => {
  try {
    const optimized = await optimizeTripRoute(req.auth.userId, req.params.tripId);

    if (!optimized) {
      res.status(404).json({ message: "최적화할 일정을 찾을 수 없습니다." });
      return;
    }

    const detail = await getTripDetail(req.auth.userId, req.params.tripId, req.body?.selectedDayNumber);
    res.status(200).json({
      message: "이동 수단과 출발지를 반영해 동선을 최적화했습니다.",
      trip: detail,
    });
  } catch (error) {
    next(error);
  }
});

tripsRouter.post("/:tripId/reorder", async (req, res, next) => {
  try {
    const dayNumber = Number(req.body?.dayNumber ?? 1);
    const stopIds = Array.isArray(req.body?.stopIds)
      ? req.body.stopIds.map((id) => String(id))
      : [];

    const optimized = await optimizeTripRoute(req.auth.userId, req.params.tripId, {
      manualOrderByDay: {
        [String(dayNumber)]: stopIds,
      },
    });

    if (!optimized) {
      res.status(404).json({ message: "재정렬할 일정을 찾을 수 없습니다." });
      return;
    }

    const detail = await getTripDetail(req.auth.userId, req.params.tripId, dayNumber);
    res.status(200).json({
      message: "방문 순서를 다시 반영했습니다.",
      trip: detail,
    });
  } catch (error) {
    next(error);
  }
});

tripsRouter.post("/", async (req, res, next) => {
  try {
    const tripId = await createTrip(req.auth.userId, req.body ?? {});
    const detail = await getTripDetail(req.auth.userId, tripId, 1);

    res.status(201).json({
      message: "새 일정이 생성되었습니다.",
      trip: detail,
    });
  } catch (error) {
    next(error);
  }
});

tripsRouter.get("/:tripId", async (req, res, next) => {
  try {
    const detail = await getTripDetail(req.auth.userId, req.params.tripId, req.query.day);

    if (!detail) {
      res.status(404).json({ message: "일정을 찾을 수 없습니다." });
      return;
    }

    res.status(200).json(detail);
  } catch (error) {
    next(error);
  }
});

tripsRouter.patch("/:tripId", async (req, res, next) => {
  try {
    const updated = await updateTrip(req.auth.userId, req.params.tripId, req.body ?? {});

    if (!updated) {
      res.status(404).json({ message: "수정할 일정을 찾을 수 없습니다." });
      return;
    }

    const detail = await getTripDetail(req.auth.userId, req.params.tripId, req.body?.selectedDayNumber);
    res.status(200).json({
      message: "일정 정보가 저장되었습니다.",
      trip: detail,
    });
  } catch (error) {
    next(error);
  }
});

tripsRouter.post("/:tripId/save", async (req, res, next) => {
  try {
    const saved = await setTripSaved(req.auth.userId, req.params.tripId, true);

    if (!saved) {
      res.status(404).json({ message: "저장할 일정을 찾을 수 없습니다." });
      return;
    }

    const detail = await getTripDetail(req.auth.userId, req.params.tripId, req.body?.selectedDayNumber);
    res.status(200).json({
      message: "내 일정에 저장했습니다.",
      trip: detail,
    });
  } catch (error) {
    next(error);
  }
});

tripsRouter.delete("/:tripId", async (req, res, next) => {
  try {
    const deleted = await deleteTrip(req.auth.userId, req.params.tripId);

    if (!deleted) {
      res.status(404).json({ message: "삭제할 일정을 찾을 수 없습니다." });
      return;
    }

    res.status(200).json({
      message: "일정을 삭제했습니다.",
    });
  } catch (error) {
    next(error);
  }
});

tripsRouter.post("/:tripId/stops", async (req, res, next) => {
  try {
    const stopId = await createTripStop(req.auth.userId, req.params.tripId, req.body ?? {});

    if (!stopId) {
      res.status(404).json({ message: "장소를 추가할 일정을 찾을 수 없습니다." });
      return;
    }

    const detail = await getTripDetail(req.auth.userId, req.params.tripId, req.body?.dayNumber);
    res.status(201).json({
      message: "장소를 일정에 추가했습니다.",
      stopId: String(stopId),
      trip: detail,
    });
  } catch (error) {
    next(error);
  }
});

tripsRouter.patch("/:tripId/stops/:stopId", async (req, res, next) => {
  try {
    const updated = await updateTripStop(
      req.auth.userId,
      req.params.tripId,
      req.params.stopId,
      req.body ?? {},
    );

    if (!updated) {
      res.status(404).json({ message: "수정할 장소를 찾을 수 없습니다." });
      return;
    }

    const detail = await getTripDetail(
      req.auth.userId,
      req.params.tripId,
      req.body?.dayNumber,
    );

    res.status(200).json({
      message: "장소 정보를 수정했습니다.",
      trip: detail,
    });
  } catch (error) {
    next(error);
  }
});

tripsRouter.delete("/:tripId/stops/:stopId", async (req, res, next) => {
  try {
    const deleted = await deleteTripStop(req.auth.userId, req.params.tripId, req.params.stopId);

    if (!deleted) {
      res.status(404).json({ message: "삭제할 장소를 찾을 수 없습니다." });
      return;
    }

    const detail = await getTripDetail(req.auth.userId, req.params.tripId, req.query.day);

    res.status(200).json({
      message: "장소를 일정에서 삭제했습니다.",
      trip: detail,
    });
  } catch (error) {
    next(error);
  }
});
