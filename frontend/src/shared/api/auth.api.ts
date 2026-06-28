import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api.client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "PASSENGER" | "ADMIN";
  phone?: string;
  createdAt: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const authKeys = {
  me: ["auth", "me"] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api.post<{ data: AuthResponse }>("/auth/register", payload).then((r) => r.data.data),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<{ data: AuthResponse }>("/auth/login", payload).then((r) => r.data.data),
  });
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () =>
      api.get<{ data: AuthUser }>("/auth/me").then((r) => r.data.data),
    retry: false,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; phone?: string }) =>
      api.patch<{ data: AuthUser }>("/auth/me", payload).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}
