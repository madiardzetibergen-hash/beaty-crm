import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { services, serviceOptions } from "../db/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { allowRoles } from "../middleware/role.middleware";

export const servicesRoutes = Router();

servicesRoutes.get("/", authMiddleware, async (req, res) => {
  const data = await db
    .select()
    .from(services)
    .where(eq(services.isActive, true));

  return res.json(data);
});

servicesRoutes.get("/options", authMiddleware, async (req, res) => {
  const data = await db
    .select()
    .from(serviceOptions)
    .where(eq(serviceOptions.isActive, true));

  return res.json(data);
});

const createServiceSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  basePrice: z.number().int().min(0),
  durationMinutes: z.number().int().min(1),
});

servicesRoutes.post(
  "/",
  authMiddleware,
  allowRoles(["owner", "admin"]),
  async (req, res) => {
    try {
      const data = createServiceSchema.parse(req.body);

      const [createdService] = await db
        .insert(services)
        .values(data)
        .returning();

      return res.status(201).json(createdService);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid service data",
        error,
      });
    }
  }
);

const createOptionSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  priceDelta: z.number().int().default(0),
  durationDeltaMinutes: z.number().int().default(0),
});

servicesRoutes.post(
  "/options",
  authMiddleware,
  allowRoles(["owner", "admin"]),
  async (req, res) => {
    try {
      const data = createOptionSchema.parse(req.body);

      const [createdOption] = await db
        .insert(serviceOptions)
        .values(data)
        .returning();

      return res.status(201).json(createdOption);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid option data",
        error,
      });
    }
  }
);