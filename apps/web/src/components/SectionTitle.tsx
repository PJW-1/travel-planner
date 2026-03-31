import type { ReactNode } from "react";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function SectionTitle({ title, subtitle, icon, action }: SectionTitleProps) {
  return (
    <div className="section-title">
      <div>
        <div className="section-title__label">
          {icon}
          <span>{title}</span>
        </div>
        {subtitle ? <p className="section-title__subtitle">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
