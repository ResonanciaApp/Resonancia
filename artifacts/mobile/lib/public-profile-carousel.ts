export const PROFILE_CAROUSEL_INSET = 20;
export const PROFILE_CAROUSEL_GAP = 12;
export const PROFILE_CAROUSEL_PREVIEW = 10;
export const PROFILE_CAROUSEL_RADIUS = 18;

// One left inset, two full cards, two gaps and exactly 10px of card three.
export function publicProfileCardWidth(viewportWidth: number) {
  return Math.max(1, (viewportWidth - PROFILE_CAROUSEL_INSET
    - 2 * PROFILE_CAROUSEL_GAP - PROFILE_CAROUSEL_PREVIEW) / 2);
}
