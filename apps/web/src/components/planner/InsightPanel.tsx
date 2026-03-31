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
