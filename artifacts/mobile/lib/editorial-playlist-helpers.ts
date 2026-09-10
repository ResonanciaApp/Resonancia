export type EditorialDetailDisposition = "missing" | "transient";

/** 404/410 son decisiones editoriales definitivas, no fallos de red. */
export function classifyEditorialDetailStatus(status: number): EditorialDetailDisposition {
  return status === 404 || status === 410 ? "missing" : "transient";
}

/** Lee solo snapshots cacheados con una identidad estable y descarta corrupción. */
export function parseEditorialPlaylistCache<T extends { slug?: unknown }>(
  raw: string | null,
): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as T;
    return typeof parsed?.slug === "string" && parsed.slug.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Construye una cola nueva. El modo se pasa explícitamente para que una cola
 * normal nunca herede el shuffle de la cola anterior.
 */
export function buildEditorialQueue(
  ids: string[],
  currentId: string,
  shuffle: boolean,
  random: () => number = Math.random,
): string[] {
  const uniqueIds = Array.from(new Set(ids));
  const first = uniqueIds.includes(currentId) ? currentId : uniqueIds[0];
  if (!first || !shuffle) return uniqueIds;

  const rest = uniqueIds.filter((id) => id !== first);
  for (let index = rest.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [rest[index], rest[swapIndex]] = [rest[swapIndex], rest[index]];
  }
  return [first, ...rest];
}

/** Selecciona el primer elemento de una cola aleatoria antes de barajar el resto. */
export function pickRandomQueueStart<T>(
  items: T[],
  random: () => number = Math.random,
): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}