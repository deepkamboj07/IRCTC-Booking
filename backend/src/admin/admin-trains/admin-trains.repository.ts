import { BerthType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { getPaginationSkip } from "../../utils/pagination.utils";
import { CreateTrainDto, UpdateTrainDto, CreateCoachDto, SetRouteStopsDto } from "./admin-trains.schemas";

// Standard Indian railway berth cycle per compartment (6 main + 2 side)
function generateSeats(totalSeats: number) {
  const berthCycle: BerthType[] = [
    BerthType.LOWER,
    BerthType.MIDDLE,
    BerthType.UPPER,
    BerthType.LOWER,
    BerthType.MIDDLE,
    BerthType.UPPER,
    BerthType.SIDE_LOWER,
    BerthType.SIDE_UPPER,
  ];
  return Array.from({ length: totalSeats }, (_, i) => ({
    seatNumber: i + 1,
    berthType:  berthCycle[i % berthCycle.length],
  }));
}

export const adminTrainsRepository = {
  create(data: CreateTrainDto) {
    return prisma.train.create({ data });
  },

  findAll({ page, limit, search }: { page: number; limit: number; search?: string }) {
    const where = search
      ? {
          OR: [
            { name:        { contains: search, mode: "insensitive" as const } },
            { trainNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    return Promise.all([
      prisma.train.findMany({
        where,
        skip:    getPaginationSkip({ page, limit }),
        take:    limit,
        orderBy: { trainNumber: "asc" },
        include: { _count: { select: { coaches: true, schedules: true } } },
      }),
      prisma.train.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.train.findUnique({
      where: { id },
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

  findTrainWithStopsAndCoaches(id: string) {
    return prisma.train.findUnique({
      where: { id },
      include: {
        routeStops: { orderBy: { sequence: "asc" } },
        coaches:    true,
      },
    });
  },

  findByTrainNumber(trainNumber: string) {
    return prisma.train.findUnique({ where: { trainNumber } });
  },

  update(id: string, data: UpdateTrainDto) {
    return prisma.train.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.train.delete({ where: { id } });
  },

  // Replaces ALL route stops in one atomic transaction
  async setRouteStops(trainId: string, stops: SetRouteStopsDto["stops"]) {
    return prisma.$transaction([
      prisma.trainRouteStop.deleteMany({ where: { trainId } }),
      prisma.trainRouteStop.createMany({
        data: stops.map(s => ({ ...s, trainId })),
      }),
    ]);
  },

  getRouteStops(trainId: string) {
    return prisma.trainRouteStop.findMany({
      where:   { trainId },
      include: { station: true },
      orderBy: { sequence: "asc" },
    });
  },

  // Creates coach + auto-generates Seat rows in one transaction
  createCoachWithSeats(trainId: string, dto: CreateCoachDto) {
    return prisma.$transaction(async tx => {
      const coach = await tx.coach.create({
        data: {
          trainId,
          coachNumber: dto.coachNumber,
          seatClassId: dto.seatClassId,
          totalSeats:  dto.totalSeats,
        },
        include: { seatClass: true },
      });
      await tx.seat.createMany({
        data: generateSeats(dto.totalSeats).map(s => ({ ...s, coachId: coach.id })),
      });
      return coach;
    });
  },

  getCoaches(trainId: string) {
    return prisma.coach.findMany({
      where:   { trainId },
      include: { seatClass: true, _count: { select: { seats: true } } },
      orderBy: { coachNumber: "asc" },
    });
  },

  deleteCoach(coachId: string) {
    return prisma.coach.delete({ where: { id: coachId } });
  },

  // Schedule creation + SeatAvailability pre-population — single transaction
  createScheduleWithAvailability(
    trainId: string,
    journeyDate: Date,
    coaches: Array<{ id: string; totalSeats: number }>,
    stops: Array<{ stationId: string; sequence: number }>
  ) {
    return prisma.$transaction(async tx => {
      const schedule = await tx.trainSchedule.create({
        data: { trainId, journeyDate, status: "SCHEDULED" },
      });

      const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
      const availabilityRows = [];

      for (const coach of coaches) {
        for (let i = 0; i < sortedStops.length - 1; i++) {
          for (let j = i + 1; j < sortedStops.length; j++) {
            availabilityRows.push({
              scheduleId:     schedule.id,
              coachId:        coach.id,
              fromStationId:  sortedStops[i].stationId,
              toStationId:    sortedStops[j].stationId,
              availableCount: coach.totalSeats,
            });
          }
        }
      }

      await tx.seatAvailability.createMany({ data: availabilityRows });
      return { schedule, availabilityRowsCreated: availabilityRows.length };
    });
  },

  getSchedules(trainId: string) {
    return prisma.trainSchedule.findMany({
      where:   { trainId },
      orderBy: { journeyDate: "asc" },
      include: { _count: { select: { bookings: true } } },
    });
  },

  findCoach(coachId: string) {
    return prisma.coach.findUnique({ where: { id: coachId } });
  },
};
