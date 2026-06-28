# Phase 3 — Stations + Admin Trains + Schedules

## Goal
Build the admin-only management APIs:
1. **Stations** — full CRUD (create, list with search/pagination, get, update, delete)
2. **Admin Trains** — full CRUD + batch route-stop editor + coach management
3. **Schedule generation** — creates `TrainSchedule` + pre-populates ALL `SeatAvailability` rows

All endpoints require `ADMIN` role. Use `verifyJWT + requireRole(Role.ADMIN)` on every route.

## Files to Create
```
backend/src/
├── stations/
│   ├── stations.schemas.ts
│   ├── stations.repository.ts
│   ├── stations.service.ts
│   ├── stations.controller.ts
│   └── stations.routes.ts
└── admin/
    ├── admin.routes.ts              ← mounts admin-trains + admin-bookings sub-routers
    └── admin-trains/
        ├── admin-trains.schemas.ts
        ├── admin-trains.repository.ts
        ├── admin-trains.service.ts
        ├── admin-trains.controller.ts
        └── admin-trains.routes.ts
```

Mount in `index.ts`:
```typescript
app.use("/api/v1/stations", stationsRouter);    // public GET, admin POST/PATCH/DELETE
app.use("/api/v1/admin",    adminRouter);
```

---

## 1. Stations

### `stations.schemas.ts`
```typescript
import { z } from "zod";

export const createStationSchema = z.object({
  code: z.string().min(2).max(10).toUpperCase(),
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
});

export const updateStationSchema = createStationSchema.partial();

export const stationListQuerySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const stationParamsSchema = z.object({ id: z.string().cuid() });

export type CreateStationDto = z.infer<typeof createStationSchema>;
export type UpdateStationDto = z.infer<typeof updateStationSchema>;
```

### `stations.repository.ts`
```typescript
import { prisma } from "../config/prisma";
import { getPaginationSkip } from "../utils/pagination.utils";

export const stationsRepository = {
  create(data: { code: string; name: string; city: string; state: string }) {
    return prisma.station.create({ data });
  },

  findAll({ page, limit, search }: { page: number; limit: number; search?: string }) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    return Promise.all([
      prisma.station.findMany({
        where,
        skip: getPaginationSkip({ page, limit }),
        take: limit,
        orderBy: { code: "asc" },
      }),
      prisma.station.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.station.findUnique({ where: { id } });
  },

  findByCode(code: string) {
    return prisma.station.findUnique({ where: { code } });
  },

  update(id: string, data: Partial<{ code: string; name: string; city: string; state: string }>) {
    return prisma.station.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.station.delete({ where: { id } });
  },
};
```

### `stations.service.ts` — key logic
```typescript
async list(query) {
  const [stations, total] = await stationsRepository.findAll(query);
  return { data: stations, meta: getPaginationMeta(total, query) };
},

async create(dto) {
  const existing = await stationsRepository.findByCode(dto.code);
  if (existing) throw new ConflictError(`Station code ${dto.code} already exists`);
  return stationsRepository.create(dto);
},
```

### `stations.routes.ts`
```typescript
// GET /stations and GET /stations/:id are PUBLIC (used by passenger search)
// POST /stations, PATCH, DELETE require ADMIN
stationsRouter.get("/",    validate({ query: stationListQuerySchema }), stationsController.list);
stationsRouter.get("/:id", validate({ params: stationParamsSchema }),   stationsController.getById);
stationsRouter.post("/",   verifyJWT, requireRole(Role.ADMIN), validate({ body: createStationSchema }), stationsController.create);
stationsRouter.patch("/:id", verifyJWT, requireRole(Role.ADMIN), validate({ params: stationParamsSchema }), validate({ body: updateStationSchema }), stationsController.update);
stationsRouter.delete("/:id", verifyJWT, requireRole(Role.ADMIN), validate({ params: stationParamsSchema }), stationsController.delete);
```

---

## 2. Admin Trains

### `admin-trains.schemas.ts`
```typescript
import { z } from "zod";
import { TrainType, SeatClassName, BerthType } from "@prisma/client";

export const createTrainSchema = z.object({
  trainNumber: z.string().min(4).max(10),
  name:        z.string().min(2).max(100),
  type:        z.nativeEnum(TrainType),
});

export const updateTrainSchema = createTrainSchema.partial();

// For batch route-stop set — replaces ALL stops in one transaction
export const setRouteStopsSchema = z.object({
  stops: z.array(z.object({
    stationId:    z.string().cuid(),
    sequence:     z.number().int().positive(),
    arrivalTime:  z.string().regex(/^\d{2}:\d{2}$/).optional(),  // "HH:MM"
    departureTime:z.string().regex(/^\d{2}:\d{2}$/).optional(),
    distanceKm:   z.number().int().min(0),
  })).min(2, "A train needs at least 2 stops"),
});

export const createCoachSchema = z.object({
  coachNumber: z.string().min(1).max(5),  // "S1", "B1", "A1"
  seatClassId: z.string().cuid(),
  totalSeats:  z.number().int().positive().max(100),
  // Seats are auto-generated based on totalSeats + default berthType assignment
});

export const createScheduleSchema = z.object({
  journeyDate: z.string().date(),  // "YYYY-MM-DD"
});

export const trainParamsSchema   = z.object({ id: z.string().cuid() });
export const coachParamsSchema   = z.object({ id: z.string().cuid(), coachId: z.string().cuid() });
export const scheduleParamsSchema= z.object({ id: z.string().cuid() });
```

### `admin-trains.repository.ts` — key methods
```typescript
// Batch route-stop replace — deleteMany + createMany in ONE transaction
async setRouteStops(trainId: string, stops: StopDto[]) {
  return prisma.$transaction([
    prisma.trainRouteStop.deleteMany({ where: { trainId } }),
    prisma.trainRouteStop.createMany({
      data: stops.map(s => ({ ...s, trainId })),
    }),
  ]);
},

// Create coach AND auto-generate Seat rows
async createCoachWithSeats(trainId: string, dto: CreateCoachDto) {
  return prisma.$transaction(async (tx) => {
    const coach = await tx.coach.create({
      data: { trainId, coachNumber: dto.coachNumber, seatClassId: dto.seatClassId, totalSeats: dto.totalSeats },
    });
    const seats = generateSeats(dto.totalSeats);  // helper: returns array of { seatNumber, berthType }
    await tx.seat.createMany({ data: seats.map(s => ({ ...s, coachId: coach.id })) });
    return coach;
  });
},
```

### Seat Generation Helper
Berth assignment pattern for a coach of N seats (standard Indian railway pattern):
```typescript
function generateSeats(totalSeats: number) {
  const berthCycle: BerthType[] = [
    BerthType.LOWER, BerthType.MIDDLE, BerthType.UPPER,
    BerthType.LOWER, BerthType.MIDDLE, BerthType.UPPER,
    BerthType.SIDE_LOWER, BerthType.SIDE_UPPER,
  ];
  return Array.from({ length: totalSeats }, (_, i) => ({
    seatNumber: i + 1,
    berthType: berthCycle[i % berthCycle.length],
  }));
}
```

---

## 3. Schedule Creation + SeatAvailability Pre-population (CRITICAL)

This is the most complex logic in Phase 3. When an admin creates a schedule for a train on a date:
1. Create a `TrainSchedule` row
2. Pre-populate ALL `SeatAvailability` rows — one row per (coach, fromStop, toStop) combination

### Why pre-population is required
`SeatAvailability` rows must exist BEFORE any booking so we can `SELECT FOR UPDATE` on them atomically during booking confirmation. Computing availability at query time cannot be locked.

### Algorithm
```
For each coach C of the train:
  Get all route stops: [stop1, stop2, stop3, ... stopN] ordered by sequence
  For each pair (fromStop, toStop) where fromStop.sequence < toStop.sequence:
    INSERT SeatAvailability {
      scheduleId: schedule.id,
      coachId:    C.id,
      fromStationId: fromStop.stationId,
      toStationId:   toStop.stationId,
      availableCount: C.totalSeats   ← full capacity at creation time
    }
```

Number of rows = coaches × C(stops, 2) = coaches × (n × (n-1) / 2)

### `admin-trains.service.ts` — schedule creation
```typescript
async createSchedule(trainId: string, journeyDate: string) {
  // Check train exists and has stops + coaches
  const train = await adminTrainsRepository.findTrainWithStopsAndCoaches(trainId);
  if (!train) throw new NotFoundError("Train");
  if (train.routeStops.length < 2) throw new ValidationError("Train needs at least 2 stops before scheduling");
  if (train.coaches.length === 0) throw new ValidationError("Train needs at least one coach before scheduling");

  const date = new Date(journeyDate);

  return prisma.$transaction(async (tx) => {
    // Create the schedule
    const schedule = await tx.trainSchedule.create({
      data: { trainId, journeyDate: date, status: "SCHEDULED" },
    });

    // Build all SeatAvailability rows
    const availabilityRows = [];
    const stops = train.routeStops.sort((a, b) => a.sequence - b.sequence);

    for (const coach of train.coaches) {
      for (let i = 0; i < stops.length - 1; i++) {
        for (let j = i + 1; j < stops.length; j++) {
          availabilityRows.push({
            scheduleId:     schedule.id,
            coachId:        coach.id,
            fromStationId:  stops[i].stationId,
            toStationId:    stops[j].stationId,
            availableCount: coach.totalSeats,
          });
        }
      }
    }

    await tx.seatAvailability.createMany({ data: availabilityRows });
    return schedule;
  });
},
```

---

## 4. Admin Routes Structure

### `admin.routes.ts`
```typescript
import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/auth.middleware";
import { Role } from "@prisma/client";
import { adminTrainsRouter } from "./admin-trains/admin-trains.routes";

export const adminRouter = Router();

// All admin routes require JWT + ADMIN role
adminRouter.use(verifyJWT, requireRole(Role.ADMIN));
adminRouter.use("/trains", adminTrainsRouter);
// Phase 10: adminRouter.use("/bookings", adminBookingsRouter);
```

### `admin-trains.routes.ts`
```typescript
export const adminTrainsRouter = Router();

adminTrainsRouter.get(    "/",                     adminTrainsController.list);
adminTrainsRouter.post(   "/",                     validate({ body: createTrainSchema }), adminTrainsController.create);
adminTrainsRouter.get(    "/:id",                  validate({ params: trainParamsSchema }), adminTrainsController.getById);
adminTrainsRouter.patch(  "/:id",                  validate({ params: trainParamsSchema }), validate({ body: updateTrainSchema }), adminTrainsController.update);
adminTrainsRouter.delete( "/:id",                  validate({ params: trainParamsSchema }), adminTrainsController.delete);

// Route stops (batch replace)
adminTrainsRouter.put(    "/:id/route-stops",      validate({ params: trainParamsSchema }), validate({ body: setRouteStopsSchema }), adminTrainsController.setRouteStops);
adminTrainsRouter.get(    "/:id/route-stops",      validate({ params: trainParamsSchema }), adminTrainsController.getRouteStops);

// Coaches
adminTrainsRouter.post(   "/:id/coaches",          validate({ params: trainParamsSchema }), validate({ body: createCoachSchema }), adminTrainsController.addCoach);
adminTrainsRouter.get(    "/:id/coaches",          validate({ params: trainParamsSchema }), adminTrainsController.getCoaches);
adminTrainsRouter.delete( "/:id/coaches/:coachId", validate({ params: coachParamsSchema }), adminTrainsController.deleteCoach);

// Schedules
adminTrainsRouter.post(   "/:id/schedules",        validate({ params: trainParamsSchema }), validate({ body: createScheduleSchema }), adminTrainsController.createSchedule);
adminTrainsRouter.get(    "/:id/schedules",        validate({ params: trainParamsSchema }), adminTrainsController.getSchedules);
```

---

## Verification Checklist

```bash
TOKEN="<admin JWT from Phase 2 login — update user role to ADMIN in DB first>"

# Create station
curl -X POST http://localhost:4000/api/v1/stations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"NDLS","name":"New Delhi","city":"New Delhi","state":"Delhi"}'

# Create train
curl -X POST http://localhost:4000/api/v1/admin/trains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trainNumber":"12301","name":"Rajdhani Express","type":"EXPRESS"}'

# Set route stops
curl -X PUT http://localhost:4000/api/v1/admin/trains/<trainId>/route-stops \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stops":[{"stationId":"<NDLS_ID>","sequence":1,"departureTime":"08:00","distanceKm":0},{"stationId":"<CSMT_ID>","sequence":2,"arrivalTime":"20:00","distanceKm":1447}]}'

# Add coach
curl -X POST http://localhost:4000/api/v1/admin/trains/<trainId>/coaches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"coachNumber":"S1","seatClassId":"<SLEEPER_ID>","totalSeats":72}'

# Create schedule → verify SeatAvailability rows in DB
curl -X POST http://localhost:4000/api/v1/admin/trains/<trainId>/schedules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"journeyDate":"2026-07-15"}'
# → Check DB: SELECT count(*) FROM "SeatAvailability" WHERE "scheduleId" = '<id>';
# Should be coaches × C(stops,2) rows
```

## Gotchas
- Route-stop batch endpoint uses `deleteMany + createMany` in ONE transaction — never delete then recreate separately
- `SeatAvailability.availableCount` is set to `coach.totalSeats` at schedule creation — NOT decremented during seat holds, ONLY decremented at confirmed booking
- When deleting a train, use `onDelete: Cascade` (already set in schema) so route stops, coaches, seats, schedules cascade
- `journeyDate` is stored as `@db.Date` — strip the time component when querying: use `new Date(journeyDate)` from "YYYY-MM-DD" string
