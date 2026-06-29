import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { bookingsRepository } from "./bookings.repository";
import { generatePNR } from "../utils/pnr.utils";
import { computeFare } from "../utils/fare.utils";
import { getPaginationMeta } from "../utils/pagination.utils";
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from "../errors/app.errors";
import { CreateBookingDto, BookingListQuery } from "./bookings.schemas";

interface HoldMeta {
  userId: string;
  scheduleId: string;
  coachId: string;
  fromStationId: string;
  toStationId: string;
  seatIds: string[];
}

export const bookingsService = {
  async confirmBooking(userId: string, dto: CreateBookingDto) {
    // 1. Atomically consume hold metadata — GETDEL ensures only one concurrent
    //    confirm request can proceed even if the user double-submits.
    const raw = await redis.get(`hold_meta:${dto.holdId}`);
    if (!raw) throw new ConflictError("Your seat hold has expired. Please reselect seats.");

    const meta = JSON.parse(raw) as HoldMeta;

    // 2. Verify hold belongs to this user
    if (meta.userId !== userId) {
      // Restore the hold_meta so the real owner can still use it
      await redis.setex(`hold_meta:${dto.holdId}`, await redis.ttl(`hold_meta:${dto.holdId}`), raw);
      throw new ForbiddenError();
    }

    // 3. Verify passenger seatIds are a subset of held seatIds
    const holdSeatSet = new Set(meta.seatIds);
    const dtoSeatSet  = new Set(dto.passengers.map((p) => p.seatId));
    if (![...dtoSeatSet].every((id) => holdSeatSet.has(id))) {
      throw new ValidationError("Passenger seatIds do not match the held seats");
    }

    // 4. Paranoia check — all individual seat keys must still exist in Redis
    const seatKeys  = meta.seatIds.map((id) => `hold:${meta.scheduleId}:${id}`);
    const keyValues = await redis.mget(...seatKeys);
    if (keyValues.some((v) => v === null)) {
      throw new ConflictError("Some held seats have expired. Please reselect.");
    }

    // 5. Fetch coach + seat class for fare calculation
    const coach = await prisma.coach.findUnique({
      where: { id: meta.coachId },
      include: { seatClass: true },
    });
    if (!coach) throw new NotFoundError("Coach");

    const [fromStop, toStop] = await Promise.all([
      prisma.trainRouteStop.findFirst({
        where: {
          stationId: meta.fromStationId,
          train: { coaches: { some: { id: meta.coachId } } },
        },
      }),
      prisma.trainRouteStop.findFirst({
        where: {
          stationId: meta.toStationId,
          train: { coaches: { some: { id: meta.coachId } } },
        },
      }),
    ]);

    const distanceKm = (toStop?.distanceKm ?? 0) - (fromStop?.distanceKm ?? 0);
    const multiplier = Number(coach.seatClass.priceMultiplier);
    const totalFare  = computeFare(distanceKm, multiplier, dto.passengers.length);
    const pnr        = generatePNR();

    // 6. PostgreSQL transaction: SELECT FOR UPDATE → create booking + passengers → decrement availableCount
    const booking = await prisma.$transaction(async (tx) => {
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

      // Guard against UI bypass or double-submit: ensure no seat is already in
      // an active (non-cancelled) BookingPassenger row.
      const alreadyBooked = await tx.bookingPassenger.findFirst({
        where: {
          seatId: { in: meta.seatIds },
          status: { not: "CANCELLED" },
        },
      });
      if (alreadyBooked) {
        throw new ConflictError("One or more seats are already booked. Please reselect.");
      }

      const newBooking = await tx.booking.create({
        data: {
          userId,
          scheduleId:    meta.scheduleId,
          fromStationId: meta.fromStationId,
          toStationId:   meta.toStationId,
          pnr,
          status:   "CONFIRMED",
          totalFare,
          passengers: {
            create: dto.passengers.map((p) => ({
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

      await tx.seatAvailability.update({
        where: { id: rows[0].id },
        data:  { availableCount: { decrement: dto.passengers.length } },
      });

      return newBooking;
    });

    // 7. DEL Redis keys only after the PG transaction has committed
    await redis.del(...seatKeys, `hold_meta:${dto.holdId}`);

    return { booking, pnr };
  },

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await bookingsRepository.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking");
    if (booking.userId !== userId) throw new ForbiddenError();
    if (booking.status === "CANCELLED") throw new ConflictError("Booking is already cancelled");

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

  async getMyBookings(userId: string, query: BookingListQuery) {
    const [bookings, total] = await bookingsRepository.findByUserId(userId, query);
    return { data: bookings, meta: getPaginationMeta(total, query) };
  },

  async getById(bookingId: string, userId: string) {
    const booking = await bookingsRepository.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking");
    if (booking.userId !== userId) throw new ForbiddenError();
    return booking;
  },

  async getByPnr(pnr: string, userId: string) {
    const booking = await bookingsRepository.findByPnr(pnr);
    if (!booking) throw new NotFoundError("Booking");
    if (booking.userId !== userId) throw new ForbiddenError();
    return booking;
  },
};
