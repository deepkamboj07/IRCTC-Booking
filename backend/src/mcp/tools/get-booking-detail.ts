import { bookingsService } from "../../bookings/bookings.service";

export interface GetBookingDetailInput {
  bookingId: string;
}

export async function getBookingDetail(input: GetBookingDetailInput, userId: string) {
  const b = await bookingsService.getById(input.bookingId, userId);
  return {
    id:          b.id,
    pnr:         b.pnr,
    status:      b.status,
    totalFare:   Number(b.totalFare),
    journeyDate: b.schedule.journeyDate,
    train:       b.schedule.train.name + " (" + b.schedule.train.trainNumber + ")",
    from:        b.fromStation.name + " (" + b.fromStation.code + ")",
    to:          b.toStation.name   + " (" + b.toStation.code   + ")",
    passengers:  b.passengers.map((p) => ({
      name:      p.name,
      age:       p.age,
      gender:    p.gender,
      seat:      p.seat.seatNumber,
      berth:     p.seat.berthType,
      status:    p.status,
    })),
  };
}
