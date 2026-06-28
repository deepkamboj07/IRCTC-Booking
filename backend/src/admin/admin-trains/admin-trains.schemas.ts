import { z } from "zod";
import { TrainType } from "@prisma/client";

export const createTrainSchema = z.object({
  trainNumber: z.string().min(4).max(10),
  name:        z.string().min(2).max(100),
  type:        z.nativeEnum(TrainType),
});

export const updateTrainSchema = createTrainSchema.partial();

export const setRouteStopsSchema = z.object({
  stops: z
    .array(
      z.object({
        stationId:     z.string().min(1),
        sequence:      z.number().int().positive(),
        arrivalTime:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
        departureTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        distanceKm:    z.number().int().min(0),
      })
    )
    .min(2, "A train needs at least 2 stops"),
});

export const createCoachSchema = z.object({
  coachNumber: z.string().min(1).max(5),
  seatClassId: z.string().min(1),
  totalSeats:  z.number().int().positive().max(100),
});

export const createScheduleSchema = z.object({
  journeyDate: z.string().date(),
});

export const trainListQuerySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const trainParamsSchema  = z.object({ id: z.string().min(1) });
export const coachParamsSchema  = z.object({ id: z.string().min(1), coachId: z.string().min(1) });

export type CreateTrainDto    = z.infer<typeof createTrainSchema>;
export type UpdateTrainDto    = z.infer<typeof updateTrainSchema>;
export type SetRouteStopsDto  = z.infer<typeof setRouteStopsSchema>;
export type CreateCoachDto    = z.infer<typeof createCoachSchema>;
export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;
export type TrainListQuery    = z.infer<typeof trainListQuerySchema>;
