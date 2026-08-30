export const CONTENT_CAROUSEL_GAP = 16;
export const CONTENT_CAROUSEL_PEEK = 25;
export const CONTENT_CAROUSEL_HEIGHT_SCALE = 0.85;

/**
 * Ancho de las cards de contenido para mostrar dos completas y 25 px de la
 * tercera dentro del ancho útil de la pantalla.
 */
export function getContentCarouselCardWidth(
  viewportWidth: number,
  horizontalPadding = 19,
): number {
  return Math.max(
    120,
    Math.round(
      (viewportWidth
        - horizontalPadding * 2
        - CONTENT_CAROUSEL_GAP
        - CONTENT_CAROUSEL_PEEK) / 2,
    ),
  );
}