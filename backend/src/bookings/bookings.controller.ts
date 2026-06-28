import { Request, Response } from "express";
import { bookingsService } from "./bookings.service";
import { CreateBookingDto, BookingListQuery } from "./bookings.schemas";

export const bookingsController = {
  async confirm(req: Request, res: Response) {
    const result = await bookingsService.confirmBooking(req.user!.id, req.body as CreateBookingDto);
    res.status(201).json({ success: true, data: result });
  },

  async list(req: Request, res: Response) {
    const result = await bookingsService.getMyBookings(
      req.user!.id,
      req.query as unknown as BookingListQuery,
    );
    res.json({ success: true, data: result });
  },

  async getByPnr(req: Request, res: Response) {
    const booking = await bookingsService.getByPnr(req.params.pnr as string, req.user!.id);
    res.json({ success: true, data: booking });
  },

  async getById(req: Request, res: Response) {
    const booking = await bookingsService.getById(req.params.id as string, req.user!.id);
    res.json({ success: true, data: booking });
  },

  async cancel(req: Request, res: Response) {
    const result = await bookingsService.cancelBooking(req.params.id as string, req.user!.id);
    res.json({ success: true, data: result });
  },
};
