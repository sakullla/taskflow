import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");

function inferDbType(databaseUrl) {
  const normalized = (databaseUrl ?? "").toLowerCase();
  if (normalized.startsWith("postgresql://") || normalized.startsWith("postgres://")) {
    return "postgresql";
  }
  if (normalized.startsWith("mysql://") || normalized.startsWith("mariadb://")) {
    return "mysql";
  }
  return "sqlite";
}

function resolveDbProvider() {
  const dbType = process.env.DB_TYPE?.toLowerCase();
  if (dbType === "postgres" || dbType === "pg" || dbType === "postgresql") {
    return "postgresql";
  }
  if (dbType === "mysql" || dbType === "mariadb") {
    return "mysql";
  }
  if (dbType === "sqlite") {
    return "sqlite";
  }
  return inferDbType(process.env.DATABASE_URL);
}

function syncSchemaProvider(targetProvider) {
  const schema = fs.readFileSync(schemaPath, "utf8");
  const datasourceRegex = /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*")([^"]+)(")/m;
  const match = schema.match(datasourceRegex);

  if (!match) {
    throw new Error("Could not find datasource provider in prisma/schema.prisma");
  }

  const currentProvider = match[2];
  if (currentProvider === targetProvider) {
    console.log(`Prisma schema provider already set to ${targetProvider}`);
    return;
  }

  const updated = schema.replace(datasourceRegex, `$1${targetProvider}$3`);
  fs.writeFileSync(schemaPath, updated, "utf8");
  console.log(`Updated Prisma schema provider: ${currentProvider} -> ${targetProvider}`);
}

syncSchemaProvider(resolveDbProvider());
