import { PLAYLIST_COVER_PRESETS, type PlaylistCoverPreset } from "./default-playlist-covers";

export type ReflectionStoryCoverPreset = PlaylistCoverPreset & {
  builtinKey: string;
};

// Exactly 40 stable slots reuse the existing AI cover artwork.
export const REFLECTION_STORY_COVER_PRESETS: readonly ReflectionStoryCoverPreset[] = [
  ...PLAYLIST_COVER_PRESETS,
  ...PLAYLIST_COVER_PRESETS.slice(0, 15),
].map((preset, index) => ({
  id: `reflection-story-${String(index + 1).padStart(2, "0")}`,
  label: `Fondo ${index + 1}`,
  source: preset.source,
  builtinKey: preset.id,
}));
