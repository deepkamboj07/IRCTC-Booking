import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Calendar, Search } from "lucide-react";
import { Button, buttonVariants } from "../../../../shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../shared/components/ui/popover";
import { Calendar as CalendarUI } from "../../../../shared/components/ui/calendar";
import { StationCombobox } from "../../../../shared/components/station-combobox/StationCombobox";
import type { Station } from "../../../../shared/api/stations.api";
import { toApiDate, formatDate } from "../../../../shared/utils/date.utils";
import { cn } from "../../../../shared/utils/cn";

export function SearchForm() {
  const navigate = useNavigate();
  const [from, setFrom] = useState<Station | null>(null);
  const [to, setTo] = useState<Station | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);

  function swapStations() {
    setFrom(to);
    setTo(from);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to || !date) return;
    navigate(`/search?from=${from.code}&to=${to.code}&date=${toApiDate(date)}`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr] gap-3 items-end">
        {/* From */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            From
          </label>
          <StationCombobox
            value={from}
            onChange={setFrom}
            placeholder="Origin station"
            excludeStation={to}
          />
        </div>

        {/* Swap */}
        <button
          type="button"
          onClick={swapStations}
          className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-brand-light hover:border-brand-primary transition-colors self-end"
        >
          <ArrowLeftRight className="w-4 h-4 text-brand-primary" />
        </button>

        {/* To */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            To
          </label>
          <StationCombobox
            value={to}
            onChange={setTo}
            placeholder="Destination station"
            excludeStation={from}
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Journey Date
          </label>
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full h-10 justify-start font-normal text-left text-slate-700"
              )}
            >
              <Calendar className="mr-2 w-4 h-4 text-slate-400" />
              {date ? (
                formatDate(date)
              ) : (
                <span className="text-slate-400">Pick a date</span>
              )}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <CalendarUI
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setCalOpen(false);
                }}
                disabled={(d) => d < today}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="submit"
          disabled={!from || !to || !date}
          className="bg-brand-accent hover:bg-brand-accentHov text-white px-8 h-11"
        >
          <Search className="w-4 h-4 mr-2" />
          Search Trains
        </Button>
      </div>
    </form>
  );
}
