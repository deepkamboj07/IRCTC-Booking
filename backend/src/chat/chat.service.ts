import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { Response } from "express";
import { env } from "../config/env";
import { TOOL_DEFINITIONS } from "../mcp/tool-registry";
import { toolHandlers } from "../mcp/tool-handlers";
import { conversationStore } from "./conversation.store";
import { bookingStateStore } from "./booking-state.store";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// ─── SSE helper ──────────────────────────────────────────────────────────────

function sseWrite(res: Response, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(user: { name: string; email: string }, bookingStateText: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `You are IRCTC AI, an intelligent railway booking assistant for Indian Railways.
User: ${user.name} (${user.email}) | Today: ${today}

## Current Booking State
${bookingStateText}

## Tool Order for Booking
1. search_stations — resolve city names to station codes/IDs first
2. search_trains — find available trains on the route
3. get_seat_map — view available seats (auto-pick first N available for user's count)
4. hold_seats — hold seats for 5 min; tell user the countdown urgency
5. confirm_booking — only after collecting name, age, gender for ALL passengers

## Rules
- Always call search_stations before search_trains to resolve station names
- Pick the FIRST coachId from the requested class in search_trains for get_seat_map
- Ask for name, age, gender for each passenger before calling confirm_booking
- Before cancel_booking always confirm: "Are you sure you want to cancel PNR [X]?"
- Show fares as ₹ (Indian Rupees)
- If a hold expires mid-conversation, apologise and re-call hold_seats
- Keep responses concise — this is a chat interface
- Berth types: LOWER (best for elderly/children), UPPER, MIDDLE, SIDE_LOWER, SIDE_UPPER
- After EVERY tool call, ALWAYS respond with a text summary of what you found — never return a tool call without following up with text`;
}

// ─── Update booking state after tool calls ────────────────────────────────────

async function updateBookingState(
  sessionId: string,
  toolName: string,
  result: unknown,
  input: Record<string, unknown>
) {
  const data = result as Record<string, unknown>;

  if (toolName === "search_trains" && Array.isArray(data.trains) && data.trains.length > 0) {
    const first = (data.trains as Array<{
      departure: { stationCode: string; stationId: string };
      arrival:   { stationCode: string; stationId: string };
    }>)[0];
    await bookingStateStore.patch(sessionId, {
      route: {
        from:   first.departure.stationCode,
        fromId: first.departure.stationId,
        to:     first.arrival.stationCode,
        toId:   first.arrival.stationId,
      },
      date: input.date as string,
    });
  }
  if (toolName === "hold_seats") {
    await bookingStateStore.patch(sessionId, {
      holdId:     data.holdId as string,
      holdExpiry: data.expiresAt as string,
      seatIds:    data.seatIds as string[],
    });
  }
  if (toolName === "confirm_booking") {
    await bookingStateStore.patch(sessionId, {
      lastPnr: data.pnr as string,
      holdId: undefined, holdExpiry: undefined, seatIds: undefined,
      passengers: [], passengersNeeded: 0,
    });
  }
  if (toolName === "cancel_booking") {
    await bookingStateStore.patch(sessionId, { lastPnr: undefined });
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export const chatService = {
  async handleMessage(
    userId: string,
    sessionId: string,
    userMessage: string,
    user: { name: string; email: string },
    res: Response
  ) {
    const [history, bookingState] = await Promise.all([
      conversationStore.load(sessionId),
      bookingStateStore.get(sessionId),
    ]);

    const systemPrompt = buildSystemPrompt(user, bookingStateStore.format(bookingState));

    const model = genAI.getGenerativeModel({
      model:             "gemini-3.1-flash-lite",
      systemInstruction: systemPrompt,
      tools:             [{ functionDeclarations: TOOL_DEFINITIONS }],
    });

    // Start chat with existing history
    const chat = model.startChat({ history });

    // Agentic loop
    let currentMessage: string | Part[] = userMessage;
    let iteration = 0;
    const MAX_ITERATIONS = 8;

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      const result = await chat.sendMessage(currentMessage);
      const response = result.response;
      const parts    = response.candidates?.[0]?.content?.parts ?? [];

      // Stream text parts
      for (const part of parts) {
        if (part.text) {
          sseWrite(res, { type: "text_delta", text: part.text });
        }
      }

      // Check for function calls
      const functionCalls = parts.filter((p) => p.functionCall);
      if (functionCalls.length === 0) break; // end_turn — no tools needed

      // Execute all tool calls in parallel
      const functionResponseParts: Part[] = await Promise.all(
        functionCalls.map(async (part) => {
          const fc = part.functionCall!;
          sseWrite(res, { type: "tool_start", name: fc.name });

          let responseData: unknown;
          try {
            responseData = await toolHandlers[fc.name]?.(
              fc.args as Record<string, unknown>,
              { userId }
            );
            await updateBookingState(sessionId, fc.name, responseData, fc.args as Record<string, unknown>);
            sseWrite(res, {
              type: "tool_done",
              name: fc.name,
              summary: conversationStore.compressToolResult(fc.name, responseData),
            });
            if (fc.name === "get_my_bookings" || fc.name === "confirm_booking") {
              sseWrite(res, { type: "navigate", label: "View My Bookings", path: "/my-bookings" });
            }
            if (fc.name === "get_booking_detail") {
              sseWrite(res, { type: "navigate", label: "View My Bookings", path: "/my-bookings" });
            }
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Tool failed";
            responseData = { error: errMsg };
            sseWrite(res, { type: "tool_error", name: fc.name, error: errMsg });
          }

          return {
            functionResponse: {
              name:     fc.name,
              response: responseData as object,
            },
          } as Part;
        })
      );

      // Feed tool results back as the next "message"
      currentMessage = functionResponseParts;
    }

    // Persist compressed history (Gemini tracks internally, but we save for session resume)
    const updatedHistory = await chat.getHistory();
    const toStore = updatedHistory.slice(history.length);

    // Compress large tool response parts before saving
    const compressed = toStore.map((content: Content) => {
      if (content.role !== "user") return content;
      const parts = content.parts.map((p) => {
        if (p.functionResponse && JSON.stringify(p.functionResponse.response).length > 300) {
          return {
            functionResponse: {
              name:     p.functionResponse.name,
              response: { summary: conversationStore.compressToolResult(p.functionResponse.name, p.functionResponse.response) },
            },
          } as Part;
        }
        return p;
      });
      return { ...content, parts };
    });

    await conversationStore.save(sessionId, [...history, ...compressed]);

    sseWrite(res, { type: "done", sessionId });
  },
};
