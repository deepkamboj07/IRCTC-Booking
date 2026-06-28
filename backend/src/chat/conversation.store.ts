import { Content } from "@google/generative-ai";
import { redis } from "../config/redis";

const TTL       = 7200; // 2 hours
const MAX_TURNS = 8;    // keep last 8 turns (16 messages)

function key(sessionId: string) {
  return `chat:history:${sessionId}`;
}

export const conversationStore = {
  async load(sessionId: string): Promise<Content[]> {
    const raw = await redis.get(key(sessionId));
    return raw ? (JSON.parse(raw) as Content[]) : [];
  },

  async save(sessionId: string, messages: Content[]): Promise<void> {
    const trimmed = messages.slice(-(MAX_TURNS * 2));
    await redis.setex(key(sessionId), TTL, JSON.stringify(trimmed));
  },

  compressToolResult(toolName: string, result: unknown): string {
    const data = result as Record<string, unknown>;

    switch (toolName) {
      case "search_stations":
        if (Array.isArray(data.stations)) {
          return `[Stations]: ${(data.stations as Array<{code: string; name: string}>).map((s) => `${s.code}(${s.name})`).join(", ")}`;
        }
        break;
      case "search_trains":
        if (Array.isArray(data.trains)) {
          const trains = data.trains as Array<{trainNumber: string; name: string; departure: {time: string}; classes: Array<{name: string; available: number}>}>;
          return `[Trains ${trains.length}]: ${trains.map((t) => `${t.trainNumber} ${t.name} dep:${t.departure.time} [${t.classes.map((c) => `${c.name}:${c.available}`).join(",")}]`).join(" | ")}`;
        }
        break;
      case "get_seat_map": {
        const d = data as {summary?: string; availableSeats?: Array<{seatNumber: number; berthType: string}>};
        const seats = (d.availableSeats ?? []).slice(0, 10).map((s) => `${s.seatNumber}(${s.berthType[0]})`).join(",");
        return `[Seat map]: ${d.summary ?? ""} — ${seats}`;
      }
      case "hold_seats":
        return `[Hold]: holdId=${data.holdId} expires=${data.expiresAt}`;
      case "confirm_booking":
        return `[Booked]: PNR=${data.pnr}`;
      case "get_my_bookings":
        return `[Bookings ${data.total}]: ${(data.bookings as Array<{pnr: string; status: string}> ?? []).map((b) => `${b.pnr}(${b.status})`).join(", ")}`;
      case "get_booking_detail":
        return `[Booking ${data.pnr}]: ${data.status} ${data.from}→${data.to}`;
      case "cancel_booking":
        return `[Cancelled]: ${data.message}`;
    }
    return JSON.stringify(result).slice(0, 150);
  },
};
