import { Router } from "express";
import { Role } from "@prisma/client";
import { stationsController } from "./stations.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createStationSchema,
  updateStationSchema,
  stationListQuerySchema,
  stationParamsSchema,
} from "./stations.schemas";

export const stationsRouter = Router();

// Public — passengers need these for search combobox
stationsRouter.get(
  "/",
  validate({ query: stationListQuerySchema }),
  stationsController.list
);
stationsRouter.get(
  "/:id",
  validate({ params: stationParamsSchema }),
  stationsController.getById
);

// Admin only
stationsRouter.post(
  "/",
  verifyJWT, requireRole(Role.ADMIN),
  validate({ body: createStationSchema }),
  stationsController.create
);
stationsRouter.patch(
  "/:id",
  verifyJWT, requireRole(Role.ADMIN),
  validate({ params: stationParamsSchema }),
  validate({ body: updateStationSchema }),
  stationsController.update
);
stationsRouter.delete(
  "/:id",
  verifyJWT, requireRole(Role.ADMIN),
  validate({ params: stationParamsSchema }),
  stationsController.delete
);
