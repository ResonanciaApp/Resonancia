// ─── Portadas de las playlists por defecto (usuarios nuevos) ─────────────────
// Imágenes generadas por IA, bundleadas con la app. Se resuelven por ID de
// playlist porque un require() no puede persistirse como URI en AsyncStorage.

export const DEFAULT_PLAYLIST_COVERS: Record<string, number> = {
  default_para_empezar: require("../assets/images/playlists/default-para-empezar.jpg"),
  default_calma_profunda: require("../assets/images/playlists/default-calma-profunda.jpg"),
  default_sueno_reparador: require("../assets/images/playlists/default-sueno-reparador.jpg"),
};

export type PlaylistCoverPreset = {
  id: string;
  label: string;
  source: number;
};

/** Portadas predeterminadas disponibles para playlists creadas por el usuario. */
export const PLAYLIST_COVER_PRESETS: readonly PlaylistCoverPreset[] = [
  { id: "cosmic-nebula", label: "Nebulosa cósmica", source: require("../assets/images/playlists/presets/cosmic-nebula.jpg") },
  { id: "moon-valley", label: "Valle bajo la luna", source: require("../assets/images/playlists/presets/moon-valley.jpg") },
  { id: "earth-orbit", label: "Planeta Tierra", source: require("../assets/images/playlists/presets/earth-orbit.jpg") },
  { id: "galaxy-lake", label: "Lago y galaxia", source: require("../assets/images/playlists/presets/galaxy-lake.jpg") },
  { id: "desert-stars", label: "Desierto estrellado", source: require("../assets/images/playlists/presets/desert-stars.jpg") },
  { id: "mist-forest", label: "Bosque con niebla", source: require("../assets/images/playlists/presets/mist-forest.jpg") },
  { id: "redwood-light", label: "Luz entre árboles", source: require("../assets/images/playlists/presets/redwood-light.jpg") },
  { id: "autumn-river", label: "Río de otoño", source: require("../assets/images/playlists/presets/autumn-river.jpg") },
  { id: "moss-waterfall", label: "Cascada entre musgo", source: require("../assets/images/playlists/presets/moss-waterfall.jpg") },
  { id: "snow-pines", label: "Pinos nevados", source: require("../assets/images/playlists/presets/snow-pines.jpg") },
  { id: "quiet-ocean", label: "Océano sereno", source: require("../assets/images/playlists/presets/quiet-ocean.jpg") },
  { id: "coastal-cliffs", label: "Acantilados del mar", source: require("../assets/images/playlists/presets/coastal-cliffs.jpg") },
  { id: "river-canyon", label: "Río entre cañones", source: require("../assets/images/playlists/presets/river-canyon.jpg") },
  { id: "rain-lagoon", label: "Laguna bajo la lluvia", source: require("../assets/images/playlists/presets/rain-lagoon.jpg") },
  { id: "ice-lagoon", label: "Laguna de hielo", source: require("../assets/images/playlists/presets/ice-lagoon.jpg") },
  { id: "birds-dawn", label: "Aves al amanecer", source: require("../assets/images/playlists/presets/birds-dawn.jpg") },
  { id: "crane-marsh", label: "Grulla en el humedal", source: require("../assets/images/playlists/presets/crane-marsh.jpg") },
  { id: "elephant-savanna", label: "Elefante en la sabana", source: require("../assets/images/playlists/presets/elephant-savanna.jpg") },
  { id: "deer-meadow", label: "Ciervo en el bosque", source: require("../assets/images/playlists/presets/deer-meadow.jpg") },
  { id: "whale-depths", label: "Ballena en el océano", source: require("../assets/images/playlists/presets/whale-depths.jpg") },
  { id: "wild-horses", label: "Caballos en la pradera", source: require("../assets/images/playlists/presets/wild-horses.jpg") },
  { id: "mountain-clouds", label: "Montañas entre nubes", source: require("../assets/images/playlists/presets/mountain-clouds.jpg") },
  { id: "volcanic-island", label: "Isla volcánica", source: require("../assets/images/playlists/presets/volcanic-island.jpg") },
  { id: "lavender-hills", label: "Colinas de lavanda", source: require("../assets/images/playlists/presets/lavender-hills.jpg") },
  { id: "northern-lights", label: "Aurora boreal", source: require("../assets/images/playlists/presets/northern-lights.jpg") },
];

export function getPlaylistCoverPreset(presetId?: string): PlaylistCoverPreset | undefined {
  if (!presetId) return undefined;
  return PLAYLIST_COVER_PRESETS.find((preset) => preset.id === presetId);
}

/** Devuelve la imagen bundleada de una playlist por defecto, o undefined. */
export function getDefaultPlaylistCover(playlistId: string): number | undefined {
  return DEFAULT_PLAYLIST_COVERS[playlistId];
}
