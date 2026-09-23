export type ThemeableVideo = {
  theme?: string | null;
};

export type VideoFilter = {
  id: string;
  label: string;
};

export const ALL_VIDEOS_FILTER_ID = "all";
export const ALL_VIDEOS_FILTER_LABEL = "Todos";

function normalizedTheme(theme: string | null | undefined): string {
  return (
    theme
      ?.trim()
      .normalize("NFC")
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("es") ?? ""
  );
}

export function getVideoFilterChips(
  videos: readonly ThemeableVideo[],
): VideoFilter[] {
  const labels = new Map<string, string>();

  for (const video of videos) {
    const label = video.theme?.trim().normalize("NFC").replace(/\s+/g, " ");
    if (!label) continue;
    const key = normalizedTheme(label);
    if (key === normalizedTheme(ALL_VIDEOS_FILTER_LABEL)) continue;
    if (!labels.has(key)) labels.set(key, label);
  }

  return [
    { id: ALL_VIDEOS_FILTER_ID, label: ALL_VIDEOS_FILTER_LABEL },
    ...Array.from(labels, ([key, label]) => ({
      id: `theme:${key}`,
      label,
    })),
  ];
}

export function matchesVideoFilter(
  video: ThemeableVideo,
  activeFilterId: string,
): boolean {
  if (activeFilterId === ALL_VIDEOS_FILTER_ID) return true;
  if (!activeFilterId.startsWith("theme:")) return false;
  return normalizedTheme(video.theme) === activeFilterId.slice("theme:".length);
}