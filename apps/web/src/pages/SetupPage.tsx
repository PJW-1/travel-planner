import { useMemo, useState } from "react";
import { ArrowRight, Plus, Sparkles, Trash2 } from "lucide-react";
import type { PlannerStop } from "@travel/shared";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { TimelineStopCard } from "@/components/planner/TimelineStopCard";
import { createTrip, createTripStop } from "@/lib/tripsApi";

type TripFormState = {
  title: string;
  destination: string;
  startDate: string;
  days: number;
  lunchTime: string;
  dinnerTime: string;
  tags: string;
};

type StopFormState = {
  name: string;
  categoryKey: "transport" | "cafe" | "activity" | "view";
  time: string;
  stayMinutes: number;
  travelMinutes: number;
  distanceKm: number;
  congestion: number;
  transportType: string;
  stopOrder: number;
  forked: boolean;
  dayNumber: number;
};

const MAP_POSITIONS = [
  { x: 18, y: 52 },
  { x: 56, y: 32 },
  { x: 50, y: 56 },
  { x: 63, y: 76 },
  { x: 30, y: 28 },
  { x: 72, y: 46 },
  { x: 42, y: 72 },
];

const CATEGORY_LABELS = {
  transport: "교통 허브",
  cafe: "카페",
  activity: "액티비티",
  view: "뷰 포인트",
};

function createDefaultTripForm(): TripFormState {
  return {
    title: "새 여행 일정",
    destination: "서울",
    startDate: new Date().toISOString().slice(0, 10),
    days: 1,
    lunchTime: "12:00",
    dinnerTime: "18:30",
    tags: "감성, 맛집",
  };
}

function createDefaultStopForm(dayNumber = 1, stopOrder = 1): StopFormState {
  return {
    name: "",
    categoryKey: "activity",
    time: "10:00",
    stayMinutes: 60,
    travelMinutes: 10,
    distanceKm: 1.2,
    congestion: 50,
    transportType: "walk",
    stopOrder,
    forked: false,
    dayNumber,
  };
}

function createTempId() {
  return `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function mapStopPreview(form: StopFormState, index: number, id = createTempId()): PlannerStop {
  const position = MAP_POSITIONS[index] ?? {
    x: 24 + (index % 4) * 14,
    y: 28 + Math.floor(index / 4) * 18,
  };

  return {
    id,
    name: form.name.trim(),
    category: CATEGORY_LABELS[form.categoryKey],
    categoryKey: form.categoryKey,
    time: form.time,
    congestion: form.congestion,
    stayMinutes: form.stayMinutes,
    travelMinutes: form.travelMinutes,
    transportType: form.transportType,
    stopOrder: form.stopOrder,
    dayNumber: form.dayNumber,
    distanceKm: form.distanceKm,
    forked: form.forked,
    position,
  };
}

function mapFormFromStop(stop: PlannerStop): StopFormState {
  return {
    name: stop.name,
    categoryKey: stop.categoryKey,
    time: stop.time,
    stayMinutes: stop.stayMinutes,
    travelMinutes: stop.travelMinutes,
    distanceKm: stop.distanceKm ?? 0,
    congestion: stop.congestion,
    transportType: stop.transportType ?? "walk",
    stopOrder: stop.stopOrder ?? 1,
    forked: Boolean(stop.forked),
    dayNumber: stop.dayNumber ?? 1,
  };
}

export function SetupPage() {
  const navigate = useNavigate();
  const [tripForm, setTripForm] = useState<TripFormState>(createDefaultTripForm());
  const [stopForm, setStopForm] = useState<StopFormState>(createDefaultStopForm());
  const [plannedStops, setPlannedStops] = useState<PlannerStop[]>([]);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sortedStops = useMemo(
    () =>
      [...plannedStops].sort((a, b) => {
        const dayDiff = (a.dayNumber ?? 1) - (b.dayNumber ?? 1);
        if (dayDiff !== 0) {
          return dayDiff;
        }

        return (a.stopOrder ?? 1) - (b.stopOrder ?? 1);
      }),
    [plannedStops],
  );

  function handleAddOrUpdateStop() {
    if (!stopForm.name.trim()) {
      setError("장소 이름을 입력해주세요.");
      return;
    }

    setError("");

    if (editingStopId) {
      setPlannedStops((current) =>
        current.map((stop, index) =>
          stop.id === editingStopId ? mapStopPreview(stopForm, index, editingStopId) : stop,
        ),
      );
      setEditingStopId(null);
    } else {
      setPlannedStops((current) => [...current, mapStopPreview(stopForm, current.length)]);
    }

    const nextOrder = plannedStops.filter((stop) => (stop.dayNumber ?? 1) === stopForm.dayNumber).length + 1;
    setStopForm(createDefaultStopForm(stopForm.dayNumber, nextOrder));
  }

  function handleEditStop(stop: PlannerStop) {
    setEditingStopId(stop.id);
    setStopForm(mapFormFromStop(stop));
    setError("");
  }

  function handleDeleteStop(stop: PlannerStop) {
    setPlannedStops((current) => current.filter((item) => item.id !== stop.id));
    if (editingStopId === stop.id) {
      setEditingStopId(null);
      setStopForm(createDefaultStopForm(stop.dayNumber ?? 1));
    }
  }

  function handleResetStopForm() {
    setEditingStopId(null);
    const nextOrder =
      plannedStops.filter((stop) => (stop.dayNumber ?? 1) === stopForm.dayNumber).length + 1;
    setStopForm(createDefaultStopForm(stopForm.dayNumber, nextOrder));
  }

  async function handleOptimize() {
    if (plannedStops.length === 0) {
      setError("최적화 전에 최소 한 개 이상의 장소를 추가해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const created = await createTrip({
        title: tripForm.title.trim(),
        destination: tripForm.destination.trim(),
        startDate: tripForm.startDate,
        days: tripForm.days,
        lunchTime: tripForm.lunchTime,
        dinnerTime: tripForm.dinnerTime,
        tags: tripForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      const tripId = created.trip.trip.id;

      for (const stop of sortedStops) {
        await createTripStop(tripId, {
          dayNumber: stop.dayNumber ?? 1,
          name: stop.name,
          categoryKey: stop.categoryKey,
          time: stop.time,
          stayMinutes: stop.stayMinutes,
          travelMinutes: stop.travelMinutes,
          distanceKm: stop.distanceKm ?? 0,
          congestion: stop.congestion,
          transportType: stop.transportType ?? "walk",
          stopOrder: stop.stopOrder ?? 1,
          forked: Boolean(stop.forked),
        });
      }

      navigate(`/planner?tripId=${tripId}&day=1`);
    } catch (optimizeError) {
      setError(
        optimizeError instanceof Error
          ? optimizeError.message
          : "일정 생성 중 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow="일정 설정"
        title="장소와 조건을 먼저 조립하고, 최적화된 결과는 다음 단계에서 확인합니다."
        description="여행지, 식사 시간, 일차별 방문 장소, 이동 수단, 체류 시간을 입력한 뒤 최적화 버튼을 누르면 결과 페이지에서 정리된 동선을 한눈에 볼 수 있습니다."
        actions={
          <button className="button button--primary" onClick={handleOptimize} disabled={submitting}>
            <Sparkles size={16} />
            최적화 시작
          </button>
        }
      />

      {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}

      <div className="setup-builder">
        <section className="planner-editor-card">
          <div className="planner-section-title">
            <h2>기본 설정</h2>
          </div>

          <div className="planner-form planner-form--two-column">
            <label className="planner-field">
              <span>일정 제목</span>
              <input
                value={tripForm.title}
                onChange={(event) =>
                  setTripForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>

            <label className="planner-field">
              <span>여행지</span>
              <input
                value={tripForm.destination}
                onChange={(event) =>
                  setTripForm((current) => ({ ...current, destination: event.target.value }))
                }
              />
            </label>

            <label className="planner-field">
              <span>출발일</span>
              <input
                type="date"
                value={tripForm.startDate}
                onChange={(event) =>
                  setTripForm((current) => ({ ...current, startDate: event.target.value }))
                }
              />
            </label>

            <label className="planner-field">
              <span>여행 일수</span>
              <input
                type="number"
                min={1}
                max={14}
                value={tripForm.days}
                onChange={(event) =>
                  setTripForm((current) => ({
                    ...current,
                    days: Math.max(1, Math.min(14, Number(event.target.value) || 1)),
                  }))
                }
              />
            </label>

            <label className="planner-field">
              <span>점심 시간</span>
              <input
                type="time"
                value={tripForm.lunchTime}
                onChange={(event) =>
                  setTripForm((current) => ({ ...current, lunchTime: event.target.value }))
                }
              />
            </label>

            <label className="planner-field">
              <span>저녁 시간</span>
              <input
                type="time"
                value={tripForm.dinnerTime}
                onChange={(event) =>
                  setTripForm((current) => ({ ...current, dinnerTime: event.target.value }))
                }
              />
            </label>
          </div>

          <label className="planner-field">
            <span>태그</span>
            <input
              value={tripForm.tags}
              placeholder="감성, 맛집, 도보 여행"
              onChange={(event) =>
                setTripForm((current) => ({ ...current, tags: event.target.value }))
              }
            />
          </label>
        </section>

        <div className="setup-builder__grid">
          <section className="planner-editor-card planner-editor-card--sticky">
            <div className="planner-section-title">
              <h2>{editingStopId ? "장소 수정" : "장소 추가"}</h2>
              <div className="planner-inline-actions">
                {editingStopId ? (
                  <button type="button" className="button button--secondary" onClick={handleResetStopForm}>
                    취소
                  </button>
                ) : null}
                <button type="button" className="button button--primary" onClick={handleAddOrUpdateStop}>
                  <Plus size={16} />
                  {editingStopId ? "수정 반영" : "장소 담기"}
                </button>
              </div>
            </div>

            <div className="planner-form planner-form--two-column">
              <label className="planner-field">
                <span>장소명</span>
                <input
                  value={stopForm.name}
                  placeholder="예: 서울숲"
                  onChange={(event) =>
                    setStopForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>

              <label className="planner-field">
                <span>카테고리</span>
                <select
                  value={stopForm.categoryKey}
                  onChange={(event) =>
                    setStopForm((current) => ({
                      ...current,
                      categoryKey: event.target.value as StopFormState["categoryKey"],
                    }))
                  }
                >
                  <option value="transport">교통</option>
                  <option value="cafe">카페</option>
                  <option value="activity">액티비티</option>
                  <option value="view">뷰 포인트</option>
                </select>
              </label>

              <label className="planner-field">
                <span>일차</span>
                <select
                  value={stopForm.dayNumber}
                  onChange={(event) =>
                    setStopForm((current) => ({
                      ...current,
                      dayNumber: Number(event.target.value),
                    }))
                  }
                >
                  {Array.from({ length: tripForm.days }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}일차
                    </option>
                  ))}
                </select>
              </label>

              <label className="planner-field">
                <span>방문 시간</span>
                <input
                  type="time"
                  value={stopForm.time}
                  onChange={(event) =>
                    setStopForm((current) => ({ ...current, time: event.target.value }))
                  }
                />
              </label>

              <label className="planner-field">
                <span>이동 수단</span>
                <input
                  value={stopForm.transportType}
                  placeholder="walk / subway / bus"
                  onChange={(event) =>
                    setStopForm((current) => ({ ...current, transportType: event.target.value }))
                  }
                />
              </label>

              <label className="planner-field">
                <span>체류 시간(분)</span>
                <input
                  type="number"
                  min={0}
                  value={stopForm.stayMinutes}
                  onChange={(event) =>
                    setStopForm((current) => ({
                      ...current,
                      stayMinutes: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </label>

              <label className="planner-field">
                <span>이전 장소에서 이동 시간(분)</span>
                <input
                  type="number"
                  min={0}
                  value={stopForm.travelMinutes}
                  onChange={(event) =>
                    setStopForm((current) => ({
                      ...current,
                      travelMinutes: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </label>

              <label className="planner-field">
                <span>이동 거리(km)</span>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={stopForm.distanceKm}
                  onChange={(event) =>
                    setStopForm((current) => ({
                      ...current,
                      distanceKm: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </label>

              <label className="planner-field">
                <span>혼잡도(0~100)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={stopForm.congestion}
                  onChange={(event) =>
                    setStopForm((current) => ({
                      ...current,
                      congestion: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                    }))
                  }
                />
              </label>

              <label className="planner-field">
                <span>일차 내 순서</span>
                <input
                  type="number"
                  min={1}
                  value={stopForm.stopOrder}
                  onChange={(event) =>
                    setStopForm((current) => ({
                      ...current,
                      stopOrder: Math.max(1, Number(event.target.value) || 1),
                    }))
                  }
                />
              </label>
            </div>

            <label className="planner-checkbox">
              <input
                type="checkbox"
                checked={stopForm.forked}
                onChange={(event) =>
                  setStopForm((current) => ({ ...current, forked: event.target.checked }))
                }
              />
              <span>포크한 장소로 표시</span>
            </label>
          </section>

          <section className="planner-editor-card">
            <div className="planner-section-title">
              <h2>이번 일정에 담은 장소</h2>
              <span className="planner-muted">{sortedStops.length}개 등록</span>
            </div>

            {sortedStops.length === 0 ? (
              <div className="planner-empty">
                <strong>아직 추가된 장소가 없습니다.</strong>
                <p>장소, 이동 수단, 체류 시간까지 먼저 설정한 뒤 최적화를 시작해보세요.</p>
              </div>
            ) : (
              sortedStops.map((stop, index) => (
                <TimelineStopCard
                  key={stop.id}
                  stop={stop}
                  index={index}
                  last={index === sortedStops.length - 1}
                  editing={editingStopId === stop.id}
                  onEdit={handleEditStop}
                  onDelete={handleDeleteStop}
                />
              ))
            )}

            <div className="setup-builder__footer">
              <button className="button button--primary" onClick={handleOptimize} disabled={submitting}>
                최적화 결과 보기
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
