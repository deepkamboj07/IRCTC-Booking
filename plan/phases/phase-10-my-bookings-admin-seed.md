# Phase 10 — My Bookings + Admin UI + Seed Data

## Goal
Final phase — complete the product:
1. **Passenger**: My Bookings list + Booking Detail + Cancel booking dialog
2. **Admin**: Stations CRUD, Trains CRUD + Route Editor + Coach Manager, Bookings overview
3. **Seed data**: SeatClasses, 5 stations, 2 trains, coaches, 7-day schedules, SeatAvailability

---

## Part A — My Bookings (Passenger)

### Files to Create
```
frontend/src/apps/passenger/
├── pages/my-bookings/
│   ├── MyBookingsPage.tsx
│   └── BookingDetailPage.tsx
└── components/my-bookings/
    ├── BookingCard.tsx
    └── CancelBookingDialog.tsx
```

### `MyBookingsPage.tsx` — thin shell
```tsx
// Uses useMyBookings({ page, limit: 10 })
// Shows list of BookingCard components
// Pagination with TablePagination
```

### `BookingCard.tsx`
```tsx
// Shows: PNR, train name + number, journey date, from → to, status badge, total fare
// Status badge colors:
//   CONFIRMED  → green badge
//   CANCELLED  → red badge
//   PENDING    → amber badge
//   WAITLISTED → blue badge
// Click → navigate to /my-bookings/:id
```

### `BookingDetailPage.tsx` — thin shell
```tsx
// Uses useBooking(id) or useBookingByPnr(pnr)
// Shows:
//   - PNR in large mono font (font-mono font-bold tracking-widest)
//   - Train, journey date, stations
//   - Passenger table: Name | Age | Gender | Seat | Berth | Status
//   - Total fare
//   - "Cancel Booking" button (only if status === "CONFIRMED")
```

### `CancelBookingDialog.tsx`
```tsx
// Uses shadcn Dialog
// Props: bookingId, pnr, onSuccess
// Body: "Are you sure you want to cancel booking PNR: XXXX?"
// Two buttons: "Keep Booking" (cancel dialog) / "Yes, Cancel" (calls useCancelBooking)
// On success: shows success message, invalidates bookings list
```

### Status Badge Component
```tsx
const STATUS_BADGE: Record<string, string> = {
  CONFIRMED:  "bg-green-100 text-green-800 border-green-200",
  CANCELLED:  "bg-red-100 text-red-800 border-red-200",
  PENDING:    "bg-amber-100 text-amber-800 border-amber-200",
  WAITLISTED: "bg-blue-100 text-blue-800 border-blue-200",
};

function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
```

---

## Part B — Admin UI

### Files to Create
```
frontend/src/apps/admin/
├── pages/
│   ├── dashboard/DashboardPage.tsx
│   ├── stations/
│   │   ├── StationsPage.tsx
│   │   └── StationFormPage.tsx
│   ├── trains/
│   │   ├── TrainsPage.tsx
│   │   ├── TrainFormPage.tsx
│   │   └── TrainDetailPage.tsx
│   └── bookings/
│       └── AdminBookingsPage.tsx
└── components/
    ├── stations/
    │   └── StationForm.tsx
    └── trains/
        ├── TrainForm.tsx
        ├── TrainRouteStopEditor.tsx
        └── CoachManager.tsx
```

Also add these API hooks:
```
frontend/src/shared/api/
├── stations.api.ts       ← extend with admin mutations (useCreateStation etc.)
└── admin.api.ts          ← admin trains + admin bookings hooks
```

### `src/shared/api/admin.api.ts`
```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api.client";

// ─── Train mutations ──────────────────────────────────────────────────────────

export function useCreateTrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { trainNumber: string; name: string; type: string }) =>
      api.post("/admin/trains", p).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "trains"] }),
  });
}

export function useSetRouteStops() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ trainId, stops }: { trainId: string; stops: RouteStopPayload[] }) =>
      api.put(`/admin/trains/${trainId}/route-stops`, { stops }).then(r => r.data.data),
    onSuccess: (_, { trainId }) =>
      qc.invalidateQueries({ queryKey: ["admin", "trains", trainId] }),
  });
}

export function useAddCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ trainId, ...data }: { trainId: string; coachNumber: string; seatClassId: string; totalSeats: number }) =>
      api.post(`/admin/trains/${trainId}/coaches`, data).then(r => r.data.data),
    onSuccess: (_, { trainId }) =>
      qc.invalidateQueries({ queryKey: ["admin", "trains", trainId] }),
  });
}

export function useCreateSchedule() {
  return useMutation({
    mutationFn: ({ trainId, journeyDate }: { trainId: string; journeyDate: string }) =>
      api.post(`/admin/trains/${trainId}/schedules`, { journeyDate }).then(r => r.data.data),
  });
}
```

### `TrainRouteStopEditor.tsx` — Key UX
```tsx
// Ordered list of stops — user can:
//   - Add a stop: StationCombobox + sequence + departure/arrival time + distance
//   - Remove a stop
//   - Reorder (drag or up/down arrows)
// On save → useSetRouteStops.mutateAsync({ trainId, stops })
// Note: this is a REPLACE operation — it replaces ALL stops in one API call
```

### `CoachManager.tsx` — Key UX
```tsx
// Shows existing coaches for a train in a table
// Add Coach form: coachNumber, seatClass (dropdown from useSeatClasses), totalSeats
// Delete coach button (confirm first)
// After adding, seats are auto-generated on backend (berth cycle pattern)
```

### `DashboardPage.tsx` — simple stats
```tsx
// Quick stats cards:
//   - Total bookings today
//   - Total revenue today
//   - Trains scheduled today
//   - Active seats held (from Redis? or just a static count from DB)
// Can use simple API calls: GET /admin/bookings?date=today with counts
```

---

## Part C — Admin API Extension

Add these to admin routes in backend:

### Admin Bookings endpoint (minimal)
```
GET /api/v1/admin/bookings?page=1&limit=20&status=CONFIRMED&date=2026-07-15
```

Create:
```
backend/src/admin/admin-bookings/
├── admin-bookings.controller.ts
└── admin-bookings.service.ts
```

### Add routes to `admin.routes.ts`:
```typescript
import { adminBookingsRouter } from "./admin-bookings/admin-bookings.routes";
adminRouter.use("/bookings", adminBookingsRouter);
```

---

## Part D — Seed Data (`backend/prisma/seed.ts`)

This is critical — without seed data you can't test the full flow.

### What to seed:
1. **SeatClasses** (4 rows — fixed multipliers)
2. **5 Stations** (major Indian cities)
3. **2 Trains** with full route stops + coaches
4. **7-day schedules** (today + 6 days)
5. **SeatAvailability** rows for each schedule (auto-created by the schedule service)

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding...");

  // 1. Seat Classes
  const seatClasses = await Promise.all([
    prisma.seatClass.upsert({ where: { name: "SLEEPER" },       update: {}, create: { name: "SLEEPER",       displayName: "Sleeper",          priceMultiplier: 1.0 } }),
    prisma.seatClass.upsert({ where: { name: "AC_3TIER" },      update: {}, create: { name: "AC_3TIER",      displayName: "AC 3 Tier",        priceMultiplier: 2.0 } }),
    prisma.seatClass.upsert({ where: { name: "AC_2TIER" },      update: {}, create: { name: "AC_2TIER",      displayName: "AC 2 Tier",        priceMultiplier: 2.5 } }),
    prisma.seatClass.upsert({ where: { name: "AC_FIRST_CLASS" },update: {}, create: { name: "AC_FIRST_CLASS",displayName: "AC First Class",   priceMultiplier: 3.5 } }),
  ]);
  console.log("Seat classes seeded");

  // 2. Stations
  const stations = await Promise.all([
    prisma.station.upsert({ where: { code: "NDLS" }, update: {}, create: { code: "NDLS", name: "New Delhi",     city: "New Delhi", state: "Delhi" } }),
    prisma.station.upsert({ where: { code: "CSMT" }, update: {}, create: { code: "CSMT", name: "Mumbai CST",    city: "Mumbai",    state: "Maharashtra" } }),
    prisma.station.upsert({ where: { code: "MAS"  }, update: {}, create: { code: "MAS",  name: "Chennai Central",city: "Chennai",   state: "Tamil Nadu" } }),
    prisma.station.upsert({ where: { code: "SBC"  }, update: {}, create: { code: "SBC",  name: "KSR Bengaluru", city: "Bengaluru", state: "Karnataka" } }),
    prisma.station.upsert({ where: { code: "HWH"  }, update: {}, create: { code: "HWH",  name: "Howrah",        city: "Kolkata",   state: "West Bengal" } }),
  ]);
  const [NDLS, CSMT, MAS, SBC, HWH] = stations;
  console.log("Stations seeded");

  // 3. Train 1: Rajdhani Express NDLS → CSMT
  const train1 = await prisma.train.upsert({
    where: { trainNumber: "12951" },
    update: {},
    create: { trainNumber: "12951", name: "Mumbai Rajdhani", type: "EXPRESS" },
  });

  await prisma.trainRouteStop.deleteMany({ where: { trainId: train1.id } });
  await prisma.trainRouteStop.createMany({
    data: [
      { trainId: train1.id, stationId: NDLS.id, sequence: 1, departureTime: "17:00", distanceKm: 0 },
      { trainId: train1.id, stationId: CSMT.id, sequence: 2, arrivalTime: "09:35",   distanceKm: 1447 },
    ],
  });

  // Sleeper coaches
  const sleeperClass = seatClasses[0];
  const acTierClass  = seatClasses[1];

  await prisma.coach.deleteMany({ where: { trainId: train1.id } });
  for (const [num, classObj, seats] of [
    ["S1", sleeperClass, 72], ["S2", sleeperClass, 72], ["S3", sleeperClass, 72],
    ["B1", acTierClass, 64], ["B2", acTierClass, 64],
  ] as const) {
    const coach = await prisma.coach.create({
      data: { trainId: train1.id, coachNumber: num, seatClassId: classObj.id, totalSeats: seats },
    });
    const berthCycle = ["LOWER","MIDDLE","UPPER","LOWER","MIDDLE","UPPER","SIDE_LOWER","SIDE_UPPER"] as const;
    await prisma.seat.createMany({
      data: Array.from({ length: seats }, (_, i) => ({
        coachId: coach.id, seatNumber: i + 1,
        berthType: berthCycle[i % berthCycle.length],
      })),
    });
  }
  console.log("Train 1 seeded");

  // 4. Schedules for next 7 days (use the schedule creation service logic inline)
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const existingSchedule = await prisma.trainSchedule.findUnique({
      where: { trainId_journeyDate: { trainId: train1.id, journeyDate: date } },
    });
    if (existingSchedule) continue;

    const schedule = await prisma.trainSchedule.create({
      data: { trainId: train1.id, journeyDate: date, status: "SCHEDULED" },
    });

    const coaches = await prisma.coach.findMany({ where: { trainId: train1.id } });
    const stops   = await prisma.trainRouteStop.findMany({
      where: { trainId: train1.id }, orderBy: { sequence: "asc" },
    });

    const availabilityRows = [];
    for (const coach of coaches) {
      for (let si = 0; si < stops.length - 1; si++) {
        for (let sj = si + 1; sj < stops.length; sj++) {
          availabilityRows.push({
            scheduleId: schedule.id, coachId: coach.id,
            fromStationId: stops[si].stationId, toStationId: stops[sj].stationId,
            availableCount: coach.totalSeats,
          });
        }
      }
    }
    await prisma.seatAvailability.createMany({ data: availabilityRows });
  }
  console.log("Schedules + availability seeded");

  // 5. Admin user for testing
  const bcrypt = await import("bcrypt");
  const adminHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@irtc.com" },
    update: {},
    create: { email: "admin@irtc.com", passwordHash: adminHash, name: "Admin", role: "ADMIN" },
  });
  console.log("Admin user seeded: admin@irtc.com / admin123");

  console.log("Seed complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

### Add seed script to `backend/package.json`:
```json
"scripts": {
  "seed": "tsx prisma/seed.ts"
}
```

### Run seed:
```bash
cd backend && npm run seed
```

---

## Verification — Full End-to-End Flow

```bash
# 1. Seed the database
cd backend && npm run seed

# 2. Start backend
npm run dev

# 3. Start frontend
cd frontend && npm run dev

# 4. Open browser http://localhost:5173
```

Full flow to test:
1. Register a new account → redirected to home
2. Search NDLS → CSMT on any seeded date → see Mumbai Rajdhani
3. Click "SL" (Sleeper) class badge → go to SeatSelectionPage
4. Select 1-2 green seats → click "Hold Seats" → 5-min countdown starts
5. Fill passenger name, age, gender → "Confirm Booking"
6. See PNR on BookingConfirmPage (green card, large mono font)
7. Navigate to My Bookings → booking appears with CONFIRMED badge
8. Cancel the booking → status changes to CANCELLED
9. Go back to seat map — cancelled seats show as AVAILABLE again

## Final Checklist Before Considering Done
- [ ] Search returns real trains from seed data
- [ ] Seat map shows real seats from DB
- [ ] Redis hold prevents double-booking (test with 2 tabs simultaneously)
- [ ] Countdown timer works and redirects on expiry
- [ ] PNR is unique and retrievable via GET /bookings/pnr/:pnr
- [ ] Admin can login at /login (admin@irtc.com / admin123) and see the admin sidebar
- [ ] Admin can create a new station → appears in StationCombobox
- [ ] Admin can create a new train + set stops + add coaches + create schedule
