import { Compass, MapPin, Sparkles, UserCircle2 } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/home", label: "홈" },
  { to: "/ai-lab", label: "AI 랩" },
  { to: "/planner", label: "플래너" },
  { to: "/community", label: "커뮤니티" },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/home" className="brand">
          <div className="brand__badge">
            <MapPin size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="eyebrow">지능형 여행 설계 플랫폼</p>
            <strong>Travel Master</strong>
          </div>
        </NavLink>

        <nav className="nav">
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
          <button className="ghost-chip">
            <Compass size={16} />
            한국 서비스 베타
          </button>
          <NavLink to="/my" className="profile-link">
            <UserCircle2 size={18} />내 보관함
          </NavLink>
        </div>
      </header>

      <main className="page-frame">
        <div className="hero-backdrop hero-backdrop--one" />
        <div className="hero-backdrop hero-backdrop--two" />
        <div className="page-frame__content">
          <Outlet />
        </div>
      </main>

      <button className="floating-action">
        <Sparkles size={16} />
        AI 일정 도우미
      </button>
    </div>
  );
}
