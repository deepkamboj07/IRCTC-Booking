import { trainsService } from "../../trains/trains.service";

export interface GetSeatMapInput {
  scheduleId: string;
  coachId: string;
}

export async function getSeatMap(input: GetSeatMapInput) {
  const allSeats = await trainsService.getSeatMap(input.scheduleId, input.coachId);

  const available = allSeats.filter((s) => s.status === "AVAILABLE").slice(0, 20);
  const totalAvailable = allSeats.filter((s) => s.status === "AVAILABLE").length;
  const totalBooked = allSeats.filter((s) => s.status === "BOOKED").length;
  const totalHeld = allSeats.filter((s) => s.status === "HELD").length;

  return {
    coachId: input.coachId,
    summary: `${totalAvailable} available, ${totalHeld} held, ${totalBooked} booked of ${allSeats.length} total`,
    availableSeats: available.map((s) => ({
      id:         s.id,
      seatNumber: s.seatNumber,
      berthType:  s.berthType,
    })),
  };
}
