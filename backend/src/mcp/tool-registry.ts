import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const TOOL_DEFINITIONS: FunctionDeclaration[] = [
  {
    name: "search_stations",
    description: "Search for railway stations by name or city. Use this to resolve station names to codes/IDs before searching trains.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        search: { type: SchemaType.STRING, description: "Station name, city, or code to search for" },
        limit:  { type: SchemaType.NUMBER, description: "Max results (default 8)" },
      },
      required: ["search"],
    },
  },
  {
    name: "search_trains",
    description: "Search for available trains between two stations on a given date.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        from:          { type: SchemaType.STRING, description: "Departure station code e.g. NDLS" },
        to:            { type: SchemaType.STRING, description: "Arrival station code e.g. CSMT" },
        date:          { type: SchemaType.STRING, description: "Journey date YYYY-MM-DD" },
        type:          { type: SchemaType.STRING, description: "Train type: EXPRESS, SUPERFAST, or LOCAL" },
        availableOnly: { type: SchemaType.BOOLEAN, description: "Only show trains with seats available" },
      },
      required: ["from", "to", "date"],
    },
  },
  {
    name: "get_seat_map",
    description: "Get available seats for a specific coach. Returns up to 20 available seats with berth types.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        scheduleId: { type: SchemaType.STRING, description: "Schedule ID from search_trains" },
        coachId:    { type: SchemaType.STRING, description: "Coach ID from search_trains classes[].coachIds[]" },
      },
      required: ["scheduleId", "coachId"],
    },
  },
  {
    name: "hold_seats",
    description: "Hold selected seats for 5 minutes. Must collect ALL passenger details before calling confirm_booking.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        scheduleId:    { type: SchemaType.STRING, description: "Schedule ID from search_trains" },
        coachId:       { type: SchemaType.STRING, description: "Coach ID from search_trains" },
        fromStationId: { type: SchemaType.STRING, description: "Departure station ID from search_trains departure.stationId" },
        toStationId:   { type: SchemaType.STRING, description: "Arrival station ID from search_trains arrival.stationId" },
        seatIds: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Array of seat IDs from get_seat_map",
        },
      },
      required: ["scheduleId", "coachId", "fromStationId", "toStationId", "seatIds"],
    },
  },
  {
    name: "confirm_booking",
    description: "Confirm a booking after holding seats. Requires full passenger details for each seat.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        holdId: { type: SchemaType.STRING, description: "Hold ID from hold_seats" },
        passengers: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              seatId: { type: SchemaType.STRING },
              name:   { type: SchemaType.STRING },
              age:    { type: SchemaType.NUMBER },
              gender: { type: SchemaType.STRING, description: "MALE, FEMALE, or OTHER" },
            },
            required: ["seatId", "name", "age", "gender"],
          },
          description: "One entry per passenger, seatId must match a held seat",
        },
      },
      required: ["holdId", "passengers"],
    },
  },
  {
    name: "get_my_bookings",
    description: "List the current user's train bookings.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        page:   { type: SchemaType.NUMBER, description: "Page number (default 1)" },
        status: { type: SchemaType.STRING, description: "Filter by status: PENDING, CONFIRMED, CANCELLED, WAITLISTED" },
      },
    },
  },
  {
    name: "get_booking_detail",
    description: "Get full details of a specific booking including all passengers and seats.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        bookingId: { type: SchemaType.STRING, description: "Booking ID from get_my_bookings" },
      },
      required: ["bookingId"],
    },
  },
  {
    name: "cancel_booking",
    description: "Cancel a confirmed booking. Always ask user for confirmation before calling.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        bookingId: { type: SchemaType.STRING, description: "Booking ID to cancel" },
      },
      required: ["bookingId"],
    },
  },
];
