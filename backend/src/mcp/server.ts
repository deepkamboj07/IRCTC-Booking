import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { toolHandlers } from "./tool-handlers";

const userId = process.env.MCP_USER_ID;
if (!userId) {
  console.error("Error: MCP_USER_ID env variable is required");
  process.exit(1);
}

const ctx = { userId };

const server = new McpServer({
  name: "irtc-booking",
  version: "1.0.0",
});

async function call(name: string, input: unknown) {
  try {
    const result = await toolHandlers[name]?.(input, ctx);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Tool failed";
    return { content: [{ type: "text" as const, text: msg }], isError: true };
  }
}

server.tool(
  "search_stations",
  "Search for railway stations by name or city. Use before search_trains to resolve station codes.",
  { search: z.string(), limit: z.number().optional() },
  async (args) => call("search_stations", args)
);

server.tool(
  "search_trains",
  "Search for available trains between two stations on a date.",
  {
    from:          z.string().describe("Departure station code e.g. NDLS"),
    to:            z.string().describe("Arrival station code e.g. CSMT"),
    date:          z.string().describe("Journey date YYYY-MM-DD"),
    type:          z.string().optional().describe("EXPRESS, SUPERFAST, or LOCAL"),
    availableOnly: z.boolean().optional(),
  },
  async (args) => call("search_trains", args)
);

server.tool(
  "get_seat_map",
  "Get available seats for a specific coach.",
  {
    scheduleId: z.string().describe("Schedule ID from search_trains"),
    coachId:    z.string().describe("Coach ID from search_trains classes[].coachIds[]"),
  },
  async (args) => call("get_seat_map", args)
);

server.tool(
  "hold_seats",
  "Hold selected seats for 5 minutes. Call before confirm_booking.",
  {
    scheduleId:    z.string(),
    coachId:       z.string(),
    fromStationId: z.string().describe("departure.stationId from search_trains"),
    toStationId:   z.string().describe("arrival.stationId from search_trains"),
    seatIds:       z.array(z.string()).describe("Seat IDs from get_seat_map"),
  },
  async (args) => call("hold_seats", args)
);

server.tool(
  "confirm_booking",
  "Confirm booking after holding seats. Requires passenger details for every seat.",
  {
    holdId: z.string(),
    passengers: z.array(z.object({
      seatId: z.string(),
      name:   z.string(),
      age:    z.number(),
      gender: z.string().describe("MALE, FEMALE, or OTHER"),
    })),
  },
  async (args) => call("confirm_booking", args)
);

server.tool(
  "get_my_bookings",
  "List your train bookings.",
  {
    page:   z.number().optional(),
    status: z.string().optional().describe("PENDING, CONFIRMED, CANCELLED, WAITLISTED"),
  },
  async (args) => call("get_my_bookings", args)
);

server.tool(
  "get_booking_detail",
  "Get full details of a specific booking.",
  { bookingId: z.string() },
  async (args) => call("get_booking_detail", args)
);

server.tool(
  "cancel_booking",
  "Cancel a confirmed booking.",
  { bookingId: z.string() },
  async (args) => call("cancel_booking", args)
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("IRTC Booking MCP server started");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
