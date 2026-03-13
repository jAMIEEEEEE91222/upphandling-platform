import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"]!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hash("Test1234!", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@test.se" },
    update: {},
    create: {
      name: "Test Upphandlare",
      email: "admin@test.se",
      passwordHash,
    },
  });

  console.log(`Seed klar. Skapad användare: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("Seed misslyckades:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
