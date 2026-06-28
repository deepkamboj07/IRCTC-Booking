import { Router } from "express";
import { trainsController } from "./trains.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  trainSearchSchema,
  trainParamsSchema,
  scheduleParamsSchema,
  seatMapParamsSchema,
  availabilityQuerySchema,
} from "./trains.schemas";

export const trainsRouter = Router();

trainsRouter.get(
  "/search",
  validate({ query: trainSearchSchema }),
  trainsController.search,
);

trainsRouter.get(
  "/:trainId",
  validate({ params: trainParamsSchema }),
  trainsController.getById,
);

trainsRouter.get(
  "/:trainId/schedules/:scheduleId/availability",
  validate({ params: scheduleParamsSchema, query: availabilityQuerySchema }),
  trainsController.getAvailability,
);

// Seat map requires authentication — user must be logged in to select seats
trainsRouter.get(
  "/:trainId/schedules/:scheduleId/coaches/:coachId/seats",
  verifyJWT,
  validate({ params: seatMapParamsSchema }),
  trainsController.getSeatMap,
);
