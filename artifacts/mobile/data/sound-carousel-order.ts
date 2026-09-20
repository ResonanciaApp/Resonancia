import type { SoundCarouselOrderItem } from "@/lib/editorial-playlist-helpers";

export let SOUND_CAROUSEL_ORDER: SoundCarouselOrderItem[] | undefined;

export function applySoundCarouselOrder(input: unknown): void {
  if (!Array.isArray(input)) return;
  const valid = input.map((candidate) => {
    if (!candidate || typeof candidate !== "object") return null;
    const row = candidate as Partial<SoundCarouselOrderItem>;
    if (
      typeof row.key !== "string" ||
      typeof row.label !== "string" ||
      typeof row.visible !== "boolean" ||
      typeof row.sortOrder !== "number" ||
      !Number.isFinite(row.sortOrder)
    ) return null;
    return [{ key: row.key, label: row.label, visible: row.visible, sortOrder: row.sortOrder }];
  });
  if (valid.some((row) => row === null)) return;
  SOUND_CAROUSEL_ORDER = valid.flat() as SoundCarouselOrderItem[];
}