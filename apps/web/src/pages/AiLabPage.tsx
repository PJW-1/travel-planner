import { CheckCircle2, Plus, WandSparkles, Youtube } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const extractedPlaces = ["성수동 팝업스토어", "한강 라면 스팟", "연무장길 감성 카페"];

export function AiLabPage() {
  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow="AI 장소 추출"
        title="영상 속 장소를 읽어 일정 후보로 바꾸는 분석 워크플로우"
        description="실서비스에서는 영상 URL 입력, 프레임과 자막 분석, 장소 후보 검증, 좌표 변환, 일정 반영까지 단계적으로 이어지는 구조가 됩니다."
      />

      <section className="lab-hero">
        <div className="lab-hero__input">
          <div className="lab-input">
            <Youtube size={18} />
            <input type="text" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <button className="button button--primary">분석 시작</button>
        </div>
        <div className="lab-hero__grid">
          <article className="info-card">
            <div className="info-card__icon">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3>최근 추출한 장소</h3>
              <div className="place-list">
                {extractedPlaces.map((place) => (
                  <div key={place} className="place-list__item">
                    <span>{place}</span>
                    <button>
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="info-card">
            <div className="info-card__icon">
              <WandSparkles size={18} />
            </div>
            <div>
              <h3>처리 흐름</h3>
              <ol className="steps">
                <li>영상 메타데이터를 수집하고 자막과 프레임을 분석합니다</li>
                <li>장소 후보를 추출하고 좌표를 검증합니다</li>
                <li>여행 목적, 태그, 일정 밀도 규칙에 맞춰 플래너에 반영합니다</li>
              </ol>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
