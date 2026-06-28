import { Router } from "express";
import { bookingsController } from "./bookings.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createBookingSchema, bookingParamsSchema, bookingListQuerySchema } from "./bookings.schemas";

export const bookingsRouter = Router();

bookingsRouter.post(
  "/",
  verifyJWT,
  validate({ body: createBookingSchema }),
  bookingsController.confirm,
);

bookingsRouter.get(
  "/",
  verifyJWT,
  validate({ query: bookingListQuerySchema }),
  bookingsController.list,
);

// pnr route must come before /:id to avoid "pnr" being captured as an id param
bookingsRouter.get(
  "/pnr/:pnr",
  verifyJWT,
  bookingsController.getByPnr,
);

bookingsRouter.get(
  "/:id",
  verifyJWT,
  validate({ params: bookingParamsSchema }),
  bookingsController.getById,
);

bookingsRouter.patch(
  "/:id/cancel",
  verifyJWT,
  validate({ params: bookingParamsSchema }),
  bookingsController.cancel,
);
