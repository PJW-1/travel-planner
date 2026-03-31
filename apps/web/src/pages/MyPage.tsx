import { useEffect, useState } from "react";
import { Bookmark, Heart, LogOut } from "lucide-react";
import type { SavedPlan } from "@travel/shared";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { logout } from "@/lib/authApi";
import { fetchMySummary } from "@/lib/contentApi";

export function MyPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMySummary() {
      try {
        const data = await fetchMySummary();

        if (isMounted) {
          setSavedPlans(data.savedPlans);
        }
      } catch {
        if (isMounted) {
          setSavedPlans([]);
        }
      }
    }

    void loadMySummary();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await logout();
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그아웃 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow="여행 보관함"
        title="저장한 일정과 찜한 장소를 한곳에서 관리해보세요."
        description="내 일정, 찜한 장소, 앞으로 추가될 개인 활동 기록까지 마이페이지에서 이어서 관리할 수 있습니다."
        actions={
          <button
            type="button"
            className="button button--secondary"
            onClick={handleLogout}
            disabled={isSubmitting}
          >
            <LogOut size={16} />
            {isSubmitting ? "로그아웃 중..." : "로그아웃"}
          </button>
        }
      />

      {errorMessage ? <p className="form-feedback form-feedback--error">{errorMessage}</p> : null}

      <div className="two-column-layout">
        <section className="panel">
          <div className="panel__header">
            <div className="section-title__label">
              <Bookmark size={16} />
              <span>저장한 일정</span>
            </div>
          </div>
          <div className="saved-plan-list">
            {savedPlans.map((plan) => (
              <article key={plan.id} className="saved-plan">
                <div className="saved-plan__emoji">{plan.emoji}</div>
                <div>
                  <h3>{plan.title}</h3>
                  <p>
                    {plan.date} | {plan.placeCount}개 장소
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel panel--muted">
          <div className="panel__header">
            <div className="section-title__label">
              <Heart size={16} />
              <span>찜한 장소</span>
            </div>
          </div>
          <div className="empty-state">
            <p>
              아직 찜한 장소가 없습니다. AI 추출이나 루트 마켓에서 마음에 드는 장소를 담아보세요.
            </p>
            <Link to="/ai-lab" className="button button--secondary">
              장소 둘러보기
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
