// DATABASE_URL is the standard name we use locally (.env). On Vercel the
// Nile/Postgres marketplace integration instead injects POSTGRES_URL /
// NILEDB_POSTGRES_URL pointing at a shared database whose "public" schema
// already holds Nile's own tenant-management tables. Prisma's schema sync
// (db push) reconciles the whole target schema, which would try to drop
// those unrelated tables — so route our own tables into a separate schema
// instead of "public" whenever we're using the managed connection string.
export function resolveDatabaseUrl(): string | undefined {
  const direct = process.env.DATABASE_URL;
  if (direct) return direct;

  const managed = process.env.POSTGRES_URL || process.env.NILEDB_POSTGRES_URL;
  if (!managed) return undefined;

  const url = new URL(managed);
  if (!url.searchParams.has("schema")) url.searchParams.set("schema", "giacasa_app");
  return url.toString();
}
