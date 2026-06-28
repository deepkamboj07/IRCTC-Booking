import "dotenv/config";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin: env.NODE_ENV === "production" ? false : true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", env: env.NODE_ENV });
});

import { authRouter }      from "./auth/auth.routes";
import { stationsRouter }  from "./stations/stations.routes";
import { adminRouter }     from "./admin/admin.routes";
import { trainsRouter }    from "./trains/trains.routes";
import { seatHoldsRouter } from "./seat-holds/seatHolds.routes";
import { bookingsRouter }  from "./bookings/bookings.routes";
import { chatRouter }      from "./chat/chat.routes";

app.use("/api/v1/auth",       authRouter);
app.use("/api/v1/stations",   stationsRouter);
app.use("/api/v1/admin",      adminRouter);
app.use("/api/v1/trains",     trainsRouter);
app.use("/api/v1/seat-holds", seatHoldsRouter);
app.use("/api/v1/bookings",   bookingsRouter);
app.use("/api/v1/chat",       chatRouter);

app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});
