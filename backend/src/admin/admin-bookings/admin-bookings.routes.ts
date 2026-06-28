import { Router } from "express";
import { adminBookingsController } from "./admin-bookings.controller";
import { validate } from "../../middleware/validate.middleware";
import { adminBookingsQuerySchema } from "./admin-bookings.service";

export const adminBookingsRouter = Router();

adminBookingsRouter.get(
  "/",
  validate({ query: adminBookingsQuerySchema }),
  adminBookingsController.list
);
