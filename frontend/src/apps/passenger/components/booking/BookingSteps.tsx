import { LayoutGrid, ClipboardList, CheckCircle2 } from "lucide-react";

const STEPS = [
  { label: "Select Seats",      icon: LayoutGrid },
  { label: "Passenger Details", icon: ClipboardList },
  { label: "Confirmed",         icon: CheckCircle2 },
];

interface BookingStepsProps {
  current: 1 | 2 | 3;
}

export function BookingSteps({ current }: BookingStepsProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map(({ label, icon: Icon }, idx) => {
        const step = idx + 1;
        const done = step < current;
        const active = step === current;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done
                    ? "bg-brand-primary border-brand-primary"
                    : active
                    ? "bg-brand-primary border-brand-primary"
                    : "bg-white border-slate-300"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    done || active ? "text-white" : "text-slate-400"
                  }`}
                />
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  active ? "text-brand-primary" : done ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 ${
                  done ? "bg-brand-primary" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
