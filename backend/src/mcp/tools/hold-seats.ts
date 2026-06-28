import { seatHoldsService } from "../../seat-holds/seatHolds.service";

export interface HoldSeatsInput {
  scheduleId: string;
  coachId: string;
  fromStationId: string;
  toStationId: string;
  seatIds: string[];
}

export async function holdSeats(input: HoldSeatsInput, userId: string) {
  const result = await seatHoldsService.createHold(userId, {
    scheduleId:    input.scheduleId,
    coachId:       input.coachId,
    fromStationId: input.fromStationId,
    toStationId:   input.toStationId,
    seatIds:       input.seatIds,
  });
  return {
    holdId:    result.holdId,
    expiresAt: result.expiresAt,
    seatIds:   result.seatIds,
    ttlSeconds: 300,
  };
}
