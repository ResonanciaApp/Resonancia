import { SESSIONS, type Session } from "./sessions";

export type ArtistLink = {
  /** Etiqueta visible, ej: "Instagram", "Spotify", "YouTube" */
  label: string;
  /** URL completa (con https://) */
  url: string;
};

export type Artist = {
  id: string;
  name: string;
  photo: import("react-native").ImageSourcePropType;
  /** Bio / descripción del artista */
  bio: string;
  country: string;
  /** Género o estilo musical, ej: "Ambient · Frecuencias" */
  genre: string;
  /** Redes sociales / links (opcional) */
  links?: ArtistLink[];
  /** Sello certificado por Resonancia (true por defecto en artistas reales) */
  certified?: boolean;
  /** Mostrar en el carrusel "Artistas" de Biblioteca. El artista de la casa va en false. */
  featured?: boolean;
};

/** Artista por defecto (la app) cuando una sesión no indica artistId. */
export const DEFAULT_ARTIST_ID = "resonancia";

export const ARTISTS: Artist[] = [
  {
    id: "resonancia",
    name: "Resonancia",
    photo: require("@/assets/images/logo-resonancia-gold.png"),
    bio: "El sello de la casa. Composiciones y paisajes sonoros creados por el equipo de Resonancia para acompañar tu meditación, tu descanso y tu día.",
    country: "Latinoamérica",
    genre: "Ambient · Frecuencias · Cuencos",
    certified: true,
    featured: false,
  },
  // ── Artistas de ejemplo (reemplazar con artistas reales) ──
  {
    id: "lumen-sonora",
    name: "Lumen Sonora",
    photo: require("@/assets/images/meditation-person.png"),
    bio: "Productora de música ambient y paisajes sonoros meditativos. Su trabajo entreteje sintetizadores cálidos con instrumentos acústicos para crear atmósferas que invitan a la quietud.",
    country: "México",
    genre: "Ambient · Meditativa",
    links: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "Spotify", url: "https://spotify.com" },
    ],
    certified: true,
    featured: true,
  },
  {
    id: "raiz-profunda",
    name: "Raíz Profunda",
    photo: require("@/assets/images/crystal-bowls.png"),
    bio: "Dúo de productores dedicados a la música enteógena y ceremonial. Sus composiciones acompañan procesos de introspección profunda con texturas orgánicas y vibraciones ancestrales.",
    country: "Colombia",
    genre: "Enteógena · Ceremonial",
    links: [{ label: "YouTube", url: "https://youtube.com" }],
    certified: true,
    featured: true,
  },
];

/** Resuelve el artista de una sesión; si no hay artistId (o es inválido), devuelve el artista de la casa. Para créditos/player. */
export function getArtist(id?: string): Artist {
  const fallback = ARTISTS.find((a) => a.id === DEFAULT_ARTIST_ID)!;
  if (!id) return fallback;
  return ARTISTS.find((a) => a.id === id) ?? fallback;
}

/** Busca un artista por id SIN fallback (para la pantalla de perfil: id inválido → undefined). */
export function getArtistById(id?: string): Artist | undefined {
  if (!id) return undefined;
  return ARTISTS.find((a) => a.id === id);
}

/** Solo las subcategorías que pueden tener artista. */
const ARTIST_SOUND_TAGS = ["Música Ambient", "Música Enteógena"];

/**
 * Sesiones atribuidas a un artista. Solo Música Ambient/Enteógena;
 * las que no declaran artistId pertenecen a Resonancia (la casa).
 */
export function getArtistSessions(artistId: string): Session[] {
  return SESSIONS.filter(
    (s) =>
      s.categoryId === "musica-sonidos" &&
      !!s.soundTag &&
      ARTIST_SOUND_TAGS.includes(s.soundTag) &&
      (s.artistId ?? DEFAULT_ARTIST_ID) === artistId
  );
}

/** Cantidad de pistas que un artista tiene en la app. */
export function getArtistTrackCount(artistId: string): number {
  return getArtistSessions(artistId).length;
}

/** Artistas que se muestran en el carrusel de Biblioteca. */
export function getFeaturedArtists(): Artist[] {
  return ARTISTS.filter((a) => a.featured);
}
