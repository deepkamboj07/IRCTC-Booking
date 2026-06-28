import { z } from "zod";

export const trainSearchSchema = z.object({
  from:          z.string().min(2).toUpperCase(),
  to:            z.string().min(2).toUpperCase(),
  date:          z.string().date(),
  type:          z.enum(["EXPRESS", "SUPERFAST", "LOCAL"]).optional(),
  sortBy:        z.enum(["departure", "duration", "availability"]).default("departure"),
  availableOnly: z.string().optional(),                                 // "true" | "false" | undefined (query strings are always strings)
  page:          z.coerce.number().int().positive().default(1),
  limit:         z.coerce.number().int().positive().max(50).default(10),
});

export const trainParamsSchema = z.object({
  trainId: z.string().cuid(),
});

export const scheduleParamsSchema = z.object({
  trainId:    z.string().cuid(),
  scheduleId: z.string().cuid(),
});

export const seatMapParamsSchema = z.object({
  trainId:    z.string().cuid(),
  scheduleId: z.string().cuid(),
  coachId:    z.string().cuid(),
});

export const availabilityQuerySchema = z.object({
  from: z.string().cuid(),
  to:   z.string().cuid(),
});

export type TrainSearchQuery  = z.infer<typeof trainSearchSchema>;
export type TrainParams       = z.infer<typeof trainParamsSchema>;
export type ScheduleParams    = z.infer<typeof scheduleParamsSchema>;
export type SeatMapParams     = z.infer<typeof seatMapParamsSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
