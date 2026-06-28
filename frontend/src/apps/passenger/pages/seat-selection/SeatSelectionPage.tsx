import { useMemo } from "react";
import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Train, X, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { useSeatMap } from "../../../../shared/api/trains.api";
import { useCreateHold } from "../../../../shared/api/seat-holds.api";
import { SeatMap } from "../../components/seat-selection/SeatMap";
import { Button } from "../../../../shared/components/ui/button";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { extractError } from "../../../../shared/utils/extractError";
import { cn } from "../../../../shared/utils/cn";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SEATS = 6;

const CLASS_LABELS: Record<string, string> = {
  SLEEPER:        "Sleeper (SL)",
  AC_3TIER:       "AC 3 Tier (3A)",
  AC_2TIER:       "AC 2 Tier (2A)",
  AC_FIRST_CLASS: "AC First Class (1A)",
};

const BERTH_SHORT: Record<string, string> = {
  LOWER: "LB", MIDDLE: "MB", UPPER: "UB",
  SIDE_LOWER: "SL", SIDE_UPPER: "SU",
};

const LEGEND = [
  { label: "Available",    style: "bg-green-50 border-green-400" },
  { label: "Selected",     style: "bg-brand-primary border-brand-primary" },
  { label: "Held (5 min)", style: "bg-amber-50 border-amber-400" },
  { label: "Booked",       style: "bg-red-50 border-red-300" },
] as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BaySkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/60">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
      <div className="p-3 space-y-2.5">
        {[1, 2, 3].map((r) => (
          <div key={r} className="flex items-center gap-2.5">
            <Skeleton className="h-3 w-10" />
            <div className="flex gap-1.5">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SeatSelectionPage() {
  const { scheduleId = "", coachId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const trainId       = searchParams.get("trainId")       ?? "";
  const from          = searchParams.get("from")          ?? "";
  const to            = searchParams.get("to")            ?? "";
  const date          = searchParams.get("date")          ?? "";
  const className     = searchParams.get("class")         ?? "";
  const fromStationId = searchParams.get("fromStationId") ?? "";
  const toStationId   = searchParams.get("toStationId")   ?? "";

  const [selectedSeatIds, setSelected] = useState<string[]>([]);
  const [holdError, setHoldError]       = useState<string | null>(null);

  const { data: seats = [], isLoading, isError, dataUpdatedAt } = useSeatMap(trainId, scheduleId, coachId);
  const createHold = useCreateHold();

  // O(1) seat lookup for the right panel
  const seatById = useMemo(
    () => Object.fromEntries(seats.map((s) => [s.id, s])),
    [seats],
  );

  function handleToggle(seatId: string) {
    setSelected((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId],
    );
  }

  async function handleHold() {
    if (!selectedSeatIds.length) return;
    setHoldError(null);
    try {
      const result = await createHold.mutateAsync({
        scheduleId, coachId, fromStationId, toStationId, seatIds: selectedSeatIds,
      });
      const seatNumberMap: Record<string, number> = {};
      seats.forEach((s) => { if (selectedSeatIds.includes(s.id)) seatNumberMap[s.id] = s.seatNumber; });
      navigate("/booking/form", {
        state: {
          holdId: result.holdId, expiresAt: result.expiresAt, seatIds: result.seatIds,
          scheduleId, coachId, trainId, from, to, date, className, seatNumberMap,
        },
      });
    } catch (err) {
      setHoldError(extractError(err));
    }
  }

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="flex-1 flex flex-col bg-slate-100">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-8 py-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
            <button onClick={() => navigate("/")} className="hover:text-brand-primary transition-colors">
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
            <span className="text-slate-700 font-medium">Select Seats</span>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <span>{from}</span>
                <ArrowRight className="w-5 h-5 text-brand-accent" />
                <span>{to}</span>
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                <span>{date}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="px-2.5 py-0.5 rounded-full bg-brand-light text-brand-primary text-xs font-semibold">
                  {CLASS_LABELS[className] ?? className}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/search?from=${from}&to=${to}&date=${date}`)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to results
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto w-full px-6 py-6 flex gap-6 items-start">

        {/* Left — scrollable seat map */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Coach header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary/10 rounded-lg p-2 flex-shrink-0">
                <Train className="w-4 h-4 text-brand-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Coach Layout</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {CLASS_LABELS[className] ?? className} · Auto-refreshes every 10s
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  {lastUpdated}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>
            </div>
          </div>

          {/* Loading skeletons */}
          {isLoading && [1, 2, 3, 4].map((i) => <BaySkeleton key={i} />)}

          {/* Error */}
          {isError && (
            <div className="bg-white rounded-xl border border-red-200 p-6 text-center shadow-sm">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="font-semibold text-red-600 text-sm">Failed to load seat map</p>
              <p className="text-slate-400 text-xs mt-1">Please refresh the page to try again.</p>
            </div>
          )}

          {/* Seat grid */}
          {!isLoading && !isError && (
            <SeatMap
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              maxSelectable={MAX_SEATS}
              onToggle={handleToggle}
            />
          )}
        </div>

        {/* Right — sticky info panel */}
        <aside className="w-72 flex-shrink-0 sticky top-[4.5rem] space-y-4">

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
            </div>
          </div>

          {/* Selection summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Selected Seats
              </p>
              <span className="text-xs font-semibold text-slate-500 tabular-nums">
                {selectedSeatIds.length} / {MAX_SEATS}
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1 mb-2">
              {Array.from({ length: MAX_SEATS }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-300",
                    i < selectedSeatIds.length ? "bg-brand-primary" : "bg-slate-200",
                  )}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mb-3">
              {selectedSeatIds.length === MAX_SEATS
                ? "Maximum reached"
                : `${MAX_SEATS - selectedSeatIds.length} more seat${MAX_SEATS - selectedSeatIds.length !== 1 ? "s" : ""} can be added`}
            </p>

            {/* Seat chips */}
            {selectedSeatIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedSeatIds.map((id) => {
                  const seat = seatById[id];
                  if (!seat) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1 bg-brand-light rounded-lg pl-2.5 pr-1.5 py-1"
                    >
                      <span className="text-xs font-bold text-brand-primary tabular-nums">
                        #{seat.seatNumber}
                      </span>
                      <span className="text-[10px] text-brand-primary/60 font-medium">
                        {BERTH_SHORT[seat.berthType]}
                      </span>
                      <button
                        onClick={() => handleToggle(id)}
                        className="ml-0.5 text-brand-primary/40 hover:text-brand-primary transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">
                Click any green seat to select it
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Legend
            </p>
            <div className="space-y-2">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-2.5">
                  <div className={cn("w-8 h-6 rounded-lg border-2 flex-shrink-0", l.style)} />
                  <span className="text-xs text-slate-600">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {holdError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{holdError}</p>
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleHold}
            disabled={selectedSeatIds.length === 0 || createHold.isPending}
            className={cn(
              "w-full h-12 text-base font-semibold transition-all",
              selectedSeatIds.length > 0
                ? "bg-brand-accent hover:bg-brand-accentHov text-white shadow-md"
                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none",
            )}
          >
            {createHold.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Holding seats…
              </span>
            ) : selectedSeatIds.length > 0 ? (
              `Hold ${selectedSeatIds.length} Seat${selectedSeatIds.length !== 1 ? "s" : ""} →`
            ) : (
              "Select seats to continue"
            )}
          </Button>

          <p className="text-center text-[10px] text-slate-400 -mt-2">
            Seats are held for 5 minutes while you fill passenger details
          </p>
        </aside>
      </div>
    </div>
  );
}
