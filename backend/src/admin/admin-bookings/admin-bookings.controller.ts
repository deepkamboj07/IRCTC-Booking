import { Request, Response } from "express";
import { adminBookingsService, AdminBookingsQuery } from "./admin-bookings.service";

export const adminBookingsController = {
  async list(req: Request, res: Response) {
    const result = await adminBookingsService.list(req.query as unknown as AdminBookingsQuery);
    res.json({ success: true, data: result });
  },
};
