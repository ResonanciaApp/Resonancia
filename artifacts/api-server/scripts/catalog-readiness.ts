import { asc, eq, inArray } from "drizzle-orm";
import {
  catalogAudioFilesTable,
  catalogSessionsTable,
  db,
} from "@workspace/db";
import { getCatalogReadiness } from "../src/lib/catalogReadiness";

async function main() {
  const sessions = await db
    .select()
    .from(catalogSessionsTable)
    .where(eq(catalogSessionsTable.status, "published"))
    .orderBy(asc(catalogSessionsTable.id));
  const ids = sessions.map((session) => session.id);
  const audioFiles =
    ids.length > 0
      ? await db
          .select()
          .from(catalogAudioFilesTable)
          .where(inArray(catalogAudioFilesTable.sessionId, ids))
      : [];
  const audioBySession = new Map<string, typeof audioFiles>();
  for (const audio of audioFiles) {
    if (!audio.sessionId) continue;
    const items = audioBySession.get(audio.sessionId) ?? [];
    items.push(audio);
    audioBySession.set(audio.sessionId, items);
  }

  const placeholders: string[] = [];
  const invalid: Array<{ id: string; title: string; reason: string }> = [];
  for (const session of sessions) {
    const result = getCatalogReadiness(
      session,
      audioBySession.get(session.id) ?? [],
    );
    if (!result.ready) {
      invalid.push({ id: session.id, title: session.title, reason: result.reason });
    } else if (result.kind === "placeholder") {
      placeholders.push(`${session.id} — ${session.title}`);
    }
  }

  if (placeholders.length) {
    console.info(`Placeholders permitidos (${placeholders.length}):`);
    for (const placeholder of placeholders) console.info(`  • ${placeholder}`);
  }
  if (invalid.length) {
    console.error(`Contenido final inválido (${invalid.length}):`);
    for (const item of invalid) {
      console.error(`  • ${item.id} — ${item.title}: ${item.reason}`);
    }
    process.exitCode = 1;
  } else {
    console.info(
      `Catálogo listo para distribución: ${sessions.length} sesiones publicadas, ${placeholders.length} placeholder(s) permitido(s).`,
    );
  }
}

main()
  .catch((error) => {
    console.error("No se pudo validar el catálogo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });