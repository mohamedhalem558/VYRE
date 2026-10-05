import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function run() {
  const users = await p.user.findMany({
    where: { role: { in: ["ADMIN", "INVENTORY_MANAGER"] } },
    select: { email: true, role: true, active: true },
  });
  console.log("Admin/Inventory accounts in DB:", JSON.stringify(users, null, 2));
  await p.$disconnect();
}

run().catch(console.error);
