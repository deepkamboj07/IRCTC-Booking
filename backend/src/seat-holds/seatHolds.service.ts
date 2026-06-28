import { createId } from "@paralleldrive/cuid2";
import { redis } from "../config/redis";
import { ConflictError, NotFoundError, ForbiddenError } from "../errors/app.errors";
import { CreateHoldDto } from "./seatHolds.schemas";

const HOLD_TTL = 300; // 5 minutes

interface HoldMeta {
  userId: string;
  scheduleId: string;
  coachId: string;
  fromStationId: string;
  toStationId: string;
  seatIds: string[];
}

export const seatHoldsService = {
  async createHold(userId: string, dto: CreateHoldDto) {
    const holdId  = createId();
    const holdKeys = dto.seatIds.map((seatId) => `hold:${dto.scheduleId}:${seatId}`);

    // Atomic per-key SET NX EX via pipeline — prevents race conditions between concurrent requests
    const pipeline = redis.pipeline();
    holdKeys.forEach((key) => pipeline.set(key, userId, "EX", HOLD_TTL, "NX"));
    const results = await pipeline.exec();

    const failedIndex = results?.findIndex(([err, val]) => err || val === null);
    if (failedIndex !== undefined && failedIndex >= 0) {
      // Roll back only the keys that succeeded in this request
      const keysToDelete = holdKeys.filter((_, i) => results?.[i]?.[1] === "OK");
      if (keysToDelete.length > 0) await redis.del(...keysToDelete);
      throw new ConflictError("One or more seats are already held. Please reselect.");
    }

    const meta: HoldMeta = { userId, ...dto };
    await redis.setex(`hold_meta:${holdId}`, HOLD_TTL, JSON.stringify(meta));

    const expiresAt = new Date(Date.now() + HOLD_TTL * 1000).toISOString();
    return { holdId, expiresAt, seatIds: dto.seatIds };
  },

  async getHold(holdId: string, userId: string) {
    const raw = await redis.get(`hold_meta:${holdId}`);
    if (!raw) throw new NotFoundError("Hold (may have expired)");

    const meta = JSON.parse(raw) as HoldMeta;
    if (meta.userId !== userId) throw new ForbiddenError();

    const ttl = await redis.ttl(`hold_meta:${holdId}`);
    return { ...meta, holdId, ttlSeconds: ttl };
  },

  async releaseHold(holdId: string, userId: string) {
    const raw = await redis.get(`hold_meta:${holdId}`);
    if (!raw) return; // already expired — no-op

    const meta = JSON.parse(raw) as HoldMeta;
    if (meta.userId !== userId) throw new ForbiddenError();

    const seatKeys = meta.seatIds.map((seatId) => `hold:${meta.scheduleId}:${seatId}`);
    await redis.del(...seatKeys, `hold_meta:${holdId}`);
  },
};
