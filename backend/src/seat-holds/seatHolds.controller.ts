import { Request, Response } from "express";
import { seatHoldsService } from "./seatHolds.service";
import { CreateHoldDto } from "./seatHolds.schemas";

export const seatHoldsController = {
  async create(req: Request, res: Response) {
    const result = await seatHoldsService.createHold(req.user!.id, req.body as CreateHoldDto);
    res.status(201).json({ success: true, data: result });
  },

  async get(req: Request, res: Response) {
    const result = await seatHoldsService.getHold(req.params.holdId as string, req.user!.id);
    res.json({ success: true, data: result });
  },

  async release(req: Request, res: Response) {
    await seatHoldsService.releaseHold(req.params.holdId as string, req.user!.id);
    res.json({ success: true, data: { message: "Hold released" } });
  },
};
