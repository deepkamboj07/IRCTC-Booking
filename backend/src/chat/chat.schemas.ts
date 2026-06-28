import { z } from "zod";

export const chatMessageSchema = z.object({
  sessionId: z.string().uuid(),
  message:   z.string().min(1).max(2000),
});

export type ChatMessageBody = z.infer<typeof chatMessageSchema>;
