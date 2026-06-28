import { Request, Response } from "express";
import { chatService } from "./chat.service";
import { chatMessageSchema } from "./chat.schemas";
import { ValidationError } from "../errors/app.errors";
import { prisma } from "../config/prisma";

export const chatController = {
  async sendMessage(req: Request, res: Response) {
    const parsed = chatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request");
    }

    const reqUser = req.user!;
    const { sessionId, message } = parsed.data;

    // Fetch user name (JWT only carries id/email/role)
    const dbUser = await prisma.user.findUnique({
      where: { id: reqUser.id },
      select: { name: true },
    });
    const userName = dbUser?.name ?? reqUser.email;

    // SSE headers — flush immediately so browser starts receiving
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      await chatService.handleMessage(
        reqUser.id,
        sessionId,
        message,
        { name: userName, email: reqUser.email },
        res
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "An error occurred";
      res.write(`data: ${JSON.stringify({ type: "error", error: errMsg })}\n\n`);
    } finally {
      res.end();
    }
  },
};
