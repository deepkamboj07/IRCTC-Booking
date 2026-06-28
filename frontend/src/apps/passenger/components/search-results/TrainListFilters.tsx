import { SlidersHorizontal, X } from "lucide-react";
import { Switch } from "../../../../shared/components/ui/switch";

type TrainType = "ALL" | "EXPRESS" | "SUPERFAST" | "LOCAL";
type SortBy = "departure" | "duration" | "availability";

interface TrainListFiltersProps {
  trainType: TrainType;
  sortBy: SortBy;
  showAvailableOnly: boolean;
  onTrainTypeChange: (type: TrainType) => void;
  onSortByChange: (sort: SortBy) => void;
  onAvailableOnlyChange: (v: boolean) => void;
  onClear: () => void;
}

const TRAIN_TYPES: { label: string; value: TrainType }[] = [
  { label: "All Trains",  value: "ALL"       },
  { label: "Express",     value: "EXPRESS"   },
  { label: "Superfast",   value: "SUPERFAST" },
  { label: "Local",       value: "LOCAL"     },
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: "Departure Time", value: "departure"    },
  { label: "Duration",       value: "duration"     },
  { label: "Availability",   value: "availability" },
];

function RadioRow({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
        checked
          ? "bg-brand-light border border-brand-primary/30 text-brand-primary"
          : "hover:bg-slate-50 text-slate-700 border border-transparent"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${
          checked ? "border-brand-primary bg-brand-primary" : "border-slate-300"
        }`}
      />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export function TrainListFilters({
  trainType,
  sortBy,
  showAvailableOnly,
  onTrainTypeChange,
  onSortByChange,
  onAvailableOnlyChange,
  onClear,
}: TrainListFiltersProps) {
  const isFiltered = trainType !== "ALL" || sortBy !== "departure" || showAvailableOnly;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800 text-sm">Filters</span>
        </div>
        {isFiltered && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-hover font-medium transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Train Type */}
      <div className="px-4 py-4 border-b border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-1">
          Train Type
        </p>
        <div className="space-y-1">
          {TRAIN_TYPES.map((t) => (
            <RadioRow
              key={t.value}
              label={t.label}
              checked={trainType === t.value}
              onClick={() => onTrainTypeChange(t.value)}
            />
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="px-4 py-4 border-b border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 px-1">
          Sort By
        </p>
        <div className="space-y-1">
          {SORT_OPTIONS.map((s) => (
            <RadioRow
              key={s.value}
              label={s.label}
              checked={sortBy === s.value}
              onClick={() => onSortByChange(s.value)}
            />
          ))}
        </div>
      </div>

      {/* Availability toggle */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Available only</p>
            <p className="text-xs text-slate-400 mt-0.5">Hide fully booked trains</p>
          </div>
          <Switch checked={showAvailableOnly} onCheckedChange={onAvailableOnlyChange} />
        </div>
      </div>
    </div>
  );
}
