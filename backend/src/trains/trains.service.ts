import { trainsRepository } from "./trains.repository";
import { TrainSearchQuery } from "./trains.schemas";
import { NotFoundError } from "../errors/app.errors";
import { redis } from "../config/redis";
import { getPaginationMeta, getPaginationSkip } from "../utils/pagination.utils";

interface ClassCount {
  displayName: string;
  available: number;
  coachIds: string[];
}

function getDurationMins(dep: string, arr: string): number {
  const [dh, dm] = dep.split(":").map(Number);
  const [ah, am] = arr.split(":").map(Number);
  let depMins = dh * 60 + dm;
  let arrMins  = ah * 60 + am;
  if (arrMins <= depMins) arrMins += 24 * 60; // overnight train
  return arrMins - depMins;
}

export const trainsService = {
  async searchTrains(dto: TrainSearchQuery) {
    const date = new Date(dto.date);

    // 1. DB query — type filter applied here so the DB does the heavy lifting
    const trains = await trainsRepository.searchTrains({
      fromCode: dto.from,
      toCode:   dto.to,
      date,
      type:     dto.type as Parameters<typeof trainsRepository.searchTrains>[0]["type"],
    });

    // 2. Direction filter (app-level — Prisma cannot compare fields within the same join)
    const directed = trains.filter((train) => {
      const fromStop = train.routeStops.find((s) => s.station.code === dto.from);
      const toStop   = train.routeStops.find((s) => s.station.code === dto.to);
      return fromStop && toStop && fromStop.sequence < toStop.sequence;
    });

    if (directed.length === 0) {
      return { data: [], meta: getPaginationMeta(0, { page: dto.page, limit: dto.limit }) };
    }

    // 3. Resolve station IDs once — codes are unique, so every train shares the same IDs
    const sample         = directed[0];
    const fromStationId  = sample.routeStops.find((s) => s.station.code === dto.from)?.stationId;
    const toStationId    = sample.routeStops.find((s) => s.station.code === dto.to)?.stationId;

    if (!fromStationId || !toStationId) {
      return { data: [], meta: getPaginationMeta(0, { page: dto.page, limit: dto.limit }) };
    }

    // 4. Single batch availability query — eliminates N+1
    const scheduleIds = directed
      .map((t) => t.schedules[0]?.id)
      .filter((id): id is string => Boolean(id));

    const allAvailability = await trainsRepository.getAvailabilityBatch(
      scheduleIds,
      fromStationId,
      toStationId,
    );

    // 5. Group availability rows by scheduleId for O(1) lookup
    const availBySchedule = allAvailability.reduce<Record<string, typeof allAvailability>>(
      (acc, row) => {
        (acc[row.scheduleId] ??= []).push(row);
        return acc;
      },
      {},
    );

    // 6. Build full result objects
    const results = directed
      .map((train) => {
        const schedule = train.schedules[0];
        if (!schedule) return null;

        const fromStop   = train.routeStops.find((s) => s.station.code === dto.from)!;
        const toStop     = train.routeStops.find((s) => s.station.code === dto.to)!;
        const rowsForSchedule = availBySchedule[schedule.id] ?? [];

        const classCounts = rowsForSchedule.reduce<Record<string, ClassCount>>((acc, row) => {
          const key = row.coach.seatClass.name;
          if (!acc[key]) {
            acc[key] = { displayName: row.coach.seatClass.displayName, available: 0, coachIds: [] };
          }
          acc[key].available += row.availableCount;
          acc[key].coachIds.push(row.coach.id);
          return acc;
        }, {});

        return {
          train:      { id: train.id, trainNumber: train.trainNumber, name: train.name, type: train.type },
          schedule:   { id: schedule.id, status: schedule.status },
          departure:  { station: fromStop.station, time: fromStop.departureTime ?? "", distanceKm: fromStop.distanceKm },
          arrival:    { station: toStop.station,   time: toStop.arrivalTime    ?? "", distanceKm: toStop.distanceKm },
          distanceKm: toStop.distanceKm - fromStop.distanceKm,
          classes:    Object.entries(classCounts).map(([name, data]) => ({ name, ...data })),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    // 7. Available-only filter (runs AFTER enrichment — needs class data)
    const afterFilter = dto.availableOnly === "true"
      ? results.filter((r) => r.classes.some((c) => c.available > 0))
      : results;

    // 8. Sort
    const sorted = [...afterFilter];
    if (dto.sortBy === "departure") {
      sorted.sort((a, b) => a.departure.time.localeCompare(b.departure.time));
    } else if (dto.sortBy === "availability") {
      sorted.sort((a, b) => {
        const sumA = a.classes.reduce((s, c) => s + c.available, 0);
        const sumB = b.classes.reduce((s, c) => s + c.available, 0);
        return sumB - sumA;
      });
    } else if (dto.sortBy === "duration") {
      sorted.sort(
        (a, b) =>
          getDurationMins(a.departure.time, a.arrival.time) -
          getDurationMins(b.departure.time, b.arrival.time),
      );
    }

    // 9. Paginate
    const total     = sorted.length;
    const skip      = getPaginationSkip({ page: dto.page, limit: dto.limit });
    const paginated = sorted.slice(skip, skip + dto.limit);

    return {
      data: paginated,
      meta: getPaginationMeta(total, { page: dto.page, limit: dto.limit }),
    };
  },

  async getById(trainId: string) {
    const train = await trainsRepository.findById(trainId);
    if (!train) throw new NotFoundError("Train");
    return train;
  },

  async getAvailability(scheduleId: string, fromStationId: string, toStationId: string) {
    const availability = await trainsRepository.getAvailabilityByClass(
      scheduleId,
      fromStationId,
      toStationId,
    );

    const classCounts = availability.reduce<Record<string, ClassCount>>((acc, row) => {
      const key = row.coach.seatClass.name;
      if (!acc[key]) {
        acc[key] = { displayName: row.coach.seatClass.displayName, available: 0, coachIds: [] };
      }
      acc[key].available += row.availableCount;
      acc[key].coachIds.push(row.coach.id);
      return acc;
    }, {});

    return Object.entries(classCounts).map(([name, data]) => ({ name, ...data }));
  },

  async getSeatMap(scheduleId: string, coachId: string) {
    const seats = await trainsRepository.getSeatsForCoach(scheduleId, coachId);

    const holdKeys   = seats.map((s) => `hold:${scheduleId}:${s.id}`);
    const holdValues = holdKeys.length > 0 ? await redis.mget(...holdKeys) : [];

    return seats.map((seat, i) => {
      const isBooked   = seat.bookingPassengers.length > 0;
      const holdUserId = holdValues[i];
      const isHeld     = holdUserId !== null;

      return {
        id:         seat.id,
        seatNumber: seat.seatNumber,
        berthType:  seat.berthType,
        status:     isBooked ? "BOOKED" : isHeld ? "HELD" : "AVAILABLE",
      };
    });
  },
};
