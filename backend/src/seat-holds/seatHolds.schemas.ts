import { z } from "zod";

export const createHoldSchema = z.object({
  scheduleId:    z.string().cuid(),
  coachId:       z.string().cuid(),
  fromStationId: z.string().cuid(),
  toStationId:   z.string().cuid(),
  seatIds:       z.array(z.string().cuid()).min(1).max(6),
});

export const holdParamsSchema = z.object({
  holdId: z.string().min(1),
});

export type CreateHoldDto = z.infer<typeof createHoldSchema>;
