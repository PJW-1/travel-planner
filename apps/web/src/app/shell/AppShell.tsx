import { useEffect, useState } from "react";
import { MapPin, Sparkles, UserCircle2 } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { fetchMe } from "@/lib/authApi";

const navItems = [
  { to: "/home", label: "홈" },
  { to: "/ai-lab", label: "AI 랩" },
  { to: "/planner", label: "플래너" },
  { to: "/community", label: "커뮤니티" },
];

type AuthUser = {
  userId: number;
  email: string;
  nickname: string;
  provider: string;
  status: string;
  createdAt: string;
};

export function AppShell() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/home";

  useEffect(() => {
    let isMounted = true;

    async function loadAuth() {
      try {
        const response = await fetchMe();

        if (isMounted) {
          setAuthUser(response.user);
        }
      } catch {
        if (isMounted) {
          setAuthUser(null);
        }
      }
    }

    function handleAuthChanged() {
      void loadAuth();
    }

    void loadAuth();
    window.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      isMounted = false;
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, []);

  return (
    <div className={isHomePage ? "app-shell app-shell--home" : "app-shell"}>
      <header className={isHomePage ? "topbar topbar--overlay" : "topbar"}>
        <NavLink to="/home" className="brand">
          {isHomePage ? (
            <strong className="brand__wordmark">TripFlow</strong>
          ) : (
            <>
              <div className="brand__badge">
                <MapPin size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="eyebrow">지능형 여행 설계 플랫폼</p>
                <strong>TripFlow</strong>
              </div>
            </>
          )}
        </NavLink>

        <nav className={isHomePage ? "nav nav--overlay" : "nav"}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav__link is-active" : "nav__link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar__actions">
          <NavLink
            to={authUser ? "/my" : "/login"}
            className={isHomePage ? "profile-link profile-link--overlay" : "profile-link"}
          >
            <UserCircle2 size={18} />
            {authUser ? "마이페이지" : "로그인"}
          </NavLink>
        </div>
      </header>

      <main className={isHomePage ? "page-frame page-frame--home" : "page-frame"}>
        {!isHomePage ? <div className="hero-backdrop hero-backdrop--one" /> : null}
        {!isHomePage ? <div className="hero-backdrop hero-backdrop--two" /> : null}
        <div className="page-frame__content">
          <Outlet />
        </div>
      </main>

      <button
        className={isHomePage ? "floating-action floating-action--overlay" : "floating-action"}
      >
        <Sparkles size={16} />
        AI 일정 도우미
      </button>
    </div>
  );
}
