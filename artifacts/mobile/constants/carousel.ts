export const CONTENT_CAROUSEL_GAP = 16;
export const CONTENT_CAROUSEL_NEXT_RATIO = 0.9;
export const CONTENT_CAROUSEL_SIZE_SCALE = 1.1;
export const CONTENT_CAROUSEL_HEIGHT_SCALE = 0.85;

/**
 * Ancho de las cards de contenido para mostrar una completa y el 90% de la
 * siguiente dentro del ancho útil de la pantalla.
 */
export function getContentCarouselCardWidth(
  viewportWidth: number,
  horizontalPadding = 19,
): number {
  const baseWidth = Math.round(
    (viewportWidth
      - horizontalPadding * 2
      - CONTENT_CAROUSEL_GAP)
      / (1 + CONTENT_CAROUSEL_NEXT_RATIO),
  );
  return Math.max(120, Math.round(baseWidth * CONTENT_CAROUSEL_SIZE_SCALE));
}