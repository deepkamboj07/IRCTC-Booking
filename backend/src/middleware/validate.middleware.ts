import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { ValidationError } from "../errors/app.errors";

interface ValidateSchema {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export function validate(schema: ValidateSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        const parsed = schema.params.parse(req.params) as typeof req.params;
        Object.defineProperty(req, "params", {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (schema.query) {
        const parsed = schema.query.parse(req.query) as typeof req.query;
        // Express 5: req.query is a read-only getter on IncomingMessage prototype.
        // Shadow it with an own value property so Zod-coerced values are accessible.
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = Object.values(err.flatten().fieldErrors).flat().join(", ");
        return next(new ValidationError(messages || "Validation failed"));
      }
      next(err);
    }
  };
}
