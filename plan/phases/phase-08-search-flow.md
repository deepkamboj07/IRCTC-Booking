# Phase 8 — Search Flow

## Goal
Build the complete train search experience:
- `HomePage` — hero banner with search form
- `SearchResultsPage` — list of trains with class availability cards
- `StationCombobox` — autocomplete combobox (shared, used in search + booking)
- `TrainCard` — individual train result card
- `TrainListFilters` — filter bar (train type, sort)

## Files to Create
```
frontend/src/
├── shared/
│   ├── api/
│   │   ├── trains.api.ts
│   │   └── stations.api.ts
│   └── components/
│       └── station-combobox/
│           └── StationCombobox.tsx
└── apps/passenger/
    ├── pages/
    │   ├── home/
    │   │   └── HomePage.tsx
    │   └── search-results/
    │       └── SearchResultsPage.tsx
    └── components/
        ├── home/
        │   └── SearchForm.tsx
        └── search-results/
            ├── TrainCard.tsx
            └── TrainListFilters.tsx
```

Wire up in `App.tsx`: replace placeholders for `/` and `/search`.

---

## 1. `src/shared/api/stations.api.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api.client";

export interface Station {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
}

export const stationKeys = {
  all: ["stations"] as const,
  list: (search: string) => ["stations", "list", search] as const,
};

export function useStations(search: string) {
  return useQuery({
    queryKey: stationKeys.list(search),
    queryFn: () =>
      api.get<{ data: { data: Station[] } }>("/stations", {
        params: { search, limit: 10 },
      }).then(r => r.data.data.data),
    enabled: search.length >= 2,
    staleTime: 60_000,
  });
}
```

---

## 2. `src/shared/api/trains.api.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api.client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClassAvailability {
  name: "SLEEPER" | "AC_3TIER" | "AC_2TIER" | "AC_FIRST_CLASS";
  displayName: string;
  available: number;
  coachIds: string[];
}

export interface TrainSearchResult {
  train: { id: string; trainNumber: string; name: string; type: string };
  schedule: { id: string; status: string };
  departure: { station: { code: string; name: string }; time: string; distanceKm: number };
  arrival:   { station: { code: string; name: string }; time: string; distanceKm: number };
  distanceKm: number;
  classes: ClassAvailability[];
}

export interface SeatMapEntry {
  id: string;
  seatNumber: number;
  berthType: "LOWER" | "MIDDLE" | "UPPER" | "SIDE_LOWER" | "SIDE_UPPER";
  status: "AVAILABLE" | "HELD" | "BOOKED";
}

interface SearchParams {
  from: string;
  to: string;
  date: string;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const trainKeys = {
  search: (params: SearchParams) => ["trains", "search", params] as const,
  detail: (id: string) => ["trains", id] as const,
  seatMap: (trainId: string, scheduleId: string, coachId: string) =>
    ["trains", trainId, "schedules", scheduleId, "coaches", coachId, "seats"] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSearchTrains(params: SearchParams) {
  return useQuery({
    queryKey: trainKeys.search(params),
    queryFn: () =>
      api.get<{ data: TrainSearchResult[] }>("/trains/search", { params })
         .then(r => r.data.data),
    enabled: !!params.from && !!params.to && !!params.date,
    staleTime: 60_000,
  });
}

export function useSeatMap(trainId: string, scheduleId: string, coachId: string) {
  return useQuery({
    queryKey: trainKeys.seatMap(trainId, scheduleId, coachId),
    queryFn: () =>
      api.get<{ data: SeatMapEntry[] }>(
        `/trains/${trainId}/schedules/${scheduleId}/coaches/${coachId}/seats`
      ).then(r => r.data.data),
    enabled: !!trainId && !!scheduleId && !!coachId,
    refetchInterval: 10_000, // Poll every 10s to refresh HELD/AVAILABLE state
  });
}
```

---

## 3. `src/shared/components/station-combobox/StationCombobox.tsx`

Uses shadcn `Popover` + `Command` for autocomplete.

```tsx
import { useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../../lib/utils";
import { useStations, Station } from "../../api/stations.api";
import { useDebounce } from "../../hooks/useDebounce";

interface StationComboboxProps {
  value?: Station | null;
  onChange: (station: Station | null) => void;
  placeholder?: string;
  excludeStation?: Station | null;  // Prevent selecting same station twice
}

export function StationCombobox({ value, onChange, placeholder = "Select station", excludeStation }: StationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data: stations = [], isLoading } = useStations(debouncedSearch);
  const filtered = stations.filter(s => s.id !== excludeStation?.id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal h-10"
        >
          {value ? (
            <span className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-brand-primary" />
              <span className="font-medium">{value.code}</span>
              <span className="text-slate-500 text-sm">{value.name}</span>
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type station name or code..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Searching...</CommandEmpty>}
            {!isLoading && filtered.length === 0 && (
              <CommandEmpty>No station found. Type at least 2 characters.</CommandEmpty>
            )}
            <CommandGroup>
              {filtered.map(station => (
                <CommandItem
                  key={station.id}
                  value={station.id}
                  onSelect={() => {
                    onChange(station);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value?.id === station.id ? "opacity-100" : "opacity-0")}
                  />
                  <div>
                    <p className="font-medium">{station.code} — {station.name}</p>
                    <p className="text-xs text-slate-500">{station.city}, {station.state}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

---

## 4. `src/apps/passenger/components/home/SearchForm.tsx`

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Calendar, Search } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../shared/components/ui/popover";
import { Calendar as CalendarUI } from "../../../../shared/components/ui/calendar";
import { StationCombobox } from "../../../../shared/components/station-combobox/StationCombobox";
import { Station } from "../../../../shared/api/stations.api";
import { toApiDate, formatDate } from "../../../../shared/utils/date.utils";

export function SearchForm() {
  const navigate = useNavigate();
  const [from, setFrom] = useState<Station | null>(null);
  const [to,   setTo]   = useState<Station | null>(null);
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

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr] gap-3 items-end">
        {/* From */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From</label>
          <StationCombobox value={from} onChange={setFrom} placeholder="Origin station" excludeStation={to} />
        </div>

        {/* Swap button */}
        <button
          type="button"
          onClick={swapStations}
          className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-brand-light hover:border-brand-primary transition-colors self-end"
        >
          <ArrowLeftRight className="w-4 h-4 text-brand-primary" />
        </button>

        {/* To */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To</label>
          <StationCombobox value={to} onChange={setTo} placeholder="Destination station" excludeStation={from} />
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Journey Date</label>
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal h-10 text-left">
                <Calendar className="mr-2 w-4 h-4 text-slate-400" />
                {date ? formatDate(date) : <span className="text-slate-400">Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <CalendarUI
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setCalOpen(false); }}
                disabled={(d) => d < today}
                initialFocus
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
```

---

## 5. `src/apps/passenger/pages/home/HomePage.tsx` (Thin shell)

```tsx
import { SearchForm } from "../../components/home/SearchForm";

export function HomePage() {
  return (
    <div>
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-brand-primary to-blue-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Book Train Tickets</h1>
          <p className="text-blue-200 mt-2 text-lg">Fast, easy, reliable railway booking</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <SearchForm />
        </div>
      </div>
    </div>
  );
}
```

---

## 6. `src/apps/passenger/components/search-results/TrainCard.tsx`

```tsx
import { useNavigate } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "../../../../shared/components/ui/badge";
import { Button } from "../../../../shared/components/ui/button";
import { TrainSearchResult } from "../../../../shared/api/trains.api";

const CLASS_LABELS: Record<string, string> = {
  SLEEPER:       "SL",
  AC_3TIER:      "3A",
  AC_2TIER:      "2A",
  AC_FIRST_CLASS:"1A",
};

interface TrainCardProps {
  result: TrainSearchResult;
  fromCode: string;
  toCode: string;
  date: string;
}

export function TrainCard({ result, fromCode, toCode, date }: TrainCardProps) {
  const navigate = useNavigate();
  const { train, schedule, departure, arrival, distanceKm, classes } = result;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-brand-primary transition-colors">
      {/* Left accent bar */}
      <div className="flex">
        <div className="w-1 bg-brand-primary flex-shrink-0" />
        <div className="flex-1 p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-bold text-slate-900 text-lg">{train.name}</p>
              <p className="text-sm text-slate-500">{train.trainNumber} · {train.type}</p>
            </div>
            <p className="text-sm text-slate-500">{distanceKm} km</p>
          </div>

          {/* Journey row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-slate-900">{departure.time}</p>
              <p className="text-xs font-semibold text-slate-600">{departure.station.code}</p>
              <p className="text-xs text-slate-400">{departure.station.name}</p>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-slate-900">{arrival.time}</p>
              <p className="text-xs font-semibold text-slate-600">{arrival.station.code}</p>
              <p className="text-xs text-slate-400">{arrival.station.name}</p>
            </div>
          </div>

          {/* Classes row */}
          <div className="flex items-center gap-3 flex-wrap">
            {classes.map((cls) => (
              <button
                key={cls.name}
                onClick={() => navigate(`/seats/${schedule.id}/${cls.coachIds[0]}?trainId=${train.id}&from=${fromCode}&to=${toCode}&date=${date}&class=${cls.name}`)}
                disabled={cls.available === 0}
                className="flex flex-col items-center px-4 py-2 rounded-lg border border-slate-200 hover:border-brand-primary hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-700">{CLASS_LABELS[cls.name] ?? cls.name}</span>
                <span className="text-xs text-slate-500">{cls.displayName}</span>
                <span className={`text-xs font-semibold mt-0.5 ${cls.available > 0 ? "text-green-600" : "text-red-500"}`}>
                  {cls.available > 0 ? `${cls.available} avail.` : "Full"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. `src/apps/passenger/pages/search-results/SearchResultsPage.tsx` (Thin shell)

```tsx
import { useSearchParams } from "react-router-dom";
import { Train } from "lucide-react";
import { useSearchTrains } from "../../../../shared/api/trains.api";
import { TrainCard } from "../../components/search-results/TrainCard";

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const to   = searchParams.get("to")   ?? "";
  const date = searchParams.get("date") ?? "";

  const { data: trains, isLoading, isError } = useSearchTrains({ from, to, date });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {from} → {to}
        </h1>
        <p className="text-slate-500 mt-1">{date} · {trains?.length ?? 0} trains found</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          Failed to load trains. Please try again.
        </div>
      )}

      {!isLoading && trains?.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Train className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No trains found for this route on {date}</p>
        </div>
      )}

      <div className="space-y-4">
        {trains?.map((result, i) => (
          <TrainCard key={i} result={result} fromCode={from} toCode={to} date={date} />
        ))}
      </div>
    </div>
  );
}
```

---

## Wire up in `App.tsx`
```tsx
import { HomePage }           from "./apps/passenger/pages/home/HomePage";
import { SearchResultsPage }  from "./apps/passenger/pages/search-results/SearchResultsPage";

<Route path="/"       element={<HomePage />} />
<Route path="/search" element={<SearchResultsPage />} />
```

---

## Verification Checklist

- Home page shows navy gradient hero + white search card
- StationCombobox shows dropdown when typing 2+ characters, shows station code + name
- Swap button swaps from/to stations
- Date picker disables past dates
- "Search Trains" button navigates to `/search?from=NDLS&to=CSMT&date=2026-07-15`
- Search results show train cards with class availability badges
- Class badge click navigates to seat selection
- Loading skeleton shows while fetching
- "No trains found" state shows when no results

## Gotchas
- `useSearchTrains` is `enabled` only when all 3 params exist — prevents spurious requests
- `refetchInterval: 10_000` on seat map query keeps availability fresh without user refresh
- Station combobox uses `shouldFilter={false}` — filtering is done server-side via the API search query
- The `date` query param from the URL is a string "YYYY-MM-DD" — pass it as-is to the API
