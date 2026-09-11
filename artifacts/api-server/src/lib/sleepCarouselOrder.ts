import { createHash } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import {
  db,
  catalogPlaylistCarouselsTable,
  sleepCarouselOrderTable,
  type SleepCarouselOrder,
} from "@workspace/db";
import { loadPlaylistCarousels } from "./playlistCarousels";

export const DEFAULT_SLEEP_SESSION_CAROUSELS = [
  ["musica-para-dormir", "Música para dormir"],
  ["meditaciones-para-dormir", "Meditaciones para dormir"],
  ["historias-para-dormir", "Historias para dormir"],
  ["sonidos-para-dormir", "Sonidos para dormir"],
  ["paisajes-sonoros", "Paisajes sonoros"],
  ["para-ninos", "Para niños"],
  ["sonidos-de-lluvia", "Sonidos de lluvia"],
  ["ruido", "Ruido"],
] as const;

export type SleepCarouselOrderItem = Pick<SleepCarouselOrder, "key" | "type" | "label" | "visible" | "sortOrder">;
export type SleepCarouselSource = { id: number; title: string };
export type SleepCarouselProjection = { carousels: SleepCarouselOrderItem[]; revision: string };

/** Pure projection: persisted dormant rows are retained but only active keys are projected. */
export function projectSleepCarouselOrder(
  persisted: SleepCarouselOrder[],
  activeCarousels: SleepCarouselSource[],
): SleepCarouselProjection {
  const current = [
    ...DEFAULT_SLEEP_SESSION_CAROUSELS.map(([key, label]) => ({ key: `session:${key}`, type: "session" as const, label })),
    ...activeCarousels.map((carousel) => ({ key: `playlist:${carousel.id}`, type: "playlist" as const, label: carousel.title })),
  ];
  const currentKeys = new Set(current.map((item) => item.key));
  const saved = new Map(persisted.map((item) => [item.key, item]));
  let nextOrder = persisted.filter((item) => currentKeys.has(item.key))
    .reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
  const carousels = current.map((item) => {
    const old = saved.get(item.key);
    return {
      key: item.key, type: item.type, label: item.label,
      visible: old?.visible ?? true, sortOrder: old?.sortOrder ?? nextOrder++,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
  return { carousels, revision: sleepCarouselRevision(persisted, activeCarousels) };
}

export function sleepCarouselRevision(
  persisted: SleepCarouselOrder[],
  activeCarousels: SleepCarouselSource[],
): string {
  return createHash("sha256").update(JSON.stringify({
    persisted: [...persisted]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, type, label, visible, sortOrder }) => ({ key, type, label, visible, sortOrder })),
    active: [...activeCarousels].sort((a, b) => a.id - b.id),
  })).digest("hex").slice(0, 16);
}

async function readProjection(
  queryDb: typeof db,
  publicOnly = false,
): Promise<SleepCarouselProjection> {
  const [sources, persisted, resolved] = await Promise.all([
    queryDb.select({ id: catalogPlaylistCarouselsTable.id, title: catalogPlaylistCarouselsTable.title })
      .from(catalogPlaylistCarouselsTable)
      .where(and(eq(catalogPlaylistCarouselsTable.surface, "sleep"), eq(catalogPlaylistCarouselsTable.isActive, true)))
      .orderBy(asc(catalogPlaylistCarouselsTable.id)),
    queryDb.select().from(sleepCarouselOrderTable),
    publicOnly ? loadPlaylistCarousels(true) : Promise.resolve([]),
  ]);
  const active = publicOnly ? sources.filter((source) => resolved.some((item) => item.id === source.id)) : sources;
  return projectSleepCarouselOrder(persisted, active);
}

export async function getSleepCarouselProjection(publicOnly = false): Promise<SleepCarouselProjection> {
  return readProjection(db, publicOnly);
}

export async function updateSleepCarouselOrder(
  revision: string,
  items: Array<{ key: string; visible: boolean }>,
): Promise<{ status: "ok"; projection: SleepCarouselProjection } | { status: "stale" }> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('sleep-carousel-order', 0))`);
    await tx.execute(sql`LOCK TABLE catalog_playlist_carousels IN SHARE ROW EXCLUSIVE MODE`);
    const [sources, persisted] = await Promise.all([
      tx.select({ id: catalogPlaylistCarouselsTable.id, title: catalogPlaylistCarouselsTable.title })
        .from(catalogPlaylistCarouselsTable)
        .where(and(eq(catalogPlaylistCarouselsTable.surface, "sleep"), eq(catalogPlaylistCarouselsTable.isActive, true)))
        .orderBy(asc(catalogPlaylistCarouselsTable.id)),
      tx.select().from(sleepCarouselOrderTable),
    ]);
    const projection = projectSleepCarouselOrder(persisted, sources);
    if (projection.revision !== revision) return { status: "stale" };
    const expected = projection.carousels.map((item) => item.key);
    const submitted = items.map((item) => item.key);
    if (submitted.length !== expected.length || new Set(submitted).size !== submitted.length ||
        submitted.some((key) => !expected.includes(key))) {
      throw new Error("invalid_keys");
    }
    for (const [sortOrder, item] of items.entries()) {
      await tx.insert(sleepCarouselOrderTable).values({
        key: item.key,
        type: projection.carousels.find((current) => current.key === item.key)!.type,
        label: projection.carousels.find((current) => current.key === item.key)!.label,
        visible: item.visible,
        sortOrder,
      }).onConflictDoUpdate({
        target: sleepCarouselOrderTable.key,
        set: { visible: item.visible, sortOrder, updatedAt: new Date() },
      });
    }
    const finalRows = await tx.select().from(sleepCarouselOrderTable);
    return { status: "ok", projection: projectSleepCarouselOrder(finalRows, sources) };
  });
}