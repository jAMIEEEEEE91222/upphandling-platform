import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI behöver läsa DATABASE_URL – Next.js .env.local laddas bara av Next.js
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
