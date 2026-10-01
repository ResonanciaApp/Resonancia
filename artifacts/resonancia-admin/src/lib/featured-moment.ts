export function resolveImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("/objects/")) return `/api/storage${raw}`;
  return raw;
}

export interface CandidateLike {
  id: string;
  title: string;
  categoryId: string;
}

/** Read every page, rather than silently truncating the editorial inventory. */
export async function loadSessionInventory<T extends CandidateLike>(
  loadPage: (params: { page: number; pageSize: number }) => Promise<{ sessions: T[]; total: number }>,
): Promise<T[]> {
  const pageSize = 100;
  const first = await loadPage({ page: 1, pageSize });
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, Math.ceil(first.total / pageSize) - 1) },
      (_, index) => loadPage({ page: index + 2, pageSize })),
  );
  const pages = [first, ...remaining];
  const sessions = pages.flatMap(page => page.sessions);
  if (pages.some(page => page.total !== first.total) || sessions.length !== first.total
    || new Set(sessions.map(session => session.id)).size !== sessions.length) {
    throw new Error("El catálogo cambió mientras se cargaba. Vuelve a intentarlo.");
  }
  return sessions;
}

export function inventoryCategories(
  sessions: (CandidateLike & { categoryLabel: string })[],
  taxonomy: { id: string; label: string }[],
) {
  const labels = new Map(taxonomy.map(category => [category.id, category.label]));
  const counts = new Map<string, number>();
  for (const session of sessions) {
    if (!labels.has(session.categoryId)) labels.set(session.categoryId, session.categoryLabel);
    counts.set(session.categoryId, (counts.get(session.categoryId) ?? 0) + 1);
  }
  // Never confuse preserved legacy records with the active charlas category.
  if (labels.has("reflexiones")) labels.set("reflexiones", "Reflexiones (categoría anterior)");
  return [...labels].map(([id, label]) => ({ id, label, count: counts.get(id) ?? 0 }));
}

export function ineligibleReason(
  session: CandidateLike & { status: string; isPlaceholder: boolean },
  eligibleIds: Set<string>,
): string | null {
  if (eligibleIds.has(session.id)) return null;
  if (session.categoryId === "musica-sonidos") return "Música está excluida de la selección diaria";
  if (session.categoryId === "reflexiones") return "Categoría anterior: requiere revisión editorial";
  if (session.status !== "published") return "Pendiente de publicación";
  if (session.isPlaceholder) return "Próximamente: todavía no es una sesión final";
  return "Falta audio principal reproducible o datos esenciales";
}

export function filterCandidates<T extends CandidateLike>(
  candidates: T[],
  search: string,
  category: string,
): T[] {
  const q = search.trim().toLowerCase();
  return candidates.filter(
    (c) =>
      (category === "all" || c.categoryId === category) &&
      (!q || c.title.toLowerCase().includes(q)),
  );
}

export type DeepLink =
  | { kind: "none" }
  | { kind: "selected"; id: string }
  | { kind: "ineligible" };

export function resolveDeepLink(
  search: string,
  candidates: CandidateLike[],
): DeepLink {
  const id = new URLSearchParams(search).get("sessionId");
  if (!id) return { kind: "none" };
  return candidates.some((c) => c.id === id)
    ? { kind: "selected", id }
    : { kind: "ineligible" };
}

/** Always uses the date the editor last saw, never the client clock. */
export function buildSaveInput(seenDate: string, sessionId: string | null) {
  return { sessionId, date: seenDate };
}

export function isStaleDayError(e: unknown): boolean {
  return (e as { status?: number } | null)?.status === 409;
}
