/** The old catalog category is distinct from the active Reflexiones category (charlas). */
export const RETIRED_REFLEXIONES_ID = "reflexiones";

/** Only applies to Otras temáticas theme tags, never to Sonidos or Geometrix. */
export function isRetiredOtherThemeTag(label: string): boolean {
  return /chakra/i.test(label);
}