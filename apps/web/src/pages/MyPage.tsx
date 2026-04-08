import { useEffect, useState } from "react";
import { Bookmark, Heart, LogOut, PencilLine, Plus, Trash2, UserRound } from "lucide-react";
import type { SavedPlan } from "@travel/shared";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { fetchMe, logout, updateProfile } from "@/lib/authApi";
import { fetchMySummary, type SavedAiPlace } from "@/lib/contentApi";
import { deleteTrip } from "@/lib/tripsApi";

type ProfileState = {
  userId: number;
  email: string;
  nickname: string;
  provider: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export function MyPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [savedAiPlaces, setSavedAiPlaces] = useState<SavedAiPlace[]>([]);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      try {
        const [summary, me] = await Promise.all([fetchMySummary(), fetchMe()]);

        if (isMounted) {
          setSavedPlans(summary.savedPlans);
          setSavedAiPlaces(summary.savedAiPlaces);
          setProfile(me.user);
          setNickname(me.user.nickname);
        }
      } catch {
        if (isMounted) {
          setSavedPlans([]);
          setSavedAiPlaces([]);
        }
      }
    }

    void loadPage();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await logout();
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/home");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "로그아웃 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveProfile() {
    if (!nickname.trim()) {
      setErrorMessage("닉네임을 입력해주세요.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSavingProfile(true);

    try {
      const result = await updateProfile({
        nickname: nickname.trim(),
      });

      setProfile(result.user);
      setNickname(result.user.nickname);
      setSuccessMessage(result.message);
      window.dispatchEvent(new Event("auth-changed"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필 저장 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeleteTrip(tripId: string) {
    const shouldDelete = window.confirm("이 일정을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.");

    if (!shouldDelete) {
      return;
    }

    setDeletingTripId(tripId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await deleteTrip(tripId);
      setSavedPlans((current) => current.filter((plan) => plan.id !== tripId));
      setSuccessMessage(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "일정 삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setDeletingTripId(null);
    }
  }

  function handleAddSavedPlace(place: SavedAiPlace) {
    const params = new URLSearchParams({
      communityPlaceId: place.placeId,
      communityPlaceName: place.title,
      communityPlaceAddress: place.address ?? "",
      communityPlaceCategoryKey: place.categoryKey ?? "activity",
      communityPlaceLat: String(place.lat),
      communityPlaceLng: String(place.lng),
    });

    navigate(`/setup?${params.toString()}`);
  }

  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow="마이페이지"
        title="내 여행 보관함과 프로필을 한곳에서 관리해보세요"
        description="저장한 일정과 장소를 모아두고, 프로필 정보도 간단하게 수정할 수 있습니다."
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
      {successMessage ? <p className="form-feedback form-feedback--success">{successMessage}</p> : null}

      <div className="two-column-layout two-column-layout--profile">
        <section className="panel panel--muted">
          <div className="panel__header">
            <div className="section-title__label">
              <UserRound size={16} />
              <span>프로필</span>
            </div>
          </div>

          <div className="profile-card">
            <label className="profile-field">
              <span>닉네임</span>
              <input
                type="text"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="닉네임을 입력해주세요"
              />
            </label>

            <div className="profile-field profile-field--readonly">
              <span>이메일</span>
              <strong>{profile?.email ?? "-"}</strong>
            </div>

            <div className="profile-field profile-field--readonly">
              <span>로그인 방식</span>
              <strong>{profile?.provider ?? "-"}</strong>
            </div>

            <div className="profile-field profile-field--readonly">
              <span>최근 로그인</span>
              <strong>
                {profile?.lastLoginAt
                  ? new Date(profile.lastLoginAt).toLocaleString("ko-KR")
                  : "-"}
              </strong>
            </div>

            <button
              type="button"
              className="button button--primary"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
            >
              <PencilLine size={16} />
              {isSavingProfile ? "저장 중..." : "프로필 저장"}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div className="section-title__label">
              <Bookmark size={16} />
              <span>저장된 일정</span>
            </div>
          </div>

          {savedPlans.length > 0 ? (
            <div className="saved-plan-list">
              {savedPlans.map((plan) => (
                <article key={plan.id} className="saved-plan">
                  <div className="saved-plan__emoji">{plan.emoji}</div>
                  <div className="saved-plan__body">
                    <h3>{plan.title}</h3>
                    <p>
                      {plan.date} | {plan.placeCount}개 장소
                    </p>
                  </div>
                  <div className="saved-plan__actions">
                    <Link to={`/setup?tripId=${plan.id}`} className="button button--secondary">
                      다시 편집
                    </Link>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => void handleDeleteTrip(plan.id)}
                      disabled={deletingTripId === plan.id}
                    >
                      <Trash2 size={16} />
                      {deletingTripId === plan.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>아직 저장된 일정이 없습니다. 플래너 결과를 저장해 여행 보관함을 채워보세요.</p>
              <Link to="/setup" className="button button--secondary">
                새 일정 만들기
              </Link>
            </div>
          )}
        </section>
      </div>

      <section className="panel panel--muted">
        <div className="panel__header">
          <div className="section-title__label">
            <Heart size={16} />
            <span>저장 장소</span>
          </div>
        </div>

        {savedAiPlaces.length > 0 ? (
          <div className="saved-plan-list">
            {savedAiPlaces.map((place) => (
              <article key={place.id} className="saved-plan">
                <div className="saved-plan__emoji">S</div>
                <div className="saved-plan__body">
                  <h3>{place.title}</h3>
                  <p>{place.address || place.region}</p>
                  <small className="saved-plan__meta">{place.sourceTitle}</small>
                </div>
                <div className="saved-plan__actions">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleAddSavedPlace(place)}
                  >
                    <Plus size={16} />
                    플래너에 추가
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>아직 저장한 장소가 없습니다. AI 랩이나 커뮤니티에서 마음에 드는 장소를 저장해보세요.</p>
            <Link to="/ai-lab" className="button button--secondary">
              AI 랩 가기
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
