import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api.client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Station {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const stationKeys = {
  all: ["stations"] as const,
  list: (search: string) => ["stations", "list", search] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useStations(search: string) {
  return useQuery({
    queryKey: stationKeys.list(search),
    queryFn: () =>
      api
        .get<{ data: { data: Station[] } }>("/stations", {
          params: { search, limit: 10 },
        })
        .then((r) => r.data.data.data),
    enabled: search.length >= 2,
    staleTime: 60_000,
  });
}
