import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { authMiddleware } from "../middleware/auth.middleware";

export const authRoutes = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6),
  role: z.enum(["owner", "admin", "master"]).default("master"),
  masterId: z.number().nullable().optional(),
});

authRoutes.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    if (!data.phone && !data.email) {
      return res.status(400).json({
        message: "Phone or email is required",
      });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(
        or(
          data.phone ? eq(users.phone, data.phone) : undefined,
          data.email ? eq(users.email, data.email) : undefined
        )
      );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const [createdUser] = await db
      .insert(users)
      .values({
        name: data.name,
        phone: data.phone,
        email: data.email,
        passwordHash,
        role: data.role,
        masterId: data.masterId ?? null,
      })
      .returning();

    return res.status(201).json({
      id: createdUser.id,
      name: createdUser.name,
      role: createdUser.role,
      masterId: createdUser.masterId,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Invalid register data",
      error,
    });
  }
});

const loginSchema = z.object({
  login: z.string().min(2),
  password: z.string().min(6),
});

authRoutes.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const foundUsers = await db
      .select()
      .from(users)
      .where(or(eq(users.phone, data.login), eq(users.email, data.login)));

    const user = foundUsers[0];

    if (!user) {
      return res.status(401).json({
        message: "Invalid login or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid login or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        masterId: user.masterId,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        masterId: user.masterId,
      },
    });
  } catch (error) {
    return res.status(400).json({
      message: "Invalid login data",
      error,
    });
  }
});

authRoutes.get("/me", authMiddleware, async (req, res) => {
  return res.json({
    user: req.user,
  });
});