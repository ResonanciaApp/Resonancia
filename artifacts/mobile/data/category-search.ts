import {
  getCategoryEditorialTags,
  getCategorySessionTags,
} from "@/data/category-tabs";
import type { Session } from "@/data/sessions";

function termKey(term: string) {
  return term
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getCategoryPopularSearchTerms(
  sessions: Session[],
  categoryId: string,
  preferredTerms: string[] = [],
): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  const candidates = [
    ...preferredTerms,
    ...sessions.flatMap((session) => getCategorySessionTags(session, categoryId)),
    ...sessions.flatMap((session) => getCategoryEditorialTags(session, categoryId)),
    ...sessions.map((session) => session.title),
  ];

  for (const candidate of candidates) {
    const term = candidate.trim();
    const key = termKey(term);
    if (!term || seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
    if (terms.length === 3) break;
  }

  return terms;
}