import { eq, inArray } from "drizzle-orm";
import {
  db,
  pool,
  catalogCategoriesTable,
  catalogSessionsTable,
  catalogAudioFilesTable,
} from "@workspace/db";
import {
  SEED_CATEGORIES,
  SEED_SESSIONS,
  SEED_AUDIO_FILES,
} from "@workspace/db/seed";

/**
 * Migración del catálogo bundleado → base de datos (Tarea #20).
 * Idempotente: upsert por id para categorías/sesiones; para los archivos de
 * audio (id serial, sin clave natural) se borran las filas de las sesiones
 * sembradas y se reinsertan. Reejecutar es seguro.
 */
async function main(): Promise<void> {
  for (const c of SEED_CATEGORIES) {
    const { id, ...rest } = c;
    await db
      .insert(catalogCategoriesTable)
      .values(c)
      .onConflictDoUpdate({
        target: catalogCategoriesTable.id,
        set: { ...rest, updatedAt: new Date() },
      });
  }
  console.log(`✓ ${SEED_CATEGORIES.length} categorías`);

  for (const s of SEED_SESSIONS) {
    const { id, ...rest } = s;
    await db
      .insert(catalogSessionsTable)
      .values(s)
      .onConflictDoUpdate({
        target: catalogSessionsTable.id,
        set: { ...rest, updatedAt: new Date() },
      });
  }
  console.log(`✓ ${SEED_SESSIONS.length} sesiones`);

  const sessionIds = [...new Set(SEED_AUDIO_FILES.map((a) => a.sessionId))].filter(
    (id): id is string => typeof id === "string",
  );
  if (sessionIds.length > 0) {
    await db
      .delete(catalogAudioFilesTable)
      .where(inArray(catalogAudioFilesTable.sessionId, sessionIds));
  }
  if (SEED_AUDIO_FILES.length > 0) {
    await db.insert(catalogAudioFilesTable).values(SEED_AUDIO_FILES);
  }
  console.log(`✓ ${SEED_AUDIO_FILES.length} archivos de audio`);

  // Sanity: confirmar conteos publicados.
  const published = await db
    .select({ id: catalogSessionsTable.id })
    .from(catalogSessionsTable)
    .where(eq(catalogSessionsTable.status, "published"));
  console.log(`✓ ${published.length} sesiones publicadas en DB`);
}

main()
  .then(() => pool.end())
  .then(() => {
    console.log("Seed del catálogo completado.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed del catálogo falló:", err);
    pool.end().finally(() => process.exit(1));
  });
