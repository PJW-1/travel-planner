import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type QuickActionCardProps = {
  to: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  accentClass: string;
};

export function QuickActionCard({ to, title, subtitle, icon, accentClass }: QuickActionCardProps) {
  return (
    <Link to={to} className={`quick-action ${accentClass}`}>
      <div className="quick-action__icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </Link>
  );
}
