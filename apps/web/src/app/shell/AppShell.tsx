import { useEffect, useState } from "react";
import { UserCircle2 } from "lucide-react";
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

const shellBackdropImage =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000";

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
    <div className={isHomePage ? "app-shell app-shell--home" : "app-shell app-shell--immersive"}>
      {!isHomePage ? (
        <>
          <div
            className="app-shell__backdrop"
            style={{ backgroundImage: `url(${shellBackdropImage})` }}
          />
          <div className="app-shell__backdrop-overlay" />
        </>
      ) : null}

      <header className={isHomePage ? "topbar topbar--overlay" : "topbar topbar--immersive"}>
        <NavLink to="/home" className="brand brand--wordmark">
          <strong className="brand__wordmark">TripFlow</strong>
        </NavLink>

        <nav className={isHomePage ? "nav nav--overlay" : "nav nav--immersive"}>
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
            className={isHomePage ? "profile-link profile-link--overlay" : "profile-link profile-link--immersive"}
          >
            <UserCircle2 size={18} />
            {authUser ? "마이페이지" : "로그인"}
          </NavLink>
        </div>
      </header>

      <main className={isHomePage ? "page-frame page-frame--home" : "page-frame page-frame--immersive"}>
        <div className="page-frame__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
