# Railway Booking System — Implementation Plan

## Context

The existing IRCTC Booking project is a greenfield monorepo with only scaffolding in place — Express.js v5 + TypeScript backend (port 4000) and React 19 + Vite frontend (port 3001). No database, no business logic, no routes exist yet. The `.ai/` docs define strict Clean Architecture and UI patterns that must be followed.

**Goal:** Build a complete railway seat booking system where users can search trains by origin/destination/date, view available trains and seats, book seats (with full concurrency safety), and manage their bookings.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Express 5 + TypeScript strict |
| ORM | Prisma + PostgreSQL |
| Seat Holds | **Redis + ioredis** (TTL-based, auto-expiring, BookMyShow-style) |
| Validation | Zod (body, query, params) |
| Auth | JWT + bcrypt |
| Frontend | React 19 + Vite + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Forms | React Hook Form + Zod |
| API calls | TanStack React Query |
| HTTP client | Axios |

---

## Database Schema (`backend/prisma/schema.prisma`)

### Enums
- `Role`: PASSENGER | ADMIN
- `TrainType`: EXPRESS | SUPERFAST | LOCAL
- `SeatClassName`: SLEEPER | AC_3TIER | AC_2TIER | AC_FIRST_CLASS
- `BerthType`: LOWER | MIDDLE | UPPER | SIDE_LOWER | SIDE_UPPER
- `ScheduleStatus`: SCHEDULED | RUNNING | ARRIVED | CANCELLED
- `BookingStatus`: PENDING | CONFIRMED | CANCELLED | WAITLISTED
- `PassengerGender`: MALE | FEMALE | OTHER

### Models

**User** — id, email (unique), passwordHash, name, phone?, role, timestamps

**Station** — id, code (unique, e.g. "NDLS"), name, city, state, timestamps

**Train** — id, trainNumber (unique, e.g. "12301"), name, type (TrainType), timestamps

**TrainRouteStop** — id, trainId, stationId, sequence (int), arrivalTime ("HH:MM"?), departureTime ("HH:MM"?), distanceKm (cumulative from origin). Unique on (trainId, sequence) and (trainId, stationId).

**SeatClass** — id, name (SeatClassName unique), displayName, priceMultiplier (Decimal 4,2)

**Coach** — id, trainId, coachNumber ("S1"/"B1"), seatClassId, totalSeats. Unique on (trainId, coachNumber).

**Seat** — id, coachId, seatNumber (int), berthType. Unique on (coachId, seatNumber).

**TrainSchedule** — id, trainId, journeyDate (Date), status (ScheduleStatus), timestamps. Unique on (trainId, journeyDate).

**SeatAvailability** — id, scheduleId, coachId, fromStationId, toStationId, availableCount (int). Unique on (scheduleId, coachId, fromStationId, toStationId). Decremented only at confirmed booking time using `SELECT FOR UPDATE`.

**Booking** — id, userId, scheduleId, fromStationId, toStationId, pnr (unique), status (BookingStatus), totalFare (Decimal 10,2), timestamps.

**BookingPassenger** — id, bookingId, seatId, name, age, gender (PassengerGender), status (BookingStatus). Unique on (seatId, bookingId).

---

## Concurrency Strategy — Redis Seat Holds + PostgreSQL Booking Confirmation

This is the **BookMyShow / Ticketmaster architecture**. Seat holds live in Redis (fast, auto-expiring). Confirmed bookings live in PostgreSQL (durable, ACID).

### How It Works

```
Phase 1: Seat Hold (5-minute window)
  User selects seat(s) on SeatMap
  → POST /api/seat-holds
      For each seatId:
        redis.SET "hold:{scheduleId}:{seatId}" {userId} NX EX 300
        (NX = set only if key doesn't exist → atomic, no DB lock needed)
        (EX 300 = auto-expires in 5 minutes → no cleanup job needed)
      If ANY SET returns nil → another user holds it → 409 Conflict
        (Roll back already-set keys for this request)
      If all SET return OK:
        Generate holdId = cuid(), store metadata:
          redis.SETEX "hold_meta:{holdId}" 300 JSON({ userId, scheduleId,
            fromStationId, toStationId, coachId, seatIds[] })
      → Return { holdId, expiresAt, seats } to frontend
      → Frontend shows 5-minute countdown timer

Phase 2: Confirm Booking (before hold expires)
  User fills passenger details, clicks "Confirm"
  → POST /api/bookings { holdId, passengers[] }
      1. Read hold metadata from Redis: GET "hold_meta:{holdId}"
         → If nil → hold expired → 409 "Your hold expired, reselect seats"
         → If userId doesn't match → 403
      2. Verify each "hold:{scheduleId}:{seatId}" still exists in Redis
         (paranoia check — metadata may be valid but individual keys could be gone)
      3. Generate PNR
      4. prisma.$transaction:
           SELECT FOR UPDATE on SeatAvailability (final durability check)
           Create Booking (status=CONFIRMED)
           Create BookingPassengers (one per passenger + seatId)
           Decrement SeatAvailability.availableCount by N
      5. DEL all Redis hold keys (seat keys + meta key)
      → Return { booking, pnr }

If hold expires (user abandoned):
  → Redis TTL auto-deletes all hold keys at 300 seconds
  → SeatAvailability.availableCount was NOT decremented during hold creation
     (only decremented on confirmed booking)
  → No cleanup job needed — seat is simply available again when Redis key expires
```

### Key Design Decision: availableCount NOT decremented during hold

Unlike the PostgreSQL hold approach, Redis hold does **not** decrement `SeatAvailability.availableCount`. Instead:
- Redis holds act as a **mutex per individual seat** (`hold:{scheduleId}:{seatId}`)
- `availableCount` is only decremented at confirmed booking time
- The "available seats" shown to users = seats without a Redis hold key AND not in a confirmed booking

This means a seat map query must check two sources:
1. PostgreSQL: seats linked to CONFIRMED bookings for this schedule+segment
2. Redis: seats with an active `hold:{scheduleId}:{seatId}` key
Seats in either list show as UNAVAILABLE.

### Redis Key Schema

```
hold:{scheduleId}:{seatId}    → userId           TTL: 300s
hold_meta:{holdId}             → JSON (all hold info) TTL: 300s
```

### Concurrency Safety

Two users trying to hold the same seat simultaneously:
```
User A: SET "hold:sch1:seat42" "userA" NX EX 300  → OK (gets the hold)
User B: SET "hold:sch1:seat42" "userB" NX EX 300  → nil (seat already held)
User B receives 409 Conflict: "Seat S4 is currently held by another user"
```

`SET NX` is atomic in Redis — no race condition possible.

### `config/redis.ts` — singleton Redis client

```typescript
import { Redis } from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL);
```

### `seatHolds.service.ts` — hold creation logic

```typescript
async createHold(userId: string, dto: CreateHoldDto): Promise<HoldResult> {
  const holdId = cuid();
  const expiresAt = new Date(Date.now() + 300_000);
  const holdKeys = dto.seatIds.map(id => `hold:${dto.scheduleId}:${id}`);

  // Atomic multi-SET using Redis pipeline
  const pipeline = redis.pipeline();
  for (let i = 0; i < dto.seatIds.length; i++) {
    pipeline.set(holdKeys[i], userId, "NX", "EX", 300);
  }
  const results = await pipeline.exec();

  // Check if any seat was already held
  const failed = results?.some(([err, val]) => err || val === null);
  if (failed) {
    // Roll back successfully set keys
    const setKeys = holdKeys.filter((_, i) => results?.[i]?.[1] === "OK");
    if (setKeys.length) await redis.del(...setKeys);
    throw new ConflictError("One or more seats are already held. Please reselect.");
  }

  // Store hold metadata
  const meta = JSON.stringify({ userId, ...dto, seatIds: dto.seatIds });
  await redis.setex(`hold_meta:${holdId}`, 300, meta);

  return { holdId, expiresAt, seatIds: dto.seatIds };
}
```

- No `SeatAvailability` database lock needed at hold time — Redis `SET NX` handles atomicity
- `SELECT FOR UPDATE` on `SeatAvailability` is still used at booking confirmation for final durability
- Cancellation: restore `availableCount` in a transaction + DEL any Redis hold keys if present

---

## API Endpoints (`/api/v1`)

### Auth
| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | None |
| POST | `/auth/login` | None |
| GET | `/auth/me` | JWT |
| PATCH | `/auth/me` | JWT |

### Trains (public)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/trains/search?from=NDLS&to=CSMT&date=2026-07-01` | Main search |
| GET | `/trains/:trainId` | Full train + route |
| GET | `/trains/:trainId/schedules/:scheduleId/availability?from=X&to=Y` | Class-level counts |
| GET | `/trains/:trainId/schedules/:scheduleId/coaches/:coachId/seats` | Seat map (JWT) |

### Seat Holds (PASSENGER)
| Method | Path | Notes |
|--------|------|-------|
| POST | `/seat-holds` | Select seats → creates 5-min hold, returns holdId + expiresAt |
| DELETE | `/seat-holds/:holdId` | Release hold early (user went back) |
| GET | `/seat-holds/:holdId` | Check hold status + time remaining |

### Bookings (PASSENGER)
| Method | Path | Notes |
|--------|------|-------|
| POST | `/bookings` | Confirm hold → body: { holdId, passengers[] } |
| GET | `/bookings` (paginated) | |
| GET | `/bookings/:id` | |
| GET | `/bookings/pnr/:pnr` | |
| PATCH | `/bookings/:id/cancel` | |

### Admin (ADMIN only)
- CRUD: `/admin/stations`, `/admin/trains`
- `/admin/trains/:id/route-stops` (batch set all stops)
- `/admin/trains/:id/coaches`
- `/admin/trains/:id/schedules` (generate schedule + pre-populate SeatAvailability)
- GET `/admin/bookings`

---

## Backend File Structure

```
backend/src/
├── index.ts                         ← CORS, body parser, mount routes, error handler
├── config/
│   ├── env.ts                       ← Zod env validation at startup
│   ├── prisma.ts                    ← Singleton PrismaClient
│   └── redis.ts                     ← Singleton ioredis client
├── errors/
│   └── app.errors.ts               ← AppError, NotFoundError, ConflictError,
│                                       UnauthorizedError, ForbiddenError, ValidationError
├── middleware/
│   ├── auth.middleware.ts           ← verifyJWT, attachUser, requireRole(roles[])
│   ├── error.middleware.ts          ← Catches AppError + PG 55P03 + unknowns
│   └── validate.middleware.ts       ← Generic Zod middleware factory
├── utils/
│   ├── jwt.utils.ts
│   ├── hash.utils.ts               ← bcrypt wrappers
│   ├── pnr.utils.ts                ← crypto.randomBytes(4).toString('hex').toUpperCase()
│   ├── fare.utils.ts               ← computeFare(distanceKm, multiplier, count): Decimal
│   └── pagination.utils.ts
├── auth/
│   ├── auth.routes.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.repository.ts
│   └── auth.schemas.ts
├── trains/
│   ├── trains.routes.ts
│   ├── trains.controller.ts
│   ├── trains.service.ts            ← Complex JOIN query for search
│   ├── trains.repository.ts
│   └── trains.schemas.ts
├── seat-holds/
│   ├── seatHolds.routes.ts
│   ├── seatHolds.controller.ts
│   ├── seatHolds.service.ts         ← Redis SET NX pipeline + rollback on conflict
│   └── seatHolds.schemas.ts         ← No repository: all Redis ops in service
├── bookings/
│   ├── bookings.routes.ts
│   ├── bookings.controller.ts
│   ├── bookings.service.ts          ← Read Redis hold meta → PG transaction → DEL Redis keys
│   ├── bookings.repository.ts       ← lockSeatAvailability() SELECT FOR UPDATE at confirm time
│   └── bookings.schemas.ts          ← CreateBookingDto: { holdId, passengers[] }
├── stations/
│   ├── (same pattern)
└── admin/
    ├── admin.routes.ts
    ├── admin-trains/
    │   ├── admin-trains.controller.ts
    │   ├── admin-trains.service.ts  ← Schedule creation pre-populates SeatAvailability
    │   ├── admin-trains.repository.ts
    │   └── admin-trains.schemas.ts
    └── admin-bookings/
        ├── admin-bookings.controller.ts
        └── admin-bookings.service.ts
```

---

## Frontend File Structure

```
frontend/src/
├── main.tsx                         ← QueryClientProvider + BrowserRouter
├── App.tsx                          ← Route tree only
├── apps/
│   ├── passenger/
│   │   ├── pages/
│   │   │   ├── home/HomePage.tsx                  ← ~15 lines, renders <SearchForm>
│   │   │   ├── search-results/SearchResultsPage.tsx
│   │   │   ├── seat-selection/SeatSelectionPage.tsx
│   │   │   ├── booking/
│   │   │   │   ├── BookingFormPage.tsx
│   │   │   │   └── BookingConfirmPage.tsx
│   │   │   ├── my-bookings/
│   │   │   │   ├── MyBookingsPage.tsx
│   │   │   │   └── BookingDetailPage.tsx
│   │   │   └── auth/
│   │   │       ├── LoginPage.tsx
│   │   │       └── RegisterPage.tsx
│   │   └── components/
│   │       ├── home/SearchForm.tsx               ← Station combobox + date picker
│   │       ├── search-results/TrainCard.tsx
│   │       ├── seat-selection/ClassSelector.tsx
│   │       ├── seat-selection/SeatMap.tsx         ← Grid of seat buttons
│   │       └── booking/PassengerForm.tsx          ← useFieldArray per passenger
│   └── admin/
│       ├── pages/
│       │   ├── dashboard/, stations/, trains/, bookings/
│       └── components/
│           ├── stations/StationForm.tsx
│           └── trains/
│               ├── TrainForm.tsx
│               ├── TrainRouteStopEditor.tsx       ← Ordered stops editor
│               └── CoachManager.tsx
└── shared/
    ├── api/
    │   ├── auth.api.ts              ← useLogin, useRegister, useMe
    │   ├── trains.api.ts            ← useSearchTrains, useTrain, useAvailability
    │   ├── bookings.api.ts          ← useCreateBooking, useMyBookings, useCancelBooking
    │   └── admin.api.ts
    ├── components/
    │   ├── ui/Field.tsx, SectionCard.tsx, DataTable.tsx, TablePagination.tsx
    │   ├── layout/PassengerLayout.tsx, AdminLayout.tsx, ProtectedRoute.tsx
    │   └── station-combobox/StationCombobox.tsx   ← Shared across search + booking
    ├── hooks/
    │   ├── useAuth.ts               ← JWT from localStorage, expose user object
    │   └── useDebounce.ts
    └── utils/
        ├── extractError.ts
        ├── api.client.ts            ← Axios + auth header interceptor + 401 redirect
        └── date.utils.ts
```

---

## UI Design System

### Color Theme — "Rail Blue" (clean, trustworthy, modern)

The palette is inspired by modern travel booking platforms (MakeMyTrip, Yatra) — deep navy primary with an orange accent for CTAs.

```css
/* tailwind.config.ts — extend colors */
colors: {
  brand: {
    primary:   "#1E40AF",   /* Deep blue — nav, headers, primary buttons */
    hover:     "#1E3A8A",   /* Darker on hover */
    light:     "#EFF6FF",   /* Light blue backgrounds, badges */
    accent:    "#F97316",   /* Orange — CTAs, "Book Now", countdown timer */
    accentHov: "#EA580C",   /* Orange hover */
  }
}
```

| Token | Hex | Usage |
|-------|-----|-------|
| `brand.primary` | `#1E40AF` | Navbar, headings, primary buttons |
| `brand.hover` | `#1E3A8A` | Button hover |
| `brand.light` | `#EFF6FF` | Section backgrounds, info badges |
| `brand.accent` | `#F97316` | "Book Now", countdown timer, price highlights |
| Success | `#16A34A` | Confirmed booking badge, available seat |
| Warning | `#D97706` | Waitlisted, seat currently held (5-min timer) |
| Danger | `#DC2626` | Cancelled booking, booked seat on seat map |
| Surface | `#FFFFFF` | Cards, panels |
| Background | `#F1F5F9` | Page background |
| Muted | `#64748B` | Secondary text, hints |
| Border | `#E2E8F0` | Card borders, dividers |

### Seat Map Colors (critical for UX)
| State | Color | Description |
|-------|-------|-------------|
| AVAILABLE | `bg-green-100 border-green-500 text-green-700` | User can select |
| SELECTED | `bg-brand-primary text-white` | User just selected it |
| HELD | `bg-amber-100 border-amber-400 text-amber-700` | Someone else's active hold |
| BOOKED | `bg-red-100 border-red-400 text-red-400 cursor-not-allowed` | Confirmed booking |
| YOUR_HOLD | `bg-orange-500 text-white ring-2 ring-orange-300` | This user's active hold |

### Component Conventions
- **Navbar**: Deep blue background (`bg-brand-primary`), white text, brand logo on left, login/profile on right
- **Train cards on search results**: White card with left-side blue accent border, train name bold, departure/arrival times large, seat class badges with availability counts
- **Seat class selector**: Grid of 4 cards (SLEEPER / 3AC / 2AC / 1AC), selected card gets `ring-2 ring-brand-primary` border
- **Hold countdown**: Orange banner at top of booking form — `bg-orange-50 border-orange-300` with countdown timer in `text-brand-accent font-mono`
- **Booking confirmed page**: Green success illustration, large PNR in mono font inside a `bg-green-50 rounded-xl` card
- **Booking status badges**: Use Tailwind `badge`-style: CONFIRMED=green, CANCELLED=red, PENDING=amber, WAITLISTED=blue

### Typography
- Headings: `font-bold text-slate-900`
- Body: `text-slate-700`
- Muted: `text-slate-500 text-sm`
- PNR / seat numbers: `font-mono font-bold tracking-widest`
- Price: `text-2xl font-bold text-brand-primary`
- Timer: `font-mono text-brand-accent font-semibold`

### Page Layout
- **Passenger app**: Top navbar + full-width content — no sidebar
- **Admin app**: Collapsible left sidebar (brand primary) + white content area
- **Max content width**: `max-w-5xl mx-auto` on most pages, `max-w-2xl` on forms
- **Search hero**: Dark blue gradient banner (`from-brand-primary to-blue-800`) with white search form card overlapping it

---

## Implementation Order (10 Phases)

### Phase 1 — Backend Infrastructure
1. Install: `prisma @prisma/client zod jsonwebtoken bcrypt cors` + dev types
2. Write `backend/prisma/schema.prisma` (full schema above)
3. `prisma migrate dev --name init`
4. `config/env.ts` (Zod env validation), `config/prisma.ts` (singleton client)
5. `errors/app.errors.ts`, `middleware/error.middleware.ts`, `middleware/auth.middleware.ts`
6. Refactor `index.ts`: CORS, body parser, route mounting, error handler

### Phase 2 — Auth Module
7. `auth.schemas.ts` → `auth.repository.ts` → `auth.service.ts` → `auth.controller.ts` → `auth.routes.ts`

### Phase 3 — Stations + Admin Trains
8. Full stations CRUD (admin-only)
9. Admin trains CRUD + `route-stops` batch endpoint + coach management
10. Schedule creation endpoint: creates `TrainSchedule` + pre-populates all `SeatAvailability` rows

### Phase 4 — Train Search
11. `trains.repository.ts`: JOIN query — trains with BOTH fromStation and toStation in route, fromSequence < toSequence, matching schedule on date
12. `trains.service.ts`: attach SeatAvailability aggregated by class
13. `trains.controller.ts` + `trains.routes.ts`

### Phase 5 — Redis Seat Holds + Booking Confirmation (critical)
14. Add `ioredis` to backend dependencies
15. `config/redis.ts`: singleton `ioredis` client, add `REDIS_URL` to `env.ts` Zod schema
16. `seatHolds.schemas.ts`: `CreateHoldDto` with `{ scheduleId, coachId, fromStationId, toStationId, seatIds[] }`
17. `seatHolds.service.ts`:
    - `createHold()`: Redis pipeline with `SET NX EX 300` for each seatId + SETEX for hold meta
    - `releaseHold()`: DEL all seat keys + meta key
    - `getHold()`: GET hold meta (for status check endpoint)
18. `seatHolds.controller.ts` + `seatHolds.routes.ts` — NO background cleanup job needed (Redis TTL handles it)
19. `bookings.schemas.ts`: `CreateBookingDto: { holdId, passengers[] }`
20. `bookings.repository.ts`: `lockSeatAvailability()` — `SELECT FOR UPDATE` on SeatAvailability at confirmation
21. `bookings.service.ts`:
    - Read Redis hold meta → verify userId + non-expired
    - Verify each `hold:{scheduleId}:{seatId}` still exists in Redis
    - PG transaction: SELECT FOR UPDATE → create Booking + BookingPassengers → decrement availableCount
    - DEL all Redis hold keys
22. Cancellation: PG transaction with `SELECT FOR UPDATE` → increment `availableCount` → update Booking status
23. `bookings.controller.ts` + `bookings.routes.ts`

### Phase 6 — Frontend Setup
19. Install: `axios react-router-dom @tanstack/react-query react-hook-form @hookform/resolvers zod tailwindcss`
20. `npx shadcn@latest init` then add: `button input select card badge table dialog tabs skeleton calendar popover command separator radio-group alert`
21. **Extend `tailwind.config.ts`** with `brand` color tokens from the design system (primary, hover, light, accent, accentHov)
22. `shared/utils/api.client.ts`, `shared/utils/extractError.ts`
23. `shared/components/ui/Field.tsx`, `SectionCard.tsx`, `DataTable.tsx`, `TablePagination.tsx`
24. `shared/components/layout/PassengerLayout.tsx` (navy navbar), `AdminLayout.tsx` (navy sidebar), `ProtectedRoute.tsx`
25. `main.tsx` (QueryClientProvider + BrowserRouter), `App.tsx` (route tree)

### Phase 7 — Auth Frontend
25. `shared/api/auth.api.ts`, `shared/hooks/useAuth.ts`
26. `LoginPage.tsx`, `RegisterPage.tsx`

### Phase 8 — Search Flow
27. `shared/api/trains.api.ts`
28. `StationCombobox.tsx` (command palette autocomplete)
29. `SearchForm.tsx` (origin, destination, date, passenger count)
30. `HomePage.tsx` (thin shell), `SearchResultsPage.tsx` (thin shell), `TrainCard.tsx`, `TrainListFilters.tsx`

### Phase 9 — Seat Selection + Hold + Booking Form
31. `ClassSelector.tsx`, `SeatMap.tsx` (shows AVAILABLE / HELD / BOOKED states), `AvailabilityBadge.tsx`, `SeatSelectionPage.tsx`
32. `shared/api/seat-holds.api.ts`: `useCreateHold`, `useReleaseHold`, `useHoldStatus`
33. On seat selection → call `useCreateHold` → on success → navigate to booking form with `holdId`
34. `HoldCountdown.tsx` — shows "Seat held for X:XX — complete booking before time runs out" using `expiresAt` from hold response
35. `PassengerForm.tsx` (useFieldArray), `BookingFareSummary.tsx`, `shared/api/bookings.api.ts`
36. `BookingFormPage.tsx` (renders HoldCountdown + PassengerForm), `BookingConfirmPage.tsx`, `BookingConfirmBanner.tsx`
37. If countdown hits 0 → auto-redirect to seat selection with "Your hold expired, please reselect seats"

### Phase 10 — My Bookings + Admin + Seed
34. `MyBookingsPage.tsx`, `BookingDetailPage.tsx`, `CancelBookingDialog.tsx` (shadcn Dialog)
35. Admin pages: stations CRUD, train CRUD, route stop editor, coach manager
36. `backend/prisma/seed.ts`: seed SeatClasses (multipliers: SLEEPER×1.0, AC_3TIER×2.0, AC_2TIER×2.5, AC_FIRST_CLASS×3.5), 5 stations, 2 trains with routes + coaches + 7-day schedules, populate SeatAvailability

---

## Key Gotchas

1. **SeatAvailability must be pre-populated** when a schedule is created (O(coaches × stops²) rows). Do NOT compute availability at query time — it cannot be locked atomically.

2. **No cleanup job needed.** Redis TTL auto-expires hold keys at 300 seconds. `SeatAvailability.availableCount` is NOT decremented during hold creation — only at confirmed booking. So when a hold expires, availability is automatically restored (the key just disappears from Redis).

3. **Seat map availability = PostgreSQL + Redis check.** When showing the seat map, a seat is UNAVAILABLE if it has a confirmed `BookingPassenger` row OR an active Redis hold key. The seat map endpoint queries both sources and merges them.

4. **`crypto.randomBytes(4).toString('hex').toUpperCase()`** for PNR — no external dependency needed (avoids ESM-only `nanoid`).

3. **Express v5**: async route handlers auto-propagate errors to the error handler — but the error handler still must have the 4-parameter `(err, req, res, next)` signature.

4. **Cancellation is also a transaction** — must `SELECT FOR UPDATE` on `SeatAvailability` before incrementing `availableCount`, to prevent race with a concurrent booking.

5. **Admin batch route-stop endpoint** does `deleteMany` + `createMany` in one transaction to avoid partial state.

---

## Verification

- Seed the database and manually search trains between two stations on a given date
- Select a seat → verify Redis key `hold:{scheduleId}:{seatId}` is created with TTL 300s, seat shows as HELD in seat map
- Send 2 concurrent `POST /seat-holds` requests for the same seat — verify only 1 returns 200 and the other returns 409
- Let hold expire (reduce TTL to 10s for testing) → verify Redis key auto-deletes, seat map shows seat as AVAILABLE again, `availableCount` was never decremented
- Complete booking before expiry → verify PNR returned, Redis keys deleted, `availableCount` decremented in PostgreSQL
- Cancel a booking → verify `availableCount` is incremented
- Attempt to access admin endpoints as a PASSENGER → verify 403
- Full end-to-end in browser: register → login → search → select seat → fill passenger form → confirm → view booking by PNR

---

## New Dependencies to Install

**Backend:** `prisma @prisma/client zod jsonwebtoken @types/jsonwebtoken bcrypt @types/bcrypt cors @types/cors ioredis @types/ioredis`

**Frontend:** `axios react-router-dom @tanstack/react-query react-hook-form @hookform/resolvers zod tailwindcss @tailwindcss/vite` + shadcn init
