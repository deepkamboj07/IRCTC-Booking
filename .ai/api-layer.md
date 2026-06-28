# Frontend API Layer Rules

Every backend resource gets one file in `frontend/src/shared/api/` named `<feature>.api.ts`.
This file owns all React Query hooks AND the TypeScript types for that resource.

---

## 1. File Structure

```
shared/api/
├── auth.api.ts
├── trains.api.ts
├── bookings.api.ts
├── stations.api.ts
├── seat-holds.api.ts
└── admin.api.ts
```

---

## 2. Axios Client — Always Import from `api.client.ts`

```ts
import { api } from "../utils/api.client";
```

Never create a new `axios.create()` inside a feature file. The shared client adds the
`Authorization` header automatically via an interceptor.

---

## 3. Type Definitions — Co-located at the Top of the File

```ts
// ─── Types ───────────────────────────────────────────────────────────────────

export interface Train {
  id: string;
  trainNumber: string;
  name: string;
  type: "EXPRESS" | "SUPERFAST" | "LOCAL";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
```

Rules:
- Types shared across two+ feature files → move to `shared/types/` instead
- Never import types from a page or component file

---

## 4. Query Key Factory — One Object Per File

```ts
// ─── Query Keys ──────────────────────────────────────────────────────────────

export const trainKeys = {
  all: ["trains"] as const,
  search: (params: SearchParams) => ["trains", "search", params] as const,
  detail: (id: string) => ["trains", id] as const,
  availability: (trainId: string, scheduleId: string) =>
    ["trains", trainId, "schedules", scheduleId, "availability"] as const,
};
```

Always use the key factory in both `useQuery` and `queryClient.invalidateQueries`.

---

## 5. Query Hook Pattern (Read)

```ts
// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSearchTrains(params: SearchParams) {
  return useQuery({
    queryKey: trainKeys.search(params),
    queryFn: () =>
      api.get<Train[]>("/trains/search", { params }).then((r) => r.data),
    enabled: !!params.from && !!params.to && !!params.date,
  });
}

export function useTrain(id: string) {
  return useQuery({
    queryKey: trainKeys.detail(id),
    queryFn: () => api.get<Train>(`/trains/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}
```

Rules:
- `enabled` guard whenever the ID or required params might be empty
- Return the full `useQuery` result — never cherry-pick inside the hook

---

## 6. Mutation Hook Pattern (Write)

```ts
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) =>
      api.post<Booking>("/bookings", payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Booking>(`/bookings/${id}/cancel`).then((r) => r.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
```

Rules:
- Always `invalidateQueries` on success so the cache stays fresh
- `mutationFn` returns the parsed response body, not the Axios response object
- `onError` is optional at the hook level — pages handle errors via `mutation.error`

---

## 7. Paginated List Pattern

```ts
export function useBookings(params: { page: number; limit: number; search?: string }) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () =>
      api
        .get<PaginatedResponse<Booking>>("/bookings", { params })
        .then((r) => r.data),
    placeholderData: keepPreviousData, // smooth page transitions
  });
}
```

---

## 8. How to Use in a Component

```tsx
// In a list page:
const { data, isLoading, isError } = useBookings({ page, limit: 10, search: debouncedSearch });

// In a mutation call (inside form's onSubmit):
const createBooking = useCreateBooking();
try {
  const result = await createBooking.mutateAsync(payload);
  navigate(`/bookings/${result.id}`);
} catch (err) {
  setError("root", { message: extractError(err) });
}
```

---

## 9. What NOT to Do

❌ Do not call `axios.get(...)` directly inside a component or page  
❌ Do not put `useQuery` or `useMutation` inside a page file — extract to `*.api.ts`  
❌ Do not hardcode API URLs — always use the shared `api` client whose baseURL reads from `import.meta.env.VITE_API_URL`  
❌ Do not create a separate `queryClient` in a component — use `useQueryClient()`  
❌ Do not store server state in `useState` — that is what React Query is for  
