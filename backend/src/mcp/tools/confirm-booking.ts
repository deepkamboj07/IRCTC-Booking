import { bookingsService } from "../../bookings/bookings.service";

export interface PassengerInput {
  seatId: string;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
}

export interface ConfirmBookingInput {
  holdId: string;
  passengers: PassengerInput[];
}

export async function confirmBooking(input: ConfirmBookingInput, userId: string) {
  const { booking, pnr } = await bookingsService.confirmBooking(userId, {
    holdId:     input.holdId,
    passengers: input.passengers,
  });
  return {
    pnr,
    bookingId:   booking.id,
    status:      booking.status,
    totalFare:   Number(booking.totalFare),
    passengers:  booking.passengers.length,
  };
}
