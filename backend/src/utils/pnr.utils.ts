import { randomBytes } from "crypto";

export function generatePNR(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}
