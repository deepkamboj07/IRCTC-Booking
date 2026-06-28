import { z } from "zod";

export const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone:    z.string().regex(/^\d{10}$/, "Phone must be 10 digits").optional(),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const updateMeSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits").optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto    = z.infer<typeof loginSchema>;
export type UpdateMeDto = z.infer<typeof updateMeSchema>;
