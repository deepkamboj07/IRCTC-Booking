import { useNavigate } from "react-router-dom";
import { Train, ChevronRight, Clock } from "lucide-react";
import { cn } from "../../../../shared/utils/cn";
import type { TrainSearchResult } from "../../../../shared/api/trains.api";

const CLASS_LABELS: Record<string, string> = {
  SLEEPER:        "SL",
  AC_3TIER:       "3A",
  AC_2TIER:       "2A",
  AC_FIRST_CLASS: "1A",
};

const TYPE_STYLES: Record<string, string> = {
  EXPRESS:   "bg-sky-100 text-sky-700 border-sky-200",
  SUPERFAST: "bg-orange-100 text-orange-700 border-orange-200",
  LOCAL:     "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function getDuration(dep: string, arr: string): string {
  const [dh, dm] = dep.split(":").map(Number);
  const [ah, am] = arr.split(":").map(Number);
  let depMins = dh * 60 + dm;
  let arrMins = ah * 60 + am;
  if (arrMins <= depMins) arrMins += 24 * 60;
  const diff = arrMins - depMins;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

function availColor(count: number): string {
  if (count === 0) return "text-red-500";
  if (count <= 20) return "text-amber-600";
  return "text-green-600";
}

interface TrainCardProps {
  result: TrainSearchResult;
  fromCode: string;
  toCode: string;
  date: string;
}

export function TrainCard({ result, fromCode, toCode, date }: TrainCardProps) {
  const navigate = useNavigate();
  const { train, schedule, departure, arrival, distanceKm, classes } = result;
  const duration = getDuration(departure.time, arrival.time);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-primary/40 transition-all overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-brand-primary/10 rounded-lg p-1.5 flex-shrink-0">
            <Train className="w-4 h-4 text-brand-primary" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-[15px] leading-tight">{train.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">#{train.trainNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
              TYPE_STYLES[train.type] ?? "bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            {train.type}
          </span>
          <span className="text-xs text-slate-400 font-medium tabular-nums">{distanceKm} km</span>
        </div>
      </div>

      {/* Journey timeline */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          {/* Departure */}
          <div className="min-w-[88px]">
            <p className="text-3xl font-bold font-mono text-slate-900 tabular-nums leading-none">
              {departure.time}
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-1.5">{departure.station.code}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{departure.station.name}</p>
          </div>

          {/* Timeline center */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {duration}
            </div>
            <div className="w-full flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-primary ring-2 ring-brand-primary/20 flex-shrink-0" />
              <div className="flex-1 h-[2px] bg-gradient-to-r from-brand-primary via-brand-primary/50 to-brand-accent" />
              <ChevronRight className="w-4 h-4 text-brand-accent flex-shrink-0 -ml-1" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">DIRECT</p>
          </div>

          {/* Arrival */}
          <div className="min-w-[88px] text-right">
            <p className="text-3xl font-bold font-mono text-slate-900 tabular-nums leading-none">
              {arrival.time}
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-1.5">{arrival.station.code}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{arrival.station.name}</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-dashed border-slate-200" />

      {/* Class availability */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
          Select Class to Book
        </p>
        <div className="flex items-center gap-2.5 flex-wrap">
          {classes.map((cls) => (
            <button
              key={cls.name}
              onClick={() =>
                navigate(
                  `/seats/${schedule.id}/${cls.coachIds[0]}?trainId=${train.id}&from=${fromCode}&to=${toCode}&date=${date}&class=${cls.name}&fromStationId=${departure.station.id}&toStationId=${arrival.station.id}`
                )
              }
              disabled={cls.available === 0}
              className={cn(
                "flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all text-center min-w-[84px]",
                cls.available > 0
                  ? "border-slate-200 hover:border-brand-primary hover:bg-brand-light cursor-pointer hover:shadow-sm"
                  : "border-slate-100 bg-slate-50/70 opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-sm font-bold text-slate-900">
                {CLASS_LABELS[cls.name] ?? cls.name}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 leading-tight">{cls.displayName}</span>
              <span className={cn("text-xs font-semibold mt-1.5", availColor(cls.available))}>
                {cls.available > 0 ? `${cls.available} avail.` : "Full"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
