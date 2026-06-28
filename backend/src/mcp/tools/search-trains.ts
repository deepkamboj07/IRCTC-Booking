import { trainsService } from "../../trains/trains.service";

export interface SearchTrainsInput {
  from: string;
  to: string;
  date: string;
  type?: "EXPRESS" | "SUPERFAST" | "LOCAL";
  availableOnly?: boolean;
}

export async function searchTrains(input: SearchTrainsInput) {
  const result = await trainsService.searchTrains({
    from: input.from.toUpperCase(),
    to: input.to.toUpperCase(),
    date: input.date,
    type: input.type,
    availableOnly: input.availableOnly ? "true" : undefined,
    sortBy: "departure",
    page: 1,
    limit: 10,
  });

  return {
    trains: result.data.map((t) => ({
      trainId:     t.train.id,
      trainNumber: t.train.trainNumber,
      name:        t.train.name,
      type:        t.train.type,
      scheduleId:  t.schedule.id,
      departure: {
        stationCode: t.departure.station.code,
        stationName: t.departure.station.name,
        stationId:   t.departure.station.id,
        time:        t.departure.time,
      },
      arrival: {
        stationCode: t.arrival.station.code,
        stationName: t.arrival.station.name,
        stationId:   t.arrival.station.id,
        time:        t.arrival.time,
      },
      distanceKm: t.distanceKm,
      classes: t.classes.map((c) => ({
        name:        c.name,
        displayName: c.displayName,
        available:   c.available,
        coachIds:    c.coachIds,
      })),
    })),
    total: result.meta.total,
  };
}
