const CLASS_LABELS: Record<string, string> = {
  SLEEPER: "Sleeper (SL)",
  AC_3TIER: "AC 3 Tier (3A)",
  AC_2TIER: "AC 2 Tier (2A)",
  AC_FIRST_CLASS: "AC First Class (1A)",
};

interface ClassSelectorProps {
  className: string;
  from: string;
  to: string;
}

export function ClassSelector({ className, from, to }: ClassSelectorProps) {
  return (
    <div className="flex items-center gap-4 mb-5 bg-white rounded-xl border border-slate-200 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</span>
        <span className="px-3 py-1 rounded-lg bg-brand-light text-brand-primary text-sm font-semibold">
          {CLASS_LABELS[className] ?? className}
        </span>
      </div>
      <div className="h-4 w-px bg-slate-200" />
      <div className="flex items-center gap-1.5 text-sm text-slate-600">
        <span className="font-semibold">{from}</span>
        <span className="text-slate-400">→</span>
        <span className="font-semibold">{to}</span>
      </div>
    </div>
  );
}
