import app from "./app";
import { pool } from "@workspace/db";
import { logger } from "./lib/logger";
import { startAccountDeletionCleanup } from "./lib/accountDeletionCleanup";
import { initializeGrowthSchema } from "./lib/growthSchema";

// PostgreSQL may terminate idle clients during maintenance. Without an error
// listener, pg emits an unhandled event and brings down the entire API server.
pool.on("error", (error) => {
  logger.error({ message: error.message }, "Idle database connection lost; pool will reconnect");
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

initializeGrowthSchema().then(() => app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startAccountDeletionCleanup();
})).catch(error => {
  logger.error({ err: error }, "Tu camino schema initialization failed");
  process.exit(1);
});
