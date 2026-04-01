import { AlertTriangle, Clock3, Footprints } from "lucide-react";

type PlannerInsight = {
  iconKey: "footprints" | "clock";
  title: string;
  description: string;
};

type InsightPanelProps = {
  insights: PlannerInsight[];
};

function renderIcon(iconKey: PlannerInsight["iconKey"]) {
  if (iconKey === "clock") {
    return <Clock3 size={16} />;
  }

  return <Footprints size={16} />;
}

export function InsightPanel({ insights }: InsightPanelProps) {
  return (
    <section className="insight-panel">
      <div className="insight-panel__header">
        <div className="insight-panel__icon">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="eyebrow">동선 분석</p>
          <h2>오늘의 이동 주의점</h2>
        </div>
      </div>

      <div className="insight-panel__list">
        {insights.length === 0 ? (
          <article className="insight-card">
            <div>
              <h3>분석 대기 중</h3>
              <p>장소를 추가하고 저장하면 이동 시간과 피로도 경고를 이곳에서 확인할 수 있습니다.</p>
            </div>
          </article>
        ) : null}

        {insights.map((item) => (
          <article key={item.title} className="insight-card">
            <div className="insight-card__icon">{renderIcon(item.iconKey)}</div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
