import { Router } from "express";
import { z } from "zod";
import { ilike, or, eq } from "drizzle-orm";
import { db } from "../db";
import { appointments, clients, masters, services } from "../db/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { getPhoneLast4 } from "../utils/time";

export const clientsRoutes = Router();

clientsRoutes.get("/", authMiddleware, async (req, res) => {
  const search = String(req.query.search ?? "");

  if (search) {
    const data = await db
      .select()
      .from(clients)
      .where(
        or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.phoneLast4, `%${search}%`),
          ilike(clients.phone, `%${search}%`)
        )
      );

    return res.json(data);
  }

  const data = await db.select().from(clients);

  return res.json(data);
});

clientsRoutes.get("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);

  const data = await db.select().from(clients).where(eq(clients.id, id));

  const client = data[0];

  if (!client) {
    return res.status(404).json({
      message: "Client not found",
    });
  }

  return res.json(client);
});

const createClientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  notes: z.string().optional(),
});

clientsRoutes.post("/", authMiddleware, async (req, res) => {
  try {
    const data = createClientSchema.parse(req.body);

    const phoneLast4 = getPhoneLast4(data.phone) ?? undefined;

    const [createdClient] = await db
      .insert(clients)
      .values({
        name: data.name,
        phone: data.phone,
        phoneLast4,
        instagram: data.instagram,
        notes: data.notes,
      })
      .returning();

    return res.status(201).json(createdClient);
  } catch (error) {
    return res.status(400).json({
      message: "Invalid client data",
      error,
    });
  }
});
clientsRoutes.get("/:id/appointments", authMiddleware, async (req, res) => {
  const clientId = Number(req.params.id);

  const data = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      totalPrice: appointments.totalPrice,
      status: appointments.status,
      notes: appointments.notes,

      masterId: masters.id,
      masterName: masters.name,
      masterColorName: masters.colorName,
      masterColorHex: masters.colorHex,

      serviceId: services.id,
      serviceName: services.name,
      serviceCategory: services.category,
    })
    .from(appointments)
    .leftJoin(masters, eq(appointments.masterId, masters.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(appointments.clientId, clientId));

  return res.json(data);
});