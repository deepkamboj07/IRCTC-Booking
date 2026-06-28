import { TrainType } from "@prisma/client";
import { prisma } from "../config/prisma";

export const trainsRepository = {
  async searchTrains({
    fromCode,
    toCode,
    date,
    type,
  }: {
    fromCode: string;
    toCode: string;
    date: Date;
    type?: TrainType;
  }) {
    const trains = await prisma.train.findMany({
      where: {
        ...(type ? { type } : {}),
        routeStops: {
          some: { station: { code: fromCode } },
        },
        AND: {
          routeStops: {
            some: { station: { code: toCode } },
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

    // Direction check must happen in app code — Prisma cannot compare two fields from the same join
    return trains.filter((train) => {
      const fromStop = train.routeStops.find((s) => s.station.code === fromCode);
      const toStop   = train.routeStops.find((s) => s.station.code === toCode);
      return fromStop && toStop && fromStop.sequence < toStop.sequence;
    });
  },

  // Single query for all schedules — eliminates N+1 from the old per-train approach
  async getAvailabilityBatch(
    scheduleIds: string[],
    fromStationId: string,
    toStationId: string,
  ) {
    if (scheduleIds.length === 0) return [];
    return prisma.seatAvailability.findMany({
      where: { scheduleId: { in: scheduleIds }, fromStationId, toStationId },
      include: { coach: { include: { seatClass: true } } },
    });
  },

  async getAvailabilityByClass(
    scheduleId: string,
    fromStationId: string,
    toStationId: string,
  ) {
    return prisma.seatAvailability.findMany({
      where: { scheduleId, fromStationId, toStationId },
      include: { coach: { include: { seatClass: true } } },
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
