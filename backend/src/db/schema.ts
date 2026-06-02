import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "master"]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "booked",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
]);

export const masters = pgTable("masters", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  colorName: varchar("color_name", { length: 100 }).notNull(),
  colorHex: varchar("color_hex", { length: 20 }).notNull(),

  isTopMaster: boolean("is_top_master").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }).unique(),
  email: varchar("email", { length: 150 }).unique(),

  passwordHash: text("password_hash").notNull(),

  role: userRoleEnum("role").default("master").notNull(),

  masterId: integer("master_id").references(() => masters.id),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 150 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),

  basePrice: integer("base_price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceOptions = pgTable("service_options", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 150 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),

  priceDelta: integer("price_delta").default(0).notNull(),
  durationDeltaMinutes: integer("duration_delta_minutes").default(0).notNull(),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  phone: varchar("phone", { length: 30 }),
  phoneLast4: varchar("phone_last4", { length: 4 }),

  instagram: varchar("instagram", { length: 100 }),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),

  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),

  masterId: integer("master_id")
    .references(() => masters.id)
    .notNull(),

  serviceId: integer("service_id")
    .references(() => services.id)
    .notNull(),

  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),

  totalPrice: integer("total_price").notNull(),

  status: appointmentStatusEnum("status").default("booked").notNull(),

  notes: text("notes"),

  createdBy: integer("created_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appointmentOptions = pgTable("appointment_options", {
  id: serial("id").primaryKey(),

  appointmentId: integer("appointment_id")
    .references(() => appointments.id)
    .notNull(),

  serviceOptionId: integer("service_option_id")
    .references(() => serviceOptions.id)
    .notNull(),
});