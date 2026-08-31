export const CONTENT_CAROUSEL_GAP = 14;
export const CONTENT_CAROUSEL_NEXT_RATIO = 0.1;
export const CONTENT_CAROUSEL_SIZE_SCALE = 1.05 * 1.04;
export const CONTENT_CAROUSEL_HEIGHT_SCALE = 0.85 * 1.15 * 0.97;

/**
 * Ancho de las cards de contenido para mostrar dos completas y el 10% de la
 * siguiente dentro del ancho útil de la pantalla.
 */
export function getContentCarouselCardWidth(
  viewportWidth: number,
  horizontalPadding = 19,
): number {
  const baseWidth = Math.round(
    (viewportWidth
      - horizontalPadding * 2
      - CONTENT_CAROUSEL_GAP * 2)
      / (2 + CONTENT_CAROUSEL_NEXT_RATIO),
  );
  return Math.max(120, Math.round(baseWidth * CONTENT_CAROUSEL_SIZE_SCALE));
}