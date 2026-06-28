import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api.client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HoldResult {
  holdId: string;
  expiresAt: string;
  seatIds: string[];
}

interface CreateHoldPayload {
  scheduleId: string;
  coachId: string;
  fromStationId: string;
  toStationId: string;
  seatIds: string[];
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const holdKeys = {
  detail: (holdId: string) => ["seat-holds", holdId] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useCreateHold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHoldPayload) =>
      api.post<{ data: HoldResult }>("/seat-holds", payload).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trains"] });
    },
  });
}

export function useHoldStatus(holdId: string) {
  return useQuery({
    queryKey: holdKeys.detail(holdId),
    queryFn: () =>
      api
        .get<{ data: { ttlSeconds: number; seatIds: string[] } }>(`/seat-holds/${holdId}`)
        .then((r) => r.data.data),
    enabled: !!holdId,
    refetchInterval: 5_000,
  });
}

export function useReleaseHold() {
  return useMutation({
    mutationFn: (holdId: string) => api.delete(`/seat-holds/${holdId}`),
  });
}
