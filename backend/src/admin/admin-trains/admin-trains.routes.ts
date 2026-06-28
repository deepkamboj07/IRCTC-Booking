import { Router } from "express";
import { adminTrainsController } from "./admin-trains.controller";
import { validate } from "../../middleware/validate.middleware";
import {
  createTrainSchema,
  updateTrainSchema,
  setRouteStopsSchema,
  createCoachSchema,
  createScheduleSchema,
  trainListQuerySchema,
  trainParamsSchema,
  coachParamsSchema,
} from "./admin-trains.schemas";

export const adminTrainsRouter = Router();

// Trains CRUD
adminTrainsRouter.get(   "/", validate({ query: trainListQuerySchema }),                                        adminTrainsController.list);
adminTrainsRouter.post(  "/", validate({ body: createTrainSchema }),                                            adminTrainsController.create);
adminTrainsRouter.get(   "/:id", validate({ params: trainParamsSchema }),                                       adminTrainsController.getById);
adminTrainsRouter.patch( "/:id", validate({ params: trainParamsSchema }), validate({ body: updateTrainSchema }), adminTrainsController.update);
adminTrainsRouter.delete("/:id", validate({ params: trainParamsSchema }),                                       adminTrainsController.delete);

// Route stops (batch replace)
adminTrainsRouter.put("/:id/route-stops",
  validate({ params: trainParamsSchema }),
  validate({ body: setRouteStopsSchema }),
  adminTrainsController.setRouteStops
);
adminTrainsRouter.get("/:id/route-stops",
  validate({ params: trainParamsSchema }),
  adminTrainsController.getRouteStops
);

// Coaches
adminTrainsRouter.post(  "/:id/coaches",            validate({ params: trainParamsSchema }), validate({ body: createCoachSchema }), adminTrainsController.addCoach);
adminTrainsRouter.get(   "/:id/coaches",            validate({ params: trainParamsSchema }),                                        adminTrainsController.getCoaches);
adminTrainsRouter.delete("/:id/coaches/:coachId",   validate({ params: coachParamsSchema }),                                        adminTrainsController.deleteCoach);

// Schedules
adminTrainsRouter.post("/:id/schedules",
  validate({ params: trainParamsSchema }),
  validate({ body: createScheduleSchema }),
  adminTrainsController.createSchedule
);
adminTrainsRouter.get("/:id/schedules",
  validate({ params: trainParamsSchema }),
  adminTrainsController.getSchedules
);
