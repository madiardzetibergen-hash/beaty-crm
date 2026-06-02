import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  adminRequests,
  appointmentOptions,
  appointments,
  clients,
  masters,
  serviceOptions,
  services,
  users,
} from "./schema";

async function resetData() {
  console.log("Cleaning database...");

  // 1. Сначала удаляем зависимые таблицы
  await db.delete(appointmentOptions);
  await db.delete(adminRequests);
  await db.delete(appointments);

  // 2. Потом клиентов и пользователей
  await db.delete(clients);
  await db.delete(users);

  // 3. Потом справочники
  await db.delete(masters);
  await db.delete(services);
  await db.delete(serviceOptions);

  console.log("Database cleaned.");
  console.log("Seeding fresh data...");

  // МАСТЕРА
  const createdMasters = await db
    .insert(masters)
    .values([
      {
        name: "Аяна",
        colorName: "Базилик",
        colorHex: "#15803D",
        isTopMaster: true,
      },
      {
        name: "Азиза",
        colorName: "Виноград",
        colorHex: "#8E24AA",
        isTopMaster: true,
      },
      {
        name: "Дильнара",
        colorName: "Цвет по умолчанию",
        colorHex: "#BE185D",
        isTopMaster: true,
      },
    ])
    .returning();

  // УСЛУГИ — ТОП МАСТЕР
  await db.insert(services).values([
    {
      name: "Наращивание ресниц 1D",
      category: "Ресницы",
      basePrice: 10000,
      durationMinutes: 90,
    },
    {
      name: "Наращивание ресниц 2D",
      category: "Ресницы",
      basePrice: 11000,
      durationMinutes: 90,
    },
    {
      name: "Наращивание ресниц 3D",
      category: "Ресницы",
      basePrice: 12000,
      durationMinutes: 90,
    },
    {
      name: "Mega Volume",
      category: "Ресницы",
      basePrice: 15000,
      durationMinutes: 90,
    },
    {
      name: "Нижние ресницы",
      category: "Ресницы",
      basePrice: 4000,
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
      name: "Ламинирование бровей + коррекция + уход",
      category: "Брови",
      basePrice: 7000,
      durationMinutes: 60,
    },
    {
      name: "Ламинирование бровей с окрашиванием + коррекция + уход",
      category: "Брови",
      basePrice: 9000,
      durationMinutes: 70,
    },
    {
      name: "Усики",
      category: "Брови",
      basePrice: 1500,
      durationMinutes: 20,
    },
    {
      name: "Ламинирование ресниц с окрашиванием + уход",
      category: "Ламинирование",
      basePrice: 8000,
      durationMinutes: 60,
    },
  ]);

  // ДОП. ОПЦИИ
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
  ]);

  // ПОЛЬЗОВАТЕЛИ
  const adminPasswordHash = await bcrypt.hash("1437Жан", 10);
  const masterPasswordHash = await bcrypt.hash("123456", 10);

  await db.insert(users).values([
    {
      name: "Диана",
      phone: "77000000000",
      email: "admin@dracarys.kz",
      passwordHash: adminPasswordHash,
      role: "admin",
      masterId: null,
    },
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

  console.log("Fresh seed completed.");
  console.log("");
  console.log("Admin login:");
  console.log("admin@dracarys.kz");
  console.log("1437Жан");
  console.log("");
  console.log("Master logins:");
  console.log("ayana@dracarys.kz / 123456");
  console.log("aziza@dracarys.kz / 123456");
  console.log("dilnara@dracarys.kz / 123456");
}

resetData().catch((error) => {
  console.error(error);
  process.exit(1);
});