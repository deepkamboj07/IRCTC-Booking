import { z } from "zod";
import { prisma } from "../../config/prisma";
import { getPaginationMeta } from "../../utils/pagination.utils";

export const adminBookingsQuerySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "WAITLISTED"]).optional(),
  date:   z.string().date().optional(),
});

export type AdminBookingsQuery = z.infer<typeof adminBookingsQuerySchema>;

export const adminBookingsService = {
  async list(query: AdminBookingsQuery) {
    const { page, limit, status, date } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(date
        ? {
            schedule: {
              journeyDate: new Date(date),
            },
          }
        : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user:        { select: { id: true, name: true, email: true } },
          schedule:    { include: { train: { select: { trainNumber: true, name: true } } } },
          fromStation: { select: { code: true, name: true } },
          toStation:   { select: { code: true, name: true } },
          passengers:  { select: { id: true, name: true, age: true, gender: true, status: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data: bookings.map((b) => ({
        ...b,
        totalFare: Number(b.totalFare),
      })),
      meta: getPaginationMeta(total, query),
    };
  },
};
