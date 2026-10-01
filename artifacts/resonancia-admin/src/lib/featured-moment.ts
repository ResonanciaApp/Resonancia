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
