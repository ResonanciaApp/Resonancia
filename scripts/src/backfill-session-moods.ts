import { eq } from "drizzle-orm";
import { catalogSessionsTable, db, pool } from "@workspace/db";

const CALM = ["estresado", "ansioso", "enojado", "adolorido", "en-paz", "presente"];
const UPLIFT = [
  "cansado",
  "desmotivado",
  "deprimido",
  "triste",
  "esperanzado",
  "feliz",
  "contento",
  "emocionado",
];
const CONNECTION = ["solo", "triste", "agradecido", "lleno-de-amor", "esperanzado"];
const GROWTH = ["inepto", "desmotivado", "deprimido", "agradecido", "esperanzado", "presente"];
const ALL_MOOD_IDS = [
  "estresado",
  "ansioso",
  "cansado",
  "inepto",
  "triste",
  "solo",
  "deprimido",
  "desmotivado",
  "enojado",
  "adolorido",
  "agradecido",
  "emocionado",
  "lleno-de-amor",
  "feliz",
  "en-paz",
  "esperanzado",
  "contento",
  "presente",
];
const SLOT_FALLBACKS = [
  { id: "1", label: "meditación" },
  { id: "8", label: "sonoterapia" },
  { id: "24", label: "música" },
  { id: "5", label: "reflexión" },
  { id: "61", label: "historia" },
] as const;

function inferMoodIds(session: typeof catalogSessionsTable.$inferSelect): string[] {
  const moods = new Set<string>();
  const add = (...groups: string[][]) => groups.flat().forEach((id) => moods.add(id));
  const searchable = [
    session.title,
    session.subtitle,
    session.description,
    ...(session.themeTag ?? []),
    session.meditationTag ?? "",
    session.sabiduriaTag ?? "",
    ...(session.descansoTags ?? []),
  ].join(" ").toLocaleLowerCase("es");

  switch (session.categoryId) {
    case "meditaciones-guiadas":
      add(CALM, GROWTH);
      break;
    case "sonidos-ancestrales":
      add(CALM, ["cansado", "emocionado"]);
      break;
    case "musica-sonidos":
      add(UPLIFT, ["estresado", "ansioso", "en-paz", "presente"]);
      break;
    case "ambientales":
      add(CALM, ["cansado"]);
      break;
    case "reflexiones":
      add(GROWTH, CONNECTION, ["enojado"]);
      break;
    case "descanso":
      if (searchable.includes("historia")) add(CONNECTION, ["deprimido", "en-paz", "presente"]);
      else add(["estresado", "ansioso", "cansado", "adolorido", "en-paz"]);
      break;
  }

  if (searchable.includes("ansiedad") || searchable.includes("respir")) add(CALM);
  if (searchable.includes("rabia")) add(["enojado"]);
  if (searchable.includes("famil") || searchable.includes("amor")) add(CONNECTION);
  if (searchable.includes("crecimiento")) add(GROWTH);
  if (
    searchable.includes("mañana") ||
    searchable.includes("energ") ||
    searchable.includes("motiv")
  ) {
    add(UPLIFT);
  }
  if (searchable.includes("foco") || searchable.includes("concentr")) {
    add(["inepto", "presente"]);
  }

  return [...moods];
}

async function main(): Promise<void> {
  const sessions = await db.select().from(catalogSessionsTable);
  let updated = 0;

  for (const session of sessions) {
    if (session.moodIds.length > 0) continue;
    const moodIds = inferMoodIds(session);
    if (moodIds.length === 0) continue;
    await db
      .update(catalogSessionsTable)
      .set({ moodIds, updatedAt: new Date() })
      .where(eq(catalogSessionsTable.id, session.id));
    updated += 1;
  }

  console.log(`✓ ${updated} sesiones recibieron afinidades emocionales iniciales`);

  for (const fallback of SLOT_FALLBACKS) {
    const session = sessions.find((candidate) => candidate.id === fallback.id);
    if (!session) throw new Error(`Falta la sesión base de ${fallback.label}: ${fallback.id}`);
    const moodIds = [...new Set([...session.moodIds, ...inferMoodIds(session), ...ALL_MOOD_IDS])];
    await db
      .update(catalogSessionsTable)
      .set({ moodIds, updatedAt: new Date() })
      .where(eq(catalogSessionsTable.id, session.id));
  }
  console.log("✓ Los cinco tipos tienen cobertura directa para las 18 emociones");
}

main()
  .then(() => pool.end())
  .catch((error) => {
    console.error("No se pudieron poblar las afinidades emocionales:", error);
    pool.end().finally(() => process.exit(1));
  });