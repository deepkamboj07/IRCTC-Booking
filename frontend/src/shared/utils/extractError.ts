import axios from "axios";

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}
