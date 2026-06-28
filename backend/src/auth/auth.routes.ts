import { Router } from "express";
import { authController } from "./auth.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema, updateMeSchema } from "./auth.schemas";

export const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }),  authController.register);
authRouter.post("/login",    validate({ body: loginSchema }),     authController.login);
authRouter.get( "/me",       verifyJWT,                           authController.getMe);
authRouter.patch("/me",      verifyJWT, validate({ body: updateMeSchema }), authController.updateMe);
