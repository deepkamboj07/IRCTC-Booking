import { ArrowRight, Lock, ShieldCheck } from "lucide-react";

const CLASS_LABELS: Record<string, string> = {
  SLEEPER:        "Sleeper (SL)",
  AC_3TIER:       "AC 3 Tier (3A)",
  AC_2TIER:       "AC 2 Tier (2A)",
  AC_FIRST_CLASS: "AC First Class (1A)",
};

interface BookingFareSummaryProps {
  from: string;
  to: string;
  date: string;
  className: string;
  seatIds: string[];
  seatNumberMap: Record<string, number>;
}

export function BookingFareSummary({
  from,
  to,
  date,
  className,
  seatIds,
  seatNumberMap,
}: BookingFareSummaryProps) {
  return (
    <>
      {/* Journey summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Journey
        </p>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Route</span>
            <span className="font-semibold text-slate-900 flex items-center gap-1">
              {from}
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              {to}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Date</span>
            <span className="font-medium text-slate-700">{date}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Class</span>
            <span className="px-2 py-0.5 rounded-md bg-brand-light text-brand-primary text-xs font-semibold">
              {CLASS_LABELS[className] ?? className}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Passengers</span>
            <span className="font-medium text-slate-700">{seatIds.length}</span>
          </div>
        </div>
      </div>

      {/* Selected seats */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Selected Seats
        </p>
        <div className="flex flex-wrap gap-1.5">
          {seatIds.map((id) => (
            <div
              key={id}
              className="flex items-center gap-1 bg-brand-light rounded-lg px-3 py-1.5"
            >
              <span className="text-xs font-bold text-brand-primary tabular-nums">
                #{seatNumberMap[id] ?? "?"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fare note */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Fare
        </p>
        <div className="flex items-start gap-1.5 text-xs text-slate-500">
          <Lock className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
          Total fare is calculated and confirmed at booking
        </div>
      </div>

      {/* Security badge */}
      <div className="bg-brand-light rounded-xl border border-brand-primary/20 px-4 py-3 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-brand-primary flex-shrink-0" />
        <p className="text-[11px] text-brand-primary font-medium leading-snug">
          Booking secured with end-to-end encryption
        </p>
      </div>
    </>
  );
}
