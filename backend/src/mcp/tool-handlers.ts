import { searchStations, SearchStationsInput } from "./tools/search-stations";
import { searchTrains, SearchTrainsInput } from "./tools/search-trains";
import { getSeatMap, GetSeatMapInput } from "./tools/get-seat-map";
import { holdSeats, HoldSeatsInput } from "./tools/hold-seats";
import { confirmBooking, ConfirmBookingInput } from "./tools/confirm-booking";
import { getMyBookings, GetMyBookingsInput } from "./tools/get-my-bookings";
import { getBookingDetail, GetBookingDetailInput } from "./tools/get-booking-detail";
import { cancelBooking, CancelBookingInput } from "./tools/cancel-booking";

export interface ToolContext {
  userId: string;
}

type ToolHandler = (input: unknown, ctx: ToolContext) => Promise<unknown>;

export const toolHandlers: Record<string, ToolHandler> = {
  search_stations:    (input) => searchStations(input as SearchStationsInput),
  search_trains:      (input) => searchTrains(input as SearchTrainsInput),
  get_seat_map:       (input) => getSeatMap(input as GetSeatMapInput),
  hold_seats:         (input, ctx) => holdSeats(input as HoldSeatsInput, ctx.userId),
  confirm_booking:    (input, ctx) => confirmBooking(input as ConfirmBookingInput, ctx.userId),
  get_my_bookings:    (input, ctx) => getMyBookings(input as GetMyBookingsInput, ctx.userId),
  get_booking_detail: (input, ctx) => getBookingDetail(input as GetBookingDetailInput, ctx.userId),
  cancel_booking:     (input, ctx) => cancelBooking(input as CancelBookingInput, ctx.userId),
};
