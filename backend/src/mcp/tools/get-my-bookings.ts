import { bookingsService } from "../../bookings/bookings.service";

export interface GetMyBookingsInput {
  page?: number;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "WAITLISTED";
}

export async function getMyBookings(input: GetMyBookingsInput, userId: string) {
  const result = await bookingsService.getMyBookings(userId, {
    page:  input.page ?? 1,
    limit: 5,
  });

  return {
    bookings: result.data.map((b) => ({
      id:          b.id,
      pnr:         b.pnr,
      status:      b.status,
      totalFare:   Number(b.totalFare),
      journeyDate: b.schedule.journeyDate,
      train:       b.schedule.train.name + " (" + b.schedule.train.trainNumber + ")",
      from:        b.fromStation.code,
      to:          b.toStation.code,
      passengers:  b.passengers.length,
    })),
    total:      result.meta.total,
    totalPages: result.meta.totalPages,
    page:       input.page ?? 1,
  };
}
