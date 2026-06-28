import { bookingsService } from "../../bookings/bookings.service";

export interface CancelBookingInput {
  bookingId: string;
}

export async function cancelBooking(input: CancelBookingInput, userId: string) {
  const result = await bookingsService.cancelBooking(input.bookingId, userId);
  return { success: true, message: result.message };
}
