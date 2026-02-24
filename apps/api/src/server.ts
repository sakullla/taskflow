import "dotenv/config";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseHealth, prisma } from "./config/db.js";
import { seedDevelopmentDataIfNeeded } from "./config/dev-seed.js";

async function bootstrap() {
  try {
    const isDbHealthy = await checkDatabaseHealth();
    if (!isDbHealthy) {
      console.error("Database connection failed");
      process.exit(1);
    }
    console.log("Database connected");

    await seedDevelopmentDataIfNeeded();

    const app = await createApp();
    await app.listen({
      port: Number.parseInt(env.PORT, 10),
      host: env.HOST,
    });

    console.log(`
Server ready!
  Local:    http://localhost:${env.PORT}
  API Docs: http://localhost:${env.PORT}/docs
`);
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void bootstrap();
