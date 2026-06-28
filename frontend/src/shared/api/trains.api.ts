import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { api } from "../utils/api.client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClassAvailability {
  name: "SLEEPER" | "AC_3TIER" | "AC_2TIER" | "AC_FIRST_CLASS";
  displayName: string;
  available: number;
  coachIds: string[];
}

export interface TrainSearchResult {
  train: { id: string; trainNumber: string; name: string; type: string };
  schedule: { id: string; status: string };
  departure: { station: { id: string; code: string; name: string }; time: string; distanceKm: number };
  arrival:   { station: { id: string; code: string; name: string }; time: string; distanceKm: number };
  distanceKm: number;
  classes: ClassAvailability[];
}

export interface TrainSearchMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TrainSearchPage {
  data: TrainSearchResult[];
  meta: TrainSearchMeta;
}

export interface SeatMapEntry {
  id: string;
  seatNumber: number;
  berthType: "LOWER" | "MIDDLE" | "UPPER" | "SIDE_LOWER" | "SIDE_UPPER";
  status: "AVAILABLE" | "HELD" | "BOOKED";
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  type?: "EXPRESS" | "SUPERFAST" | "LOCAL";
  sortBy?: "departure" | "duration" | "availability";
  availableOnly?: boolean;
  page?: number;
  limit?: number;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const trainKeys = {
  search: (params: SearchParams) => ["trains", "search", params] as const,
  detail: (id: string) => ["trains", id] as const,
  seatMap: (trainId: string, scheduleId: string, coachId: string) =>
    ["trains", trainId, "schedules", scheduleId, "coaches", coachId, "seats"] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSearchTrains(params: SearchParams) {
  // Convert boolean availableOnly to the string the backend expects; omit if false
  const apiParams: Record<string, string | number | undefined> = {
    from:          params.from,
    to:            params.to,
    date:          params.date,
    type:          params.type,
    sortBy:        params.sortBy,
    availableOnly: params.availableOnly ? "true" : undefined,
    page:          params.page,
    limit:         params.limit,
  };

  return useQuery({
    queryKey: trainKeys.search(params),
    queryFn: () =>
      api
        .get<{ data: TrainSearchPage }>("/trains/search", { params: apiParams })
        .then((r) => r.data.data),
    enabled:         !!params.from && !!params.to && !!params.date,
    staleTime:       60_000,
    placeholderData: keepPreviousData, // keeps previous page visible while next page loads
  });
}

export function useSeatMap(trainId: string, scheduleId: string, coachId: string) {
  return useQuery({
    queryKey: trainKeys.seatMap(trainId, scheduleId, coachId),
    queryFn: () =>
      api
        .get<{ data: SeatMapEntry[] }>(
          `/trains/${trainId}/schedules/${scheduleId}/coaches/${coachId}/seats`,
        )
        .then((r) => r.data.data),
    enabled:        !!trainId && !!scheduleId && !!coachId,
    refetchInterval: 10_000,
  });
}
