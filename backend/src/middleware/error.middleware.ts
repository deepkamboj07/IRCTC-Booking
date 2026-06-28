import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app.errors";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // PostgreSQL lock timeout
  if (
    err instanceof Error &&
    "code" in err &&
    (err as NodeJS.ErrnoException).code === "55P03"
  ) {
    res.status(409).json({
      success: false,
      code: "LOCK_TIMEOUT",
      message: "Resource is busy, please try again",
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  });
}
