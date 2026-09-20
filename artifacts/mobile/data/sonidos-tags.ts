export type SonidosCollectionTag = string;

export type LegacySonidosTag =
  | "Sonidos Binaurales"
  | "Sonidos Naturaleza"
  | "Sonidos Atmosféricos"
  | "Sonidos Hipnóticos"
  | "Frecuencias Astrales";

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

const CANONICAL_SONIDOS_TAGS = new Set<string>(CANONICAL_SONIDOS_ORDER);

const LEGACY_SONIDOS_TAG_MAP: Record<LegacySonidosTag, SonidosCollectionTag[]> = {
  "Sonidos Binaurales": ["Todos los sonidos", "Sonidos binaurales"],
  "Sonidos Naturaleza": ["Todos los sonidos", "Sonidos de naturaleza"],
  "Sonidos Atmosféricos": ["Todos los sonidos"],
  "Sonidos Hipnóticos": ["Todos los sonidos"],
  "Frecuencias Astrales": ["Todos los sonidos", "Frecuencias Astrales"],
};

export function normalizeSonidosTags(
  tags: readonly string[] | null | undefined,
  legacySonidosTag?: string | null,
): SonidosCollectionTag[] {
  const result = new Set<SonidosCollectionTag>();
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      const normalized = tag.trim();
      if (normalized) result.add(normalized);
    }
  }
  if (result.size === 0 && legacySonidosTag && legacySonidosTag in LEGACY_SONIDOS_TAG_MAP) {
    for (const tag of LEGACY_SONIDOS_TAG_MAP[legacySonidosTag as LegacySonidosTag]) {
      result.add(tag);
    }
  }
  if (result.size > 0) result.add("Todos los sonidos");
  return [
    ...CANONICAL_SONIDOS_ORDER.filter((tag) => result.has(tag)),
    ...[...result]
      .filter((tag) => !CANONICAL_SONIDOS_TAGS.has(tag))
      .sort((a, b) => a.localeCompare(b, "es")),
  ];
}