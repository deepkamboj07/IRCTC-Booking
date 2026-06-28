import { Request, Response } from "express";
import { adminTrainsService } from "./admin-trains.service";
import {
  CreateTrainDto,
  UpdateTrainDto,
  SetRouteStopsDto,
  CreateCoachDto,
  CreateScheduleDto,
  TrainListQuery,
} from "./admin-trains.schemas";

type IdParam      = { id: string };
type CoachParam   = { id: string; coachId: string };

export const adminTrainsController = {
  async list(req: Request, res: Response) {
    const result = await adminTrainsService.list(req.query as unknown as TrainListQuery);
    res.json({ success: true, data: result });
  },

  async getById(req: Request<IdParam>, res: Response) {
    const train = await adminTrainsService.getById(req.params.id);
    res.json({ success: true, data: train });
  },

  async create(req: Request, res: Response) {
    const train = await adminTrainsService.create(req.body as CreateTrainDto);
    res.status(201).json({ success: true, data: train });
  },

  async update(req: Request<IdParam>, res: Response) {
    const train = await adminTrainsService.update(req.params.id, req.body as UpdateTrainDto);
    res.json({ success: true, data: train });
  },

  async delete(req: Request<IdParam>, res: Response) {
    await adminTrainsService.delete(req.params.id);
    res.json({ success: true, data: { message: "Train deleted" } });
  },

  async setRouteStops(req: Request<IdParam>, res: Response) {
    const stops = await adminTrainsService.setRouteStops(req.params.id, req.body as SetRouteStopsDto);
    res.json({ success: true, data: stops });
  },

  async getRouteStops(req: Request<IdParam>, res: Response) {
    const stops = await adminTrainsService.getRouteStops(req.params.id);
    res.json({ success: true, data: stops });
  },

  async addCoach(req: Request<IdParam>, res: Response) {
    const coach = await adminTrainsService.addCoach(req.params.id, req.body as CreateCoachDto);
    res.status(201).json({ success: true, data: coach });
  },

  async getCoaches(req: Request<IdParam>, res: Response) {
    const coaches = await adminTrainsService.getCoaches(req.params.id);
    res.json({ success: true, data: coaches });
  },

  async deleteCoach(req: Request<CoachParam>, res: Response) {
    await adminTrainsService.deleteCoach(req.params.id, req.params.coachId);
    res.json({ success: true, data: { message: "Coach deleted" } });
  },

  async createSchedule(req: Request<IdParam>, res: Response) {
    const result = await adminTrainsService.createSchedule(req.params.id, req.body as CreateScheduleDto);
    res.status(201).json({ success: true, data: result });
  },

  async getSchedules(req: Request<IdParam>, res: Response) {
    const schedules = await adminTrainsService.getSchedules(req.params.id);
    res.json({ success: true, data: schedules });
  },
};
