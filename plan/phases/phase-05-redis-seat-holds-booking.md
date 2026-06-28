# Phase 5 — Redis Seat Holds + Booking Confirmation

## Goal
Build the core booking flow:
1. **Seat Hold** — user selects seats → Redis `SET NX EX 300` → 5-minute countdown starts
2. **Booking Confirmation** — user fills passenger details → read Redis hold → PostgreSQL transaction → clear Redis keys
3. **Booking cancellation** → PostgreSQL transaction → restore `availableCount`
4. **My bookings** → CRUD for passenger's bookings

## Files to Create
```
backend/src/
├── seat-holds/
│   ├── seatHolds.schemas.ts
│   ├── seatHolds.service.ts      ← Redis ops only (no repository — all Redis in service)
│   ├── seatHolds.controller.ts
│   └── seatHolds.routes.ts
└── bookings/
    ├── bookings.schemas.ts
    ├── bookings.repository.ts
    ├── bookings.service.ts
    ├── bookings.controller.ts
    └── bookings.routes.ts
```

Mount in `index.ts`:
```typescript
app.use("/api/v1/seat-holds", seatHoldsRouter);
app.use("/api/v1/bookings",   bookingsRouter);
```

Also install `@paralleldrive/cuid2` for generating `holdId`:
```bash
npm install @paralleldrive/cuid2
```

---

## Redis Key Schema (memorize this)
```
hold:{scheduleId}:{seatId}    → userId           TTL: 300s
hold_meta:{holdId}             → JSON string      TTL: 300s
```

---

## 1. `seatHolds.schemas.ts`

```typescript
import { z } from "zod";

export const createHoldSchema = z.object({
  scheduleId:    z.string().cuid(),
  coachId:       z.string().cuid(),
  fromStationId: z.string().cuid(),
  toStationId:   z.string().cuid(),
  seatIds:       z.array(z.string().cuid()).min(1).max(6),
});

export const holdParamsSchema = z.object({
  holdId: z.string().min(1),
});

export type CreateHoldDto = z.infer<typeof createHoldSchema>;
```

---

## 2. `seatHolds.service.ts` — The Most Critical File

```typescript
import { createId } from "@paralleldrive/cuid2";
import { redis } from "../config/redis";
import { ConflictError, NotFoundError, ForbiddenError } from "../errors/app.errors";
import { CreateHoldDto } from "./seatHolds.schemas";

const HOLD_TTL = 300; // 5 minutes

export const seatHoldsService = {
  async createHold(userId: string, dto: CreateHoldDto) {
    const holdId = createId();
    const holdKeys = dto.seatIds.map(seatId => `hold:${dto.scheduleId}:${seatId}`);

    // Atomic multi-SET via Redis pipeline — SET NX EX 300 for each seat
    const pipeline = redis.pipeline();
    holdKeys.forEach(key => pipeline.set(key, userId, "NX", "EX", HOLD_TTL));
    const results = await pipeline.exec();

    // Check if any seat was already held by someone else
    const failedIndex = results?.findIndex(([err, val]) => err || val === null);
    if (failedIndex !== undefined && failedIndex >= 0) {
      // Roll back the keys that DID get set in this request
      const keysToDelete = holdKeys.filter((_, i) => results?.[i]?.[1] === "OK");
      if (keysToDelete.length > 0) await redis.del(...keysToDelete);
      throw new ConflictError("One or more seats are already held. Please reselect.");
    }

    // Store hold metadata (all info needed at confirmation time)
    const meta = JSON.stringify({ userId, ...dto });
    await redis.setex(`hold_meta:${holdId}`, HOLD_TTL, meta);

    const expiresAt = new Date(Date.now() + HOLD_TTL * 1000).toISOString();
    return { holdId, expiresAt, seatIds: dto.seatIds };
  },

  async getHold(holdId: string, userId: string) {
    const raw = await redis.get(`hold_meta:${holdId}`);
    if (!raw) throw new NotFoundError("Hold (may have expired)");

    const meta = JSON.parse(raw);
    if (meta.userId !== userId) throw new ForbiddenError();

    const ttl = await redis.ttl(`hold_meta:${holdId}`);
    return { ...meta, holdId, ttlSeconds: ttl };
  },

  async releaseHold(holdId: string, userId: string) {
    const raw = await redis.get(`hold_meta:${holdId}`);
    if (!raw) return; // already expired — no-op

    const meta = JSON.parse(raw);
    if (meta.userId !== userId) throw new ForbiddenError();

    // DEL seat keys + meta key
    const seatKeys = (meta.seatIds as string[]).map(
      (seatId: string) => `hold:${meta.scheduleId}:${seatId}`
    );
    await redis.del(...seatKeys, `hold_meta:${holdId}`);
  },
};
```

---

## 3. `bookings.schemas.ts`

```typescript
import { z } from "zod";
import { PassengerGender } from "@prisma/client";

const passengerSchema = z.object({
  seatId: z.string().cuid(),
  name:   z.string().min(2).max(100),
  age:    z.number().int().positive().max(120),
  gender: z.nativeEnum(PassengerGender),
});

export const createBookingSchema = z.object({
  holdId:     z.string().min(1),
  passengers: z.array(passengerSchema).min(1).max(6),
});

export const bookingParamsSchema = z.object({ id: z.string().cuid() });

export const bookingListQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
```

---

## 4. `bookings.repository.ts`

```typescript
import { prisma } from "../config/prisma";
import { getPaginationSkip } from "../utils/pagination.utils";
import { BookingStatus } from "@prisma/client";

export const bookingsRepository = {
  // SELECT FOR UPDATE on SeatAvailability — used at booking confirmation
  // Must be called INSIDE a prisma.$transaction
  lockSeatAvailability(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], scheduleId: string, coachId: string, fromStationId: string, toStationId: string) {
    return tx.$queryRaw`
      SELECT id, "availableCount"
      FROM "SeatAvailability"
      WHERE "scheduleId" = ${scheduleId}
        AND "coachId" = ${coachId}
        AND "fromStationId" = ${fromStationId}
        AND "toStationId" = ${toStationId}
      FOR UPDATE
    `;
  },

  findByUserId(userId: string, { page, limit }: { page: number; limit: number }) {
    return Promise.all([
      prisma.booking.findMany({
        where: { userId },
        include: {
          schedule: { include: { train: true } },
          fromStation: true,
          toStation: true,
          passengers: true,
        },
        orderBy: { createdAt: "desc" },
        skip: getPaginationSkip({ page, limit }),
        take: limit,
      }),
      prisma.booking.count({ where: { userId } }),
    ]);
  },

  findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        schedule: { include: { train: { include: { routeStops: { include: { station: true }, orderBy: { sequence: "asc" } } } } } },
        fromStation: true,
        toStation: true,
        passengers: { include: { seat: true } },
      },
    });
  },

  findByPnr(pnr: string) {
    return prisma.booking.findUnique({
      where: { pnr },
      include: {
        schedule: { include: { train: true } },
        fromStation: true,
        toStation: true,
        passengers: { include: { seat: true } },
      },
    });
  },
};
```

---

## 5. `bookings.service.ts` — Confirm Booking (Most Complex)

```typescript
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { bookingsRepository } from "./bookings.repository";
import { generatePNR } from "../utils/pnr.utils";
import { computeFare } from "../utils/fare.utils";
import { getPaginationMeta } from "../utils/pagination.utils";
import {
  NotFoundError, ForbiddenError, ConflictError, ValidationError
} from "../errors/app.errors";
import { CreateBookingDto } from "./bookings.schemas";

export const bookingsService = {
  async confirmBooking(userId: string, dto: CreateBookingDto) {
    // 1. Read hold metadata from Redis
    const raw = await redis.get(`hold_meta:${dto.holdId}`);
    if (!raw) throw new ConflictError("Your seat hold has expired. Please reselect seats.");

    const meta = JSON.parse(raw) as {
      userId: string;
      scheduleId: string;
      coachId: string;
      fromStationId: string;
      toStationId: string;
      seatIds: string[];
    };

    // 2. Verify the hold belongs to this user
    if (meta.userId !== userId) throw new ForbiddenError();

    // 3. Verify seatIds in dto match the hold's seatIds
    const holdSeatSet = new Set(meta.seatIds);
    const dtoSeatSet  = new Set(dto.passengers.map(p => p.seatId));
    if (![...dtoSeatSet].every(id => holdSeatSet.has(id))) {
      throw new ValidationError("Passenger seatIds do not match the held seats");
    }

    // 4. Paranoia check — verify each seat key still exists in Redis
    const seatKeys = meta.seatIds.map(id => `hold:${meta.scheduleId}:${id}`);
    const keyValues = await redis.mget(...seatKeys);
    if (keyValues.some(v => v === null)) {
      throw new ConflictError("Some held seats have expired. Please reselect.");
    }

    // 5. Fetch SeatClass for fare calculation
    const coach = await prisma.coach.findUnique({
      where: { id: meta.coachId },
      include: { seatClass: true },
    });
    if (!coach) throw new NotFoundError("Coach");

    // Fetch distance for this segment
    const [fromStop, toStop] = await Promise.all([
      prisma.trainRouteStop.findFirst({
        where: { stationId: meta.fromStationId, train: { coaches: { some: { id: meta.coachId } } } },
      }),
      prisma.trainRouteStop.findFirst({
        where: { stationId: meta.toStationId, train: { coaches: { some: { id: meta.coachId } } } },
      }),
    ]);

    const distanceKm = (toStop?.distanceKm ?? 0) - (fromStop?.distanceKm ?? 0);
    const multiplier = Number(coach.seatClass.priceMultiplier);
    const totalFare  = computeFare(distanceKm, multiplier, dto.passengers.length);
    const pnr = generatePNR();

    // 6. PostgreSQL transaction: SELECT FOR UPDATE → create Booking + Passengers → decrement availableCount
    const booking = await prisma.$transaction(async (tx) => {
      // Lock the SeatAvailability row
      const rows = await tx.$queryRaw<Array<{ id: string; availableCount: number }>>`
        SELECT id, "availableCount"
        FROM "SeatAvailability"
        WHERE "scheduleId" = ${meta.scheduleId}
          AND "coachId" = ${meta.coachId}
          AND "fromStationId" = ${meta.fromStationId}
          AND "toStationId" = ${meta.toStationId}
        FOR UPDATE
      `;

      if (!rows[0]) throw new ConflictError("Seat availability record not found");
      if (rows[0].availableCount < dto.passengers.length) {
        throw new ConflictError("Not enough seats available");
      }

      // Create Booking
      const newBooking = await tx.booking.create({
        data: {
          userId,
          scheduleId:    meta.scheduleId,
          fromStationId: meta.fromStationId,
          toStationId:   meta.toStationId,
          pnr,
          status:        "CONFIRMED",
          totalFare,
          passengers: {
            create: dto.passengers.map(p => ({
              seatId: p.seatId,
              name:   p.name,
              age:    p.age,
              gender: p.gender,
              status: "CONFIRMED" as const,
            })),
          },
        },
        include: { passengers: true },
      });

      // Decrement availableCount
      await tx.seatAvailability.update({
        where: { id: rows[0].id },
        data: { availableCount: { decrement: dto.passengers.length } },
      });

      return newBooking;
    });

    // 7. DEL all Redis hold keys AFTER successful DB commit
    await redis.del(...seatKeys, `hold_meta:${dto.holdId}`);

    return { booking, pnr };
  },

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await bookingsRepository.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking");
    if (booking.userId !== userId) throw new ForbiddenError();
    if (booking.status === "CANCELLED") throw new ConflictError("Booking is already cancelled");

    // Transaction: SELECT FOR UPDATE → increment availableCount → update status
    await prisma.$transaction(async (tx) => {
      const coachId = booking.passengers[0]?.seat.coachId;
      if (coachId) {
        await tx.$executeRaw`
          UPDATE "SeatAvailability"
          SET "availableCount" = "availableCount" + ${booking.passengers.length}
          WHERE "scheduleId" = ${booking.scheduleId}
            AND "coachId" = ${coachId}
            AND "fromStationId" = ${booking.fromStationId}
            AND "toStationId" = ${booking.toStationId}
        `;
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          passengers: { updateMany: { where: {}, data: { status: "CANCELLED" } } },
        },
      });
    });

    return { message: "Booking cancelled successfully" };
  },

  async getMyBookings(userId: string, query: { page: number; limit: number }) {
    const [bookings, total] = await bookingsRepository.findByUserId(userId, query);
    return { data: bookings, meta: getPaginationMeta(total, query) };
  },
};
```

---

## 6. Routes

### `seatHolds.routes.ts`
```typescript
seatHoldsRouter.post("/",          verifyJWT, validate({ body: createHoldSchema }),  seatHoldsController.create);
seatHoldsRouter.get("/:holdId",    verifyJWT, validate({ params: holdParamsSchema }), seatHoldsController.get);
seatHoldsRouter.delete("/:holdId", verifyJWT, validate({ params: holdParamsSchema }), seatHoldsController.release);
```

### `bookings.routes.ts`
```typescript
bookingsRouter.post("/",              verifyJWT, validate({ body: createBookingSchema }),  bookingsController.confirm);
bookingsRouter.get("/",               verifyJWT, validate({ query: bookingListQuerySchema }), bookingsController.list);
bookingsRouter.get("/pnr/:pnr",       verifyJWT, bookingsController.getByPnr);
bookingsRouter.get("/:id",            verifyJWT, validate({ params: bookingParamsSchema }), bookingsController.getById);
bookingsRouter.patch("/:id/cancel",   verifyJWT, validate({ params: bookingParamsSchema }), bookingsController.cancel);
```

---

## Verification Checklist

```bash
# 1. Create hold (after Phase 4 seat map shows AVAILABLE seats)
curl -X POST http://localhost:4000/api/v1/seat-holds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduleId":"...","coachId":"...","fromStationId":"...","toStationId":"...","seatIds":["..."]}'
# → { holdId: "...", expiresAt: "...", seatIds: [...] }

# 2. Verify Redis key exists
redis-cli GET "hold:<scheduleId>:<seatId>"     # should return userId
redis-cli TTL "hold:<scheduleId>:<seatId>"     # should be ~300

# 3. Seat map should now show that seat as HELD
curl "http://localhost:4000/api/v1/trains/.../schedules/.../coaches/.../seats" \
  -H "Authorization: Bearer $TOKEN"
# → seat status = "HELD"

# 4. Concurrency test — try to hold same seat with 2 simultaneous requests
# Only 1 should succeed, the other gets 409

# 5. Confirm booking
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"holdId":"...","passengers":[{"seatId":"...","name":"Deep","age":25,"gender":"MALE"}]}'
# → { booking: {...}, pnr: "AB12CD34" }

# 6. After booking: Redis keys should be gone
redis-cli GET "hold_meta:<holdId>"  # should return nil

# 7. SeatAvailability.availableCount should be decremented
# (check in Prisma Studio or psql)

# 8. Cancel booking
curl -X PATCH http://localhost:4000/api/v1/bookings/<id>/cancel \
  -H "Authorization: Bearer $TOKEN"
# → availableCount restored in DB
```

## Gotchas
- DEL Redis keys ONLY AFTER the PG transaction commits successfully — if the transaction fails, the hold should remain
- `redis.pipeline()` executes commands in a batch but is NOT atomic across commands — `SET NX` for each key IS atomic individually, which is what prevents race conditions
- Do NOT decrement `SeatAvailability.availableCount` during hold creation — only at confirmation
- The `SELECT FOR UPDATE` is the final safety net against two simultaneous confirmations of the same seat
- Cancellation also needs `SELECT FOR UPDATE` (or `$executeRaw` UPDATE) to prevent race with a concurrent booking
- `redis.mget(...keys)` — spread the array: `await redis.mget(...keysArray)`, not `await redis.mget(keysArray)`
