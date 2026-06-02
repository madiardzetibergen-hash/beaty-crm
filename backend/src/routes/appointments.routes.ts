import { Router } from "express";
import { z } from "zod";
import {
  and,
  eq,
  ne,
  lt,
  gt,
  gte,
  lte,
  inArray,
} from "drizzle-orm";
import { db } from "../db";
import {
  appointments,
  appointmentOptions,
  clients,
  masters,
  services,
  serviceOptions,
} from "../db/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { allowRoles } from "../middleware/role.middleware";
import { addMinutes, getDayRange, getPhoneLast4 } from "../utils/time";

export const appointmentsRoutes = Router();

appointmentsRoutes.get("/", authMiddleware, async (req, res) => {
  const date = String(req.query.date ?? "");

  if (!date) {
    return res.status(400).json({
      message: "date query is required. Example: ?date=2026-06-02",
    });
  }

  const { startOfDay, endOfDay } = getDayRange(date);

  const whereConditions = [
    gte(appointments.startTime, startOfDay),
    lte(appointments.startTime, endOfDay),
    ne(appointments.status, "cancelled" as const),
  ];

  if (req.user?.role === "master") {
    if (!req.user.masterId) {
      return res.status(403).json({
        message: "Master account is not linked to master profile",
      });
    }

    whereConditions.push(eq(appointments.masterId, req.user.masterId));
  }

  const data = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      totalPrice: appointments.totalPrice,
      status: appointments.status,
      notes: appointments.notes,

      clientId: clients.id,
      clientName: clients.name,
      clientPhoneLast4: clients.phoneLast4,

      masterId: masters.id,
      masterName: masters.name,
      masterColorName: masters.colorName,
      masterColorHex: masters.colorHex,

      serviceId: services.id,
      serviceName: services.name,
      serviceCategory: services.category,
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(masters, eq(appointments.masterId, masters.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(and(...whereConditions));

  return res.json(data);
});

appointmentsRoutes.get("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);

  const data = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      totalPrice: appointments.totalPrice,
      status: appointments.status,
      notes: appointments.notes,

      clientId: clients.id,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientPhoneLast4: clients.phoneLast4,

      masterId: masters.id,
      masterName: masters.name,
      masterColorName: masters.colorName,
      masterColorHex: masters.colorHex,

      serviceId: services.id,
      serviceName: services.name,
      serviceCategory: services.category,
    })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(masters, eq(appointments.masterId, masters.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(appointments.id, id));

  const appointment = data[0];

  if (!appointment) {
    return res.status(404).json({
      message: "Appointment not found",
    });
  }

  if (req.user?.role === "master" && appointment.masterId !== req.user.masterId) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const options = await db
    .select({
      id: serviceOptions.id,
      name: serviceOptions.name,
      priceDelta: serviceOptions.priceDelta,
      durationDeltaMinutes: serviceOptions.durationDeltaMinutes,
    })
    .from(appointmentOptions)
    .leftJoin(
      serviceOptions,
      eq(appointmentOptions.serviceOptionId, serviceOptions.id)
    )
    .where(eq(appointmentOptions.appointmentId, id));

  return res.json({
    ...appointment,
    options,
  });
});
const createAppointmentSchema = z.object({
  clientId: z.number().int().optional(),

  client: z
    .object({
      name: z.string().min(2),
      phone: z.string().optional(),
      instagram: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),

  masterId: z.number().int(),
  serviceId: z.number().int(),

  optionIds: z.array(z.number().int()).default([]),

  startTime: z.string().datetime(),

  notes: z.string().optional(),
});

appointmentsRoutes.post(
  "/",
  authMiddleware,
  allowRoles(["owner", "admin"]),
  async (req, res) => {
    try {
      const data = createAppointmentSchema.parse(req.body);

      if (!data.clientId && !data.client) {
        return res.status(400).json({
          message: "clientId or client data is required",
        });
      }

      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, data.serviceId));

      if (!service) {
        return res.status(404).json({
          message: "Service not found",
        });
      }

      const options =
        data.optionIds.length > 0
          ? await db
              .select()
              .from(serviceOptions)
              .where(inArray(serviceOptions.id, data.optionIds))
          : [];

      const optionsDuration = options.reduce(
        (sum, option) => sum + option.durationDeltaMinutes,
        0
      );

      const optionsPrice = options.reduce(
        (sum, option) => sum + option.priceDelta,
        0
      );

      const totalDuration = service.durationMinutes + optionsDuration;
      const totalPrice = service.basePrice + optionsPrice;

      const startTime = new Date(data.startTime);
      const endTime = addMinutes(startTime, totalDuration);

      const conflicts = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.masterId, data.masterId),
            ne(appointments.status, "cancelled" as const),
            lt(appointments.startTime, endTime),
            gt(appointments.endTime, startTime)
          )
        );

      if (conflicts.length > 0) {
        return res.status(409).json({
          message: "This time is already booked",
          conflicts,
        });
      }

      let finalClientId = data.clientId;
      let createdClient = null;

      if (data.clientId) {
        const existingClient = await db
          .select()
          .from(clients)
          .where(eq(clients.id, data.clientId));

        if (!existingClient[0]) {
          return res.status(404).json({
            message: "Client not found",
          });
        }

        finalClientId = existingClient[0].id;
      }

      if (!data.clientId && data.client) {
        const phoneLast4 = getPhoneLast4(data.client.phone) ?? undefined;

        const [newClient] = await db
          .insert(clients)
          .values({
            name: data.client.name,
            phone: data.client.phone,
            phoneLast4,
            instagram: data.client.instagram,
            notes: data.client.notes,
          })
          .returning();

        createdClient = newClient;
        finalClientId = newClient.id;
      }

      if (!finalClientId) {
        return res.status(400).json({
          message: "Client could not be resolved",
        });
      }

      const [createdAppointment] = await db
        .insert(appointments)
        .values({
          clientId: finalClientId,
          masterId: data.masterId,
          serviceId: data.serviceId,
          startTime,
          endTime,
          totalPrice,
          notes: data.notes,
          createdBy: req.user?.id,
        })
        .returning();

      if (data.optionIds.length > 0) {
        await db.insert(appointmentOptions).values(
          data.optionIds.map((serviceOptionId) => ({
            appointmentId: createdAppointment.id,
            serviceOptionId,
          }))
        );
      }

      return res.status(201).json({
        appointment: createdAppointment,
        client: createdClient,
        clientId: finalClientId,
        totalDuration,
        totalPrice,
        options,
      });
    } catch (error) {
      return res.status(400).json({
        message: "Invalid appointment data",
        error,
      });
    }
  }
);

const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    "booked",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
    "rescheduled",
  ]),
  notes: z.string().optional(),
});

appointmentsRoutes.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = updateAppointmentStatusSchema.parse(req.body);

    const existing = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));

    const appointment = existing[0];

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (
      req.user?.role === "master" &&
      appointment.masterId !== req.user.masterId
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        status: data.status,
        notes: data.notes ?? appointment.notes,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    return res.json(updatedAppointment);
  } catch (error) {
    return res.status(400).json({
      message: "Invalid status data",
      error,
    });
  }
});
const updateAppointmentSchema = z.object({
  masterId: z.number().int().optional(),
  serviceId: z.number().int().optional(),
  optionIds: z.array(z.number().int()).optional(),
  startTime: z.string().datetime().optional(),
  notes: z.string().optional(),
  status: z
    .enum([
      "booked",
      "confirmed",
      "completed",
      "cancelled",
      "no_show",
      "rescheduled",
    ])
    .optional(),
});

appointmentsRoutes.patch(
  "/:id",
  authMiddleware,
  allowRoles(["owner", "admin"]),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = updateAppointmentSchema.parse(req.body);

      const existingAppointments = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, id));

      const existingAppointment = existingAppointments[0];

      if (!existingAppointment) {
        return res.status(404).json({
          message: "Appointment not found",
        });
      }

      const finalMasterId = data.masterId ?? existingAppointment.masterId;
      const finalServiceId = data.serviceId ?? existingAppointment.serviceId;
      const finalStartTime = data.startTime
        ? new Date(data.startTime)
        : existingAppointment.startTime;

      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, finalServiceId));

      if (!service) {
        return res.status(404).json({
          message: "Service not found",
        });
      }

      const finalOptionIds = data.optionIds ?? [];

      const selectedOptions =
        finalOptionIds.length > 0
          ? await db
              .select()
              .from(serviceOptions)
              .where(inArray(serviceOptions.id, finalOptionIds))
          : [];

      const optionsDuration = selectedOptions.reduce(
        (sum, option) => sum + option.durationDeltaMinutes,
        0
      );

      const optionsPrice = selectedOptions.reduce(
        (sum, option) => sum + option.priceDelta,
        0
      );

      const totalDuration = service.durationMinutes + optionsDuration;
      const totalPrice = service.basePrice + optionsPrice;
      const finalEndTime = addMinutes(finalStartTime, totalDuration);

      const conflicts = await db
        .select()
        .from(appointments)
        .where(
          and(
            ne(appointments.id, id),
            eq(appointments.masterId, finalMasterId),
            ne(appointments.status, "cancelled" as const),
            lt(appointments.startTime, finalEndTime),
            gt(appointments.endTime, finalStartTime)
          )
        );

      if (conflicts.length > 0) {
        return res.status(409).json({
          message: "This time is already booked",
          conflicts,
        });
      }

      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          masterId: finalMasterId,
          serviceId: finalServiceId,
          startTime: finalStartTime,
          endTime: finalEndTime,
          totalPrice,
          notes: data.notes ?? existingAppointment.notes,
          status: data.status ?? "rescheduled",
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, id))
        .returning();

      if (data.optionIds) {
        await db
          .delete(appointmentOptions)
          .where(eq(appointmentOptions.appointmentId, id));

        if (data.optionIds.length > 0) {
          await db.insert(appointmentOptions).values(
            data.optionIds.map((serviceOptionId) => ({
              appointmentId: id,
              serviceOptionId,
            }))
          );
        }
      }

      return res.json({
        appointment: updatedAppointment,
        totalDuration,
        totalPrice,
        options: selectedOptions,
      });
    } catch (error) {
      return res.status(400).json({
        message: "Invalid update appointment data",
        error,
      });
    }
  }
);

appointmentsRoutes.delete(
  "/:id",
  authMiddleware,
  allowRoles(["owner", "admin"]),
  async (req, res) => {
    const id = Number(req.params.id);

    const [cancelledAppointment] = await db
      .update(appointments)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    if (!cancelledAppointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    return res.json({
      message: "Appointment cancelled",
      appointment: cancelledAppointment,
    });
  }
);