import { Router } from "express";
import { chatController } from "./chat.controller";
import { verifyJWT } from "../middleware/auth.middleware";

export const chatRouter = Router();

chatRouter.post("/message", verifyJWT, chatController.sendMessage);
