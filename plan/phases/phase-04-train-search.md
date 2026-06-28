# Phase 4 — Train Search API

## Goal
Build the public train search and seat availability endpoints:
- `GET /api/v1/trains/search?from=NDLS&to=CSMT&date=2026-07-01`
- `GET /api/v1/trains/:trainId` (full train + route)
- `GET /api/v1/trains/:trainId/schedules/:scheduleId/availability?from=X&to=Y` (class-level counts)
- `GET /api/v1/trains/:trainId/schedules/:scheduleId/coaches/:coachId/seats` (seat map — requires JWT)

## Files to Create
```
backend/src/trains/
├── trains.schemas.ts
├── trains.repository.ts    ← Complex JOIN query lives here
├── trains.service.ts
├── trains.controller.ts
└── trains.routes.ts
```
Mount: `app.use("/api/v1/trains", trainsRouter)` in `index.ts`.

---

## 1. `trains.schemas.ts`

```typescript
import { z } from "zod";

export const trainSearchSchema = z.object({
  from:  z.string().min(2).toUpperCase(),   // station code e.g. "NDLS"
  to:    z.string().min(2).toUpperCase(),
  date:  z.string().date(),                 // "YYYY-MM-DD"
});

export const trainParamsSchema = z.object({
  trainId: z.string().cuid(),
});

export const scheduleParamsSchema = z.object({
  trainId:    z.string().cuid(),
  scheduleId: z.string().cuid(),
});

export const seatMapParamsSchema = z.object({
  trainId:    z.string().cuid(),
  scheduleId: z.string().cuid(),
  coachId:    z.string().cuid(),
});

export const availabilityQuerySchema = z.object({
  from: z.string().cuid(),  // fromStationId
  to:   z.string().cuid(),  // toStationId
});
```

---

## 2. `trains.repository.ts` — The Core Search Query

### Train Search
The query must find trains that:
1. Stop at `fromStation` (by code) at sequence S1
2. Stop at `toStation` (by code) at sequence S2
3. `S1 < S2` (travel direction)
4. Have a non-cancelled `TrainSchedule` for the given date

```typescript
import { prisma } from "../config/prisma";

export const trainsRepository = {
  async searchTrains({ fromCode, toCode, date }: { fromCode: string; toCode: string; date: Date }) {
    // Step 1: Find trains that stop at both stations in correct order
    const trains = await prisma.train.findMany({
      where: {
        routeStops: {
          some: { station: { code: fromCode } },  // has fromStation
        },
        AND: {
          routeStops: {
            some: { station: { code: toCode } },   // has toStation
          },
        },
        schedules: {
          some: {
            journeyDate: date,
            status: { not: "CANCELLED" },
          },
        },
      },
      include: {
        routeStops: {
          include: { station: true },
          orderBy: { sequence: "asc" },
        },
        schedules: {
          where: {
            journeyDate: date,
            status: { not: "CANCELLED" },
          },
          take: 1,
        },
      },
    });

    // Step 2: Filter by direction (fromSequence < toSequence)
    return trains.filter((train) => {
      const fromStop = train.routeStops.find(s => s.station.code === fromCode);
      const toStop   = train.routeStops.find(s => s.station.code === toCode);
      return fromStop && toStop && fromStop.sequence < toStop.sequence;
    });
  },

  // Get SeatAvailability grouped by SeatClass for a specific segment
  async getAvailabilityByClass(scheduleId: string, fromStationId: string, toStationId: string) {
    return prisma.seatAvailability.findMany({
      where: { scheduleId, fromStationId, toStationId },
      include: {
        coach: {
          include: { seatClass: true },
        },
      },
    });
  },

  findById(trainId: string) {
    return prisma.train.findUnique({
      where: { id: trainId },
      include: {
        routeStops: {
          include: { station: true },
          orderBy: { sequence: "asc" },
        },
        coaches: {
          include: { seatClass: true },
        },
      },
    });
  },

  async getSeatsForCoach(scheduleId: string, coachId: string) {
    return prisma.seat.findMany({
      where: { coachId },
      include: {
        bookingPassengers: {
          where: {
            status: "CONFIRMED",
            booking: { scheduleId, status: "CONFIRMED" },
          },
          select: { id: true },
        },
      },
      orderBy: { seatNumber: "asc" },
    });
  },
};
```

---

## 3. `trains.service.ts`

### Search with availability aggregation
```typescript
async searchTrains(dto: { from: string; to: string; date: string }) {
  const date = new Date(dto.date);
  const trains = await trainsRepository.searchTrains({
    fromCode: dto.from,
    toCode: dto.to,
    date,
  });

  // For each train, fetch availability counts from SeatAvailability
  // grouped by seat class
  const results = await Promise.all(
    trains.map(async (train) => {
      const schedule = train.schedules[0];
      if (!schedule) return null;

      const fromStop = train.routeStops.find(s => s.station.code === dto.from)!;
      const toStop   = train.routeStops.find(s => s.station.code === dto.to)!;

      const availability = await trainsRepository.getAvailabilityByClass(
        schedule.id,
        fromStop.stationId,
        toStop.stationId
      );

      // Sum availableCount per seat class
      const classCounts = availability.reduce<Record<string, { displayName: string; available: number; coachIds: string[] }>>(
        (acc, row) => {
          const key = row.coach.seatClass.name;
          if (!acc[key]) acc[key] = { displayName: row.coach.seatClass.displayName, available: 0, coachIds: [] };
          acc[key].available += row.availableCount;
          acc[key].coachIds.push(row.coach.id);
          return acc;
        },
        {}
      );

      return {
        train: { id: train.id, trainNumber: train.trainNumber, name: train.name, type: train.type },
        schedule: { id: schedule.id, status: schedule.status },
        departure:  { station: fromStop.station, time: fromStop.departureTime, distanceKm: fromStop.distanceKm },
        arrival:    { station: toStop.station,   time: toStop.arrivalTime,    distanceKm: toStop.distanceKm },
        distanceKm: toStop.distanceKm - fromStop.distanceKm,
        classes:    Object.entries(classCounts).map(([name, data]) => ({ name, ...data })),
      };
    })
  );

  return results.filter(Boolean);
},
```

### Seat Map — checks BOTH PostgreSQL and Redis
```typescript
async getSeatMap(scheduleId: string, coachId: string) {
  // Get seats with their confirmed bookings
  const seats = await trainsRepository.getSeatsForCoach(scheduleId, coachId);

  // Check Redis for active holds
  const holdKeys = seats.map(s => `hold:${scheduleId}:${s.id}`);
  const holdValues = holdKeys.length > 0
    ? await redis.mget(...holdKeys)
    : [];

  return seats.map((seat, i) => {
    const isBooked = seat.bookingPassengers.length > 0;
    const holdUserId = holdValues[i];
    const isHeld = holdUserId !== null;

    return {
      id:         seat.id,
      seatNumber: seat.seatNumber,
      berthType:  seat.berthType,
      status: isBooked ? "BOOKED" : isHeld ? "HELD" : "AVAILABLE",
    };
  });
},
```

---

## 4. `trains.routes.ts`

```typescript
import { Router } from "express";
import { trainsController } from "./trains.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { trainSearchSchema, trainParamsSchema, scheduleParamsSchema, seatMapParamsSchema, availabilityQuerySchema } from "./trains.schemas";

export const trainsRouter = Router();

// All public
trainsRouter.get("/search",
  validate({ query: trainSearchSchema }),
  trainsController.search
);

trainsRouter.get("/:trainId",
  validate({ params: trainParamsSchema }),
  trainsController.getById
);

trainsRouter.get("/:trainId/schedules/:scheduleId/availability",
  validate({ params: scheduleParamsSchema }),
  validate({ query: availabilityQuerySchema }),
  trainsController.getAvailability
);

// Seat map requires login (user must be authenticated to select seats)
trainsRouter.get("/:trainId/schedules/:scheduleId/coaches/:coachId/seats",
  verifyJWT,
  validate({ params: seatMapParamsSchema }),
  trainsController.getSeatMap
);
```

---

## Response Shape Examples

### Search response
```json
{
  "success": true,
  "data": [
    {
      "train": { "id": "...", "trainNumber": "12301", "name": "Rajdhani Express", "type": "EXPRESS" },
      "schedule": { "id": "...", "status": "SCHEDULED" },
      "departure": { "station": { "code": "NDLS", "name": "New Delhi" }, "time": "08:00", "distanceKm": 0 },
      "arrival":   { "station": { "code": "CSMT", "name": "Mumbai" },    "time": "20:00", "distanceKm": 1447 },
      "distanceKm": 1447,
      "classes": [
        { "name": "SLEEPER",      "displayName": "Sleeper",     "available": 288, "coachIds": ["..."] },
        { "name": "AC_3TIER",     "displayName": "AC 3 Tier",   "available": 216, "coachIds": ["..."] }
      ]
    }
  ]
}
```

### Seat map response
```json
{
  "success": true,
  "data": [
    { "id": "...", "seatNumber": 1, "berthType": "LOWER",  "status": "AVAILABLE" },
    { "id": "...", "seatNumber": 2, "berthType": "MIDDLE", "status": "HELD" },
    { "id": "...", "seatNumber": 3, "berthType": "UPPER",  "status": "BOOKED" }
  ]
}
```

---

## Verification Checklist

```bash
# Search trains
curl "http://localhost:4000/api/v1/trains/search?from=NDLS&to=CSMT&date=2026-07-15"
# → Returns trains with classes + availability counts

# Must have seed data (stations, trains, routes, coaches, schedule) from Phase 3

# Seat map (requires JWT)
curl "http://localhost:4000/api/v1/trains/<trainId>/schedules/<scheduleId>/coaches/<coachId>/seats" \
  -H "Authorization: Bearer <token>"
# → Returns list of seats with AVAILABLE/HELD/BOOKED status
```

## Gotchas
- The direction check (`fromSequence < toSequence`) MUST be done in application code (Prisma filter) because Prisma can't compare two fields from the same join in a `where` clause
- `SeatAvailability` is queried by `(scheduleId, fromStationId, toStationId)` — these are station IDs not codes
- Seat map combines two data sources: PostgreSQL (confirmed bookings) + Redis (active holds via `MGET`)
- `redis.mget()` returns `null` for keys that don't exist — treat `null` as "not held"
- `@db.Date` in Prisma → store date as midnight UTC: `new Date("2026-07-15")` gives `2026-07-15T00:00:00.000Z` which Prisma stores as the date `2026-07-15`
