import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// DATABASE_URL is the standard name we use locally (.env). On Vercel the
// Nile/Postgres marketplace integration instead injects POSTGRES_URL /
// NILEDB_POSTGRES_URL, so fall back to those if DATABASE_URL is unset.
const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NILEDB_POSTGRES_URL;

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
