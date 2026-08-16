// ─── Portadas de las playlists por defecto (usuarios nuevos) ─────────────────
// Imágenes generadas por IA, bundleadas con la app. Se resuelven por ID de
// playlist porque un require() no puede persistirse como URI en AsyncStorage.

export const DEFAULT_PLAYLIST_COVERS: Record<string, number> = {
  default_para_empezar: require("../assets/images/playlists/default-para-empezar.jpg"),
  default_calma_profunda: require("../assets/images/playlists/default-calma-profunda.jpg"),
  default_sueno_reparador: require("../assets/images/playlists/default-sueno-reparador.jpg"),
};

/** Devuelve la imagen bundleada de una playlist por defecto, o undefined. */
export function getDefaultPlaylistCover(playlistId: string): number | undefined {
  return DEFAULT_PLAYLIST_COVERS[playlistId];
}
