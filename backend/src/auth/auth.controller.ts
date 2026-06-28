import { Request, Response } from "express";
import { authService } from "./auth.service";
import { RegisterDto, LoginDto, UpdateMeDto } from "./auth.schemas";

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body as RegisterDto);
    res.status(201).json({ success: true, data: result });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body as LoginDto);
    res.json({ success: true, data: result });
  },

  async getMe(req: Request, res: Response) {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  },

  async updateMe(req: Request, res: Response) {
    const user = await authService.updateMe(req.user!.id, req.body as UpdateMeDto);
    res.json({ success: true, data: user });
  },
};
