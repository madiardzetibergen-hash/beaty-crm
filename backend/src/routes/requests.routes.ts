import { Router } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";

import { db } from "../db";
import { adminRequests, users, masters } from "../db/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { allowRoles } from "../middleware/role.middleware";

export const requestsRoutes = Router();

requestsRoutes.get("/", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  if (req.user.role === "master") {
    const data = await db
      .select({
        id: adminRequests.id,
        title: adminRequests.title,
        message: adminRequests.message,
        status: adminRequests.status,
        createdAt: adminRequests.createdAt,
        updatedAt: adminRequests.updatedAt,

        createdBy: users.id,
        createdByName: users.name,

        masterId: masters.id,
        masterName: masters.name,
        masterColorHex: masters.colorHex,
      })
      .from(adminRequests)
      .leftJoin(users, eq(adminRequests.createdBy, users.id))
      .leftJoin(masters, eq(adminRequests.masterId, masters.id))
      .where(eq(adminRequests.createdBy, req.user.id))
      .orderBy(desc(adminRequests.createdAt));

    return res.json(data);
  }

  const data = await db
    .select({
      id: adminRequests.id,
      title: adminRequests.title,
      message: adminRequests.message,
      status: adminRequests.status,
      createdAt: adminRequests.createdAt,
      updatedAt: adminRequests.updatedAt,

      createdBy: users.id,
      createdByName: users.name,

      masterId: masters.id,
      masterName: masters.name,
      masterColorHex: masters.colorHex,
    })
    .from(adminRequests)
    .leftJoin(users, eq(adminRequests.createdBy, users.id))
    .leftJoin(masters, eq(adminRequests.masterId, masters.id))
    .orderBy(desc(adminRequests.createdAt));

  return res.json(data);
});

const createRequestSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
});

requestsRoutes.post("/", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = createRequestSchema.parse(req.body);

    const [createdRequest] = await db
      .insert(adminRequests)
      .values({
        title: data.title,
        message: data.message,
        createdBy: req.user.id,
        masterId: req.user.masterId,
      })
      .returning();

    return res.status(201).json(createdRequest);
  } catch (error) {
    return res.status(400).json({
      message: "Invalid request data",
      error,
    });
  }
});

const updateRequestStatusSchema = z.object({
  status: z.enum(["new", "in_progress", "done", "rejected"]),
});

requestsRoutes.patch(
  "/:id/status",
  authMiddleware,
  allowRoles(["owner", "admin"]),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = updateRequestStatusSchema.parse(req.body);

      const [updatedRequest] = await db
        .update(adminRequests)
        .set({
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(adminRequests.id, id))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({
          message: "Request not found",
        });
      }

      return res.json(updatedRequest);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid status data",
        error,
      });
    }
  }
);