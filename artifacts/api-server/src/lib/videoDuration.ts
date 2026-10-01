/** A failed metadata lookup must not erase the last known video duration. */
export function resolveVideoDuration(
  detectedDuration: string | null,
  savedDuration: string,
): string {
  return detectedDuration?.trim() || savedDuration.trim();
}