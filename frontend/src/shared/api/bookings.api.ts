import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api.client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PassengerPayload {
  seatId: string;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
}

export interface Booking {
  id: string;
  pnr: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "WAITLISTED";
  totalFare: number;
  createdAt: string;
  schedule: {
    journeyDate: string;
    train: { trainNumber: string; name: string };
  };
  fromStation: { code: string; name: string };
  toStation: { code: string; name: string };
  passengers: Array<{
    id: string;
    name: string;
    age: number;
    gender: string;
    status: string;
    seat: { seatNumber: number; berthType: string; coachId: string };
  }>;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (params: object) => ["bookings", "list", params] as const,
  detail: (id: string) => ["bookings", id] as const,
  pnr: (pnr: string) => ["bookings", "pnr", pnr] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useConfirmBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { holdId: string; passengers: PassengerPayload[] }) =>
      api
        .post<{ data: { booking: Booking; pnr: string } }>("/bookings", payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useMyBookings(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () =>
      api
        .get<{ data: { data: Booking[]; meta: { total: number; totalPages: number } } }>(
          "/bookings",
          { params }
        )
        .then((r) => r.data.data),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () =>
      api.get<{ data: Booking }>(`/bookings/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useBookingByPnr(pnr: string) {
  return useQuery({
    queryKey: bookingKeys.pnr(pnr),
    queryFn: () =>
      api.get<{ data: Booking }>(`/bookings/pnr/${pnr}`).then((r) => r.data.data),
    enabled: !!pnr,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ data: Booking }>(`/bookings/${id}/cancel`).then((r) => r.data.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
