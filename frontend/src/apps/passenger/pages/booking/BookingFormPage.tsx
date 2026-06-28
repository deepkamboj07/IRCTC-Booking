import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import { HoldCountdown } from "../../components/booking/HoldCountdown";
import { PassengerForm } from "../../components/booking/PassengerForm";
import { BookingFareSummary } from "../../components/booking/BookingFareSummary";
import { BookingSteps } from "../../components/booking/BookingSteps";

const CLASS_LABELS: Record<string, string> = {
  SLEEPER:        "Sleeper (SL)",
  AC_3TIER:       "AC 3 Tier (3A)",
  AC_2TIER:       "AC 2 Tier (2A)",
  AC_FIRST_CLASS: "AC First Class (1A)",
};

interface BookingFormState {
  holdId: string;
  expiresAt: string;
  seatIds: string[];
  scheduleId: string;
  coachId: string;
  trainId: string;
  from: string;
  to: string;
  date: string;
  className: string;
  seatNumberMap: Record<string, number>;
}

export function BookingFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BookingFormState | null;

  if (!state?.holdId) {
    navigate("/", { replace: true });
    return null;
  }

  const { holdId, expiresAt, seatIds, from, to, date, className, seatNumberMap } = state;

  return (
    <div className="flex-1 flex flex-col bg-slate-100">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-8 py-5">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
            <button
              onClick={() => navigate("/")}
              className="hover:text-brand-primary transition-colors"
            >
              Home
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(`/search?from=${from}&to=${to}&date=${date}`)}
              className="hover:text-brand-primary transition-colors"
            >
              {from} → {to}
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(-1)}
              className="hover:text-brand-primary transition-colors"
            >
              Select Seats
            </button>
            <span>/</span>
            <span className="text-slate-700 font-medium">Passenger Details</span>
          </nav>

          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <span>{from}</span>
                <ArrowRight className="w-5 h-5 text-brand-accent" />
                <span>{to}</span>
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {date}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="px-2.5 py-0.5 rounded-full bg-brand-light text-brand-primary text-xs font-semibold">
                  {CLASS_LABELS[className] ?? className}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>
                  {seatIds.length} passenger{seatIds.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <BookingSteps current={2} />
          </div>
        </div>
      </div>

      {/* ── Hold countdown strip ─────────────────────────────────────────────── */}
      <HoldCountdown
        expiresAt={expiresAt}
        onExpired={() => navigate("/", { replace: true })}
      />

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto w-full px-6 py-6 flex gap-6 items-start">

        {/* Passenger forms */}
        <div className="flex-1 min-w-0">
          <PassengerForm
            holdId={holdId}
            seatIds={seatIds}
            seatNumberMap={seatNumberMap}
            onSuccess={(pnr) => navigate(`/booking/confirm/${pnr}`)}
          />
        </div>

        {/* Sticky sidebar */}
        <aside className="w-72 flex-shrink-0 sticky top-[4.5rem] space-y-4">
          <BookingFareSummary
            from={from}
            to={to}
            date={date}
            className={className}
            seatIds={seatIds}
            seatNumberMap={seatNumberMap}
          />
        </aside>
      </div>
    </div>
  );
}
