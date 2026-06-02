import express from "express";
import cors from "cors";

import { authRoutes } from "./routes/auth.routes";
import { mastersRoutes } from "./routes/masters.routes";
import { servicesRoutes } from "./routes/services.routes";
import { clientsRoutes } from "./routes/clients.routes";
import { appointmentsRoutes } from "./routes/appointments.routes";
import { freeSlotsRoutes } from "./routes/free-slots.routes";
import { requestsRoutes } from "./routes/requests.routes";

export const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Beauty CRM API is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/masters", mastersRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/free-slots", freeSlotsRoutes);
app.use("/api/requests", requestsRoutes);