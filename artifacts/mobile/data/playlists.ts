export type Playlist = {
  id: string;
  title: string;
  description: string;
  cover: ReturnType<typeof require>;
  /** URL de portada remota (admin-uploaded). Si está presente, tiene prioridad sobre `cover`. */
  coverUrl?: string | null;
  savedCount: number;
  durationLabel: string;
  sessionIds: string[];
  playlistType?: "sessions" | "music";
};

export const PLAYLISTS: Playlist[] = [
  {
    id: "para-la-ansiedad",
    title: "Para la ansiedad",
    description: "Sonidos que calman la mente y liberan la tensión acumulada. Cuencos tibetanos, ondas binaurales y música que invita al cuerpo a soltar.",
    cover: require("../assets/images/sessions/session-8-musica-dark.jpg"),
    savedCount: 2840,
    durationLabel: "3 h 15 m",
    sessionIds: ["2", "8", "9", "10"],
  },
  {
    id: "sueno-profundo",
    title: "Sueño profundo",
    description: "Frecuencias delta y sonidos nocturnos para acompañar el descanso y entrar en un sueño reparador.",
    cover: require("../assets/images/sessions/session-20-musica-dark.jpg"),
    savedCount: 5120,
    durationLabel: "5 h 40 m",
    sessionIds: ["8", "24", "20", "21"],
  },
  {
    id: "musica-ambient",
    title: "Música Ambient",
    description: "Paisajes sonoros y música meditativa para fluir, crear o simplemente estar presente.",
    cover: require("../assets/images/sessions/session-5-musica-dark.jpg"),
    savedCount: 1670,
    durationLabel: "2 h 50 m",
    sessionIds: ["25", "26", "23"],
  },
  {
    id: "meditaciones-guiadas",
    title: "Meditaciones guiadas",
    description: "Viajes interiores guiados por el sonido y la voz. Perfectos para empezar o profundizar tu práctica.",
    cover: require("../assets/images/sessions/med-visualizaciones.jpg"),
    savedCount: 3390,
    durationLabel: "1 h 45 m",
    sessionIds: ["1", "5", "7"],
  },
];

export function getPlaylistById(id: string): Playlist | undefined {
  return PLAYLISTS.find((p) => p.id === id);
}

// ── Snapshot remoto ────────────────────────────────────────────────────────

export type PlaylistSnapshot = {
  id: number;
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  durationLabel: string;
  savedCount: number;
  sessionIds: string[];
  playlistType: string;
  sortOrder: number;
  isActive: boolean;
};

/** Fallback cover para playlists sin imagen bundleada y sin coverUrl remota. */
const FALLBACK_COVER = require("../assets/images/sessions/session-2.png");

/**
 * Hidrata PLAYLISTS in-place con los datos del servidor.
 * - Entradas existentes (por slug): actualiza campos editables, conserva el
 *   cover bundleado si el servidor no envía coverUrl.
 * - Entradas nuevas (solo en DB): inserta al final con cover de fallback.
 * - Las entradas bundleadas que ya no estén activas en el servidor quedan tal
 *   cual (no se eliminan) para evitar romper referencias en código legacy.
 */
export function applyPlaylistsSnapshot(snapshots: PlaylistSnapshot[]): void {
  const active = snapshots.filter((s) => s.isActive);
  const bySlug = new Map(active.map((s) => [s.slug, s]));

  for (const p of PLAYLISTS) {
    const snap = bySlug.get(p.id);
    if (!snap) continue;
    p.title = snap.title;
    p.description = snap.description;
    p.durationLabel = snap.durationLabel;
    p.savedCount = snap.savedCount;
    p.sessionIds = snap.sessionIds;
    p.playlistType = snap.playlistType as "sessions" | "music";
    if (snap.coverUrl) p.coverUrl = snap.coverUrl;
  }

  const existingSlugs = new Set(PLAYLISTS.map((p) => p.id));
  for (const snap of active) {
    if (existingSlugs.has(snap.slug)) continue;
    PLAYLISTS.push({
      id: snap.slug,
      title: snap.title,
      description: snap.description,
      cover: FALLBACK_COVER,
      coverUrl: snap.coverUrl ?? null,
      durationLabel: snap.durationLabel,
      savedCount: snap.savedCount,
      sessionIds: snap.sessionIds,
      playlistType: snap.playlistType as "sessions" | "music",
    });
  }
}
