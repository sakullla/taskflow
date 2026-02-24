import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const DEFAULT_SQLITE_URL = "file:./data/todo.db";

function inferDbType(databaseUrl: string): "sqlite" | "postgresql" | "mysql" {
  const normalized = databaseUrl.toLowerCase();
  if (normalized.startsWith("postgresql://") || normalized.startsWith("postgres://")) {
    return "postgresql";
  }
  if (normalized.startsWith("mysql://") || normalized.startsWith("mariadb://")) {
    return "mysql";
  }
  return "sqlite";
}

function createAdapter() {
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_SQLITE_URL;
  const requestedType = process.env.DB_TYPE?.toLowerCase();
  const dbType = requestedType === "postgres" ? "postgresql" : requestedType;
  const resolvedType = (dbType as "sqlite" | "postgresql" | "mysql" | undefined) ?? inferDbType(databaseUrl);

  if (resolvedType === "postgresql") {
    return new PrismaPg({ connectionString: databaseUrl });
  }

  if (resolvedType === "mysql") {
    return new PrismaMariaDb(databaseUrl);
  }

  return new PrismaBetterSqlite3({ url: databaseUrl });
}

export const prisma = new PrismaClient({
  adapter: createAdapter(),
});

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
