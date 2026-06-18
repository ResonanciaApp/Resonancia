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
  /** Rol principal: "Productor" | "Músico" | "Voz guía" */
  role?: string;
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
  {
    id: "lumen-sonora",
    name: "Lumen Sonora",
    photo: require("@/assets/images/artists/lumen-sonora.png"),
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
    photo: require("@/assets/images/artists/raiz-profunda.png"),
    bio: "Dúo de productores dedicados a la música enteógena y ceremonial. Sus composiciones acompañan procesos de introspección profunda con texturas orgánicas y vibraciones ancestrales.",
    country: "Colombia",
    genre: "Enteógena · Ceremonial",
    links: [{ label: "YouTube", url: "https://youtube.com" }],
    certified: true,
    featured: true,
  },
  {
    id: "luna-cosmica",
    name: "Luna Cósmica",
    photo: require("@/assets/images/artists/luna-cosmica.png"),
    bio: "Artista sonora andina especializada en frecuencias binaurales y cantos curativos. Sus composiciones combinan voces ancestrales con capas electrónicas para inducir estados meditativos profundos.",
    country: "Perú",
    genre: "Binaural · Cantos Ancestrales",
    links: [{ label: "Instagram", url: "https://instagram.com" }],
    certified: true,
    featured: true,
  },
  {
    id: "arbol-sagrado",
    name: "Árbol Sagrado",
    photo: require("@/assets/images/artists/arbol-sagrado.png"),
    bio: "Músico y sanador chamánico colombiano. Integra cuencos de cuarzo, tambores rituales y cantos de tradición indígena en ceremonias sonoras que abren caminos hacia el interior.",
    country: "Colombia",
    genre: "Chamánico · Ceremonial",
    links: [{ label: "YouTube", url: "https://youtube.com" }],
    certified: true,
    featured: true,
  },
  {
    id: "vuelo-del-condor",
    name: "Vuelo del Cóndor",
    photo: require("@/assets/images/artists/vuelo-del-condor.png"),
    bio: "Músico peruano con raíces en la tradición andina. Funde quenas, zampoñas y sikus con capas ambientales modernas para crear viajes sonoros entre la tierra y el cielo.",
    country: "Perú",
    genre: "Andino · Meditativo",
    certified: true,
    featured: true,
  },
  {
    id: "kai-amara",
    name: "Kai Amara",
    photo: require("@/assets/images/artists/kai-amara.png"),
    bio: "Artista de meditación electrónica y terapia de cristales. Diseña paisajes sonoros con síntesis modular, cuencos de cuarzo y frecuencias reparadoras para la activación energética.",
    country: "México",
    genre: "Electrónica Meditativa · Cristales",
    links: [{ label: "Instagram", url: "https://instagram.com" }],
    certified: false,
    featured: true,
  },
  {
    id: "misterio-verde",
    name: "Misterio Verde",
    photo: require("@/assets/images/artists/misterio-verde.png"),
    bio: "Grabadora de sonidos de la naturaleza y compositora ambient. Sus paisajes sonoros traen la selva, el río y el viento directamente a tu meditación, creando espacios de reconexión profunda.",
    country: "México",
    genre: "Sonidos Naturales · Ambient",
    certified: true,
    featured: true,
  },
  {
    id: "pulso-de-tierra",
    name: "Pulso de Tierra",
    photo: require("@/assets/images/artists/pulso-de-tierra.png"),
    bio: "Percusionista y sanador sonoro boliviano. Sus composiciones de percusión ancestral e instrumentos del altiplano conectan con los ritmos primordiales de la tierra y el fuego.",
    country: "Bolivia",
    genre: "Percusión Ancestral · Ritual",
    links: [{ label: "YouTube", url: "https://youtube.com" }],
    certified: true,
    featured: true,
  },
  {
    id: "flor-de-quartz",
    name: "Flor de Quartz",
    photo: require("@/assets/images/artists/flor-de-quartz.png"),
    bio: "Artista ceremonial chilena que trabaja con cuencos de cuarzo y cristales sonoros. Sus baños de sonido crean portales de transformación personal a través de la vibración pura.",
    country: "Chile",
    genre: "Cuarzo · Ceremonial",
    links: [{ label: "Instagram", url: "https://instagram.com" }],
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
