import { redis } from "../config/redis";

const TTL = 7200; // 2 hours

export interface BookingState {
  route?: { from: string; fromId: string; to: string; toId: string };
  date?: string;
  train?: { trainNumber: string; name: string; scheduleId: string; trainId: string };
  selectedClass?: string;
  coachId?: string;
  holdId?: string;
  holdExpiry?: string;
  seatIds?: string[];
  passengersNeeded: number;
  passengers: Array<{ seatId: string; name: string; age: number; gender: string }>;
  lastPnr?: string;
}

const DEFAULT_STATE: BookingState = { passengersNeeded: 0, passengers: [] };

function key(sessionId: string) {
  return `chat:state:${sessionId}`;
}

export const bookingStateStore = {
  async get(sessionId: string): Promise<BookingState> {
    const raw = await redis.get(key(sessionId));
    return raw ? (JSON.parse(raw) as BookingState) : { ...DEFAULT_STATE };
  },

  async set(sessionId: string, state: BookingState): Promise<void> {
    await redis.setex(key(sessionId), TTL, JSON.stringify(state));
  },

  async patch(sessionId: string, patch: Partial<BookingState>): Promise<BookingState> {
    const current = await bookingStateStore.get(sessionId);
    const updated = { ...current, ...patch };
    await bookingStateStore.set(sessionId, updated);
    return updated;
  },

  format(state: BookingState): string {
    if (!state.route && !state.holdId && !state.lastPnr) {
      return "No active booking in progress.";
    }

    const lines: string[] = [];
    if (state.route) {
      lines.push(`Route: ${state.route.from} → ${state.route.to} | Date: ${state.date ?? "?"}`);
    }
    if (state.train) {
      lines.push(`Train: ${state.train.trainNumber} ${state.train.name}${state.selectedClass ? ` | Class: ${state.selectedClass}` : ""}`);
    }
    if (state.holdId) {
      const expiry = state.holdExpiry ? new Date(state.holdExpiry) : null;
      const now    = new Date();
      const secsLeft = expiry ? Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000)) : 0;
      const minsLeft = Math.floor(secsLeft / 60);
      const urgency  = secsLeft < 120 ? " ⚠️ URGENT" : "";
      lines.push(`Hold: expires in ${minsLeft}m ${secsLeft % 60}s${urgency} (holdId: ${state.holdId})`);
    }
    if (state.passengersNeeded > 0) {
      lines.push(`Passengers: ${state.passengers.length} of ${state.passengersNeeded} collected`);
    }
    if (state.lastPnr) {
      lines.push(`Last PNR: ${state.lastPnr}`);
    }
    return lines.join("\n");
  },
};
