import { useEffect, useState } from "react";
import {
  Bookmark,
  GitFork,
  Heart,
  LockKeyhole,
  LogOut,
  PencilLine,
  Plus,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react";
import type { SavedPlan } from "@travel/shared";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { PlaceDetailSheet } from "@/components/places/PlaceDetailSheet";
import { changePassword, deleteAccount, fetchMe, logout, updateProfile } from "@/lib/authApi";
import {
  fetchMySummary,
  importCommunityRoute,
  type CommunityRouteSummary,
  type SavedAiPlace,
} from "@/lib/contentApi";
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
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [importingRouteId, setImportingRouteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedAiPlace[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<CommunityRouteSummary[]>([]);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [nickname, setNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [nextPasswordConfirm, setNextPasswordConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      try {
        const [summary, me] = await Promise.all([fetchMySummary(), fetchMe()]);

        if (!isMounted) {
          return;
        }

        setSavedPlans(summary.savedPlans);
        setSavedPlaces(summary.savedAiPlaces);
        setSavedRoutes(summary.savedCommunityRoutes);
        setProfile(me.user);
        setNickname(me.user.nickname);
      } catch {
        if (!isMounted) {
          return;
        }

        setSavedPlans([]);
        setSavedPlaces([]);
        setSavedRoutes([]);
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
      setErrorMessage("닉네임을 입력해 주세요.");
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

  async function handleChangePassword() {
    if (!currentPassword || !nextPassword || !nextPasswordConfirm) {
      setErrorMessage("비밀번호 입력칸을 모두 채워 주세요.");
      return;
    }

    if (nextPassword !== nextPasswordConfirm) {
      setErrorMessage("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsChangingPassword(true);

    try {
      const result = await changePassword({
        currentPassword,
        nextPassword,
      });

      setCurrentPassword("");
      setNextPassword("");
      setNextPasswordConfirm("");
      setSuccessMessage(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "비밀번호 변경 중 오류가 발생했습니다.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      setErrorMessage("회원 탈퇴를 위해 현재 비밀번호를 입력해 주세요.");
      return;
    }

    const shouldDelete = window.confirm(
      "정말 회원 탈퇴할까요? 현재 계정으로 다시 로그인할 수 없습니다.",
    );

    if (!shouldDelete) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsDeletingAccount(true);

    try {
      await deleteAccount({
        password: deletePassword,
      });
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/home");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "회원 탈퇴 중 오류가 발생했습니다.",
      );
    } finally {
      setIsDeletingAccount(false);
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

  async function handleImportSavedRoute(routeId: string) {
    setImportingRouteId(routeId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await importCommunityRoute(routeId);
      setSuccessMessage(result.message);
      navigate(`/setup?tripId=${result.imported.tripId}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "루트를 가져오는 중 오류가 발생했습니다.",
      );
    } finally {
      setImportingRouteId(null);
    }
  }

  return (
    <div className="single-column-page">
      <PageHeader
        eyebrow="마이페이지"
        title="내 여행 기록과 저장한 장소를 한곳에서 관리해 보세요"
        description="저장한 일정과 장소를 다시 꺼내 쓰고, 프로필도 간단하게 수정할 수 있습니다."
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
      {successMessage ? (
        <p className="form-feedback form-feedback--success">{successMessage}</p>
      ) : null}

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
                placeholder="닉네임을 입력해 주세요"
              />
            </label>

            <div className="profile-field profile-field--readonly">
              <span>이메일</span>
              <strong>{profile?.email ?? "-"}</strong>
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

          <div className="account-management-card">
            <div className="section-title__label">
              <LockKeyhole size={16} />
              <span>비밀번호 변경</span>
            </div>

            <label className="profile-field">
              <span>현재 비밀번호</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="현재 비밀번호"
                autoComplete="current-password"
              />
            </label>

            <label className="profile-field">
              <span>새 비밀번호</span>
              <input
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                placeholder="8자 이상 입력"
                autoComplete="new-password"
              />
            </label>

            <label className="profile-field">
              <span>새 비밀번호 확인</span>
              <input
                type="password"
                value={nextPasswordConfirm}
                onChange={(event) => setNextPasswordConfirm(event.target.value)}
                placeholder="새 비밀번호 재입력"
                autoComplete="new-password"
              />
            </label>

            <button
              type="button"
              className="button button--secondary"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              <LockKeyhole size={16} />
              {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>

          <div className="account-management-card account-management-card--danger">
            <div className="section-title__label">
              <ShieldAlert size={16} />
              <span>회원 탈퇴</span>
            </div>
            <p>
              탈퇴하면 현재 계정으로 다시 로그인할 수 없습니다. 필요한 일정은 먼저 확인해 주세요.
            </p>

            <label className="profile-field">
              <span>현재 비밀번호</span>
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="탈퇴 확인용 비밀번호"
                autoComplete="current-password"
              />
            </label>

            <button
              type="button"
              className="button button--ghost"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              <Trash2 size={16} />
              {isDeletingAccount ? "탈퇴 처리 중..." : "회원 탈퇴"}
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
                      {plan.date} | 장소 {plan.placeCount}개
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
              <p>아직 저장된 일정이 없습니다. 플래너에서 결과를 저장해 보세요.</p>
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

        {savedPlaces.length > 0 ? (
          <div className="saved-plan-list">
            {savedPlaces.map((place) => (
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
                    className="button button--ghost"
                    onClick={() => {
                      if (place.placeId) {
                        setSelectedPlaceId(place.placeId);
                      }
                    }}
                  >
                    상세 보기
                  </button>
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
            <p>아직 저장한 장소가 없습니다. AI 랩이나 커뮤니티에서 장소를 담아보세요.</p>
            <Link to="/ai-lab" className="button button--secondary">
              AI 랩 가기
            </Link>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <div className="section-title__label">
            <Bookmark size={16} />
            <span>보관한 커뮤니티 루트</span>
          </div>
        </div>

        {savedRoutes.length > 0 ? (
          <div className="saved-plan-list">
            {savedRoutes.map((route) => (
              <article key={route.id} className="saved-plan">
                <div className="saved-plan__emoji">R</div>
                <div className="saved-plan__body">
                  <h3>{route.title}</h3>
                  <p>
                    {route.destination} | {route.days}박 {route.days + 1}일
                  </p>
                  <small className="saved-plan__meta">
                    {route.author} · 좋아요 {route.likes} · 댓글 {route.comments}
                  </small>
                </div>
                <div className="saved-plan__actions">
                  <Link to={`/community/${route.id}`} className="button button--secondary">
                    상세 보기
                  </Link>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => void handleImportSavedRoute(route.id)}
                    disabled={importingRouteId === route.id}
                  >
                    <GitFork size={16} />
                    {importingRouteId === route.id ? "가져오는 중..." : "가져오기"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>아직 보관한 커뮤니티 루트가 없습니다. 마음에 드는 루트를 저장해 보세요.</p>
            <Link to="/community" className="button button--secondary">
              커뮤니티 둘러보기
            </Link>
          </div>
        )}
      </section>

      <PlaceDetailSheet
        placeId={selectedPlaceId}
        open={Boolean(selectedPlaceId)}
        onClose={() => setSelectedPlaceId(null)}
      />
    </div>
  );
}
