import { Router } from "express";
import { seatHoldsController } from "./seatHolds.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createHoldSchema, holdParamsSchema } from "./seatHolds.schemas";

export const seatHoldsRouter = Router();

seatHoldsRouter.post(
  "/",
  verifyJWT,
  validate({ body: createHoldSchema }),
  seatHoldsController.create,
);

seatHoldsRouter.get(
  "/:holdId",
  verifyJWT,
  validate({ params: holdParamsSchema }),
  seatHoldsController.get,
);

seatHoldsRouter.delete(
  "/:holdId",
  verifyJWT,
  validate({ params: holdParamsSchema }),
  seatHoldsController.release,
);
