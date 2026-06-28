import { prisma } from "../config/prisma";
import { getPaginationSkip } from "../utils/pagination.utils";

export const bookingsRepository = {
  findByUserId(userId: string, { page, limit }: { page: number; limit: number }) {
    return Promise.all([
      prisma.booking.findMany({
        where: { userId },
        include: {
          schedule:    { include: { train: true } },
          fromStation: true,
          toStation:   true,
          passengers:  true,
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
        schedule: {
          include: {
            train: {
              include: {
                routeStops: { include: { station: true }, orderBy: { sequence: "asc" } },
              },
            },
          },
        },
        fromStation: true,
        toStation:   true,
        passengers:  { include: { seat: true } },
      },
    });
  },

  findByPnr(pnr: string) {
    return prisma.booking.findUnique({
      where: { pnr },
      include: {
        schedule:    { include: { train: true } },
        fromStation: true,
        toStation:   true,
        passengers:  { include: { seat: true } },
      },
    });
  },
};
