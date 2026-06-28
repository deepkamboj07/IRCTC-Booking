import { z } from "zod";
import { PassengerGender } from "@prisma/client";

const passengerSchema = z.object({
  seatId: z.string().cuid(),
  name:   z.string().min(2).max(100),
  age:    z.number().int().positive().max(120),
  gender: z.nativeEnum(PassengerGender),
});

export const createBookingSchema = z.object({
  holdId:     z.string().min(1),
  passengers: z.array(passengerSchema).min(1).max(6),
});

export const bookingParamsSchema = z.object({
  id: z.string().cuid(),
});

export const bookingListQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateBookingDto  = z.infer<typeof createBookingSchema>;
export type BookingListQuery  = z.infer<typeof bookingListQuerySchema>;
