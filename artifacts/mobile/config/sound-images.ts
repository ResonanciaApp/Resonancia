/**
 * Las imágenes por-sonido se administran exclusivamente desde Admin.
 * Este mapa permanece vacío para compatibilidad con vistas antiguas.
 */
export const SOUND_IMAGE_MAP: Record<string, ReturnType<typeof require> | undefined> = {};

export function getSoundImage(id: string): ReturnType<typeof require> | undefined {
  return SOUND_IMAGE_MAP[id];
}
