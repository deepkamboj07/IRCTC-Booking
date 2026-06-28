# Phase 9 — Seat Selection + Hold + Booking Form

## Goal
Build the core booking UX:
1. **SeatSelectionPage** — shows coach seat grid, user clicks seats, creates a 5-min Redis hold
2. **HoldCountdown** — orange banner counting down from 5:00
3. **BookingFormPage** — passenger details form per held seat
4. **BookingConfirmPage** — green success screen with PNR

## Files to Create
```
frontend/src/
├── shared/api/
│   ├── seat-holds.api.ts
│   └── bookings.api.ts
└── apps/passenger/
    ├── pages/
    │   ├── seat-selection/
    │   │   └── SeatSelectionPage.tsx
    │   └── booking/
    │       ├── BookingFormPage.tsx
    │       └── BookingConfirmPage.tsx
    └── components/
        ├── seat-selection/
        │   ├── ClassSelector.tsx
        │   └── SeatMap.tsx
        └── booking/
            ├── HoldCountdown.tsx
            ├── PassengerForm.tsx
            └── BookingFareSummary.tsx
```

---

## 1. `src/shared/api/seat-holds.api.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api.client";
import { trainKeys } from "./trains.api";

export interface HoldResult {
  holdId: string;
  expiresAt: string;
  seatIds: string[];
}

interface CreateHoldPayload {
  scheduleId: string;
  coachId: string;
  fromStationId: string;
  toStationId: string;
  seatIds: string[];
}

export const holdKeys = {
  detail: (holdId: string) => ["seat-holds", holdId] as const,
};

export function useCreateHold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHoldPayload) =>
      api.post<{ data: HoldResult }>("/seat-holds", payload).then(r => r.data.data),
    onSuccess: (_, vars) => {
      // Invalidate seat map so newly held seats show as HELD
      queryClient.invalidateQueries({ queryKey: ["trains"] });
    },
  });
}

export function useHoldStatus(holdId: string) {
  return useQuery({
    queryKey: holdKeys.detail(holdId),
    queryFn: () =>
      api.get<{ data: { ttlSeconds: number; seatIds: string[] } }>(`/seat-holds/${holdId}`)
         .then(r => r.data.data),
    enabled: !!holdId,
    refetchInterval: 5_000,  // Check TTL every 5 seconds
  });
}

export function useReleaseHold() {
  return useMutation({
    mutationFn: (holdId: string) => api.delete(`/seat-holds/${holdId}`),
  });
}
```

---

## 2. `src/shared/api/bookings.api.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api.client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PassengerPayload {
  seatId: string;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
}

export interface Booking {
  id: string;
  pnr: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "WAITLISTED";
  totalFare: number;
  createdAt: string;
  schedule: {
    journeyDate: string;
    train: { trainNumber: string; name: string };
  };
  fromStation: { code: string; name: string };
  toStation:   { code: string; name: string };
  passengers: Array<{
    id: string; name: string; age: number; gender: string; status: string;
    seat: { seatNumber: number; berthType: string; coachId: string };
  }>;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const bookingKeys = {
  all:    ["bookings"] as const,
  list:   (params: object) => ["bookings", "list", params] as const,
  detail: (id: string) => ["bookings", id] as const,
  pnr:    (pnr: string) => ["bookings", "pnr", pnr] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useConfirmBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { holdId: string; passengers: PassengerPayload[] }) =>
      api.post<{ data: { booking: Booking; pnr: string } }>("/bookings", payload)
         .then(r => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useMyBookings(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () =>
      api.get<{ data: { data: Booking[]; meta: { total: number; totalPages: number } } }>(
        "/bookings", { params }
      ).then(r => r.data.data),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () =>
      api.get<{ data: Booking }>(`/bookings/${id}`).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useBookingByPnr(pnr: string) {
  return useQuery({
    queryKey: bookingKeys.pnr(pnr),
    queryFn: () =>
      api.get<{ data: Booking }>(`/bookings/pnr/${pnr}`).then(r => r.data.data),
    enabled: !!pnr,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ data: Booking }>(`/bookings/${id}/cancel`).then(r => r.data.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
```

---

## 3. `src/apps/passenger/components/seat-selection/SeatMap.tsx`

This is the seat grid component. Each seat is a button with 4 states.

```tsx
import { useState } from "react";
import { SeatMapEntry } from "../../../../shared/api/trains.api";
import { cn } from "../../../../lib/utils";

const SEAT_STYLES: Record<SeatMapEntry["status"] | "SELECTED", string> = {
  AVAILABLE: "bg-green-50 border-green-400 text-green-700 hover:bg-green-100 cursor-pointer",
  SELECTED:  "bg-brand-primary border-brand-primary text-white ring-2 ring-blue-300",
  HELD:      "bg-amber-50 border-amber-400 text-amber-700 cursor-not-allowed",
  BOOKED:    "bg-red-50 border-red-300 text-red-400 cursor-not-allowed",
};

const BERTH_SHORT: Record<string, string> = {
  LOWER: "LB", MIDDLE: "MB", UPPER: "UB",
  SIDE_LOWER: "SL", SIDE_UPPER: "SU",
};

interface SeatMapProps {
  seats: SeatMapEntry[];
  selectedSeatIds: string[];
  maxSelectable: number;
  onToggle: (seatId: string) => void;
}

export function SeatMap({ seats, selectedSeatIds, maxSelectable, onToggle }: SeatMapProps) {
  const selectedSet = new Set(selectedSeatIds);

  // Group into compartments of 8 (6 main + 2 side)
  const compartments: SeatMapEntry[][] = [];
  for (let i = 0; i < seats.length; i += 8) {
    compartments.push(seats.slice(i, i + 8));
  }

  return (
    <div className="space-y-4">
      {compartments.map((group, ci) => (
        <div key={ci} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-400 mb-2">Compartment {ci + 1}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {group.map(seat => {
              const isSelected = selectedSet.has(seat.id);
              const canSelect  = seat.status === "AVAILABLE" &&
                (isSelected || selectedSeatIds.length < maxSelectable);

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={seat.status !== "AVAILABLE" && !isSelected}
                  onClick={() => canSelect && onToggle(seat.id)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded border p-1.5 text-xs transition-all",
                    isSelected ? SEAT_STYLES.SELECTED : SEAT_STYLES[seat.status],
                    !canSelect && seat.status === "AVAILABLE" && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <span className="font-bold">{seat.seatNumber}</span>
                  <span className="text-[10px] opacity-80">{BERTH_SHORT[seat.berthType] ?? seat.berthType}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 4. `src/apps/passenger/components/booking/HoldCountdown.tsx`

```tsx
import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HoldCountdownProps {
  expiresAt: string;    // ISO string
  onExpired?: () => void;
}

export function HoldCountdown({ expiresAt, onExpired }: HoldCountdownProps) {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    if (remaining <= 0) {
      onExpired?.();
      return;
    }
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id);
          onExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");
  const isUrgent = remaining < 60;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
      isUrgent
        ? "bg-red-50 border-red-300 text-red-700"
        : "bg-orange-50 border-orange-300 text-orange-700"
    }`}>
      {isUrgent ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <Clock className="w-4 h-4 flex-shrink-0" />}
      <span>Seats held for</span>
      <span className="font-mono font-bold text-lg tracking-widest text-brand-accent">
        {mins}:{secs}
      </span>
      <span>— complete your booking before time runs out</span>
    </div>
  );
}
```

---

## 5. `src/apps/passenger/components/booking/PassengerForm.tsx`

Uses `useFieldArray` for dynamic per-seat passenger forms.

```tsx
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import { Input } from "../../../../shared/components/ui/input";
import { Field } from "../../../../shared/components/ui/Field";
import { SectionCard } from "../../../../shared/components/ui/SectionCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../shared/components/ui/select";
import { useConfirmBooking } from "../../../../shared/api/bookings.api";
import { extractError } from "../../../../shared/utils/extractError";

const passengerSchema = z.object({
  seatId: z.string(),
  name:   z.string().min(2, "Name required"),
  age:    z.coerce.number().int().positive("Valid age required").max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
});

const formSchema = z.object({
  passengers: z.array(passengerSchema),
});
type FormValues = z.infer<typeof formSchema>;

interface PassengerFormProps {
  holdId: string;
  seatIds: string[];
  seatNumberMap: Record<string, number>;  // seatId → seatNumber (for display)
  onSuccess: (pnr: string) => void;
}

export function PassengerForm({ holdId, seatIds, seatNumberMap, onSuccess }: PassengerFormProps) {
  const confirmBooking = useConfirmBooking();

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, setError } =
    useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        passengers: seatIds.map(seatId => ({ seatId, name: "", age: undefined as unknown as number, gender: "MALE" as const })),
      },
    });

  const { fields } = useFieldArray({ control, name: "passengers" });

  async function onSubmit(values: FormValues) {
    try {
      const result = await confirmBooking.mutateAsync({ holdId, passengers: values.passengers });
      onSuccess(result.pnr);
    } catch (err) {
      setError("root", { message: extractError(err) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field, i) => (
        <SectionCard key={field.id} title={`Passenger ${i + 1} — Seat ${seatNumberMap[field.seatId] ?? field.seatId}`}>
          <input type="hidden" {...register(`passengers.${i}.seatId`)} />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field label="Full Name" required error={errors.passengers?.[i]?.name?.message}>
                <Input {...register(`passengers.${i}.name`)} placeholder="As on ID proof" />
              </Field>
            </div>
            <Field label="Age" required error={errors.passengers?.[i]?.age?.message}>
              <Input type="number" {...register(`passengers.${i}.age`)} placeholder="25" min={1} max={120} />
            </Field>
            <Field label="Gender" required error={errors.passengers?.[i]?.gender?.message}>
              {/* Use shadcn Select with react-hook-form Controller */}
            </Field>
          </div>
        </SectionCard>
      ))}

      {errors.root && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {errors.root.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 flex items-center gap-4">
        <Button type="submit" className="bg-brand-accent hover:bg-brand-accentHov text-white" disabled={isSubmitting}>
          {isSubmitting ? "Confirming…" : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}
```

---

## 6. Pages

### `SeatSelectionPage.tsx` (thin shell — reads URL params, passes to components)

```tsx
// URL params: /seats/:scheduleId/:coachId?trainId=&from=&to=&date=&class=
// This page:
// 1. Fetches seat map via useSeatMap
// 2. Manages selected seat IDs in local state
// 3. On "Hold Seats" click → calls useCreateHold
// 4. On success → navigate to /booking/form?holdId=...&expiresAt=...
```

### `BookingFormPage.tsx` (thin shell)

```tsx
// URL search params: ?holdId=...&expiresAt=...&scheduleId=...&coachId=...&seatIds=...
// This page:
// 1. Shows HoldCountdown at the top
// 2. On countdown hit 0 → navigate to /seats/... with toast "Your hold expired"
// 3. Shows PassengerForm
// 4. On PassengerForm success (gets PNR) → navigate to /booking/confirm/:pnr
```

### `BookingConfirmPage.tsx` (thin shell)

```tsx
// URL params: /booking/confirm/:pnr
// Fetches booking by PNR via useBookingByPnr
// Shows:
// - Green checkmark + "Booking Confirmed!"
// - PNR in large mono font: font-mono font-bold tracking-widest text-4xl in bg-green-50 rounded-xl
// - Passenger list table
// - "View My Bookings" button + "Back to Home" link
```

---

## State Flow (Critical — Read This)

```
SeatSelectionPage
  → user selects seats (local state: selectedSeatIds[])
  → "Hold Seats" button click
  → useCreateHold.mutateAsync({ scheduleId, coachId, fromStationId, toStationId, seatIds })
  → success: { holdId, expiresAt, seatIds }
  → navigate("/booking/form", { state: { holdId, expiresAt, seatIds, scheduleId, coachId } })
    (use React Router location state, NOT query params, to avoid exposing seatIds in URL)

BookingFormPage
  → reads location.state for holdId, expiresAt, seatIds
  → If location.state is null (direct URL access) → redirect to /
  → Shows HoldCountdown with expiresAt
  → HoldCountdown hits 0 → navigate to /search with message

BookingConfirmPage
  → reads :pnr from URL param
  → useBookingByPnr(pnr) to fetch full booking details
```

---

## Seat Legend (Show on SeatSelectionPage)

```tsx
const LEGEND = [
  { status: "AVAILABLE", label: "Available",  style: "bg-green-50 border-green-400" },
  { status: "SELECTED",  label: "Selected",   style: "bg-brand-primary border-brand-primary" },
  { status: "HELD",      label: "Held (5min)",style: "bg-amber-50 border-amber-400" },
  { status: "BOOKED",    label: "Booked",     style: "bg-red-50 border-red-300" },
];
```

---

## Verification Checklist

- Select a class on SearchResultsPage → navigates to SeatSelectionPage
- Seat grid shows green/amber/red seats correctly
- Clicking a seat selects it (turns blue), clicking again deselects
- Cannot select more seats than a cap (set to 6)
- "Hold Seats" → creates Redis hold → navigates to BookingFormPage
- HoldCountdown ticks down from 5:00
- When hold expires → countdown shows red, redirects back
- Fill passenger form → "Confirm Booking" → navigates to BookingConfirmPage
- BookingConfirmPage shows PNR in large mono font with green success card
- Back in seat map: the confirmed seats now show as BOOKED

## Gotchas
- Pass hold data via `navigate(path, { state: {...} })` NOT query params — holdId in URL is a security leak
- `useFieldArray` requires `name` to match the exact path in the schema
- `HoldCountdown` uses `setInterval` — always clear it in the `useEffect` cleanup to avoid memory leaks
- The seat map `refetchInterval: 10_000` means other users' holds appear within 10s without user action
- Shadcn `Select` must be wrapped in a `Controller` from react-hook-form, not `register()`
- After successful booking, DEL Redis keys happens on the BACKEND — frontend just navigates away
