import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DATABASE_URL is the standard name we use locally (.env). On Vercel the
    // Nile/Postgres marketplace integration instead injects POSTGRES_URL /
    // NILEDB_POSTGRES_URL, so fall back to those if DATABASE_URL is unset.
    url:
      process.env["DATABASE_URL"] ||
      process.env["POSTGRES_URL"] ||
      process.env["NILEDB_POSTGRES_URL"],
  },
});
