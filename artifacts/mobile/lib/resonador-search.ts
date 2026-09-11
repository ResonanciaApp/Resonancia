import type { Resonador } from "@/data/resonadores";

export type ResonadorModalityFilter = "online" | "presencial";

export type ResonadorSearchFilters = {
  query?: string;
  role?: string | null;
  country?: string | null;
  modality?: ResonadorModalityFilter | null;
};

export function normalizeResonadorSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterResonadores(
  resonadores: Resonador[],
  filters: ResonadorSearchFilters,
): Resonador[] {
  const terms = normalizeResonadorSearch(filters.query?.trim() ?? "")
    .split(/\s+/)
    .filter(Boolean);

  return resonadores.filter((item) => {
    if (filters.role && item.subtipo !== filters.role) return false;
    if (filters.country && item.country !== filters.country) return false;
    if (
      filters.modality &&
      item.bookingModality !== filters.modality &&
      item.bookingModality !== "ambas"
    ) {
      return false;
    }
    if (terms.length === 0) return true;

    const searchableText = normalizeResonadorSearch(
      [
        item.name,
        item.subtipo,
        item.city,
        item.country,
        item.bio,
        item.servicesDescription ?? "",
        ...item.specialty,
        ...item.genres,
      ].join(" "),
    );
    return terms.every((term) => searchableText.includes(term));
  });
}