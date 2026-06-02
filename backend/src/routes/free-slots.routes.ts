import { Router } from "express";
import { and, eq, gte, inArray, lte, ne } from "drizzle-orm";

import { db } from "../db";
import { appointments, serviceOptions, services } from "../db/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { addMinutes, getDayRange } from "../utils/time";

export const freeSlotsRoutes = Router();

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

function hasConflict(
  slotStart: Date,
  slotEnd: Date,
  bookedAppointments: Array<{
    startTime: Date;
    endTime: Date;
  }>
) {
  return bookedAppointments.some((appointment) => {
    return appointment.startTime < slotEnd && appointment.endTime > slotStart;
  });
}

freeSlotsRoutes.get("/", authMiddleware, async (req, res) => {
  try {
    const masterId = Number(req.query.masterId);
    const serviceId = Number(req.query.serviceId);
    const date = String(req.query.date ?? "");
    const optionIdsRaw = String(req.query.optionIds ?? "");

    if (!masterId || !serviceId || !date) {
      return res.status(400).json({
        message: "masterId, serviceId and date are required",
      });
    }

    const optionIds = optionIdsRaw
      ? optionIdsRaw
          .split(",")
          .map((id) => Number(id))
          .filter(Boolean)
      : [];

    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId));

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const selectedOptions =
      optionIds.length > 0
        ? await db
            .select()
            .from(serviceOptions)
            .where(inArray(serviceOptions.id, optionIds))
        : [];

    const optionsDuration = selectedOptions.reduce(
      (sum, option) => sum + option.durationDeltaMinutes,
      0
    );

    const totalDuration = service.durationMinutes + optionsDuration;

    const { startOfDay, endOfDay } = getDayRange(date);

    const bookedAppointments = await db
      .select({
        startTime: appointments.startTime,
        endTime: appointments.endTime,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.masterId, masterId),
          ne(appointments.status, "cancelled" as const),
          gte(appointments.startTime, startOfDay),
          lte(appointments.startTime, endOfDay)
        )
      );

    const workStart = new Date(`${date}T09:00:00`);
    const workEnd = new Date(`${date}T21:00:00`);

    const slots: Array<{
      startTime: string;
      endTime: string;
      label: string;
    }> = [];

    let current = workStart;

    while (current < workEnd) {
      const slotStart = new Date(current);
      const slotEnd = addMinutes(slotStart, totalDuration);

      if (slotEnd <= workEnd && !hasConflict(slotStart, slotEnd, bookedAppointments)) {
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          label: `${formatTime(slotStart)}–${formatTime(slotEnd)}`,
        });
      }

      current = addMinutes(current, 30);
    }

    return res.json({
      masterId,
      serviceId,
      date,
      durationMinutes: totalDuration,
      slots,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Invalid free slots request",
      error,
    });
  }
});