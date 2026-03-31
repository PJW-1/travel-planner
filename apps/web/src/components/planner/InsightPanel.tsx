import { AlertTriangle, Clock3, Footprints } from "lucide-react";

const insights = [
  {
    icon: <Footprints size={16} />,
    title: "도보 이동량이 많은 편입니다",
    description:
      "카페에서 서울숲으로 이동하는 구간이 길어서, 날씨가 덥거나 비가 오면 피로도가 빠르게 올라갈 수 있습니다.",
  },
  {
    icon: <Clock3 size={16} />,
    title: "오후 일정에 여유 시간을 두세요",
    description:
      "팝업 스토어와 카페 대기 시간이 길어질 수 있어, 오후 4시 이후 일정에는 20분 정도 여유를 두는 편이 안전합니다.",
  },
];

export function InsightPanel() {
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
            <div className="insight-card__icon">{item.icon}</div>
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
