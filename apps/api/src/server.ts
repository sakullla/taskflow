import 'dotenv/config';
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseHealth } from "./config/db.js";

async function bootstrap() {
  try {
    // Check database connection
    const isDbHealthy = await checkDatabaseHealth();
    if (!isDbHealthy) {
      console.error("❌ Database connection failed");
      process.exit(1);
    }
    console.log("✅ Database connected");

    // Create app
    const app = await createApp();

    // Start server
    await app.listen({
      port: parseInt(env.PORT),
      host: env.HOST,
    });

    console.log(`
🚀 Server ready!
   Local:   http://localhost:${env.PORT}
   API Docs: http://localhost:${env.PORT}/docs
    `);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
