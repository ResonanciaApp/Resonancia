import { and, eq, lte } from "drizzle-orm";
import { accountDeletionsTable, db } from "@workspace/db";
import { logger } from "./logger";
import { ObjectStorageService } from "./objectStorage";

type StorageDeleter = {
  deleteObjectEntity(objectPath: string): Promise<void>;
};

type CleanupLogger = {
  info(data: unknown, message: string): void;
  warn(data: unknown, message: string): void;
  error(data: unknown, message: string): void;
};

const defaultStorage = new ObjectStorageService();
const CLEANUP_INTERVAL_MS = 60_000;

/**
 * Re-delete every persisted path after all previously issued PUT URLs have
 * expired. The row lock + SKIP LOCKED lets multiple API instances cooperate.
 */
export async function sweepExpiredAccountDeletionsOnce({
  storage = defaultStorage,
  log = logger,
}: {
  storage?: StorageDeleter;
  log?: CleanupLogger;
} = {}): Promise<number> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(accountDeletionsTable)
      .where(
        and(
          eq(accountDeletionsTable.status, "awaiting_storage_expiry"),
          lte(accountDeletionsTable.storageCleanupAfter, new Date()),
        ),
      )
      .for("update", { skipLocked: true })
      .limit(20);

    let completed = 0;
    for (const row of rows) {
      const results = await Promise.allSettled(
        row.objectPaths.map((path) => storage.deleteObjectEntity(path)),
      );
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length > 0) {
        log.warn(
          { identityHash: row.identityHash, failures: failed.length },
          "Deferred account object cleanup will retry",
        );
        continue;
      }

      await tx
        .update(accountDeletionsTable)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(accountDeletionsTable.identityHash, row.identityHash));
      completed += 1;
    }
    return completed;
  });
}

export function startAccountDeletionCleanup(): () => void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const completed = await sweepExpiredAccountDeletionsOnce();
      if (completed > 0) {
        logger.info({ completed }, "Deferred account object cleanup completed");
      }
    } catch (error) {
      logger.error({ err: error }, "Deferred account object cleanup failed");
    } finally {
      running = false;
    }
  };

  const initial = setTimeout(() => void run(), 1_000);
  const interval = setInterval(() => void run(), CLEANUP_INTERVAL_MS);
  initial.unref?.();
  interval.unref?.();
  return () => {
    clearTimeout(initial);
    clearInterval(interval);
  };
}