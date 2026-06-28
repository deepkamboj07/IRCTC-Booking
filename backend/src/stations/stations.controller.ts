import { Request, Response } from "express";
import { stationsService } from "./stations.service";
import { CreateStationDto, UpdateStationDto, StationListQuery } from "./stations.schemas";

type IdParam = { id: string };

export const stationsController = {
  async list(req: Request, res: Response) {
    const result = await stationsService.list(req.query as unknown as StationListQuery);
    res.json({ success: true, data: result });
  },

  async getById(req: Request<IdParam>, res: Response) {
    const station = await stationsService.getById(req.params.id);
    res.json({ success: true, data: station });
  },

  async create(req: Request, res: Response) {
    const station = await stationsService.create(req.body as CreateStationDto);
    res.status(201).json({ success: true, data: station });
  },

  async update(req: Request<IdParam>, res: Response) {
    const station = await stationsService.update(req.params.id, req.body as UpdateStationDto);
    res.json({ success: true, data: station });
  },

  async delete(req: Request<IdParam>, res: Response) {
    await stationsService.delete(req.params.id);
    res.json({ success: true, data: { message: "Station deleted" } });
  },
};
