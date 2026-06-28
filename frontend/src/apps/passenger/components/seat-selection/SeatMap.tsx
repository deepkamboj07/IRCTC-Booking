import type { SeatMapEntry } from "../../../../shared/api/trains.api";
import { cn } from "../../../../shared/utils/cn";

// ─── Constants ────────────────────────────────────────────────────────────────

const BERTH_SHORT: Record<string, string> = {
  LOWER:      "LB",
  MIDDLE:     "MB",
  UPPER:      "UB",
  SIDE_LOWER: "SL",
  SIDE_UPPER: "SU",
};

const SEAT_STYLES: Record<SeatMapEntry["status"] | "SELECTED", string> = {
  AVAILABLE: "bg-green-50 border-green-400 text-green-700 hover:bg-green-100 hover:shadow-sm cursor-pointer",
  SELECTED:  "bg-brand-primary border-brand-primary text-white shadow-md ring-2 ring-brand-primary/30",
  HELD:      "bg-amber-50 border-amber-400 text-amber-700 cursor-not-allowed opacity-75",
  BOOKED:    "bg-red-50 border-red-300 text-red-400 cursor-not-allowed opacity-60",
};

// ─── SeatButton ───────────────────────────────────────────────────────────────

interface SeatButtonProps {
  seat: SeatMapEntry;
  isSelected: boolean;
  canSelect: boolean;
  onToggle: (id: string) => void;
}

function SeatButton({ seat, isSelected, canSelect, onToggle }: SeatButtonProps) {
  const disabled = !isSelected && (seat.status !== "AVAILABLE" || !canSelect);
  const style    = isSelected ? SEAT_STYLES.SELECTED : SEAT_STYLES[seat.status];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onToggle(seat.id)}
      title={`Seat ${seat.seatNumber} · ${seat.berthType.replace("_", " ")}`}
      className={cn(
        "flex flex-col items-center justify-center w-12 h-12 rounded-xl border-2 transition-all select-none",
        style,
        disabled && seat.status === "AVAILABLE" && "opacity-40 cursor-not-allowed",
      )}
    >
      <span className="font-bold text-[13px] leading-none">{seat.seatNumber}</span>
      <span className="text-[9px] mt-0.5 font-medium opacity-70">
        {BERTH_SHORT[seat.berthType] ?? "??"}
      </span>
    </button>
  );
}

// ─── Compartment ──────────────────────────────────────────────────────────────

interface CompartmentProps {
  compartmentNumber: number;
  seats: SeatMapEntry[];
  selectedSet: Set<string>;
  selectedSeatIds: string[];
  maxSelectable: number;
  onToggle: (id: string) => void;
}

const MAIN_ROWS = [
  { label: "Upper",  berth: "UPPER"  },
  { label: "Middle", berth: "MIDDLE" },
  { label: "Lower",  berth: "LOWER"  },
] as const;

function Compartment({
  compartmentNumber,
  seats,
  selectedSet,
  selectedSeatIds,
  maxSelectable,
  onToggle,
}: CompartmentProps) {
  const byBerth = seats.reduce<Record<string, SeatMapEntry[]>>((acc, s) => {
    (acc[s.berthType] ??= []).push(s);
    return acc;
  }, {});

  const mainRows  = MAIN_ROWS.filter(({ berth }) => (byBerth[berth]?.length ?? 0) > 0);
  const sideUpper = byBerth["SIDE_UPPER"] ?? [];
  const sideLower = byBerth["SIDE_LOWER"] ?? [];
  const hasSide   = sideUpper.length > 0 || sideLower.length > 0;

  const selectedInBay = seats.filter((s) => selectedSet.has(s.id)).length;

  function seatButton(seat: SeatMapEntry) {
    return (
      <SeatButton
        key={seat.id}
        seat={seat}
        isSelected={selectedSet.has(seat.id)}
        canSelect={
          seat.status === "AVAILABLE" &&
          (selectedSet.has(seat.id) || selectedSeatIds.length < maxSelectable)
        }
        onToggle={onToggle}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Bay header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/60">
        <span className="text-xs font-semibold text-slate-500">Bay {compartmentNumber}</span>
        <div className="flex items-center gap-2">
          {selectedInBay > 0 && (
            <span className="text-[10px] font-semibold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full">
              {selectedInBay} selected
            </span>
          )}
          <span className="text-[10px] text-slate-400">{seats.length} berths</span>
        </div>
      </div>

      {/* Seat layout — mirrors actual train compartment */}
      <div className="flex items-stretch p-3 gap-4">
        {/* Main berths: Upper / Middle / Lower in rows */}
        <div className="flex-1 space-y-2">
          {mainRows.map(({ label, berth }) => (
            <div key={berth} className="flex items-center gap-2.5">
              <span className="text-[10px] font-semibold text-slate-400 w-10 text-right flex-shrink-0">
                {label}
              </span>
              <div className="flex gap-1.5">
                {(byBerth[berth] ?? []).map(seatButton)}
              </div>
            </div>
          ))}
        </div>

        {/* Side berths column */}
        {hasSide && (
          <>
            <div className="w-px bg-slate-200 self-stretch" />
            <div className="flex flex-col justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-400 w-5 text-right flex-shrink-0">
                  SU
                </span>
                <div className="flex gap-1.5">{sideUpper.map(seatButton)}</div>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-400 w-5 text-right flex-shrink-0">
                  SL
                </span>
                <div className="flex gap-1.5">{sideLower.map(seatButton)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SeatMap (export) ─────────────────────────────────────────────────────────

interface SeatMapProps {
  seats: SeatMapEntry[];
  selectedSeatIds: string[];
  maxSelectable: number;
  onToggle: (seatId: string) => void;
}

export function SeatMap({ seats, selectedSeatIds, maxSelectable, onToggle }: SeatMapProps) {
  const selectedSet = new Set(selectedSeatIds);

  // Group seats into compartments of 8
  const compartments: SeatMapEntry[][] = [];
  for (let i = 0; i < seats.length; i += 8) {
    compartments.push(seats.slice(i, i + 8));
  }

  return (
    <div className="space-y-3">
      {compartments.map((group, ci) => (
        <Compartment
          key={ci}
          compartmentNumber={ci + 1}
          seats={group}
          selectedSet={selectedSet}
          selectedSeatIds={selectedSeatIds}
          maxSelectable={maxSelectable}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
