import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { masters } from "../db/schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { allowRoles } from "../middleware/role.middleware";

export const mastersRoutes = Router();

mastersRoutes.get("/", authMiddleware, async (req, res) => {
  const data = await db
    .select()
    .from(masters)
    .where(eq(masters.isActive, true));

  return res.json(data);
});

const createMasterSchema = z.object({
  name: z.string().min(2),
  colorName: z.string().min(2),
  colorHex: z.string().min(4),
  isTopMaster: z.boolean().optional(),
});

mastersRoutes.post(
  "/",
  authMiddleware,
  allowRoles(["owner", "admin"]),
  async (req, res) => {
    try {
      const data = createMasterSchema.parse(req.body);

      const [createdMaster] = await db
        .insert(masters)
        .values({
          name: data.name,
          colorName: data.colorName,
          colorHex: data.colorHex,
          isTopMaster: data.isTopMaster ?? false,
        })
        .returning();

      return res.status(201).json(createdMaster);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid master data",
        error,
      });
    }
  }
);

const updateMasterSchema = createMasterSchema.partial();

mastersRoutes.patch(
  "/:id",
  authMiddleware,
  allowRoles(["owner", "admin"]),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = updateMasterSchema.parse(req.body);

      const [updatedMaster] = await db
        .update(masters)
        .set(data)
        .where(eq(masters.id, id))
        .returning();

      if (!updatedMaster) {
        return res.status(404).json({
          message: "Master not found",
        });
      }

      return res.json(updatedMaster);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid update data",
        error,
      });
    }
  }
);