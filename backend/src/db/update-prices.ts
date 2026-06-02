import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { masters, services } from "./schema";

async function updatePrices() {
  console.log("Updating prices to top master price list...");

  await db
    .update(masters)
    .set({
      isTopMaster: true,
    });

  await db
    .update(services)
    .set({
      basePrice: 10000,
      durationMinutes: 90,
    })
    .where(eq(services.name, "Наращивание ресниц 1D"));

  await db
    .update(services)
    .set({
      basePrice: 11000,
      durationMinutes: 90,
    })
    .where(eq(services.name, "Наращивание ресниц 2D"));

  await db
    .update(services)
    .set({
      basePrice: 12000,
      durationMinutes: 90,
    })
    .where(eq(services.name, "Наращивание ресниц 3D"));

  await db
    .update(services)
    .set({
      basePrice: 15000,
      durationMinutes: 90,
    })
    .where(eq(services.name, "Mega Volume"));

  await db
    .update(services)
    .set({
      basePrice: 4000,
      durationMinutes: 40,
    })
    .where(eq(services.name, "Нижние ресницы"));

  console.log("Top master prices updated.");
}

updatePrices().catch((error) => {
  console.error(error);
  process.exit(1);
});