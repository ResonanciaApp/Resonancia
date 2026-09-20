import { PLAYLIST_COVER_PRESETS, type PlaylistCoverPreset } from "./default-playlist-covers";

export type ReflectionStoryCoverPreset = PlaylistCoverPreset & {
  builtinKey: string;
};

// Exactly 100 stable slots reuse the existing AI cover artwork.
export const REFLECTION_STORY_COVER_PRESETS: readonly ReflectionStoryCoverPreset[] = Array.from(
  { length: 100 },
  (_, index) => PLAYLIST_COVER_PRESETS[index % PLAYLIST_COVER_PRESETS.length],
).map((preset, index) => ({
  id: `reflection-story-${String(index + 1).padStart(2, "0")}`,
  label: `Fondo ${index + 1}`,
  source: preset.source,
  builtinKey: preset.id,
}));
