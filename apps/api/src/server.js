import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { verifyDatabaseConnection } from "./database/mysql.js";
import { verifyRedisConnection } from "./database/redis.js";

const app = createApp();

async function startServer() {
  await verifyDatabaseConnection();

  if (env.session.store === "redis") {
    await verifyRedisConnection();
  }

  app.listen(env.port, () => {
    console.log(`travel-master-api listening on http://localhost:${env.port}`);
    console.log(`session store: ${env.session.store}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start API server:", error.message);
  process.exit(1);
});
