export const REFLECTION_GALLERY_HEIGHT = 180;
export const REFLECTION_GALLERY_EXPANSION = 120;

/** Proportional scroll thumb, clamped while the native scroll view bounces. */
export function reflectionGalleryScrollIndicator(viewport: number, content: number, offset: number) {
  "worklet";
  if (viewport <= 0 || content <= viewport) {
    return { visible: false, height: 0, translateY: 0, progress: 0 };
  }
  const height = Math.min(viewport, Math.max(18, viewport * viewport / content));
  const progress = Math.min(1, Math.max(0, offset / (content - viewport)));
  return { visible: true, height, translateY: (viewport - height) * progress, progress };
}

/** Resize only the viewport; the composition and 1080×1920 export stay unchanged. */
export function reflectionPreviewLayout(baseWidth: number, heightReduction: number) {
  "worklet";
  const baseHeight = baseWidth * 16 / 9;
  const height = Math.max(1, baseHeight - heightReduction);
  return { width: height * 9 / 16, height, scale: height / baseHeight };
}

/** Keep the compact preview inside its actual flex area on small screens. */
export function fitReflectionPreviewWidth(baseWidth: number, availableHeight: number | null) {
  if (availableHeight === null) return baseWidth;
  return Math.min(baseWidth, Math.max(REFLECTION_GALLERY_EXPANSION + 1, availableHeight - 24) * 9 / 16);
}
