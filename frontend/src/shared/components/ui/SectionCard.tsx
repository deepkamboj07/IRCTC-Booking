import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  overflowVisible?: boolean;
}

export function SectionCard({ title, icon, children, overflowVisible }: SectionCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${
        overflowVisible ? "" : "overflow-hidden"
      }`}
    >
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        {icon && <span className="text-brand-primary">{icon}</span>}
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
