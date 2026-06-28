import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { verifyJWT, requireRole } from "../middleware/auth.middleware";
import { adminTrainsRouter } from "./admin-trains/admin-trains.routes";
import { adminBookingsRouter } from "./admin-bookings/admin-bookings.routes";

export const adminRouter = Router();

// Every route under /api/v1/admin requires a valid JWT + ADMIN role
adminRouter.use(verifyJWT, requireRole(Role.ADMIN));

// GET /api/v1/admin/seat-classes — needed by frontend coach creation form
adminRouter.get("/seat-classes", async (req, res) => {
  const classes = await prisma.seatClass.findMany({ orderBy: { name: "asc" } });
  res.json({ success: true, data: classes });
});

adminRouter.use("/trains", adminTrainsRouter);
adminRouter.use("/bookings", adminBookingsRouter);
