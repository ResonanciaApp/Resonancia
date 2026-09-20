import { createHash } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import {
  catalogSessionsTable,
  db,
  soundCarouselOrderTable,
  type SoundCarouselOrder,
} from "@workspace/db";

export type SoundCarouselOrderItem = Pick<SoundCarouselOrder, "key" | "label" | "visible" | "sortOrder">;
export type SoundCarouselSource = { key: string; label: string };
export type SoundCarouselProjection = { carousels: SoundCarouselOrderItem[]; revision: string };

const LEGACY_SONIDOS_TAG_MAP: Record<string, string[]> = {
  "Sonidos Binaurales": ["Todos los sonidos", "Sonidos binaurales"],
  "Sonidos Naturaleza": ["Todos los sonidos", "Sonidos de naturaleza"],
  "Sonidos Atmosféricos": ["Todos los sonidos"],
  "Sonidos Hipnóticos": ["Todos los sonidos"],
  "Frecuencias Astrales": ["Todos los sonidos", "Frecuencias Astrales"],
};

const CANONICAL_SONIDOS_ORDER = [
  "Todos los sonidos",
  "Sonidos de naturaleza",
  "Sonidos binaurales",
  "Frecuencias Astrales",
  "Música de enfoque",
  "Cantos medicinales",
  "Sonidos de lluvia",
  "Sonidos para Chakras",
] as const;

const canonicalPosition = new Map<string, number>(
  CANONICAL_SONIDOS_ORDER.map((label, index) => [label, index]),
);

export function collectSoundCarouselSources(
  sessions: Array<{ sonidosTags: string[]; sonidosTag: string | null }>,
): SoundCarouselSource[] {
  const labels = new Set<string>();
  for (const session of sessions) {
    const tags = session.sonidosTags.length > 0
      ? session.sonidosTags
      : (session.sonidosTag ? LEGACY_SONIDOS_TAG_MAP[session.sonidosTag] ?? [] : []);
    for (const value of tags) {
      const label = value.trim();
      if (label) labels.add(label);
    }
  }
  return [...labels]
    .sort((a, b) => {
      const aPosition = canonicalPosition.get(a);
      const bPosition = canonicalPosition.get(b);
      if (aPosition !== undefined || bPosition !== undefined) {
        return (aPosition ?? Number.MAX_SAFE_INTEGER) - (bPosition ?? Number.MAX_SAFE_INTEGER);
      }
      return a.localeCompare(b, "es");
    })
    .map((label) => ({ key: `collection:${label}`, label }));
}

export function projectSoundCarouselOrder(
  persisted: SoundCarouselOrder[],
  activeCarousels: SoundCarouselSource[],
): SoundCarouselProjection {
  const currentKeys = new Set(activeCarousels.map((item) => item.key));
  const saved = new Map(persisted.map((item) => [item.key, item]));
  let nextOrder = persisted.filter((item) => currentKeys.has(item.key))
    .reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
  const carousels = activeCarousels.map((item) => {
    const old = saved.get(item.key);
    return {
      key: item.key,
      label: item.label,
      visible: old?.visible ?? true,
      sortOrder: old?.sortOrder ?? nextOrder++,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
  return { carousels, revision: soundCarouselRevision(persisted, activeCarousels) };
}

export function soundCarouselRevision(
  persisted: SoundCarouselOrder[],
  activeCarousels: SoundCarouselSource[],
): string {
  return createHash("sha256").update(JSON.stringify({
    persisted: [...persisted]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, label, visible, sortOrder }) => ({ key, label, visible, sortOrder })),
    active: [...activeCarousels].sort((a, b) => a.key.localeCompare(b.key)),
  })).digest("hex").slice(0, 16);
}

async function loadSources(queryDb: typeof db): Promise<SoundCarouselSource[]> {
  const sessions = await queryDb.select({
    sonidosTags: catalogSessionsTable.sonidosTags,
    sonidosTag: catalogSessionsTable.sonidosTag,
  }).from(catalogSessionsTable)
    .where(eq(catalogSessionsTable.status, "published"))
    .orderBy(asc(catalogSessionsTable.id));
  return collectSoundCarouselSources(sessions);
}

export async function getSoundCarouselProjection(): Promise<SoundCarouselProjection> {
  const [sources, persisted] = await Promise.all([
    loadSources(db),
    db.select().from(soundCarouselOrderTable),
  ]);
  return projectSoundCarouselOrder(persisted, sources);
}

export async function updateSoundCarouselOrder(
  revision: string,
  items: Array<{ key: string; visible: boolean }>,
): Promise<{ status: "ok"; projection: SoundCarouselProjection } | { status: "stale" }> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('sound-carousel-order', 0))`);
    await tx.execute(sql`LOCK TABLE catalog_sessions IN SHARE ROW EXCLUSIVE MODE`);
    const sessions = await tx.select({
      sonidosTags: catalogSessionsTable.sonidosTags,
      sonidosTag: catalogSessionsTable.sonidosTag,
    }).from(catalogSessionsTable)
      .where(eq(catalogSessionsTable.status, "published"))
      .orderBy(asc(catalogSessionsTable.id));
    const sources = collectSoundCarouselSources(sessions);
    const persisted = await tx.select().from(soundCarouselOrderTable);
    const projection = projectSoundCarouselOrder(persisted, sources);
    if (projection.revision !== revision) return { status: "stale" };
    const expected = projection.carousels.map((item) => item.key);
    const submitted = items.map((item) => item.key);
    if (submitted.length !== expected.length || new Set(submitted).size !== submitted.length ||
        submitted.some((key) => !expected.includes(key))) {
      throw new Error("invalid_keys");
    }
    for (const [sortOrder, item] of items.entries()) {
      const current = projection.carousels.find((candidate) => candidate.key === item.key)!;
      await tx.insert(soundCarouselOrderTable).values({
        key: item.key,
        label: current.label,
        visible: item.visible,
        sortOrder,
      }).onConflictDoUpdate({
        target: soundCarouselOrderTable.key,
        set: { label: current.label, visible: item.visible, sortOrder, updatedAt: new Date() },
      });
    }
    const activeKeys = new Set(items.map((item) => item.key));
    const dormant = persisted
      .filter((row) => !activeKeys.has(row.key))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
    for (const [index, row] of dormant.entries()) {
      await tx.update(soundCarouselOrderTable)
        .set({ sortOrder: items.length + index, updatedAt: new Date() })
        .where(eq(soundCarouselOrderTable.key, row.key));
    }
    const finalRows = await tx.select().from(soundCarouselOrderTable);
    return { status: "ok", projection: projectSoundCarouselOrder(finalRows, sources) };
  });
}