import { z } from "zod";

export const createStationSchema = z.object({
  code:  z.string().min(2).max(10).transform(v => v.toUpperCase()),
  name:  z.string().min(2).max(100),
  city:  z.string().min(2).max(100),
  state: z.string().min(2).max(100),
});

export const updateStationSchema = z.object({
  code:  z.string().min(2).max(10).transform(v => v.toUpperCase()).optional(),
  name:  z.string().min(2).max(100).optional(),
  city:  z.string().min(2).max(100).optional(),
  state: z.string().min(2).max(100).optional(),
});

export const stationListQuerySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const stationParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateStationDto = z.infer<typeof createStationSchema>;
export type UpdateStationDto = z.infer<typeof updateStationSchema>;
export type StationListQuery = z.infer<typeof stationListQuerySchema>;
