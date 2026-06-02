import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  masters,
  services,
  serviceOptions,
  users,
} from "./schema";

async function seed() {
  console.log("Seeding database...");

  const createdMasters = await db
    .insert(masters)
    .values([
      {
        name: "Аяна",
        colorName: "Базилик",
        colorHex: "#15803D",
        isTopMaster: false,
      },
      {
        name: "Азиза",
        colorName: "Виноград",
        colorHex: "#8E24AA",
        isTopMaster: false,
      },
      {
        name: "Дильнара",
        colorName: "Цвет по умолчанию",
        colorHex: "#BE185D",
        isTopMaster: false,
      },
    ])
    .returning();

  await db.insert(services).values([
    {
      name: "Наращивание ресниц 1D",
      category: "Ресницы",
      basePrice: 8000,
      durationMinutes: 120,
    },
    {
      name: "Наращивание ресниц 2D",
      category: "Ресницы",
      basePrice: 9000,
      durationMinutes: 150,
    },
    {
      name: "Наращивание ресниц 3D",
      category: "Ресницы",
      basePrice: 10000,
      durationMinutes: 150,
    },
    {
      name: "Mega Volume",
      category: "Ресницы",
      basePrice: 12000,
      durationMinutes: 150,
    },
    {
      name: "Нижние ресницы",
      category: "Ресницы",
      basePrice: 3000,
      durationMinutes: 40,
    },
    {
      name: "Коррекция бровей",
      category: "Брови",
      basePrice: 3000,
      durationMinutes: 40,
    },
    {
      name: "Окрашивание с коррекцией",
      category: "Брови",
      basePrice: 6000,
      durationMinutes: 60,
    },
    {
      name: "Ламинирование бровей",
      category: "Брови",
      basePrice: 7000,
      durationMinutes: 60,
    },
    {
      name: "Ламинирование бровей с окрашиванием",
      category: "Брови",
      basePrice: 9000,
      durationMinutes: 70,
    },
    {
      name: "Ламинирование ресниц с окрашиванием",
      category: "Ламинирование",
      basePrice: 8000,
      durationMinutes: 60,
    },
  ]);

  await db.insert(serviceOptions).values([
    {
      name: "Лучики",
      category: "Ресницы",
      priceDelta: 2000,
      durationDeltaMinutes: 10,
    },
    {
      name: "Мокрый эффект",
      category: "Ресницы",
      priceDelta: 2000,
      durationDeltaMinutes: 10,
    },
    {
      name: "LED",
      category: "Ресницы",
      priceDelta: 4000,
      durationDeltaMinutes: 15,
    },
    {
      name: "Снятие чужой работы",
      category: "Ресницы",
      priceDelta: 1500,
      durationDeltaMinutes: 20,
    },
    {
      name: "Снятие нашей работы",
      category: "Ресницы",
      priceDelta: 1500,
      durationDeltaMinutes: 15,
    },
    {
      name: "Усики",
      category: "Брови",
      priceDelta: 1500,
      durationDeltaMinutes: 20,
    },
  ]);

  const adminPasswordHash = await bcrypt.hash("123456", 10);

  await db.insert(users).values({
    name: "Жанна",
    phone: "77000000000",
    email: "admin@dracarys.kz",
    passwordHash: adminPasswordHash,
    role: "admin",
    masterId: null,
  });

  const masterPasswordHash = await bcrypt.hash("123456", 10);

  await db.insert(users).values([
    {
      name: "Аяна",
      phone: "77000000001",
      email: "ayana@dracarys.kz",
      passwordHash: masterPasswordHash,
      role: "master",
      masterId: createdMasters[0].id,
    },
    {
      name: "Азиза",
      phone: "77000000002",
      email: "aziza@dracarys.kz",
      passwordHash: masterPasswordHash,
      role: "master",
      masterId: createdMasters[1].id,
    },
    {
      name: "Дильнара",
      phone: "77000000003",
      email: "dilnara@dracarys.kz",
      passwordHash: masterPasswordHash,
      role: "master",
      masterId: createdMasters[2].id,
    },
  ]);

  console.log("Seed completed.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});