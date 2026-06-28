import { Request, Response } from "express";
import { trainsService } from "./trains.service";
import {
  TrainSearchQuery,
  TrainParams,
  ScheduleParams,
  SeatMapParams,
  AvailabilityQuery,
} from "./trains.schemas";

export const trainsController = {
  async search(req: Request, res: Response) {
    const query  = req.query as unknown as TrainSearchQuery;
    const result = await trainsService.searchTrains(query);
    res.json({ success: true, data: result });
  },

  async getById(req: Request<TrainParams>, res: Response) {
    const train = await trainsService.getById(req.params.trainId);
    res.json({ success: true, data: train });
  },

  async getAvailability(req: Request<ScheduleParams>, res: Response) {
    const { scheduleId }              = req.params;
    const { from, to }                = req.query as unknown as AvailabilityQuery;
    const result                      = await trainsService.getAvailability(scheduleId, from, to);
    res.json({ success: true, data: result });
  },

  async getSeatMap(req: Request<SeatMapParams>, res: Response) {
    const { scheduleId, coachId } = req.params;
    const result                  = await trainsService.getSeatMap(scheduleId, coachId);
    res.json({ success: true, data: result });
  },
};
