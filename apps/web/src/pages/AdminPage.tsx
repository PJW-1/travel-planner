import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Ban,
  Database,
  Eye,
  EyeOff,
  Map,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  deleteAdminTrip,
  fetchAdminOverview,
  updateAdminCommunityRouteStatus,
  updateAdminUserStatus,
  type AdminOverview,
} from "@/lib/adminApi";
import { fetchMe } from "@/lib/authApi";

type AdminSection = "users" | "trips" | "routes";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function includesQuery(values: Array<string | null | undefined>, query: string) {
  if (!query) {
    return true;
  }

  return values.some((value) => String(value ?? "").toLowerCase().includes(query));
}

function SectionToggle({
  title,
  count,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" className="admin-section-toggle" onClick={onToggle}>
      <span>
        <strong>{title}</strong>
        <small>{count.toLocaleString("ko-KR")}개 항목</small>
      </span>
      {open ? <Minus size={18} /> : <Plus size={18} />}
    </button>
  );
}

export function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const [query, setQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<AdminSection, boolean>>({
    users: false,
    trips: false,
    routes: false,
  });

  async function loadAdmin() {
    setIsLoading(true);

    try {
      const me = await fetchMe();

      if (me.user.role !== "admin") {
        throw new Error("관리자 계정으로 로그인해야 접근할 수 있습니다.");
      }

      const data = await fetchAdminOverview();
      setOverview(data);
      setErrorMessage("");
    } catch (error) {
      setOverview(null);
      setErrorMessage(error instanceof Error ? error.message : "관리자 페이지를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAdmin();
  }, []);

  async function runAction(key: string, action: () => Promise<{ message: string }>) {
    setActionKey(key);
    setErrorMessage("");
    setFeedback("");

    try {
      const result = await action();
      setFeedback(result.message);
      await loadAdmin();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "관리자 작업 중 오류가 발생했습니다.");
    } finally {
      setActionKey("");
    }
  }

  function toggleSection(section: AdminSection) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  const searchQuery = normalize(query);

  const filteredUsers = useMemo(
    () =>
      (overview?.users ?? []).filter((user) =>
        includesQuery([user.nickname, user.email, user.role, user.status], searchQuery),
      ),
    [overview?.users, searchQuery],
  );

  const filteredTrips = useMemo(
    () =>
      (overview?.trips ?? []).filter((trip) =>
        includesQuery([trip.title, trip.destination, trip.owner, trip.status], searchQuery),
      ),
    [overview?.trips, searchQuery],
  );

  const filteredRoutes = useMemo(
    () =>
      (overview?.routes ?? []).filter((route) =>
        includesQuery([route.title, route.author, route.status], searchQuery),
      ),
    [overview?.routes, searchQuery],
  );

  if (isLoading && !overview) {
    return (
      <div className="admin-page">
        <section className="panel admin-hero">
          <p className="eyebrow">ADMIN</p>
          <h1>관리자 정보를 불러오는 중</h1>
        </section>
      </div>
    );
  }

  if (errorMessage && !overview) {
    return (
      <div className="admin-page">
        <section className="panel admin-hero">
          <p className="eyebrow">ADMIN</p>
          <h1>접근 권한이 없습니다</h1>
          <p>{errorMessage}</p>
          <Link to="/login" className="button button--primary">
            로그인으로 이동
          </Link>
        </section>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const statCards = [
    { label: "활성 사용자", value: overview.stats.activeUsers, icon: UsersRound },
    { label: "관리자", value: overview.stats.adminUsers, icon: ShieldCheck },
    { label: "여행 일정", value: overview.stats.trips, icon: Map },
    { label: "커뮤니티 글", value: overview.stats.communityRoutes, icon: Activity },
    { label: "장소추출", value: overview.stats.videoExtractions, icon: Database },
    { label: "저장 장소", value: overview.stats.savedPlaces, icon: UserRound },
  ];

  return (
    <div className="admin-page">
      {errorMessage ? <p className="form-feedback form-feedback--error">{errorMessage}</p> : null}
      {feedback ? <p className="form-feedback form-feedback--success">{feedback}</p> : null}

      <section className="panel admin-hero">
        <div>
          <p className="eyebrow">ADMIN</p>
          <h1>서비스 운영 대시보드</h1>
          <p>검색으로 항목을 좁히고 필요한 관리 영역만 펼쳐서 조작합니다.</p>
        </div>
      </section>

      <section className="admin-stat-grid">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className="admin-stat-card">
              <Icon size={20} />
              <span>{card.label}</span>
              <strong>{card.value.toLocaleString("ko-KR")}</strong>
            </article>
          );
        })}
      </section>

      <section className="panel admin-control-panel">
        <label className="admin-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름, 이메일, 제목, 작성자, 상태로 검색"
          />
        </label>
      </section>

      <section className="admin-grid">
        <article className="panel admin-table-card">
          <SectionToggle
            title="사용자 관리"
            count={filteredUsers.length}
            open={openSections.users}
            onToggle={() => toggleSection("users")}
          />
          {openSections.users ? (
            <div className="admin-table">
              {filteredUsers.map((user) => {
                const isBlocked = user.status === "blocked";
                const action = isBlocked ? "active" : "blocked";
                const key = `user-${user.id}-${action}`;

                return (
                  <div key={user.id} className="admin-row">
                    <div className="admin-row__main">
                      <strong>{user.nickname}</strong>
                      <span>{user.email}</span>
                      <div className="admin-row__meta">
                        <span
                          className={
                            user.role === "admin"
                              ? "admin-badge"
                              : "admin-badge admin-badge--muted"
                          }
                        >
                          {user.role}
                        </span>
                        <small>{user.status}</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="button button--secondary button--compact admin-row__action"
                      disabled={user.role === "admin" || actionKey === key}
                      onClick={() =>
                        void runAction(key, () => updateAdminUserStatus(user.id, action))
                      }
                    >
                      {isBlocked ? <UserCheck size={14} /> : <Ban size={14} />}
                      {isBlocked ? "해제" : "차단"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </article>

        <article className="panel admin-table-card">
          <SectionToggle
            title="일정 관리"
            count={filteredTrips.length}
            open={openSections.trips}
            onToggle={() => toggleSection("trips")}
          />
          {openSections.trips ? (
            <div className="admin-table">
              {filteredTrips.map((trip) => {
                const key = `trip-${trip.id}-delete`;

                return (
                  <div key={trip.id} className="admin-row">
                    <div className="admin-row__main">
                      <strong>{trip.title}</strong>
                      <span>{trip.destination}</span>
                      <div className="admin-row__meta">
                        <small>{trip.owner}</small>
                        <small>{trip.isPublic ? "public" : trip.status}</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="button button--ghost button--compact admin-row__action"
                      disabled={actionKey === key}
                      onClick={() => {
                        if (
                          window.confirm("이 일정을 삭제할까요? 연결된 커뮤니티 글도 함께 삭제됩니다.")
                        ) {
                          void runAction(key, () => deleteAdminTrip(trip.id));
                        }
                      }}
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </article>

        <article className="panel admin-table-card">
          <SectionToggle
            title="커뮤니티 관리"
            count={filteredRoutes.length}
            open={openSections.routes}
            onToggle={() => toggleSection("routes")}
          />
          {openSections.routes ? (
            <div className="admin-table">
              {filteredRoutes.map((route) => {
                const isHidden = route.status === "hidden";
                const nextStatus = isHidden ? "published" : "hidden";
                const key = `route-${route.id}-${nextStatus}`;

                return (
                  <div key={route.id} className="admin-row">
                    <div className="admin-row__main">
                      <strong>{route.title}</strong>
                      <span>{route.author}</span>
                      <div className="admin-row__meta">
                        <small>좋아요 {route.likes}</small>
                        <small>댓글 {route.comments}</small>
                        <small>{route.status}</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="button button--secondary button--compact admin-row__action"
                      disabled={actionKey === key}
                      onClick={() =>
                        void runAction(key, () =>
                          updateAdminCommunityRouteStatus(route.id, nextStatus),
                        )
                      }
                    >
                      {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      {isHidden ? "공개" : "숨김"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
